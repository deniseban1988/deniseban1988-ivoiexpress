import { db, auth, isFirebaseConfigured, FIRESTORE_DB_ID } from './firebase';
import {
  collection,
  doc,
  getDocs,
  getDoc,
  setDoc,
  updateDoc,
  deleteDoc,
  addDoc,
  serverTimestamp,
  getDocFromServer
} from 'firebase/firestore';
import firebaseConfigJson from '../../firebase-applet-config.json';

export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export interface FirestoreErrorInfo {
  error: string;
  code: string;
  module: string;
  collection: string | null;
  operationType: OperationType;
  authInfo: {
    userId: string | null;
    email: string | null;
    emailVerified: boolean | null;
    isAnonymous: boolean | null;
  };
  resolutionSuggestion: string;
  timestamp: string;
}

export interface DiagnosticCheckResult {
  id: string;
  name: string;
  description: string;
  status: 'SUCCESS' | 'WARNING' | 'FAILED' | 'SKIPPED';
  message: string;
  details?: string;
  durationMs?: number;
}

export interface FirestoreDiagnosticReport {
  timestamp: string;
  overallStatus: 'CONNECTED' | 'DEGRADED' | 'DISCONNECTED';
  firebaseProjectId: string;
  databaseId: string;
  environment: string;
  currentUserEmail: string;
  totalLatencyMs: number;
  checks: DiagnosticCheckResult[];
  collectionsSummary: {
    name: string;
    label: string;
    docCount: number;
    accessible: boolean;
    errorMsg?: string;
  }[];
  recommendations: string[];
}

export const MONITORED_COLLECTIONS = [
  { name: 'users', label: 'Utilisateurs & RBAC' },
  { name: 'transport_trips', label: 'Trajets Autocars' },
  { name: 'reservations', label: 'Réservations & QR Codes' },
  { name: 'hotels', label: 'Hôtels & Chambres' },
  { name: 'agencies', label: 'Agences de Transport' },
  { name: 'camera', label: 'Caméras de Surveillance' },
  { name: 'iptv_channels', label: 'Chaînes IPTV & Flux HLS (13.5k+)' },
  { name: 'iptv_playlists', label: 'Playlists M3U / M3U8' },
  { name: 'iptv', label: 'Contenus IPTV & VOD (Miroir)' },
  { name: 'iptv_logs', label: 'Journaux IPTV' },
  { name: 'notifications', label: 'Notifications Voyageurs' },
  { name: 'media_library', label: 'Médiathèque & Bannières' },
  { name: 'banners', label: 'Campagnes & Bannières' },
  { name: 'system_config', label: 'Configuration Système' },
  { name: 'logs', label: 'Logs Système' },
  { name: 'audit_logs', label: 'Journaux d’Audit Administrateur' },
  { name: 'partner_registry', label: 'Partenaires & Connecteurs' },
  { name: 'vip_subscriptions', label: 'Abonnements VIP' },
  { name: 'scan_validations', label: 'Validations par Scan QR' }
];

export async function recordAuditLog(
  action: 'CREATE' | 'UPDATE' | 'DELETE' | 'SEED' | 'DIAGNOSTIC' | 'SYNC' | 'VERIFY',
  targetCollection: string,
  docId: string | null,
  status: 'SUCCESS' | 'ERROR',
  details: string
): Promise<void> {
  if (!db) return;
  try {
    const user = auth?.currentUser;
    await addDoc(collection(db, 'audit_logs'), {
      action,
      collection: targetCollection,
      docId: docId || 'N/A',
      status,
      details,
      actor: user?.email || 'Console BaaS Admin',
      actorUid: user?.uid || 'u-admin-baas',
      timestamp: new Date().toISOString()
    });
  } catch (err) {
    console.warn('[Audit Log] Warning: Failed to write audit log to Firestore:', err);
  }
}

export function parseFirebaseErrorCode(error: any): { code: string; suggestion: string } {
  const errStr = error?.code || error?.message || String(error);
  
  if (errStr.includes('permission-denied') || errStr.includes('Missing or insufficient permissions')) {
    return {
      code: 'PERMISSION_DENIED',
      suggestion: 'Vérifiez les règles de sécurité dans firestore.rules. Assurez-vous que l’utilisateur dispose des permissions en lecture/écriture.'
    };
  }
  if (errStr.includes('unauthenticated')) {
    return {
      code: 'UNAUTHENTICATED',
      suggestion: 'L’utilisateur n’est pas connecté. Activez Firebase Auth ou la connexion anonyme dans le projet.'
    };
  }
  if (errStr.includes('not-found')) {
    return {
      code: 'NOT_FOUND',
      suggestion: 'Le document ou la collection demandée n’existe pas dans la base Firestore.'
    };
  }
  if (errStr.includes('failed-precondition') || errStr.includes('index')) {
    return {
      code: 'FAILED_PRECONDITION',
      suggestion: 'Une requête nécessite un index composite. Cliquez sur le lien généré dans la console Firebase pour créer l’index.'
    };
  }
  if (errStr.includes('unavailable') || errStr.includes('offline')) {
    return {
      code: 'UNAVAILABLE',
      suggestion: 'Service Firestore indisponible ou problème de réseau. Vérifiez votre connexion internet et la clé API Firebase.'
    };
  }
  
  return {
    code: error?.code || 'UNKNOWN_FIRESTORE_ERROR',
    suggestion: 'Vérifiez la configuration dans firebase-applet-config.json et la console Firebase.'
  };
}

export function formatFirestoreError(
  error: any,
  module: string,
  collectionName: string | null,
  opType: OperationType
): FirestoreErrorInfo {
  const { code, suggestion } = parseFirebaseErrorCode(error);
  const user = auth?.currentUser;

  return {
    error: error?.message || String(error),
    code,
    module,
    collection: collectionName,
    operationType: opType,
    authInfo: {
      userId: user?.uid || null,
      email: user?.email || null,
      emailVerified: user?.emailVerified || null,
      isAnonymous: user?.isAnonymous || null,
    },
    resolutionSuggestion: suggestion,
    timestamp: new Date().toISOString()
  };
}

export async function runFirestoreDiagnostic(): Promise<FirestoreDiagnosticReport> {
  const startTime = Date.now();
  const checks: DiagnosticCheckResult[] = [];
  const recommendations: string[] = [];
  const user = auth?.currentUser;

  const projectId = firebaseConfigJson.projectId || 'studio-2569273626-e2093';
  const databaseId = FIRESTORE_DB_ID;
  const environment = process.env.NODE_ENV === 'production' ? 'Production' : 'Développement (Cloud Live)';

  // Check 1: Firebase SDK Initialization
  const initStart = Date.now();
  if (isFirebaseConfigured && db) {
    checks.push({
      id: 'init',
      name: 'Initialisation Firebase SDK',
      description: 'Vérification du chargement de l\'application et de l\'instance Firestore',
      status: 'SUCCESS',
      message: `Firebase SDK connecté avec succès au projet "${projectId}" (BDD: "${databaseId}")`,
      durationMs: Date.now() - initStart
    });
  } else {
    checks.push({
      id: 'init',
      name: 'Initialisation Firebase SDK',
      description: 'Vérification du chargement de l\'application et de l\'instance Firestore',
      status: 'FAILED',
      message: 'L\'instance Firestore n\'a pas pu être initialisée.',
      details: 'Vérifiez le fichier firebase-applet-config.json.',
      durationMs: Date.now() - initStart
    });
  }

  // Check 2: Authentication Check
  const authStart = Date.now();
  if (user) {
    checks.push({
      id: 'auth',
      name: 'Authentification Utilisateur',
      description: 'Vérification de la session active Firebase Auth',
      status: 'SUCCESS',
      message: `Utilisateur actif : ${user.email || 'Anonyme'} (UID: ${user.uid})`,
      durationMs: Date.now() - authStart
    });
  } else {
    checks.push({
      id: 'auth',
      name: 'Authentification Utilisateur',
      description: 'Vérification de la session active Firebase Auth',
      status: 'WARNING',
      message: 'Aucun utilisateur authentifié. La connexion anonyme va être tentée.',
      details: 'Certaines règles de sécurité peuvent restreindre l\'accès aux visiteurs non connectés.',
      durationMs: Date.now() - authStart
    });
  }

  // Check 3: Server Connection Ping
  const pingStart = Date.now();
  let serverPingSuccess = false;
  try {
    const testDocRef = doc(db, '_diagnostic_ping', 'healthcheck');
    await getDocFromServer(testDocRef);
    const pingDuration = Date.now() - pingStart;
    serverPingSuccess = true;
    checks.push({
      id: 'ping',
      name: 'Connexion Directe Serveur (getDocFromServer)',
      description: 'Vérification du ping sans cache vers les serveurs Cloud Firestore',
      status: 'SUCCESS',
      message: `Réponse serveur obtenue en ${pingDuration}ms`,
      durationMs: pingDuration
    });
  } catch (err: any) {
    const pingDuration = Date.now() - pingStart;
    try {
      const testDocRef = doc(db, '_diagnostic_ping', 'healthcheck');
      await getDoc(testDocRef);
      checks.push({
        id: 'ping',
        name: 'Connexion Serveur (Mode Cache/Hors-Ligne)',
        description: 'Connexion directe au serveur temporairement indisponible - Mode cache local actif',
        status: 'WARNING',
        message: `Direct server connection unavailable (${err.message || 'Offline'}). Cache local opérationnel.`,
        durationMs: pingDuration
      });
    } catch (err2: any) {
      const formatted = parseFirebaseErrorCode(err);
      checks.push({
        id: 'ping',
        name: 'Connexion Directe Serveur (getDocFromServer)',
        description: 'Vérification du ping sans cache vers les serveurs Cloud Firestore',
        status: 'FAILED',
        message: `Échec du ping serveur : ${err.message || String(err)}`,
        details: formatted.suggestion,
        durationMs: pingDuration
      });
    }
  }

  // Check 4, 5, 6: CRUD Test on Diagnostic Collection (_diagnostic_tests)
  const testDocId = `diag_${Date.now()}`;
  const testDocRef = doc(db, '_diagnostic_tests', testDocId);

  // CRUD READ Test
  const readStart = Date.now();
  let crudReadSuccess = false;
  try {
    const testColRef = collection(db, '_diagnostic_tests');
    await getDocs(testColRef);
    crudReadSuccess = true;
    checks.push({
      id: 'crud_read',
      name: 'Opération CRUD - LECTURE (getDocs)',
      description: 'Test de lecture d\'une collection Firestore',
      status: 'SUCCESS',
      message: 'Lecture de collection autorisée et exécutée avec succès',
      durationMs: Date.now() - readStart
    });
  } catch (err: any) {
    const formatted = parseFirebaseErrorCode(err);
    checks.push({
      id: 'crud_read',
      name: 'Opération CRUD - LECTURE (getDocs)',
      description: 'Test de lecture d\'une collection Firestore',
      status: 'FAILED',
      message: `Lecture bloquée : ${err.message || String(err)}`,
      details: formatted.suggestion,
      durationMs: Date.now() - readStart
    });
  }

  // CRUD WRITE Test
  const writeStart = Date.now();
  let crudWriteSuccess = false;
  try {
    await setDoc(testDocRef, {
      testField: 'IVOIREXPRESS_DIAGNOSTIC_TOKEN',
      createdAt: new Date().toISOString(),
      testedBy: user?.email || 'Anonymous'
    });
    crudWriteSuccess = true;
    checks.push({
      id: 'crud_write',
      name: 'Opération CRUD - CRÉATION (setDoc)',
      description: 'Test d\'écriture d\'un document dans Firestore',
      status: 'SUCCESS',
      message: `Document de test "${testDocId}" créé avec succès`,
      durationMs: Date.now() - writeStart
    });
  } catch (err: any) {
    const formatted = parseFirebaseErrorCode(err);
    checks.push({
      id: 'crud_write',
      name: 'Opération CRUD - CRÉATION (setDoc)',
      description: 'Test d\'écriture d\'un document dans Firestore',
      status: 'FAILED',
      message: `Écriture bloquée par les règles : ${err.message || String(err)}`,
      details: formatted.suggestion,
      durationMs: Date.now() - writeStart
    });
  }

  // CRUD UPDATE Test
  if (crudWriteSuccess) {
    const updateStart = Date.now();
    try {
      await updateDoc(testDocRef, {
        updatedAt: new Date().toISOString(),
        status: 'VERIFIED'
      });
      checks.push({
        id: 'crud_update',
        name: 'Opération CRUD - MODIFICATION (updateDoc)',
        description: 'Test de mise à jour partielle d\'un document',
        status: 'SUCCESS',
        message: 'Modification du document de test réussie',
        durationMs: Date.now() - updateStart
      });
    } catch (err: any) {
      const formatted = parseFirebaseErrorCode(err);
      checks.push({
        id: 'crud_update',
        name: 'Opération CRUD - MODIFICATION (updateDoc)',
        description: 'Test de mise à jour partielle d\'un document',
        status: 'FAILED',
        message: `Modification échouée : ${err.message || String(err)}`,
        details: formatted.suggestion,
        durationMs: Date.now() - updateStart
      });
    }

    // CRUD DELETE Test
    const deleteStart = Date.now();
    try {
      await deleteDoc(testDocRef);
      checks.push({
        id: 'crud_delete',
        name: 'Opération CRUD - SUPPRESSION (deleteDoc)',
        description: 'Nettoyage et suppression du document de test',
        status: 'SUCCESS',
        message: 'Suppression du document de test réussie',
        durationMs: Date.now() - deleteStart
      });
    } catch (err: any) {
      const formatted = parseFirebaseErrorCode(err);
      checks.push({
        id: 'crud_delete',
        name: 'Opération CRUD - SUPPRESSION (deleteDoc)',
        description: 'Nettoyage et suppression du document de test',
        status: 'FAILED',
        message: `Suppression bloquée : ${err.message || String(err)}`,
        details: formatted.suggestion,
        durationMs: Date.now() - deleteStart
      });
    }
  } else {
    checks.push({
      id: 'crud_update',
      name: 'Opération CRUD - MODIFICATION',
      description: 'Test de modification skipped (écriture initiale échouée)',
      status: 'SKIPPED',
      message: 'Étape sautée car la création de document a échoué'
    });
    checks.push({
      id: 'crud_delete',
      name: 'Opération CRUD - SUPPRESSION',
      description: 'Test de suppression skipped',
      status: 'SKIPPED',
      message: 'Étape sautée car la création de document a échoué'
    });
  }

  // Check 7: Collections Inspector (Check accessibility and doc count for all 10 monitored collections)
  const collectionsSummary: FirestoreDiagnosticReport['collectionsSummary'] = [];
  for (const col of MONITORED_COLLECTIONS) {
    try {
      const snap = await getDocs(collection(db, col.name));
      collectionsSummary.push({
        name: col.name,
        label: col.label,
        docCount: snap.size,
        accessible: true
      });
    } catch (err: any) {
      const parsed = parseFirebaseErrorCode(err);
      collectionsSummary.push({
        name: col.name,
        label: col.label,
        docCount: 0,
        accessible: false,
        errorMsg: `${parsed.code}: ${err.message || String(err)}`
      });
    }
  }

  // Determine Overall Status
  let overallStatus: FirestoreDiagnosticReport['overallStatus'] = 'CONNECTED';
  if (!serverPingSuccess && !crudReadSuccess) {
    overallStatus = 'DISCONNECTED';
    recommendations.push('🔴 Connexion Cloud Firestore impossible. Vérifiez les identifiants dans firebase-applet-config.json et la clé API.');
  } else if (!crudWriteSuccess || collectionsSummary.some(c => !c.accessible)) {
    overallStatus = 'DEGRADED';
    recommendations.push('🟡 Connexion établie mais certaines opérations ou collections sont restreintes par firestore.rules.');
  } else {
    recommendations.push('🟢 Connexion Cloud Firestore optimale et sécurisée. Toutes les collections sont accessibles en lecture/écriture.');
  }

  if (collectionsSummary.some(c => c.docCount === 0 && c.accessible)) {
    recommendations.push('💡 Certaines collections sont vides. Utilisez le bouton "⚡ Populer les Collections (Seed Auto)" pour ingérer les données initiales.');
  }

  const totalLatencyMs = Date.now() - startTime;

  return {
    timestamp: new Date().toISOString(),
    overallStatus,
    firebaseProjectId: projectId,
    databaseId,
    environment,
    currentUserEmail: user?.email || (user ? `Anonyme (${user.uid.substring(0, 8)}...)` : 'Non connecté'),
    totalLatencyMs,
    checks,
    collectionsSummary,
    recommendations
  };
}
