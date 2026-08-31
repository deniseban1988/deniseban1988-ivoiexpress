import { initializeApp, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { getAuth } from 'firebase-admin/auth';

const serviceAccount = JSON.parse(process.env.FIREBASE_PROJECT_ID);
serviceAccount.private_key = serviceAccount.private_key
  .replace('-----DEBUT PRIVÉ CLÉ-----', '-----BEGIN PRIVATE KEY-----')
  .replace('-----END CLÉ PRIVÉE-----', '-----END PRIVATE KEY-----')
  .replace(/\\n/g, '\n')
  .replace(/\n/g, '\n');

async function testCreation(env) {
  process.env.NODE_ENV = env;
  const isProduction = process.env.NODE_ENV === 'production';
  const databaseId = isProduction 
    ? 'ai-studio-ivoirexpressfabi-76a4a3d0-f988-4d5a-95c0-db2daf7a6b58' 
    : '(default)';
  
  console.log(`--- TEST CREATION EN ${env} (BDD: ${databaseId}) ---`);
  
  const appName = `test-${env}`;
  const app = initializeApp({ credential: cert(serviceAccount) }, appName);
  const db = getFirestore(app, databaseId);
  const auth = getAuth(app);

  const testEmail = `test-${env}-${Date.now()}@example.com`;
  const testUid = `uid-${env}-${Date.now()}`;

  try {
    // Note: On ne crée pas réellement dans Auth pour ne pas polluer les 7 comptes existants
    // On simule juste l'écriture Firestore qui suivrait une inscription Auth
    await db.collection('users').doc(testUid).set({
      id: testUid,
      email: testEmail,
      role: 'VOYAGEUR',
      createdAt: new Date().toISOString()
    });
    console.log(`✅ Document créé dans ${databaseId} avec UID: ${testUid}`);
    
    // Cleanup
    await db.collection('users').doc(testUid).delete();
    console.log(`✅ Nettoyage effectué.`);
  } catch (err) {
    console.error(`❌ Erreur: ${err.message}`);
  }
  await app.delete();
}

async function run() {
  await testCreation('development');
  await testCreation('production');
}

run();
