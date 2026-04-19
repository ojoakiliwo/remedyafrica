'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { db } from '@/lib/firebase/client';
import { collection, query as firestoreQuery, getDocs, where, limit, doc, getDoc, DocumentData } from 'firebase/firestore';
import { useAuth } from '@/hooks/useAuth';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { 
  Search, 
  Sparkles, 
  Leaf, 
  Stethoscope, 
  Clock,
  X,
  ArrowRight,
  Loader2,
  AlertCircle,
  User,
  MessageCircle,
  ChevronRight
} from 'lucide-react';
import { toast } from 'sonner';

// Types
interface HerbData {
  id: string;
  displayName: string;
  scientificName?: string;
  description: string;
  benefits: string[];
  category: string;
  imageUrl?: string;
  tags?: string[];
  conditions?: string[];
}

interface PractitionerData {
  id: string;
  fullName: string;
  specialty: string;
  bio: string;
  photoUrl?: string;
  verified: boolean;
  consultationFee?: number;
  available?: boolean;
}

interface UserSubscription {
  status: 'active' | 'inactive' | 'trial';
  plan?: string;
  expiresAt?: Date;
}

interface AISearchResult {
  condition: string;
  description: string;
  symptoms: string[];
  suggestedHerbs: string[];
  suggestedApproach: string;
  safetyWarning?: string;
  relatedConditions: string[];
}

// AI Knowledge Base - EXPANDED with more conditions
const KNOWLEDGE_BASE: Record<string, AISearchResult> = {
  arthritis: {
    condition: 'Arthritis',
    description: 'Arthritis is inflammation of one or more joints, causing pain and stiffness that can worsen with age. Osteoarthritis and rheumatoid arthritis are the most common types.',
    symptoms: ['Joint pain', 'Stiffness', 'Swelling', 'Reduced range of motion'],
    suggestedHerbs: ['turmeric', 'ginger', 'boswellia', 'devil\'s claw', 'willow bark'],
    suggestedApproach: 'Anti-inflammatory herbs combined with gentle exercise and dietary changes.',
    relatedConditions: ['joint pain', 'inflammation', 'osteoarthritis']
  },
  headache: {
    condition: 'Headache',
    description: 'Pain in the head or face that can vary in intensity, location, and duration. Tension headaches and migraines are common types.',
    symptoms: ['Head pain', 'Sensitivity to light', 'Nausea', 'Tension in neck'],
    suggestedHerbs: ['feverfew', 'peppermint', 'ginger', 'lavender', 'willow bark'],
    suggestedApproach: 'Pain-relieving and anti-inflammatory herbs with stress management.',
    relatedConditions: ['migraine', 'tension', 'stress']
  },
  stress: {
    condition: 'Stress & Anxiety',
    description: 'A state of mental or emotional strain resulting from adverse or demanding circumstances. Chronic stress affects overall health.',
    symptoms: ['Irritability', 'Fatigue', 'Sleep problems', 'Difficulty concentrating'],
    suggestedHerbs: ['ashwagandha', 'lavender', 'lemon balm', 'passionflower', 'valerian'],
    suggestedApproach: 'Adaptogenic herbs to balance cortisol and nervous system support.',
    relatedConditions: ['anxiety', 'insomnia', 'fatigue', 'depression']
  },
  sleep: {
    condition: 'Sleep Disorders',
    description: 'Conditions that affect sleep quality, timing, or duration, impacting overall health and daily functioning.',
    symptoms: ['Difficulty falling asleep', 'Waking frequently', 'Daytime fatigue', 'Poor sleep quality'],
    suggestedHerbs: ['valerian', 'chamomile', 'lavender', 'passionflower', 'hops'],
    suggestedApproach: 'Sedative herbs combined with sleep hygiene practices.',
    relatedConditions: ['insomnia', 'anxiety', 'restlessness']
  },
  digestion: {
    condition: 'Digestive Issues',
    description: 'Problems with the digestive system including bloating, indigestion, constipation, or irritable bowel syndrome.',
    symptoms: ['Bloating', 'Gas', 'Stomach pain', 'Irregular bowel movements'],
    suggestedHerbs: ['ginger', 'peppermint', 'fennel', 'chamomile', 'licorice root'],
    suggestedApproach: 'Carminative and soothing herbs for gut health.',
    relatedConditions: ['bloating', 'IBS', 'indigestion', 'nausea']
  },
  immunity: {
    condition: 'Immune Support',
    description: 'Strengthening the body\'s defense system to prevent or fight infections and diseases.',
    symptoms: ['Frequent infections', 'Slow healing', 'Fatigue', 'Weakness'],
    suggestedHerbs: ['echinacea', 'elderberry', 'garlic', 'astragalus', 'ginger'],
    suggestedApproach: 'Immune-modulating herbs with antioxidant support.',
    relatedConditions: ['cold', 'flu', 'infection', 'weakness']
  },
  skin: {
    condition: 'Skin Conditions',
    description: 'Various conditions affecting the skin including eczema, acne, rashes, and wounds.',
    symptoms: ['Rash', 'Itching', 'Inflammation', 'Dryness', 'Acne'],
    suggestedHerbs: ['aloe vera', 'calendula', 'tea tree', 'neem', 'turmeric'],
    suggestedApproach: 'Anti-inflammatory and healing herbs for topical and internal use.',
    relatedConditions: ['eczema', 'acne', 'rash', 'wounds', 'inflammation']
  },
  pain: {
    condition: 'General Pain',
    description: 'Physical discomfort ranging from mild to severe, acute or chronic, affecting various body parts.',
    symptoms: ['Aching', 'Sharp pain', 'Throbbing', 'Soreness'],
    suggestedHerbs: ['turmeric', 'willow bark', 'ginger', 'devil\'s claw', 'capsaicin'],
    suggestedApproach: 'Natural analgesic and anti-inflammatory herbs.',
    relatedConditions: ['inflammation', 'muscle pain', 'joint pain', 'headache']
  },
  cold: {
    condition: 'Common Cold & Flu',
    description: 'Viral infections affecting the upper respiratory tract with symptoms like congestion, cough, and fever.',
    symptoms: ['Runny nose', 'Sore throat', 'Cough', 'Fever', 'Congestion'],
    suggestedHerbs: ['echinacea', 'ginger', 'garlic', 'elderberry', 'peppermint'],
    suggestedApproach: 'Antiviral and immune-boosting herbs with symptom relief.',
    safetyWarning: 'Seek medical attention if symptoms worsen or persist beyond 10 days.',
    relatedConditions: ['flu', 'cough', 'congestion', 'fever']
  },
  diabetes: {
    condition: 'Diabetes',
    description: 'A metabolic disease that causes high blood sugar. The hormone insulin moves sugar from the blood into cells to be stored or used for energy.',
    symptoms: ['Increased thirst', 'Frequent urination', 'Extreme hunger', 'Unexplained weight loss', 'Fatigue'],
    suggestedHerbs: ['bitter melon', 'fenugreek', 'cinnamon', 'gymnema', 'aloe vera'],
    suggestedApproach: 'Blood sugar regulating herbs combined with dietary management.',
    safetyWarning: 'Always consult your doctor before using herbal remedies. Do not replace prescribed medication without medical supervision.',
    relatedConditions: ['high blood sugar', 'metabolic syndrome', 'insulin resistance']
  },
  hypertension: {
    condition: 'Hypertension (High Blood Pressure)',
    description: 'A condition in which the force of the blood against the artery walls is too high, increasing risk of heart disease and stroke.',
    symptoms: ['Often no symptoms', 'Headaches', 'Shortness of breath', 'Nosebleeds'],
    suggestedHerbs: ['garlic', 'hawthorn', 'hibiscus', 'olive leaf', 'celery seed'],
    suggestedApproach: 'Vasodilating and heart-supportive herbs with lifestyle changes.',
    safetyWarning: 'Monitor blood pressure regularly. Do not stop prescribed medication without consulting your doctor.',
    relatedConditions: ['high blood pressure', 'heart health', 'cardiovascular']
  },
  // NEW: Male reproductive health
  'low sperm count': {
    condition: 'Low Sperm Count (Oligospermia)',
    description: 'A condition where the semen contains fewer sperm than normal, which can reduce fertility. Often linked to hormonal imbalances, lifestyle factors, or nutritional deficiencies.',
    symptoms: ['Difficulty conceiving', 'Low semen volume', 'Hormonal imbalances', 'Fatigue', 'Reduced libido'],
    suggestedHerbs: ['maca root', 'tribulus terrestris', 'ashwagandha', 'ginseng', 'fenugreek', 'damiana'],
    suggestedApproach: 'Adaptogenic and hormone-balancing herbs combined with lifestyle improvements and stress reduction.',
    safetyWarning: 'Consult a healthcare provider for proper diagnosis. Herbal remedies should complement, not replace, medical treatment for fertility issues.',
    relatedConditions: ['infertility', 'low testosterone', 'erectile dysfunction', 'fatigue']
  },
  // NEW: More reproductive health
  'infertility': {
    condition: 'Infertility',
    description: 'The inability to conceive after one year of unprotected intercourse. Can affect both men and women and may have various underlying causes.',
    symptoms: ['Difficulty conceiving', 'Irregular menstrual cycles', 'Hormonal issues', 'Low sperm count'],
    suggestedHerbs: ['maca root', 'vitex', 'red clover', 'ashwagandha', 'tribulus terrestris'],
    suggestedApproach: 'Hormone-balancing herbs for both partners, stress reduction, and nutritional support.',
    safetyWarning: 'Both partners should seek medical evaluation. Herbal remedies support fertility but may not address underlying medical conditions.',
    relatedConditions: ['low sperm count', 'hormonal imbalance', 'stress', 'fatigue']
  },
  // NEW: Common African conditions
  'malaria': {
    condition: 'Malaria',
    description: 'A mosquito-borne infectious disease common in tropical regions including many parts of Africa. Caused by Plasmodium parasites.',
    symptoms: ['Fever', 'Chills', 'Headache', 'Muscle pain', 'Fatigue', 'Nausea'],
    suggestedHerbs: ['neem', 'artemisia annua', 'garlic', 'ginger', 'papaya leaf'],
    suggestedApproach: 'Antiparasitic and immune-supporting herbs. MUST be used alongside conventional antimalarial treatment.',
    safetyWarning: 'URGENT: Malaria can be life-threatening. Seek immediate medical attention and use conventional antimalarial drugs. Herbs are supportive only.',
    relatedConditions: ['fever', 'infection', 'fatigue', 'immune support']
  },
  // NEW: Women's health
  'menstrual pain': {
    condition: 'Menstrual Pain (Dysmenorrhea)',
    description: 'Painful menstrual periods caused by uterine contractions. Common symptoms include cramping, lower back pain, and nausea.',
    symptoms: ['Cramping', 'Lower back pain', 'Nausea', 'Headaches', 'Bloating'],
    suggestedHerbs: ['ginger', 'chamomile', 'cramp bark', 'raspberry leaf', 'cinnamon'],
    suggestedApproach: 'Antispasmodic and anti-inflammatory herbs to relieve cramping and pain.',
    relatedConditions: ['pain', 'inflammation', 'stress', 'hormonal imbalance']
  },
  // NEW: More general conditions
  'fever': {
    condition: 'Fever',
    description: 'A temporary increase in body temperature, often due to an infection. The body\'s natural defense mechanism.',
    symptoms: ['High temperature', 'Sweating', 'Chills', 'Headache', 'Muscle aches'],
    suggestedHerbs: ['ginger', 'elderflower', 'peppermint', 'yarrow', 'basil'],
    suggestedApproach: 'Herbs to promote sweating and cool the body, combined with hydration and rest.',
    safetyWarning: 'Seek medical attention if fever exceeds 39°C (102°F) or persists more than 3 days, especially in children.',
    relatedConditions: ['infection', 'cold', 'flu', 'malaria']
  },
  'cough': {
    condition: 'Cough',
    description: 'A reflex action to clear the airways of irritants, mucus, or foreign particles. Can be dry or productive.',
    symptoms: ['Persistent coughing', 'Throat irritation', 'Mucus production', 'Chest tightness'],
    suggestedHerbs: ['ginger', 'honey', 'licorice root', 'thyme', 'eucalyptus'],
    suggestedApproach: 'Expectorant and soothing herbs to clear mucus and soothe the throat.',
    relatedConditions: ['cold', 'flu', 'respiratory infection', 'congestion']
  },
  'wound healing': {
    condition: 'Wound Healing',
    description: 'The natural process of repairing damaged skin and tissue. Can be supported with topical and internal remedies.',
    symptoms: ['Cuts', 'Scrapes', 'Slow-healing wounds', 'Risk of infection'],
    suggestedHerbs: ['aloe vera', 'honey', 'calendula', 'tea tree', 'turmeric'],
    suggestedApproach: 'Topical antiseptic and healing herbs combined with internal immune support.',
    relatedConditions: ['skin conditions', 'infection risk', 'inflammation']
  }
};

type SearchStep = 'input' | 'analyzing' | 'condition-info' | 'herb-results' | 'no-herbs' | 'practitioners';

// Helper to safely extract data from Firestore
function getString(raw: DocumentData, field: string, defaultValue = ''): string {
  const value = raw[field];
  return typeof value === 'string' ? value : defaultValue;
}

function getArray(raw: DocumentData, field: string): string[] {
  const value = raw[field];
  return Array.isArray(value) ? value.filter((item): item is string => typeof item === 'string') : [];
}

function getBoolean(raw: DocumentData, field: string, defaultValue = false): boolean {
  const value = raw[field];
  return typeof value === 'boolean' ? value : defaultValue;
}

function getNumber(raw: DocumentData, field: string): number | undefined {
  const value = raw[field];
  return typeof value === 'number' ? value : undefined;
}

export default function SearchPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const auth = useAuth();
  const user = auth?.user || null;
  
  const initialQuery = searchParams.get('q') || '';
  
  const [searchQuery, setSearchQuery] = useState(initialQuery);
  const [inputValue, setInputValue] = useState(initialQuery);
  const [currentStep, setCurrentStep] = useState<SearchStep>('input');
  const [aiResult, setAiResult] = useState<AISearchResult | null>(null);
  const [herbs, setHerbs] = useState<HerbData[]>([]);
  const [matchedHerbs, setMatchedHerbs] = useState<HerbData[]>([]);
  const [practitioners, setPractitioners] = useState<PractitionerData[]>([]);
  const [loading, setLoading] = useState(false);
  const [recentSearches, setRecentSearches] = useState<string[]>([]);
  const [subscription, setSubscription] = useState<UserSubscription | null>(null);
  const [error, setError] = useState<string | null>(null);
  
  const inputRef = useRef<HTMLInputElement>(null);

  // Load recent searches
  useEffect(() => {
    const saved = localStorage.getItem('recentSearches');
    if (saved) {
      try { setRecentSearches(JSON.parse(saved)); } catch {}
    }
    inputRef.current?.focus();
  }, []);

  // Check subscription status
  useEffect(() => {
    if (!user) return;
    
    const checkSubscription = async () => {
      try {
        const subDoc = await getDoc(doc(db, 'subscriptions', user.uid));
        if (subDoc.exists()) {
          setSubscription(subDoc.data() as UserSubscription);
        } else {
          setSubscription({ status: 'inactive' });
        }
      } catch (err) {
        console.error('Error checking subscription:', err);
      }
    };
    
    checkSubscription();
  }, [user]);

  // Save recent search
  const saveRecent = (term: string) => {
    if (!term.trim()) return;
    setRecentSearches(prev => {
      const updated = [term, ...prev.filter(s => s !== term)].slice(0, 8);
      localStorage.setItem('recentSearches', JSON.stringify(updated));
      return updated;
    });
  };

  // AI Analysis function - FIXED to always use knowledge base as fallback
  const analyzeCondition = async (queryTerm: string) => {
    setLoading(true);
    setError(null);
    setCurrentStep('analyzing');
    
    try {
      // First, check if we have this in our knowledge base
      const normalizedQuery = queryTerm.toLowerCase().trim();
      const knowledgeEntry = Object.entries(KNOWLEDGE_BASE).find(([key]) => 
        normalizedQuery.includes(key) || key.includes(normalizedQuery)
      );

      let aiData: AISearchResult;

      // Try API first
      try {
        const response = await fetch('/api/ai-search', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ 
            query: queryTerm,
            context: { type: 'symptom_search' }
          }),
        });

        if (response.ok) {
          const apiResult = await response.json();
          
          // If we have knowledge base entry, merge it with API result
          if (knowledgeEntry) {
            aiData = { ...knowledgeEntry[1], ...apiResult };
          } else {
            // API returned data but no knowledge base entry - use API data or create generic
            aiData = {
              condition: apiResult.condition || queryTerm.charAt(0).toUpperCase() + queryTerm.slice(1),
              description: apiResult.description || `Information about ${queryTerm}. This condition may benefit from traditional herbal remedies.`,
              symptoms: apiResult.symptoms || ['Varies by individual'],
              suggestedHerbs: apiResult.suggestedHerbs || ['ginger', 'turmeric', 'garlic', 'green tea'],
              suggestedApproach: apiResult.suggestedApproach || 'Consult with a practitioner for personalized recommendations.',
              relatedConditions: apiResult.relatedConditions || [],
              safetyWarning: apiResult.safetyWarning
            };
          }
        } else {
          // API failed - use knowledge base or generic fallback
          throw new Error('API failed');
        }
      } catch (apiErr) {
        // API error - fall back to knowledge base or generic response
        if (knowledgeEntry) {
          aiData = knowledgeEntry[1];
        } else {
          // Create a generic response for unknown conditions
          aiData = {
            condition: queryTerm.charAt(0).toUpperCase() + queryTerm.slice(1),
            description: `Information about ${queryTerm}. While this specific condition is not extensively documented in our traditional African medicine database, many health concerns can be addressed through holistic approaches combining herbal remedies, dietary changes, and lifestyle modifications.`,
            symptoms: ['Varies by individual', 'Please consult for specific symptoms'],
            suggestedHerbs: ['ginger', 'turmeric', 'garlic', 'green tea', 'moringa'],
            suggestedApproach: 'General wellness herbs combined with practitioner consultation for personalized treatment.',
            relatedConditions: ['general wellness', 'preventive care']
          };
        }
      }

      setAiResult(aiData);
      setCurrentStep('condition-info');
      saveRecent(queryTerm);
      
      // Pre-fetch herbs for quick loading
      await fetchAllHerbs();
      
    } catch (err) {
      console.error('AI analysis error:', err);
      setError('Unable to analyze your condition. Please try again or consult a practitioner directly.');
      setCurrentStep('input');
    } finally {
      setLoading(false);
    }
  };

  // Fetch all herbs from database
  const fetchAllHerbs = async () => {
    try {
      const herbsQuery = firestoreQuery(collection(db, 'herbs'), limit(200));
      const herbsSnapshot = await getDocs(herbsQuery);
      const herbsData: HerbData[] = [];
      
      for (const docSnap of herbsSnapshot.docs) {
        const raw = docSnap.data();
        herbsData.push({
          id: docSnap.id,
          displayName: getString(raw, 'name') || getString(raw, 'displayName'),
          scientificName: getString(raw, 'scientificName') || undefined,
          description: getString(raw, 'description'),
          benefits: getArray(raw, 'benefits'),
          category: getString(raw, 'category'),
          imageUrl: getString(raw, 'imageUrl') || undefined,
          tags: getArray(raw, 'tags'),
          conditions: getArray(raw, 'conditions'),
        });
      }
      
      setHerbs(herbsData);
    } catch (err) {
      console.error('Error fetching herbs:', err);
    }
  };

  // Search for herbs matching AI suggestions
  const searchHerbs = () => {
    if (!aiResult) return;
    
    setCurrentStep('herb-results');
    
    const suggestedHerbNames = aiResult.suggestedHerbs.map(h => h.toLowerCase());
    const conditionKeywords = aiResult.condition.toLowerCase().split(' ');
    
    const matches = herbs.filter(herb => {
      const herbName = herb.displayName.toLowerCase();
      const herbTags = (herb.tags || []).map(t => t.toLowerCase());
      const herbConditions = (herb.conditions || []).map(c => c.toLowerCase());
      const herbBenefits = herb.benefits.map(b => b.toLowerCase());
      
      // Check if herb name matches suggested herbs
      const nameMatch = suggestedHerbNames.some(suggested => 
        herbName.includes(suggested) || suggested.includes(herbName)
      );
      
      // Check if herb treats this condition
      const conditionMatch = herbConditions.some(c => 
        aiResult.condition.toLowerCase().includes(c) || 
        c.includes(aiResult.condition.toLowerCase())
      );
      
      // Check tags
      const tagMatch = herbTags.some(tag => 
        suggestedHerbNames.some(suggested => tag.includes(suggested))
      );
      
      // Check benefits
      const benefitMatch = herbBenefits.some(benefit => 
        conditionKeywords.some(keyword => benefit.includes(keyword))
      );
      
      return nameMatch || conditionMatch || tagMatch || benefitMatch;
    });

    // Sort by relevance
    matches.sort((a, b) => {
      const aNameMatch = suggestedHerbNames.some(s => a.displayName.toLowerCase().includes(s));
      const bNameMatch = suggestedHerbNames.some(s => b.displayName.toLowerCase().includes(s));
      return (bNameMatch ? 1 : 0) - (aNameMatch ? 1 : 0);
    });

    setMatchedHerbs(matches);
    
    // If no herbs found, show practitioner suggestion
    if (matches.length === 0) {
      setCurrentStep('no-herbs');
    }
  };

  // Fetch practitioners
  const fetchPractitioners = async () => {
    setCurrentStep('analyzing');
    setLoading(true);
    
    try {
      // Check subscription first
      if (!subscription || subscription.status !== 'active') {
        router.push('/subscribe?redirect=search&reason=practitioner');
        return;
      }

      const pracQuery = firestoreQuery(
        collection(db, 'practitioners'), 
        where('verified', '==', true),
        where('available', '==', true),
        limit(10)
      );
      
      const pracSnapshot = await getDocs(pracQuery);
      const practitionersData: PractitionerData[] = [];
      
      for (const docSnap of pracSnapshot.docs) {
        const raw = docSnap.data();
        practitionersData.push({
          id: docSnap.id,
          fullName: getString(raw, 'displayName') || getString(raw, 'fullName'),
          specialty: getString(raw, 'specialty'),
          bio: getString(raw, 'bio'),
          photoUrl: getString(raw, 'photoUrl') || undefined,
          verified: getBoolean(raw, 'verified'),
          consultationFee: getNumber(raw, 'consultationFee'),
          available: getBoolean(raw, 'available', true),
        });
      }
      
      setPractitioners(practitionersData);
      setCurrentStep('practitioners');
    } catch (err) {
      console.error('Error fetching practitioners:', err);
      toast.error('Unable to load practitioners');
      setCurrentStep('no-herbs');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputValue.trim()) return;
    analyzeCondition(inputValue);
    setSearchQuery(inputValue);
  };

  const handleHerbClick = (herbId: string) => {
    router.push(`/herb/${herbId}`);
  };

  const handlePractitionerClick = (practitionerId: string) => {
    router.push(`/consultation/book?practitioner=${practitionerId}`);
  };

  const resetSearch = () => {
    setCurrentStep('input');
    setAiResult(null);
    setMatchedHerbs([]);
    setPractitioners([]);
    setInputValue('');
    setSearchQuery('');
    setError(null);
    inputRef.current?.focus();
  };

  return (
    <div className="min-h-screen bg-[#faf9f7]">
      {/* Header */}
      <div className="border-b border-[#e8e4df] bg-white">
        <div className="mx-auto max-w-4xl px-4 py-8">
          <div className="mb-2 flex items-center justify-center gap-2">
            <Sparkles className="h-5 w-5 text-[#b89f6b]" />
            <span className="text-sm font-medium uppercase tracking-wider text-[#b89f6b]">
              AI-Powered Health Search
            </span>
          </div>
          <h1 className="mb-6 text-center text-3xl font-bold text-[#2c3e33]">
            How can we help you heal?
          </h1>
          
          {/* Search Form */}
          <form onSubmit={handleSubmit} className="relative mx-auto max-w-2xl">
            <Search className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-[#999]" />
            <Input
              ref={inputRef}
              type="text"
              placeholder="Describe your symptoms (e.g., 'joint pain', 'stress', 'migraine')..."
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              className="h-14 rounded-full border-2 border-[#e8e4df] bg-white pl-12 pr-32 text-base"
              disabled={loading}
            />
            <div className="absolute right-2 top-1/2 flex -translate-y-1/2 items-center gap-1">
              {inputValue && (
                <Button 
                  type="button" 
                  variant="ghost" 
                  size="icon" 
                  className="h-8 w-8" 
                  onClick={resetSearch}
                  disabled={loading}
                >
                  <X className="h-4 w-4" />
                </Button>
              )}
              <Button 
                type="submit" 
                className="h-10 rounded-full bg-[#5c7c6b] px-6"
                disabled={loading || !inputValue.trim()}
              >
                {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Search'}
              </Button>
            </div>
          </form>
          
          {/* Popular Searches */}
          {!searchQuery && (
            <div className="mt-4 flex flex-wrap items-center justify-center gap-2">
              <span className="text-xs text-[#999]">Popular:</span>
              {['Arthritis', 'Stress Relief', 'Migraine', 'Low Sperm Count', 'Digestion', 'Sleep Issues'].map((t) => (
                <button 
                  key={t} 
                  onClick={() => { 
                    setInputValue(t); 
                    analyzeCondition(t);
                    setSearchQuery(t); 
                  }}
                  className="rounded-full border border-[#e8e4df] bg-white px-3 py-1 text-xs font-medium hover:border-[#5c7c6b] hover:text-[#5c7c6b] transition-colors"
                  disabled={loading}
                >
                  {t}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Main Content */}
      <div className="mx-auto max-w-4xl px-4 py-8">
        
        {/* Error Message */}
        {error && (
          <div className="mb-6 rounded-xl border border-red-200 bg-red-50 p-4">
            <div className="flex items-start gap-3">
              <AlertCircle className="h-5 w-5 text-red-500 mt-0.5" />
              <div>
                <h4 className="font-semibold text-red-900">Something went wrong</h4>
                <p className="text-sm text-red-700">{error}</p>
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="mt-2"
                  onClick={() => setError(null)}
                >
                  Try Again
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* Step 1: Input with Recent Searches */}
        {currentStep === 'input' && !searchQuery && recentSearches.length > 0 && (
          <div className="mb-8">
            <div className="mb-3 flex items-center gap-2">
              <Clock className="h-4 w-4 text-[#999]" />
              <h3 className="text-sm font-medium">Recent Searches</h3>
            </div>
            <div className="flex flex-wrap gap-2">
              {recentSearches.map((t, i) => (
                <button 
                  key={i} 
                  onClick={() => { 
                    setInputValue(t); 
                    analyzeCondition(t);
                    setSearchQuery(t); 
                  }}
                  className="flex items-center gap-1 rounded-full bg-white px-4 py-2 text-sm shadow-sm hover:bg-[#5c7c6b]/5 transition-colors"
                  disabled={loading}
                >
                  <Clock className="h-3 w-3" />
                  {t}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Step 2: Analyzing */}
        {currentStep === 'analyzing' && (
          <div className="flex flex-col items-center justify-center py-16">
            <div className="mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-[#5c7c6b]/10">
              <Sparkles className="h-10 w-10 text-[#5c7c6b] animate-pulse" />
            </div>
            <h3 className="mb-2 text-xl font-semibold">AI is analyzing your condition...</h3>
            <p className="text-sm text-[#999]">Searching our knowledge base and herbal database</p>
          </div>
        )}

        {/* Step 3: Condition Info */}
        {currentStep === 'condition-info' && aiResult && (
          <div className="space-y-6">
            {/* AI Insight Card */}
            <Card className="border-[#b89f6b]/20 bg-gradient-to-br from-[#b89f6b]/5 to-white">
              <CardContent className="p-6">
                <div className="flex items-start gap-4">
                  <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[#b89f6b]/20">
                    <Sparkles className="h-6 w-6 text-[#b89f6b]" />
                  </div>
                  <div className="flex-1">
                    <h2 className="mb-2 text-2xl font-bold text-[#2c3e33]">
                      {aiResult.condition}
                    </h2>
                    <p className="mb-4 text-[#5a5a5a] leading-relaxed">
                      {aiResult.description}
                    </p>
                    
                    {aiResult.safetyWarning && (
                      <div className="mb-4 rounded-lg bg-amber-50 border border-amber-200 p-3">
                        <p className="text-sm text-amber-800 flex items-start gap-2">
                          <AlertCircle className="h-4 w-4 mt-0.5 flex-shrink-0" />
                          {aiResult.safetyWarning}
                        </p>
                      </div>
                    )}

                    <div className="mb-4">
                      <h4 className="mb-2 text-sm font-semibold text-[#2c3e33]">Common Symptoms:</h4>
                      <div className="flex flex-wrap gap-2">
                        {aiResult.symptoms.map((symptom, i) => (
                          <Badge key={i} variant="secondary" className="bg-white/80">
                            {symptom}
                          </Badge>
                        ))}
                      </div>
                    </div>

                    <div className="rounded-lg bg-white/60 p-4">
                      <h4 className="mb-1 text-sm font-semibold text-[#2c3e33]">Suggested Approach:</h4>
                      <p className="text-sm text-[#5a5a5a]">{aiResult.suggestedApproach}</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Action Buttons */}
            <div className="grid gap-4 sm:grid-cols-2">
              <Button 
                size="lg" 
                className="h-16 bg-[#5c7c6b] hover:bg-[#4a6354]"
                onClick={searchHerbs}
              >
                <Leaf className="mr-2 h-5 w-5" />
                <div className="text-left">
                  <div className="font-semibold">Find Herbal Remedies</div>
                  <div className="text-xs opacity-90">{aiResult.suggestedHerbs.length} suggested herbs</div>
                </div>
                <ChevronRight className="ml-auto h-5 w-5" />
              </Button>

              <Button 
                size="lg" 
                variant="outline" 
                className="h-16 border-[#5c7c6b] text-[#5c7c6b] hover:bg-[#5c7c6b]/5"
                onClick={fetchPractitioners}
              >
                <Stethoscope className="mr-2 h-5 w-5" />
                <div className="text-left">
                  <div className="font-semibold">Consult a Practitioner</div>
                  <div className="text-xs opacity-90">Get personalized advice</div>
                </div>
                <ChevronRight className="ml-auto h-5 w-5" />
              </Button>
            </div>

            {/* Related Conditions */}
            {aiResult.relatedConditions.length > 0 && (
              <div className="pt-4 border-t border-[#e8e4df]">
                <h4 className="mb-3 text-sm font-medium text-[#999]">Related conditions:</h4>
                <div className="flex flex-wrap gap-2">
                  {aiResult.relatedConditions.map((condition, i) => (
                    <button
                      key={i}
                      onClick={() => {
                        setInputValue(condition);
                        analyzeCondition(condition);
                        setSearchQuery(condition);
                      }}
                      className="text-sm text-[#5c7c6b] hover:underline"
                    >
                      {condition}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Step 4: Herb Results */}
        {currentStep === 'herb-results' && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xl font-bold text-[#2c3e33]">
                  Recommended Herbal Remedies
                </h2>
                <p className="text-sm text-[#999]">
                  {matchedHerbs.length} remedies found for {aiResult?.condition}
                </p>
              </div>
              <Button variant="outline" size="sm" onClick={() => setCurrentStep('condition-info')}>
                Back
              </Button>
            </div>

            {matchedHerbs.length > 0 ? (
              <div className="grid gap-4 sm:grid-cols-2">
                {matchedHerbs.map((herb) => (
                  <Card 
                    key={herb.id} 
                    className="group cursor-pointer overflow-hidden border-[#e8e4df] bg-white transition-all hover:border-[#5c7c6b]/30 hover:shadow-md"
                    onClick={() => handleHerbClick(herb.id)}
                  >
                    <CardContent className="p-0">
                      <div className="flex">
                        <div className="relative h-32 w-32 flex-shrink-0 bg-[#f0efe9]">
                          {herb.imageUrl ? (
                            <Image 
                              src={herb.imageUrl} 
                              alt={herb.displayName} 
                              fill 
                              className="object-cover" 
                            />
                          ) : (
                            <div className="flex h-full w-full items-center justify-center">
                              <Leaf className="h-8 w-8 text-[#d4cfc7]" />
                            </div>
                          )}
                        </div>
                        <div className="flex flex-1 flex-col p-4">
                          <div className="mb-1 flex items-center gap-2">
                            <Badge variant="secondary" className="bg-[#5c7c6b]/10 text-[#5c7c6b] text-xs">
                              <Leaf className="mr-1 h-3 w-3" />
                              Herb
                            </Badge>
                          </div>
                          <h3 className="mb-1 font-semibold text-[#2c3e33] group-hover:text-[#5c7c6b]">
                            {herb.displayName}
                          </h3>
                          {herb.scientificName && (
                            <p className="mb-1 text-xs italic text-[#999]">{herb.scientificName}</p>
                          )}
                          <p className="line-clamp-2 text-sm text-[#5a5a5a]">{herb.description}</p>
                          {herb.benefits.length > 0 && (
                            <div className="mt-2 flex flex-wrap gap-1">
                              {herb.benefits.slice(0, 2).map((b, i) => (
                                <span key={i} className="rounded-full bg-[#f0efe9] px-2 py-0.5 text-xs">
                                  {b}
                                </span>
                              ))}
                            </div>
                          )}
                        </div>
                        <div className="flex items-center px-2">
                          <ChevronRight className="h-5 w-5 text-[#d4cfc7]" />
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <div className="rounded-xl border border-dashed border-[#d4cfc7] bg-white p-8 text-center">
                <Leaf className="mx-auto mb-4 h-12 w-12 text-[#d4cfc7]" />
                <h3 className="mb-2 font-semibold">No herbs found</h3>
                <p className="mb-4 text-sm text-[#999]">
                  We don&apos;t have specific remedies for this condition in our database yet.
                </p>
                <Button onClick={() => setCurrentStep('no-herbs')} className="bg-[#5c7c6b]">
                  Consult a Practitioner Instead
                </Button>
              </div>
            )}

            {/* Alternative Option */}
            <div className="rounded-lg bg-[#f0efe9] p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-white">
                    <Stethoscope className="h-5 w-5 text-[#5c7c6b]" />
                  </div>
                  <div>
                    <h4 className="font-semibold">Need personalized guidance?</h4>
                    <p className="text-sm text-[#5a5a5a]">Speak with a certified practitioner</p>
                  </div>
                </div>
                <Button 
                  variant="outline" 
                  className="border-[#5c7c6b] text-[#5c7c6b]"
                  onClick={fetchPractitioners}
                >
                  Find Practitioners
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* Step 5: No Herbs - Suggest Practitioners */}
        {currentStep === 'no-herbs' && (
          <div className="space-y-6">
            <div className="rounded-xl border border-[#e8e4df] bg-white p-8 text-center">
              <Search className="mx-auto mb-4 h-12 w-12 text-[#d4cfc7]" />
              <h3 className="mb-2 text-xl font-semibold">No Herbal Remedies Available</h3>
              <p className="mb-6 text-[#5a5a5a] max-w-md mx-auto">
                We don&apos;t have specific herbal remedies for &quot;{aiResult?.condition}&quot; in our database. 
                This condition may require personalized treatment from a qualified practitioner.
              </p>
              
              {aiResult?.safetyWarning && (
                <div className="mb-6 rounded-lg bg-amber-50 border border-amber-200 p-4 max-w-md mx-auto">
                  <p className="text-sm text-amber-800 flex items-start gap-2">
                    <AlertCircle className="h-4 w-4 mt-0.5 flex-shrink-0" />
                    {aiResult.safetyWarning}
                  </p>
                </div>
              )}

              <div className="flex flex-col sm:flex-row gap-3 justify-center">
                <Button 
                  size="lg" 
                  className="bg-[#5c7c6b] hover:bg-[#4a6354]"
                  onClick={fetchPractitioners}
                >
                  <Stethoscope className="mr-2 h-5 w-5" />
                  Find a Practitioner
                </Button>
                <Button 
                  size="lg" 
                  variant="outline"
                  onClick={resetSearch}
                >
                  Search Something Else
                </Button>
              </div>
            </div>

            {/* Why Consult Section */}
            <div className="grid gap-4 sm:grid-cols-3">
              <div className="rounded-lg bg-white p-4 border border-[#e8e4df]">
                <User className="mb-2 h-6 w-6 text-[#5c7c6b]" />
                <h4 className="font-semibold mb-1">Personalized Care</h4>
                <p className="text-sm text-[#5a5a5a]">Get treatment tailored to your specific condition and health history</p>
              </div>
              <div className="rounded-lg bg-white p-4 border border-[#e8e4df]">
                <MessageCircle className="mb-2 h-6 w-6 text-[#5c7c6b]" />
                <h4 className="font-semibold mb-1">Expert Guidance</h4>
                <p className="text-sm text-[#5a5a5a]">Licensed practitioners with years of experience in traditional medicine</p>
              </div>
              <div className="rounded-lg bg-white p-4 border border-[#e8e4df]">
                <Sparkles className="mb-2 h-6 w-6 text-[#5c7c6b]" />
                <h4 className="font-semibold mb-1">Holistic Approach</h4>
                <p className="text-sm text-[#5a5a5a]">Address root causes, not just symptoms, for lasting wellness</p>
              </div>
            </div>
          </div>
        )}

        {/* Step 6: Practitioners List */}
        {currentStep === 'practitioners' && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xl font-bold text-[#2c3e33]">
                  Available Practitioners
                </h2>
                <p className="text-sm text-[#999]">
                  {practitioners.length} practitioners available for consultation
                </p>
              </div>
              <Button variant="outline" size="sm" onClick={() => setCurrentStep('condition-info')}>
                Back
              </Button>
            </div>

            {practitioners.length > 0 ? (
              <div className="space-y-4">
                {practitioners.map((prac) => (
                  <Card 
                    key={prac.id} 
                    className="group cursor-pointer overflow-hidden border-[#e8e4df] bg-white transition-all hover:border-[#5c7c6b]/30 hover:shadow-md"
                    onClick={() => handlePractitionerClick(prac.id)}
                  >
                    <CardContent className="p-0">
                      <div className="flex flex-col sm:flex-row">
                        <div className="relative h-48 w-full bg-[#f0efe9] sm:h-auto sm:w-48">
                          {prac.photoUrl ? (
                            <Image 
                              src={prac.photoUrl} 
                              alt={prac.fullName} 
                              fill 
                              className="object-cover" 
                            />
                          ) : (
                            <div className="flex h-full w-full items-center justify-center">
                              <User className="h-12 w-12 text-[#d4cfc7]" />
                            </div>
                          )}
                        </div>
                        <div className="flex flex-1 flex-col p-5">
                          <div className="mb-2 flex items-center gap-2">
                            <Badge variant="secondary" className="bg-[#5c7c6b]/10 text-[#5c7c6b]">
                              <Stethoscope className="mr-1 h-3 w-3" />
                              {prac.specialty}
                            </Badge>
                            {prac.verified && (
                              <Badge className="bg-blue-50 text-blue-600">
                                Verified
                              </Badge>
                            )}
                          </div>
                          <h3 className="mb-1 text-lg font-semibold group-hover:text-[#5c7c6b]">
                            {prac.fullName}
                          </h3>
                          <p className="mb-3 line-clamp-2 text-sm text-[#5a5a5a]">
                            {prac.bio}
                          </p>
                          <div className="mt-auto flex items-center justify-between">
                            {prac.consultationFee && (
                              <span className="text-sm font-medium text-[#b89f6b]">
                                R{prac.consultationFee}/session
                              </span>
                            )}
                            <Button size="sm" className="bg-[#5c7c6b]">
                              Book Consultation
                              <ArrowRight className="ml-2 h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <div className="rounded-xl border border-dashed border-[#d4cfc7] bg-white p-8 text-center">
                <Stethoscope className="mx-auto mb-4 h-12 w-12 text-[#d4cfc7]" />
                <h3 className="mb-2 font-semibold">No Practitioners Available</h3>
                <p className="mb-4 text-sm text-[#999]">
                  All practitioners are currently busy. Please try again later.
                </p>
                <Button onClick={resetSearch} variant="outline">
                  Search for Different Condition
                </Button>
              </div>
            )}
          </div>
        )}

        {/* Empty State */}
        {!searchQuery && currentStep === 'input' && (
          <div className="flex flex-col items-center justify-center py-16">
            <div className="mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-[#5c7c6b]/5">
              <Search className="h-10 w-10 text-[#5c7c6b]/40" />
            </div>
            <h3 className="mb-2 text-xl font-semibold">Start Your Wellness Journey</h3>
            <p className="text-center text-[#999] max-w-md">
              Describe your symptoms or health concerns above, and our AI will guide you to the right herbal remedies or practitioners.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}