'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { doc, getDoc, addDoc, collection, serverTimestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase/client';
import { useAuth } from '@/hooks/useAuth';
import { resolvePractitionerBookingIds } from '@/lib/consultations/booking';
import { resolvePractitionerReservedPath } from '@/lib/practitioners/routes';

interface Practitioner {
  id: string;
  userId?: string;
  name: string;
  title?: string;
  specialty: string;
  location: string;
  experience: number;
  rating: number;
  reviews: number;
  photoURL?: string;
  imageUrl?: string;
  bio: string;
  consultationFee: number;
  isVerified: boolean;
  languages?: string[];
  certifications?: string[];
  services?: string[];
}

export default function PractitionerProfilePage() {
  const params = useParams();
  const router = useRouter();
  const { user } = useAuth();
  const reservedPath = resolvePractitionerReservedPath(params.id as string);
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
    const reserved = resolvePractitionerReservedPath(params.id as string);
    if (reserved) {
      router.replace(reserved);
      return;
    }
    if (params.id) loadPractitioner();
  }, [params.id, router]);

  const loadPractitioner = async () => {
    try {
      const docRef = doc(db, 'practitioners', params.id as string);
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        const raw = docSnap.data();
        setPractitioner({
          id: docSnap.id,
          userId: raw.userId || '',
          name: raw.name || 'Unknown',
          title: raw.title || raw.specialty || 'Practitioner',
          specialty: raw.specialty || 'General',
          location: raw.location || '',
          experience: raw.experience || 0,
          rating: raw.rating || 0,
          reviews: raw.reviews || 0,
          photoURL: raw.photoURL || raw.imageUrl || '',
          bio: raw.bio || '',
          consultationFee: raw.consultationFee || 0,
          isVerified: raw.isVerified === true,
          languages: Array.isArray(raw.languages) ? raw.languages : [],
          certifications: Array.isArray(raw.certifications) ? raw.certifications : [],
          services: Array.isArray(raw.services) ? raw.services : []
        });
      }
    } catch (error) {
      console.error('Error loading practitioner:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleBookConsultation = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!practitioner || !user) {
      router.push('/login');
      return;
    }
    
    setBookingLoading(true);
    try {
      const bookingIds = resolvePractitionerBookingIds({
        id: practitioner.id,
        userId: practitioner.userId,
      });
      const consultationRef = await addDoc(collection(db, 'consultations'), {
        practitionerId: bookingIds.practitionerId,
        practitionerProfileId: bookingIds.practitionerProfileId,
        practitionerName: practitioner.name,
        practitionerImage: practitioner.photoURL || practitioner.imageUrl || '',
        patientId: user.uid,
        patientName: user.displayName || 'Patient',
        patientEmail: user.email,
        date: bookingData.date,
        time: bookingData.time,
        type: bookingData.type,
        status: 'scheduled',
        notes: bookingData.notes,
        createdAt: serverTimestamp(),
        dailyRoomUrl: null,
        roomName: null,
        roomUrl: null,
      });
      
      setShowBookingModal(false);
      router.push(`/consultation/${consultationRef.id}`);
    } catch (error) {
      console.error('Error booking:', error);
      alert('Error booking consultation. Please try again.');
    } finally {
      setBookingLoading(false);
    }
  };

  if (reservedPath || loading) {
    return (
      <div className="min-h-screen bg-cream flex items-center justify-center">
        <div className="text-bronze text-xl">Loading...</div>
      </div>
    );
  }

  if (!practitioner) {
    return (
      <div className="min-h-screen bg-cream flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-forest">Practitioner not found</h1>
          <Link href="/practitioners" className="text-bronze hover:underline mt-4 inline-block">
            Back to Directory
          </Link>
        </div>
      </div>
    );
  }

  const displayImage = practitioner.photoURL || practitioner.imageUrl;

  return (
    <div className="min-h-screen bg-cream">
      {/* Booking Modal */}
      {showBookingModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white text-ink rounded-lg max-w-md w-full p-6" style={{ colorScheme: 'light' }}>
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-bold text-forest">Book Consultation</h3>
              <button 
                onClick={() => setShowBookingModal(false)}
                className="text-ink-muted hover:text-ink"
                aria-label="Close booking modal"
              >
                ✕
              </button>
            </div>
            
            <div className="mb-4 p-4 bg-cream rounded">
              <p className="font-semibold text-forest">{practitioner.name}</p>
              <p className="text-sm text-ink-muted">{practitioner.title}</p>
              <p className="text-bronze font-bold mt-2">R{practitioner.consultationFee}/session</p>
            </div>

            <form onSubmit={handleBookConsultation} className="space-y-4">
              <div>
                <label htmlFor="booking-date" className="block text-sm font-semibold text-forest mb-1">Preferred Date</label>
                <input 
                  id="booking-date"
                  type="date" 
                  required
                  value={bookingData.date}
                  onChange={(e) => setBookingData({...bookingData, date: e.target.value})}
                  className="booking-field"
                  min={new Date().toISOString().split('T')[0]}
                />
              </div>
              
              <div>
                <label htmlFor="booking-time" className="block text-sm font-semibold text-forest mb-1">Preferred Time</label>
                <input 
                  id="booking-time"
                  type="time" 
                  required
                  value={bookingData.time}
                  onChange={(e) => setBookingData({...bookingData, time: e.target.value})}
                  className="booking-field"
                />
              </div>
              
              <div>
                <label htmlFor="booking-type" className="block text-sm font-semibold text-forest mb-1">Consultation Type</label>
                <select 
                  id="booking-type"
                  value={bookingData.type}
                  onChange={(e) => setBookingData({...bookingData, type: e.target.value})}
                  className="booking-field"
                >
                  <option value="video">Video Call</option>
                  <option value="audio">Voice Call</option>
                  <option value="chat">Text Chat</option>
                </select>
              </div>
              
              <div>
                <label htmlFor="booking-notes" className="block text-sm font-semibold text-forest mb-1">Describe your concern (optional)</label>
                <textarea 
                  id="booking-notes"
                  value={bookingData.notes}
                  onChange={(e) => setBookingData({...bookingData, notes: e.target.value})}
                  className="booking-field"
                  rows={3}
                  placeholder="Briefly describe your symptoms or questions..."
                ></textarea>
              </div>
              
              <button 
                type="submit" 
                disabled={bookingLoading}
                className="w-full bg-forest text-white py-3 rounded-lg font-bold hover:bg-forest-mist disabled:opacity-50"
              >
                {bookingLoading ? 'Booking...' : `Confirm & Pay R${practitioner.consultationFee}`}
              </button>
            </form>
          </div>
        </div>
      )}

      <div className="bg-forest text-white py-12 px-4">
        <div className="max-w-4xl mx-auto">
          <Link href="/practitioners" className="text-bronze hover:underline mb-4 inline-block">
            ← Back to Practitioners
          </Link>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-12">
        <div className="bg-white rounded-lg shadow-lg overflow-hidden">
          <div className="md:flex">
            <div className="md:w-1/3 bg-gray-200 h-64 md:h-auto relative">
              {displayImage ? (
                <img 
                  src={displayImage} 
                  alt={`Portrait of ${practitioner.name}`}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center bg-forest text-white text-6xl">
                  👤
                </div>
              )}
            </div>
            
            <div className="md:w-2/3 p-8">
              <div className="flex justify-between items-start">
                <div>
                  <h1 className="text-3xl font-bold text-forest mb-1">{practitioner.name}</h1>
                  <p className="text-bronze text-lg mb-2">{practitioner.title}</p>
                  <div className="flex items-center gap-4 text-sm text-gray-600 mb-4 flex-wrap">
                    <span>📍 {practitioner.location}</span>
                    <span>⭐ {practitioner.rating || '0.0'} ({practitioner.reviews || 0} reviews)</span>
                    {practitioner.isVerified && (
                      <span className="text-blue-600 font-semibold">✓ Verified</span>
                    )}
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-3xl font-bold text-forest">R{practitioner.consultationFee || 0}</p>
                  <p className="text-sm text-gray-500">per consultation</p>
                </div>
              </div>

              <p className="text-gray-700 mb-6 leading-relaxed">{practitioner.bio}</p>

              <div className="grid grid-cols-2 gap-4 mb-6">
                <div className="bg-cream p-4 rounded">
                  <p className="text-sm text-gray-600">Experience</p>
                  <p className="font-bold text-forest">{practitioner.experience || 0} years</p>
                </div>
                <div className="bg-cream p-4 rounded">
                  <p className="text-sm text-gray-600">Languages</p>
                  <p className="font-bold text-forest">{(practitioner.languages || []).join(', ') || 'English'}</p>
                </div>
              </div>

              <button 
                onClick={() => user ? setShowBookingModal(true) : router.push('/login')}
                className="w-full md:w-auto bg-forest text-white px-8 py-3 rounded-lg font-bold hover:bg-forest-mist transition-colors"
              >
                Book Consultation
              </button>
            </div>
          </div>

          {practitioner.services && practitioner.services.length > 0 && (
            <div className="p-8 border-t">
              <h3 className="text-xl font-bold text-forest mb-4">Services Offered</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {practitioner.services.map((service, idx) => (
                  <div key={idx} className="flex items-center gap-2">
                    <span className="text-bronze">✓</span>
                    <span>{service}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="p-8 border-t bg-gray-50">
            <h3 className="text-xl font-bold text-forest mb-4">Medicine Delivery</h3>
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