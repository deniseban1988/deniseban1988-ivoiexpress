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
  console.log('--- 🛡️ DIAGNOSTIC DE VALIDATION FINALE (PROD) ---');
  const app = initializeApp({ credential: cert(serviceAccount) }, 'final-test');
  const db = getFirestore(app, PROD_DB_ID);

  // 1. IPTV Channels
  const snapshot = await db.collection('iptv_channels').count().get();
  const total = snapshot.data().count;
  console.log(`1. Catalogue IPTV: ${total} items`);

  // 2. Sample Data Integrity
  const firstItems = await db.collection('iptv_channels').limit(5).get();
  console.log('\n2. Échantillon de données:');
  firstItems.forEach(doc => {
    const d = doc.data();
    console.log(` - [${d.type}] ${d.name} (${d.country || 'N/A'}) -> ${d.streamUrl ? 'URL OK' : 'PAS D_URL'}`);
  });

  // 3. User Sync Test (Check if any users exist)
  const usersCount = await db.collection('users').count().get();
  console.log(`\n3. Utilisateurs en base: ${usersCount.data().count}`);

  await app.delete();
}

run();
