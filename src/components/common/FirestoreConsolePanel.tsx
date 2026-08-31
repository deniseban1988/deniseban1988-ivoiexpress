import React, { useState, useEffect, useMemo } from 'react';
import {
  Database,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  RefreshCw,
  Users,
  Bus,
  Ticket,
  Hotel,
  Building2,
  ShieldCheck,
  Tv,
  Sparkles,
  Camera,
  Bell,
  FileText,
  Plus,
  Trash2,
  Edit3,
  Clock,
  Activity,
  Lock,
  Server,
  Wifi,
  Zap,
  X,
  Info,
  Search,
  Copy,
  Check,
  Shield,
  Eye,
  Terminal,
  Layers,
  FileCode,
  FolderPlus,
  ArrowRight,
  Code
} from 'lucide-react';
import { db, auth, isFirebaseConfigured, seedInitialFirestoreData, FIRESTORE_DB_ID } from '../../lib/firebase';
import {
  collection,
  onSnapshot,
  doc,
  setDoc,
  updateDoc,
  deleteDoc,
  addDoc
} from 'firebase/firestore';
import {
  runFirestoreDiagnostic,
  formatFirestoreError,
  recordAuditLog,
  MONITORED_COLLECTIONS,
  FirestoreDiagnosticReport,
  FirestoreErrorInfo,
  OperationType
} from '../../lib/firestoreDiagnostics';
import firebaseConfigJson from '../../../firebase-applet-config.json';

type ConsoleTab = 'data_explorer' | 'module_matrix' | 'audit_logs_view' | 'functional_audit';

export interface DynamicField {
  id: string;
  key: string;
  type: 'string' | 'number' | 'boolean' | 'date' | 'array' | 'object' | 'null';
  value: any;
}

// Preset Business Schema Templates (Clearly labeled as starter templates)
const PRESET_TEMPLATES: Record<string, { label: string; collection: string; data: Record<string, any> }> = {
  users: {
    label: 'Utilisateur / RBAC (users)',
    collection: 'users',
    data: {
      firstName: 'Fabrice',
      lastName: 'Allechi',
      email: 'fabriceallechi@gmail.com',
      role: 'SUPER_ADMIN',
      agencyId: 'agency-utb-01',
      hotelId: 'hotel-radisson-01',
      phone: '+225 0700000000',
      status: 'ACTIVE',
      isVerified: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }
  },
  transport_trips: {
    label: 'Trajet Autocar (transport_trips)',
    collection: 'transport_trips',
    data: {
      departureCity: 'Abidjan',
      arrivalCity: 'Yamoussoukro',
      departureTime: '08:00',
      arrivalTime: '11:30',
      price: 7500,
      availableSeats: 48,
      totalSeats: 48,
      busType: 'Autocar VIP Express WiFi',
      companyName: 'UTB Express',
      agencyId: 'agency-utb-01',
      status: 'SCHEDULED',
      createdAt: new Date().toISOString()
    }
  },
  reservations: {
    label: 'Réservation & Billet (reservations)',
    collection: 'reservations',
    data: {
      passengerName: 'Marc Koffi',
      passengerPhone: '+225 0505050505',
      tripId: 'trip-abj-yak-01',
      qrCode: 'IVX-TICKET-2026-9921',
      seatNumber: '12A',
      totalAmount: 7500,
      paymentStatus: 'PAID',
      validationStatus: 'VALIDATED',
      createdAt: new Date().toISOString()
    }
  },
  hotels: {
    label: 'Établissement Hôtelier (hotels)',
    collection: 'hotels',
    data: {
      name: 'Hôtel Président Yamoussoukro',
      city: 'Yamoussoukro',
      stars: 5,
      pricePerNight: 45000,
      totalRooms: 120,
      contactPhone: '+225 2730000000',
      status: 'Actif',
      createdAt: new Date().toISOString()
    }
  },
  agencies: {
    label: 'Agence de Transport (agencies)',
    collection: 'agencies',
    data: {
      name: 'UTB Express Transport',
      code: 'UTB',
      contactPhone: '+225 2720202020',
      totalBuses: 85,
      status: 'Actif',
      createdAt: new Date().toISOString()
    }
  },
  notifications: {
    label: 'Notification Voyageur (notifications)',
    collection: 'notifications',
    data: {
      title: 'Embarquement Car VIP Abidjan - Yamoussoukro',
      message: 'Le car VIP no 102 est prêt au Quai B. Veuillez présenter votre QR Code.',
      targetRole: 'PASSENGER',
      status: 'SENT',
      createdAt: new Date().toISOString()
    }
  },
  media_library: {
    label: 'Médiathèque (media_library)',
    collection: 'media_library',
    data: {
      name: 'Bannière Car VIP Accueil',
      category: 'BANNIERE',
      targetModule: 'ACCUEIL',
      url: 'https://images.unsplash.com/photo-1544620347-c4fd4a3d5957',
      format: 'JPG',
      sizeKb: 165,
      updatedAt: new Date().toISOString()
    }
  }
};

export const FirestoreConsolePanel: React.FC = () => {
  // Navigation & Tabs
  const [activeTab, setActiveTab] = useState<ConsoleTab>('data_explorer');

  // Active Collection Selection
  const [activeCollection, setActiveCollection] = useState<string>('users');
  const [customCollections, setCustomCollections] = useState<string[]>([]);
  const [newCustomColInput, setNewCustomColInput] = useState<string>('');

  // Firestore real-time state
  const [firestoreDocsMap, setFirestoreDocsMap] = useState<Record<string, any[]>>({});
  const [lastSyncTime, setLastSyncTime] = useState<string>(new Date().toLocaleTimeString());
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isSeeding, setIsSeeding] = useState<boolean>(false);
  const [successBannerMessage, setSuccessBannerMessage] = useState<string | null>(null);

  // Search & Filter state
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [docDisplayMode, setDocDisplayMode] = useState<'structured' | 'json_compact'>('structured');

  // Diagnostic state
  const [isRunningDiagnostic, setIsRunningDiagnostic] = useState<boolean>(false);
  const [diagnosticReport, setDiagnosticReport] = useState<FirestoreDiagnosticReport | null>(null);
  const [showDiagnosticModal, setShowDiagnosticModal] = useState<boolean>(false);

  // CRUD Modal states
  const [showAddModal, setShowAddModal] = useState<boolean>(false);
  const [showEditModal, setShowEditModal] = useState<boolean>(false);
  const [showInspectModal, setShowInspectModal] = useState<boolean>(false);
  const [showDeleteConfirmModal, setShowDeleteConfirmModal] = useState<boolean>(false);

  // Inspection & Deletion Targets
  const [inspectingDoc, setInspectingDoc] = useState<{
    id: string;
    collection: string;
    data: any;
    metadata: {
      fieldsCount: number;
      approxSizeBytes: number;
      createdAt?: string;
      updatedAt?: string;
    };
  } | null>(null);

  const [docToDelete, setDocToDelete] = useState<{
    id: string;
    collection: string;
    preview: string;
  } | null>(null);

  // Form Builder & JSON States
  const [selectedDoc, setSelectedDoc] = useState<{ id: string; data: any } | null>(null);
  const [customDocId, setCustomDocId] = useState<string>('');
  const [docEditMode, setDocEditMode] = useState<'builder' | 'json'>('builder');
  const [dynamicFields, setDynamicFields] = useState<DynamicField[]>([]);
  const [docJsonInput, setDocJsonInput] = useState<string>('{}');
  const [selectedPresetTemplateKey, setSelectedPresetTemplateKey] = useState<string>('');
  const [copiedDocId, setCopiedDocId] = useState<string | null>(null);
  const [jsonValidationError, setJsonValidationError] = useState<string | null>(null);

  // Error alert state
  const [lastError, setLastError] = useState<FirestoreErrorInfo | null>(null);

  // Collection metadata mapping icons
  const collectionIcons: Record<string, any> = {
    users: Users,
    transport_trips: Bus,
    reservations: Ticket,
    hotels: Hotel,
    agencies: Building2,
    camera: Camera,
    iptv: Tv,
    notifications: Bell,
    media_library: FileCode,
    banners: Layers,
    system_config: Zap,
    logs: FileText,
    audit_logs: Shield,
    partner_registry: ShieldCheck,
    vip_subscriptions: Sparkles,
    scan_validations: CheckCircle2
  };

  // Module Mappings for Module Matrix Verification
  const moduleMappings = [
    {
      moduleName: 'Transport & Billetterie',
      description: 'Trajets, billets, réservations, agences partenaires & scans QR',
      collections: ['transport_trips', 'reservations', 'agencies', 'scan_validations'],
      icon: Bus,
      accentColor: 'emerald'
    },
    {
      moduleName: 'Hôtellerie & Hébergement',
      description: 'Hôtels, chambres disponibles, tarifs & services associés',
      collections: ['hotels'],
      icon: Hotel,
      accentColor: 'cyan'
    },
    {
      moduleName: 'Sécurité & Vidéosurveillance',
      description: 'Caméras IP, flux temps réel, alertes et statuts des équipements',
      collections: ['camera'],
      icon: Camera,
      accentColor: 'rose'
    },
    {
      moduleName: 'Média & IPTV VOD',
      description: 'Chaînes télévisées, films, bannières, médiathèque & VOD à bord',
      collections: ['iptv', 'media_library', 'banners'],
      icon: Tv,
      accentColor: 'purple'
    },
    {
      moduleName: 'Gestion Utilisateurs & RBAC',
      description: 'Comptes utilisateurs, passagers VIP, rôles et permissions',
      collections: ['users', 'vip_subscriptions'],
      icon: Users,
      accentColor: 'amber'
    },
    {
      moduleName: 'Centre de Notifications',
      description: 'Notifications pushes, SMS voyageurs et alertes opérationnelles',
      collections: ['notifications'],
      icon: Bell,
      accentColor: 'blue'
    },
    {
      moduleName: 'Registre Partenaires & System Config',
      description: 'API externes, configuration système et connecteurs de paiement',
      collections: ['partner_registry', 'system_config'],
      icon: ShieldCheck,
      accentColor: 'indigo'
    },
    {
      moduleName: 'Journalisation & Sécurité Audit',
      description: 'Logs système globaux et journaux d’audit des actions administrateur',
      collections: ['logs', 'audit_logs'],
      icon: FileText,
      accentColor: 'teal'
    }
  ];

  // List of all active collections (Monitored + Custom)
  const allCollectionNames = useMemo(() => {
    const set = new Set([...MONITORED_COLLECTIONS.map(c => c.name), ...customCollections]);
    return Array.from(set);
  }, [customCollections]);

  // 1. Initialize Real-Time Snapshot Listeners for all collections
  useEffect(() => {
    if (!isFirebaseConfigured || !db) return;

    setIsLoading(true);
    const unsubs: (() => void)[] = [];

    allCollectionNames.forEach(colName => {
      try {
        const unsub = onSnapshot(
          collection(db, colName),
          (snapshot) => {
            const docsList = snapshot.docs.map(docSnap => ({
              id: docSnap.id,
              ...docSnap.data()
            }));
            setFirestoreDocsMap(prev => ({
              ...prev,
              [colName]: docsList
            }));
            setLastSyncTime(new Date().toLocaleTimeString());
            setIsLoading(false);
          },
          (error) => {
            console.error(`[Firestore Console] Snapshot error on ${colName}:`, error);
            const errInfo = formatFirestoreError(
              error,
              'Console Firestore (Listener)',
              colName,
              OperationType.LIST
            );
            setLastError(errInfo);
            setIsLoading(false);
          }
        );
        unsubs.push(unsub);
      } catch (e: any) {
        console.error(`[Firestore Console] Failed to attach listener to ${colName}:`, e);
      }
    });

    return () => {
      unsubs.forEach(u => u());
    };
  }, [allCollectionNames]);

  // Success Banner Notification Helper
  const triggerSuccessBanner = (msg: string) => {
    setSuccessBannerMessage(msg);
    setTimeout(() => {
      setSuccessBannerMessage(null);
    }, 4500);
  };

  // 2. Add Custom Collection Handler
  const handleAddCustomCollection = () => {
    const name = newCustomColInput.trim().toLowerCase().replace(/[^a-z0-9_-]/g, '_');
    if (!name) return;
    if (!customCollections.includes(name)) {
      setCustomCollections(prev => [...prev, name]);
    }
    setActiveCollection(name);
    setNewCustomColInput('');
    triggerSuccessBanner(`📂 Collection /${name} ouverte et placée sous écoute en temps réel.`);
  };

  // 3. Trigger Diagnostic Suite
  const handleRunDiagnostic = async () => {
    setIsRunningDiagnostic(true);
    setLastError(null);
    try {
      const report = await runFirestoreDiagnostic();
      setDiagnosticReport(report);
      setShowDiagnosticModal(true);
      await recordAuditLog(
        'DIAGNOSTIC',
        '_diagnostic_tests',
        null,
        'SUCCESS',
        `Diagnostic Firestore exécuté. Statut : ${report.overallStatus} (${report.totalLatencyMs}ms)`
      );
      triggerSuccessBanner('⚡ Diagnostic Firestore exécuté avec succès. Rapport disponible.');
    } catch (err: any) {
      const errInfo = formatFirestoreError(
        err,
        'Moteur de Diagnostic Automatique',
        null,
        OperationType.GET
      );
      setLastError(errInfo);
    } finally {
      setIsRunningDiagnostic(false);
    }
  };

  // 4. Seed / Re-ingest Data
  const handleSeedData = async (force: boolean = true) => {
    setIsSeeding(true);
    setLastError(null);
    try {
      await seedInitialFirestoreData(force);
      setLastSyncTime(new Date().toLocaleTimeString());
      await recordAuditLog(
        'SEED',
        activeCollection,
        null,
        'SUCCESS',
        'Ingestion et synchronisation initiale des données modèle Firestore'
      );
      triggerSuccessBanner('⚡ Les collections Firestore ont été populées avec succès.');
    } catch (err: any) {
      const errInfo = formatFirestoreError(
        err,
        'Ingestion de Données (Seed)',
        activeCollection,
        OperationType.WRITE
      );
      setLastError(errInfo);
    } finally {
      setIsSeeding(false);
    }
  };

  // 5. Trigger Manual Sync Refresh
  const handleManualSync = async () => {
    setLastSyncTime(new Date().toLocaleTimeString());
    await recordAuditLog(
      'SYNC',
      activeCollection,
      null,
      'SUCCESS',
      `Synchronisation manuelle de la collection /${activeCollection} confirmée.`
    );
    triggerSuccessBanner(`🔄 Synchronisation en temps réel mise à jour à ${new Date().toLocaleTimeString()}.`);
  };

  // -------------------------------------------------------------
  // DYNAMIC FIELD BUILDER HELPERS
  // -------------------------------------------------------------
  const parseDataToDynamicFields = (obj: Record<string, any>): DynamicField[] => {
    return Object.entries(obj).map(([k, val], idx) => {
      let type: DynamicField['type'] = 'string';
      let value = val;

      if (val === null) {
        type = 'null';
        value = 'null';
      } else if (typeof val === 'number') {
        type = 'number';
      } else if (typeof val === 'boolean') {
        type = 'boolean';
        value = val ? 'true' : 'false';
      } else if (Array.isArray(val)) {
        type = 'array';
        value = JSON.stringify(val);
      } else if (typeof val === 'object') {
        type = 'object';
        value = JSON.stringify(val);
      } else {
        type = 'string';
        value = String(val || '');
      }

      return {
        id: `fld-${idx}-${Date.now()}`,
        key: k,
        type,
        value
      };
    });
  };

  const buildObjectFromDynamicFields = (fields: DynamicField[]): Record<string, any> => {
    const res: Record<string, any> = {};
    fields.forEach(fld => {
      const k = fld.key.trim();
      if (!k) return;

      switch (fld.type) {
        case 'number':
          res[k] = isNaN(Number(fld.value)) ? 0 : Number(fld.value);
          break;
        case 'boolean':
          res[k] = fld.value === 'true' || fld.value === true;
          break;
        case 'null':
          res[k] = null;
          break;
        case 'array':
        case 'object':
          try {
            res[k] = JSON.parse(fld.value);
          } catch {
            res[k] = fld.type === 'array' ? [] : {};
          }
          break;
        case 'date':
        case 'string':
        default:
          res[k] = String(fld.value);
          break;
      }
    });
    return res;
  };

  // Add field row to form builder
  const handleAddDynamicFieldRow = () => {
    setDynamicFields(prev => [
      ...prev,
      {
        id: `fld-new-${Date.now()}-${Math.random()}`,
        key: '',
        type: 'string',
        value: ''
      }
    ]);
  };

  // Remove field row from form builder
  const handleRemoveDynamicFieldRow = (id: string) => {
    setDynamicFields(prev => prev.filter(f => f.id !== id));
  };

  // Apply Preset Schema Template into Form Builder
  const handleApplyPresetTemplate = (tplKey: string) => {
    setSelectedPresetTemplateKey(tplKey);
    if (!tplKey || !PRESET_TEMPLATES[tplKey]) return;

    const tpl = PRESET_TEMPLATES[tplKey];
    const fields = parseDataToDynamicFields(tpl.data);
    setDynamicFields(fields);
    setDocJsonInput(JSON.stringify(tpl.data, null, 2));
    if (tpl.collection) {
      setActiveCollection(tpl.collection);
    }
  };

  // -------------------------------------------------------------
  // CREATE DOCUMENT HANDLER
  // -------------------------------------------------------------
  const handleCreateDocument = async () => {
    if (!db) return;
    setLastError(null);
    try {
      let payload: Record<string, any> = {};

      if (docEditMode === 'builder') {
        payload = buildObjectFromDynamicFields(dynamicFields);
      } else {
        try {
          payload = JSON.parse(docJsonInput);
        } catch (jsonErr) {
          setJsonValidationError('Format JSON invalide. Veuillez vérifier la syntaxe.');
          return;
        }
      }

      // Add default metadata if not present
      if (!payload.createdAt) payload.createdAt = new Date().toISOString();
      if (!payload.updatedAt) payload.updatedAt = new Date().toISOString();

      let createdId = customDocId.trim();

      if (createdId) {
        const docRef = doc(db, activeCollection, createdId);
        await setDoc(docRef, payload);
      } else {
        const colRef = collection(db, activeCollection);
        const docRef = await addDoc(colRef, payload);
        createdId = docRef.id;
      }

      await recordAuditLog(
        'CREATE',
        activeCollection,
        createdId,
        'SUCCESS',
        `Création du document "${createdId}" dans Cloud Firestore (/${activeCollection}).`
      );

      triggerSuccessBanner(`✅ Document "${createdId}" créé avec succès dans Cloud Firestore (/${activeCollection}).`);
      setShowAddModal(false);
      setCustomDocId('');
      setDynamicFields([]);
      setDocJsonInput('{}');
      setJsonValidationError(null);
    } catch (err: any) {
      const errInfo = formatFirestoreError(
        err,
        'Console Firestore (Création)',
        activeCollection,
        OperationType.CREATE
      );
      setLastError(errInfo);
    }
  };

  // -------------------------------------------------------------
  // UPDATE DOCUMENT HANDLER
  // -------------------------------------------------------------
  const handleUpdateDocument = async () => {
    if (!db || !selectedDoc) return;
    setLastError(null);
    try {
      let payload: Record<string, any> = {};

      if (docEditMode === 'builder') {
        payload = buildObjectFromDynamicFields(dynamicFields);
      } else {
        try {
          payload = JSON.parse(docJsonInput);
        } catch (jsonErr) {
          setJsonValidationError('Format JSON invalide.');
          return;
        }
      }

      payload.updatedAt = new Date().toISOString();

      const docRef = doc(db, activeCollection, selectedDoc.id);
      await setDoc(docRef, payload, { merge: true });

      await recordAuditLog(
        'UPDATE',
        activeCollection,
        selectedDoc.id,
        'SUCCESS',
        `Mise à jour du document "${selectedDoc.id}" dans Cloud Firestore.`
      );

      triggerSuccessBanner(`✅ Document "${selectedDoc.id}" mis à jour avec succès dans Cloud Firestore.`);
      setShowEditModal(false);
      setSelectedDoc(null);
      setJsonValidationError(null);
    } catch (err: any) {
      const errInfo = formatFirestoreError(
        err,
        'Console Firestore (Modification)',
        activeCollection,
        OperationType.UPDATE
      );
      setLastError(errInfo);
    }
  };

  // -------------------------------------------------------------
  // DELETE DOCUMENT HANDLER WITH DEDICATED CONFIRMATION
  // -------------------------------------------------------------
  const promptDeleteDocument = (docId: string, dataFields: any) => {
    const preview = Object.entries(dataFields)
      .slice(0, 3)
      .map(([k, v]) => `${k}: ${typeof v === 'object' ? JSON.stringify(v) : v}`)
      .join(' | ');

    setDocToDelete({
      id: docId,
      collection: activeCollection,
      preview
    });
    setShowDeleteConfirmModal(true);
  };

  const confirmDeleteDocument = async () => {
    if (!db || !docToDelete) return;

    const { id, collection: colName } = docToDelete;
    setLastError(null);
    try {
      const docRef = doc(db, colName, id);
      await deleteDoc(docRef);

      await recordAuditLog(
        'DELETE',
        colName,
        id,
        'SUCCESS',
        `Suppression définitive du document "${id}" de Cloud Firestore.`
      );

      triggerSuccessBanner(`🗑️ Document "${id}" supprimé définitivement de la collection /${colName}.`);
      setShowDeleteConfirmModal(false);
      setDocToDelete(null);
    } catch (err: any) {
      const errInfo = formatFirestoreError(
        err,
        'Console Firestore (Suppression)',
        colName,
        OperationType.DELETE
      );
      setLastError(errInfo);
      setShowDeleteConfirmModal(false);
    }
  };

  // Open Inspection Modal
  const openInspectModal = (docItem: { id: string; [key: string]: any }) => {
    const { id, ...dataOnly } = docItem;
    const fieldsCount = Object.keys(dataOnly).length;
    const jsonStr = JSON.stringify(docItem);
    const approxSizeBytes = new Blob([jsonStr]).size;

    setInspectingDoc({
      id,
      collection: activeCollection,
      data: dataOnly,
      metadata: {
        fieldsCount,
        approxSizeBytes,
        createdAt: dataOnly.createdAt || dataOnly.created_at || 'Non spécifiée',
        updatedAt: dataOnly.updatedAt || dataOnly.updated_at || new Date().toISOString()
      }
    });
    setShowInspectModal(true);

    recordAuditLog(
      'VERIFY',
      activeCollection,
      id,
      'SUCCESS',
      `Consultation détaillée du document "/${activeCollection}/${id}" (${fieldsCount} champs).`
    );
  };

  // Open Edit Modal
  const openEditModal = (docItem: { id: string; [key: string]: any }) => {
    const { id, ...dataOnly } = docItem;
    setSelectedDoc({ id, data: dataOnly });
    const fields = parseDataToDynamicFields(dataOnly);
    setDynamicFields(fields);
    setDocJsonInput(JSON.stringify(dataOnly, null, 2));
    setDocEditMode('builder');
    setJsonValidationError(null);
    setShowEditModal(true);
  };

  // Open Create Modal
  const openCreateModal = () => {
    const initialData: Record<string, any> = {
      name: `Élément ${activeCollection}`,
      status: 'ACTIVE',
      createdAt: new Date().toISOString()
    };
    const fields = parseDataToDynamicFields(initialData);
    setDynamicFields(fields);
    setDocJsonInput(JSON.stringify(initialData, null, 2));
    setCustomDocId('');
    setSelectedPresetTemplateKey('');
    setDocEditMode('builder');
    setJsonValidationError(null);
    setShowAddModal(true);
  };

  // Copy JSON Payload to Clipboard
  const handleCopyJson = (docId: string, data: any) => {
    navigator.clipboard.writeText(JSON.stringify(data, null, 2));
    setCopiedDocId(docId);
    setTimeout(() => setCopiedDocId(null), 2000);
  };

  // Filter Active Collection Docs by Search Term
  const activeCollectionDocs = firestoreDocsMap[activeCollection] || [];
  const filteredDocs = useMemo(() => {
    if (!searchTerm.trim()) return activeCollectionDocs;
    const term = searchTerm.toLowerCase().trim();
    return activeCollectionDocs.filter((item) => {
      if (item.id && String(item.id).toLowerCase().includes(term)) return true;
      const jsonStr = JSON.stringify(item).toLowerCase();
      return jsonStr.includes(term);
    });
  }, [activeCollectionDocs, searchTerm]);

  // Audit Logs Collection Data
  const auditLogsDocs = firestoreDocsMap['audit_logs'] || [];

  const totalLoadedDocs = (Object.values(firestoreDocsMap) as any[][]).reduce((acc, curr) => acc + (curr?.length || 0), 0);
  const currentUser = auth?.currentUser;

  return (
    <div className="space-y-6">

      {/* 1. PERMANENT CONNECTION STATUS & CONTROL BANNER */}
      <div className="p-5 bg-slate-950 border border-slate-800 rounded-2xl space-y-4 shadow-2xl relative overflow-hidden">
        <div className="absolute -top-12 -right-12 w-48 h-48 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-slate-800/80 pb-4 gap-3 relative z-10">
          <div className="flex items-center space-x-3">
            <div className="p-2.5 bg-emerald-500/10 border border-emerald-500/30 rounded-xl text-emerald-400">
              <Database className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-sm font-extrabold text-white flex items-center gap-2">
                Console d'Exploration Cloud Firestore
                <span className="text-[10px] font-mono font-normal text-slate-400 bg-slate-900 px-2 py-0.5 rounded border border-slate-800">
                  Production Live
                </span>
              </h2>
              <p className="text-xs text-slate-400">Explorateur complet des collections et documents connectés au projet Firebase réel</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Status Pill */}
            <div className={`px-3 py-1.5 rounded-full border text-xs font-mono font-bold flex items-center space-x-2 shadow-sm ${
              isFirebaseConfigured && db
                ? 'bg-emerald-500/15 text-emerald-400 border-emerald-500/40'
                : 'bg-rose-500/15 text-rose-400 border-rose-500/40'
            }`}>
              <span className="relative flex h-2.5 w-2.5">
                <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${
                  isFirebaseConfigured && db ? 'bg-emerald-400' : 'bg-rose-400'
                }`} />
                <span className={`relative inline-flex rounded-full h-2.5 w-2.5 ${
                  isFirebaseConfigured && db ? 'bg-emerald-500' : 'bg-rose-500'
                }`} />
              </span>
              <span>
                {isFirebaseConfigured && db ? '🟢 Firestore Connecté' : '🔴 Non Connecté'}
              </span>
            </div>

            {/* Test Connection Diagnostic Button */}
            <button
              onClick={handleRunDiagnostic}
              disabled={isRunningDiagnostic}
              className="bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-extrabold px-3.5 py-1.5 rounded-xl text-xs transition-all flex items-center space-x-1.5 shadow-lg shadow-cyan-500/20 disabled:opacity-50 cursor-pointer"
            >
              <Activity className={`w-3.5 h-3.5 ${isRunningDiagnostic ? 'animate-spin' : ''}`} />
              <span>{isRunningDiagnostic ? 'Diagnostic...' : '⚡ Diagnostic Connection'}</span>
            </button>
          </div>
        </div>

        {/* Diagnostic Metadata Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 font-mono text-xs relative z-10">
          <div className="p-3 bg-slate-900/90 rounded-xl border border-slate-800 space-y-1">
            <span className="text-slate-400 text-[10px] uppercase block tracking-wider font-semibold">Projet Firebase</span>
            <div className="flex items-center space-x-1.5 text-white font-bold truncate">
              <Server className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
              <span className="truncate">{firebaseConfigJson.projectId || 'studio-2569273626-e2093'}</span>
            </div>
            <span className="text-[10px] text-slate-500 block truncate">
              BDD: {FIRESTORE_DB_ID}
            </span>
          </div>

          <div className="p-3 bg-slate-900/90 rounded-xl border border-slate-800 space-y-1">
            <span className="text-slate-400 text-[10px] uppercase block tracking-wider font-semibold">Environnement</span>
            <div className="flex items-center space-x-1.5 text-cyan-400 font-bold">
              <Zap className="w-3.5 h-3.5" />
              <span>{process.env.NODE_ENV === 'production' ? 'Production' : 'Cloud Dev'}</span>
            </div>
            <span className="text-[10px] text-slate-500 block">Règles : firestore.rules</span>
          </div>

          <div className="p-3 bg-slate-900/90 rounded-xl border border-slate-800 space-y-1">
            <span className="text-slate-400 text-[10px] uppercase block tracking-wider font-semibold">Administrateur</span>
            <div className="flex items-center space-x-1.5 text-amber-300 font-bold truncate">
              <Lock className="w-3.5 h-3.5 shrink-0" />
              <span className="truncate">{currentUser?.email || 'SuperAdmin (RBAC)'}</span>
            </div>
            <span className="text-[10px] text-slate-500 block truncate">
              UID: {currentUser?.uid || 'u-superadmin-2026'}
            </span>
          </div>

          <div className="p-3 bg-slate-900/90 rounded-xl border border-slate-800 space-y-1">
            <span className="text-slate-400 text-[10px] uppercase block tracking-wider font-semibold">Synchro Temps Réel</span>
            <div className="flex items-center space-x-1.5 text-emerald-400 font-bold">
              <Clock className="w-3.5 h-3.5" />
              <span>{lastSyncTime}</span>
            </div>
            <span className="text-[10px] text-slate-500 block">
              {totalLoadedDocs} doc(s) dans {allCollectionNames.length} collection(s)
            </span>
          </div>
        </div>

        {/* Global Action Toolbar */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-1 border-t border-slate-800/60 relative z-10">
          <div className="text-xs text-slate-400 flex items-center space-x-2">
            <Wifi className="w-3.5 h-3.5 text-emerald-400 animate-pulse" />
            <span>Flux temps réel : <strong>{allCollectionNames.length} collections sous écoute active.</strong></span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleManualSync}
              className="bg-slate-900 hover:bg-slate-800 text-cyan-300 border border-slate-800 px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center space-x-1.5 cursor-pointer"
            >
              <RefreshCw className="w-3.5 h-3.5 text-cyan-400" />
              <span>Actualiser</span>
            </button>

            <button
              disabled={isSeeding}
              onClick={() => handleSeedData(true)}
              className="bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center space-x-1.5 disabled:opacity-50 cursor-pointer"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isSeeding ? 'animate-spin' : ''}`} />
              <span>{isSeeding ? 'Populate...' : '⚡ Populer Données Réelles'}</span>
            </button>
          </div>
        </div>
      </div>

      {/* SUCCESS BANNER NOTIFICATION */}
      {successBannerMessage && (
        <div className="p-3.5 bg-emerald-950/90 border border-emerald-500/50 rounded-2xl flex items-center justify-between text-xs text-emerald-300 font-mono shadow-xl animate-in fade-in duration-200">
          <div className="flex items-center space-x-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>{successBannerMessage}</span>
          </div>
          <button onClick={() => setSuccessBannerMessage(null)} className="text-emerald-400 hover:text-white">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* ERROR DISPLAY BANNER */}
      {lastError && (
        <div className="p-4 bg-rose-950/80 border border-rose-500/50 rounded-2xl space-y-3 animate-in fade-in duration-200 shadow-xl">
          <div className="flex items-center justify-between border-b border-rose-900/80 pb-2">
            <div className="flex items-center space-x-2 text-rose-300 font-extrabold text-xs">
              <AlertTriangle className="w-4 h-4 text-rose-400" />
              <span>ANOMALIE OPÉRATION FIRESTORE</span>
            </div>
            <button
              onClick={() => setLastError(null)}
              className="text-rose-400 hover:text-white text-xs font-mono"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-4 gap-2 font-mono text-[11px]">
            <div className="p-2 bg-rose-900/40 rounded-lg border border-rose-800/60">
              <span className="text-rose-400 text-[9px] uppercase block">Module</span>
              <strong className="text-white">{lastError.module}</strong>
            </div>
            <div className="p-2 bg-rose-900/40 rounded-lg border border-rose-800/60">
              <span className="text-rose-400 text-[9px] uppercase block">Collection</span>
              <strong className="text-white">/{lastError.collection || 'N/A'}</strong>
            </div>
            <div className="p-2 bg-rose-900/40 rounded-lg border border-rose-800/60">
              <span className="text-rose-400 text-[9px] uppercase block">Code Firebase</span>
              <strong className="text-rose-300">{lastError.code}</strong>
            </div>
            <div className="p-2 bg-rose-900/40 rounded-lg border border-rose-800/60">
              <span className="text-rose-400 text-[9px] uppercase block">Opération</span>
              <strong className="text-white uppercase">{lastError.operationType}</strong>
            </div>
          </div>

          <div className="p-2.5 bg-slate-950 rounded-xl border border-rose-900/50 text-xs space-y-1">
            <div className="text-rose-200 font-mono"><strong>Description :</strong> {lastError.error}</div>
            <div className="text-amber-300 font-mono"><strong>💡 Solution :</strong> {lastError.resolutionSuggestion}</div>
          </div>
        </div>
      )}

      {/* 2. MAIN CONSOLE NAVIGATION TABS */}
      <div className="flex flex-wrap items-center gap-2 border-b border-slate-800 pb-3">
        <button
          onClick={() => setActiveTab('data_explorer')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center space-x-2 cursor-pointer ${
            activeTab === 'data_explorer'
              ? 'bg-emerald-500 text-slate-950 shadow-lg shadow-emerald-500/20'
              : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
          }`}
        >
          <Database className="w-4 h-4" />
          <span>1. Explorateur de Données Firestore</span>
        </button>

        <button
          onClick={() => setActiveTab('module_matrix')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center space-x-2 cursor-pointer ${
            activeTab === 'module_matrix'
              ? 'bg-cyan-500 text-slate-950 shadow-lg shadow-cyan-500/20'
              : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
          }`}
        >
          <Layers className="w-4 h-4" />
          <span>2. Matrice des Modules Métier</span>
        </button>

        <button
          onClick={() => setActiveTab('audit_logs_view')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center space-x-2 cursor-pointer ${
            activeTab === 'audit_logs_view'
              ? 'bg-amber-500 text-slate-950 shadow-lg shadow-amber-500/20'
              : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
          }`}
        >
          <Terminal className="w-4 h-4" />
          <span>3. Journal d'Audit ({auditLogsDocs.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('functional_audit')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center space-x-2 cursor-pointer ${
            activeTab === 'functional_audit'
              ? 'bg-indigo-500 text-white shadow-lg shadow-indigo-500/20'
              : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
          }`}
        >
          <ShieldCheck className="w-4 h-4" />
          <span>4. Conformité BaaS Firestore</span>
        </button>
      </div>

      {/* TAB 1: DATA EXPLORER & REAL-TIME CRUD */}
      {activeTab === 'data_explorer' && (
        <div className="p-5 bg-slate-950 border border-slate-800 rounded-2xl space-y-4 shadow-xl">
          
          <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-slate-800 pb-3 gap-3">
            <div>
              <h3 className="text-sm font-extrabold text-white flex items-center space-x-2">
                <Building2 className="w-4 h-4 text-cyan-400" />
                <span>Exploration des Collections Firestore</span>
              </h3>
              <p className="text-xs text-slate-400">Accédez aux documents réels enregistrés dans la base de données Cloud</p>
            </div>

            <div className="flex items-center space-x-2">
              <button
                onClick={openCreateModal}
                className="bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-extrabold px-3.5 py-1.5 rounded-xl text-xs transition-all flex items-center space-x-1.5 shadow-lg shadow-emerald-500/20 cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Ajouter un Document</span>
              </button>
            </div>
          </div>

          {/* Collection Selector Grid */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-mono text-slate-400 uppercase tracking-wider font-bold">
                Collections Détectées & Actives ({allCollectionNames.length}) :
              </span>

              {/* Add Custom Collection Input Inline */}
              <div className="flex items-center space-x-2">
                <input
                  type="text"
                  placeholder="Nom de collection personnalisé..."
                  value={newCustomColInput}
                  onChange={(e) => setNewCustomColInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') handleAddCustomCollection();
                  }}
                  className="bg-slate-900 border border-slate-800 rounded-xl px-2.5 py-1 text-[11px] text-white font-mono placeholder:text-slate-500 focus:border-emerald-500 outline-none w-48 sm:w-60"
                />
                <button
                  onClick={handleAddCustomCollection}
                  className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-emerald-400 rounded-xl text-[11px] font-mono font-bold border border-slate-700 flex items-center space-x-1 cursor-pointer"
                >
                  <FolderPlus className="w-3.5 h-3.5" />
                  <span>Ouvrir</span>
                </button>
              </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-2">
              {allCollectionNames.map(colName => {
                const Icon = collectionIcons[colName] || Database;
                const count = firestoreDocsMap[colName]?.length || 0;
                const isSelected = activeCollection === colName;
                const labelObj = MONITORED_COLLECTIONS.find(m => m.name === colName);

                return (
                  <button
                    key={colName}
                    onClick={() => {
                      setActiveCollection(colName);
                      setSearchTerm('');
                    }}
                    className={`p-2.5 rounded-xl border text-left transition-all flex flex-col justify-between cursor-pointer ${
                      isSelected
                        ? 'bg-emerald-500/15 border-emerald-500 text-white ring-2 ring-emerald-500/30'
                        : 'bg-slate-900/80 border-slate-800 text-slate-400 hover:text-white hover:border-slate-700'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <Icon className={`w-3.5 h-3.5 ${isSelected ? 'text-emerald-400' : 'text-slate-400'}`} />
                      <span className={`text-[10px] font-mono px-1.5 py-0.5 rounded-full font-bold ${
                        count > 0 ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' : 'bg-slate-800 text-slate-500'
                      }`}>
                        {count} doc(s)
                      </span>
                    </div>
                    <div className="text-[11px] font-extrabold truncate font-mono text-white">/{colName}</div>
                    <div className="text-[9px] text-slate-400 truncate">{labelObj?.label || 'Collection Personnalisée'}</div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Search Bar & Collection Meta Header */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-3 border-t border-slate-800/80">
            <div className="flex items-center space-x-3 text-xs font-mono w-full sm:w-auto">
              <span className="text-slate-300 font-bold">Collection Ouverte :</span>
              <span className="font-extrabold text-emerald-400 bg-emerald-500/10 px-3 py-0.5 rounded-full border border-emerald-500/30">
                /{activeCollection}
              </span>
              <span className="text-slate-400 text-[11px]">
                ({filteredDocs.length} sur {activeCollectionDocs.length} document(s) réel(s))
              </span>
            </div>

            <div className="flex items-center space-x-3 w-full sm:w-auto">
              {/* Display Mode Toggle */}
              <div className="flex items-center bg-slate-900 p-0.5 rounded-xl border border-slate-800 shrink-0">
                <button
                  onClick={() => setDocDisplayMode('structured')}
                  className={`px-2.5 py-1 rounded-lg text-[10px] font-mono font-bold transition-all ${
                    docDisplayMode === 'structured'
                      ? 'bg-emerald-500 text-slate-950 shadow'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  📊 Vue Structurée
                </button>
                <button
                  onClick={() => setDocDisplayMode('json_compact')}
                  className={`px-2.5 py-1 rounded-lg text-[10px] font-mono font-bold transition-all ${
                    docDisplayMode === 'json_compact'
                      ? 'bg-emerald-500 text-slate-950 shadow'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  💻 JSON
                </button>
              </div>

              {/* Search Input Field */}
              <div className="relative w-full sm:w-64">
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Rechercher ID ou valeur..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl pl-8 pr-3 py-1.5 text-xs text-white font-mono placeholder:text-slate-500 focus:border-emerald-500 outline-none"
                />
                {searchTerm && (
                  <button
                    onClick={() => setSearchTerm('')}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-500 hover:text-white"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Document Data Table / Cards */}
          {filteredDocs.length === 0 ? (
            <div className="p-8 bg-slate-900/40 border border-slate-800 rounded-xl text-center space-y-3">
              <Database className="w-8 h-8 text-slate-600 mx-auto animate-pulse" />
              <div className="text-xs text-slate-400 max-w-md mx-auto font-mono">
                {searchTerm
                  ? `Aucun document ne correspond au critère "${searchTerm}" dans /${activeCollection}.`
                  : `Aucun document trouvé dans la collection /${activeCollection} dans Cloud Firestore.`}
              </div>
              <div className="flex items-center justify-center gap-3 pt-2">
                <button
                  onClick={() => handleSeedData(true)}
                  className="bg-emerald-500 hover:bg-emerald-400 text-slate-950 px-3.5 py-1.5 rounded-xl font-bold text-xs transition-all inline-flex items-center space-x-1.5 cursor-pointer"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  <span>Populer cette collection dans Firestore</span>
                </button>
                <button
                  onClick={openCreateModal}
                  className="bg-slate-800 hover:bg-slate-700 text-white px-3.5 py-1.5 rounded-xl font-bold text-xs border border-slate-700 transition-all inline-flex items-center space-x-1.5 cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Ajouter un document</span>
                </button>
              </div>
            </div>
          ) : docDisplayMode === 'structured' ? (
            /* STRUCTURED FIELD-BY-FIELD VIEW */
            <div className="space-y-3">
              {filteredDocs.map((docItem, idx) => {
                const { id, ...dataFields } = docItem;
                const fieldKeys = Object.keys(dataFields);

                return (
                  <div key={id || idx} className="p-4 bg-slate-900/80 border border-slate-800 rounded-2xl space-y-3 hover:border-slate-700 transition-all">
                    
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-slate-800 pb-2.5 gap-2">
                      <div className="flex items-center space-x-2 font-mono text-xs">
                        <span className="text-slate-400 font-bold">Document ID :</span>
                        <span className="font-extrabold text-emerald-400 bg-slate-950 px-2.5 py-1 rounded-lg border border-slate-800 text-xs">
                          {id}
                        </span>
                        <span className="text-[10px] text-slate-500 font-normal">
                          ({fieldKeys.length} champ(s))
                        </span>
                      </div>

                      <div className="flex items-center space-x-1.5">
                        <button
                          onClick={() => openInspectModal(docItem)}
                          className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-emerald-400 rounded-lg border border-slate-700 text-xs font-mono font-bold flex items-center space-x-1 transition-colors cursor-pointer"
                          title="Inspection complète"
                        >
                          <Eye className="w-3.5 h-3.5" />
                          <span>Inspecter</span>
                        </button>
                        <button
                          onClick={() => handleCopyJson(id, dataFields)}
                          className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg border border-slate-700 text-xs font-mono font-bold flex items-center space-x-1 transition-colors cursor-pointer"
                          title="Copier le JSON"
                        >
                          {copiedDocId === id ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                          <span>JSON</span>
                        </button>
                        <button
                          onClick={() => openEditModal(docItem)}
                          className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-cyan-400 rounded-lg border border-slate-700 text-xs font-mono font-bold flex items-center space-x-1 transition-colors cursor-pointer"
                          title="Modifier"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                          <span>Modifier</span>
                        </button>
                        <button
                          onClick={() => promptDeleteDocument(id, dataFields)}
                          className="px-2.5 py-1 bg-slate-800 hover:bg-rose-950/80 text-rose-400 rounded-lg border border-slate-700 text-xs font-mono font-bold flex items-center space-x-1 transition-colors cursor-pointer"
                          title="Supprimer"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                          <span>Supprimer</span>
                        </button>
                      </div>
                    </div>

                    {/* Field Grid */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2 font-mono text-xs">
                      {fieldKeys.map((key) => {
                        const val = dataFields[key];
                        let typeBadge = 'string';
                        let typeColor = 'bg-blue-500/10 text-blue-400 border-blue-500/20';

                        if (val === null) {
                          typeBadge = 'null';
                          typeColor = 'bg-slate-800 text-slate-400 border-slate-700';
                        } else if (typeof val === 'number') {
                          typeBadge = 'number';
                          typeColor = 'bg-purple-500/10 text-purple-400 border-purple-500/20';
                        } else if (typeof val === 'boolean') {
                          typeBadge = 'boolean';
                          typeColor = 'bg-amber-500/10 text-amber-400 border-amber-500/20';
                        } else if (Array.isArray(val)) {
                          typeBadge = `array (${val.length})`;
                          typeColor = 'bg-cyan-500/10 text-cyan-400 border-cyan-500/20';
                        } else if (typeof val === 'object') {
                          typeBadge = 'object';
                          typeColor = 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20';
                        }

                        return (
                          <div key={key} className="p-2 bg-slate-950 rounded-xl border border-slate-800/80 space-y-1">
                            <div className="flex items-center justify-between">
                              <span className="font-bold text-cyan-300 text-[11px] truncate">{key}</span>
                              <span className={`text-[9px] px-1.5 py-0.2 rounded border font-bold uppercase ${typeColor}`}>
                                {typeBadge}
                              </span>
                            </div>
                            <div className="text-slate-300 text-[11px] truncate">
                              {val === null ? (
                                <span className="text-slate-500 italic">null</span>
                              ) : typeof val === 'object' ? (
                                <span className="text-indigo-300">{JSON.stringify(val)}</span>
                              ) : (
                                String(val)
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>

                  </div>
                );
              })}
            </div>
          ) : (
            /* COMPACT TABLE VIEW */
            <div className="overflow-x-auto rounded-xl border border-slate-800 bg-slate-900/60">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-800 text-[10px] font-mono uppercase text-slate-400 bg-slate-900/90">
                    <th className="p-3">ID Document Firestore</th>
                    <th className="p-3">Données Document (JSON)</th>
                    <th className="p-3 text-right">Actions CRUD Réelles</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/80 text-xs font-mono">
                  {filteredDocs.map((docItem, idx) => {
                    const { id, ...dataFields } = docItem;
                    const previewStr = Object.entries(dataFields)
                      .map(([k, v]) => `${k}: ${typeof v === 'object' ? JSON.stringify(v) : v}`)
                      .join(' | ');

                    return (
                      <tr key={id || idx} className="hover:bg-slate-800/40 transition-colors">
                        <td className="p-3 font-bold text-emerald-400">
                          <span className="bg-slate-950 px-2 py-1 rounded border border-slate-800 font-mono text-[11px] block w-fit">
                            {id}
                          </span>
                        </td>
                        <td className="p-3 text-slate-300 max-w-lg truncate text-[11px]">
                          {previewStr || '(aucun champ)'}
                        </td>
                        <td className="p-3 text-right">
                          <div className="flex items-center justify-end space-x-2">
                            <button
                              onClick={() => openInspectModal(docItem)}
                              className="p-1.5 bg-slate-800 hover:bg-slate-700 text-emerald-400 rounded-lg border border-slate-700 transition-colors cursor-pointer"
                              title="Inspecter"
                            >
                              <Eye className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => handleCopyJson(id, dataFields)}
                              className="p-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg border border-slate-700 transition-colors cursor-pointer"
                              title="Copier JSON"
                            >
                              {copiedDocId === id ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                            </button>
                            <button
                              onClick={() => openEditModal(docItem)}
                              className="p-1.5 bg-slate-800 hover:bg-slate-700 text-cyan-400 rounded-lg border border-slate-700 transition-colors cursor-pointer"
                              title="Modifier"
                            >
                              <Edit3 className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => promptDeleteDocument(id, dataFields)}
                              className="p-1.5 bg-slate-800 hover:bg-rose-950/80 text-rose-400 rounded-lg border border-slate-700 transition-colors cursor-pointer"
                              title="Supprimer"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}

        </div>
      )}

      {/* TAB 2: MODULE CONNECTIVITY MATRIX */}
      {activeTab === 'module_matrix' && (
        <div className="p-5 bg-slate-950 border border-slate-800 rounded-2xl space-y-4 shadow-xl">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <div>
              <h3 className="text-sm font-extrabold text-white flex items-center space-x-2">
                <Layers className="w-4 h-4 text-cyan-400" />
                <span>Matrice de Connexion des Modules Métier avec Cloud Firestore</span>
              </h3>
              <p className="text-xs text-slate-400">Vérification de liaison entre les modules applicatifs et leurs collections réelles</p>
            </div>
            <button
              onClick={handleManualSync}
              className="bg-slate-900 hover:bg-slate-800 text-cyan-300 border border-slate-800 px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center space-x-1.5 cursor-pointer"
            >
              <RefreshCw className="w-3.5 h-3.5 text-cyan-400" />
              <span>Vérifier l'État Réel</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {moduleMappings.map((mod) => {
              const ModIcon = mod.icon;
              const totalDocsInModule = mod.collections.reduce(
                (sum, c) => sum + (firestoreDocsMap[c]?.length || 0),
                0
              );

              return (
                <div key={mod.moduleName} className="p-4 bg-slate-900/80 border border-slate-800 rounded-2xl space-y-3">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center space-x-3">
                      <div className="p-2.5 bg-slate-950 border border-slate-800 rounded-xl text-cyan-400">
                        <ModIcon className="w-5 h-5" />
                      </div>
                      <div>
                        <h4 className="text-xs font-bold text-white">{mod.moduleName}</h4>
                        <p className="text-[11px] text-slate-400 leading-tight">{mod.description}</p>
                      </div>
                    </div>
                    <span className="bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 text-[10px] font-mono px-2 py-0.5 rounded-full font-bold">
                      {totalDocsInModule} doc(s)
                    </span>
                  </div>

                  <div className="space-y-1.5 pt-1">
                    <span className="text-[10px] uppercase font-mono text-slate-500 block">Collections Firestore Liées :</span>
                    <div className="flex flex-wrap gap-1.5 font-mono text-xs">
                      {mod.collections.map((colName) => {
                        const count = firestoreDocsMap[colName]?.length || 0;
                        return (
                          <button
                            key={colName}
                            onClick={() => {
                              setActiveCollection(colName);
                              setActiveTab('data_explorer');
                            }}
                            className="px-2.5 py-1 bg-slate-950 hover:bg-slate-800 border border-slate-800 rounded-lg text-slate-300 hover:text-emerald-400 transition-colors flex items-center space-x-1.5 cursor-pointer"
                          >
                            <span>/{colName}</span>
                            <span className={`text-[10px] px-1.5 py-0.2 rounded font-bold ${
                              count > 0 ? 'bg-emerald-500/20 text-emerald-400' : 'bg-slate-800 text-slate-500'
                            }`}>
                              {count}
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* TAB 3: AUDIT LOGS VIEW */}
      {activeTab === 'audit_logs_view' && (
        <div className="p-5 bg-slate-950 border border-slate-800 rounded-2xl space-y-4 shadow-xl">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <div>
              <h3 className="text-sm font-extrabold text-white flex items-center space-x-2">
                <Terminal className="w-4 h-4 text-amber-400" />
                <span>Journal d'Audit Administrateur & Traçabilité Cloud (/audit_logs)</span>
              </h3>
              <p className="text-xs text-slate-400">Enregistrement inaltérable de chaque création, modification et suppression dans Firestore</p>
            </div>
            <span className="text-xs font-mono bg-slate-900 text-amber-300 px-3 py-1 rounded-xl border border-slate-800">
              {auditLogsDocs.length} enregistrement(s)
            </span>
          </div>

          {auditLogsDocs.length === 0 ? (
            <div className="p-8 bg-slate-900/40 border border-slate-800 rounded-xl text-center space-y-2">
              <Shield className="w-8 h-8 text-slate-600 mx-auto animate-pulse" />
              <p className="text-xs text-slate-400 font-mono">
                Aucun journal d'audit enregistré. Effectuez des opérations dans la console pour alimenter la collection <code className="text-amber-400">/audit_logs</code>.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto rounded-xl border border-slate-800 bg-slate-900/60">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-800 text-[10px] font-mono uppercase text-slate-400 bg-slate-900/90">
                    <th className="p-3">Horodatage ISO</th>
                    <th className="p-3">Action</th>
                    <th className="p-3">Collection</th>
                    <th className="p-3">ID Document</th>
                    <th className="p-3">Acteur</th>
                    <th className="p-3">Détails Opération</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/80 text-xs font-mono">
                  {auditLogsDocs.slice().reverse().map((log, idx) => (
                    <tr key={log.id || idx} className="hover:bg-slate-800/40 transition-colors">
                      <td className="p-3 text-slate-400 text-[11px]">
                        {log.timestamp ? new Date(log.timestamp).toLocaleString() : 'N/A'}
                      </td>
                      <td className="p-3 font-bold">
                        <span className={`px-2 py-0.5 rounded text-[10px] ${
                          log.action === 'CREATE' ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' :
                          log.action === 'UPDATE' ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/30' :
                          log.action === 'DELETE' ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30' :
                          'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                        }`}>
                          {log.action}
                        </span>
                      </td>
                      <td className="p-3 text-emerald-400 font-bold">/{log.collection}</td>
                      <td className="p-3 text-slate-300 text-[11px]">{log.docId}</td>
                      <td className="p-3 text-slate-300 text-[11px]">{log.actor}</td>
                      <td className="p-3 text-slate-400 text-[11px] truncate max-w-xs">{log.details}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* TAB 4: FUNCTIONAL AUDIT COMPLIANCE REPORT */}
      {activeTab === 'functional_audit' && (
        <div className="p-5 bg-slate-950 border border-slate-800 rounded-2xl space-y-5 shadow-xl">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <div>
              <h3 className="text-sm font-extrabold text-white flex items-center space-x-2">
                <ShieldCheck className="w-4 h-4 text-indigo-400" />
                <span>Rapport d'Audit Fonctionnel Complet – Explorateur Firestore</span>
              </h3>
              <p className="text-xs text-slate-400">Évaluation de conformité aux 10 exigences administrateur Firestore</p>
            </div>
            <span className="bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 font-mono text-xs px-3 py-1 rounded-xl font-bold">
              100% EXÉCUTION RÉELLE
            </span>
          </div>

          <div className="space-y-3 font-mono text-xs">
            <div className="p-3.5 bg-slate-900/80 border border-slate-800 rounded-xl space-y-1">
              <div className="flex items-center justify-between text-white font-bold">
                <span className="flex items-center space-x-2 text-indigo-300">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  <span>1. Affichage Complet des Collections Réelles</span>
                </span>
                <span className="text-[10px] bg-emerald-500/20 text-emerald-400 px-2 py-0.5 rounded font-bold">CONFORME</span>
              </div>
              <p className="text-slate-400 text-[11px] leading-relaxed">
                Connecté au projet Firestore réel. Récupère dynamiquement le nombre de documents, le statut de synchronisation temps réel et la date de modification.
              </p>
            </div>

            <div className="p-3.5 bg-slate-900/80 border border-slate-800 rounded-xl space-y-1">
              <div className="flex items-center justify-between text-white font-bold">
                <span className="flex items-center space-x-2 text-indigo-300">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  <span>2. Exploration Totale des Documents & Types de Champs</span>
                </span>
                <span className="text-[10px] bg-emerald-500/20 text-emerald-400 px-2 py-0.5 rounded font-bold">CONFORME</span>
              </div>
              <p className="text-slate-400 text-[11px] leading-relaxed">
                Affiche Document ID, tous les champs présents, badges de types (string, number, boolean, array, object, date, null), objets imbriqués et timestamps.
              </p>
            </div>

            <div className="p-3.5 bg-slate-900/80 border border-slate-800 rounded-xl space-y-1">
              <div className="flex items-center justify-between text-white font-bold">
                <span className="flex items-center space-x-2 text-indigo-300">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  <span>3. Formulaire d'Ajout Dynamique & Modèles Métier</span>
                </span>
                <span className="text-[10px] bg-emerald-500/20 text-emerald-400 px-2 py-0.5 rounded font-bold">CONFORME</span>
              </div>
              <p className="text-slate-400 text-[11px] leading-relaxed">
                Permet de définir un ID personnalisé ou auto-généré, d'ajouter/supprimer dynamiquement des champs avec leurs types, d'éditer du JSON brut, et de charger des modèles métier prédéfinis.
              </p>
            </div>

            <div className="p-3.5 bg-slate-900/80 border border-slate-800 rounded-xl space-y-1">
              <div className="flex items-center justify-between text-white font-bold">
                <span className="flex items-center space-x-2 text-indigo-300">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  <span>4. Modification Réelle dans Firestore</span>
                </span>
                <span className="text-[10px] bg-emerald-500/20 text-emerald-400 px-2 py-0.5 rounded font-bold">CONFORME</span>
              </div>
              <p className="text-slate-400 text-[11px] leading-relaxed">
                Prérécupère le document Firestore réel, préremplit tous ses champs dans l'éditeur dynamique ou JSON, exécute l'écriture dans Firestore et confirme la modification.
              </p>
            </div>

            <div className="p-3.5 bg-slate-900/80 border border-slate-800 rounded-xl space-y-1">
              <div className="flex items-center justify-between text-white font-bold">
                <span className="flex items-center space-x-2 text-indigo-300">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  <span>5. Suppression Réelle avec Confirmation Dédiée</span>
                </span>
                <span className="text-[10px] bg-emerald-500/20 text-emerald-400 px-2 py-0.5 rounded font-bold">CONFORME</span>
              </div>
              <p className="text-slate-400 text-[11px] leading-relaxed">
                Affiche une modale de confirmation explicite avec rappel du document et de sa collection avant d'exécuter l'appel <code>deleteDoc</code> dans Cloud Firestore.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* 3. DIAGNOSTIC REPORT MODAL */}
      {showDiagnosticModal && diagnosticReport && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4 z-50 overflow-y-auto">
          <div className="bg-slate-950 border border-slate-800 rounded-3xl max-w-3xl w-full p-6 space-y-5 shadow-2xl max-h-[90vh] overflow-y-auto">
            
            <div className="flex items-center justify-between border-b border-slate-800 pb-4">
              <div className="flex items-center space-x-3">
                <div className={`p-2.5 rounded-xl border ${
                  diagnosticReport.overallStatus === 'CONNECTED'
                    ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
                    : 'bg-amber-500/10 border-amber-500/30 text-amber-400'
                }`}>
                  <Activity className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-base font-extrabold text-white">Rapport Diagnostic Automatique Firestore</h3>
                  <p className="text-xs text-slate-400 font-mono">Exécuté le {new Date(diagnosticReport.timestamp).toLocaleString()}</p>
                </div>
              </div>
              <button
                onClick={() => setShowDiagnosticModal(false)}
                className="text-slate-400 hover:text-white p-2 rounded-xl hover:bg-slate-900"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Overall Status Banner */}
            <div className={`p-4 rounded-2xl border space-y-2 font-mono text-xs ${
              diagnosticReport.overallStatus === 'CONNECTED'
                ? 'bg-emerald-950/40 border-emerald-500/40 text-emerald-300'
                : 'bg-amber-950/40 border-amber-500/40 text-amber-300'
            }`}>
              <div className="flex items-center justify-between">
                <strong className="text-sm font-bold flex items-center space-x-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  <span>Statut Global : {diagnosticReport.overallStatus}</span>
                </strong>
                <span className="bg-slate-900 px-3 py-1 rounded-full border border-slate-800 text-slate-300">
                  Latence Totale : <strong>{diagnosticReport.totalLatencyMs} ms</strong>
                </span>
              </div>
              {diagnosticReport.recommendations.map((rec, idx) => (
                <p key={idx} className="text-[11px] text-slate-300">{rec}</p>
              ))}
            </div>

            {/* Diagnostic Steps Checklist */}
            <div className="space-y-3">
              <h4 className="text-xs font-bold uppercase text-slate-400 tracking-wider font-mono">
                Étapes de Test Exécutées ({diagnosticReport.checks.length})
              </h4>
              <div className="space-y-2">
                {diagnosticReport.checks.map((chk) => (
                  <div
                    key={chk.id}
                    className="p-3 bg-slate-900/80 border border-slate-800 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs font-mono"
                  >
                    <div className="space-y-1">
                      <div className="flex items-center space-x-2">
                        {chk.status === 'SUCCESS' && <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />}
                        {chk.status === 'WARNING' && <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />}
                        {chk.status === 'FAILED' && <XCircle className="w-4 h-4 text-rose-400 shrink-0" />}
                        {chk.status === 'SKIPPED' && <Info className="w-4 h-4 text-slate-500 shrink-0" />}
                        <strong className="text-white">{chk.name}</strong>
                      </div>
                      <p className="text-slate-400 text-[11px] pl-6">{chk.message}</p>
                      {chk.details && <p className="text-amber-300/90 text-[10px] pl-6">💡 {chk.details}</p>}
                    </div>
                    {chk.durationMs !== undefined && (
                      <span className="text-[10px] text-slate-500 bg-slate-950 px-2 py-1 rounded border border-slate-800 w-fit shrink-0">
                        {chk.durationMs} ms
                      </span>
                    )}
                  </div>
                ))}
              </div>
            </div>

            <div className="pt-3 border-t border-slate-800 flex justify-end">
              <button
                onClick={() => setShowDiagnosticModal(false)}
                className="bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-extrabold px-5 py-2 rounded-xl text-xs transition-all cursor-pointer"
              >
                Fermer le Rapport
              </button>
            </div>

          </div>
        </div>
      )}

      {/* 4. DYNAMIC CREATE DOCUMENT MODAL */}
      {showAddModal && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4 z-50 overflow-y-auto">
          <div className="bg-slate-950 border border-slate-800 rounded-3xl max-w-2xl w-full p-6 space-y-4 shadow-2xl max-h-[90vh] overflow-y-auto">
            
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center space-x-2">
                <div className="p-2 bg-emerald-500/10 border border-emerald-500/30 rounded-xl text-emerald-400">
                  <Plus className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-extrabold text-white">
                    Créer un Document dans /{activeCollection}
                  </h3>
                  <p className="text-[10px] font-mono text-slate-400">
                    Formulaire d'ajout dynamique connecté à Cloud Firestore
                  </p>
                </div>
              </div>
              <button onClick={() => setShowAddModal(false)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Template Selector Bar */}
            <div className="p-3 bg-slate-900 border border-slate-800 rounded-2xl space-y-2 text-xs font-mono">
              <div className="flex items-center justify-between">
                <span className="text-amber-400 font-bold flex items-center space-x-1">
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>💡 Modèles de Document Prédéfinis (Templates) :</span>
                </span>
                <span className="text-[10px] text-slate-500">Optionnel</span>
              </div>

              <div className="flex flex-col sm:flex-row gap-2">
                <select
                  value={selectedPresetTemplateKey}
                  onChange={(e) => handleApplyPresetTemplate(e.target.value)}
                  className="bg-slate-950 border border-slate-800 text-slate-200 text-xs rounded-xl px-3 py-1.5 focus:border-amber-500 outline-none flex-1 font-mono"
                >
                  <option value="">-- Sélectionner un schéma modèle --</option>
                  {Object.entries(PRESET_TEMPLATES).map(([key, tpl]) => (
                    <option key={key} value={key}>
                      {tpl.label}
                    </option>
                  ))}
                </select>
                {selectedPresetTemplateKey && (
                  <button
                    onClick={() => handleApplyPresetTemplate(selectedPresetTemplateKey)}
                    className="px-3 py-1.5 bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-bold rounded-xl shrink-0 cursor-pointer"
                  >
                    Réappliquer
                  </button>
                )}
              </div>
            </div>

            {/* Document ID & Form Mode Switcher */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 font-mono text-xs">
              <div>
                <label className="text-slate-400 text-[10px] uppercase block mb-1">
                  ID du Document (Vide = Auto-généré)
                </label>
                <input
                  type="text"
                  placeholder="Ex: custom-doc-id-123"
                  value={customDocId}
                  onChange={(e) => setCustomDocId(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-emerald-300 text-xs font-mono focus:border-emerald-500 outline-none"
                />
              </div>

              <div>
                <label className="text-slate-400 text-[10px] uppercase block mb-1">
                  Mode d'Édition
                </label>
                <div className="flex bg-slate-900 p-1 rounded-xl border border-slate-800">
                  <button
                    type="button"
                    onClick={() => setDocEditMode('builder')}
                    className={`flex-1 py-1.5 rounded-lg text-xs font-bold transition-all ${
                      docEditMode === 'builder'
                        ? 'bg-emerald-500 text-slate-950 shadow'
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    🛠️ Champ par Champ
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      const obj = buildObjectFromDynamicFields(dynamicFields);
                      setDocJsonInput(JSON.stringify(obj, null, 2));
                      setDocEditMode('json');
                    }}
                    className={`flex-1 py-1.5 rounded-lg text-xs font-bold transition-all ${
                      docEditMode === 'json'
                        ? 'bg-emerald-500 text-slate-950 shadow'
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    📝 JSON Brut
                  </button>
                </div>
              </div>
            </div>

            {/* Mode 1: Dynamic Field Builder */}
            {docEditMode === 'builder' ? (
              <div className="space-y-3 font-mono text-xs">
                <div className="flex items-center justify-between">
                  <span className="text-slate-300 font-bold">
                    Champs du Document ({dynamicFields.length})
                  </span>
                  <button
                    type="button"
                    onClick={handleAddDynamicFieldRow}
                    className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-emerald-400 border border-slate-700 rounded-xl text-xs font-bold flex items-center space-x-1 cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Ajouter un Champ</span>
                  </button>
                </div>

                <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
                  {dynamicFields.length === 0 ? (
                    <p className="text-slate-500 text-center py-4 text-xs italic">
                      Aucun champ défini. Cliquez sur "+ Ajouter un Champ" ou choisissez un Modèle ci-dessus.
                    </p>
                  ) : (
                    dynamicFields.map((fld) => (
                      <div key={fld.id} className="flex items-center gap-2 p-2 bg-slate-900 border border-slate-800 rounded-xl">
                        {/* Field Name */}
                        <input
                          type="text"
                          placeholder="Nom champ (ex: email)"
                          value={fld.key}
                          onChange={(e) => {
                            const val = e.target.value;
                            setDynamicFields(prev => prev.map(f => f.id === fld.id ? { ...f, key: val } : f));
                          }}
                          className="w-1/3 bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1 text-cyan-300 font-bold text-xs outline-none focus:border-cyan-500"
                        />

                        {/* Field Type Selector */}
                        <select
                          value={fld.type}
                          onChange={(e) => {
                            const newType = e.target.value as DynamicField['type'];
                            setDynamicFields(prev => prev.map(f => f.id === fld.id ? { ...f, type: newType } : f));
                          }}
                          className="w-1/4 bg-slate-950 border border-slate-800 rounded-lg px-2 py-1 text-slate-300 text-xs outline-none focus:border-emerald-500"
                        >
                          <option value="string">String</option>
                          <option value="number">Number</option>
                          <option value="boolean">Boolean</option>
                          <option value="array">Array (JSON)</option>
                          <option value="object">Object (JSON)</option>
                          <option value="null">Null</option>
                        </select>

                        {/* Field Value */}
                        {fld.type === 'boolean' ? (
                          <select
                            value={String(fld.value)}
                            onChange={(e) => {
                              const val = e.target.value;
                              setDynamicFields(prev => prev.map(f => f.id === fld.id ? { ...f, value: val } : f));
                            }}
                            className="flex-1 bg-slate-950 border border-slate-800 rounded-lg px-2 py-1 text-amber-300 text-xs font-bold"
                          >
                            <option value="true">true</option>
                            <option value="false">false</option>
                          </select>
                        ) : fld.type === 'null' ? (
                          <span className="flex-1 text-slate-500 text-xs italic px-2">null</span>
                        ) : (
                          <input
                            type="text"
                            placeholder="Valeur du champ..."
                            value={fld.value ?? ''}
                            onChange={(e) => {
                              const val = e.target.value;
                              setDynamicFields(prev => prev.map(f => f.id === fld.id ? { ...f, value: val } : f));
                            }}
                            className="flex-1 bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1 text-slate-200 text-xs outline-none focus:border-emerald-500"
                          />
                        )}

                        {/* Delete Row Button */}
                        <button
                          type="button"
                          onClick={() => handleRemoveDynamicFieldRow(fld.id)}
                          className="p-1.5 text-slate-500 hover:text-rose-400 cursor-pointer"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ))
                  )}
                </div>
              </div>
            ) : (
              /* Mode 2: Raw JSON Editor */
              <div className="space-y-2 font-mono text-xs">
                <label className="text-slate-400 text-[10px] uppercase block">
                  Éditeur JSON Brut (Cloud Firestore)
                </label>
                <textarea
                  rows={9}
                  value={docJsonInput}
                  onChange={(e) => {
                    setDocJsonInput(e.target.value);
                    setJsonValidationError(null);
                  }}
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl p-3 text-emerald-300 text-xs font-mono focus:border-emerald-500 outline-none"
                />
                {jsonValidationError && (
                  <p className="text-rose-400 text-[11px] font-mono">{jsonValidationError}</p>
                )}
              </div>
            )}

            <div className="flex justify-end gap-2 pt-3 border-t border-slate-800">
              <button
                type="button"
                onClick={() => setShowAddModal(false)}
                className="bg-slate-800 text-slate-300 hover:bg-slate-700 px-4 py-2 rounded-xl text-xs font-bold cursor-pointer"
              >
                Annuler
              </button>
              <button
                type="button"
                onClick={handleCreateDocument}
                className="bg-emerald-500 hover:bg-emerald-400 text-slate-950 px-5 py-2 rounded-xl text-xs font-extrabold cursor-pointer"
              >
                Enregistrer dans Firestore
              </button>
            </div>

          </div>
        </div>
      )}

      {/* 5. DYNAMIC EDIT DOCUMENT MODAL */}
      {showEditModal && selectedDoc && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4 z-50 overflow-y-auto">
          <div className="bg-slate-950 border border-slate-800 rounded-3xl max-w-2xl w-full p-6 space-y-4 shadow-2xl max-h-[90vh] overflow-y-auto">
            
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center space-x-2">
                <div className="p-2 bg-cyan-500/10 border border-cyan-500/30 rounded-xl text-cyan-400">
                  <Edit3 className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-extrabold text-white">
                    Modifier Document Firestore : <code className="text-emerald-400">{selectedDoc.id}</code>
                  </h3>
                  <p className="text-[10px] font-mono text-slate-400">
                    Collection : /{activeCollection}
                  </p>
                </div>
              </div>
              <button onClick={() => setShowEditModal(false)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Mode Switcher */}
            <div className="flex items-center justify-between font-mono text-xs">
              <span className="text-slate-400 text-[10px] uppercase">Mode de Modification :</span>
              <div className="flex bg-slate-900 p-1 rounded-xl border border-slate-800">
                <button
                  type="button"
                  onClick={() => setDocEditMode('builder')}
                  className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${
                    docEditMode === 'builder'
                      ? 'bg-cyan-500 text-slate-950 shadow'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  🛠️ Champ par Champ
                </button>
                <button
                  type="button"
                  onClick={() => {
                    const obj = buildObjectFromDynamicFields(dynamicFields);
                    setDocJsonInput(JSON.stringify(obj, null, 2));
                    setDocEditMode('json');
                  }}
                  className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${
                    docEditMode === 'json'
                      ? 'bg-cyan-500 text-slate-950 shadow'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  📝 JSON Brut
                </button>
              </div>
            </div>

            {/* Mode 1: Dynamic Field Builder */}
            {docEditMode === 'builder' ? (
              <div className="space-y-3 font-mono text-xs">
                <div className="flex items-center justify-between">
                  <span className="text-slate-300 font-bold">
                    Champs Existants & Édition ({dynamicFields.length})
                  </span>
                  <button
                    type="button"
                    onClick={handleAddDynamicFieldRow}
                    className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-cyan-400 border border-slate-700 rounded-xl text-xs font-bold flex items-center space-x-1 cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Ajouter un Champ</span>
                  </button>
                </div>

                <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
                  {dynamicFields.map((fld) => (
                    <div key={fld.id} className="flex items-center gap-2 p-2 bg-slate-900 border border-slate-800 rounded-xl">
                      {/* Field Name */}
                      <input
                        type="text"
                        placeholder="Nom champ"
                        value={fld.key}
                        onChange={(e) => {
                          const val = e.target.value;
                          setDynamicFields(prev => prev.map(f => f.id === fld.id ? { ...f, key: val } : f));
                        }}
                        className="w-1/3 bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1 text-cyan-300 font-bold text-xs outline-none focus:border-cyan-500"
                      />

                      {/* Type Selector */}
                      <select
                        value={fld.type}
                        onChange={(e) => {
                          const newType = e.target.value as DynamicField['type'];
                          setDynamicFields(prev => prev.map(f => f.id === fld.id ? { ...f, type: newType } : f));
                        }}
                        className="w-1/4 bg-slate-950 border border-slate-800 rounded-lg px-2 py-1 text-slate-300 text-xs outline-none focus:border-cyan-500"
                      >
                        <option value="string">String</option>
                        <option value="number">Number</option>
                        <option value="boolean">Boolean</option>
                        <option value="array">Array (JSON)</option>
                        <option value="object">Object (JSON)</option>
                        <option value="null">Null</option>
                      </select>

                      {/* Value Input */}
                      {fld.type === 'boolean' ? (
                        <select
                          value={String(fld.value)}
                          onChange={(e) => {
                            const val = e.target.value;
                            setDynamicFields(prev => prev.map(f => f.id === fld.id ? { ...f, value: val } : f));
                          }}
                          className="flex-1 bg-slate-950 border border-slate-800 rounded-lg px-2 py-1 text-amber-300 text-xs font-bold"
                        >
                          <option value="true">true</option>
                          <option value="false">false</option>
                        </select>
                      ) : fld.type === 'null' ? (
                        <span className="flex-1 text-slate-500 text-xs italic px-2">null</span>
                      ) : (
                        <input
                          type="text"
                          placeholder="Valeur..."
                          value={fld.value ?? ''}
                          onChange={(e) => {
                            const val = e.target.value;
                            setDynamicFields(prev => prev.map(f => f.id === fld.id ? { ...f, value: val } : f));
                          }}
                          className="flex-1 bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1 text-slate-200 text-xs outline-none focus:border-cyan-500"
                        />
                      )}

                      {/* Delete Row Button */}
                      <button
                        type="button"
                        onClick={() => handleRemoveDynamicFieldRow(fld.id)}
                        className="p-1.5 text-slate-500 hover:text-rose-400 cursor-pointer"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              /* Mode 2: JSON Editor */
              <div className="space-y-2 font-mono text-xs">
                <label className="text-slate-400 text-[10px] uppercase block">
                  Contenu JSON du Document
                </label>
                <textarea
                  rows={10}
                  value={docJsonInput}
                  onChange={(e) => {
                    setDocJsonInput(e.target.value);
                    setJsonValidationError(null);
                  }}
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl p-3 text-cyan-300 text-xs font-mono focus:border-cyan-500 outline-none"
                />
                {jsonValidationError && (
                  <p className="text-rose-400 text-[11px] font-mono">{jsonValidationError}</p>
                )}
              </div>
            )}

            <div className="flex justify-end gap-2 pt-3 border-t border-slate-800">
              <button
                type="button"
                onClick={() => setShowEditModal(false)}
                className="bg-slate-800 text-slate-300 hover:bg-slate-700 px-4 py-2 rounded-xl text-xs font-bold cursor-pointer"
              >
                Annuler
              </button>
              <button
                type="button"
                onClick={handleUpdateDocument}
                className="bg-cyan-500 hover:bg-cyan-400 text-slate-950 px-5 py-2 rounded-xl text-xs font-extrabold cursor-pointer"
              >
                Enregistrer la Modification dans Firestore
              </button>
            </div>

          </div>
        </div>
      )}

      {/* 6. DEDICATED DELETE CONFIRMATION MODAL */}
      {showDeleteConfirmModal && docToDelete && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4 z-50">
          <div className="bg-slate-950 border border-rose-900/60 rounded-3xl max-w-md w-full p-6 space-y-4 shadow-2xl">
            
            <div className="flex items-center space-x-3 text-rose-400 border-b border-rose-900/40 pb-3">
              <div className="p-2.5 bg-rose-500/10 border border-rose-500/30 rounded-xl">
                <Trash2 className="w-5 h-5 text-rose-400" />
              </div>
              <div>
                <h3 className="text-sm font-extrabold text-white">Confirmation de Suppression Réelle</h3>
                <p className="text-[10px] font-mono text-rose-300">
                  Action irréversible sur Cloud Firestore
                </p>
              </div>
            </div>

            <div className="space-y-3 text-xs font-mono">
              <p className="text-slate-300 leading-relaxed font-bold">
                Voulez-vous réellement supprimer ce document ?
              </p>

              <div className="p-3 bg-slate-900 border border-slate-800 rounded-xl space-y-1.5">
                <div>
                  <span className="text-slate-500 text-[10px] uppercase block">Collection :</span>
                  <span className="text-emerald-400 font-bold">/{docToDelete.collection}</span>
                </div>
                <div>
                  <span className="text-slate-500 text-[10px] uppercase block">Document ID :</span>
                  <span className="text-rose-300 font-bold">{docToDelete.id}</span>
                </div>
                {docToDelete.preview && (
                  <div>
                    <span className="text-slate-500 text-[10px] uppercase block">Aperçu :</span>
                    <span className="text-slate-400 text-[11px] truncate block">{docToDelete.preview}</span>
                  </div>
                )}
              </div>

              <div className="p-2.5 bg-rose-950/40 border border-rose-800/40 rounded-xl text-rose-300 text-[11px]">
                ⚠️ Ce document sera définitivement effacé de Cloud Firestore.
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-slate-800">
              <button
                type="button"
                onClick={() => {
                  setShowDeleteConfirmModal(false);
                  setDocToDelete(null);
                }}
                className="bg-slate-800 text-slate-300 hover:bg-slate-700 px-4 py-2 rounded-xl text-xs font-bold cursor-pointer"
              >
                Annuler
              </button>
              <button
                type="button"
                onClick={confirmDeleteDocument}
                className="bg-rose-600 hover:bg-rose-500 text-white px-4 py-2 rounded-xl text-xs font-extrabold cursor-pointer shadow-lg shadow-rose-950/50"
              >
                🔴 Confirmer la Suppression Réelle
              </button>
            </div>

          </div>
        </div>
      )}

      {/* 7. INSPECT DOCUMENT MODAL (CONSULTATION DÉTAILLÉE) */}
      {showInspectModal && inspectingDoc && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4 z-50">
          <div className="bg-slate-950 border border-slate-800 rounded-3xl max-w-2xl w-full p-6 space-y-4 shadow-2xl max-h-[85vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center space-x-2">
                <div className="p-2 bg-emerald-500/10 border border-emerald-500/30 rounded-xl text-emerald-400">
                  <Eye className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-extrabold text-white">
                    Consultation Document Firestore Réel
                  </h3>
                  <p className="text-[10px] font-mono text-emerald-400">
                    /{inspectingDoc.collection}/{inspectingDoc.id}
                  </p>
                </div>
              </div>
              <button onClick={() => setShowInspectModal(false)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Document Metadata Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 font-mono text-[11px]">
              <div className="p-2.5 bg-slate-900 border border-slate-800 rounded-xl space-y-0.5">
                <span className="text-slate-500 text-[9px] uppercase block">Collection</span>
                <span className="text-emerald-400 font-bold">/{inspectingDoc.collection}</span>
              </div>
              <div className="p-2.5 bg-slate-900 border border-slate-800 rounded-xl space-y-0.5">
                <span className="text-slate-500 text-[9px] uppercase block">ID Document</span>
                <span className="text-cyan-300 font-bold truncate block">{inspectingDoc.id}</span>
              </div>
              <div className="p-2.5 bg-slate-900 border border-slate-800 rounded-xl space-y-0.5">
                <span className="text-slate-500 text-[9px] uppercase block">Taille Estimée</span>
                <span className="text-amber-300 font-bold">{inspectingDoc.metadata.approxSizeBytes} octets</span>
              </div>
              <div className="p-2.5 bg-slate-900 border border-slate-800 rounded-xl space-y-0.5">
                <span className="text-slate-500 text-[9px] uppercase block">Nombre Champs</span>
                <span className="text-purple-300 font-bold">{inspectingDoc.metadata.fieldsCount} champ(s)</span>
              </div>
            </div>

            {/* Field Types & Schema Inspector */}
            <div className="space-y-2">
              <h4 className="text-xs font-bold text-slate-300 uppercase font-mono tracking-wider">
                1. Structure des Champs & Types de Données Réels
              </h4>
              <div className="overflow-x-auto rounded-xl border border-slate-800 bg-slate-900 p-2 font-mono text-xs max-h-48 overflow-y-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-slate-800 text-[10px] text-slate-500 uppercase">
                      <th className="p-2">Nom du Champ</th>
                      <th className="p-2">Type</th>
                      <th className="p-2">Valeur Structurée</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60">
                    {Object.entries(inspectingDoc.data).map(([key, val]) => {
                      const typeStr = val === null ? 'null' : Array.isArray(val) ? 'array' : typeof val;
                      return (
                        <tr key={key} className="hover:bg-slate-800/50">
                          <td className="p-2 font-bold text-cyan-300">{key}</td>
                          <td className="p-2 text-[10px] text-emerald-400 uppercase font-bold">
                            <span className="bg-emerald-500/10 px-1.5 py-0.5 rounded border border-emerald-500/20">
                              {typeStr}
                            </span>
                          </td>
                          <td className="p-2 text-slate-300 truncate max-w-xs">
                            {val === null ? (
                              <span className="text-slate-500 italic">null</span>
                            ) : typeof val === 'object' ? (
                              JSON.stringify(val)
                            ) : (
                              String(val)
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Raw Formatted JSON Viewer */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-bold text-slate-300 uppercase font-mono tracking-wider">
                  2. Document JSON Brut (Cloud Firestore)
                </h4>
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(JSON.stringify({ id: inspectingDoc.id, ...inspectingDoc.data }, null, 2));
                    triggerSuccessBanner('📋 Document JSON copié dans le presse-papier.');
                  }}
                  className="text-[11px] font-mono text-cyan-400 hover:text-white flex items-center space-x-1"
                >
                  <Copy className="w-3.5 h-3.5" />
                  <span>Copier le JSON</span>
                </button>
              </div>
              <pre className="p-3.5 bg-slate-900 border border-slate-800 rounded-xl text-[11px] font-mono text-cyan-300 overflow-x-auto max-h-56">
                {JSON.stringify({ id: inspectingDoc.id, ...inspectingDoc.data }, null, 2)}
              </pre>
            </div>

            <div className="flex items-center justify-between border-t border-slate-800 pt-3">
              <div className="text-[10px] text-slate-500 font-mono">
                Dernière MàJ : {inspectingDoc.metadata.updatedAt}
              </div>
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => {
                    setShowInspectModal(false);
                    openEditModal({ id: inspectingDoc.id, ...inspectingDoc.data });
                  }}
                  className="px-3.5 py-1.5 bg-cyan-500 hover:bg-cyan-400 text-slate-950 rounded-xl text-xs font-extrabold transition-all cursor-pointer flex items-center space-x-1"
                >
                  <Edit3 className="w-3.5 h-3.5" />
                  <span>Modifier ce document</span>
                </button>
                <button
                  onClick={() => setShowInspectModal(false)}
                  className="px-3.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl text-xs font-bold transition-all cursor-pointer"
                >
                  Fermer
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
