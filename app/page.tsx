'use client';

import Link from 'next/link';
import { useAuth } from '@/providers/AuthProvider';
import { Button } from '@/components/ui/button';
import {
  Users,
  Calendar,
  MessageCircle,
  Search,
  ArrowRight,
  Shield,
  Video,
  Leaf,
  Camera,
  HeartHandshake,
} from 'lucide-react';
import { useState, useEffect } from 'react';
import HerbIdentifier from '@/components/HerbIdentifier';
import FeaturedRemedies from '@/components/home/FeaturedRemedies';
import { CategoryGrid } from '@/components/CategoryGrid';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase/client';

const HERO_IMAGE =
  'https://images.unsplash.com/photo-1518531933037-91b2f5f229cc?auto=format&fit=crop&w=2000&q=80';

const pathways = [
  {
    href: '/search',
    title: 'Ask about a symptom',
    copy: 'Describe how you feel in plain language. We suggest traditional remedies and next steps.',
    icon: Search,
    action: 'Search remedies',
  },
  {
    href: '/practitioners',
    title: 'Meet a healer',
    copy: 'Browse verified practitioners across Africa. See specialties, ratings, and availability.',
    icon: Users,
    action: 'Find a healer',
  },
  {
    href: '/booking',
    title: 'Book a consultation',
    copy: 'Talk privately by video or audio. Get guidance that fits your home and your budget.',
    icon: Calendar,
    action: 'Book now',
  },
  {
    href: '/forum',
    title: 'Join the community',
    copy: 'Ask questions and share experience with people walking the same path.',
    icon: MessageCircle,
    action: 'Open forum',
  },
];

export default function HomePage() {
  const { user } = useAuth();
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    const checkAdmin = async () => {
      if (!user) {
        setIsAdmin(false);
        return;
      }
      try {
        const userDoc = await getDoc(doc(db, 'users', user.uid));
        if (userDoc.exists()) {
          const userData = userDoc.data();
          setIsAdmin(userData.role === 'admin' || userData.isAdmin === true);
        } else {
          setIsAdmin(false);
        }
      } catch {
        setIsAdmin(false);
      }
    };
    checkAdmin();
  }, [user]);

  return (
    <div className="min-h-screen bg-cream text-ink">
      <section className="relative min-h-[88vh] flex items-end overflow-hidden">
        <img
          src={HERO_IMAGE}
          alt=""
          className="absolute inset-0 h-full w-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-forest-deep/90 via-forest-deep/70 to-forest-deep/25" />
        <div className="absolute inset-0 bg-grain opacity-[0.18] mix-blend-overlay" />

        <div className="relative z-10 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-16 pt-28 md:pb-24">
          <p className="eyebrow text-bronze">Traditional African medicine</p>
          <div className="hairline mt-5 mb-7 bg-bronze" />
          <h1 className="max-w-3xl font-serif text-4xl sm:text-6xl md:text-7xl leading-[1.05] text-cream">
            Healing, rooted in Africa — open to every home.
          </h1>
          <p className="mt-6 max-w-xl text-base sm:text-lg leading-relaxed text-cream/80">
            Trusted herbal knowledge and verified healers, presented with the same care whether you are just starting or have practised for years.
          </p>
          <div className="mt-10 flex flex-col sm:flex-row gap-3">
            <Link href="/practitioners">
              <Button size="lg" className="w-full sm:w-auto bg-cream text-forest hover:bg-white">
                Find a healer
              </Button>
            </Link>
            <Link href="/search">
              <Button size="lg" variant="outline" className="w-full sm:w-auto border-cream/40 text-cream hover:bg-cream hover:text-forest">
                Explore remedies
              </Button>
            </Link>
          </div>
        </div>
      </section>

      <section className="border-y border-forest/10 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 grid grid-cols-1 sm:grid-cols-3 gap-6 text-center sm:text-left">
          {[
            { icon: Shield, label: 'Verified practitioners' },
            { icon: Camera, label: 'Identify a plant in seconds' },
            { icon: HeartHandshake, label: 'Care that stays private' },
          ].map((item) => (
            <div key={item.label} className="flex items-center justify-center sm:justify-start gap-3">
              <item.icon className="h-5 w-5 text-bronze" />
              <p className="text-sm font-medium text-ink">{item.label}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-12">
            <p className="eyebrow">AI companion</p>
            <h2 className="mt-4 text-3xl sm:text-4xl text-forest">See a plant. Know its story.</h2>
            <p className="mt-4 text-ink-muted max-w-2xl mx-auto">
              Photograph a leaf, a root, or a market bundle. We identify it and point you to traditional uses in our library.
            </p>
          </div>
          <HerbIdentifier />
        </div>
      </section>

      <section className="py-8 px-4 sm:px-6 lg:px-8 bg-white">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-6 mb-12">
            <div>
              <p className="eyebrow">From the compound</p>
              <h2 className="mt-4 text-3xl sm:text-4xl text-forest">Plants you already know</h2>
              <p className="mt-4 text-ink-muted max-w-xl">
                Bitter leaf, scent leaf, dogoyaro, ginger, zobo — everyday plants from Nigerian gardens, markets, and roadside hedges.
              </p>
            </div>
            <Link href="/search" className="inline-flex items-center gap-2 text-sm font-medium text-forest hover:text-bronze">
              Browse all herbs <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
          <FeaturedRemedies />
        </div>
      </section>

      <section className="py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-6 mb-12">
            <div>
              <p className="eyebrow">By concern</p>
              <h2 className="mt-4 text-3xl sm:text-4xl text-forest">Find a path by how you feel</h2>
              <p className="mt-4 text-ink-muted max-w-xl">
                Counts are live from the herb library — the same herbs you will see inside each condition.
              </p>
            </div>
            <Link href="/category" className="inline-flex items-center gap-2 text-sm font-medium text-forest hover:text-bronze">
              All categories <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
          <CategoryGrid />
        </div>
      </section>

      <section className="py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-14">
            <p className="eyebrow">Your path</p>
            <h2 className="mt-4 text-3xl sm:text-4xl text-forest">Start where you are</h2>
            <p className="mt-4 text-ink-muted max-w-2xl mx-auto">
              No specialist language required. Choose a door, and we walk with you.
            </p>
          </div>
          <div className="grid md:grid-cols-2 gap-5">
            {pathways.map((item) => (
              <Link key={item.href} href={item.href} className="group">
                <div className="h-full rounded-3xl border border-forest/10 bg-white p-8 shadow-soft transition-all duration-500 hover:-translate-y-1 hover:shadow-lift">
                  <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-full bg-cream">
                    <item.icon className="h-5 w-5 text-forest" />
                  </div>
                  <h3 className="font-serif text-2xl text-forest">{item.title}</h3>
                  <p className="mt-3 text-ink-muted leading-relaxed">{item.copy}</p>
                  <span className="mt-6 inline-flex items-center gap-2 text-sm font-medium text-bronze">
                    {item.action} <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                  </span>
                </div>
              </Link>
            ))}

            <Link href="/profile" className="group">
              <div className="h-full rounded-3xl border border-forest/10 bg-white p-8 shadow-soft transition-all duration-500 hover:-translate-y-1 hover:shadow-lift">
                <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-full bg-cream">
                  <Video className="h-5 w-5 text-forest" />
                </div>
                <h3 className="font-serif text-2xl text-forest">Your consultations</h3>
                <p className="mt-3 text-ink-muted leading-relaxed">
                  Join a scheduled call or review notes from past sessions — on your phone or a larger screen.
                </p>
                <span className="mt-6 inline-flex items-center gap-2 text-sm font-medium text-bronze">
                  Go to dashboard <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                </span>
              </div>
            </Link>

            {isAdmin && (
              <Link href="/admin" className="group">
                <div className="h-full rounded-3xl bg-forest text-cream p-8 shadow-soft transition-all duration-500 hover:-translate-y-1 hover:shadow-lift">
                  <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-full bg-white/10">
                    <Shield className="h-5 w-5 text-cream" />
                  </div>
                  <h3 className="font-serif text-2xl">Admin</h3>
                  <p className="mt-3 text-cream/70 leading-relaxed">
                    Manage herbs, photos, and practitioner applications.
                  </p>
                  <span className="mt-6 inline-flex items-center gap-2 text-sm font-medium text-bronze">
                    Open dashboard <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                  </span>
                </div>
              </Link>
            )}
          </div>
        </div>
      </section>

      <section className="relative overflow-hidden py-24 px-4">
        <div className="absolute inset-0 bg-forest" />
        <div className="absolute inset-0 bg-grain opacity-20 mix-blend-overlay" />
        <div className="relative max-w-3xl mx-auto text-center text-cream">
          <p className="eyebrow text-bronze">For healers</p>
          <h2 className="mt-4 text-3xl sm:text-5xl">Practise with dignity. Reach further.</h2>
          <p className="mt-6 text-lg text-cream/75 leading-relaxed">
            Join a network of verified traditional practitioners. Offer consultations, share knowledge, and grow a practice that still feels like home.
          </p>
          <div className="mt-10 flex flex-col sm:flex-row gap-3 justify-center">
            <Link href="/practitioners/apply">
              <Button size="lg" className="w-full sm:w-auto bg-cream text-forest hover:bg-white">
                Apply as a practitioner
              </Button>
            </Link>
            <Link href="/subscription">
              <Button size="lg" variant="outline" className="w-full sm:w-auto border-cream/30 text-cream hover:bg-cream hover:text-forest">
                View plans
              </Button>
            </Link>
          </div>
        </div>
      </section>

      <section className="py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-6xl mx-auto grid md:grid-cols-3 gap-12">
          {[
            {
              icon: Leaf,
              title: 'Lived knowledge',
              copy: 'Centuries of African herbal practice, written clearly so families and clinicians can both use it.',
            },
            {
              icon: Video,
              title: 'Face to face',
              copy: 'Private video and audio rooms — no clinic travel required, no loss of respect.',
            },
            {
              icon: Shield,
              title: 'People you can trust',
              copy: 'Every healer is reviewed before they appear. Your safety is part of the design.',
            },
          ].map((item) => (
            <div key={item.title} className="text-center md:text-left">
              <div className="mx-auto md:mx-0 mb-5 flex h-12 w-12 items-center justify-center rounded-full border border-bronze/40">
                <item.icon className="h-5 w-5 text-bronze" />
              </div>
              <h3 className="font-serif text-2xl text-forest">{item.title}</h3>
              <p className="mt-3 text-ink-muted leading-relaxed">{item.copy}</p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
