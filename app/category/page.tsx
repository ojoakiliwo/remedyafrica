'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '@/lib/firebase/client';
import { ailmentsData, getAilmentsByCategory } from '@/lib/data/ailments';
import { CATEGORY_CATALOG } from '@/lib/categories';
import { uniqueHerbsMatchingAnyAilment } from '@/lib/herb-matching';
import { CategoryGlyphMark } from '@/components/icons/CategoryGlyph';
import { EditorialPage, PageHero, LoadingScreen } from '@/components/editorial/PageHero';
import { ArrowRight, Search } from 'lucide-react';

export default function CategoriesPage() {
  const [counts, setCounts] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const snap = await getDocs(collection(db, 'herbs'));
        const herbs = snap.docs.map((docSnap) => ({ id: docSnap.id, ...docSnap.data() }));
        const next: Record<string, number> = {};
        for (const category of CATEGORY_CATALOG) {
          const ailments = getAilmentsByCategory(category.slug);
          next[category.slug] = uniqueHerbsMatchingAnyAilment(herbs, ailments).length;
        }
        setCounts(next);
      } catch {
        setCounts({});
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  if (loading) {
    return <LoadingScreen label="Loading categories…" />;
  }

  return (
    <EditorialPage>
      <PageHero
        eyebrow="The library"
        title="Browse by how you feel"
        subtitle="Each category lists real conditions. Remedy counts come from the herbs in our library — the same match you will see when you open a condition."
      />

      <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {CATEGORY_CATALOG.map((category) => {
            const conditionCount = getAilmentsByCategory(category.slug).length;
            const remedyCount = counts[category.slug] ?? 0;
            return (
              <Link
                key={category.slug}
                href={`/category/${category.slug}`}
                className="group rounded-3xl border border-forest/10 bg-white p-8 shadow-soft transition-all duration-500 hover:-translate-y-1 hover:shadow-lift"
              >
                <div className="flex items-start justify-between mb-6">
                  <CategoryGlyphMark slug={category.slug} />
                  <ArrowRight className="h-5 w-5 text-bronze opacity-0 transition-all group-hover:opacity-100 group-hover:translate-x-1" />
                </div>
                <p className="text-[11px] tracking-[0.2em] uppercase text-bronze mb-2">
                  {remedyCount} {remedyCount === 1 ? 'remedy' : 'remedies'} · {conditionCount} conditions
                </p>
                <h2 className="font-serif text-2xl text-forest mb-2">{category.name}</h2>
                <p className="text-sm leading-relaxed text-ink-muted">{category.description}</p>
              </Link>
            );
          })}
        </div>

        <p className="mt-14 text-center text-sm text-ink-muted">
          {ailmentsData.length} conditions in the catalogue.{' '}
          <Link href="/search" className="inline-flex items-center gap-1 font-medium text-forest hover:text-bronze">
            <Search className="h-4 w-4" />
            Search by symptom
          </Link>
        </p>
      </div>
    </EditorialPage>
  );
}
