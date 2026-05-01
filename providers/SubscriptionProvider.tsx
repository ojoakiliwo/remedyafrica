'use client';

import { createContext, useContext, ReactNode } from 'react';
import { useAuth } from './AuthProvider';

export type SubscriptionTier = 'free' | 'premium' | 'premium_pro';

export interface SubscriptionContextType {
  tier: SubscriptionTier;
  isPremium: boolean;
  isPremiumPro: boolean;
  canAccessPrescription: boolean;
  canAccessSideEffects: boolean;
  canAccessForum: boolean;
}

const SubscriptionContext = createContext<SubscriptionContextType | undefined>(undefined);

export function SubscriptionProvider({ children }: { children: ReactNode }) {
  const { profile } = useAuth();
  
  const tier = (profile?.subscriptionTier as SubscriptionTier) || 'free';
  const isPremium = tier === 'premium' || tier === 'premium_pro';
  const isPremiumPro = tier === 'premium_pro';
  
  const canAccessPrescription = isPremium;
  const canAccessSideEffects = isPremium;
  const canAccessForum = isPremiumPro;

  return (
    <SubscriptionContext.Provider value={{
      tier,
      isPremium,
      isPremiumPro,
      canAccessPrescription,
      canAccessSideEffects,
      canAccessForum,
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