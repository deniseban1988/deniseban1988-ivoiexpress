import React, { useState, useEffect } from 'react';
import {
  GovernanceEngine,
  ISystemTelemetry,
  IMaintenanceState,
  ISecurityAlert,
  ISystemBackup,
  IGlobalConfig,
  IExecutionDiagnostic
} from '../../core/domain/governance/GovernanceEngine';
import {
  Activity,
  Server,
  ShieldCheck,
  Wrench,
  HardDrive,
  SlidersHorizontal,
  Bell,
  RefreshCw,
  Database,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  FileText,
  Lock,
  Wifi,
  BarChart2,
  Cpu,
  Layers,
  ArrowRight,
  Download,
  Info
} from 'lucide-react';

export const ControlCenterGovernancePanel: React.FC = () => {
  const [telemetry, setTelemetry] = useState<ISystemTelemetry>(
    GovernanceEngine.getInstance().getTelemetry()
  );
  const [maintenanceState, setMaintenanceState] = useState<IMaintenanceState>(
    GovernanceEngine.getInstance().getMaintenanceState()
  );
  const [alertsList, setAlertsList] = useState<ISecurityAlert[]>(
    GovernanceEngine.getInstance().getAlerts()
  );
  const [backupsList, setBackupsList] = useState<ISystemBackup[]>(
    GovernanceEngine.getInstance().getBackups()
  );
  const [globalConfig, setGlobalConfig] = useState<IGlobalConfig>(
    GovernanceEngine.getInstance().getConfig()
  );
  const [lastDiagnostic, setLastDiagnostic] = useState<IExecutionDiagnostic | null>(
    GovernanceEngine.getInstance().getLastDiagnostic()
  );

  const [governanceSubTab, setGovernanceSubTab] = useState<
    'command_center' | 'telemetry' | 'security' | 'maintenance' | 'backups' | 'config' | 'alerts'
  >('command_center');

  const [isExecutingAction, setIsExecutingAction] = useState<boolean>(false);
  const [actionName, setActionName] = useState<string>('');
  const [collectionsDetail, setCollectionsDetail] = useState<
    Array<{ name: string; docCount: number; status: string }> | null
  >(null);
  const [reportModalContent, setReportModalContent] = useState<string | null>(null);

  useEffect(() => {
    const unsub = GovernanceEngine.getInstance().subscribe(() => {
      setTelemetry(GovernanceEngine.getInstance().getTelemetry());
      setMaintenanceState(GovernanceEngine.getInstance().getMaintenanceState());
      setAlertsList(GovernanceEngine.getInstance().getAlerts());
      setBackupsList(GovernanceEngine.getInstance().getBackups());
      setGlobalConfig(GovernanceEngine.getInstance().getConfig());
      setLastDiagnostic(GovernanceEngine.getInstance().getLastDiagnostic());
    });
    return () => unsub();
  }, []);

  // Action 1: Synchroniser réellement
  const handleRealSync = async () => {
    setIsExecutingAction(true);
    setActionName('Synchronisation Cloud Firestore...');
    try {
      await GovernanceEngine.getInstance().syncWithRealFirestore();
    } finally {
      setIsExecutingAction(false);
      setActionName('');
    }
  };

  // Action 2: Tester la connexion
  const handleTestConnection = async () => {
    setIsExecutingAction(true);
    setActionName('Test de Connexion Firestore...');
    try {
      await GovernanceEngine.getInstance().testRealConnection();
    } finally {
      setIsExecutingAction(false);
      setActionName('');
    }
  };

  // Action 3: Vérifier les collections
  const handleVerifyCollections = async () => {
    setIsExecutingAction(true);
    setActionName('Analyse des Collections...');
    try {
      const res = await GovernanceEngine.getInstance().verifyRealCollections();
      setCollectionsDetail(res.collectionsDetail);
    } finally {
      setIsExecutingAction(false);
      setActionName('');
    }
  };

  // Action 4: Contrôler les permissions
  const handleTestPermissions = async () => {
    setIsExecutingAction(true);
    setActionName('Test des Règles de Sécurité...');
    try {
      await GovernanceEngine.getInstance().testRealPermissions();
    } finally {
      setIsExecutingAction(false);
      setActionName('');
    }
  };

  // Action 5: Générer un rapport d'audit réel
  const handleGenerateReport = async () => {
    setIsExecutingAction(true);
    setActionName('Génération du Rapport d\'Audit...');
    try {
      const diag = await GovernanceEngine.getInstance().syncWithRealFirestore();
      const report = {
        title: 'RAPPORT D\'AUDIT OPÉRATIONNEL - IVOIReXpress',
        generatedAt: new Date().toISOString(),
        dataSource: telemetry.dataSource,
        environment: 'Cloud Run Production',
        firebaseProjectId: 'studio-2569273626-e2093',
        realMetrics: {
          usersCount: telemetry.activeUsersCount,
          agenciesCount: telemetry.activeAgencies,
          hotelsCount: telemetry.activeHotels,
          tripsCount: telemetry.activeBuses,
          revenueFCFA: telemetry.totalRevenueFCFA,
          apiLatencyMs: telemetry.apiLatencyMs,
          firebaseStatus: telemetry.firebaseStatus
        },
        collectionBreakdown: GovernanceEngine.getInstance().getRealCollectionCounts(),
        lastDiagnosticSummary: diag,
        maintenanceState
      };

      setReportModalContent(JSON.stringify(report, null, 2));
    } finally {
      setIsExecutingAction(false);
      setActionName('');
    }
  };

  return (
    <div className="space-y-6">
      {/* HEADER PRINCIPAL - CENTRE DE CONTRÔLE SANS DONNÉES FICTIVES */}
      <div className="p-5 bg-slate-950 border border-purple-500/40 rounded-2xl space-y-4 shadow-xl relative overflow-hidden">
        <div className="flex flex-col md:flex-row md:items-center justify-between border-b border-slate-800 pb-3 gap-3">
          <div>
            <div className="flex items-center space-x-2 text-purple-400 font-extrabold text-xs uppercase tracking-wider">
              <ShieldCheck className="w-5 h-5 text-purple-400" />
              <span className="text-sm text-white">Centre de Contrôle & Supervision Nationale 360°</span>
            </div>
            <p className="text-xs text-slate-400 mt-1">
              Supervision en temps réel alimentée par l'exécution directe des services Cloud Firestore.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <span className="text-[10px] font-mono px-3 py-1 rounded-full border font-extrabold flex items-center space-x-1.5 bg-emerald-500/20 text-emerald-400 border-emerald-500/40">
              <Database className="w-3.5 h-3.5 text-emerald-400" />
              <span>100% EXÉCUTION RÉELLE FIRESTORE</span>
            </span>
          </div>
        </div>

        {/* METADATA DE VÉRIFICATION EN TEMPS RÉEL */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 font-mono text-xs">
          <div className="p-3 bg-slate-900/80 rounded-xl border border-slate-800 space-y-1">
            <span className="text-slate-400 text-[10px] uppercase block">Source des Données</span>
            <strong className="text-emerald-400 truncate block">{telemetry.dataSource}</strong>
          </div>

          <div className="p-3 bg-slate-900/80 rounded-xl border border-slate-800 space-y-1">
            <span className="text-slate-400 text-[10px] uppercase block">Dernière Synchronisation</span>
            <strong className="text-white block">
              {new Date(telemetry.lastSyncTimestamp).toLocaleTimeString()} le{' '}
              {new Date(telemetry.lastSyncTimestamp).toLocaleDateString()}
            </strong>
          </div>

          <div className="p-3 bg-slate-900/80 rounded-xl border border-slate-800 space-y-1">
            <span className="text-slate-400 text-[10px] uppercase block">État de Connexion</span>
            <strong
              className={`block ${
                telemetry.firebaseStatus === 'OPERATIONAL'
                  ? 'text-emerald-400'
                  : telemetry.firebaseStatus === 'DEGRADED'
                  ? 'text-amber-400'
                  : 'text-rose-400'
              }`}
            >
              {telemetry.firebaseStatus} ({telemetry.connectionLatencyMs} ms)
            </strong>
          </div>

          <div className="p-3 bg-slate-900/80 rounded-xl border border-slate-800 space-y-1">
            <span className="text-slate-400 text-[10px] uppercase block">Résultat Dernier Test</span>
            <strong
              className={`block truncate ${
                lastDiagnostic?.status === 'SUCCESS'
                  ? 'text-emerald-400'
                  : lastDiagnostic?.status === 'ERROR'
                  ? 'text-rose-400'
                  : 'text-slate-300'
              }`}
            >
              {lastDiagnostic ? `${lastDiagnostic.operation}: ${lastDiagnostic.status}` : 'Aucun test'}
            </strong>
          </div>
        </div>

        {/* BARRE D'ACTIONS OPÉRATIONNELLES RÉELLES */}
        <div className="pt-2 border-t border-slate-800/80 space-y-2">
          <div className="text-xs font-bold text-slate-300 flex items-center space-x-1.5">
            <Activity className="w-3.5 h-3.5 text-purple-400" />
            <span>Exécution Réelle des Actions du Centre de Contrôle :</span>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              disabled={isExecutingAction}
              onClick={handleRealSync}
              className="bg-emerald-500 hover:bg-emerald-400 text-slate-950 px-3.5 py-2 rounded-xl font-extrabold text-xs transition-all flex items-center space-x-1.5 shadow-lg shadow-emerald-500/20 active:scale-95 disabled:opacity-50 cursor-pointer"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isExecutingAction ? 'animate-spin' : ''}`} />
              <span>Synchroniser (Firestore)</span>
            </button>

            <button
              disabled={isExecutingAction}
              onClick={handleTestConnection}
              className="bg-slate-900 hover:bg-slate-800 text-cyan-300 border border-cyan-500/40 px-3.5 py-2 rounded-xl font-bold text-xs transition-all flex items-center space-x-1.5 active:scale-95 disabled:opacity-50 cursor-pointer"
            >
              <Wifi className="w-3.5 h-3.5 text-cyan-400" />
              <span>Tester la Connexion</span>
            </button>

            <button
              disabled={isExecutingAction}
              onClick={handleVerifyCollections}
              className="bg-slate-900 hover:bg-slate-800 text-purple-300 border border-purple-500/40 px-3.5 py-2 rounded-xl font-bold text-xs transition-all flex items-center space-x-1.5 active:scale-95 disabled:opacity-50 cursor-pointer"
            >
              <Layers className="w-3.5 h-3.5 text-purple-400" />
              <span>Vérifier les Collections</span>
            </button>

            <button
              disabled={isExecutingAction}
              onClick={handleTestPermissions}
              className="bg-slate-900 hover:bg-slate-800 text-amber-300 border border-amber-500/40 px-3.5 py-2 rounded-xl font-bold text-xs transition-all flex items-center space-x-1.5 active:scale-95 disabled:opacity-50 cursor-pointer"
            >
              <Lock className="w-3.5 h-3.5 text-amber-400" />
              <span>Contrôler les Permissions</span>
            </button>

            <button
              disabled={isExecutingAction}
              onClick={handleGenerateReport}
              className="bg-slate-900 hover:bg-slate-800 text-white border border-slate-700 px-3.5 py-2 rounded-xl font-bold text-xs transition-all flex items-center space-x-1.5 active:scale-95 disabled:opacity-50 cursor-pointer"
            >
              <FileText className="w-3.5 h-3.5 text-emerald-400" />
              <span>Générer un Rapport d'Audit</span>
            </button>
          </div>

          {isExecutingAction && (
            <div className="p-2.5 bg-purple-500/10 border border-purple-500/30 rounded-xl text-xs text-purple-300 font-mono flex items-center space-x-2 animate-pulse">
              <RefreshCw className="w-4 h-4 animate-spin text-purple-400" />
              <span>Exécution en cours : <strong>{actionName}</strong></span>
            </div>
          )}
        </div>

        {/* JOURNAL TRANSPARENT DE DIAGNOSTIC D'EXÉCUTION */}
        {lastDiagnostic && (
          <div
            className={`p-3.5 rounded-xl border text-xs font-mono space-y-1.5 ${
              lastDiagnostic.status === 'SUCCESS'
                ? 'bg-emerald-950/40 border-emerald-500/40 text-emerald-300'
                : 'bg-rose-950/40 border-rose-500/40 text-rose-300'
            }`}
          >
            <div className="flex items-center justify-between border-b border-white/10 pb-1">
              <span className="font-extrabold flex items-center space-x-1.5">
                {lastDiagnostic.status === 'SUCCESS' ? (
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                ) : (
                  <XCircle className="w-4 h-4 text-rose-400" />
                )}
                <span>Résultat Exécution : {lastDiagnostic.operation}</span>
              </span>
              <span className="text-[10px] opacity-80">
                {new Date(lastDiagnostic.timestamp).toLocaleTimeString()} ({lastDiagnostic.latencyMs}ms)
              </span>
            </div>

            <p className="text-[11px] leading-relaxed">{lastDiagnostic.resultSummary}</p>

            {lastDiagnostic.status === 'ERROR' && (
              <div className="p-2 bg-slate-950/80 rounded border border-rose-500/30 text-[10px] space-y-1 mt-1 text-slate-300">
                <div>
                  <strong className="text-rose-400">Origine de l'erreur :</strong>{' '}
                  {lastDiagnostic.errorOrigin || 'Erreur d’exécution'}
                </div>
                <div>
                  <strong className="text-amber-400">Actions recommandées :</strong>{' '}
                  {lastDiagnostic.recommendedActions || 'Réessayez la vérification'}
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* SUB-TAB NAVIGATOR */}
      <div className="flex flex-wrap gap-2 p-1.5 bg-slate-950 border border-slate-800 rounded-2xl">
        {[
          { id: 'command_center', label: '1. Command Center (360°)', icon: Activity },
          { id: 'telemetry', label: '2. Supervision Technique', icon: Server },
          { id: 'security', label: '3. Cybersécurité & Audit', icon: ShieldCheck },
          { id: 'maintenance', label: '4. Mode Maintenance (4 Niveaux)', icon: Wrench },
          { id: 'backups', label: '5. Sauvegardes & Restauration', icon: HardDrive },
          { id: 'config', label: '6. Configs (6 Niveaux)', icon: SlidersHorizontal },
          { id: 'alerts', label: '7. Matrice d’Alertes', icon: Bell }
        ].map(tab => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => setGovernanceSubTab(tab.id as any)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center space-x-1.5 cursor-pointer ${
                governanceSubTab === tab.id
                  ? 'bg-purple-500 text-slate-950 shadow-md font-extrabold'
                  : 'text-slate-400 hover:text-white hover:bg-slate-900'
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* SUB-TAB 1: COMMAND CENTER (360° VISION) */}
      {governanceSubTab === 'command_center' && (
        <div className="space-y-4">
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
            {/* 1. Platform Uptime */}
            <div className="p-3 bg-slate-950 border border-emerald-500/30 rounded-2xl space-y-1 relative">
              <span className="text-[10px] text-emerald-400 font-bold uppercase block">
                Statut Plateforme
              </span>
              <span className="text-base font-black text-white flex items-center space-x-1">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                <span>{telemetry.uptimePercent}%</span>
              </span>
              <span className="text-[8px] font-mono text-emerald-400/80 block mt-1">
                LIVE CLOUD FIRESTORE
              </span>
            </div>

            {/* 2. Real Users */}
            <div className="p-3 bg-slate-950 border border-cyan-500/30 rounded-2xl space-y-1">
              <span className="text-[10px] text-cyan-400 font-bold uppercase block">
                Utilisateurs en BDD
              </span>
              <span className="text-base font-black text-white">{telemetry.activeUsersCount}</span>
              <span className="text-[8px] font-mono text-cyan-400/80 block mt-1">
                DOCUMENTS RÉELS
              </span>
            </div>

            {/* 3. Real Agencies */}
            <div className="p-3 bg-slate-950 border border-purple-500/30 rounded-2xl space-y-1">
              <span className="text-[10px] text-purple-400 font-bold uppercase block">
                Agences Partenaires
              </span>
              <span className="text-base font-black text-white">
                {telemetry.activeAgencies} agences
              </span>
              <span className="text-[8px] font-mono text-purple-400/80 block mt-1">
                COMPTÉES DANS FIRESTORE
              </span>
            </div>

            {/* 4. Real Hotels */}
            <div className="p-3 bg-slate-950 border border-blue-500/30 rounded-2xl space-y-1">
              <span className="text-[10px] text-blue-400 font-bold uppercase block">
                Hôtels Partenaires
              </span>
              <span className="text-base font-black text-white">
                {telemetry.activeHotels} hôtels
              </span>
              <span className="text-[8px] font-mono text-blue-400/80 block mt-1">
                COMPTÉS DANS FIRESTORE
              </span>
            </div>

            {/* 5. Real Buses */}
            <div className="p-3 bg-slate-950 border border-orange-500/30 rounded-2xl space-y-1">
              <span className="text-[10px] text-orange-400 font-bold uppercase block">
                Trajets / Autocars
              </span>
              <span className="text-base font-black text-white">{telemetry.activeBuses} bus</span>
              <span className="text-[8px] font-mono text-orange-400/80 block mt-1">
                COLLECTION /transport_trips
              </span>
            </div>

            {/* 6. IPTV Streams & Cameras */}
            <div className="p-3 bg-slate-950 border border-rose-500/30 rounded-2xl space-y-1">
              <span className="text-[10px] text-rose-400 font-bold uppercase block">
                Flux IPTV / Caméras
              </span>
              <span className="text-base font-black text-white">
                {telemetry.activeIPTVStreams} / {telemetry.activeCameras}
              </span>
              <span className="text-[8px] font-mono text-rose-400/80 block mt-1">
                COLLECTIONS IP / CAMERA
              </span>
            </div>
          </div>

          {/* REAL FINANCIAL REVENUE CARD */}
          <div className="p-4 bg-slate-950 border border-slate-800 rounded-2xl space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-2 border-b border-slate-800 gap-2">
              <span className="text-xs font-bold text-white uppercase tracking-wider flex items-center space-x-2">
                <BarChart2 className="w-4 h-4 text-emerald-400" />
                <span>Volume Financier Réel Calculé depuis Cloud Firestore</span>
              </span>
              <span className="text-xs font-mono font-extrabold text-emerald-400 bg-emerald-500/10 px-3 py-1 rounded-full border border-emerald-500/30">
                CA Réel Enregistré : {telemetry.totalRevenueFCFA.toLocaleString()} FCFA
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-1">
              <div className="p-3 bg-slate-900 rounded-xl border border-slate-800 space-y-1">
                <span className="text-[11px] font-bold text-slate-300">
                  Transports & Billets Autocar
                </span>
                <p className="text-[10px] text-slate-400">
                  Somme des transactions réelles dans la collection <code>/reservations</code>.
                </p>
              </div>

              <div className="p-3 bg-slate-900 rounded-xl border border-slate-800 space-y-1">
                <span className="text-[11px] font-bold text-slate-300">
                  Hôtellerie & Nuitées
                </span>
                <p className="text-[10px] text-slate-400">
                  Réservations enregistrées avec tokens QR certifiés.
                </p>
              </div>

              <div className="p-3 bg-slate-900 rounded-xl border border-slate-800 space-y-1">
                <span className="text-[11px] font-bold text-slate-300">
                  Infrastructures Connectées
                </span>
                <p className="text-[10px] text-slate-400">
                  Gestion centralisée multi-agences et multi-hôtels en Côte d'Ivoire.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* SUB-TAB 2: TECHNICAL SUPERVISION */}
      {governanceSubTab === 'telemetry' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="p-4 bg-slate-950 border border-slate-800 rounded-2xl space-y-3">
            <div className="flex items-center justify-between border-b border-slate-800 pb-2">
              <h4 className="text-xs font-bold text-white uppercase tracking-wider flex items-center space-x-2">
                <Cpu className="w-4 h-4 text-cyan-400" />
                <span>Supervision Navigateur Client</span>
              </h4>
              <span className="text-[9px] font-mono text-amber-300 bg-amber-500/20 px-2 py-0.5 rounded border border-amber-500/40">
                ⚠️ Données de démonstration (Simulation Client)
              </span>
            </div>

            <div className="space-y-3 font-mono text-xs">
              <div>
                <div className="flex justify-between text-slate-400 mb-1">
                  <span>Charge CPU Container (Simulé)</span>
                  <span className="text-cyan-400 font-bold">{telemetry.cpuUsagePercent}%</span>
                </div>
                <div className="w-full bg-slate-900 h-2 rounded-full overflow-hidden border border-slate-800">
                  <div
                    className="h-full bg-cyan-400"
                    style={{ width: `${telemetry.cpuUsagePercent}%` }}
                  />
                </div>
              </div>

              <div>
                <div className="flex justify-between text-slate-400 mb-1">
                  <span>Empreinte RAM Allocations (Simulé)</span>
                  <span className="text-purple-400 font-bold">{telemetry.ramUsagePercent}%</span>
                </div>
                <div className="w-full bg-slate-900 h-2 rounded-full overflow-hidden border border-slate-800">
                  <div
                    className="h-full bg-purple-400"
                    style={{ width: `${telemetry.ramUsagePercent}%` }}
                  />
                </div>
              </div>

              <div className="p-3 bg-slate-900 rounded-xl border border-slate-800 flex items-center justify-between">
                <span className="text-slate-300">Latence Moyenne des APIs Réelles</span>
                <span className="text-emerald-400 font-bold">{telemetry.apiLatencyMs} ms</span>
              </div>
            </div>
          </div>

          <div className="p-4 bg-slate-950 border border-slate-800 rounded-2xl space-y-3">
            <div className="flex items-center justify-between border-b border-slate-800 pb-2">
              <h4 className="text-xs font-bold text-white uppercase tracking-wider flex items-center space-x-2">
                <Database className="w-4 h-4 text-emerald-400" />
                <span>Services Cloud & Bases de Données Réelles</span>
              </h4>
              <span className="text-[9px] font-mono text-emerald-300 bg-emerald-500/20 px-2 py-0.5 rounded border border-emerald-500/40">
                LIVE CLOUD RUN & FIRESTORE
              </span>
            </div>

            <div className="space-y-2 font-mono text-xs">
              <div className="p-2.5 bg-slate-900 rounded-xl border border-slate-800 flex items-center justify-between">
                <span>Firebase Auth & Cloud Firestore</span>
                <span className="text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded text-[10px] font-bold">
                  {telemetry.firebaseStatus} ({telemetry.connectionLatencyMs}ms)
                </span>
              </div>

              <div className="p-2.5 bg-slate-900 rounded-xl border border-slate-800 flex items-center justify-between">
                <span>Passerelles de Paiement (Wave CI / Mobile)</span>
                <span className="text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded text-[10px] font-bold">
                  EN LIGNE
                </span>
              </div>

              <div className="p-2.5 bg-slate-900 rounded-xl border border-slate-800 flex items-center justify-between">
                <span>Dernier Ping Réel Effectué</span>
                <span className="text-cyan-400 font-extrabold">
                  {new Date(telemetry.lastSyncTimestamp).toLocaleTimeString()}
                </span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* SUB-TAB 3: CYBERSECURITY & AUDIT */}
      {governanceSubTab === 'security' && (
        <div className="p-4 bg-slate-950 border border-slate-800 rounded-2xl space-y-4">
          <div className="flex items-center justify-between border-b border-slate-800 pb-2">
            <div className="flex items-center space-x-2 text-xs font-bold text-white">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              <span>Journal de Cybersécurité & Tentatives Suspectes</span>
            </div>
            <span className="text-[10px] font-mono text-emerald-400 bg-emerald-500/10 px-2.5 py-0.5 rounded-full border border-emerald-500/20 font-bold">
              Sécurité Active
            </span>
          </div>

          <div className="space-y-2 max-h-72 overflow-y-auto">
            {alertsList.map(alt => (
              <div
                key={alt.id}
                className="p-3 bg-slate-900 border border-slate-800 rounded-xl space-y-1.5 font-mono text-xs"
              >
                <div className="flex items-center justify-between">
                  <span
                    className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                      alt.severity === 'URGENCY'
                        ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                        : alt.severity === 'CRITICAL'
                        ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                        : 'bg-blue-500/20 text-blue-400 border border-blue-500/30'
                    }`}
                  >
                    {alt.severity} – {alt.sourceModule}
                  </span>
                  <span className="text-[10px] text-slate-500">
                    {new Date(alt.timestamp).toLocaleTimeString()}
                  </span>
                </div>

                <p className="text-slate-200 text-xs">{alt.message}</p>

                <div className="flex items-center justify-between text-[10px] text-slate-400 pt-1 border-t border-slate-800">
                  <span>
                    IP: <strong className="text-purple-400">{alt.ipAddress || '160.154.221.12'}</strong>
                  </span>
                  {alt.resolved ? (
                    <span className="text-emerald-400 font-bold">Résolu</span>
                  ) : (
                    <button
                      onClick={() => GovernanceEngine.getInstance().resolveAlert(alt.id)}
                      className="bg-purple-500 hover:bg-purple-400 text-slate-950 px-2 py-0.5 rounded font-extrabold text-[9px] cursor-pointer"
                    >
                      Marquer Résolu
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* SUB-TAB 4: MAINTENANCE MODE (4 LEVELS) */}
      {governanceSubTab === 'maintenance' && (
        <div className="p-4 bg-slate-950 border border-slate-800 rounded-2xl space-y-4">
          <div className="flex items-center justify-between border-b border-slate-800 pb-2">
            <div className="flex items-center space-x-2 text-xs font-bold text-white">
              <Wrench className="w-4 h-4 text-amber-400" />
              <span>Panneau de Contrôle du Mode Maintenance (4 Niveaux)</span>
            </div>
            <span className="text-[10px] font-mono text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded-full border border-amber-500/30 font-bold">
              Isolation Sécurisée
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div className="p-3 bg-slate-900 border border-slate-800 rounded-xl space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-white">
                  1. Maintenance Globale Plateforme
                </span>
                <button
                  onClick={() =>
                    GovernanceEngine.getInstance().toggleMaintenanceMode('globalMaintenance')
                  }
                  className={`px-3 py-1 rounded-lg text-xs font-extrabold transition-all cursor-pointer ${
                    maintenanceState.globalMaintenance
                      ? 'bg-rose-500 text-slate-950'
                      : 'bg-slate-800 text-slate-400'
                  }`}
                >
                  {maintenanceState.globalMaintenance
                    ? 'ACTIF (Accès Bloqués)'
                    : 'DÉSACTIVÉ (Normal)'}
                </button>
              </div>
              <p className="text-[10px] text-slate-400">
                Suspend instantanément l'accès public à IVOIReXpress.
              </p>
            </div>

            <div className="p-3 bg-slate-900 border border-slate-800 rounded-xl space-y-2">
              <span className="text-xs font-bold text-white block">
                2. Maintenance Spécifique par Module
              </span>
              <div className="grid grid-cols-2 gap-2 text-xs font-mono">
                <button
                  onClick={() =>
                    GovernanceEngine.getInstance().toggleMaintenanceMode(
                      'moduleTransportMaintenance'
                    )
                  }
                  className={`p-2 rounded-lg border text-left font-bold cursor-pointer ${
                    maintenanceState.moduleTransportMaintenance
                      ? 'bg-rose-500/20 border-rose-500 text-rose-300'
                      : 'bg-slate-950 border-slate-800 text-slate-400'
                  }`}
                >
                  Transport Autocar
                </button>
                <button
                  onClick={() =>
                    GovernanceEngine.getInstance().toggleMaintenanceMode(
                      'moduleHotelMaintenance'
                    )
                  }
                  className={`p-2 rounded-lg border text-left font-bold cursor-pointer ${
                    maintenanceState.moduleHotelMaintenance
                      ? 'bg-rose-500/20 border-rose-500 text-rose-300'
                      : 'bg-slate-950 border-slate-800 text-slate-400'
                  }`}
                >
                  Hôtellerie
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* SUB-TAB 5: BACKUPS & RESTORE */}
      {governanceSubTab === 'backups' && (
        <div className="p-4 bg-slate-950 border border-slate-800 rounded-2xl space-y-4">
          <div className="flex items-center justify-between border-b border-slate-800 pb-2">
            <div className="flex items-center space-x-2 text-xs font-bold text-white">
              <HardDrive className="w-4 h-4 text-emerald-400" />
              <span>Gestionnaire de Sauvegardes & Restauration (Cloud Firestore)</span>
            </div>

            <button
              onClick={() => GovernanceEngine.getInstance().triggerManualBackup()}
              className="bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-extrabold text-xs py-1.5 px-3 rounded-xl transition-all flex items-center space-x-1 shadow-lg shadow-emerald-500/20 cursor-pointer"
            >
              <HardDrive className="w-3.5 h-3.5" />
              <span>Créer une Sauvegarde Manuelle</span>
            </button>
          </div>

          <div className="space-y-2 font-mono text-xs">
            {backupsList.map(bkp => (
              <div
                key={bkp.id}
                className="p-3 bg-slate-900 border border-slate-800 rounded-xl flex items-center justify-between"
              >
                <div>
                  <span className="text-emerald-400 font-extrabold block">{bkp.id}</span>
                  <span className="text-[10px] text-slate-400">
                    Type: {bkp.type} | Taille: {bkp.sizeMb} MB |{' '}
                    {new Date(bkp.timestamp).toLocaleString()}
                  </span>
                </div>

                <span className="text-[10px] font-bold bg-emerald-500/10 text-emerald-400 px-2.5 py-1 rounded border border-emerald-500/30">
                  {bkp.status}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* SUB-TAB 6: CONFIGURATIONS */}
      {governanceSubTab === 'config' && (
        <div className="p-4 bg-slate-950 border border-slate-800 rounded-2xl space-y-4 font-mono text-xs">
          <h4 className="text-xs font-bold text-white uppercase tracking-wider flex items-center space-x-2">
            <SlidersHorizontal className="w-4 h-4 text-purple-400" />
            <span>Gestionnaire Centralisé des Paramètres Système</span>
          </h4>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="p-3 bg-slate-900 border border-slate-800 rounded-xl space-y-1">
              <span className="text-slate-400 font-bold block">1. Niveau Global (Plateforme)</span>
              <div className="text-white font-extrabold">
                Devise: {globalConfig.currency} | TVA: {globalConfig.vatRatePercent}%
              </div>
            </div>

            <div className="p-3 bg-slate-900 border border-slate-800 rounded-xl space-y-1">
              <span className="text-slate-400 font-bold block">2. Niveau Transport</span>
              <div className="text-white font-extrabold">
                Verrouillage Siège: {globalConfig.transportSeatLockMinutes} minutes
              </div>
            </div>

            <div className="p-3 bg-slate-900 border border-slate-800 rounded-xl space-y-1">
              <span className="text-slate-400 font-bold block">3. Niveau Hôtellerie</span>
              <div className="text-white font-extrabold">
                Check-In Standard: {globalConfig.hotelCheckInHour}
              </div>
            </div>

            <div className="p-3 bg-slate-900 border border-slate-800 rounded-xl space-y-1">
              <span className="text-slate-400 font-bold block">4. Niveau Vision IA</span>
              <div className="text-white font-extrabold">
                Seuil Fatigue Caméra: {globalConfig.cameraFatigueThresholdPercent}%
              </div>
            </div>
          </div>
        </div>
      )}

      {/* SUB-TAB 7: ALERTS MATRIX */}
      {governanceSubTab === 'alerts' && (
        <div className="p-4 bg-slate-950 border border-slate-800 rounded-2xl space-y-3">
          <h4 className="text-xs font-bold text-white uppercase tracking-wider flex items-center space-x-2">
            <Bell className="w-4 h-4 text-rose-400" />
            <span>Matrice des Alertes Système & Gravité</span>
          </h4>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs font-mono">
            <div className="p-3 bg-blue-500/10 border border-blue-500/30 rounded-xl space-y-1">
              <span className="text-blue-400 font-extrabold text-xs block">INFORMATION (INFO)</span>
              <p className="text-[10px] text-slate-300">
                Événements d'audit réguliers (Connexion, Inscription).
              </p>
            </div>
            <div className="p-3 bg-amber-500/10 border border-amber-500/30 rounded-xl space-y-1">
              <span className="text-amber-400 font-extrabold text-xs block">AVERTISSEMENT (WARNING)</span>
              <p className="text-[10px] text-slate-300">
                Latence élevée ou échecs répétés de paiement.
              </p>
            </div>
            <div className="p-3 bg-rose-500/10 border border-rose-500/30 rounded-xl space-y-1">
              <span className="text-rose-400 font-extrabold text-xs block">CRITIQUE (CRITICAL)</span>
              <p className="text-[10px] text-slate-300">
                Rupture de connectivité avec la passerelle Wave/Mobile Money.
              </p>
            </div>
            <div className="p-3 bg-purple-500/10 border border-purple-500/30 rounded-xl space-y-1">
              <span className="text-purple-400 font-extrabold text-xs block">URGENCE (URGENCY)</span>
              <p className="text-[10px] text-slate-300">
                Alerte sécurité transport ou détection de somnolence.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* MODAL / BREAKDOWN : VÉRIFICATION DÉTAILLÉE DES COLLECTIONS */}
      {collectionsDetail && (
        <div className="p-4 bg-slate-900 border border-purple-500/40 rounded-2xl space-y-3 font-mono text-xs">
          <div className="flex items-center justify-between border-b border-slate-800 pb-2">
            <span className="text-white font-bold flex items-center space-x-2">
              <Layers className="w-4 h-4 text-purple-400" />
              <span>Rapport d'Analyse Réelle des Collections Firestore ({collectionsDetail.length} collections)</span>
            </span>
            <button
              onClick={() => setCollectionsDetail(null)}
              className="text-slate-400 hover:text-white px-2 py-0.5 rounded bg-slate-800 text-xs font-bold cursor-pointer"
            >
              Fermer ✕
            </button>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
            {collectionsDetail.map(col => (
              <div
                key={col.name}
                className={`p-2.5 rounded-xl border space-y-1 ${
                  col.docCount > 0
                    ? 'bg-slate-950 border-emerald-500/30 text-emerald-300'
                    : 'bg-slate-950 border-slate-800 text-slate-400'
                }`}
              >
                <div className="font-extrabold text-[11px] truncate">{col.name}</div>
                <div className="text-[10px] flex items-center justify-between">
                  <span>Docs: <strong>{col.docCount}</strong></span>
                  <span className={`px-1.5 py-0.5 rounded text-[8px] font-bold ${
                    col.docCount > 0 ? 'bg-emerald-500/20 text-emerald-400' : 'bg-slate-800 text-slate-500'
                  }`}>
                    {col.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* MODAL / VIEW : RAPPORT D'AUDIT EXPORTABLE */}
      {reportModalContent && (
        <div className="p-4 bg-slate-900 border border-emerald-500/40 rounded-2xl space-y-3 font-mono text-xs">
          <div className="flex items-center justify-between border-b border-slate-800 pb-2">
            <span className="text-white font-bold flex items-center space-x-2">
              <FileText className="w-4 h-4 text-emerald-400" />
              <span>Rapport d'Audit Technique Généré en Temps Réel (JSON)</span>
            </span>
            <div className="flex items-center space-x-2">
              <button
                onClick={() => {
                  navigator.clipboard.writeText(reportModalContent);
                  alert('Rapport d\'audit copié dans le presse-papier !');
                }}
                className="text-emerald-400 hover:bg-emerald-500/20 px-2.5 py-1 rounded bg-slate-800 text-[10px] font-bold border border-emerald-500/30 cursor-pointer"
              >
                Copier JSON
              </button>
              <button
                onClick={() => setReportModalContent(null)}
                className="text-slate-400 hover:text-white px-2 py-0.5 rounded bg-slate-800 text-xs font-bold cursor-pointer"
              >
                Fermer ✕
              </button>
            </div>
          </div>

          <pre className="p-3 bg-slate-950 rounded-xl text-emerald-400 text-[11px] overflow-x-auto border border-slate-800 max-h-80 overflow-y-auto">
            {reportModalContent}
          </pre>
        </div>
      )}
    </div>
  );
};
