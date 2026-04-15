'use client';

import { useState } from 'react';
import Link from 'next/link';

export default function PricingPage() {
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'yearly'>('monthly');

  const plans = [
    {
      name: 'Free',
      description: 'Browse and learn',
      monthlyPrice: 0,
      yearlyPrice: 0,
      features: [
        'Browse all health conditions',
        'Read educational content',
        'View basic herb information',
        'See practitioner directory (view only)'
      ],
      unavailableFeatures: [
        'Book consultations',
        'Access community forum',
        'Personalized herb guides',
        'Direct messaging with healers'
      ],
      cta: 'Get Started',
      popular: false
    },
    {
      name: 'Premium',
      description: 'Full healing journey',
      monthlyPrice: 9,
      yearlyPrice: 90,
      features: [
        'Everything in Free',
        'Unlimited consultations',
        'Access private community forum',
        'Personalized herb protocols',
        'Direct chat with practitioners',
        'Priority booking',
        'Medicine delivery coordination',
        'Monthly wellness check-ins'
      ],
      unavailableFeatures: [],
      cta: 'Start Free Trial',
      popular: true
    },
    {
      name: 'Family',
      description: 'For households',
      monthlyPrice: 19,
      yearlyPrice: 190,
      features: [
        'Everything in Premium',
        'Up to 5 family members',
        'Family health tracking',
        'Group consultations',
        'Pediatric herbal guidance',
        'Elder care protocols',
        'Shared medicine cabinet'
      ],
      unavailableFeatures: [],
      cta: 'Choose Family',
      popular: false
    }
  ];

  return (
    <div className="min-h-screen bg-[#F5F5F0]">
      {/* Hero */}
      <div className="bg-[#2C3E2D] text-white py-16 px-4">
        <div className="max-w-6xl mx-auto text-center">
          <h1 className="text-4xl md:text-5xl font-bold mb-4">Choose Your Path to Wellness</h1>
          <p className="text-xl text-gray-300 max-w-2xl mx-auto">
            Access traditional African healing wisdom. Connect with verified practitioners. 
            Join a community on the journey to natural wellness.
          </p>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 py-12">
        {/* Billing Toggle */}
        <div className="flex justify-center mb-12">
          <div className="bg-white rounded-full p-1 shadow-md inline-flex">
            <button
              onClick={() => setBillingCycle('monthly')}
              className={`px-6 py-2 rounded-full transition-colors ${
                billingCycle === 'monthly' 
                  ? 'bg-[#97A97C] text-white' 
                  : 'text-gray-700 hover:text-[#97A97C]'
              }`}
            >
              Monthly
            </button>
            <button
              onClick={() => setBillingCycle('yearly')}
              className={`px-6 py-2 rounded-full transition-colors ${
                billingCycle === 'yearly' 
                  ? 'bg-[#97A97C] text-white' 
                  : 'text-gray-700 hover:text-[#97A97C]'
              }`}
            >
              Yearly <span className="text-xs opacity-75">(Save 15%)</span>
            </button>
          </div>
        </div>

        {/* Pricing Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-16">
          {plans.map((plan) => (
            <div 
              key={plan.name}
              className={`bg-white rounded-2xl shadow-lg overflow-hidden transition-transform hover:scale-105 ${
                plan.popular ? 'ring-4 ring-[#97A97C] relative' : ''
              }`}
            >
              {plan.popular && (
                <div className="bg-[#97A97C] text-white text-center py-2 text-sm font-bold">
                  MOST POPULAR
                </div>
              )}
              
              <div className="p-8">
                <h3 className="text-2xl font-bold text-[#2C3E2D] mb-2">{plan.name}</h3>
                <p className="text-gray-600 mb-6">{plan.description}</p>
                
                <div className="mb-6">
                  <span className="text-4xl font-bold text-[#2C3E2D]">
                    ${billingCycle === 'monthly' ? plan.monthlyPrice : plan.yearlyPrice}
                  </span>
                  <span className="text-gray-500">/{billingCycle === 'monthly' ? 'month' : 'year'}</span>
                </div>

                <button 
                  className={`w-full py-3 rounded-lg font-bold transition-colors mb-8 ${
                    plan.popular 
                      ? 'bg-[#97A97C] text-white hover:bg-[#7A8A63]' 
                      : 'bg-gray-100 text-[#2C3E2D] hover:bg-gray-200'
                  }`}
                >
                  {plan.cta}
                </button>

                <div className="space-y-3">
                  <p className="font-semibold text-[#2C3E2D]">What's included:</p>
                  {plan.features.map((feature, idx) => (
                    <div key={idx} className="flex items-start gap-3">
                      <span className="text-[#97A97C] mt-1">✓</span>
                      <span className="text-gray-700 text-sm">{feature}</span>
                    </div>
                  ))}
                  
                  {plan.unavailableFeatures.length > 0 && (
                    <>
                      <div className="border-t my-4"></div>
                      {plan.unavailableFeatures.map((feature, idx) => (
                        <div key={idx} className="flex items-start gap-3 opacity-50">
                          <span className="text-gray-400 mt-1">×</span>
                          <span className="text-gray-500 text-sm line-through">{feature}</span>
                        </div>
                      ))}
                    </>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* For Practitioners Section */}
        <div className="bg-white rounded-2xl shadow-lg p-8 md:p-12 mb-16">
          <div className="md:flex items-center gap-12">
            <div className="md:w-1/2 mb-8 md:mb-0">
              <h2 className="text-3xl font-bold text-[#2C3E2D] mb-4">
                Are You a Traditional Healer?
              </h2>
              <p className="text-gray-700 mb-6 leading-relaxed">
                Join our network of verified African traditional medicine practitioners. 
                Offer consultations, share your wisdom, and reach patients across the continent and diaspora.
              </p>
              <ul className="space-y-3 mb-6">
                <li className="flex items-center gap-3">
                  <span className="text-[#97A97C]">✓</span>
                  <span>Set your own consultation fees</span>
                </li>
                <li className="flex items-center gap-3">
                  <span className="text-[#97A97C]">✓</span>
                  <span>We handle scheduling and payments (15% platform fee)</span>
                </li>
                <li className="flex items-center gap-3">
                  <span className="text-[#97A97C]">✓</span>
                  <span>Sell your herbal preparations directly to patients</span>
                </li>
                <li className="flex items-center gap-3">
                  <span className="text-[#97A97C]">✓</span>
                  <span>Build your reputation with reviews</span>
                </li>
              </ul>
              <Link 
                href="/practitioners/apply"
                className="inline-block bg-[#2C3E2D] text-white px-8 py-3 rounded-lg font-bold hover:bg-[#3d523e] transition-colors"
              >
                Apply as Practitioner
              </Link>
            </div>
            <div className="md:w-1/2">
              <div className="bg-[#F5F5F0] p-6 rounded-lg">
                <h3 className="font-bold text-[#2C3E2D] mb-4">How Practitioner Payments Work</h3>
                <div className="space-y-4">
                  <div className="flex justify-between items-center pb-2 border-b">
                    <span className="text-gray-600">Patient pays</span>
                    <span className="font-bold">$25.00</span>
                  </div>
                  <div className="flex justify-between items-center pb-2 border-b">
                    <span className="text-gray-600">Platform fee (15%)</span>
                    <span className="text-red-600">-$3.75</span>
                  </div>
                  <div className="flex justify-between items-center pt-2">
                    <span className="text-gray-600 font-semibold">You receive</span>
                    <span className="text-[#97A97C] font-bold text-lg">$21.25</span>
                  </div>
                </div>
                <p className="text-xs text-gray-500 mt-4">
                  *Medicine sales: You keep 85% of product sales. We handle payment processing.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* FAQ Section */}
        <div className="max-w-3xl mx-auto">
          <h2 className="text-3xl font-bold text-center text-[#2C3E2D] mb-8">Common Questions</h2>
          <div className="space-y-4">
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="font-bold text-[#2C3E2D] mb-2">Can I cancel my subscription anytime?</h3>
              <p className="text-gray-600">Yes, you can cancel anytime. Your access continues until the end of your billing period. No refunds for partial months.</p>
            </div>
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="font-bold text-[#2C3E2D] mb-2">Are the practitioners medically certified?</h3>
              <p className="text-gray-600">Our practitioners are verified traditional healers with documented experience. "Verified" means we've checked their credentials and background. They are not necessarily Western medical doctors unless specified.</p>
            </div>
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="font-bold text-[#2C3E2D] mb-2">Is herbal medicine safe?</h3>
              <p className="text-gray-600">Herbal medicine has been used for thousands of years, but herbs can interact with medications and have side effects. Always disclose all medications to your practitioner and consult your doctor.</p>
            </div>
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="font-bold text-[#2C3E2D] mb-2">How does medicine delivery work?</h3>
              <p className="text-gray-600">After consultation, the practitioner prepares your herbal formulation. You arrange payment and delivery directly with them. We recommend starting with video consultations to establish trust.</p>
            </div>
          </div>
        </div>

        {/* Trust Badges */}
        <div className="mt-16 grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
          <div>
            <div className="text-3xl mb-2">🔒</div>
            <p className="text-sm font-semibold text-[#2C3E2D]">Secure Payments</p>
          </div>
          <div>
            <div className="text-3xl mb-2">✓</div>
            <p className="text-sm font-semibold text-[#2C3E2D]">Verified Healers</p>
          </div>
          <div>
            <div className="text-3xl mb-2">💬</div>
            <p className="text-sm font-semibold text-[#2C3E2D]">24/7 Support</p>
          </div>
          <div>
            <div className="text-3xl mb-2">🌍</div>
            <p className="text-sm font-semibold text-[#2C3E2D]">African Owned</p>
          </div>
        </div>
      </div>
    </div>
  );
}