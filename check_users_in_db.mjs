import { initializeApp } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';

const projectId = 'studio-2569273626-e2093';
const databaseId = 'ai-studio-ivoirexpressfabi-76a4a3d0-f988-4d5a-95c0-db2daf7a6b58';

try {
  initializeApp({
    projectId: projectId
  });
  
  const db = getFirestore(databaseId);
  
  console.log('--- VÉRIFICATION UTILISATEURS DANS DB: ' + databaseId + ' ---');
  const snapshot = await db.collection('users').get();
  console.log('Nombre d utilisateurs trouvés:', snapshot.size);
  
  snapshot.forEach(doc => {
    console.log('UID:', doc.id, 'Email:', doc.data().email, 'Role:', doc.data().role);
  });

  process.exit(0);
} catch (err) {
  console.error('Erreur:', err.message);
  process.exit(1);
}
