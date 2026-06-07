console.log('Starting diagnostic...');

try {
  const { initializeApp, cert } = require('firebase-admin/app');
  console.log('✅ firebase-admin loaded');
  
  const SERVICE_ACCOUNT = require('../serviceAccountKey.json');
  console.log('✅ Service account loaded');
  
  initializeApp({
    credential: cert(SERVICE_ACCOUNT),
    storageBucket: 'remedyafricaojo.firebasestorage.app'
  });
  console.log('✅ Firebase initialized');
  
  const { getFirestore } = require('firebase-admin/firestore');
  const { getStorage } = require('firebase-admin/storage');
  
  const db = getFirestore();
  const bucket = getStorage().bucket();
  
  // Test Firestore
  db.collection('herbs').limit(1).get()
    .then(snap => {
      console.log(`✅ Firestore connected. Found ${snap.size} herbs in test query`);
    })
    .catch(err => {
      console.log('❌ Firestore error:', err.message);
    });
  
  // Test Storage
  bucket.getMetadata()
    .then(() => {
      console.log('✅ Storage bucket accessible');
    })
    .catch(err => {
      console.log('❌ Storage error:', err.message);
    });
  
} catch (err) {
  console.error('❌ Error:', err.message);
  process.exit(1);
}

console.log('Diagnostic complete');