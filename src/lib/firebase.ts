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
  const databaseId = (firebaseConfigJson as any).firestoreDatabaseId;
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

export { app, db, auth, isFirebaseConfigured };

// Firestore Synchronization Helpers (Ensuring clean data without mock data injection)
export async function seedInitialFirestoreData(force: boolean = false) {
  if (!isFirebaseConfigured || !db) return;

  try {
    const batch = writeBatch(db);
    let pendingWritesCount = 0;

    // 1. Initial Admin & Test Users authentication mapping
    const initialUsers = [
      { uid: 'u-admin-01', email: 'fabriceallechi@gmail.com', displayName: 'Fabrice Allechi (Super Admin)', role: 'SUPER_ADMIN', phoneNumber: '+225 0707070707', createdAt: new Date().toISOString() },
      { uid: 'u-utb-admin', email: 'gestionnaire@utb.ci', displayName: 'Manager UTB Adjamé', role: 'ADMIN_AGENCE', agencyId: 'utb-01', phoneNumber: '+225 0102030405', createdAt: new Date().toISOString() },
      { uid: 'u-hotel-admin', email: 'reception@hotel-ivoire.ci', displayName: 'Réception Sofitel Hôtel Ivoire', role: 'ADMIN_HOTEL', hotelId: 'h-sofitel-01', phoneNumber: '+225 0504030201', createdAt: new Date().toISOString() },
      { uid: 'u-voyageur-01', email: 'koffi.yao@gmail.com', displayName: 'Koffi Yao Jean', role: 'VOYAGEUR', isVip: true, phoneNumber: '+225 0788990011', createdAt: new Date().toISOString() }
    ];
    for (const u of initialUsers) {
      batch.set(doc(db, 'users', u.uid), u, { merge: true });
      pendingWritesCount++;
    }

    if (pendingWritesCount > 0) {
      await batch.commit();
      console.log(`[Firebase] Initialisation des comptes utilisateurs système réussie (${pendingWritesCount} utilisateurs).`);
    }
  } catch (err) {
    console.error('[Firebase] Erreur lors de l’initialisation des utilisateurs Firestore:', err);
  }
}
