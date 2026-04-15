'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/providers/AuthProvider';
import { collection, query, getDocs, doc, updateDoc, deleteDoc, setDoc, Timestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase/client';
import { 
  CheckCircle, 
  XCircle, 
  Eye, 
  MapPin, 
  Phone, 
  Mail, 
  Award, 
  Clock,
  Loader2,
  User
} from 'lucide-react';
import Link from 'next/link';

interface Application {
  id: string;
  fullName: string;
  email: string;
  phone: string;
  location: string;
  experience: number;
  specialty: string;
  certifications: string;
  bio: string;
  whyJoin: string;
  photoURL?: string; // Add photo URL field
  status: 'pending' | 'approved' | 'rejected';
  submittedAt: Timestamp;
  reviewedAt?: Timestamp;
  reviewedBy?: string;
  notes?: string;
}

export default function PractitionerApplicationsPage() {
  const { isAdmin, loading: authLoading } = useAuth();
  const router = useRouter();
  const [applications, setApplications] = useState<Application[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'pending' | 'approved' | 'rejected'>('pending');
  const [selectedApp, setSelectedApp] = useState<Application | null>(null);
  const [reviewNotes, setReviewNotes] = useState('');
  const [processing, setProcessing] = useState(false);
  const [stats, setStats] = useState({ total: 0, pending: 0, approved: 0, rejected: 0 });

  // Admin protection - redirect if not admin
  useEffect(() => {
    if (!authLoading && !isAdmin) {
      router.push('/');
    }
  }, [isAdmin, authLoading, router]);

  useEffect(() => {
    if (!isAdmin) return;
    loadApplications();
  }, [isAdmin]);

  const loadApplications = async () => {
    try {
      const q = query(collection(db, 'practitioner_applications'));
      const snapshot = await getDocs(q);
      const data = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Application[];
      
      // Sort by date, newest first
      data.sort((a, b) => b.submittedAt.seconds - a.submittedAt.seconds);
      
      setApplications(data);
      
      // Calculate stats
      setStats({
        total: data.length,
        pending: data.filter(a => a.status === 'pending').length,
        approved: data.filter(a => a.status === 'approved').length,
        rejected: data.filter(a => a.status === 'rejected').length
      });
    } catch (error: any) {
      console.error('Error loading applications:', error);
      alert('Error loading applications: ' + (error.message || 'Unknown error'));
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async () => {
    if (!selectedApp) return;
    setProcessing(true);
    
    try {
      // Update application status
      await updateDoc(doc(db, 'practitioner_applications', selectedApp.id), {
        status: 'approved',
        reviewedAt: new Date(),
        notes: reviewNotes
      });
      
      // Create practitioner profile using setDoc (creates if doesn't exist)
      await setDoc(doc(db, 'practitioners', selectedApp.id), {
        name: selectedApp.fullName,
        email: selectedApp.email,
        phone: selectedApp.phone,
        location: selectedApp.location,
        experience: selectedApp.experience,
        specialty: selectedApp.specialty,
        bio: selectedApp.bio,
        photoURL: selectedApp.photoURL || '', // Include photo URL
        certifications: selectedApp.certifications.split(',').map(c => c.trim()),
        isVerified: true,
        isActive: true,
        rating: 0,
        reviews: 0,
        consultationFee: 25,
        createdAt: new Date(),
        applicationId: selectedApp.id
      });
      
      alert(`Approved ${selectedApp.fullName}! Practitioner profile created.`);
      setSelectedApp(null);
      loadApplications();
    } catch (error: any) {
      console.error('Error approving:', error);
      alert('Error approving application: ' + (error.message || 'Unknown error'));
    } finally {
      setProcessing(false);
    }
  };

  const handleReject = async () => {
    if (!selectedApp) return;
    if (!reviewNotes.trim()) {
      alert('Please provide a reason for rejection');
      return;
    }
    
    setProcessing(true);
    try {
      await updateDoc(doc(db, 'practitioner_applications', selectedApp.id), {
        status: 'rejected',
        reviewedAt: new Date(),
        notes: reviewNotes
      });
      
      alert(`Rejected ${selectedApp.fullName}`);
      setSelectedApp(null);
      loadApplications();
    } catch (error: any) {
      console.error('Error rejecting:', error);
      alert('Error rejecting application: ' + (error.message || 'Unknown error'));
    } finally {
      setProcessing(false);
    }
  };

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Delete application from ${name}? This cannot be undone.`)) return;
    
    try {
      await deleteDoc(doc(db, 'practitioner_applications', id));
      loadApplications();
    } catch (error: any) {
      console.error('Error deleting:', error);
      alert('Error deleting application: ' + (error.message || 'Unknown error'));
    }
  };

  const filteredApps = filter === 'all' 
    ? applications 
    : applications.filter(a => a.status === filter);

  const formatDate = (timestamp: Timestamp) => {
    return new Date(timestamp.seconds * 1000).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const getStatCount = (status: 'all' | 'pending' | 'approved' | 'rejected') => {
    if (status === 'all') return stats.total;
    return stats[status];
  };

  // Show loading while checking auth
  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="w-12 h-12 text-[#97A97C] animate-spin" />
          <p className="text-[#97A97C] text-lg">Loading applications...</p>
        </div>
      </div>
    );
  }

  // Return null if not admin (prevents flash of content before redirect)
  if (!isAdmin) return null;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-[#2C3E2D] text-white p-6">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold">Practitioner Applications</h1>
            <p className="text-gray-300 text-sm">Review and verify healer applications</p>
          </div>
          <Link href="/admin" className="text-sm hover:underline">← Back to Admin</Link>
        </div>
      </div>

      <div className="max-w-7xl mx-auto p-6">
        {/* Stats Cards */}
        <div className="grid grid-cols-4 gap-4 mb-8">
          <div className="bg-white p-4 rounded-lg shadow border-l-4 border-blue-500">
            <p className="text-gray-600 text-sm">Total Applications</p>
            <p className="text-2xl font-bold text-[#2C3E2D]">{stats.total}</p>
          </div>
          <div className="bg-white p-4 rounded-lg shadow border-l-4 border-yellow-500">
            <p className="text-gray-600 text-sm">Pending Review</p>
            <p className="text-2xl font-bold text-yellow-600">{stats.pending}</p>
          </div>
          <div className="bg-white p-4 rounded-lg shadow border-l-4 border-green-500">
            <p className="text-gray-600 text-sm">Approved</p>
            <p className="text-2xl font-bold text-green-600">{stats.approved}</p>
          </div>
          <div className="bg-white p-4 rounded-lg shadow border-l-4 border-red-500">
            <p className="text-gray-600 text-sm">Rejected</p>
            <p className="text-2xl font-bold text-red-600">{stats.rejected}</p>
          </div>
        </div>

        {/* Filters */}
        <div className="flex gap-2 mb-6">
          {(['all', 'pending', 'approved', 'rejected'] as const).map((status) => (
            <button
              key={status}
              onClick={() => setFilter(status)}
              className={`px-4 py-2 rounded-full capitalize ${
                filter === status
                  ? 'bg-[#97A97C] text-white'
                  : 'bg-white text-gray-700 hover:bg-gray-100'
              }`}
            >
              {status} ({getStatCount(status)})
            </button>
          ))}
        </div>

        {/* Applications Table */}
        {filteredApps.length === 0 ? (
          <div className="bg-white rounded-lg shadow p-12 text-center">
            <p className="text-gray-600">No {filter} applications found.</p>
          </div>
        ) : (
          <div className="bg-white rounded-lg shadow overflow-hidden">
            <table className="w-full">
              <thead className="bg-gray-50 border-b">
                <tr>
                  <th className="text-left p-4 font-semibold text-[#2C3E2D]">Applicant</th>
                  <th className="text-left p-4 font-semibold text-[#2C3E2D]">Specialty</th>
                  <th className="text-left p-4 font-semibold text-[#2C3E2D]">Experience</th>
                  <th className="text-left p-4 font-semibold text-[#2C3E2D]">Date</th>
                  <th className="text-left p-4 font-semibold text-[#2C3E2D]">Status</th>
                  <th className="text-left p-4 font-semibold text-[#2C3E2D]">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredApps.map((app) => (
                  <tr key={app.id} className="border-b hover:bg-gray-50">
                    <td className="p-4">
                      <div className="flex items-center gap-3">
                        {/* Profile Photo */}
                        {app.photoURL ? (
                          <img 
                            src={app.photoURL} 
                            alt={app.fullName}
                            className="w-10 h-10 rounded-full object-cover border-2 border-[#97A97C]"
                          />
                        ) : (
                          <div className="w-10 h-10 rounded-full bg-[#97A97C]/10 flex items-center justify-center border-2 border-[#97A97C]">
                            <User className="w-5 h-5 text-[#97A97C]" />
                          </div>
                        )}
                        <div>
                          <p className="font-semibold text-[#2C3E2D]">{app.fullName}</p>
                          <p className="text-sm text-gray-500 flex items-center gap-1">
                            <MapPin className="w-3 h-3" /> {app.location}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="p-4">
                      <span className="capitalize bg-[#F5F5F0] px-2 py-1 rounded text-sm">
                        {app.specialty.replace('-', ' ')}
                      </span>
                    </td>
                    <td className="p-4">{app.experience} years</td>
                    <td className="p-4 text-sm text-gray-600">
                      {formatDate(app.submittedAt)}
                    </td>
                    <td className="p-4">
                      <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                        app.status === 'approved' ? 'bg-green-100 text-green-800' :
                        app.status === 'rejected' ? 'bg-red-100 text-red-800' :
                        'bg-yellow-100 text-yellow-800'
                      }`}>
                        {app.status}
                      </span>
                    </td>
                    <td className="p-4">
                      <div className="flex gap-2">
                        <button
                          onClick={() => {
                            setSelectedApp(app);
                            setReviewNotes(app.notes || '');
                          }}
                          className="p-2 bg-blue-100 text-blue-600 rounded hover:bg-blue-200"
                          title="Review"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        {app.status === 'pending' && (
                          <>
                            <button
                              onClick={() => {
                                setSelectedApp(app);
                                setReviewNotes('');
                              }}
                              className="p-2 bg-green-100 text-green-600 rounded hover:bg-green-200"
                              title="Approve"
                            >
                              <CheckCircle className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => {
                                setSelectedApp(app);
                                setReviewNotes('');
                              }}
                              className="p-2 bg-red-100 text-red-600 rounded hover:bg-red-200"
                              title="Reject"
                            >
                              <XCircle className="w-4 h-4" />
                            </button>
                          </>
                        )}
                        <button
                          onClick={() => handleDelete(app.id, app.fullName)}
                          className="p-2 bg-gray-100 text-gray-600 rounded hover:bg-gray-200"
                          title="Delete"
                        >
                          🗑️
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Review Modal */}
      {selectedApp && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b sticky top-0 bg-white">
              <div className="flex justify-between items-start">
                <div className="flex items-center gap-4">
                  {/* Large Profile Photo in Modal */}
                  {selectedApp.photoURL ? (
                    <img 
                      src={selectedApp.photoURL} 
                      alt={selectedApp.fullName}
                      className="w-16 h-16 rounded-full object-cover border-4 border-[#97A97C]"
                    />
                  ) : (
                    <div className="w-16 h-16 rounded-full bg-[#97A97C]/10 flex items-center justify-center border-4 border-[#97A97C]">
                      <User className="w-8 h-8 text-[#97A97C]" />
                    </div>
                  )}
                  <div>
                    <h2 className="text-2xl font-bold text-[#2C3E2D]">{selectedApp.fullName}</h2>
                    <p className="text-[#97A97C]">{selectedApp.specialty.replace('-', ' ')}</p>
                  </div>
                </div>
                <button
                  onClick={() => setSelectedApp(null)}
                  className="text-gray-500 hover:text-gray-700 text-2xl"
                >
                  ✕
                </button>
              </div>
            </div>

            <div className="p-6 space-y-6">
              {/* Contact Info */}
              <div className="grid grid-cols-2 gap-4 bg-gray-50 p-4 rounded-lg">
                <div className="flex items-center gap-2">
                  <Mail className="w-4 h-4 text-gray-500" />
                  <span className="text-sm">{selectedApp.email}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Phone className="w-4 h-4 text-gray-500" />
                  <span className="text-sm">{selectedApp.phone}</span>
                </div>
                <div className="flex items-center gap-2">
                  <MapPin className="w-4 h-4 text-gray-500" />
                  <span className="text-sm">{selectedApp.location}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4 text-gray-500" />
                  <span className="text-sm">{selectedApp.experience} years experience</span>
                </div>
              </div>

              {/* Bio */}
              <div>
                <h3 className="font-semibold text-[#2C3E2D] mb-2 flex items-center gap-2">
                  <Award className="w-4 h-4" /> Professional Bio
                </h3>
                <p className="text-gray-700 bg-gray-50 p-4 rounded">{selectedApp.bio}</p>
              </div>

              {/* Certifications */}
              <div>
                <h3 className="font-semibold text-[#2C3E2D] mb-2">Certifications</h3>
                <p className="text-gray-700 bg-gray-50 p-4 rounded">{selectedApp.certifications}</p>
              </div>

              {/* Why Join */}
              <div>
                <h3 className="font-semibold text-[#2C3E2D] mb-2">Why they want to join</h3>
                <p className="text-gray-700 bg-gray-50 p-4 rounded">{selectedApp.whyJoin}</p>
              </div>

              {/* Review Notes */}
              <div>
                <h3 className="font-semibold text-[#2C3E2D] mb-2">Review Notes</h3>
                <textarea
                  value={reviewNotes}
                  onChange={(e) => setReviewNotes(e.target.value)}
                  placeholder="Add notes about this application (required for rejection)..."
                  className="w-full p-3 border rounded-lg"
                  rows={3}
                />
              </div>

              {/* Actions */}
              {selectedApp.status === 'pending' && (
                <div className="flex gap-4 pt-4 border-t">
                  <button
                    onClick={handleReject}
                    disabled={processing}
                    className="flex-1 bg-red-600 text-white py-3 rounded-lg font-bold hover:bg-red-700 disabled:opacity-50"
                  >
                    {processing ? 'Processing...' : 'Reject Application'}
                  </button>
                  <button
                    onClick={handleApprove}
                    disabled={processing}
                    className="flex-1 bg-[#97A97C] text-white py-3 rounded-lg font-bold hover:bg-[#7A8A63] disabled:opacity-50"
                  >
                    {processing ? 'Processing...' : 'Approve & Create Profile'}
                  </button>
                </div>
              )}

              {selectedApp.status !== 'pending' && (
                <div className="bg-gray-100 p-4 rounded-lg text-center">
                  <p className="text-gray-600">
                    Application {selectedApp.status} on {selectedApp.reviewedAt ? formatDate(selectedApp.reviewedAt) : 'N/A'}
                  </p>
                  {selectedApp.notes && (
                    <p className="text-sm text-gray-500 mt-2">Notes: {selectedApp.notes}</p>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}