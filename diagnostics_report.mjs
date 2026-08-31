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
  console.log('--- 🛡️ DIAGNOSTICS DE VALIDATION FINALE (FIRESTORE PROD) ---');
  const app = initializeApp({ credential: cert(serviceAccount) }, 'diag-final');
  const db = getFirestore(app, PROD_DB_ID);

  const colRef = db.collection('iptv_channels');
  const snapshot = await colRef.get();
  const total = snapshot.size;

  const stats = {
    TV: 0, RADIO: 0, DIRECT_EVENT: 0, FILM: 0, SERIES: 0, DOCUMENTAIRE: 0, DESSIN_ANIME: 0,
    LIVE_TOTAL: 0, VOD_TOTAL: 0,
    MISSING_URL: 0, MISSING_LOGO: 0
  };

  const urlMap = new Map();
  let duplicates = 0;

  snapshot.forEach(doc => {
    const data = doc.data();
    const type = data.type || 'TV';
    stats[type] = (stats[type] || 0) + 1;

    if (['TV', 'RADIO', 'DIRECT_EVENT'].includes(type)) stats.LIVE_TOTAL++;
    else stats.VOD_TOTAL++;

    if (!data.streamUrl) stats.MISSING_URL++;
    if (!data.logoUrl || data.logoUrl.includes('ui-avatars')) stats.MISSING_LOGO++;

    if (data.streamUrl) {
      if (urlMap.has(data.streamUrl)) duplicates++;
      urlMap.set(data.streamUrl, true);
    }
  });

  console.log('1. STATISTIQUES GLOBALES');
  console.log(` - Total Firestore: ${total}`);
  console.log(` - Doublons (URLs identiques): ${duplicates}`);
  
  console.log('\n2. SÉPARATION FONCTIONNELLE');
  console.log(` - LIVE (Chaînes TV, Radio, Événements): ${stats.LIVE_TOTAL}`);
  console.log(` - VOD (Films, Séries, Doc, Animation): ${stats.VOD_TOTAL}`);
  
  console.log('\n3. RÉPARTITION PAR TYPE');
  console.log(` - TV: ${stats.TV}`);
  console.log(` - RADIO: ${stats.RADIO}`);
  console.log(` - Événements: ${stats.DIRECT_EVENT}`);
  console.log(` - Films: ${stats.FILM}`);
  console.log(` - Séries: ${stats.SERIES}`);
  console.log(` - Documentaires: ${stats.DOCUMENTAIRE}`);
  console.log(` - Dessins Animés: ${stats.DESSIN_ANIME}`);

  console.log('\n4. QUALITÉ DU CATALOGUE');
  console.log(` - Sans URL: ${stats.MISSING_URL}`);
  console.log(` - Sans Logo original: ${stats.MISSING_LOGO}`);

  await app.delete();
}

run();
