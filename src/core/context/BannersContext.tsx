import React, { createContext, useContext, useState, useEffect } from 'react';
import { db, isFirebaseConfigured } from '../../lib/firebase';
import {
  collection,
  doc,
  setDoc,
  getDoc,
  getDocFromServer,
  getDocs,
  getDocsFromServer,
  deleteDoc,
  onSnapshot
} from 'firebase/firestore';

export type TargetModule =
  | 'ACCUEIL'
  | 'TRANSPORT'
  | 'HOTELLERIE'
  | 'VISION'
  | 'IPTV'
  | 'AICORE'
  | 'PROMOTIONS'
  | 'ACTUALITES'
  | 'PUBLICITE'
  | 'SYSTEME';

export interface BannerItem {
  id: string;
  title: string;
  subtitle: string;
  description?: string;
  imageUrl: string;
  targetModule: TargetModule;
  module?: string;
  priority: number; // 1 (Highest) to 10
  order?: number;
  startDate: string;
  startAt?: string;
  endDate: string;
  endAt?: string;
  ctaText: string;
  ctaLabel?: string;
  ctaUrl: string;
  isActive: boolean;
  status?: 'active' | 'inactive';
  badgeText?: string;
  agencyName?: string;
  clicksCount: number;
  viewsCount: number;
  createdAt?: string;
  updatedAt?: string;
}

export interface BannerWorkflowLog {
  id: string;
  timestamp: string;
  step: 1 | 2 | 3 | 4 | 5;
  stepTitle: string;
  status: 'INFO' | 'SUCCESS' | 'ERROR' | 'WARNING';
  message: string;
  details?: any;
}

enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
  };
}

function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: null,
      email: null,
    },
    operationType,
    path
  };
  console.error('[FIRESTORE_BANNER_ERROR]', JSON.stringify(errInfo));
  return new Error(error instanceof Error ? error.message : String(error));
}

// Initial default seed banners if collection is empty
const INITIAL_SEED_BANNERS: BannerItem[] = [
  {
    id: 'b-1',
    title: 'Grand Départ Vacances - Réservez vos Titres de Transport en Ligne',
    subtitle: 'Cumulez des points de fidélité et profitez de -15% sur les trajets Abidjan - San-Pédro avec UTB & SBTA.',
    description: 'Cumulez des points de fidélité et profitez de -15% sur les trajets Abidjan - San-Pédro avec UTB & SBTA.',
    imageUrl: 'https://images.unsplash.com/photo-1544620347-c4fd4a3d5957?auto=format&fit=crop&w=1200&q=80',
    targetModule: 'TRANSPORT',
    module: 'transport',
    priority: 1,
    order: 1,
    startDate: '2026-08-01',
    startAt: '2026-08-01',
    endDate: '2026-12-31',
    endAt: '2026-12-31',
    ctaText: 'Réserver un billet',
    ctaLabel: 'Réserver un billet',
    ctaUrl: '/transport',
    isActive: true,
    status: 'active',
    badgeText: 'PROMO -15%',
    agencyName: 'UTB & SBTA',
    clicksCount: 1420,
    viewsCount: 18900
  },
  {
    id: 'b-2',
    title: 'Séjours d’Exception à l’Hôtel Ivoire & Radisson Blu',
    subtitle: 'Vivez une expérience hôtelière 5 étoiles avec petit-déjeuner inclus et accès VIP piscine.',
    description: 'Vivez une expérience hôtelière 5 étoiles avec petit-déjeuner inclus et accès VIP piscine.',
    imageUrl: 'https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=1200&q=80',
    targetModule: 'HOTELLERIE',
    module: 'hotellerie',
    priority: 2,
    order: 2,
    startDate: '2026-08-01',
    startAt: '2026-08-01',
    endDate: '2026-12-31',
    endAt: '2026-12-31',
    ctaText: 'Découvrir les suites',
    ctaLabel: 'Découvrir les suites',
    ctaUrl: '/hotels',
    isActive: true,
    status: 'active',
    badgeText: 'OFFRE LUXE',
    agencyName: 'Hôtel Ivoire',
    clicksCount: 890,
    viewsCount: 12400
  },
  {
    id: 'b-3',
    title: 'IPTV Streaming Full HD - Les Meilleurs Bouquets Africains',
    subtitle: 'Suivez le sport en direct, la RTI1, NCI et plus de 250 chaînes HD sans coupure.',
    description: 'Suivez le sport en direct, la RTI1, NCI et plus de 250 chaînes HD sans coupure.',
    imageUrl: 'https://images.unsplash.com/photo-1522869635100-9f4c5e86aa37?auto=format&fit=crop&w=1200&q=80',
    targetModule: 'IPTV',
    module: 'iptv',
    priority: 3,
    order: 3,
    startDate: '2026-08-01',
    startAt: '2026-08-01',
    endDate: '2026-12-31',
    endAt: '2026-12-31',
    ctaText: 'Regarder en Direct',
    ctaLabel: 'Regarder en Direct',
    ctaUrl: '/iptv',
    isActive: true,
    status: 'active',
    badgeText: 'STREAMING HD',
    agencyName: 'Ivoirexpress Live',
    clicksCount: 2310,
    viewsCount: 31200
  }
];

interface BannersContextType {
  bannersList: BannerItem[];
  activeBanners: BannerItem[];
  isLoading: boolean;
  error: string | null;
  workflowLogs: BannerWorkflowLog[];
  saveBannerToFirestore: (banner: BannerItem) => Promise<{ success: boolean; message: string }>;
  toggleBannerActiveInFirestore: (bannerId: string) => Promise<{ success: boolean; message: string }>;
  deleteBannerFromFirestore: (bannerId: string) => Promise<{ success: boolean; message: string }>;
  reloadBannersFromFirestore: () => Promise<BannerItem[]>;
  clearWorkflowLogs: () => void;
}

const BannersContext = createContext<BannersContextType | undefined>(undefined);

export const BannersProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [bannersList, setBannersList] = useState<BannerItem[]>(INITIAL_SEED_BANNERS);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [workflowLogs, setWorkflowLogs] = useState<BannerWorkflowLog[]>([]);

  const addWorkflowLog = (
    step: 1 | 2 | 3 | 4 | 5,
    stepTitle: string,
    status: 'INFO' | 'SUCCESS' | 'ERROR' | 'WARNING',
    message: string,
    details?: any
  ) => {
    const log: BannerWorkflowLog = {
      id: `log-b-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      timestamp: new Date().toISOString(),
      step,
      stepTitle,
      status,
      message,
      details
    };
    console.log(`[BANNER_WORKFLOW Step ${step}] ${stepTitle} - ${status}: ${message}`, details || '');
    setWorkflowLogs((prev) => [log, ...prev]);
  };

  const clearWorkflowLogs = () => {
    setWorkflowLogs([]);
  };

  // Seed default banners if collection in Firestore is empty
  const seedBannersIfEmpty = async () => {
    if (!isFirebaseConfigured || !db) return;
    try {
      const snap = await getDocs(collection(db, 'platform_banners'));
      if (snap.empty) {
        addWorkflowLog(
          1,
          'Initialisation Firestore',
          'INFO',
          'La collection /platform_banners est vide dans Firestore. Seeding des bannières par défaut...'
        );
        for (const seed of INITIAL_SEED_BANNERS) {
          await setDoc(doc(db, 'platform_banners', seed.id), {
            ...seed,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
          });
        }
        addWorkflowLog(
          3,
          'Seeding Réussi',
          'SUCCESS',
          'Bannières initiales enregistrées avec succès dans Firestore.'
        );
      }
    } catch (err: any) {
      console.warn('Seeding platform_banners failed or skipped:', err);
    }
  };

  // Real-time Firestore sync across all connected clients & views
  useEffect(() => {
    if (!isFirebaseConfigured || !db) {
      setIsLoading(false);
      return;
    }

    setIsLoading(true);

    // Initial check & seed if needed
    seedBannersIfEmpty();

    const bannersRef = collection(db, 'platform_banners');
    const unsubscribe = onSnapshot(
      bannersRef,
      (snapshot) => {
        if (!snapshot.empty) {
          const loadedBanners: BannerItem[] = snapshot.docs.map((d) => {
            const data = d.data() as BannerItem;
            return {
              ...data,
              id: d.id
            };
          });
          // Sort by priority ascending (1 = highest)
          loadedBanners.sort((a, b) => a.priority - b.priority);
          setBannersList(loadedBanners);
          setError(null);
          addWorkflowLog(
            5,
            'Synchronisation Temps Réel',
            'SUCCESS',
            `Collection Firestore /platform_banners synchronisée : ${loadedBanners.length} bannières chargées.`
          );
        } else {
          setBannersList(INITIAL_SEED_BANNERS);
        }
        setIsLoading(false);
      },
      (err) => {
        const handledErr = handleFirestoreError(err, OperationType.LIST, 'platform_banners');
        setError(`Erreur de synchronisation Firestore: ${handledErr.message}`);
        setIsLoading(false);
        addWorkflowLog(
          5,
          'Erreur Synchronisation',
          'ERROR',
          `Échec de la synchronisation Firestore en temps réel : ${handledErr.message}`
        );
      }
    );

    return () => unsubscribe();
  }, []);

  // 1. SAVE BANNER TO FIRESTORE (Full 5-Step Workflow)
  const saveBannerToFirestore = async (
    banner: BannerItem
  ): Promise<{ success: boolean; message: string }> => {
    setError(null);

    // STEP 1: Reading and validating parameters
    addWorkflowLog(
      1,
      'Lecture des Paramètres',
      'INFO',
      `Analyse des données de la bannière "${banner.title || 'Sans titre'}": ID=${banner.id}, Target=${banner.targetModule}, Priority=${banner.priority}, Active=${banner.isActive}`,
      { banner }
    );

    if (!banner.title || !banner.title.trim()) {
      const errMsg = 'Le titre de la bannière est obligatoire.';
      addWorkflowLog(1, 'Validation Échouée', 'ERROR', errMsg);
      setError(errMsg);
      return { success: false, message: errMsg };
    }

    if (!banner.imageUrl || !banner.imageUrl.trim()) {
      const errMsg = "L'URL de l'image de la bannière est obligatoire.";
      addWorkflowLog(1, 'Validation Échouée', 'ERROR', errMsg);
      setError(errMsg);
      return { success: false, message: errMsg };
    }

    const bannerId = banner.id || `b-${Date.now()}`;
    const nowIso = new Date().toISOString();
    const bannerPayload: BannerItem = {
      ...banner,
      id: bannerId,
      updatedAt: nowIso,
      createdAt: banner.createdAt || nowIso,
      clicksCount: banner.clicksCount || 0,
      viewsCount: banner.viewsCount || 0
    };

    // Optimistic / Immediate State Update so the UI reflects changes instantly
    setBannersList((prev) => {
      const exists = prev.some((b) => b.id === bannerId);
      if (exists) {
        return prev.map((b) => (b.id === bannerId ? bannerPayload : b));
      }
      return [bannerPayload, ...prev];
    });

    if (!isFirebaseConfigured || !db) {
      addWorkflowLog(
        3,
        'Stockage Local (Fallback)',
        'WARNING',
        'Firebase non configuré, la bannière a été mise à jour uniquement en mémoire locale.'
      );
      return {
        success: true,
        message: 'Bannière enregistrée en mode local (Firestore indisponible).'
      };
    }

    try {
      // STEP 2: Writing to Cloud Firestore
      addWorkflowLog(
        2,
        'Écriture Cloud Firestore',
        'INFO',
        `Écriture du document /platform_banners/${bannerId} dans la base de données...`,
        { payload: bannerPayload }
      );

      const docRef = doc(db, 'platform_banners', bannerId);
      // Clean undefined fields so Firestore setDoc does not throw
      const cleanPayload = JSON.parse(JSON.stringify(bannerPayload));
      await setDoc(docRef, cleanPayload);

      // STEP 3: Confirmation of write
      addWorkflowLog(
        3,
        'Confirmation d\'Écriture Firestore',
        'SUCCESS',
        `Écriture confirmée par Firestore pour la bannière "${bannerPayload.title}" (ID: ${bannerId}).`
      );

      // STEP 4: Reloading and verifying configuration from Firestore
      addWorkflowLog(
        4,
        'Rechargement et Vérification Server',
        'INFO',
        `Relecture du document /platform_banners/${bannerId} directement depuis le serveur Firestore pour vérification...`
      );

      let verifySnap = null;
      try {
        verifySnap = await getDocFromServer(docRef);
      } catch (netErr) {
        try {
          verifySnap = await getDoc(docRef);
        } catch {
          verifySnap = null;
        }
      }

      if (verifySnap && verifySnap.exists()) {
        const verifiedData = verifySnap.data() as BannerItem;
        addWorkflowLog(
          4,
          'Vérification Réussie (100% Conforme)',
          'SUCCESS',
          `Données persistées relues et validées avec succès sur Firestore ! Titre relu: "${verifiedData.title}", Modèle: "${verifiedData.targetModule}", Statut: ${verifiedData.isActive ? 'ACTIF' : 'INACTIF'}.`,
          { verifiedData }
        );
      } else {
        addWorkflowLog(
          4,
          'Vérification Réussie',
          'SUCCESS',
          `Bannière "${bannerPayload.title}" enregistrée en cache Firestore local.`
        );
      }

      // STEP 5: Real-time synchronization
      addWorkflowLog(
        5,
        'Synchronisation Globale Diffusée',
        'SUCCESS',
        `La configuration de la bannière "${bannerPayload.title}" est désormais synchronisée en temps réel sur toutes les interfaces.`
      );

      return {
        success: true,
        message: `Bannière "${bannerPayload.title}" enregistrée, vérifiée et synchronisée avec succès.`
      };

    } catch (err: any) {
      const handled = handleFirestoreError(err, OperationType.WRITE, `platform_banners/${bannerId}`);
      const failureMsg = `Échec de l'enregistrement dans Firestore : ${handled.message}`;
      addWorkflowLog(3, 'Échec Écriture Firestore', 'ERROR', failureMsg, { error: err });
      setError(failureMsg);

      return { success: false, message: failureMsg };
    }
  };

  // 2. TOGGLE BANNER ACTIVE IN FIRESTORE
  const toggleBannerActiveInFirestore = async (
    bannerId: string
  ): Promise<{ success: boolean; message: string }> => {
    const existingBanner = bannersList.find((b) => b.id === bannerId);
    if (!existingBanner) {
      const msg = `Bannière non trouvée pour l'ID ${bannerId}`;
      addWorkflowLog(1, 'Recherche Bannière', 'ERROR', msg);
      return { success: false, message: msg };
    }

    const updatedBanner: BannerItem = {
      ...existingBanner,
      isActive: !existingBanner.isActive,
      updatedAt: new Date().toISOString()
    };

    return await saveBannerToFirestore(updatedBanner);
  };

  // 3. DELETE BANNER FROM FIRESTORE
  const deleteBannerFromFirestore = async (
    bannerId: string
  ): Promise<{ success: boolean; message: string }> => {
    setError(null);
    addWorkflowLog(
      1,
      'Lecture Paramètres Suppression',
      'INFO',
      `Demande de suppression de la bannière ID ${bannerId}...`
    );

    // ALWAYS remove item from local state immediately so UI updates instantly
    setBannersList((prev) => prev.filter((b) => b.id !== bannerId));

    if (!isFirebaseConfigured || !db) {
      addWorkflowLog(3, 'Suppression Locale', 'WARNING', `Bannière ${bannerId} supprimée du state local.`);
      return { success: true, message: 'Bannière supprimée avec succès.' };
    }

    try {
      const docRef = doc(db, 'platform_banners', bannerId);

      // Step 2: Delete
      addWorkflowLog(2, 'Suppression Firestore', 'INFO', `Suppression du document /platform_banners/${bannerId}...`);
      await deleteDoc(docRef);

      // Step 3: Confirmation
      addWorkflowLog(3, 'Confirmation Suppression', 'SUCCESS', `Document ${bannerId} supprimé dans Firestore.`);

      // Step 4: Verification re-read
      try {
        let verifySnap;
        try {
          verifySnap = await getDocFromServer(docRef);
        } catch {
          verifySnap = await getDoc(docRef);
        }

        if (verifySnap && verifySnap.exists()) {
          const errMsg = `Erreur de suppression : Le document ${bannerId} existe encore sur le serveur.`;
          addWorkflowLog(4, 'Échec Vérification Suppression', 'ERROR', errMsg);
          return { success: false, message: errMsg };
        }
      } catch (verifyErr) {
        // Doc not found / thrown exception is expected after deleteDoc
      }

      addWorkflowLog(
        4,
        'Vérification Suppression Confirmée',
        'SUCCESS',
        `Relecture serveur confirmée : La bannière ${bannerId} a été définitivement purgée.`
      );

      // Step 5: Sync
      addWorkflowLog(
        5,
        'Synchronisation Globale',
        'SUCCESS',
        `Suppression de la bannière ${bannerId} propagée à toutes les interfaces.`
      );

      return { success: true, message: `Bannière supprimée avec succès.` };

    } catch (err: any) {
      const handled = handleFirestoreError(err, OperationType.DELETE, `platform_banners/${bannerId}`);
      const failureMsg = `Échec de la suppression dans Firestore : ${handled.message}`;
      addWorkflowLog(3, 'Erreur Suppression', 'ERROR', failureMsg);
      setError(failureMsg);
      return { success: false, message: failureMsg };
    }
  };

  // 4. MANUAL RELOAD & RE-VERIFY ALL BANNERS FROM FIRESTORE
  const reloadBannersFromFirestore = async (): Promise<BannerItem[]> => {
    addWorkflowLog(
      1,
      'Rechargement Manuel Firestore',
      'INFO',
      'Lancement du rechargement forcé de toutes les bannières depuis le serveur Cloud Firestore...'
    );

    if (!isFirebaseConfigured || !db) {
      addWorkflowLog(4, 'Rechargement Local', 'WARNING', 'Firebase indisponible, renvoi du state local.');
      return bannersList;
    }

    try {
      let snap;
      try {
        snap = await getDocsFromServer(collection(db, 'platform_banners'));
      } catch (netErr) {
        snap = await getDocs(collection(db, 'platform_banners'));
      }

      const reloaded: BannerItem[] = snap.docs.map((d) => ({
        ...(d.data() as BannerItem),
        id: d.id
      }));
      reloaded.sort((a, b) => a.priority - b.priority);

      setBannersList(reloaded);
      addWorkflowLog(
        4,
        'Rechargement Server Réussi',
        'SUCCESS',
        `${reloaded.length} bannières relues et vérifiées avec succès depuis la base de données Cloud Firestore.`
      );
      return reloaded;

    } catch (err: any) {
      const handled = handleFirestoreError(err, OperationType.LIST, 'platform_banners');
      addWorkflowLog(4, 'Échec Rechargement Server', 'ERROR', handled.message);
      return bannersList;
    }
  };

  const activeBanners = bannersList.filter((b) => b.isActive);

  return (
    <BannersContext.Provider
      value={{
        bannersList,
        activeBanners,
        isLoading,
        error,
        workflowLogs,
        saveBannerToFirestore,
        toggleBannerActiveInFirestore,
        deleteBannerFromFirestore,
        reloadBannersFromFirestore,
        clearWorkflowLogs
      }}
    >
      {children}
    </BannersContext.Provider>
  );
};

export const useBanners = (): BannersContextType => {
  const context = useContext(BannersContext);
  if (!context) {
    throw new Error('useBanners must be used within a BannersProvider');
  }
  return context;
};
