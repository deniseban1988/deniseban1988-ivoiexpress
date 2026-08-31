import { initializeApp, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';

const serviceAccount = JSON.parse(process.env.FIREBASE_PROJECT_ID);
serviceAccount.private_key = serviceAccount.private_key
  .replace('-----DEBUT PRIVÉ CLÉ-----', '-----BEGIN PRIVATE KEY-----')
  .replace('-----END CLÉ PRIVÉE-----', '-----END PRIVATE KEY-----')
  .replace(/\\n/g, '\n')
  .replace(/\n/g, '\n');

const databases = [
  '(default)',
  'ai-studio-ivoirexpressfabi-76a4a3d0-f988-4d5a-95c0-db2daf7a6b58'
];

const collectionsFromBlueprint = [
  'users',
  'transport_trips',
  'reservations',
  'hotels',
  'partner_registry',
  'audit_logs',
  'iptv_contents',
  'vip_subscriptions',
  'platform_banners',
  'scan_validations',
  'iptv_channels',
  'iptv_playlists',
  'iptv_logs'
];

async function audit(dbId) {
  console.log(`AUDIT_START:${dbId}`);
  try {
    const app = initializeApp({ credential: cert(serviceAccount) }, dbId);
    const db = getFirestore(app, dbId);
    
    for (const col of collectionsFromBlueprint) {
      const snap = await db.collection(col).get();
      if (snap.size > 0) {
        console.log(`COL:${col}:COUNT:${snap.size}`);
        if (col === 'users') {
          snap.forEach(doc => {
             const d = doc.data();
             console.log(`USER:${doc.id}:EMAIL:${d.email}:ROLE:${d.role}:AGENCY:${d.agencyId || 'N/A'}:CREATED:${d.createdAt || 'N/A'}`);
          });
        }
      }
    }
    await app.delete();
  } catch (err) {
    console.error(`ERR:${err.message}`);
  }
}

async function run() {
  for (const dbId of databases) {
    await audit(dbId);
  }
}
run();
