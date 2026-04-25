const admin = require('firebase-admin');
const path = require('path');
const fs = require('fs');

console.log('Starting user name fix...');

// Check service account
const serviceAccountPath = path.join(__dirname, '..', 'serviceAccountKey.json');

if (!fs.existsSync(serviceAccountPath)) {
  console.error('❌ Error: serviceAccountKey.json not found!');
  console.error('Expected path:', serviceAccountPath);
  process.exit(1);
}

let serviceAccount;
try {
  serviceAccount = JSON.parse(fs.readFileSync(serviceAccountPath, 'utf8'));
  console.log('✅ Service account loaded — Project:', serviceAccount.project_id);
} catch (error) {
  console.error('❌ Error reading service account:', error.message);
  process.exit(1);
}

try {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
  });
  console.log('✅ Firebase Admin initialized\n');
} catch (error) {
  console.error('❌ Error initializing Firebase Admin:', error.message);
  process.exit(1);
}

const db = admin.firestore();
const auth = admin.auth();

async function fixUserNames() {
  try {
    const listUsersResult = await auth.listUsers(1000);
    let fixed = 0;
    let skipped = 0;

    for (const userRecord of listUsersResult.users) {
      const uid = userRecord.uid;
      const current = userRecord.displayName;
      const email = userRecord.email;

      // Skip users who already have a real name
      if (current && current !== 'Anonymous' && current !== 'User' && !current.includes('@')) {
        skipped++;
        continue;
      }

      // Try to get name from Firestore
      const userDoc = await db.collection('users').doc(uid).get();
      let realName = userDoc.exists ? (userDoc.data()?.displayName || userDoc.data()?.name || null) : null;

      // Fallback to email prefix
      if (!realName && email) {
        realName = email.split('@')[0];
        realName = realName.charAt(0).toUpperCase() + realName.slice(1);
      }
      if (!realName) realName = 'User';

      // Update Firebase Auth profile
      await auth.updateUser(uid, { displayName: realName });

      // Update Firestore document
      await db.collection('users').doc(uid).set({
        displayName: realName,
        name: realName,
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      }, { merge: true });

      console.log(`✅ Fixed: ${uid} → "${realName}" (was: "${current || 'null'}")`);
      fixed++;
    }

    console.log(`\n🎉 Done! Fixed ${fixed} users, skipped ${skipped}.`);
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

fixUserNames();