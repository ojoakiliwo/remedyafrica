'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { useAuth } from '@/hooks/useAuth';
import { doc, getDoc, collection, getDocs, query, orderBy, Timestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase/client';
import {
  ArrowLeft,
  Video,
  Calendar,
  Clock,
  User,
  Stethoscope,
  Loader2,
  AlertCircle,
  CheckCircle2,
  XCircle,
  Clock3,
  ExternalLink,
  Search,
} from 'lucide-react';

interface Consultation {
  id: string;
  patientId: string;
  patientName?: string;
  patientEmail?: string;
  practitionerId: string;
  practitionerName?: string;
  status: 'pending' | 'confirmed' | 'completed' | 'cancelled';
  scheduledAt?: Timestamp;
  createdAt: Timestamp;
  notes?: string;
  roomUrl?: string;
  topic?: string;
}

export default function AdminConsultationsPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [isAdmin, setIsAdmin] = useState(false);
  const [checking, setChecking] = useState(true);
  const [consultations, setConsultations] = useState<Consultation[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');

  // Check admin
  useEffect(() => {
    const checkAdmin = async () => {
      if (!user) {
        router.push('/login');
        return;
      }
      try {
        const userDoc = await getDoc(doc(db, 'users', user.uid));
        if (userDoc.exists() && userDoc.data().role === 'admin') {
          setIsAdmin(true);
        } else {
          router.push('/');
        }
      } catch (err) {
        console.error('Admin check error:', err);
        router.push('/');
      }
      setChecking(false);
    };
    checkAdmin();
  }, [user, router]);

  // Load consultations
  useEffect(() => {
    if (!isAdmin) return;
    const loadConsultations = async () => {
      try {
        const q = query(collection(db, 'consultations'), orderBy('createdAt', 'desc'));
        const snap = await getDocs(q);
        const data = snap.docs.map(d => ({ id: d.id, ...d.data() } as Consultation));
        setConsultations(data);
      } catch (err) {
        console.error('Error loading consultations:', err);
      } finally {
        setLoading(false);
      }
    };
    loadConsultations();
  }, [isAdmin]);

  const filtered = consultations.filter(c => {
    const matchesFilter = filter === 'all' || c.status === filter;
    const matchesSearch =
      !searchTerm ||
      c.patientName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.practitionerName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.topic?.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  const statusCounts = {
    all: consultations.length,
    pending: consultations.filter(c => c.status === 'pending').length,
    confirmed: consultations.filter(c => c.status === 'confirmed').length,
    completed: consultations.filter(c => c.status === 'completed').length,
    cancelled: consultations.filter(c => c.status === 'cancelled').length,
  };

  const statusConfig = {
    pending: { label: 'Pending', color: 'text-amber-700', bg: 'bg-amber-50', border: 'border-amber-200', icon: Clock3 },
    confirmed: { label: 'Confirmed', color: 'text-emerald-700', bg: 'bg-emerald-50', border: 'border-emerald-200', icon: CheckCircle2 },
    completed: { label: 'Completed', color: 'text-blue-700', bg: 'bg-blue-50', border: 'border-blue-200', icon: CheckCircle2 },
    cancelled: { label: 'Cancelled', color: 'text-red-700', bg: 'bg-red-50', border: 'border-red-200', icon: XCircle },
  };

  if (checking) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-emerald-600" />
      </div>
    );
  }

  if (!isAdmin) return null;

  return (
    <div className="min-h-screen bg-stone-50">
      {/* Header */}
      <div className="bg-white border-b border-stone-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center gap-4">
            <Link href="/admin" className="p-2 rounded-lg hover:bg-stone-100 transition-colors">
              <ArrowLeft className="w-5 h-5 text-stone-600" />
            </Link>
            <div>
              <h1 className="text-xl font-bold text-stone-800">Consultations</h1>
              <p className="text-sm text-stone-500">Manage all patient-practitioner consultations</p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-4 mb-8">
          {(['all', 'pending', 'confirmed', 'completed', 'cancelled'] as const).map(status => (
            <button
              key={status}
              onClick={() => setFilter(status)}
              className={`p-4 rounded-xl border text-left transition-all ${
                filter === status
                  ? 'bg-white border-emerald-300 shadow-sm ring-2 ring-emerald-100'
                  : 'bg-white border-stone-100 hover:border-stone-200'
              }`}
            >
              <p className="text-2xl font-bold text-stone-800">{statusCounts[status]}</p>
              <p className={`text-sm font-medium capitalize ${
                status === 'all' ? 'text-stone-500' : statusConfig[status]?.color
              }`}>
                {status === 'all' ? 'All' : statusConfig[status]?.label}
              </p>
            </button>
          ))}
        </div>

        {/* Search */}
        <div className="flex flex-col sm:flex-row gap-4 mb-6">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400" />
            <input
              type="text"
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              placeholder="Search by patient, practitioner, or topic..."
              className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-stone-200 bg-white text-sm focus:outline-none focus:border-emerald-400 focus:ring-2 focus:ring-emerald-100"
            />
          </div>
        </div>

        {/* Table */}
        {loading ? (
          <div className="text-center py-20">
            <Loader2 className="w-8 h-8 animate-spin text-emerald-600 mx-auto" />
            <p className="text-stone-500 mt-2">Loading consultations...</p>
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-20 bg-white rounded-2xl border border-stone-100">
            <Video className="w-12 h-12 text-stone-300 mx-auto mb-3" />
            <h3 className="text-lg font-bold text-stone-700">No consultations found</h3>
            <p className="text-stone-500 text-sm mt-1">
              {filter !== 'all' ? `No ${filter} consultations.` : 'No consultations in the system yet.'}
            </p>
          </div>
        ) : (
          <div className="bg-white rounded-2xl border border-stone-100 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-stone-50 border-b border-stone-100">
                  <tr>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-stone-500 uppercase">Patient</th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-stone-500 uppercase">Practitioner</th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-stone-500 uppercase">Topic</th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-stone-500 uppercase">Status</th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-stone-500 uppercase">Scheduled</th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-stone-500 uppercase">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-100">
                  {filtered.map(c => {
                    const cfg = statusConfig[c.status] || statusConfig.pending;
                    const StatusIcon = cfg.icon;
                    return (
                      <tr key={c.id} className="hover:bg-stone-50 transition-colors">
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-700 text-xs font-bold">
                              {c.patientName?.charAt(0) || 'U'}
                            </div>
                            <div>
                              <p className="text-sm font-medium text-stone-800">{c.patientName || 'Unknown'}</p>
                              <p className="text-xs text-stone-400">{c.patientEmail || c.patientId}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-2">
                            <Stethoscope className="w-4 h-4 text-teal-600" />
                            <span className="text-sm text-stone-700">{c.practitionerName || 'Unknown'}</span>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <span className="text-sm text-stone-600">{c.topic || 'General consultation'}</span>
                        </td>
                        <td className="px-6 py-4">
                          <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${cfg.bg} ${cfg.color} border ${cfg.border}`}>
                            <StatusIcon className="w-3.5 h-3.5" />
                            {cfg.label}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          {c.scheduledAt ? (
                            <div className="text-sm text-stone-600">
                              <div className="flex items-center gap-1">
                                <Calendar className="w-3.5 h-3.5 text-stone-400" />
                                {c.scheduledAt.toDate?.().toLocaleDateString() || 'Scheduled'}
                              </div>
                              <div className="flex items-center gap-1 text-xs text-stone-400 mt-0.5">
                                <Clock className="w-3 h-3" />
                                {c.scheduledAt.toDate?.().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) || ''}
                              </div>
                            </div>
                          ) : (
                            <span className="text-xs text-stone-400">Not scheduled</span>
                          )}
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-2">
                            {c.roomUrl && (
                              <a
                                href={c.roomUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="p-1.5 rounded-lg bg-emerald-50 text-emerald-700 hover:bg-emerald-100 transition-colors"
                                title="Join room"
                              >
                                <ExternalLink className="w-4 h-4" />
                              </a>
                            )}
                            <Link
                              href={`/consultation/${c.id}`}
                              className="p-1.5 rounded-lg bg-stone-50 text-stone-600 hover:bg-stone-100 transition-colors"
                              title="View details"
                            >
                              <ExternalLink className="w-4 h-4" />
                            </Link>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}