'use client';

import Link from 'next/link';
import { useState } from 'react';
import { ArrowRight, Leaf } from 'lucide-react';
import { getHerbPrimaryImage } from '@/lib/herb-images';
import { herbOriginLabel } from '@/lib/herb-trust';

export type PreviewHerb = {
  id: string;
  name: string;
  scientificName?: string;
  description?: string;
  origin?: string;
  images?: unknown;
  imageUrl?: string;
  benefits?: string[] | string;
  slug?: string;
};

function benefitList(herb: PreviewHerb): string[] {
  if (Array.isArray(herb.benefits)) return herb.benefits.filter(Boolean).map(String);
  if (typeof herb.benefits === 'string') {
    return herb.benefits.split(/[;|,]/).map((item) => item.trim()).filter(Boolean);
  }
  return [];
}

export function HerbPreviewCard({ herb }: { herb: PreviewHerb }) {
  const [imgFailed, setImgFailed] = useState(false);
  const image = getHerbPrimaryImage(herb);
  const showPhoto = Boolean(image) && !imgFailed;
  const href = `/herb/${herb.slug || herb.id}`;
  const tags = benefitList(herb).slice(0, 3);

  return (
    <Link
      href={href}
      className="group flex h-full flex-col overflow-hidden rounded-3xl border border-forest/10 bg-white shadow-soft transition-all duration-500 hover:-translate-y-0.5 hover:shadow-lift"
    >
      <div className="relative aspect-[4/3] overflow-hidden bg-forest">
        {showPhoto ? (
          <img
            src={image}
            alt={herb.name}
            className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
            onError={() => setImgFailed(true)}
          />
        ) : (
          <div className="flex h-full items-center justify-center bg-gradient-to-br from-forest to-forest-deep">
            <Leaf className="h-10 w-10 text-cream/30" />
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-forest-deep/70 via-transparent to-transparent" />
      </div>
      <div className="flex flex-1 flex-col p-6">
        <p className="text-[11px] tracking-[0.2em] uppercase text-bronze">
          {herbOriginLabel(herb.origin)}
        </p>
        <h3 className="mt-2 font-serif text-2xl text-forest leading-tight">{herb.name}</h3>
        {herb.scientificName && (
          <p className="mt-1 text-sm italic text-ink-muted">{herb.scientificName}</p>
        )}
        {herb.description && (
          <p className="mt-3 line-clamp-2 text-sm leading-relaxed text-ink-muted">
            {herb.description}
          </p>
        )}
        {tags.length > 0 && (
          <div className="mt-4 flex flex-wrap gap-2">
            {tags.map((tag) => (
              <span
                key={tag}
                className="rounded-full bg-cream px-3 py-1 text-[11px] tracking-wide text-forest"
              >
                {tag}
              </span>
            ))}
          </div>
        )}
        <span className="mt-auto pt-5 inline-flex items-center gap-2 text-sm font-medium text-bronze">
          View remedy
          <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
        </span>
      </div>
    </Link>
  );
}
