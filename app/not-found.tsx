import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="min-h-screen bg-cream flex items-center justify-center px-4 py-16">
      <div className="max-w-lg w-full bg-white rounded-3xl border border-forest/10 shadow-soft p-8 text-center">
        <p className="text-sm font-semibold uppercase tracking-[0.2em] text-bronze">Page not found</p>
        <h1 className="mt-3 font-serif text-3xl text-forest">Let us take you somewhere useful</h1>
        <p className="mt-3 text-ink-muted">
          That link is missing or out of date. Choose a destination below to keep going.
        </p>
        <div className="mt-8 grid gap-3">
          <Link href="/" className="rounded-full bg-forest text-cream px-5 py-3 text-sm font-medium hover:bg-forest-mist">
            Home
          </Link>
          <Link href="/consultations" className="rounded-full border border-forest/20 px-5 py-3 text-sm font-medium text-forest hover:bg-cream">
            My consultations
          </Link>
          <Link href="/practitioners/dashboard" className="rounded-full border border-forest/20 px-5 py-3 text-sm font-medium text-forest hover:bg-cream">
            Practitioner dashboard
          </Link>
          <Link href="/practitioners" className="rounded-full border border-forest/20 px-5 py-3 text-sm font-medium text-forest hover:bg-cream">
            Find a practitioner
          </Link>
          <Link href="/contact" className="rounded-full border border-forest/20 px-5 py-3 text-sm font-medium text-forest hover:bg-cream">
            Contact support
          </Link>
        </div>
      </div>
    </div>
  );
}
