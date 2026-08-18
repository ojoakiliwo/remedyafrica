'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '@/lib/firebase/client';
import { getAilmentsByCategory, AilmentData } from '@/lib/data/ailments';
import { getCategoryVisual, isCategorySlug } from '@/lib/categories';
import { countMatchingHerbs } from '@/lib/herb-matching';
import { CategoryGlyphMark } from '@/components/icons/CategoryGlyph';
import { EditorialPage, PageHero, LoadingScreen, DisclaimerNote } from '@/components/editorial/PageHero';
import { ArrowRight } from 'lucide-react';

interface AilmentWithHerbCount extends AilmentData {
  herbCount: number;
}

export default function CategoryAilmentsPage() {
  const params = useParams();
  const categorySlug = params.slug as string;

  const [ailments, setAilments] = useState<AilmentWithHerbCount[]>([]);
  const [loading, setLoading] = useState(true);

  const visual = getCategoryVisual(categorySlug);
  const categoryName = visual?.name || categorySlug.replace(/-/g, ' ');

  useEffect(() => {
    const loadAilments = async () => {
      setLoading(true);
      try {
        const staticAilments = getAilmentsByCategory(categorySlug);
        const herbsSnapshot = await getDocs(collection(db, 'herbs'));
        const allHerbs = herbsSnapshot.docs.map((docSnap) => ({
          id: docSnap.id,
          ...docSnap.data(),
        }));

        const ailmentsWithCounts = staticAilments.map((ailment) => ({
          ...ailment,
          herbCount: countMatchingHerbs(allHerbs, ailment),
        }));

        ailmentsWithCounts.sort((a, b) => a.name.localeCompare(b.name));
        setAilments(ailmentsWithCounts);
      } catch (error) {
        console.error('Error loading ailments:', error);
        setAilments(
          getAilmentsByCategory(categorySlug).map((ailment) => ({
            ...ailment,
            herbCount: 0,
          }))
        );
      } finally {
        setLoading(false);
      }
    };

    loadAilments();
  }, [categorySlug]);

  if (loading) {
    return <LoadingScreen label="Loading conditions…" />;
  }

  const withRemedies = ailments.filter((ailment) => ailment.herbCount > 0).length;

  return (
    <EditorialPage>
      <PageHero
        eyebrow={isCategorySlug(categorySlug) ? 'Category' : 'Catalogue'}
        title={categoryName}
        subtitle={
          visual?.description ||
          'Select a condition to see herbs whose recorded benefits actually mention it.'
        }
        backHref="/category"
        backLabel="All categories"
      >
        {isCategorySlug(categorySlug) && (
          <div className="mt-8">
            <CategoryGlyphMark
              slug={categorySlug}
              className="h-16 w-16 border-cream/20 bg-white/10 text-cream"
            />
          </div>
        )}
      </PageHero>

      <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6 lg:px-8">
        {ailments.length === 0 ? (
          <div className="rounded-3xl border border-forest/10 bg-white p-12 text-center shadow-soft">
            <h2 className="font-serif text-2xl text-forest mb-3">No conditions in this category yet</h2>
            <p className="text-ink-muted mb-6">
              We publish conditions only when we can match them to real herb records.
            </p>
            <Link href="/category" className="text-sm font-medium text-bronze hover:text-forest">
              Browse categories
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {ailments.map((ailment) => (
              <Link
                key={ailment.id}
                href={`/ailment/${ailment.id}`}
                className="group flex flex-col rounded-3xl border border-forest/10 bg-white p-7 shadow-soft transition-all duration-500 hover:-translate-y-1 hover:shadow-lift"
              >
                <div className="flex items-start justify-between gap-3 mb-4">
                  <h2 className="font-serif text-2xl text-forest leading-tight">{ailment.name}</h2>
                  {ailment.commonInAfrica && (
                    <span className="shrink-0 rounded-full bg-cream px-3 py-1 text-[10px] tracking-[0.14em] uppercase text-bronze">
                      Common in Africa
                    </span>
                  )}
                </div>
                <p className="text-sm leading-relaxed text-ink-muted line-clamp-3 mb-6">
                  {ailment.description}
                </p>
                <div className="mt-auto flex items-center justify-between border-t border-forest/10 pt-4">
                  <span className="text-xs text-ink-muted">
                    {(ailment.symptoms || []).slice(0, 2).join(' · ')}
                  </span>
                  <span
                    className={`inline-flex items-center gap-1 rounded-full px-3 py-1 text-xs font-medium ${
                      ailment.herbCount > 0
                        ? 'bg-forest text-cream'
                        : 'bg-cream text-ink-muted'
                    }`}
                  >
                    {ailment.herbCount > 0
                      ? `${ailment.herbCount} ${ailment.herbCount === 1 ? 'remedy' : 'remedies'}`
                      : 'None in library'}
                    {ailment.herbCount > 0 && (
                      <ArrowRight className="h-3 w-3 transition-transform group-hover:translate-x-0.5" />
                    )}
                  </span>
                </div>
              </Link>
            ))}
          </div>
        )}

        <div className="mt-16 grid grid-cols-2 md:grid-cols-3 gap-4">
          {[
            { n: ailments.length, label: 'Conditions' },
            { n: withRemedies, label: 'With matching herbs' },
            { n: ailments.filter((a) => a.commonInAfrica).length, label: 'Common in Africa' },
          ].map((stat) => (
            <div key={stat.label} className="rounded-3xl border border-forest/10 bg-white p-6 text-center shadow-soft">
              <div className="font-serif text-3xl text-forest">{stat.n}</div>
              <div className="mt-1 text-xs tracking-[0.16em] uppercase text-ink-muted">{stat.label}</div>
            </div>
          ))}
        </div>

        <div className="mt-10">
          <DisclaimerNote>
            Counts reflect herbs whose name, description, or recorded benefits mention this condition.
            They are educational, not a diagnosis. Always consult a qualified clinician before treatment.
          </DisclaimerNote>
        </div>
      </div>
    </EditorialPage>
  );
}
