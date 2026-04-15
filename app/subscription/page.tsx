'use client';

import { useAuth } from '@/providers/AuthProvider';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Check, Crown, Leaf, Sparkles } from 'lucide-react';
import { useRouter } from 'next/navigation';

const plans = [
  {
    name: 'Free',
    price: 0,
    period: 'forever',
    description: 'Basic access to herbal knowledge',
    features: [
      'Browse herb database',
      'View names and images',
      'Read historical information',
      'Basic search',
    ],
    tier: 'free',
    color: 'bg-gray-100',
  },
  {
    name: 'Premium',
    price: 2500,
    period: 'month',
    description: 'Unlock full healing potential',
    features: [
      'Everything in Free',
      'Preparation guides',
      'Side effects info',
      'Dosage recommendations',
    ],
    popular: true,
    tier: 'premium',
    color: 'bg-[#97A97C]/10',
  },
  {
    name: 'Premium Pro',
    price: 5000,
    period: 'month',
    description: 'For serious practitioners',
    features: [
      'Everything in Premium',
      'Community forum',
      'AI plant ID',
      'Expert consultations',
    ],
    tier: 'premium_pro',
    color: 'bg-[#B8860B]/10',
  },
];

export default function SubscriptionPage() {
  const { user, profile } = useAuth();
  const router = useRouter();
  const currentTier = profile?.subscriptionTier || 'free';

  const handleSubscribe = (tier: string) => {
    if (!user) {
      router.push('/login?redirect=/subscription');
      return;
    }
    alert(`This would connect to Paystack for ${tier} subscription`);
  };

  return (
    <div className="container mx-auto px-4 py-12 max-w-6xl">
      <div className="text-center mb-12">
        <h1 className="text-4xl font-bold text-[#2C3E2D] mb-4">Choose Your Path</h1>
        <p className="text-lg text-gray-600 max-w-2xl mx-auto">
          Unlock deeper knowledge of African herbal traditions.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {plans.map((plan) => (
          <Card 
            key={plan.tier} 
            className={`relative overflow-hidden ${plan.color} border-2 ${
              currentTier === plan.tier ? 'border-[#97A97C]' : 'border-transparent'
            }`}
          >
            {plan.popular && (
              <div className="absolute top-0 right-0 bg-[#B8860B] text-white px-3 py-1 text-xs font-bold rounded-bl-lg">
                POPULAR
              </div>
            )}
            
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                {plan.tier === 'premium_pro' && <Crown className="h-5 w-5 text-[#B8860B]" />}
                {plan.tier === 'premium' && <Sparkles className="h-5 w-5 text-[#97A97C]" />}
                {plan.tier === 'free' && <Leaf className="h-5 w-5 text-gray-500" />}
                {plan.name}
              </CardTitle>
              <div className="mt-2">
                <span className="text-3xl font-bold text-[#2C3E2D]">
                  {plan.price === 0 ? 'Free' : `₦${plan.price.toLocaleString()}`}
                </span>
                {plan.price > 0 && <span className="text-gray-500">/{plan.period}</span>}
              </div>
              <p className="text-sm text-gray-600 mt-2">{plan.description}</p>
            </CardHeader>
            
            <CardContent className="space-y-4">
              <div className="space-y-2">
                {plan.features.map((feature, idx) => (
                  <div key={idx} className="flex items-start gap-2">
                    <Check className="h-4 w-4 text-[#97A97C] mt-0.5 flex-shrink-0" />
                    <span className="text-sm text-gray-700">{feature}</span>
                  </div>
                ))}
              </div>
              
              <Button
                className={`w-full mt-4 ${
                  plan.tier === 'premium' 
                    ? 'bg-[#97A97C] hover:bg-[#7A8A63]' 
                    : plan.tier === 'premium_pro'
                    ? 'bg-[#B8860B] hover:bg-[#9A7009]'
                    : 'border-[#97A97C] text-[#97A97C] hover:bg-[#97A97C]/10'
                }`}
                variant={plan.price === 0 ? 'outline' : 'default'}
                disabled={currentTier === plan.tier}
                onClick={() => handleSubscribe(plan.tier)}
              >
                {currentTier === plan.tier ? 'Current Plan' : plan.price === 0 ? 'Get Started' : 'Subscribe'}
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}