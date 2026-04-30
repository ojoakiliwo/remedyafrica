// components/Footer.tsx

import Link from 'next/link';

export default function Footer() {
  return (
    <footer className="bg-[#2C3E2D] text-white py-8 px-4 mt-auto">
      <div className="max-w-6xl mx-auto">
        <div className="grid md:grid-cols-4 gap-8 mb-8">
          <div>
            <h3 className="text-[#97A97C] font-bold text-lg mb-2">RemedyAfrica</h3>
            <p className="text-gray-400 text-sm">Natural healing, rooted in African tradition.</p>
          </div>
          <div>
            <h4 className="font-medium mb-2">Platform</h4>
            <ul className="space-y-1 text-sm text-gray-400">
              <li><Link href="/search" className="hover:text-[#97A97C]">Search Remedies</Link></li>
              <li><Link href="/practitioners" className="hover:text-[#97A97C]">Find Practitioners</Link></li>
              <li><Link href="/subscription" className="hover:text-[#97A97C]">Pricing</Link></li>
            </ul>
          </div>
          <div>
            <h4 className="font-medium mb-2">Company</h4>
            <ul className="space-y-1 text-sm text-gray-400">
              <li><Link href="/contact" className="hover:text-[#97A97C]">Contact</Link></li>
              <li><Link href="/terms" className="hover:text-[#97A97C]">Terms of Service</Link></li>
              <li><Link href="/privacy" className="hover:text-[#97A97C]">Privacy Policy</Link></li>
            </ul>
          </div>
          <div>
            <h4 className="font-medium mb-2">Connect</h4>
            <p className="text-sm text-gray-400">hello@remedyafrica.com</p>
            <p className="text-sm text-gray-400">Lagos, Nigeria</p>
          </div>
        </div>
        <div className="border-t border-gray-700 pt-4 text-center text-sm text-gray-500">
          © 2026 RemedyAfrica. All rights reserved.
        </div>
      </div>
    </footer>
  );
}