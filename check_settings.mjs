import { initializeApp, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import dotenv from 'dotenv';

dotenv.config();

const PROD_DB_ID = 'ai-studio-ivoirexpressfabi-76a4a3d0-f988-4d5a-95c0-db2daf7a6b58';
const serviceAccount = JSON.parse(process.env.FIREBASE_PROJECT_ID);
serviceAccount.private_key = serviceAccount.private_key
  .replace('-----DEBUT PRIVÉ CLÉ-----', '-----BEGIN PRIVATE KEY-----')
  .replace('-----END CLÉ PRIVÉE-----', '-----END PRIVATE KEY-----')
  .replace(/\\n/g, '\n')
  .replace(/\n/g, '\n');

async function run() {
  const app = initializeApp({ credential: cert(serviceAccount) }, 'settings-check');
  const db = getFirestore(app, PROD_DB_ID);
  const doc = await db.collection('iptv_settings').doc('global').get();
  console.log('Settings Found:', doc.exists);
  if (doc.exists) {
    console.log(JSON.stringify(doc.data(), null, 2));
  }
  await app.delete();
}

run();
