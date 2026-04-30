// app/terms/page.tsx

import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';

export const metadata = {
  title: 'Terms of Service | RemedyAfrica',
  description: 'Terms of Service for RemedyAfrica platform users and practitioners.',
};

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-[#F5F5F0]">
      <div className="bg-[#2C3E2D] text-white py-8 px-4">
        <div className="max-w-3xl mx-auto">
          <Link href="/" className="text-[#97A97C] hover:text-white text-sm flex items-center gap-1 mb-4">
            <ArrowLeft className="w-4 h-4" />
            Back to Home
          </Link>
          <h1 className="text-3xl font-bold">Terms of Service</h1>
          <p className="text-gray-300 mt-2">Last updated: April 29, 2026</p>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-4 py-12">
        <div className="bg-white rounded-xl shadow-sm p-8 space-y-8">
          
          <section>
            <h2 className="text-xl font-bold text-[#2C3E2D] mb-3">1. Acceptance of Terms</h2>
            <p className="text-gray-600 leading-relaxed">
              By accessing or using RemedyAfrica, you agree to be bound by these Terms of Service. If you do not agree, please do not use our platform. RemedyAfrica connects users with traditional herbal remedies and verified practitioners for informational and consultation purposes only.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-[#2C3E2D] mb-3">2. Not Medical Advice</h2>
            <p className="text-gray-600 leading-relaxed">
              <strong>Important:</strong> Information on RemedyAfrica is for educational and informational purposes only. It is not intended as a substitute for professional medical advice, diagnosis, or treatment. Always seek the advice of a licensed healthcare provider for any medical condition.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-[#2C3E2D] mb-3">3. User Accounts</h2>
            <p className="text-gray-600 leading-relaxed">
              You must be at least 18 years old to create an account. You are responsible for maintaining the confidentiality of your account credentials and for all activities under your account.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-[#2C3E2D] mb-3">4. Practitioner Services</h2>
            <p className="text-gray-600 leading-relaxed">
              Practitioners on RemedyAfrica are independent contractors, not employees. We verify credentials and identity but do not guarantee outcomes. Consultations are informational and do not establish a doctor-patient relationship.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-[#2C3E2D] mb-3">5. Limitation of Liability</h2>
            <p className="text-gray-600 leading-relaxed">
              To the fullest extent permitted by law, RemedyAfrica shall not be liable for any indirect, incidental, or consequential damages arising from your use of the platform.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-[#2C3E2D] mb-3">6. Contact</h2>
            <p className="text-gray-600 leading-relaxed">
              Questions? Contact us at <a href="mailto:hello@remedyafrica.com" className="text-[#97A97C] hover:underline">hello@remedyafrica.com</a>.
            </p>
          </section>

        </div>
      </div>
    </div>
  );
}