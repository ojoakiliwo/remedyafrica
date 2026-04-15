'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase/client';
import { useAuth } from '@/providers/AuthProvider';
import { Consultation } from '@/types/consultation';
import { 
  Calendar, 
  Clock, 
  User, 
  Video, 
  Phone, 
  ChevronLeft,
  ChevronRight,
  CheckCircle,
  Loader2
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { toast } from 'sonner';

interface BookingData {
  practitionerId: string;
  practitionerName: string;
  date: string;
  time: string;
  type: 'video' | 'audio';
  notes: string;
}

const timeSlots = [
  '09:00', '09:30', '10:00', '10:30', '11:00', '11:30',
  '14:00', '14:30', '15:00', '15:30', '16:00', '16:30'
];

const practitioners = [
  { id: '1', name: 'Dr. Sarah Johnson', specialty: 'Traditional Herbalist', image: '/placeholder.jpg' },
  { id: '2', name: 'Dr. Michael Chen', specialty: 'Chinese Medicine', image: '/placeholder.jpg' },
  { id: '3', name: 'Amina Okafor', specialty: 'African Traditional Medicine', image: '/placeholder.jpg' },
];

export default function BookingPage() {
  const router = useRouter();
  const { user } = useAuth();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [bookingData, setBookingData] = useState<BookingData>({
    practitionerId: '',
    practitionerName: '',
    date: '',
    time: '',
    type: 'video',
    notes: ''
  });

  const handlePractitionerSelect = (practitioner: typeof practitioners[0]) => {
    setBookingData({ ...bookingData, practitionerId: practitioner.id, practitionerName: practitioner.name });
    setStep(2);
  };

  const handleDateSelect = (date: string) => {
    setBookingData({ ...bookingData, date });
  };

  const handleTimeSelect = (time: string) => {
    setBookingData({ ...bookingData, time });
  };

  const handleSubmit = async () => {
    if (!user) {
      toast.error('Please sign in to book a consultation');
      router.push('/login');
      return;
    }

    setLoading(true);
    try {
      const consultationData: Omit<Consultation, 'id'> = {
        patientId: user.uid,
        patientName: user.displayName || user.email?.split('@')[0] || 'Unknown',
        patientEmail: user.email || '',
        practitionerId: bookingData.practitionerId,
        practitionerName: bookingData.practitionerName,
        date: bookingData.date,
        time: bookingData.time,
        type: bookingData.type,
        status: 'scheduled',
        notes: bookingData.notes,
        // Daily.co fields - practitioner will add these later
        dailyRoomUrl: null,
        roomName: null,
        linksUpdatedAt: null,
        viewedAt: null,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      };

      await addDoc(collection(db, 'consultations'), consultationData);

      toast.success('Consultation booked successfully! The practitioner will create a meeting room shortly.');
      router.push('/profile'); // Redirect to profile instead of dashboard
    } catch (error) {
      console.error('Error booking consultation:', error);
      toast.error('Failed to book consultation');
    } finally {
      setLoading(false);
    }
  };

  const getDates = () => {
    const dates = [];
    const today = new Date();
    for (let i = 1; i <= 14; i++) {
      const date = new Date(today);
      date.setDate(today.getDate() + i);
      dates.push({
        value: date.toISOString().split('T')[0],
        display: date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })
      });
    }
    return dates;
  };

  return (
    <div className="min-h-screen bg-[#F5F5F0]">
      {/* Header */}
      <header className="bg-white border-b border-[#E5E5E5]">
        <div className="max-w-4xl mx-auto px-4 py-6">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={() => step > 1 ? setStep(step - 1) : router.push('/')}>
              <ChevronLeft className="w-5 h-5" />
            </Button>
            <div>
              <h1 className="text-2xl font-bold text-[#2C3E2D]">Book Consultation</h1>
              <p className="text-gray-600">Step {step} of 3</p>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-8">
        {/* Progress Bar */}
        <div className="flex gap-2 mb-8">
          {[1, 2, 3].map((i) => (
            <div 
              key={i}
              className={`flex-1 h-2 rounded-full ${i <= step ? 'bg-[#97A97C]' : 'bg-gray-200'}`}
            />
          ))}
        </div>

        {/* Step 1: Select Practitioner */}
        {step === 1 && (
          <div className="space-y-6">
            <div>
              <h2 className="text-xl font-semibold text-[#2C3E2D] mb-2">Choose Your Practitioner</h2>
              <p className="text-gray-600">Select a herbalist for your consultation</p>
            </div>

            <div className="grid md:grid-cols-3 gap-4">
              {practitioners.map((practitioner) => (
                <Card 
                  key={practitioner.id}
                  className={`cursor-pointer transition-all hover:border-[#97A97C] ${
                    bookingData.practitionerId === practitioner.id ? 'border-[#97A97C] border-2' : ''
                  }`}
                  onClick={() => handlePractitionerSelect(practitioner)}
                >
                  <CardContent className="p-6 text-center">
                    <div className="w-20 h-20 rounded-full bg-[#97A97C] mx-auto mb-4 flex items-center justify-center text-white text-2xl font-bold">
                      {practitioner.name.charAt(0)}
                    </div>
                    <h3 className="font-semibold text-[#2C3E2D]">{practitioner.name}</h3>
                    <p className="text-sm text-gray-600 mt-1">{practitioner.specialty}</p>
                    {bookingData.practitionerId === practitioner.id && (
                      <CheckCircle className="w-5 h-5 text-[#97A97C] mx-auto mt-2" />
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}

        {/* Step 2: Select Date & Time */}
        {step === 2 && (
          <div className="space-y-6">
            <div>
              <h2 className="text-xl font-semibold text-[#2C3E2D] mb-2">Select Date & Time</h2>
              <p className="text-gray-600">Choose when you'd like to meet with {bookingData.practitionerName}</p>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">Date</label>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                  {getDates().map((date) => (
                    <button
                      key={date.value}
                      onClick={() => handleDateSelect(date.value)}
                      className={`p-3 rounded-lg border text-sm transition-colors ${
                        bookingData.date === date.value 
                          ? 'bg-[#97A97C] text-white border-[#97A97C]' 
                          : 'bg-white border-gray-200 hover:border-[#97A97C]'
                      }`}
                    >
                      {date.display}
                    </button>
                  ))}
                </div>
              </div>

              {bookingData.date && (
                <div>
                  <label className="block text-sm font-medium mb-2">Time</label>
                  <div className="grid grid-cols-3 md:grid-cols-4 gap-2">
                    {timeSlots.map((time) => (
                      <button
                        key={time}
                        onClick={() => handleTimeSelect(time)}
                        className={`p-3 rounded-lg border text-sm transition-colors ${
                          bookingData.time === time 
                            ? 'bg-[#97A97C] text-white border-[#97A97C]' 
                            : 'bg-white border-gray-200 hover:border-[#97A97C]'
                        }`}
                      >
                        {time}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {bookingData.date && bookingData.time && (
              <div className="flex justify-end">
                <Button 
                  onClick={() => setStep(3)}
                  className="bg-[#97A97C] hover:bg-[#7A8A63]"
                >
                  Continue
                  <ChevronRight className="w-4 h-4 ml-2" />
                </Button>
              </div>
            )}
          </div>
        )}

        {/* Step 3: Consultation Details */}
        {step === 3 && (
          <div className="space-y-6">
            <div>
              <h2 className="text-xl font-semibold text-[#2C3E2D] mb-2">Consultation Details</h2>
              <p className="text-gray-600">Add final details for your session</p>
            </div>

            <Card>
              <CardContent className="p-6 space-y-6">
                {/* Consultation Type */}
                <div>
                  <label className="block text-sm font-medium mb-3">Consultation Type</label>
                  <div className="grid grid-cols-2 gap-3">
                    <button
                      onClick={() => setBookingData({...bookingData, type: 'video'})}
                      className={`p-4 rounded-lg border flex flex-col items-center gap-2 transition-colors ${
                        bookingData.type === 'video' 
                          ? 'border-[#97A97C] bg-[#97A97C]/10' 
                          : 'border-gray-200 hover:border-[#97A97C]'
                      }`}
                    >
                      <Video className="w-6 h-6" />
                      <span className="text-sm font-medium">Video Call</span>
                    </button>
                    <button
                      onClick={() => setBookingData({...bookingData, type: 'audio'})}
                      className={`p-4 rounded-lg border flex flex-col items-center gap-2 transition-colors ${
                        bookingData.type === 'audio' 
                          ? 'border-[#97A97C] bg-[#97A97C]/10' 
                          : 'border-gray-200 hover:border-[#97A97C]'
                      }`}
                    >
                      <Phone className="w-6 h-6" />
                      <span className="text-sm font-medium">Audio Call</span>
                    </button>
                  </div>
                  <p className="text-xs text-gray-500 mt-2">
                    The practitioner will create a secure {bookingData.type} room for your consultation.
                  </p>
                </div>

                {/* Notes */}
                <div>
                  <label className="block text-sm font-medium mb-2">Notes for Practitioner (Optional)</label>
                  <textarea
                    className="w-full min-h-[100px] p-3 border rounded-lg focus:ring-2 focus:ring-[#97A97C] focus:border-transparent"
                    placeholder="Describe your symptoms, concerns, or questions..."
                    value={bookingData.notes}
                    onChange={(e) => setBookingData({...bookingData, notes: e.target.value})}
                  />
                </div>

                {/* Summary */}
                <div className="bg-gray-50 p-4 rounded-lg space-y-2">
                  <h4 className="font-medium">Booking Summary</h4>
                  <div className="text-sm text-gray-600 space-y-1">
                    <p><span className="font-medium">Practitioner:</span> {bookingData.practitionerName}</p>
                    <p><span className="font-medium">Date:</span> {bookingData.date}</p>
                    <p><span className="font-medium">Time:</span> {bookingData.time}</p>
                    <p><span className="font-medium">Type:</span> {bookingData.type === 'video' ? 'Video Call' : 'Audio Call'}</p>
                  </div>
                </div>

                <Button 
                  onClick={handleSubmit}
                  disabled={loading}
                  className="w-full bg-[#97A97C] hover:bg-[#7A8A63] h-12"
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Booking...
                    </>
                  ) : (
                    'Confirm Booking'
                  )}
                </Button>
              </CardContent>
            </Card>
          </div>
        )}
      </main>
    </div>
  );
}