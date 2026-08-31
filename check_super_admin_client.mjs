import { initializeApp } from 'firebase/app';
import { getAuth, signInWithEmailAndPassword } from 'firebase/auth';

const firebaseConfig = {
  projectId: "studio-2569273626-e2093",
  appId: "1:1073839723327:web:2d236ea6b408bcfe22b98a",
  apiKey: "AIzaSyApAnNhRTH-iUNRFaF0QpCh5PJa_MsZFyg",
  authDomain: "studio-2569273626-e2093.firebaseapp.com",
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const email = 'fabriceallechi@gmail.com';

async function check() {
  console.log('--- VÉRIFICATION SUPER ADMIN (Client SDK) : ' + email + ' ---');
  try {
    // Attempting login with a dummy password to see if the user exists
    // (If user doesn't exist, it usually returns auth/user-not-found)
    // Note: Some newer Firebase configs return auth/invalid-credential for both.
    await signInWithEmailAndPassword(auth, email, 'DummyPassword123!');
  } catch (err) {
    if (err.code === 'auth/user-not-found') {
      console.log('❌ Compte Auth NON TROUVÉ.');
    } else if (err.code === 'auth/wrong-password' || err.code === 'auth/invalid-credential') {
      console.log('✅ Compte Auth EXISTE (ou identifiants invalides, ce qui confirme l existence du flux).');
    } else {
      console.log('⚠️ Statut indéterminé:', err.code);
    }
  }
  process.exit(0);
}

check();
