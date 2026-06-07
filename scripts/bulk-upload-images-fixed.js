const { initializeApp, cert } = require('firebase-admin/app');
const { getFirestore } = require('firebase-admin/firestore');
const { getStorage } = require('firebase-admin/storage');
const https = require('https');
const fs = require('fs');
const path = require('path');

// ─── CONFIG ───
const SERVICE_ACCOUNT = require('../serviceAccountKey.json');
const STORAGE_BUCKET = 'remedyafricaojo.firebasestorage.app';
const DELAY_MS = 2000;
const MIN_WIDTH = 400;

// ─── INIT FIREBASE ───
initializeApp({
  credential: cert(SERVICE_ACCOUNT),
  storageBucket: STORAGE_BUCKET
});

const db = getFirestore();
const bucket = getStorage().bucket();

const TEMP_DIR = path.join(__dirname, '../temp-images');
if (!fs.existsSync(TEMP_DIR)) fs.mkdirSync(TEMP_DIR, { recursive: true });

// ─── HELPERS ───
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

function downloadFile(url, dest) {
  return new Promise((resolve, reject) => {
    const file = fs.createWriteStream(dest);
    https.get(url, { headers: { 'User-Agent': 'RemedyAfricaBot/1.0' } }, (res) => {
      if (res.statusCode === 301 || res.statusCode === 302) {
        file.close();
        fs.unlink(dest, () => {});
        return downloadFile(res.headers.location, dest).then(resolve).catch(reject);
      }
      res.pipe(file);
      file.on('finish', () => { file.close(); resolve(); });
    }).on('error', (err) => {
      file.close();
      fs.unlink(dest, () => {});
      reject(err);
    });
  });
}

async function searchWikimedia(scientificName) {
  if (!scientificName) return null;
  
  const query = encodeURIComponent(`"${scientificName}"`);
  const searchUrl = `https://commons.wikimedia.org/w/api.php?action=query&list=search&srsearch=${query}&srnamespace=6&srlimit=3&format=json&origin=*`;
  
  try {
    const data = await fetchJson(searchUrl);
    const results = data.query?.search || [];
    
    for (const result of results) {
      const filename = result.title.replace('File:', '');
      
      const lower = filename.toLowerCase();
      if (['diagram', 'map', 'chart', 'illustration', 'drawing', 'icon', 'logo'].some(k => lower.includes(k))) {
        continue;
      }
      
      const infoUrl = `https://commons.wikimedia.org/w/api.php?action=query&titles=File:${encodeURIComponent(filename)}&prop=imageinfo&iiprop=url|size|mime&format=json&origin=*`;
      const infoData = await fetchJson(infoUrl);
      const pages = infoData.query?.pages || {};
      
      for (const pageId in pages) {
        const page = pages[pageId];
        if (page.imageinfo?.[0]) {
          const info = page.imageinfo[0];
          if (info.width >= MIN_WIDTH) {
            return {
              url: info.url,
              filename: filename,
              width: info.width,
              height: info.height
            };
          }
        }
      }
    }
  } catch (err) {
    console.log(`  ⚠️  Search error: ${err.message}`);
  }
  return null;
}

async function processHerb(herbDoc) {
  const data = herbDoc.data();
  const id = herbDoc.id;
  const name = data.name || 'Unknown';
  const scientificName = data.scientificName || '';
  
  // Skip if already has imageUrl
  if (data.imageUrl && data.imageUrl.length > 10) {
    return { status: 'skipped', name, reason: 'already_has_imageUrl' };
  }
  
  console.log(`🔍 ${name} (${scientificName})`);
  
  const imageInfo = await searchWikimedia(scientificName);
  if (!imageInfo) {
    console.log(`  ❌ No image found`);
    return { status: 'not_found', name };
  }
  
  console.log(`  ✅ Found: ${imageInfo.filename} (${imageInfo.width}x${imageInfo.height})`);
  
  const tempPath = path.join(TEMP_DIR, `${id}.jpg`);
  await downloadFile(imageInfo.url, tempPath);
  console.log(`  ⬇️  Downloaded`);
  
  const destination = `herbs/${id}/main.jpg`;
  
  await bucket.upload(tempPath, {
    destination,
    metadata: {
      contentType: 'image/jpeg',
      metadata: {
        source: 'wikimedia-commons',
        originalUrl: imageInfo.url,
        herbName: name,
        scientificName: scientificName
      }
    }
  });
  
  const file = bucket.file(destination);
  const [publicUrl] = await file.getSignedUrl({
    action: 'read',
    expires: '03-01-2500'
  });
  
  console.log(`  ☁️  Uploaded`);
  
  await db.collection('herbs').doc(id).update({
    imageUrl: publicUrl,
    images: [{ 
      url: publicUrl, 
      path: destination, 
      name: imageInfo.filename,
      width: imageInfo.width,
      height: imageInfo.height
    }],
    updatedAt: new Date()
  });
  console.log(`  💾 Firestore updated`);
  
  fs.unlinkSync(tempPath);
  
  return { status: 'success', name, url: publicUrl };
}

// ─── MAIN ───
async function main() {
  console.log('🌿 BULK IMAGE UPLOAD STARTING...');
  console.log(`   Bucket: ${STORAGE_BUCKET}`);
  console.log(`   Temp dir: ${TEMP_DIR}\n`);
  
  const snapshot = await db.collection('herbs').get();
  const herbs = [];
  snapshot.forEach(doc => herbs.push(doc));
  
  console.log(`Found ${herbs.length} herbs in Firestore\n`);
  
  let success = 0, skipped = 0, notFound = 0, errors = 0;
  
  for (let i = 0; i < herbs.length; i++) {
    const herb = herbs[i];
    console.log(`\n[${i + 1}/${herbs.length}]`);
    
    try {
      const result = await processHerb(herb);
      if (result.status === 'success') success++;
      else if (result.status === 'skipped') skipped++;
      else if (result.status === 'not_found') notFound++;
    } catch (err) {
      console.error(`  💥 ERROR: ${err.message}`);
      errors++;
    }
    
    if (i < herbs.length - 1) {
      process.stdout.write(`  ⏱️  Waiting ${DELAY_MS}ms...`);
      await new Promise(r => setTimeout(r, DELAY_MS));
      process.stdout.write('\r                          \r');
    }
  }
  
  if (fs.existsSync(TEMP_DIR)) {
    fs.rmSync(TEMP_DIR, { recursive: true, force: true });
  }
  
  console.log('\n' + '='.repeat(50));
  console.log('📊 BULK IMAGE UPLOAD COMPLETE');
  console.log(`   ✅ Success: ${success}`);
  console.log(`   ⏭️  Skipped (has images): ${skipped}`);
  console.log(`   ❌ No image found: ${notFound}`);
  console.log(`   💥 Errors: ${errors}`);
  console.log(`   📦 Total: ${herbs.length}`);
  console.log('='.repeat(50));
}

main().catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});