'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/providers/AuthProvider';
import { db } from '@/lib/firebase/client';
import { collection, query, where, orderBy, getDocs, deleteDoc, doc } from 'firebase/firestore';
import { Loader2, Leaf, Trash2, ExternalLink } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import Link from 'next/link';

interface MyHerb {
  id: string;
  plantName: string;
  commonName: string;
  family: string;
  imageUrl?: string;
  wikiUrl: string;
  dateIdentified: any;
  timesIdentified: number;
}

export default function MyHerbsPage() {
  const { user } = useAuth();
  const [herbs, setHerbs] = useState<MyHerb[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      loadMyHerbs();
    }
  }, [user]);

  const loadMyHerbs = async () => {
    try {
      const q = query(
        collection(db, 'my_herbs'),
        where('userId', '==', user?.uid),
        orderBy('dateIdentified', 'desc')
      );
      const snapshot = await getDocs(q);
      const data = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as MyHerb[];
      setHerbs(data);
    } catch (error) {
      console.error('Error loading herbs:', error);
    } finally {
      setLoading(false);
    }
  };

  const removeHerb = async (herbId: string) => {
    try {
      await deleteDoc(doc(db, 'my_herbs', herbId));
      setHerbs(herbs.filter(h => h.id !== herbId));
    } catch (error) {
      console.error('Error removing herb:', error);
    }
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-[#F5F5F0] flex items-center justify-center">
        <p>Please sign in to view your herbs.</p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-[#F5F5F0] flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-[#97A97C]" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F5F5F0] py-8 px-4">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-3xl font-bold text-[#2C3E2D] mb-8">My Herbs Collection</h1>
        
        {herbs.length === 0 ? (
          <Card>
            <CardContent className="p-12 text-center">
              <Leaf className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-600">No herbs in your collection yet.</p>
              <Link href="/">
                <Button className="mt-4 bg-[#97A97C]">Identify Your First Herb</Button>
              </Link>
            </CardContent>
          </Card>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {herbs.map((herb) => (
              <Card key={herb.id} className="overflow-hidden">
                <div className="h-48 bg-gray-100 relative">
                  {herb.imageUrl ? (
                    <img src={herb.imageUrl} alt={herb.commonName} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-[#97A97C]/10">
                      <Leaf className="w-16 h-16 text-[#97A97C]" />
                    </div>
                  )}
                </div>
                <CardHeader>
                  <CardTitle className="text-lg">{herb.commonName}</CardTitle>
                  <p className="text-sm text-gray-500 italic">{herb.plantName}</p>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-gray-600 mb-2">Family: {herb.family}</p>
                  <p className="text-xs text-gray-400 mb-4">
                    Identified {herb.timesIdentified} time{herb.timesIdentified > 1 ? 's' : ''}
                  </p>
                  <div className="flex gap-2">
                    <a 
                      href={herb.wikiUrl} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="flex-1"
                    >
                      <Button variant="outline" className="w-full text-sm">
                        <ExternalLink className="w-4 h-4 mr-2" /> Learn More
                      </Button>
                    </a>
                    <Button 
                      variant="ghost" 
                      size="icon"
                      onClick={() => removeHerb(herb.id)}
                      className="text-red-600 hover:text-red-700"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}