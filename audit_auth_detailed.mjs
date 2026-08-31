import { initializeApp, cert } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';

const serviceAccount = JSON.parse(process.env.FIREBASE_PROJECT_ID);
serviceAccount.private_key = serviceAccount.private_key
  .replace('-----DEBUT PRIVÉ CLÉ-----', '-----BEGIN PRIVATE KEY-----')
  .replace('-----END CLÉ PRIVÉE-----', '-----END PRIVATE KEY-----')
  .replace(/\\n/g, '\n')
  .replace(/\n/g, '\n');

async function run() {
  try {
    const app = initializeApp({ credential: cert(serviceAccount) });
    const auth = getAuth(app);
    const listUsersResult = await auth.listUsers(1000);
    console.log(`Nombre total d'utilisateurs Auth: ${listUsersResult.users.length}`);
    listUsersResult.users.forEach((userRecord) => {
      console.log(`- UID: ${userRecord.uid} | Email: ${userRecord.email || 'N/A'} | Phone: ${userRecord.phoneNumber || 'N/A'} | Created: ${userRecord.metadata.creationTime}`);
    });
    await app.delete();
  } catch (err) {
    console.error('Erreur:', err.message);
  }
}

run();
