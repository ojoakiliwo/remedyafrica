import { NextResponse } from 'next/server';
import { SUBSCRIPTION_PLANS } from '@/lib/payments/plans';
import { getUsdToNgnRate } from '@/lib/payments/fx';
import { configuredGateways } from '@/lib/payments/gateways';
import { usdToNgn } from '@/lib/payments/logic';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET() {
  const [rate, gateways] = await Promise.all([
    getUsdToNgnRate(),
    Promise.resolve(configuredGateways()),
  ]);

  return NextResponse.json({
    success: true,
    usdToNgn: rate,
    gateways,
    defaultGateway: gateways.paystack ? 'paystack' : gateways.flutterwave ? 'flutterwave' : 'paystack',
    plans: SUBSCRIPTION_PLANS.map((plan) => ({
      ...plan,
      priceNGN: usdToNgn(plan.priceUSD, rate),
    })),
  });
}
