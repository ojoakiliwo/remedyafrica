'use client';

import { useState, useEffect, Suspense, useRef } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  Search,
  Leaf,
  ArrowRight,
  Loader2,
  AlertCircle,
  User,
  MapPin,
  Star,
  X,
  Camera,
  Upload,
  Scan,
  Info,
  RefreshCw,
  Crown,
  ExternalLink,
} from 'lucide-react';
import { collection, getDocs, doc, getDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase/client';
import { useAuth } from '@/hooks/useAuth';
import { publicCatalogHerbs } from '@/lib/herb-trust';
import { HerbPreviewCard, PreviewHerb } from '@/components/editorial/HerbPreviewCard';
import { EditorialPage, PageHero, DisclaimerNote } from '@/components/editorial/PageHero';

interface Herb extends PreviewHerb {
  medicinalUses?: string[];
  category?: string;
  preparation?: string;
  partsUsed?: string;
  warnings?: string;
  searchKeywords?: string[] | string;
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
  isActive?: boolean;
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

type SearchMode = 'feel' | 'photo';

const synonymMap: Record<string, string[]> = {
  headache: ['headache', 'migraine', 'pain', 'relief', 'analgesic', 'anti-inflammatory', 'inflammatory'],
  migraine: ['migraine', 'headache', 'pain', 'relief', 'analgesic'],
  pain: ['pain', 'ache', 'relief', 'analgesic', 'anti-inflammatory', 'inflammatory', 'headache', 'migraine'],
  malaria: ['malaria', 'antimalarial', 'fever', 'parasite', 'plasmodium', 'quinine'],
  fever: ['fever', 'antipyretic', 'malaria', 'typhoid', 'temperature'],
  digestion: ['digestion', 'digestive', 'stomach', 'gastric', 'ulcer', 'constipation', 'diarrhea', 'bloating', 'indigestion', 'appetite'],
  stomach: ['stomach', 'digestion', 'digestive', 'gastric', 'ulcer', 'constipation', 'diarrhea'],
  constipation: ['constipation', 'digestion', 'laxative', 'bowel', 'stomach'],
  immune: ['immune', 'immunity', 'antiviral', 'antibacterial', 'infection', 'cold', 'flu', 'cough', 'respiratory'],
  cold: ['cold', 'flu', 'cough', 'respiratory', 'immune', 'congestion', 'sore throat'],
  cough: ['cough', 'cold', 'flu', 'respiratory', 'congestion', 'bronchitis'],
  skin: ['skin', 'dermatitis', 'eczema', 'acne', 'rash', 'wound', 'burn', 'complexion'],
  acne: ['acne', 'skin', 'pimple', 'dermatitis', 'complexion'],
  stress: ['stress', 'anxiety', 'calm', 'relax', 'sedative', 'insomnia', 'sleep', 'nervous', 'depression'],
  anxiety: ['anxiety', 'stress', 'calm', 'relax', 'sedative', 'nervous', 'depression'],
  sleep: ['sleep', 'insomnia', 'sedative', 'calm', 'relax', 'stress', 'anxiety'],
  insomnia: ['insomnia', 'sleep', 'sedative', 'calm', 'relax'],
  period: ['period', 'menstrual', 'menstruation', 'cramps', 'pms', 'fertility', 'hormone', 'uterine'],
  menstrual: ['menstrual', 'period', 'menstruation', 'cramps', 'pms', 'fertility', 'hormone'],
  fertility: ['fertility', 'conception', 'pregnant', 'pregnancy', 'uterine', 'hormone', 'ovulation'],
  prostate: ['prostate', 'urinary', 'bph', 'libido', 'testosterone', 'virility'],
  libido: ['libido', 'aphrodisiac', 'sexual', 'virility', 'testosterone', 'performance'],
  diabetes: ['diabetes', 'sugar', 'glucose', 'insulin', 'hypoglycemic', 'blood sugar'],
  sugar: ['sugar', 'glucose', 'diabetes', 'hypoglycemic', 'insulin', 'blood sugar'],
  pressure: ['pressure', 'hypertension', 'blood pressure', 'cardiovascular', 'heart', 'circulation'],
  heart: ['heart', 'cardiovascular', 'circulation', 'hypertension', 'cholesterol', 'blood pressure'],
  cholesterol: ['cholesterol', 'heart', 'cardiovascular', 'lipid', 'triglyceride'],
  liver: ['liver', 'hepatitis', 'detox', 'jaundice', 'hepatic'],
  kidney: ['kidney', 'renal', 'urinary', 'diuretic', 'bladder', 'stones'],
  worms: ['worms', 'parasite', 'anthelmintic', 'vermifuge', 'intestinal'],
  energy: ['energy', 'fatigue', 'tired', 'vitality', 'stamina', 'tonic', 'adaptogen'],
  fatigue: ['fatigue', 'energy', 'tired', 'vitality', 'stamina', 'tonic'],
  inflammation: ['inflammation', 'inflammatory', 'anti-inflammatory', 'swelling', 'arthritis', 'rheumatism', 'joint'],
  arthritis: ['arthritis', 'rheumatism', 'joint', 'inflammation', 'inflammatory', 'anti-inflammatory', 'pain'],
  joint: ['joint', 'arthritis', 'rheumatism', 'inflammation', 'pain', 'mobility'],
};

const promptChips = [
  { label: 'Headache', q: 'headache' },
  { label: 'Fever', q: 'malaria' },
  { label: 'Stomach', q: 'stomach' },
  { label: 'Sleep', q: 'sleep' },
  { label: 'Skin', q: 'skin' },
  { label: 'Cough', q: 'cough' },
];

function asList(value: unknown): string[] {
  if (Array.isArray(value)) return value.map((item) => String(item).trim()).filter(Boolean);
  if (typeof value === 'string') {
    return value.split(/[;|,]/).map((item) => item.trim()).filter(Boolean);
  }
  return [];
}

function scoreHerbs(herbs: Herb[], rawQuery: string): Herb[] {
  const terms = rawQuery
    .toLowerCase()
    .split(/\s+/)
    .filter((t) => t.length > 2);
  const expanded = new Set<string>();
  terms.forEach((term) => {
    expanded.add(term);
    (synonymMap[term] || []).forEach((syn) => expanded.add(syn));
  });
  const searchTerms = Array.from(expanded);

  return herbs
    .map((herb) => {
      const benefitsList = asList(herb.benefits);
      const nameText = (herb.name || '').toLowerCase();
      const scientificText = (herb.scientificName || '').toLowerCase();
      const descText = (herb.description || '').toLowerCase();
      const categoryText = (herb.category || '').toLowerCase();
      const originText = (herb.origin || '').toLowerCase();
      const partsText = (herb.partsUsed || '').toLowerCase();
      const prepText = (herb.preparation || '').toLowerCase();
      const localNamesText = asList(herb.commonNames).join(' ').toLowerCase();
      const keywordsText = asList(herb.searchKeywords).join(' ').toLowerCase();
      const usesText = asList(herb.medicinalUses).join(' ').toLowerCase();
      const benefitsText = benefitsList.join(' ').toLowerCase();

      let score = 0;
      searchTerms.forEach((term) => {
        if (nameText.includes(term)) score += 10;
        if (localNamesText.includes(term)) score += 9;
        if (scientificText.includes(term)) score += 8;
        if (usesText.includes(term)) score += 7;
        if (benefitsText.includes(term) || keywordsText.includes(term)) score += 6;
        if (descText.includes(term)) score += 5;
        if (categoryText.includes(term)) score += 4;
        if (originText.includes(term) || partsText.includes(term)) score += 2;
        if (prepText.includes(term)) score += 1;
        benefitsList.forEach((benefit) => {
          if (benefit.toLowerCase().includes(term)) score += 3;
        });
      });
      return { herb, score };
    })
    .filter((item) => item.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, 18)
    .map((item) => item.herb);
}

async function checkSubscription(uid: string): Promise<{ active: boolean; plan?: string }> {
  try {
    const subDoc = await getDoc(doc(db, 'users', uid, 'subscription', 'current'));
    if (!subDoc.exists()) return { active: false };
    const data = subDoc.data();
    const expiresAt = data.expiresAt?.toDate?.() || new Date(data.expiresAt);
    return { active: data.status === 'active' && expiresAt > new Date(), plan: data.plan };
  } catch {
    return { active: false };
  }
}

function SearchPageContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { user } = useAuth();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const allHerbsRef = useRef<Herb[]>([]);
  const initialQuery = searchParams.get('q') || '';

  const [searchInput, setSearchInput] = useState(initialQuery);
  const [query, setQuery] = useState(initialQuery);
  const [mode, setMode] = useState<SearchMode>('feel');
  const [explaining, setExplaining] = useState(false);
  const [matching, setMatching] = useState(false);
  const [aiExplanation, setAiExplanation] = useState('');
  const [isFallback, setIsFallback] = useState(false);
  const [explainError, setExplainError] = useState('');
  const [herbs, setHerbs] = useState<Herb[]>([]);
  const [practitioners, setPractitioners] = useState<Practitioner[]>([]);
  const [allHerbs, setAllHerbs] = useState<Herb[]>([]);
  const [showHealers, setShowHealers] = useState(false);
  const [needsSubscription, setNeedsSubscription] = useState(false);
  const [checkingSub, setCheckingSub] = useState(false);

  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [identifying, setIdentifying] = useState(false);
  const [plantIdResult, setPlantIdResult] = useState<PlantIdResult | null>(null);
  const [identifyError, setIdentifyError] = useState('');
  const [matchedHerbs, setMatchedHerbs] = useState<Herb[]>([]);

  allHerbsRef.current = allHerbs;

  useEffect(() => {
    getDocs(collection(db, 'herbs')).then((snap) => {
      setAllHerbs(publicCatalogHerbs(snap.docs.map((d) => ({ id: d.id, ...d.data() } as Herb))));
    });
  }, []);

  const applyMatches = (q: string) => {
    const library = allHerbsRef.current;
    if (!library.length) {
      setMatching(true);
      return;
    }
    setHerbs(scoreHerbs(library, q));
    setMatching(false);
  };

  const startTextFlow = async (q: string) => {
    setQuery(q);
    setMode('feel');
    setShowHealers(false);
    setNeedsSubscription(false);
    setPractitioners([]);
    setPlantIdResult(null);
    setMatchedHerbs([]);
    setExplainError('');
    setAiExplanation('');
    setExplaining(true);
    applyMatches(q);

    try {
      const res = await fetch('/api/ai-explain', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ symptoms: q }),
      });
      const data = await res.json();
      if (data.explanation) {
        setAiExplanation(data.explanation);
        setIsFallback(!!data.isFallback);
      } else {
        throw new Error('No explanation');
      }
    } catch {
      setExplainError('We could not write a note just now. The plant matches below still come from the library.');
    } finally {
      setExplaining(false);
    }
  };

  useEffect(() => {
    const q = searchParams.get('q') || '';
    setQuery(q);
    setSearchInput(q);
    if (q.trim()) startTextFlow(q.trim());
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams]);

  useEffect(() => {
    if (query.trim() && allHerbs.length && mode === 'feel') {
      applyMatches(query);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [allHerbs]);

  const handleTextSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchInput.trim()) {
      router.push(`/search?q=${encodeURIComponent(searchInput.trim())}`);
    }
  };

  const browsePractitioners = async () => {
    setCheckingSub(true);
    if (!user) {
      setNeedsSubscription(true);
      setShowHealers(true);
      setCheckingSub(false);
      return;
    }
    const sub = await checkSubscription(user.uid);
    if (!sub.active) {
      setNeedsSubscription(true);
      setShowHealers(true);
      setCheckingSub(false);
      return;
    }

    const lowerQuery = query.toLowerCase();
    const terms = lowerQuery.split(/\s+/).filter((t) => t.length > 2);
    const snap = await getDocs(collection(db, 'practitioners'));
    const all = snap.docs.map((d) => ({ id: d.id, ...d.data() } as Practitioner));
    const matched = all
      .filter((p) => {
        const text = `${p.name || ''} ${p.specialty || ''} ${p.bio || ''} ${p.location || ''}`.toLowerCase();
        return terms.some((t) => text.includes(t)) || text.includes(lowerQuery);
      })
      .slice(0, 4);

    setPractitioners(matched);
    setNeedsSubscription(false);
    setShowHealers(true);
    setCheckingSub(false);
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      setIdentifyError('Please choose a photograph of a leaf, root, or plant.');
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      setIdentifyError('That file is larger than 10MB.');
      return;
    }
    setIdentifyError('');
    setSelectedFile(file);
    setPlantIdResult(null);
    setMatchedHerbs([]);
    const reader = new FileReader();
    reader.onload = (ev) => setSelectedImage(ev.target?.result as string);
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
      const res = await fetch('/api/identify-herb', { method: 'POST', body: formData });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed');
      setPlantIdResult(data);

      if (data.suggestions?.length && allHerbsRef.current.length) {
        const matched: Herb[] = [];
        const seen = new Set<string>();
        for (const suggestion of data.suggestions) {
          const terms = [
            suggestion.name.toLowerCase(),
            suggestion.scientificName.toLowerCase(),
            ...(suggestion.commonNames || []).map((n: string) => n.toLowerCase()),
            suggestion.genus?.toLowerCase(),
            suggestion.family?.toLowerCase(),
          ].filter(Boolean);
          for (const herb of allHerbsRef.current) {
            if (seen.has(herb.id)) continue;
            const text = `${herb.name || ''} ${herb.scientificName || ''} ${asList(herb.commonNames).join(' ')}`.toLowerCase();
            if (terms.some((t) => t && text.includes(t))) {
              matched.push(herb);
              seen.add(herb.id);
            }
          }
        }
        setMatchedHerbs(matched.slice(0, 6));
      }
    } catch (err: unknown) {
      setIdentifyError(err instanceof Error ? err.message : 'We could not identify that photo.');
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
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const hasFeelResults = mode === 'feel' && Boolean(query.trim());

  return (
    <EditorialPage>
      <PageHero
        eyebrow="Ask the land"
        title={query && mode === 'feel' ? query : 'Find a plant by how you feel'}
        subtitle={
          query && mode === 'feel'
            ? 'Matches from the library, written in plain language. This is traditional knowledge, not a diagnosis.'
            : 'Type a symptom in everyday words, or photograph a leaf from the compound. We look in the same herb library you browse elsewhere.'
        }
      />

      <div className="relative z-10 mx-auto -mt-8 max-w-3xl px-4 sm:px-6 lg:px-8">
        <div className="rounded-[2rem] border border-forest/10 bg-white p-3 shadow-lift sm:p-4">
          <div className="mb-3 flex gap-1 rounded-full bg-cream p-1">
            <button
              type="button"
              onClick={() => setMode('feel')}
              className={`flex flex-1 items-center justify-center gap-2 rounded-full px-4 py-2.5 text-sm font-medium transition-all ${
                mode === 'feel' ? 'bg-forest text-cream shadow-soft' : 'text-ink-muted hover:text-forest'
              }`}
            >
              <Search className="h-4 w-4" aria-hidden="true" />
              How I feel
            </button>
            <button
              type="button"
              onClick={() => setMode('photo')}
              className={`flex flex-1 items-center justify-center gap-2 rounded-full px-4 py-2.5 text-sm font-medium transition-all ${
                mode === 'photo' ? 'bg-forest text-cream shadow-soft' : 'text-ink-muted hover:text-forest'
              }`}
            >
              <Camera className="h-4 w-4" aria-hidden="true" />
              A photograph
            </button>
          </div>

          {mode === 'feel' ? (
            <form onSubmit={handleTextSubmit}>
              <label htmlFor="symptom-search" className="sr-only">
                Describe a symptom or plant name
              </label>
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                <div className="relative flex-1">
                  <Search className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-ink-muted/70" aria-hidden="true" />
                  <input
                    id="symptom-search"
                    type="text"
                    value={searchInput}
                    onChange={(e) => setSearchInput(e.target.value)}
                    placeholder="Headache, malaria, ewuro, sleep…"
                    className="w-full rounded-full border border-forest/10 bg-cream py-3.5 pl-12 pr-12 text-base text-ink placeholder:text-ink-muted/70 focus:border-bronze focus:outline-none focus:ring-2 focus:ring-bronze/20"
                  />
                  {searchInput && (
                    <button
                      type="button"
                      onClick={() => {
                        setSearchInput('');
                        router.push('/search');
                      }}
                      aria-label="Clear search"
                      className="absolute right-3 top-1/2 -translate-y-1/2 rounded-full p-1.5 text-ink-muted hover:bg-white hover:text-forest"
                    >
                      <X className="h-4 w-4" aria-hidden="true" />
                    </button>
                  )}
                </div>
                <button
                  type="submit"
                  disabled={!searchInput.trim() || explaining}
                  className="inline-flex items-center justify-center gap-2 rounded-full bg-forest px-7 py-3.5 text-sm font-medium text-cream shadow-soft transition hover:bg-forest-mist disabled:opacity-40"
                >
                  {explaining ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" /> : null}
                  Search
                </button>
              </div>
            </form>
          ) : (
            <div>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleFileSelect}
                className="sr-only"
                id="plant-upload"
              />
              {!selectedImage ? (
                <label
                  htmlFor="plant-upload"
                  className="flex cursor-pointer flex-col items-center gap-4 rounded-[1.5rem] border border-dashed border-forest/20 bg-cream px-6 py-12 text-center transition hover:border-bronze hover:bg-cream-dark/40"
                >
                  <span className="flex h-14 w-14 items-center justify-center rounded-full bg-white shadow-soft">
                    <Upload className="h-6 w-6 text-forest" aria-hidden="true" />
                  </span>
                  <span>
                    <span className="block font-serif text-2xl text-forest">Photograph a leaf</span>
                    <span className="mt-2 block text-sm text-ink-muted">JPEG, PNG, or WebP · up to 10MB</span>
                  </span>
                </label>
              ) : (
                <div className="flex flex-col items-center gap-5 py-4">
                  <div className="relative">
                    <img
                      src={selectedImage}
                      alt="Plant to identify"
                      className="h-56 w-56 rounded-3xl object-cover shadow-soft"
                    />
                    <button
                      type="button"
                      onClick={resetImageSearch}
                      aria-label="Remove photo"
                      className="absolute -right-2 -top-2 rounded-full bg-forest p-2 text-cream shadow-soft hover:bg-forest-mist"
                    >
                      <X className="h-4 w-4" aria-hidden="true" />
                    </button>
                  </div>
                  <div className="flex flex-wrap justify-center gap-3">
                    <label
                      htmlFor="plant-upload"
                      className="cursor-pointer rounded-full border border-forest/15 px-5 py-2.5 text-sm font-medium text-forest hover:bg-cream"
                    >
                      Change photo
                    </label>
                    <button
                      type="button"
                      onClick={handleIdentify}
                      disabled={identifying}
                      className="inline-flex items-center gap-2 rounded-full bg-forest px-6 py-2.5 text-sm font-medium text-cream hover:bg-forest-mist disabled:opacity-40"
                    >
                      {identifying ? (
                        <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
                      ) : (
                        <Scan className="h-4 w-4" aria-hidden="true" />
                      )}
                      {identifying ? 'Looking…' : 'Identify'}
                    </button>
                  </div>
                </div>
              )}
              {identifyError && (
                <p className="mt-4 flex items-start gap-2 px-2 text-sm text-red-700" role="alert">
                  <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
                  {identifyError}
                </p>
              )}
            </div>
          )}
        </div>

        {mode === 'feel' && !query && (
          <div className="mt-6 flex flex-wrap justify-center gap-2">
            {promptChips.map((chip) => (
              <button
                key={chip.q}
                type="button"
                onClick={() => router.push(`/search?q=${encodeURIComponent(chip.q)}`)}
                className="rounded-full border border-forest/10 bg-white px-4 py-2 text-sm text-ink-muted shadow-soft transition hover:border-bronze hover:text-forest"
              >
                {chip.label}
              </button>
            ))}
          </div>
        )}
      </div>

      <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6 lg:px-8">
        {mode === 'feel' && hasFeelResults && (
          <div className="space-y-16">
            {(explaining || aiExplanation || explainError) && (
              <section className="rounded-[2rem] border border-forest/10 bg-white p-8 sm:p-10 shadow-soft">
                <p className="eyebrow">A note on this concern</p>
                <div className="hairline mt-4 mb-6" />
                {explaining && !aiExplanation ? (
                  <div className="space-y-3">
                    <div className="h-4 w-2/3 animate-pulse rounded-full bg-cream-dark" />
                    <div className="h-4 w-full animate-pulse rounded-full bg-cream-dark" />
                    <div className="h-4 w-5/6 animate-pulse rounded-full bg-cream-dark" />
                  </div>
                ) : (
                  <div className="space-y-4 text-[15px] leading-relaxed text-ink-muted">
                    {aiExplanation.split('\n').map((paragraph, i) =>
                      paragraph.trim() ? (
                        <p key={i}>{paragraph.replace(/\*\*/g, '').replace(/^\d+\.\s*/, '').trim()}</p>
                      ) : null
                    )}
                    {explainError && (
                      <p className="flex items-start gap-2 text-sm text-bronze">
                        <Info className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
                        {explainError}
                      </p>
                    )}
                    {isFallback && (
                      <p className="text-xs uppercase tracking-[0.18em] text-bronze">General guidance · library still matched below</p>
                    )}
                  </div>
                )}
              </section>
            )}

            <section>
              <div className="mb-10 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
                <div>
                  <p className="eyebrow">From the library</p>
                  <h2 className="mt-3 font-serif text-3xl text-forest">
                    {matching && !herbs.length
                      ? 'Looking through the plants…'
                      : herbs.length === 1
                        ? '1 matching remedy'
                        : `${herbs.length} matching remedies`}
                  </h2>
                </div>
                <Link href="/category" className="inline-flex items-center gap-2 text-sm font-medium text-bronze hover:text-forest">
                  Browse by category <ArrowRight className="h-4 w-4" />
                </Link>
              </div>

              {matching && !herbs.length ? (
                <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
                  {Array.from({ length: 6 }).map((_, i) => (
                    <div key={i} className="aspect-[4/5] animate-pulse rounded-3xl bg-cream-dark/70" />
                  ))}
                </div>
              ) : herbs.length > 0 ? (
                <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
                  {herbs.map((herb) => (
                    <HerbPreviewCard key={herb.id} herb={herb} />
                  ))}
                </div>
              ) : (
                <div className="rounded-[2rem] border border-forest/10 bg-white px-8 py-16 text-center shadow-soft">
                  <Leaf className="mx-auto mb-4 h-10 w-10 text-bronze/40" aria-hidden="true" />
                  <h3 className="font-serif text-2xl text-forest">No plants matched that wording</h3>
                  <p className="mx-auto mt-3 max-w-md text-sm leading-relaxed text-ink-muted">
                    Try a simpler word — fever, sleep, stomach — or a local name such as ewuro or dogoyaro.
                  </p>
                </div>
              )}
            </section>

            <section className="overflow-hidden rounded-[2rem] bg-forest px-8 py-10 text-cream sm:px-12">
              <p className="eyebrow text-bronze">A healer, if you need one</p>
              <div className="mt-6 flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
                <div className="max-w-xl">
                  <h2 className="font-serif text-3xl leading-tight">Talk with a verified practitioner</h2>
                  <p className="mt-3 text-sm leading-relaxed text-cream/70">
                    The cards above are traditional uses from the library. A practitioner can listen to your story and advise in person.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={browsePractitioners}
                  disabled={checkingSub}
                  className="inline-flex items-center justify-center gap-2 rounded-full bg-cream px-6 py-3 text-sm font-medium text-forest hover:bg-white disabled:opacity-40"
                >
                  {checkingSub ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" /> : null}
                  Find a healer
                </button>
              </div>
            </section>

            {showHealers && needsSubscription && (
              <div className="rounded-[2rem] border border-bronze/25 bg-white px-8 py-12 text-center shadow-soft">
                <Crown className="mx-auto mb-4 h-8 w-8 text-bronze" aria-hidden="true" />
                <h3 className="font-serif text-2xl text-forest">A healer is included with care plans</h3>
                <p className="mx-auto mt-3 max-w-md text-sm leading-relaxed text-ink-muted">
                  Premium is two conversations a month. You can still read every public herb without an account.
                </p>
                <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
                  <Link
                    href="/subscription"
                    className="inline-flex rounded-full bg-forest px-6 py-3 text-sm font-medium text-cream hover:bg-forest-mist"
                  >
                    See care plans
                  </Link>
                  {!user && (
                    <Link
                      href="/login"
                      className="inline-flex rounded-full border border-forest/15 px-6 py-3 text-sm font-medium text-forest hover:bg-cream"
                    >
                      Sign in
                    </Link>
                  )}
                </div>
              </div>
            )}

            {showHealers && !needsSubscription && (
              <section>
                <p className="eyebrow">Practitioners</p>
                <h2 className="mt-3 font-serif text-3xl text-forest">
                  {practitioners.length ? 'People who may help' : 'No matching practitioners'}
                </h2>
                {practitioners.length > 0 ? (
                  <div className="mt-8 grid grid-cols-1 gap-6 md:grid-cols-2">
                    {practitioners.map((person) => (
                      <Link
                        key={person.id}
                        href={`/consultation/${person.id}`}
                        className="group flex gap-5 rounded-3xl border border-forest/10 bg-white p-6 shadow-soft transition hover:-translate-y-0.5 hover:shadow-lift"
                      >
                        <div className="h-20 w-20 shrink-0 overflow-hidden rounded-2xl bg-cream-dark">
                          {person.photoURL ? (
                            <img src={person.photoURL} alt={person.name} className="h-full w-full object-cover" />
                          ) : (
                            <div className="flex h-full items-center justify-center">
                              <User className="h-8 w-8 text-forest/30" aria-hidden="true" />
                            </div>
                          )}
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="flex items-start justify-between gap-3">
                            <div>
                              <h3 className="font-serif text-xl text-forest">{person.name}</h3>
                              {person.specialty && (
                                <p className="mt-0.5 text-sm text-bronze">{person.specialty}</p>
                              )}
                            </div>
                            {person.isVerified && (
                              <span className="rounded-full bg-cream px-2.5 py-1 text-[11px] uppercase tracking-wide text-forest">
                                Verified
                              </span>
                            )}
                          </div>
                          {person.location && (
                            <p className="mt-2 flex items-center gap-1 text-xs text-ink-muted">
                              <MapPin className="h-3 w-3" aria-hidden="true" />
                              {person.location}
                            </p>
                          )}
                          {person.bio && (
                            <p className="mt-2 line-clamp-2 text-sm leading-relaxed text-ink-muted">{person.bio}</p>
                          )}
                          <div className="mt-4 flex items-center justify-between text-sm">
                            <span className="inline-flex items-center gap-1 text-ink-muted">
                              {person.rating ? (
                                <>
                                  <Star className="h-4 w-4 fill-bronze text-bronze" aria-hidden="true" />
                                  {person.rating}
                                </>
                              ) : (
                                'Traditional practice'
                              )}
                            </span>
                            <span className="inline-flex items-center gap-1 font-medium text-bronze">
                              Book
                              <ArrowRight className="h-4 w-4 transition group-hover:translate-x-1" />
                            </span>
                          </div>
                        </div>
                      </Link>
                    ))}
                  </div>
                ) : (
                  <p className="mt-6 text-sm text-ink-muted">
                    No one matched this wording.{' '}
                    <Link href="/practitioners" className="font-medium text-forest hover:text-bronze">
                      Browse all practitioners
                    </Link>
                  </p>
                )}
              </section>
            )}
          </div>
        )}

        {mode === 'photo' && identifying && (
          <div className="py-20 text-center">
            <Loader2 className="mx-auto mb-4 h-8 w-8 animate-spin text-forest" aria-hidden="true" />
            <p className="font-serif text-2xl text-forest">Looking at the leaf…</p>
            <p className="mt-2 text-sm text-ink-muted">This usually takes a few seconds.</p>
          </div>
        )}

        {mode === 'photo' && plantIdResult && !identifying && (
          <div className="space-y-16">
            <section>
              <p className="eyebrow">Possible matches</p>
              <h2 className="mt-3 font-serif text-3xl text-forest">
                {plantIdResult.suggestions.length === 1
                  ? '1 plant suggestion'
                  : `${plantIdResult.suggestions.length} plant suggestions`}
              </h2>
              <div className="mt-8 grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
                {plantIdResult.suggestions.map((suggestion, index) => (
                  <article
                    key={`${suggestion.scientificName}-${index}`}
                    className="overflow-hidden rounded-3xl border border-forest/10 bg-white shadow-soft"
                  >
                    <div className="relative aspect-[4/3] bg-forest">
                      {suggestion.similarImages[0] ? (
                        <img
                          src={suggestion.similarImages[0]}
                          alt={suggestion.name}
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        <div className="flex h-full items-center justify-center">
                          <Leaf className="h-10 w-10 text-cream/30" aria-hidden="true" />
                        </div>
                      )}
                      <div className="absolute left-4 top-4 rounded-full bg-cream/95 px-3 py-1 text-[11px] font-medium uppercase tracking-wide text-forest">
                        {Math.round(suggestion.probability)}% likely
                        {index === 0 ? ' · closest' : ''}
                      </div>
                    </div>
                    <div className="p-6">
                      <h3 className="font-serif text-2xl text-forest">{suggestion.name}</h3>
                      <p className="mt-1 text-sm italic text-ink-muted">{suggestion.scientificName}</p>
                      {suggestion.commonNames.length > 0 && (
                        <p className="mt-2 text-sm text-forest/80">
                          {suggestion.commonNames.slice(0, 3).join(' · ')}
                        </p>
                      )}
                      {suggestion.wikiDescription && (
                        <p className="mt-3 line-clamp-3 text-sm leading-relaxed text-ink-muted">
                          {suggestion.wikiDescription}
                        </p>
                      )}
                      {suggestion.wikiUrl && (
                        <a
                          href={suggestion.wikiUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="mt-4 inline-flex items-center gap-1.5 text-sm font-medium text-bronze hover:text-forest"
                        >
                          Read more <ExternalLink className="h-3.5 w-3.5" aria-hidden="true" />
                        </a>
                      )}
                    </div>
                  </article>
                ))}
              </div>
            </section>

            {matchedHerbs.length > 0 && (
              <section>
                <p className="eyebrow">In our library</p>
                <h2 className="mt-3 font-serif text-3xl text-forest">Remedies we already keep</h2>
                <div className="mt-8 grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
                  {matchedHerbs.map((herb) => (
                    <HerbPreviewCard key={herb.id} herb={herb} />
                  ))}
                </div>
              </section>
            )}

            {matchedHerbs.length === 0 && plantIdResult.suggestions.length > 0 && (
              <div className="rounded-[2rem] border border-forest/10 bg-white px-8 py-12 text-center shadow-soft">
                <p className="font-serif text-2xl text-forest">Not in the library yet</p>
                <p className="mx-auto mt-3 max-w-md text-sm text-ink-muted">
                  We recognised a plant, but we have not catalogued it. A practitioner may still know it.
                </p>
                <Link
                  href="/practitioners"
                  className="mt-6 inline-flex rounded-full bg-forest px-6 py-3 text-sm font-medium text-cream hover:bg-forest-mist"
                >
                  Find a practitioner
                </Link>
              </div>
            )}

            <div className="text-center">
              <button
                type="button"
                onClick={resetImageSearch}
                className="inline-flex items-center gap-2 rounded-full border border-forest/15 px-5 py-2.5 text-sm text-forest hover:bg-white"
              >
                <RefreshCw className="h-4 w-4" aria-hidden="true" />
                Identify another plant
              </button>
            </div>
          </div>
        )}

        {mode === 'feel' && !query && (
          <DisclaimerNote>
            Search in the words you use at home. Local names such as ewuro, efirin, and dogoyaro work here. Nothing on this
            page replaces care from a qualified clinician or traditional healer.
          </DisclaimerNote>
        )}
      </div>
    </EditorialPage>
  );
}

export default function SearchPage() {
  return (
    <Suspense
      fallback={
        <EditorialPage>
          <div className="flex min-h-[50vh] items-center justify-center text-ink-muted">Opening search…</div>
        </EditorialPage>
      }
    >
      <SearchPageContent />
    </Suspense>
  );
}
