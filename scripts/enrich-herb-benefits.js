#!/usr/bin/env node
/**
 * Merge curated traditional-use tags into existing Firestore herb benefits.
 *
 *   node scripts/enrich-herb-benefits.js --dry-run
 *   node scripts/enrich-herb-benefits.js
 */
const fs = require('fs');
const path = require('path');
const { initializeApp, cert, getApps } = require('firebase-admin/app');
const { getFirestore } = require('firebase-admin/firestore');

const DRY = process.argv.includes('--dry-run');
const mapping = JSON.parse(
  fs.readFileSync(path.join(__dirname, '..', 'lib/data/herb-benefit-enrichment.json'), 'utf8')
).byName;

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

function alreadyHas(benefits, tag) {
  const needle = tag.toLowerCase();
  return benefits.some((item) => item.toLowerCase() === needle);
}

async function main() {
  const sa = loadServiceAccount();
  if (!getApps().length) initializeApp({ credential: cert(sa) });
  const db = getFirestore();
  const snap = await db.collection('herbs').get();

  const wanted = new Map(Object.entries(mapping).map(([name, tags]) => [name.toLowerCase(), tags]));
  const seen = new Set();
  let updated = 0;
  let missing = [...wanted.keys()];

  for (const doc of snap.docs) {
    const data = doc.data();
    const name = String(data.name || '').trim();
    const tags = wanted.get(name.toLowerCase());
    if (!tags) continue;
    seen.add(name.toLowerCase());

    const benefits = asList(data.benefits);
    const add = tags.filter((tag) => !alreadyHas(benefits, tag));
    if (add.length === 0) {
      console.log(`skip ${name} (already tagged)`);
      continue;
    }

    const nextBenefits = [...benefits, ...add];
    const keywords = asList(data.searchKeywords);
    const nextKeywords = [...keywords];
    for (const tag of add) {
      const key = tag.toLowerCase();
      if (!nextKeywords.some((item) => item.toLowerCase() === key)) nextKeywords.push(key);
    }

    console.log(`${DRY ? 'DRY' : 'UPDATE'} ${name}: + ${add.join(', ')}`);
    if (!DRY) {
      await doc.ref.update({
        benefits: nextBenefits,
        searchKeywords: nextKeywords,
        updatedAt: new Date(),
      });
    }
    updated++;
  }

  missing = missing.filter((name) => !seen.has(name));
  if (missing.length) {
    console.log('MISSING (not in library):', missing.join(', '));
  }
  console.log(JSON.stringify({ dry: DRY, updated, missing: missing.length, mapped: wanted.size }));
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
