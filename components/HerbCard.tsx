'use client';

import Link from 'next/link';
import Image from 'next/image';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Leaf, ArrowRight } from 'lucide-react';

interface HerbCardProps {
  herb: {
    id: string;
    commonName: string;
    scientificName?: string;
    slug: string;
    images?: string[];
    ailments?: string[];
    region?: string;
  };
}

export function HerbCard({ herb }: HerbCardProps) {
  return (
    <Link href={`/herb/${herb.slug}`}>
      <Card className="group h-full overflow-hidden rounded-3xl border-forest/10 bg-white shadow-soft hover:shadow-lift transition-all duration-500 flex flex-col">
        <div className="relative aspect-[4/3] overflow-hidden bg-forest">
          {herb.images?.[0] ? (
            <Image
              src={herb.images[0]}
              alt={herb.commonName}
              fill
              className="object-cover group-hover:scale-105 transition-transform duration-700"
            />
          ) : (
            <div className="flex items-center justify-center h-full">
              <Leaf className="h-12 w-12 text-cream/30" />
            </div>
          )}
        </div>

        <CardHeader className="pb-2">
          <p className="text-[11px] tracking-[0.2em] uppercase text-bronze">
            {herb.region || 'Africa'}
          </p>
          <h3 className="font-serif text-2xl text-forest group-hover:text-bronze transition-colors">
            {herb.commonName}
          </h3>
          {herb.scientificName && (
            <p className="text-sm text-ink-muted italic">{herb.scientificName}</p>
          )}
        </CardHeader>

        <CardContent className="flex-1 flex flex-col justify-between">
          <div className="flex flex-wrap gap-1 mb-4">
            {herb.ailments?.slice(0, 3).map((ailment, idx) => (
              <span key={idx} className="rounded-full bg-cream px-3 py-1 text-[11px] text-forest">
                {ailment}
              </span>
            ))}
          </div>

          <div className="flex items-center text-bronze text-sm font-medium group-hover:translate-x-1 transition-transform">
            Learn more <ArrowRight className="ml-1 h-4 w-4" />
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}
