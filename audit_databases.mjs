import { initializeApp, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';

const serviceAccount = JSON.parse(process.env.FIREBASE_PROJECT_ID);

// Fix French headers and replace literal \n if they exist
serviceAccount.private_key = serviceAccount.private_key
  .replace('-----DEBUT PRIVÉ CLÉ-----', '-----BEGIN PRIVATE KEY-----')
  .replace('-----END CLÉ PRIVÉE-----', '-----END PRIVATE KEY-----')
  .replace(/\\n/g, '\n')
  .replace(/\n/g, '\n');

const databases = [
  '(default)',
  'ai-studio-ivoirexpressfabi-76a4a3d0-f988-4d5a-95c0-db2daf7a6b58'
];

const collectionsToAudit = [
  'users',
  'agencies',
  'reservations',
  'transport_trips',
  'hotels',
  'iptv_channels',
  'partners',
  'logs',
  'audit_logs',
  'banners'
];

async function auditDatabase(dbId) {
  console.log(`--- AUDIT DE LA BASE: ${dbId} ---`);
  try {
    const app = initializeApp({
      credential: cert(serviceAccount)
    }, dbId);
    
    const db = getFirestore(app, dbId);
    
    const stats = {};
    for (const col of collectionsToAudit) {
      try {
        const snap = await db.collection(col).get();
        stats[col] = snap.size;
      } catch (e) {
        stats[col] = 0;
      }
    }

    console.log('Nombre de documents par collection:', JSON.stringify(stats, null, 2));

    const userSnap = await db.collection('users').get();
    console.log(`Détails des utilisateurs (${userSnap.size} trouvé(s)):`);
    userSnap.forEach(doc => {
      const data = doc.data();
      console.log(`- UID: ${doc.id} | Email: ${data.email} | Role: ${data.role} | Agency: ${data.agencyId || 'N/A'} | Created: ${data.createdAt || 'N/A'}`);
    });

    const superAdmin = userSnap.docs.find(d => d.data().email?.toLowerCase() === 'fabriceallechi@gmail.com');
    if (superAdmin) {
      console.log('✅ Super Admin trouvé dans cette base.');
    } else {
      console.log('❌ Super Admin NON trouvé.');
    }

    await app.delete();
  } catch (err) {
    console.error(`Erreur lors de l'audit de ${dbId}: ${err.message}`);
  }
}

async function run() {
  for (const dbId of databases) {
    await auditDatabase(dbId);
    console.log('\n' + '='.repeat(50) + '\n');
  }
}

run();
