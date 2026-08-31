import { initializeApp, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';

const serviceAccount = JSON.parse(process.env.FIREBASE_PROJECT_ID);
serviceAccount.private_key = serviceAccount.private_key
  .replace('-----DEBUT PRIVÉ CLÉ-----', '-----BEGIN PRIVATE KEY-----')
  .replace('-----END CLÉ PRIVÉE-----', '-----END PRIVATE KEY-----')
  .replace(/\\n/g, '\n')
  .replace(/\n/g, '\n');

async function run() {
  const dbId = 'ai-studio-ivoirexpressfabi-76a4a3d0-f988-4d5a-95c0-db2daf7a6b58';
  try {
    const app = initializeApp({ credential: cert(serviceAccount) }, 'audit');
    const db = getFirestore(app, dbId);
    const snap = await db.collection('users').get();
    console.log(`Base: ${dbId} | Collection: users | Count: ${snap.size}`);
    snap.forEach(doc => {
      console.log(`- ${doc.id}: ${doc.data().email}`);
    });
    await app.delete();
  } catch (err) {
    console.error('Erreur:', err.message);
  }
}
run();
