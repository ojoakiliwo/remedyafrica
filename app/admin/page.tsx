'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { db } from '@/lib/firebase/client';
import { collection, getDocs, query, limit, doc, getDoc } from 'firebase/firestore';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { 
  Users, 
  Leaf, 
  Calendar, 
  TrendingUp, 
  Shield,
  ArrowRight,
  Loader2
} from 'lucide-react';
import { toast } from 'sonner';

export default function AdminDashboard() {
  const router = useRouter();
  const { user } = useAuth();
  const [isAdmin, setIsAdmin] = useState(false);
  
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalPractitioners: 0,
    pendingApplications: 0,
    totalConsultations: 0,
    totalHerbs: 0
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkAdmin = async () => {
      if (!user) {
        router.push('/login');
        return;
      }
      
      try {
        const userDoc = await getDoc(doc(db, 'users', user.uid));
        if (userDoc.exists()) {
          const userData = userDoc.data();
          const adminStatus = userData.role === 'admin' || userData.isAdmin === true;
          setIsAdmin(adminStatus);
          
          if (!adminStatus) {
            toast.error('Access denied');
            router.push('/');
            return;
          }
        } else {
          router.push('/');
          return;
        }
      } catch (err) {
        console.error('Error checking admin:', err);
        router.push('/');
        return;
      }
      
      fetchStats();
    };

    checkAdmin();
  }, [user, router]);

  const fetchStats = async () => {
    try {
      // Fetch counts from Firestore
      const usersSnap = await getDocs(query(collection(db, 'users'), limit(1000)));
      const practitionersSnap = await getDocs(query(collection(db, 'practitioners'), limit(1000)));
      const applicationsSnap = await getDocs(query(collection(db, 'practitioner_applications'), limit(100)));
      const consultationsSnap = await getDocs(query(collection(db, 'consultations'), limit(1000)));
      const herbsSnap = await getDocs(query(collection(db, 'herbs'), limit(1000)));

      setStats({
        totalUsers: usersSnap.size,
        totalPractitioners: practitionersSnap.size,
        pendingApplications: applicationsSnap.size,
        totalConsultations: consultationsSnap.size,
        totalHerbs: herbsSnap.size
      });
    } catch (error) {
      console.error('Error fetching stats:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#faf9f7] flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-[#5c7c6b]" />
      </div>
    );
  }

  if (!isAdmin) {
    return null;
  }

  const adminCards = [
    {
      title: 'Herbs Database',
      count: stats.totalHerbs,
      icon: Leaf,
      href: '/admin/herbs',
      color: 'text-green-600',
      bgColor: 'bg-green-100'
    },
    {
      title: 'Practitioners',
      count: stats.totalPractitioners,
      icon: Users,
      href: '/admin/practitioners',
      color: 'text-blue-600',
      bgColor: 'bg-blue-100'
    },
    {
      title: 'Applications',
      count: stats.pendingApplications,
      icon: Shield,
      href: '/admin/applications',
      color: 'text-amber-600',
      bgColor: 'bg-amber-100'
    },
    {
      title: 'Consultations',
      count: stats.totalConsultations,
      icon: Calendar,
      href: '/admin/consultations',
      color: 'text-purple-600',
      bgColor: 'bg-purple-100'
    }
  ];

  return (
    <div className="min-h-screen bg-[#faf9f7]">
      {/* Header */}
      <div className="bg-white border-b border-[#e8e4df]">
        <div className="max-w-6xl mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-[#2c3e33]">Admin Dashboard</h1>
              <p className="text-sm text-[#5a5a5a]">Manage your platform</p>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-sm text-[#5a5a5a]">Total Users: {stats.totalUsers}</span>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 py-8">
        {/* Stats Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {adminCards.map((card) => (
            <Link key={card.title} href={card.href}>
              <Card className="border-[#e8e4df] hover:shadow-md transition-all cursor-pointer h-full">
                <CardContent className="p-6">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="text-sm text-[#5a5a5a] mb-1">{card.title}</p>
                      <p className="text-3xl font-bold text-[#2c3e33]">{card.count}</p>
                    </div>
                    <div className={`w-12 h-12 ${card.bgColor} rounded-lg flex items-center justify-center`}>
                      <card.icon className={`h-6 w-6 ${card.color}`} />
                    </div>
                  </div>
                  <div className="mt-4 flex items-center text-sm text-[#5c7c6b]">
                    <span>Manage</span>
                    <ArrowRight className="h-4 w-4 ml-1" />
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>

        {/* Quick Actions */}
        <div className="grid md:grid-cols-2 gap-6">
          <Card className="border-[#e8e4df]">
            <CardHeader>
              <CardTitle className="text-lg">Quick Actions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <Link href="/admin/herbs/bulk">
                <Button variant="outline" className="w-full justify-start">
                  <Leaf className="h-4 w-4 mr-2" />
                  Bulk Upload Herbs
                </Button>
              </Link>
              <Link href="/admin/practitioners">
                <Button variant="outline" className="w-full justify-start">
                  <Users className="h-4 w-4 mr-2" />
                  Review Practitioners
                </Button>
              </Link>
              <Link href="/admin/settings">
                <Button variant="outline" className="w-full justify-start">
                  <Shield className="h-4 w-4 mr-2" />
                  Platform Settings
                </Button>
              </Link>
            </CardContent>
          </Card>

          <Card className="border-[#e8e4df]">
            <CardHeader>
              <CardTitle className="text-lg">Platform Health</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-[#5a5a5a]">Active Practitioners</span>
                  <span className="font-semibold text-[#2c3e33]">{stats.totalPractitioners}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-[#5a5a5a]">Pending Applications</span>
                  <span className="font-semibold text-amber-600">{stats.pendingApplications}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-[#5a5a5a]">Total Consultations</span>
                  <span className="font-semibold text-[#2c3e33]">{stats.totalConsultations}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-[#5a5a5a]">Herbs in Database</span>
                  <span className="font-semibold text-green-600">{stats.totalHerbs}</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}