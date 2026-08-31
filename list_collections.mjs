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

async function list(dbId) {
  console.log(`--- COLLECTIONS DB: ${dbId} ---`);
  const app = initializeApp({ credential: cert(serviceAccount) }, `list-${dbId}`);
  const db = getFirestore(app, dbId === '(default)' ? undefined : dbId);

  const collections = await db.listCollections();
  collections.forEach(c => console.log(` - ${c.id}`));

  await app.delete();
}

async function run() {
  await list('(default)');
  await list(PROD_DB_ID);
}

run();
