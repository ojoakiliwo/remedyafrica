import { EditorialPage, PageHero } from '@/components/editorial/PageHero';
import GetTheAppActions from '@/components/GetTheAppActions';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Get the RemedyAfrica app',
  description:
    'Open RemedyAfrica on your phone, identify a plant, and add it to your home screen. Educational herbal knowledge — not a medical diagnosis.',
  alternates: { canonical: '/get-the-app' },
  openGraph: {
    title: 'Get the RemedyAfrica app',
    description: 'Identify a plant. Put it on your home screen.',
    url: '/get-the-app',
    siteName: 'RemedyAfrica',
    type: 'website',
    images: [{ url: '/og-get-the-app.png', width: 1200, height: 630, alt: 'RemedyAfrica app' }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Get the RemedyAfrica app',
    description: 'Identify a plant. Put it on your home screen.',
    images: ['/og-get-the-app.png'],
  },
};

export default function GetTheAppPage() {
  return (
    <EditorialPage>
      <PageHero
        eyebrow="The compound"
        title="Put RemedyAfrica on your phone."
        subtitle="Open this page in Chrome or Safari. Identify a plant, then add the app to your home screen. There is no Play Store listing yet — this is the app."
        backHref="/"
        backLabel="Home"
      />
      <GetTheAppActions />
    </EditorialPage>
  );
}
