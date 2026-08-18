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
  MessageCircle,
  Thermometer,
  Activity,
  Shield,
  Droplets,
  Wind,
  Brain,
  Moon,
  Sun,
  Pill,
  FlaskConical,
  ArrowUpRight,
  Clock,
  BookOpen,
  ChevronDown,
  ChevronUp,
  Bookmark,
  Share2,
  ExternalLink
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
  warnings?: string;
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
  'headache': ['headache', 'migraine', 'pain', 'relief', 'analgesic', 'anti-inflammatory', 'inflammatory'],
  'migraine': ['migraine', 'headache', 'pain', 'relief', 'analgesic'],
  'pain': ['pain', 'ache', 'relief', 'analgesic', 'anti-inflammatory', 'inflammatory', 'headache', 'migraine'],
  'malaria': ['malaria', 'antimalarial', 'fever', 'parasite', 'plasmodium', 'quinine'],
  'fever': ['fever', 'antipyretic', 'malaria', 'typhoid', 'temperature'],
  'digestion': ['digestion', 'digestive', 'stomach', 'gastric', 'ulcer', 'constipation', 'diarrhea', 'bloating', 'indigestion', 'appetite'],
  'stomach': ['stomach', 'digestion', 'digestive', 'gastric', 'ulcer', 'constipation', 'diarrhea'],
  'constipation': ['constipation', 'digestion', 'laxative', 'bowel', 'stomach'],
  'immune': ['immune', 'immunity', 'antiviral', 'antibacterial', 'infection', 'cold', 'flu', 'cough', 'respiratory'],
  'cold': ['cold', 'flu', 'cough', 'respiratory', 'immune', 'congestion', 'sore throat'],
  'cough': ['cough', 'cold', 'flu', 'respiratory', 'congestion', 'bronchitis'],
  'skin': ['skin', 'dermatitis', 'eczema', 'acne', 'rash', 'wound', 'burn', 'complexion'],
  'acne': ['acne', 'skin', 'pimple', 'dermatitis', 'complexion'],
  'stress': ['stress', 'anxiety', 'calm', 'relax', 'sedative', 'insomnia', 'sleep', 'nervous', 'depression'],
  'anxiety': ['anxiety', 'stress', 'calm', 'relax', 'sedative', 'nervous', 'depression'],
  'sleep': ['sleep', 'insomnia', 'sedative', 'calm', 'relax', 'stress', 'anxiety'],
  'insomnia': ['insomnia', 'sleep', 'sedative', 'calm', 'relax'],
  'period': ['period', 'menstrual', 'menstruation', 'cramps', 'pms', 'fertility', 'hormone', 'uterine'],
  'menstrual': ['menstrual', 'period', 'menstruation', 'cramps', 'pms', 'fertility', 'hormone'],
  'fertility': ['fertility', 'conception', 'pregnant', 'pregnancy', 'uterine', 'hormone', 'ovulation'],
  'prostate': ['prostate', 'urinary', 'bph', 'libido', 'testosterone', 'virility'],
  'libido': ['libido', 'aphrodisiac', 'sexual', 'virility', 'testosterone', 'performance'],
  'diabetes': ['diabetes', 'sugar', 'glucose', 'insulin', 'hypoglycemic', 'blood sugar'],
  'sugar': ['sugar', 'glucose', 'diabetes', 'hypoglycemic', 'insulin', 'blood sugar'],
  'pressure': ['pressure', 'hypertension', 'blood pressure', 'cardiovascular', 'heart', 'circulation'],
  'heart': ['heart', 'cardiovascular', 'circulation', 'hypertension', 'cholesterol', 'blood pressure'],
  'cholesterol': ['cholesterol', 'heart', 'cardiovascular', 'lipid', 'triglyceride'],
  'liver': ['liver', 'hepatitis', 'detox', 'jaundice', 'hepatic'],
  'kidney': ['kidney', 'renal', 'urinary', 'diuretic', 'bladder', 'stones'],
  'worms': ['worms', 'parasite', 'anthelmintic', 'vermifuge', 'intestinal'],
  'energy': ['energy', 'fatigue', 'tired', 'vitality', 'stamina', 'tonic', 'adaptogen'],
  'fatigue': ['fatigue', 'energy', 'tired', 'vitality', 'stamina', 'tonic'],
  'inflammation': ['inflammation', 'inflammatory', 'anti-inflammatory', 'swelling', 'arthritis', 'rheumatism', 'joint'],
  'arthritis': ['arthritis', 'rheumatism', 'joint', 'inflammation', 'inflammatory', 'anti-inflammatory', 'pain'],
  'joint': ['joint', 'arthritis', 'rheumatism', 'inflammation', 'pain', 'mobility'],
};

/* ─────────── Condition Icons ─────────── */
function getConditionIcon(query: string) {
  const q = query.toLowerCase();
  if (q.includes('head') || q.includes('migrain') || q.includes('pain')) return <Brain className="w-6 h-6" />;
  if (q.includes('cold') || q.includes('flu') || q.includes('cough') || q.includes('fever')) return <Thermometer className="w-6 h-6" />;
  if (q.includes('skin') || q.includes('acne') || q.includes('rash')) return <Sun className="w-6 h-6" />;
  if (q.includes('stress') || q.includes('anxiety') || q.includes('sleep') || q.includes('insomnia')) return <Moon className="w-6 h-6" />;
  if (q.includes('heart') || q.includes('pressure') || q.includes('blood')) return <Activity className="w-6 h-6" />;
  if (q.includes('digest') || q.includes('stomach') || q.includes('liver')) return <FlaskConical className="w-6 h-6" />;
  if (q.includes('immune') || q.includes('infection')) return <Shield className="w-6 h-6" />;
  if (q.includes('diabetes') || q.includes('sugar')) return <Droplets className="w-6 h-6" />;
  return <Wind className="w-6 h-6" />;
}

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
  const [expandedAi, setExpandedAi] = useState(false);

  const quickSuggestions = [
    { label: 'Headache relief', icon: Brain },
    { label: 'Immune boost', icon: Shield },
    { label: 'Digestive health', icon: FlaskConical },
    { label: 'Better sleep', icon: Moon },
    { label: 'Skin care', icon: Sun },
    { label: 'Joint pain', icon: Activity },
  ];

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
    setExpandedAi(false);

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

    const expandedTerms = new Set<string>();
    terms.forEach(term => {
      expandedTerms.add(term);
      if (synonymMap[term]) {
        synonymMap[term].forEach(syn => expandedTerms.add(syn));
      }
    });
    const searchTerms = Array.from(expandedTerms);

    const scoredHerbs = allHerbs.map(herb => {
      let benefitsList: string[] = [];
      if (Array.isArray(herb.benefits)) {
        benefitsList = herb.benefits;
      } else if (typeof herb.benefits === 'string') {
        benefitsList = herb.benefits.split(/[;|,]/).map((b: string) => b.trim()).filter(Boolean);
      }
      const benefitsText = benefitsList.join(' ').toLowerCase();
      
      const usesText = Array.isArray(herb.medicinalUses) 
        ? herb.medicinalUses.join(' ').toLowerCase()
        : (herb.medicinalUses || '').toLowerCase();
      
      const nameText = (herb.name || '').toLowerCase();
      const scientificText = (herb.scientificName || '').toLowerCase();
      const descText = (herb.description || '').toLowerCase();
      const categoryText = (herb.category || '').toLowerCase();
      const originText = (herb.origin || '').toLowerCase();
      const partsText = (herb.partsUsed || '').toLowerCase();
      const prepText = (herb.preparation || '').toLowerCase();

      let score = 0;
      const matchedTerms: string[] = [];

      searchTerms.forEach(term => {
        if (nameText.includes(term)) { score += 10; matchedTerms.push(term); }
        if (scientificText.includes(term)) { score += 8; matchedTerms.push(term); }
        if (usesText.includes(term)) { score += 7; matchedTerms.push(term); }
        if (benefitsText.includes(term)) { score += 6; matchedTerms.push(term); }
        if (descText.includes(term)) { score += 5; matchedTerms.push(term); }
        if (categoryText.includes(term)) { score += 4; matchedTerms.push(term); }
        if (originText.includes(term)) { score += 2; matchedTerms.push(term); }
        if (partsText.includes(term)) { score += 2; matchedTerms.push(term); }
        if (prepText.includes(term)) { score += 1; matchedTerms.push(term); }
        
        benefitsList.forEach((benefit: string) => {
          if (benefit.toLowerCase().includes(term)) {
            score += 3;
            matchedTerms.push(term + '(in:' + benefit + ')');
          }
        });
      });

      return { herb, score, matchedTerms: Array.from(new Set(matchedTerms)) };
    });

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
    <div className="min-h-screen bg-cream">
      {/* ── Hero ── */}
      <div className="relative bg-white border-b border-forest/10">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-cream via-white to-white" />
        <div className="relative pt-20 pb-16 px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl mx-auto text-center">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-cream border border-forest/10 text-forest text-xs font-semibold tracking-wide uppercase mb-6">
              <Sparkles className="w-3.5 h-3.5" aria-hidden="true" />
              AI-Powered Herbal Intelligence
            </div>
            <h1 className="font-serif text-4xl sm:text-5xl text-forest tracking-tight mb-4">
              {query ? (
                <span className="flex items-center justify-center gap-3 flex-wrap">
                  {getConditionIcon(query)}
                  <span>{query}</span>
                </span>
              ) : (
                'Find Natural Remedies'
              )}
            </h1>
            <p className="text-ink-muted text-lg mb-10 max-w-lg mx-auto leading-relaxed">
              Search symptoms or snap a photo. Our AI analyzes your condition and matches you with evidence-based herbal remedies.
            </p>

            {/* Mode toggle */}
            <div className="inline-flex p-1 rounded-2xl bg-cream-dark border border-forest/10 mb-8">
              <button
                type="button"
                onClick={() => setSearchMode('text')}
                className={`flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-semibold transition-all ${
                  searchMode === 'text' 
                    ? 'bg-white text-forest shadow-sm border border-forest/10' 
                    : 'text-ink-muted hover:text-slate-700'
                }`}
              >
                <Search className="w-4 h-4" aria-hidden="true" />
                Text Search
              </button>
              <button
                type="button"
                onClick={() => setSearchMode('image')}
                className={`flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-semibold transition-all ${
                  searchMode === 'image' 
                    ? 'bg-white text-forest shadow-sm border border-forest/10' 
                    : 'text-ink-muted hover:text-slate-700'
                }`}
              >
                <Camera className="w-4 h-4" aria-hidden="true" />
                Identify by Photo
              </button>
            </div>

            {/* ── TEXT INPUT ── */}
            {searchMode === 'text' && (
              <form onSubmit={handleTextSubmit} className="relative max-w-2xl mx-auto">
                <div className="relative group">
                  <Search className="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 text-ink-muted/70 group-focus-within:text-emerald-500 transition-colors" aria-hidden="true" />
                  <input
                    type="text"
                    value={searchInput}
                    onChange={e => setSearchInput(e.target.value)}
                    placeholder="e.g., headaches, insomnia, digestion..."
                    aria-label="Search symptoms or conditions"
                    className="w-full pl-14 pr-14 py-4 rounded-2xl border-2 border-forest/10 bg-white text-forest placeholder:text-ink-muted/70 text-lg focus:outline-none focus:border-emerald-400 focus:ring-4 focus:ring-emerald-50 transition-all shadow-sm"
                  />
                  {searchInput && (
                    <button
                      type="button"
                      onClick={() => { setSearchInput(''); router.push('/search'); }}
                      aria-label="Clear search"
                      className="absolute right-4 top-1/2 -translate-y-1/2 p-1.5 rounded-full hover:bg-cream-dark text-ink-muted/70 hover:text-ink-muted transition-colors"
                    >
                      <X className="w-5 h-5" aria-hidden="true" />
                    </button>
                  )}
                </div>
                <button
                  type="submit"
                  disabled={!searchInput.trim() || step === 'explaining'}
                  className="mt-5 px-8 py-3.5 bg-forest text-white font-semibold rounded-2xl hover:bg-forest-mist active:bg-forest-deep transition-all shadow-lg shadow-forest/20 disabled:opacity-40 disabled:shadow-none flex items-center gap-2.5 mx-auto"
                >
                  {step === 'explaining' ? (
                    <><Loader2 className="w-5 h-5 animate-spin" aria-hidden="true" /> Analyzing...</>
                  ) : (
                    <><Sparkles className="w-5 h-5" aria-hidden="true" /> Analyze with AI</>
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
                    <label htmlFor="plant-upload" className="relative block border-2 border-dashed border-forest/20 rounded-2xl p-14 cursor-pointer hover:border-bronze hover:bg-cream/20 transition-all group">
                      <div className="flex flex-col items-center gap-5">
                        <div className="w-16 h-16 rounded-2xl bg-cream border border-forest/10 flex items-center justify-center group-hover:bg-cream-dark transition-colors">
                          <Upload className="w-7 h-7 text-forest" aria-hidden="true" />
                        </div>
                        <div>
                          <p className="text-lg font-semibold text-slate-800">Upload a plant photo</p>
                          <p className="text-sm text-ink-muted/70 mt-1">JPEG, PNG, WebP up to 10MB</p>
                        </div>
                        <div className="flex items-center gap-2 text-xs text-ink-muted/70 font-medium">
                          <Scan className="w-3.5 h-3.5" aria-hidden="true" />
                          Powered by Plant.id AI
                        </div>
                      </div>
                    </label>
                  </>
                ) : (
                  <div className="space-y-5">
                    <div className="relative inline-block">
                      <div className="relative w-64 h-64 mx-auto rounded-2xl overflow-hidden border-2 border-forest/10 shadow-md">
                        <Image src={selectedImage} alt="Selected plant" fill className="object-cover" />
                      </div>
                      <button onClick={resetImageSearch} aria-label="Remove photo" className="absolute -top-2 -right-2 p-1.5 rounded-full bg-forest text-white shadow-lg hover:bg-forest-mist transition-colors">
                        <X className="w-4 h-4" aria-hidden="true" />
                      </button>
                    </div>
                    <div className="flex items-center justify-center gap-3">
                      <input ref={fileInputRef2} type="file" accept="image/*" onChange={handleFileSelect} className="sr-only" id="plant-upload-2" />
                      <label htmlFor="plant-upload-2" className="px-5 py-2.5 rounded-2xl text-sm font-semibold text-ink-muted border border-forest/10 hover:bg-cream transition-colors flex items-center gap-2 cursor-pointer">
                        <ImageIcon className="w-4 h-4" aria-hidden="true" /> Change Photo
                      </label>
                      <button onClick={handleIdentify} disabled={identifying} className="px-6 py-2.5 rounded-2xl text-sm font-semibold text-white bg-forest hover:bg-forest-mist transition-all shadow-md disabled:opacity-40 flex items-center gap-2">
                        {identifying ? <><Loader2 className="w-4 h-4 animate-spin" aria-hidden="true" /> Identifying...</> : <><Scan className="w-4 h-4" aria-hidden="true" /> Identify Plant</>}
                      </button>
                    </div>
                  </div>
                )}
                {identifyError && (
                  <div className="mt-4 p-4 rounded-2xl bg-red-50 border border-red-100 flex items-start gap-3 max-w-md mx-auto" role="alert">
                    <AlertCircle className="w-5 h-5 text-red-500 shrink-0 mt-0.5" aria-hidden="true" />
                    <p className="text-red-700 text-sm">{identifyError}</p>
                  </div>
                )}
              </div>
            )}

            {/* Quick suggestions */}
            {searchMode === 'text' && step === 'input' && (
              <div className="mt-10 flex flex-wrap justify-center gap-2.5">
                {quickSuggestions.map(({ label, icon: Icon }) => (
                  <button 
                    key={label} 
                    onClick={() => { setSearchInput(label); router.push(`/search?q=${encodeURIComponent(label)}`); }} 
                    className="inline-flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-white border border-forest/10 text-sm text-ink-muted hover:text-forest hover:border-forest/20 hover:bg-cream/50 transition-all shadow-sm"
                  >
                    <Icon className="w-4 h-4" aria-hidden="true" />
                    {label}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ── RESULTS AREA ── */}
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-12 pb-24">
        {/* STEP: Explaining */}
        {step === 'explaining' && (
          <div className="text-center py-20">
            <div className="relative w-16 h-16 mx-auto mb-6">
              <div className="absolute inset-0 rounded-full bg-cream-dark animate-ping opacity-20" />
              <div className="relative w-16 h-16 rounded-full bg-cream border border-forest/10 flex items-center justify-center">
                <Loader2 className="w-7 h-7 animate-spin text-forest" aria-hidden="true" />
              </div>
            </div>
            <p className="text-slate-700 font-semibold text-lg">Analyzing "{query}"...</p>
            <p className="text-ink-muted/70 text-sm mt-2">Consulting our herbal knowledge base</p>
          </div>
        )}

        {/* STEP: Explained → AI Analysis Card */}
        {(step === 'explained' || step === 'searching-herbs' || step === 'herbs' || step === 'searching-practitioners' || step === 'practitioners' || step === 'subscription-required') && (
          <div className="space-y-10">
            {/* AI Explanation — Premium Card */}
            <div className="relative overflow-hidden rounded-2xl bg-white border border-forest/10 shadow-sm">
              {/* Header bar */}
              <div className="flex items-center justify-between px-6 py-4 border-b border-forest/10 bg-cream/50">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-cream border border-forest/10 flex items-center justify-center">
                    <Sparkles className="w-5 h-5 text-forest" aria-hidden="true" />
                  </div>
                  <div>
                    <h2 className="text-sm font-bold text-forest uppercase tracking-wider">AI Analysis</h2>
                    <p className="text-xs text-ink-muted/70">Evidence-based herbal guidance</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {isFallback && (
                    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-amber-50 border border-amber-100 text-amber-700 text-xs font-semibold">
                      <Info className="w-3 h-3" aria-hidden="true" />
                      Offline
                    </span>
                  )}
                  <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-cream border border-forest/10 text-forest text-xs font-semibold">
                    <CheckCircle2 className="w-3 h-3" aria-hidden="true" />
                    Verified
                  </span>
                </div>
              </div>

              {/* Content */}
              <div className="p-6 sm:p-8">
                <h3 className="text-xl font-bold text-forest mb-4 flex items-center gap-2">
                  {getConditionIcon(query)}
                  Understanding {query}
                </h3>
                
                <div className={`text-ink-muted leading-[1.8] text-[15px] ${!expandedAi && aiExplanation.length > 400 ? 'line-clamp-6' : ''}`}>
                  {aiExplanation ? (
                    <div className="prose prose-slate max-w-none">
                      {aiExplanation.split('\n').map((paragraph, i) => (
                        paragraph.trim() ? (
                          <p key={i} className="mb-4 last:mb-0">
                            {paragraph.replace(/\*\*/g, '').replace(/^\d+\.\s*/, '').trim()}
                          </p>
                        ) : null
                      ))}
                    </div>
                  ) : (
                    <div className="animate-pulse space-y-3">
                      <div className="h-4 bg-cream-dark rounded w-3/4" />
                      <div className="h-4 bg-cream-dark rounded w-full" />
                      <div className="h-4 bg-cream-dark rounded w-5/6" />
                    </div>
                  )}
                </div>

                {aiExplanation.length > 400 && (
                  <button
                    onClick={() => setExpandedAi(!expandedAi)}
                    className="mt-4 inline-flex items-center gap-1.5 text-sm font-semibold text-forest hover:text-emerald-800 transition-colors"
                  >
                    {expandedAi ? (
                      <><ChevronUp className="w-4 h-4" /> Show less</>
                    ) : (
                      <><ChevronDown className="w-4 h-4" /> Read full analysis</>
                    )}
                  </button>
                )}

                {explainError && (
                  <div className="mt-4 p-4 rounded-2xl bg-red-50 border border-red-100 flex items-start gap-3">
                    <AlertCircle className="w-5 h-5 text-red-500 shrink-0 mt-0.5" aria-hidden="true" />
                    <p className="text-red-700 text-sm">{explainError}</p>
                  </div>
                )}
              </div>

              {/* Action bar */}
              <div className="px-6 py-4 border-t border-forest/10 bg-cream/30 flex flex-col sm:flex-row items-center justify-between gap-4">
                <div className="flex items-center gap-4 text-xs text-ink-muted/70">
                  <span className="flex items-center gap-1"><Clock className="w-3.5 h-3.5" /> Just now</span>
                  <span className="flex items-center gap-1"><BookOpen className="w-3.5 h-3.5" /> Herbal database</span>
                </div>
                <button
                  onClick={browseHerbs}
                  disabled={step === 'searching-herbs'}
                  className="w-full sm:w-auto px-6 py-2.5 bg-forest text-white font-semibold rounded-2xl hover:bg-forest-mist active:bg-forest-deep transition-all shadow-sm disabled:opacity-40 flex items-center justify-center gap-2"
                >
                  {step === 'searching-herbs' ? (
                    <><Loader2 className="w-4 h-4 animate-spin" aria-hidden="true" /> Searching...</>
                  ) : (
                    <><Leaf className="w-4 h-4" aria-hidden="true" /> Browse Remedies for {query}</>
                  )}
                </button>
              </div>
            </div>

            {/* STEP: Herbs */}
            {(step === 'herbs' || step === 'searching-practitioners' || step === 'practitioners' || step === 'subscription-required') && (
              <div>
                {herbs.length > 0 ? (
                  <>
                    {/* Section header */}
                    <div className="flex items-end justify-between mb-8">
                      <div>
                        <h2 className="text-2xl font-bold text-forest flex items-center gap-3">
                          <div className="w-10 h-10 rounded-2xl bg-cream border border-forest/10 flex items-center justify-center">
                            <Leaf className="w-5 h-5 text-forest" aria-hidden="true" />
                          </div>
                          Recommended Herbal Remedies
                        </h2>
                        <p className="text-ink-muted/70 text-sm mt-1 ml-[52px]">
                          {herbs.length} remedies matched for "{query}"
                        </p>
                      </div>
                      <Link href="/herbs" className="text-sm font-semibold text-forest hover:text-emerald-800 flex items-center gap-1 mb-1 transition-colors">
                        View all <ArrowUpRight className="w-4 h-4" aria-hidden="true" />
                      </Link>
                    </div>

                    {/* Herb cards grid */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                      {herbs.map((herb, index) => (
                        <Link 
                          key={herb.id} 
                          href={`/herb/${herb.slug || herb.id}`} 
                          className="group relative bg-white rounded-2xl border border-forest/10 overflow-hidden hover:shadow-xl hover:border-forest/15 hover:-translate-y-0.5 transition-all duration-300"
                        >
                          {/* Rank badge for top 3 */}
                          {index < 3 && (
                            <div className="absolute top-3 left-3 z-10">
                              <div className={`w-7 h-7 rounded-lg flex items-center justify-center text-xs font-bold shadow-sm ${
                                index === 0 ? 'bg-amber-400 text-white' : 
                                index === 1 ? 'bg-slate-300 text-white' : 
                                'bg-amber-700 text-white'
                              }`}>
                                {index + 1}
                              </div>
                            </div>
                          )}

                          {/* Image — only if imageUrl exists */}
                          {herb.imageUrl && (
                            <div className="relative h-52 overflow-hidden bg-cream-dark">
                              <Image 
                                src={herb.imageUrl} 
                                alt={herb.name} 
                                fill 
                                className="object-cover group-hover:scale-105 transition-transform duration-700" 
                              />
                              <div className="absolute inset-0 bg-gradient-to-t from-black/30 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                            </div>
                          )}

                          {/* Content */}
                          <div className="p-5">
                            <div className="flex items-start justify-between gap-3 mb-2">
                              <div>
                                <h3 className="font-bold text-forest group-hover:text-forest transition-colors text-lg leading-tight">{herb.name}</h3>
                                {herb.scientificName && (
                                  <p className="text-xs text-ink-muted/70 italic mt-0.5">{herb.scientificName}</p>
                                )}
                              </div>
                              <ArrowUpRight className="w-4 h-4 text-ink-muted/50 group-hover:text-emerald-500 transition-colors shrink-0 mt-1" />
                            </div>

                            {herb.category && (
                              <span className="inline-block px-2.5 py-1 rounded-lg bg-cream-dark text-ink-muted text-xs font-semibold mb-3">
                                {herb.category.replace(/-/g, ' ')}
                              </span>
                            )}

                            <p className="text-sm text-ink-muted line-clamp-2 leading-relaxed mb-3">
                              {herb.description || 'Traditional African herbal remedy with documented therapeutic properties.'}
                            </p>

                            {/* Benefits chips */}
                            {(() => {
                              let benefitsList: string[] = [];
                              if (Array.isArray(herb.benefits)) {
                                benefitsList = herb.benefits;
                              } else if (typeof herb.benefits === 'string') {
                                benefitsList = herb.benefits.split(/[;|,]/).map(b => b.trim()).filter(Boolean);
                              }
                              return benefitsList.length > 0 ? (
                                <div className="flex flex-wrap gap-1.5">
                                  {benefitsList.slice(0, 3).map((benefit, i) => (
                                    <span key={i} className="px-2 py-1 rounded-md bg-cream text-forest text-xs font-medium">
                                      {benefit}
                                    </span>
                                  ))}
                                  {benefitsList.length > 3 && (
                                    <span className="px-2 py-1 rounded-md bg-cream text-ink-muted/70 text-xs font-medium">
                                      +{benefitsList.length - 3}
                                    </span>
                                  )}
                                </div>
                              ) : null;
                            })()}

                            {/* Footer meta */}
                            <div className="mt-4 pt-3 border-t border-forest/10 flex items-center justify-between text-xs text-ink-muted/70">
                              <span className="flex items-center gap-1">
                                <MapPin className="w-3 h-3" />
                                {herb.origin || 'Africa'}
                              </span>
                              {herb.partsUsed && (
                                <span className="flex items-center gap-1">
                                  <Pill className="w-3 h-3" />
                                  {herb.partsUsed}
                                </span>
                              )}
                            </div>
                          </div>
                        </Link>
                      ))}
                    </div>
                  </>
                ) : (
                  <div className="text-center py-16 bg-white rounded-2xl border border-forest/10">
                    <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-cream border border-forest/10 flex items-center justify-center">
                      <Beaker className="w-8 h-8 text-ink-muted/50" aria-hidden="true" />
                    </div>
                    <h3 className="text-lg font-bold text-slate-800">No herbal remedies found</h3>
                    <p className="text-ink-muted/70 text-sm mt-2 max-w-md mx-auto">
                      We couldn't find specific herbs for "{query}" in our database. Try a different search term or consult a practitioner.
                    </p>
                  </div>
                )}

                {/* CTA: Consult Practitioner */}
                <div className="mt-12 text-center">
                  <div className="inline-block p-6 rounded-2xl bg-white border border-forest/10 shadow-sm">
                    <div className="flex flex-col sm:flex-row items-center gap-4">
                      <div className="text-left">
                        <h4 className="font-bold text-forest">Need personalized guidance?</h4>
                        <p className="text-sm text-ink-muted/70 mt-0.5">Connect with a verified herbal practitioner</p>
                      </div>
                      <button
                        onClick={browsePractitioners}
                        disabled={checkingSub || step === 'searching-practitioners'}
                        className="px-6 py-2.5 bg-forest text-white font-semibold rounded-2xl hover:bg-forest-mist active:bg-forest-deep transition-all shadow-md disabled:opacity-40 flex items-center gap-2 whitespace-nowrap"
                      >
                        {checkingSub || step === 'searching-practitioners' ? (
                          <><Loader2 className="w-4 h-4 animate-spin" aria-hidden="true" /> Checking...</>
                        ) : (
                          <><Stethoscope className="w-4 h-4" aria-hidden="true" /> Consult Practitioner</>
                        )}
                      </button>
                    </div>
                    <p className="text-xs text-ink-muted/70 mt-3 flex items-center justify-center gap-1">
                      <Lock className="w-3 h-3" />
                      Subscription required — unlock personalized care
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* STEP: Subscription Required */}
            {step === 'subscription-required' && (
              <div className="max-w-md mx-auto">
                <div className="text-center py-14 px-8 bg-white rounded-2xl border border-forest/10 shadow-lg">
                  <div className="w-16 h-16 mx-auto mb-5 rounded-2xl bg-amber-50 border border-amber-100 flex items-center justify-center">
                    <Crown className="w-8 h-8 text-amber-500" aria-hidden="true" />
                  </div>
                  <h3 className="text-xl font-bold text-forest mb-2">Unlock Practitioner Access</h3>
                  <p className="text-ink-muted/70 text-sm mb-8 leading-relaxed">
                    Get personalized herbal guidance from verified practitioners. Subscribe for unlimited consultations.
                  </p>
                  <div className="space-y-3">
                    <Link href="/subscription" className="block w-full px-6 py-3 bg-forest text-white rounded-2xl font-semibold hover:bg-forest-mist transition-all shadow-lg shadow-forest/20">
                      <Zap className="w-4 h-4 inline mr-2" aria-hidden="true" />
                      Upgrade Now
                    </Link>
                    {!user && (
                      <Link href="/login" className="block w-full px-6 py-3 border border-forest/10 text-ink-muted rounded-2xl font-semibold hover:bg-cream transition-colors">
                        Log In to Continue
                      </Link>
                    )}
                    <button onClick={() => setStep('herbs')} className="text-sm text-ink-muted/70 hover:text-ink-muted transition-colors font-medium">
                      ← Back to remedies
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* STEP: Practitioners */}
            {step === 'practitioners' && (
              <div>
                <div className="flex items-end justify-between mb-8">
                  <div>
                    <h2 className="text-2xl font-bold text-forest flex items-center gap-3">
                      <div className="w-10 h-10 rounded-2xl bg-teal-50 border border-teal-100 flex items-center justify-center">
                        <Stethoscope className="w-5 h-5 text-teal-600" aria-hidden="true" />
                      </div>
                      Recommended Practitioners
                    </h2>
                    <p className="text-ink-muted/70 text-sm mt-1 ml-[52px]">
                      {practitioners.length} verified specialists available
                    </p>
                  </div>
                </div>

                {practitioners.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    {practitioners.map(p => (
                      <Link 
                        key={p.id} 
                        href={`/consultation/${p.id}`} 
                        className="group flex gap-5 p-6 rounded-2xl bg-white border border-forest/10 hover:shadow-lg hover:border-teal-200 hover:-translate-y-0.5 transition-all duration-300"
                      >
                        <div className="relative w-20 h-20 rounded-2xl overflow-hidden shrink-0 bg-cream-dark border border-forest/10">
                          {p.photoURL ? (
                            <Image src={p.photoURL} alt={p.name} fill className="object-cover" />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-teal-50 to-emerald-50">
                              <User className="w-8 h-8 text-teal-300" aria-hidden="true" />
                            </div>
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-3">
                            <div>
                              <h3 className="font-bold text-forest group-hover:text-teal-700 transition-colors">{p.name}</h3>
                              {p.specialty && <p className="text-sm text-teal-600 font-semibold">{p.specialty}</p>}
                            </div>
                            {p.isVerified && (
                              <div className="px-2 py-1 rounded-lg bg-amber-50 border border-amber-100 text-amber-700 text-xs font-bold flex items-center gap-1 shrink-0">
                                <Star className="w-3 h-3 fill-amber-500 text-amber-500" aria-hidden="true" />
                                Verified
                              </div>
                            )}
                          </div>
                          {p.location && (
                            <div className="flex items-center gap-1 mt-1.5 text-xs text-ink-muted/70">
                              <MapPin className="w-3 h-3" aria-hidden="true" /> {p.location}
                            </div>
                          )}
                          {p.bio && <p className="text-sm text-ink-muted mt-2 line-clamp-2 leading-relaxed">{p.bio}</p>}
                          <div className="flex items-center justify-between mt-4 pt-3 border-t border-forest/10">
                            <div className="flex items-center gap-1.5">
                              {p.rating && (
                                <div className="flex items-center gap-1">
                                  <Star className="w-4 h-4 fill-amber-400 text-amber-400" aria-hidden="true" />
                                  <span className="text-sm font-bold text-slate-700">{p.rating}</span>
                                </div>
                              )}
                              {p.isActive !== false && (
                                <span className="flex items-center gap-1 text-xs text-forest font-medium">
                                  <span className="w-1.5 h-1.5 rounded-full bg-cream0 animate-pulse" />
                                  Available
                                </span>
                              )}
                            </div>
                            {p.consultationFee && (
                              <span className="text-sm font-bold text-forest">${p.consultationFee}<span className="text-ink-muted/70 font-normal text-xs">/session</span></span>
                            )}
                          </div>
                          <div className="mt-3 flex items-center gap-1 text-sm font-semibold text-teal-700 group-hover:text-teal-800 transition-colors">
                            Book consultation <ChevronRight className="w-4 h-4" aria-hidden="true" />
                          </div>
                        </div>
                      </Link>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-16 bg-white rounded-2xl border border-forest/10">
                    <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-cream border border-forest/10 flex items-center justify-center">
                      <MessageCircle className="w-8 h-8 text-ink-muted/50" aria-hidden="true" />
                    </div>
                    <h3 className="text-lg font-bold text-slate-800">No practitioners found</h3>
                    <p className="text-ink-muted/70 text-sm mt-2">Try a broader search term or browse all practitioners.</p>
                    <Link href="/practitioners" className="inline-flex items-center gap-2 mt-5 px-6 py-2.5 bg-cream text-forest rounded-2xl font-semibold hover:bg-cream-dark transition-colors border border-forest/10">
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
          <div className="space-y-12">
            <div className="text-center">
              <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-cream border border-forest/10 text-forest text-xs font-semibold tracking-wide uppercase mb-4">
                <CheckCircle2 className="w-3.5 h-3.5" aria-hidden="true" />
                Plant Identified
              </div>
              <h2 className="text-2xl font-bold text-forest">
                {plantIdResult.suggestions.length} possible match{plantIdResult.suggestions.length !== 1 ? 'es' : ''} found
              </h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {plantIdResult.suggestions.map((s, i) => (
                <div 
                  key={i} 
                  className={`bg-white rounded-2xl border overflow-hidden transition-all duration-300 ${
                    i === 0 
                      ? 'border-forest/20 shadow-lg ring-1 ring-emerald-100' 
                      : 'border-forest/10 hover:shadow-lg hover:border-forest/15'
                  }`}
                >
                  <div className="relative">
                    {s.similarImages.length > 0 ? (
                      <div className="relative h-52 overflow-hidden bg-cream-dark">
                        <Image src={s.similarImages[0]} alt={s.name} fill className="object-cover" />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent" />
                      </div>
                    ) : (
                      <div className="h-52 flex items-center justify-center bg-gradient-to-br from-cream to-cream-dark">
                        <Leaf className="w-16 h-16 text-emerald-200" aria-hidden="true" />
                      </div>
                    )}
                    <div className="absolute top-3 left-3">
                      <div className={`px-3 py-1.5 rounded-lg text-xs font-bold shadow-sm ${
                        s.probability >= 70 ? 'bg-cream0 text-white' : 
                        s.probability >= 40 ? 'bg-amber-400 text-white' : 
                        'bg-cream0 text-white'
                      }`}>
                        {s.probability}% match
                      </div>
                    </div>
                    {i === 0 && (
                      <div className="absolute top-3 right-3">
                        <div className="px-3 py-1.5 rounded-lg bg-white/90 backdrop-blur-sm text-forest text-xs font-bold shadow-sm flex items-center gap-1 border border-forest/10">
                          <CheckCircle2 className="w-3 h-3" aria-hidden="true" /> Best Match
                        </div>
                      </div>
                    )}
                  </div>
                  <div className="p-5">
                    <h3 className="text-lg font-bold text-forest">{s.name}</h3>
                    <p className="text-sm text-ink-muted/70 italic mb-3">{s.scientificName}</p>
                    {(s.family || s.genus) && (
                      <div className="flex flex-wrap gap-2 mb-3">
                        {s.family && <span className="px-2.5 py-1 rounded-lg bg-cream text-ink-muted text-xs font-medium border border-forest/10">Family: {s.family}</span>}
                        {s.genus && <span className="px-2.5 py-1 rounded-lg bg-cream text-ink-muted text-xs font-medium border border-forest/10">Genus: {s.genus}</span>}
                      </div>
                    )}
                    {s.commonNames.length > 0 && (
                      <div className="mb-3">
                        <p className="text-xs text-ink-muted/70 font-semibold mb-1.5 uppercase tracking-wider">Also known as</p>
                        <div className="flex flex-wrap gap-1.5">
                          {s.commonNames.slice(0, 4).map((n, j) => (
                            <span key={j} className="px-2.5 py-1 rounded-lg bg-cream text-forest text-xs font-medium border border-forest/10">{n}</span>
                          ))}
                        </div>
                      </div>
                    )}
                    {s.wikiDescription && <p className="text-sm text-ink-muted line-clamp-3 mb-4 leading-relaxed">{s.wikiDescription}</p>}
                    {s.wikiUrl && (
                      <a 
                        href={s.wikiUrl} 
                        target="_blank" 
                        rel="noopener noreferrer" 
                        className="inline-flex items-center gap-1.5 text-sm font-semibold text-forest hover:text-emerald-800 transition-colors"
                      >
                        Learn more <ExternalLink className="w-3.5 h-3.5" aria-hidden="true" />
                      </a>
                    )}
                  </div>
                </div>
              ))}
            </div>

            {matchedHerbs.length > 0 && (
              <div>
                <div className="flex items-end justify-between mb-8">
                  <div>
                    <h2 className="text-2xl font-bold text-forest flex items-center gap-3">
                      <div className="w-10 h-10 rounded-2xl bg-cream border border-forest/10 flex items-center justify-center">
                        <Leaf className="w-5 h-5 text-forest" aria-hidden="true" />
                      </div>
                      Found in Database
                    </h2>
                    <p className="text-ink-muted/70 text-sm mt-1 ml-[52px]">
                      {matchedHerbs.length} match{matchedHerbs.length !== 1 ? 'es' : ''}
                    </p>
                  </div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                  {matchedHerbs.map(herb => (
                    <Link 
                      key={herb.id} 
                      href={`/herb/${herb.slug || herb.id}`} 
                      className="group bg-white rounded-2xl border border-forest/10 overflow-hidden hover:shadow-xl hover:border-forest/15 hover:-translate-y-0.5 transition-all duration-300"
                    >
                      {herb.imageUrl && (
                        <div className="relative h-48 overflow-hidden bg-cream-dark">
                          <Image src={herb.imageUrl} alt={herb.name} fill className="object-cover group-hover:scale-105 transition-transform duration-700" />
                        </div>
                      )}
                      <div className="p-5">
                        <h3 className="font-bold text-forest group-hover:text-forest transition-colors">{herb.name}</h3>
                        {herb.scientificName && <p className="text-xs text-ink-muted/70 italic">{herb.scientificName}</p>}
                        {herb.category && <span className="inline-block mt-2 px-2.5 py-1 rounded-lg bg-cream text-forest text-xs font-medium border border-forest/10">{herb.category}</span>}
                        <p className="text-sm text-ink-muted line-clamp-2 mt-3 leading-relaxed">{herb.description || 'Traditional African herbal remedy.'}</p>
                      </div>
                    </Link>
                  ))}
                </div>
              </div>
            )}

            {matchedHerbs.length === 0 && plantIdResult.suggestions.length > 0 && (
              <div className="max-w-2xl mx-auto text-center py-14 bg-white rounded-2xl border border-forest/10">
                <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-amber-50 border border-amber-100 flex items-center justify-center">
                  <Info className="w-8 h-8 text-amber-500" aria-hidden="true" />
                </div>
                <h3 className="text-lg font-bold text-slate-800 mb-2">Not yet in our database</h3>
                <p className="text-ink-muted/70 mb-6">This plant hasn't been catalogued yet. Browse practitioners who may know more.</p>
                <Link href="/practitioners" className="inline-flex items-center gap-2 px-6 py-2.5 bg-forest text-white rounded-2xl font-semibold hover:bg-forest-mist transition-all shadow-md">
                  <Stethoscope className="w-4 h-4" aria-hidden="true" /> Find a Practitioner
                </Link>
              </div>
            )}

            <div className="text-center pt-4">
              <button 
                onClick={resetImageSearch} 
                className="inline-flex items-center gap-2 px-6 py-3 rounded-2xl text-sm font-semibold text-ink-muted border border-forest/10 hover:bg-cream transition-colors"
              >
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
      <div className="min-h-screen bg-cream pt-24">
        <div className="max-w-3xl mx-auto px-4 text-center">
          <div className="relative w-12 h-12 mx-auto mb-4">
            <div className="absolute inset-0 rounded-full bg-cream-dark animate-ping opacity-20" />
            <Loader2 className="relative w-12 h-12 animate-spin text-forest mx-auto" aria-hidden="true" />
          </div>
          <p className="text-ink-muted font-medium">Loading search...</p>
        </div>
      </div>
    }>
      <SearchPageContent />
    </Suspense>
  );
}