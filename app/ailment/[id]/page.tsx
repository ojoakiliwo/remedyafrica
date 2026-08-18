'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '@/lib/firebase/client';
import { getAilmentById, relatedAilmentIds, AilmentData } from '@/lib/data/ailments';
import { findMatchingHerbs } from '@/lib/herb-matching';
import { CategoryGlyphMark } from '@/components/icons/CategoryGlyph';
import { HerbPreviewCard, PreviewHerb } from '@/components/editorial/HerbPreviewCard';
import { EditorialPage, PageHero, LoadingScreen, DisclaimerNote } from '@/components/editorial/PageHero';
import { Leaf } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function AilmentDetailPage() {
  const params = useParams();
  const router = useRouter();
  const ailmentId = params.id as string;

  const [ailment, setAilment] = useState<AilmentData | null>(null);
  const [availableHerbs, setAvailableHerbs] = useState<PreviewHerb[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadAilmentData = async () => {
      setLoading(true);
      try {
        const staticAilment = getAilmentById(ailmentId);
        if (!staticAilment) {
          setAilment(null);
          setLoading(false);
          return;
        }

        setAilment(staticAilment);

        const herbsSnapshot = await getDocs(collection(db, 'herbs'));
        const allHerbs = herbsSnapshot.docs.map((docSnap) => ({
          id: docSnap.id,
          ...docSnap.data(),
        })) as PreviewHerb[];

        setAvailableHerbs(findMatchingHerbs(allHerbs, staticAilment));
      } catch (error) {
        console.error('Error loading ailment:', error);
      } finally {
        setLoading(false);
      }
    };

    loadAilmentData();
  }, [ailmentId]);

  if (loading) {
    return <LoadingScreen label="Loading remedies…" />;
  }

  if (!ailment) {
    return (
      <EditorialPage>
        <div className="mx-auto max-w-md px-4 py-32 text-center">
          <h1 className="font-serif text-3xl text-forest mb-4">Condition not found</h1>
          <p className="text-ink-muted mb-8">We could not find this condition in the catalogue.</p>
          <Link href="/category" className="text-sm font-medium text-bronze hover:text-forest">
            Browse categories
          </Link>
        </div>
      </EditorialPage>
    );
  }

  const related = (relatedAilmentIds[ailment.id] || [])
    .map((id) => getAilmentById(id))
    .filter(Boolean) as AilmentData[];

  return (
    <EditorialPage>
      <PageHero
        eyebrow={ailment.categoryLabel}
        title={ailment.name}
        subtitle={ailment.description}
        backHref={`/category/${ailment.category}`}
        backLabel={ailment.categoryLabel}
      >
        <div className="mt-8 flex flex-wrap items-center gap-4">
          <CategoryGlyphMark
            slug={ailment.category}
            className="h-16 w-16 border-cream/20 bg-white/10 text-cream"
          />
          {ailment.commonInAfrica && (
            <span className="rounded-full border border-cream/20 px-4 py-1.5 text-[11px] tracking-[0.18em] uppercase text-bronze">
              Common in Africa
            </span>
          )}
        </div>
      </PageHero>

      <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6 lg:px-8">
        <div className="grid lg:grid-cols-12 gap-10">
          <div className="lg:col-span-5">
            <p className="eyebrow mb-4">Common signs</p>
            <h2 className="font-serif text-3xl text-forest mb-6">What people often notice</h2>
            <ul className="space-y-3">
              {(ailment.symptoms || []).map((symptom) => (
                <li
                  key={symptom}
                  className="flex items-start gap-3 rounded-2xl border border-forest/10 bg-white px-4 py-3 text-sm text-ink"
                >
                  <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-bronze" />
                  {symptom}
                </li>
              ))}
            </ul>
          </div>
          <div className="lg:col-span-7">
            <DisclaimerNote>
              <p className="mb-3 text-ink">{ailment.medicalDisclaimer}</p>
              <p>
                Confirm a diagnosis with a licensed clinician before using herbal remedies, especially
                alongside prescription medicine.
              </p>
            </DisclaimerNote>
          </div>
        </div>

        <section className="mt-20">
          <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4 mb-10">
            <div>
              <p className="eyebrow mb-3">In the library</p>
              <h2 className="font-serif text-3xl sm:text-4xl text-forest">
                {availableHerbs.length > 0
                  ? `${availableHerbs.length} matching ${availableHerbs.length === 1 ? 'remedy' : 'remedies'}`
                  : `No matching remedies for ${ailment.name}`}
              </h2>
              <p className="mt-3 max-w-xl text-ink-muted">
                {availableHerbs.length > 0
                  ? `These herbs mention ${ailment.name.toLowerCase()} in their recorded benefits or description.`
                  : `None of our herb records currently mention ${ailment.name} by name or by a specific synonym. We will not invent a count.`}
              </p>
            </div>
            {availableHerbs.length > 0 && (
              <Button
                onClick={() =>
                  router.push(
                    `/herbs?ailment=${ailmentId}&name=${encodeURIComponent(ailment.name)}`
                  )
                }
              >
                Open full list
              </Button>
            )}
          </div>

          {availableHerbs.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {availableHerbs.map((herb) => (
                <HerbPreviewCard key={herb.id} herb={herb} />
              ))}
            </div>
          ) : (
            <div className="rounded-3xl border border-forest/10 bg-white p-10 shadow-soft">
              <div className="flex h-14 w-14 items-center justify-center rounded-full bg-cream mb-5">
                <Leaf className="h-6 w-6 text-bronze" />
              </div>
              <p className="font-serif text-2xl text-forest mb-3">Nothing in the library yet</p>
              <p className="text-ink-muted max-w-xl mb-8">
                This is not a placeholder. The category list uses the same matching rules as this page,
                so a zero here means a zero there.
              </p>
              {related.length > 0 && (
                <div>
                  <p className="text-[11px] tracking-[0.2em] uppercase text-bronze mb-3">Related conditions</p>
                  <div className="flex flex-wrap gap-2">
                    {related.map((item) => (
                      <Link
                        key={item.id}
                        href={`/ailment/${item.id}`}
                        className="rounded-full border border-forest/15 bg-cream px-4 py-2 text-sm text-forest hover:bg-forest hover:text-cream transition-colors"
                      >
                        {item.name}
                      </Link>
                    ))}
                  </div>
                </div>
              )}
              <div className="mt-8 flex flex-wrap gap-3">
                <Link href={`/category/${ailment.category}`}>
                  <Button variant="outline">Browse {ailment.categoryLabel}</Button>
                </Link>
                <Link href="/search">
                  <Button>Search by symptom</Button>
                </Link>
              </div>
            </div>
          )}
        </section>
      </div>
    </EditorialPage>
  );
}
