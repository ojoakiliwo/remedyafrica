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
  process.exit(1);
}

console.log('Setting admin claim for UID:', uid);

admin.auth().setCustomUserClaims(uid, { admin: true })
  .then(() => {
    console.log(`✅ Success! User ${uid} is now an admin.`);
    console.log('');
    console.log('⚠️  IMPORTANT: The user must sign out and sign back in for changes to take effect.');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Error setting admin claim:', error.message);
    console.error('Error code:', error.code);
    process.exit(1);
  });