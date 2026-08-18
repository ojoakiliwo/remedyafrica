#!/usr/bin/env node
/**
 * Add everyday West African / Nigerian household plants, and enrich
 * existing records with local names people actually search for.
 *
 *   node scripts/seed-household-herbs.js --dry-run
 *   node scripts/seed-household-herbs.js
 */
const fs = require('fs');
const path = require('path');
const { initializeApp, cert, getApps } = require('firebase-admin/app');
const { getFirestore } = require('firebase-admin/firestore');

const DRY = process.argv.includes('--dry-run');
const catalog = JSON.parse(
  fs.readFileSync(path.join(__dirname, '..', 'lib/data/household-west-african-herbs.json'), 'utf8')
);

function loadServiceAccount() {
  if (process.env.FIREBASE_SERVICE_ACCOUNT) {
    return JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
  }
  const keyPath = path.join(__dirname, '..', 'serviceAccountKey.json');
  if (fs.existsSync(keyPath)) return require(keyPath);
  throw new Error('Set FIREBASE_SERVICE_ACCOUNT or place serviceAccountKey.json in the repo root.');
}

function asList(value) {
  if (Array.isArray(value)) return value.map((item) => String(item).trim()).filter(Boolean);
  if (typeof value === 'string') {
    return value.split(/[;|,]/).map((item) => item.trim()).filter(Boolean);
  }
  return [];
}

function uniqueKeepOrder(items) {
  const seen = new Set();
  const out = [];
  for (const item of items) {
    const key = String(item).trim().toLowerCase();
    if (!key || seen.has(key)) continue;
    seen.add(key);
    out.push(String(item).trim());
  }
  return out;
}

function sciKey(value) {
  return String(value || '')
    .toLowerCase()
    .replace(/\s+/g, ' ')
    .trim();
}

function buildSearchKeywords(herb) {
  const fromFields = [
    herb.name,
    herb.scientificName,
    herb.category,
    herb.origin,
    ...(herb.commonNames || []),
    ...(herb.benefits || []),
    ...(herb.searchKeywords || []),
  ];
  return uniqueKeepOrder(fromFields.map((item) => String(item || '').toLowerCase()).filter(Boolean));
}

async function main() {
  const sa = loadServiceAccount();
  if (!getApps().length) initializeApp({ credential: cert(sa) });
  const db = getFirestore();
  const snap = await db.collection('herbs').get();

  const byScientific = new Map();
  const byName = new Map();
  for (const doc of snap.docs) {
    const data = doc.data();
    const sci = sciKey(data.scientificName);
    const name = String(data.name || '').toLowerCase().trim();
    if (sci) byScientific.set(sci, doc);
    if (name) byName.set(name, doc);
  }

  let updated = 0;
  let added = 0;
  let skipped = 0;

  for (const [scientificName, patch] of Object.entries(catalog.existingByScientificName)) {
    const doc = byScientific.get(sciKey(scientificName)) || byName.get(String(patch.name || '').toLowerCase());
    if (!doc) {
      console.log(`MISSING existing ${patch.name} (${scientificName})`);
      skipped++;
      continue;
    }

    const data = doc.data();
    const next = {
      name: patch.name || data.name,
      commonNames: uniqueKeepOrder([...(patch.commonNames || []), ...asList(data.commonNames)]),
      origin: patch.origin || data.origin,
      description: patch.description || data.description,
      searchKeywords: uniqueKeepOrder([
        ...asList(data.searchKeywords),
        ...(patch.searchKeywords || []),
        ...(patch.commonNames || []),
        patch.name,
        scientificName,
        'nigeria',
        'west africa',
      ]),
      updatedAt: new Date(),
    };

    const changed =
      next.name !== data.name ||
      next.origin !== data.origin ||
      next.description !== data.description ||
      JSON.stringify(next.commonNames) !== JSON.stringify(asList(data.commonNames)) ||
      next.searchKeywords.some((key) => !asList(data.searchKeywords).some((item) => item.toLowerCase() === key.toLowerCase()));

    if (!changed) {
      console.log(`skip ${data.name} (already household-tagged)`);
      skipped++;
      continue;
    }

    console.log(`${DRY ? 'DRY' : 'UPDATE'} ${data.name} → ${next.name} [${(next.commonNames || []).join(', ')}]`);
    if (!DRY) await doc.ref.update(next);
    updated++;
  }

  for (const herb of catalog.newHerbs) {
    const existing =
      byScientific.get(sciKey(herb.scientificName)) || byName.get(String(herb.name).toLowerCase());
    if (existing) {
      console.log(`skip new ${herb.name} — already in library as ${existing.data().name}`);
      skipped++;
      continue;
    }

    const record = {
      name: herb.name,
      scientificName: herb.scientificName,
      category: herb.category,
      description: herb.description,
      preparation: herb.preparation,
      origin: herb.origin,
      partsUsed: herb.partsUsed,
      commonNames: herb.commonNames || [],
      benefits: herb.benefits || [],
      warnings: herb.warnings || [],
      searchKeywords: buildSearchKeywords(herb),
      status: 'active',
      images: [],
      imageUrl: null,
      rating: 0,
      reviews: 0,
      views: 0,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    console.log(`${DRY ? 'DRY ADD' : 'ADD'} ${herb.name} (${herb.scientificName})`);
    if (!DRY) {
      const ref = await db.collection('herbs').add(record);
      byScientific.set(sciKey(herb.scientificName), { id: ref.id, data: () => record });
    }
    added++;
  }

  console.log(JSON.stringify({ dry: DRY, updated, added, skipped, existingCatalog: Object.keys(catalog.existingByScientificName).length, newCatalog: catalog.newHerbs.length }));
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
