const { initializeApp, cert } = require('firebase-admin/app');
const { getFirestore } = require('firebase-admin/firestore');
const { getStorage } = require('firebase-admin/storage');
const https = require('https');
const fs = require('fs');
const path = require('path');

// ─── CONFIG ───
const SERVICE_ACCOUNT = require('../serviceAccountKey.json');
const STORAGE_BUCKET = 'remedyafricaojo.firebasestorage.app'; // ✅ CORRECT BUCKET
const DELAY_MS = 8000;
const MIN_WIDTH = 400;

initializeApp({
  credential: cert(SERVICE_ACCOUNT),
  storageBucket: STORAGE_BUCKET
});

const db = getFirestore();
const bucket = getStorage().bucket();

const TEMP_DIR = path.join(__dirname, '../temp-images');
if (!fs.existsSync(TEMP_DIR)) fs.mkdirSync(TEMP_DIR, { recursive: true });

const PROGRESS_FILE = path.join(__dirname, '../upload-progress.json');
let processedIds = new Set();
if (fs.existsSync(PROGRESS_FILE)) {
  processedIds = new Set(JSON.parse(fs.readFileSync(PROGRESS_FILE, 'utf8')));
  console.log(`📋 Resuming: ${processedIds.size} herbs already processed\n`);
}

function sleep(ms) {
  return new Promise(r => setTimeout(r, ms));
}

function saveProgress(id) {
  processedIds.add(id);
  fs.writeFileSync(PROGRESS_FILE, JSON.stringify([...processedIds], null, 2));
}

async function fetchJson(url, retries = 3) {
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      return await new Promise((resolve, reject) => {
        const req = https.get(url, {
          headers: {
            'User-Agent': 'RemedyAfricaBot/1.0 (educational project)',
            'Accept': 'application/json'
          },
          timeout: 15000
        }, (res) => {
          let data = '';
          res.on('data', chunk => data += chunk);
          res.on('end', () => {
            if (res.statusCode === 429) {
              reject(new Error('RATE_LIMITED'));
              return;
            }
            if (res.statusCode !== 200) {
              reject(new Error(`HTTP ${res.statusCode}`));
              return;
            }
            try { resolve(JSON.parse(data)); } catch (e) { reject(e); }
          });
        });
        req.on('error', reject);
        req.on('timeout', () => { req.destroy(); reject(new Error('TIMEOUT')); });
      });
    } catch (err) {
      if (err.message === 'RATE_LIMITED' || err.message === 'TIMEOUT') {
        const waitTime = Math.min(30000 * attempt, 120000);
        console.log(`  ⏳ Waiting ${waitTime/1000}s before retry ${attempt}/${retries}...`);
        await sleep(waitTime);
      } else if (attempt < retries) {
        await sleep(5000 * attempt);
      } else {
        throw err;
      }
    }
  }
}

async function downloadFile(url, dest, retries = 3) {
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      return await new Promise((resolve, reject) => {
        const file = fs.createWriteStream(dest);
        const req = https.get(url, {
          headers: {
            'User-Agent': 'RemedyAfricaBot/1.0 (educational project)',
            'Accept': 'image/*'
          },
          timeout: 30000
        }, (res) => {
          if (res.statusCode === 301 || res.statusCode === 302) {
            file.close(); fs.unlink(dest, () => {});
            return downloadFile(res.headers.location, dest, retries).then(resolve).catch(reject);
          }
          if (res.statusCode === 429) {
            file.close(); fs.unlink(dest, () => {});
            reject(new Error('RATE_LIMITED'));
            return;
          }
          if (res.statusCode !== 200) {
            file.close(); fs.unlink(dest, () => {});
            reject(new Error(`HTTP ${res.statusCode}`));
            return;
          }
          res.pipe(file);
          file.on('finish', () => { file.close(); resolve(); });
        });
        req.on('error', (err) => { file.close(); fs.unlink(dest, () => {}); reject(err); });
        req.on('timeout', () => { file.close(); fs.unlink(dest, () => {}); reject(new Error('TIMEOUT')); });
      });
    } catch (err) {
      if (err.message === 'RATE_LIMITED' || err.message === 'TIMEOUT') {
        const waitTime = Math.min(30000 * attempt, 120000);
        console.log(`  ⏳ Download rate limited. Waiting ${waitTime/1000}s...`);
        await sleep(waitTime);
      } else if (attempt < retries) {
        await sleep(5000 * attempt);
      } else {
        throw err;
      }
    }
  }
}

async function searchWikimedia(scientificName) {
  if (!scientificName) return null;
  
  const query = encodeURIComponent(`"${scientificName}"`);
  const searchUrl = `https://commons.wikimedia.org/w/api.php?action=query&list=search&srsearch=${query}&srnamespace=6&srlimit=5&format=json&origin=*`;
  
  try {
    const data = await fetchJson(searchUrl);
    const results = data.query?.search || [];
    
    for (const result of results) {
      const filename = result.title.replace('File:', '');
      const lower = filename.toLowerCase();
      
      const badKeywords = ['diagram', 'map', 'chart', 'illustration', 'drawing', 'icon', 'logo', 'svg', 'schema', 'anatomy', 'cross-section'];
      if (badKeywords.some(k => lower.includes(k))) continue;
      if (lower.endsWith('.svg')) continue;
      
      const infoUrl = `https://commons.wikimedia.org/w/api.php?action=query&titles=File:${encodeURIComponent(filename)}&prop=imageinfo&iiprop=url|size|mime|extmetadata&format=json&origin=*`;
      const infoData = await fetchJson(infoUrl);
      const pages = infoData.query?.pages || {};
      
      for (const pageId in pages) {
        const page = pages[pageId];
        if (page.imageinfo?.[0]) {
          const info = page.imageinfo[0];
          const mime = info.mime || '';
          if (!mime.startsWith('image/jpeg') && !mime.startsWith('image/png') && !mime.startsWith('image/webp')) continue;
          if (info.width >= MIN_WIDTH) {
            const metadata = info.extmetadata || {};
            return {
              url: info.url,
              filename,
              width: info.width,
              height: info.height,
              license: metadata.LicenseShortName?.value || 'Unknown',
              artist: metadata.Artist?.value || 'Unknown'
            };
          }
        }
      }
    }
  } catch (err) {
    if (err.message === 'RATE_LIMITED') throw err;
    console.log(`  ⚠️  Search error: ${err.message}`);
  }
  return null;
}

async function verifyUpload(storagePath) {
  try {
    const [exists] = await bucket.file(storagePath).exists();
    if (!exists) return false;
    const [metadata] = await bucket.file(storagePath).getMetadata();
    return metadata.size > 2000;
  } catch {
    return false;
  }
}

function getPublicUrl(storagePath) {
  // ✅ CORRECT URL FORMAT for your bucket
  const encoded = encodeURIComponent(storagePath);
  return `https://firebasestorage.googleapis.com/v0/b/${STORAGE_BUCKET}/o/${encoded}?alt=media`;
}

async function processHerb(doc) {
  const id = doc.id;
  if (processedIds.has(id)) return { status: 'skipped', reason: 'already_processed' };
  
  const data = doc.data();
  const name = data.name || 'Unknown';
  const scientificName = data.scientificName || '';
  
  console.log(`\n🌿 ${name} (${scientificName})`);
  
  const currentImages = data.images || [];
  if (currentImages.length > 0 && currentImages[0]?.path) {
    const isValid = await verifyUpload(currentImages[0].path);
    if (isValid) {
      console.log('  ✅ Already has valid image');
      saveProgress(id);
      return { status: 'skipped', reason: 'valid' };
    }
    console.log('  ⚠️  Current image missing — re-uploading');
  }
  
  let imageInfo;
  try {
    imageInfo = await searchWikimedia(scientificName);
  } catch (err) {
    if (err.message === 'RATE_LIMITED') {
      console.log('  🚫 RATE LIMITED by Wikimedia. Stopping to avoid ban.');
      return { status: 'rate_limited' };
    }
    console.log(`  ❌ Search failed: ${err.message}`);
    return { status: 'search_failed' };
  }
  
  if (!imageInfo) {
    console.log('  ❌ No suitable photo found');
    saveProgress(id);
    return { status: 'not_found' };
  }
  
  console.log(`  🔍 Found: ${imageInfo.filename} (${imageInfo.width}x${imageInfo.height}) [${imageInfo.license}]`);
  
  const tempPath = path.join(TEMP_DIR, `${id}.jpg`);
  try {
    await downloadFile(imageInfo.url, tempPath);
    const stats = fs.statSync(tempPath);
    console.log(`  ⬇️  Downloaded: ${(stats.size / 1024).toFixed(1)}KB`);
    if (stats.size < 2000) throw new Error('File too small');
  } catch (err) {
    console.log(`  ❌ Download failed: ${err.message}`);
    if (err.message === 'RATE_LIMITED') return { status: 'rate_limited' };
    return { status: 'download_failed' };
  }
  
  const storagePath = `herbs/${id}/main.jpg`;
  try {
    await bucket.upload(tempPath, {
      destination: storagePath,
      metadata: {
        contentType: 'image/jpeg',
        metadata: {
          source: 'wikimedia-commons',
          originalUrl: imageInfo.url,
          herbName: name,
          scientificName: scientificName,
          license: imageInfo.license,
          artist: imageInfo.artist
        }
      }
    });
    console.log('  ☁️  Uploaded to Storage');
  } catch (err) {
    console.log(`  ❌ Upload failed: ${err.message}`);
    return { status: 'upload_failed' };
  }
  
  const verified = await verifyUpload(storagePath);
  if (!verified) {
    console.log('  ❌ Verification failed — file not in Storage');
    return { status: 'verify_failed' };
  }
  console.log('  ✅ Verified in Storage');
  
  try {
    await bucket.file(storagePath).makePublic();
  } catch (err) {
    console.log(`  ⚠️  makePublic: ${err.message}`);
  }
  
  const publicUrl = getPublicUrl(storagePath);
  
  try {
    await db.collection('herbs').doc(id).update({
      images: [{
        url: publicUrl,
        path: storagePath,
        name: imageInfo.filename,
        width: imageInfo.width,
        height: imageInfo.height
      }],
      updatedAt: new Date()
    });
    console.log(`  💾 Firestore updated`);
  } catch (err) {
    console.log(`  ❌ Firestore update failed: ${err.message}`);
    return { status: 'firestore_failed' };
  }
  
  fs.unlinkSync(tempPath);
  saveProgress(id);
  return { status: 'success', url: publicUrl };
}

async function main() {
  console.log('🌿 IMAGE UPLOAD (RESUMABLE) STARTING...\n');
  console.log(`⏱️  Delay: ${DELAY_MS}ms between requests`);
  console.log(`📋 Already processed: ${processedIds.size} herbs\n`);
  
  const snapshot = await db.collection('herbs').get();
  const herbs = [];
  snapshot.forEach(doc => herbs.push(doc));
  console.log(`Found ${herbs.length} herbs total\n`);
  
  let success = 0, skipped = 0, notFound = 0, failed = 0, rateLimited = 0;
  
  for (let i = 0; i < herbs.length; i++) {
    const doc = herbs[i];
    if (processedIds.has(doc.id)) { skipped++; continue; }
    
    console.log(`\n[${i + 1}/${herbs.length}]`);
    
    try {
      const result = await processHerb(doc);
      if (result.status === 'rate_limited') {
        rateLimited++;
        console.log('\n🛑 STOPPING: Rate limited by Wikimedia Commons.');
        console.log('   Wait 2-4 hours, then run: node scripts/reupload-images.js\n');
        break;
      } else if (result.status === 'success') {
        success++;
      } else if (result.status === 'skipped') {
        skipped++;
      } else if (result.status === 'not_found') {
        notFound++;
      } else {
        failed++;
      }
    } catch (err) {
      console.error(`  💥 Unexpected error: ${err.message}`);
      failed++;
    }
    
    if (i < herbs.length - 1 && !processedIds.has(herbs[i + 1]?.id)) {
      process.stdout.write(`  ⏳ Waiting ${DELAY_MS/1000}s...`);
      await sleep(DELAY_MS);
      process.stdout.write('\r                          \r');
    }
  }
  
  if (fs.existsSync(TEMP_DIR)) {
    fs.rmSync(TEMP_DIR, { recursive: true, force: true });
  }
  
  console.log('\n' + '='.repeat(50));
  console.log('📊 UPLOAD SESSION COMPLETE');
  console.log(`   ✅ Success: ${success}`);
  console.log(`   ⏭️  Skipped: ${skipped}`);
  console.log(`   ❌ Not found: ${notFound}`);
  console.log(`   💥 Failed: ${failed}`);
  console.log(`   🚫 Rate limited: ${rateLimited}`);
  console.log(`   📦 Total: ${herbs.length}`);
  console.log(`   📋 Processed so far: ${processedIds.size}`);
  console.log('='.repeat(50));
  
  if (rateLimited > 0) {
    console.log('\n⚠️  You were rate limited by Wikimedia Commons.');
    console.log('   Wait 2-4 hours, then run: node scripts/reupload-images.js');
    console.log('   It will automatically resume.\n');
  }
}

main().catch(err => {
  console.error('Fatal:', err);
  process.exit(1);
});