'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '@/lib/firebase/client';
import { ailmentsData, getAilmentsByCategory, AilmentData } from '@/lib/data/ailments';

interface AilmentWithHerbCount extends AilmentData {
  herbCount: number;
  matchingHerbIds: string[];
}

interface Herb {
  id: string;
  name: string;
  benefits: string[] | string;
  ailments: string[] | string;
  description: string;
  category: string;
}

export default function CategoryAilmentsPage() {
  const params = useParams();
  const categorySlug = params.slug as string;
  
  const [ailments, setAilments] = useState<AilmentWithHerbCount[]>([]);
  const [loading, setLoading] = useState(true);
  const [categoryName, setCategoryName] = useState('');

  const categoryLabels: Record<string, string> = {
    'mental-wellness': 'Mental Wellness',
    'pain-relief': 'Pain Relief',
    'digestive-health': 'Digestive Health',
    'immune-support': 'Immune Support',
    'skin-care': 'Skin Care',
    'respiratory': 'Respiratory Health'
  };

  useEffect(() => {
    setCategoryName(categoryLabels[categorySlug] || categorySlug);
    loadAilments();
  }, [categorySlug]);

  const loadAilments = async () => {
    setLoading(true);
    try {
      // Get static ailments for this category
      const staticAilments = getAilmentsByCategory(categorySlug);
      
      // Fetch ALL herbs from Firestore
      const herbsSnapshot = await getDocs(collection(db, 'herbs'));
      const allHerbs = herbsSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Herb[];

      // For each ailment, find matching herbs using keyword search
      const ailmentsWithCounts = staticAilments.map(ailment => {
        const matchingHerbs = findMatchingHerbs(ailment, allHerbs);
        
        return {
          ...ailment,
          herbCount: matchingHerbs.length,
          matchingHerbIds: matchingHerbs.map(h => h.id)
        };
      });

      // Sort by name
      ailmentsWithCounts.sort((a, b) => a.name.localeCompare(b.name));
      setAilments(ailmentsWithCounts);
      
    } catch (error) {
      console.error('Error loading ailments:', error);
      // Fallback to static data with zero counts
      const staticAilments = getAilmentsByCategory(categorySlug).map(a => ({
        ...a,
        herbCount: 0,
        matchingHerbIds: []
      }));
      setAilments(staticAilments);
    } finally {
      setLoading(false);
    }
  };

  // Find herbs that match an ailment using keyword search
  const findMatchingHerbs = (ailment: AilmentData, herbs: Herb[]): Herb[] => {
    const keywords = ailment.searchKeywords || [ailment.name.toLowerCase()];
    
    return herbs.filter(herb => {
      // Check if herb category matches
      const categoryMatch = herb.category === ailment.category;
      
      // Helper to check if a field contains any of the keywords
      const fieldMatches = (field: string[] | string | undefined): boolean => {
        if (!field) return false;
        
        const fieldStr = Array.isArray(field) 
          ? field.join(' ').toLowerCase() 
          : field.toLowerCase();
        
        return keywords.some(keyword => fieldStr.includes(keyword.toLowerCase()));
      };
      
      // Check benefits, ailments, description, and name
      const benefitsMatch = fieldMatches(herb.benefits);
      const ailmentsMatch = fieldMatches(herb.ailments);
      const descriptionMatch = herb.description?.toLowerCase().includes(ailment.name.toLowerCase());
      const nameMatch = herb.name?.toLowerCase().includes(ailment.name.toLowerCase());
      
      // Match if any field contains keywords OR if category matches and description mentions ailment
      return benefitsMatch || ailmentsMatch || descriptionMatch || nameMatch || 
             (categoryMatch && (descriptionMatch || benefitsMatch));
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#F5F5F0] flex items-center justify-center">
        <div className="text-[#97A97C] text-xl">Loading conditions...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F5F5F0]">
      {/* Header */}
      <div className="bg-[#2C3E2D] text-white py-12 px-4">
        <div className="max-w-6xl mx-auto">
          <Link href="/" className="text-[#97A97C] hover:underline mb-4 inline-block">
            ← Back to Home
          </Link>
          <h1 className="text-4xl font-bold mb-2">{categoryName}</h1>
          <p className="text-gray-300">Select a condition to learn more and find traditional African remedies</p>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 py-12">
        {ailments.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-600 mb-4">No conditions found for this category.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {ailments.map((ailment) => (
              <Link
                key={ailment.id}
                href={`/ailment/${ailment.id}`}
                className="bg-white rounded-lg shadow-md hover:shadow-xl transition-all p-6 border-l-4 border-[#97A97C] group"
              >
                <div className="flex justify-between items-start mb-3">
                  <h2 className="text-xl font-bold text-[#2C3E2D] group-hover:text-[#97A97C] transition-colors">
                    {ailment.name}
                  </h2>
                  {ailment.commonInAfrica && (
                    <span className="bg-[#2C3E2D] text-white text-xs px-2 py-1 rounded">
                      Common in Africa
                    </span>
                  )}
                </div>
                
                <p className="text-gray-600 text-sm mb-4 line-clamp-3">
                  {ailment.description}
                </p>
                
                <div className="flex items-center justify-between text-sm border-t pt-3">
                  <span className="text-gray-500">
                    {(ailment.symptoms || []).slice(0, 2).join(', ')}...
                  </span>
                  <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                    ailment.herbCount > 0 
                      ? 'bg-[#97A97C] text-white' 
                      : 'bg-gray-200 text-gray-600'
                  }`}>
                    {ailment.herbCount > 0 
                      ? `${ailment.herbCount} remedy${ailment.herbCount !== 1 ? 'ies' : 'y'}` 
                      : 'No remedies yet'}
                  </span>
                </div>
              </Link>
            ))}
          </div>
        )}

        {/* Medical Disclaimer */}
        <div className="mt-16 bg-red-50 border-l-4 border-red-500 rounded-r-lg p-8">
          <h3 className="text-red-800 font-bold mb-2 flex items-center gap-2">
            <span>⚠️</span> Important Medical Disclaimer
          </h3>
          <p className="text-red-700 leading-relaxed">
            The information provided is for educational purposes only and does not constitute medical advice. 
            Always consult with a qualified healthcare provider for proper diagnosis and treatment. 
            Laboratory tests and professional evaluation are essential for accurate diagnosis.
          </p>
        </div>

        {/* Stats */}
        <div className="mt-8 grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-white p-4 rounded-lg shadow text-center">
            <div className="text-2xl font-bold text-[#97A97C]">{ailments.length}</div>
            <div className="text-sm text-gray-600">Conditions Listed</div>
          </div>
          <div className="bg-white p-4 rounded-lg shadow text-center">
            <div className="text-2xl font-bold text-[#97A97C]">
              {ailments.filter(a => a.herbCount > 0).length}
            </div>
            <div className="text-sm text-gray-600">With Remedies</div>
          </div>
          <div className="bg-white p-4 rounded-lg shadow text-center">
            <div className="text-2xl font-bold text-[#97A97C]">
              {ailments.filter(a => a.commonInAfrica).length}
            </div>
            <div className="text-sm text-gray-600">Common in Africa</div>
          </div>
          <div className="bg-white p-4 rounded-lg shadow text-center">
            <div className="text-2xl font-bold text-[#97A97C]">100%</div>
            <div className="text-sm text-gray-600">Need Diagnosis</div>
          </div>
        </div>
      </div>
    </div>
  );
}