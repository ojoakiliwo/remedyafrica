'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { 
  Leaf, 
  Calendar, 
  MessageSquare, 
  User, 
  Heart, 
  History,
  Sparkles,
  ArrowRight,
  Shield
} from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { db } from '@/lib/firebase/client';
import { collection, query, where, getDocs, orderBy, limit } from 'firebase/firestore';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface SavedHerb {
  id: string;
  herbId: string;
  herbName: string;
  savedAt: Date;
}

interface Consultation {
  id: string;
  practitionerId: string;
  practitionerName: string;
  status: string;
  scheduledDate?: Date;
  createdAt: Date;
}

interface PlantHistory {
  id: string;
  plantName: string;
  confidence: number;
  identifiedAt: Date;
  imageUrl: string;
}

export default function DashboardPage() {
  const { user, profile, isAdmin } = useAuth();
  const router = useRouter();
  const [savedHerbs, setSavedHerbs] = useState<SavedHerb[]>([]);
  const [consultations, setConsultations] = useState<Consultation[]>([]);
  const [plantHistory, setPlantHistory] = useState<PlantHistory[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!user && !isLoading) {
      router.push('/login');
      return;
    }

    if (user) {
      fetchUserData();
    }
  }, [user, router]);

  const fetchUserData = async () => {
    if (!user) return;
    
    try {
      const herbsQuery = query(
        collection(db, 'my_herbs'),
        where('userId', '==', user.uid),
        orderBy('savedAt', 'desc'),
        limit(5)
      );
      const herbsSnapshot = await getDocs(herbsQuery);
      const herbsData = herbsSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        savedAt: doc.data().savedAt?.toDate()
      })) as SavedHerb[];
      setSavedHerbs(herbsData);

      const consultationsQuery = query(
        collection(db, 'consultations'),
        where('patientId', '==', user.uid),
        orderBy('createdAt', 'desc'),
        limit(5)
      );
      const consultationsSnapshot = await getDocs(consultationsQuery);
      const consultationsData = consultationsSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate(),
        scheduledDate: doc.data().scheduledDate?.toDate()
      })) as Consultation[];
      setConsultations(consultationsData);

      const historyQuery = query(
        collection(db, 'user_plant_history'),
        where('userId', '==', user.uid),
        orderBy('identifiedAt', 'desc'),
        limit(5)
      );
      const historySnapshot = await getDocs(historyQuery);
      const historyData = historySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        identifiedAt: doc.data().identifiedAt?.toDate()
      })) as PlantHistory[];
      setPlantHistory(historyData);

    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#F5F5DC]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#97A97C]"></div>
      </div>
    );
  }

  if (!user) return null;

  const displayName = profile?.displayName || user?.email?.split('@')[0] || 'User';

  return (
    <div className="min-h-screen bg-[#F5F5DC]">
      <div className="bg-[#2C3E2D] text-[#F5F5DC] py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-[#97A97C] rounded-full">
              <User className="w-8 h-8 text-[#2C3E2D]" />
            </div>
            <div>
              <h1 className="text-3xl font-bold">Welcome back, {displayName}</h1>
              <p className="text-[#97A97C] mt-1">Manage your herbal journey and consultations</p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Link href="/identify">
            <Card className="hover:shadow-lg transition-shadow cursor-pointer border-[#97A97C]/20 bg-white">
              <CardContent className="p-6">
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-[#97A97C]/20 rounded-lg">
                    <Sparkles className="w-6 h-6 text-[#97A97C]" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-[#2C3E2D]">Identify Plant</h3>
                    <p className="text-sm text-stone-600">Upload a photo to identify</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </Link>

          <Link href="/practitioners">
            <Card className="hover:shadow-lg transition-shadow cursor-pointer border-[#97A97C]/20 bg-white">
              <CardContent className="p-6">
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-[#97A97C]/20 rounded-lg">
                    <Calendar className="w-6 h-6 text-[#97A97C]" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-[#2C3E2D]">Book Consultation</h3>
                    <p className="text-sm text-stone-600">Find a practitioner</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </Link>

          <Link href="/forum">
            <Card className="hover:shadow-lg transition-shadow cursor-pointer border-[#97A97C]/20 bg-white">
              <CardContent className="p-6">
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-[#97A97C]/20 rounded-lg">
                    <MessageSquare className="w-6 h-6 text-[#97A97C]" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-[#2C3E2D]">Community</h3>
                    <p className="text-sm text-stone-600">Join the discussion</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </Link>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <Card className="border-[#97A97C]/20 bg-white">
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="flex items-center gap-2 text-[#2C3E2D]">
                <Heart className="w-5 h-5 text-red-500" />
                Saved Herbs
              </CardTitle>
              <Link href="/herbs">
                <Button variant="ghost" size="sm" className="text-[#97A97C]">
                  View All <ArrowRight className="w-4 h-4 ml-1" />
                </Button>
              </Link>
            </CardHeader>
            <CardContent>
              {savedHerbs.length === 0 ? (
                <div className="text-center py-8 text-stone-500">
                  <Leaf className="w-12 h-12 mx-auto mb-3 opacity-30" />
                  <p>No saved herbs yet</p>
                  <Link href="/herbs">
                    <Button variant="outline" className="mt-4 border-[#97A97C] text-[#97A97C]" size="sm">
                      Browse Herbs
                    </Button>
                  </Link>
                </div>
              ) : (
                <div className="space-y-3">
                  {savedHerbs.map((herb) => (
                    <div key={herb.id} className="flex items-center justify-between p-3 bg-[#F5F5DC] rounded-lg">
                      <div>
                        <p className="font-medium text-[#2C3E2D]">{herb.herbName}</p>
                        <p className="text-xs text-stone-500">
                          Saved {herb.savedAt?.toLocaleDateString()}
                        </p>
                      </div>
                      <Link href={`/herb/${herb.herbId}`}>
                        <Button variant="ghost" size="sm" className="text-[#97A97C]">
                          View
                        </Button>
                      </Link>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          <Card className="border-[#97A97C]/20 bg-white">
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="flex items-center gap-2 text-[#2C3E2D]">
                <Calendar className="w-5 h-5 text-[#97A97C]" />
                My Consultations
              </CardTitle>
              <Link href="/consultations">
                <Button variant="ghost" size="sm" className="text-[#97A97C]">
                  View All <ArrowRight className="w-4 h-4 ml-1" />
                </Button>
              </Link>
            </CardHeader>
            <CardContent>
              {consultations.length === 0 ? (
                <div className="text-center py-8 text-stone-500">
                  <Calendar className="w-12 h-12 mx-auto mb-3 opacity-30" />
                  <p>No consultations yet</p>
                  <Link href="/practitioners">
                    <Button variant="outline" className="mt-4 border-[#97A97C] text-[#97A97C]" size="sm">
                      Find Practitioner
                    </Button>
                  </Link>
                </div>
              ) : (
                <div className="space-y-3">
                  {consultations.map((consultation) => (
                    <div key={consultation.id} className="flex items-center justify-between p-3 bg-[#F5F5DC] rounded-lg">
                      <div>
                        <p className="font-medium text-[#2C3E2D]">{consultation.practitionerName}</p>
                        <p className="text-xs text-stone-500 capitalize">
                          {consultation.status} • {consultation.scheduledDate?.toLocaleDateString() || 'Not scheduled'}
                        </p>
                      </div>
                      <Link href={`/consultation/${consultation.id}`}>
                        <Button variant="ghost" size="sm" className="text-[#97A97C]">
                          {consultation.status === 'active' ? 'Join' : 'View'}
                        </Button>
                      </Link>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          <Card className="lg:col-span-2 border-[#97A97C]/20 bg-white">
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="flex items-center gap-2 text-[#2C3E2D]">
                <History className="w-5 h-5 text-amber-600" />
                Plant Identification History
              </CardTitle>
              <Link href="/history">
                <Button variant="ghost" size="sm" className="text-[#97A97C]">
                  View All <ArrowRight className="w-4 h-4 ml-1" />
                </Button>
              </Link>
            </CardHeader>
            <CardContent>
              {plantHistory.length === 0 ? (
                <div className="text-center py-8 text-stone-500">
                  <History className="w-12 h-12 mx-auto mb-3 opacity-30" />
                  <p>No identifications yet</p>
                  <Link href="/identify">
                    <Button variant="outline" className="mt-4 border-[#97A97C] text-[#97A97C]" size="sm">
                      Identify a Plant
                    </Button>
                  </Link>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                  {plantHistory.map((item) => (
                    <div key={item.id} className="border border-[#97A97C]/20 rounded-lg overflow-hidden bg-[#F5F5DC]">
                      <div className="aspect-video bg-stone-100 relative">
                        {item.imageUrl && (
                          <img 
                            src={item.imageUrl} 
                            alt={item.plantName}
                            className="w-full h-full object-cover"
                          />
                        )}
                      </div>
                      <div className="p-3">
                        <p className="font-medium text-[#2C3E2D]">{item.plantName}</p>
                        <p className="text-xs text-stone-500">
                          {Math.round(item.confidence * 100)}% confidence
                        </p>
                        <p className="text-xs text-stone-400 mt-1">
                          {item.identifiedAt?.toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {isAdmin && (
          <Card className="mt-8 border-amber-200 bg-amber-50">
            <CardHeader>
              <CardTitle className="text-amber-900 flex items-center gap-2">
                <Shield className="w-5 h-5" />
                Admin Controls
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-4">
                <Link href="/admin">
                  <Button className="bg-amber-600 hover:bg-amber-700">
                    Admin Dashboard
                  </Button>
                </Link>
                <Link href="/admin/applications">
                  <Button variant="outline" className="border-amber-600 text-amber-700">
                    Review Applications
                  </Button>
                </Link>
                <Link href="/admin/herbs">
                  <Button variant="outline" className="border-amber-600 text-amber-700">
                    Manage Herbs
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}