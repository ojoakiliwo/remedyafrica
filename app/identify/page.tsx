'use client';

import Link from 'next/link';
import HerbIdentifier from '@/components/HerbIdentifier';
import { DisclaimerNote, EditorialPage, PageHero } from '@/components/editorial/PageHero';
import { Camera, Leaf, Upload } from 'lucide-react';

export default function IdentifyPage() {
  return (
    <EditorialPage>
      <PageHero
        eyebrow="The compound"
        title="Hold the plant up to the light."
        subtitle="Open your camera or upload a photograph. We name the plant and point you to traditional African uses in the library."
        backHref="/search"
        backLabel="Search the library"
      />

      <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="grid gap-8 lg:grid-cols-[minmax(0,1.2fr)_18rem]">
          <HerbIdentifier />

          <aside className="space-y-4">
            <div className="rounded-3xl border border-forest/10 bg-white p-6 shadow-soft">
              <p className="eyebrow mb-4">How it works</p>
              <ul className="space-y-4 text-sm text-ink-muted">
                <li className="flex gap-3">
                  <Camera className="h-5 w-5 shrink-0 text-bronze" />
                  Use a well-lit leaf or whole plant. Steady the camera, then capture.
                </li>
                <li className="flex gap-3">
                  <Upload className="h-5 w-5 shrink-0 text-bronze" />
                  Or upload a photo from your phone if the camera is busy.
                </li>
                <li className="flex gap-3">
                  <Leaf className="h-5 w-5 shrink-0 text-bronze" />
                  We match it, then you can open the library or save it when you are signed in.
                </li>
              </ul>
            </div>
            <DisclaimerNote>
              Identification is a starting point, not a diagnosis. Confirm plants with a trusted source before use, and book a verified practitioner for personal guidance.
            </DisclaimerNote>
            <p className="text-sm text-ink-muted">
              Lost? The{' '}
              <Link href="/support" className="text-bronze hover:text-forest">
                house guide
              </Link>{' '}
              can walk you through this page.
            </p>
          </aside>
        </div>
      </div>
    </EditorialPage>
  );
}
