/**
 * Live check: category counts and ailment detail must use the same matcher.
 * Run: npx tsx scripts/verify-herb-matching.ts
 */
import { initializeApp, cert, getApps } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { ailmentsData } from '../lib/data/ailments';
import { containsPhrase, countMatchingHerbs, findMatchingHerbs } from '../lib/herb-matching';
import { isAnimalDerivedHerb, isPublicCatalogHerb, pickFeaturedHerbs } from '../lib/herb-trust';

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
  assert(
    isAnimalDerivedHerb({ name: 'Ji Nei Jin', scientificName: 'Gallus gallus', description: 'Chicken gizzard lining for digestion', partsUsed: 'Gizzard lining' }),
    'Ji Nei Jin is animal-derived'
  );
  assert(
    isPublicCatalogHerb({ name: 'Moringa', scientificName: 'Moringa oleifera' }),
    'Moringa stays public'
  );
  assert(
    !pickFeaturedHerbs(
      [
        { id: '1', name: 'Ji Nei Jin', scientificName: 'Gallus gallus', description: 'Chicken gizzard lining' },
        { id: '2', name: 'Sutherlandia', scientificName: 'Lessertia frutescens', origin: 'South Africa' },
      ],
      6,
      () => true
    ).some((h) => h.name === 'Ji Nei Jin'),
    'featured list never includes Ji Nei Jin'
  );
  const householdPreview = pickFeaturedHerbs(
    [
      { id: 's', name: 'Sutherlandia', scientificName: 'Lessertia frutescens', origin: 'South Africa' },
      { id: 'b', name: 'Bitter Leaf', scientificName: 'Vernonia amygdalina', origin: 'West Africa' },
      { id: 'm', name: 'Moringa', scientificName: 'Moringa oleifera', origin: 'Africa and India' },
      { id: 'n', name: 'Neem', scientificName: 'Azadirachta indica', origin: 'India Ayurveda' },
    ],
    3,
    (herb) => herb.name === 'Sutherlandia'
  ).map((h) => h.name);
  assert(
    householdPreview.join(',') === 'Bitter Leaf,Moringa,Neem',
    `household plants outrank photographed South African herbs, got ${householdPreview.join(',')}`
  );
  const renamedScent = pickFeaturedHerbs(
    [{ id: '1', name: 'African Basil (Scent Leaf)', scientificName: 'Ocimum gratissimum', origin: 'Africa' }],
    1,
    () => false
  );
  assert(renamedScent[0]?.name === 'African Basil (Scent Leaf)', 'featured matcher still finds scent leaf under the old name');
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

  const indigestion = ailmentsData.find((a) => a.id === 'indigestion')!;
  const digestNames = findMatchingHerbs(herbs, indigestion).map((h: any) => h.name);
  assert(!digestNames.includes('Ji Nei Jin'), 'Ji Nei Jin must not appear in public digestive matches');
  const featured = pickFeaturedHerbs(herbs as any, 6, () => false).map((h: any) => h.name);
  console.log('Featured picks', featured);
  assert(!featured.includes('Ji Nei Jin'), 'featured picks exclude chicken gizzard');
  const household = new Set([
    'Bitter Leaf',
    'Scent Leaf',
    'African Basil (Scent Leaf)',
    'Moringa',
    'Neem',
    'Ginger',
    'Zobo',
    'Roselle',
    'Lemon Grass',
  ]);
  assert(
    featured.every((name: string) => household.has(name)),
    `featured preview should be household Nigerian plants, got ${featured.join(', ')}`
  );

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
