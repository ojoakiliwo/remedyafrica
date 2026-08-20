'use client';

import { useSubscription } from '@/providers/SubscriptionProvider';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Lock, Crown, MessageSquare } from 'lucide-react';

export function SubscriptionGate({ 
  children, 
  requiredTier = 'premium_pro',
  featureName = 'this feature'
}: { 
  children: React.ReactNode; 
  requiredTier?: 'premium' | 'premium_pro';
  featureName?: string;
}) {
  const { tier, isPremium, isPremiumPro } = useSubscription();
  
  const hasAccess = requiredTier === 'premium_pro' 
    ? isPremiumPro 
    : isPremium;

  if (hasAccess) {
    return <>{children}</>;
  }

  return (
    <div className="min-h-[70vh] flex items-center justify-center px-4 py-20">
      <div className="max-w-md w-full text-center">
        <div className="w-20 h-20 bg-amber-100 rounded-full flex items-center justify-center mx-auto mb-6">
          <Lock className="w-10 h-10 text-amber-600" />
        </div>
        <h2 className="text-3xl font-bold text-[#2C3E2D] mb-3">Premium Access Required</h2>
        <p className="text-gray-600 mb-2">
          {featureName} is available on a paid season. Healer unlocks the forum. Premium includes two healer visits a month.
        </p>
        <p className="text-sm text-gray-500 mb-8">
          Your current plan: <span className="font-semibold capitalize">{tier}</span>
        </p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Link href="/subscription">
            <Button className="bg-[#97A97C] hover:bg-[#7A8A63] text-white px-8">
              <Crown className="w-4 h-4 mr-2" />
              Upgrade Now
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}