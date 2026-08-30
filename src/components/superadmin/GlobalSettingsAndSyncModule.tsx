import React, { useState, useEffect } from 'react';
import {
  Settings,
  Globe,
  Users,
  Bus,
  Hotel,
  Eye,
  Tv,
  Sparkles,
  Bell,
  CreditCard,
  RefreshCw,
  ShieldCheck,
  RotateCcw,
  CheckCircle2,
  AlertTriangle,
  History,
  Layers,
  Save,
  Lock,
  Plus,
  Trash2,
  FileText,
  Building2,
  Check,
  Code,
  Smartphone,
  Tablet,
  Monitor,
  ExternalLink,
  Activity,
  Key,
  Database,
  Radio,
  Image as ImageIcon,
  Share2,
  X,
  Play,
  MapPin,
  Sliders,
  Video,
  Wifi,
  Zap,
  Cpu,
  ChevronLeft,
  ChevronRight,
  Grid,
  ListFilter
} from 'lucide-react';
import { SystemConfigEngine } from '../../core/domain/governance/SystemConfigEngine';
import { HierarchicalSettings, ApiIntegration, TenantCustomization } from '../../types/settings';
import { MediaManagementCenter } from './MediaManagementCenter';

export const GlobalSettingsAndSyncModule: React.FC = () => {
  const configEngine = SystemConfigEngine.getInstance();
  const [settings, setSettings] = useState<HierarchicalSettings>(configEngine.getSettings());
  const [activeSubTab, setActiveSubTab] = useState<
    'general' | 'rbac' | 'transport' | 'hotel' | 'vision' | 'iptv' | 'ai' | 'notifications' | 'financial' | 'integrations' | 'tenants' | 'sync' | 'media'
  >('general');

  const [versionHistory, setVersionHistory] = useState(configEngine.getVersionHistory());
  const [conflicts, setConflicts] = useState(configEngine.getConflicts());
  const [auditLogs, setAuditLogs] = useState(configEngine.getAuditLogs());
  const [apiIntegrations, setApiIntegrations] = useState<ApiIntegration[]>(configEngine.getApiIntegrations());
  const [tenantCustomizations, setTenantCustomizations] = useState<TenantCustomization[]>(configEngine.getTenantCustomizations());

  const [notificationMsg, setNotificationMsg] = useState<{ type: 'success' | 'info'; text: string } | null>(null);

  // Tab layout mode and scroll controls
  const [tabLayoutMode, setTabLayoutMode] = useState<'scroll' | 'grid'>('scroll');
  const tabScrollRef = React.useRef<HTMLDivElement>(null);

  const scrollTabs = (direction: 'left' | 'right') => {
    if (tabScrollRef.current) {
      const scrollAmount = direction === 'left' ? -280 : 280;
      tabScrollRef.current.scrollBy({ left: scrollAmount, behavior: 'smooth' });
    }
  };

  const handleTabWheel = (e: React.WheelEvent<HTMLDivElement>) => {
    if (tabScrollRef.current && e.deltaY !== 0) {
      tabScrollRef.current.scrollLeft += e.deltaY;
    }
  };

  // Modal States
  const [showImpactModal, setShowImpactModal] = useState(false);
  const [showPreviewModal, setShowPreviewModal] = useState(false);
  const [previewDevice, setPreviewDevice] = useState<'mobile' | 'tablet' | 'desktop'>('desktop');

  // API Integration Editing Modal State
  const [editingApi, setEditingApi] = useState<Partial<ApiIntegration> | null>(null);
  const [testingApiId, setTestingApiId] = useState<string | null>(null);

  // Selected Tenant for customization edit
  const [selectedTenant, setSelectedTenant] = useState<TenantCustomization | null>(tenantCustomizations[0] || null);

  useEffect(() => {
    const unsub = configEngine.subscribe(() => {
      setSettings(configEngine.getSettings());
      setVersionHistory(configEngine.getVersionHistory());
      setConflicts(configEngine.getConflicts());
      setAuditLogs(configEngine.getAuditLogs());
      setApiIntegrations(configEngine.getApiIntegrations());
      setTenantCustomizations(configEngine.getTenantCustomizations());
    });
    return () => unsub();
  }, []);

  const triggerNotify = (text: string, type: 'success' | 'info' = 'success') => {
    setNotificationMsg({ type, text });
    setTimeout(() => setNotificationMsg(null), 4000);
  };

  const handleSaveSection = (section: keyof Omit<HierarchicalSettings, 'version' | 'lastUpdated'>, values: any) => {
    configEngine.updateSettingsSection(section as any, values);
    triggerNotify(`Paramètres [${section.toUpperCase()}] mis à jour. Version courante : ${configEngine.getSettings().version}`);
  };

  const handleConfirmPropagate = () => {
    const newVersion = configEngine.propagateConfiguration('Propagation globale validée depuis le Centre de Gouvernance');
    setShowImpactModal(false);
    triggerNotify(`Configuration ${newVersion.version} propagée avec succès sur l'ensemble du réseau national !`);
  };

  const handleRollback = (versionId: string) => {
    const ok = configEngine.rollbackToVersion(versionId);
    if (ok) {
      triggerNotify(`Restauration réussie vers la version ${versionId} !`, 'info');
    }
  };

  const handleResolveConflict = (conflictId: string, choice: 'RESOLVED_GLOBAL' | 'OVERRIDDEN_TENANT') => {
    configEngine.resolveConflict(conflictId, choice);
    triggerNotify(`Conflit ${conflictId} résolu avec le choix ${choice === 'RESOLVED_GLOBAL' ? 'Règle Nationale' : 'Exception Établissement'}`);
  };

  const handleTestApiPing = async (id: string) => {
    setTestingApiId(id);
    const res = await configEngine.testIntegrationPing(id);
    setTestingApiId(null);
    if (res.success) {
      triggerNotify(`Test Réussi pour ${id} : ${res.statusMsg}`);
    } else {
      triggerNotify(`Échec Test ${id} : ${res.statusMsg}`, 'info');
    }
  };

  const handleSaveApiForm = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!editingApi) return;
    configEngine.saveApiIntegration(editingApi as any);
    setEditingApi(null);
    triggerNotify(`Service API [${editingApi.name || editingApi.id}] enregistré avec succès !`);
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-emerald-950 to-slate-900 rounded-2xl p-6 text-white border border-emerald-500/30 shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <span className="p-2 bg-emerald-500/20 text-emerald-400 rounded-lg border border-emerald-500/30">
              <Settings className="w-6 h-6 animate-spin-slow" />
            </span>
            <div>
              <h2 className="text-xl font-bold tracking-tight">Centre de Paramétrage Global, API & Synchronisation</h2>
              <p className="text-xs text-emerald-300">
                Socle de Gouvernance Intégré IVOIReXpress – Version Active : <span className="font-mono text-white bg-emerald-900/60 px-2 py-0.5 rounded border border-emerald-400/40">{settings.version}</span>
              </p>
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2 self-end md:self-auto">
          {/* Firestore Status Badge */}
          <div className="flex items-center gap-2 px-3 py-1.5 bg-slate-950/80 rounded-xl border border-slate-700/60 text-xs font-mono">
            <Database className="w-3.5 h-3.5 text-emerald-400" />
            <span className="text-slate-300">Firestore :</span>
            {configEngine.getSyncState().status === 'SYNCED' && (
              <span className="flex items-center gap-1 text-emerald-400 font-semibold">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                Synchronisé (/system_config)
              </span>
            )}
            {configEngine.getSyncState().status === 'PENDING' && (
              <span className="flex items-center gap-1 text-amber-400 font-semibold">
                <RefreshCw className="w-3 h-3 animate-spin" />
                Enregistrement...
              </span>
            )}
            {configEngine.getSyncState().status === 'OFFLINE' && (
              <span className="flex items-center gap-1 text-amber-400 font-semibold">
                <AlertTriangle className="w-3 h-3" />
                En attente de connexion (In-Memory)
              </span>
            )}
            {configEngine.getSyncState().status === 'ERROR' && (
              <span className="flex items-center gap-1 text-rose-400 font-semibold">
                <AlertTriangle className="w-3 h-3" />
                Erreur Sync
              </span>
            )}
          </div>

          <button
            onClick={async () => {
              const res = await configEngine.syncFromFirestore();
              if (res.success) {
                triggerNotify(res.message, 'success');
              } else {
                triggerNotify(res.message, 'info');
              }
            }}
            className="flex items-center gap-2 px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl text-xs font-semibold border border-slate-700 transition-all shadow"
            title="Forcer la relecture de la configuration directement depuis le serveur Cloud Firestore"
          >
            <RotateCcw className="w-3.5 h-3.5 text-cyan-400" />
            Relire Firestore
          </button>

          <button
            onClick={() => setShowPreviewModal(true)}
            className="flex items-center gap-2 px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl text-xs font-semibold border border-slate-700 transition-all shadow"
          >
            <Monitor className="w-4 h-4 text-emerald-400" />
            Prévisualiser Rendu (Multi-Écran)
          </button>

          <button
            onClick={() => setShowImpactModal(true)}
            className="flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-semibold transition-all shadow-lg hover:shadow-emerald-900/40 active:scale-95"
          >
            <RefreshCw className="w-4 h-4" />
            Propager la Config (Sync)
          </button>
        </div>
      </div>

      {notificationMsg && (
        <div className={`p-4 rounded-xl text-sm font-medium border flex items-center justify-between transition-all ${
          notificationMsg.type === 'success' ? 'bg-emerald-950/80 text-emerald-200 border-emerald-500/40' : 'bg-blue-950/80 text-blue-200 border-blue-500/40'
        }`}>
          <div className="flex items-center gap-3">
            <CheckCircle2 className="w-5 h-5 text-emerald-400" />
            <span>{notificationMsg.text}</span>
          </div>
          <span className="text-xs text-slate-400">À l'instant</span>
        </div>
      )}

      {/* Sub-Navigation Tabs & Controls */}
      <div className="space-y-2 pb-2 border-b border-slate-200 dark:border-slate-800">
        {/* Navigation Bar Utilities Header */}
        <div className="flex flex-wrap items-center justify-between gap-2 bg-slate-900/60 p-2 rounded-xl border border-slate-800">
          {/* Quick Section Jump Dropdown */}
          <div className="flex items-center gap-2">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1">
              <Sliders className="w-3.5 h-3.5 text-emerald-400" />
              <span>Accès Direct :</span>
            </span>
            <select
              value={activeSubTab}
              onChange={(e) => setActiveSubTab(e.target.value as any)}
              className="bg-slate-950 text-white text-xs font-semibold px-3 py-1.5 rounded-lg border border-slate-700 focus:border-emerald-500 focus:outline-none cursor-pointer"
            >
              {[
                { id: 'general', label: '1. Général & Marque' },
                { id: 'rbac', label: '2. RBAC & Provisioning' },
                { id: 'transport', label: '3. Transport Bus' },
                { id: 'hotel', label: '4. Hôtellerie' },
                { id: 'vision', label: '5. Vision Caméras' },
                { id: 'iptv', label: '6. IPTV Streaming' },
                { id: 'ai', label: '7. AI Core Gemini' },
                { id: 'notifications', label: '8. Notifications' },
                { id: 'financial', label: '9. Finance & Tarifs' },
                { id: 'integrations', label: `10. Hub APIs & Services (${apiIntegrations.filter(a => a.isActive).length})` },
                { id: 'tenants', label: '11. Vitrines Agences/Hôtels' },
                { id: 'media', label: '12. Centre Médias & Visuels' },
                { id: 'sync', label: `13. Sync & Audit (${conflicts.filter(c => c.status === 'PENDING_RESOLVE').length || 0})` }
              ].map(opt => (
                <option key={opt.id} value={opt.id}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>

          {/* Controls: Scroll Arrows & Grid Mode Toggle */}
          <div className="flex items-center gap-1.5">
            {tabLayoutMode === 'scroll' && (
              <>
                <button
                  type="button"
                  onClick={() => scrollTabs('left')}
                  className="p-1.5 bg-slate-800 hover:bg-emerald-600 text-slate-300 hover:text-white rounded-lg border border-slate-700 transition shadow"
                  title="Défiler vers la gauche"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={() => scrollTabs('right')}
                  className="p-1.5 bg-slate-800 hover:bg-emerald-600 text-slate-300 hover:text-white rounded-lg border border-slate-700 transition shadow"
                  title="Défiler vers la droite"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </>
            )}

            <button
              type="button"
              onClick={() => setTabLayoutMode(tabLayoutMode === 'scroll' ? 'grid' : 'scroll')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold border transition ${
                tabLayoutMode === 'grid'
                  ? 'bg-emerald-600 text-white border-emerald-500 shadow'
                  : 'bg-slate-800 text-slate-300 hover:bg-slate-700 border-slate-700'
              }`}
              title={tabLayoutMode === 'scroll' ? "Afficher toutes les sections en grille" : "Afficher en ligne défilante"}
            >
              <Grid className="w-3.5 h-3.5" />
              <span>{tabLayoutMode === 'scroll' ? 'Vue Grille (Toutes)' : 'Vue Ligne'}</span>
            </button>
          </div>
        </div>

        {/* Tab Items Container */}
        {tabLayoutMode === 'scroll' ? (
          <div
            ref={tabScrollRef}
            onWheel={handleTabWheel}
            className="flex items-center gap-1.5 overflow-x-auto py-1 scroll-smooth scrollbar-thin scrollbar-thumb-emerald-500/40 hover:scrollbar-thumb-emerald-500 scrollbar-track-slate-800/50"
          >
            {[
              { id: 'general', label: 'Général & Marque', icon: Globe },
              { id: 'rbac', label: 'RBAC & Provisioning', icon: Users },
              { id: 'transport', label: 'Transport Bus', icon: Bus },
              { id: 'hotel', label: 'Hôtellerie', icon: Hotel },
              { id: 'vision', label: 'Vision Caméras', icon: Eye },
              { id: 'iptv', label: 'IPTV Streaming', icon: Tv },
              { id: 'ai', label: 'AI Core Gemini', icon: Sparkles },
              { id: 'notifications', label: 'Notifications', icon: Bell },
              { id: 'financial', label: 'Finance & Tarifs', icon: CreditCard },
              { id: 'integrations', label: 'Hub APIs & Services', icon: Code, badge: apiIntegrations.filter(a => a.isActive).length },
              { id: 'tenants', label: 'Vitrines Agences/Hôtels', icon: Building2 },
              { id: 'media', label: 'Centre Médias & Visuels', icon: ImageIcon, badge: 'Médias' },
              { id: 'sync', label: 'Sync & Audit', icon: RefreshCw, badge: conflicts.filter(c => c.status === 'PENDING_RESOLVE').length || undefined }
            ].map((tab) => {
              const Icon = tab.icon;
              const isActive = activeSubTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveSubTab(tab.id as any)}
                  className={`flex items-center gap-2 px-3.5 py-2.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all shrink-0 cursor-pointer ${
                    isActive
                      ? 'bg-emerald-600 text-white shadow-md ring-2 ring-emerald-400/50'
                      : 'bg-slate-100 dark:bg-slate-800/90 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
                  }`}
                >
                  <Icon className="w-4 h-4 shrink-0" />
                  <span>{tab.label}</span>
                  {tab.badge !== undefined && (
                    <span className={`px-1.5 py-0.5 text-[10px] rounded-full font-bold ${
                      tab.id === 'sync' ? 'bg-red-500 text-white animate-pulse' : 'bg-emerald-500/20 text-emerald-300'
                    }`}>
                      {tab.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        ) : (
          /* Grid View Layout (All 13 sections wrapped into 2-6 columns) */
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-2 pt-1">
            {[
              { id: 'general', label: 'Général & Marque', icon: Globe },
              { id: 'rbac', label: 'RBAC & Provisioning', icon: Users },
              { id: 'transport', label: 'Transport Bus', icon: Bus },
              { id: 'hotel', label: 'Hôtellerie', icon: Hotel },
              { id: 'vision', label: 'Vision Caméras', icon: Eye },
              { id: 'iptv', label: 'IPTV Streaming', icon: Tv },
              { id: 'ai', label: 'AI Core Gemini', icon: Sparkles },
              { id: 'notifications', label: 'Notifications', icon: Bell },
              { id: 'financial', label: 'Finance & Tarifs', icon: CreditCard },
              { id: 'integrations', label: 'Hub APIs & Services', icon: Code, badge: apiIntegrations.filter(a => a.isActive).length },
              { id: 'tenants', label: 'Vitrines Agences/Hôtels', icon: Building2 },
              { id: 'media', label: 'Centre Médias & Visuels', icon: ImageIcon, badge: 'Médias' },
              { id: 'sync', label: 'Sync & Audit', icon: RefreshCw, badge: conflicts.filter(c => c.status === 'PENDING_RESOLVE').length || undefined }
            ].map((tab) => {
              const Icon = tab.icon;
              const isActive = activeSubTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => {
                    setActiveSubTab(tab.id as any);
                  }}
                  className={`flex items-center gap-2 p-2.5 rounded-xl text-xs font-semibold transition-all border text-left ${
                    isActive
                      ? 'bg-emerald-600 text-white border-emerald-500 shadow-md ring-2 ring-emerald-400/50'
                      : 'bg-slate-900/80 border-slate-800 text-slate-300 hover:bg-slate-800 hover:border-slate-700'
                  }`}
                >
                  <Icon className="w-4 h-4 shrink-0 text-emerald-400" />
                  <span className="truncate">{tab.label}</span>
                  {tab.badge !== undefined && (
                    <span className={`ml-auto px-1.5 py-0.5 text-[9px] rounded-full font-bold shrink-0 ${
                      tab.id === 'sync' ? 'bg-red-500 text-white animate-pulse' : 'bg-emerald-500/20 text-emerald-300'
                    }`}>
                      {tab.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* TAB 1: GENERAL */}
      {activeSubTab === 'general' && (
        <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 border border-slate-200 dark:border-slate-800 space-y-6 shadow-sm">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Globe className="w-5 h-5 text-emerald-500" />
              Paramètres Généraux, Identité Visuelle & UX/UI de la Plateforme
            </h3>
            <span className="text-xs text-slate-500">Dernière maj : {new Date(settings.lastUpdated).toLocaleDateString('fr-FR')}</span>
          </div>

          <form
            onSubmit={(e) => {
              e.preventDefault();
              const fd = new FormData(e.currentTarget);
              handleSaveSection('general', {
                platformName: fd.get('platformName'),
                tagline: fd.get('tagline'),
                contactEmail: fd.get('contactEmail'),
                contactPhone: fd.get('contactPhone'),
                currency: fd.get('currency'),
                timezone: fd.get('timezone'),
                cguText: fd.get('cguText'),
                privacyPolicyText: fd.get('privacyPolicyText')
              });
              handleSaveSection('uxui', {
                customHeaderMessage: fd.get('customHeaderMessage') as string,
                customBannerUrl: fd.get('customBannerUrl') as string,
                welcomeBannerImageUrl: fd.get('welcomeBannerImageUrl') as string,
                themeAccentColor: fd.get('themeAccentColor') as string
              });
            }}
            className="space-y-4"
          >
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">Nom Officiel de la Plateforme</label>
                <input
                  type="text"
                  name="platformName"
                  defaultValue={settings.general.platformName}
                  className="w-full text-xs px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-emerald-500 dark:text-white"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">Slogan National</label>
                <input
                  type="text"
                  name="tagline"
                  defaultValue={settings.general.tagline}
                  className="w-full text-xs px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-emerald-500 dark:text-white"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">Message d'Accueil Personnalisé (En-tête Voyageur)</label>
                <input
                  type="text"
                  name="customHeaderMessage"
                  defaultValue={settings.uxui.customHeaderMessage}
                  className="w-full text-xs px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-emerald-500 dark:text-white font-medium"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">URL Bannière d'Accueil Principale</label>
                <input
                  type="text"
                  name="customBannerUrl"
                  defaultValue={settings.uxui.customBannerUrl}
                  className="w-full text-xs px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-emerald-500 dark:text-white font-mono"
                />
              </div>

              <div className="md:col-span-2 p-3 rounded-xl bg-slate-100 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 space-y-2">
                <div className="flex items-center justify-between">
                  <label className="block text-xs font-bold text-slate-800 dark:text-slate-200">
                    🚌 Photo de la Bannière de Bienvenue (Accueil Voyageur)
                  </label>
                  <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-bold bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
                    Bannière « Bonjour, [Prénom] »
                  </span>
                </div>
                <p className="text-[11px] text-slate-500 dark:text-slate-400">
                  Cette photo d'autocar VIP illustre la bannière de bienvenue en haut de la page d'accueil de l'application voyageur.
                </p>
                <div className="flex flex-col sm:flex-row items-center gap-3">
                  <input
                    type="text"
                    name="welcomeBannerImageUrl"
                    defaultValue={settings.uxui.welcomeBannerImageUrl}
                    placeholder="URL ou chemin de l'image du car VIP..."
                    className="flex-1 text-xs px-3 py-2 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-emerald-500 dark:text-white font-mono w-full"
                  />
                  {settings.uxui.welcomeBannerImageUrl && (
                    <div className="h-14 w-28 shrink-0 rounded-lg overflow-hidden border border-slate-300 dark:border-slate-700 bg-slate-950 relative shadow-sm">
                      <img
                        src={settings.uxui.welcomeBannerImageUrl || 'https://images.unsplash.com/photo-1544620347-c4fd4a3d5957?auto=format&fit=crop&w=1200&q=80'}
                        alt="Aperçu car VIP"
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          (e.target as HTMLImageElement).style.display = 'none';
                        }}
                      />
                      <span className="absolute bottom-0.5 right-0.5 bg-slate-950/80 text-[8px] font-mono font-bold text-emerald-400 px-1 rounded">
                        Aperçu
                      </span>
                    </div>
                  )}
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">Email Officiel Support</label>
                <input
                  type="email"
                  name="contactEmail"
                  defaultValue={settings.general.contactEmail}
                  className="w-full text-xs px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-emerald-500 dark:text-white"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">Téléphone Hotline National</label>
                <input
                  type="text"
                  name="contactPhone"
                  defaultValue={settings.general.contactPhone}
                  className="w-full text-xs px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-emerald-500 dark:text-white"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">Conditions Générales d'Utilisation (CGU)</label>
                <textarea
                  name="cguText"
                  rows={2}
                  defaultValue={settings.general.cguText}
                  className="w-full text-xs px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-emerald-500 dark:text-white"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">Politique de Confidentialité (ARTCI)</label>
                <textarea
                  name="privacyPolicyText"
                  rows={2}
                  defaultValue={settings.general.privacyPolicyText}
                  className="w-full text-xs px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-emerald-500 dark:text-white"
                />
              </div>
            </div>

            <div className="flex justify-between items-center pt-2">
              <button
                type="button"
                onClick={() => setShowPreviewModal(true)}
                className="flex items-center gap-2 px-4 py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-xl text-xs font-semibold transition-all border border-slate-300 dark:border-slate-700"
              >
                <Monitor className="w-4 h-4 text-emerald-500" />
                Tester la Prévisualisation
              </button>

              <button
                type="submit"
                className="flex items-center gap-2 px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-semibold shadow-md transition-all"
              >
                <Save className="w-4 h-4" />
                Enregistrer Paramètres Généraux
              </button>
            </div>
          </form>
        </div>
      )}

      {/* TAB 10: INTEGRATIONS HUB (HUB APIS & SERVICES) */}
      {activeSubTab === 'integrations' && (
        <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 border border-slate-200 dark:border-slate-800 space-y-6 shadow-sm">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Code className="w-5 h-5 text-emerald-500" />
                Centre Universel des API et Intégrations Tierces
              </h3>
              <p className="text-xs text-slate-500">
                Ajoutez, configurez, pinger et désactivez vos clés d'API (IA, Maps, Paiement, Cinéma VOD, Comms & Cloud) sans recompiler le code.
              </p>
            </div>

            <button
              onClick={() => setEditingApi({ id: `api-custom-${Date.now()}`, isActive: true, environment: 'PRODUCTION', category: 'IA' })}
              className="flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-semibold shadow transition-all self-start md:self-auto"
            >
              <Plus className="w-4 h-4" />
              Ajouter une Nouvelle Intégration API
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {apiIntegrations.map((api) => (
              <div
                key={api.id}
                className={`p-4 rounded-xl border transition-all space-y-3 relative ${
                  api.isActive
                    ? 'bg-slate-50 dark:bg-slate-800/60 border-slate-200 dark:border-slate-700'
                    : 'bg-slate-100 dark:bg-slate-900/40 border-slate-300 dark:border-slate-800 opacity-75'
                }`}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="space-y-1">
                    <span className="px-2 py-0.5 text-[10px] bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 rounded font-bold">
                      {api.category}
                    </span>
                    <h4 className="text-xs font-bold text-slate-900 dark:text-white leading-snug">{api.name}</h4>
                  </div>

                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={api.isActive}
                      onChange={(e) => configEngine.toggleApiIntegration(api.id, e.target.checked)}
                      className="sr-only peer"
                    />
                    <div className="w-8 h-4 bg-slate-300 peer-focus:outline-none rounded-full peer dark:bg-slate-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-3 after:w-3 after:transition-all dark:peer-focus:ring-emerald-800 peer-checked:bg-emerald-600"></div>
                  </label>
                </div>

                <div className="space-y-1 font-mono text-[11px] text-slate-500 dark:text-slate-400">
                  <p className="truncate">URL : <span className="text-slate-800 dark:text-slate-200">{api.url}</span></p>
                  <p className="truncate">Env : <span className="text-emerald-600 dark:text-emerald-400 font-bold">{api.environment}</span> ({api.version})</p>
                  <p className="truncate">Clé : <span className="text-slate-700 dark:text-slate-300">{api.publicKey || 'Secured'}</span></p>
                </div>

                {api.lastPingResult && (
                  <div className={`p-2 rounded text-[11px] font-mono flex items-center justify-between ${
                    api.lastPingResult.success ? 'bg-emerald-950/60 text-emerald-300 border border-emerald-500/30' : 'bg-red-950/60 text-red-300 border border-red-500/30'
                  }`}>
                    <span className="truncate">{api.lastPingResult.statusMsg}</span>
                    <span className="font-bold">{api.lastPingResult.latencyMs}ms</span>
                  </div>
                )}

                <div className="flex items-center justify-between pt-2 border-t border-slate-200 dark:border-slate-700">
                  <button
                    onClick={() => handleTestApiPing(api.id)}
                    disabled={testingApiId === api.id}
                    className="flex items-center gap-1.5 px-2.5 py-1 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 rounded-lg text-xs font-semibold transition-all border border-emerald-500/30"
                  >
                    <Activity className={`w-3.5 h-3.5 ${testingApiId === api.id ? 'animate-spin' : ''}`} />
                    {testingApiId === api.id ? 'Test Ping...' : 'Tester connexion'}
                  </button>

                  <button
                    onClick={() => setEditingApi(api)}
                    className="px-2.5 py-1 bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 text-slate-700 dark:text-slate-200 rounded-lg text-xs font-semibold transition-all"
                  >
                    Configurer
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 11: TENANTS CUSTOMIZATION (VITRINES AGENCES & HÔTELS) */}
      {activeSubTab === 'tenants' && (
        <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 border border-slate-200 dark:border-slate-800 space-y-6 shadow-sm">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Building2 className="w-5 h-5 text-emerald-500" />
                Gestionnaire des Vitrines & Personnalisation des Agences et Hôtels
              </h3>
              <p className="text-xs text-slate-500">
                Supervision et contrôle des espaces publics affichés aux voyageurs pour chaque établissement connecté.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Sidebar list of tenants */}
            <div className="space-y-2">
              <h4 className="text-xs font-bold uppercase text-slate-400 tracking-wider">Établissements Partenaires</h4>
              {tenantCustomizations.map((t) => (
                <button
                  key={t.id}
                  onClick={() => setSelectedTenant(t)}
                  className={`w-full text-left p-3 rounded-xl border flex items-center justify-between transition-all ${
                    selectedTenant?.id === t.id
                      ? 'bg-emerald-50 dark:bg-emerald-950/50 border-emerald-500 text-slate-900 dark:text-white shadow-sm'
                      : 'bg-slate-50 dark:bg-slate-800/40 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:bg-slate-100'
                  }`}
                >
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="px-1.5 py-0.5 text-[9px] bg-emerald-500/20 text-emerald-400 font-bold rounded">
                        {t.type}
                      </span>
                      <h5 className="text-xs font-bold">{t.name}</h5>
                    </div>
                    <p className="text-[11px] text-slate-500 truncate mt-1">{t.slogan}</p>
                  </div>
                  <Check className={`w-4 h-4 text-emerald-500 ${selectedTenant?.id === t.id ? 'opacity-100' : 'opacity-0'}`} />
                </button>
              ))}
            </div>

            {/* Selected Tenant Editor */}
            {selectedTenant && (
              <div className="lg:col-span-2 p-5 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-200 dark:border-slate-700 space-y-4">
                <div className="flex items-center justify-between">
                  <h4 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                    <Building2 className="w-4 h-4 text-emerald-500" />
                    Éditer Vitrine : {selectedTenant.name} ({selectedTenant.type})
                  </h4>
                  <span className="text-xs font-mono text-emerald-500 bg-emerald-500/10 px-2 py-0.5 rounded">{selectedTenant.id}</span>
                </div>

                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    configEngine.saveTenantCustomization(selectedTenant);
                    triggerNotify(`Vitrine Voyageur de [${selectedTenant.name}] mise à jour et synchronisée !`);
                  }}
                  className="space-y-4"
                >
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">URL Bannière Principale</label>
                      <input
                        type="text"
                        value={selectedTenant.mainBannerUrl}
                        onChange={(e) => setSelectedTenant({ ...selectedTenant, mainBannerUrl: e.target.value })}
                        className="w-full text-xs px-3 py-1.5 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg dark:text-white font-mono"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">Slogan Accroche</label>
                      <input
                        type="text"
                        value={selectedTenant.slogan}
                        onChange={(e) => setSelectedTenant({ ...selectedTenant, slogan: e.target.value })}
                        className="w-full text-xs px-3 py-1.5 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg dark:text-white"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">Téléphone Contact</label>
                      <input
                        type="text"
                        value={selectedTenant.contactPhone}
                        onChange={(e) => setSelectedTenant({ ...selectedTenant, contactPhone: e.target.value })}
                        className="w-full text-xs px-3 py-1.5 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg dark:text-white"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">Horaires d'Ouverture</label>
                      <input
                        type="text"
                        value={selectedTenant.operatingHours}
                        onChange={(e) => setSelectedTenant({ ...selectedTenant, operatingHours: e.target.value })}
                        className="w-full text-xs px-3 py-1.5 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg dark:text-white"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">Description Présentation Voyageur</label>
                    <textarea
                      rows={2}
                      value={selectedTenant.description}
                      onChange={(e) => setSelectedTenant({ ...selectedTenant, description: e.target.value })}
                      className="w-full text-xs px-3 py-1.5 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg dark:text-white"
                    />
                  </div>

                  <div className="flex justify-end pt-2">
                    <button
                      type="submit"
                      className="flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-semibold transition-all shadow"
                    >
                      <Save className="w-4 h-4" />
                      Enregistrer et Synchroniser Vitrine
                    </button>
                  </div>
                </form>
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 2: TRANSPORT BUS */}
      {activeSubTab === 'transport' && (
        <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 border border-slate-200 dark:border-slate-800 space-y-6 shadow-sm">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Bus className="w-5 h-5 text-emerald-500" />
              Paramètres Globaux du Module Transport Bus, Agences & Flotte
            </h3>
            <span className="text-xs text-emerald-600 dark:text-emerald-400 font-mono font-bold bg-emerald-500/10 px-2.5 py-1 rounded-lg border border-emerald-500/20">
              Synchro Firestore Active
            </span>
          </div>

          <form
            onSubmit={(e) => {
              e.preventDefault();
              const fd = new FormData(e.currentTarget);
              const vehicleCatStr = String(fd.get('vehicleCategories') || '');
              const vehicleCategories = vehicleCatStr.split(',').map(s => s.trim()).filter(Boolean);

              handleSaveSection('transport', {
                defaultCommissionRatePercent: parseFloat(String(fd.get('defaultCommissionRatePercent'))) || 5.0,
                vatRatePercent: parseFloat(String(fd.get('vatRatePercent'))) || 18.0,
                cancellationWindowHours: parseInt(String(fd.get('cancellationWindowHours')), 10) || 24,
                maxSeatsPerBooking: parseInt(String(fd.get('maxSeatsPerBooking')), 10) || 6,
                vehicleCategories: vehicleCategories.length > 0 ? vehicleCategories : settings.transport.vehicleCategories,
                ticketTemplate: (fd.get('ticketTemplate') as any) || 'QR_SECURE_DIGITAL',
                qrCodeSigningAlgorithm: String(fd.get('qrCodeSigningAlgorithm') || 'HMAC-SHA256-IVOIR-GOV'),
                requireDriverScan: fd.get('requireDriverScan') === 'on',
                allowPassengerSeatChoice: fd.get('allowPassengerSeatChoice') === 'on',
                gpsPingFrequencySec: parseInt(String(fd.get('gpsPingFrequencySec')), 10) || 10,
                luggageFreeAllowanceKg: parseInt(String(fd.get('luggageFreeAllowanceKg')), 10) || 20,
                extraLuggageFeePerKgFcfa: parseInt(String(fd.get('extraLuggageFeePerKgFcfa')), 10) || 500,
                autoApproveAgencies: fd.get('autoApproveAgencies') === 'on'
              });
            }}
            className="space-y-6"
          >
            {/* Group 1: Agences, Commission & Tarification */}
            <div className="p-4 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-200 dark:border-slate-700 space-y-4">
              <h4 className="text-xs font-bold uppercase text-slate-500 dark:text-slate-400 tracking-wider flex items-center gap-2">
                <Building2 className="w-4 h-4 text-emerald-500" />
                1. Agences, Commission & Conditions d'Annulation
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">Commission Agence (%)</label>
                  <input
                    type="number"
                    step="0.1"
                    name="defaultCommissionRatePercent"
                    defaultValue={settings.transport.defaultCommissionRatePercent}
                    className="w-full text-xs px-3 py-2 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg dark:text-white"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">TVA Appliquée (%)</label>
                  <input
                    type="number"
                    step="0.1"
                    name="vatRatePercent"
                    defaultValue={settings.transport.vatRatePercent}
                    className="w-full text-xs px-3 py-2 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg dark:text-white"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">Délai Max Annulation (Heures)</label>
                  <input
                    type="number"
                    name="cancellationWindowHours"
                    defaultValue={settings.transport.cancellationWindowHours}
                    className="w-full text-xs px-3 py-2 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg dark:text-white"
                  />
                </div>
              </div>
              <div className="flex items-center gap-3 pt-1">
                <label className="flex items-center gap-2 cursor-pointer text-xs text-slate-700 dark:text-slate-300 font-medium">
                  <input
                    type="checkbox"
                    name="autoApproveAgencies"
                    defaultChecked={settings.transport.autoApproveAgencies}
                    className="w-4 h-4 text-emerald-600 rounded border-slate-300"
                  />
                  <span>Approbation automatique des nouvelles agences partenaires</span>
                </label>
              </div>
            </div>

            {/* Group 2: Flotte & Réservations */}
            <div className="p-4 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-200 dark:border-slate-700 space-y-4">
              <h4 className="text-xs font-bold uppercase text-slate-500 dark:text-slate-400 tracking-wider flex items-center gap-2">
                <Bus className="w-4 h-4 text-emerald-500" />
                2. Flotte de Véhicules, Bagages & Réservations
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">Catégories de Véhicules (séparées par virgules)</label>
                  <input
                    type="text"
                    name="vehicleCategories"
                    defaultValue={settings.transport.vehicleCategories.join(', ')}
                    className="w-full text-xs px-3 py-2 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg dark:text-white"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">Sièges Max par Réservation Passager</label>
                  <input
                    type="number"
                    name="maxSeatsPerBooking"
                    defaultValue={settings.transport.maxSeatsPerBooking}
                    className="w-full text-xs px-3 py-2 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg dark:text-white"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">Franchise Bagage Gratuite (Kg)</label>
                  <input
                    type="number"
                    name="luggageFreeAllowanceKg"
                    defaultValue={settings.transport.luggageFreeAllowanceKg || 20}
                    className="w-full text-xs px-3 py-2 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg dark:text-white"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">Supplément Bagage Extra (FCFA / Kg)</label>
                  <input
                    type="number"
                    name="extraLuggageFeePerKgFcfa"
                    defaultValue={settings.transport.extraLuggageFeePerKgFcfa || 500}
                    className="w-full text-xs px-3 py-2 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg dark:text-white"
                  />
                </div>
              </div>
              <div className="flex flex-wrap items-center gap-6 pt-1">
                <label className="flex items-center gap-2 cursor-pointer text-xs text-slate-700 dark:text-slate-300 font-medium">
                  <input
                    type="checkbox"
                    name="allowPassengerSeatChoice"
                    defaultChecked={settings.transport.allowPassengerSeatChoice}
                    className="w-4 h-4 text-emerald-600 rounded border-slate-300"
                  />
                  <span>Permettre au passager de choisir son numéro de siège</span>
                </label>
              </div>
            </div>

            {/* Group 3: Billetterie & Contrôle QR Code */}
            <div className="p-4 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-200 dark:border-slate-700 space-y-4">
              <h4 className="text-xs font-bold uppercase text-slate-500 dark:text-slate-400 tracking-wider flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-emerald-500" />
                3. Billetterie Sécurisée, QR Code & GPS Suivi
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">Modèle de Billet Déployé</label>
                  <select
                    name="ticketTemplate"
                    defaultValue={settings.transport.ticketTemplate}
                    className="w-full text-xs px-3 py-2 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg dark:text-white"
                  >
                    <option value="QR_SECURE_DIGITAL">QR Code Digital Crypto-Signé (Anti-Fraude)</option>
                    <option value="STANDARD_PDF">Billet PDF Imprimable Standard</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">Algorithme de Signature QR</label>
                  <input
                    type="text"
                    name="qrCodeSigningAlgorithm"
                    defaultValue={settings.transport.qrCodeSigningAlgorithm}
                    className="w-full text-xs px-3 py-2 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg dark:text-white font-mono"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">Fréquence Ping GPS (Secondes)</label>
                  <input
                    type="number"
                    name="gpsPingFrequencySec"
                    defaultValue={settings.transport.gpsPingFrequencySec || 10}
                    className="w-full text-xs px-3 py-2 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg dark:text-white"
                  />
                </div>
              </div>
              <div className="flex items-center gap-3 pt-1">
                <label className="flex items-center gap-2 cursor-pointer text-xs text-slate-700 dark:text-slate-300 font-medium">
                  <input
                    type="checkbox"
                    name="requireDriverScan"
                    defaultChecked={settings.transport.requireDriverScan}
                    className="w-4 h-4 text-emerald-600 rounded border-slate-300"
                  />
                  <span>Exiger le scan valide du contrôleur à l'embarquement en gare</span>
                </label>
              </div>
            </div>

            <div className="flex justify-end pt-2">
              <button
                type="submit"
                className="flex items-center gap-2 px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-semibold shadow-md transition-all"
              >
                <Save className="w-4 h-4" />
                Enregistrer Paramètres Transport
              </button>
            </div>
          </form>
        </div>
      )}

      {/* TAB 3: HÔTELLERIE */}
      {activeSubTab === 'hotel' && (
        <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 border border-slate-200 dark:border-slate-800 space-y-6 shadow-sm">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Hotel className="w-5 h-5 text-emerald-500" />
              Paramètres Globaux du Module Hôtellerie & Hébergements
            </h3>
            <span className="text-xs text-emerald-600 dark:text-emerald-400 font-mono font-bold bg-emerald-500/10 px-2.5 py-1 rounded-lg border border-emerald-500/20">
              Synchro Firestore Active
            </span>
          </div>

          <form
            onSubmit={(e) => {
              e.preventDefault();
              const fd = new FormData(e.currentTarget);
              const hotelCatStr = String(fd.get('hotelCategories') || '');
              const roomCatStr = String(fd.get('roomCategories') || '');
              const amenitiesStr = String(fd.get('standardAmenitiesList') || '');

              handleSaveSection('hotel', {
                defaultCheckInTime: String(fd.get('defaultCheckInTime') || '14:00'),
                defaultCheckOutTime: String(fd.get('defaultCheckOutTime') || '12:00'),
                cancellationWindowHours: parseInt(String(fd.get('cancellationWindowHours')), 10) || 48,
                defaultHotelCommissionPercent: parseFloat(String(fd.get('defaultHotelCommissionPercent'))) || 8.0,
                touristTaxPerNightFcfa: parseInt(String(fd.get('touristTaxPerNightFcfa')), 10) || 1000,
                allowOverbookingMarginPercent: parseInt(String(fd.get('allowOverbookingMarginPercent')), 10) || 5,
                autoConfirmBookings: fd.get('autoConfirmBookings') === 'on',
                hotelCategories: hotelCatStr.split(',').map(s => s.trim()).filter(Boolean),
                roomCategories: roomCatStr.split(',').map(s => s.trim()).filter(Boolean),
                standardAmenitiesList: amenitiesStr.split(',').map(s => s.trim()).filter(Boolean)
              });
            }}
            className="space-y-6"
          >
            {/* Horaires & Commission */}
            <div className="p-4 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-200 dark:border-slate-700 space-y-4">
              <h4 className="text-xs font-bold uppercase text-slate-500 dark:text-slate-400 tracking-wider flex items-center gap-2">
                <Hotel className="w-4 h-4 text-emerald-500" />
                1. Horaires Check-In/Out & Politique Tarifaire
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div>
                  <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">Heure Check-In Défaillat</label>
                  <input
                    type="text"
                    name="defaultCheckInTime"
                    defaultValue={settings.hotel.defaultCheckInTime}
                    className="w-full text-xs px-3 py-2 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg dark:text-white"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">Heure Check-Out Défaillat</label>
                  <input
                    type="text"
                    name="defaultCheckOutTime"
                    defaultValue={settings.hotel.defaultCheckOutTime}
                    className="w-full text-xs px-3 py-2 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg dark:text-white"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">Commission Hôtel (%)</label>
                  <input
                    type="number"
                    step="0.1"
                    name="defaultHotelCommissionPercent"
                    defaultValue={settings.hotel.defaultHotelCommissionPercent}
                    className="w-full text-xs px-3 py-2 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg dark:text-white"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">Taxe Séjour (FCFA/nuit)</label>
                  <input
                    type="number"
                    name="touristTaxPerNightFcfa"
                    defaultValue={settings.hotel.touristTaxPerNightFcfa || 1000}
                    className="w-full text-xs px-3 py-2 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg dark:text-white"
                  />
                </div>
              </div>
              <div className="flex items-center gap-3 pt-1">
                <label className="flex items-center gap-2 cursor-pointer text-xs text-slate-700 dark:text-slate-300 font-medium">
                  <input
                    type="checkbox"
                    name="autoConfirmBookings"
                    defaultChecked={settings.hotel.autoConfirmBookings}
                    className="w-4 h-4 text-emerald-600 rounded border-slate-300"
                  />
                  <span>Confirmation automatique instantanée des réservations hôtelières</span>
                </label>
              </div>
            </div>

            {/* Catégories & Équipements */}
            <div className="p-4 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-200 dark:border-slate-700 space-y-4">
              <h4 className="text-xs font-bold uppercase text-slate-500 dark:text-slate-400 tracking-wider flex items-center gap-2">
                <Layers className="w-4 h-4 text-emerald-500" />
                2. Catégories d'Établissements, Chambres & Équipements
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">Types d'Établissements (séparés par virgules)</label>
                  <input
                    type="text"
                    name="hotelCategories"
                    defaultValue={settings.hotel.hotelCategories.join(', ')}
                    className="w-full text-xs px-3 py-2 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg dark:text-white"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">Catégories de Chambres (séparées par virgules)</label>
                  <input
                    type="text"
                    name="roomCategories"
                    defaultValue={settings.hotel.roomCategories.join(', ')}
                    className="w-full text-xs px-3 py-2 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg dark:text-white"
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">Liste des Équipements Standards Proposés</label>
                <input
                  type="text"
                  name="standardAmenitiesList"
                  defaultValue={settings.hotel.standardAmenitiesList.join(', ')}
                  className="w-full text-xs px-3 py-2 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg dark:text-white"
                />
              </div>
            </div>

            <div className="flex justify-end pt-2">
              <button
                type="submit"
                className="flex items-center gap-2 px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-semibold shadow-md transition-all"
              >
                <Save className="w-4 h-4" />
                Enregistrer Paramètres Hôtellerie
              </button>
            </div>
          </form>
        </div>
      )}

      {/* TAB 4: VISION CAMÉRAS */}
      {activeSubTab === 'vision' && (
        <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 border border-slate-200 dark:border-slate-800 space-y-6 shadow-sm">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Eye className="w-5 h-5 text-emerald-500" />
              Paramètres Globaux du Module Vision Caméras & Vidéosurveillance IA
            </h3>
            <span className="text-xs text-emerald-600 dark:text-emerald-400 font-mono font-bold bg-emerald-500/10 px-2.5 py-1 rounded-lg border border-emerald-500/20">
              Synchro Firestore Active
            </span>
          </div>

          <form
            onSubmit={(e) => {
              e.preventDefault();
              const fd = new FormData(e.currentTarget);
              const rulesStr = String(fd.get('aiDetectionRules') || '');

              handleSaveSection('vision', {
                cameraRetentionDays: parseInt(String(fd.get('cameraRetentionDays')), 10) || 30,
                cloudStorageLimitGbPerCamera: parseInt(String(fd.get('cloudStorageLimitGbPerCamera')), 10) || 100,
                maxStreamsPerUser: parseInt(String(fd.get('maxStreamsPerUser')), 10) || 16,
                defaultSensitivity: (fd.get('defaultSensitivity') as any) || 'Haute',
                videoQualityPreset: (fd.get('videoQualityPreset') as any) || '1080p_FHD',
                recordingMode: (fd.get('recordingMode') as any) || 'ON_MOTION',
                rtspWebRtcBridgeEnabled: fd.get('rtspWebRtcBridgeEnabled') === 'on',
                aiDetectionRules: rulesStr.split(',').map(s => s.trim()).filter(Boolean)
              });
            }}
            className="space-y-6"
          >
            {/* Vidéo & Stockage */}
            <div className="p-4 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-200 dark:border-slate-700 space-y-4">
              <h4 className="text-xs font-bold uppercase text-slate-500 dark:text-slate-400 tracking-wider flex items-center gap-2">
                <Video className="w-4 h-4 text-emerald-500" />
                1. Rétention Vidéo, Stockage Cloud & Qualité
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div>
                  <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">Rétention Vidéo (Jours)</label>
                  <input
                    type="number"
                    name="cameraRetentionDays"
                    defaultValue={settings.vision.cameraRetentionDays}
                    className="w-full text-xs px-3 py-2 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg dark:text-white"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">Quota Stockage / Caméra (GB)</label>
                  <input
                    type="number"
                    name="cloudStorageLimitGbPerCamera"
                    defaultValue={settings.vision.cloudStorageLimitGbPerCamera}
                    className="w-full text-xs px-3 py-2 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg dark:text-white"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">Préréglage Qualité Vidéo</label>
                  <select
                    name="videoQualityPreset"
                    defaultValue={settings.vision.videoQualityPreset || '1080p_FHD'}
                    className="w-full text-xs px-3 py-2 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg dark:text-white"
                  >
                    <option value="720p_HD">720p HD (Bande passante optimisée)</option>
                    <option value="1080p_FHD">1080p Full HD (Recommandé)</option>
                    <option value="4K_UHD">4K Ultra HD (Haute fidélité gares principal)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">Mode d'Enregistrement</label>
                  <select
                    name="recordingMode"
                    defaultValue={settings.vision.recordingMode || 'ON_MOTION'}
                    className="w-full text-xs px-3 py-2 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg dark:text-white"
                  >
                    <option value="ON_MOTION">Sur Détection Mouvement & Alerte IA</option>
                    <option value="CONTINUOUS">Enregistrement Continu 24/7</option>
                    <option value="HYBRID">Hybride (IA + Heures de pointe)</option>
                  </select>
                </div>
              </div>
              <div className="flex items-center gap-3 pt-1">
                <label className="flex items-center gap-2 cursor-pointer text-xs text-slate-700 dark:text-slate-300 font-medium">
                  <input
                    type="checkbox"
                    name="rtspWebRtcBridgeEnabled"
                    defaultChecked={settings.vision.rtspWebRtcBridgeEnabled}
                    className="w-4 h-4 text-emerald-600 rounded border-slate-300"
                  />
                  <span>Activer le Pont Passerelle RTSP / WebRTC pour flux vidéo ultra-basse latence (&lt;300ms)</span>
                </label>
              </div>
            </div>

            {/* Détection IA */}
            <div className="p-4 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-200 dark:border-slate-700 space-y-4">
              <h4 className="text-xs font-bold uppercase text-slate-500 dark:text-slate-400 tracking-wider flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-emerald-500" />
                2. Détection IA, Sensibilité & Règles de Sécurité
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">Sensibilité Globale Détecteur</label>
                  <select
                    name="defaultSensitivity"
                    defaultValue={settings.vision.defaultSensitivity}
                    className="w-full text-xs px-3 py-2 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg dark:text-white"
                  >
                    <option value="Haute">Haute (Alerte immédiate)</option>
                    <option value="Moyenne">Moyenne (Standard)</option>
                    <option value="Basse">Basse (Filtrage bruits ambiants)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">Flux Simultanés Max par Opérateur</label>
                  <input
                    type="number"
                    name="maxStreamsPerUser"
                    defaultValue={settings.vision.maxStreamsPerUser}
                    className="w-full text-xs px-3 py-2 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg dark:text-white"
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">Règles IA d'Analyse Automatique Visuelle</label>
                <input
                  type="text"
                  name="aiDetectionRules"
                  defaultValue={settings.vision.aiDetectionRules.join(', ')}
                  className="w-full text-xs px-3 py-2 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg dark:text-white font-mono"
                />
              </div>
            </div>

            <div className="flex justify-end pt-2">
              <button
                type="submit"
                className="flex items-center gap-2 px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-semibold shadow-md transition-all"
              >
                <Save className="w-4 h-4" />
                Enregistrer Paramètres Vision Caméras
              </button>
            </div>
          </form>
        </div>
      )}

      {/* TAB 5: IPTV STREAMING */}
      {activeSubTab === 'iptv' && (
        <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 border border-slate-200 dark:border-slate-800 space-y-6 shadow-sm">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Tv className="w-5 h-5 text-emerald-500" />
              Paramètres Globaux du Module IPTV Streaming & VOD
            </h3>
            <span className="text-xs text-emerald-600 dark:text-emerald-400 font-mono font-bold bg-emerald-500/10 px-2.5 py-1 rounded-lg border border-emerald-500/20">
              Synchro Firestore Active
            </span>
          </div>

          <form
            onSubmit={(e) => {
              e.preventDefault();
              const fd = new FormData(e.currentTarget);
              const bouquetsStr = String(fd.get('allowedBouquets') || '');

              handleSaveSection('iptv', {
                defaultMaxResolution: (fd.get('defaultMaxResolution') as any) || '1080p',
                maxConcurrentStreamsPerUser: parseInt(String(fd.get('maxConcurrentStreamsPerUser')), 10) || 3,
                freeTrialDays: parseInt(String(fd.get('freeTrialDays')), 10) || 7,
                bandwidthThrottlingKbps: parseInt(String(fd.get('bandwidthThrottlingKbps')), 10) || 8000,
                epgAutoUpdateHours: parseInt(String(fd.get('epgAutoUpdateHours')), 10) || 6,
                tmdbApiKeyConfigured: fd.get('tmdbApiKeyConfigured') === 'on',
                allowedBouquets: bouquetsStr.split(',').map(s => s.trim()).filter(Boolean)
              });
            }}
            className="space-y-6"
          >
            {/* Qualité & Bande Passante */}
            <div className="p-4 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-200 dark:border-slate-700 space-y-4">
              <h4 className="text-xs font-bold uppercase text-slate-500 dark:text-slate-400 tracking-wider flex items-center gap-2">
                <Tv className="w-4 h-4 text-emerald-500" />
                1. Qualité Streaming, Flux & Limitation Bande Passante
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div>
                  <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">Résolution Maximale</label>
                  <select
                    name="defaultMaxResolution"
                    defaultValue={settings.iptv.defaultMaxResolution}
                    className="w-full text-xs px-3 py-2 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg dark:text-white"
                  >
                    <option value="720p">720p HD</option>
                    <option value="1080p">1080p Full HD</option>
                    <option value="4K">4K Ultra HD</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">Flux Simultanés / Compte</label>
                  <input
                    type="number"
                    name="maxConcurrentStreamsPerUser"
                    defaultValue={settings.iptv.maxConcurrentStreamsPerUser}
                    className="w-full text-xs px-3 py-2 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg dark:text-white"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">Période d'Essai (Jours)</label>
                  <input
                    type="number"
                    name="freeTrialDays"
                    defaultValue={settings.iptv.freeTrialDays}
                    className="w-full text-xs px-3 py-2 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg dark:text-white"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">Mise à jour EPG (Heures)</label>
                  <input
                    type="number"
                    name="epgAutoUpdateHours"
                    defaultValue={settings.iptv.epgAutoUpdateHours || 6}
                    className="w-full text-xs px-3 py-2 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg dark:text-white"
                  />
                </div>
              </div>
            </div>

            {/* Bouquets & Métadonnées TMDb */}
            <div className="p-4 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-200 dark:border-slate-700 space-y-4">
              <h4 className="text-xs font-bold uppercase text-slate-500 dark:text-slate-400 tracking-wider flex items-center gap-2">
                <Code className="w-4 h-4 text-emerald-500" />
                2. Bouquets de Chaînes & Métadonnées VOD TMDb
              </h4>
              <div>
                <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">Bouquets Autorisés (séparés par virgules)</label>
                <input
                  type="text"
                  name="allowedBouquets"
                  defaultValue={settings.iptv.allowedBouquets.join(', ')}
                  className="w-full text-xs px-3 py-2 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg dark:text-white"
                />
              </div>
              <div className="flex items-center gap-3 pt-1">
                <label className="flex items-center gap-2 cursor-pointer text-xs text-slate-700 dark:text-slate-300 font-medium">
                  <input
                    type="checkbox"
                    name="tmdbApiKeyConfigured"
                    defaultChecked={settings.iptv.tmdbApiKeyConfigured}
                    className="w-4 h-4 text-emerald-600 rounded border-slate-300"
                  />
                  <span>Enrichir automatiquement les fiches VOD/Films via l'API TMDb</span>
                </label>
              </div>
            </div>

            <div className="flex justify-end pt-2">
              <button
                type="submit"
                className="flex items-center gap-2 px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-semibold shadow-md transition-all"
              >
                <Save className="w-4 h-4" />
                Enregistrer Paramètres IPTV
              </button>
            </div>
          </form>
        </div>
      )}

      {/* TAB 6: AI CORE GEMINI */}
      {activeSubTab === 'ai' && (
        <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 border border-slate-200 dark:border-slate-800 space-y-6 shadow-sm">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-emerald-500" />
              Paramètres AI Core Gemini, Modèles & Agents Intelligents
            </h3>
            <span className="text-xs text-emerald-600 dark:text-emerald-400 font-mono font-bold bg-emerald-500/10 px-2.5 py-1 rounded-lg border border-emerald-500/20">
              Gemini SDK Server-Side Active
            </span>
          </div>

          <form
            onSubmit={(e) => {
              e.preventDefault();
              const fd = new FormData(e.currentTarget);
              const agentsStr = String(fd.get('activeAgentsList') || '');

              handleSaveSection('aiCore', {
                assistantsEnabled: fd.get('assistantsEnabled') === 'on',
                aiLogsEnabled: fd.get('aiLogsEnabled') === 'on',
                autoDocGenerationEnabled: fd.get('autoDocGenerationEnabled') === 'on',
                modelAlias: String(fd.get('modelAlias') || 'Gemini 3.6 Flash'),
                fallbackModelAlias: String(fd.get('fallbackModelAlias') || 'Gemini 1.5 Pro'),
                maxContextTokens: parseInt(String(fd.get('maxContextTokens')), 10) || 32000,
                rateLimitPerUserMin: parseInt(String(fd.get('rateLimitPerUserMin')), 10) || 60,
                temperature: parseFloat(String(fd.get('temperature'))) || 0.2,
                activeAgentsList: agentsStr.split(',').map(s => s.trim()).filter(Boolean)
              });
            }}
            className="space-y-6"
          >
            {/* Moteur & Modèles */}
            <div className="p-4 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-200 dark:border-slate-700 space-y-4">
              <h4 className="text-xs font-bold uppercase text-slate-500 dark:text-slate-400 tracking-wider flex items-center gap-2">
                <Cpu className="w-4 h-4 text-emerald-500" />
                1. Choix du Modèle Principal & Repli (Fallback)
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">Modèle Principal</label>
                  <select
                    name="modelAlias"
                    defaultValue={settings.aiCore.modelAlias}
                    className="w-full text-xs px-3 py-2 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg dark:text-white"
                  >
                    <option value="Gemini 3.6 Flash">Gemini 3.6 Flash (Haute Performance &amp; Latence Rôle)</option>
                    <option value="Gemini 1.5 Pro">Gemini 1.5 Pro (Raisonnement Complexe &amp; Visioconf)</option>
                    <option value="Gemini 2.0 Flash">Gemini 2.0 Flash (Super Rapide)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">Modèle de Repli (Fallback)</label>
                  <select
                    name="fallbackModelAlias"
                    defaultValue={settings.aiCore.fallbackModelAlias || 'Gemini 1.5 Pro'}
                    className="w-full text-xs px-3 py-2 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg dark:text-white"
                  >
                    <option value="Gemini 1.5 Pro">Gemini 1.5 Pro</option>
                    <option value="Gemini 1.5 Flash">Gemini 1.5 Flash</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">Température de Génération</label>
                  <input
                    type="number"
                    step="0.1"
                    min="0"
                    max="1"
                    name="temperature"
                    defaultValue={settings.aiCore.temperature}
                    className="w-full text-xs px-3 py-2 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg dark:text-white"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
                <div>
                  <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">Limite Contexte Tokens</label>
                  <input
                    type="number"
                    name="maxContextTokens"
                    defaultValue={settings.aiCore.maxContextTokens}
                    className="w-full text-xs px-3 py-2 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg dark:text-white"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">Quota Réponses / Utilisateur / Min</label>
                  <input
                    type="number"
                    name="rateLimitPerUserMin"
                    defaultValue={settings.aiCore.rateLimitPerUserMin}
                    className="w-full text-xs px-3 py-2 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg dark:text-white"
                  />
                </div>
              </div>
            </div>

            {/* Agents & Generative Tools */}
            <div className="p-4 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-200 dark:border-slate-700 space-y-4">
              <h4 className="text-xs font-bold uppercase text-slate-500 dark:text-slate-400 tracking-wider flex items-center gap-2">
                <Users className="w-4 h-4 text-emerald-500" />
                2. Agents IA Spécialisés & Génération de Documents
              </h4>
              <div>
                <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">Agents Spécialisés Actifs (séparés par virgules)</label>
                <input
                  type="text"
                  name="activeAgentsList"
                  defaultValue={(settings.aiCore.activeAgentsList || ['Assistant Voyageur', 'Agent Transport & Flotte', 'Agent Hôtellerie', 'Agent Vision Sécurité', 'Agent IPTV Content']).join(', ')}
                  className="w-full text-xs px-3 py-2 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg dark:text-white font-mono"
                />
              </div>

              <div className="flex flex-wrap gap-4 pt-1">
                <label className="flex items-center gap-2 cursor-pointer text-xs text-slate-700 dark:text-slate-300 font-medium">
                  <input
                    type="checkbox"
                    name="assistantsEnabled"
                    defaultChecked={settings.aiCore.assistantsEnabled}
                    className="w-4 h-4 text-emerald-600 rounded border-slate-300"
                  />
                  <span>Activer les Assistants IA conversationnels sur les portails</span>
                </label>

                <label className="flex items-center gap-2 cursor-pointer text-xs text-slate-700 dark:text-slate-300 font-medium">
                  <input
                    type="checkbox"
                    name="aiLogsEnabled"
                    defaultChecked={settings.aiCore.aiLogsEnabled}
                    className="w-4 h-4 text-emerald-600 rounded border-slate-300"
                  />
                  <span>Enregistrer les journaux d'exécution IA pour audit</span>
                </label>

                <label className="flex items-center gap-2 cursor-pointer text-xs text-slate-700 dark:text-slate-300 font-medium">
                  <input
                    type="checkbox"
                    name="autoDocGenerationEnabled"
                    defaultChecked={settings.aiCore.autoDocGenerationEnabled}
                    className="w-4 h-4 text-emerald-600 rounded border-slate-300"
                  />
                  <span>Autoriser la génération automatique de reçus &amp; rapports par l'IA</span>
                </label>
              </div>
            </div>

            <div className="flex justify-end pt-2">
              <button
                type="submit"
                className="flex items-center gap-2 px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-semibold shadow-md transition-all"
              >
                <Save className="w-4 h-4" />
                Enregistrer Paramètres AI Core
              </button>
            </div>
          </form>
        </div>
      )}

      {/* TAB 7: NOTIFICATIONS */}
      {activeSubTab === 'notifications' && (
        <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 border border-slate-200 dark:border-slate-800 space-y-6 shadow-sm">
          <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <Bell className="w-5 h-5 text-emerald-500" />
            Paramètres du Hub de Notifications Multi-Canal
          </h3>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              const fd = new FormData(e.currentTarget);
              handleSaveSection('notifications', {
                pushEnabled: fd.get('pushEnabled') === 'on',
                smsEnabled: fd.get('smsEnabled') === 'on',
                emailEnabled: fd.get('emailEnabled') === 'on',
                internalEnabled: fd.get('internalEnabled') === 'on',
                templates: {
                  welcomeMessage: String(fd.get('welcomeMessage') || ''),
                  bookingConfirmation: String(fd.get('bookingConfirmation') || ''),
                  securityAlertMsg: String(fd.get('securityAlertMsg') || ''),
                  paymentReceipt: String(fd.get('paymentReceipt') || '')
                }
              });
            }}
            className="space-y-6"
          >
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 p-4 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-200 dark:border-slate-700">
              <label className="flex items-center gap-2 cursor-pointer text-xs font-semibold text-slate-800 dark:text-slate-200">
                <input type="checkbox" name="pushEnabled" defaultChecked={settings.notifications.pushEnabled} className="w-4 h-4 text-emerald-600 rounded" />
                <span>Push Mobile FCM</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer text-xs font-semibold text-slate-800 dark:text-slate-200">
                <input type="checkbox" name="smsEnabled" defaultChecked={settings.notifications.smsEnabled} className="w-4 h-4 text-emerald-600 rounded" />
                <span>SMS National</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer text-xs font-semibold text-slate-800 dark:text-slate-200">
                <input type="checkbox" name="emailEnabled" defaultChecked={settings.notifications.emailEnabled} className="w-4 h-4 text-emerald-600 rounded" />
                <span>Email SMTP</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer text-xs font-semibold text-slate-800 dark:text-slate-200">
                <input type="checkbox" name="internalEnabled" defaultChecked={settings.notifications.internalEnabled} className="w-4 h-4 text-emerald-600 rounded" />
                <span>In-App Cloche</span>
              </label>
            </div>

            <div className="space-y-3">
              <h4 className="text-xs font-bold uppercase text-slate-400">Modèles de Messages Transactionnels</h4>
              <div>
                <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">Message de Bienvenue</label>
                <input type="text" name="welcomeMessage" defaultValue={settings.notifications.templates.welcomeMessage} className="w-full text-xs px-3 py-2 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg dark:text-white" />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">Confirmation de Réservation</label>
                <input type="text" name="bookingConfirmation" defaultValue={settings.notifications.templates.bookingConfirmation} className="w-full text-xs px-3 py-2 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg dark:text-white" />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">Alerte Sécurité Caméra</label>
                <input type="text" name="securityAlertMsg" defaultValue={settings.notifications.templates.securityAlertMsg} className="w-full text-xs px-3 py-2 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg dark:text-white" />
              </div>
            </div>

            <div className="flex justify-end pt-2">
              <button type="submit" className="flex items-center gap-2 px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-semibold shadow-md transition-all">
                <Save className="w-4 h-4" />
                Enregistrer Modèles Notifications
              </button>
            </div>
          </form>
        </div>
      )}

      {/* TAB 8: FINANCIAL */}
      {activeSubTab === 'financial' && (
        <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 border border-slate-200 dark:border-slate-800 space-y-6 shadow-sm">
          <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <CreditCard className="w-5 h-5 text-emerald-500" />
            Paramètres Financiers, Tarification & Mobile Money
          </h3>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              const fd = new FormData(e.currentTarget);
              handleSaveSection('financial', {
                currency: String(fd.get('currency') || 'FCFA (XOF)'),
                vatPercent: parseFloat(String(fd.get('vatPercent'))) || 18.0,
                agencyCommissionPercent: parseFloat(String(fd.get('agencyCommissionPercent'))) || 5.0,
                hotelCommissionPercent: parseFloat(String(fd.get('hotelCommissionPercent'))) || 8.0,
                bookingFeeFlatFcfa: parseInt(String(fd.get('bookingFeeFlatFcfa')), 10) || 250,
                autoRefundAllowed: fd.get('autoRefundAllowed') === 'on',
                payoutSchedule: (fd.get('payoutSchedule') as any) || 'DAILY'
              });
            }}
            className="space-y-6"
          >
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">Devise Officielle</label>
                <input type="text" name="currency" defaultValue={settings.financial.currency} className="w-full text-xs px-3 py-2 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg dark:text-white" />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">TVA (%)</label>
                <input type="number" step="0.1" name="vatPercent" defaultValue={settings.financial.vatPercent} className="w-full text-xs px-3 py-2 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg dark:text-white" />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">Frais de Service Fixes (FCFA)</label>
                <input type="number" name="bookingFeeFlatFcfa" defaultValue={settings.financial.bookingFeeFlatFcfa} className="w-full text-xs px-3 py-2 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg dark:text-white" />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">Fréquence des Versements Partenaires</label>
                <select name="payoutSchedule" defaultValue={settings.financial.payoutSchedule} className="w-full text-xs px-3 py-2 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg dark:text-white">
                  <option value="DAILY">Quotidien (Tous les soirs 23h59)</option>
                  <option value="WEEKLY">Hebdomadaire (Chaque Lundi)</option>
                  <option value="MONTHLY">Mensuel (Premier du mois)</option>
                </select>
              </div>
              <div className="flex items-center gap-3 pt-6">
                <label className="flex items-center gap-2 cursor-pointer text-xs text-slate-700 dark:text-slate-300 font-medium">
                  <input type="checkbox" name="autoRefundAllowed" defaultChecked={settings.financial.autoRefundAllowed} className="w-4 h-4 text-emerald-600 rounded border-slate-300" />
                  <span>Autoriser le remboursement automatique sous 24h</span>
                </label>
              </div>
            </div>

            <div className="flex justify-end pt-2">
              <button type="submit" className="flex items-center gap-2 px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-semibold shadow-md transition-all">
                <Save className="w-4 h-4" />
                Enregistrer Paramètres Financiers
              </button>
            </div>
          </form>
        </div>
      )}
      {activeSubTab === 'rbac' && (
        <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 border border-slate-200 dark:border-slate-800 space-y-6 shadow-sm">
          <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <Users className="w-5 h-5 text-emerald-500" />
            Règles RBAC, Auto-Provisionnement & Sécurité
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="p-4 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-200 dark:border-slate-700 space-y-3">
              <h4 className="text-sm font-semibold text-slate-900 dark:text-white">Auto-Provisionnement Automatique</h4>
              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={settings.rbac.autoProvisionAgencyAdmin}
                  onChange={(e) => handleSaveSection('rbac', { autoProvisionAgencyAdmin: e.target.checked })}
                  className="w-4 h-4 text-emerald-600 rounded"
                />
                <span className="text-xs font-medium text-slate-800 dark:text-slate-200">Générer automatiquement un compte Admin Agence</span>
              </label>
              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={settings.rbac.autoProvisionHotelAdmin}
                  onChange={(e) => handleSaveSection('rbac', { autoProvisionHotelAdmin: e.target.checked })}
                  className="w-4 h-4 text-emerald-600 rounded"
                />
                <span className="text-xs font-medium text-slate-800 dark:text-slate-200">Générer automatiquement un compte Admin Hôtel</span>
              </label>
            </div>
            <div className="p-4 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-200 dark:border-slate-700 space-y-3">
              <h4 className="text-sm font-semibold text-slate-900 dark:text-white">Sécurité & Expiration</h4>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] text-slate-500 mb-1">Essais Max Connexion</label>
                  <input
                    type="number"
                    defaultValue={settings.rbac.loginMaxAttempts}
                    onChange={(e) => handleSaveSection('rbac', { loginMaxAttempts: parseInt(e.target.value, 10) || 5 })}
                    className="w-full text-xs px-3 py-1.5 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg dark:text-white"
                  />
                </div>
                <div>
                  <label className="block text-[11px] text-slate-500 mb-1">Timeout Session (min)</label>
                  <input
                    type="number"
                    defaultValue={settings.rbac.sessionTimeoutMinutes}
                    onChange={(e) => handleSaveSection('rbac', { sessionTimeoutMinutes: parseInt(e.target.value, 10) || 60 })}
                    className="w-full text-xs px-3 py-1.5 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg dark:text-white"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB MEDIA MANAGEMENT CENTER */}
      {activeSubTab === 'media' && (
        <MediaManagementCenter />
      )}

      {/* TAB SYNC & AUDIT */}
      {activeSubTab === 'sync' && (
        <div className="space-y-6">
          {conflicts.filter(c => c.status === 'PENDING_RESOLVE').length > 0 && (
            <div className="bg-amber-950/40 border border-amber-500/40 rounded-2xl p-6 text-amber-200 space-y-4">
              <div className="flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-amber-400" />
                <h3 className="text-sm font-bold">Conflits de Synchronisation Détectés ({conflicts.filter(c => c.status === 'PENDING_RESOLVE').length})</h3>
              </div>
              <div className="space-y-3">
                {conflicts.filter(c => c.status === 'PENDING_RESOLVE').map((cfl) => (
                  <div key={cfl.id} className="p-4 bg-slate-900/90 rounded-xl border border-amber-500/30 flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                      <div className="flex items-center gap-2 text-xs font-bold text-white mb-1">
                        <span className="px-2 py-0.5 bg-amber-500/20 text-amber-300 rounded text-[10px]">{cfl.module}</span>
                        <span>{cfl.tenantName}</span>
                      </div>
                      <p className="text-xs text-slate-300">
                        Paramètre : <code className="text-emerald-400">{cfl.parameterKey}</code> | National : <span className="font-semibold text-white">{cfl.globalValue}</span> vs Local : <span className="font-semibold text-amber-300">{cfl.tenantValue}</span>
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <button onClick={() => handleResolveConflict(cfl.id, 'RESOLVED_GLOBAL')} className="px-3 py-1.5 bg-emerald-600 text-white rounded-lg text-xs font-medium">Règle Nationale</button>
                      <button onClick={() => handleResolveConflict(cfl.id, 'OVERRIDDEN_TENANT')} className="px-3 py-1.5 bg-slate-700 text-slate-200 rounded-lg text-xs font-medium">Exception Locale</button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 border border-slate-200 dark:border-slate-800 space-y-4 shadow-sm">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <History className="w-5 h-5 text-emerald-500" />
                Historique des Versions & Restauration (Rollback 1-Clic)
              </h3>
              <button onClick={() => setShowImpactModal(true)} className="flex items-center gap-1.5 px-3.5 py-1.5 bg-emerald-600 text-white rounded-lg text-xs font-semibold">
                <Plus className="w-4 h-4" /> Sauvegarder Snapshot
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-600 dark:text-slate-300">
                <thead className="bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 uppercase text-[10px] tracking-wider">
                  <tr>
                    <th className="p-3 rounded-l-lg">Version</th>
                    <th className="p-3">Horodatage</th>
                    <th className="p-3">Auteur</th>
                    <th className="p-3">Changement</th>
                    <th className="p-3 text-right rounded-r-lg">Rollback</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                  {versionHistory.map((ver, idx) => (
                    <tr key={ver.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                      <td className="p-3 font-mono font-bold text-emerald-600 dark:text-emerald-400">
                        {ver.version}
                        {idx === 0 && <span className="ml-2 px-1.5 py-0.5 text-[9px] bg-emerald-100 dark:bg-emerald-950 text-emerald-700 rounded">Actuel</span>}
                      </td>
                      <td className="p-3 text-slate-500">{ver.timestamp ? new Date(ver.timestamp).toLocaleString('fr-FR') : 'N/A'}</td>
                      <td className="p-3 font-medium">{ver.authorEmail}</td>
                      <td className="p-3 text-slate-700 dark:text-slate-200">{ver.changeSummary}</td>
                      <td className="p-3 text-right">
                        {idx !== 0 && (
                          <button onClick={() => handleRollback(ver.id)} className="inline-flex items-center gap-1 px-3 py-1 bg-amber-500/10 text-amber-600 dark:text-amber-400 rounded-lg text-xs font-semibold border border-amber-500/30">
                            <RotateCcw className="w-3.5 h-3.5" /> Restaurer
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 border border-slate-200 dark:border-slate-800 space-y-4 shadow-sm">
            <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <FileText className="w-5 h-5 text-emerald-500" />
              Journal d'Audit Immuable de Gouvernance
            </h3>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-600 dark:text-slate-300">
                <thead className="bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 uppercase text-[10px] tracking-wider">
                  <tr>
                    <th className="p-3 rounded-l-lg">Horodatage</th>
                    <th className="p-3">Utilisateur</th>
                    <th className="p-3">Module</th>
                    <th className="p-3">Clé Paramètre</th>
                    <th className="p-3">Ancienne</th>
                    <th className="p-3">Nouvelle</th>
                    <th className="p-3 text-right rounded-r-lg">Statut</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                  {auditLogs.map((log) => (
                    <tr key={log.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                      <td className="p-3 text-slate-500 font-mono text-[11px]">{new Date(log.timestamp).toLocaleTimeString('fr-FR')}</td>
                      <td className="p-3 font-medium">{log.userEmail}</td>
                      <td className="p-3"><span className="px-2 py-0.5 bg-slate-200 dark:bg-slate-800 rounded text-[10px] font-bold">{log.module}</span></td>
                      <td className="p-3 font-mono text-emerald-600 dark:text-emerald-400">{log.parameterKey}</td>
                      <td className="p-3 font-mono text-slate-400 max-w-[120px] truncate">{log.oldValue}</td>
                      <td className="p-3 font-mono text-slate-900 dark:text-white max-w-[120px] truncate">{log.newValue}</td>
                      <td className="p-3 text-right">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${log.status === 'Succès' ? 'bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300' : 'bg-amber-100 dark:bg-amber-950 text-amber-700'}`}>
                          {log.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 1: IMPACT ASSESSMENT BEFORE SYNCHRONIZATION */}
      {showImpactModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 text-white rounded-2xl max-w-lg w-full p-6 border border-emerald-500/40 shadow-2xl space-y-5 animate-in fade-in zoom-in duration-200">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-amber-400" />
                <h3 className="text-base font-bold">Résumé d'Impact & Confirmation de Sync</h3>
              </div>
              <button onClick={() => setShowImpactModal(false)} className="p-1 text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-xs text-slate-300">
              Avant de déployer la version <strong className="text-emerald-400">{settings.version}</strong>, voici l'évaluation d'impact en temps réel sur les nœuds nationaux :
            </p>

            <div className="grid grid-cols-2 gap-3">
              <div className="p-3 bg-slate-800/80 rounded-xl border border-slate-700 text-center">
                <span className="text-xl font-bold text-emerald-400">14</span>
                <p className="text-[11px] text-slate-400">Agences de Transport</p>
              </div>
              <div className="p-3 bg-slate-800/80 rounded-xl border border-slate-700 text-center">
                <span className="text-xl font-bold text-emerald-400">28</span>
                <p className="text-[11px] text-slate-400">Hôtels Connectés</p>
              </div>
              <div className="p-3 bg-slate-800/80 rounded-xl border border-slate-700 text-center">
                <span className="text-xl font-bold text-emerald-400">5</span>
                <p className="text-[11px] text-slate-400">Modules Impactés</p>
              </div>
              <div className="p-3 bg-slate-800/80 rounded-xl border border-slate-700 text-center">
                <span className="text-xl font-bold text-emerald-400">~124,500</span>
                <p className="text-[11px] text-slate-400">Voyageurs Raccordés</p>
              </div>
            </div>

            <div className="p-3 bg-emerald-950/50 border border-emerald-500/30 rounded-xl text-xs text-emerald-200 space-y-1">
              <p className="font-semibold">✓ Non-destructif & Réversible</p>
              <p className="text-[11px] text-emerald-300/80">Un snapshot immuable sera automatiquement enregistré pour permettre le rollback en 1-clic.</p>
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                onClick={() => setShowImpactModal(false)}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-semibold"
              >
                Annuler
              </button>
              <button
                onClick={handleConfirmPropagate}
                className="px-5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-semibold shadow-lg shadow-emerald-900/40"
              >
                Confirmer & Propager la Config
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 2: MULTI-DEVICE LIVE PREVIEW */}
      {showPreviewModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 text-white rounded-2xl max-w-4xl w-full p-6 border border-slate-700 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-3">
                <Monitor className="w-5 h-5 text-emerald-400" />
                <h3 className="text-base font-bold">Mode Prévisualisation Multi-Écran</h3>
              </div>

              {/* Device Selector */}
              <div className="flex items-center gap-1 bg-slate-800 p-1 rounded-xl border border-slate-700">
                <button
                  onClick={() => setPreviewDevice('mobile')}
                  className={`flex items-center gap-1 px-3 py-1 rounded-lg text-xs font-semibold transition-all ${
                    previewDevice === 'mobile' ? 'bg-emerald-600 text-white' : 'text-slate-400 hover:text-white'
                  }`}
                >
                  <Smartphone className="w-3.5 h-3.5" /> Mobile
                </button>
                <button
                  onClick={() => setPreviewDevice('tablet')}
                  className={`flex items-center gap-1 px-3 py-1 rounded-lg text-xs font-semibold transition-all ${
                    previewDevice === 'tablet' ? 'bg-emerald-600 text-white' : 'text-slate-400 hover:text-white'
                  }`}
                >
                  <Tablet className="w-3.5 h-3.5" /> Tablette
                </button>
                <button
                  onClick={() => setPreviewDevice('desktop')}
                  className={`flex items-center gap-1 px-3 py-1 rounded-lg text-xs font-semibold transition-all ${
                    previewDevice === 'desktop' ? 'bg-emerald-600 text-white' : 'text-slate-400 hover:text-white'
                  }`}
                >
                  <Monitor className="w-3.5 h-3.5" /> Ordinateur
                </button>
              </div>

              <button onClick={() => setShowPreviewModal(false)} className="p-1 text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Preview Frame */}
            <div className="flex justify-center bg-slate-950 p-6 rounded-xl border border-slate-800 overflow-hidden min-h-[380px]">
              <div
                className={`transition-all bg-slate-900 text-white rounded-2xl border border-slate-700 p-4 shadow-2xl flex flex-col justify-between ${
                  previewDevice === 'mobile'
                    ? 'w-[320px] h-[480px]'
                    : previewDevice === 'tablet'
                    ? 'w-[540px] h-[440px]'
                    : 'w-full max-w-2xl h-[420px]'
                }`}
              >
                {/* Header Mock */}
                <div className="border-b border-slate-800 pb-3 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 bg-emerald-600 rounded-lg flex items-center justify-center font-bold text-xs">
                      IX
                    </div>
                    <div>
                      <h4 className="text-xs font-bold leading-tight">{settings.general.platformName}</h4>
                      <p className="text-[10px] text-emerald-400 truncate max-w-[200px]">{settings.general.tagline}</p>
                    </div>
                  </div>
                  <span className="text-[10px] bg-emerald-950 text-emerald-300 px-2 py-0.5 rounded font-mono border border-emerald-500/30">FR</span>
                </div>

                {/* Main Hero Mock */}
                <div className="my-auto space-y-3 text-center p-4 bg-gradient-to-b from-emerald-950/40 to-slate-900 rounded-xl border border-emerald-500/20">
                  <h3 className="text-sm font-bold text-emerald-300">{settings.uxui.customHeaderMessage}</h3>
                  <p className="text-xs text-slate-300">Réservation de billets de bus, suites d'hôtels & Smart IPTV intégrés.</p>
                  <div className="flex justify-center gap-2 pt-2">
                    <span className="px-3 py-1 bg-emerald-600 text-white rounded-lg text-xs font-bold shadow">Réserver Transport</span>
                    <span className="px-3 py-1 bg-slate-800 text-slate-200 rounded-lg text-xs font-bold">Explorer Hôtels</span>
                  </div>
                </div>

                {/* Footer Mock */}
                <div className="border-t border-slate-800 pt-2 flex items-center justify-between text-[10px] text-slate-500">
                  <span>{settings.general.contactPhone}</span>
                  <span>{settings.general.currency}</span>
                </div>
              </div>
            </div>

            <div className="flex justify-end">
              <button
                onClick={() => setShowPreviewModal(false)}
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-semibold"
              >
                Fermer Aperçu
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 3: API EDITING FORM */}
      {editingApi && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 text-white rounded-2xl max-w-md w-full p-6 border border-slate-700 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-sm font-bold flex items-center gap-2">
                <Code className="w-4 h-4 text-emerald-400" />
                {editingApi.name ? `Éditer API : ${editingApi.name}` : 'Nouvelle Intégration API'}
              </h3>
              <button onClick={() => setEditingApi(null)} className="p-1 text-slate-400 hover:text-white">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveApiForm} className="space-y-3">
              <div>
                <label className="block text-xs text-slate-400 mb-1">Catégorie Service</label>
                <select
                  value={editingApi.category || 'IA'}
                  onChange={(e) => setEditingApi({ ...editingApi, category: e.target.value as any })}
                  className="w-full text-xs px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white"
                >
                  <option value="IA">Intelligence Artificielle (OpenAI, Gemini, Claude, DeepSeek)</option>
                  <option value="CINEMA">Cinéma & VOD (TMDb, OMDb)</option>
                  <option value="MAPS">Cartographie (Google Maps, Mapbox)</option>
                  <option value="PAYMENT">Paiement Mobile (Wave, Orange, MTN, Carte)</option>
                  <option value="COMMUNICATION">Messagerie (Twilio, WhatsApp, FCM)</option>
                  <option value="CLOUD">Services Cloud (Firebase, GCP, AWS)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs text-slate-400 mb-1">Nom du Service API</label>
                <input
                  type="text"
                  required
                  value={editingApi.name || ''}
                  onChange={(e) => setEditingApi({ ...editingApi, name: e.target.value })}
                  placeholder="Ex: Gemini Flash 3.6 SDK"
                  className="w-full text-xs px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white"
                />
              </div>

              <div>
                <label className="block text-xs text-slate-400 mb-1">URL Endpoint API Base</label>
                <input
                  type="text"
                  required
                  value={editingApi.url || ''}
                  onChange={(e) => setEditingApi({ ...editingApi, url: e.target.value })}
                  placeholder="https://api.provider.com/v1"
                  className="w-full text-xs px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white font-mono"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs text-slate-400 mb-1">Clé Publique / ID</label>
                  <input
                    type="text"
                    value={editingApi.publicKey || ''}
                    onChange={(e) => setEditingApi({ ...editingApi, publicKey: e.target.value })}
                    className="w-full text-xs px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white font-mono"
                  />
                </div>
                <div>
                  <label className="block text-xs text-slate-400 mb-1">Environnement</label>
                  <select
                    value={editingApi.environment || 'PRODUCTION'}
                    onChange={(e) => setEditingApi({ ...editingApi, environment: e.target.value as any })}
                    className="w-full text-xs px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white"
                  >
                    <option value="DEVELOPMENT">Développement</option>
                    <option value="TEST">Test / Staging</option>
                    <option value="PRODUCTION">Production</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs text-slate-400 mb-1">Secret / Token Privé (Chiffré)</label>
                <input
                  type="password"
                  value={editingApi.privateKey || ''}
                  onChange={(e) => setEditingApi({ ...editingApi, privateKey: e.target.value })}
                  placeholder="••••••••••••••••••••"
                  className="w-full text-xs px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white font-mono"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setEditingApi(null)}
                  className="px-3 py-1.5 bg-slate-800 text-slate-300 rounded-lg text-xs"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-semibold"
                >
                  Enregistrer Service API
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
