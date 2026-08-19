const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { spawnSync } = require('node:child_process');

const root = path.join(__dirname, '../..');
const outDir = fs.mkdtempSync(path.join(os.tmpdir(), 'subscription-test-'));
const tsc = path.join(root, 'node_modules/typescript/bin/tsc');

const compiled = spawnSync(
  process.execPath,
  [
    tsc,
    path.join(root, 'lib/auth/subscription.ts'),
    '--outDir',
    outDir,
    '--module',
    'commonjs',
    '--target',
    'es2020',
    '--esModuleInterop',
    '--skipLibCheck',
  ],
  { encoding: 'utf8' }
);

if (compiled.status !== 0) {
  console.error(compiled.stdout);
  console.error(compiled.stderr);
  process.exit(compiled.status || 1);
}

const {
  effectiveSubscriptionTier,
  planToAccessTier,
  isActiveSubscriptionRecord,
  buildGrantFields,
} = require(path.join(outDir, 'subscription.js'));

assert.equal(planToAccessTier('healer'), 'premium_pro');
assert.equal(planToAccessTier('premium'), 'premium');
assert.equal(planToAccessTier('basic'), 'premium');

assert.equal(isActiveSubscriptionRecord({ status: 'active', expiresAt: new Date(Date.now() + 86400000) }), true);
assert.equal(isActiveSubscriptionRecord({ status: 'active', expiresAt: new Date(Date.now() - 86400000) }), false);
assert.equal(isActiveSubscriptionRecord({ status: 'cancelled', expiresAt: new Date(Date.now() + 86400000) }), false);

assert.equal(effectiveSubscriptionTier({
  role: 'admin',
  subscriptionTier: 'free',
}), 'premium_pro');

assert.equal(effectiveSubscriptionTier({
  role: 'user',
  subscriptionTier: 'free',
  subscriptionStatus: 'inactive',
  record: { status: 'active', plan: 'healer', expiresAt: new Date(Date.now() + 86400000) },
}), 'premium_pro');

assert.equal(effectiveSubscriptionTier({
  role: 'user',
  subscriptionTier: 'premium_pro',
  subscriptionStatus: 'active',
  record: null,
}), 'premium_pro');

assert.equal(effectiveSubscriptionTier({
  role: 'user',
  subscriptionTier: 'free',
  subscriptionStatus: 'inactive',
}), 'free');

const grant = buildGrantFields({ planId: 'healer', months: 3, grantedBy: 'admin-1' });
assert.equal(grant.userFields.subscriptionTier, 'premium_pro');
assert.equal(grant.userFields.subscriptionStatus, 'active');
assert.equal(grant.record.gateway, 'manual');
assert.equal(grant.months, 3);

console.log('PASS lib/auth/subscription helpers');
