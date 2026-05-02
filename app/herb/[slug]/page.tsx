'use client';

import { useParams } from 'next/navigation';
import Link from 'next/link';
import Navbar from '@/components/Navbar';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  ArrowLeft, 
  Star, 
  Clock, 
  AlertTriangle, 
  Heart, 
  Share2, 
  ChevronRight,
  Camera,
  Lock,
  Crown,
  Pill
} from 'lucide-react';
import { useState, useEffect } from 'react';
import { getHerbById, getAllHerbs } from '@/lib/firebase/herbs';
import { useSubscription } from '@/providers/SubscriptionProvider';

export default function HerbDetailPage() {
  const params = useParams();
  const slug = params.slug as string;
  const { canAccessPrescription, canAccessSideEffects, tier } = useSubscription();
  const [herb, setHerb] = useState<any>(null);
  const [relatedHerbs, setRelatedHerbs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedImage, setSelectedImage] = useState(0);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    async function loadHerb() {
      try {
        setLoading(true);
        const data = await getHerbById(slug);
        if (data) {
          setHerb(data);
          
          const allHerbs = await getAllHerbs();
          const related = allHerbs
            .filter(h => h.category === data.category && h.id !== slug)
            .slice(0, 3);
          setRelatedHerbs(related);
        } else {
          setError('Herb not found');
        }
      } catch (err) {
        console.error('Error loading herb:', err);
        setError('Failed to load herb details');
      } finally {
        setLoading(false);
      }
    }
    
    if (slug) {
      loadHerb();
    }
  }, [slug]);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#F5F5F0] dark:bg-[#151f16] flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#97A97C] mx-auto mb-4"></div>
          <p className="text-[#2C3E2D] dark:text-[#F5F5F0]">Loading herb details...</p>
        </div>
      </div>
    );
  }

  if (error || !herb) {
    return (
      <div className="min-h-screen bg-[#F5F5F0] dark:bg-[#151f16]">
        <Navbar />
        <div className="container mx-auto px-4 py-20 text-center">
          <h1 className="text-3xl font-bold text-[#2C3E2D] dark:text-[#F5F5F0] mb-4">{error || 'Herb Not Found'}</h1>
          <Link href="/" className="text-[#97A97C] hover:underline">
            Return to Home
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F5F5F0] dark:bg-[#151f16]">
      <Navbar />
      
      <main className="container mx-auto px-4 py-8">
        {/* Breadcrumb */}
        <div className="flex items-center text-sm text-gray-600 dark:text-gray-400 mb-6">
          <Link href="/" className="hover:text-[#97A97C]">Home</Link>
          <ChevronRight className="h-4 w-4 mx-2" />
          <Link href={`/category/${herb.category}`} className="hover:text-[#97A97C] capitalize">
            {herb.category?.replace('-', ' ')}
          </Link>
          <ChevronRight className="h-4 w-4 mx-2" />
          <span className="text-[#2C3E2D] dark:text-[#F5F5F0] font-medium">{herb.name}</span>
        </div>

        {/* Header with Logo */}
        <div className="flex items-center justify-between mb-8 relative">
          <Link href={`/category/${herb.category}`} className="flex items-center space-x-2 text-[#97A97C] hover:text-[#7A8A63]">
            <ArrowLeft className="h-5 w-5" />
            <span>Back to Category</span>
          </Link>
          
          <Link href="/" className="absolute left-1/2 transform -translate-x-1/2 hover:scale-105 transition-transform">
            <img src="/logo.png" alt="RemedyAfrica" className="h-16 w-16 object-contain drop-shadow-sm" />
          </Link>
          
          <div className="flex space-x-2">
            <Button 
              variant="outline" 
              size="icon"
              onClick={() => setSaved(!saved)}
              className={saved ? 'text-red-500 border-red-500' : ''}
              aria-label={saved ? "Remove from saved herbs" : "Save this herb"}
            >
              <Heart className={`h-5 w-5 ${saved ? 'fill-current' : ''}`} />
            </Button>
            <Button 
              variant="outline" 
              size="icon"
              aria-label="Share this herb"
            >
              <Share2 className="h-5 w-5" />
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Left Column - Images */}
          <div className="space-y-4">
            <div className="aspect-square bg-gray-200 dark:bg-[#1e2b1f] rounded-2xl overflow-hidden relative">
              {herb.images && herb.images.length > 0 ? (
                <img 
                  src={herb.images[selectedImage]} 
                  alt={herb.name}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="absolute inset-0 flex items-center justify-center text-9xl bg-gradient-to-br from-[#97A97C]/20 to-[#B8860B]/20">
                  🌿
                </div>
              )}
              <div className="absolute top-4 right-4 bg-white/90 dark:bg-[#1e2b1f]/90 backdrop-blur px-3 py-1 rounded-full flex items-center shadow-lg">
                <Star className="h-4 w-4 text-yellow-500 fill-current mr-1" />
                <span className="font-bold">{herb.rating || '4.5'}</span>
              </div>
            </div>
            
            {herb.images && herb.images.length > 1 && (
              <div className="grid grid-cols-4 gap-2">
                {herb.images.map((img: string, idx: number) => (
                  <button
                    key={idx}
                    onClick={() => setSelectedImage(idx)}
                    className={`aspect-square rounded-lg overflow-hidden border-2 transition-all ${
                      selectedImage === idx ? 'border-[#97A97C]' : 'border-transparent'
                    }`}
                    aria-label={`View image ${idx + 1} of ${herb.name}`}
                  >
                    <img src={img} alt="" className="w-full h-full object-cover" />
                  </button>
                ))}
              </div>
            )}

            {/* AI Camera */}
            <Card className="bg-gradient-to-r from-[#97A97C]/10 to-[#B8860B]/10 border-[#97A97C]/30">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="bg-[#97A97C] p-2 rounded-full">
                      <Camera className="h-5 w-5 text-white" />
                    </div>
                    <div>
                      <h4 className="font-semibold text-[#2C3E2D] dark:text-[#F5F5F0]">AI Herb Identifier</h4>
                      <p className="text-sm text-gray-600 dark:text-gray-400">Take a photo to identify this herb</p>
                    </div>
                  </div>
                  <Button className="bg-[#97A97C] hover:bg-[#7A8A63]">
                    Open Camera
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Right Column - Details */}
          <div className="space-y-6">
            <div>
              <h1 className="text-4xl font-bold text-[#2C3E2D] dark:text-[#F5F5F0] mb-2">{herb.name}</h1>
              <p className="text-lg text-gray-500 dark:text-gray-400 italic">{herb.scientificName}</p>
            </div>

            <p className="text-gray-700 dark:text-gray-300 leading-relaxed">{herb.longDescription || herb.description}</p>

            {/* Quick Stats */}
            <div className="grid grid-cols-3 gap-4">
              <div className="bg-white/80 dark:bg-[#1e2b1f]/80 p-4 rounded-xl border border-[#97A97C]/20 text-center">
                <Clock className="h-5 w-5 text-[#97A97C] mx-auto mb-1" />
                <p className="text-sm text-gray-600 dark:text-gray-400">Origin</p>
                <p className="font-semibold text-[#2C3E2D] dark:text-[#F5F5F0] text-sm">{herb.origin || 'Africa'}</p>
              </div>
              <div className="bg-white/80 dark:bg-[#1e2b1f]/80 p-4 rounded-xl border border-[#97A97C]/20 text-center">
                <span className="text-xl">🌿</span>
                <p className="text-sm text-gray-600 dark:text-gray-400">Parts</p>
                <p className="font-semibold text-[#2C3E2D] dark:text-[#F5F5F0] text-sm">{herb.partsUsed || 'Root'}</p>
              </div>
              <div className="bg-white/80 dark:bg-[#1e2b1f]/80 p-4 rounded-xl border border-[#97A97C]/20 text-center">
                <Star className="h-5 w-5 text-[#97A97C] mx-auto mb-1" />
                <p className="text-sm text-gray-600 dark:text-gray-400">Rating</p>
                <p className="font-semibold text-[#2C3E2D] dark:text-[#F5F5F0]">{herb.rating || '4.5'}</p>
              </div>
            </div>

            {/* Benefits - Always visible */}
            {herb.benefits && herb.benefits.length > 0 && (
              <Card className="border-[#97A97C]/20 dark:border-[#97A97C]/30 dark:bg-[#1e2b1f]">
                <CardHeader>
                  <CardTitle className="text-[#2C3E2D] dark:text-[#F5F5F0]">Key Benefits</CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2">
                    {herb.benefits.map((benefit: string, idx: number) => (
                      <li key={idx} className="flex items-start">
                        <span className="text-[#97A97C] mr-2">✓</span>
                        <span className="text-gray-700 dark:text-gray-300">{benefit}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            )}

            {/* Preparation - Always visible */}
            {herb.preparation && (
              <Card className="border-[#97A97C]/20 dark:border-[#97A97C]/30 dark:bg-[#1e2b1f]">
                <CardHeader>
                  <CardTitle className="text-[#2C3E2D] dark:text-[#F5F5F0] flex items-center">
                    <Clock className="h-5 w-5 mr-2 text-[#97A97C]" />
                    Preparation
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="bg-[#F5F5DC] dark:bg-[#2a3a2b] p-4 rounded-lg">
                    <p className="text-gray-700 dark:text-gray-300">{herb.preparation}</p>
                  </div>
                  {herb.dosage && (
                    <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
                      <strong>Dosage:</strong> {herb.dosage}
                    </p>
                  )}
                </CardContent>
              </Card>
            )}

            {/* Prescription - GATED: Premium only */}
            {herb.prescription && (
              canAccessPrescription ? (
                <Card className="border-[#97A97C]/20 dark:border-[#97A97C]/30 dark:bg-[#1e2b1f]">
                  <CardHeader>
                    <CardTitle className="text-[#2C3E2D] dark:text-[#F5F5F0] flex items-center">
                      <Pill className="h-5 w-5 mr-2 text-[#97A97C]" />
                      Prescription & Usage Guide
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg border border-blue-200 dark:border-blue-800">
                      <p className="text-gray-700 dark:text-gray-300 whitespace-pre-line">{herb.prescription}</p>
                    </div>
                    <p className="mt-3 text-xs text-gray-500 dark:text-gray-400 italic">
                      Always consult a practitioner before starting any herbal treatment.
                    </p>
                  </CardContent>
                </Card>
              ) : (
                <Card className="border-amber-200 dark:border-amber-800 bg-amber-50 dark:bg-amber-900/20">
                  <CardContent className="p-6 text-center">
                    <Lock className="h-8 w-8 text-amber-600 dark:text-amber-400 mx-auto mb-3" />
                    <h3 className="font-semibold text-[#2C3E2D] dark:text-[#F5F5F0] mb-2">Prescription Guide Locked</h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                      Detailed prescription and usage guidelines are available for Premium subscribers.
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mb-4">
                      Your current plan: <span className="font-semibold capitalize">{tier}</span>
                    </p>
                    <Link href="/subscription">
                      <Button className="bg-[#97A97C] hover:bg-[#7A8A63] text-white">
                        <Crown className="h-4 w-4 mr-2" />
                        Upgrade to Premium
                      </Button>
                    </Link>
                  </CardContent>
                </Card>
              )
            )}

            {/* Side Effects - GATED: Premium only */}
            {herb.warnings && herb.warnings.length > 0 && (
              canAccessSideEffects ? (
                <Card className="border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-900/20">
                  <CardHeader>
                    <CardTitle className="text-red-800 dark:text-red-300 flex items-center">
                      <AlertTriangle className="h-5 w-5 mr-2" />
                      Side Effects & Precautions
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ul className="space-y-2">
                      {herb.warnings.map((warning: string, idx: number) => (
                        <li key={idx} className="flex items-start text-sm text-red-700 dark:text-red-300">
                          <span className="mr-2">•</span>
                          {warning}
                        </li>
                      ))}
                    </ul>
                    {herb.sideEffects && (
                      <div className="mt-4 pt-4 border-t border-red-200 dark:border-red-800">
                        <h4 className="font-semibold text-red-800 dark:text-red-300 mb-2">Known Side Effects</h4>
                        <p className="text-sm text-red-700 dark:text-red-300 whitespace-pre-line">{herb.sideEffects}</p>
                      </div>
                    )}
                    {herb.drugInteractions && (
                      <div className="mt-4 pt-4 border-t border-red-200 dark:border-red-800">
                        <h4 className="font-semibold text-red-800 dark:text-red-300 mb-2">Drug Interactions</h4>
                        <p className="text-sm text-red-700 dark:text-red-300">{herb.drugInteractions}</p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              ) : (
                <Card className="border-amber-200 dark:border-amber-800 bg-amber-50 dark:bg-amber-900/20">
                  <CardContent className="p-6 text-center">
                    <Lock className="h-8 w-8 text-amber-600 dark:text-amber-400 mx-auto mb-3" />
                    <h3 className="font-semibold text-[#2C3E2D] dark:text-[#F5F5F0] mb-2">Safety Information Locked</h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                      Side effects, contraindications, and drug interactions are available for Premium subscribers.
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mb-4">
                      Your current plan: <span className="font-semibold capitalize">{tier}</span>
                    </p>
                    <Link href="/subscription">
                      <Button className="bg-[#97A97C] hover:bg-[#7A8A63] text-white">
                        <Crown className="h-4 w-4 mr-2" />
                        Upgrade to Premium
                      </Button>
                    </Link>
                  </CardContent>
                </Card>
              )
            )}
          </div>
        </div>

        {/* Related Herbs */}
        {relatedHerbs.length > 0 && (
          <section className="mt-12">
            <h2 className="text-2xl font-bold text-[#2C3E2D] dark:text-[#F5F5F0] mb-6">Related Herbs</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {relatedHerbs.map((related) => (
                <Link key={related.id} href={`/herb/${related.id}`}>
                  <Card className="hover:shadow-lg transition-shadow cursor-pointer border-[#97A97C]/20 dark:border-[#97A97C]/30 dark:bg-[#1e2b1f]">
                    <div className="h-32 bg-gradient-to-br from-[#97A97C]/20 to-[#B8860B]/20 flex items-center justify-center">
                      {related.images && related.images.length > 0 ? (
                        <img src={related.images[0]} alt="" className="w-full h-full object-cover" />
                      ) : (
                        <span className="text-4xl">🌿</span>
                      )}
                    </div>
                    <CardContent className="p-4">
                      <h3 className="font-bold text-[#2C3E2D] dark:text-[#F5F5F0]">{related.name}</h3>
                      <p className="text-sm text-gray-500 dark:text-gray-400 italic">{related.scientificName}</p>
                    </CardContent>
                  </Card>
                </Link>
              ))}
            </div>
          </section>
        )}
      </main>
    </div>
  );
}