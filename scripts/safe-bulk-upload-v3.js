const { initializeApp, cert, getApps } = require('firebase-admin/app');
const { getFirestore } = require('firebase-admin/firestore');
const { getStorage } = require('firebase-admin/storage');
const https = require('https');
const fs = require('fs');
const path = require('path');

// ─── CONFIG ───
if (getApps().length === 0) {
  initializeApp({ 
    credential: cert(require('../serviceAccountKey.json')),
    storageBucket: 'remedyafricaojo.firebasestorage.app'
  });
}

const db = getFirestore();
const bucket = getStorage().bucket('remedyafricaojo.firebasestorage.app');

const TEMP_DIR = path.join(__dirname, '../temp-images');
if (!fs.existsSync(TEMP_DIR)) fs.mkdirSync(TEMP_DIR, { recursive: true });

const PROGRESS_FILE = path.join(__dirname, '../upload-progress.json');
const DELAY_MS = 2000;
const MIN_WIDTH = 400;

// ─── PROGRESS TRACKING ───
function loadProgress() {
  if (fs.existsSync(PROGRESS_FILE)) {
    try {
      return JSON.parse(fs.readFileSync(PROGRESS_FILE, 'utf8'));
    } catch (e) {
      console.log('⚠️  Corrupt progress file, starting fresh');
    }
  }
  return { completed: [], failed: [], notFound: [] };
}

function saveProgress(progress) {
  fs.writeFileSync(PROGRESS_FILE, JSON.stringify(progress, null, 2));
}

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

async function processHerb(herbDoc, progress) {
  const data = herbDoc.data();
  const id = herbDoc.id;
  const name = data.name || 'Unknown';
  const scientificName = data.scientificName || '';

  // SKIP if already processed
  if (progress.completed && progress.completed.includes(id)) {
    return { status: 'skipped', name, reason: 'already_processed' };
  }

  // SKIP if already has imageUrl (your manual uploads + previous fixes)
  if (data.imageUrl && data.imageUrl.length > 10 && !data.imageUrl.includes('GoogleAccessId')) {
    if (!progress.completed) progress.completed = [];
    progress.completed.push(id);
    return { status: 'skipped', name, reason: 'already_has_public_imageUrl' };
  }

  console.log(`\n🔍 ${name} (${scientificName})`);

  const imageInfo = await searchWikimedia(scientificName);
  if (!imageInfo) {
    console.log(`  ❌ No image found`);
    if (!progress.notFound) progress.notFound = [];
    progress.notFound.push(id);
    return { status: 'not_found', name };
  }

  console.log(`  ✅ Found: ${imageInfo.filename} (${imageInfo.width}x${imageInfo.height})`);

  const tempPath = path.join(TEMP_DIR, `${id}.jpg`);
  await downloadFile(imageInfo.url, tempPath);
  console.log(`  ⬇️  Downloaded`);

  const destination = `herbs/${id}/main.jpg`;

  // Upload to Firebase Storage
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

  // Use public URL (no signed URL!)
  const publicUrl = `https://storage.googleapis.com/${bucket.name}/${destination}`;

  console.log(`  ☁️  Uploaded: ${publicUrl}`);

  // Update Firestore
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
  if (!progress.completed) progress.completed = [];
  progress.completed.push(id);

  return { status: 'success', name, url: publicUrl };
}

// ─── MAIN ───
async function main() {
  console.log('🌿 SAFE BULK IMAGE UPLOAD STARTING...');
  console.log('   ✋ Will NOT overwrite existing images\n');

  const progress = loadProgress();

  // Ensure arrays exist
  if (!progress.completed) progress.completed = [];
  if (!progress.failed) progress.failed = [];
  if (!progress.notFound) progress.notFound = [];

  console.log(`   Resume progress: ${progress.completed.length} done, ${progress.failed.length} failed, ${progress.notFound.length} not found\n`);

  const snapshot = await db.collection('herbs').get();
  const herbs = [];
  snapshot.forEach(doc => herbs.push(doc));

  // Filter out already processed
  const toProcess = herbs.filter(h => !progress.completed.includes(h.id));

  console.log(`Total herbs: ${herbs.length}`);
  console.log(`Already done: ${progress.completed.length}`);
  console.log(`To process: ${toProcess.length}\n`);

  let success = 0, skipped = 0, notFound = 0, errors = 0;

  for (let i = 0; i < toProcess.length; i++) {
    const herb = toProcess[i];
    console.log(`[${i + 1}/${toProcess.length}] (overall: ${progress.completed.length + i + 1}/${herbs.length})`);

    try {
      const result = await processHerb(herb, progress);
      if (result.status === 'success') success++;
      else if (result.status === 'skipped') skipped++;
      else if (result.status === 'not_found') notFound++;
    } catch (err) {
      console.error(`  💥 ERROR: ${err.message}`);
      if (!progress.failed) progress.failed = [];
      progress.failed.push({ id: herb.id, error: err.message, time: new Date().toISOString() });
      errors++;
    }

    // Save progress after every herb
    saveProgress(progress);

    if (i < toProcess.length - 1) {
      process.stdout.write(`  ⏱️  Waiting ${DELAY_MS}ms...`);
      await new Promise(r => setTimeout(r, DELAY_MS));
      process.stdout.write('\r                          \r');
    }
  }

  // Clean up
  if (fs.existsSync(TEMP_DIR)) {
    fs.rmSync(TEMP_DIR, { recursive: true, force: true });
  }

  console.log('\n' + '='.repeat(50));
  console.log('📊 BULK IMAGE UPLOAD COMPLETE');
  console.log(`   ✅ Success this run: ${success}`);
  console.log(`   ⏭️  Skipped (already done): ${skipped}`);
  console.log(`   ❌ No image found: ${notFound}`);
  console.log(`   💥 Errors: ${errors}`);
  console.log(`   📦 Total processed ever: ${progress.completed.length}`);
  console.log('='.repeat(50));
}

main().catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});