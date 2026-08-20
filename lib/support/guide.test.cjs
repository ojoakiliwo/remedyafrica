const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { spawnSync } = require('node:child_process');

const root = path.join(__dirname, '../..');
const outDir = fs.mkdtempSync(path.join(os.tmpdir(), 'support-guide-test-'));
const tsc = path.join(root, 'node_modules/typescript/bin/tsc');

const compiled = spawnSync(
  process.execPath,
  [
    tsc,
    path.join(root, 'lib/support/guide.ts'),
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

const { localSupportReply, rankSupportTopics } = require(path.join(outDir, 'guide.js'));

assert.equal(localSupportReply('How do I join the video call?').topicId, 'join');
assert.equal(localSupportReply('identify a plant with my camera').topicId, 'identify');
assert.equal(localSupportReply('I need to cancel my appointment').topicId, 'cancel');
assert.equal(localSupportReply('edit my practitioner profile').topicId, 'profile');
assert.ok(rankSupportTopics('book a healer')[0].score > 0);

const unknown = localSupportReply('what is the weather in lagos tomorrow');
assert.equal(unknown.topicId, 'fallback');
assert.ok(unknown.links.some((link) => link.href === '/contact'));

console.log('PASS lib/support/guide helpers');
