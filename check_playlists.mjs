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

async function check(dbId) {
  console.log(`--- CHECK DB: ${dbId} ---`);
  const app = initializeApp({ credential: cert(serviceAccount) }, `check-${dbId}`);
  const db = getFirestore(app, dbId === '(default)' ? undefined : dbId);

  const playlists = await db.collection('iptv_playlists').get();
  console.log(`Playlists found: ${playlists.size}`);
  playlists.forEach(p => {
    const d = p.data();
    console.log(` - [${p.id}] ${d.name || d.url} (Active: ${d.active})`);
  });

  const channelsCount = await db.collection('iptv_channels').count().get();
  console.log(`Total Channels (iptv_channels): ${channelsCount.data().count}`);

  await app.delete();
}

async function run() {
  await check('(default)');
  await check(PROD_DB_ID);
}

run();
