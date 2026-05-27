const { initializeApp, cert } = require('firebase-admin/app');
const { getFirestore } = require('firebase-admin/firestore');
const { getStorage } = require('firebase-admin/storage');
const https = require('https');

const SERVICE_ACCOUNT = require('../serviceAccountKey.json');
const STORAGE_BUCKET = 'remedyafricaojo.appspot.com';

initializeApp({
  credential: cert(SERVICE_ACCOUNT),
  storageBucket: STORAGE_BUCKET
});

const db = getFirestore();
const bucket = getStorage().bucket();

async function checkImage(url) {
  return new Promise((resolve) => {
    https.get(url, { timeout: 10000 }, (res) => {
      resolve({
        status: res.statusCode,
        contentType: res.headers['content-type'],
        size: res.headers['content-length']
      });
    }).on('error', (err) => {
      resolve({ status: 0, error: err.message });
    });
  });
}

async function diagnose() {
  console.log('🔍 DIAGNOSING IMAGE ISSUES...\n');
  
  const snapshot = await db.collection('herbs').limit(10).get();
  
  for (const doc of snapshot.docs) {
    const data = doc.data();
    const name = data.name;
    const images = data.images || [];
    
    console.log(`\n🌿 ${name}`);
    console.log(`   ID: ${doc.id}`);
    console.log(`   Images count: ${images.length}`);
    
    if (images.length === 0) {
      console.log('   ⚠️  No images in Firestore');
      continue;
    }
    
    const img = images[0];
    console.log(`   URL: ${img.url?.substring(0, 80)}...`);
    console.log(`   Path: ${img.path || 'N/A'}`);
    
    // Check if file exists in Storage
    if (img.path) {
      try {
        const [exists] = await bucket.file(img.path).exists();
        console.log(`   File exists in Storage: ${exists ? '✅ YES' : '❌ NO'}`);
      } catch (e) {
        console.log(`   File check error: ${e.message}`);
      }
    }
    
    // Check if URL is accessible
    if (img.url) {
      const result = await checkImage(img.url);
      console.log(`   HTTP Status: ${result.status} ${result.status === 200 ? '✅' : '❌'}`);
      console.log(`   Content-Type: ${result.contentType || 'N/A'}`);
      console.log(`   Size: ${result.size ? (result.size / 1024).toFixed(1) + 'KB' : 'N/A'}`);
      if (result.error) console.log(`   Error: ${result.error}`);
    }
  }
  
  console.log('\n' + '='.repeat(50));
  console.log('DIAGNOSIS COMPLETE');
  console.log('='.repeat(50));
}

diagnose().catch(console.error);