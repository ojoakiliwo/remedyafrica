export interface PaymentPlan {
  id: string;
  name: string;
  description: string;
  priceUSD: number;
  interval: 'quarterly';
  features: string[];
  popular?: boolean;
  consultationsPerMonth: number;
  plantIdsPerMonth: number;
  familyMembers?: number;
}

export const SUBSCRIPTION_PLANS: PaymentPlan[] = [
  {
    id: 'basic',
    name: 'Basic',
    description: 'Read, search, and identify plants at home',
    priceUSD: 9,
    interval: 'quarterly',
    consultationsPerMonth: 0,
    plantIdsPerMonth: 5,
    features: [
      'The full herb library, including local names',
      'Search how you feel in your own words',
      'Save up to 10 favorite herbs',
      'Community reading access',
      '5 plant identifications each month',
    ],
  },
  {
    id: 'premium',
    name: 'Premium',
    description: 'Two healer conversations, included',
    priceUSD: 24,
    interval: 'quarterly',
    consultationsPerMonth: 2,
    plantIdsPerMonth: 20,
    popular: true,
    features: [
      'Everything in Basic',
      'Unlimited herb saves',
      '2 practitioner consultations each month, included',
      '20 plant identifications each month',
      'A written protocol after each visit',
      'Priority support',
    ],
  },
  {
    id: 'healer',
    name: 'Healer',
    description: 'Unlimited care for the household',
    priceUSD: 54,
    interval: 'quarterly',
    consultationsPerMonth: 999,
    plantIdsPerMonth: 999,
    familyMembers: 3,
    features: [
      'Everything in Premium',
      'Unlimited consultations, included',
      'Unlimited plant identifications',
      'Share with up to 3 family members',
      'Quarterly wellness note from your healer',
      'Early access to new library work',
    ],
  },
];

export function getPlanById(planId: string): PaymentPlan | undefined {
  return SUBSCRIPTION_PLANS.find((plan) => plan.id === planId);
}

export function getNextPlan(currentPlanId: string): PaymentPlan | null {
  const currentIndex = SUBSCRIPTION_PLANS.findIndex((plan) => plan.id === currentPlanId);
  if (currentIndex >= 0 && currentIndex < SUBSCRIPTION_PLANS.length - 1) {
    return SUBSCRIPTION_PLANS[currentIndex + 1];
  }
  return null;
}
