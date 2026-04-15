'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { 
  collection, 
  query, 
  where, 
  updateDoc, 
  doc, 
  addDoc, 
  serverTimestamp,
  deleteDoc,
  onSnapshot
} from 'firebase/firestore';
import { db } from '@/lib/firebase/client';
import { useAuth } from '@/providers/AuthProvider';
import { 
  Calendar, 
  Clock, 
  Video, 
  Phone, 
  Edit2, 
  CheckCircle, 
  XCircle, 
  Plus,
  Trash2,
  MoreVertical,
  Loader2,
  AlertCircle,
  Copy,
  Radio,
  TrendingUp,
  DollarSign,
  Users,
  Check
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
  DialogDescription,
} from '@/components/ui/dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { toast } from 'sonner';
import Link from 'next/link';

interface Consultation {
  id: string;
  patientName: string;
  patientEmail?: string;
  patientPhone?: string;
  patientId?: string;
  date: string;
  time: string;
  status: 'scheduled' | 'in-progress' | 'completed' | 'cancelled';
  type: 'video' | 'audio';
  notes?: string;
  dailyRoomUrl?: string | null;
  roomName?: string | null;
  linksUpdatedAt?: any;
  viewedAt?: any;
  createdAt: any;
}

export default function PractitionerDashboard() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const [consultations, setConsultations] = useState<Consultation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedConsultation, setSelectedConsultation] = useState<Consultation | null>(null);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isStatusDialogOpen, setIsStatusDialogOpen] = useState(false);
  const [newStatus, setNewStatus] = useState<string>('');
  const [creatingRoom, setCreatingRoom] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  
  const [formData, setFormData] = useState({
    patientName: '',
    patientEmail: '',
    patientPhone: '',
    date: '',
    time: '',
    type: 'video' as 'video' | 'audio',
    notes: ''
  });

  useEffect(() => {
    if (authLoading) return;
    
    if (!user) {
      router.push('/login');
      return;
    }
    
    loadConsultations();
  }, [user, authLoading, router]);

  const loadConsultations = async () => {
    if (!user?.uid) return;
    
    try {
      setLoading(true);
      setError(null);
      
      const q = query(
        collection(db, 'consultations'),
        where('practitionerId', '==', user.uid)
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
      }, (err) => {
        console.error('Error loading consultations:', err);
        setError(err.message);
        setLoading(false);
      });

      return () => unsubscribe();
    } catch (error: any) {
      console.error('Error loading consultations:', error);
      setError(error.message);
      setLoading(false);
    }
  };

  const handleCreateConsultation = async () => {
    if (!user?.uid) {
      toast.error('You must be logged in');
      return;
    }
    
    try {
      await addDoc(collection(db, 'consultations'), {
        ...formData,
        patientId: null,
        practitionerId: user.uid,
        practitionerName: user.displayName || 'Unknown Practitioner',
        status: 'scheduled',
        dailyRoomUrl: null,
        roomName: null,
        linksUpdatedAt: null,
        viewedAt: null,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });
      
      toast.success('Consultation created successfully');
      setIsCreateDialogOpen(false);
      resetForm();
    } catch (error: any) {
      console.error('Error creating consultation:', error);
      toast.error('Failed to create consultation: ' + error.message);
    }
  };

  const createDailyCoRoom = async (consultation: Consultation) => {
    setCreatingRoom(consultation.id);
    
    try {
      const response = await fetch('/api/daily/create-room', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          consultationId: consultation.id,
          roomName: `remedy-${consultation.id.slice(0, 8)}`,
          type: consultation.type
        })
      });

      if (!response.ok) throw new Error('Failed to create room');

      const { roomUrl, roomName } = await response.json();

      await updateDoc(doc(db, 'consultations', consultation.id), {
        dailyRoomUrl: roomUrl,
        roomName: roomName,
        linksUpdatedAt: serverTimestamp(),
        viewedAt: null
      });

      toast.success('Video room created! Patient will be notified.');
    } catch (error) {
      console.error('Error creating room:', error);
      toast.error('Failed to create video room');
    } finally {
      setCreatingRoom(null);
    }
  };

  const copyRoomLink = (url: string, id: string) => {
    navigator.clipboard.writeText(url);
    setCopiedId(id);
    toast.success('Link copied to clipboard');
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleStatusChange = async () => {
    if (!selectedConsultation || !newStatus) return;
    
    try {
      const updateData: any = {
        status: newStatus,
        updatedAt: serverTimestamp()
      };
      
      if (newStatus === 'completed') {
        updateData.completedAt = serverTimestamp();
      } else if (newStatus === 'cancelled') {
        updateData.cancelledAt = serverTimestamp();
      }
      
      await updateDoc(doc(db, 'consultations', selectedConsultation.id), updateData);
      
      toast.success(`Consultation marked as ${newStatus}`);
      setIsStatusDialogOpen(false);
      setNewStatus('');
    } catch (error: any) {
      toast.error('Failed to update status: ' + error.message);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this consultation?')) return;
    
    try {
      await deleteDoc(doc(db, 'consultations', id));
      toast.success('Consultation deleted');
    } catch (error) {
      toast.error('Failed to delete consultation');
    }
  };

  const openStatusDialog = (consultation: Consultation, status: string) => {
    setSelectedConsultation(consultation);
    setNewStatus(status);
    setIsStatusDialogOpen(true);
  };

  const resetForm = () => {
    setFormData({
      patientName: '',
      patientEmail: '',
      patientPhone: '',
      date: '',
      time: '',
      type: 'video',
      notes: ''
    });
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

  const getUpcomingConsultations = () => consultations.filter(c => c.status === 'scheduled');
  const getTodayConsultations = () => {
    const today = new Date().toISOString().split('T')[0];
    return consultations.filter(c => c.date === today && c.status === 'scheduled');
  };
  const getPastConsultations = () => consultations.filter(c => ['completed', 'cancelled'].includes(c.status));

  const stats = {
    total: consultations.length,
    upcoming: getUpcomingConsultations().length,
    today: getTodayConsultations().length,
    completed: consultations.filter(c => c.status === 'completed').length
  };

  if (authLoading) {
    return (
      <div className="min-h-screen bg-[#F5F5F0] flex items-center justify-center">
        <Loader2 className="w-12 h-12 animate-spin text-[#97A97C]" />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-[#F5F5F0] flex items-center justify-center">
        <div className="text-center">
          <AlertCircle className="w-16 h-16 text-orange-500 mx-auto mb-4" />
          <h1 className="text-2xl font-bold mb-4">Access Denied</h1>
          <Button onClick={() => router.push('/login')} className="bg-[#97A97C]">
            Go to Login
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F5F5F0] pb-12">
      {/* Header */}
      <div className="bg-gradient-to-r from-[#2C3E2D] to-[#3d5238] text-white py-8 px-4">
        <div className="max-w-6xl mx-auto">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold">Practitioner Dashboard</h1>
              <p className="text-white/70 mt-1">Manage your consultations and patients</p>
            </div>
            <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
              <DialogTrigger asChild>
                <Button className="bg-white text-[#2C3E2D] hover:bg-gray-100">
                  <Plus className="w-4 h-4 mr-2" />
                  New Consultation
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>Schedule New Consultation</DialogTitle>
                  <DialogDescription>Create a new consultation for a patient.</DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Patient Name *</Label>
                      <Input
                        value={formData.patientName}
                        onChange={(e) => setFormData({...formData, patientName: e.target.value})}
                        placeholder="John Doe"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Patient Email</Label>
                      <Input
                        type="email"
                        value={formData.patientEmail}
                        onChange={(e) => setFormData({...formData, patientEmail: e.target.value})}
                        placeholder="patient@email.com"
                      />
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-3 gap-4">
                    <div className="space-y-2">
                      <Label>Date *</Label>
                      <Input
                        type="date"
                        value={formData.date}
                        onChange={(e) => setFormData({...formData, date: e.target.value})}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Time *</Label>
                      <Input
                        type="time"
                        value={formData.time}
                        onChange={(e) => setFormData({...formData, time: e.target.value})}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="consultation-type">Type</Label>
                      <select
                        id="consultation-type"
                        className="w-full h-10 px-3 rounded-md border border-input bg-background"
                        value={formData.type}
                        onChange={(e) => setFormData({...formData, type: e.target.value as 'video' | 'audio'})}
                        aria-label="Consultation type"
                        title="Consultation type"
                      >
                        <option value="video">Video Call</option>
                        <option value="audio">Audio Call</option>
                      </select>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label>Notes</Label>
                    <textarea
                      className="w-full min-h-[100px] px-3 py-2 rounded-md border border-input bg-background"
                      value={formData.notes}
                      onChange={(e) => setFormData({...formData, notes: e.target.value})}
                      placeholder="Patient symptoms, concerns, etc."
                    />
                  </div>
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button 
                    onClick={handleCreateConsultation}
                    disabled={!formData.patientName || !formData.date || !formData.time}
                    className="bg-[#97A97C] hover:bg-[#7A8A63]"
                  >
                    Create Consultation
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 -mt-6">
        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Total</p>
                  <p className="text-2xl font-bold text-[#2C3E2D]">{stats.total}</p>
                </div>
                <Users className="w-8 h-8 text-[#97A97C]" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Upcoming</p>
                  <p className="text-2xl font-bold text-[#2C3E2D]">{stats.upcoming}</p>
                </div>
                <Calendar className="w-8 h-8 text-blue-500" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Today</p>
                  <p className="text-2xl font-bold text-[#2C3E2D]">{stats.today}</p>
                </div>
                <Clock className="w-8 h-8 text-orange-500" />
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
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-800 p-4 rounded-lg mb-6">
            <p className="font-medium">Error: {error}</p>
          </div>
        )}

        <div className="grid lg:grid-cols-3 gap-6">
          {/* Left Column */}
          <div className="lg:col-span-2 space-y-6">
            
            {/* Today's Schedule */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Clock className="w-5 h-5 text-[#97A97C]" />
                  Today's Schedule
                </CardTitle>
              </CardHeader>
              <CardContent>
                {getTodayConsultations().length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    <Clock className="w-12 h-12 mx-auto mb-2 text-gray-300" />
                    <p>No consultations scheduled for today</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {getTodayConsultations().map((consultation) => (
                      <div key={consultation.id} className="border rounded-lg p-4 bg-white">
                        <div className="flex justify-between items-start mb-3">
                          <div>
                            <h3 className="font-semibold text-lg">{consultation.patientName}</h3>
                            <p className="text-gray-600 flex items-center gap-2">
                              <Clock className="w-4 h-4" />
                              {consultation.time} • {consultation.type === 'video' ? 'Video' : 'Audio'} Call
                            </p>
                            {consultation.patientEmail && (
                              <p className="text-sm text-gray-500">{consultation.patientEmail}</p>
                            )}
                          </div>
                          <Badge className={consultation.dailyRoomUrl ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}>
                            {consultation.dailyRoomUrl ? 'Ready' : 'Pending'}
                          </Badge>
                        </div>

                        {consultation.notes && (
                          <p className="text-sm text-gray-600 bg-gray-50 p-2 rounded mb-3">
                            <span className="font-medium">Notes:</span> {consultation.notes}
                          </p>
                        )}

                        <div className="flex gap-2 flex-wrap">
                          {consultation.dailyRoomUrl ? (
                            <>
                              <Button 
                                size="sm"
                                onClick={() => window.open(consultation.dailyRoomUrl!, '_blank')}
                                className="bg-[#97A97C] hover:bg-[#7A8A63]"
                              >
                                <Video className="w-4 h-4 mr-2" />
                                Join Call
                              </Button>
                              <Button 
                                size="sm"
                                variant="outline"
                                onClick={() => copyRoomLink(consultation.dailyRoomUrl!, consultation.id)}
                              >
                                {copiedId === consultation.id ? <Check className="w-4 h-4 mr-2" /> : <Copy className="w-4 h-4 mr-2" />}
                                {copiedId === consultation.id ? 'Copied!' : 'Copy Link'}
                              </Button>
                            </>
                          ) : (
                            <Button 
                              size="sm"
                              onClick={() => createDailyCoRoom(consultation)}
                              disabled={creatingRoom === consultation.id}
                            >
                              {creatingRoom === consultation.id ? (
                                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                              ) : (
                                <Plus className="w-4 h-4 mr-2" />
                              )}
                              Create Room
                            </Button>
                          )}
                          
                          <Button 
                            size="sm"
                            variant="outline"
                            onClick={() => openStatusDialog(consultation, 'completed')}
                            className="ml-auto"
                          >
                            <CheckCircle className="w-4 h-4 mr-2" />
                            Complete
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Upcoming */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Calendar className="w-5 h-5 text-[#97A97C]" />
                  Upcoming Consultations
                </CardTitle>
              </CardHeader>
              <CardContent>
                {getUpcomingConsultations().length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    <Calendar className="w-12 h-12 mx-auto mb-2 text-gray-300" />
                    <p>No upcoming consultations</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {getUpcomingConsultations().map((consultation) => (
                      <div 
                        key={consultation.id} 
                        className="flex items-center justify-between p-4 bg-gray-50 rounded-lg border hover:border-[#97A97C] transition-colors"
                      >
                        <div className="flex items-center gap-4">
                          <div className="w-10 h-10 rounded-full bg-[#97A97C] flex items-center justify-center text-white font-bold">
                            {consultation.patientName?.charAt(0) || '?'}
                          </div>
                          <div>
                            <h4 className="font-semibold">{consultation.patientName}</h4>
                            <p className="text-sm text-gray-600">
                              {consultation.date} • {consultation.time} • {consultation.type}
                            </p>
                          </div>
                        </div>
                        
                        <div className="flex items-center gap-2">
                          {consultation.dailyRoomUrl ? (
                            <Badge className="bg-green-100 text-green-800">
                              <Radio className="w-3 h-3 mr-1" />
                              Ready
                            </Badge>
                          ) : (
                            <Button 
                              size="sm"
                              variant="outline"
                              onClick={() => createDailyCoRoom(consultation)}
                              disabled={creatingRoom === consultation.id}
                            >
                              {creatingRoom === consultation.id ? (
                                <Loader2 className="w-4 h-4 animate-spin" />
                              ) : (
                                <Plus className="w-4 h-4" />
                              )}
                            </Button>
                          )}
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon">
                                <MoreVertical className="w-4 h-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem onClick={() => openStatusDialog(consultation, 'completed')}>
                                <CheckCircle className="w-4 h-4 mr-2 text-green-600" />
                                Mark Complete
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => openStatusDialog(consultation, 'cancelled')}>
                                <XCircle className="w-4 h-4 mr-2 text-red-600" />
                                Cancel
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => handleDelete(consultation.id)} className="text-red-600">
                                <Trash2 className="w-4 h-4 mr-2" />
                                Delete
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Right Column */}
          <div className="space-y-6">
            {/* Quick Actions */}
            <Card>
              <CardHeader>
                <CardTitle>Quick Actions</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <Button 
                  className="w-full bg-[#97A97C] hover:bg-[#7A8A63]"
                  onClick={() => setIsCreateDialogOpen(true)}
                >
                  <Plus className="w-4 h-4 mr-2" />
                  New Consultation
                </Button>
                <Link href="/practitioners/profile/edit">
                  <Button variant="outline" className="w-full">
                    <Edit2 className="w-4 h-4 mr-2" />
                    Edit Profile
                  </Button>
                </Link>
              </CardContent>
            </Card>

            {/* History */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CheckCircle className="w-5 h-5 text-gray-500" />
                  Recent History
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3 max-h-96 overflow-y-auto">
                  {getPastConsultations().slice(0, 5).map((consultation) => (
                    <div key={consultation.id} className="p-3 bg-gray-50 rounded border text-sm">
                      <div className="flex justify-between items-start">
                        <span className="font-medium">{consultation.patientName}</span>
                        <Badge className={getStatusBadge(consultation.status)}>
                          {consultation.status}
                        </Badge>
                      </div>
                      <p className="text-gray-500 text-xs mt-1">
                        {consultation.date} • {consultation.type}
                      </p>
                    </div>
                  ))}
                  {getPastConsultations().length === 0 && (
                    <p className="text-center text-gray-500 py-4 text-sm">No past consultations</p>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      {/* Status Dialog */}
      <Dialog open={isStatusDialogOpen} onOpenChange={setIsStatusDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirm Status Change</DialogTitle>
            <DialogDescription>
              Mark this consultation as {newStatus}?
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsStatusDialogOpen(false)}>
              Cancel
            </Button>
            <Button 
              onClick={handleStatusChange}
              className={newStatus === 'completed' ? 'bg-green-600 hover:bg-green-700' : 'bg-red-600 hover:bg-red-700'}
            >
              Confirm {newStatus}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}