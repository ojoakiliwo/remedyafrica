const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { spawnSync } = require('node:child_process');

const root = path.join(__dirname, '../..');
const outDir = fs.mkdtempSync(path.join(os.tmpdir(), 'query-intent-test-'));
const tsc = path.join(root, 'node_modules/typescript/bin/tsc');

const compiled = spawnSync(
  process.execPath,
  [
    tsc,
    path.join(root, 'lib/search/query-intent.ts'),
    path.join(root, 'lib/search/ai-explain.ts'),
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
  identifiedPlantSearchHref,
  plantMatchQuery,
  resolveSearchIntent,
} = require(path.join(outDir, 'query-intent.js'));
const {
  buildExplainPrompt,
  generateFallbackExplanation,
  parseExplainRequest,
} = require(path.join(outDir, 'ai-explain.js'));

const plantHref = identifiedPlantSearchHref({
  commonName: 'corn',
  scientificName: 'Zea mays',
  name: 'Zea mays',
});
assert.equal(plantHref.includes('q=corn'), true);
assert.equal(plantHref.includes('intent=plant'), true);
assert.equal(plantHref.includes('scientific=Zea+mays'), true);
assert.equal(plantHref.includes('source=identify'), true);

assert.equal(
  identifiedPlantSearchHref({ name: 'Zea mays', scientificName: 'Zea mays' }).startsWith('/search?q=Zea+mays'),
  true
);

assert.equal(resolveSearchIntent({}), 'condition');
assert.equal(resolveSearchIntent({ intent: 'plant' }), 'plant');
assert.equal(resolveSearchIntent({ source: 'herb_identifier' }), 'plant');
assert.equal(resolveSearchIntent({ intent: 'condition', source: 'identify' }), 'condition');

assert.equal(plantMatchQuery('corn', 'Zea mays'), 'corn Zea mays');
assert.equal(plantMatchQuery('corn', 'corn'), 'corn');

const typed = parseExplainRequest({ symptoms: 'corn' });
assert.equal(typed.mode, 'condition');
assert.equal(typed.query, 'corn');

const identified = parseExplainRequest({
  symptoms: 'corn',
  mode: 'plant',
  scientificName: 'Zea mays',
});
assert.equal(identified.mode, 'plant');

const plantPrompt = buildExplainPrompt(identified);
assert.match(plantPrompt, /photographed a living plant/i);
assert.match(plantPrompt, /Do NOT explain a human medical condition/i);
assert.match(plantPrompt, /foot corn/i);
assert.doesNotMatch(plantPrompt, /\*\*1\. What is this condition\?\*\*/);

const conditionPrompt = buildExplainPrompt(typed);
assert.match(conditionPrompt, /What is this condition\?/);
assert.match(conditionPrompt, /SYMPTOMS: "corn"/);

const plantFallback = generateFallbackExplanation(identified);
assert.match(plantFallback, /What plant is this/);
assert.doesNotMatch(plantFallback, /What is this condition/);

const missing = parseExplainRequest({});
assert.equal('error' in missing, true);

console.log('query-intent and plant/condition explain prompts ok');
