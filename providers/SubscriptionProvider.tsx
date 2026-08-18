'use client';

import { createContext, useContext, ReactNode } from 'react';
import { useAuth } from './AuthProvider';

export type SubscriptionTier = 'free' | 'basic' | 'premium' | 'healer' | 'premium_pro';

export interface SubscriptionContextType {
  tier: SubscriptionTier;
  isPremium: boolean;
  isPremiumPro: boolean;
  canAccessPrescription: boolean;
  canAccessSideEffects: boolean;
  canAccessForum: boolean;
  canAccessPractitioners: boolean;
}

const SubscriptionContext = createContext<SubscriptionContextType | undefined>(undefined);

function normalizeTier(raw?: string): SubscriptionTier {
  if (raw === 'basic' || raw === 'premium' || raw === 'healer' || raw === 'premium_pro') {
    return raw;
  }
  return 'free';
}

export function SubscriptionProvider({ children }: { children: ReactNode }) {
  const { profile } = useAuth();

  const tier = normalizeTier(profile?.subscriptionTier);
  const isPremium =
    tier === 'basic' || tier === 'premium' || tier === 'healer' || tier === 'premium_pro';
  const isPremiumPro = tier === 'healer' || tier === 'premium_pro';

  const canAccessPrescription = isPremium;
  // Safety notes are never a paywall. Locking cautions trains people to guess.
  const canAccessSideEffects = true;
  const canAccessForum = isPremium;
  const canAccessPractitioners = isPremium;

  return (
    <SubscriptionContext.Provider value={{
      tier,
      isPremium,
      isPremiumPro,
      canAccessPrescription,
      canAccessSideEffects,
      canAccessForum,
      canAccessPractitioners,
    }}>
      {children}
    </SubscriptionContext.Provider>
  );
}

export function useSubscription() {
  const context = useContext(SubscriptionContext);
  if (context === undefined) {
    throw new Error('useSubscription must be used within a SubscriptionProvider');
  }
  return context;
}
