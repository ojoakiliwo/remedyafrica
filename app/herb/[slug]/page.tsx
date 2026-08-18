'use client';

import { useParams } from 'next/navigation';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { 
  ArrowLeft, 
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
import { isAnimalDerivedHerb, isPublicCatalogHerb } from '@/lib/herb-trust';
import { useSubscription } from '@/providers/SubscriptionProvider';
import { getHerbImages, getHerbPrimaryImage } from '@/lib/herb-images';
import { collection, query, where, getDocs, limit } from 'firebase/firestore';
import { db } from '@/lib/firebase/client';

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
  const [imageError, setImageError] = useState(false);

  useEffect(() => {
    async function loadHerb() {
      try {
        setLoading(true);
        setError('');
        setImageError(false);
        let data: any = await getHerbById(slug);
        
        if (!data) {
          const slugQuery = query(
            collection(db, 'herbs'),
            where('slug', '==', slug),
            limit(1)
          );
          const slugSnap = await getDocs(slugQuery);
          if (!slugSnap.empty) {
            data = { id: slugSnap.docs[0].id, ...slugSnap.docs[0].data() } as any;
          }
        }
        
        if (!data) {
          const decodedName = decodeURIComponent(slug).replace(/-/g, ' ').toLowerCase();
          const nameQuery = query(
            collection(db, 'herbs'),
            where('name', '==', decodedName),
            limit(1)
          );
          const nameSnap = await getDocs(nameQuery);
          if (!nameSnap.empty) {
            data = { id: nameSnap.docs[0].id, ...nameSnap.docs[0].data() } as any;
          }
        }
        
        if (!data) {
          const allSnap = await getDocs(collection(db, 'herbs'));
          const decodedSlug = decodeURIComponent(slug).toLowerCase().replace(/-/g, ' ');
          const match = allSnap.docs.find(d => {
            const dData = d.data();
            const name = (dData.name || '').toLowerCase();
            const scientific = (dData.scientificName || '').toLowerCase();
            return (
              name === decodedSlug ||
              name.replace(/-/g, ' ') === decodedSlug ||
              scientific.replace(/\s+/g, '-') === slug.toLowerCase() ||
              scientific.toLowerCase() === decodedSlug
            );
          });
          if (match) {
            data = { id: match.id, ...match.data() } as any;
          }
        }
        
        if (data) {
          if (isAnimalDerivedHerb(data)) {
            setError('Herb not found');
            return;
          }
          setHerb(data);
          
          const allHerbs = await getAllHerbs();
          const related = allHerbs
            .filter((h: any) => isPublicCatalogHerb(h) && h.category === data.category && h.id !== data.id)
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

  const herbImages = herb ? getHerbImages(herb) : [];
  const hasImages = herbImages.length > 0;

  if (loading) {
    return (
      <div className="min-h-screen bg-cream dark:bg-[#151f16] flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-forest mx-auto mb-4"></div>
          <p className="text-forest dark:text-[#F5F5F0]">Loading herb details...</p>
        </div>
      </div>
    );
  }

  if (error || !herb) {
    return (
      <div className="min-h-screen bg-cream dark:bg-[#151f16]">
        <div className="container mx-auto px-4 py-20 text-center">
          <h1 className="text-3xl font-bold text-forest dark:text-[#F5F5F0] mb-4">{error || 'Herb Not Found'}</h1>
          <Link href="/" className="text-bronze hover:underline">
            Return to Home
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-cream dark:bg-[#151f16]">
      <main className="container mx-auto px-4 py-8">
        {/* Breadcrumb */}
        <div className="flex items-center text-sm text-gray-600 dark:text-gray-400 mb-6">
          <Link href="/" className="hover:text-bronze">Home</Link>
          <ChevronRight className="h-4 w-4 mx-2" />
          <Link href={`/category/${herb.category}`} className="hover:text-bronze capitalize">
            {herb.category?.replace('-', ' ')}
          </Link>
          <ChevronRight className="h-4 w-4 mx-2" />
          <span className="text-forest dark:text-[#F5F5F0] font-medium">{herb.name}</span>
        </div>

        {/* Header with Logo */}
        <div className="flex items-center justify-between mb-8 relative">
          <Link href={`/category/${herb.category}`} className="flex items-center space-x-2 text-bronze hover:text-bronze">
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
            {hasImages ? (
              <>
                <div className="aspect-square bg-gray-200 dark:bg-[#1e2b1f] rounded-2xl overflow-hidden relative">
                  {!imageError ? (
                    <img 
                      src={herbImages[selectedImage]} 
                      alt={herb.name}
                      className="w-full h-full object-cover"
                      onError={() => {
                        console.error('Image failed to load:', herbImages[selectedImage]);
                        setImageError(true);
                      }}
                    />
                  ) : (
                    <div className="absolute inset-0 flex items-center justify-center bg-gray-100 dark:bg-[#1e2b1f]">
                      <p className="text-sm text-gray-500">Image failed to load</p>
                    </div>
                  )}
                </div>
                
                {herbImages.length > 1 && (
                  <div className="grid grid-cols-4 gap-2">
                    {herbImages.map((img: string, idx: number) => (
                      <button
                        key={idx}
                        onClick={() => {
                          setSelectedImage(idx);
                          setImageError(false);
                        }}
                        className={`aspect-square rounded-lg overflow-hidden border-2 transition-all ${
                          selectedImage === idx ? 'border-forest' : 'border-transparent'
                        }`}
                        aria-label={`View image ${idx + 1} of ${herb.name}`}
                      >
                        <img src={img} alt="" className="w-full h-full object-cover" />
                      </button>
                    ))}
                  </div>
                )}
              </>
            ) : null}

            {/* AI Camera */}
            <Card className="bg-gradient-to-r from-[#97A97C]/10 to-[#B8860B]/10 border-forest/30">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="bg-forest p-2 rounded-full">
                      <Camera className="h-5 w-5 text-white" />
                    </div>
                    <div>
                      <h4 className="font-semibold text-forest dark:text-[#F5F5F0]">AI Herb Identifier</h4>
                      <p className="text-sm text-gray-600 dark:text-gray-400">Take a photo to identify this herb</p>
                    </div>
                  </div>
                  <Button className="bg-forest hover:bg-forest-mist">
                    Open Camera
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Right Column - Details */}
          <div className="space-y-6">
            <div>
              <h1 className="font-serif text-4xl text-forest dark:text-[#F5F5F0] mb-2">{herb.name}</h1>
              <p className="text-lg text-gray-500 dark:text-gray-400 italic">{herb.scientificName}</p>
            </div>

            <p className="text-gray-700 dark:text-gray-300 leading-relaxed">{herb.longDescription || herb.description}</p>

            {/* Quick Stats - Only show fields that exist */}
            <div className="grid grid-cols-3 gap-4">
              {herb.origin && (
                <div className="bg-white/80 dark:bg-[#1e2b1f]/80 p-4 rounded-xl border border-forest/20 text-center">
                  <Clock className="h-5 w-5 text-bronze mx-auto mb-1" />
                  <p className="text-sm text-gray-600 dark:text-gray-400">Origin</p>
                  <p className="font-semibold text-forest dark:text-[#F5F5F0] text-sm">{herb.origin}</p>
                </div>
              )}
              {herb.partsUsed && (
                <div className="bg-white/80 dark:bg-[#1e2b1f]/80 p-4 rounded-xl border border-forest/20 text-center">
                  <p className="text-sm text-gray-600 dark:text-gray-400">Parts</p>
                  <p className="font-semibold text-forest dark:text-[#F5F5F0] text-sm">{herb.partsUsed}</p>
                </div>
              )}
              {herb.rating && (
                <div className="bg-white/80 dark:bg-[#1e2b1f]/80 p-4 rounded-xl border border-forest/20 text-center">
                  <p className="text-sm text-gray-600 dark:text-gray-400">Rating</p>
                  <p className="font-semibold text-forest dark:text-[#F5F5F0]">{herb.rating}</p>
                </div>
              )}
            </div>

            {/* Benefits */}
            {herb.benefits && herb.benefits.length > 0 && (
              <Card className="border-forest/20 dark:border-forest/30 dark:bg-[#1e2b1f]">
                <CardHeader>
                  <CardTitle className="text-forest dark:text-[#F5F5F0]">Key Benefits</CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2">
                    {herb.benefits.map((benefit: string, idx: number) => (
                      <li key={idx} className="flex items-start">
                        <span className="text-bronze mr-2">✓</span>
                        <span className="text-gray-700 dark:text-gray-300">{benefit}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            )}

            {/* Preparation */}
            {herb.preparation && (
              <Card className="border-forest/20 dark:border-forest/30 dark:bg-[#1e2b1f]">
                <CardHeader>
                  <CardTitle className="text-forest dark:text-[#F5F5F0] flex items-center">
                    <Clock className="h-5 w-5 mr-2 text-bronze" />
                    Preparation
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="bg-cream dark:bg-[#2a3a2b] p-4 rounded-lg">
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

            {/* Prescription - GATED */}
            {herb.prescription && (
              canAccessPrescription ? (
                <Card className="border-forest/20 dark:border-forest/30 dark:bg-[#1e2b1f]">
                  <CardHeader>
                    <CardTitle className="text-forest dark:text-[#F5F5F0] flex items-center">
                      <Pill className="h-5 w-5 mr-2 text-bronze" />
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
                    <h3 className="font-semibold text-forest dark:text-[#F5F5F0] mb-2">Prescription Guide Locked</h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                      Detailed prescription and usage guidelines are available for Premium subscribers.
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mb-4">
                      Your current plan: <span className="font-semibold capitalize">{tier}</span>
                    </p>
                    <Link href="/subscription">
                      <Button className="bg-forest hover:bg-forest-mist text-white">
                        <Crown className="h-4 w-4 mr-2" />
                        Upgrade to Premium
                      </Button>
                    </Link>
                  </CardContent>
                </Card>
              )
            )}

            {/* Side Effects - GATED */}
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
                    <h3 className="font-semibold text-forest dark:text-[#F5F5F0] mb-2">Safety Information Locked</h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                      Side effects, precautions, and drug interaction data are available for Premium subscribers.
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mb-4">
                      Your current plan: <span className="font-semibold capitalize">{tier}</span>
                    </p>
                    <Link href="/subscription">
                      <Button className="bg-forest hover:bg-forest-mist text-white">
                        <Crown className="h-4 w-4 mr-2" />
                        Upgrade to Premium
                      </Button>
                    </Link>
                  </CardContent>
                </Card>
              )
            )}

            {/* Related Herbs */}
            {relatedHerbs.length > 0 && (
              <div className="pt-6 border-t border-gray-200 dark:border-gray-700">
                <h3 className="text-xl font-bold text-forest dark:text-[#F5F5F0] mb-4">Related Herbs</h3>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  {relatedHerbs.map((related: any) => (
                    <Link 
                      key={related.id} 
                      href={`/herb/${related.slug || related.id}`}
                      className="group block"
                    >
                      <div className="bg-white dark:bg-[#1e2b1f] rounded-xl overflow-hidden border border-forest/20 hover:border-forest transition-all hover:shadow-md">
                        <div className="aspect-video bg-gray-100 dark:bg-[#2a3a2b] relative overflow-hidden">
                          {related.imageUrl ? (
                            <img 
                              src={related.imageUrl} 
                              alt={related.name}
                              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                            />
                          ) : null}
                        </div>
                        <div className="p-3">
                          <h4 className="font-semibold text-forest dark:text-[#F5F5F0] text-sm">{related.name}</h4>
                          <p className="text-xs text-gray-500 dark:text-gray-400 italic truncate">{related.scientificName}</p>
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}