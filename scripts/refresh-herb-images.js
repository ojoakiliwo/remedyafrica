#!/usr/bin/env node
/**
 * refresh-herb-images.js
 * -----------------------
 * Give every herb 2–4 REAL, working photos (sourced from Wikimedia Commons —
 * actual photographs, never AI-generated), and remove broken/expiring images.
 *
 * For each herb it will:
 *   1. Collect the currently attached images (imageUrl string, images[] of
 *      strings or {url,path,...} objects, legacy `image`).
 *   2. Validate every image over HTTP (status 200 + image/* content-type +
 *      sensible size). Expiring signed URLs are treated as broken when
 *      --replace-signed is set (default on).
 *   3. Delete broken images from Firebase Storage (only objects we own, under
 *      `herbs/<id>/`) and drop them from the Firestore document.
 *   4. Top the herb up to the target number of images (default 2–4) with
 *      distinct real photographs from Wikimedia Commons, uploaded to Storage
 *      with a Firebase download token (durable URLs that don't expire).
 *   5. Write back a normalized `images` array and a primary `imageUrl`.
 *
 * Safe by default: keeps existing VALID images, is idempotent and resumable
 * (progress is written to image-refresh-progress.json), and supports --dry-run.
 *
 * Credentials (live mode):
 *   - FIREBASE_SERVICE_ACCOUNT  = the service-account JSON (stringified), OR
 *   - a serviceAccountKey.json file in the repo root.
 *   - FIREBASE_STORAGE_BUCKET   = bucket name (default remedyafricaojo.firebasestorage.app)
 *
 * Usage:
 *   node scripts/refresh-herb-images.js --dry-run          # report only, no writes
 *   node scripts/refresh-herb-images.js                    # apply changes
 *   node scripts/refresh-herb-images.js --limit 20         # first 20 herbs
 *   node scripts/refresh-herb-images.js --only-broken      # skip herbs already OK
 *   node scripts/refresh-herb-images.js --min 2 --max 4    # images per herb
 *   node scripts/refresh-herb-images.js --self-test        # engine test, no Firebase
 */

'use strict';

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

// ─────────────────────────── CLI ARGS ───────────────────────────
function parseArgs(argv) {
  const args = {
    dryRun: false,
    selfTest: false,
    onlyBroken: false,
    replaceSigned: true,
    min: 2,
    max: 4,
    limit: 0,
    herbDelayMs: 1200,
    apiDelayMs: 300,
  };
  for (let i = 2; i < argv.length; i++) {
    const a = argv[i];
    if (a === '--dry-run') args.dryRun = true;
    else if (a === '--self-test') args.selfTest = true;
    else if (a === '--only-broken') args.onlyBroken = true;
    else if (a === '--keep-signed') args.replaceSigned = false;
    else if (a === '--min') args.min = parseInt(argv[++i], 10);
    else if (a === '--max') args.max = parseInt(argv[++i], 10);
    else if (a === '--limit') args.limit = parseInt(argv[++i], 10);
    else if (a === '--herb-delay') args.herbDelayMs = parseInt(argv[++i], 10);
  }
  if (!(args.min >= 1)) args.min = 2;
  if (!(args.max >= args.min)) args.max = Math.max(args.min, 4);
  return args;
}

const ARGS = parseArgs(process.argv);

const COMMONS_API = 'https://commons.wikimedia.org/w/api.php';
const USER_AGENT =
  'RemedyAfricaBot/1.0 (herbal remedies database; +https://remedyafrica.com)';
const MIN_WIDTH = 400;
const MIN_BYTES = 3000;

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

// Filenames that are clearly NOT real photographs (drawings, botanical plates,
// diagrams, maps, icons, vector art). Keeps the result "not AI / not illustration".
const NON_PHOTO_KEYWORDS = [
  'diagram', 'map', 'chart', 'illustration', 'drawing', 'sketch', 'icon',
  'logo', 'plate', 'lithograph', 'engraving', 'köhler', 'koehler', 'kohler',
  'koeh-', 'sturm', 'lindman', 'thomé', 'thome', 'botanical', 'vintage', 'painting',
  'clipart', 'clip art', 'distribution', 'range map', 'label', 'herbarium',
  'coat of arms', 'coat_of_arms', 'stamp', 'coin', 'svg', 'silhouette',
];

const NON_PHOTO_MIME = new Set([
  'image/svg+xml', 'image/gif', 'application/pdf', 'image/tiff',
]);

// Prepared-food / product / packaging context — not a photo of the living plant.
const NEGATIVE_KEYWORDS = [
  'chicken', 'recipe', 'dish', 'curry', 'soup', 'salad', 'pizza', 'sauce',
  'burger', 'cooked', 'fried', 'stew', 'sausage', 'noodle', 'rice', 'pasta',
  'smoothie', 'cocktail', 'bottle', 'capsule', 'tablet', 'supplement',
  'packaging', 'packet', 'label', 'barcode', 'price', 'for sale',
];

// ─────────────────────── Wikimedia Commons ──────────────────────
async function commonsGet(params) {
  const url = `${COMMONS_API}?${new URLSearchParams({
    format: 'json',
    origin: '*',
    ...params,
  }).toString()}`;
  const res = await fetch(url, { headers: { 'User-Agent': USER_AGENT } });
  if (!res.ok) throw new Error(`Commons HTTP ${res.status}`);
  return res.json();
}

async function commonsSearch(srsearch, limit = 8) {
  try {
    const data = await commonsGet({
      action: 'query',
      list: 'search',
      srsearch,
      srnamespace: '6', // File:
      srlimit: String(limit),
    });
    return (data.query?.search || []).map((r) => r.title.replace('File:', ''));
  } catch (e) {
    console.log(`    ⚠️  search failed for "${srsearch}": ${e.message}`);
    return [];
  }
}

async function commonsImageInfo(filename) {
  try {
    const data = await commonsGet({
      action: 'query',
      titles: `File:${filename}`,
      prop: 'imageinfo',
      iiprop: 'url|size|mime|extmetadata',
    });
    const pages = data.query?.pages || {};
    for (const id in pages) {
      const info = pages[id].imageinfo?.[0];
      if (!info) continue;
      const meta = info.extmetadata || {};
      return {
        url: info.url,
        descriptionUrl: info.descriptionurl,
        width: info.width,
        height: info.height,
        mime: info.mime,
        license: meta.LicenseShortName?.value || meta.License?.value || 'Unknown',
        artist: (meta.Artist?.value || '').replace(/<[^>]+>/g, '').trim(),
      };
    }
  } catch (e) {
    console.log(`    ⚠️  imageinfo failed for "${filename}": ${e.message}`);
  }
  return null;
}

function looksLikePhoto(filename, mime) {
  const lower = filename.toLowerCase();
  if (mime && NON_PHOTO_MIME.has(mime)) return false;
  if (mime && !mime.startsWith('image/')) return false;
  if (lower.endsWith('.svg') || lower.endsWith('.pdf') || lower.endsWith('.tif')) return false;
  if (NON_PHOTO_KEYWORDS.some((k) => lower.includes(k))) return false;
  if (NEGATIVE_KEYWORDS.some((k) => lower.includes(k))) return false;
  return true;
}

/**
 * Source up to `count` distinct real photos for a herb, trying several queries
 * so we still find images when the exact scientific name is sparse.
 */
async function sourceRealImages(name, scientificName, count, seen = new Set(), apiDelayMs = 300) {
  const genus = (scientificName || '').split(/\s+/)[0];

  // Tokens used to sanity-check results from loose (common-name/genus) queries,
  // so we don't attach e.g. a recipe photo that merely mentions the herb.
  const relevanceTokens = [];
  for (const t of `${scientificName} ${genus} ${name}`.toLowerCase().split(/\s+/)) {
    if (t.length > 3) relevanceTokens.push(t);
  }
  const isRelevant = (filename) => {
    const lower = filename.toLowerCase();
    return relevanceTokens.some((t) => lower.includes(t));
  };

  // strict queries are trusted; loose queries must pass the relevance check.
  const queries = [];
  if (scientificName) {
    queries.push({ q: `"${scientificName}"`, strict: true });
    queries.push({ q: `${scientificName} flower`, strict: true });
    queries.push({ q: `${scientificName} leaves`, strict: true });
    queries.push({ q: scientificName, strict: true });
  }
  if (name) {
    queries.push({ q: `${name} plant`, strict: false });
    queries.push({ q: `${name} herb`, strict: false });
  }
  if (genus && genus.toLowerCase() !== (scientificName || '').toLowerCase()) {
    queries.push({ q: genus, strict: false });
  }

  const picked = [];
  for (const { q, strict } of queries) {
    if (picked.length >= count) break;
    const files = await commonsSearch(q, 8);
    for (const filename of files) {
      if (picked.length >= count) break;
      if (seen.has(filename)) continue;
      if (!looksLikePhoto(filename, null)) continue;
      if (!strict && !isRelevant(filename)) continue;
      const info = await commonsImageInfo(filename);
      await sleep(apiDelayMs);
      if (!info || !info.url) continue;
      if (!looksLikePhoto(filename, info.mime)) continue;
      if ((info.width || 0) < MIN_WIDTH) continue;
      seen.add(filename);
      picked.push({
        filename,
        url: info.url,
        width: info.width,
        height: info.height,
        mime: info.mime,
        license: info.license,
        artist: info.artist,
        attribution: info.descriptionUrl,
      });
    }
    await sleep(apiDelayMs);
  }
  return picked;
}

// ─────────────────────── Image validation ───────────────────────
function isSignedOrExpiring(url) {
  return /[?&](GoogleAccessId|X-Goog-Algorithm|X-Goog-Signature|Expires)=/.test(url);
}

async function validateImageUrl(url) {
  const check = (res, bytes) => {
    const ct = res.headers.get('content-type') || '';
    const lenHeader = parseInt(res.headers.get('content-length') || '0', 10);
    const size = lenHeader || bytes || 0;
    const ok =
      (res.status === 200 || res.status === 206) &&
      ct.startsWith('image/') &&
      size > 1000;
    return { ok, status: res.status, contentType: ct, size };
  };
  try {
    const head = await fetch(url, { method: 'HEAD', redirect: 'follow' });
    const ct = head.headers.get('content-type') || '';
    if (head.status === 200 && ct.startsWith('image/')) {
      const r = check(head, 0);
      if (r.ok) return r;
    }
  } catch (_) {
    /* fall through to GET */
  }
  for (let attempt = 0; attempt < 3; attempt++) {
    try {
      const res = await fetch(url, {
        method: 'GET',
        redirect: 'follow',
        headers: { Range: 'bytes=0-4096' },
      });
      // Back off on transient throttling / server errors and retry.
      if ((res.status === 429 || res.status === 503) && attempt < 2) {
        await sleep(1000 * (attempt + 1));
        continue;
      }
      let bytes = 0;
      try {
        const buf = Buffer.from(await res.arrayBuffer());
        bytes = buf.length;
      } catch (_) {}
      return check(res, bytes);
    } catch (e) {
      if (attempt < 2) { await sleep(500 * (attempt + 1)); continue; }
      return { ok: false, status: 0, contentType: '', size: 0, error: e.message };
    }
  }
  return { ok: false, status: 0, contentType: '', size: 0 };
}

// ────────────────── Herb image field normalization ──────────────
function collectHerbImageUrls(data) {
  const urls = [];
  const push = (u) => {
    if (typeof u === 'string' && u.trim()) urls.push(u.trim());
  };
  push(data.imageUrl);
  if (Array.isArray(data.images)) {
    for (const item of data.images) {
      if (typeof item === 'string') push(item);
      else if (item && typeof item === 'object' && item.url) push(item.url);
    }
  }
  push(data.image);
  return Array.from(new Set(urls));
}

function storagePathFromUrl(url, bucketName) {
  try {
    // Firebase download URL: /v0/b/<bucket>/o/<ENCODED_PATH>?...
    const m = url.match(/\/o\/([^?]+)/);
    if (m) return decodeURIComponent(m[1]);
    // Public GCS URL: storage.googleapis.com/<bucket>/<path>
    const u = new URL(url);
    if (u.hostname === 'storage.googleapis.com') {
      let p = u.pathname.replace(/^\/+/, '');
      if (bucketName && p.startsWith(bucketName + '/')) p = p.slice(bucketName.length + 1);
      return decodeURIComponent(p);
    }
  } catch (_) {}
  return null;
}

// ─────────────────────────── SELF TEST ──────────────────────────
async function selfTest() {
  console.log('🧪 SELF-TEST (no Firebase) — sourcing real photos + validating URLs\n');
  const sample = [
    { name: 'Aloe Vera', scientificName: 'Aloe vera' },
    { name: 'Moringa', scientificName: 'Moringa oleifera' },
    { name: 'Ginger', scientificName: 'Zingiber officinale' },
    { name: 'African Basil', scientificName: 'Ocimum gratissimum' },
  ];

  let totalFound = 0;
  for (const herb of sample) {
    console.log(`🌿 ${herb.name} (${herb.scientificName})`);
    const imgs = await sourceRealImages(herb.name, herb.scientificName, ARGS.max, new Set(), ARGS.apiDelayMs);
    console.log(`   → sourced ${imgs.length} candidate photo(s) (target ${ARGS.min}-${ARGS.max})`);
    let validCount = 0;
    for (const img of imgs) {
      await sleep(400);
      const v = await validateImageUrl(img.url);
      const okStr = v.ok ? '✅' : '❌';
      if (v.ok) validCount++;
      console.log(
        `     ${okStr} ${img.width}x${img.height} ${img.mime} ${(v.size / 1024).toFixed(0)}KB` +
          ` | ${img.license} | ${img.filename.slice(0, 54)}`
      );
    }
    console.log(`   → ${validCount} validated as real, loadable images\n`);
    totalFound += validCount;
    await sleep(ARGS.apiDelayMs);
  }

  console.log('— broken-image detection check —');
  const broken = [
    'https://storage.googleapis.com/remedyafricaojo.firebasestorage.app/herbs/does-not-exist/main.jpg',
    'https://example.com/not-an-image.html',
  ];
  for (const url of broken) {
    const v = await validateImageUrl(url);
    console.log(`   ${v.ok ? '✅ (unexpected)' : '❌ correctly flagged broken'} — status=${v.status} type=${v.contentType || 'n/a'} — ${url.slice(0, 70)}`);
  }

  console.log(`\n📊 Self-test complete. Total real images validated: ${totalFound}`);
  const perHerbOk = totalFound >= sample.length * ARGS.min;
  console.log(perHerbOk
    ? `✅ Engine can supply at least ${ARGS.min} real photos per herb.`
    : `⚠️  Some herbs yielded fewer than ${ARGS.min} images — the live run will fall back through extra queries.`);
}

// ─────────────────────────── LIVE RUN ───────────────────────────
function loadServiceAccount() {
  if (process.env.FIREBASE_SERVICE_ACCOUNT) {
    try {
      return JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
    } catch (e) {
      throw new Error('FIREBASE_SERVICE_ACCOUNT is set but is not valid JSON: ' + e.message);
    }
  }
  const keyPath = path.join(__dirname, '..', 'serviceAccountKey.json');
  if (fs.existsSync(keyPath)) return require(keyPath);
  throw new Error(
    'No credentials found. Set FIREBASE_SERVICE_ACCOUNT (stringified JSON) ' +
      'or place serviceAccountKey.json in the repo root.'
  );
}

const PROGRESS_FILE = path.join(__dirname, '..', 'image-refresh-progress.json');
function loadProgress() {
  if (fs.existsSync(PROGRESS_FILE)) {
    try { return JSON.parse(fs.readFileSync(PROGRESS_FILE, 'utf8')); } catch (_) {}
  }
  return { completed: [], updated: [], stillShort: [] };
}
function saveProgress(p) {
  fs.writeFileSync(PROGRESS_FILE, JSON.stringify(p, null, 2));
}

async function liveRun() {
  const { initializeApp, cert, getApps } = require('firebase-admin/app');
  const { getFirestore } = require('firebase-admin/firestore');
  const { getStorage } = require('firebase-admin/storage');

  const serviceAccount = loadServiceAccount();
  const bucketName = process.env.FIREBASE_STORAGE_BUCKET || 'remedyafricaojo.firebasestorage.app';

  if (getApps().length === 0) {
    initializeApp({ credential: cert(serviceAccount), storageBucket: bucketName });
  }
  const db = getFirestore();
  const bucket = getStorage().bucket(bucketName);

  const TEMP_DIR = path.join(__dirname, '..', 'temp-herb-images');
  if (!fs.existsSync(TEMP_DIR)) fs.mkdirSync(TEMP_DIR, { recursive: true });

  console.log(`🌿 Refresh herb images  |  bucket=${bucketName}`);
  console.log(`   target ${ARGS.min}-${ARGS.max} images/herb` +
    `${ARGS.dryRun ? '  |  DRY RUN (no writes)' : ''}` +
    `${ARGS.onlyBroken ? '  |  only-broken' : ''}` +
    `${ARGS.replaceSigned ? '  |  replacing expiring signed URLs' : ''}\n`);

  const progress = loadProgress();
  const completedSet = new Set(progress.completed);

  const snapshot = await db.collection('herbs').get();
  let herbs = [];
  snapshot.forEach((d) => herbs.push(d));
  if (ARGS.limit > 0) herbs = herbs.slice(0, ARGS.limit);

  console.log(`Found ${herbs.length} herbs (${completedSet.size} already completed in a prior run)\n`);

  const stats = { scanned: 0, brokenRemoved: 0, added: 0, updated: 0, skipped: 0, short: 0, errors: 0 };

  async function downloadTo(url, dest) {
    const res = await fetch(url, { headers: { 'User-Agent': USER_AGENT }, redirect: 'follow' });
    if (!res.ok) throw new Error(`download HTTP ${res.status}`);
    const buf = Buffer.from(await res.arrayBuffer());
    if (buf.length < MIN_BYTES) throw new Error(`download too small (${buf.length} bytes)`);
    fs.writeFileSync(dest, buf);
    return buf.length;
  }

  async function uploadDurable(localPath, destination, meta) {
    const token = crypto.randomUUID();
    await bucket.upload(localPath, {
      destination,
      metadata: {
        contentType: 'image/jpeg',
        metadata: { firebaseStorageDownloadTokens: token, ...meta },
      },
    });
    return `https://firebasestorage.googleapis.com/v0/b/${bucket.name}/o/${encodeURIComponent(destination)}?alt=media&token=${token}`;
  }

  for (let i = 0; i < herbs.length; i++) {
    const herbDoc = herbs[i];
    const id = herbDoc.id;
    const data = herbDoc.data();
    const name = data.name || 'Unknown';
    const scientificName = data.scientificName || '';

    if (completedSet.has(id)) { stats.skipped++; continue; }

    stats.scanned++;
    console.log(`[${i + 1}/${herbs.length}] ${name} (${scientificName || 'no scientific name'})`);

    try {
      // 1) Validate existing images
      const existingUrls = collectHerbImageUrls(data);
      const keep = [];      // {url, path?} valid images to retain
      const removePaths = []; // storage paths of broken owned objects to delete
      const seenFilenames = new Set();

      for (const url of existingUrls) {
        const expiring = ARGS.replaceSigned && isSignedOrExpiring(url);
        const v = expiring ? { ok: false, status: 'signed' } : await validateImageUrl(url);
        if (v.ok && !expiring) {
          keep.push({ url });
        } else {
          console.log(`   ✗ broken/expiring: status=${v.status} — ${url.slice(0, 70)}`);
          const p = storagePathFromUrl(url, bucket.name);
          if (p && p.startsWith('herbs/')) removePaths.push(p);
          stats.brokenRemoved++;
        }
      }
      console.log(`   valid existing: ${keep.length}, to remove: ${removePaths.length}`);

      // Skip herbs already healthy when --only-broken
      if (ARGS.onlyBroken && keep.length >= ARGS.min && removePaths.length === 0) {
        console.log('   ↩︎  already healthy, skipping\n');
        completedSet.add(id);
        progress.completed = [...completedSet];
        if (!ARGS.dryRun) saveProgress(progress);
        stats.skipped++;
        continue;
      }

      // 2) Delete broken owned objects from Storage
      if (!ARGS.dryRun) {
        for (const p of removePaths) {
          try { await bucket.file(p).delete(); console.log(`   🗑️  deleted ${p}`); }
          catch (e) { /* may already be gone */ }
        }
      }

      // 3) Top up to target with real photos
      const need = Math.max(0, ARGS.max - keep.length);
      let sourced = [];
      if (keep.length < ARGS.min || need > 0) {
        sourced = await sourceRealImages(name, scientificName, need > 0 ? need : ARGS.min, seenFilenames, ARGS.apiDelayMs);
        console.log(`   🔎 sourced ${sourced.length} new real photo(s) from Wikimedia Commons`);
      }

      const finalImages = [...keep.map((k) => ({ url: k.url }))];
      let idx = 0;
      for (const img of sourced) {
        if (finalImages.length >= ARGS.max) break;
        const destination = `herbs/${id}/img-${idx}-${Date.now()}.jpg`;
        idx++;
        if (ARGS.dryRun) {
          finalImages.push({ url: '(dry-run) ' + img.url, source: img.filename });
          continue;
        }
        try {
          const tmp = path.join(TEMP_DIR, `${id}-${idx}.jpg`);
          await downloadTo(img.url, tmp);
          const durableUrl = await uploadDurable(tmp, destination, {
            source: 'wikimedia-commons',
            sourceFile: img.filename,
            attribution: img.attribution || '',
            license: img.license || '',
            herbName: name,
            scientificName,
          });
          fs.unlinkSync(tmp);
          finalImages.push({
            url: durableUrl,
            path: destination,
            name: img.filename,
            source: 'wikimedia-commons',
            width: img.width,
            height: img.height,
            license: img.license,
            attribution: img.attribution,
          });
          stats.added++;
          console.log(`   ⬆️  uploaded image ${finalImages.length}: ${img.filename.slice(0, 50)}`);
        } catch (e) {
          console.log(`   ⚠️  failed to add ${img.filename.slice(0, 40)}: ${e.message}`);
        }
      }

      // 4) Write back
      const changed =
        finalImages.length !== existingUrls.length ||
        removePaths.length > 0 ||
        sourced.length > 0;

      if (finalImages.length < ARGS.min) { stats.short++; progress.stillShort = Array.from(new Set([...(progress.stillShort||[]), id])); }

      if (changed && !ARGS.dryRun) {
        await herbDoc.ref.update({
          images: finalImages,
          imageUrl: finalImages[0] ? finalImages[0].url : null,
          imagesUpdatedAt: new Date(),
          updatedAt: new Date(),
        });
        stats.updated++;
        console.log(`   💾 saved ${finalImages.length} image(s)`);
      } else if (changed) {
        stats.updated++;
        console.log(`   📝 (dry-run) would save ${finalImages.length} image(s)`);
      } else {
        console.log('   ✔︎ no change needed');
      }

      completedSet.add(id);
      progress.completed = [...completedSet];
      if (!ARGS.dryRun) saveProgress(progress);
    } catch (err) {
      stats.errors++;
      console.log(`   💥 ERROR: ${err.message}`);
    }

    console.log('');
    if (i < herbs.length - 1) await sleep(ARGS.herbDelayMs);
  }

  if (fs.existsSync(TEMP_DIR)) fs.rmSync(TEMP_DIR, { recursive: true, force: true });

  console.log('='.repeat(56));
  console.log('📊 DONE');
  console.log(`   herbs scanned:        ${stats.scanned}`);
  console.log(`   broken images removed:${stats.brokenRemoved}`);
  console.log(`   new images added:     ${stats.added}`);
  console.log(`   herbs updated:        ${stats.updated}`);
  console.log(`   herbs skipped:        ${stats.skipped}`);
  console.log(`   herbs still < ${ARGS.min} imgs: ${stats.short}`);
  console.log(`   errors:               ${stats.errors}`);
  console.log('='.repeat(56));
}

// ─────────────────────────────── MAIN ───────────────────────────
(async () => {
  try {
    if (ARGS.selfTest) await selfTest();
    else await liveRun();
  } catch (err) {
    console.error('Fatal:', err.message);
    process.exit(1);
  }
})();
