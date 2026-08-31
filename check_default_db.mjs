import { initializeApp } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';

const projectId = 'studio-2569273626-e2093';

try {
  initializeApp({
    projectId: projectId
  });
  
  const db = getFirestore(); // Default DB
  
  console.log('--- VÉRIFICATION UTILISATEURS DANS (default) ---');
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
