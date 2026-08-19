const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { spawnSync } = require('node:child_process');

const root = path.join(__dirname, '../..');
const outDir = fs.mkdtempSync(path.join(os.tmpdir(), 'roles-test-'));
const tsc = path.join(root, 'node_modules/typescript/bin/tsc');

const compiled = spawnSync(
  process.execPath,
  [
    tsc,
    path.join(root, 'lib/auth/roles.ts'),
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
  normalizeEmail,
  effectiveAccountRole,
  isPractitionerRole,
  resolveApplicantUid,
  fieldsToCopyFromOrphan,
} = require(path.join(outDir, 'roles.js'));

assert.equal(normalizeEmail('  Ada@Example.com '), 'ada@example.com');

assert.equal(effectiveAccountRole('admin', true), 'admin');
assert.equal(effectiveAccountRole('user', true), 'practitioner');
assert.equal(effectiveAccountRole('user', false), 'user');
assert.equal(effectiveAccountRole(undefined, false), 'user');

assert.equal(isPractitionerRole('practitioner'), true);
assert.equal(isPractitionerRole('admin'), true);
assert.equal(isPractitionerRole('user'), false);

assert.equal(
  resolveApplicantUid({
    applicationId: 'app1',
    statedUserId: 'uid-current',
    statedAccount: { existsInAuth: true, role: 'user' },
    authUidByEmail: 'uid-current',
  }).uid,
  'uid-current'
);

assert.deepEqual(
  resolveApplicantUid({
    applicationId: 'app-latini',
    statedUserId: 'uid-admin',
    statedAccount: { existsInAuth: true, role: 'admin' },
    authUidByEmail: 'uid-admin',
    emailAccountIsAdmin: true,
  }),
  { uid: 'app-latini', reason: 'applicationId' }
);

assert.deepEqual(
  resolveApplicantUid({
    applicationId: 'app2',
    statedUserId: 'deleted-uid',
    statedAccount: { existsInAuth: false, role: 'user' },
    authUidByEmail: 'uid-recreated',
  }),
  { uid: 'uid-recreated', reason: 'auth.email' }
);

const copied = fieldsToCopyFromOrphan({
  role: 'user',
  displayName: 'Michael Owojo',
  email: 'should-not-copy@example.com',
  subscriptionTier: 'free',
});
assert.equal(copied.role, undefined);
assert.equal(copied.email, undefined);
assert.equal(copied.displayName, 'Michael Owojo');

console.log('PASS lib/auth/roles helpers');
