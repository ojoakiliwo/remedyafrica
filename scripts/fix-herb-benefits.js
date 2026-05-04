const { initializeApp, cert } = require('firebase-admin/app');
const { getFirestore } = require('firebase-admin/firestore');

// ============================================================
// FIX EXISTING HERBS: Convert string benefits/warnings to arrays
// ============================================================
// 1. Download service account key from Firebase Console:
//    Project Settings → Service Accounts → Generate new private key
// 2. Save it as serviceAccountKey.json in your project root
// 3. Run: node scripts/fix-herb-benefits.js
// ============================================================

const serviceAccount = require('../serviceAccountKey.json');

initializeApp({ credential: cert(serviceAccount) });
const db = getFirestore();

async function fixHerbs() {
  console.log('Fetching all herbs...');
  const snapshot = await db.collection('herbs').get();

  if (snapshot.empty) {
    console.log('No herbs found.');
    return;
  }

  let fixed = 0;
  const batch = db.batch();
  let batchCount = 0;

  for (const doc of snapshot.docs) {
    const data = doc.data();
    const updates = {};

    // Fix benefits: string → array
    if (typeof data.benefits === 'string') {
      updates.benefits = data.benefits
        .split(/[;,]/)
        .map(s => s.trim())
        .filter(s => s.length > 0);
      console.log(`  [${data.name}] benefits string → [${updates.benefits.length} items]`);
    }

    // Fix warnings: string → array
    if (typeof data.warnings === 'string') {
      updates.warnings = data.warnings
        .split(/[;,]/)
        .map(s => s.trim())
        .filter(s => s.length > 0);
    }

    // Fix status: 'published' → 'active'
    if (data.status === 'published') {
      updates.status = 'active';
    }

    // Add missing fields that the list page expects
    if (!Array.isArray(data.images)) updates.images = [];
    if (data.rating === undefined) updates.rating = 0;
    if (data.reviews === undefined) updates.reviews = 0;
    if (data.views === undefined) updates.views = 0;

    if (Object.keys(updates).length > 0) {
      batch.update(doc.ref, updates);
      fixed++;
      batchCount++;

      // Firestore batch limit is 500 — commit and start new batch if needed
      if (batchCount >= 450) {
        await batch.commit();
        console.log(`Committed batch of ${batchCount}...`);
        batchCount = 0;
      }
    }
  }

  if (batchCount > 0) {
    await batch.commit();
  }

  console.log(`\n✅ Done! Fixed ${fixed} of ${snapshot.size} herbs.`);
}

fixHerbs()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error('Error:', err);
    process.exit(1);
  });