import { PageHero, EditorialPage } from '@/components/editorial/PageHero';

export const metadata = {
  title: 'Privacy Policy | RemedyAfrica',
  description: 'How RemedyAfrica collects, uses, and protects your personal information.',
};

export default function PrivacyPage() {
  return (
    <EditorialPage>
      <PageHero
        eyebrow="Trust"
        title="Privacy policy"
        subtitle="Last updated 29 April 2026. How we collect, use, and protect your information."
        backHref="/"
        backLabel="Home"
      />
      <div className="max-w-3xl mx-auto px-4 py-16">
        <div className="bg-white rounded-3xl border border-forest/10 shadow-soft p-8 sm:p-10 space-y-8">
          <section>
            <h2 className="font-serif text-2xl text-forest mb-3">1. Information we collect</h2>
            <p className="text-ink-muted leading-relaxed">
              We collect account information (name, email, phone), profile information, usage data, and payment information processed securely by our payment partners.
            </p>
          </section>
          <section>
            <h2 className="font-serif text-2xl text-forest mb-3">2. How we use your information</h2>
            <p className="text-ink-muted leading-relaxed">
              To provide and improve our services, match you with remedies and practitioners, process payments, send notifications, and comply with legal obligations.
            </p>
          </section>
          <section>
            <h2 className="font-serif text-2xl text-forest mb-3">3. Data security</h2>
            <p className="text-ink-muted leading-relaxed">
              We use Firebase (Google Cloud) with industry-standard encryption. Passwords are hashed and never stored in plain text.
            </p>
          </section>
          <section>
            <h2 className="font-serif text-2xl text-forest mb-3">4. Your rights</h2>
            <p className="text-ink-muted leading-relaxed">
              You have the right to access, correct, or delete your data. Contact us to exercise these rights.
            </p>
          </section>
          <section>
            <h2 className="font-serif text-2xl text-forest mb-3">5. Contact</h2>
            <p className="text-ink-muted leading-relaxed">
              For privacy questions, email <a href="mailto:privacy@remedyafrica.com" className="text-bronze hover:text-forest">privacy@remedyafrica.com</a>.
            </p>
          </section>
        </div>
      </div>
    </EditorialPage>
  );
}
