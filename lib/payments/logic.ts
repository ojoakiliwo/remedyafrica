export type PaymentGateway = 'paystack' | 'flutterwave';
export type PaymentStatus = 'pending' | 'successful' | 'failed' | 'abandoned';
export type SubscriptionStatus = 'active' | 'cancelled' | 'past_due' | 'pending';

export const BILLING_MONTHS = 3;
export const FX_FALLBACK_USD_NGN = 1600;
export const PRODUCTION_APP_URL = 'https://www.remedyafrica.com';

export function publicAppUrl(explicit?: string | null): string {
  const raw = (explicit || process.env.NEXT_PUBLIC_APP_URL || PRODUCTION_APP_URL).trim();
  return raw.replace(/\/+$/, '') || PRODUCTION_APP_URL;
}

export function addMonths(date: Date, months: number): Date {
  const next = new Date(date.getTime());
  const day = next.getDate();
  next.setMonth(next.getMonth() + months);
  if (next.getDate() < day) next.setDate(0);
  return next;
}

export function toJsDate(value: unknown): Date | null {
  if (!value) return null;
  if (value instanceof Date) return Number.isNaN(value.getTime()) ? null : value;
  if (typeof value === 'object' && value && 'toDate' in value && typeof (value as { toDate: () => Date }).toDate === 'function') {
    const date = (value as { toDate: () => Date }).toDate();
    return Number.isNaN(date.getTime()) ? null : date;
  }
  if (typeof value === 'object' && value && 'seconds' in value) {
    const seconds = Number((value as { seconds: number }).seconds);
    if (Number.isFinite(seconds)) return new Date(seconds * 1000);
  }
  const parsed = new Date(String(value));
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

export function computePaidExpiry(opts: {
  now?: Date;
  existingExpiry?: Date | null;
  samePlanRenewal: boolean;
  months?: number;
}): Date {
  const now = opts.now || new Date();
  const months = opts.months ?? BILLING_MONTHS;
  const base = opts.samePlanRenewal && opts.existingExpiry && opts.existingExpiry.getTime() > now.getTime()
    ? opts.existingExpiry
    : now;
  return addMonths(base, months);
}

export function isSamePlanRenewal(opts: {
  existingPlan?: string | null;
  existingStatus?: string | null;
  existingExpiry?: Date | null;
  nextPlanId: string;
  now?: Date;
}): boolean {
  const now = opts.now || new Date();
  if (opts.existingPlan !== opts.nextPlanId) return false;
  if (opts.existingStatus !== 'active' && opts.existingStatus !== 'cancelled') return false;
  if (!opts.existingExpiry) return false;
  return opts.existingExpiry.getTime() > now.getTime();
}

export function usdToNgn(usd: number, rate: number): number {
  return Math.round(usd * rate);
}

export function ngnToKobo(ngn: number): number {
  return Math.round(ngn * 100);
}

export function usdToCents(usd: number): number {
  return Math.round(usd * 100);
}

export function amountMatches(paidMinor: number, expectedMinor: number, toleranceMinor = 0): boolean {
  return Math.abs(paidMinor - expectedMinor) <= toleranceMinor;
}

export function alreadyProcessed(status?: string | null): boolean {
  return status === 'successful';
}

export function hasPaidAccess(record?: {
  status?: string | null;
  expiresAt?: unknown;
  cancelAtPeriodEnd?: boolean | null;
} | null): boolean {
  if (!record) return false;
  const expiresAt = toJsDate(record.expiresAt);
  if (expiresAt && expiresAt.getTime() <= Date.now()) return false;
  if (record.status === 'active') return true;
  if (record.status === 'cancelled' && expiresAt && expiresAt.getTime() > Date.now()) return true;
  return false;
}

export function suggestGatewayFromTimezone(timeZone?: string | null): PaymentGateway {
  const zone = timeZone || '';
  const overseas = ['America/', 'Europe/', 'Australia/', 'Pacific/', 'Atlantic/', 'Asia/'];
  if (overseas.some((prefix) => zone.startsWith(prefix)) && !zone.startsWith('Asia/Lagos')) {
    return 'flutterwave';
  }
  return 'paystack';
}

export function paymentReference(userId: string, now = Date.now()): string {
  const stamp = now.toString(36);
  const entropy = Math.random().toString(36).slice(2, 8);
  return `ra-${userId.slice(0, 8)}-${stamp}${entropy}`.replace(/[^a-zA-Z0-9.=-]/g, '');
}

export function readMeta(source: Record<string, unknown> | null | undefined) {
  const meta = (source || {}) as Record<string, unknown>;
  const nested = (meta.meta && typeof meta.meta === 'object' ? meta.meta : {}) as Record<string, unknown>;
  return {
    userId: String(meta.userId || nested.userId || ''),
    planId: String(meta.planId || nested.planId || ''),
    planName: String(meta.planName || nested.planName || ''),
    gateway: String(meta.gateway || nested.gateway || ''),
    interval: String(meta.interval || nested.interval || 'quarterly'),
  };
}

export function formatMoney(amount: number, currency: 'NGN' | 'USD'): string {
  if (currency === 'NGN') return `₦${Math.round(amount).toLocaleString('en-NG')}`;
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(amount);
}

export function monthlyEquivalent(quarterly: number, currency: 'NGN' | 'USD'): string {
  if (currency === 'NGN') return `₦${Math.round(quarterly / BILLING_MONTHS).toLocaleString('en-NG')}`;
  return `$${Math.round(quarterly / BILLING_MONTHS)}`;
}

export function gatewayConfigured(gateway: PaymentGateway): boolean {
  if (gateway === 'paystack') return Boolean(process.env.PAYSTACK_SECRET_KEY);
  return Boolean(process.env.FLUTTERWAVE_SECRET_KEY);
}
