'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { db } from '@/lib/firebase/client';
import { collection, query, getDocs, doc, getDoc, updateDoc, orderBy, limit } from 'firebase/firestore';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  ArrowLeft, 
  Search, 
  CheckCircle, 
  XCircle, 
  Loader2, 
  User, 
  Star,
  MoreHorizontal
} from 'lucide-react';
import Link from 'next/link';
import { toast } from 'sonner';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface Practitioner {
  id: string;
  fullName: string;
  email: string;
  specialty: string;
  bio: string;
  verified: boolean;
  available: boolean;
  consultationFee?: number;
  rating?: number;
  reviewCount?: number;
  joinedAt?: Date;
  documents?: {
    certificate?: string;
    license?: string;
    idDoc?: string;
  };
}

export default function AdminPractitionersPage() {
  const router = useRouter();
  const { user } = useAuth();
  const [isAdmin, setIsAdmin] = useState(false);
  
  const [loading, setLoading] = useState(true);
  const [practitioners, setPractitioners] = useState<Practitioner[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState('all');

  // Check admin status
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
      
      fetchPractitioners();
    };

    checkAdmin();
  }, [user, router]);

  const fetchPractitioners = async () => {
    try {
      const q = query(
        collection(db, 'practitioners'),
        orderBy('joinedAt', 'desc'),
        limit(100)
      );
      
      const snapshot = await getDocs(q);
      const data: Practitioner[] = [];
      
      for (const docSnap of snapshot.docs) {
        const raw = docSnap.data();
        data.push({
          id: docSnap.id,
          fullName: raw.displayName || raw.fullName || 'Unknown',
          email: raw.email || '',
          specialty: raw.specialty || 'General',
          bio: raw.bio || '',
          verified: raw.verified === true,
          available: raw.available !== false,
          consultationFee: raw.consultationFee,
          rating: raw.rating || 0,
          reviewCount: raw.reviewCount || 0,
          joinedAt: raw.joinedAt?.toDate(),
          documents: raw.documents || {}
        });
      }
      
      setPractitioners(data);
    } catch (error) {
      console.error('Error fetching practitioners:', error);
      toast.error('Failed to load practitioners');
    } finally {
      setLoading(false);
    }
  };

  const handleVerify = async (practitionerId: string, verified: boolean) => {
    try {
      await updateDoc(doc(db, 'practitioners', practitionerId), {
        verified,
        verifiedAt: verified ? new Date() : null,
        verifiedBy: verified ? user?.uid : null
      });
      
      toast.success(`Practitioner ${verified ? 'verified' : 'unverified'} successfully`);
      fetchPractitioners();
    } catch (error) {
      console.error('Error updating practitioner:', error);
      toast.error('Failed to update practitioner');
    }
  };

  const handleToggleAvailability = async (practitionerId: string, available: boolean) => {
    try {
      await updateDoc(doc(db, 'practitioners', practitionerId), {
        available
      });
      
      toast.success(`Practitioner ${available ? 'enabled' : 'disabled'}`);
      fetchPractitioners();
    } catch (error) {
      toast.error('Failed to update availability');
    }
  };

  const filteredPractitioners = practitioners.filter(p => {
    const matchesSearch = 
      p.fullName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.specialty.toLowerCase().includes(searchQuery.toLowerCase());
    
    if (activeTab === 'all') return matchesSearch;
    if (activeTab === 'verified') return matchesSearch && p.verified;
    if (activeTab === 'pending') return matchesSearch && !p.verified;
    if (activeTab === 'available') return matchesSearch && p.available;
    
    return matchesSearch;
  });

  const stats = {
    total: practitioners.length,
    verified: practitioners.filter(p => p.verified).length,
    pending: practitioners.filter(p => !p.verified).length,
    available: practitioners.filter(p => p.available).length
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

  return (
    <div className="min-h-screen bg-[#faf9f7]">
      {/* Header */}
      <div className="bg-white border-b border-[#e8e4df]">
        <div className="max-w-6xl mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link href="/admin">
                <Button variant="ghost" size="icon">
                  <ArrowLeft className="h-5 w-5" />
                </Button>
              </Link>
              <div>
                <h1 className="text-2xl font-bold text-[#2c3e33]">Manage Practitioners</h1>
                <p className="text-sm text-[#5a5a5a]">
                  {stats.total} total • {stats.verified} verified • {stats.pending} pending
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 py-8">
        {/* Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <Card className="border-[#e8e4df]">
            <CardContent className="pt-6">
              <div className="text-2xl font-bold text-[#2c3e33]">{stats.total}</div>
              <p className="text-sm text-[#5a5a5a]">Total Practitioners</p>
            </CardContent>
          </Card>
          <Card className="border-[#e8e4df]">
            <CardContent className="pt-6">
              <div className="text-2xl font-bold text-green-600">{stats.verified}</div>
              <p className="text-sm text-[#5a5a5a]">Verified</p>
            </CardContent>
          </Card>
          <Card className="border-[#e8e4df]">
            <CardContent className="pt-6">
              <div className="text-2xl font-bold text-amber-600">{stats.pending}</div>
              <p className="text-sm text-[#5a5a5a]">Pending</p>
            </CardContent>
          </Card>
          <Card className="border-[#e8e4df]">
            <CardContent className="pt-6">
              <div className="text-2xl font-bold text-blue-600">{stats.available}</div>
              <p className="text-sm text-[#5a5a5a]">Available Now</p>
            </CardContent>
          </Card>
        </div>

        {/* Search */}
        <div className="mb-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#999]" />
            <Input
              placeholder="Search practitioners..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="bg-white border border-[#e8e4df]">
            <TabsTrigger value="all">All ({stats.total})</TabsTrigger>
            <TabsTrigger value="verified">Verified ({stats.verified})</TabsTrigger>
            <TabsTrigger value="pending">Pending ({stats.pending})</TabsTrigger>
            <TabsTrigger value="available">Available ({stats.available})</TabsTrigger>
          </TabsList>

          <TabsContent value={activeTab} className="space-y-4">
            {filteredPractitioners.length === 0 ? (
              <div className="text-center py-12 bg-white rounded-lg border border-[#e8e4df]">
                <User className="h-12 w-12 text-[#d4cfc7] mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-[#2c3e33]">No practitioners found</h3>
                <p className="text-sm text-[#5a5a5a]">Try adjusting your search or filters</p>
              </div>
            ) : (
              filteredPractitioners.map((practitioner) => (
                <Card key={practitioner.id} className="border-[#e8e4df]">
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2 flex-wrap">
                          <h3 className="text-lg font-semibold text-[#2c3e33]">
                            {practitioner.fullName}
                          </h3>
                          {practitioner.verified ? (
                            <Badge className="bg-green-100 text-green-700">
                              <CheckCircle className="h-3 w-3 mr-1" />
                              Verified
                            </Badge>
                          ) : (
                            <Badge variant="secondary" className="bg-amber-100 text-amber-700">
                              <XCircle className="h-3 w-3 mr-1" />
                              Pending
                            </Badge>
                          )}
                          {practitioner.available && (
                            <Badge className="bg-blue-100 text-blue-700">Available</Badge>
                          )}
                        </div>
                        
                        <p className="text-sm text-[#5c7c6b] font-medium mb-2">
                          {practitioner.specialty}
                        </p>
                        
                        <p className="text-sm text-[#5a5a5a] line-clamp-2 mb-3">
                          {practitioner.bio}
                        </p>
                        
                        <div className="flex items-center gap-4 text-sm text-[#5a5a5a] flex-wrap">
                          {(practitioner.rating ?? 0) > 0 && (
                            <div className="flex items-center gap-1">
                              <Star className="h-4 w-4 text-yellow-500 fill-yellow-500" />
                              <span>{(practitioner.rating ?? 0).toFixed(1)}</span>
                              <span>({practitioner.reviewCount || 0} reviews)</span>
                            </div>
                          )}
                          {practitioner.consultationFee && (
                            <span>R{practitioner.consultationFee}/session</span>
                          )}
                          {practitioner.joinedAt && (
                            <span>Joined {practitioner.joinedAt.toLocaleDateString()}</span>
                          )}
                        </div>
                      </div>

                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => router.push(`/practitioners/${practitioner.id}`)}>
                            View Profile
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleVerify(practitioner.id, !practitioner.verified)}>
                            {practitioner.verified ? 'Unverify' : 'Verify'}
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleToggleAvailability(practitioner.id, !practitioner.available)}>
                            {practitioner.available ? 'Set Unavailable' : 'Set Available'}
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}