'use client';

import Link from 'next/link';
import {
  Leaf,
  Brain,
  Heart,
  Shield,
  Sun,
  Wind,
  Droplets,
  Flame,
  Activity,
  Baby,
  User,
  Sparkles,
  ArrowRight,
  Search
} from 'lucide-react';

interface Category {
  slug: string;
  name: string;
  description: string;
  icon: React.ReactNode;
  color: string;
  bgColor: string;
}

const categories: Category[] = [
  {
    slug: 'mental-wellness',
    name: 'Mental Wellness',
    description: 'Herbs for anxiety, depression, stress, and cognitive support',
    icon: <Brain className="w-8 h-8" />,
    color: 'text-purple-700',
    bgColor: 'bg-purple-50 hover:bg-purple-100 border-purple-200',
  },
  {
    slug: 'pain-relief',
    name: 'Pain Relief',
    description: 'Natural remedies for headaches, joint pain, and inflammation',
    icon: <Activity className="w-8 h-8" />,
    color: 'text-red-700',
    bgColor: 'bg-red-50 hover:bg-red-100 border-red-200',
  },
  {
    slug: 'digestive-health',
    name: 'Digestive Health',
    description: 'Support for stomach issues, constipation, and gut health',
    icon: <Droplets className="w-8 h-8" />,
    color: 'text-emerald-700',
    bgColor: 'bg-emerald-50 hover:bg-emerald-100 border-emerald-200',
  },
  {
    slug: 'immune-support',
    name: 'Immune Support',
    description: 'Boost your immune system and fight infections naturally',
    icon: <Shield className="w-8 h-8" />,
    color: 'text-teal-700',
    bgColor: 'bg-teal-50 hover:bg-teal-100 border-teal-200',
  },
  {
    slug: 'skin-care',
    name: 'Skin Care',
    description: 'Remedies for eczema, acne, wounds, and skin conditions',
    icon: <Sun className="w-8 h-8" />,
    color: 'text-amber-700',
    bgColor: 'bg-amber-50 hover:bg-amber-100 border-amber-200',
  },
  {
    slug: 'respiratory',
    name: 'Respiratory Health',
    description: 'Help for asthma, cough, colds, and breathing issues',
    icon: <Wind className="w-8 h-8" />,
    color: 'text-sky-700',
    bgColor: 'bg-sky-50 hover:bg-sky-100 border-sky-200',
  },
  {
    slug: 'sleep',
    name: 'Sleep & Relaxation',
    description: 'Natural sleep aids and calming herbs',
    icon: <Sparkles className="w-8 h-8" />,
    color: 'text-indigo-700',
    bgColor: 'bg-indigo-50 hover:bg-indigo-100 border-indigo-200',
  },
  {
    slug: 'stress',
    name: 'Stress Relief',
    description: 'Adaptogenic and calming herbs for daily stress',
    icon: <Heart className="w-8 h-8" />,
    color: 'text-rose-700',
    bgColor: 'bg-rose-50 hover:bg-rose-100 border-rose-200',
  },
  {
    slug: 'heart',
    name: 'Heart Health',
    description: 'Cardiovascular support and blood pressure management',
    icon: <Flame className="w-8 h-8" />,
    color: 'text-red-600',
    bgColor: 'bg-red-50 hover:bg-red-100 border-red-200',
  },
  {
    slug: 'womens-health',
    name: 'Women\'s Health',
    description: 'Menstrual health, fertility, and hormonal balance',
    icon: <Baby className="w-8 h-8" />,
    color: 'text-pink-700',
    bgColor: 'bg-pink-50 hover:bg-pink-100 border-pink-200',
  },
  {
    slug: 'mens-health',
    name: 'Men\'s Health',
    description: 'Vitality, stamina, and men\'s wellness support',
    icon: <User className="w-8 h-8" />,
    color: 'text-blue-700',
    bgColor: 'bg-blue-50 hover:bg-blue-100 border-blue-200',
  },
  {
    slug: 'general',
    name: 'General Wellness',
    description: 'All-purpose herbs for overall health and vitality',
    icon: <Leaf className="w-8 h-8" />,
    color: 'text-emerald-700',
    bgColor: 'bg-emerald-50 hover:bg-emerald-100 border-emerald-200',
  },
];

export default function CategoriesPage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-emerald-50/50 via-stone-50 to-white">
      {/* Hero */}
      <div className="pt-24 pb-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-3xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-emerald-100 text-emerald-800 text-sm font-medium mb-6">
            <Leaf className="w-4 h-4" />
            Browse by Category
          </div>
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-stone-800 mb-4">
            Health Categories
          </h1>
          <p className="text-stone-500 text-lg max-w-xl mx-auto">
            Explore traditional African remedies organized by health concern. Find the right herbs for your needs.
          </p>
        </div>
      </div>

      {/* Categories Grid */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pb-20">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {categories.map((cat) => (
            <Link
              key={cat.slug}
              href={`/category/${cat.slug}`}
              className={`group relative p-6 rounded-2xl border-2 transition-all duration-300 ${cat.bgColor}`}
            >
              <div className="flex items-start justify-between mb-4">
                <div className={`p-3 rounded-xl bg-white shadow-sm ${cat.color}`}>
                  {cat.icon}
                </div>
                <ArrowRight className={`w-5 h-5 opacity-0 group-hover:opacity-100 transition-opacity ${cat.color}`} />
              </div>
              <h3 className="text-lg font-bold text-stone-800 mb-2 group-hover:text-emerald-700 transition-colors">
                {cat.name}
              </h3>
              <p className="text-sm text-stone-500 leading-relaxed">
                {cat.description}
              </p>
            </Link>
          ))}
        </div>

        {/* Search hint */}
        <div className="mt-12 text-center">
          <p className="text-stone-400 text-sm">
            Can&apos;t find what you&apos;re looking for?{' '}
            <Link href="/search" className="text-emerald-700 hover:text-emerald-800 font-medium inline-flex items-center gap-1">
              <Search className="w-4 h-4" />
              Try AI Search
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}