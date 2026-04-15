'use client';

import Link from 'next/link';
import { Card, CardContent } from '@/components/ui/card';
import { Brain, Pill, Shield, Heart, Sparkles, Wind } from 'lucide-react';

const categories = [
  {
    id: 'mental-wellness',
    name: 'Mental Wellness',
    description: 'Natural remedies for stress, anxiety, and mental clarity',
    image: '/images/mental-wellness.jpg',
    icon: Brain,
    color: 'bg-purple-100',
    herbCount: 24
  },
  {
    id: 'digestive-health',
    name: 'Digestive Health',
    description: 'Herbs for stomach issues, digestion, and gut health',
    image: '/images/digestive.jpg',
    icon: Pill,
    color: 'bg-orange-100',
    herbCount: 31
  },
  {
    id: 'immune-support',
    name: 'Immune Support',
    description: 'Boost your immune system naturally',
    image: '/images/immune-support.jpg',
    icon: Shield,
    color: 'bg-green-100',
    herbCount: 28
  },
  {
    id: 'pain-relief',
    name: 'Pain Relief',
    description: 'Anti-inflammatory herbs for joint and muscle pain',
    image: '/images/pain-relief.jpg',
    icon: Heart,
    color: 'bg-red-100',
    herbCount: 19
  },
  {
    id: 'skin-care',
    name: 'Skin Care',
    description: 'Natural remedies for healthy, glowing skin',
    image: '/images/skin-care.jpg',
    icon: Sparkles,
    color: 'bg-pink-100',
    herbCount: 22
  },
  {
    id: 'respiratory',
    name: 'Respiratory Health',
    description: 'Herbs for breathing, coughs, and lung health',
    image: '/images/respiratory.jpg',
    icon: Wind,
    color: 'bg-blue-100',
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
            <Card className="group overflow-hidden bg-white/80 backdrop-blur-sm border-[#97A97C]/20 hover:shadow-xl transition-all duration-300 cursor-pointer h-full">
              {/* Image Section */}
              <div className="relative h-48 overflow-hidden">
                <img 
                  src={category.image} 
                  alt={category.name}
                  className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                
                {/* Icon Badge */}
                <div className={`absolute top-4 right-4 p-2 rounded-full ${category.color} shadow-lg`}>
                  <Icon className="h-5 w-5 text-[#2C3E2D]" />
                </div>
                
                {/* Title Overlay */}
                <div className="absolute bottom-4 left-4 right-4">
                  <h3 className="text-xl font-bold text-white mb-1">
                    {category.name}
                  </h3>
                  <p className="text-white/90 text-sm">
                    {category.herbCount} remedies
                  </p>
                </div>
              </div>
              
              {/* Content Section */}
              <CardContent className="p-4">
                <p className="text-gray-600 text-sm leading-relaxed">
                  {category.description}
                </p>
                <div className="mt-4 flex items-center text-[#97A97C] text-sm font-medium group-hover:text-[#7A8A63] transition-colors">
                  Explore Remedies 
                  <span className="ml-1 group-hover:translate-x-1 transition-transform">→</span>
                </div>
              </CardContent>
            </Card>
          </Link>
        );
      })}
    </div>
  );
}