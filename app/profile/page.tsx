'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/providers/AuthProvider';
import { useRouter } from 'next/navigation';
import { db } from '@/lib/firebase/client';
import { 
  collection, 
  query, 
  where, 
  onSnapshot, 
  doc, 
  getDoc, 
  setDoc, 
  serverTimestamp,
  updateDoc
} from 'firebase/firestore';
import { 
  User, 
  Mail, 
  Phone, 
  MapPin, 
  Calendar,
  Clock,
  Edit3,
  ArrowLeft,
  Video,
  FileText,
  Loader2,
  LayoutDashboard,
  Activity,
  ChevronRight,
  Stethoscope,
  Bell,
  CheckCircle,
  AlertCircle,
  ArrowRight,
  X,
  Radio
} from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';

interface Consultation {
  id: string;
  practitionerName: string;
  practitionerImage?: string;
  date: string;
  time: string;
  status: 'scheduled' | 'in-progress' | 'completed' | 'cancelled';
  type: 'video' | 'audio';
  notes?: string;
  dailyRoomUrl?: string | null;
  roomName?: string | null;
  linksUpdatedAt?: any;
  viewedAt?: any;
}

interface Notification {
  id: string;
  consultationId: string;
  message: string;
  type: 'room_ready' | 'status_change' | 'reminder';
  read: boolean;
  createdAt: any;
}

interface UserProfile {
  displayName: string;
  email: string;
  phoneNumber?: string;
  location?: string;
  bio?: string;
  photoURL?: string | null;
  joinedAt?: any;
}

// Helper to format date safely
const formatJoinDate = (timestamp: any): string => {
  if (!timestamp) return 'Recently';
  
  if (timestamp.seconds) {
    return new Date(timestamp.seconds * 1000).toLocaleDateString('en-US', { 
      month: 'short', 
      year: 'numeric' 
    });
  }
  
  if (timestamp instanceof Date) {
    return timestamp.toLocaleDateString('en-US', { 
      month: 'short', 
      year: 'numeric' 
    });
  }
  
  return 'Recently';
};

export default function ProfileViewPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [consultations, setConsultations] = useState<Consultation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [showNotifications, setShowNotifications] = useState(false);

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login');
      return;
    }
    if (user) {
      loadProfile();
      loadConsultations();
    }
  }, [user, authLoading, router]);

  const loadProfile = async () => {
    if (!user) return;
    try {
      const userRef = doc(db, 'users', user.uid);
      const userDoc = await getDoc(userRef);
      
      if (userDoc.exists()) {
        const userData = userDoc.data();
        setProfile({
          displayName: user.displayName || userData.displayName || 'Anonymous',
          email: user.email || userData.email || '',
          phoneNumber: userData?.phoneNumber || 'Not provided',
          location: userData?.location || 'Not provided',
          bio: userData?.bio || 'Welcome to RemedyAfrica! Complete your profile to help practitioners know you better.',
          photoURL: user.photoURL || userData?.photoURL || null,
          joinedAt: userData?.createdAt || userData?.joinedAt
        });
      } else {
        const now = new Date();
        const defaultProfile = {
          displayName: user.displayName || 'Anonymous',
          email: user.email || '',
          phoneNumber: 'Not provided',
          location: 'Not provided',
          bio: 'Welcome to RemedyAfrica! Complete your profile to help practitioners know you better.',
          photoURL: user.photoURL || null,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
          joinedAt: now
        };
        await setDoc(userRef, defaultProfile);
        setProfile({ 
          displayName: defaultProfile.displayName,
          email: defaultProfile.email,
          phoneNumber: defaultProfile.phoneNumber,
          location: defaultProfile.location,
          bio: defaultProfile.bio,
          photoURL: defaultProfile.photoURL,
          joinedAt: now
        });
      }
    } catch (err) {
      console.error('Error loading profile:', err);
      setError('Failed to load profile');
    }
  };

  const loadConsultations = () => {
    if (!user) return;
    
    const q = query(
      collection(db, 'consultations'),
      where('patientId', '==', user.uid)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Consultation[];
      
      data.sort((a, b) => {
        const dateA = new Date(`${a.date} ${a.time}`);
        const dateB = new Date(`${b.date} ${b.time}`);
        return dateA.getTime() - dateB.getTime();
      });
      
      setConsultations(data);
      setLoading(false);
      
      const roomNotifications = data
        .filter(c => c.dailyRoomUrl && !c.viewedAt)
        .map(c => ({
          id: c.id,
          consultationId: c.id,
          message: `Video room ready for your consultation with ${c.practitionerName}`,
          type: 'room_ready' as const,
          read: false,
          createdAt: c.linksUpdatedAt || new Date()
        }));
      
      setNotifications(roomNotifications);
      
      data.forEach(consultation => {
        if (consultation.dailyRoomUrl && consultation.linksUpdatedAt && !consultation.viewedAt) {
          toast.success(`Consultation room ready for ${consultation.practitionerName}!`, {
            duration: 5000,
            action: {
              label: 'Join Now',
              onClick: () => router.push(`/consultation/${consultation.id}`)
            }
          });
        }
      });
    }, (err) => {
      console.error('Error loading consultations:', err);
      setLoading(false);
    });

    return () => unsubscribe();
  };

  const markAsViewed = async (consultationId: string) => {
    try {
      await updateDoc(doc(db, 'consultations', consultationId), {
        viewedAt: serverTimestamp()
      });
    } catch (error) {
      console.error('Error marking as viewed:', error);
    }
  };

  const getNextConsultation = () => {
    const upcoming = consultations.filter(c => c.status === 'scheduled');
    return upcoming[0] || null;
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, string> = {
      'scheduled': 'bg-green-100 text-green-800 border-green-200',
      'in-progress': 'bg-blue-100 text-blue-800 border-blue-200',
      'completed': 'bg-gray-100 text-gray-800 border-gray-200',
      'cancelled': 'bg-red-100 text-red-800 border-red-200'
    };
    return variants[status] || 'bg-gray-100 text-gray-800';
  };

  const stats = {
    total: consultations.length,
    upcoming: consultations.filter(c => c.status === 'scheduled').length,
    completed: consultations.filter(c => c.status === 'completed').length
  };

  const unreadCount = notifications.filter(n => !n.read).length;
  const nextConsultation = getNextConsultation();

  const handleJoinCall = (consultation: Consultation) => {
    if (consultation.dailyRoomUrl) {
      markAsViewed(consultation.id);
      router.push(`/consultation/${consultation.id}`);
    } else {
      toast.error('Consultation room not ready yet. Please wait for the practitioner to start the session.');
    }
  };

  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-[#F5F5F0] flex items-center justify-center">
        <Loader2 className="w-12 h-12 text-[#97A97C] animate-spin" />
      </div>
    );
  }

  if (!user) return null;

  return (
    <div className="min-h-screen bg-[#F5F5F0] pb-12">
      {/* Header with Notifications */}
      <div className="bg-gradient-to-r from-[#2C3E2D] to-[#3d5238] text-white py-8 px-4">
        <div className="max-w-6xl mx-auto">
          <div className="flex justify-between items-start">
            <div>
              <Link href="/" className="text-white/70 hover:text-white text-sm mb-2 inline-flex items-center gap-1">
                <ArrowLeft className="w-4 h-4" /> Back to Home
              </Link>
              <h1 className="text-3xl font-bold">My Profile</h1>
              <p className="text-white/70 mt-1">Manage your account and consultations</p>
            </div>
            
            {/* Notification Bell */}
            <div className="relative">
              <Button 
                variant="outline" 
                size="icon"
                onClick={() => setShowNotifications(!showNotifications)}
                className="relative bg-white/10 border-white/20 text-white hover:bg-white/20"
                aria-label="Notifications"
              >
                <Bell className="w-5 h-5" />
                {unreadCount > 0 && (
                  <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">
                    {unreadCount}
                  </span>
                )}
              </Button>
              
              {showNotifications && (
                <div className="absolute right-0 top-12 w-80 bg-white rounded-lg shadow-lg border border-gray-200 z-50 text-gray-900">
                  <div className="p-4 border-b border-gray-200 flex justify-between items-center">
                    <h3 className="font-semibold">Notifications</h3>
                    <button 
                      onClick={() => setShowNotifications(false)}
                      aria-label="Close notifications"
                      title="Close notifications"
                    >
                      <X className="w-4 h-4 text-gray-500" />
                    </button>
                  </div>
                  <div className="max-h-64 overflow-y-auto">
                    {notifications.length === 0 ? (
                      <p className="p-4 text-center text-gray-500 text-sm">No notifications</p>
                    ) : (
                      notifications.map((notif) => (
                        <div 
                          key={notif.id}
                          className={`p-4 border-b border-gray-100 hover:bg-gray-50 cursor-pointer ${!notif.read ? 'bg-blue-50' : ''}`}
                          onClick={() => {
                            if (notif.consultationId) {
                              router.push(`/consultation/${notif.consultationId}`);
                            }
                            setShowNotifications(false);
                          }}
                        >
                          <p className="text-sm">{notif.message}</p>
                          <p className="text-xs text-gray-500 mt-1">
                            {notif.createdAt?.toLocaleTimeString?.() || 'Just now'}
                          </p>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 -mt-6">
        <div className="grid lg:grid-cols-3 gap-6">
          
          {/* Left Column - Profile Card */}
          <div className="lg:col-span-1 space-y-6">
            <div className="bg-white rounded-xl shadow-lg overflow-hidden border border-[#97A97C]/20">
              <div className="bg-gradient-to-b from-[#97A97C]/30 to-white p-6 text-center">
                <div className="relative inline-block">
                  {profile?.photoURL ? (
                    <img 
                      src={profile.photoURL} 
                      alt={profile.displayName}
                      className="w-32 h-32 rounded-full object-cover border-4 border-white shadow-xl mx-auto"
                    />
                  ) : (
                    <div className="w-32 h-32 rounded-full bg-[#2C3E2D] flex items-center justify-center border-4 border-white shadow-xl mx-auto">
                      <User className="w-16 h-16 text-[#97A97C]" />
                    </div>
                  )}
                  <div className="absolute bottom-0 right-0 bg-green-500 w-6 h-6 rounded-full border-4 border-white"></div>
                </div>
                
                <h2 className="text-2xl font-bold text-[#2C3E2D] mt-4">{profile?.displayName}</h2>
                <p className="text-gray-500 text-sm flex items-center justify-center gap-1 mt-1">
                  <Activity className="w-4 h-4" />
                  Member since {formatJoinDate(profile?.joinedAt)}
                </p>
                
                <Link href="/profile/edit" className="mt-4 inline-block w-full">
                  <Button variant="outline" className="w-full border-[#97A97C] text-[#97A97C] hover:bg-[#97A97C] hover:text-white">
                    <Edit3 className="w-4 h-4 mr-2" />
                    Edit Profile
                  </Button>
                </Link>
              </div>

              <div className="p-6 space-y-4">
                <div className="flex items-center gap-3 text-gray-600 p-3 rounded-lg hover:bg-gray-50 transition-colors">
                  <div className="w-10 h-10 rounded-full bg-[#97A97C]/10 flex items-center justify-center flex-shrink-0">
                    <Mail className="w-5 h-5 text-[#97A97C]" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs text-gray-400">Email</p>
                    <p className="text-sm font-medium truncate">{profile?.email}</p>
                  </div>
                </div>

                <div className="flex items-center gap-3 text-gray-600 p-3 rounded-lg hover:bg-gray-50 transition-colors">
                  <div className="w-10 h-10 rounded-full bg-[#97A97C]/10 flex items-center justify-center flex-shrink-0">
                    <Phone className="w-5 h-5 text-[#97A97C]" />
                  </div>
                  <div>
                    <p className="text-xs text-gray-400">Phone</p>
                    <p className="text-sm font-medium">{profile?.phoneNumber}</p>
                  </div>
                </div>

                <div className="flex items-center gap-3 text-gray-600 p-3 rounded-lg hover:bg-gray-50 transition-colors">
                  <div className="w-10 h-10 rounded-full bg-[#97A97C]/10 flex items-center justify-center flex-shrink-0">
                    <MapPin className="w-5 h-5 text-[#97A97C]" />
                  </div>
                  <div>
                    <p className="text-xs text-gray-400">Location</p>
                    <p className="text-sm font-medium">{profile?.location}</p>
                  </div>
                </div>
              </div>

              <div className="p-6 bg-gray-50 border-t">
                <h3 className="font-semibold text-[#2C3E2D] mb-2">About</h3>
                <p className="text-sm text-gray-600 leading-relaxed italic">"{profile?.bio}"</p>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="bg-white rounded-xl shadow-md p-6 border border-[#97A97C]/20">
              <h3 className="font-semibold text-[#2C3E2D] mb-4 flex items-center gap-2">
                <LayoutDashboard className="w-5 h-5 text-[#97A97C]" />
                Quick Actions
              </h3>
              <div className="space-y-3">
                <Link href="/practitioners">
                  <Button variant="outline" className="w-full justify-between border-gray-200 hover:border-[#97A97C] hover:text-[#97A97C]">
                    <span className="flex items-center gap-2">
                      <Stethoscope className="w-4 h-4" />
                      Find Practitioner
                    </span>
                    <ChevronRight className="w-4 h-4" />
                  </Button>
                </Link>
              </div>
            </div>
          </div>

          {/* Right Column - Dashboard */}
          <div className="lg:col-span-2 space-y-6">
            
            {/* Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-600">Upcoming</p>
                      <p className="text-2xl font-bold text-[#2C3E2D]">{stats.upcoming}</p>
                    </div>
                    <Calendar className="w-8 h-8 text-[#97A97C]" />
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-600">Completed</p>
                      <p className="text-2xl font-bold text-[#2C3E2D]">{stats.completed}</p>
                    </div>
                    <CheckCircle className="w-8 h-8 text-green-500" />
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-600">Total</p>
                      <p className="text-2xl font-bold text-[#2C3E2D]">{stats.total}</p>
                    </div>
                    <Activity className="w-8 h-8 text-blue-500" />
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Next Appointment Alert */}
            {nextConsultation && (
              <Card className="border-[#97A97C] border-2">
                <CardContent className="p-6">
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <Badge className="bg-[#97A97C] text-white">Next Up</Badge>
                        {nextConsultation.dailyRoomUrl ? (
                          <Badge className="bg-green-100 text-green-800 flex items-center gap-1">
                            <Radio className="w-3 h-3" />
                            Room Ready
                          </Badge>
                        ) : (
                          <Badge className="bg-yellow-100 text-yellow-800">Waiting for Room</Badge>
                        )}
                      </div>
                      <h2 className="text-xl font-bold text-[#2C3E2D] mb-1">
                        {nextConsultation.practitionerName}
                      </h2>
                      <p className="text-gray-600 flex items-center gap-2">
                        <Clock className="w-4 h-4" />
                        {nextConsultation.date} at {nextConsultation.time}
                      </p>
                      <p className="text-sm text-gray-500 mt-1 capitalize">
                        {nextConsultation.type} Consultation
                      </p>
                    </div>
                    
                    <div className="flex gap-2">
                      {nextConsultation.dailyRoomUrl ? (
                        <Button 
                          onClick={() => handleJoinCall(nextConsultation!)}
                          className="bg-[#97A97C] hover:bg-[#7A8A63] text-white"
                        >
                          <Video className="w-4 h-4 mr-2" />
                          Join Call
                        </Button>
                      ) : (
                        <Button 
                          variant="outline" 
                          disabled
                          className="text-gray-500"
                        >
                          <AlertCircle className="w-4 h-4 mr-2" />
                          Room Pending
                        </Button>
                      )}
                      <Button 
                        variant="outline"
                        onClick={() => {
                          markAsViewed(nextConsultation.id);
                          router.push(`/consultation/${nextConsultation.id}`);
                        }}
                      >
                        Details
                        <ArrowRight className="w-4 h-4 ml-2" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Consultations List */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Calendar className="w-5 h-5 text-[#97A97C]" />
                  My Appointments
                </CardTitle>
              </CardHeader>
              <CardContent>
                {consultations.length === 0 ? (
                  <div className="text-center py-8">
                    <Calendar className="w-12 h-12 mx-auto mb-2 text-gray-300" />
                    <p className="text-gray-500 mb-4">No consultations yet</p>
                    <Button 
                      className="bg-[#97A97C] hover:bg-[#7A8A63]"
                      onClick={() => router.push('/practitioners')}
                    >
                      Find a Practitioner
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {consultations.map((consultation) => (
                      <div 
                        key={consultation.id}
                        className="flex items-center justify-between p-4 bg-gray-50 rounded-lg border border-gray-200 hover:border-[#97A97C] transition-colors"
                      >
                        <div className="flex items-center gap-4">
                          <div className="w-10 h-10 rounded-full bg-[#97A97C] flex items-center justify-center text-white font-bold">
                            {consultation.practitionerName?.charAt(0) || '?'}
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <h3 className="font-semibold text-[#2C3E2D]">
                                {consultation.practitionerName}
                              </h3>
                              <Badge className={getStatusBadge(consultation.status)}>
                                {consultation.status}
                              </Badge>
                            </div>
                            <p className="text-sm text-gray-600">
                              {consultation.date} • {consultation.time} • {consultation.type}
                            </p>
                          </div>
                        </div>
                        
                        <div className="flex items-center gap-2">
                          {consultation.status === 'scheduled' && (
                            <>
                              {consultation.dailyRoomUrl ? (
                                <Button 
                                  size="sm"
                                  onClick={() => handleJoinCall(consultation)}
                                  className="bg-[#97A97C] hover:bg-[#7A8A63] text-white"
                                >
                                  <Video className="w-4 h-4 mr-1" />
                                  Join
                                </Button>
                              ) : (
                                <span className="text-xs text-gray-400 bg-gray-200 px-2 py-1 rounded">
                                  Pending
                                </span>
                              )}
                            </>
                          )}
                          <Button 
                            variant="ghost" 
                            size="sm"
                            onClick={() => router.push(`/consultation/${consultation.id}`)}
                          >
                            <ArrowRight className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}