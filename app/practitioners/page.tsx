'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { collection, query, where, getDocs } from 'firebase/firestore';
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
  nextAvailable: string;
}

export default function PractitionersPage() {
  const [practitioners, setPractitioners] = useState<Practitioner[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');

  useEffect(() => {
    loadPractitioners();
  }, []);

  const loadPractitioners = async () => {
    try {
      const q = query(
        collection(db, 'practitioners'),
        where('isActive', '==', true)
      );
      const snapshot = await getDocs(q);
      const data = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Practitioner[];
      setPractitioners(data);
    } catch (error) {
      console.error('Error loading practitioners:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredPractitioners = filter === 'all' 
    ? practitioners 
    : practitioners.filter(p => p.specialty.toLowerCase().includes(filter));

  if (loading) {
    return (
      <div className="min-h-screen bg-[#F5F5F0] flex items-center justify-center">
        <div className="text-[#97A97C] text-xl">Loading practitioners...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F5F5F0]">
      {/* Hero */}
      <div className="bg-[#2C3E2D] text-white py-16 px-4">
        <div className="max-w-6xl mx-auto text-center">
          <h1 className="text-4xl font-bold mb-4">Connect with Traditional Healers</h1>
          <p className="text-xl text-gray-300 max-w-2xl mx-auto">
            Book consultations with verified herbal practitioners across Africa. 
            Get personalized guidance on herb combinations and traditional remedies.
          </p>
          <div className="mt-6 inline-block bg-[#97A97C] text-white px-4 py-2 rounded-full text-sm">
            💎 Premium Feature - Subscriber Access Only
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 py-12">
        {/* Filters */}
        <div className="flex flex-wrap gap-2 mb-8 justify-center">
          {['all', 'mental wellness', 'pain relief', 'digestive', 'skin', 'general'].map((cat) => (
            <button
              key={cat}
              onClick={() => setFilter(cat)}
              className={`px-4 py-2 rounded-full capitalize ${
                filter === cat 
                  ? 'bg-[#97A97C] text-white' 
                  : 'bg-white text-gray-700 hover:bg-gray-100'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Practitioners Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredPractitioners.map((practitioner) => (
            <div key={practitioner.id} className="bg-white rounded-lg shadow-md hover:shadow-xl transition-all overflow-hidden">
              <div className="relative h-48 bg-gray-200">
                {practitioner.imageUrl ? (
                  <img 
                    src={practitioner.imageUrl} 
                    alt={practitioner.name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-[#97A97C] text-white text-4xl">
                    👤
                  </div>
                )}
                {practitioner.isVerified && (
                  <div className="absolute top-4 right-4 bg-blue-500 text-white px-2 py-1 rounded-full text-xs flex items-center gap-1">
                    ✓ Verified
                  </div>
                )}
              </div>
              
              <div className="p-6">
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <h3 className="text-xl font-bold text-[#2C3E2D]">{practitioner.name}</h3>
                    <p className="text-[#97A97C] text-sm">{practitioner.title}</p>
                  </div>
                  <div className="text-right">
                    <div className="flex items-center gap-1 text-yellow-500">
                      <span>★</span>
                      <span className="text-gray-700 font-semibold">{practitioner.rating}</span>
                    </div>
                    <p className="text-xs text-gray-500">({practitioner.reviews} reviews)</p>
                  </div>
                </div>

                <p className="text-gray-600 text-sm mb-4 line-clamp-2">{practitioner.bio}</p>
                
                <div className="space-y-2 mb-4 text-sm">
                  <div className="flex items-center gap-2 text-gray-600">
                    <span>📍</span> {practitioner.location}
                  </div>
                  <div className="flex items-center gap-2 text-gray-600">
                    <span>🗣️</span> {practitioner.languages.join(', ')}
                  </div>
                  <div className="flex items-center gap-2 text-gray-600">
                    <span>⏰</span> Next available: {practitioner.nextAvailable}
                  </div>
                </div>

                <div className="flex items-center justify-between pt-4 border-t">
                  <div>
                    <p className="text-xs text-gray-500">Consultation</p>
                    <p className="text-lg font-bold text-[#2C3E2D]">
                      ${practitioner.consultationFee}
                    </p>
                  </div>
                  <Link 
                    href={`/practitioners/${practitioner.id}`}
                    className="bg-[#97A97C] text-white px-4 py-2 rounded hover:bg-[#7A8A63] transition-colors"
                  >
                    Book Now
                  </Link>
                </div>
              </div>
            </div>
          ))}
        </div>

        {filteredPractitioners.length === 0 && (
          <div className="text-center py-12">
            <p className="text-gray-600">No practitioners found in this category yet.</p>
          </div>
        )}

        {/* How it Works */}
        <div className="mt-16 grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="bg-white p-6 rounded-lg shadow text-center">
            <div className="text-4xl mb-4">🔍</div>
            <h3 className="font-bold text-[#2C3E2D] mb-2">1. Choose a Practitioner</h3>
            <p className="text-gray-600 text-sm">Browse verified herbalists by specialty, location, and reviews.</p>
          </div>
          <div className="bg-white p-6 rounded-lg shadow text-center">
            <div className="text-4xl mb-4">📅</div>
            <h3 className="font-bold text-[#2C3E2D] mb-2">2. Book Consultation</h3>
            <p className="text-gray-600 text-sm">Schedule a video or chat consultation at your convenience.</p>
          </div>
          <div className="bg-white p-6 rounded-lg shadow text-center">
            <div className="text-4xl mb-4">🌿</div>
            <h3 className="font-bold text-[#2C3E2D] mb-2">3. Get Personal Guidance</h3>
            <p className="text-gray-600 text-sm">Receive customized herb combinations and wellness plans.</p>
          </div>
        </div>
      </div>
    </div>
  );
}