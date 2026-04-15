'use client';

import { useEffect, useState, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { doc, getDoc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase/client';
import { 
  Calendar, 
  ArrowLeft,
  Video,
  Phone,
  Clock,
  User,
  Copy,
  ExternalLink,
  AlertCircle,
  Mic,
  MicOff,
  Camera,
  CameraOff,
  PhoneOff,
  RefreshCw
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface Consultation {
  id: string;
  practitionerName: string;
  practitionerImage?: string;
  patientName: string;
  patientId: string;
  practitionerId: string;
  date: string;
  time: string;
  status: 'scheduled' | 'in-progress' | 'completed' | 'cancelled';
  type: 'video' | 'audio' | 'chat';
  notes?: string;
  dailyRoomUrl?: string;
  dailyRoomName?: string;
  startedAt?: any;
  endedAt?: any;
}

export default function ConsultationRoom() {
  const params = useParams();
  const router = useRouter();
  const consultationId = params.id as string;
  const iframeRef = useRef<HTMLIFrameElement>(null);
  
  const [consultation, setConsultation] = useState<Consultation | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [creatingRoom, setCreatingRoom] = useState(false);
  const [callActive, setCallActive] = useState(false);
  const [isAudioOnly, setIsAudioOnly] = useState(false);

  useEffect(() => {
    loadConsultation();
  }, [consultationId]);

  const loadConsultation = async () => {
    try {
      const docRef = doc(db, 'consultations', consultationId);
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        const data = { id: docSnap.id, ...docSnap.data() } as Consultation;
        setConsultation(data);
        setIsAudioOnly(data.type === 'audio');
        
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

  const startCall = async () => {
    if (!consultation?.dailyRoomUrl) return;
    
    try {
      // Update status to in-progress
      await updateDoc(doc(db, 'consultations', consultationId), {
        status: 'in-progress',
        startedAt: serverTimestamp()
      });
      
      setCallActive(true);
      setConsultation(prev => prev ? { ...prev, status: 'in-progress' } : null);
    } catch (error) {
      console.error('Error starting call:', error);
    }
  };

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

  const copyRoomLink = async () => {
    if (consultation?.dailyRoomUrl) {
      await navigator.clipboard.writeText(consultation.dailyRoomUrl);
      // Show toast or feedback
    }
  };

  const getDailyUrl = () => {
    if (!consultation?.dailyRoomUrl) return '';
    // Add parameters for audio-only mode if needed
    if (isAudioOnly) {
      return `${consultation.dailyRoomUrl}?video=off&audio=on`;
    }
    return consultation.dailyRoomUrl;
  };

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

  const isUpcoming = consultation.status === 'scheduled';
  const isActive = consultation.status === 'in-progress' || callActive;
  const isPast = consultation.status === 'completed' || consultation.status === 'cancelled';

  return (
    <div className="min-h-screen bg-[#F5F5F0]">
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
                <p className="text-sm text-gray-500">with {consultation.practitionerName}</p>
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
              
              {isActive && (
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
        <div className="grid lg:grid-cols-3 gap-6 h-[calc(100vh-140px)]">
          {/* Main Video Area */}
          <div className="lg:col-span-2 flex flex-col gap-4">
            {creatingRoom ? (
              <div className="flex-1 bg-gray-900 rounded-lg flex items-center justify-center text-white">
                <div className="text-center">
                  <RefreshCw className="w-12 h-12 animate-spin mx-auto mb-4 text-[#97A97C]" />
                  <p className="text-lg">Creating secure meeting room...</p>
                  <p className="text-sm text-gray-400 mt-2">This may take a moment</p>
                </div>
              </div>
            ) : consultation.dailyRoomUrl ? (
              <>
                <div className="flex-1 bg-gray-900 rounded-lg overflow-hidden relative">
                  {!callActive ? (
                    <div className="absolute inset-0 flex items-center justify-center text-white">
                      <div className="text-center p-8">
                        <div className="w-20 h-20 rounded-full bg-[#97A97C] mx-auto mb-4 flex items-center justify-center">
                          {consultation.type === 'audio' ? <Phone className="w-10 h-10" /> : <Video className="w-10 h-10" />}
                        </div>
                        <h3 className="text-2xl font-bold mb-2">Ready to Connect</h3>
                        <p className="text-gray-300 mb-6">
                          {consultation.type === 'audio' 
                            ? 'Start your audio consultation with your practitioner' 
                            : 'Start your video consultation with your practitioner'}
                        </p>
                        <div className="flex gap-3 justify-center">
                          <Button 
                            onClick={startCall} 
                            className="bg-[#97A97C] hover:bg-[#7A8A63] text-white px-8 py-6 text-lg"
                          >
                            <ExternalLink className="w-5 h-5 mr-2" />
                            Join {consultation.type === 'audio' ? 'Audio' : 'Video'} Call
                          </Button>
                        </div>
                        <p className="text-sm text-gray-400 mt-4">
                          Meeting ID: {consultation.dailyRoomName}
                        </p>
                      </div>
                    </div>
                  ) : (
                    <iframe
                      ref={iframeRef}
                      src={getDailyUrl()}
                      className="w-full h-full border-0"
                      allow="camera; microphone; fullscreen; speaker; display-capture"
                      title="Daily.co Meeting"
                    />
                  )}
                </div>

                {/* Call Controls */}
                {isActive && (
                  <div className="bg-white p-4 rounded-lg shadow flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <Button 
                        variant="outline" 
                        size="icon"
                        onClick={() => setIsAudioOnly(!isAudioOnly)}
                        className={isAudioOnly ? 'bg-yellow-100 border-yellow-300' : ''}
                        title={isAudioOnly ? "Switch to video" : "Switch to audio only"}
                      >
                        {isAudioOnly ? <Video className="w-5 h-5" /> : <Camera className="w-5 h-5" />}
                      </Button>
                      <span className="text-sm text-gray-600">
                        {isAudioOnly ? 'Audio Only Mode' : 'Video Enabled'}
                      </span>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <Button variant="outline" size="sm" onClick={copyRoomLink}>
                        <Copy className="w-4 h-4 mr-2" />
                        Copy Link
                      </Button>
                      <Button variant="outline" size="sm" onClick={() => window.open(getDailyUrl(), '_blank')}>
                        <ExternalLink className="w-4 h-4 mr-2" />
                        Open in New Tab
                      </Button>
                    </div>
                  </div>
                )}
              </>
            ) : (
              <div className="flex-1 bg-gray-100 rounded-lg flex items-center justify-center">
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
            <Card className="border-[#E5E5E5]">
              <CardHeader>
                <CardTitle className="text-[#2C3E2D] text-base flex items-center gap-2">
                  <User className="w-4 h-4 text-[#97A97C]" />
                  Session Details
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-500">Practitioner</span>
                  <span className="font-medium text-right">{consultation.practitionerName}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Date</span>
                  <span className="font-medium">{consultation.date}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Time</span>
                  <span className="font-medium">{consultation.time}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Type</span>
                  <span className="font-medium capitalize flex items-center gap-1">
                    {consultation.type === 'video' ? <Video className="w-3 h-3" /> : <Phone className="w-3 h-3" />}
                    {consultation.type}
                  </span>
                </div>
                <hr className="border-gray-200" />
                <div className="bg-[#97A97C]/10 p-3 rounded-lg">
                  <p className="text-xs font-semibold text-[#2C3E2D] mb-2">Preparation Tips</p>
                  <ul className="text-xs text-gray-600 space-y-1 list-disc list-inside">
                    <li>Join 5 minutes early to test your camera/mic</li>
                    <li>Find a quiet, private space</li>
                    <li>Have your questions ready</li>
                    <li>Ensure good lighting if using video</li>
                  </ul>
                </div>
              </CardContent>
            </Card>

            {/* Notes */}
            {consultation.notes && (
              <Card className="border-[#E5E5E5]">
                <CardHeader>
                  <CardTitle className="text-[#2C3E2D] text-base">Your Notes</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-gray-700 whitespace-pre-wrap">{consultation.notes}</p>
                </CardContent>
              </Card>
            )}

            {/* Support */}
            <Card className="border-[#E5E5E5] bg-[#2C3E2D] text-white">
              <CardContent className="p-4">
                <h4 className="font-semibold mb-2">Connection Issues?</h4>
                <p className="text-sm text-gray-300 mb-4">
                  If you're having trouble with video/audio, try opening the call in a new tab or contact support.
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