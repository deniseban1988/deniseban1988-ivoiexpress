import { initializeApp, getApps, getApp, FirebaseApp } from 'firebase/app';
import { initializeFirestore, getFirestore, Firestore, collection, getDocs, addDoc, setDoc, doc, onSnapshot, query, limit, orderBy, writeBatch } from 'firebase/firestore';
import { getAuth, Auth, signInAnonymously, onAuthStateChanged } from 'firebase/auth';
import firebaseConfigJson from '../../firebase-applet-config.json';

let app: FirebaseApp;
let db: Firestore;
let auth: Auth;
let isFirebaseConfigured = false;

try {
  // Configuration Firebase dynamique chargée depuis firebase-applet-config.json
  const firebaseConfig = {
    apiKey: firebaseConfigJson.apiKey,
    authDomain: firebaseConfigJson.authDomain,
    projectId: firebaseConfigJson.projectId,
    storageBucket: firebaseConfigJson.storageBucket,
    messagingSenderId: firebaseConfigJson.messagingSenderId,
    appId: firebaseConfigJson.appId,
  };

  if (!getApps().length) {
    app = initializeApp(firebaseConfig);
  } else {
    app = getApp();
  }

  // Connection aux collections Firestore avec support long polling pour environnement sandbox / web
  const databaseId = 'ai-studio-ivoirexpressfabi-76a4a3d0-f988-4d5a-95c0-db2daf7a6b58';

  const firestoreSettings = {
    experimentalForceLongPolling: true,
    ignoreUndefinedProperties: true,
  };

  try {
    if (databaseId && databaseId !== '(default)') {
      db = initializeFirestore(app, firestoreSettings, databaseId);
    } else {
      db = initializeFirestore(app, firestoreSettings);
    }
  } catch (initErr) {
    // Si déjà initialisé, récupération de l'instance existante
    if (databaseId && databaseId !== '(default)') {
      db = getFirestore(app, databaseId);
    } else {
      db = getFirestore(app);
    }
  }

  auth = getAuth(app);
  signInAnonymously(auth).catch(() => {});
  isFirebaseConfigured = true;
  console.log('[Firebase] Cloud Firestore & Auth initialisés avec succès (Long Polling actif):', firebaseConfigJson.projectId, 'BDD:', databaseId);
} catch (error) {
  console.warn('[Firebase] Erreur d’initialisation Firebase (Mode In-Memory de secours actif):', error);
}

const isProduction = import.meta.env.PROD;
const FIRESTORE_DB_ID = isProduction 
  ? 'ai-studio-ivoirexpressfabi-76a4a3d0-f988-4d5a-95c0-db2daf7a6b58' 
  : '(default)';

export { app, db, auth, isFirebaseConfigured, FIRESTORE_DB_ID };

// Firestore Synchronization Helpers (Ensuring clean data without mock data injection)
export async function seedInitialFirestoreData(force: boolean = false) {
  if (!isFirebaseConfigured || !db) return;

  try {
    // Note: Profiling real users with hardcoded UIDs (u-admin-01) causes mismatches with Firebase Auth UIDs.
    // Real profiles are now auto-provisioned upon login in FirestoreAuthRepositoryAdapter.
    console.log('[Firebase] System ready. Initial profiles will be auto-provisioned on first login.');
  } catch (err) {
    console.error('[Firebase] Erreur lors de l’initialisation des utilisateurs Firestore:', err);
  }
}
