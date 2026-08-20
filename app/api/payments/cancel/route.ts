import { NextRequest, NextResponse } from 'next/server';
import { getAdminDb } from '@/lib/firebase/admin';
import { isAuthError, requireUser } from '@/lib/auth/request';
import { cancelFlutterwaveSubscription, disablePaystackSubscription } from '@/lib/payments/gateways';
import { setCancelAtPeriodEnd } from '@/lib/payments/server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  const user = await requireUser(request);
  if (isAuthError(user)) return user;

  const body = await request.json().catch(() => ({}));
  const action = body.action === 'resume' ? 'resume' : 'cancel';

  try {
    if (action === 'cancel') {
      const snap = await getAdminDb().doc(`users/${user.uid}/subscription/current`).get();
      const sub = snap.data() || {};
      if (sub.paystackSubscriptionCode && sub.paystackEmailToken) {
        await disablePaystackSubscription(sub.paystackSubscriptionCode, sub.paystackEmailToken);
      }
      if (sub.flutterwaveSubscriptionId) {
        await cancelFlutterwaveSubscription(sub.flutterwaveSubscriptionId);
      }
    }

    const result = await setCancelAtPeriodEnd(user.uid, action === 'cancel');
    if (!result.ok) {
      return NextResponse.json({ success: false, error: result.error }, { status: 400 });
    }
    return NextResponse.json({ success: true, message: result.message, expiresAt: result.expiresAt?.toISOString() || null });
  } catch (error: any) {
    console.error('[Cancel] error', error);
    return NextResponse.json(
      { success: false, error: error?.message || 'Could not update this subscription' },
      { status: 500 }
    );
  }
}
