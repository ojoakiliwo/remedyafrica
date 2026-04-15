'use client';

import { useAuth } from '@/providers/AuthProvider';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { 
  Leaf, 
  Users, 
  Shield, 
  Upload,
  FileText,
  Settings
} from 'lucide-react';
import { db } from '@/lib/firebase/client';
import { collection, onSnapshot, query, where } from 'firebase/firestore';

export default function AdminDashboard() {
  const { isAdmin, loading: authLoading } = useAuth();
  const router = useRouter();
  const [stats, setStats] = useState({
    herbs: 0,
    practitioners: 0,
    pendingApps: 0,
    users: 0
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!authLoading && !isAdmin) {
      router.push('/');
    }
  }, [isAdmin, authLoading, router]);

  useEffect(() => {
    if (!isAdmin) return;

    // Real-time stats
    const unsubHerbs = onSnapshot(collection(db, 'herbs'), (snap) => {
      setStats(prev => ({ ...prev, herbs: snap.size }));
    });

    const unsubPractitioners = onSnapshot(collection(db, 'practitioners'), (snap) => {
      setStats(prev => ({ ...prev, practitioners: snap.size }));
    });

    const unsubApps = onSnapshot(
      query(collection(db, 'practitioner_applications'), where('status', '==', 'pending')),
      (snap) => {
        setStats(prev => ({ ...prev, pendingApps: snap.size }));
      }
    );

    const unsubUsers = onSnapshot(collection(db, 'users'), (snap) => {
      setStats(prev => ({ ...prev, users: snap.size }));
    });

    setLoading(false);

    return () => {
      unsubHerbs();
      unsubPractitioners();
      unsubApps();
      unsubUsers();
    };
  }, [isAdmin]);

  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-[#F5F5F0] flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#97A97C]"></div>
      </div>
    );
  }

  if (!isAdmin) return null;

  const adminCards = [
    {
      title: 'Upload Herb',
      description: 'Add new herbal remedies to the database with images and descriptions',
      icon: Upload,
      href: '/admin/herbs/upload',
      color: 'bg-green-100 text-green-600',
    },
    {
      title: 'Manage Herbs',
      description: 'Edit, update, or remove existing herbs from the database',
      icon: Leaf,
      href: '/admin/herbs/list',
      color: 'bg-emerald-100 text-emerald-600',
    },
    {
      title: 'Bulk Upload',
      description: 'Import multiple herbs via CSV file',
      icon: Upload,
      href: '/admin/herbs/bulk',
      color: 'bg-amber-100 text-amber-600',
    },
    {
      title: 'Applications',
      description: 'Review and approve practitioner applications',
      icon: FileText,
      href: '/admin/applications',
      color: 'bg-blue-100 text-blue-600',
      badge: stats.pendingApps > 0 ? stats.pendingApps.toString() : undefined,
    },
    {
      title: 'Manage Practitioners',
      description: 'View, verify, or suspend practitioner accounts',
      icon: Users,
      href: '/admin/practitioners',
      color: 'bg-purple-100 text-purple-600',
    },
    {
      title: 'Platform Settings',
      description: 'Configure platform settings and permissions',
      icon: Settings,
      href: '/admin/settings',
      color: 'bg-gray-100 text-gray-600',
    },
  ];

  return (
    <div className="min-h-screen bg-[#F5F5F0] py-12 px-4">
      <div className="max-w-6xl mx-auto">
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <Shield className="w-8 h-8 text-[#97A97C]" />
            <h1 className="text-3xl font-bold text-[#2C3E2D]">Admin Dashboard</h1>
          </div>
          <p className="text-gray-600">
            Manage herbs, practitioners, and platform content
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-white p-6 rounded-xl shadow-sm">
            <p className="text-sm text-gray-500 mb-1">Total Herbs</p>
            <p className="text-2xl font-bold text-[#2C3E2D]">{stats.herbs}</p>
          </div>
          <div className="bg-white p-6 rounded-xl shadow-sm">
            <p className="text-sm text-gray-500 mb-1">Practitioners</p>
            <p className="text-2xl font-bold text-[#2C3E2D]">{stats.practitioners}</p>
          </div>
          <div className="bg-white p-6 rounded-xl shadow-sm">
            <p className="text-sm text-gray-500 mb-1">Pending Applications</p>
            <p className="text-2xl font-bold text-orange-600">{stats.pendingApps}</p>
          </div>
          <div className="bg-white p-6 rounded-xl shadow-sm">
            <p className="text-sm text-gray-500 mb-1">Total Users</p>
            <p className="text-2xl font-bold text-[#2C3E2D]">{stats.users}</p>
          </div>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {adminCards.map((card) => (
            <Link 
              key={card.href} 
              href={card.href}
              className="group bg-white p-6 rounded-xl shadow-md hover:shadow-xl transition-all hover:-translate-y-1"
            >
              <div className="flex items-start justify-between mb-4">
                <div className={`w-12 h-12 rounded-full flex items-center justify-center ${card.color}`}>
                  <card.icon className="w-6 h-6" />
                </div>
                {card.badge && (
                  <span className="bg-red-100 text-red-600 text-xs font-bold px-2 py-1 rounded-full">
                    {card.badge}
                  </span>
                )}
              </div>
              <h3 className="font-bold text-lg mb-2 text-[#2C3E2D] group-hover:text-[#97A97C] transition-colors">
                {card.title}
              </h3>
              <p className="text-gray-600 text-sm">
                {card.description}
              </p>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}