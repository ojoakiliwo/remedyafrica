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
  RefreshCw,
  Lock,
  Crown,
  Zap,
  MessageCircle
} from 'lucide-react';
import { collection, getDocs, doc, getDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase/client';
import { useAuth } from '@/hooks/useAuth';

/* ─────────── Types ─────────── */
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
  benefits?: string | string[];
  preparation?: string;
  partsUsed?: string;
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

type SearchStep =
  | 'input'
  | 'explaining'
  | 'explained'
  | 'searching-herbs'
  | 'herbs'
  | 'searching-practitioners'
  | 'practitioners'
  | 'subscription-required';

type SearchMode = 'text' | 'image';

/* ─────────── Subscription Check ─────────── */
async function checkSubscription(uid: string): Promise<{ active: boolean; plan?: string; expiresAt?: Date }> {
  try {
    const subDoc = await getDoc(doc(db, 'users', uid, 'subscription', 'current'));
    if (!subDoc.exists()) return { active: false };
    const data = subDoc.data();
    const expiresAt = data.expiresAt?.toDate?.() || new Date(data.expiresAt);
    const active = data.status === 'active' && expiresAt > new Date();
    return { active, plan: data.plan, expiresAt };
  } catch {
    return { active: false };
  }
}

/* ─────────── Synonym Map ─────────── */
const synonymMap: Record<string, string[]> = {
  // Pain / Headache
  'headache': ['headache', 'migraine', 'pain', 'relief', 'analgesic', 'anti-inflammatory', 'inflammatory'],
  'migraine': ['migraine', 'headache', 'pain', 'relief', 'analgesic'],
  'pain': ['pain', 'ache', 'relief', 'analgesic', 'anti-inflammatory', 'inflammatory', 'headache', 'migraine'],
  
  // Malaria / Fever
  'malaria': ['malaria', 'antimalarial', 'fever', 'parasite', 'plasmodium', 'quinine'],
  'fever': ['fever', 'antipyretic', 'malaria', 'typhoid', 'temperature'],
  
  // Digestion
  'digestion': ['digestion', 'digestive', 'stomach', 'gastric', 'ulcer', 'constipation', 'diarrhea', 'bloating', 'indigestion', 'appetite'],
  'stomach': ['stomach', 'digestion', 'digestive', 'gastric', 'ulcer', 'constipation', 'diarrhea'],
  'constipation': ['constipation', 'digestion', 'laxative', 'bowel', 'stomach'],
  
  // Immune
  'immune': ['immune', 'immunity', 'antiviral', 'antibacterial', 'infection', 'cold', 'flu', 'cough', 'respiratory'],
  'cold': ['cold', 'flu', 'cough', 'respiratory', 'immune', 'congestion', 'sore throat'],
  'cough': ['cough', 'cold', 'flu', 'respiratory', 'congestion', 'bronchitis'],
  
  // Skin
  'skin': ['skin', 'dermatitis', 'eczema', 'acne', 'rash', 'wound', 'burn', 'complexion'],
  'acne': ['acne', 'skin', 'pimple', 'dermatitis', 'complexion'],
  
  // Stress / Sleep
  'stress': ['stress', 'anxiety', 'calm', 'relax', 'sedative', 'insomnia', 'sleep', 'nervous', 'depression'],
  'anxiety': ['anxiety', 'stress', 'calm', 'relax', 'sedative', 'nervous', 'depression'],
  'sleep': ['sleep', 'insomnia', 'sedative', 'calm', 'relax', 'stress', 'anxiety'],
  'insomnia': ['insomnia', 'sleep', 'sedative', 'calm', 'relax'],
  
  // Women's health
  'period': ['period', 'menstrual', 'menstruation', 'cramps', 'pms', 'fertility', 'hormone', 'uterine'],
  'menstrual': ['menstrual', 'period', 'menstruation', 'cramps', 'pms', 'fertility', 'hormone'],
  'fertility': ['fertility', 'conception', 'pregnant', 'pregnancy', 'uterine', 'hormone', 'ovulation'],
  
  // Men's health
  'prostate': ['prostate', 'urinary', 'bph', 'libido', 'testosterone', 'virility'],
  'libido': ['libido', 'aphrodisiac', 'sexual', 'virility', 'testosterone', 'performance'],
  
  // Diabetes / Blood sugar
  'diabetes': ['diabetes', 'sugar', 'glucose', 'insulin', 'hypoglycemic', 'blood sugar'],
  'sugar': ['sugar', 'glucose', 'diabetes', 'hypoglycemic', 'insulin', 'blood sugar'],
  
  // Blood pressure / Heart
  'pressure': ['pressure', 'hypertension', 'blood pressure', 'cardiovascular', 'heart', 'circulation'],
  'heart': ['heart', 'cardiovascular', 'circulation', 'hypertension', 'cholesterol', 'blood pressure'],
  'cholesterol': ['cholesterol', 'heart', 'cardiovascular', 'lipid', 'triglyceride'],
  
  // Liver / Kidney
  'liver': ['liver', 'hepatitis', 'detox', 'jaundice', 'hepatic'],
  'kidney': ['kidney', 'renal', 'urinary', 'diuretic', 'bladder', 'stones'],
  
  // Worms / Parasites
  'worms': ['worms', 'parasite', 'anthelmintic', 'vermifuge', 'intestinal'],
  
  // General wellness
  'energy': ['energy', 'fatigue', 'tired', 'vitality', 'stamina', 'tonic', 'adaptogen'],
  'fatigue': ['fatigue', 'energy', 'tired', 'vitality', 'stamina', 'tonic'],
  
  // Inflammation
  'inflammation': ['inflammation', 'inflammatory', 'anti-inflammatory', 'swelling', 'arthritis', 'rheumatism', 'joint'],
  'arthritis': ['arthritis', 'rheumatism', 'joint', 'inflammation', 'inflammatory', 'anti-inflammatory', 'pain'],
  'joint': ['joint', 'arthritis', 'rheumatism', 'inflammation', 'pain', 'mobility'],
};

/* ─────────── Component ─────────── */
function SearchPageContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { user } = useAuth();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const fileInputRef2 = useRef<HTMLInputElement>(null);
  const initialQuery = searchParams.get('q') || '';

  /* ── State ── */
  const [searchInput, setSearchInput] = useState(initialQuery);
  const [query, setQuery] = useState(initialQuery);
  const [step, setStep] = useState<SearchStep>('input');
  const [searchMode, setSearchMode] = useState<SearchMode>('text');

  const [aiExplanation, setAiExplanation] = useState('');
  const [isFallback, setIsFallback] = useState(false);
  const [explainError, setExplainError] = useState('');

  const [herbs, setHerbs] = useState<Herb[]>([]);
  const [practitioners, setPractitioners] = useState<Practitioner[]>([]);
  const [allHerbs, setAllHerbs] = useState<Herb[]>([]);

  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [identifying, setIdentifying] = useState(false);
  const [plantIdResult, setPlantIdResult] = useState<PlantIdResult | null>(null);
  const [identifyError, setIdentifyError] = useState('');
  const [matchedHerbs, setMatchedHerbs] = useState<Herb[]>([]);

  const [subStatus, setSubStatus] = useState<{ active: boolean; plan?: string }>({ active: false });
  const [checkingSub, setCheckingSub] = useState(false);

  const quickSuggestions = ['Stress relief', 'Digestion', 'Immune boost', 'Skin care', 'Sleep aid', 'Joint pain'];

  /* ── Load all herbs once ── */
  useEffect(() => {
    getDocs(collection(db, 'herbs')).then(snap => {
      setAllHerbs(snap.docs.map(d => ({ id: d.id, ...d.data() } as Herb)));
    });
  }, []);

  /* ── Auto-start if URL has q ── */
  useEffect(() => {
    const q = searchParams.get('q') || '';
    setQuery(q);
    setSearchInput(q);
    if (q.trim()) {
      startTextFlow(q.trim());
    }
  }, [searchParams]);

  /* ── TEXT FLOW ── */
  const startTextFlow = async (q: string) => {
    setQuery(q);
    setStep('explaining');
    setAiExplanation('');
    setHerbs([]);
    setPractitioners([]);
    setPlantIdResult(null);
    setMatchedHerbs([]);

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
        setStep('explained');
      } else {
        throw new Error('No explanation');
      }
    } catch {
      setExplainError('Unable to generate explanation right now.');
      setStep('explained');
    }
  };

  const handleTextSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchInput.trim()) {
      router.push(`/search?q=${encodeURIComponent(searchInput.trim())}`);
    }
  };

  const browseHerbs = async () => {
    setStep('searching-herbs');
    const lowerQuery = query.toLowerCase();
    const terms = lowerQuery.split(/\s+/).filter(t => t.length > 2);

    // Expand search terms with synonyms
    const expandedTerms = new Set<string>();
    terms.forEach(term => {
      expandedTerms.add(term);
      if (synonymMap[term]) {
        synonymMap[term].forEach(syn => expandedTerms.add(syn));
      }
    });
    const searchTerms = Array.from(expandedTerms);

    // SMART MATCHING with scoring
    const scoredHerbs = allHerbs.map(herb => {
      // Parse benefits - handle both string and array formats
      let benefitsList: string[] = [];
      if (Array.isArray(herb.benefits)) {
        benefitsList = herb.benefits;
      } else if (typeof herb.benefits === 'string') {
        benefitsList = herb.benefits.split(/[;|,]/).map((b: string) => b.trim()).filter(Boolean);
      }
      const benefitsText = benefitsList.join(' ').toLowerCase();
      
      // Parse medicinalUses
      const usesText = Array.isArray(herb.medicinalUses) 
        ? herb.medicinalUses.join(' ').toLowerCase()
        : (herb.medicinalUses || '').toLowerCase();
      
      // Build searchable text from all fields
      const nameText = (herb.name || '').toLowerCase();
      const scientificText = (herb.scientificName || '').toLowerCase();
      const descText = (herb.description || '').toLowerCase();
      const categoryText = (herb.category || '').toLowerCase();
      const originText = (herb.origin || '').toLowerCase();
      const partsText = (herb.partsUsed || '').toLowerCase();
      const prepText = (herb.preparation || '').toLowerCase();

      let score = 0;
      let matchedTerms: string[] = [];

      searchTerms.forEach(term => {
        // Exact matches in key fields (highest score)
        if (nameText.includes(term)) { score += 10; matchedTerms.push(term); }
        if (scientificText.includes(term)) { score += 8; matchedTerms.push(term); }
        if (usesText.includes(term)) { score += 7; matchedTerms.push(term); }
        if (benefitsText.includes(term)) { score += 6; matchedTerms.push(term); }
        if (descText.includes(term)) { score += 5; matchedTerms.push(term); }
        if (categoryText.includes(term)) { score += 4; matchedTerms.push(term); }
        if (originText.includes(term)) { score += 2; matchedTerms.push(term); }
        if (partsText.includes(term)) { score += 2; matchedTerms.push(term); }
        if (prepText.includes(term)) { score += 1; matchedTerms.push(term); }
        
        // Also check if any individual benefit contains the term
        benefitsList.forEach((benefit: string) => {
          if (benefit.toLowerCase().includes(term)) {
            score += 3;
            matchedTerms.push(term + '(in:' + benefit + ')');
          }
        });
      });

      return { herb, score, matchedTerms: Array.from(new Set(matchedTerms)) };
    });

    // Filter herbs with any match, sort by score, take top 20
    const matched = scoredHerbs
      .filter(item => item.score > 0)
      .sort((a, b) => b.score - a.score)
      .slice(0, 20)
      .map(item => item.herb);

    setHerbs(matched);
    setStep('herbs');
  };

  const browsePractitioners = async () => {
    setCheckingSub(true);

    if (user) {
      const sub = await checkSubscription(user.uid);
      setSubStatus(sub);
      if (!sub.active) {
        setStep('subscription-required');
        setCheckingSub(false);
        return;
      }
    } else {
      setStep('subscription-required');
      setCheckingSub(false);
      return;
    }

    setStep('searching-practitioners');
    const lowerQuery = query.toLowerCase();
    const terms = lowerQuery.split(/\s+/).filter(t => t.length > 2);

    const snap = await getDocs(collection(db, 'practitioners'));
    const all = snap.docs.map(d => ({ id: d.id, ...d.data() } as Practitioner));
    const matched = all.filter(p => {
      const text = `${p.name || ''} ${p.specialty || ''} ${p.bio || ''} ${p.location || ''}`.toLowerCase();
      return terms.some(t => text.includes(t)) || text.includes(lowerQuery);
    }).slice(0, 4);

    setPractitioners(matched);
    setStep('practitioners');
    setCheckingSub(false);
  };

  /* ── IMAGE FLOW ── */
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      setIdentifyError('Please select a valid image file.');
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      setIdentifyError('Image too large. Max 10MB.');
      return;
    }
    setIdentifyError('');
    setSelectedFile(file);
    setPlantIdResult(null);
    setMatchedHerbs([]);
    const reader = new FileReader();
    reader.onload = ev => setSelectedImage(ev.target?.result as string);
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

      if (data.suggestions?.length && allHerbs.length) {
        const matched: Herb[] = [];
        const seen = new Set<string>();
        for (const s of data.suggestions) {
          const terms = [
            s.name.toLowerCase(),
            s.scientificName.toLowerCase(),
            ...(s.commonNames || []).map((n: string) => n.toLowerCase()),
            s.genus?.toLowerCase(),
            s.family?.toLowerCase(),
          ].filter(Boolean);
          for (const herb of allHerbs) {
            if (seen.has(herb.id)) continue;
            const text = `${herb.name || ''} ${herb.scientificName || ''} ${herb.description || ''} ${(herb.medicinalUses || []).join(' ')}`.toLowerCase();
            if (terms.some(t => t && text.includes(t))) {
              matched.push(herb);
              seen.add(herb.id);
            }
          }
        }
        setMatchedHerbs(matched.slice(0, 6));
      }
    } catch (err: any) {
      setIdentifyError(err.message || 'Identification failed.');
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
    if (fileInputRef2.current) fileInputRef2.current.value = '';
  };

  /* ── RENDER ── */
  return (
    <div className="min-h-screen bg-gradient-to-b from-emerald-50/50 via-stone-50 to-white">
      {/* ── Hero ── */}
      <div className="pt-24 pb-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-3xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-emerald-100 text-emerald-800 text-sm font-medium mb-6">
            <Sparkles className="w-4 h-4" aria-hidden="true" />
            AI-Powered Herbal Search
          </div>
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-stone-800 mb-4">
            {query ? `Searching "${query}"` : 'Find Natural Remedies'}
          </h1>
          <p className="text-stone-500 text-lg mb-8 max-w-xl mx-auto">
            Search symptoms or snap a photo. Our AI explains your condition and guides you to the right remedies.
          </p>

          {/* Mode toggle */}
          <div className="inline-flex p-1 rounded-xl bg-stone-100 mb-6">
            <button
              type="button"
              onClick={() => setSearchMode('text')}
              className={`flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-medium transition-all ${
                searchMode === 'text' ? 'bg-white text-emerald-700 shadow-sm' : 'text-stone-500 hover:text-stone-700'
              }`}
            >
              <Search className="w-4 h-4" aria-hidden="true" />
              Text Search
            </button>
            <button
              type="button"
              onClick={() => setSearchMode('image')}
              className={`flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-medium transition-all ${
                searchMode === 'image' ? 'bg-white text-emerald-700 shadow-sm' : 'text-stone-500 hover:text-stone-700'
              }`}
            >
              <Camera className="w-4 h-4" aria-hidden="true" />
              Identify by Photo
            </button>
          </div>

          {/* ── TEXT INPUT ── */}
          {searchMode === 'text' && (
            <form onSubmit={handleTextSubmit} className="relative max-w-2xl mx-auto">
              <div className="relative">
                <Search className="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 text-emerald-400" aria-hidden="true" />
                <input
                  type="text"
                  value={searchInput}
                  onChange={e => setSearchInput(e.target.value)}
                  placeholder="e.g., headaches, insomnia, digestion..."
                  aria-label="Search symptoms or conditions"
                  className="w-full pl-14 pr-14 py-4 rounded-2xl border-2 border-emerald-100 bg-white text-stone-800 placeholder:text-stone-400 text-lg focus:outline-none focus:border-emerald-400 focus:ring-4 focus:ring-emerald-100 transition-all shadow-sm"
                />
                {searchInput && (
                  <button
                    type="button"
                    onClick={() => { setSearchInput(''); router.push('/search'); }}
                    aria-label="Clear search"
                    title="Clear search"
                    className="absolute right-4 top-1/2 -translate-y-1/2 p-1 rounded-full hover:bg-stone-100 text-stone-400 hover:text-stone-600"
                  >
                    <X className="w-5 h-5" aria-hidden="true" />
                  </button>
                )}
              </div>
              <button
                type="submit"
                disabled={!searchInput.trim() || step === 'explaining'}
                className="mt-4 px-8 py-3 bg-gradient-to-r from-emerald-600 to-teal-700 text-white font-semibold rounded-xl hover:from-emerald-700 hover:to-teal-800 transition-all shadow-md disabled:opacity-50 flex items-center gap-2 mx-auto"
              >
                {step === 'explaining' ? (
                  <><Loader2 className="w-5 h-5 animate-spin" aria-hidden="true" /> Analyzing...</>
                ) : (
                  <><Sparkles className="w-5 h-5" aria-hidden="true" /> Search with AI</>
                )}
              </button>
            </form>
          )}

          {/* ── IMAGE INPUT ── */}
          {searchMode === 'image' && (
            <div className="max-w-2xl mx-auto">
              {!selectedImage ? (
                <>
                  <input ref={fileInputRef} type="file" accept="image/*" onChange={handleFileSelect} className="sr-only" id="plant-upload" />
                  <label htmlFor="plant-upload" className="relative block border-2 border-dashed border-emerald-200 rounded-2xl p-12 cursor-pointer hover:border-emerald-400 hover:bg-emerald-50/30 transition-all group">
                    <div className="flex flex-col items-center gap-4">
                      <div className="w-16 h-16 rounded-full bg-emerald-100 flex items-center justify-center group-hover:bg-emerald-200">
                        <Upload className="w-8 h-8 text-emerald-600" aria-hidden="true" />
                      </div>
                      <div>
                        <p className="text-lg font-semibold text-stone-700">Upload a plant photo</p>
                        <p className="text-sm text-stone-400 mt-1">JPEG, PNG, WebP up to 10MB</p>
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
                      <Image src={selectedImage} alt="Selected plant" fill className="object-cover" />
                    </div>
                    <button onClick={resetImageSearch} aria-label="Remove photo" title="Remove photo" className="absolute -top-2 -right-2 p-1.5 rounded-full bg-red-500 text-white shadow-md hover:bg-red-600">
                      <X className="w-4 h-4" aria-hidden="true" />
                    </button>
                  </div>
                  <div className="flex items-center justify-center gap-3">
                    <input ref={fileInputRef2} type="file" accept="image/*" onChange={handleFileSelect} className="sr-only" id="plant-upload-2" />
                    <label htmlFor="plant-upload-2" className="px-4 py-2 rounded-xl text-sm font-medium text-stone-600 border border-stone-200 hover:bg-stone-50 transition-colors flex items-center gap-2 cursor-pointer">
                      <ImageIcon className="w-4 h-4" aria-hidden="true" /> Change Photo
                    </label>
                    <button onClick={handleIdentify} disabled={identifying} className="px-6 py-2 rounded-xl text-sm font-semibold text-white bg-gradient-to-r from-emerald-600 to-teal-700 hover:from-emerald-700 hover:to-teal-800 transition-all shadow-md disabled:opacity-50 flex items-center gap-2">
                      {identifying ? <><Loader2 className="w-4 h-4 animate-spin" aria-hidden="true" /> Identifying...</> : <><Scan className="w-4 h-4" aria-hidden="true" /> Identify Plant</>}
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

          {/* Quick suggestions */}
          {searchMode === 'text' && step === 'input' && (
            <div className="mt-8 flex flex-wrap justify-center gap-2">
              {quickSuggestions.map(s => (
                <button key={s} onClick={() => { setSearchInput(s); router.push(`/search?q=${encodeURIComponent(s)}`); }} className="px-4 py-2 rounded-full bg-white border border-emerald-100 text-sm text-emerald-700 hover:bg-emerald-50 hover:border-emerald-300 transition-colors shadow-sm">
                  {s}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* ── RESULTS AREA ── */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 pb-20">
        {/* STEP: Explaining */}
        {step === 'explaining' && (
          <div className="text-center py-12">
            <Loader2 className="w-10 h-10 animate-spin text-emerald-600 mx-auto" aria-hidden="true" />
            <p className="mt-4 text-stone-600 font-medium">Our AI is analyzing "{query}"...</p>
            <p className="text-stone-400 text-sm mt-1">This may take a few seconds</p>
          </div>
        )}

        {/* STEP: Explained → AI Analysis Card */}
        {(step === 'explained' || step === 'searching-herbs' || step === 'herbs' || step === 'searching-practitioners' || step === 'practitioners' || step === 'subscription-required') && (
          <div className="space-y-8">
            {/* AI Explanation */}
            <div className="relative p-6 sm:p-8 rounded-2xl bg-gradient-to-br from-emerald-50 to-teal-50 border border-emerald-100 shadow-sm">
              <div className="absolute -top-3 left-6">
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-600 text-white text-xs font-semibold shadow-sm">
                  <Sparkles className="w-3 h-3" aria-hidden="true" />
                  AI Analysis
                </div>
              </div>
              {isFallback && (
                <div className="absolute -top-3 right-6">
                  <div className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-amber-100 text-amber-700 text-xs font-medium">
                    <Info className="w-3 h-3" aria-hidden="true" />
                    Offline Mode
                  </div>
                </div>
              )}
              <div className="mt-2">
                <h2 className="text-xl font-bold text-stone-800 mb-3">Understanding "{query}"</h2>
                <div className="text-stone-700 leading-relaxed whitespace-pre-line">
                  {aiExplanation}
                </div>
              </div>
              {explainError && (
                <p className="mt-3 text-sm text-red-600">{explainError}</p>
              )}

              {/* CTA: Browse Herbs */}
              <div className="mt-6 pt-6 border-t border-emerald-100">
                <button
                  onClick={browseHerbs}
                  disabled={step === 'searching-herbs'}
                  className="w-full sm:w-auto px-6 py-3 bg-white border-2 border-emerald-200 text-emerald-800 font-semibold rounded-xl hover:bg-emerald-50 hover:border-emerald-300 transition-all shadow-sm flex items-center justify-center gap-2"
                >
                  {step === 'searching-herbs' ? (
                    <><Loader2 className="w-4 h-4 animate-spin" aria-hidden="true" /> Searching remedies...</>
                  ) : (
                    <><Leaf className="w-5 h-5" aria-hidden="true" /> Browse herbal remedies for "{query}"</>
                  )}
                </button>
              </div>
            </div>

            {/* STEP: Herbs */}
            {(step === 'herbs' || step === 'searching-practitioners' || step === 'practitioners' || step === 'subscription-required') && (
              <div>
                {herbs.length > 0 ? (
                  <>
                    <div className="flex items-center justify-between mb-6">
                      <h2 className="text-2xl font-bold text-stone-800 flex items-center gap-2">
                        <Leaf className="w-6 h-6 text-emerald-600" aria-hidden="true" />
                        Herbal Remedies for "{query}"
                        <span className="text-sm font-normal text-stone-400 ml-2">({herbs.length} found)</span>
                      </h2>
                      <Link href="/herbs" className="text-sm font-medium text-emerald-700 hover:text-emerald-800 flex items-center gap-1">
                        View all <ArrowRight className="w-4 h-4" aria-hidden="true" />
                      </Link>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                      {herbs.map(herb => (
                        <Link key={herb.id} href={`/herb/${herb.slug || herb.id}`} className="group bg-white rounded-2xl border border-stone-100 overflow-hidden hover:shadow-lg hover:border-emerald-200 transition-all duration-300">
                          <div className="relative h-48 overflow-hidden bg-stone-100">
                            {herb.imageUrl ? (
                              <Image src={herb.imageUrl} alt={herb.name} fill className="object-cover group-hover:scale-105 transition-transform duration-500" />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-emerald-50 to-teal-50">
                                <Leaf className="w-12 h-12 text-emerald-200" aria-hidden="true" />
                              </div>
                            )}
                          </div>
                          <div className="p-5">
                            <h3 className="font-bold text-stone-800 group-hover:text-emerald-700 transition-colors">{herb.name}</h3>
                            {herb.scientificName && <p className="text-xs text-stone-400 italic">{herb.scientificName}</p>}
                            {herb.category && <span className="inline-block mt-1 px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-700 text-xs font-medium">{herb.category}</span>}
                            <p className="text-sm text-stone-500 line-clamp-2 mt-2">{herb.description || 'Traditional African herbal remedy.'}</p>
                            {herb.medicinalUses && herb.medicinalUses.length > 0 && (
                              <div className="flex flex-wrap gap-1 mt-3">
                                {herb.medicinalUses.slice(0, 2).map((use, i) => (
                                  <span key={i} className="px-2 py-1 rounded-full bg-stone-50 text-stone-600 text-xs">{use}</span>
                                ))}
                              </div>
                            )}
                          </div>
                        </Link>
                      ))}
                    </div>
                  </>
                ) : (
                  <div className="text-center py-10 bg-white rounded-2xl border border-stone-100">
                    <Beaker className="w-12 h-12 text-stone-300 mx-auto mb-3" aria-hidden="true" />
                    <h3 className="text-lg font-bold text-stone-700">No herbal remedies found</h3>
                    <p className="text-stone-500 text-sm mt-1 max-w-md mx-auto">We couldn't find specific herbs for "{query}" in our database. Try a different search term.</p>
                  </div>
                )}

                {/* CTA: Consult Practitioner */}
                <div className="mt-8 text-center">
                  <button
                    onClick={browsePractitioners}
                    disabled={checkingSub || step === 'searching-practitioners'}
                    className="px-8 py-3 bg-gradient-to-r from-teal-600 to-emerald-700 text-white font-semibold rounded-xl hover:from-teal-700 hover:to-emerald-800 transition-all shadow-md disabled:opacity-50 flex items-center gap-2 mx-auto"
                  >
                    {checkingSub || step === 'searching-practitioners' ? (
                      <><Loader2 className="w-5 h-5 animate-spin" aria-hidden="true" /> Checking access...</>
                    ) : (
                      <><Stethoscope className="w-5 h-5" aria-hidden="true" /> Consult a Practitioner</>
                    )}
                  </button>
                  <p className="text-xs text-stone-400 mt-2 flex items-center justify-center gap-1">
                    <Lock className="w-3 h-3" aria-hidden="true" />
                    Subscription required for practitioner access
                  </p>
                </div>
              </div>
            )}

            {/* STEP: Subscription Required */}
            {step === 'subscription-required' && (
              <div className="max-w-lg mx-auto text-center py-12 px-6 bg-white rounded-2xl border border-amber-200 shadow-sm">
                <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-amber-50 flex items-center justify-center">
                  <Crown className="w-8 h-8 text-amber-500" aria-hidden="true" />
                </div>
                <h3 className="text-xl font-bold text-stone-800 mb-2">Unlock Practitioner Access</h3>
                <p className="text-stone-500 mb-6">
                  Consulting with verified practitioners requires an active subscription. Upgrade to get personalized herbal guidance from experts.
                </p>
                <div className="space-y-3">
                  <Link href="/subscription" className="block w-full px-6 py-3 bg-gradient-to-r from-amber-500 to-orange-600 text-white rounded-xl font-semibold hover:from-amber-600 hover:to-orange-700 transition-all shadow-sm">
                    <Zap className="w-5 h-5 inline mr-2" aria-hidden="true" />
                    Upgrade Now
                  </Link>
                  {!user && (
                    <Link href="/login" className="block w-full px-6 py-3 border border-stone-200 text-stone-600 rounded-xl font-medium hover:bg-stone-50 transition-colors">
                      Log In to Continue
                    </Link>
                  )}
                  <button onClick={() => setStep('herbs')} className="text-sm text-stone-400 hover:text-stone-600 transition-colors">
                    ← Back to remedies
                  </button>
                </div>
              </div>
            )}

            {/* STEP: Practitioners */}
            {step === 'practitioners' && (
              <div>
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-2xl font-bold text-stone-800 flex items-center gap-2">
                    <Stethoscope className="w-6 h-6 text-teal-600" aria-hidden="true" />
                    Recommended Practitioners
                    <span className="text-sm font-normal text-stone-400 ml-2">({practitioners.length} available)</span>
                  </h2>
                </div>
                {practitioners.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {practitioners.map(p => (
                      <Link key={p.id} href={`/consultation/${p.id}`} className="group flex gap-4 p-5 rounded-2xl bg-white border border-stone-100 hover:shadow-md hover:border-teal-200 transition-all">
                        <div className="relative w-20 h-20 rounded-xl overflow-hidden shrink-0 bg-stone-100">
                          {p.photoURL ? (
                            <Image src={p.photoURL} alt={p.name} fill className="object-cover" />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-teal-50 to-emerald-50">
                              <User className="w-8 h-8 text-teal-300" aria-hidden="true" />
                            </div>
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between">
                            <div>
                              <h3 className="font-bold text-stone-800 group-hover:text-teal-700 transition-colors">{p.name}</h3>
                              {p.specialty && <p className="text-sm text-teal-600 font-medium">{p.specialty}</p>}
                            </div>
                            {p.isVerified && (
                              <div className="px-2 py-1 rounded-full bg-amber-50 text-amber-700 text-xs font-semibold flex items-center gap-1">
                                <Star className="w-3 h-3 fill-amber-500 text-amber-500" aria-hidden="true" />
                                Verified
                              </div>
                            )}
                          </div>
                          {p.location && <div className="flex items-center gap-1 mt-1 text-xs text-stone-500"><MapPin className="w-3 h-3" aria-hidden="true" /> {p.location}</div>}
                          {p.bio && <p className="text-sm text-stone-500 mt-2 line-clamp-2">{p.bio}</p>}
                          <div className="flex items-center justify-between mt-3">
                            {p.rating && <div className="flex items-center gap-1"><Star className="w-4 h-4 fill-amber-400 text-amber-400" aria-hidden="true" /><span className="text-sm font-semibold text-stone-700">{p.rating}</span></div>}
                            {p.consultationFee && <span className="text-sm font-semibold text-emerald-700">${p.consultationFee}/session</span>}
                          </div>
                          <div className="mt-3 flex items-center gap-1 text-sm font-medium text-teal-700">
                            Book consultation <ChevronRight className="w-4 h-4" aria-hidden="true" />
                          </div>
                        </div>
                      </Link>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-10 bg-white rounded-2xl border border-stone-100">
                    <MessageCircle className="w-12 h-12 text-stone-300 mx-auto mb-3" aria-hidden="true" />
                    <h3 className="text-lg font-bold text-stone-700">No practitioners found</h3>
                    <p className="text-stone-500 text-sm mt-1">Try a broader search term or browse all practitioners.</p>
                    <Link href="/practitioners" className="inline-flex items-center gap-2 mt-4 px-6 py-2 bg-emerald-50 text-emerald-700 rounded-lg font-medium hover:bg-emerald-100 transition-colors">
                      <Stethoscope className="w-4 h-4" aria-hidden="true" /> Browse All
                    </Link>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* ── IMAGE SEARCH RESULTS ── */}
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
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {plantIdResult.suggestions.map((s, i) => (
                <div key={i} className={`bg-white rounded-2xl border overflow-hidden transition-all ${i === 0 ? 'border-emerald-300 shadow-lg ring-2 ring-emerald-100' : 'border-stone-100 hover:shadow-md hover:border-emerald-200'}`}>
                  <div className="relative">
                    {s.similarImages.length > 0 ? (
                      <div className="relative h-48 overflow-hidden bg-stone-100">
                        <Image src={s.similarImages[0]} alt={s.name} fill className="object-cover" />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />
                      </div>
                    ) : (
                      <div className="h-48 flex items-center justify-center bg-gradient-to-br from-emerald-50 to-teal-50">
                        <Leaf className="w-16 h-16 text-emerald-200" aria-hidden="true" />
                      </div>
                    )}
                    <div className="absolute top-3 left-3">
                      <div className={`px-3 py-1 rounded-full text-xs font-bold shadow-sm ${s.probability >= 70 ? 'bg-emerald-500 text-white' : s.probability >= 40 ? 'bg-amber-400 text-white' : 'bg-stone-400 text-white'}`}>
                        {s.probability}% match
                      </div>
                    </div>
                    {i === 0 && (
                      <div className="absolute top-3 right-3">
                        <div className="px-3 py-1 rounded-full bg-white/90 backdrop-blur-sm text-emerald-700 text-xs font-bold shadow-sm flex items-center gap-1">
                          <CheckCircle2 className="w-3 h-3" aria-hidden="true" /> Best Match
                        </div>
                      </div>
                    )}
                  </div>
                  <div className="p-5">
                    <h3 className="text-lg font-bold text-stone-800">{s.name}</h3>
                    <p className="text-sm text-stone-500 italic mb-2">{s.scientificName}</p>
                    {(s.family || s.genus) && (
                      <div className="flex flex-wrap gap-2 mb-3">
                        {s.family && <span className="px-2 py-1 rounded-md bg-stone-50 text-stone-600 text-xs">Family: {s.family}</span>}
                        {s.genus && <span className="px-2 py-1 rounded-md bg-stone-50 text-stone-600 text-xs">Genus: {s.genus}</span>}
                      </div>
                    )}
                    {s.commonNames.length > 0 && (
                      <div className="mb-3">
                        <p className="text-xs text-stone-400 font-medium mb-1">Also known as:</p>
                        <div className="flex flex-wrap gap-1">
                          {s.commonNames.slice(0, 4).map((n, j) => (
                            <span key={j} className="px-2 py-1 rounded-full bg-emerald-50 text-emerald-700 text-xs">{n}</span>
                          ))}
                        </div>
                      </div>
                    )}
                    {s.wikiDescription && <p className="text-sm text-stone-500 line-clamp-3 mb-3">{s.wikiDescription}</p>}
                    {s.wikiUrl && (
                      <a href={s.wikiUrl} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-sm text-emerald-700 hover:text-emerald-800 font-medium">
                        Learn more <ArrowRight className="w-3.5 h-3.5" aria-hidden="true" />
                      </a>
                    )}
                  </div>
                </div>
              ))}
            </div>

            {matchedHerbs.length > 0 && (
              <div>
                <h2 className="text-2xl font-bold text-stone-800 flex items-center gap-2 mb-6">
                  <Leaf className="w-6 h-6 text-emerald-600" aria-hidden="true" />
                  Found in RemedyAfrica Database
                  <span className="text-sm font-normal text-stone-400 ml-2">({matchedHerbs.length} match{matchedHerbs.length !== 1 ? 'es' : ''})</span>
                </h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                  {matchedHerbs.map(herb => (
                    <Link key={herb.id} href={`/herb/${herb.slug || herb.id}`} className="group bg-white rounded-2xl border border-stone-100 overflow-hidden hover:shadow-lg hover:border-emerald-200 transition-all duration-300">
                      <div className="relative h-48 overflow-hidden bg-stone-100">
                        {herb.imageUrl ? (
                          <Image src={herb.imageUrl} alt={herb.name} fill className="object-cover group-hover:scale-105 transition-transform duration-500" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-emerald-50 to-teal-50">
                            <Leaf className="w-12 h-12 text-emerald-200" aria-hidden="true" />
                          </div>
                        )}
                      </div>
                      <div className="p-5">
                        <h3 className="font-bold text-stone-800 group-hover:text-emerald-700 transition-colors">{herb.name}</h3>
                        {herb.scientificName && <p className="text-xs text-stone-400 italic">{herb.scientificName}</p>}
                        {herb.category && <span className="inline-block mt-1 px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-700 text-xs font-medium">{herb.category}</span>}
                        <p className="text-sm text-stone-500 line-clamp-2 mt-2">{herb.description || 'Traditional African herbal remedy.'}</p>
                      </div>
                    </Link>
                  ))}
                </div>
              </div>
            )}

            {matchedHerbs.length === 0 && plantIdResult.suggestions.length > 0 && (
              <div className="max-w-2xl mx-auto text-center py-10">
                <Info className="w-8 h-8 text-amber-500 mx-auto mb-3" aria-hidden="true" />
                <h3 className="text-lg font-bold text-stone-700 mb-2">Not yet in our database</h3>
                <p className="text-stone-500 mb-4">This plant hasn't been added yet. Browse practitioners who may know more.</p>
                <Link href="/practitioners" className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-teal-600 to-emerald-700 text-white rounded-xl font-semibold hover:from-teal-700 hover:to-emerald-800 transition-all shadow-sm">
                  <Stethoscope className="w-5 h-5" aria-hidden="true" /> Find a Practitioner
                </Link>
              </div>
            )}

            <div className="text-center pt-6">
              <button onClick={resetImageSearch} className="inline-flex items-center gap-2 px-6 py-3 rounded-xl text-sm font-medium text-stone-600 border border-stone-200 hover:bg-stone-50 transition-colors">
                <RefreshCw className="w-4 h-4" aria-hidden="true" /> Identify Another Plant
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