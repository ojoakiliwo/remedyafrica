const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { spawnSync } = require('node:child_process');

const root = path.join(__dirname, '../..');
const outDir = fs.mkdtempSync(path.join(os.tmpdir(), 'practitioner-routes-test-'));
const tsc = path.join(root, 'node_modules/typescript/bin/tsc');

const compiled = spawnSync(
  process.execPath,
  [
    tsc,
    path.join(root, 'lib/practitioners/routes.ts'),
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

const { resolvePractitionerReservedPath } = require(path.join(outDir, 'routes.js'));

assert.equal(resolvePractitionerReservedPath('consultations'), '/practitioners/consultations');
assert.equal(resolvePractitionerReservedPath('dashboard'), '/practitioners/dashboard');
assert.equal(resolvePractitionerReservedPath('apply'), '/practitioners/apply');
assert.equal(resolvePractitionerReservedPath('profile'), '/profile');
assert.equal(resolvePractitionerReservedPath('edit'), '/practitioners/profile/edit');
assert.equal(resolvePractitionerReservedPath('real-healer-id'), null);

console.log('PASS lib/practitioners/routes helpers');
