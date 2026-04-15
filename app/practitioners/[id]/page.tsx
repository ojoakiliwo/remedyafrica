'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { doc, getDoc, addDoc, collection, serverTimestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase/client';

interface Practitioner {
  id: string;
  name: string;
  title: string;
  specialty: string;
  location: string;
  experience: number;
  rating: number;
  reviews: number;
  imageUrl: string;
  bio: string;
  consultationFee: number;
  isVerified: boolean;
  languages: string[];
  certifications: string[];
  services: string[];
}

export default function PractitionerProfilePage() {
  const params = useParams();
  const router = useRouter();
  const [practitioner, setPractitioner] = useState<Practitioner | null>(null);
  const [loading, setLoading] = useState(true);
  const [showBookingModal, setShowBookingModal] = useState(false);
  const [bookingData, setBookingData] = useState({
    date: '',
    time: '',
    type: 'video',
    notes: ''
  });
  const [bookingLoading, setBookingLoading] = useState(false);

  useEffect(() => {
    loadPractitioner();
  }, [params.id]);

  const loadPractitioner = async () => {
    try {
      const docRef = doc(db, 'practitioners', params.id as string);
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        setPractitioner({ id: docSnap.id, ...docSnap.data() } as Practitioner);
      }
    } catch (error) {
      console.error('Error loading practitioner:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleBookConsultation = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!practitioner) return;
    
    setBookingLoading(true);
    try {
      // Create consultation record
      const consultationRef = await addDoc(collection(db, 'consultations'), {
        practitionerId: practitioner.id,
        practitionerName: practitioner.name,
        practitionerImage: practitioner.imageUrl,
        patientId: 'current-user-id', // TODO: Get from auth
        patientName: 'Current User', // TODO: Get from auth
        date: bookingData.date,
        time: bookingData.time,
        type: bookingData.type,
        status: 'scheduled',
        notes: bookingData.notes,
        createdAt: serverTimestamp(),
        roomUrl: null // Will be created when call starts
      });
      
      // Close modal
      setShowBookingModal(false);
      
      // Redirect to consultation room
      router.push(`/consultation/${consultationRef.id}`);
    } catch (error) {
      console.error('Error booking:', error);
      alert('Error booking consultation. Please try again.');
    } finally {
      setBookingLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#F5F5F0] flex items-center justify-center">
        <div className="text-[#97A97C] text-xl">Loading...</div>
      </div>
    );
  }

  if (!practitioner) {
    return (
      <div className="min-h-screen bg-[#F5F5F0] flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-[#2C3E2D]">Practitioner not found</h1>
          <Link href="/practitioners" className="text-[#97A97C] hover:underline mt-4 inline-block">
            Back to Directory
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F5F5F0]">
      {/* Booking Modal */}
      {showBookingModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-md w-full p-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-bold text-[#2C3E2D]">Book Consultation</h3>
              <button 
                onClick={() => setShowBookingModal(false)}
                className="text-gray-500 hover:text-gray-700"
                aria-label="Close booking modal"
              >
                ✕
              </button>
            </div>
            
            <div className="mb-4 p-4 bg-gray-50 rounded">
              <p className="font-semibold">{practitioner.name}</p>
              <p className="text-sm text-gray-600">{practitioner.title}</p>
              <p className="text-[#97A97C] font-bold mt-2">${practitioner.consultationFee}/session</p>
            </div>

            <form onSubmit={handleBookConsultation} className="space-y-4">
              <div>
                <label htmlFor="booking-date" className="block text-sm font-semibold mb-1">Preferred Date</label>
                <input 
                  id="booking-date"
                  type="date" 
                  required
                  value={bookingData.date}
                  onChange={(e) => setBookingData({...bookingData, date: e.target.value})}
                  className="w-full p-2 border rounded"
                  min={new Date().toISOString().split('T')[0]}
                />
              </div>
              
              <div>
                <label htmlFor="booking-time" className="block text-sm font-semibold mb-1">Preferred Time</label>
                <input 
                  id="booking-time"
                  type="time" 
                  required
                  value={bookingData.time}
                  onChange={(e) => setBookingData({...bookingData, time: e.target.value})}
                  className="w-full p-2 border rounded"
                />
              </div>
              
              <div>
                <label htmlFor="booking-type" className="block text-sm font-semibold mb-1">Consultation Type</label>
                <select 
                  id="booking-type"
                  value={bookingData.type}
                  onChange={(e) => setBookingData({...bookingData, type: e.target.value})}
                  className="w-full p-2 border rounded"
                >
                  <option value="video">Video Call</option>
                  <option value="audio">Voice Call</option>
                  <option value="chat">Text Chat</option>
                </select>
              </div>
              
              <div>
                <label htmlFor="booking-notes" className="block text-sm font-semibold mb-1">Describe your concern (optional)</label>
                <textarea 
                  id="booking-notes"
                  value={bookingData.notes}
                  onChange={(e) => setBookingData({...bookingData, notes: e.target.value})}
                  className="w-full p-2 border rounded" 
                  rows={3}
                  placeholder="Briefly describe your symptoms or questions..."
                ></textarea>
              </div>
              
              <button 
                type="submit" 
                disabled={bookingLoading}
                className="w-full bg-[#97A97C] text-white py-3 rounded-lg font-bold hover:bg-[#7A8A63] disabled:opacity-50"
              >
                {bookingLoading ? 'Booking...' : 'Confirm & Pay $' + practitioner.consultationFee}
              </button>
            </form>
          </div>
        </div>
      )}

      <div className="bg-[#2C3E2D] text-white py-12 px-4">
        <div className="max-w-4xl mx-auto">
          <Link href="/practitioners" className="text-[#97A97C] hover:underline mb-4 inline-block">
            ← Back to Practitioners
          </Link>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-12">
        <div className="bg-white rounded-lg shadow-lg overflow-hidden">
          <div className="md:flex">
            <div className="md:w-1/3 bg-gray-200 h-64 md:h-auto relative">
              {practitioner.imageUrl ? (
                <img 
                  src={practitioner.imageUrl} 
                  alt={`Portrait of ${practitioner.name}`}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center bg-[#97A97C] text-white text-6xl">
                  👤
                </div>
              )}
            </div>
            
            <div className="md:w-2/3 p-8">
              <div className="flex justify-between items-start">
                <div>
                  <h1 className="text-3xl font-bold text-[#2C3E2D] mb-1">{practitioner.name}</h1>
                  <p className="text-[#97A97C] text-lg mb-2">{practitioner.title}</p>
                  <div className="flex items-center gap-4 text-sm text-gray-600 mb-4">
                    <span>📍 {practitioner.location}</span>
                    <span>⭐ {practitioner.rating} ({practitioner.reviews} reviews)</span>
                    {practitioner.isVerified && (
                      <span className="text-blue-600 font-semibold">✓ Verified</span>
                    )}
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-3xl font-bold text-[#2C3E2D]">${practitioner.consultationFee}</p>
                  <p className="text-sm text-gray-500">per consultation</p>
                </div>
              </div>

              <p className="text-gray-700 mb-6 leading-relaxed">{practitioner.bio}</p>

              <div className="grid grid-cols-2 gap-4 mb-6">
                <div className="bg-[#F5F5F0] p-4 rounded">
                  <p className="text-sm text-gray-600">Experience</p>
                  <p className="font-bold text-[#2C3E2D]">{practitioner.experience} years</p>
                </div>
                <div className="bg-[#F5F5F0] p-4 rounded">
                  <p className="text-sm text-gray-600">Languages</p>
                  <p className="font-bold text-[#2C3E2D]">{practitioner.languages?.join(', ')}</p>
                </div>
              </div>

              <button 
                onClick={() => setShowBookingModal(true)}
                className="w-full md:w-auto bg-[#97A97C] text-white px-8 py-3 rounded-lg font-bold hover:bg-[#7A8A63] transition-colors"
              >
                Book Consultation
              </button>
            </div>
          </div>

          <div className="p-8 border-t">
            <h3 className="text-xl font-bold text-[#2C3E2D] mb-4">Services Offered</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {practitioner.services?.map((service, idx) => (
                <div key={idx} className="flex items-center gap-2">
                  <span className="text-[#97A97C]">✓</span>
                  <span>{service}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="p-8 border-t bg-gray-50">
            <h3 className="text-xl font-bold text-[#2C3E2D] mb-4">Medicine Delivery</h3>
            <p className="text-gray-700 mb-4">
              This practitioner can prepare and send customized herbal formulations directly to you. 
              Discuss medicine preparation and delivery terms during your consultation.
            </p>
            <div className="bg-yellow-50 border-l-4 border-yellow-500 p-4">
              <p className="text-yellow-800 text-sm">
                <strong>Note:</strong> All medicine deliveries are arranged directly between you and the practitioner. 
                RemedyAfrica facilitates the connection but is not responsible for delivery or product quality.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}