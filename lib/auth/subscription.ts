import { hasPaidAccess, toJsDate } from '@/lib/payments/logic';

export type SubscriptionTier = 'free' | 'premium' | 'premium_pro';

export const GRANTABLE_PLANS = [
  { id: 'basic', name: 'Basic', tier: 'premium' as const },
  { id: 'premium', name: 'Premium', tier: 'premium' as const },
  { id: 'healer', name: 'Healer', tier: 'premium_pro' as const },
] as const;

export type GrantablePlanId = typeof GRANTABLE_PLANS[number]['id'];

export function getGrantablePlan(planId?: string | null) {
  return GRANTABLE_PLANS.find((plan) => plan.id === planId) || GRANTABLE_PLANS[2];
}

export function subscriptionGrantDocId(userId: string) {
  return `__sub_${userId}`;
}

export function isSystemPractitionerDoc(id?: string | null, data?: Record<string, unknown> | null) {
  return Boolean(id && id.startsWith('__')) || data?.isSubscriptionGrant === true;
}

export function planToAccessTier(plan?: string | null): SubscriptionTier {
  if (plan === 'healer' || plan === 'premium_pro') return 'premium_pro';
  if (plan === 'premium' || plan === 'basic') return 'premium';
  return 'free';
}

export function rankTier(tier?: string | null) {
  if (tier === 'premium_pro') return 2;
  if (tier === 'premium') return 1;
  return 0;
}

export function isActiveSubscriptionRecord(record?: {
  status?: string | null;
  expiresAt?: unknown;
  cancelAtPeriodEnd?: boolean | null;
} | null) {
  return hasPaidAccess(record);
}

export function profileTierFromUser(opts: {
  subscriptionTier?: string | null;
  subscriptionStatus?: string | null;
  subscriptionExpiresAt?: unknown;
}): SubscriptionTier {
  const expiresAt = toJsDate(opts.subscriptionExpiresAt);
  if (expiresAt && expiresAt.getTime() <= Date.now()) return 'free';

  const status = opts.subscriptionStatus;
  if (status === 'inactive' || status === 'past_due') return 'free';
  if (status === 'cancelled' && (!expiresAt || expiresAt.getTime() <= Date.now())) return 'free';

  if (opts.subscriptionTier === 'premium_pro' || opts.subscriptionTier === 'premium') {
    return opts.subscriptionTier;
  }
  return 'free';
}

export function effectiveSubscriptionTier(opts: {
  role?: string | null;
  subscriptionTier?: string | null;
  subscriptionStatus?: string | null;
  subscriptionExpiresAt?: unknown;
  record?: { status?: string | null; plan?: string | null; expiresAt?: unknown; cancelAtPeriodEnd?: boolean | null } | null;
}): SubscriptionTier {
  if (opts.role === 'admin') return 'premium_pro';
  const fromProfile = profileTierFromUser(opts);
  const fromRecord = isActiveSubscriptionRecord(opts.record)
    ? planToAccessTier(opts.record?.plan)
    : 'free';
  return rankTier(fromProfile) >= rankTier(fromRecord) ? fromProfile : fromRecord;
}

export function buildGrantFields(input: {
  planId?: string | null;
  months?: number | null;
  grantedBy: string;
}) {
  const plan = getGrantablePlan(input.planId);
  const months = Number(input.months) > 0 ? Math.min(36, Math.floor(Number(input.months))) : 3;
  const expiresAt = new Date();
  expiresAt.setMonth(expiresAt.getMonth() + months);

  return {
    plan,
    months,
    expiresAt,
    userFields: {
      subscriptionTier: plan.tier,
      subscriptionStatus: 'active' as const,
      subscriptionPlan: plan.id,
      subscriptionExpiresAt: expiresAt,
    },
    record: {
      plan: plan.id,
      planName: plan.name,
      status: 'active' as const,
      cancelAtPeriodEnd: false,
      gateway: 'manual',
      interval: 'quarterly',
      months,
      grantedBy: input.grantedBy,
      consultationsUsedThisMonth: 0,
      plantIdsUsedThisMonth: 0,
    },
  };
}
