'use client';

import { useSubscription } from '@/providers/SubscriptionProvider';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Lock, Crown } from 'lucide-react';

export function SubscriptionGate({
  children,
  requiredTier = 'premium',
  featureName = 'this feature'
}: {
  children: React.ReactNode;
  requiredTier?: 'premium' | 'premium_pro';
  featureName?: string;
}) {
  const { isPremium, isPremiumPro } = useSubscription();

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
        <h2 className="text-3xl font-bold text-[#2C3E2D] mb-3">This is for members</h2>
        <p className="text-gray-600 mb-2">
          {featureName} comes with a paid plan — talk to a healer, don&apos;t just browse the plants.
        </p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center mt-8">
          <Link href="/subscription">
            <Button className="bg-[#97A97C] hover:bg-[#7A8A63] text-white px-8">
              <Crown className="w-4 h-4 mr-2" />
              See care plans
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
