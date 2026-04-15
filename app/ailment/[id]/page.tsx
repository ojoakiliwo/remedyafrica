'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '@/lib/firebase/client';
import { getAilmentById, AilmentData } from '@/lib/data/ailments';

interface Herb {
    id: string;
    name: string;
    description: string;
    images: string[];
    category: string;
}

export default function AilmentDetailPage() {
    const params = useParams();
    const router = useRouter();
    const ailmentId = params.id as string;

    const [ailment, setAilment] = useState<AilmentData | null>(null);
    const [availableHerbs, setAvailableHerbs] = useState<Herb[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadAilmentData();
    }, [ailmentId]);

    const loadAilmentData = async () => {
        setLoading(true);
        try {
            // Get static data first
            const staticAilment = getAilmentById(ailmentId);

            if (staticAilment) {
                setAilment(staticAilment);

                // Check which herbs are actually available in database
                const herbsQuery = query(
                    collection(db, 'herbs'),
                    where('ailments', 'array-contains', staticAilment.name)
                );
                const herbsSnapshot = await getDocs(herbsQuery);

                const herbs = herbsSnapshot.docs.map(doc => ({
                    id: doc.id,
                    ...doc.data()
                })) as Herb[];

                setAvailableHerbs(herbs);
            }
        } catch (error) {
            console.error('Error loading ailment:', error);
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
                <div className="text-[#97A97C] text-xl">Loading...</div>
            </div>
        );
    }

    if (!ailment) {
        return (
            <div className="min-h-screen bg-[#F5F5F0] flex items-center justify-center">
                <div className="text-center">
                    <h1 className="text-2xl font-bold text-[#2C3E2D] mb-4">Condition not found</h1>
                    <Link href="/" className="text-[#97A97C] hover:underline">Return to Home</Link>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-[#F5F5F0]">
            {/* Breadcrumb */}
            <div className="bg-white shadow-sm">
                <div className="max-w-4xl mx-auto px-4 py-4">
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                        <Link href="/" className="hover:text-[#97A97C]">Home</Link>
                        <span>→</span>
                        <Link href={`/category/${ailment.category}`} className="hover:text-[#97A97C] capitalize">
                            {ailment.categoryLabel}
                        </Link>
                        <span>→</span>
                        <span className="text-[#2C3E2D] font-semibold">{ailment.name}</span>
                    </div>
                </div>
            </div>

            <div className="max-w-4xl mx-auto px-4 py-12">
                {/* Header */}
                <div className="mb-8">
                    <div className="flex items-center gap-3 mb-4">
                        <h1 className="text-4xl font-bold text-[#2C3E2D]">{ailment.name}</h1>
                        {ailment.commonInAfrica && (
                            <span className="bg-[#97A97C] text-white px-3 py-1 rounded-full text-sm">
                                Common in Africa
                            </span>
                        )}
                    </div>
                    <p className="text-lg text-gray-700 leading-relaxed">{ailment.description}</p>
                </div>

                {/* Symptoms Section */}
                <div className="bg-white rounded-lg shadow-md p-8 mb-8">
                    <h2 className="text-2xl font-bold text-[#2C3E2D] mb-6 flex items-center gap-2">
                        <span className="text-[#97A97C]">🩺</span> Common Symptoms
                    </h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        {ailment.symptoms.map((symptom, index) => (
                            <div key={index} className="flex items-center gap-3 p-3 bg-[#F5F5F0] rounded-lg">
                                <span className="w-2 h-2 bg-[#97A97C] rounded-full flex-shrink-0"></span>
                                <span className="text-gray-700">{symptom}</span>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Medical Disclaimer - Prominent */}
                <div className="bg-red-50 border-2 border-red-500 rounded-lg p-8 mb-8">
                    <h3 className="text-red-800 font-bold mb-4 flex items-center gap-2 text-xl">
                        <span>⚠️</span> Medical Disclaimer & Diagnosis Warning
                    </h3>
                    <p className="text-red-700 leading-relaxed mb-4 text-lg">
                        {ailment.medicalDisclaimer}
                    </p>
                    <div className="bg-white p-6 rounded-lg border border-red-200">
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

                {/* Find Remedies Section */}
                <div className="bg-[#2C3E2D] rounded-lg p-8 text-center text-white mb-8">
                    <h2 className="text-2xl font-bold mb-4">Ready to Explore Traditional Remedies?</h2>
                    <p className="text-gray-300 mb-6 max-w-2xl mx-auto">
                        Discover African herbs traditionally used for {ailment.name.toLowerCase()}.
                        These are complementary treatments and should not replace medical care.
                    </p>

                    {availableHerbs.length > 0 ? (
                        <div className="mb-6">
                            <p className="text-[#97A97C] font-semibold mb-2">
                                ✓ {availableHerbs.length} remedy{availableHerbs.length !== 1 ? 'ies' : 'y'} available in database
                            </p>
                            <button
                                onClick={handleFindRemedies}
                                className="bg-[#97A97C] text-white px-8 py-4 rounded-lg font-bold text-lg hover:bg-[#7A8A63] transition-colors inline-flex items-center gap-2"
                            >
                                <span>🌿</span> View Available Remedies
                            </button>
                        </div>
                    ) : (
                        <div className="mb-6">
                            <p className="text-yellow-400 font-semibold mb-4">
                                ⚠️ No herbal remedies available for this condition yet
                            </p>
                            <p className="text-gray-400 text-sm mb-4">
                                We're curating traditional remedies. Please check back soon or consult a traditional healer.
                            </p>
                            <button
                                disabled
                                className="bg-gray-600 text-gray-400 px-8 py-4 rounded-lg font-bold text-lg cursor-not-allowed"
                            >
                                <span>🌿</span> Remedies Coming Soon
                            </button>
                        </div>
                    )}
                </div>

                {/* Traditional Knowledge Note */}
                <div className="bg-[#F5F5F0] border-l-4 border-[#97A97C] p-6 mb-8">
                    <h3 className="font-bold text-[#2C3E2D] mb-2">🌍 Traditional African Medicine</h3>
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
                        className="flex-1 bg-white p-4 rounded-lg shadow hover:shadow-md transition-shadow text-center font-semibold text-[#97A97C]"
                    >
                        ← Back to {ailment.categoryLabel}
                    </Link>
                    <Link
                        href="/"
                        className="flex-1 bg-white p-4 rounded-lg shadow hover:shadow-md transition-shadow text-center font-semibold text-[#97A97C]"
                    >
                        🏠 Back to Home
                    </Link>
                </div>
            </div>
        </div>
    );
}