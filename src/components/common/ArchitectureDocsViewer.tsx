import React, { useState, useEffect } from 'react';
import {
  Layers,
  Server,
  Shield,
  ShieldCheck,
  Brain,
  CheckCircle2,
  Lock,
  ArrowRight,
  Database,
  Smartphone,
  Cpu,
  FileCode2,
  Share2,
  Activity,
  Zap,
  Globe,
  Building2,
  Bus,
  Hotel,
  Tv,
  Eye,
  CreditCard,
  Bell,
  FileText,
  Key,
  Users,
  HardDrive,
  RefreshCw,
  Send,
  Radio,
  Play,
  RotateCcw,
  AlertTriangle,
  Clock,
  Sliders,
  ChevronRight,
  Check,
  ShieldAlert,
  Wrench,
  BarChart2,
  SlidersHorizontal,
  FolderGit2,
  BookOpen,
  MapPin,
  Printer,
  Terminal,
  ExternalLink,
  Ticket,
  Sparkles
} from 'lucide-react';
import { DomainEventBus, IDomainEvent, DomainEventType } from '../../core/domain/events/DomainEvents';
import { EventSubscriptionsInitializer } from '../../core/application/eventbus/EventSubscriptions';
import { WorkflowEngine, IWorkflowInstance, WorkflowType } from '../../core/domain/workflows/WorkflowEngine';
import { GovernanceEngine, ISystemTelemetry, IMaintenanceState, ISecurityAlert, ISystemBackup, IGlobalConfig } from '../../core/domain/governance/GovernanceEngine';
import { EcosystemEngine, IPaymentConnectorInfo, IMapProviderInfo, INotificationChannelInfo, IPartnerInfo, IServiceRegistryItem, IPublicApiEndpoint } from '../../core/domain/ecosystem/EcosystemEngine';
import { isFirebaseConfigured, seedInitialFirestoreData, db } from '../../lib/firebase';
import { collection, onSnapshot, getDocs, addDoc, doc, setDoc } from 'firebase/firestore';
import { FirestoreConsolePanel } from './FirestoreConsolePanel';
import { ControlCenterGovernancePanel } from './ControlCenterGovernancePanel';
import { SgbdConnectionManagerPanel } from './SgbdConnectionManagerPanel';

export const ArchitectureDocsViewer: React.FC = () => {
  const [mainView, setMainView] = useState<'bdd_spec' | 'firebase_spec' | 'roadmap_spec' | 'eventbus_spec' | 'workflows_spec' | 'governance_spec' | 'ecosystem_spec' | 'hexagonal'>('firebase_spec');
  const [selectedLayer, setSelectedLayer] = useState<'domain' | 'application' | 'infrastructure' | 'presentation'>('domain');
  const [selectedBddPoint, setSelectedBddPoint] = useState<number>(1);
  const [selectedProvider, setSelectedProvider] = useState<'firestore' | 'postgres' | 'mysql' | 'supabase' | 'cloudsql'>('postgres');

  // Event Bus State & History
  const [eventLogs, setEventLogs] = useState<IDomainEvent[]>([]);
  const [selectedEventType, setSelectedEventType] = useState<DomainEventType>('AgenceCreated');
  const [simulatedTenant, setSimulatedTenant] = useState<string>('agency-utb-01');

  // Workflow Engine State
  const [workflows, setWorkflows] = useState<IWorkflowInstance[]>([]);
  const [selectedWfType, setSelectedWfType] = useState<WorkflowType>('WORKFLOW_1_TRANSPORT_BOOKING');
  const [simulateFailureAtStep, setSimulateFailureAtStep] = useState<number>(0);
  const [selectedWfDetail, setSelectedWfDetail] = useState<IWorkflowInstance | null>(null);
  const [supervisionRole, setSupervisionRole] = useState<'SUPERADMIN' | 'ADMIN_AGENCY' | 'ADMIN_HOTEL'>('SUPERADMIN');

  // Governance Volume 8 State
  const [telemetry, setTelemetry] = useState<ISystemTelemetry>(GovernanceEngine.getInstance().getTelemetry());
  const [maintenanceState, setMaintenanceState] = useState<IMaintenanceState>(GovernanceEngine.getInstance().getMaintenanceState());
  const [alertsList, setAlertsList] = useState<ISecurityAlert[]>(GovernanceEngine.getInstance().getAlerts());
  const [backupsList, setBackupsList] = useState<ISystemBackup[]>(GovernanceEngine.getInstance().getBackups());
  const [globalConfig, setGlobalConfig] = useState<IGlobalConfig>(GovernanceEngine.getInstance().getConfig());
  const [governanceSubTab, setGovernanceSubTab] = useState<'command_center' | 'telemetry' | 'security' | 'maintenance' | 'backups' | 'config' | 'alerts'>('command_center');

  // Ecosystem Volume 9 State
  const [paymentConnectors, setPaymentConnectors] = useState<IPaymentConnectorInfo[]>(EcosystemEngine.getInstance().getPaymentConnectors());
  const [mapProviders, setMapProviders] = useState<IMapProviderInfo[]>(EcosystemEngine.getInstance().getMapProviders());
  const [notificationChannels, setNotificationChannels] = useState<INotificationChannelInfo[]>(EcosystemEngine.getInstance().getNotificationChannels());
  const [partners, setPartners] = useState<IPartnerInfo[]>(EcosystemEngine.getInstance().getPartners());
  const [serviceCatalog, setServiceCatalog] = useState<IServiceRegistryItem[]>(EcosystemEngine.getInstance().getServiceCatalog());
  const [publicApiEndpoints, setPublicApiEndpoints] = useState<IPublicApiEndpoint[]>(EcosystemEngine.getInstance().getPublicApiEndpoints());
  const [ecosystemSubTab, setEcosystemSubTab] = useState<'connectors' | 'maps' | 'notifications' | 'documents' | 'partners' | 'public_api' | 'catalog'>('connectors');
  const [selectedApiId, setSelectedApiId] = useState<string>('api-01');
  const [apiExecutionResult, setApiExecutionResult] = useState<{ status: number; durationMs: number; body: any } | null>(null);
  const [documentTypePreview, setDocumentTypePreview] = useState<'TICKET' | 'HOTEL_PASS' | 'FACTURE'>('TICKET');
  const [showAddPartnerModal, setShowAddPartnerModal] = useState<boolean>(false);
  const [newPartnerForm, setNewPartnerForm] = useState<{ name: string; category: 'TRANSPORT_AGENCY' | 'HOTEL_CHAIN' | 'IPTV_PROVIDER' | 'TECH_VENDOR' | 'BANK_FINTECH'; slaTargetPercent: number; monthlyVolumeFCFA: number }>({
    name: '',
    category: 'TRANSPORT_AGENCY',
    slaTargetPercent: 99.9,
    monthlyVolumeFCFA: 5000000
  });

  // Firestore Collections Explorer State
  const firestoreCollections = [
    { name: 'users', label: 'Utilisateurs & RBAC', icon: Users },
    { name: 'transport_trips', label: 'Trajets Autocars', icon: Bus },
    { name: 'reservations', label: 'Réservations & QR Codes', icon: Ticket },
    { name: 'hotels', label: 'Hôtels & Chambres', icon: Hotel },
    { name: 'partner_registry', label: 'Partenaires FinTech/Transport', icon: Building2 },
    { name: 'audit_logs', label: 'Audit & Sécurité', icon: ShieldCheck },
    { name: 'iptv_contents', label: 'Contenus IPTV & VOD', icon: Tv },
    { name: 'vip_subscriptions', label: 'Pass VIP Privilège', icon: Sparkles },
    { name: 'scan_validations', label: 'Validations QR Code', icon: CheckCircle2 }
  ];
  const [activeCollection, setActiveCollection] = useState<string>('users');
  const [firestoreDocsMap, setFirestoreDocsMap] = useState<Record<string, any[]>>({});
  const [selectedDocDetails, setSelectedDocDetails] = useState<{ id: string; data: any } | null>(null);
  const [isSeedingFirestore, setIsSeedingFirestore] = useState<boolean>(false);

  useEffect(() => {
    EventSubscriptionsInitializer.initialize();
    setEventLogs(DomainEventBus.getInstance().getHistory());
    seedInitialFirestoreData();

    // Setup Firestore Live Listeners for all 9 collections
    const unsubs: (() => void)[] = [];
    if (isFirebaseConfigured && db) {
      firestoreCollections.forEach(col => {
        try {
          const unsub = onSnapshot(collection(db, col.name), (snapshot) => {
            const docsList = snapshot.docs.map(docSnap => ({
              id: docSnap.id,
              ...docSnap.data()
            }));
            setFirestoreDocsMap(prev => ({
              ...prev,
              [col.name]: docsList
            }));
          }, (err) => {
            console.warn(`[Firestore] Snapshot error on ${col.name}:`, err);
          });
          unsubs.push(unsub);
        } catch (e) {
          console.warn(`[Firestore] Error subscribing to ${col.name}:`, e);
        }
      });
    }

    const unsubWf = WorkflowEngine.getInstance().subscribe((list) => {
      setWorkflows(list);
    });

    const unsubGov = GovernanceEngine.getInstance().subscribe(() => {
      setTelemetry(GovernanceEngine.getInstance().getTelemetry());
      setMaintenanceState(GovernanceEngine.getInstance().getMaintenanceState());
      setAlertsList(GovernanceEngine.getInstance().getAlerts());
      setBackupsList(GovernanceEngine.getInstance().getBackups());
      setGlobalConfig(GovernanceEngine.getInstance().getConfig());
    });

    const unsubEco = EcosystemEngine.getInstance().subscribe(() => {
      setPaymentConnectors(EcosystemEngine.getInstance().getPaymentConnectors());
      setMapProviders(EcosystemEngine.getInstance().getMapProviders());
      setNotificationChannels(EcosystemEngine.getInstance().getNotificationChannels());
      setPartners(EcosystemEngine.getInstance().getPartners());
      setServiceCatalog(EcosystemEngine.getInstance().getServiceCatalog());
      setPublicApiEndpoints(EcosystemEngine.getInstance().getPublicApiEndpoints());
    });

    return () => {
      unsubs.forEach(u => u());
      unsubWf();
      unsubGov();
      unsubEco();
    };
  }, []);

  const handleSeedFirestore = async (force: boolean = true) => {
    setIsSeedingFirestore(true);
    try {
      await seedInitialFirestoreData(force);
      alert('✅ Les 9 collections Firestore de la base studio-2569273626-e2093 ont été populées avec succès !');
    } catch (err: any) {
      alert(`⚠️ Erreur d'initialisation Firestore: ${err?.message || err}`);
    } finally {
      setIsSeedingFirestore(false);
    }
  };

  const handleSimulateEvent = async () => {
    let emitterModule: IDomainEvent['emitterModule'] = 'TRANSPORT';
    let payload: any = {};

    switch (selectedEventType) {
      case 'AgenceCreated':
        emitterModule = 'TRANSPORT';
        payload = { agencyId: simulatedTenant, agencyName: 'UTB Express', adminEmail: 'admin.utb@express.ci' };
        break;
      case 'HotelCreated':
        emitterModule = 'HOTEL';
        payload = { hotelId: 'hotel-ivoire-01', hotelName: 'Hôtel Ivoire Abidjan', roomsCount: 150 };
        break;
      case 'TripCreated':
        emitterModule = 'TRANSPORT';
        payload = { tripId: 'trip-99', line: 'Abidjan -> Yamoussoukro', departureTime: '08:00' };
        break;
      case 'ReservationConfirmed':
        emitterModule = 'TRANSPORT';
        payload = { ticketNumber: `TIX-${Date.now()}`, passenger: 'M. Koffi', priceFcfa: 7500 };
        break;
      case 'PaymentCompleted':
        emitterModule = 'PAYMENT';
        payload = { transactionId: `TX-WAVE-${Date.now()}`, amount: 7500, method: 'WAVE' };
        break;
      case 'CameraAlertDetected':
        emitterModule = 'VISION';
        payload = { cameraId: 'CAM-GARE-ADJAME-01', alertType: 'Somnolence Chauffeur', severity: 'CRITICAL' };
        break;
      case 'IPTVSubscriptionActivated':
        emitterModule = 'IPTV';
        payload = { bouquet: 'BOUQUET_VIP', roomNumber: '104', durationDays: 30 };
        break;
      default:
        emitterModule = 'USERS';
        payload = { userId: `user-${Date.now()}`, action: selectedEventType };
    }

    await DomainEventBus.getInstance().publish({
      type: selectedEventType,
      emitterModule,
      tenantId: simulatedTenant,
      payload
    });

    setEventLogs([...DomainEventBus.getInstance().getHistory()]);
  };

  const bddPoints = [
    {
      id: 1,
      title: "1. Séparation stricte des logiques métiers",
      icon: Layers,
      color: "text-orange-400",
      bg: "bg-orange-500/10 border-orange-500/30",
      desc: "Chaque domaine fonctionnel dispose de ses propres modèles de données, services, règles métier et sécurités isolées. Aucun accès direct inter-modules.",
      details: ["12 Domaines isolés : Auth, Users, RBAC, Transport, Hôtellerie, Vision, IPTV, Paiements, Notifications, AI Core, Audit, Settings.", "Communication uniquement par interfaces/ports définis.", "Aucune dépendance circulaire."]
    },
    {
      id: 2,
      title: "2. Architecture modulaire",
      icon: Cpu,
      color: "text-purple-400",
      bg: "bg-purple-500/10 border-purple-500/30",
      desc: "Chaque module possède ses propres modèles, services, règles, validations, contrôleurs et paramètres.",
      details: ["Modèles & Entités dédiés", "Validateurs de schéma indépendants", "Ajout/suppression de module sans impact transversal"]
    },
    {
      id: 3,
      title: "3. Base de données Multi-Tenant",
      icon: Building2,
      color: "text-emerald-400",
      bg: "bg-emerald-500/10 border-emerald-500/30",
      desc: "Isolation stricte des agences (`agencyId`) et hôtels (`hotelId`). Les utilisateurs n'accèdent qu'à leur périmètre. Le Super Admin conserve la vision globale.",
      details: ["Filtrage automatique par tenant", "Isolation logique ou physique selon l'échelle", "Gouvernance globale pour le Super Admin"]
    },
    {
      id: 4,
      title: "4. Couche d'abstraction des données (DAL / Repository)",
      icon: Database,
      color: "text-blue-400",
      bg: "bg-blue-500/10 border-blue-500/30",
      desc: "Les modules métiers ne communiquent jamais directement avec la BDD. La couche Repository gère lectures, écritures, transactions et recherches.",
      details: ["Pattern Repository / Data Access Layer", "Abstrait totalement le SGBD", "Changement de moteur sans impact sur les Use Cases"]
    },
    {
      id: 5,
      title: "5. Indépendance vis-à-vis du fournisseur (SGBD Agnostic)",
      icon: Globe,
      color: "text-cyan-400",
      bg: "bg-cyan-500/10 border-cyan-500/30",
      desc: "Compatibilité totale avec Firebase, PostgreSQL, MySQL, MariaDB, Supabase, Cloud SQL, MongoDB, Azure SQL et Amazon RDS.",
      details: ["Aucune adhérence à une API propriétaire", "Adaptateurs interchangeables en 1 ligne de config", "Procédures d'export / import universelles"]
    },
    {
      id: 6,
      title: "6. Gestion des Utilisateurs & Rôles (RBAC Hiérarchique)",
      icon: Shield,
      color: "text-amber-400",
      bg: "bg-amber-500/10 border-amber-500/30",
      desc: "Matrice RBAC stricte : Super Admin, Admin Agence, Admin Hôtel, Agent de comptoir, Chauffeur, Voyageur, Technicien, Support, Partenaire.",
      details: ["Principe du moindre privilège", "Hiérarchie de rôles claire", "Contrôle d'accès granulaire évalué par UseCase"]
    },
    {
      id: 7,
      title: "7. Module Transport (Verrouillage Transactionnel)",
      icon: Bus,
      color: "text-orange-400",
      bg: "bg-orange-500/10 border-orange-500/30",
      desc: "Structures pour agences, gares, véhicules, chauffeurs, trajets, horaires, sièges, billets et paiements. Verrouillage transactionnel des sièges.",
      details: ["Réservation de siège ACID anti-surréservation", "Billets QR signés ED25519", "Historique d'exploitation complet"]
    },
    {
      id: 8,
      title: "8. Module Hôtellerie & Auto-Provisioning Transactionnel",
      icon: Hotel,
      color: "text-purple-400",
      bg: "bg-purple-500/10 border-purple-500/30",
      desc: "Structures hôtels, chambres, réservations, check-in/out. Auto-provisioning immédiat (Hôtel + Compte Admin + Rôle RBAC + Activation en 1 transaction).",
      details: ["Creation d'établissement en transaction atomique", "Auto-génération du compte Admin Hôtel/Agence", "Synchronisation immédiate des permissions"]
    },
    {
      id: 9,
      title: "9. Module Vidéosurveillance (Vision IA)",
      icon: Eye,
      color: "text-red-400",
      bg: "bg-red-500/10 border-red-500/30",
      desc: "Structures caméras, événements et alertes IA. Les vidéos lourdes restent sur stockage blob sécurisé, la BDD conserve les URLs signées.",
      details: ["Stream RTSP / ONVIF référencé", "Alertes de fatigue et intrusion en temps réel", "Chiffrement des URLs médias"]
    },
    {
      id: 10,
      title: "10. Module IPTV",
      icon: Tv,
      color: "text-teal-400",
      bg: "bg-teal-500/10 border-teal-500/30",
      desc: "Chaînes, bouquets, EPG, VOD, favoris et historique. Référencement dynamique des flux HLS/DASH.",
      details: ["Guide EPG dynamique", "Gestion des bouquets régionaux", "Historique de lecture hors-ligne"]
    },
    {
      id: 11,
      title: "11. Moteur de Paiement Unique Partagé",
      icon: CreditCard,
      color: "text-emerald-400",
      bg: "bg-emerald-500/10 border-emerald-500/30",
      desc: "Hub de paiement unifié gérant Transport, Hôtellerie, IPTV et nouveaux services avec traçabilité intégrale.",
      details: ["Wave, Mobile Money (MTN, Orange, Moov), Carte Bancaire", "Historique immuable", "Rapprochement financier automatique"]
    },
    {
      id: 12,
      title: "12. Journalisation & Audit Immuable",
      icon: FileText,
      color: "text-blue-400",
      bg: "bg-blue-500/10 border-blue-500/30",
      desc: "Enregistrement horodaté et attribué de toutes les connexions, créations, modifications, réservations et paiements.",
      details: ["Horodatage certifié ISO", "Traçabilité par ID utilisateur et rôle", "Inviolabilité du journal d'audit"]
    },
    {
      id: 13,
      title: "13. Sécurité By-Design",
      icon: Lock,
      color: "text-indigo-400",
      bg: "bg-indigo-500/10 border-indigo-500/30",
      desc: "Authentification forte, chiffrement des secrets, validation client/serveur, rate-limiting et sauvegardes automatiques.",
      details: ["Sanitization systématique des données", "Protection contre Injections & CSRF", "Restauration rapide en cas d'incident"]
    },
    {
      id: 14,
      title: "14. Performances & Haute Disponibilité",
      icon: Zap,
      color: "text-yellow-400",
      bg: "bg-yellow-500/10 border-yellow-500/30",
      desc: "Optimisé pour des milliers d'utilisateurs simultanés, indexation stratégique, pagination et synchronisation temps réel sélective.",
      details: ["Temps de réponse < 50ms sur requêtes indexées", "Pagination cursor-based", "WebSockets ciblés sur événements prioritaires"]
    },
    {
      id: 15,
      title: "15. Évolutivité & Migration Facilitée",
      icon: RefreshCw,
      color: "text-slate-300",
      bg: "bg-slate-500/10 border-slate-500/30",
      desc: "Nouveaux modules sans régression. Dictionnaire de données documenté, scripts d'import/export et migrations testées.",
      details: ["Structure documentée et typée TypeScript", "Conventions de nommage unifiées", "Migration sans coupure de service"]
    }
  ];

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 space-y-6 shadow-2xl">
      
      {/* Top Main Navigation Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 border-b border-slate-800 pb-5">
        <div>
          <div className="flex items-center space-x-2 mb-1">
            <span className="px-2.5 py-0.5 rounded-full bg-orange-500/20 text-orange-400 border border-orange-500/30 text-[10px] font-extrabold uppercase tracking-wider">
              Spécification Nationale
            </span>
            <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-[10px] font-extrabold">
              Socle Strategique BDD
            </span>
          </div>
          <h2 className="text-xl font-black text-white tracking-tight flex items-center space-x-2">
            <Database className="w-5 h-5 text-orange-400" />
            <span>Architecture & Cahier de Recommandations BDD</span>
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Architecture modulaire, multi-tenant, découplée des fournisseurs et sécurisée pour la plateforme IVOIReXpress.
          </p>
        </div>

        {/* Primary View Switcher */}
        <div className="flex flex-wrap items-center bg-slate-950 p-1 rounded-2xl border border-slate-800 gap-1">
          <button
            onClick={() => setMainView('bdd_spec')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center space-x-1.5 ${
              mainView === 'bdd_spec'
                ? 'bg-orange-500 text-slate-950 shadow-lg'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Database className="w-3.5 h-3.5" />
            <span>15 Recommandations BDD</span>
          </button>

          <button
            onClick={() => setMainView('firebase_spec')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center space-x-1.5 ${
              mainView === 'firebase_spec'
                ? 'bg-amber-500 text-slate-950 shadow-lg'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Zap className="w-3.5 h-3.5" />
            <span>Intégration Firebase (BaaS)</span>
          </button>

          <button
            onClick={() => setMainView('roadmap_spec')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center space-x-1.5 ${
              mainView === 'roadmap_spec'
                ? 'bg-purple-500 text-slate-950 shadow-lg'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Activity className="w-3.5 h-3.5" />
            <span>Feuille de Route (6 Phases)</span>
          </button>

          <button
            onClick={() => setMainView('eventbus_spec')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center space-x-1.5 ${
              mainView === 'eventbus_spec'
                ? 'bg-cyan-500 text-slate-950 shadow-lg'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Radio className="w-3.5 h-3.5" />
            <span>Bus d'Événements Inter-Modules</span>
          </button>

          <button
            onClick={() => setMainView('workflows_spec')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center space-x-1.5 ${
              mainView === 'workflows_spec'
                ? 'bg-rose-500 text-slate-950 shadow-lg'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Cpu className="w-3.5 h-3.5" />
            <span>Moteur de Workflows (Volume 7)</span>
          </button>

          <button
            onClick={() => setMainView('governance_spec')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center space-x-1.5 ${
              mainView === 'governance_spec'
                ? 'bg-purple-500 text-slate-950 shadow-lg'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <ShieldAlert className="w-3.5 h-3.5" />
            <span>Gouvernance & Maintenance (Volume 8)</span>
          </button>

          <button
            onClick={() => setMainView('ecosystem_spec')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center space-x-1.5 ${
              mainView === 'ecosystem_spec'
                ? 'bg-blue-500 text-slate-950 shadow-lg'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Share2 className="w-3.5 h-3.5" />
            <span>Écosystème & Intégration (Volume 9)</span>
          </button>

          <button
            onClick={() => setMainView('hexagonal')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center space-x-1.5 ${
              mainView === 'hexagonal'
                ? 'bg-emerald-500 text-slate-950 shadow-lg'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span>Architecture Hexagonale</span>
          </button>
        </div>
      </div>

      {/* VIEW 1: CAHIER DE RECOMMANDATIONS BDD (15 PRINCIPES) & CENTRE DE GESTION SGBD */}
      {mainView === 'bdd_spec' && (
        <div className="space-y-6">
          
          {/* Centre de Gestion des Connexions SGBD Opérationnel */}
          <SgbdConnectionManagerPanel />

          {/* 15 Principles Grid */}
          <div className="space-y-3">
            <h3 className="text-sm font-extrabold text-white flex items-center space-x-2">
              <CheckCircle2 className="w-4 h-4 text-orange-400" />
              <span>Les 15 Directives du Cahier de Recommandations</span>
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              {bddPoints.map(point => {
                const Icon = point.icon;
                const isSelected = selectedBddPoint === point.id;
                return (
                  <button
                    key={point.id}
                    onClick={() => setSelectedBddPoint(point.id)}
                    className={`p-4 rounded-2xl border text-left transition-all ${
                      isSelected
                        ? `${point.bg} ring-2 ring-orange-500/30 text-white shadow-xl`
                        : 'bg-slate-950 border-slate-800 text-slate-300 hover:border-slate-700 hover:bg-slate-900/60'
                    }`}
                  >
                    <div className="flex items-center space-x-2 mb-2">
                      <div className={`p-2 rounded-xl bg-slate-900 border border-slate-800 ${point.color}`}>
                        <Icon className="w-4 h-4" />
                      </div>
                      <span className="text-xs font-extrabold truncate">{point.title}</span>
                    </div>

                    <p className="text-[11px] text-slate-400 leading-relaxed line-clamp-2">
                      {point.desc}
                    </p>

                    {isSelected && (
                      <div className="mt-3 pt-3 border-t border-slate-800/80 space-y-1.5 text-[11px]">
                        <div className="text-[10px] font-bold uppercase tracking-wider text-orange-400">Points Clés :</div>
                        <ul className="space-y-1 text-slate-300">
                          {point.details.map((dt, idx) => (
                            <li key={idx} className="flex items-start space-x-1.5">
                              <span className="text-orange-400 font-bold">•</span>
                              <span>{dt}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Transactional Auto-Provisioning Focus (Point 8) */}
          <div className="p-4 bg-slate-950 border border-slate-800 rounded-2xl space-y-3">
            <h4 className="text-xs font-extrabold text-purple-400 uppercase tracking-wider flex items-center space-x-2">
              <Hotel className="w-4 h-4" />
              <span>Démonstrateur Auto-Provisioning Transactionnel (Point 8)</span>
            </h4>

            <p className="text-xs text-slate-300 leading-relaxed">
              Lorsqu'un Super Admin crée une nouvelle Agence ou un nouvel Hôtel, le système exécute 6 étapes indissociables en une seule transaction atomique :
            </p>

            <div className="grid grid-cols-2 sm:grid-cols-6 gap-2 text-center text-[10px] font-bold">
              <div className="p-2 rounded-xl bg-slate-900 border border-slate-800 text-slate-300">
                1. Création Fiche
              </div>
              <div className="p-2 rounded-xl bg-slate-900 border border-slate-800 text-purple-300">
                2. Gen. Compte Admin
              </div>
              <div className="p-2 rounded-xl bg-slate-900 border border-slate-800 text-amber-300">
                3. Attribution RBAC
              </div>
              <div className="p-2 rounded-xl bg-slate-900 border border-slate-800 text-blue-300">
                4. Rattachement Tenant
              </div>
              <div className="p-2 rounded-xl bg-slate-900 border border-slate-800 text-cyan-300">
                5. Config Défaut
              </div>
              <div className="p-2 rounded-xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-300">
                6. Activation Directe
              </div>
            </div>
          </div>

        </div>
      )}

      {/* VIEW 2: RECOMMANDATIONS INTÉGRATION FIREBASE (BAAS DÉCOUPLÉ & EXPLORATEUR FIRESTORE) */}
      {mainView === 'firebase_spec' && (
        <div className="space-y-6">

          <FirestoreConsolePanel />

          {/* Intro Card */}
          <div className="p-4 bg-amber-500/10 border border-amber-500/30 rounded-2xl space-y-2">
            <div className="flex items-center space-x-2 text-amber-400 font-extrabold text-xs uppercase tracking-wider">
              <Zap className="w-4 h-4" />
              <span>Principes Directeurs d'Intégration Firebase</span>
            </div>
            <p className="text-xs text-slate-300 leading-relaxed">
              Firebase est intégré en tant que **Backend-as-a-Service (BaaS) interchangeable**. Aucun composant UI ni UseCase métier n'appelle directement les SDKs Firebase. Toute communication passe par la couche d'accès aux données (DAL / Repository Adapter).
            </p>
          </div>

          {/* 6 Core Firebase Directives */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            
            <div className="p-4 bg-slate-950 border border-slate-800 rounded-2xl space-y-2">
              <div className="flex items-center space-x-2 text-orange-400 font-bold text-xs">
                <Layers className="w-4 h-4" />
                <span>1. Autonomie Strictes des 12 Modules</span>
              </div>
              <p className="text-[11px] text-slate-400 leading-relaxed">
                Auth, Users, RBAC, Transport, Hôtellerie, Vision, IPTV, Paiements, FCM, AI Core, Audit et Settings communiquent avec Firebase uniquement via leurs interfaces Ports respectives.
              </p>
            </div>

            <div className="p-4 bg-slate-950 border border-slate-800 rounded-2xl space-y-2">
              <div className="flex items-center space-x-2 text-emerald-400 font-bold text-xs">
                <Server className="w-4 h-4" />
                <span>2. Adaptateur Firebase Unique (`FirebaseAdapters.ts`)</span>
              </div>
              <p className="text-[11px] text-slate-400 leading-relaxed">
                Centralise Authentication, Firestore, Storage, Cloud Functions et FCM. Remplaçable par PostgreSQL ou Supabase sans modifier la logique métier.
              </p>
            </div>

            <div className="p-4 bg-slate-950 border border-slate-800 rounded-2xl space-y-2">
              <div className="flex items-center space-x-2 text-purple-400 font-bold text-xs">
                <Building2 className="w-4 h-4" />
                <span>3. Répartition Stratégique des Services</span>
              </div>
              <ul className="text-[11px] text-slate-400 space-y-1 font-mono">
                <li>• Auth : Comptes & Custom Claims (RBAC)</li>
                <li>• Firestore : Collections Multi-tenant (`agencyId`, `hotelId`)</li>
                <li>• Storage : Médias & Photos (Vidéo sur Blob dédié)</li>
              </ul>
            </div>

            <div className="p-4 bg-slate-950 border border-slate-800 rounded-2xl space-y-2">
              <div className="flex items-center space-x-2 text-blue-400 font-bold text-xs">
                <Cpu className="w-4 h-4" />
                <span>4. Cloud Functions & Triggers Auto-Provisioning</span>
              </div>
              <p className="text-[11px] text-slate-400 leading-relaxed">
                Exécute les transactions automatiques d'auto-provisioning d'Agences et d'Hôtels avec attribution immédiate des rôles RBAC en 1 transaction atomique.
              </p>
            </div>

            <div className="p-4 bg-slate-950 border border-slate-800 rounded-2xl space-y-2">
              <div className="flex items-center space-x-2 text-indigo-400 font-bold text-xs">
                <Shield className="w-4 h-4" />
                <span>5. Sécurité & Contrôle RBAC (`firestore.rules`)</span>
              </div>
              <p className="text-[11px] text-slate-400 leading-relaxed">
                Isolation par tenant et rôle hiérarchique validée au niveau des règles de sécurité Firestore et des middleware d'audit logging.
              </p>
            </div>

            <div className="p-4 bg-slate-950 border border-slate-800 rounded-2xl space-y-2">
              <div className="flex items-center space-x-2 text-cyan-400 font-bold text-xs">
                <RefreshCw className="w-4 h-4" />
                <span>6. Agnosticisme & Migration sans Risque</span>
              </div>
              <p className="text-[11px] text-slate-400 leading-relaxed">
                Modèles métier neutres, Use Cases neutres, UI neutres. Seule l'injection d'adaptateurs dans le Container DI varie selon l'environnement.
              </p>
            </div>

          </div>

          {/* Code Architecture Preview */}
          <div className="p-4 bg-slate-950 border border-slate-800 rounded-2xl space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-white flex items-center space-x-2">
                <FileCode2 className="w-4 h-4 text-emerald-400" />
                <span>Extrait de l'Adaptateur `/src/core/infrastructure/adapters/FirebaseAdapters.ts`</span>
              </span>
              <span className="text-[10px] font-mono text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
                Implements IAuthRepository
              </span>
            </div>
            <pre className="p-3 bg-slate-900 rounded-xl text-[11px] font-mono text-slate-300 overflow-x-auto border border-slate-800">
{`export class FirebaseAuthRepositoryAdapter implements IAuthRepository {
  async login(email: string, pass: string): Promise<AuthResponse> {
    // Abstraction totale du SDK Firebase Auth
    return { success: true, token: "fb-jwt-...", user: { role: "VOYAGEUR", ... } };
  }
}

export class FirestoreTransportRepositoryAdapter implements ITransportRepository {
  // Abstraction des requêtes Firestore pour les collections multi-tenant
}`}
            </pre>
          </div>

        </div>
      )}

      {/* VIEW 3: FEUILLE DE ROUTE POST-FIREBASE (6 PHASES) */}
      {mainView === 'roadmap_spec' && (
        <div className="space-y-6">

          {/* Intro Roadmap Header */}
          <div className="p-4 bg-purple-500/10 border border-purple-500/30 rounded-2xl space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2 text-purple-400 font-extrabold text-xs uppercase tracking-wider">
                <Activity className="w-4 h-4" />
                <span>Plan de Déploiement Post-Firebase – 6 Phases Séquentielles</span>
              </div>
              <span className="text-[10px] font-mono text-purple-300 bg-purple-500/20 px-2 py-0.5 rounded-full border border-purple-500/30 font-bold">
                Méthode Étanche & Sans Dette Technique
              </span>
            </div>
            <p className="text-xs text-slate-300 leading-relaxed">
              Chaque étape est entièrement finalisée et validée avant de passer à la suivante. Cette rigueur garantit une plateforme robuste, stable et totalement indépendante des sous-couches techniques.
            </p>
          </div>

          {/* 6 Phases Timeline Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

            {/* Phase 1 */}
            <div className="p-4 bg-slate-950 border border-slate-800 rounded-2xl space-y-3 relative overflow-hidden">
              <div className="flex items-center justify-between">
                <span className="px-2.5 py-0.5 rounded-full bg-orange-500/20 text-orange-400 text-[10px] font-extrabold uppercase border border-orange-500/30">
                  Phase 1 – Validée
                </span>
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              </div>
              <h4 className="text-sm font-extrabold text-white flex items-center space-x-2">
                <Database className="w-4 h-4 text-orange-400" />
                <span>Modèles de Données des 12 Domaines</span>
              </h4>
              <p className="text-xs text-slate-400 leading-relaxed">
                Documentation, typage TypeScript strict (`/src/types/`) et validation d'invariance sur Auth, Users, RBAC, Transport, Hôtellerie, Vision IA, IPTV, Paiements, Notifications, Audit et Config.
              </p>
            </div>

            {/* Phase 2 */}
            <div className="p-4 bg-slate-950 border border-slate-800 rounded-2xl space-y-3 relative overflow-hidden">
              <div className="flex items-center justify-between">
                <span className="px-2.5 py-0.5 rounded-full bg-blue-500/20 text-blue-400 text-[10px] font-extrabold uppercase border border-blue-500/30">
                  Phase 2 – Validée
                </span>
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              </div>
              <h4 className="text-sm font-extrabold text-white flex items-center space-x-2">
                <Users className="w-4 h-4 text-blue-400" />
                <span>Gestion des Identités (IAM & Guichet Unifié)</span>
              </h4>
              <p className="text-xs text-slate-400 leading-relaxed">
                Portail de connexion unifié avec acheminement automatique des profils (Super Admin ➔ Console Nationale, Admin Agence ➔ Agence, Admin Hôtel ➔ Hôtel, Voyageur ➔ E-Billet QR).
              </p>
            </div>

            {/* Phase 3 */}
            <div className="p-4 bg-slate-950 border border-slate-800 rounded-2xl space-y-3 relative overflow-hidden">
              <div className="flex items-center justify-between">
                <span className="px-2.5 py-0.5 rounded-full bg-purple-500/20 text-purple-400 text-[10px] font-extrabold uppercase border border-purple-500/30">
                  Phase 3 – Validée
                </span>
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              </div>
              <h4 className="text-sm font-extrabold text-white flex items-center space-x-2">
                <Building2 className="w-4 h-4 text-purple-400" />
                <span>Automatisation des Créations (Auto-Provisioning)</span>
              </h4>
              <p className="text-xs text-slate-400 leading-relaxed">
                Workflows transactionnels atomiques pour la création d'Agences et d'Hôtels avec génération automatique du compte Administrateur, rattachement RBAC et activation directe.
              </p>
            </div>

            {/* Phase 4 */}
            <div className="p-4 bg-slate-950 border border-slate-800 rounded-2xl space-y-3 relative overflow-hidden">
              <div className="flex items-center justify-between">
                <span className="px-2.5 py-0.5 rounded-full bg-indigo-500/20 text-indigo-400 text-[10px] font-extrabold uppercase border border-indigo-500/30">
                  Phase 4 – Validée
                </span>
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              </div>
              <h4 className="text-sm font-extrabold text-white flex items-center space-x-2">
                <Shield className="w-4 h-4 text-indigo-400" />
                <span>Sécurité, Anti-Infiltration & Audit Log</span>
              </h4>
              <p className="text-xs text-slate-400 leading-relaxed">
                Hardening des règles de sécurité Firestore, vérification RBAC côté serveur à la couche UseCase, chiffrement des données et journal d'audit immuable (`audit_logs`).
              </p>
            </div>

            {/* Phase 5 */}
            <div className="p-4 bg-slate-950 border border-slate-800 rounded-2xl space-y-3 md:col-span-2">
              <div className="flex items-center justify-between">
                <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 text-[10px] font-extrabold uppercase border border-emerald-500/30">
                  Phase 5 – Ordre Séquentiel des Modules
                </span>
                <span className="text-[10px] text-slate-400 font-mono">Ordre de Finalisation Métier</span>
              </div>
              
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1">
                <div className="p-3 bg-slate-900 border border-orange-500/30 rounded-xl space-y-1">
                  <div className="flex items-center space-x-1.5 text-orange-400 font-bold text-xs">
                    <Bus className="w-3.5 h-3.5" />
                    <span>1. Transport</span>
                  </div>
                  <p className="text-[10px] text-slate-400">Sièges transactionnels, billets QR ED25519, gares & flotte.</p>
                </div>

                <div className="p-3 bg-slate-900 border border-purple-500/30 rounded-xl space-y-1">
                  <div className="flex items-center space-x-1.5 text-purple-400 font-bold text-xs">
                    <Hotel className="w-3.5 h-3.5" />
                    <span>2. Hôtellerie</span>
                  </div>
                  <p className="text-[10px] text-slate-400">Réservations nuitées, disponibilités & check-in/out.</p>
                </div>

                <div className="p-3 bg-slate-900 border border-red-500/30 rounded-xl space-y-1">
                  <div className="flex items-center space-x-1.5 text-red-400 font-bold text-xs">
                    <Eye className="w-3.5 h-3.5" />
                    <span>3. Vision IA</span>
                  </div>
                  <p className="text-[10px] text-slate-400">Streams RTSP/ONVIF, alertes inattention & stockage blob.</p>
                </div>

                <div className="p-3 bg-slate-900 border border-teal-500/30 rounded-xl space-y-1">
                  <div className="flex items-center space-x-1.5 text-teal-400 font-bold text-xs">
                    <Tv className="w-3.5 h-3.5" />
                    <span>4. IPTV</span>
                  </div>
                  <p className="text-[10px] text-slate-400">Chaînes direct, EPG, bouquets & streaming VOD.</p>
                </div>
              </div>
            </div>

            {/* Phase 6 */}
            <div className="p-4 bg-slate-950 border border-slate-800 rounded-2xl space-y-3 md:col-span-2">
              <div className="flex items-center justify-between">
                <span className="px-2.5 py-0.5 rounded-full bg-cyan-500/20 text-cyan-400 text-[10px] font-extrabold uppercase border border-cyan-500/30">
                  Phase 6 – Integration & High Performance
                </span>
                <span className="text-[10px] font-mono text-cyan-400">Prêt pour Production Nationale</span>
              </div>
              <h4 className="text-sm font-extrabold text-white flex items-center space-x-2">
                <Zap className="w-4 h-4 text-cyan-400" />
                <span>Tests d'Intégration Globaux & Performance</span>
              </h4>
              <p className="text-xs text-slate-400 leading-relaxed">
                Validation des flux transversaux (Achat Billet ➔ Paiement Hub Wave ➔ Scan QR ➔ Notification Push ➔ Écriture Audit ➔ Dashboard Super Admin) sous charge élevée (&gt; 5 000 requêtes/sec).
              </p>
            </div>

          </div>

        </div>
      )}

      {/* VIEW 4: ARCHITECTURE DE COMMUNICATION ET BUS D'ÉVÉNEMENTS INTER-MODULES */}
      {mainView === 'eventbus_spec' && (
        <div className="space-y-6">

          {/* Intro Header */}
          <div className="p-4 bg-cyan-500/10 border border-cyan-500/30 rounded-2xl space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2 text-cyan-400 font-extrabold text-xs uppercase tracking-wider">
                <Radio className="w-4 h-4" />
                <span>Architecture Découplée – Bus d'Événements DomainEventBus</span>
              </div>
              <span className="text-[10px] font-mono text-cyan-300 bg-cyan-500/20 px-2 py-0.5 rounded-full border border-cyan-500/30 font-bold">
                100% Zero Direct Module Dependency
              </span>
            </div>
            <p className="text-xs text-slate-300 leading-relaxed">
              Aucun module métier (Transport, Hôtellerie, Vision IA, IPTV, Paiement, Notification) n'appelle un autre module en direct. Toute interaction transversale passe par l'émission et l'écoute d'événements du domaine certifiés.
            </p>
          </div>

          {/* Event Bus Simulator & Trigger Panel */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">

            {/* Left Column: Event Emitter Control */}
            <div className="p-4 bg-slate-950 border border-slate-800 rounded-2xl space-y-4">
              <div className="flex items-center space-x-2 text-white font-bold text-xs">
                <Send className="w-4 h-4 text-cyan-400" />
                <span>Simulateur d'Émission d'Événements</span>
              </div>

              <div className="space-y-3">
                <div>
                  <label className="text-[11px] font-bold text-slate-400 block mb-1">
                    Sélectionner le Type d'Événement :
                  </label>
                  <select
                    value={selectedEventType}
                    onChange={(e) => setSelectedEventType(e.target.value as DomainEventType)}
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-cyan-500 font-mono"
                  >
                    <option value="AgenceCreated">AgenceCreated (Transport → Auth/Audit)</option>
                    <option value="HotelCreated">HotelCreated (Hôtel → Auth/Audit)</option>
                    <option value="TripCreated">TripCreated (Transport → Voyageurs)</option>
                    <option value="ReservationConfirmed">ReservationConfirmed (Transport → Ticket QR)</option>
                    <option value="PaymentCompleted">PaymentCompleted (Paiement → Service)</option>
                    <option value="CameraAlertDetected">CameraAlertDetected (Vision IA → Urgent Push)</option>
                    <option value="IPTVSubscriptionActivated">IPTVSubscriptionActivated (IPTV → TV Room)</option>
                    <option value="UserRoleChanged">UserRoleChanged (IAM → Token Refresh)</option>
                  </select>
                </div>

                <div>
                  <label className="text-[11px] font-bold text-slate-400 block mb-1">
                    Tenant ID (Agence / Hôtel) :
                  </label>
                  <input
                    type="text"
                    value={simulatedTenant}
                    onChange={(e) => setSimulatedTenant(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white font-mono focus:outline-none focus:border-cyan-500"
                  />
                </div>

                <button
                  onClick={handleSimulateEvent}
                  className="w-full bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-extrabold text-xs py-2.5 px-4 rounded-xl transition-all flex items-center justify-center space-x-2 shadow-lg shadow-cyan-500/20"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>Publier sur DomainEventBus</span>
                </button>
              </div>

              <div className="p-3 bg-slate-900 rounded-xl border border-slate-800 space-y-1">
                <span className="text-[10px] text-slate-400 font-bold uppercase block">Architecture Event-Driven</span>
                <p className="text-[10px] text-slate-400 leading-normal">
                  La méthode <code className="text-cyan-400">publish()</code> enregistre l'événement, notifie les écouteurs de manière totalement asynchrone et inscrit l'action au journal d'audit centralisé.
                </p>
              </div>
            </div>

            {/* Right Column (2 Cols): Live Event Bus Log Inspector */}
            <div className="md:col-span-2 p-4 bg-slate-950 border border-slate-800 rounded-2xl space-y-3 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between pb-2 border-b border-slate-800">
                  <div className="flex items-center space-x-2 text-xs font-bold text-white">
                    <Activity className="w-4 h-4 text-emerald-400" />
                    <span>Journal des Événements Publiés (Event History)</span>
                  </div>
                  <span className="text-[10px] font-mono text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
                    {eventLogs.length} événements enregistrés
                  </span>
                </div>

                <div className="space-y-2 mt-3 max-h-72 overflow-y-auto pr-1">
                  {eventLogs.length === 0 ? (
                    <div className="p-8 text-center text-slate-500 text-xs font-mono">
                      Aucun événement publié pour l'instant. Utilisez le bouton "Publier" pour tester le bus d'événements.
                    </div>
                  ) : (
                    eventLogs.map((evt) => (
                      <div key={evt.id} className="p-3 bg-slate-900 border border-slate-800 rounded-xl space-y-1.5 font-mono text-xs">
                        <div className="flex items-center justify-between">
                          <span className="font-extrabold text-cyan-400 flex items-center space-x-1.5">
                            <Radio className="w-3 h-3 text-cyan-400 animate-pulse" />
                            <span>{evt.type}</span>
                          </span>
                          <span className="text-[10px] text-slate-500">
                            {new Date(evt.timestamp).toLocaleTimeString()}
                          </span>
                        </div>
                        <div className="flex items-center justify-between text-[11px] text-slate-400">
                          <span>Émetteur: <strong className="text-orange-400">{evt.emitterModule}</strong></span>
                          <span>Tenant: <strong className="text-purple-400">{evt.tenantId || 'GLOBAL'}</strong></span>
                          <span className="text-slate-500 text-[10px]">ID: {evt.id}</span>
                        </div>
                        <div className="p-2 bg-slate-950 rounded border border-slate-800/80 text-[10px] text-slate-300 overflow-x-auto">
                          {JSON.stringify(evt.payload)}
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>

              <div className="pt-2 border-t border-slate-800 flex items-center justify-between text-[10px] text-slate-400">
                <span className="flex items-center space-x-1 text-emerald-400">
                  <CheckCircle2 className="w-3 h-3" />
                  <span>Traçabilité Audit Log Garantie</span>
                </span>
                <span>Découplage strict de la couche UseCase</span>
              </div>
            </div>

          </div>

          {/* 14 Domain Events Matrix */}
          <div className="p-4 bg-slate-950 border border-slate-800 rounded-2xl space-y-3">
            <h4 className="text-xs font-bold text-white uppercase tracking-wider flex items-center space-x-2">
              <Layers className="w-4 h-4 text-orange-400" />
              <span>Matrice des 14 Événements Inter-Modules</span>
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
              {[
                { name: 'AgenceCreated', module: 'TRANSPORT', desc: 'Auto-provisioning du compte Admin Agence + Audit Log' },
                { name: 'HotelCreated', module: 'HOTEL', desc: 'Auto-provisioning du compte Admin Hôtel + Audit Log' },
                { name: 'HotelUpdated', module: 'HOTEL', desc: 'Notification de mise à jour des disponibilités & chambres' },
                { name: 'TripCreated', module: 'TRANSPORT', desc: 'Ouverture ligne autocar & notification voyageurs abonnés' },
                { name: 'TripCancelled', module: 'TRANSPORT', desc: 'Déclenchement remboursement Wave & alerte SMS' },
                { name: 'ReservationCreated', module: 'TRANSPORT', desc: 'Verrouillage temporaire du siège en transaction' },
                { name: 'ReservationConfirmed', module: 'TRANSPORT', desc: 'Génération Billet QR ED25519 & Push Notification' },
                { name: 'ReservationCancelled', module: 'TRANSPORT', desc: 'Libération immédiate du siège & Audit' },
                { name: 'PaymentCompleted', module: 'PAYMENT', desc: 'Émission reçu financier & validation définitive' },
                { name: 'PaymentFailed', module: 'PAYMENT', desc: 'Notification échec transaction & déverrouillage' },
                { name: 'CameraAlertDetected', module: 'VISION', desc: 'Alerte immédiate fatigue/intrusion vers opérateurs' },
                { name: 'IPTVSubscriptionActivated', module: 'IPTV', desc: 'Déblocage flux HLS/DASH dans la chambre d’hôtel' },
                { name: 'UserCreated', module: 'AUTH', desc: 'Attribution permissions & mail de bienvenue' },
                { name: 'UserRoleChanged', module: 'USERS', desc: 'Mise à jour immédiate des habilitations & claims JWT' },
              ].map((item, idx) => (
                <div key={idx} className="p-2.5 bg-slate-900 border border-slate-800 rounded-xl space-y-1">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-extrabold text-white font-mono">{item.name}</span>
                    <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-slate-800 text-cyan-400">
                      {item.module}
                    </span>
                  </div>
                  <p className="text-[10px] text-slate-400 leading-tight">{item.desc}</p>
                </div>
              ))}
            </div>
          </div>

        </div>
      )}

      {/* VIEW 5: VOLUME 7 – MOTEUR DE WORKFLOWS INTELILGENT & TABLEAU DE SUPERVISION */}
      {mainView === 'workflows_spec' && (
        <div className="space-y-6">

          {/* Intro Header */}
          <div className="p-4 bg-rose-500/10 border border-rose-500/30 rounded-2xl space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2 text-rose-400 font-extrabold text-xs uppercase tracking-wider">
                <Cpu className="w-4 h-4" />
                <span>Volume 7 – Moteur de Workflows Métier Intelligent & Supervision</span>
              </div>
              <span className="text-[10px] font-mono text-rose-300 bg-rose-500/20 px-2 py-0.5 rounded-full border border-rose-500/30 font-bold">
                Transactionnel, Event-Driven & Reprise
              </span>
            </div>
            <p className="text-xs text-slate-300 leading-relaxed">
              L'orchestrateur de workflows exécute les chaînes d'opérations complexes (Réservation transport 12 étapes, Hôtellerie 10 étapes, Auto-Provisioning atomique Agence/Hôtel, Alerte Vision IA, Validation Paiement) avec traçabilité intégrale, gestion d'erreurs et reprise sur incident.
            </p>
          </div>

          {/* Top Section: Interactive Workflow Execution Console */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">

            {/* Workflow Control & Launch Form */}
            <div className="p-4 bg-slate-950 border border-slate-800 rounded-2xl space-y-4">
              <div className="flex items-center space-x-2 text-white font-bold text-xs">
                <Play className="w-4 h-4 text-rose-400" />
                <span>Lancer un Workflow Métier</span>
              </div>

              <div className="space-y-3">
                <div>
                  <label className="text-[11px] font-bold text-slate-400 block mb-1">
                    Sélectionner le Workflow à Exécuter :
                  </label>
                  <select
                    value={selectedWfType}
                    onChange={(e) => setSelectedWfType(e.target.value as WorkflowType)}
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-rose-500 font-mono"
                  >
                    <option value="WORKFLOW_1_TRANSPORT_BOOKING">Workflow 1 : Réservation Billet (12 étapes)</option>
                    <option value="WORKFLOW_2_HOTEL_BOOKING">Workflow 2 : Réservation Hôtel (10 étapes)</option>
                    <option value="WORKFLOW_3_CREATE_AGENCY">Workflow 3 : Création Agence Auto-Provisioning</option>
                    <option value="WORKFLOW_4_CREATE_HOTEL">Workflow 4 : Création Hôtel Auto-Provisioning</option>
                    <option value="WORKFLOW_5_PAYMENT_ENGINE">Workflow 5 : Validation & Traitement Paiement</option>
                    <option value="WORKFLOW_6_VISION_AI_ALERT">Workflow 6 : Vidéosurveillance Alerte IA</option>
                    <option value="WORKFLOW_7_IPTV_ACTIVATION">Workflow 7 : Activation IPTV & Bouquet TV</option>
                    <option value="WORKFLOW_8_NOTIFICATION_ROUTING">Workflow 8 : Routage Centralisé Notifications</option>
                    <option value="WORKFLOW_9_AICORE_ANALYSIS">Workflow 9 : Analyse & Prédiction IA</option>
                    <option value="WORKFLOW_10_SUPERVISION_RECOVERY">Workflow 10 : Reprise & Auto-Correction</option>
                  </select>
                </div>

                <div>
                  <label className="text-[11px] font-bold text-slate-400 block mb-1">
                    Périmètre / Tenant ID :
                  </label>
                  <input
                    type="text"
                    value={simulatedTenant}
                    onChange={(e) => setSimulatedTenant(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white font-mono focus:outline-none focus:border-rose-500"
                  />
                </div>

                <div>
                  <label className="text-[11px] font-bold text-slate-400 block mb-1">
                    Simuler un Échec à l'Étape (0 = Succès) :
                  </label>
                  <select
                    value={simulateFailureAtStep}
                    onChange={(e) => setSimulateFailureAtStep(Number(e.target.value))}
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-rose-500 font-mono"
                  >
                    <option value={0}>Aucun Échec (100% Succès)</option>
                    <option value={3}>Échec à l'Étape 3 (Verrouillage / Incompatibilité)</option>
                    <option value={6}>Échec à l'Étape 6 (Paiement Refusé / Timeout)</option>
                  </select>
                </div>

                <button
                  onClick={async () => {
                    const inst = await WorkflowEngine.getInstance().executeWorkflow(selectedWfType, {
                      initiatedBy: 'Operateur Test (IHM)',
                      tenantId: simulatedTenant,
                      tenantType: 'AGENCY',
                      simulateFailureAtStep: simulateFailureAtStep > 0 ? simulateFailureAtStep : undefined
                    });
                    setSelectedWfDetail(inst);
                  }}
                  className="w-full bg-rose-500 hover:bg-rose-400 text-slate-950 font-extrabold text-xs py-2.5 px-4 rounded-xl transition-all flex items-center justify-center space-x-2 shadow-lg shadow-rose-500/20"
                >
                  <Play className="w-3.5 h-3.5 fill-slate-950" />
                  <span>Démarrer l'Orchestrateur</span>
                </button>
              </div>
            </div>

            {/* Active Execution & Supervision KPI Cards */}
            <div className="md:col-span-2 space-y-4">
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="p-3 bg-slate-950 border border-slate-800 rounded-2xl">
                  <span className="text-[10px] text-slate-500 font-bold uppercase block">Total Workflows</span>
                  <span className="text-xl font-black text-white">{workflows.length}</span>
                </div>

                <div className="p-3 bg-slate-950 border border-emerald-500/30 rounded-2xl">
                  <span className="text-[10px] text-emerald-400 font-bold uppercase block">Succès</span>
                  <span className="text-xl font-black text-emerald-400">
                    {workflows.filter(w => w.status === 'COMPLETED').length}
                  </span>
                </div>

                <div className="p-3 bg-slate-950 border border-rose-500/30 rounded-2xl">
                  <span className="text-[10px] text-rose-400 font-bold uppercase block">En Cours</span>
                  <span className="text-xl font-black text-rose-400">
                    {workflows.filter(w => w.status === 'IN_PROGRESS').length}
                  </span>
                </div>

                <div className="p-3 bg-slate-950 border border-amber-500/30 rounded-2xl">
                  <span className="text-[10px] text-amber-400 font-bold uppercase block">Échecs / Relances</span>
                  <span className="text-xl font-black text-amber-400">
                    {workflows.filter(w => w.status === 'FAILED').length}
                  </span>
                </div>
              </div>

              {/* Supervision Role Filter Switcher */}
              <div className="p-3 bg-slate-950 border border-slate-800 rounded-2xl flex items-center justify-between">
                <div className="flex items-center space-x-2 text-xs text-slate-300 font-bold">
                  <Sliders className="w-4 h-4 text-purple-400" />
                  <span>Profil Supervision :</span>
                </div>
                <div className="flex items-center space-x-1 font-mono text-xs">
                  {(['SUPERADMIN', 'ADMIN_AGENCY', 'ADMIN_HOTEL'] as const).map((role) => (
                    <button
                      key={role}
                      onClick={() => setSupervisionRole(role)}
                      className={`px-2.5 py-1 rounded-xl font-bold transition-all ${
                        supervisionRole === role
                          ? 'bg-purple-500 text-slate-950'
                          : 'text-slate-400 hover:text-white'
                      }`}
                    >
                      {role === 'SUPERADMIN' ? 'Super Admin (National)' : role === 'ADMIN_AGENCY' ? 'Admin Agence' : 'Admin Hôtel'}
                    </button>
                  ))}
                </div>
              </div>

              {/* Workflows Supervision List */}
              <div className="p-4 bg-slate-950 border border-slate-800 rounded-2xl space-y-3">
                <div className="flex items-center justify-between text-xs font-bold text-white pb-2 border-b border-slate-800">
                  <span>Centre de Supervision des Workflows</span>
                  <span className="text-[10px] text-slate-400 font-mono">
                    Vue filtrée pour {supervisionRole}
                  </span>
                </div>

                <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
                  {workflows.length === 0 ? (
                    <p className="text-xs text-slate-500 text-center py-6 font-mono">Aucun workflow enregistré.</p>
                  ) : (
                    workflows.map((wf) => {
                      const completedSteps = wf.steps.filter(s => s.status === 'COMPLETED').length;
                      const progressPct = Math.round((completedSteps / wf.steps.length) * 100);

                      return (
                        <div
                          key={wf.id}
                          onClick={() => setSelectedWfDetail(wf)}
                          className={`p-3 rounded-xl border transition-all cursor-pointer space-y-2 ${
                            selectedWfDetail?.id === wf.id
                              ? 'bg-slate-900 border-rose-500/50 shadow-md'
                              : 'bg-slate-900/60 border-slate-800 hover:border-slate-700'
                          }`}
                        >
                          <div className="flex items-center justify-between text-xs">
                            <div className="flex items-center space-x-2">
                              {wf.status === 'COMPLETED' && <CheckCircle2 className="w-4 h-4 text-emerald-400" />}
                              {wf.status === 'IN_PROGRESS' && <RefreshCw className="w-4 h-4 text-rose-400 animate-spin" />}
                              {wf.status === 'FAILED' && <AlertTriangle className="w-4 h-4 text-amber-400" />}
                              <span className="font-extrabold text-white">{wf.title}</span>
                            </div>

                            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full font-mono ${
                              wf.status === 'COMPLETED' ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' :
                              wf.status === 'IN_PROGRESS' ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30' :
                              'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                            }`}>
                              {wf.status}
                            </span>
                          </div>

                          {/* Progress bar */}
                          <div className="space-y-1">
                            <div className="flex justify-between text-[10px] text-slate-400 font-mono">
                              <span>Étapes: {completedSteps} / {wf.steps.length}</span>
                              <span>{progressPct}% effectué</span>
                            </div>
                            <div className="w-full bg-slate-950 h-1.5 rounded-full overflow-hidden border border-slate-800">
                              <div
                                className={`h-full transition-all duration-300 ${
                                  wf.status === 'FAILED' ? 'bg-amber-500' : 'bg-rose-500'
                                }`}
                                style={{ width: `${progressPct}%` }}
                              />
                            </div>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>

            </div>

          </div>

          {/* Workflow Step Inspector & Reprise Drawer */}
          {selectedWfDetail && (
            <div className="p-4 bg-slate-950 border border-rose-500/30 rounded-2xl space-y-4">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <div className="space-y-0.5">
                  <div className="flex items-center space-x-2">
                    <span className="text-xs font-mono text-rose-400 font-extrabold">{selectedWfDetail.id}</span>
                    <h3 className="text-sm font-extrabold text-white">{selectedWfDetail.title}</h3>
                  </div>
                  <p className="text-[11px] text-slate-400 font-mono">
                    Initié par : {selectedWfDetail.initiatedBy} | Tenant : {selectedWfDetail.tenantId}
                  </p>
                </div>

                {selectedWfDetail.status === 'FAILED' && (
                  <button
                    onClick={async () => {
                      await WorkflowEngine.getInstance().retryWorkflow(selectedWfDetail.id);
                    }}
                    className="bg-amber-500 hover:bg-amber-400 text-slate-950 font-extrabold text-xs py-2 px-3 rounded-xl transition-all flex items-center space-x-1.5 shadow-lg shadow-amber-500/20"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    <span>Relancer l'Étape Échouée</span>
                  </button>
                )}
              </div>

              {/* Step by Step Progression List */}
              <div className="space-y-2">
                <span className="text-xs font-bold text-slate-300 uppercase tracking-wider block">
                  Détails des Étapes d'Exécution :
                </span>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                  {selectedWfDetail.steps.map((step) => (
                    <div
                      key={step.id}
                      className={`p-2.5 rounded-xl border text-xs space-y-1 font-mono ${
                        step.status === 'COMPLETED' ? 'bg-slate-900/80 border-emerald-500/30 text-emerald-300' :
                        step.status === 'IN_PROGRESS' ? 'bg-slate-900 border-rose-500 text-rose-300 animate-pulse' :
                        step.status === 'FAILED' ? 'bg-amber-500/10 border-amber-500/50 text-amber-300' :
                        'bg-slate-950 border-slate-800 text-slate-500'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-extrabold flex items-center space-x-1.5">
                          <span className="w-5 h-5 rounded-full bg-slate-800 flex items-center justify-center text-[10px] text-white">
                            {step.stepNumber}
                          </span>
                          <span>{step.title}</span>
                        </span>
                        <span className="text-[9px] uppercase font-bold">{step.status}</span>
                      </div>

                      {step.errorDetails && (
                        <p className="text-[10px] text-amber-400 pt-1 border-t border-amber-500/20">
                          ⚠️ {step.errorDetails}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

        </div>
      )}

      {/* VIEW 6: VOLUME 8 – GOUVERNANCE, SUPERVISION, EXPLOITATION ET MAINTENANCE */}
      {mainView === 'governance_spec' && (
        <ControlCenterGovernancePanel />
      )}

      {/* VIEW 7: VOLUME 9 – PLATEFORME D'INTÉGRATION ET ÉCOSYSTÈME D'IVOIREXPRESS */}
      {mainView === 'ecosystem_spec' && (
        <div className="space-y-6">

          {/* Intro Header */}
          <div className="p-4 bg-blue-500/10 border border-blue-500/30 rounded-2xl space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2 text-blue-400 font-extrabold text-xs uppercase tracking-wider">
                <Share2 className="w-4 h-4" />
                <span>Volume 9 – Plateforme d'Intégration et Écosystème d'IVOIReXpress</span>
              </div>
              <span className="text-[10px] font-mono text-blue-300 bg-blue-500/20 px-2 py-0.5 rounded-full border border-blue-500/30 font-bold">
                Écosystème Ouvert & Plug-and-Play
              </span>
            </div>
            <p className="text-xs text-slate-300 leading-relaxed">
              Couche d'intégration abstraite et découplée orchestrant les connecteurs de paiement Mobile Money/CB, la cartographie interchangeable, le moteur de notifications multicanales, la génération documentaire, les API publiques et le catalogue de services.
            </p>
          </div>

          {/* Ecosystem Sub-Tab Switcher */}
          <div className="flex flex-wrap gap-2 p-1.5 bg-slate-950 border border-slate-800 rounded-2xl">
            {[
              { id: 'connectors', label: '1. Connecteurs Paiement', icon: CreditCard },
              { id: 'maps', label: '2. Cartographie & GPS', icon: MapPin },
              { id: 'notifications', label: '3. Notifications Multicanales', icon: Send },
              { id: 'documents', label: '4. Moteur Documentaire', icon: Printer },
              { id: 'partners', label: '5. Gestion Partenaires', icon: Building2 },
              { id: 'public_api', label: '6. API Publiques & Sandbox', icon: Terminal },
              { id: 'catalog', label: '7. Catalogue Services', icon: BookOpen }
            ].map(tab => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setEcosystemSubTab(tab.id as any)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center space-x-1.5 ${
                    ecosystemSubTab === tab.id
                      ? 'bg-blue-500 text-slate-950 shadow-md font-extrabold'
                      : 'text-slate-400 hover:text-white hover:bg-slate-900'
                  }`}
                >
                  <Icon className="w-3.5 h-3.5" />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </div>

          {/* SUB-TAB 1: PAYMENT CONNECTORS */}
          {ecosystemSubTab === 'connectors' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between pb-2 border-b border-slate-800">
                <span className="text-xs font-bold text-white uppercase tracking-wider flex items-center space-x-2">
                  <CreditCard className="w-4 h-4 text-blue-400" />
                  <span>Passerelles de Paiement Plug-and-Play (Actives / Inactives)</span>
                </span>
                <span className="text-[10px] text-slate-400 font-mono">
                  Garantie d'Indépendance & Transaction Ininterrompue
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {paymentConnectors.map((connector) => (
                  <div key={connector.id} className="p-4 bg-slate-950 border border-slate-800 rounded-2xl space-y-3 relative overflow-hidden">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <span className="text-2xl">{connector.icon}</span>
                        <div>
                          <h4 className="text-xs font-extrabold text-white">{connector.name}</h4>
                          <span className="text-[10px] text-slate-400 font-mono">{connector.providerCode}</span>
                        </div>
                      </div>

                      <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full border ${
                        connector.status === 'ACTIVE'
                          ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                          : 'bg-rose-500/10 text-rose-400 border-rose-500/30'
                      }`}>
                        {connector.status}
                      </span>
                    </div>

                    <div className="grid grid-cols-2 gap-2 text-[10px] font-mono text-slate-400 bg-slate-900 p-2.5 rounded-xl border border-slate-800">
                      <div>
                        <span>Frais Transaction:</span>
                        <strong className="text-blue-400 block">{connector.transactionFeePercent}%</strong>
                      </div>
                      <div>
                        <span>Latence Moyenne:</span>
                        <strong className="text-purple-400 block">{connector.averageLatencyMs} ms</strong>
                      </div>
                    </div>

                    <button
                      onClick={() => EcosystemEngine.getInstance().togglePaymentConnector(connector.id)}
                      className={`w-full py-1.5 rounded-xl text-xs font-extrabold transition-all ${
                        connector.status === 'ACTIVE'
                          ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30 hover:bg-rose-500/30'
                          : 'bg-emerald-500 hover:bg-emerald-400 text-slate-950 shadow-md'
                      }`}
                    >
                      {connector.status === 'ACTIVE' ? 'Désactiver le Connecteur' : 'Activer le Connecteur'}
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* SUB-TAB 2: MAP PROVIDERS & GEOLOCATION */}
          {ecosystemSubTab === 'maps' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between pb-2 border-b border-slate-800">
                <span className="text-xs font-bold text-white uppercase tracking-wider flex items-center space-x-2">
                  <MapPin className="w-4 h-4 text-emerald-400" />
                  <span>Couche d'Abstraction Cartographique (`IMapProvider`)</span>
                </span>
                <span className="text-[10px] text-slate-400 font-mono">
                  Interchangeable à chaud sans impact sur le domaine métier
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                {mapProviders.map((mapP) => (
                  <div
                    key={mapP.id}
                    onClick={() => EcosystemEngine.getInstance().setActiveMapProvider(mapP.code)}
                    className={`p-4 rounded-2xl border cursor-pointer transition-all space-y-3 ${
                      mapP.isActive
                        ? 'bg-emerald-500/10 border-emerald-500/50 shadow-lg text-white'
                        : 'bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-extrabold text-white flex items-center space-x-1.5">
                        <Globe className="w-4 h-4 text-emerald-400" />
                        <span>{mapP.name}</span>
                      </span>
                      {mapP.isActive && (
                        <span className="text-[9px] bg-emerald-500 text-slate-950 font-black px-2 py-0.5 rounded-full">
                          FOURNISSEUR ACTIF
                        </span>
                      )}
                    </div>

                    <div className="space-y-1 text-[10px] font-mono text-slate-300">
                      <div>Trafic Temps Réel: <strong className={mapP.supportsTraffic ? 'text-emerald-400' : 'text-slate-500'}>{mapP.supportsTraffic ? 'OUI' : 'NON'}</strong></div>
                      <div>Rendu Bâtiments 3D: <strong className={mapP.supports3DBuildings ? 'text-emerald-400' : 'text-slate-500'}>{mapP.supports3DBuildings ? 'OUI' : 'NON'}</strong></div>
                      <div>Quota Restant API: <strong className="text-blue-400">{mapP.apiQuotaRemaining.toLocaleString()} req</strong></div>
                    </div>

                    <p className="text-[10px] font-mono text-slate-400 bg-slate-900 p-2 rounded border border-slate-800 truncate">
                      {mapP.tileUrlPattern}
                    </p>
                  </div>
                ))}
              </div>

              {/* Live Map Route Simulator */}
              <div className="p-4 bg-slate-950 border border-slate-800 rounded-2xl space-y-3">
                <h4 className="text-xs font-bold text-white uppercase tracking-wider">
                  Démonstration : Calcul d'Itinéraire & Estimation Temps de Trajet (ETA)
                </h4>
                <div className="p-3 bg-slate-900 border border-slate-800 rounded-xl grid grid-cols-1 md:grid-cols-3 gap-3 text-xs font-mono">
                  <div className="space-y-1">
                    <span className="text-slate-400 text-[10px]">Ligne d'Autocar Sélectionnée</span>
                    <strong className="text-white block">Abidjan (Gare Adjamé) ➔ Yamoussoukro</strong>
                  </div>
                  <div className="space-y-1">
                    <span className="text-slate-400 text-[10px]">Distance Calculée</span>
                    <strong className="text-emerald-400 block">238.4 km (Autoroute du Nord)</strong>
                  </div>
                  <div className="space-y-1">
                    <span className="text-slate-400 text-[10px]">Temps de Trajet Estimé (ETA)</span>
                    <strong className="text-cyan-400 block">2h 45m (Trafic Fluide)</strong>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* SUB-TAB 3: MULTI-CHANNEL NOTIFICATIONS */}
          {ecosystemSubTab === 'notifications' && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                {notificationChannels.map((channel) => (
                  <div key={channel.id} className="p-3 bg-slate-950 border border-slate-800 rounded-2xl space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-extrabold text-white flex items-center space-x-1.5">
                        <Send className="w-3.5 h-3.5 text-blue-400" />
                        <span>Canal {channel.channelType}</span>
                      </span>
                      <span className="text-[9px] bg-emerald-500/10 text-emerald-400 px-2 py-0.5 rounded font-bold border border-emerald-500/30">
                        {channel.status}
                      </span>
                    </div>

                    <p className="text-[10px] text-slate-400">{channel.providerName}</p>

                    <div className="pt-2 border-t border-slate-800 flex justify-between text-[10px] font-mono">
                      <span>Envoyés Aujourd'hui: <strong className="text-white">{channel.sentTodayCount}</strong></span>
                      <span>Succès: <strong className="text-emerald-400">{channel.deliverySuccessRate}%</strong></span>
                    </div>
                  </div>
                ))}
              </div>

              {/* Notification Sender Test Form */}
              <div className="p-4 bg-slate-950 border border-slate-800 rounded-2xl space-y-3">
                <h4 className="text-xs font-bold text-white uppercase tracking-wider flex items-center space-x-2">
                  <Bell className="w-4 h-4 text-purple-400" />
                  <span>Test d'Envoi Asynchrone Multicanal (Push, SMS, Email, WhatsApp)</span>
                </h4>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  <input
                    type="text"
                    placeholder="Téléphone / WhatsApp (+225 07...)"
                    defaultValue="+225 07 08 09 10 11"
                    className="p-2.5 bg-slate-900 border border-slate-800 rounded-xl text-xs font-mono text-white focus:outline-none focus:border-purple-500"
                  />
                  <input
                    type="text"
                    placeholder="Modèle de Message"
                    defaultValue="Confirmation de Billet B-881920 d'Abidjan à Bouaké"
                    className="p-2.5 bg-slate-900 border border-slate-800 rounded-xl text-xs font-mono text-white focus:outline-none focus:border-purple-500"
                  />
                  <button
                    onClick={() => alert('Message de test diffusé instantanément sur les 4 canaux (Push, SMS, Email, WhatsApp) !')}
                    className="bg-purple-500 hover:bg-purple-400 text-slate-950 font-extrabold text-xs py-2.5 px-4 rounded-xl transition-all shadow-lg shadow-purple-500/20"
                  >
                    Diffuser le Message de Test
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* SUB-TAB 4: DOCUMENT GENERATION ENGINE */}
          {ecosystemSubTab === 'documents' && (
            <div className="p-4 bg-slate-950 border border-slate-800 rounded-2xl space-y-4">
              <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                <div className="flex items-center space-x-2 text-xs font-bold text-white">
                  <Printer className="w-4 h-4 text-cyan-400" />
                  <span>Moteur de Génération Documentaire (`DocumentGeneratorEngine`)</span>
                </div>

                <div className="flex space-x-2">
                  {[
                    { id: 'TICKET', label: 'Billet Transport QR' },
                    { id: 'HOTEL_PASS', label: 'Passe VIP Hôtel' },
                    { id: 'FACTURE', label: 'Facture OHADA' }
                  ].map(dt => (
                    <button
                      key={dt.id}
                      onClick={() => setDocumentTypePreview(dt.id as any)}
                      className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${
                        documentTypePreview === dt.id
                          ? 'bg-cyan-500 text-slate-950'
                          : 'bg-slate-900 text-slate-400 hover:text-white'
                      }`}
                    >
                      {dt.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Live Document Visual Preview */}
              <div className="p-6 bg-slate-900 border border-slate-800 rounded-2xl max-w-2xl mx-auto space-y-4 shadow-2xl">
                {documentTypePreview === 'TICKET' && (
                  <div className="space-y-4 border-l-4 border-emerald-500 pl-4 bg-slate-950 p-4 rounded-xl">
                    <div className="flex justify-between items-start">
                      <div>
                        <h3 className="text-sm font-black text-white uppercase tracking-wider">IVOIReXpress Transport Billet</h3>
                        <span className="text-[10px] text-slate-400 font-mono">Billet Numérique Certifié ED25519</span>
                      </div>
                      <span className="text-xs font-mono font-bold text-emerald-400 bg-emerald-500/10 px-2.5 py-1 rounded border border-emerald-500/30">
                        VALIDE – SIÈGE #14
                      </span>
                    </div>

                    <div className="grid grid-cols-2 gap-2 text-xs font-mono text-slate-300">
                      <div>Passager: <strong className="text-white">Kouamé Jean-Luc</strong></div>
                      <div>Compagnie: <strong className="text-white">UTB Express CI</strong></div>
                      <div>Trajet: <strong className="text-emerald-400">Abidjan ➔ Yamoussoukro</strong></div>
                      <div>Départ: <strong className="text-white">Demain à 07:30 GMT</strong></div>
                    </div>

                    <div className="p-3 bg-slate-900 rounded-xl flex items-center justify-between border border-slate-800 font-mono text-[10px]">
                      <span>Code Sécurisé QR: <strong className="text-cyan-400">e25519_sig_9901823a8ff</strong></span>
                      <button
                        onClick={() => alert('Impression du Billet PDF en cours...')}
                        className="bg-emerald-500 text-slate-950 px-3 py-1 rounded font-bold"
                      >
                        Télécharger PDF
                      </button>
                    </div>
                  </div>
                )}

                {documentTypePreview === 'HOTEL_PASS' && (
                  <div className="space-y-4 border-l-4 border-blue-500 pl-4 bg-slate-950 p-4 rounded-xl">
                    <div className="flex justify-between items-start">
                      <div>
                        <h3 className="text-sm font-black text-white uppercase tracking-wider">Passe VIP Séjour Hôtelier</h3>
                        <span className="text-[10px] text-slate-400 font-mono">Chambre Numérique & IPTV Access Pass</span>
                      </div>
                      <span className="text-xs font-mono font-bold text-blue-400 bg-blue-500/10 px-2.5 py-1 rounded border border-blue-500/30">
                        CONFIRMÉ – ROOM #304
                      </span>
                    </div>

                    <div className="grid grid-cols-2 gap-2 text-xs font-mono text-slate-300">
                      <div>Client: <strong className="text-white">Dr. Amani Brou</strong></div>
                      <div>Établissement: <strong className="text-white">Hôtel Sofitel Abidjan</strong></div>
                      <div>Nuitées: <strong className="text-blue-400">2 Nuits (Check-in 14:00)</strong></div>
                      <div>Code Clé IPTV: <strong className="text-white">8820-IPTV-PASS</strong></div>
                    </div>
                  </div>
                )}

                {documentTypePreview === 'FACTURE' && (
                  <div className="space-y-4 border-l-4 border-purple-500 pl-4 bg-slate-950 p-4 rounded-xl">
                    <div className="flex justify-between items-start">
                      <div>
                        <h3 className="text-sm font-black text-white uppercase tracking-wider">Facture Normalisée OHADA</h3>
                        <span className="text-[10px] text-slate-400 font-mono">Ref: INV-2026-088192</span>
                      </div>
                      <span className="text-xs font-mono font-bold text-purple-400 bg-purple-500/10 px-2.5 py-1 rounded border border-purple-500/30">
                        PAYÉ PAR WAVE MONEY
                      </span>
                    </div>

                    <div className="grid grid-cols-2 gap-2 text-xs font-mono text-slate-300">
                      <div>Montant HT: <strong className="text-white">42 372 FCFA</strong></div>
                      <div>TVA (18%): <strong className="text-white">7 628 FCFA</strong></div>
                      <div>Total TTC: <strong className="text-emerald-400">50 000 FCFA</strong></div>
                      <div>Quittance #: <strong className="text-white">Q-WAVE-882109</strong></div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* SUB-TAB 5: PARTNER MANAGEMENT */}
          {ecosystemSubTab === 'partners' && (
            <div className="p-4 bg-slate-950 border border-slate-800 rounded-2xl space-y-4">
              <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                <div className="flex items-center space-x-2 text-xs font-bold text-white">
                  <Building2 className="w-4 h-4 text-purple-400" />
                  <span>Gestionnaire de Partenaires Accrédités</span>
                </div>

                <button
                  onClick={() => setShowAddPartnerModal(!showAddPartnerModal)}
                  className="bg-purple-500 hover:bg-purple-400 text-slate-950 font-extrabold text-xs py-1.5 px-3 rounded-xl transition-all"
                >
                  + Enregistrer un Nouveau Partenaire
                </button>
              </div>

              {/* Add Partner Form */}
              {showAddPartnerModal && (
                <div className="p-4 bg-slate-900 border border-purple-500/30 rounded-xl space-y-3 font-mono text-xs">
                  <h4 className="font-bold text-purple-400 uppercase">Formulaire d'Enregistrement Partenaire</h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <input
                      type="text"
                      placeholder="Nom de l'entreprise partenaire"
                      value={newPartnerForm.name}
                      onChange={e => setNewPartnerForm({ ...newPartnerForm, name: e.target.value })}
                      className="p-2 bg-slate-950 border border-slate-800 rounded text-white"
                    />
                    <select
                      value={newPartnerForm.category}
                      onChange={e => setNewPartnerForm({ ...newPartnerForm, category: e.target.value as any })}
                      className="p-2 bg-slate-950 border border-slate-800 rounded text-white"
                    >
                      <option value="TRANSPORT_AGENCY">Compagnie de Transport</option>
                      <option value="HOTEL_CHAIN">Chaîne Hôtelière</option>
                      <option value="IPTV_PROVIDER">Fournisseur IPTV</option>
                      <option value="TECH_VENDOR">Prestataire Technique</option>
                      <option value="BANK_FINTECH">Fintech / Banque</option>
                    </select>
                  </div>

                  <button
                    onClick={() => {
                      if (!newPartnerForm.name) return alert('Saisissez le nom du partenaire');
                      EcosystemEngine.getInstance().addPartner(newPartnerForm);
                      setShowAddPartnerModal(false);
                      setNewPartnerForm({ name: '', category: 'TRANSPORT_AGENCY', slaTargetPercent: 99.9, monthlyVolumeFCFA: 5000000 });
                    }}
                    className="bg-emerald-500 text-slate-950 px-4 py-2 rounded-lg font-extrabold"
                  >
                    Valider le Contrat & Générer Clé API Live
                  </button>
                </div>
              )}

              {/* Partner List */}
              <div className="space-y-2 font-mono text-xs">
                {partners.map((pt) => (
                  <div key={pt.id} className="p-3 bg-slate-900 border border-slate-800 rounded-xl flex items-center justify-between">
                    <div>
                      <div className="flex items-center space-x-2">
                        <strong className="text-white text-xs">{pt.name}</strong>
                        <span className="text-[9px] bg-purple-500/10 text-purple-400 px-2 py-0.5 rounded border border-purple-500/20 font-bold">
                          {pt.category}
                        </span>
                      </div>
                      <span className="text-[10px] text-slate-400 block pt-0.5">
                        Clé API: <code className="text-emerald-400">{pt.apiKey}</code> | SLA Cible: {pt.slaTargetPercent}%
                      </span>
                    </div>

                    <div className="text-right space-y-1">
                      <span className="text-[10px] text-emerald-400 font-extrabold block">
                        {pt.monthlyVolumeFCFA.toLocaleString()} FCFA / mois
                      </span>
                      <span className="text-[9px] bg-slate-800 text-slate-300 px-2 py-0.5 rounded">
                        Statut: {pt.contractStatus}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* SUB-TAB 6: PUBLIC API & SANDBOX */}
          {ecosystemSubTab === 'public_api' && (
            <div className="p-4 bg-slate-950 border border-slate-800 rounded-2xl space-y-4">
              <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                <div className="flex items-center space-x-2 text-xs font-bold text-white">
                  <Terminal className="w-4 h-4 text-emerald-400" />
                  <span>Sandbox d'Exécution des API Publiques IVOIReXpress (`OpenAPI v3`)</span>
                </div>
                <span className="text-[10px] font-mono text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/30 font-bold">
                  Authentification x-api-key Active
                </span>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {/* Endpoint Selection */}
                <div className="space-y-2">
                  <span className="text-xs font-bold text-slate-300 block">Endpoints Disponibles :</span>
                  {publicApiEndpoints.map((ep) => (
                    <div
                      key={ep.id}
                      onClick={() => {
                        setSelectedApiId(ep.id);
                        setApiExecutionResult(null);
                      }}
                      className={`p-3 rounded-xl border cursor-pointer transition-all space-y-1.5 font-mono text-xs ${
                        selectedApiId === ep.id
                          ? 'bg-emerald-500/10 border-emerald-500 text-white'
                          : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-extrabold text-white text-xs">{ep.title}</span>
                        <span className="text-[9px] bg-blue-500/20 text-blue-300 px-2 py-0.5 rounded font-bold">
                          {ep.method} {ep.path}
                        </span>
                      </div>
                      <p className="text-[10px] text-slate-400">{ep.description}</p>
                    </div>
                  ))}
                </div>

                {/* API Execution Box */}
                <div className="p-4 bg-slate-900 border border-slate-800 rounded-xl space-y-3 font-mono text-xs">
                  <div className="flex justify-between items-center pb-2 border-b border-slate-800">
                    <span className="text-emerald-400 font-bold">Console d'Exécution Réseau</span>
                    <button
                      onClick={() => {
                        const res = EcosystemEngine.getInstance().simulatePublicApiCall(selectedApiId);
                        setApiExecutionResult(res);
                      }}
                      className="bg-emerald-500 hover:bg-emerald-400 text-slate-950 px-3 py-1 rounded font-extrabold"
                    >
                      Exécuter l'Requête API
                    </button>
                  </div>

                  {apiExecutionResult && (
                    <div className="space-y-2 pt-1">
                      <div className="flex justify-between text-[10px]">
                        <span>Code Statut: <strong className="text-emerald-400">{apiExecutionResult.status} OK</strong></span>
                        <span>Temps de Réponse: <strong className="text-purple-400">{apiExecutionResult.durationMs} ms</strong></span>
                      </div>
                      <pre className="p-3 bg-slate-950 border border-slate-800 rounded-xl text-[10px] text-slate-200 overflow-x-auto max-h-48">
                        {JSON.stringify(apiExecutionResult.body, null, 2)}
                      </pre>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* SUB-TAB 7: SERVICE CATALOG & REGISTRY */}
          {ecosystemSubTab === 'catalog' && (
            <div className="p-4 bg-slate-950 border border-slate-800 rounded-2xl space-y-4">
              <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                <div className="flex items-center space-x-2 text-xs font-bold text-white">
                  <BookOpen className="w-4 h-4 text-cyan-400" />
                  <span>Registre Centralisé des Micro-Services (Service Catalog)</span>
                </div>
                <span className="text-[10px] font-mono text-cyan-400 bg-cyan-500/10 px-2 py-0.5 rounded-full border border-cyan-500/30 font-bold">
                  Architecture 100% Découplée
                </span>
              </div>

              <div className="space-y-2 font-mono text-xs">
                {serviceCatalog.map((srv) => (
                  <div key={srv.id} className="p-3 bg-slate-900 border border-slate-800 rounded-xl flex items-center justify-between">
                    <div>
                      <div className="flex items-center space-x-2">
                        <strong className="text-white text-xs">{srv.serviceName}</strong>
                        <span className="text-[9px] bg-slate-800 text-slate-300 px-2 py-0.5 rounded">
                          {srv.version}
                        </span>
                      </div>
                      <span className="text-[10px] text-slate-400 block pt-0.5">
                        Module: {srv.module} | Équipe Responsable: {srv.ownerTeam}
                      </span>
                    </div>

                    <div className="text-right space-y-1">
                      <span className="text-[10px] text-emerald-400 font-extrabold block">
                        SLA Uptime: {srv.slaUptimePercent}%
                      </span>
                      <span className="text-[9px] bg-emerald-500/10 text-emerald-400 px-2 py-0.5 rounded border border-emerald-500/30">
                        {srv.status}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

        </div>
      )}

      {/* VIEW 8: ARCHITECTURE HEXAGONALE (PORTS & ADAPTERS) */}
      {mainView === 'hexagonal' && (
        <div className="space-y-6">
          
          {/* Layer Navigation Tabs */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
            {[
              { id: 'domain', name: '1. Domaine Métier (Domain)', color: 'text-orange-400', bg: 'bg-orange-500/10 border-orange-500/30' },
              { id: 'application', name: '2. Application (Use Cases)', color: 'text-purple-400', bg: 'bg-purple-500/10 border-purple-500/30' },
              { id: 'infrastructure', name: '3. Infrastructure (Adapters)', color: 'text-emerald-400', bg: 'bg-emerald-500/10 border-emerald-500/30' },
              { id: 'presentation', name: '4. Présentation (UI)', color: 'text-blue-400', bg: 'bg-blue-500/10 border-blue-500/30' }
            ].map(layer => (
              <button
                key={layer.id}
                onClick={() => setSelectedLayer(layer.id as any)}
                className={`p-3 rounded-2xl border text-left transition-all ${
                  selectedLayer === layer.id
                    ? `${layer.bg} text-white shadow-lg`
                    : 'bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700 hover:text-slate-200'
                }`}
              >
                <div className={`text-xs font-extrabold ${selectedLayer === layer.id ? layer.color : ''}`}>
                  {layer.name}
                </div>
                <p className="text-[10px] text-slate-500 mt-0.5">
                  {layer.id === 'domain' && 'Règles pures & sans dépendances'}
                  {layer.id === 'application' && 'Orchestration des Use Cases'}
                  {layer.id === 'infrastructure' && 'Bases, Paiements & AI Core'}
                  {layer.id === 'presentation' && 'Interfaces Rôles React'}
                </p>
              </button>
            ))}
          </div>

          {/* Selected Layer Details Panel */}
          <div className="bg-slate-950 border border-slate-800 rounded-2xl p-5 space-y-4">
            {selectedLayer === 'domain' && (
              <div className="space-y-3">
                <div className="flex items-center space-x-2 text-orange-400 font-extrabold text-sm">
                  <Cpu className="w-4 h-4" />
                  <span>Couche 1 : Domaine Métier (Pure Rules)</span>
                </div>
                <p className="text-xs text-slate-300 leading-relaxed">
                  La couche domaine contient l'ensemble des règles métier sous forme de fonctions pures et d'entités immuables. Aucune référence vers React, Firebase, Stripe, Wave ou Express n'est tolérée dans cette couche.
                </p>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-2">
                  <div className="p-3 bg-slate-900 border border-slate-800 rounded-xl text-xs space-y-1">
                    <span className="font-extrabold text-orange-400 block">TransportDomain.ts</span>
                    <p className="text-slate-400 text-[11px]">Validation de critères de recherche, vérification d'occupation des sièges et génération de signatures ED25519.</p>
                  </div>
                  <div className="p-3 bg-slate-900 border border-slate-800 rounded-xl text-xs space-y-1">
                    <span className="font-extrabold text-blue-400 block">HotelDomain.ts</span>
                    <p className="text-slate-400 text-[11px]">Calcul exact des séjours en FCFA, vérification de capacité des chambres et QR payloads.</p>
                  </div>
                  <div className="p-3 bg-slate-900 border border-slate-800 rounded-xl text-xs space-y-1">
                    <span className="font-extrabold text-purple-400 block">VisionDomain.ts</span>
                    <p className="text-slate-400 text-[11px]">Évaluation du niveau de gravité des menaces IA et contrôle des protocoles RTSP/ONVIF.</p>
                  </div>
                </div>
              </div>
            )}

            {selectedLayer === 'application' && (
              <div className="space-y-3">
                <div className="flex items-center space-x-2 text-purple-400 font-extrabold text-sm">
                  <Share2 className="w-4 h-4" />
                  <span>Couche 2 : Application & Ports d'Entrée (Use Cases)</span>
                </div>
                <p className="text-xs text-slate-300 leading-relaxed">
                  Les Use Cases (`TransportUseCases`, `HotelUseCases`, `VisionUseCases`, `TransversalUseCases`, `AICoreUseCases`) orchestrent les opérations métiers. Ils interagissent uniquement avec les ports d'entrée et de sortie.
                </p>
                <div className="p-3.5 bg-slate-900 border border-slate-800 rounded-xl text-xs text-slate-300 space-y-2">
                  <div className="font-bold text-white flex items-center space-x-1.5">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                    <span>Exemple d'Orchestration UseCase (`reserveSeat`) :</span>
                  </div>
                  <ol className="list-decimal list-inside space-y-1 text-slate-400 font-mono text-[11px] pl-2">
                    <li>Récupération de l'autocar via `ITransportRepository`</li>
                    <li>Validation de la disponibilité du siège via `TransportDomain`</li>
                    <li>Paiement via `IPaymentGatewayPort` (Hub Wave / Mobile Money)</li>
                    <li>Création du billet officiel et écriture de l'Audit Financier via `IAuditLoggerPort`</li>
                  </ol>
                </div>
              </div>
            )}

            {selectedLayer === 'infrastructure' && (
              <div className="space-y-3">
                <div className="flex items-center space-x-2 text-emerald-400 font-extrabold text-sm">
                  <Database className="w-4 h-4" />
                  <span>Couche 3 : Infrastructure & Adapters de Sortie</span>
                </div>
                <p className="text-xs text-slate-300 leading-relaxed">
                  Consiste en l'implémentation physique des interfaces (Repositories, Hub de Paiement Unifié, Centre de Notification Push/SMS, Orchestrateur AI Core Gemini 3.6 Flash).
                </p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-1">
                  <div className="p-3 bg-slate-900 border border-slate-800 rounded-xl text-xs space-y-1">
                    <span className="font-bold text-emerald-400">TransversalPaymentAdapter</span>
                    <p className="text-slate-400 text-[11px]">Passerelle unifiée pour Wave, MTN, Orange, Moov Money et Carte Bancaire.</p>
                  </div>
                  <div className="p-3 bg-slate-900 border border-slate-800 rounded-xl text-xs space-y-1">
                    <span className="font-bold text-amber-400">AICoreOrchestratorAdapter</span>
                    <p className="text-slate-400 text-[11px]">Orchestre les 6 assistants spécialisés en appelant uniquement les Ports Applicatifs avec vérification RBAC.</p>
                  </div>
                </div>
              </div>
            )}

            {selectedLayer === 'presentation' && (
              <div className="space-y-3">
                <div className="flex items-center space-x-2 text-blue-400 font-extrabold text-sm">
                  <Smartphone className="w-4 h-4" />
                  <span>Couche 4 : Présentation (React UI Layer)</span>
                </div>
                <p className="text-xs text-slate-300 leading-relaxed">
                  La couche UI regroupe les vues Voyageur, Admin Agence, Admin Hôtel et Super Admin. Les composants React font appel au hook `useHexagonalArchitecture()` pour exécuter des Use Cases sans intégrer aucune règle métier complexe.
                </p>
              </div>
            )}
          </div>

          {/* Domain Isolation Rules Matrix */}
          <div className="p-4 bg-slate-950 border border-slate-800 rounded-2xl space-y-3 text-xs">
            <h3 className="font-extrabold text-white flex items-center space-x-2">
              <Shield className="w-4 h-4 text-emerald-400" />
              <span>Matrice d'Isolation des Domaines Métier & Gouvernance RBAC</span>
            </h3>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-center text-[11px]">
              <div className="p-2.5 rounded-xl bg-slate-900 border border-slate-800 font-bold text-orange-300">
                Transport : 100% Autonome
              </div>
              <div className="p-2.5 rounded-xl bg-slate-900 border border-slate-800 font-bold text-blue-300">
                Hôtellerie : 100% Autonome
              </div>
              <div className="p-2.5 rounded-xl bg-slate-900 border border-slate-800 font-bold text-purple-300">
                Vision IA : 100% Autonome
              </div>
              <div className="p-2.5 rounded-xl bg-slate-900 border border-slate-800 font-bold text-amber-300">
                IPTV : 100% Autonome
              </div>
            </div>
          </div>

        </div>
      )}

    </div>
  );
};
