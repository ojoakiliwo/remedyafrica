import { NextRequest, NextResponse } from 'next/server';
import { isAuthError, requireUser } from '@/lib/auth/request';
import { serializeCurrentSubscription } from '@/lib/payments/server';
import { hasPaidAccess } from '@/lib/payments/logic';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  const user = await requireUser(request);
  if (isAuthError(user)) return user;

  try {
    const data = await serializeCurrentSubscription(user.uid);
    return NextResponse.json({
      success: true,
      ...data,
      access: hasPaidAccess(data.subscription as any),
    });
  } catch (error: any) {
    console.error('[Payments me] error', error);
    return NextResponse.json(
      { success: false, error: error?.message || 'Could not load subscription' },
      { status: 500 }
    );
  }
}
