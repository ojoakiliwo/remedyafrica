const { initializeApp, cert, getApps } = require('firebase-admin/app');
const { getFirestore } = require('firebase-admin/firestore');
const { getStorage } = require('firebase-admin/storage');
const https = require('https');
const fs = require('fs');
const path = require('path');

if (getApps().length === 0) {
  initializeApp({ 
    credential: cert(require('../serviceAccountKey.json')),
    storageBucket: 'remedyafricaojo.firebasestorage.app'
  });
}

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
          if (info.width >= 400) {
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

// ─── CHECK IF IMAGE IS VALID ───
async function isImageValid(url) {
  return new Promise((resolve) => {
    https.get(url, { method: 'HEAD', timeout: 5000 }, (res) => {
      const contentType = res.headers['content-type'];
      const contentLength = res.headers['content-length'];

      if (res.statusCode === 200 && contentType && contentType.startsWith('image/') && parseInt(contentLength) > 1000) {
        resolve(true);
      } else {
        console.log(`    Invalid: status=${res.statusCode}, type=${contentType}, size=${contentLength}`);
        resolve(false);
      }
    }).on('error', (err) => {
      console.log(`    Error checking: ${err.message}`);
      resolve(false);
    });
  });
}

// ─── MAIN ───
async function main() {
  console.log('🔍 CHECKING AND FIXING CORRUPTED IMAGES...\n');

  const snapshot = await db.collection('herbs').get();
  const herbs = [];
  snapshot.forEach(doc => herbs.push(doc));

  console.log(`Found ${herbs.length} herbs\n`);

  let valid = 0, corrupted = 0, fixed = 0, noImage = 0, errors = 0;

  for (let i = 0; i < herbs.length; i++) {
    const herb = herbs[i];
    const data = herb.data();
    const id = herb.id;
    const name = data.name || 'Unknown';
    const scientificName = data.scientificName || '';
    const imageUrl = data.imageUrl;

    console.log(`[${i + 1}/${herbs.length}] ${name}`);

    if (!imageUrl) {
      console.log(`  ❌ No imageUrl`);
      noImage++;
      continue;
    }

    const validImage = await isImageValid(imageUrl);

    if (validImage) {
      console.log(`  ✅ Valid image`);
      valid++;
      continue;
    }

    console.log(`  🔧 Corrupted — attempting re-upload...`);
    corrupted++;

    try {
      const imageInfo = await searchWikimedia(scientificName);
      if (!imageInfo) {
        console.log(`    ❌ No new image found`);
        noImage++;
        continue;
      }

      console.log(`    ✅ Found: ${imageInfo.filename}`);

      const tempPath = path.join(TEMP_DIR, `${id}.jpg`);
      await downloadFile(imageInfo.url, tempPath);

      const stats = fs.statSync(tempPath);
      if (stats.size < 1000) {
        console.log(`    ❌ Download too small (${stats.size} bytes)`);
        fs.unlinkSync(tempPath);
        noImage++;
        continue;
      }

      console.log(`    ⬇️  Downloaded ${stats.size} bytes`);

      const destination = `herbs/${id}/main.jpg`;
      try {
        await bucket.file(destination).delete();
        console.log(`    🗑️  Deleted old corrupted file`);
      } catch (e) {
        // File might not exist
      }

      await bucket.upload(tempPath, {
        destination,
        metadata: {
          contentType: 'image/jpeg',
          metadata: {
            source: 'wikimedia-commons',
            herbName: name,
            scientificName: scientificName,
            fixedAt: new Date().toISOString()
          }
        }
      });

      const publicUrl = `https://storage.googleapis.com/${bucket.name}/${destination}`;
      console.log(`    ☁️  Uploaded`);

      await herb.ref.update({
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
      console.log(`    💾 Fixed!`);

      fs.unlinkSync(tempPath);
      fixed++;

    } catch (err) {
      console.log(`    💥 ERROR: ${err.message}`);
      errors++;
    }

    if (i < herbs.length - 1) {
      await new Promise(r => setTimeout(r, 1000));
    }
  }

  if (fs.existsSync(TEMP_DIR)) {
    fs.rmSync(TEMP_DIR, { recursive: true, force: true });
  }

  console.log('\n' + '='.repeat(50));
  console.log('📊 RESULTS');
  console.log(`   ✅ Already valid: ${valid}`);
  console.log(`   🔧 Corrupted but fixed: ${fixed}`);
  console.log(`   ❌ No image available: ${noImage}`);
  console.log(`   💥 Errors: ${errors}`);
  console.log(`   📦 Total: ${herbs.length}`);
  console.log('='.repeat(50));
}

main().catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});