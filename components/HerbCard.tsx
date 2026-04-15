'use client';

import Link from 'next/link';
import Image from 'next/image';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
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
      <Card className="group overflow-hidden bg-[#FDFCF8] border-[#97A97C]/20 hover:border-[#97A97C] hover:shadow-lg transition-all duration-300 h-full flex flex-col">
        <div className="relative aspect-[4/3] overflow-hidden bg-[#97A97C]/10">
          {herb.images?.[0] ? (
            <Image
              src={herb.images[0]}
              alt={herb.commonName}
              fill
              className="object-cover group-hover:scale-105 transition-transform duration-500"
            />
          ) : (
            <div className="flex items-center justify-center h-full">
              <Leaf className="h-12 w-12 text-[#97A97C]/30" />
            </div>
          )}
          <div className="absolute top-2 right-2">
            <Badge variant="secondary" className="bg-white/90 backdrop-blur-sm text-[#2C3E2D]">
              {herb.region || 'Africa'}
            </Badge>
          </div>
        </div>
        
        <CardHeader className="pb-2">
          <h3 className="text-xl font-bold text-[#2C3E2D] group-hover:text-[#97A97C] transition-colors">
            {herb.commonName}
          </h3>
          {herb.scientificName && (
            <p className="text-sm text-[#97A97C] italic">{herb.scientificName}</p>
          )}
        </CardHeader>
        
        <CardContent className="flex-1 flex flex-col justify-between">
          <div className="flex flex-wrap gap-1 mb-4">
            {herb.ailments?.slice(0, 3).map((ailment, idx) => (
              <Badge key={idx} variant="outline" className="text-xs border-[#97A97C]/30 text-[#5C6B4C]">
                {ailment}
              </Badge>
            ))}
          </div>
          
          <div className="flex items-center text-[#97A97C] text-sm font-medium group-hover:translate-x-1 transition-transform">
            Learn more <ArrowRight className="ml-1 h-4 w-4" />
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}