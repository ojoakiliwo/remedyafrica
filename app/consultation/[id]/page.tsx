'use client';

import { useEffect, useState, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { doc, getDoc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase/client';
import { useAuth } from '@/hooks/useAuth';
import { canUserCancelConsultation, consultationCancelFields, isConsultationParticipant } from '@/lib/consultations/cancel';
import { getPractitionerLookupIds } from '@/lib/consultations/lookup';
import { resolveCallDisplayName, withDailyJoinIdentity } from '@/lib/consultations/call-identity';
import { 
  ArrowLeft,
  Video,
  Phone,
  Clock,
  User,
  Copy,
  AlertCircle,
  PhoneOff,
  RefreshCw,
  XCircle
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { toast } from 'sonner';

interface Consultation {
  id: string;
  practitionerName: string;
  practitionerImage?: string;
  patientName: string;
  patientId: string;
  practitionerId: string;
  practitionerProfileId?: string;
  date: string;
  time: string;
  status: 'scheduled' | 'in-progress' | 'completed' | 'cancelled';
  type: 'video' | 'audio' | 'chat';
  notes?: string;
  dailyRoomUrl?: string;
  dailyRoomName?: string;
  roomName?: string;
  startedAt?: any;
  endedAt?: any;
}

export default function ConsultationRoom() {
  const params = useParams();
  const router = useRouter();
  const { user, userData, loading: authLoading } = useAuth();
  const consultationId = params.id as string;
  const iframeRef = useRef<HTMLIFrameElement>(null);
  
  const [consultation, setConsultation] = useState<Consultation | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [creatingRoom, setCreatingRoom] = useState(false);
  const [callActive, setCallActive] = useState(false);
  const [cancelling, setCancelling] = useState(false);
  const [actorIds, setActorIds] = useState<string[]>([]);
  const [joinUrl, setJoinUrl] = useState('');

  useEffect(() => {
    loadConsultation();
  }, [consultationId]);

  useEffect(() => {
    if (!user?.uid) {
      setActorIds([]);
      return;
    }
    let cancelled = false;
    getPractitionerLookupIds(user.uid).then((ids) => {
      if (!cancelled) setActorIds(ids);
    });
    return () => {
      cancelled = true;
    };
  }, [user?.uid]);

  const loadConsultation = async () => {
    try {
      const docRef = doc(db, 'consultations', consultationId);
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        const data = { id: docSnap.id, ...docSnap.data() } as Consultation;
        setConsultation(data);
        
        // Auto-create room if scheduled and no room exists
        if (data.status === 'scheduled' && !data.dailyRoomUrl) {
          await createDailyRoom(data);
        }
      } else {
        setError('Consultation not found');
      }
    } catch (error) {
      console.error('Error loading consultation:', error);
      setError('Error loading consultation');
    } finally {
      setLoading(false);
    }
  };

  const createDailyRoom = async (consultationData: Consultation) => {
    setCreatingRoom(true);
    try {
      const response = await fetch('/api/daily/create-room', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          consultationId: consultationData.id,
          type: consultationData.type
        })
      });

      if (!response.ok) throw new Error('Failed to create room');
      
      const roomData = await response.json();
      
      // Update consultation with room URL
      await updateDoc(doc(db, 'consultations', consultationId), {
        dailyRoomUrl: roomData.roomUrl,
        dailyRoomName: roomData.roomName,
        updatedAt: serverTimestamp()
      });
      
      // Update local state
      setConsultation(prev => prev ? {
        ...prev,
        dailyRoomUrl: roomData.roomUrl,
        dailyRoomName: roomData.roomName
      } : null);
      
    } catch (error) {
      console.error('Error creating room:', error);
      setError('Failed to create meeting room. Please refresh to try again.');
    } finally {
      setCreatingRoom(false);
    }
  };

  useEffect(() => {
    if (!consultation?.dailyRoomUrl) return;
    if (consultation.status === 'cancelled' || consultation.status === 'completed') {
      setCallActive(false);
      return;
    }

    setCallActive(true);

    if (consultation.status !== 'scheduled') return;

    let cancelled = false;
    updateDoc(doc(db, 'consultations', consultationId), {
      status: 'in-progress',
      startedAt: serverTimestamp()
    }).then(() => {
      if (cancelled) return;
      setConsultation(prev => prev ? { ...prev, status: 'in-progress' } : null);
    }).catch((err) => {
      console.error('Error starting call:', err);
    });

    return () => {
      cancelled = true;
    };
  }, [consultation?.dailyRoomUrl, consultation?.status, consultationId]);

  const endCall = async () => {
    try {
      await updateDoc(doc(db, 'consultations', consultationId), {
        status: 'completed',
        endedAt: serverTimestamp()
      });
      
      setCallActive(false);
      setConsultation(prev => prev ? { ...prev, status: 'completed' } : null);
    } catch (error) {
      console.error('Error ending call:', error);
    }
  };

  const cancelAppointment = async () => {
    if (!consultation || !user || !canUserCancelConsultation(user.uid, consultation, actorIds)) return;
    if (!confirm('Cancel this appointment? The other person will no longer be able to join.')) return;

    setCancelling(true);
    try {
      await updateDoc(doc(db, 'consultations', consultationId), {
        ...consultationCancelFields(user.uid),
        cancelledAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
      setCallActive(false);
      setConsultation(prev => prev ? { ...prev, status: 'cancelled' } : null);
      toast.success('Appointment cancelled');
    } catch (error) {
      console.error('Error cancelling appointment:', error);
      toast.error('Could not cancel this appointment. Please try again.');
    } finally {
      setCancelling(false);
    }
  };

  const copyRoomLink = async () => {
    if (consultation?.dailyRoomUrl) {
      await navigator.clipboard.writeText(consultation.dailyRoomUrl);
      toast.success('Meeting link copied');
    }
  };

  const fallbackCallName = consultation
    ? user && isConsultationParticipant(user.uid, consultation, actorIds) && user.uid !== consultation.patientId
      ? consultation.practitionerName
      : consultation.patientName
    : '';

  const callName = resolveCallDisplayName({
    displayName: userData?.displayName || user?.displayName,
    name: userData?.name,
    email: user?.email,
    fallback: fallbackCallName,
  });

  useEffect(() => {
    if (!consultation?.dailyRoomUrl) {
      setJoinUrl('');
      return;
    }
    if (consultation.status === 'cancelled' || consultation.status === 'completed') {
      setJoinUrl('');
      return;
    }
    if (authLoading) return;

    let cancelled = false;
    fetch('/api/daily/join-token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        roomUrl: consultation.dailyRoomUrl,
        roomName: consultation.dailyRoomName || consultation.roomName,
        userName: callName,
        type: consultation.type,
        userId: user?.uid,
      }),
    })
      .then((response) => (response.ok ? response.json() : null))
      .then((data) => {
        if (cancelled) return;
        setJoinUrl(
          data?.roomUrl ||
            withDailyJoinIdentity(consultation.dailyRoomUrl!, { userName: callName })
        );
      })
      .catch((err) => {
        console.error('Error creating named meeting token:', err);
        if (!cancelled) {
          setJoinUrl(withDailyJoinIdentity(consultation.dailyRoomUrl!, { userName: callName }));
        }
      });

    return () => {
      cancelled = true;
    };
  }, [
    consultation?.dailyRoomUrl,
    consultation?.dailyRoomName,
    consultation?.roomName,
    consultation?.status,
    consultation?.type,
    callName,
    authLoading,
    user?.uid,
  ]);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#F5F5F0] flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#97A97C] mx-auto mb-4"></div>
          <p className="text-[#2C3E2D]">Loading consultation...</p>
        </div>
      </div>
    );
  }

  if (error || !consultation) {
    return (
      <div className="min-h-screen bg-[#F5F5F0] flex items-center justify-center p-4">
        <div className="text-center max-w-md">
          <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-[#2C3E2D] mb-4">{error || 'Not found'}</h1>
          <Button onClick={() => router.push('/dashboard')} className="bg-[#97A97C] hover:bg-[#7A8A63]">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Dashboard
          </Button>
        </div>
      </div>
    );
  }

  const isActive = consultation.status === 'in-progress' || callActive;
  const isPast = consultation.status === 'completed' || consultation.status === 'cancelled';
  const showVideo = Boolean(consultation.dailyRoomUrl) && !isPast;
  const canCancel = canUserCancelConsultation(user?.uid, consultation, actorIds);

  return (
    <div className="min-h-screen bg-[#F5F5F0] text-[#2C3E2D]">
      {/* Header */}
      <header className="bg-white border-b border-[#E5E5E5] sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button variant="ghost" size="icon" onClick={() => router.push('/dashboard')} className="text-[#2C3E2D]">
                <ArrowLeft className="w-5 h-5" />
              </Button>
              <div>
                <h1 className="text-xl font-bold text-[#2C3E2D]">Consultation Room</h1>
                <p className="text-sm text-gray-600">with {consultation.practitionerName}</p>
              </div>
            </div>
            
            <div className="flex items-center gap-3">
              <div className={`px-3 py-1 rounded-full text-sm font-medium ${
                consultation.status === 'scheduled' ? 'bg-yellow-100 text-yellow-800' :
                consultation.status === 'in-progress' ? 'bg-green-100 text-green-800' :
                consultation.status === 'completed' ? 'bg-gray-100 text-gray-800' :
                'bg-red-100 text-red-800'
              }`}>
                {consultation.status}
              </div>

              {canCancel && (
                <Button
                  onClick={cancelAppointment}
                  variant="outline"
                  size="sm"
                  disabled={cancelling}
                  className="border-red-300 text-red-700 hover:bg-red-50"
                >
                  <XCircle className="w-4 h-4 mr-2" />
                  {cancelling ? 'Cancelling...' : 'Cancel appointment'}
                </Button>
              )}
              
              {isActive && !isPast && (
                <Button onClick={endCall} variant="destructive" size="sm" className="bg-red-600 hover:bg-red-700">
                  <PhoneOff className="w-4 h-4 mr-2" />
                  End Call
                </Button>
              )}
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-6">
        <div className="grid lg:grid-cols-3 gap-6 min-h-[calc(100vh-140px)]">
          {/* Main Video Area */}
          <div className="lg:col-span-2 flex flex-col gap-4">
            {consultation.status === 'cancelled' ? (
              <div className="flex-1 min-h-[420px] bg-white rounded-lg flex items-center justify-center border border-red-100">
                <div className="text-center p-8">
                  <XCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
                  <h3 className="text-xl font-bold text-[#2C3E2D] mb-2">This appointment was cancelled</h3>
                  <p className="text-gray-600">The video room is no longer available.</p>
                </div>
              </div>
            ) : creatingRoom ? (
              <div className="flex-1 min-h-[420px] bg-gray-900 rounded-lg flex items-center justify-center text-white">
                <div className="text-center">
                  <RefreshCw className="w-12 h-12 animate-spin mx-auto mb-4 text-[#97A97C]" />
                  <p className="text-lg">Creating secure meeting room...</p>
                  <p className="text-sm text-gray-400 mt-2">This may take a moment</p>
                </div>
              </div>
            ) : showVideo && !joinUrl ? (
              <div className="flex-1 min-h-[420px] bg-gray-900 rounded-lg flex items-center justify-center text-white">
                <div className="text-center">
                  <RefreshCw className="w-12 h-12 animate-spin mx-auto mb-4 text-[#97A97C]" />
                  <p className="text-lg">Joining as {callName}...</p>
                  <p className="text-sm text-gray-400 mt-2">Using the name on your profile</p>
                </div>
              </div>
            ) : showVideo ? (
              <>
                <div className="flex-1 min-h-[420px] bg-gray-900 rounded-lg overflow-hidden relative">
                  <iframe
                    ref={iframeRef}
                    src={joinUrl}
                    className="w-full h-full min-h-[420px] border-0"
                    allow="camera; microphone; fullscreen; speaker; display-capture"
                    title="Consultation video"
                  />
                </div>

                {isActive && (
                  <div className="bg-white p-4 rounded-lg shadow flex items-center justify-between">
                    <span className="text-sm text-[#2C3E2D]">
                      Joined as {callName}. {consultation.type === 'audio' ? 'Audio' : 'Video'} is running on this page.
                    </span>
                    
                    <Button variant="outline" size="sm" onClick={copyRoomLink} className="text-[#2C3E2D]">
                      <Copy className="w-4 h-4 mr-2" />
                      Copy Link
                    </Button>
                  </div>
                )}
              </>
            ) : consultation.status === 'completed' ? (
              <div className="flex-1 min-h-[420px] bg-white rounded-lg flex items-center justify-center border border-gray-200">
                <div className="text-center p-8">
                  <Clock className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-xl font-bold text-[#2C3E2D] mb-2">This consultation has ended</h3>
                  <p className="text-gray-600">The live video is no longer available.</p>
                </div>
              </div>
            ) : (
              <div className="flex-1 min-h-[420px] bg-gray-100 rounded-lg flex items-center justify-center">
                <div className="text-center p-8">
                  <AlertCircle className="w-16 h-16 text-yellow-500 mx-auto mb-4" />
                  <h3 className="text-xl font-bold text-[#2C3E2D] mb-2">Meeting Room Not Available</h3>
                  <p className="text-gray-600 mb-4">We couldn't create the meeting room. Please try again.</p>
                  <Button onClick={() => createDailyRoom(consultation)} className="bg-[#97A97C] hover:bg-[#7A8A63]">
                    <RefreshCw className="w-4 h-4 mr-2" />
                    Retry
                  </Button>
                </div>
              </div>
            )}

            {/* Privacy Notice */}
            <Alert className="bg-blue-50 border-blue-200">
              <AlertDescription className="text-blue-800 text-sm">
                <strong>Privacy Notice:</strong> This consultation is encrypted and private. 
                Only you and {consultation.practitionerName} can access this meeting. 
                RemedyAfrica does not record calls without explicit consent.
              </AlertDescription>
            </Alert>
          </div>

          {/* Sidebar */}
          <div className="space-y-4 overflow-y-auto">
            {/* Session Info */}
            <Card className="session-details border-[#E5E5E5] bg-white text-[#2C3E2D]">
              <CardHeader>
                <CardTitle className="text-[#2C3E2D] text-base flex items-center gap-2">
                  <User className="w-4 h-4 text-[#97A97C]" />
                  Session Details
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 text-sm text-[#2C3E2D]">
                <div className="flex justify-between gap-4">
                  <span className="session-details-label">Practitioner</span>
                  <span className="session-details-value text-right">{consultation.practitionerName}</span>
                </div>
                <div className="flex justify-between gap-4">
                  <span className="session-details-label">Date</span>
                  <span className="session-details-value">{consultation.date || 'To be scheduled'}</span>
                </div>
                <div className="flex justify-between gap-4">
                  <span className="session-details-label">Time</span>
                  <span className="session-details-value">{consultation.time || 'To be scheduled'}</span>
                </div>
                <div className="flex justify-between gap-4">
                  <span className="session-details-label">Type</span>
                  <span className="session-details-value capitalize flex items-center gap-1">
                    {consultation.type === 'video' ? <Video className="w-3 h-3" /> : <Phone className="w-3 h-3" />}
                    {consultation.type}
                  </span>
                </div>
                <hr className="border-gray-200" />
                <div className="bg-[#97A97C]/10 p-3 rounded-lg">
                  <p className="text-xs font-semibold text-[#2C3E2D] mb-2">Preparation Tips</p>
                  <ul className="text-xs text-gray-700 space-y-1 list-disc list-inside">
                    <li>Stay on this page — the call opens here, not in another tab</li>
                    <li>Find a quiet, private space</li>
                    <li>Have your questions ready</li>
                    <li>Allow camera and microphone access when asked</li>
                  </ul>
                </div>
              </CardContent>
            </Card>

            {/* Notes */}
            {consultation.notes && (
              <Card className="border-[#E5E5E5] bg-white text-[#2C3E2D]">
                <CardHeader>
                  <CardTitle className="text-[#2C3E2D] text-base">Your Notes</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-[#2C3E2D] whitespace-pre-wrap">{consultation.notes}</p>
                </CardContent>
              </Card>
            )}

            {/* Support */}
            <Card className="border-[#E5E5E5] bg-[#2C3E2D] text-white">
              <CardContent className="p-4">
                <h4 className="font-semibold mb-2 text-white">Connection Issues?</h4>
                <p className="text-sm text-gray-200 mb-4">
                  Allow camera and microphone access in your browser, then refresh this page. The call stays here so you do not need a second tab.
                </p>
                <Button 
                  variant="outline" 
                  className="w-full border-white text-white hover:bg-white hover:text-[#2C3E2D]"
                  onClick={() => router.push('/support')}
                >
                  Get Help
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  );
}
