'use client';

import Link from 'next/link';
import { Leaf, Heart, Shield, Users, Globe, Award, ArrowRight, CheckCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { EditorialPage, PageHero } from '@/components/editorial/PageHero';

export default function AboutPage() {
  const values = [
    {
      icon: Heart,
      title: 'Holistic healing',
      description: 'We treat the whole person—body, mind, and spirit—using time-tested African medicine written clearly for modern homes.',
    },
    {
      icon: Shield,
      title: 'Safety first',
      description: 'Every practitioner is reviewed before they appear. Remedies are documented so families can use them with care.',
    },
    {
      icon: Users,
      title: 'Community driven',
      description: 'Built with African healers and patients. Indigenous knowledge stays in the hands of the people who keep it.',
    },
    {
      icon: Globe,
      title: 'Living heritage',
      description: 'We preserve herbal wisdom so it can travel into the next generation without losing its dignity.',
    },
  ];

  return (
    <EditorialPage>
      <PageHero
        eyebrow="Our house"
        title="Healing, held with care."
        subtitle="RemedyAfrica makes traditional African herbal medicine accessible, verifiable, and safe — for a first-time reader and for a lifelong practitioner."
      />

      <section className="mx-auto max-w-6xl px-4 py-16 sm:px-6 lg:px-8">
        <div className="grid md:grid-cols-2 gap-14 items-center">
          <div>
            <p className="eyebrow mb-4">The work</p>
            <h2 className="font-serif text-3xl sm:text-4xl text-forest mb-6">A bridge, not a replacement</h2>
            <div className="space-y-4 text-ink-muted leading-relaxed">
              <p>
                We connect people with verified traditional healers and a library of herbal knowledge —
                so ancient practice can sit beside modern care without apology.
              </p>
              <p>
                For millions of families, herbal medicine is still the first door. They deserve the same
                clarity, photography, and respect as any clinic waiting room.
              </p>
            </div>
            <div className="mt-8 space-y-3">
              {['Verified practitioner network', 'Private video consultations', 'A library that tells the truth'].map((item) => (
                <div key={item} className="flex items-center gap-3 text-forest">
                  <CheckCircle className="w-5 h-5 text-bronze" />
                  <span>{item}</span>
                </div>
              ))}
            </div>
          </div>
          <div className="rounded-3xl border border-forest/10 bg-white p-12 shadow-soft flex items-center justify-center min-h-[320px]">
            <div className="flex h-28 w-28 items-center justify-center rounded-full bg-forest">
              <Leaf className="h-12 w-12 text-bronze" />
            </div>
          </div>
        </div>
      </section>

      <section className="bg-white py-20 px-4">
        <div className="mx-auto max-w-6xl">
          <div className="text-center mb-14">
            <p className="eyebrow mb-4">How we hold it</p>
            <h2 className="font-serif text-3xl sm:text-4xl text-forest">Values</h2>
          </div>
          <div className="grid md:grid-cols-2 gap-6">
            {values.map((value) => (
              <div key={value.title} className="rounded-3xl border border-forest/10 bg-cream p-8">
                <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-full border border-bronze/30 bg-white">
                  <value.icon className="h-5 w-5 text-bronze" />
                </div>
                <h3 className="font-serif text-2xl text-forest mb-2">{value.title}</h3>
                <p className="text-ink-muted leading-relaxed">{value.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="relative overflow-hidden py-24 px-4">
        <div className="absolute inset-0 bg-forest" />
        <div className="absolute inset-0 bg-grain opacity-20 mix-blend-overlay" />
        <div className="relative mx-auto max-w-6xl grid md:grid-cols-2 gap-12 text-cream">
          <div>
            <p className="eyebrow text-bronze mb-4">Why this house</p>
            <h2 className="font-serif text-3xl sm:text-4xl mb-8">Why people stay</h2>
            {[
              { icon: Award, title: 'Verified experts', copy: 'Credential checks, identity review, and peer standing before a healer appears.' },
              { icon: Leaf, title: 'Honest remedies', copy: 'We show what the library actually contains — never a decorative count.' },
              { icon: Globe, title: 'Pan-African reach', copy: 'Knowledge from many traditions, written so any household can enter.' },
            ].map((item) => (
              <div key={item.title} className="flex gap-4 mb-6">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full border border-cream/20">
                  <item.icon className="h-5 w-5 text-bronze" />
                </div>
                <div>
                  <h3 className="font-serif text-xl mb-1">{item.title}</h3>
                  <p className="text-cream/70 text-sm leading-relaxed">{item.copy}</p>
                </div>
              </div>
            ))}
          </div>
          <div className="rounded-3xl border border-cream/15 bg-white/5 p-10 backdrop-blur-sm">
            <h3 className="font-serif text-2xl mb-4">Join the work</h3>
            <p className="text-cream/70 mb-8 leading-relaxed">
              Whether you are seeking care or you practise, there is a door here that still feels like home.
            </p>
            <div className="space-y-3">
              <Link href="/practitioners" className="block">
                <Button className="w-full bg-cream text-forest hover:bg-white">
                  Find a healer <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </Link>
              <Link href="/practitioners/apply" className="block">
                <Button variant="outline" className="w-full border-cream/30 text-cream hover:bg-cream hover:text-forest">
                  Apply as a practitioner
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>
    </EditorialPage>
  );
}
