'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '@/lib/firebase/client';
import { getAilmentById, AilmentData } from '@/lib/data/ailments';
import { 
  Leaf, 
  ArrowLeft, 
  Home, 
  AlertTriangle,
  Stethoscope,
  Globe,
  Loader2,
  ExternalLink
} from 'lucide-react';

interface Herb {
    id: string;
    name: string;
    scientificName: string;
    description: string;
    images: { url: string }[] | string[];
    category: string;
    benefits: string[] | string;
    ailments: string[] | string;
    origin: string;
    partsUsed: string;
}

export default function AilmentDetailPage() {
    const params = useParams();
    const router = useRouter();
    const ailmentId = params.id as string;

    const [ailment, setAilment] = useState<AilmentData | null>(null);
    const [availableHerbs, setAvailableHerbs] = useState<Herb[]>([]);
    const [loading, setLoading] = useState(true);
    const [debugInfo, setDebugInfo] = useState('');

    useEffect(() => {
        loadAilmentData();
    }, [ailmentId]);

    const loadAilmentData = async () => {
        setLoading(true);
        setDebugInfo('');
        try {
            const staticAilment = getAilmentById(ailmentId);

            if (!staticAilment) {
                setAilment(null);
                setLoading(false);
                return;
            }

            setAilment(staticAilment);

            // Fetch ALL herbs from Firestore - we filter client-side to handle
            // both array and string formats in benefits/ailments fields
            const herbsSnapshot = await getDocs(collection(db, 'herbs'));
            const allHerbs = herbsSnapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            })) as Herb[];

            // Filter herbs that match this ailment
            // Check both 'ailments' and 'benefits' fields
            const matchingHerbs = allHerbs.filter(herb => {
                const ailmentName = staticAilment.name.toLowerCase();
                const ailmentNameSingular = ailmentName.replace(/s$/, '');
                
                // Helper to check if a field contains the ailment
                const fieldMatches = (field: string[] | string | undefined): boolean => {
                    if (!field) return false;
                    
                    // If it's an array
                    if (Array.isArray(field)) {
                        return field.some(item => 
                            item.toLowerCase().includes(ailmentName) || 
                            item.toLowerCase().includes(ailmentNameSingular) ||
                            ailmentName.includes(item.toLowerCase())
                        );
                    }
                    
                    // If it's a string (semicolon-separated or single)
                    if (typeof field === 'string') {
                        const items = field.split(/[;,]/).map(s => s.trim().toLowerCase());
                        return items.some(item => 
                            item.includes(ailmentName) || 
                            item.includes(ailmentNameSingular) ||
                            ailmentName.includes(item)
                        );
                    }
                    
                    return false;
                };

                // Also check if herb category matches the ailment category
                const categoryMatch = herb.category === staticAilment.category;
                
                // Check benefits, ailments, and description
                const benefitsMatch = fieldMatches(herb.benefits);
                const ailmentsMatch = fieldMatches(herb.ailments);
                const descriptionMatch = herb.description?.toLowerCase().includes(ailmentName);
                const nameMatch = herb.name?.toLowerCase().includes(ailmentName);
                
                return benefitsMatch || ailmentsMatch || descriptionMatch || (categoryMatch && nameMatch);
            });

            setDebugInfo(`Found ${matchingHerbs.length} matching herbs out of ${allHerbs.length} total`);
            setAvailableHerbs(matchingHerbs);
        } catch (error) {
            console.error('Error loading ailment:', error);
            setDebugInfo('Error: ' + (error as Error).message);
        } finally {
            setLoading(false);
        }
    };

    const handleFindRemedies = () => {
        router.push(`/herbs?ailment=${ailmentId}&name=${encodeURIComponent(ailment?.name || '')}`);
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-[#F5F5F0] flex items-center justify-center">
                <div className="text-center">
                    <Loader2 className="w-12 h-12 text-[#97A97C] animate-spin mx-auto mb-4" />
                    <p className="text-[#2C3E2D] text-lg">Loading remedies...</p>
                </div>
            </div>
        );
    }

    if (!ailment) {
        return (
            <div className="min-h-screen bg-[#F5F5F0] flex items-center justify-center">
                <div className="text-center max-w-md mx-auto p-8">
                    <div className="w-20 h-20 bg-[#97A97C]/10 rounded-full flex items-center justify-center mx-auto mb-6">
                        <Leaf className="w-10 h-10 text-[#97A97C]" />
                    </div>
                    <h1 className="text-2xl font-bold text-[#2C3E2D] mb-4">Condition not found</h1>
                    <p className="text-gray-600 mb-6">We couldn&apos;t find information about this condition in our database.</p>
                    <Link href="/" className="inline-flex items-center gap-2 text-[#97A97C] hover:text-[#7A8A63] font-semibold">
                        <Home className="w-4 h-4" />
                        Return to Home
                    </Link>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-[#F5F5F0]">
            {/* Header with Logo */}
            <div className="bg-white shadow-sm border-b border-[#97A97C]/20">
                <div className="max-w-4xl mx-auto px-4 py-4">
                    <div className="flex items-center justify-between">
                        <Link href="/" className="flex items-center gap-3">
                            <Image 
                                src="/logo.png" 
                                alt="RemedyAfrica" 
                                width={40} 
                                height={40}
                                className="rounded-lg"
                                onError={(e) => {
                                    const target = e.target as HTMLImageElement;
                                    target.src = '/favicon.ico';
                                }}
                            />
                            <span className="font-bold text-[#2C3E2D] text-lg hidden sm:block">RemedyAfrica</span>
                        </Link>
                        <div className="flex items-center gap-2 text-sm text-gray-600">
                            <Link href="/" className="hover:text-[#97A97C] transition-colors">Home</Link>
                            <span className="text-gray-400">/</span>
                            <Link href={`/category/${ailment.category}`} className="hover:text-[#97A97C] capitalize transition-colors">
                                {ailment.categoryLabel}
                            </Link>
                            <span className="text-gray-400">/</span>
                            <span className="text-[#2C3E2D] font-semibold">{ailment.name}</span>
                        </div>
                    </div>
                </div>
            </div>

            <div className="max-w-4xl mx-auto px-4 py-12">
                {/* Hero Section */}
                <div className="mb-10">
                    <div className="flex items-center gap-3 mb-4">
                        <div className="p-3 bg-[#97A97C]/10 rounded-xl">
                            <Stethoscope className="w-8 h-8 text-[#97A97C]" />
                        </div>
                        <div>
                            <h1 className="text-4xl font-bold text-[#2C3E2D]">{ailment.name}</h1>
                            {ailment.commonInAfrica && (
                                <span className="inline-flex items-center gap-1 bg-[#97A97C] text-white px-3 py-1 rounded-full text-sm mt-1">
                                    <Globe className="w-3 h-3" />
                                    Common in Africa
                                </span>
                            )}
                        </div>
                    </div>
                    <p className="text-lg text-gray-700 leading-relaxed max-w-2xl">{ailment.description}</p>
                </div>

                {/* Symptoms Section */}
                <div className="bg-white rounded-2xl shadow-md p-8 mb-8 border border-[#97A97C]/10">
                    <h2 className="text-2xl font-bold text-[#2C3E2D] mb-6 flex items-center gap-2">
                        <span className="text-[#97A97C]">🩺</span> Common Symptoms
                    </h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        {(ailment.symptoms || []).map((symptom, index) => (
                            <div key={index} className="flex items-center gap-3 p-3 bg-[#F5F5F0] rounded-lg border border-[#97A97C]/10">
                                <span className="w-2 h-2 bg-[#97A97C] rounded-full flex-shrink-0"></span>
                                <span className="text-gray-700">{symptom}</span>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Medical Disclaimer */}
                <div className="bg-red-50 border-2 border-red-400 rounded-2xl p-8 mb-8">
                    <h3 className="text-red-800 font-bold mb-4 flex items-center gap-2 text-xl">
                        <AlertTriangle className="w-6 h-6" />
                        Medical Disclaimer & Diagnosis Warning
                    </h3>
                    <p className="text-red-700 leading-relaxed mb-4 text-lg">
                        {ailment.medicalDisclaimer}
                    </p>
                    <div className="bg-white p-6 rounded-xl border border-red-200">
                        <p className="text-red-800 font-bold mb-2 text-lg">⚕️ Consult a Healthcare Provider</p>
                        <p className="text-red-700 mb-4">
                            We strongly recommend laboratory tests and professional medical evaluation to confirm your condition
                            before starting any treatment. Self-diagnosis can be dangerous and may delay proper treatment.
                        </p>
                        <ul className="list-disc list-inside text-red-700 space-y-1">
                            <li>Visit a licensed medical practitioner</li>
                            <li>Get proper laboratory tests</li>
                            <li>Confirm diagnosis before treatment</li>
                            <li>Discuss herbal remedies with your doctor</li>
                        </ul>
                    </div>
                </div>

                {/* Remedies Section */}
                <div className="bg-[#2C3E2D] rounded-2xl p-8 text-center text-white mb-8">
                    <h2 className="text-2xl font-bold mb-4">Ready to Explore Traditional Remedies?</h2>
                    <p className="text-gray-300 mb-6 max-w-2xl mx-auto">
                        Discover African herbs traditionally used for {ailment.name.toLowerCase()}.
                        These are complementary treatments and should not replace medical care.
                    </p>

                    {availableHerbs.length > 0 ? (
                        <div className="space-y-6">
                            <p className="text-[#97A97C] font-semibold">
                                ✓ {availableHerbs.length} remedy{availableHerbs.length !== 1 ? 'ies' : 'y'} available
                            </p>
                            
                            {/* Herb Cards Grid */}
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 text-left">
                                {availableHerbs.map((herb) => (
                                    <Link 
                                        key={herb.id} 
                                        href={`/herb/${herb.id}`}
                                        className="bg-white/10 backdrop-blur-sm rounded-xl p-4 hover:bg-white/20 transition-all duration-300 group border border-white/10"
                                    >
                                        <div className="flex items-start gap-3">
                                            <div className="w-12 h-12 rounded-lg bg-[#97A97C]/20 flex items-center justify-center flex-shrink-0 overflow-hidden">
                                                {herb.images && herb.images.length > 0 ? (
                                                    <img 
                                                        src={typeof herb.images[0] === 'string' ? herb.images[0] : (herb.images[0] as any)?.url || ''} 
                                                        alt={herb.name}
                                                        className="w-full h-full object-cover"
                                                    />
                                                ) : (
                                                    <Leaf className="w-6 h-6 text-[#97A97C]" />
                                                )}
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <h3 className="font-bold text-white group-hover:text-[#97A97C] transition-colors truncate">
                                                    {herb.name}
                                                </h3>
                                                <p className="text-xs text-gray-400 italic truncate">{herb.scientificName}</p>
                                                <p className="text-sm text-gray-300 mt-1 line-clamp-2">{herb.description}</p>
                                                <div className="flex items-center gap-1 mt-2 text-[#97A97C] text-xs">
                                                    <ExternalLink className="w-3 h-3" />
                                                    <span>View details</span>
                                                </div>
                                            </div>
                                        </div>
                                    </Link>
                                ))}
                            </div>

                            <button
                                onClick={handleFindRemedies}
                                className="bg-[#97A97C] text-white px-8 py-4 rounded-xl font-bold text-lg hover:bg-[#7A8A63] transition-colors inline-flex items-center gap-2 mt-4"
                            >
                                <Leaf className="w-5 h-5" />
                                View All Remedies
                            </button>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            <div className="bg-white/5 rounded-xl p-6 border border-white/10">
                                <Leaf className="w-12 h-12 text-[#97A97C]/50 mx-auto mb-3" />
                                <p className="text-yellow-400 font-semibold mb-2">
                                    No herbal remedies matched for &quot;{ailment.name}&quot;
                                </p>
                                <p className="text-gray-400 text-sm">
                                    We&apos;re curating traditional remedies. Try browsing by category or search for related conditions.
                                </p>
                                {process.env.NODE_ENV === 'development' && debugInfo && (
                                    <p className="text-xs text-gray-500 mt-2 font-mono">{debugInfo}</p>
                                )}
                            </div>
                            <div className="flex flex-col sm:flex-row gap-3 justify-center">
                                <Link 
                                    href={`/category/${ailment.category}`}
                                    className="inline-flex items-center gap-2 bg-white/10 text-white px-6 py-3 rounded-lg hover:bg-white/20 transition-colors"
                                >
                                    <ArrowLeft className="w-4 h-4" />
                                    Browse {ailment.categoryLabel}
                                </Link>
                                <Link 
                                    href="/search"
                                    className="inline-flex items-center gap-2 bg-[#97A97C] text-white px-6 py-3 rounded-lg hover:bg-[#7A8A63] transition-colors"
                                >
                                    <Leaf className="w-4 h-4" />
                                    AI Search
                                </Link>
                            </div>
                        </div>
                    )}
                </div>

                {/* Traditional Knowledge Note */}
                <div className="bg-[#F5F5F0] border-l-4 border-[#97A97C] p-6 mb-8 rounded-r-xl">
                    <h3 className="font-bold text-[#2C3E2D] mb-2 flex items-center gap-2">
                        <Globe className="w-5 h-5 text-[#97A97C]" />
                        Traditional African Medicine
                    </h3>
                    <p className="text-gray-700">
                        Many African communities have traditional knowledge of plants used for {ailment.name.toLowerCase()}.
                        These remedies have been passed down through generations and are now being studied by modern science.
                        Always ensure herbs are sourced sustainably and prepared correctly.
                    </p>
                </div>

                {/* Navigation */}
                <div className="flex flex-col sm:flex-row gap-4">
                    <Link
                        href={`/category/${ailment.category}`}
                        className="flex-1 bg-white p-4 rounded-xl shadow hover:shadow-md transition-shadow text-center font-semibold text-[#97A97C] border border-[#97A97C]/20 flex items-center justify-center gap-2"
                    >
                        <ArrowLeft className="w-4 h-4" />
                        Back to {ailment.categoryLabel}
                    </Link>
                    <Link
                        href="/"
                        className="flex-1 bg-white p-4 rounded-xl shadow hover:shadow-md transition-shadow text-center font-semibold text-[#97A97C] border border-[#97A97C]/20 flex items-center justify-center gap-2"
                    >
                        <Home className="w-4 h-4" />
                        Back to Home
                    </Link>
                </div>
            </div>
        </div>
    );
}