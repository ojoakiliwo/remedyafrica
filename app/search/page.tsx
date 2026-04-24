'use client';

import { useState, useEffect, Suspense, useRef } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import {
  Search,
  Leaf,
  Stethoscope,
  ArrowRight,
  Loader2,
  Sparkles,
  AlertCircle,
  User,
  MapPin,
  Star,
  X,
  ChevronRight,
  Heart,
  Beaker,
  Camera,
  Upload,
  Scan,
  ImageIcon,
  CheckCircle2,
  Info,
  RefreshCw
} from 'lucide-react';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '@/lib/firebase/client';

interface Herb {
  id: string;
  name: string;
  description?: string;
  imageUrl?: string;
  medicinalUses?: string[];
  slug?: string;
  origin?: string;
  category?: string;
  scientificName?: string;
}

interface Practitioner {
  id: string;
  name: string;
  specialty?: string;
  bio?: string;
  photoURL?: string;
  location?: string;
  rating?: number;
  consultationFee?: number;
  isVerified?: boolean;
}

interface SearchResults {
  explanation: string;
  herbs: Herb[];
  practitioners: Practitioner[];
  relatedSymptoms?: string[];
}

interface PlantIdSuggestion {
  name: string;
  scientificName: string;
  probability: number;
  family: string | null;
  genus: string | null;
  commonNames: string[];
  description: string | null;
  similarImages: string[];
  edibleParts: string[];
  wikiDescription: string | null;
  wikiUrl: string | null;
}

interface PlantIdResult {
  success: boolean;
  suggestions: PlantIdSuggestion[];
  accessToken: string;
  modelVersion: string;
}

type SearchMode = 'text' | 'image';

function SearchPageContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const fileInputRef2 = useRef<HTMLInputElement>(null);
  const initialQuery = searchParams.get('q') || '';

  const [searchInput, setSearchInput] = useState(initialQuery);
  const [query, setQuery] = useState(initialQuery);
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<SearchResults | null>(null);
  const [error, setError] = useState('');
  const [hasSearched, setHasSearched] = useState(false);

  const [searchMode, setSearchMode] = useState<SearchMode>('text');
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [identifying, setIdentifying] = useState(false);
  const [plantIdResult, setPlantIdResult] = useState<PlantIdResult | null>(null);
  const [identifyError, setIdentifyError] = useState('');
  const [matchedHerbs, setMatchedHerbs] = useState<Herb[]>([]);
  const [allHerbs, setAllHerbs] = useState<Herb[]>([]);

  useEffect(() => {
    const loadHerbs = async () => {
      try {
        const herbsRef = collection(db, 'herbs');
        const snapshot = await getDocs(herbsRef);
        const herbs = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        })) as Herb[];
        setAllHerbs(herbs);
      } catch (err) {
        console.error('Error loading herbs:', err);
      }
    };
    loadHerbs();
  }, []);

  useEffect(() => {
    const q = searchParams.get('q') || '';
    setQuery(q);
    setSearchInput(q);
    if (q.trim()) {
      performTextSearch(q.trim());
    } else {
      setResults(null);
      setHasSearched(false);
    }
  }, [searchParams]);

  const performTextSearch = async (searchQuery: string) => {
    setLoading(true);
    setError('');
    setHasSearched(true);

    try {
      const lowerQuery = searchQuery.toLowerCase();
      const queryTerms = lowerQuery.split(/\s+/).filter(t => t.length > 2);

      const herbsRef = collection(db, 'herbs');
      const herbsSnapshot = await getDocs(herbsRef);
      const allHerbs = herbsSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Herb[];

      const matchedHerbs = allHerbs.filter((herb) => {
        const text = `${herb.name || ''} ${herb.scientificName || ''} ${herb.description || ''} ${(herb.medicinalUses || []).join(' ')} ${herb.origin || ''} ${herb.category || ''}`.toLowerCase();
        return queryTerms.some(term => text.includes(term)) || text.includes(lowerQuery);
      }).slice(0, 8);

      const practitionersRef = collection(db, 'practitioners');
      const practitionersSnapshot = await getDocs(practitionersRef);
      const allPractitioners = practitionersSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Practitioner[];

      const matchedPractitioners = allPractitioners.filter((p) => {
        const text = `${p.name || ''} ${p.specialty || ''} ${p.bio || ''} ${p.location || ''}`.toLowerCase();
        return queryTerms.some(term => text.includes(term)) || text.includes(lowerQuery);
      }).slice(0, 4);

      let explanation = '';
      if (matchedHerbs.length > 0) {
        explanation = `Based on your search for "${searchQuery}", I found ${matchedHerbs.length} herbal remedy${matchedHerbs.length !== 1 ? 'ies' : 'y'} that may help. `;
        explanation += matchedHerbs.length > 0
          ? `Traditional African medicine has long used ${matchedHerbs[0].name}${matchedHerbs.length > 1 ? ` and ${matchedHerbs.length - 1} other${matchedHerbs.length > 2 ? 's' : ''}` : ''} for conditions related to your search.`
          : '';
      } else if (matchedPractitioners.length > 0) {
        explanation = `I didn't find specific herbal remedies for "${searchQuery}", but I found ${matchedPractitioners.length} qualified practitioner${matchedPractitioners.length !== 1 ? 's' : ''} who specialize in related areas. Consider booking a consultation for personalized guidance.`;
      } else {
        explanation = `I couldn't find exact matches for "${searchQuery}" in our database. Try searching with different keywords like specific symptoms (e.g., "headache", "digestion", "skin rash") or herb names.`;
      }

      setResults({
        explanation,
        herbs: matchedHerbs,
        practitioners: matchedPractitioners,
        relatedSymptoms: queryTerms.length > 0 ? queryTerms : undefined
      });
    } catch (err) {
      console.error('Search error:', err);
      setError('Something went wrong while searching. Please check your connection and try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleTextSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchInput.trim()) {
      router.push(`/search?q=${encodeURIComponent(searchInput.trim())}`);
    }
  };

  const clearSearch = () => {
    setSearchInput('');
    router.push('/search');
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setIdentifyError('Please select a valid image file (JPEG, PNG, WebP)');
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      setIdentifyError('Image too large. Please select an image under 10MB.');
      return;
    }

    setIdentifyError('');
    setSelectedFile(file);
    setPlantIdResult(null);
    setMatchedHerbs([]);

    const reader = new FileReader();
    reader.onload = (event) => {
      setSelectedImage(event.target?.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleIdentify = async () => {
    if (!selectedFile) return;

    setIdentifying(true);
    setIdentifyError('');
    setPlantIdResult(null);
    setMatchedHerbs([]);

    try {
      const formData = new FormData();
      formData.append('image', selectedFile);

      const response = await fetch('/api/identify-herb', {
        method: 'POST',
        body: formData,
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Identification failed');
      }

      setPlantIdResult(data);

      if (data.suggestions && data.suggestions.length > 0 && allHerbs.length > 0) {
        const matched: Herb[] = [];
        const seen = new Set<string>();

        for (const suggestion of data.suggestions) {
          const searchTerms = [
            suggestion.name.toLowerCase(),
            suggestion.scientificName.toLowerCase(),
            ...(suggestion.commonNames || []).map((n: string) => n.toLowerCase()),
            suggestion.genus?.toLowerCase(),
            suggestion.family?.toLowerCase(),
          ].filter(Boolean);

          for (const herb of allHerbs) {
            if (seen.has(herb.id)) continue;

            const herbText = `${herb.name || ''} ${herb.scientificName || ''} ${herb.description || ''} ${(herb.medicinalUses || []).join(' ')}`.toLowerCase();

            const isMatch = searchTerms.some(term =>
              term && herbText.includes(term)
            );

            if (isMatch) {
              matched.push(herb);
              seen.add(herb.id);
            }
          }
        }

        setMatchedHerbs(matched.slice(0, 6));
      }
    } catch (err: any) {
      console.error('Plant identification error:', err);
      setIdentifyError(err.message || 'Failed to identify plant. Please try again.');
    } finally {
      setIdentifying(false);
    }
  };

  const resetImageSearch = () => {
    setSelectedImage(null);
    setSelectedFile(null);
    setPlantIdResult(null);
    setIdentifyError('');
    setMatchedHerbs([]);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
    if (fileInputRef2.current) {
      fileInputRef2.current.value = '';
    }
  };

  const quickSuggestions = ['Stress relief', 'Digestion', 'Immune boost', 'Skin care', 'Sleep aid', 'Joint pain'];

  return (
    <div className="min-h-screen bg-gradient-to-b from-emerald-50/50 via-stone-50 to-white">
      <div className="pt-24 pb-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-3xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-emerald-100 text-emerald-800 text-sm font-medium mb-6">
            <Sparkles className="w-4 h-4" aria-hidden="true" />
            AI-Powered Herbal Search
          </div>
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-stone-800 mb-4">
            {query && searchMode === 'text' ? `Results for "${query}"` : 'Find Natural Remedies'}
          </h1>
          <p className="text-stone-500 text-lg mb-8 max-w-xl mx-auto">
            Search by text or snap a photo to identify plants and discover traditional African remedies.
          </p>

          {/* Search Mode Toggle — NO ARIA attributes to avoid linter false positives */}
          <div className="inline-flex p-1 rounded-xl bg-stone-100 mb-6">
            <button
              type="button"
              onClick={() => setSearchMode('text')}
              className={`flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-medium transition-all ${
                searchMode === 'text'
                  ? 'bg-white text-emerald-700 shadow-sm'
                  : 'text-stone-500 hover:text-stone-700'
              }`}
            >
              <Search className="w-4 h-4" aria-hidden="true" />
              Text Search
            </button>
            <button
              type="button"
              onClick={() => setSearchMode('image')}
              className={`flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-medium transition-all ${
                searchMode === 'image'
                  ? 'bg-white text-emerald-700 shadow-sm'
                  : 'text-stone-500 hover:text-stone-700'
              }`}
            >
              <Camera className="w-4 h-4" aria-hidden="true" />
              Identify by Photo
            </button>
          </div>

          {/* TEXT SEARCH */}
          {searchMode === 'text' && (
            <form onSubmit={handleTextSubmit} className="relative max-w-2xl mx-auto">
              <div className="relative group">
                <Search className="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 text-emerald-400 group-focus-within:text-emerald-600 transition-colors" aria-hidden="true" />
                <input
                  type="text"
                  value={searchInput}
                  onChange={(e) => setSearchInput(e.target.value)}
                  placeholder="e.g., headaches, insomnia, moringa, immune boost..."
                  aria-label="Search symptoms, herbs, or remedies"
                  className="w-full pl-14 pr-14 py-4 rounded-2xl border-2 border-emerald-100 bg-white text-stone-800 placeholder:text-stone-400 text-lg focus:outline-none focus:border-emerald-400 focus:ring-4 focus:ring-emerald-100 transition-all shadow-sm"
                />
                {searchInput && (
                  <button
                    type="button"
                    onClick={clearSearch}
                    aria-label="Clear search"
                    title="Clear search"
                    className="absolute right-4 top-1/2 -translate-y-1/2 p-1 rounded-full hover:bg-stone-100 text-stone-400 hover:text-stone-600 transition-colors"
                  >
                    <X className="w-5 h-5" aria-hidden="true" />
                  </button>
                )}
              </div>
              <button
                type="submit"
                disabled={loading || !searchInput.trim()}
                className="mt-4 px-8 py-3 bg-gradient-to-r from-emerald-600 to-teal-700 text-white font-semibold rounded-xl hover:from-emerald-700 hover:to-teal-800 transition-all shadow-md hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 mx-auto"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" aria-hidden="true" />
                    Searching...
                  </>
                ) : (
                  <>
                    <Sparkles className="w-5 h-5" aria-hidden="true" />
                    Search Remedies
                  </>
                )}
              </button>
            </form>
          )}

          {/* IMAGE SEARCH */}
          {searchMode === 'image' && (
            <div className="max-w-2xl mx-auto">
              {!selectedImage ? (
                <>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleFileSelect}
                    aria-label="Upload plant photo"
                    className="sr-only"
                    id="plant-upload"
                  />
                  <label
                    htmlFor="plant-upload"
                    className="relative block border-2 border-dashed border-emerald-200 rounded-2xl p-12 cursor-pointer hover:border-emerald-400 hover:bg-emerald-50/30 transition-all group"
                  >
                    <div className="flex flex-col items-center gap-4">
                      <div className="w-16 h-16 rounded-full bg-emerald-100 flex items-center justify-center group-hover:bg-emerald-200 transition-colors">
                        <Upload className="w-8 h-8 text-emerald-600" aria-hidden="true" />
                      </div>
                      <div>
                        <p className="text-lg font-semibold text-stone-700">
                          Upload or drag a plant photo
                        </p>
                        <p className="text-sm text-stone-400 mt-1">
                          JPEG, PNG, WebP up to 10MB
                        </p>
                      </div>
                      <div className="flex items-center gap-2 text-xs text-stone-400">
                        <Scan className="w-3.5 h-3.5" aria-hidden="true" />
                        Powered by Plant.id AI
                      </div>
                    </div>
                  </label>
                </>
              ) : (
                <div className="space-y-4">
                  <div className="relative inline-block">
                    <div className="relative w-64 h-64 mx-auto rounded-2xl overflow-hidden border-2 border-emerald-200 shadow-sm">
                      <Image
                        src={selectedImage}
                        alt="Selected plant photo for identification"
                        fill
                        className="object-cover"
                      />
                    </div>
                    <button
                      onClick={resetImageSearch}
                      aria-label="Remove selected photo"
                      title="Remove selected photo"
                      className="absolute -top-2 -right-2 p-1.5 rounded-full bg-red-500 text-white shadow-md hover:bg-red-600 transition-colors"
                    >
                      <X className="w-4 h-4" aria-hidden="true" />
                    </button>
                  </div>

                  <div className="flex items-center justify-center gap-3">
                    <input
                      ref={fileInputRef2}
                      type="file"
                      accept="image/*"
                      onChange={handleFileSelect}
                      aria-label="Change plant photo"
                      className="sr-only"
                      id="plant-upload-2"
                    />
                    <label
                      htmlFor="plant-upload-2"
                      className="px-4 py-2 rounded-xl text-sm font-medium text-stone-600 border border-stone-200 hover:bg-stone-50 transition-colors flex items-center gap-2 cursor-pointer"
                    >
                      <ImageIcon className="w-4 h-4" aria-hidden="true" />
                      Change Photo
                    </label>
                    <button
                      onClick={handleIdentify}
                      disabled={identifying}
                      className="px-6 py-2 rounded-xl text-sm font-semibold text-white bg-gradient-to-r from-emerald-600 to-teal-700 hover:from-emerald-700 hover:to-teal-800 transition-all shadow-md disabled:opacity-50 flex items-center gap-2"
                    >
                      {identifying ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin" aria-hidden="true" />
                          Identifying...
                        </>
                      ) : (
                        <>
                          <Scan className="w-4 h-4" aria-hidden="true" />
                          Identify Plant
                        </>
                      )}
                    </button>
                  </div>
                </div>
              )}

              {identifyError && (
                <div className="mt-4 p-4 rounded-xl bg-red-50 border border-red-100 flex items-start gap-3 max-w-md mx-auto" role="alert">
                  <AlertCircle className="w-5 h-5 text-red-500 shrink-0 mt-0.5" aria-hidden="true" />
                  <p className="text-red-700 text-sm">{identifyError}</p>
                </div>
              )}
            </div>
          )}

          {searchMode === 'text' && !hasSearched && (
            <div className="mt-8 flex flex-wrap justify-center gap-2">
              {quickSuggestions.map((suggestion) => (
                <button
                  key={suggestion}
                  onClick={() => {
                    setSearchInput(suggestion);
                    router.push(`/search?q=${encodeURIComponent(suggestion)}`);
                  }}
                  className="px-4 py-2 rounded-full bg-white border border-emerald-100 text-sm text-emerald-700 hover:bg-emerald-50 hover:border-emerald-300 transition-colors shadow-sm"
                >
                  {suggestion}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* RESULTS */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-20">
        {searchMode === 'text' && (
          <>
            {error && (
              <div className="max-w-2xl mx-auto mb-8 p-4 rounded-xl bg-red-50 border border-red-100 flex items-start gap-3" role="alert">
                <AlertCircle className="w-5 h-5 text-red-500 shrink-0 mt-0.5" aria-hidden="true" />
                <p className="text-red-700 text-sm">{error}</p>
              </div>
            )}

            {loading && (
              <div className="max-w-2xl mx-auto space-y-8">
                <div className="p-6 rounded-2xl bg-white border border-emerald-100 shadow-sm animate-pulse">
                  <div className="h-4 bg-emerald-100 rounded w-3/4 mb-3"></div>
                  <div className="h-4 bg-emerald-100 rounded w-full mb-2"></div>
                  <div className="h-4 bg-emerald-100 rounded w-5/6"></div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="rounded-2xl bg-white border border-stone-100 overflow-hidden animate-pulse">
                      <div className="h-48 bg-stone-100"></div>
                      <div className="p-4 space-y-2">
                        <div className="h-5 bg-stone-100 rounded w-2/3"></div>
                        <div className="h-4 bg-stone-100 rounded w-full"></div>
                        <div className="h-4 bg-stone-100 rounded w-4/5"></div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {results && !loading && (
              <div className="space-y-10">
                <div className="max-w-3xl mx-auto">
                  <div className="relative p-6 sm:p-8 rounded-2xl bg-gradient-to-br from-emerald-50 to-teal-50 border border-emerald-100 shadow-sm">
                    <div className="absolute -top-3 left-6">
                      <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-600 text-white text-xs font-semibold shadow-sm">
                        <Sparkles className="w-3 h-3" aria-hidden="true" />
                        AI Analysis
                      </div>
                    </div>
                    <p className="text-stone-700 leading-relaxed mt-2">
                      {results.explanation}
                    </p>
                    {results.relatedSymptoms && results.relatedSymptoms.length > 0 && (
                      <div className="mt-4 flex flex-wrap gap-2">
                        <span className="text-xs text-stone-500 font-medium">Related terms:</span>
                        {results.relatedSymptoms.map((term) => (
                          <span key={term} className="px-2 py-1 rounded-md bg-white text-xs text-emerald-700 border border-emerald-100">
                            {term}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                {results.herbs.length > 0 && (
                  <div>
                    <div className="flex items-center justify-between mb-6">
                      <h2 className="text-2xl font-bold text-stone-800 flex items-center gap-2">
                        <Leaf className="w-6 h-6 text-emerald-600" aria-hidden="true" />
                        Herbal Remedies
                        <span className="text-sm font-normal text-stone-400 ml-2">
                          ({results.herbs.length} found)
                        </span>
                      </h2>
                      <Link
                        href="/herbs"
                        className="text-sm font-medium text-emerald-700 hover:text-emerald-800 flex items-center gap-1"
                      >
                        View all <ArrowRight className="w-4 h-4" aria-hidden="true" />
                      </Link>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                      {results.herbs.map((herb) => (
                        <Link
                          key={herb.id}
                          href={`/herb/${herb.slug || herb.id}`}
                          className="group bg-white rounded-2xl border border-stone-100 overflow-hidden hover:shadow-lg hover:border-emerald-200 transition-all duration-300"
                        >
                          <div className="relative h-48 overflow-hidden bg-stone-100">
                            {herb.imageUrl ? (
                              <Image
                                src={herb.imageUrl}
                                alt={herb.name}
                                fill
                                className="object-cover group-hover:scale-105 transition-transform duration-500"
                              />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-emerald-50 to-teal-50">
                                <Leaf className="w-12 h-12 text-emerald-200" aria-hidden="true" />
                              </div>
                            )}
                            <div className="absolute top-3 right-3">
                              <div className="p-1.5 rounded-full bg-white/90 backdrop-blur-sm shadow-sm">
                                <Heart className="w-4 h-4 text-stone-400 hover:text-red-500 transition-colors" aria-hidden="true" />
                              </div>
                            </div>
                          </div>
                          <div className="p-5">
                            <h3 className="font-bold text-stone-800 mb-1 group-hover:text-emerald-700 transition-colors">
                              {herb.name}
                            </h3>
                            {herb.category && (
                              <span className="inline-block px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-700 text-xs font-medium mb-2">
                                {herb.category}
                              </span>
                            )}
                            <p className="text-sm text-stone-500 line-clamp-2 mb-3">
                              {herb.description || 'Traditional African herbal remedy.'}
                            </p>
                            {herb.medicinalUses && herb.medicinalUses.length > 0 && (
                              <div className="flex flex-wrap gap-1">
                                {herb.medicinalUses.slice(0, 2).map((use, idx) => (
                                  <span key={idx} className="px-2 py-1 rounded-full bg-stone-50 text-stone-600 text-xs">
                                    {use}
                                  </span>
                                ))}
                                {herb.medicinalUses.length > 2 && (
                                  <span className="px-2 py-1 rounded-full bg-stone-50 text-stone-400 text-xs">
                                    +{herb.medicinalUses.length - 2}
                                  </span>
                                )}
                              </div>
                            )}
                          </div>
                        </Link>
                      ))}
                    </div>
                  </div>
                )}

                {results.practitioners.length > 0 && (
                  <div>
                    <div className="flex items-center justify-between mb-6">
                      <h2 className="text-2xl font-bold text-stone-800 flex items-center gap-2">
                        <Stethoscope className="w-6 h-6 text-teal-600" aria-hidden="true" />
                        {results.herbs.length === 0 ? 'Suggested Practitioners' : 'Consult a Practitioner'}
                        <span className="text-sm font-normal text-stone-400 ml-2">
                          ({results.practitioners.length} available)
                        </span>
                      </h2>
                      <Link
                        href="/practitioners"
                        className="text-sm font-medium text-teal-700 hover:text-teal-800 flex items-center gap-1"
                      >
                        View all <ArrowRight className="w-4 h-4" aria-hidden="true" />
                      </Link>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      {results.practitioners.map((practitioner) => (
                        <Link
                          key={practitioner.id}
                          href={`/consultation/${practitioner.id}`}
                          className="group flex gap-4 p-5 rounded-2xl bg-white border border-stone-100 hover:shadow-md hover:border-teal-200 transition-all"
                        >
                          <div className="relative w-20 h-20 rounded-xl overflow-hidden shrink-0 bg-stone-100">
                            {practitioner.photoURL ? (
                              <Image
                                src={practitioner.photoURL}
                                alt={practitioner.name}
                                fill
                                className="object-cover"
                              />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-teal-50 to-emerald-50">
                                <User className="w-8 h-8 text-teal-300" aria-hidden="true" />
                              </div>
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-start justify-between">
                              <div>
                                <h3 className="font-bold text-stone-800 group-hover:text-teal-700 transition-colors">
                                  {practitioner.name}
                                </h3>
                                {practitioner.specialty && (
                                  <p className="text-sm text-teal-600 font-medium">
                                    {practitioner.specialty}
                                  </p>
                                )}
                              </div>
                              {practitioner.isVerified && (
                                <div className="px-2 py-1 rounded-full bg-amber-50 text-amber-700 text-xs font-semibold flex items-center gap-1">
                                  <Star className="w-3 h-3 fill-amber-500 text-amber-500" aria-hidden="true" />
                                  Verified
                                </div>
                              )}
                            </div>
                            {practitioner.location && (
                              <div className="flex items-center gap-1 mt-1 text-xs text-stone-500">
                                <MapPin className="w-3 h-3" aria-hidden="true" />
                                {practitioner.location}
                              </div>
                            )}
                            {practitioner.bio && (
                              <p className="text-sm text-stone-500 mt-2 line-clamp-2">
                                {practitioner.bio}
                              </p>
                            )}
                            <div className="flex items-center justify-between mt-3">
                              {practitioner.rating && (
                                <div className="flex items-center gap-1">
                                  <Star className="w-4 h-4 fill-amber-400 text-amber-400" aria-hidden="true" />
                                  <span className="text-sm font-semibold text-stone-700">
                                    {practitioner.rating}
                                  </span>
                                </div>
                              )}
                              {practitioner.consultationFee && (
                                <span className="text-sm font-semibold text-emerald-700">
                                  ${practitioner.consultationFee}/session
                                </span>
                              )}
                            </div>
                            <div className="mt-3 flex items-center gap-1 text-sm font-medium text-teal-700 group-hover:gap-2 transition-all">
                              Book consultation <ChevronRight className="w-4 h-4" aria-hidden="true" />
                            </div>
                          </div>
                        </Link>
                      ))}
                    </div>
                  </div>
                )}

                {results.herbs.length === 0 && results.practitioners.length === 0 && (
                  <div className="text-center py-20">
                    <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-stone-100 flex items-center justify-center">
                      <Beaker className="w-10 h-10 text-stone-300" aria-hidden="true" />
                    </div>
                    <h3 className="text-xl font-bold text-stone-700 mb-2">No results found</h3>
                    <p className="text-stone-500 max-w-md mx-auto mb-6">
                      We couldn&apos;t find any herbs or practitioners matching &quot;{query}&quot;. Try searching with different keywords.
                    </p>
                    <div className="flex flex-wrap justify-center gap-2">
                      {['Stress', 'Digestion', 'Immune', 'Skin', 'Sleep'].map((term) => (
                        <button
                          key={term}
                          onClick={() => router.push(`/search?q=${encodeURIComponent(term)}`)}
                          className="px-4 py-2 rounded-full bg-emerald-50 text-emerald-700 text-sm font-medium hover:bg-emerald-100 transition-colors"
                        >
                          {term}
                        </button>
                      ))}
                    </div>
                    <Link
                      href="/practitioners"
                      className="inline-flex items-center gap-2 mt-6 px-6 py-3 bg-gradient-to-r from-teal-600 to-emerald-700 text-white rounded-xl font-semibold hover:from-teal-700 hover:to-emerald-800 transition-all shadow-sm"
                    >
                      <Stethoscope className="w-5 h-5" aria-hidden="true" />
                      Browse All Practitioners
                    </Link>
                  </div>
                )}
              </div>
            )}
          </>
        )}

        {searchMode === 'image' && plantIdResult && !identifying && (
          <div className="space-y-10">
            <div className="max-w-3xl mx-auto text-center">
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-emerald-100 text-emerald-800 text-sm font-medium mb-4">
                <CheckCircle2 className="w-4 h-4" aria-hidden="true" />
                Plant Identified
              </div>
              <h2 className="text-2xl font-bold text-stone-800 mb-2">
                We found {plantIdResult.suggestions.length} possible match{plantIdResult.suggestions.length !== 1 ? 'es' : ''}
              </h2>
              <p className="text-stone-500">
                Results powered by Plant.id AI
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {plantIdResult.suggestions.map((suggestion, index) => (
                <div
                  key={index}
                  className={`bg-white rounded-2xl border overflow-hidden transition-all ${
                    index === 0
                      ? 'border-emerald-300 shadow-lg ring-2 ring-emerald-100'
                      : 'border-stone-100 hover:shadow-md hover:border-emerald-200'
                  }`}
                >
                  <div className="relative">
                    {suggestion.similarImages.length > 0 ? (
                      <div className="relative h-48 overflow-hidden bg-stone-100">
                        <Image
                          src={suggestion.similarImages[0]}
                          alt={`Similar image of ${suggestion.name}`}
                          fill
                          className="object-cover"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />
                      </div>
                    ) : (
                      <div className="h-48 flex items-center justify-center bg-gradient-to-br from-emerald-50 to-teal-50">
                        <Leaf className="w-16 h-16 text-emerald-200" aria-hidden="true" />
                      </div>
                    )}
                    <div className="absolute top-3 left-3">
                      <div className={`px-3 py-1 rounded-full text-xs font-bold shadow-sm ${
                        suggestion.probability >= 70
                          ? 'bg-emerald-500 text-white'
                          : suggestion.probability >= 40
                          ? 'bg-amber-400 text-white'
                          : 'bg-stone-400 text-white'
                      }`}>
                        {suggestion.probability}% match
                      </div>
                    </div>
                    {index === 0 && (
                      <div className="absolute top-3 right-3">
                        <div className="px-3 py-1 rounded-full bg-white/90 backdrop-blur-sm text-emerald-700 text-xs font-bold shadow-sm flex items-center gap-1">
                          <CheckCircle2 className="w-3 h-3" aria-hidden="true" />
                          Best Match
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="p-5">
                    <h3 className="text-lg font-bold text-stone-800">
                      {suggestion.name}
                    </h3>
                    <p className="text-sm text-stone-500 italic mb-2">
                      {suggestion.scientificName}
                    </p>

                    {(suggestion.family || suggestion.genus) && (
                      <div className="flex flex-wrap gap-2 mb-3">
                        {suggestion.family && (
                          <span className="px-2 py-1 rounded-md bg-stone-50 text-stone-600 text-xs">
                            Family: {suggestion.family}
                          </span>
                        )}
                        {suggestion.genus && (
                          <span className="px-2 py-1 rounded-md bg-stone-50 text-stone-600 text-xs">
                            Genus: {suggestion.genus}
                          </span>
                        )}
                      </div>
                    )}

                    {suggestion.commonNames.length > 0 && (
                      <div className="mb-3">
                        <p className="text-xs text-stone-400 font-medium mb-1">Also known as:</p>
                        <div className="flex flex-wrap gap-1">
                          {suggestion.commonNames.slice(0, 4).map((name, i) => (
                            <span key={i} className="px-2 py-1 rounded-full bg-emerald-50 text-emerald-700 text-xs">
                              {name}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}

                    {suggestion.edibleParts.length > 0 && (
                      <div className="flex items-center gap-1.5 mb-3">
                        <Info className="w-3.5 h-3.5 text-emerald-500" aria-hidden="true" />
                        <span className="text-xs text-stone-600">
                          Edible parts: {suggestion.edibleParts.join(', ')}
                        </span>
                      </div>
                    )}

                    {suggestion.wikiDescription && (
                      <p className="text-sm text-stone-500 line-clamp-3 mb-3">
                        {suggestion.wikiDescription}
                      </p>
                    )}

                    {suggestion.wikiUrl && (
                      <a
                        href={suggestion.wikiUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 text-sm text-emerald-700 hover:text-emerald-800 font-medium"
                      >
                        Learn more <ArrowRight className="w-3.5 h-3.5" aria-hidden="true" />
                      </a>
                    )}
                  </div>
                </div>
              ))}
            </div>

            {matchedHerbs.length > 0 && (
              <div>
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-2xl font-bold text-stone-800 flex items-center gap-2">
                    <Leaf className="w-6 h-6 text-emerald-600" aria-hidden="true" />
                    Found in RemedyAfrica Database
                    <span className="text-sm font-normal text-stone-400 ml-2">
                      ({matchedHerbs.length} match{matchedHerbs.length !== 1 ? 'es' : ''})
                    </span>
                  </h2>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                  {matchedHerbs.map((herb) => (
                    <Link
                      key={herb.id}
                      href={`/herb/${herb.slug || herb.id}`}
                      className="group bg-white rounded-2xl border border-stone-100 overflow-hidden hover:shadow-lg hover:border-emerald-200 transition-all duration-300"
                    >
                      <div className="relative h-48 overflow-hidden bg-stone-100">
                        {herb.imageUrl ? (
                          <Image
                            src={herb.imageUrl}
                            alt={herb.name}
                            fill
                            className="object-cover group-hover:scale-105 transition-transform duration-500"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-emerald-50 to-teal-50">
                            <Leaf className="w-12 h-12 text-emerald-200" aria-hidden="true" />
                          </div>
                        )}
                      </div>
                      <div className="p-5">
                        <h3 className="font-bold text-stone-800 mb-1 group-hover:text-emerald-700 transition-colors">
                          {herb.name}
                        </h3>
                        {herb.scientificName && (
                          <p className="text-xs text-stone-400 italic mb-2">{herb.scientificName}</p>
                        )}
                        {herb.category && (
                          <span className="inline-block px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-700 text-xs font-medium mb-2">
                            {herb.category}
                          </span>
                        )}
                        <p className="text-sm text-stone-500 line-clamp-2">
                          {herb.description || 'Traditional African herbal remedy.'}
                        </p>
                        {herb.medicinalUses && herb.medicinalUses.length > 0 && (
                          <div className="flex flex-wrap gap-1 mt-3">
                            {herb.medicinalUses.slice(0, 2).map((use, idx) => (
                              <span key={idx} className="px-2 py-1 rounded-full bg-stone-50 text-stone-600 text-xs">
                                {use}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                    </Link>
                  ))}
                </div>
              </div>
            )}

            {matchedHerbs.length === 0 && plantIdResult.suggestions.length > 0 && (
              <div className="max-w-2xl mx-auto text-center py-10">
                <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-amber-50 flex items-center justify-center">
                  <Info className="w-8 h-8 text-amber-500" aria-hidden="true" />
                </div>
                <h3 className="text-lg font-bold text-stone-700 mb-2">
                  Not yet in our database
                </h3>
                <p className="text-stone-500 mb-6">
                  We identified your plant, but it hasn&apos;t been added to the RemedyAfrica database yet.
                  Would you like to browse practitioners who may know more about it?
                </p>
                <Link
                  href="/practitioners"
                  className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-teal-600 to-emerald-700 text-white rounded-xl font-semibold hover:from-teal-700 hover:to-emerald-800 transition-all shadow-sm"
                >
                  <Stethoscope className="w-5 h-5" aria-hidden="true" />
                  Find a Practitioner
                </Link>
              </div>
            )}

            <div className="text-center pt-6">
              <button
                onClick={resetImageSearch}
                className="inline-flex items-center gap-2 px-6 py-3 rounded-xl text-sm font-medium text-stone-600 border border-stone-200 hover:bg-stone-50 transition-colors"
              >
                <RefreshCw className="w-4 h-4" aria-hidden="true" />
                Identify Another Plant
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default function SearchPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gradient-to-b from-emerald-50/50 via-stone-50 to-white pt-24">
        <div className="max-w-3xl mx-auto px-4 text-center">
          <Loader2 className="w-8 h-8 animate-spin text-emerald-600 mx-auto" aria-hidden="true" />
          <p className="mt-4 text-stone-500">Loading search...</p>
        </div>
      </div>
    }>
      <SearchPageContent />
    </Suspense>
  );
}