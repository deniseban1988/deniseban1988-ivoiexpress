import React, { useState } from 'react';
import { TransportAgency, Hotel, Camera, VisionAlert, AuditLog, TicketBooking, HotelBooking } from '../../types';
import {
  IPTVContentItem,
  IPTVPlaylist,
  IPTVProvider,
  IPTVGlobalSettings,
  IPTVNotification
} from '../../types/iptv';
import { useIPTV } from '../../core/context/IPTVContext';
import { 
  ShieldCheck, Building2, Hotel as HotelIcon, Eye, ShieldAlert, FileText, Plus, Power, CheckCircle2, 
  Lock, Sparkles, RefreshCw, Layers, Tv, Users, Activity, Server, Smartphone, Bell, HardDrive, Wrench, Search, Grid, MapPin
} from 'lucide-react';
import { VisionDashboard } from '../vision/VisionDashboard';
import { SuperAdminIPTV } from '../iptv/SuperAdminIPTV';
import { AICoreManagement } from '../ai/AICoreManagement';
import { ArchitectureDocsViewer } from '../common/ArchitectureDocsViewer';
import { GlobalSettingsAndSyncModule } from './GlobalSettingsAndSyncModule';
import { UserManagementModule } from './UserManagementModule';
import { AddHotelModal } from '../hoteladmin/AddHotelModal';
import { AddAgencyModal } from './AddAgencyModal';
import { CreateHotelParams } from '../../core/ports/hotel.ports';
import { CreateAgencyParams } from '../../core/ports/transport.ports';
import { SmartServiceCard, ServiceCardTheme } from '../common/SmartServiceCard';
import { SynchronizedBannersBar } from '../common/SynchronizedBannersBar';
import { resetScrollToTop } from '../../lib/navigationScroll';
import { HOTEL_RECEPTIONIST_IMAGE } from '../../assets/welcomeAssets';

interface SuperAdminDashboardProps {
  agencies: TransportAgency[];
  hotels: Hotel[];
  cameras: Camera[];
  alerts: VisionAlert[];
  auditLogs: AuditLog[];
  ticketBookings: TicketBooking[];
  hotelBookings: HotelBooking[];
  // IPTV Props
  iptvSettings: IPTVGlobalSettings;
  iptvContents: IPTVContentItem[];
  iptvPlaylists: IPTVPlaylist[];
  iptvProviders: IPTVProvider[];
  iptvNotifications: IPTVNotification[];
  onUpdateIptvSettings: (settings: IPTVGlobalSettings) => void;
  onAddIptvContent: (item: IPTVContentItem) => void;
  onUpdateIptvContent: (item: IPTVContentItem) => void;
  onDeleteIptvContent: (id: string) => void;
  onAddIptvPlaylist: (playlist: IPTVPlaylist) => void;
  onSyncIptvPlaylist: (id: string) => void;
  onAddIptvNotification: (notif: IPTVNotification) => void;

  onToggleAgencyStatus: (agencyId: string) => void;
  onCreateAgency: (params: CreateAgencyParams) => Promise<void> | void;
  onCreateHotel: (params: CreateHotelParams) => Promise<void> | void;
  onGenerateAIReport: (reportType: string) => void;
  activeTab?: 'cards' | 'users' | 'kpis' | 'agencies' | 'hotels' | 'vision' | 'iptv' | 'audit' | 'ai' | 'architecture' | 'settings';
  onTabChange?: (tab: 'cards' | 'users' | 'kpis' | 'agencies' | 'hotels' | 'vision' | 'iptv' | 'audit' | 'ai' | 'architecture' | 'settings') => void;
}

export const SuperAdminDashboard: React.FC<SuperAdminDashboardProps> = ({
  agencies,
  hotels,
  cameras,
  alerts,
  auditLogs,
  ticketBookings,
  hotelBookings,
  iptvSettings,
  iptvContents,
  iptvPlaylists,
  iptvProviders,
  iptvNotifications,
  onUpdateIptvSettings,
  onAddIptvContent,
  onUpdateIptvContent,
  onDeleteIptvContent,
  onAddIptvPlaylist,
  onSyncIptvPlaylist,
  onAddIptvNotification,
  onToggleAgencyStatus,
  onCreateAgency,
  onCreateHotel,
  onGenerateAIReport,
  activeTab: controlledActiveTab,
  onTabChange: controlledOnTabChange
}) => {
  const [localActiveTab, setLocalActiveTab] = useState<'cards' | 'users' | 'kpis' | 'agencies' | 'hotels' | 'vision' | 'iptv' | 'audit' | 'ai' | 'architecture' | 'settings'>('cards');
  const iptvContext = useIPTV();
  const totalIptvCount = Math.max(iptvContents?.length || 0, iptvContext?.contents?.length || 0);
  const activeTab = controlledActiveTab !== undefined ? controlledActiveTab : localActiveTab;
  const setActiveTab = (tab: 'cards' | 'users' | 'kpis' | 'agencies' | 'hotels' | 'vision' | 'iptv' | 'audit' | 'ai' | 'architecture' | 'settings') => {
    setLocalActiveTab(tab);
    resetScrollToTop();
    if (controlledOnTabChange) {
      controlledOnTabChange(tab);
    }
  };
  const [cardSearch, setCardSearch] = useState('');

  // Create Agency Form Modal
  const [showAgencyModal, setShowAgencyModal] = useState<boolean>(false);
  const [showHotelModal, setShowHotelModal] = useState<boolean>(false);
  const [agName, setAgName] = useState<string>('');
  const [agCode, setAgCode] = useState<string>('');
  const [agPhone, setAgPhone] = useState<string>('');
  const [agEmail, setAgEmail] = useState<string>('');
  const [agAddress, setAgAddress] = useState<string>('');
  const [agRegion, setAgRegion] = useState<string>('Lagunes');
  const [agCity, setAgCity] = useState<string>('Abidjan');
  const [agCommune, setAgCommune] = useState<string>('Adjamé');
  const [agRccm, setAgRccm] = useState<string>('');
  const [agMoMo, setAgMoMo] = useState<string>('');

  // AI Report State
  const [aiReportOutput, setAiReportOutput] = useState<any | null>(null);
  const [isGeneratingReport, setIsGeneratingReport] = useState<boolean>(false);

  const totalTransportVolume = (ticketBookings || []).reduce((sum, t) => sum + (t?.price || 0), 0);
  const totalHotelVolume = (hotelBookings || []).reduce((sum, h) => sum + (h?.totalPrice || 0), 0);
  const nationalGrossVolume = totalTransportVolume + totalHotelVolume;

  const handleCreateAgency = () => {
    if (!agName.trim() || !agCode.trim()) {
      alert('Veuillez renseigner le nom et le code de la compagnie.');
      return;
    }

    const newAg: TransportAgency = {
      id: `agency-${Date.now()}`,
      name: agName,
      code: agCode.toUpperCase(),
      logo: 'https://images.unsplash.com/photo-1544620347-c4fd4a3d5957?w=150&auto=format&fit=crop&q=80',
      rating: 5.0,
      totalBuses: 10,
      contactPhone: agPhone || '+225 07 00 00 00 00',
      email: agEmail || 'admin@agence.ci',
      address: agAddress || 'Gare Routière Centrale',
      region: agRegion,
      city: agCity,
      commune: agCommune,
      rccmNumber: agRccm || `CI-ABJ-2026-B-${Math.floor(10000 + Math.random() * 90000)}`,
      mobileMoneyAccount: agMoMo || agPhone || '+225 07 00 00 00 00 (Orange/Wave)',
      primaryCities: [agCity, 'Yamoussoukro'],
      status: 'Actif',
      createdAt: new Date().toISOString().substring(0, 10)
    };

    onCreateAgency(newAg);
    setShowAgencyModal(false);
    setAgName('');
    setAgCode('');
    setAgRccm('');
  };

  // 20 Smart Service Cards Configuration for Super Admin
  const superAdminServiceCards = [
    {
      id: 'agencies',
      title: 'Gestion des Agences',
      category: 'Transport & Interurbain',
      description: 'Supervision centrale des compagnies de car, création d\'agences et contrôle multi-tenant.',
      icon: Building2,
      theme: 'emerald' as ServiceCardTheme,
      metricValue: `${agencies.length} Agences`,
      metricLabel: 'Compagnies Actives',
      statusBadge: { text: 'Multi-Tenant', type: 'success' as const },
      quickActionLabel: 'Gérer les Agences',
      onClick: () => setActiveTab('agencies')
    },
    {
      id: 'hotels',
      title: 'Gestion des Hôtels',
      category: 'Hôtellerie & Hébergement',
      description: 'Registre des établissements hôteliers, résidences meublées et gestion des chambres.',
      icon: HotelIcon,
      theme: 'emerald' as ServiceCardTheme,
      metricValue: `${hotels.length} Hôtels`,
      metricLabel: 'Établissements Certifiés',
      statusBadge: { text: 'Disponible', type: 'success' as const },
      quickActionLabel: 'Réseau Hôtelier',
      backgroundImage: HOTEL_RECEPTIONIST_IMAGE,
      onClick: () => setActiveTab('hotels')
    },
    {
      id: 'travelers',
      title: 'Gestion des Voyageurs',
      category: 'Clients & Usagers',
      description: 'Répertoire national des usagers, suivi des réservations et historique des tickets.',
      icon: Users,
      theme: 'blue' as ServiceCardTheme,
      metricValue: `${ticketBookings.length + hotelBookings.length}`,
      metricLabel: 'Réservations Globales',
      statusBadge: { text: 'Actif', type: 'info' as const },
      quickActionLabel: 'Voir Usagers',
      onClick: () => setActiveTab('users')
    },
    {
      id: 'rbac',
      title: 'Gestion Administrateurs & RBAC',
      category: 'Sécurité & Accès',
      description: 'Attribution des rôles Super Admin, Admin Agence et Admin Hôtel avec sécurité renforcée.',
      icon: ShieldCheck,
      theme: 'indigo' as ServiceCardTheme,
      metricValue: '18 Admins',
      metricLabel: 'Comptes Privilégiés',
      statusBadge: { text: 'Sécurisé', type: 'success' as const },
      quickActionLabel: 'Matrice RBAC',
      onClick: () => setActiveTab('users')
    },
    {
      id: 'modules',
      title: 'Gestion des Modules',
      category: 'Système & Feature Flags',
      description: 'Activation et paramétrage dynamique des modules Transport, Hôtels, Vision IA et IPTV.',
      icon: Layers,
      theme: 'purple' as ServiceCardTheme,
      metricValue: '8 Modules',
      metricLabel: 'Modules Déployés',
      statusBadge: { text: '100% Actifs', type: 'success' as const },
      quickActionLabel: 'Configurer Modules'
    },
    {
      id: 'ai',
      title: 'AI Core & Gemini 2.5',
      category: 'Intelligence Artificielle',
      description: 'Moteur central d\'assistance Gemini, génération de rapports et prédictions de fréquentation.',
      icon: Sparkles,
      theme: 'cyan' as ServiceCardTheme,
      metricValue: 'Flash 2.5',
      metricLabel: 'Modèle Actif',
      statusBadge: { text: 'IA Connectée', type: 'info' as const },
      quickActionLabel: 'Paramètres AI Core',
      onClick: () => setActiveTab('ai')
    },
    {
      id: 'vision',
      title: 'Centre Vidéosurveillance Vision',
      category: 'Sécurité IA Temps Réel',
      description: 'Grille nationale de caméras IP/4G, détection automatique d\'intrusions et d\'anomalies.',
      icon: Eye,
      theme: 'blue' as ServiceCardTheme,
      metricValue: `${cameras.length} Caméras`,
      metricLabel: 'Flux HD Directs',
      alertCount: alerts.filter(a => a.status === 'Actif').length,
      statusBadge: { text: 'Vision IA', type: 'info' as const },
      quickActionLabel: 'Grille Caméras',
      onClick: () => setActiveTab('vision')
    },
    {
      id: 'iptv',
      title: 'IPTV Embarqué & Médias',
      category: 'Divertissement Flotte',
      description: 'Gestion des chaînes TV en direct, films à la demande et playlists pour les autocars.',
      icon: Tv,
      theme: 'purple' as ServiceCardTheme,
      metricValue: `${totalIptvCount.toLocaleString('fr-FR')} Médias`,
      metricLabel: 'Catalogue IPTV',
      statusBadge: { text: 'Streaming HD', type: 'success' as const },
      quickActionLabel: 'Gérer l\'IPTV',
      onClick: () => setActiveTab('iptv')
    },
    {
      id: 'payments',
      title: 'Paiements & Mobile Money',
      category: 'Finance & Passerelles',
      description: 'Agrégation des paiements Wave, Orange Money, MTN et Moov avec réconciliation instantanée.',
      icon: Smartphone,
      theme: 'orange' as ServiceCardTheme,
      metricValue: '100% Mobile',
      metricLabel: 'Flux Encaissés',
      statusBadge: { text: 'Wave/Orange/MTN', type: 'warning' as const },
      quickActionLabel: 'Inspecter Flux'
    },
    {
      id: 'finance',
      title: 'Rapports Financiers',
      category: 'Comptabilité & Bilan',
      description: 'Volume brut national, ventilation par agence/hôtel et rapports comptables exportables.',
      icon: FileText,
      theme: 'emerald' as ServiceCardTheme,
      metricValue: `${(nationalGrossVolume / 1000000).toFixed(1)}M FCFA`,
      metricLabel: 'Volume Brut National',
      statusBadge: { text: 'Certifié', type: 'success' as const },
      quickActionLabel: 'Générer Bilan',
      onClick: () => setActiveTab('kpis')
    },
    {
      id: 'stats',
      title: 'Statistiques Globales',
      category: 'Analytics & KPIs',
      description: 'Analyses prédictives, taux de remplissage national et métriques de fréquentation.',
      icon: Activity,
      theme: 'amber' as ServiceCardTheme,
      metricValue: '99.9% Dispo',
      metricLabel: 'SLA National',
      statusBadge: { text: 'Temps Réel', type: 'info' as const },
      quickActionLabel: 'Voir KPIs',
      onClick: () => setActiveTab('kpis')
    },
    {
      id: 'notifs',
      title: 'Notifications Nationales',
      category: 'Broadcast & Urgences',
      description: 'Diffusion d\'alertes météo, annonces de circulation et notifications push ciblées.',
      icon: Bell,
      theme: 'rose' as ServiceCardTheme,
      metricValue: `${iptvNotifications.length} Diffusion`,
      metricLabel: 'Canaux Actifs',
      statusBadge: { text: 'Live Push', type: 'danger' as const },
      quickActionLabel: 'Envoyer Alerte'
    },
    {
      id: 'audit',
      title: 'Journaux d\'Audit',
      category: 'Conformité & Traçabilité',
      description: 'Registre inaltérable des actions administratives, connexions et modifications système.',
      icon: Lock,
      theme: 'slate' as ServiceCardTheme,
      metricValue: `${auditLogs.length} Entrées`,
      metricLabel: 'Audit Traçable',
      statusBadge: { text: 'Inaltérable', type: 'neutral' as const },
      quickActionLabel: 'Voir Registre',
      onClick: () => setActiveTab('audit')
    },
    {
      id: 'security',
      title: 'Sécurité & RGPD',
      category: 'Cyberdéfense & Privacité',
      description: 'Chiffrement AES-256 des données usagers, conformité régulation et isolation des données.',
      icon: ShieldCheck,
      theme: 'rose' as ServiceCardTheme,
      metricValue: 'TLS 1.3',
      metricLabel: 'Chiffrement Actif',
      statusBadge: { text: 'Protect 100%', type: 'danger' as const },
      quickActionLabel: 'Audit Sécurité'
    },
    {
      id: 'backups',
      title: 'Sauvegardes & Cloud',
      category: 'Infrastructures & Redondance',
      description: 'Instantannés automatiques Firestore et Cloud SQL toutes les 15 minutes.',
      icon: HardDrive,
      theme: 'cyan' as ServiceCardTheme,
      metricValue: 'Auto 15m',
      metricLabel: 'Fréquence Backups',
      statusBadge: { text: 'Cloud Run Redondant', type: 'info' as const },
      quickActionLabel: 'Sauvegarder'
    },
    {
      id: 'system',
      title: 'Paramètres Système',
      category: 'Configuration Globale',
      description: 'Variables d\'environnement, endpoints API nationales et configurations du serveur.',
      icon: Server,
      theme: 'slate' as ServiceCardTheme,
      metricValue: 'v2.4 Prod',
      metricLabel: 'Version Platforme',
      statusBadge: { text: 'Stable', type: 'neutral' as const },
      quickActionLabel: 'Réglages Système'
    },
    {
      id: 'sync',
      title: 'Synchronisation Services',
      category: 'Websockets & Master Sync',
      description: 'Maintien de la cohérence d\'état entre les bus, hôtels et le serveur central.',
      icon: RefreshCw,
      theme: 'emerald' as ServiceCardTheme,
      metricValue: '45ms',
      metricLabel: 'Latence Moyenne',
      statusBadge: { text: 'Ultra-Rapide', type: 'success' as const },
      quickActionLabel: 'Forcer Sync'
    },
    {
      id: 'health',
      title: 'Santé de la Plateforme',
      category: 'Supervision Réseau',
      description: 'Monitor de statut des conteneurs Cloud Run, mémoire et bande passante.',
      icon: CheckCircle2,
      theme: 'emerald' as ServiceCardTheme,
      metricValue: '100% OK',
      metricLabel: 'Santé Infrastructure',
      statusBadge: { text: 'Opérationnel', type: 'success' as const },
      quickActionLabel: 'Health Check'
    },
    {
      id: 'maintenance',
      title: 'Centre de Maintenance',
      category: 'Support Technique',
      description: 'Gestion des interventions sur les autocars et matériels hôteliers.',
      icon: Wrench,
      theme: 'amber' as ServiceCardTheme,
      metricValue: '0 Critique',
      metricLabel: 'Pannes Signalées',
      statusBadge: { text: 'A Jour', type: 'warning' as const },
      quickActionLabel: 'Maintenance'
    },
    {
      id: 'architecture',
      title: 'Architecture Hexagonale',
      category: 'Documentation Technique',
      description: 'Spécification complète du code source, ports et adaptateurs IVOIReXpress.',
      icon: Layers,
      theme: 'indigo' as ServiceCardTheme,
      metricValue: 'Clean Code',
      metricLabel: 'Pattern Hexagonal',
      statusBadge: { text: 'Doc v2.0', type: 'info' as const },
      quickActionLabel: 'Consulter Docs',
      onClick: () => setActiveTab('architecture')
    }
  ];

  const filteredCards = superAdminServiceCards.filter(c => 
    c.title.toLowerCase().includes(cardSearch.toLowerCase()) ||
    c.category.toLowerCase().includes(cardSearch.toLowerCase()) ||
    c.description.toLowerCase().includes(cardSearch.toLowerCase())
  );

  return (
    <div className="space-y-6 p-4 sm:p-6 max-w-7xl mx-auto">
      
      {/* Super Admin Control Center Header */}
      <div className="bg-gradient-to-r from-slate-900 via-emerald-950 to-slate-900 rounded-2xl p-6 border border-emerald-900/50 ivx-banner-shadow relative overflow-hidden">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-xs font-bold mb-3">
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>SUPER ADMIN NATIONAL • GOUVERNANCE GLOBALE</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
              Centre de Contrôle National IVOIReXpress
            </h1>
            <p className="mt-2 text-slate-300 text-sm">
              Architecture basée sur les Cartes de Services Intelligentes pour piloter l'ensemble des modules métiers de la plateforme nationale.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3 self-start md:self-auto">
            <button
              onClick={() => setShowAgencyModal(true)}
              className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs flex items-center space-x-2 border border-slate-700 active:scale-95 transition-all"
            >
              <Plus className="w-4 h-4 text-emerald-400" />
              <span>Créer une Agence</span>
            </button>

            <button
              onClick={() => setShowHotelModal(true)}
              className="px-5 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-black text-xs flex items-center space-x-2 shadow-lg shadow-emerald-500/20 active:scale-95 transition-all"
            >
              <Plus className="w-4 h-4" />
              <span>Ajouter un Hôtel</span>
            </button>
          </div>
        </div>

        {/* Sub Navigation Bar */}
        <div className="mt-6 flex flex-wrap gap-2 pt-4 border-t border-slate-800">
          {[
            { id: 'cards', label: "⚡ Grille des Cartes (20)" },
            { id: 'settings', label: "⚙️ Paramétrage & Sync Global" },
            { id: 'architecture', label: "🗄️ Base de Données (Cloud Firestore)" },
            { id: 'users', label: "🔑 Authentification & RBAC" },
            { id: 'kpis', label: "KPIs Nationaux" },
            { id: 'agencies', label: `Agences (${agencies.length})` },
            { id: 'hotels', label: `Hôtels (${hotels.length})` },
            { id: 'vision', label: `Vision IA (${cameras.length})` },
            { id: 'iptv', label: `IPTV (${iptvContents.length})` },
            { id: 'audit', label: `Audit (${auditLogs.length})` },
            { id: 'ai', label: "AI Core" },
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all ${
                activeTab === tab.id
                  ? 'bg-emerald-500 text-slate-950 shadow-md'
                  : 'bg-slate-800/80 hover:bg-slate-700 text-slate-300 border border-slate-700/60'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Synchronized Banners Bar (Cloud Firestore Real-time Sync) */}
      <SynchronizedBannersBar className="my-2" />

      {/* SMART SERVICE CARDS GRID TAB */}
      {activeTab === 'cards' && (
        <div className="space-y-6">
          {/* Search and Filters Header */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-slate-900 border border-slate-800 p-4 rounded-2xl">
            <div>
              <h2 className="text-base font-extrabold text-white flex items-center space-x-2">
                <Grid className="w-4 h-4 text-emerald-400" />
                <span>Centre des Cartes de Services Intelligentes (20 Modules)</span>
              </h2>
              <p className="text-xs text-slate-400">
                Sélectionnez n'importe quel domaine métier pour ouvrir instantanément son centre de gestion dédié.
              </p>
            </div>

            <div className="relative w-full sm:w-72">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Rechercher un domaine métier..."
                value={cardSearch}
                onChange={(e) => setCardSearch(e.target.value)}
                className="w-full bg-slate-950 text-xs text-white pl-9 pr-3 py-2 rounded-xl border border-slate-800 focus:outline-none focus:border-emerald-500"
              />
            </div>
          </div>

          {/* Service Cards Grid (Unified Architecture) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {filteredCards.map(card => (
              <SmartServiceCard key={card.id} {...card} />
            ))}
          </div>
        </div>
      )}


      {/* User Management & Central Auth Tab */}
      {activeTab === 'users' && (
        <UserManagementModule
          agencies={agencies}
          hotels={hotels}
          currentRole="SUPER_ADMIN"
        />
      )}


      {/* KPIs Overview Tab */}
      {activeTab === 'kpis' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 ivx-card-dark-shadow">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Volume Brut National</span>
              <p className="text-2xl font-black text-emerald-400 mt-1">{nationalGrossVolume.toLocaleString()} FCFA</p>
              <span className="text-[10px] text-emerald-400 font-semibold mt-1 inline-block">Transactions sécurisées</span>
            </div>

            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 ivx-card-dark-shadow">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Compagnies Actives</span>
              <p className="text-2xl font-black text-white mt-1">{agencies.filter(a => a.status === 'Actif').length} / {agencies.length}</p>
              <span className="text-[10px] text-slate-400 mt-1 inline-block">Isolées en Multi-Tenant</span>
            </div>

            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 ivx-card-dark-shadow">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Caméras Vision Connectées</span>
              <p className="text-2xl font-black text-blue-400 mt-1">{cameras.length}</p>
              <span className="text-[10px] text-blue-400 font-semibold mt-1 inline-block">Flux HD temps réel</span>
            </div>

            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 ivx-card-dark-shadow">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Incidents Sécurité Résolus</span>
              <p className="text-2xl font-black text-amber-400 mt-1">{alerts.filter(a => a.status === 'Résolu').length} / {alerts.length}</p>
              <span className="text-[10px] text-slate-400 mt-1 inline-block">Analyse IA automatique</span>
            </div>

          </div>
        </div>
      )}

      {/* AI Core Management Tab */}
      {activeTab === 'ai' && (
        <AICoreManagement userRole="SUPER_ADMIN" />
      )}

      {/* Agencies Management Tab */}
      {activeTab === 'agencies' && (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 text-left">
          <h2 className="text-sm font-extrabold text-white mb-4">Gestion des Agences de Transport (Isolation Multi-Tenant)</h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {agencies.map(ag => (
              <div key={ag.id} className="bg-slate-950 p-4 rounded-xl border border-slate-800 flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <img src={ag.logo || 'https://images.unsplash.com/photo-1544620347-c4fd4a3d5957?auto=format&fit=crop&w=120&q=80'} alt={ag.name} className="w-12 h-12 rounded-xl object-cover" />
                  <div>
                    <h3 className="font-extrabold text-white text-sm">{ag.name}</h3>
                    <p className="text-xs text-slate-400">{ag.contactPhone} • {ag.totalBuses} autocars</p>
                  </div>
                </div>

                <button
                  onClick={() => onToggleAgencyStatus(ag.id)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center space-x-1 transition-all ${
                    ag.status === 'Actif'
                      ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                      : 'bg-red-500/20 text-red-400 border border-red-500/30'
                  }`}
                >
                  <Power className="w-3.5 h-3.5" />
                  <span>{ag.status}</span>
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Hotels Management Tab */}
      {activeTab === 'hotels' && (
        <div className="space-y-6">
          {/* Header Banner */}
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-xl relative overflow-hidden">
            <div className="space-y-1 z-10 text-left">
              <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-bold mb-1">
                <Building2 className="w-3.5 h-3.5" />
                <span>Réseau Hôtelier National • Multi-Établissements</span>
              </div>
              <h2 className="text-xl font-extrabold text-white">Gestion du Réseau Hôtelier</h2>
              <p className="text-xs text-slate-400 max-w-xl">
                Supervisez les établissements certifiés, administrez leurs comptes Admin Hôtel et contrôlez l'activation sur l'ensemble du territoire ivoirien.
              </p>
            </div>

            <button
              onClick={() => setShowHotelModal(true)}
              className="px-5 py-3 rounded-2xl bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-black text-xs flex items-center space-x-2 shadow-lg shadow-emerald-500/20 active:scale-95 transition-all self-start md:self-auto shrink-0"
            >
              <Plus className="w-4 h-4" />
              <span>Ajouter un Établissement Hôtelier</span>
            </button>
          </div>

          {/* Stats Bar */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 text-left">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Établissements Totaux</span>
              <p className="text-xl font-black text-white mt-1">{hotels.length} Hôtels & Résidences</p>
              <span className="text-[10px] text-emerald-400 font-semibold mt-0.5 inline-block">100% Certifiés</span>
            </div>
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 text-left">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Établissements Actifs</span>
              <p className="text-xl font-black text-emerald-400 mt-1">{hotels.filter(h => h.status === 'Actif').length} Actifs</p>
              <span className="text-[10px] text-slate-400 mt-0.5 inline-block">Isolation RBAC</span>
            </div>
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 text-left">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Villes Couvertes</span>
              <p className="text-xl font-black text-blue-400 mt-1">{Array.from(new Set(hotels.map(h => h.city))).length} Villes</p>
              <span className="text-[10px] text-blue-400 font-semibold mt-0.5 inline-block">Abidjan, Yamoussoukro, Assinie...</span>
            </div>
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 text-left">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Volume Réservations Hôtels</span>
              <p className="text-xl font-black text-amber-400 mt-1">{(hotelBookings || []).reduce((sum, b) => sum + (b?.totalPrice || 0), 0).toLocaleString()} FCFA</p>
              <span className="text-[10px] text-slate-400 mt-0.5 inline-block">{(hotelBookings || []).length} Nuitées réservées</span>
            </div>
          </div>

          {/* Hotel Grid List */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {hotels.map(hotel => (
              <div key={hotel.id} className="bg-slate-900 border border-slate-800 rounded-3xl overflow-hidden shadow-xl hover:border-slate-700 transition-all flex flex-col text-left">
                <div className="relative h-48 bg-slate-950 overflow-hidden">
                  <img src={hotel.imageUrl || 'https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=600&q=80'} alt={hotel.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-transparent to-black/40" />
                  
                  <div className="absolute top-3 left-3 flex items-center space-x-2">
                    <span className="px-2.5 py-1 rounded-full bg-slate-950/80 backdrop-blur-md border border-slate-700 text-white text-[10px] font-bold flex items-center space-x-1">
                      <span>★ {hotel.stars}</span>
                      <span>• {hotel.type}</span>
                    </span>
                  </div>

                  <div className="absolute top-3 right-3">
                    <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold backdrop-blur-md border ${
                      hotel.status === 'Actif'
                        ? 'bg-emerald-500/20 border-emerald-500/40 text-emerald-400'
                        : 'bg-amber-500/20 border-amber-500/40 text-amber-400'
                    }`}>
                      {hotel.status}
                    </span>
                  </div>

                  <div className="absolute bottom-3 left-3 right-3">
                    <h3 className="text-base font-extrabold text-white leading-tight drop-shadow-md">{hotel.name}</h3>
                    <p className="text-xs text-slate-300 flex items-center space-x-1 mt-0.5">
                      <MapPin className="w-3 h-3 text-emerald-400 shrink-0" />
                      <span>{hotel.city}, {hotel.commune || hotel.region}</span>
                    </p>
                  </div>
                </div>

                <div className="p-5 space-y-4 flex-1 flex flex-col justify-between">
                  <div className="space-y-2 text-xs text-slate-300">
                    <div className="flex items-center justify-between text-slate-400">
                      <span>Administrateur :</span>
                      <span className="font-bold text-white">{hotel.adminEmail || 'Admin Hôtel Assigné'}</span>
                    </div>
                    <div className="flex items-center justify-between text-slate-400">
                      <span>Tarif à partir de :</span>
                      <span className="font-extrabold text-emerald-400 text-sm">{(hotel.pricePerNight || 0).toLocaleString()} FCFA / nuit</span>
                    </div>
                    <div className="flex items-center justify-between text-slate-400">
                      <span>Téléphone :</span>
                      <span className="font-mono text-slate-200">{hotel.contactPhone}</span>
                    </div>
                  </div>

                  <div className="pt-3 border-t border-slate-800/80 flex items-center justify-between gap-2">
                    <span className="text-[11px] font-medium text-slate-400">
                      {hotel.totalRooms} Chambres déclarées
                    </span>

                    <button
                      onClick={() => alert(`Établissement "${hotel.name}" - Fiche administrative certifiée.`)}
                      className="px-3.5 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold transition-all"
                    >
                      Détails / Éditer
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Audit Logs RBAC Tab */}
      {activeTab === 'audit' && (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5">
          <h2 className="text-sm font-extrabold text-white mb-4">Journal d'Audit de Sécurité & Actions Transférées</h2>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-300">
              <thead className="bg-slate-950 text-slate-400 uppercase text-[10px] font-bold">
                <tr>
                  <th className="p-3">Horodatage</th>
                  <th className="p-3">Utilisateur</th>
                  <th className="p-3">Rôle</th>
                  <th className="p-3">Module</th>
                  <th className="p-3">Action</th>
                  <th className="p-3">Détails</th>
                  <th className="p-3">IP</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800">
                {auditLogs.map(log => (
                  <tr key={log.id} className="hover:bg-slate-800/50">
                    <td className="p-3 font-mono text-[11px] text-slate-400">{log.timestamp}</td>
                    <td className="p-3 font-bold text-white">{log.user}</td>
                    <td className="p-3 font-semibold text-emerald-400">{log.role}</td>
                    <td className="p-3 text-orange-400 font-bold">{log.module}</td>
                    <td className="p-3 text-slate-200">{log.action}</td>
                    <td className="p-3 text-slate-400 truncate max-w-[200px]">{log.details}</td>
                    <td className="p-3 font-mono text-[10px] text-slate-500">{log.ipAddress}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Vision Grid Tab */}
      {activeTab === 'vision' && (
        <VisionDashboard
          userRole="SUPER_ADMIN"
          cameras={cameras}
          alerts={alerts}
          onAddCamera={() => {}}
          onUpdateCamera={() => {}}
          onDeleteCamera={() => {}}
          onResolveAlert={() => {}}
        />
      )}

      {/* IPTV Tab */}
      {activeTab === 'iptv' && (
        <SuperAdminIPTV
          settings={iptvSettings}
          agencies={agencies}
          contents={iptvContents}
          playlists={iptvPlaylists}
          providers={iptvProviders}
          notifications={iptvNotifications}
          onUpdateSettings={onUpdateIptvSettings}
          onAddContent={onAddIptvContent}
          onUpdateContent={onUpdateIptvContent}
          onDeleteContent={onDeleteIptvContent}
          onAddPlaylist={onAddIptvPlaylist}
          onSyncPlaylist={onSyncIptvPlaylist}
          onAddNotification={onAddIptvNotification}
        />
      )}

      {/* Architecture Hexagonale Specification Tab */}
      {activeTab === 'architecture' && (
        <ArchitectureDocsViewer />
      )}

      {/* Global Settings & Sync Module */}
      {activeTab === 'settings' && (
        <GlobalSettingsAndSyncModule />
      )}

      {/* Create Agency Modal */}
      <AddAgencyModal
        isOpen={showAgencyModal}
        onClose={() => setShowAgencyModal(false)}
        onSubmit={async (params) => {
          await onCreateAgency(params);
          setShowAgencyModal(false);
        }}
        currentRole="SUPER_ADMIN"
      />

      {/* Add Hotel Modal */}
      <AddHotelModal
        isOpen={showHotelModal}
        onClose={() => setShowHotelModal(false)}
        onSubmit={onCreateHotel}
        currentRole="SUPER_ADMIN"
      />

    </div>
  );
};
