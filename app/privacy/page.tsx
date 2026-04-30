// app/privacy/page.tsx

import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';

export const metadata = {
  title: 'Privacy Policy | RemedyAfrica',
  description: 'How RemedyAfrica collects, uses, and protects your personal information.',
};

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-[#F5F5F0]">
      <div className="bg-[#2C3E2D] text-white py-8 px-4">
        <div className="max-w-3xl mx-auto">
          <Link href="/" className="text-[#97A97C] hover:text-white text-sm flex items-center gap-1 mb-4">
            <ArrowLeft className="w-4 h-4" />
            Back to Home
          </Link>
          <h1 className="text-3xl font-bold">Privacy Policy</h1>
          <p className="text-gray-300 mt-2">Last updated: April 29, 2026</p>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-4 py-12">
        <div className="bg-white rounded-xl shadow-sm p-8 space-y-8">
          
          <section>
            <h2 className="text-xl font-bold text-[#2C3E2D] mb-3">1. Information We Collect</h2>
            <p className="text-gray-600 leading-relaxed">
              We collect account information (name, email, phone), profile information, usage data, and payment information processed securely by our payment partners.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-[#2C3E2D] mb-3">2. How We Use Your Information</h2>
            <p className="text-gray-600 leading-relaxed">
              To provide and improve our services, match you with remedies and practitioners, process payments, send notifications, and comply with legal obligations.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-[#2C3E2D] mb-3">3. Data Security</h2>
            <p className="text-gray-600 leading-relaxed">
              We use Firebase (Google Cloud) with industry-standard encryption. Passwords are hashed and never stored in plain text.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-[#2C3E2D] mb-3">4. Your Rights</h2>
            <p className="text-gray-600 leading-relaxed">
              You have the right to access, correct, or delete your data. Contact us to exercise these rights.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-[#2C3E2D] mb-3">5. Contact Us</h2>
            <p className="text-gray-600 leading-relaxed">
              For privacy questions, email <a href="mailto:privacy@remedyafrica.com" className="text-[#97A97C] hover:underline">privacy@remedyafrica.com</a>.
            </p>
          </section>

        </div>
      </div>
    </div>
  );
}