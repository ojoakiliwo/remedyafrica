'use client';

import Link from 'next/link';
import { Card, CardContent } from '@/components/ui/card';
import { Brain, Pill, Shield, Heart, Sparkles, Wind, ArrowRight } from 'lucide-react';

const categories = [
  {
    id: 'mental-wellness',
    name: 'Mental Wellness',
    description: 'Natural remedies for stress, anxiety, and mental clarity',
    icon: Brain,
    herbCount: 24
  },
  {
    id: 'digestive-health',
    name: 'Digestive Health',
    description: 'Herbs for stomach issues, digestion, and gut health',
    icon: Pill,
    herbCount: 31
  },
  {
    id: 'immune-support',
    name: 'Immune Support',
    description: 'Boost your immune system naturally',
    icon: Shield,
    herbCount: 28
  },
  {
    id: 'pain-relief',
    name: 'Pain Relief',
    description: 'Anti-inflammatory herbs for joint and muscle pain',
    icon: Heart,
    herbCount: 19
  },
  {
    id: 'skin-care',
    name: 'Skin Care',
    description: 'Natural remedies for healthy, glowing skin',
    icon: Sparkles,
    herbCount: 22
  },
  {
    id: 'respiratory',
    name: 'Respiratory Health',
    description: 'Herbs for breathing, coughs, and lung health',
    icon: Wind,
    herbCount: 16
  }
];

export function CategoryGrid() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {categories.map((category) => {
        const Icon = category.icon;
        return (
          <Link key={category.id} href={`/category/${category.id}`}>
            <Card className="group h-full overflow-hidden rounded-3xl border-forest/10 bg-white shadow-soft hover:shadow-lift transition-all duration-500">
              <CardContent className="p-8">
                <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-full bg-cream">
                  <Icon className="h-5 w-5 text-forest" />
                </div>
                <p className="text-[11px] tracking-[0.2em] uppercase text-bronze mb-2">
                  {category.herbCount} remedies
                </p>
                <h3 className="font-serif text-2xl text-forest mb-2">
                  {category.name}
                </h3>
                <p className="text-ink-muted text-sm leading-relaxed">
                  {category.description}
                </p>
                <div className="mt-6 flex items-center gap-2 text-bronze text-sm font-medium">
                  Explore
                  <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                </div>
              </CardContent>
            </Card>
          </Link>
        );
      })}
    </div>
  );
}
