const { initializeApp, cert } = require('firebase-admin/app');
const { getFirestore } = require('firebase-admin/firestore');
const { getStorage } = require('firebase-admin/storage');
const https = require('https');
const fs = require('fs');
const path = require('path');

// ─── INIT ───
const SERVICE_ACCOUNT = require('../serviceAccountKey.json');
initializeApp({
  credential: cert(SERVICE_ACCOUNT),
  storageBucket: 'remedyafricaojo.firebasestorage.app'
});

const db = getFirestore();
const bucket = getStorage().bucket();

const TEMP_DIR = path.join(__dirname, '../temp-images');
if (!fs.existsSync(TEMP_DIR)) fs.mkdirSync(TEMP_DIR, { recursive: true });

// ─── TEST 1: Count herbs ───
async function testHerbCount() {
  console.log('\n📊 TEST 1: Herb Count');
  const snapshot = await db.collection('herbs').get();
  console.log(`   Total herbs: ${snapshot.size}`);

  // Check first 3 herbs
  let checked = 0;
  snapshot.forEach(doc => {
    if (checked < 3) {
      const data = doc.data();
      console.log(`   Herb ${checked + 1}: ${data.name} | imageUrl: ${data.imageUrl ? 'YES' : 'NO'} | images: ${data.images ? 'YES' : 'NO'}`);
      checked++;
    }
  });
}

// ─── TEST 2: Test upload a small file ───
async function testUpload() {
  console.log('\n📤 TEST 2: Direct Upload');
  const testContent = Buffer.from('test image content');
  const testPath = path.join(TEMP_DIR, 'test-upload.txt');
  fs.writeFileSync(testPath, testContent);

  try {
    await bucket.upload(testPath, {
      destination: 'test/test-file.txt',
      metadata: { contentType: 'text/plain' }
    });
    console.log('   ✅ Upload succeeded');

    // Get signed URL
    const file = bucket.file('test/test-file.txt');
    const [url] = await file.getSignedUrl({ action: 'read', expires: '03-01-2500' });
    console.log(`   ✅ Signed URL: ${url.substring(0, 80)}...`);

    // Clean up
    await file.delete();
    console.log('   ✅ Cleanup done');
  } catch (err) {
    console.log(`   ❌ Upload failed: ${err.message}`);
  }

  fs.unlinkSync(testPath);
}

// ─── TEST 3: Check Wikimedia search ───
function fetchJson(url) {
  return new Promise((resolve, reject) => {
    https.get(url, { headers: { 'User-Agent': 'RemedyAfricaBot/1.0' } }, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try { resolve(JSON.parse(data)); } catch (e) { reject(e); }
      });
    }).on('error', reject);
  });
}

async function testWikimedia() {
  console.log('\n🌐 TEST 3: Wikimedia Search');
  const scientificName = 'Aloe vera';
  const query = encodeURIComponent(`"${scientificName}"`);
  const searchUrl = `https://commons.wikimedia.org/w/api.php?action=query&list=search&srsearch=${query}&srnamespace=6&srlimit=1&format=json&origin=*`;

  try {
    const data = await fetchJson(searchUrl);
    const results = data.query?.search || [];
    console.log(`   Found ${results.length} results for "${scientificName}"`);

    if (results.length > 0) {
      console.log(`   First result: ${results[0].title}`);
    }
  } catch (err) {
    console.log(`   ❌ Wikimedia error: ${err.message}`);
  }
}

// ─── TEST 4: Check if herbs have scientificName ───
async function testScientificNames() {
  console.log('\n🔬 TEST 4: Scientific Names');
  const snapshot = await db.collection('herbs').get();
  let withSciName = 0;
  let withoutSciName = 0;

  snapshot.forEach(doc => {
    const data = doc.data();
    if (data.scientificName && data.scientificName.trim().length > 0) {
      withSciName++;
    } else {
      withoutSciName++;
    }
  });

  console.log(`   Herbs WITH scientificName: ${withSciName}`);
  console.log(`   Herbs WITHOUT scientificName: ${withoutSciName}`);
  console.log(`   ⚠️  Wikimedia search needs scientificName to find images!`);
}

// ─── MAIN ───
async function main() {
  console.log('🔍 DEEP DIAGNOSTIC STARTING...\n');

  await testHerbCount();
  await testUpload();
  await testWikimedia();
  await testScientificNames();

  console.log('\n✅ Diagnostic complete');
  process.exit(0);
}

main().catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});