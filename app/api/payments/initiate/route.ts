import { NextRequest, NextResponse } from 'next/server';
import { isAuthError, requireUser } from '@/lib/auth/request';
import { getPlanById, SUBSCRIPTION_PLANS } from '@/lib/payments/plans';
import { getUsdToNgnRate } from '@/lib/payments/fx';
import { initializeFlutterwave, initializePaystack, configuredGateways } from '@/lib/payments/gateways';
import {
  ngnToKobo,
  paymentReference,
  publicAppUrl,
  usdToNgn,
  type PaymentGateway,
} from '@/lib/payments/logic';
import { writePendingPayment } from '@/lib/payments/server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  const user = await requireUser(request);
  if (isAuthError(user)) return user;

  let body: any = {};
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ success: false, error: 'Invalid request' }, { status: 400 });
  }

  const planId = String(body.planId || '');
  const plan = getPlanById(planId);
  if (!plan) {
    return NextResponse.json({ success: false, error: 'Choose a valid plan' }, { status: 400 });
  }

  const gateways = configuredGateways();
  const requested = body.gateway === 'flutterwave' ? 'flutterwave' : 'paystack';
  const gateway: PaymentGateway = gateways[requested]
    ? requested
    : gateways.paystack
      ? 'paystack'
      : gateways.flutterwave
        ? 'flutterwave'
        : requested;

  if (!gateways[gateway]) {
    return NextResponse.json(
      {
        success: false,
        error: gateway === 'paystack'
          ? 'Naira checkout is not live yet. Add PAYSTACK_SECRET_KEY on Vercel.'
          : 'Card checkout in USD is not live yet. Add FLUTTERWAVE_SECRET_KEY on Vercel.',
      },
      { status: 503 }
    );
  }

  const email = user.email;
  if (!email) {
    return NextResponse.json({ success: false, error: 'Your account needs an email address' }, { status: 400 });
  }

  const origin = request.headers.get('origin');
  const appUrl = publicAppUrl(origin && origin.startsWith('http') ? origin : undefined);
  const callbackUrl = `${appUrl}/subscription`;
  const reference = paymentReference(user.uid);
  const rate = await getUsdToNgnRate();
  const amount = gateway === 'paystack' ? usdToNgn(plan.priceUSD, rate) : plan.priceUSD;
  const currency = gateway === 'paystack' ? 'NGN' : 'USD';
  const amountMinor = gateway === 'paystack' ? ngnToKobo(amount) : Math.round(amount * 100);

  await writePendingPayment({
    userId: user.uid,
    email,
    planId: plan.id,
    planName: plan.name,
    gateway,
    reference,
    amount,
    currency,
    amountMinor,
  });

  const metadata = {
    userId: user.uid,
    planId: plan.id,
    planName: plan.name,
    gateway,
    interval: 'quarterly',
    expectedAmount: String(amount),
    expectedMinor: String(amountMinor),
  };

  try {
    const started = gateway === 'paystack'
      ? await initializePaystack({
          email,
          amountKobo: amountMinor,
          reference,
          callbackUrl,
          metadata: {
            ...metadata,
            custom_fields: [
              { display_name: 'Plan', variable_name: 'plan_name', value: plan.name },
              { display_name: 'Season', variable_name: 'interval', value: '3 months' },
            ],
          },
        })
      : await initializeFlutterwave({
          email,
          amountUsd: plan.priceUSD,
          reference,
          redirectUrl: callbackUrl,
          planName: plan.name,
          description: plan.description,
          metadata,
        });

    if (!started.ok) {
      return NextResponse.json({ success: false, error: started.error }, { status: started.status || 502 });
    }

    return NextResponse.json({
      success: true,
      authorizationUrl: started.authorizationUrl,
      reference: started.reference,
      gateway,
      amount,
      currency,
      planId: plan.id,
    });
  } catch (error: any) {
    console.error('[Initiate] failed', error);
    return NextResponse.json(
      { success: false, error: error?.message || 'Could not start checkout' },
      { status: 500 }
    );
  }
}

export async function GET() {
  return NextResponse.json({
    success: true,
    plans: SUBSCRIPTION_PLANS.map((plan) => plan.id),
  });
}
