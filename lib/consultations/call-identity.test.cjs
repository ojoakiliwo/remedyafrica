const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { spawnSync } = require('node:child_process');

const root = path.join(__dirname, '../..');
const outDir = fs.mkdtempSync(path.join(os.tmpdir(), 'call-identity-test-'));
const tsc = path.join(root, 'node_modules/typescript/bin/tsc');

const compiled = spawnSync(
  process.execPath,
  [
    tsc,
    path.join(root, 'lib/consultations/call-identity.ts'),
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
  resolveCallDisplayName,
  dailyRoomNameFromUrl,
  withDailyJoinIdentity,
} = require(path.join(outDir, 'call-identity.js'));

assert.equal(
  resolveCallDisplayName({ displayName: 'Ada Lovelace', name: 'Other', email: 'ada@example.com' }),
  'Ada Lovelace'
);
assert.equal(
  resolveCallDisplayName({ displayName: '  ', name: 'Dr Owojo', email: 'x@example.com' }),
  'Dr Owojo'
);
assert.equal(
  resolveCallDisplayName({ email: 'jess@example.com', fallback: 'Patient' }),
  'jess'
);
assert.equal(resolveCallDisplayName({ fallback: 'Patient' }), 'Patient');
assert.equal(resolveCallDisplayName({}), 'Guest');

assert.equal(
  dailyRoomNameFromUrl('https://remedyafrica.daily.co/remedy-abc123-99?t=token'),
  'remedy-abc123-99'
);

const joined = withDailyJoinIdentity('https://remedyafrica.daily.co/room-1?t=old', {
  userName: 'Ada Lovelace',
  token: 'named-token',
});
const joinedUrl = new URL(joined);
assert.equal(joinedUrl.searchParams.get('userName'), 'Ada Lovelace');
assert.equal(joinedUrl.searchParams.get('t'), 'named-token');

console.log('PASS lib/consultations/call-identity helpers');
