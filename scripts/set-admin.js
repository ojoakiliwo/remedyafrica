const admin = require('firebase-admin');
const path = require('path');

console.log('Starting admin setup...');

// Check if service account file exists
const fs = require('fs');
const serviceAccountPath = path.join(__dirname, '..', 'serviceAccountKey.json');

console.log('Looking for service account at:', serviceAccountPath);

if (!fs.existsSync(serviceAccountPath)) {
  console.error('❌ Error: serviceAccountKey.json not found!');
  console.error('Expected path:', serviceAccountPath);
  process.exit(1);
}

console.log('✅ Service account file found');

let serviceAccount;
try {
  const fileContent = fs.readFileSync(serviceAccountPath, 'utf8');
  console.log('File content length:', fileContent.length);
  serviceAccount = JSON.parse(fileContent);
  console.log('✅ Service account parsed successfully');
  console.log('Project ID:', serviceAccount.project_id);
} catch (error) {
  console.error('❌ Error reading/parsing service account:', error.message);
  process.exit(1);
}

try {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
  });
  console.log('✅ Firebase Admin initialized');
} catch (error) {
  console.error('❌ Error initializing Firebase Admin:', error.message);
  process.exit(1);
}

const uid = process.argv[2];

if (!uid) {
  console.error('❌ Error: Please provide a user UID');
  console.error('Usage: node scripts/set-admin.js <USER_UID>');
  console.error('');
  console.error('To find your UID:');
  console.error('1. Go to Firebase Console → Authentication → Users');
  console.error('2. Copy the UID of the user you want to make admin');
  console.error('');
  console.error('Or run in browser console when logged in:');
  console.error('  console.log(auth.currentUser.uid)');
  process.exit(1);
}

async function setAdmin() {
  try {
    console.log('Setting admin claim for UID:', uid);
    
    // 1. Set custom claim in Auth
    await admin.auth().setCustomUserClaims(uid, { admin: true });
    console.log(`✅ Custom claim set for user ${uid}`);
    
    // 2. Update Firestore user document with role field
    const db = admin.firestore();
    await db.collection('users').doc(uid).set({
      role: 'admin',
      isAdmin: true,
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    }, { merge: true });
    console.log(`✅ Firestore document updated with role: 'admin'`);
    
    console.log('');
    console.log('🎉 SUCCESS! User is now an admin.');
    console.log('');
    console.log('⚠️  IMPORTANT: The user must SIGN OUT and SIGN BACK IN for changes to take effect.');
    console.log('');
    console.log('The user document now has:');
    console.log('  - role: "admin"');
    console.log('  - isAdmin: true');
    console.log('');
    console.log('Auth token now has:');
    console.log('  - admin: true (custom claim)');
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error('Error code:', error.code);
    process.exit(1);
  }
}

setAdmin();