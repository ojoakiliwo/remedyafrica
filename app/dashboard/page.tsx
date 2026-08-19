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
  Shield,
  Loader2,
  AlertCircle,
  Crown
} from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useSubscription } from '@/providers/SubscriptionProvider';
import { db } from '@/lib/firebase/client';
import { collection, query, where, getDocs, orderBy, limit, doc, getDoc } from 'firebase/firestore';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';

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
  dailyRoomUrl?: string | null;
}

interface PlantHistory {
  id: string;
  plantName: string;
  confidence: number;
  identifiedAt: Date;
  imageUrl: string;
}

interface Subscription {
  status: string;
  plan?: string;
  expiresAt?: Date;
}

export default function DashboardPage() {
  const { user, userData } = useAuth();
  const { isPremium, tier } = useSubscription();
  const router = useRouter();
  const [isAdmin, setIsAdmin] = useState(false);
  const [savedHerbs, setSavedHerbs] = useState<SavedHerb[]>([]);
  const [consultations, setConsultations] = useState<Consultation[]>([]);
  const [plantHistory, setPlantHistory] = useState<PlantHistory[]>([]);
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Check admin status manually
  useEffect(() => {
    const checkAdmin = async () => {
      if (!user) return;
      try {
        const userDoc = await getDoc(doc(db, 'users', user.uid));
        if (userDoc.exists()) {
          const userData = userDoc.data();
          setIsAdmin(userData.role === 'admin');
        }
      } catch (err) {
        console.error('Error checking admin:', err);
      }
    };
    checkAdmin();
  }, [user]);

  useEffect(() => {
    if (!user) {
      if (!isLoading) router.push('/login');
      return;
    }

    fetchUserData();
  }, [user, router]);

  const fetchUserData = async () => {
    if (!user) return;
    
    try {
      // Fetch subscription
      try {
        const subDoc = await getDoc(doc(db, 'users', user.uid, 'subscription', 'current'));
        if (subDoc.exists()) {
          const data = subDoc.data();
          setSubscription({
            status: data.status,
            plan: data.plan,
            expiresAt: data.expiresAt?.toDate()
          });
        }
      } catch (e) {
        console.log('No subscription found');
      }

      // Fetch saved herbs
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
      } catch (e) {
        console.log('No saved herbs collection yet');
      }

      // Fetch consultations
      try {
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
      } catch (e) {
        console.log('Error fetching consultations:', e);
      }

      // Fetch plant history
      try {
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
      } catch (e) {
        console.log('No plant history collection yet');
      }

    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      toast.error('Failed to load some dashboard data');
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-cream">
        <Loader2 className="w-12 h-12 text-bronze animate-spin" />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-cream">
        <div className="text-center">
          <AlertCircle className="w-16 h-16 text-orange-500 mx-auto mb-4" />
          <h1 className="text-2xl font-bold mb-4">Please sign in</h1>
          <Button onClick={() => router.push('/login')} className="bg-forest">
            Go to Login
          </Button>
        </div>
      </div>
    );
  }

  const displayName = userData?.displayName || user?.displayName || user?.email?.split('@')[0] || 'User';
  const isSubActive = isPremium || (subscription?.status === 'active' && (!subscription.expiresAt || subscription.expiresAt > new Date()));

  return (
    <div className="min-h-screen bg-cream">
      <div className="bg-forest text-[#F5F5DC] py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row items-start md:items-center gap-4 justify-between">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-forest rounded-full">
                <User className="w-8 h-8 text-forest" />
              </div>
              <div>
                <h1 className="text-3xl font-bold">Welcome back, {displayName}</h1>
                <p className="text-bronze mt-1">Manage your herbal journey and consultations</p>
              </div>
            </div>
            {isSubActive ? (
              <Badge className="bg-amber-500 text-white px-3 py-1">
                <Crown className="w-3 h-3 mr-1" />
                {subscription?.plan || tier} Active
              </Badge>
            ) : (
              <Link href="/subscription">
                <Button variant="outline" className="border-amber-400 text-amber-400 hover:bg-amber-400/10">
                  <Crown className="w-4 h-4 mr-2" />
                  Upgrade to Premium
                </Button>
              </Link>
            )}
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Link href="/identify">
            <Card className="hover:shadow-lg transition-shadow cursor-pointer border-forest/20 bg-white">
              <CardContent className="p-6">
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-forest/20 rounded-lg">
                    <Sparkles className="w-6 h-6 text-bronze" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-forest">Identify Plant</h3>
                    <p className="text-sm text-stone-600">Upload a photo to identify</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </Link>

          <Link href="/practitioners">
            <Card className="hover:shadow-lg transition-shadow cursor-pointer border-forest/20 bg-white">
              <CardContent className="p-6">
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-forest/20 rounded-lg">
                    <Calendar className="w-6 h-6 text-bronze" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-forest">Book Consultation</h3>
                    <p className="text-sm text-stone-600">Find a practitioner</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </Link>

          <Link href="/forum">
            <Card className="hover:shadow-lg transition-shadow cursor-pointer border-forest/20 bg-white">
              <CardContent className="p-6">
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-forest/20 rounded-lg">
                    <MessageSquare className="w-6 h-6 text-bronze" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-forest">Community</h3>
                    <p className="text-sm text-stone-600">Join the discussion</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </Link>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <Card className="border-forest/20 bg-white">
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="flex items-center gap-2 text-forest">
                <Heart className="w-5 h-5 text-red-500" />
                Saved Herbs
              </CardTitle>
              <Link href="/herbs">
                <Button variant="ghost" size="sm" className="text-bronze">
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
                    <Button variant="outline" className="mt-4 border-forest text-bronze" size="sm">
                      Browse Herbs
                    </Button>
                  </Link>
                </div>
              ) : (
                <div className="space-y-3">
                  {savedHerbs.map((herb) => (
                    <div key={herb.id} className="flex items-center justify-between p-3 bg-cream rounded-lg">
                      <div>
                        <p className="font-medium text-forest">{herb.herbName}</p>
                        <p className="text-xs text-stone-500">
                          Saved {herb.savedAt?.toLocaleDateString()}
                        </p>
                      </div>
                      <Link href={`/herb/${herb.herbId}`}>
                        <Button variant="ghost" size="sm" className="text-bronze">
                          View
                        </Button>
                      </Link>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          <Card className="border-forest/20 bg-white">
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="flex items-center gap-2 text-forest">
                <Calendar className="w-5 h-5 text-bronze" />
                My Consultations
              </CardTitle>
              <Link href="/consultations">
                <Button variant="ghost" size="sm" className="text-bronze">
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
                    <Button variant="outline" className="mt-4 border-forest text-bronze" size="sm">
                      Find Practitioner
                    </Button>
                  </Link>
                </div>
              ) : (
                <div className="space-y-3">
                  {consultations.map((consultation) => (
                    <div key={consultation.id} className="flex items-center justify-between p-3 bg-cream rounded-lg">
                      <div>
                        <p className="font-medium text-forest">{consultation.practitionerName}</p>
                        <p className="text-xs text-stone-500 capitalize">
                          {consultation.status} • {consultation.scheduledDate?.toLocaleDateString() || 'Not scheduled'}
                        </p>
                      </div>
                      <Link href={`/consultation/${consultation.id}`}>
                        <Button variant="ghost" size="sm" className="text-bronze">
                          {consultation.status === 'active' ? 'Join' : 'View'}
                        </Button>
                      </Link>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          <Card className="lg:col-span-2 border-forest/20 bg-white">
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="flex items-center gap-2 text-forest">
                <History className="w-5 h-5 text-amber-600" />
                Plant Identification History
              </CardTitle>
              <Link href="/history">
                <Button variant="ghost" size="sm" className="text-bronze">
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
                    <Button variant="outline" className="mt-4 border-forest text-bronze" size="sm">
                      Identify a Plant
                    </Button>
                  </Link>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                  {plantHistory.map((item) => (
                    <div key={item.id} className="border border-forest/20 rounded-lg overflow-hidden bg-cream">
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
                        <p className="font-medium text-forest">{item.plantName}</p>
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
                <Link href="/admin/herbs/list">
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