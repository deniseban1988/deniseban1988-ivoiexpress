import { initializeApp } from 'firebase/app';
import { getAuth, createUserWithEmailAndPassword } from 'firebase/auth';

const firebaseConfig = {
  projectId: "studio-2569273626-e2093",
  appId: "1:1073839723327:web:2d236ea6b408bcfe22b98a",
  apiKey: "AIzaSyApAnNhRTH-iUNRFaF0QpCh5PJa_MsZFyg",
  authDomain: "studio-2569273626-e2093.firebaseapp.com",
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const email = 'fabriceallechi@gmail.com';

async function run() {
  console.log('--- TENTATIVE CRÉATION SUPER ADMIN : ' + email + ' ---');
  try {
    const userCredential = await createUserWithEmailAndPassword(auth, email, 'TempPassword123!');
    console.log('✅ Compte CRÉÉ. UID:', userCredential.user.uid);
  } catch (err) {
    if (err.code === 'auth/email-already-in-use') {
      console.log('✅ Le compte EXISTE déjà dans Firebase Auth.');
    } else {
      console.error('❌ Erreur:', err.code, err.message);
    }
  }
  process.exit(0);
}

run();
