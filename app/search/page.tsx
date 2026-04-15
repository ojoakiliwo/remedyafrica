'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { Header } from '@/components/Header';
import { SearchForm } from '@/components/SearchForm';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, Leaf, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';

// Sample data - in real app, fetch from Firebase
const SAMPLE_HERBS = [
  {
    id: '1',
    name: 'Moringa Oleifera',
    scientificName: 'Moringa oleifera',
    description: 'Known as the "miracle tree", moringa is rich in antioxidants and bioactive plant compounds. Used for treating diabetes, heart disease, and inflammation.',
    ailments: ['diabetes', 'inflammation', 'high blood pressure', 'malnutrition'],
    image: '🌿',
    preparation: 'Leaves can be eaten fresh, cooked, or dried into powder. Seeds can be pressed for oil.',
    warnings: 'May lower blood sugar and blood pressure. Consult doctor if on medication.'
  },
  {
    id: '2',
    name: 'Neem',
    scientificName: 'Azadirachta indica',
    description: 'A powerful antibacterial and antifungal herb used for centuries in traditional African and Ayurvedic medicine.',
    ailments: ['malaria', 'skin infections', 'fever', 'dental care'],
    image: '🍃',
    preparation: 'Boil leaves for tea, crush leaves for poultice, or use neem oil externally.',
    warnings: 'Not safe for pregnant women. May cause liver damage in high doses.'
  },
  {
    id: '3',
    name: 'Bitter Leaf',
    scientificName: 'Vernonia amygdalina',
    description: 'A common West African plant used traditionally to treat malaria, diabetes, and digestive issues.',
    ailments: ['malaria', 'stomach ache', 'diabetes', 'fever'],
    image: '🌱',
    preparation: 'Wash leaves thoroughly, boil in water, drink as tea. Bitterness indicates potency.',
    warnings: 'Excessive consumption may cause stomach upset. Pregnant women should consult doctors.'
  },
  {
    id: '4',
    name: 'Aloe Vera',
    scientificName: 'Aloe barbadensis miller',
    description: 'Succulent plant known for its healing gel used for skin conditions and digestive health.',
    ailments: ['burns', 'wounds', 'constipation', 'skin irritation'],
    image: '🌵',
    preparation: 'Cut leaf and apply gel directly to skin. For internal use, blend gel with water.',
    warnings: 'Latex (yellow part under skin) is a strong laxative. Do not use internally during pregnancy.'
  },
  {
    id: '5',
    name: 'Garlic',
    scientificName: 'Allium sativum',
    description: 'Powerful antimicrobial herb used for cardiovascular health and immune support.',
    ailments: ['high blood pressure', 'colds', 'infections', 'cholesterol'],
    image: '🧄',
    preparation: 'Crush cloves and let sit 10 minutes before eating raw or cooking.',
    warnings: 'May increase bleeding risk. Stop use before surgery. Can cause heartburn.'
  },
  {
    id: '6',
    name: 'Ginger',
    scientificName: 'Zingiber officinale',
    description: 'Widely used for digestive issues, nausea, and inflammation throughout Africa.',
    ailments: ['nausea', 'motion sickness', 'arthritis', 'digestive problems'],
    image: '🫚',
    preparation: 'Grate fresh root into hot water for tea. Add to soups and stews.',
    warnings: 'May interact with blood thinners. Can cause heartburn in high doses.'
  }
];

export default function SearchPage() {
  const searchParams = useSearchParams();
  const query = searchParams.get('q') || '';
  const [results, setResults] = useState<typeof SAMPLE_HERBS>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Simulate search delay
    setLoading(true);
    setTimeout(() => {
      const filtered = SAMPLE_HERBS.filter(herb =>
        herb.name.toLowerCase().includes(query.toLowerCase()) ||
        herb.ailments.some(a => a.toLowerCase().includes(query.toLowerCase())) ||
        herb.description.toLowerCase().includes(query.toLowerCase())
      );
      setResults(filtered);
      setLoading(false);
    }, 800);
  }, [query]);

  return (
    <div className="min-h-screen bg-[#F5F5DC]">
      <Header />

      <main className="container mx-auto px-4 py-8">
        {/* Back to home link with logo */}
        <div className="flex items-center justify-between mb-6">
          <Link href="/" className="flex items-center space-x-2 text-[#97A97C] hover:text-[#7A8A63] transition-colors">
            <ArrowLeft className="h-5 w-5" />
            <span className="font-medium">Back to Home</span>
          </Link>

          {/* Center logo */}
          <Link href="/" className="absolute left-1/2 transform -translate-x-1/2 hover:scale-105 transition-transform">
            <img
              src="/logo.png"
              alt="RemedyAfrica"
              className="h-16 w-16 object-contain drop-shadow-sm"
            />
          </Link>
        </div>

        {/* Search Section */}
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-bold text-[#2C3E2D] mb-4">
            Search Results for "{query}"
          </h1>
          <div className="max-w-2xl mx-auto">
            <SearchForm initialQuery={query} />
          </div>
        </div>

        {/* Results */}
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="h-8 w-8 animate-spin text-[#97A97C]" />
            <span className="ml-3 text-lg text-[#2C3E2D]">Searching remedies...</span>
          </div>
        ) : results.length === 0 ? (
          <div className="text-center py-20">
            <Leaf className="h-16 w-16 text-[#97A97C]/40 mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-[#2C3E2D] mb-2">No remedies found</h2>
            <p className="text-gray-600 mb-6">We couldn't find any remedies matching "{query}"</p>
            <Button asChild className="bg-[#97A97C] hover:bg-[#7A8A63]">
              <Link href="/">Browse All Categories</Link>
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {results.map((herb) => (
              <Card key={herb.id} className="bg-white/80 backdrop-blur-sm border-[#97A97C]/20 hover:shadow-lg transition-shadow">
                <CardHeader>
                  <div className="flex items-center space-x-3">
                    <span className="text-4xl">{herb.image}</span>
                    <div>
                      <CardTitle className="text-lg text-[#2C3E2D]">{herb.name}</CardTitle>
                      <p className="text-sm text-gray-500 italic">{herb.scientificName}</p>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <p className="text-gray-700 text-sm leading-relaxed">
                    {herb.description}
                  </p>

                  <div>
                    <h4 className="font-semibold text-[#2C3E2D] text-sm mb-2">Treats:</h4>
                    <div className="flex flex-wrap gap-2">
                      {herb.ailments.map((ailment) => (
                        <span
                          key={ailment}
                          className="px-2 py-1 bg-[#97A97C]/10 text-[#97A97C] text-xs rounded-full capitalize"
                        >
                          {ailment}
                        </span>
                      ))}
                    </div>
                  </div>

                  <div className="pt-2 border-t border-[#97A97C]/10">
                    <h4 className="font-semibold text-[#2C3E2D] text-sm mb-1">Preparation:</h4>
                    <p className="text-sm text-gray-600">{herb.preparation}</p>
                  </div>

                  <div className="bg-amber-50 p-3 rounded-lg border border-amber-200">
                    <h4 className="font-semibold text-amber-800 text-sm mb-1">⚠️ Warnings:</h4>
                    <p className="text-sm text-amber-700">{herb.warnings}</p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Results count */}
        {!loading && results.length > 0 && (
          <p className="text-center text-gray-600 mt-8">
            Found {results.length} remedy{results.length !== 1 ? 'ies' : 'y'} for "{query}"
          </p>
        )}
      </main>
    </div>
  );
}