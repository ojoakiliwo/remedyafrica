import { PageHero, EditorialPage } from '@/components/editorial/PageHero';

export const metadata = {
  title: 'Terms of Service | RemedyAfrica',
  description: 'Terms of Service for RemedyAfrica platform users and practitioners.',
};

export default function TermsPage() {
  return (
    <EditorialPage>
      <PageHero
        eyebrow="The agreement"
        title="Terms of service"
        subtitle="Last updated 29 April 2026. Please read these terms before using RemedyAfrica."
        backHref="/"
        backLabel="Home"
      />
      <div className="max-w-3xl mx-auto px-4 py-16">
        <div className="bg-white rounded-3xl border border-forest/10 shadow-soft p-8 sm:p-10 space-y-8">
          <section>
            <h2 className="font-serif text-2xl text-forest mb-3">1. Acceptance of terms</h2>
            <p className="text-ink-muted leading-relaxed">
              By accessing or using RemedyAfrica, you agree to be bound by these Terms of Service. If you do not agree, please do not use our platform. RemedyAfrica connects users with traditional herbal remedies and verified practitioners for informational and consultation purposes only.
            </p>
          </section>
          <section>
            <h2 className="font-serif text-2xl text-forest mb-3">2. Not medical advice</h2>
            <p className="text-ink-muted leading-relaxed">
              Information on RemedyAfrica is for educational and informational purposes only. It is not a substitute for professional medical advice, diagnosis, or treatment. Always seek the advice of a licensed healthcare provider for any medical condition.
            </p>
          </section>
          <section>
            <h2 className="font-serif text-2xl text-forest mb-3">3. User accounts</h2>
            <p className="text-ink-muted leading-relaxed">
              You must be at least 18 years old to create an account. You are responsible for maintaining the confidentiality of your account credentials and for all activities under your account.
            </p>
          </section>
          <section>
            <h2 className="font-serif text-2xl text-forest mb-3">4. Practitioner services</h2>
            <p className="text-ink-muted leading-relaxed">
              Practitioners on RemedyAfrica are independent contractors, not employees. We verify credentials and identity but do not guarantee outcomes. Consultations are informational and do not establish a doctor-patient relationship.
            </p>
          </section>
          <section>
            <h2 className="font-serif text-2xl text-forest mb-3">5. Limitation of liability</h2>
            <p className="text-ink-muted leading-relaxed">
              To the fullest extent permitted by law, RemedyAfrica shall not be liable for any indirect, incidental, or consequential damages arising from your use of the platform.
            </p>
          </section>
          <section>
            <h2 className="font-serif text-2xl text-forest mb-3">6. Contact</h2>
            <p className="text-ink-muted leading-relaxed">
              Questions? Write to <a href="mailto:hello@remedyafrica.com" className="text-bronze hover:text-forest">hello@remedyafrica.com</a>.
            </p>
          </section>
        </div>
      </div>
    </EditorialPage>
  );
}
