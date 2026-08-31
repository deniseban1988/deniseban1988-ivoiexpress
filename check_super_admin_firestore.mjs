import { initializeApp } from 'firebase/app';
import { getFirestore, collection, query, where, getDocs } from 'firebase/firestore';

const firebaseConfig = {
  projectId: "studio-2569273626-e2093",
  appId: "1:1073839723327:web:2d236ea6b408bcfe22b98a",
  apiKey: "AIzaSyApAnNhRTH-iUNRFaF0QpCh5PJa_MsZFyg",
  authDomain: "studio-2569273626-e2093.firebaseapp.com",
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const email = 'fabriceallechi@gmail.com';

async function check() {
  console.log('--- VÉRIFICATION FIRESTORE : ' + email + ' ---');
  try {
    const q = query(collection(db, 'users'), where('email', '==', email));
    const querySnapshot = await getDocs(q);
    
    if (querySnapshot.size > 0) {
      querySnapshot.forEach(doc => {
        const data = doc.data();
        console.log('✅ Document trouvé. UID:', doc.id);
        console.log('✅ Rôle:', data.role);
      });
    } else {
      console.log('❌ Aucun document trouvé dans Firestore pour cet e-mail.');
    }
    process.exit(0);
  } catch (err) {
    console.error('❌ Erreur Firestore:', err.message);
    process.exit(1);
  }
}

check();
