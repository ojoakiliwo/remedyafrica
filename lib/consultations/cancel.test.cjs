const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { spawnSync } = require('node:child_process');

const root = path.join(__dirname, '../..');
const outDir = fs.mkdtempSync(path.join(os.tmpdir(), 'cancel-test-'));
const tsc = path.join(root, 'node_modules/typescript/bin/tsc');

const compiled = spawnSync(
  process.execPath,
  [
    tsc,
    path.join(root, 'lib/consultations/cancel.ts'),
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
  canCancelConsultation,
  isConsultationParticipant,
  canUserCancelConsultation,
  consultationCancelFields,
} = require(path.join(outDir, 'cancel.js'));

assert.equal(canCancelConsultation('scheduled'), true);
assert.equal(canCancelConsultation('in-progress'), true);
assert.equal(canCancelConsultation('pending'), true);
assert.equal(canCancelConsultation('completed'), false);
assert.equal(canCancelConsultation('cancelled'), false);

const session = {
  patientId: 'patient-1',
  practitionerId: 'healer-1',
  practitionerProfileId: 'profile-1',
  status: 'scheduled',
};

assert.equal(isConsultationParticipant('patient-1', session), true);
assert.equal(isConsultationParticipant('healer-1', session), true);
assert.equal(isConsultationParticipant('profile-1', session), true);
assert.equal(isConsultationParticipant('auth-uid', session, ['profile-1']), true);
assert.equal(isConsultationParticipant('other', session), false);

assert.equal(canUserCancelConsultation('patient-1', session), true);
assert.equal(canUserCancelConsultation('healer-1', session), true);
assert.equal(canUserCancelConsultation('auth-uid', session, ['profile-1']), true);
assert.equal(
  canUserCancelConsultation('patient-1', { ...session, status: 'completed' }),
  false
);
assert.equal(canUserCancelConsultation('stranger', session), false);

assert.deepEqual(consultationCancelFields('patient-1'), {
  status: 'cancelled',
  cancelledBy: 'patient-1',
});

console.log('PASS lib/consultations/cancel helpers');
