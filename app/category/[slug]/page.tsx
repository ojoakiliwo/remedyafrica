'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { collection, query, where, getDocs, doc, setDoc, getDoc, deleteDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase/client';
import { ailmentsData, getAilmentsByCategory, AilmentData } from '@/lib/data/ailments';

interface AilmentWithHerbCount extends AilmentData {
  herbCount: number;
  firestoreId?: string;
}

export default function CategoryAilmentsPage() {
  const params = useParams();
  const categorySlug = params.slug as string;
  
  const [ailments, setAilments] = useState<AilmentWithHerbCount[]>([]);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
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
      // First, sync static data to Firestore (without creating duplicates)
      await syncAilmentsToFirestore();
      
      // Then fetch from Firestore
      const q = query(
        collection(db, 'ailments'), 
        where('category', '==', categorySlug)
      );
      const snapshot = await getDocs(q);
      
      const ailmentsList = snapshot.docs.map(doc => {
        const data = doc.data();
        return {
          ...data,
          firestoreId: doc.id,
          herbCount: data.associatedHerbs?.length || 0
        } as AilmentWithHerbCount;
      });
      
      // REMOVE DUPLICATES - Keep only the first occurrence of each ID
      const uniqueAilments = Array.from(
        new Map(ailmentsList.map(item => [item.id, item])).values()
      );
      
      // Sort by name
      uniqueAilments.sort((a, b) => a.name.localeCompare(b.name));
      setAilments(uniqueAilments);
      
      // If we found duplicates in Firestore, clean them up
      if (ailmentsList.length !== uniqueAilments.length) {
        console.log(`Found ${ailmentsList.length - uniqueAilments.length} duplicates, cleaning up...`);
        await removeDuplicates(ailmentsList);
      }
      
    } catch (error) {
      console.error('Error loading ailments:', error);
      // Fallback to static data if Firestore fails
      const staticAilments = getAilmentsByCategory(categorySlug).map(a => ({
        ...a,
        herbCount: a.associatedHerbs.length
      }));
      setAilments(staticAilments);
    } finally {
      setLoading(false);
    }
  };

  const syncAilmentsToFirestore = async () => {
    setSyncing(true);
    try {
      const categoryAilments = getAilmentsByCategory(categorySlug);
      
      for (const ailment of categoryAilments) {
        // Check if already exists by querying for the custom 'id' field
        const q = query(
          collection(db, 'ailments'),
          where('id', '==', ailment.id)
        );
        const snapshot = await getDocs(q);
        
        if (snapshot.empty) {
          // Add to Firestore only if it doesn't exist
          await setDoc(doc(collection(db, 'ailments')), {
            ...ailment,
            createdAt: new Date(),
            updatedAt: new Date()
          });
          console.log(`Synced ${ailment.name} to Firestore`);
        } else {
          console.log(`${ailment.name} already exists, skipping`);
        }
      }
    } catch (error) {
      console.error('Sync error:', error);
    } finally {
      setSyncing(false);
    }
  };

  const removeDuplicates = async (ailmentsList: AilmentWithHerbCount[]) => {
    // Group by ID
    const grouped = ailmentsList.reduce((acc, item) => {
      if (!acc[item.id]) acc[item.id] = [];
      acc[item.id].push(item);
      return acc;
    }, {} as Record<string, AilmentWithHerbCount[]>);
    
    // Delete extras (keep the first one)
    for (const [id, items] of Object.entries(grouped)) {
      if (items.length > 1) {
        // Delete all except the first one
        for (let i = 1; i < items.length; i++) {
          if (items[i].firestoreId) {
            try {
              await deleteDoc(doc(db, 'ailments', items[i].firestoreId!));
              console.log(`Deleted duplicate: ${id}`);
            } catch (e) {
              console.error('Error deleting duplicate:', e);
            }
          }
        }
      }
    }
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
          {syncing && <span className="text-sm text-[#97A97C]">Syncing database...</span>}
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
                    {ailment.symptoms.slice(0, 2).join(', ')}...
                  </span>
                  <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                    ailment.herbCount > 0 
                      ? 'bg-[#97A97C] text-white' 
                      : 'bg-gray-200 text-gray-600'
                  }`}>
                    {ailment.herbCount > 0 
                      ? `${ailment.herbCount} remedies` 
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