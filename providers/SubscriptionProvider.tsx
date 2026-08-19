'use client';

import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { doc, onSnapshot } from 'firebase/firestore';
import { db } from '@/lib/firebase/client';
import { useAuth } from './AuthProvider';
import {
  effectiveSubscriptionTier,
  subscriptionGrantDocId,
  type SubscriptionTier,
} from '@/lib/auth/subscription';

export type { SubscriptionTier };

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

export function SubscriptionProvider({ children }: { children: ReactNode }) {
  const { profile, user } = useAuth();
  const [record, setRecord] = useState<{
    status?: string;
    plan?: string;
    expiresAt?: unknown;
  } | null>(null);

  useEffect(() => {
    if (!user) {
      setRecord(null);
      return;
    }

    let fromUser: { status?: string; plan?: string; expiresAt?: unknown } | null = null;
    let fromGrant: { status?: string; plan?: string; expiresAt?: unknown } | null = null;
    const publish = () => setRecord(fromUser || fromGrant);

    const unsubRecord = onSnapshot(
      doc(db, 'users', user.uid, 'subscription', 'current'),
      (snap) => {
        fromUser = snap.exists() ? snap.data() : null;
        publish();
      },
      () => {
        fromUser = null;
        publish();
      }
    );

    const unsubGrant = onSnapshot(
      doc(db, 'practitioners', subscriptionGrantDocId(user.uid)),
      (snap) => {
        fromGrant = snap.exists() ? snap.data() : null;
        publish();
      },
      () => {
        fromGrant = null;
        publish();
      }
    );

    return () => {
      unsubRecord();
      unsubGrant();
    };
  }, [user]);

  const tier = effectiveSubscriptionTier({
    role: profile?.role,
    subscriptionTier: profile?.subscriptionTier,
    subscriptionStatus: profile?.subscriptionStatus,
    record,
  });
  const isPremium = tier === 'premium' || tier === 'premium_pro';
  const isPremiumPro = tier === 'premium_pro';

  return (
    <SubscriptionContext.Provider value={{
      tier,
      isPremium,
      isPremiumPro,
      canAccessPrescription: isPremium,
      canAccessSideEffects: isPremium,
      canAccessForum: isPremiumPro,
      canAccessPractitioners: isPremium,
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
