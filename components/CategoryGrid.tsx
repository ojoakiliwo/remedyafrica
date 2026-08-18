'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '@/lib/firebase/client';
import { CATEGORY_CATALOG } from '@/lib/categories';
import { getAilmentsByCategory } from '@/lib/data/ailments';
import { uniqueHerbsMatchingAnyAilment } from '@/lib/herb-matching';
import { CategoryGlyphMark } from '@/components/icons/CategoryGlyph';
import { ArrowRight } from 'lucide-react';

export function CategoryGrid() {
  const [counts, setCounts] = useState<Record<string, number>>({});

  useEffect(() => {
    const load = async () => {
      try {
        const snap = await getDocs(collection(db, 'herbs'));
        const herbs = snap.docs.map((docSnap) => ({ id: docSnap.id, ...docSnap.data() }));
        const next: Record<string, number> = {};
        for (const category of CATEGORY_CATALOG) {
          next[category.slug] = uniqueHerbsMatchingAnyAilment(
            herbs,
            getAilmentsByCategory(category.slug)
          ).length;
        }
        setCounts(next);
      } catch {
        setCounts({});
      }
    };
    load();
  }, []);

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {CATEGORY_CATALOG.map((category) => {
        const count = counts[category.slug];
        return (
          <Link key={category.slug} href={`/category/${category.slug}`} className="group">
            <div className="h-full overflow-hidden rounded-3xl border border-forest/10 bg-white p-8 shadow-soft transition-all duration-500 hover:-translate-y-1 hover:shadow-lift">
              <CategoryGlyphMark slug={category.slug} className="mb-5" />
              <p className="text-[11px] tracking-[0.2em] uppercase text-bronze mb-2">
                {typeof count === 'number'
                  ? `${count} ${count === 1 ? 'remedy' : 'remedies'}`
                  : 'Live library'}
              </p>
              <h3 className="font-serif text-2xl text-forest mb-2">{category.name}</h3>
              <p className="text-ink-muted text-sm leading-relaxed">{category.description}</p>
              <div className="mt-6 flex items-center gap-2 text-bronze text-sm font-medium">
                Explore
                <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
              </div>
            </div>
          </Link>
        );
      })}
    </div>
  );
}
