'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { collection, getDocs, limit, query } from 'firebase/firestore';
import { db } from '@/lib/firebase/client';
import { getHerbPrimaryImage } from '@/lib/herb-images';
import { ArrowRight, Leaf } from 'lucide-react';

type FeaturedHerb = {
  id: string;
  name: string;
  scientificName?: string;
  origin?: string;
  image?: string;
};

export default function FeaturedRemedies() {
  const [herbs, setHerbs] = useState<FeaturedHerb[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const snap = await getDocs(query(collection(db, 'herbs'), limit(48)));
        const mapped: FeaturedHerb[] = snap.docs.map((d) => {
          const data = d.data() as any;
          return {
            id: d.id,
            name: data.name || 'Herb',
            scientificName: data.scientificName,
            origin: data.origin,
            image: getHerbPrimaryImage(data),
          };
        });
        const withPhotos = mapped.filter((h) => h.image);
        setHerbs((withPhotos.length ? withPhotos : mapped).slice(0, 6));
      } catch {
        setHerbs([]);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  if (loading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="aspect-[4/5] rounded-3xl bg-cream-dark/60 animate-pulse" />
        ))}
      </div>
    );
  }

  if (herbs.length === 0) return null;

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
      {herbs.map((herb) => (
        <Link
          key={herb.id}
          href={`/herb/${herb.id}`}
          className="group block overflow-hidden rounded-3xl bg-white border border-forest/10 shadow-soft hover:shadow-lift transition-all duration-500"
        >
          <div className="relative aspect-[4/5] overflow-hidden bg-cream-dark">
            {herb.image ? (
              <img
                src={herb.image}
                alt={herb.name}
                className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
              />
            ) : (
              <div className="flex h-full items-center justify-center">
                <Leaf className="h-12 w-12 text-sage/50" />
              </div>
            )}
            <div className="absolute inset-0 bg-gradient-to-t from-forest-deep/80 via-forest-deep/10 to-transparent" />
            <div className="absolute bottom-0 left-0 right-0 p-6 text-cream">
              <p className="text-[11px] tracking-[0.22em] uppercase text-bronze mb-2">
                {herb.origin || 'African tradition'}
              </p>
              <h3 className="font-serif text-2xl leading-tight">{herb.name}</h3>
              {herb.scientificName && (
                <p className="mt-1 text-sm italic text-cream/70">{herb.scientificName}</p>
              )}
              <span className="mt-4 inline-flex items-center gap-2 text-sm text-cream/90">
                View remedy <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
              </span>
            </div>
          </div>
        </Link>
      ))}
    </div>
  );
}
