import { cn } from '@/lib/utils';
import type { CategorySlug } from '@/lib/categories';
import type { ReactNode } from 'react';

type GlyphProps = {
  className?: string;
};

function Svg({ className, children }: { className?: string; children: ReactNode }) {
  return (
    <svg
      viewBox="0 0 48 48"
      fill="none"
      className={cn('h-7 w-7', className)}
      aria-hidden="true"
    >
      {children}
    </svg>
  );
}

const stroke = {
  stroke: 'currentColor',
  strokeWidth: 1.6,
  strokeLinecap: 'round' as const,
  strokeLinejoin: 'round' as const,
};

function MentalGlyph({ className }: GlyphProps) {
  return (
    <Svg className={className}>
      <path d="M24 8c-7.2 0-13 5.4-13 13.2 0 5.2 3.1 8.8 6.4 11.4 1.8 1.4 3.4 3.2 3.4 5.4v2.2h6.4v-2.2c0-2.2 1.6-4 3.4-5.4 3.3-2.6 6.4-6.2 6.4-11.4C37 13.4 31.2 8 24 8Z" {...stroke} />
      <path d="M20 20.5c1.2-1.6 2.5-2.4 4-2.4s2.8.8 4 2.4" {...stroke} />
      <path d="M24 32.5v3" {...stroke} />
    </Svg>
  );
}

function PainGlyph({ className }: GlyphProps) {
  return (
    <Svg className={className}>
      <path d="M16 30c0-8 4.2-14 8-18 3.8 4 8 10 8 18" {...stroke} />
      <path d="M16 30c0 5.2 3.6 9 8 9s8-3.8 8-9" {...stroke} />
      <path d="M20.5 28.5c1.2 2.4 2.5 3.6 3.5 3.6s2.3-1.2 3.5-3.6" {...stroke} />
      <circle cx="24" cy="14" r="1.4" fill="currentColor" />
    </Svg>
  );
}

function DigestiveGlyph({ className }: GlyphProps) {
  return (
    <Svg className={className}>
      <path d="M18 14c0-3.2 2.6-6 6-6s6 2.8 6 6c0 6-4 7.5-4 13" {...stroke} />
      <path d="M26 27c0 5.5-1.8 10-2 13" {...stroke} />
      <path d="M16 22.5c2.4 1.4 4.8 1.4 8 0 3.2-1.4 5.6-1.4 8 0" {...stroke} />
      <path d="M17.5 28c2 1 4.2 1 6.5 0" {...stroke} />
    </Svg>
  );
}

function ImmuneGlyph({ className }: GlyphProps) {
  return (
    <Svg className={className}>
      <path d="M24 8 12.5 13.2v10.4c0 8.2 5.1 13.8 11.5 16.4 6.4-2.6 11.5-8.2 11.5-16.4V13.2L24 8Z" {...stroke} />
      <path d="M24 16.5v11" {...stroke} />
      <path d="M19.5 22h9" {...stroke} />
    </Svg>
  );
}

function SkinGlyph({ className }: GlyphProps) {
  return (
    <Svg className={className}>
      <path d="M14 30c2.8-8.5 6.6-14 10-16 3.4 2 7.2 7.5 10 16" {...stroke} />
      <path d="M16.5 31.5c2.4 3.4 4.8 5 7.5 5s5.1-1.6 7.5-5" {...stroke} />
      <path d="M21 21.5c.8-2.2 1.8-3.4 3-3.4 1.2 0 2.2 1.2 3 3.4" {...stroke} />
      <circle cx="30.5" cy="18" r="1.2" fill="currentColor" />
    </Svg>
  );
}

function RespiratoryGlyph({ className }: GlyphProps) {
  return (
    <Svg className={className}>
      <path d="M18 34c-3.2-2-5-5.4-5-9.2C13 17.4 17.6 12 24 12s11 5.4 11 12.8c0 3.8-1.8 7.2-5 9.2" {...stroke} />
      <path d="M20 22c1.2-2 2.5-3 4-3s2.8 1 4 3" {...stroke} />
      <path d="M24 22v10" {...stroke} />
      <path d="M20.5 34.5c1.1 1.6 2.3 2.5 3.5 2.5s2.4-.9 3.5-2.5" {...stroke} />
    </Svg>
  );
}

function WomensGlyph({ className }: GlyphProps) {
  return (
    <Svg className={className}>
      <circle cx="24" cy="18" r="7" {...stroke} />
      <path d="M24 25v13" {...stroke} />
      <path d="M18.5 32.5h11" {...stroke} />
      <path d="M20 12.5c1.4-1.8 2.7-2.6 4-2.6s2.6.8 4 2.6" {...stroke} />
    </Svg>
  );
}

function MensGlyph({ className }: GlyphProps) {
  return (
    <Svg className={className}>
      <path d="M24 8c-4.6 4.8-8 11-8 18.5C16 34 19.6 40 24 40s8-6 8-13.5C32 19 28.6 12.8 24 8Z" {...stroke} />
      <path d="M24 16v16" {...stroke} />
      <path d="M20 24h8" {...stroke} />
    </Svg>
  );
}

const GLYPHS: Record<CategorySlug, (props: GlyphProps) => ReactNode> = {
  'mental-wellness': MentalGlyph,
  'pain-relief': PainGlyph,
  'digestive-health': DigestiveGlyph,
  'immune-support': ImmuneGlyph,
  'skin-care': SkinGlyph,
  respiratory: RespiratoryGlyph,
  'womens-health': WomensGlyph,
  'mens-health': MensGlyph,
};

export function CategoryGlyph({
  slug,
  className,
}: {
  slug: string;
  className?: string;
}) {
  const Glyph = GLYPHS[slug as CategorySlug] || ImmuneGlyph;
  return <Glyph className={className} />;
}

export function CategoryGlyphMark({
  slug,
  className,
  iconClassName,
}: {
  slug: string;
  className?: string;
  iconClassName?: string;
}) {
  return (
    <div
      className={cn(
        'flex h-14 w-14 items-center justify-center rounded-full border border-bronze/30 bg-cream text-forest',
        className
      )}
    >
      <CategoryGlyph slug={slug} className={iconClassName} />
    </div>
  );
}
