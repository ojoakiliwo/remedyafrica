const { initializeApp, cert } = require('firebase-admin/app');
const { getFirestore } = require('firebase-admin/firestore');

const SERVICE_ACCOUNT = require('../serviceAccountKey.json');
const db = getFirestore();

async function check() {
  const snap = await db.collection('herbs').limit(5).get();
  snap.forEach(doc => {
    const d = doc.data();
    console.log(`${d.name}: ${d.imageUrl || 'NO imageUrl'}`);
  });
}
check();