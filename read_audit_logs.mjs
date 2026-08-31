import { initializeApp, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';

const serviceAccount = JSON.parse(process.env.FIREBASE_PROJECT_ID);
serviceAccount.private_key = serviceAccount.private_key
  .replace('-----DEBUT PRIVÉ CLÉ-----', '-----BEGIN PRIVATE KEY-----')
  .replace('-----END CLÉ PRIVÉE-----', '-----END PRIVATE KEY-----')
  .replace(/\\n/g, '\n')
  .replace(/\n/g, '\n');

async function run() {
  try {
    const app = initializeApp({ credential: cert(serviceAccount) });
    const db = getFirestore(app);
    const snap = await db.collection('audit_logs').get();
    snap.forEach(doc => {
      console.log(`Log ID: ${doc.id}`);
      console.log(JSON.stringify(doc.data(), null, 2));
    });
    await app.delete();
  } catch (err) {
    console.error('Erreur:', err.message);
  }
}
run();
