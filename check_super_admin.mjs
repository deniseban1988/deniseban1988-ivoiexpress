import { initializeApp } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { getAuth } from 'firebase-admin/auth';

process.env.FIREBASE_PROJECT_ID = 'studio-2569273626-e2093';

try {
  initializeApp({
    projectId: process.env.FIREBASE_PROJECT_ID
  });
  
  const auth = getAuth();
  const db = getFirestore();
  const email = 'fabriceallechi@gmail.com';

  console.log('--- VÉRIFICATION SUPER ADMIN : ' + email + ' ---');
  
  try {
    const userRecord = await auth.getUserByEmail(email);
    console.log('✅ Compte Auth trouvé. UID:', userRecord.uid);
    
    const docSnap = await db.collection('users').doc(userRecord.uid).get();
    if (docSnap.exists) {
      const data = docSnap.data();
      console.log('✅ Document Firestore trouvé.');
      console.log('✅ Rôle actuel:', data.role);
      
      if (data.role !== 'SUPER_ADMIN') {
        console.log('⚠️ MISE À JOUR DU RÔLE EN SUPER_ADMIN...');
        await db.collection('users').doc(userRecord.uid).update({ role: 'SUPER_ADMIN' });
        console.log('✅ Rôle mis à jour avec succès.');
      }
    } else {
      console.log('⚠️ Document Firestore MANQUANT. Création...');
      const profile = {
        id: userRecord.uid,
        fullName: 'Fabrice Allechi',
        email: email,
        role: 'SUPER_ADMIN',
        status: 'Actif',
        createdAt: new Date().toISOString()
      };
      await db.collection('users').doc(userRecord.uid).set(profile);
      console.log('✅ Document Firestore créé avec rôle SUPER_ADMIN.');
    }
  } catch (err) {
    if (err.code === 'auth/user-not-found') {
      console.log('❌ Compte Auth NON TROUVÉ.');
    } else {
      throw err;
    }
  }
  process.exit(0);
} catch (err) {
  console.error('❌ Erreur:', err.message);
  process.exit(1);
}
