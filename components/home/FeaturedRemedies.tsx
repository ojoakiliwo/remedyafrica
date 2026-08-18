'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '@/lib/firebase/client';
import { getHerbPrimaryImage } from '@/lib/herb-images';
import {
  FEATURED_PREVIEW_COUNT,
  herbLocalNamesLabel,
  herbOriginLabel,
  pickFeaturedHerbs,
} from '@/lib/herb-trust';
import { ArrowRight, Leaf } from 'lucide-react';

type FeaturedHerb = {
  id: string;
  name: string;
  scientificName?: string;
  origin?: string;
  image?: string;
  description?: string;
  localNames?: string;
};

function RemedyCard({ herb }: { herb: FeaturedHerb }) {
  const [imgFailed, setImgFailed] = useState(false);
  const showPhoto = Boolean(herb.image) && !imgFailed;

  return (
    <Link
      href={`/herb/${herb.id}`}
      className="group block overflow-hidden rounded-3xl bg-white border border-forest/10 shadow-soft hover:shadow-lift transition-all duration-500"
    >
      <div className="relative aspect-[4/5] overflow-hidden bg-forest">
        {showPhoto ? (
          <img
            src={herb.image}
            alt={herb.name}
            className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
            onError={() => setImgFailed(true)}
          />
        ) : (
          <div className="flex h-full flex-col items-center justify-center bg-gradient-to-br from-forest to-forest-deep">
            <Leaf className="h-12 w-12 text-cream/30" />
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-forest-deep/85 via-forest-deep/20 to-transparent" />
        <div className="absolute bottom-0 left-0 right-0 p-6 text-cream">
          <p className="text-[11px] tracking-[0.22em] uppercase text-bronze mb-2">
            {herbOriginLabel(herb.origin)}
          </p>
          <h3 className="font-serif text-2xl leading-tight">{herb.name}</h3>
          {herb.localNames && (
            <p className="mt-1 text-sm text-cream/80">{herb.localNames}</p>
          )}
          {herb.scientificName && (
            <p className="mt-1 text-sm italic text-cream/70">{herb.scientificName}</p>
          )}
          <span className="mt-4 inline-flex items-center gap-2 text-sm text-cream/90">
            View remedy <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
          </span>
        </div>
      </div>
    </Link>
  );
}

export default function FeaturedRemedies() {
  const [herbs, setHerbs] = useState<FeaturedHerb[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const snap = await getDocs(collection(db, 'herbs'));
        const records = snap.docs.map((d) => {
          const data = d.data() as Record<string, unknown>;
          return { id: d.id, ...data };
        });
        const picked = pickFeaturedHerbs(records as any, FEATURED_PREVIEW_COUNT, (herb) =>
          Boolean(getHerbPrimaryImage(herb))
        );
        setHerbs(
          picked.map((herb: any) => ({
            id: herb.id,
            name: herb.name || 'Herb',
            scientificName: herb.scientificName,
            origin: herb.origin,
            image: getHerbPrimaryImage(herb),
            localNames: herbLocalNamesLabel(herb),
          }))
        );
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
        {Array.from({ length: FEATURED_PREVIEW_COUNT }).map((_, i) => (
          <div key={i} className="aspect-[4/5] rounded-3xl bg-cream-dark/60 animate-pulse" />
        ))}
      </div>
    );
  }

  if (herbs.length === 0) return null;

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
      {herbs.map((herb) => (
        <RemedyCard key={herb.id} herb={herb} />
      ))}
    </div>
  );
}
