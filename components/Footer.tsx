'use client';

import Link from 'next/link';
import { Leaf, Instagram, Twitter, Mail, MapPin } from 'lucide-react';

export function Footer() {
  return (
    <footer className="bg-[#2C3E2D] text-[#F5F5DC] mt-20">
      <div className="container mx-auto px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div className="space-y-4">
            <div className="flex items-center space-x-2">
              <Leaf className="h-6 w-6 text-[#97A97C]" />
              <span className="text-xl font-bold">RemedyAfrica</span>
            </div>
            <p className="text-sm text-[#F5F5DC]/70 max-w-xs">
              Preserving and sharing ancient African herbal wisdom for modern wellness.
            </p>
          </div>
          
          <div>
            <h4 className="font-semibold mb-4 text-[#97A97C]">Explore</h4>
            <ul className="space-y-2 text-sm">
              <li><Link href="/" className="hover:text-[#97A97C] transition-colors">Home</Link></li>
              <li><Link href="/subscription" className="hover:text-[#97A97C] transition-colors">Pricing</Link></li>
            </ul>
          </div>
          
          <div>
            <h4 className="font-semibold mb-4 text-[#97A97C]">Legal</h4>
            <ul className="space-y-2 text-sm">
              <li><Link href="/privacy" className="hover:text-[#97A97C] transition-colors">Privacy Policy</Link></li>
              <li><Link href="/terms" className="hover:text-[#97A97C] transition-colors">Terms of Service</Link></li>
            </ul>
          </div>
          
          <div>
            <h4 className="font-semibold mb-4 text-[#97A97C]">Connect</h4>
            <div className="flex space-x-4">
              <a href="#" aria-label="Follow us on Instagram" className="hover:text-[#97A97C] transition-colors">
                <Instagram className="h-5 w-5" />
              </a>
              <a href="#" aria-label="Follow us on Twitter" className="hover:text-[#97A97C] transition-colors">
                <Twitter className="h-5 w-5" />
              </a>
              <a href="#" aria-label="Email us" className="hover:text-[#97A97C] transition-colors">
                <Mail className="h-5 w-5" />
              </a>
            </div>
            <div className="mt-4 flex items-start space-x-2 text-sm text-[#F5F5DC]/70">
              <MapPin className="h-4 w-4 mt-0.5 flex-shrink-0" />
              <span>Lagos, Nigeria</span>
            </div>
          </div>
        </div>
        
        <div className="border-t border-[#F5F5DC]/10 mt-8 pt-8 text-center text-sm text-[#F5F5DC]/50">
          <p>&copy; {new Date().getFullYear()} RemedyAfrica. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
}