'use client';

import { useEffect, useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Check, Sparkles, Shield, ArrowLeft, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

const PLANS = [
  {
    id: 'basic',
    name: 'Basic',
    price: 99,
    period: 'month',
    description: 'Perfect for occasional consultations',
    features: [
      '2 practitioner consultations/month',
      'Access to herbal remedy database',
      'Basic health articles',
      'Email support'
    ],
    popular: false
  },
  {
    id: 'premium',
    name: 'Premium',
    price: 199,
    period: 'month',
    description: 'Best for regular health support',
    features: [
      'Unlimited consultations',
      'Priority booking with top practitioners',
      'Full access to herbal database + AI search',
      'Video consultations included',
      '24/7 chat support',
      'Personalized wellness plans'
    ],
    popular: true
  },
  {
    id: 'family',
    name: 'Family',
    price: 349,
    period: 'month',
    description: 'For families up to 4 members',
    features: [
      'Everything in Premium',
      'Up to 4 family members',
      'Family health tracking',
      'Pediatric consultations',
      'Shared wellness plans',
      'Emergency consultation priority'
    ],
    popular: false
  }
];

export default function SubscribePage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user, loading: authLoading } = useAuth();
  
  const redirect = searchParams.get('redirect') || 'search';
  const reason = searchParams.get('reason') || '';
  
  const [selectedPlan, setSelectedPlan] = useState<string | null>(null);
  const [processing, setProcessing] = useState(false);

  useEffect(() => {
    if (!authLoading && !user) {
      toast.error('Please login first');
      router.push(`/login?redirect=${encodeURIComponent(window.location.pathname + window.location.search)}`);
    }
  }, [user, authLoading, router]);

  const handleSubscribe = async (planId: string) => {
    if (!user) {
      toast.error('Please login first');
      return;
    }

    setSelectedPlan(planId);
    setProcessing(true);

    try {
      // Here you would integrate with your payment provider (Paystack, Stripe, etc.)
      // For now, we'll simulate a successful subscription
      
      await new Promise(resolve => setTimeout(resolve, 1500)); // Simulate API call
      
      toast.success('Subscription activated successfully!');
      
      // Redirect back to the original page
      if (redirect === 'search') {
        router.push('/search');
      } else if (redirect === 'practitioners') {
        router.push('/practitioners');
      } else {
        router.push('/' + redirect);
      }
    } catch (error) {
      toast.error('Failed to process subscription. Please try again.');
    } finally {
      setProcessing(false);
      setSelectedPlan(null);
    }
  };

  if (authLoading) {
    return (
      <div className="min-h-screen bg-[#faf9f7] flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-[#5c7c6b]" />
      </div>
    );
  }

  if (!user) {
    return null; // Will redirect
  }

  return (
    <div className="min-h-screen bg-[#faf9f7]">
      {/* Header */}
      <div className="bg-white border-b border-[#e8e4df]">
        <div className="max-w-6xl mx-auto px-4 py-6">
          <div className="flex items-center gap-4">
            <Link href="/search">
              <Button variant="ghost" size="icon">
                <ArrowLeft className="h-5 w-5" />
              </Button>
            </Link>
            <div>
              <h1 className="text-2xl font-bold text-[#2c3e33]">Choose Your Plan</h1>
              <p className="text-sm text-[#5a5a5a]">
                {reason === 'practitioner' 
                  ? 'Subscribe to consult with our verified practitioners'
                  : 'Unlock full access to RemedyAfrica features'}
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 py-12">
        {/* Value Proposition */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-2 bg-[#b89f6b]/10 text-[#b89f6b] px-4 py-2 rounded-full text-sm font-medium mb-4">
            <Sparkles className="h-4 w-4" />
            Unlock Premium Health Support
          </div>
          <h2 className="text-3xl font-bold text-[#2c3e33] mb-4">
            Invest in Your Wellness Journey
          </h2>
          <p className="text-[#5a5a5a] max-w-2xl mx-auto">
            Get unlimited access to verified traditional medicine practitioners, 
            personalized herbal recommendations, and holistic health support.
          </p>
        </div>

        {/* Pricing Cards */}
        <div className="grid md:grid-cols-3 gap-8 mb-12">
          {PLANS.map((plan) => (
            <Card 
              key={plan.id}
              className={`relative overflow-hidden transition-all hover:shadow-lg ${
                plan.popular ? 'border-[#b89f6b] border-2 shadow-md' : 'border-[#e8e4df]'
              }`}
            >
              {plan.popular && (
                <div className="absolute top-0 right-0 bg-[#b89f6b] text-white text-xs font-medium px-3 py-1 rounded-bl-lg">
                  Most Popular
                </div>
              )}
              
              <CardHeader className="pb-4">
                <CardTitle className="text-xl font-bold text-[#2c3e33]">
                  {plan.name}
                </CardTitle>
                <p className="text-sm text-[#5a5a5a] mt-1">{plan.description}</p>
                <div className="mt-4">
                  <span className="text-4xl font-bold text-[#2c3e33]">R{plan.price}</span>
                  <span className="text-[#5a5a5a]">/{plan.period}</span>
                </div>
              </CardHeader>
              
              <CardContent>
                <ul className="space-y-3 mb-6">
                  {plan.features.map((feature, idx) => (
                    <li key={idx} className="flex items-start gap-2 text-sm">
                      <Check className="h-4 w-4 text-[#5c7c6b] mt-0.5 flex-shrink-0" />
                      <span className="text-[#5a5a5a]">{feature}</span>
                    </li>
                  ))}
                </ul>
                
                <Button 
                  className={`w-full ${
                    plan.popular 
                      ? 'bg-[#b89f6b] hover:bg-[#a08a5a] text-white' 
                      : 'bg-[#5c7c6b] hover:bg-[#4a6354] text-white'
                  }`}
                  disabled={processing}
                  onClick={() => handleSubscribe(plan.id)}
                >
                  {processing && selectedPlan === plan.id ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Processing...
                    </>
                  ) : (
                    'Subscribe Now'
                  )}
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Trust Badges */}
        <div className="grid md:grid-cols-3 gap-6 text-center">
          <div className="flex flex-col items-center">
            <div className="w-12 h-12 bg-[#5c7c6b]/10 rounded-full flex items-center justify-center mb-3">
              <Shield className="h-6 w-6 text-[#5c7c6b]" />
            </div>
            <h3 className="font-semibold text-[#2c3e33] mb-1">Secure Payments</h3>
            <p className="text-sm text-[#5a5a5a]">Protected by industry-leading encryption</p>
          </div>
          <div className="flex flex-col items-center">
            <div className="w-12 h-12 bg-[#5c7c6b]/10 rounded-full flex items-center justify-center mb-3">
              <Check className="h-6 w-6 text-[#5c7c6b]" />
            </div>
            <h3 className="font-semibold text-[#2c3e33] mb-1">Cancel Anytime</h3>
            <p className="text-sm text-[#5a5a5a]">No long-term contracts, flexible subscriptions</p>
          </div>
          <div className="flex flex-col items-center">
            <div className="w-12 h-12 bg-[#5c7c6b]/10 rounded-full flex items-center justify-center mb-3">
              <Sparkles className="h-6 w-6 text-[#5c7c6b]" />
            </div>
            <h3 className="font-semibold text-[#2c3e33] mb-1">Verified Practitioners</h3>
            <p className="text-sm text-[#5a5a5a]">All healers are thoroughly vetted</p>
          </div>
        </div>

        {/* FAQ or Additional Info */}
        <div className="mt-12 text-center">
          <p className="text-sm text-[#5a5a5a]">
            Have questions?{' '}
            <Link href="/contact" className="text-[#5c7c6b] hover:underline">
              Contact our support team
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}