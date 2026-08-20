import { EditorialPage, PageHero } from '@/components/editorial/PageHero';
import Link from 'next/link';

export const metadata = {
  title: 'Offline | RemedyAfrica',
  description: 'RemedyAfrica needs a connection for Identify, the library, and consultations.',
};

export default function OfflinePage() {
  return (
    <EditorialPage>
      <PageHero
        eyebrow="The compound"
        title="You are offline."
        subtitle="Identify, the library, and consultations need a connection. Reconnect, then try again."
        backHref="/"
        backLabel="Home"
      />
      <div className="mx-auto max-w-xl px-4 py-16 text-center">
        <Link
          href="/"
          className="inline-flex rounded-full bg-forest px-6 py-3 text-sm font-medium text-cream hover:bg-forest-mist"
        >
          Try again
        </Link>
      </div>
    </EditorialPage>
  );
}
