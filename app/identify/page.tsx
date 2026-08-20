'use client';

import HerbIdentifier from '@/components/HerbIdentifier';

export default function IdentifyPage() {
  return (
    <div className="min-h-screen bg-cream">
      <div className="bg-forest text-white py-12 px-4">
        <div className="max-w-3xl mx-auto">
          <h1 className="font-serif text-3xl sm:text-4xl">Identify a herb</h1>
          <p className="mt-3 text-cream/80">
            Photograph a plant or upload a picture. We will name it and show traditional uses.
          </p>
        </div>
      </div>
      <div className="max-w-3xl mx-auto px-4 py-10">
        <HerbIdentifier />
      </div>
    </div>
  );
}
