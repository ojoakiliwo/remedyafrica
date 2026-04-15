'use client';

import { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '@/lib/firebase/client';
import { getAilmentById } from '@/lib/data/ailments';

interface Herb {
  id: string;
  name: string;
  scientificName: string;
  description: string;
  images: string[];
  category: string;
  benefits: string[];
  ailments: string[];
}

export default function HerbsListingPage() {
  const searchParams = useSearchParams();
  const ailmentId = searchParams.get('ailment');
  const ailmentName = searchParams.get('name');
  
  const [herbs, setHerbs] = useState<Herb[]>([]);
  const [loading, setLoading] = useState(true);
  const [ailmentInfo, setAilmentInfo] = useState<any>(null);

  useEffect(() => {
    loadHerbs();
  }, [ailmentId, ailmentName]);

  const loadHerbs = async () => {
    setLoading(true);
    try {
      let herbsQuery;
      
      if (ailmentId && ailmentName) {
        // Filter by ailment
        const decodedName = decodeURIComponent(ailmentName);
        herbsQuery = query(
          collection(db, 'herbs'),
          where('ailments', 'array-contains', decodedName)
        );
        
        // Get ailment info
        const info = getAilmentById(ailmentId);
        setAilmentInfo(info);
      } else {
        // Get all herbs
        herbsQuery = query(collection(db, 'herbs'));
      }
      
      const snapshot = await getDocs(herbsQuery);
      const herbsData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Herb[];
      
      setHerbs(herbsData);
    } catch (error) {
      console.error('Error loading herbs:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#F5F5F0] flex items-center justify-center">
        <div className="text-[#97A97C] text-xl">Loading remedies...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F5F5F0]">
      {/* Header */}
      <div className="bg-[#2C3E2D] text-white py-12 px-4">
        <div className="max-w-6xl mx-auto">
          <Link 
            href={ailmentId ? `/ailment/${ailmentId}` : '/'} 
            className="text-[#97A97C] hover:underline mb-4 inline-block"
          >
            ← Back
          </Link>
          <h1 className="text-4xl font-bold mb-2">
            {ailmentInfo ? `Remedies for ${ailmentInfo.name}` : 'All Herbal Remedies'}
          </h1>
          <p className="text-gray-300">
            {herbs.length} traditional remedy{herbs.length !== 1 ? 'ies' : 'y'} found
          </p>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 py-12">
        {herbs.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-lg shadow">
            <div className="text-6xl mb-4">🌿</div>
            <h2 className="text-2xl font-bold text-[#2C3E2D] mb-4">No Remedies Available Yet</h2>
            <p className="text-gray-600 mb-6 max-w-md mx-auto">
              We're currently curating traditional remedies for this condition. 
              Please check back soon or consult a qualified traditional healer.
            </p>
            {ailmentId && (
              <Link 
                href={`/ailment/${ailmentId}`}
                className="bg-[#97A97C] text-white px-6 py-3 rounded hover:bg-[#7A8A63] inline-block"
              >
                Back to Condition Details
              </Link>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {herbs.map((herb) => (
              <Link
                key={herb.id}
                href={`/herb/${herb.id}`}
                className="bg-white rounded-lg shadow-md hover:shadow-xl transition-shadow overflow-hidden group"
              >
                <div className="aspect-video bg-gray-200 relative overflow-hidden">
                  {herb.images && herb.images[0] ? (
                    <img 
                      src={herb.images[0]} 
                      alt={herb.name}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-gray-400">
                      No Image
                    </div>
                  )}
                </div>
                <div className="p-6">
                  <h2 className="text-xl font-bold text-[#2C3E2D] mb-1 group-hover:text-[#97A97C] transition-colors">
                    {herb.name}
                  </h2>
                  <p className="text-sm text-gray-500 italic mb-3">{herb.scientificName}</p>
                  <p className="text-gray-600 text-sm line-clamp-2 mb-4">{herb.description}</p>
                  
                  {herb.benefits && (
                    <div className="flex flex-wrap gap-2">
                      {herb.benefits.slice(0, 3).map((benefit, idx) => (
                        <span key={idx} className="bg-[#F5F5F0] text-[#2C3E2D] text-xs px-2 py-1 rounded">
                          {benefit}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              </Link>
            ))}
          </div>
        )}

        {/* Disclaimer */}
        <div className="mt-12 bg-yellow-50 border-l-4 border-yellow-500 p-6 rounded-r-lg">
          <p className="text-yellow-800 text-sm">
            <strong>⚠️ Important:</strong> These traditional remedies should complement, not replace, 
            professional medical treatment. Always consult your healthcare provider before using herbal 
            remedies, especially if you are pregnant, nursing, or taking medications.
          </p>
        </div>
      </div>
    </div>
  );
}