'use client';

import { useEffect, useState } from 'react';
import { HerbCard } from './HerbCard';
import { Loader2 } from 'lucide-react';

const sampleHerbs = [
  { id: '1', commonName: 'Moringa Oleifera', scientificName: 'Moringa oleifera', slug: 'moringa', region: 'West Africa', ailments: ['diabetes', 'fatigue'] },
  { id: '2', commonName: 'Neem', scientificName: 'Azadirachta indica', slug: 'neem', region: 'East Africa', ailments: ['malaria', 'skin'] },
  { id: '3', commonName: 'Bitter Leaf', scientificName: 'Vernonia amygdalina', slug: 'bitter-leaf', region: 'Nigeria', ailments: ['malaria', 'stomach'] },
];

export function FeaturedHerbs() {
  const [herbs, setHerbs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Simulate API call
    setTimeout(() => {
      setHerbs(sampleHerbs);
      setLoading(false);
    }, 500);
  }, []);

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-[#97A97C]" />
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {herbs.map((herb) => (
        <HerbCard key={herb.id} herb={herb} />
      ))}
    </div>
  );
}