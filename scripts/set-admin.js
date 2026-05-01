const admin = require('firebase-admin');
const path = require('path');
const fs = require('fs');

const serviceAccountPath = path.join(__dirname, '..', 'serviceAccountKey.json');
const serviceAccount = JSON.parse(fs.readFileSync(serviceAccountPath, 'utf8'));

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const uid = process.argv[2];
if (!uid) {
  console.error('Usage: node scripts/verify-admin.js <UID>');
  process.exit(1);
}

async function verify() {
  const doc = await admin.firestore().collection('users').doc(uid).get();
  if (!doc.exists) {
    console.log('❌ No Firestore user document found at users/' + uid);
    return;
  }
  const data = doc.data();
  console.log('Firestore user document:', JSON.stringify(data, null, 2));
  console.log('');
  console.log('role:', data.role);
  console.log('isAdmin:', data.isAdmin);
  console.log(data.role === 'admin' ? '✅ This user IS an admin' : '❌ This user is NOT an admin');
}
verify();