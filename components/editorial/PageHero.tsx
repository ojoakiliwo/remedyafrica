import { cn } from '@/lib/utils';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';

export function PageHero({
  eyebrow,
  title,
  subtitle,
  backHref,
  backLabel,
  children,
}: {
  eyebrow?: string;
  title: string;
  subtitle?: string;
  backHref?: string;
  backLabel?: string;
  children?: React.ReactNode;
}) {
  return (
    <section className="relative overflow-hidden bg-forest text-cream">
      <div className="absolute inset-0 bg-grain opacity-20 mix-blend-overlay" />
      <div className="relative mx-auto max-w-6xl px-4 py-16 sm:px-6 sm:py-20 lg:px-8">
        {backHref && (
          <Link
            href={backHref}
            className="mb-6 inline-flex items-center gap-2 text-sm text-cream/70 hover:text-cream"
          >
            <ArrowLeft className="h-4 w-4" />
            {backLabel || 'Back'}
          </Link>
        )}
        {eyebrow && <p className="eyebrow text-bronze">{eyebrow}</p>}
        <div className="hairline mt-5 mb-6 bg-bronze" />
        <h1 className="max-w-3xl font-serif text-4xl sm:text-5xl leading-tight">{title}</h1>
        {subtitle && (
          <p className="mt-5 max-w-2xl text-base sm:text-lg leading-relaxed text-cream/75">
            {subtitle}
          </p>
        )}
        {children}
      </div>
    </section>
  );
}

export function EditorialPage({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return <div className={cn('min-h-screen bg-cream text-ink', className)}>{children}</div>;
}

export function LoadingScreen({ label = 'Loading…' }: { label?: string }) {
  return (
    <div className="min-h-screen bg-cream flex items-center justify-center">
      <p className="text-ink-muted">{label}</p>
    </div>
  );
}

export function DisclaimerNote({ children }: { children: React.ReactNode }) {
  return (
    <div className="rounded-3xl border border-bronze/25 bg-white p-6 sm:p-8">
      <p className="eyebrow mb-3">Please note</p>
      <div className="text-sm leading-relaxed text-ink-muted">{children}</div>
    </div>
  );
}
