import Link from 'next/link';
import { Leaf } from 'lucide-react';

export default function Footer() {
  return (
    <footer className="bg-forest-deep text-cream pt-16 pb-8 px-4">
      <div className="max-w-7xl mx-auto">
        <div className="grid md:grid-cols-4 gap-10 mb-12">
          <div>
            <div className="flex items-center gap-2 mb-4">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-cream/10">
                <Leaf className="h-4 w-4 text-bronze" />
              </div>
              <h3 className="font-serif text-xl">RemedyAfrica</h3>
            </div>
            <p className="text-cream/60 text-sm leading-relaxed max-w-xs">
              Natural healing, rooted in African tradition — for every household.
            </p>
          </div>
          <div>
            <h4 className="text-[11px] tracking-[0.22em] uppercase text-bronze mb-4">Platform</h4>
            <ul className="space-y-2 text-sm text-cream/70">
              <li><Link href="/search" className="hover:text-cream">Search remedies</Link></li>
              <li><Link href="/category" className="hover:text-cream">Categories</Link></li>
              <li><Link href="/practitioners" className="hover:text-cream">Find practitioners</Link></li>
              <li><Link href="/subscription" className="hover:text-cream">Pricing</Link></li>
            </ul>
          </div>
          <div>
            <h4 className="text-[11px] tracking-[0.22em] uppercase text-bronze mb-4">Company</h4>
            <ul className="space-y-2 text-sm text-cream/70">
              <li><Link href="/contact" className="hover:text-cream">Contact</Link></li>
              <li><Link href="/terms" className="hover:text-cream">Terms of service</Link></li>
              <li><Link href="/privacy" className="hover:text-cream">Privacy policy</Link></li>
            </ul>
          </div>
          <div>
            <h4 className="text-[11px] tracking-[0.22em] uppercase text-bronze mb-4">Connect</h4>
            <p className="text-sm text-cream/70">hello@remedyafrica.com</p>
            <p className="text-sm text-cream/70 mt-1">Lagos, Nigeria</p>
          </div>
        </div>
        <div className="border-t border-cream/10 pt-6 text-center text-xs tracking-wide text-cream/40">
          © {new Date().getFullYear()} RemedyAfrica. All rights reserved.
        </div>
      </div>
    </footer>
  );
}
