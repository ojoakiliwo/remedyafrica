import assert from 'node:assert/strict';
import { effectiveSubscriptionTier, isActiveSubscriptionRecord } from '../lib/auth/subscription';
import { safeInternalPath } from '../lib/auth/redirect';
import {
  addMonths,
  alreadyProcessed,
  amountMatches,
  computePaidExpiry,
  hasPaidAccess,
  isSamePlanRenewal,
  ngnToKobo,
  paymentReference,
  publicAppUrl,
  usdToNgn,
} from '../lib/payments/logic';

function test(name: string, fn: () => void) {
  fn();
  console.log(`ok  ${name}`);
}

test('naira amount is a whole number in kobo', () => {
  const ngn = usdToNgn(24, 1487);
  assert.equal(ngn, 35688);
  assert.equal(ngnToKobo(ngn), 3568800);
});

test('renewal extends from remaining expiry, upgrade starts now', () => {
  const now = new Date('2026-08-20T12:00:00Z');
  const existing = new Date('2026-10-01T12:00:00Z');
  const renewed = computePaidExpiry({ now, existingExpiry: existing, samePlanRenewal: true });
  const upgraded = computePaidExpiry({ now, existingExpiry: existing, samePlanRenewal: false });
  assert.equal(renewed.toISOString(), addMonths(existing, 3).toISOString());
  assert.equal(upgraded.toISOString(), addMonths(now, 3).toISOString());
});

test('same-plan renewal only while the current season is still live', () => {
  const now = new Date('2026-08-20T12:00:00Z');
  assert.equal(isSamePlanRenewal({
    existingPlan: 'premium',
    existingStatus: 'active',
    existingExpiry: new Date('2026-10-01T12:00:00Z'),
    nextPlanId: 'premium',
    now,
  }), true);
  assert.equal(isSamePlanRenewal({
    existingPlan: 'premium',
    existingStatus: 'active',
    existingExpiry: new Date('2026-10-01T12:00:00Z'),
    nextPlanId: 'healer',
    now,
  }), false);
});

test('idempotent payments are ignored', () => {
  assert.equal(alreadyProcessed('successful'), true);
  assert.equal(alreadyProcessed('pending'), false);
  assert.equal(amountMatches(3568800, 3568800), true);
  assert.equal(amountMatches(10, 9999), false);
});

test('cancelled subscribers keep access until expiry', () => {
  const future = new Date(Date.now() + 86400000 * 20);
  const past = new Date(Date.now() - 86400000);
  assert.equal(hasPaidAccess({ status: 'active', expiresAt: future, cancelAtPeriodEnd: true }), true);
  assert.equal(hasPaidAccess({ status: 'cancelled', expiresAt: future }), true);
  assert.equal(hasPaidAccess({ status: 'cancelled', expiresAt: past }), false);
  assert.equal(isActiveSubscriptionRecord({ status: 'cancelled', expiresAt: future }), true);
});

test('expired profile fields do not keep premium access', () => {
  const past = new Date(Date.now() - 1000);
  const tier = effectiveSubscriptionTier({
    subscriptionTier: 'premium',
    subscriptionStatus: 'active',
    subscriptionExpiresAt: past,
    record: { status: 'active', plan: 'premium', expiresAt: past },
  });
  assert.equal(tier, 'free');
});

test('open redirects are rejected', () => {
  assert.equal(safeInternalPath('/subscription?plan=premium'), '/subscription?plan=premium');
  assert.equal(safeInternalPath('https://evil.test'), '/profile');
  assert.equal(safeInternalPath('//evil.test'), '/profile');
});

test('production app url has a real default', () => {
  assert.equal(publicAppUrl(''), 'https://www.remedyafrica.com');
  assert.match(paymentReference('abcdefghijklmnop'), /^ra-abcdefgh-[a-z0-9]+$/);
});

console.log('All payment logic tests passed');
