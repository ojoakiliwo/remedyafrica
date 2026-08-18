'use client';

import { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '@/lib/firebase/client';
import { getAilmentById } from '@/lib/data/ailments';
import { findMatchingHerbs } from '@/lib/herb-matching';
import { HerbPreviewCard, PreviewHerb } from '@/components/editorial/HerbPreviewCard';
import { EditorialPage, PageHero, LoadingScreen, DisclaimerNote } from '@/components/editorial/PageHero';

export default function HerbsListingPage() {
  const searchParams = useSearchParams();
  const ailmentId = searchParams.get('ailment');
  const ailmentName = searchParams.get('name');

  const [herbs, setHerbs] = useState<PreviewHerb[]>([]);
  const [loading, setLoading] = useState(true);
  const ailmentInfo = ailmentId ? getAilmentById(ailmentId) : null;

  useEffect(() => {
    const loadHerbs = async () => {
      setLoading(true);
      try {
        const snapshot = await getDocs(collection(db, 'herbs'));
        const herbsData = snapshot.docs.map((docSnap) => ({
          id: docSnap.id,
          ...docSnap.data(),
        })) as PreviewHerb[];

        if (ailmentInfo) {
          setHerbs(findMatchingHerbs(herbsData, ailmentInfo));
        } else if (ailmentName) {
          setHerbs(
            findMatchingHerbs(herbsData, {
              name: decodeURIComponent(ailmentName),
            })
          );
        } else {
          setHerbs(herbsData);
        }
      } catch (error) {
        console.error('Error loading herbs:', error);
      } finally {
        setLoading(false);
      }
    };

    loadHerbs();
  }, [ailmentId, ailmentName, ailmentInfo?.id]);

  if (loading) {
    return <LoadingScreen label="Loading remedies…" />;
  }

  return (
    <EditorialPage>
      <PageHero
        eyebrow="Remedies"
        title={ailmentInfo ? `Remedies for ${ailmentInfo.name}` : 'All herbal remedies'}
        subtitle={`${herbs.length} traditional ${herbs.length === 1 ? 'remedy' : 'remedies'} matched from the live library.`}
        backHref={ailmentId ? `/ailment/${ailmentId}` : '/category'}
        backLabel={ailmentInfo ? `Back to ${ailmentInfo.name}` : 'Categories'}
      />

      <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6 lg:px-8">
        {herbs.length === 0 ? (
          <div className="rounded-3xl border border-forest/10 bg-white p-12 text-center shadow-soft">
            <h2 className="font-serif text-2xl text-forest mb-3">No matching remedies</h2>
            <p className="text-ink-muted mb-6 max-w-md mx-auto">
              We only list herbs whose records mention this condition. Check back as the library grows,
              or consult a qualified traditional healer.
            </p>
            {ailmentId && (
              <Link href={`/ailment/${ailmentId}`} className="text-sm font-medium text-bronze hover:text-forest">
                Back to condition
              </Link>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {herbs.map((herb) => (
              <HerbPreviewCard key={herb.id} herb={herb} />
            ))}
          </div>
        )}

        <div className="mt-14">
          <DisclaimerNote>
            These traditional remedies should complement, not replace, professional medical treatment.
            Speak with a clinician before use if you are pregnant, nursing, or taking medication.
          </DisclaimerNote>
        </div>
      </div>
    </EditorialPage>
  );
}
