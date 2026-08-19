const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { spawnSync } = require('node:child_process');

const root = path.join(__dirname, '../..');
const outDir = fs.mkdtempSync(path.join(os.tmpdir(), 'booking-test-'));
const tsc = path.join(root, 'node_modules/typescript/bin/tsc');

const compiled = spawnSync(
  process.execPath,
  [
    tsc,
    path.join(root, 'lib/consultations/booking.ts'),
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

const { resolvePractitionerBookingIds, uniqueIds } = require(path.join(outDir, 'booking.js'));

assert.deepEqual(
  resolvePractitionerBookingIds({ id: 'profile-1', userId: 'auth-uid' }),
  { practitionerId: 'auth-uid', practitionerProfileId: 'profile-1' }
);

assert.deepEqual(
  resolvePractitionerBookingIds({ id: 'auth-uid', userId: 'auth-uid' }),
  { practitionerId: 'auth-uid', practitionerProfileId: 'auth-uid' }
);

assert.deepEqual(
  resolvePractitionerBookingIds({ id: 'legacy-app-id', userId: null }),
  { practitionerId: 'legacy-app-id', practitionerProfileId: 'legacy-app-id' }
);

assert.deepEqual(uniqueIds('a', 'a', '', null, 'b'), ['a', 'b']);

console.log('PASS lib/consultations/booking helpers');
