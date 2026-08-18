/**
 * Live check: category counts and ailment detail must use the same matcher.
 * Run: npx tsx scripts/verify-herb-matching.ts
 */
import { initializeApp, cert, getApps } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { ailmentsData } from '../lib/data/ailments';
import { containsPhrase, countMatchingHerbs, findMatchingHerbs } from '../lib/herb-matching';

function assert(cond: boolean, message: string) {
  if (!cond) throw new Error(message);
}

function unitTests() {
  assert(containsPhrase('Memory support', 'memory'), 'memory in Memory support');
  assert(!containsPhrase('spain', 'pain'), 'pain must not match spain');
  assert(!containsPhrase('heartburn', 'burn'), 'burn must not match heartburn');
  assert(containsPhrase('Pain relief', 'pain relief'), 'phrase match');
  assert(!containsPhrase('mental-wellness category', 'adhd'), 'adhd absent');
  assert(containsPhrase('Soothing herb for ulcers', 'ulcer'), 'ulcer matches ulcers');
  assert(containsPhrase('ADHD support', 'adhd'), 'ADHD support matches adhd');
  console.log('unit tests passed');
}

async function liveCheck() {
  const sa = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT || '');
  if (!getApps().length) initializeApp({ credential: cert(sa) });
  const db = getFirestore();
  const snap = await db.collection('herbs').get();
  const herbs = snap.docs.map((d) => ({ id: d.id, ...d.data() }));

  const adhd = ailmentsData.find((a) => a.id === 'adhd')!;
  const memory = ailmentsData.find((a) => a.id === 'memory-cognition')!;
  const anxiety = ailmentsData.find((a) => a.id === 'anxiety')!;
  const malaria = ailmentsData.find((a) => a.id === 'malaria-fever')!;

  const adhdCount = countMatchingHerbs(herbs, adhd);
  const memoryCount = countMatchingHerbs(herbs, memory);
  const anxietyCount = countMatchingHerbs(herbs, anxiety);
  const malariaCount = countMatchingHerbs(herbs, malaria);

  console.log('ADHD', adhdCount);
  console.log('Memory & Focus', memoryCount, findMatchingHerbs(herbs, memory).slice(0, 8).map((h: any) => h.name));
  console.log('Anxiety', anxietyCount);
  console.log('Malaria', malariaCount);

  assert(adhdCount >= 10, `ADHD should have curated herbs, got ${adhdCount}`);
  assert(memoryCount > 0, 'Memory should have real herbs');
  assert(anxietyCount > 0, 'Anxiety should have real herbs');
  const depression = ailmentsData.find((a) => a.id === 'depression')!;
  const depressionCount = countMatchingHerbs(herbs, depression);
  console.log('Depression', depressionCount);
  assert(depressionCount >= 8, `Depression should have curated herbs, got ${depressionCount}`);

  const rows = ailmentsData.map((ailment) => ({
    id: ailment.id,
    name: ailment.name,
    category: ailment.category,
    count: countMatchingHerbs(herbs, ailment),
  }));
  console.log('\nAll ailment counts:');
  for (const row of rows) {
    console.log(`  ${row.category.padEnd(18)} ${row.name.padEnd(24)} ${row.count}`);
  }
  console.log('\nlive check passed');
}

unitTests();
liveCheck().catch((err) => {
  console.error(err);
  process.exit(1);
});
