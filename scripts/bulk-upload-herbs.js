const { initializeApp, cert } = require('firebase-admin/app');
const { getFirestore } = require('firebase-admin/firestore');
const fs = require('fs');
const csv = require('csv-parser');

// Initialize Firebase Admin
const serviceAccount = require('../serviceAccountKey.json'); // Download from Firebase Console → Project Settings → Service Accounts
initializeApp({
  credential: cert(serviceAccount)
});

const db = getFirestore();

async function bulkUpload() {
  const herbs = [];
  
  // Read CSV
  await new Promise((resolve, reject) => {
    fs.createReadStream('all-herbs-combined.csv')
      .pipe(csv())
      .on('data', (row) => herbs.push(row))
      .on('end', resolve)
      .on('error', reject);
  });

  console.log(`📖 Read ${herbs.length} herbs from CSV`);

  // Get existing herbs from Firestore
  const existingSnapshot = await db.collection('herbs').get();
  const existingNames = new Set();
  const existingScientific = new Set();
  
  existingSnapshot.forEach(doc => {
    const data = doc.data();
    existingNames.add(data.name?.toLowerCase().trim());
    existingScientific.add(data.scientificName?.toLowerCase().trim());
  });

  console.log(`🔍 Found ${existingNames.size} existing herbs in Firestore`);

  let added = 0;
  let skipped = 0;
  let errors = 0;

  for (const herb of herbs) {
    const name = herb.name?.trim();
    const scientificName = herb.scientificName?.trim();
    
    // Skip if already exists
    if (existingNames.has(name.toLowerCase()) || existingScientific.has(scientificName.toLowerCase())) {
      console.log(`  ⏭️  Skipping "${name}" — already exists`);
      skipped++;
      continue;
    }

    try {
      // Convert semicolon-separated benefits to array
      const benefits = herb.benefits 
        ? herb.benefits.split(';').map(s => s.trim()).filter(s => s)
        : [];
      
      const warnings = herb.warnings
        ? herb.warnings.split(/[;,]/).map(s => s.trim()).filter(s => s)
        : [];

      const herbData = {
        name,
        scientificName,
        category: herb.category || 'uncategorized',
        description: herb.description || '',
        preparation: herb.preparation || '',
        warnings,
        benefits,
        origin: herb.origin || '',
        partsUsed: herb.partsUsed || '',
        status: 'active',
        images: [], // Will be populated later
        createdAt: new Date(),
        updatedAt: new Date(),
        searchKeywords: [
          name.toLowerCase(),
          scientificName.toLowerCase(),
          herb.category,
          ...benefits.map(b => b.toLowerCase())
        ].filter(Boolean)
      };

      await db.collection('herbs').add(herbData);
      console.log(`  ✅ Added "${name}"`);
      added++;
    } catch (err) {
      console.error(`  ❌ Error adding "${name}":`, err.message);
      errors++;
    }
  }

  console.log('\n' + '='.repeat(50));
  console.log('📊 BULK UPLOAD COMPLETE');
  console.log(`   Added: ${added}`);
  console.log(`   Skipped (duplicates): ${skipped}`);
  console.log(`   Errors: ${errors}`);
  console.log(`   Total in CSV: ${herbs.length}`);
  console.log(`   Total in Firestore: ${existingNames.size + added}`);
}

bulkUpload().catch(console.error);