import React, { useState, useMemo } from 'react';
import {
  IPTVContentItem,
  IPTVPlaylist,
  IPTVProvider,
  IPTVGlobalSettings,
  IPTVNotification,
  IPTVContentType,
  IPTVQuality
} from '../../types/iptv';
import { useIPTV, IPTVDiagnosticStats } from '../../core/context/IPTVContext';
import { TransportAgency } from '../../types';
import { IPTVPlayerModal } from './IPTVPlayerModal';
import { ChannelStreamInspectorModal } from './admin/ChannelStreamInspectorModal';
import { StreamHealthDashboard } from './admin/StreamHealthDashboard';
import defaultHeroImage from '../../assets/images/iptv_hero_cinematic_1786842131987.jpg';
import {
  Power,
  Tv,
  Radio as RadioIcon,
  Film,
  Plus,
  RefreshCw,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Sliders,
  Trash2,
  Edit2,
  Building2,
  Layers,
  Sparkles,
  BarChart2,
  Bell,
  Globe,
  ShieldAlert,
  Server,
  Activity,
  Search,
  Zap,
  Lock,
  Eye,
  Upload,
  FileText,
  Check,
  Play,
  ChevronRight,
  ChevronLeft,
  ChevronsLeft,
  ChevronsRight,
  Download,
  Database,
  Filter,
  RotateCcw,
  CheckSquare,
  LayoutGrid,
  List,
  Image as ImageIcon,
  Palette,
  Clapperboard
} from 'lucide-react';
import {
  filterIPTVCatalog,
  computeCatalogCategoryStats,
  CANONICAL_CATEGORY_NAMES,
  CategoryStatItem
} from '../../lib/iptv/categoryNormalizer';

interface SuperAdminIPTVProps {
  settings?: IPTVGlobalSettings;
  agencies?: TransportAgency[];
  contents?: IPTVContentItem[];
  playlists?: IPTVPlaylist[];
  providers?: IPTVProvider[];
  notifications?: IPTVNotification[];
  onUpdateSettings?: (settings: IPTVGlobalSettings) => void;
  onAddContent?: (item: IPTVContentItem) => void;
  onUpdateContent?: (item: IPTVContentItem) => void;
  onDeleteContent?: (id: string) => void;
  onAddPlaylist?: (playlist: IPTVPlaylist) => void;
  onSyncPlaylist?: (id: string) => void;
  onAddNotification?: (notif: IPTVNotification) => void;
}

export const SuperAdminIPTV: React.FC<SuperAdminIPTVProps> = (props) => {
  const context = useIPTV();

  // Prefer context when it has more items than fallback props to ensure all 13,536+ channels are displayed
  const contents = (context.contents.length >= (props.contents?.length || 0))
    ? context.contents
    : (props.contents || context.contents);

  const playlists = (context.playlists.length >= (props.playlists?.length || 0))
    ? context.playlists
    : (props.playlists || context.playlists);

  const settings = props.settings || context.settings;
  const providers = props.providers || context.providers;
  const notifications = props.notifications || context.notifications;
  const logs = context.logs;
  const importProgress = context.importProgress;

  const [activeTab, setActiveTab] = useState<'contents' | 'playlists' | 'diagnostics' | 'health' | 'logs' | 'settings'>('contents');

  // Filters State
  const [searchFilter, setSearchFilter] = useState<string>('');
  const [filterType, setFilterType] = useState<string>('ALL');
  const [filterCategory, setFilterCategory] = useState<string>('ALL');
  const [filterCountry, setFilterCountry] = useState<string>('ALL');
  const [filterPlaylist, setFilterPlaylist] = useState<string>('ALL');
  const [filterStatus, setFilterStatus] = useState<string>('ALL');
  const [filterQuality, setFilterQuality] = useState<string>('ALL');

  // Display View Mode: Grid (Modern OTT) or Table
  const [displayMode, setDisplayMode] = useState<'grid' | 'table'>('grid');

  // Pagination State (Crucial for high performance with 13,000+ items)
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [pageSize, setPageSize] = useState<number>(48);
  const [jumpPageInput, setJumpPageInput] = useState<string>('');

  // Player preview modal
  const [previewContent, setPreviewContent] = useState<IPTVContentItem | null>(null);

  // Stream Inspector Modal
  const [showStreamInspector, setShowStreamInspector] = useState<boolean>(false);
  const [inspectorTargetChannel, setInspectorTargetChannel] = useState<IPTVContentItem | null>(null);

  // Add / Edit Content Modal
  const [showAddContentModal, setShowAddContentModal] = useState<boolean>(false);
  const [editingContent, setEditingContent] = useState<IPTVContentItem | null>(null);

  // Add Playlist Modal
  const [showAddPlaylistModal, setShowAddPlaylistModal] = useState<boolean>(false);
  const [importMode, setImportMode] = useState<'URL' | 'FILE'>('URL');
  const [plName, setPlName] = useState<string>('');
  const [plProvider, setPlProvider] = useState<string>('Fournisseur National M3U');
  const [plUrl, setPlUrl] = useState<string>('');
  const [m3uFileText, setM3uFileText] = useState<string>('');
  const [selectedFileName, setSelectedFileName] = useState<string>('');
  const [isImporting, setIsImporting] = useState<boolean>(false);
  const [importFeedback, setImportFeedback] = useState<{ success: boolean; message: string } | null>(null);

  // Diagnostic State
  const [isRunningDiagnostic, setIsRunningDiagnostic] = useState<boolean>(false);
  const [diagnosticResult, setDiagnosticResult] = useState<IPTVDiagnosticStats | null>(null);

  // Stream Health Verification State
  const [isHealthChecking, setIsHealthChecking] = useState<boolean>(false);
  const [healthProgress, setHealthProgress] = useState<{ count: number; total: number }>({ count: 0, total: 0 });
  const [isCleaningDuplicates, setIsCleaningDuplicates] = useState<boolean>(false);
  const [isCleaningDead, setIsCleaningDead] = useState<boolean>(false);
  const [isRebuildingCache, setIsRebuildingCache] = useState<boolean>(false);
  const [maintenanceFeedback, setMaintenanceFeedback] = useState<string | null>(null);

  // Import Job Summary Modal
  const [showImportSummaryModal, setShowImportSummaryModal] = useState<boolean>(false);
  const [selectedAgencyForImport, setSelectedAgencyForImport] = useState<string>('NATIONAL');

  // Single Channel Form State
  const [formName, setFormName] = useState<string>('');
  const [formType, setFormType] = useState<IPTVContentType>('TV');
  const [formCategory, setFormCategory] = useState<string>('Actualités');
  const [formStreamUrl, setFormStreamUrl] = useState<string>('');
  const [formLogoUrl, setFormLogoUrl] = useState<string>('');
  const [formLanguage, setFormLanguage] = useState<string>('Français');
  const [formCountry, setFormCountry] = useState<string>("Côte d'Ivoire");
  const [formQuality, setFormQuality] = useState<IPTVQuality>('1080p Full HD');
  const [formAgencyId, setFormAgencyId] = useState<string>('NATIONAL');

  // Compute live health report
  const healthReport = useMemo(() => {
    return context.computeHealthReport();
  }, [context, contents, playlists]);

  // Hero Banner Customization state (Editable from SuperAdmin, persists to Firestore/State)
  const [heroBannerUrl, setHeroBannerUrl] = useState<string>(context.settings.heroBannerUrl || defaultHeroImage);
  const [heroTitle, setHeroTitle] = useState<string>(context.settings.heroTitle || 'IPTV');
  const [heroSubtitle, setHeroSubtitle] = useState<string>(context.settings.heroSubtitle || 'Votre univers de divertissement');
  const [heroBadgeText, setHeroBadgeText] = useState<string>(context.settings.heroBadgeText || '🎬 FILMS • SÉRIES • TV • DIVERTISSEMENT');
  const [heroCtaText, setHeroCtaText] = useState<string>(context.settings.heroCtaText || 'Explorer les chaînes');
  const [isSavingHeroSettings, setIsSavingHeroSettings] = useState<boolean>(false);
  const [heroSettingsFeedback, setHeroSettingsFeedback] = useState<string | null>(null);

  // Sync state if context settings update
  React.useEffect(() => {
    if (context.settings.heroBannerUrl) setHeroBannerUrl(context.settings.heroBannerUrl);
    if (context.settings.heroTitle) setHeroTitle(context.settings.heroTitle);
    if (context.settings.heroSubtitle) setHeroSubtitle(context.settings.heroSubtitle);
    if (context.settings.heroBadgeText) setHeroBadgeText(context.settings.heroBadgeText);
    if (context.settings.heroCtaText) setHeroCtaText(context.settings.heroCtaText);
  }, [context.settings]);

  // Curated Hero Banner Presets
  const HERO_PRESETS = [
    {
      id: 'superhero',
      name: '🦸 Action & Super-Héros Cinématographique (Recommandé)',
      description: 'Composition héroïque inspirée Superman/Blockbuster avec éclairage cinématographique',
      url: defaultHeroImage,
      badge: '🎬 FILMS • SÉRIES • TV • DIVERTISSEMENT',
      title: 'IPTV',
      subtitle: 'Votre univers de divertissement'
    },
    {
      id: 'blockbuster',
      name: '🎬 Cinéma & Blockbuster Hollywood',
      description: 'Atmosphère grand écran cinéma, projecteurs et ambiance VIP',
      url: 'https://images.unsplash.com/photo-1536440136628-849c177e76a1?w=1600&auto=format&fit=crop&q=80',
      badge: '🍿 CINÉMA • BLOCKBUSTERS • SÉRIES',
      title: 'Cinéma & VOD Premium',
      subtitle: 'Le 7ème art en haute définition'
    },
    {
      id: 'national',
      name: '🇨🇮 RTI & Direct National Côte d\'Ivoire',
      description: 'Plateau télévisé moderne avec éclairage institutionnel chaud',
      url: 'https://images.unsplash.com/photo-1594909122845-11baa439b7bf?w=1600&auto=format&fit=crop&q=80',
      badge: '📡 DIRECT • RTI • RADIOS NATIONALES',
      title: 'Bouquet National CI',
      subtitle: 'Vos chaînes ivoiriennes en direct HD'
    },
    {
      id: 'stadium',
      name: '⚽ Grand Direct Sportif & Stades',
      description: 'Ambiance stade illuminé pour la Coupe d\'Afrique et compétitions',
      url: 'https://images.unsplash.com/photo-1508098682722-e99c43a406b2?w=1600&auto=format&fit=crop&q=80',
      badge: '🏆 SPORT • FOOTBALL • DIRECT HD',
      title: 'Événements Sportifs Live',
      subtitle: 'Vivez la passion du sport en direct'
    }
  ];

  const handleApplyPreset = (preset: typeof HERO_PRESETS[0]) => {
    setHeroBannerUrl(preset.url);
    setHeroBadgeText(preset.badge);
    setHeroTitle(preset.title);
    setHeroSubtitle(preset.subtitle);
  };

  const handleSaveHeroSettings = async () => {
    setIsSavingHeroSettings(true);
    setHeroSettingsFeedback(null);
    try {
      const updatedSettings: IPTVGlobalSettings = {
        ...context.settings,
        heroBannerUrl,
        heroTitle,
        heroSubtitle,
        heroBadgeText,
        heroCtaText
      };
      await context.updateSettings(updatedSettings);
      setHeroSettingsFeedback('✅ Configuration de la bannière hero enregistrée avec succès !');
      setTimeout(() => setHeroSettingsFeedback(null), 4000);
    } catch (err: any) {
      setHeroSettingsFeedback(`❌ Erreur : ${err.message || 'Échec de la sauvegarde'}`);
    } finally {
      setIsSavingHeroSettings(false);
    }
  };

  // Dynamic Catalog Category Statistics (Computed across all 13,436+ channels)
  const categoryStats = useMemo<CategoryStatItem[]>(() => {
    return computeCatalogCategoryStats(contents).categoryStats;
  }, [contents]);

  // List of Categories with active channels or canonical list
  const availableCategories = useMemo(() => {
    const activeFromStats = categoryStats
      .filter((c) => c.totalCount > 0)
      .map((c) => c.category);
    
    // Ensure all canonical categories are present for quick selection
    const allSet = new Set<string>([...CANONICAL_CATEGORY_NAMES, ...activeFromStats]);
    return Array.from(allSet);
  }, [categoryStats]);

  // Dynamic Countries from contents (100% full scan without arbitrary limits)
  const availableCountries = useMemo(() => {
    const set = new Set<string>();
    const safeContents = contents || [];
    for (let i = 0; i < safeContents.length; i++) {
      if (safeContents[i]?.country) set.add(safeContents[i].country);
    }
    return Array.from(set).sort((a, b) => a.localeCompare(b, 'fr'));
  }, [contents]);

  // Filtered Channels with Tenant Scope & Multi-Criteria Normalization
  const filteredContents = useMemo(() => {
    return filterIPTVCatalog(contents, {
      searchQuery: searchFilter,
      category: filterCategory,
      country: filterCountry,
      quality: filterQuality,
      type: filterType,
      status: filterStatus,
      playlistId: filterPlaylist,
      agencyScope: context.selectedAgencyScope
    });
  }, [contents, searchFilter, filterType, filterCategory, filterCountry, filterPlaylist, filterStatus, filterQuality, context.selectedAgencyScope]);

  // Pagination Math
  const totalPages = Math.max(1, Math.ceil(filteredContents.length / pageSize));
  const safeCurrentPage = Math.min(Math.max(1, currentPage), totalPages);

  const paginatedContents = useMemo(() => {
    const startIdx = (safeCurrentPage - 1) * pageSize;
    return filteredContents.slice(startIdx, startIdx + pageSize);
  }, [filteredContents, safeCurrentPage, pageSize]);

  // Reset page when filter changes
  const handleFilterChange = (setter: (v: string) => void, val: string) => {
    setter(val);
    setCurrentPage(1);
  };

  const handleResetFilters = () => {
    setSearchFilter('');
    setFilterType('ALL');
    setFilterCategory('ALL');
    setFilterCountry('ALL');
    setFilterPlaylist('ALL');
    setFilterStatus('ALL');
    setFilterQuality('ALL');
    setCurrentPage(1);
  };

  // Handle M3U File Upload
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setSelectedFileName(file.name);
    if (!plName) {
      setPlName(file.name.replace(/\.[^/.]+$/, ''));
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      setM3uFileText(text);
    };
    reader.readAsText(file);
  };

  // Submit New Playlist
  const handleImportPlaylist = async () => {
    if (!plName.trim()) {
      alert('Veuillez spécifier un nom pour la playlist.');
      return;
    }

    setIsImporting(true);
    setImportFeedback(null);

    try {
      let res;
      if (importMode === 'URL') {
        if (!plUrl.trim()) {
          alert('Veuillez saisir une URL M3U/M3U8 valide.');
          setIsImporting(false);
          return;
        }
        res = await context.importPlaylistFromUrl(plUrl, plName, plProvider, selectedAgencyForImport);
      } else {
        if (!m3uFileText.trim()) {
          alert('Veuillez sélectionner un fichier M3U/M3U8.');
          setIsImporting(false);
          return;
        }
        res = await context.importPlaylistFromFile(m3uFileText, plName, plProvider, selectedAgencyForImport);
      }

      setImportFeedback(res);
      if (res.success) {
        setShowImportSummaryModal(true);
        setTimeout(() => {
          setShowAddPlaylistModal(false);
          resetPlaylistForm();
          setActiveTab('contents');
        }, 1200);
      }
    } catch (err: any) {
      setImportFeedback({ success: false, message: err.message || "Erreur d'importation" });
    } finally {
      setIsImporting(false);
    }
  };

  const resetPlaylistForm = () => {
    setPlName('');
    setPlUrl('');
    setM3uFileText('');
    setSelectedFileName('');
    setImportFeedback(null);
  };

  // Preset M3U Samples
  const handleLoadSampleM3U = (sampleUrl: string, sampleName: string) => {
    setImportMode('URL');
    setPlName(sampleName);
    setPlUrl(sampleUrl);
    setPlProvider('Bouquet Public National');
  };

  // Handle Single Content Save / Edit
  const handleOpenEdit = (c: IPTVContentItem) => {
    setEditingContent(c);
    setFormName(c.name);
    setFormType(c.type);
    setFormCategory(c.category || 'Actualités');
    setFormStreamUrl(c.streamUrl);
    setFormLogoUrl(c.logoUrl || '');
    setFormLanguage(c.language || 'Français');
    setFormCountry(c.country || "Côte d'Ivoire");
    setFormQuality(c.quality || '1080p Full HD');
    setShowAddContentModal(true);
  };

  const handleOpenAddManual = () => {
    setEditingContent(null);
    setFormName('');
    setFormType('TV');
    setFormCategory('Actualités');
    setFormStreamUrl('');
    setFormLogoUrl('https://images.unsplash.com/photo-1594909122845-11baa439b7bf?w=400&auto=format&fit=crop&q=80');
    setFormLanguage('Français');
    setFormCountry("Côte d'Ivoire");
    setFormQuality('1080p Full HD');
    setShowAddContentModal(true);
  };

  const handleSaveContent = async () => {
    if (!formName.trim() || !formStreamUrl.trim()) {
      alert('Nom et URL du flux obligatoires.');
      return;
    }

    if (editingContent) {
      const updated: IPTVContentItem = {
        ...editingContent,
        name: formName,
        type: formType,
        category: formCategory,
        streamUrl: formStreamUrl,
        logoUrl: formLogoUrl || `https://ui-avatars.com/api/?name=${encodeURIComponent(formName)}&background=f97316&color=ffffff`,
        language: formLanguage,
        country: formCountry,
        quality: formQuality
      };
      await context.updateContent(updated);
    } else {
      const newCh: IPTVContentItem = {
        id: `iptv-${Date.now()}`,
        name: formName,
        type: formType,
        category: formCategory,
        streamUrl: formStreamUrl,
        logoUrl: formLogoUrl || `https://ui-avatars.com/api/?name=${encodeURIComponent(formName)}&background=f97316&color=ffffff`,
        language: formLanguage,
        country: formCountry,
        quality: formQuality,
        status: 'Actif',
        viewsCount: 1,
        createdAt: new Date().toISOString()
      };
      await context.addContent(newCh);
    }

    setShowAddContentModal(false);
    setEditingContent(null);
  };

  // Handle Diagnostic & Reconciliation Run
  const handleRunDiagnostic = async () => {
    setIsRunningDiagnostic(true);
    try {
      const stats = await context.reconcileAndCountAllCollections();
      setDiagnosticResult(stats);
    } catch (err: any) {
      alert(`Erreur de diagnostic: ${err.message || String(err)}`);
    } finally {
      setIsRunningDiagnostic(false);
    }
  };

  // Handle Export M3U
  const handleExportBackupM3U = () => {
    const m3uText = context.exportCurrentChannelsM3U();
    const blob = new Blob([m3uText], { type: 'audio/x-mpegurl;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `IVOIREXPRESS_IPTV_EXPORT_${new Date().toISOString().slice(0, 10)}.m3u`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  // Handle Health Check
  const handleStartHealthCheck = async () => {
    setIsHealthChecking(true);
    await context.runBatchHealthCheck((count, total) => {
      setHealthProgress({ count, total });
    });
    setIsHealthChecking(false);
  };

  // Handle Clean Duplicates
  const handleCleanDuplicates = async () => {
    if (!window.confirm('Voulez-vous analyser et nettoyer les doublons identifiés dans le catalogue ?')) return;
    setIsCleaningDuplicates(true);
    setMaintenanceFeedback(null);
    try {
      const res = await context.cleanDuplicateChannels();
      setMaintenanceFeedback(res.message);
    } catch (e: any) {
      setMaintenanceFeedback(`Erreur : ${e.message}`);
    } finally {
      setIsCleaningDuplicates(false);
    }
  };

  // Handle Clean Dead Channels
  const handleCleanDead = async () => {
    if (!window.confirm('Voulez-vous désactiver les chaînes identifiées comme inaccessibles / hors-ligne ?')) return;
    setIsCleaningDead(true);
    setMaintenanceFeedback(null);
    try {
      const res = await context.cleanDeadChannels();
      setMaintenanceFeedback(res.message);
    } catch (e: any) {
      setMaintenanceFeedback(`Erreur : ${e.message}`);
    } finally {
      setIsCleaningDead(false);
    }
  };

  // Handle Rebuild Cache From Firestore
  const handleRebuildCache = async () => {
    if (!window.confirm('Reconstruire le cache local complet depuis Firestore (Source de Vérité) ?')) return;
    setIsRebuildingCache(true);
    setMaintenanceFeedback(null);
    try {
      const res = await context.rebuildLocalCacheFromServer();
      setMaintenanceFeedback(res.message);
    } catch (e: any) {
      setMaintenanceFeedback(`Erreur : ${e.message}`);
    } finally {
      setIsRebuildingCache(false);
    }
  };

  // Handle Clear Local Cache
  const handleClearCacheAndReload = async () => {
    if (!window.confirm('Purger le cache IndexedDB et recharger depuis le serveur Cloud Firestore ?')) return;
    setIsRebuildingCache(true);
    try {
      await context.clearLocalCacheAndReload();
      setMaintenanceFeedback('Cache local purgé et rechargé avec succès depuis le serveur.');
    } catch (e: any) {
      setMaintenanceFeedback(`Erreur : ${e.message}`);
    } finally {
      setIsRebuildingCache(false);
    }
  };

  return (
    <div className="space-y-6 p-4 sm:p-6 max-w-7xl mx-auto text-slate-100">
      
      {/* HEADER WITH REALTIME METRICS */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-xl">
        <div className="flex items-center space-x-3">
          <div className="w-12 h-12 rounded-2xl bg-orange-500/20 text-orange-400 border border-orange-500/30 flex items-center justify-center">
            <Tv className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h1 className="text-2xl font-black text-white tracking-tight">Gestionnaire IPTV National</h1>
              <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 text-[11px] font-mono font-bold border border-emerald-500/30 flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                {(contents?.length || 0).toLocaleString('fr-FR')} chaînes
              </span>
            </div>
            <p className="text-xs text-slate-400">
              Supervision de diffusion, pagination haute capacité (13 500+ chaînes) et synchronisation Cloud Firestore
            </p>
          </div>
        </div>

        {/* Global Action Buttons & Scope Selector */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Tenant / Agency Scope Dropdown */}
          <div className="flex items-center space-x-1.5 bg-slate-950 px-3 py-2 rounded-xl border border-slate-800 text-xs">
            <Building2 className="w-3.5 h-3.5 text-orange-400 shrink-0" />
            <select
              value={context.selectedAgencyScope}
              onChange={(e) => context.setSelectedAgencyScope(e.target.value)}
              className="bg-transparent text-slate-200 font-bold focus:outline-none text-xs cursor-pointer"
            >
              <option value="NATIONAL" className="bg-slate-900 text-white">🌐 Bouquet National (Global)</option>
              {props.agencies && props.agencies.map((ag) => (
                <option key={ag.id} value={ag.id} className="bg-slate-900 text-white">
                  🏢 {ag.name}
                </option>
              ))}
            </select>
          </div>

          <button
            onClick={() => setShowAddPlaylistModal(true)}
            className="px-4 py-2.5 rounded-xl bg-orange-500 hover:bg-orange-400 text-slate-950 font-black text-xs flex items-center space-x-2 transition-all shadow-lg shadow-orange-500/20"
          >
            <Plus className="w-4 h-4" />
            <span>Importer Playlist M3U</span>
          </button>

          {context.lastImportSummary && (
            <button
              onClick={() => setShowImportSummaryModal(true)}
              className="px-3.5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-amber-300 font-bold text-xs flex items-center space-x-1.5 border border-amber-500/30 transition-all shadow"
              title="Voir les métriques détaillées du dernier import"
            >
              <BarChart2 className="w-4 h-4 text-amber-400" />
              <span>Rapport Import</span>
            </button>
          )}

          <button
            onClick={handleRunDiagnostic}
            disabled={isRunningDiagnostic}
            className="px-3.5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-cyan-300 font-bold text-xs flex items-center space-x-1.5 border border-cyan-800/50 transition-all shadow"
            title="Diagnostiquer et réconcilier les collections Firestore / IndexedDB"
          >
            <Database className={`w-4 h-4 ${isRunningDiagnostic ? 'animate-spin' : ''}`} />
            <span>{isRunningDiagnostic ? 'Audit...' : 'Audit Base'}</span>
          </button>

          <button
            onClick={handleExportBackupM3U}
            className="px-3.5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs flex items-center space-x-1.5 border border-slate-700 transition-all shadow"
            title="Télécharger une sauvegarde M3U de toutes les chaînes"
          >
            <Download className="w-4 h-4 text-emerald-400" />
            <span>Export M3U</span>
          </button>
        </div>
      </div>

      {/* IMPORT PROGRESS BANNER (IF ACTIVE) */}
      {importProgress && importProgress.isImporting && (
        <div className="bg-gradient-to-r from-orange-950/60 to-slate-900 border border-orange-500/40 rounded-2xl p-4 shadow-lg space-y-2">
          <div className="flex items-center justify-between text-xs">
            <span className="font-bold text-orange-400 flex items-center gap-2">
              <RefreshCw className="w-4 h-4 animate-spin text-orange-400" />
              Enregistrement massif en cours...
            </span>
            <span className="font-mono text-slate-300">
              {importProgress.processedChannels} / {importProgress.totalChannels} chaînes (Lot {importProgress.currentBatch}/{importProgress.totalBatches})
            </span>
          </div>
          <div className="w-full h-2 bg-slate-950 rounded-full overflow-hidden border border-slate-800">
            <div
              className="h-full bg-gradient-to-r from-orange-500 to-amber-400 transition-all duration-300 rounded-full"
              style={{
                width: `${Math.min(100, Math.round((importProgress.processedChannels / (importProgress.totalChannels || 1)) * 100))}%`
              }}
            />
          </div>
          <p className="text-[11px] text-slate-400">{importProgress.statusText}</p>
        </div>
      )}

      {/* NAVIGATION TABS */}
      <div className="flex flex-wrap items-center gap-2 border-b border-slate-800 pb-2">
        <button
          onClick={() => setActiveTab('contents')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center space-x-2 ${
            activeTab === 'contents' ? 'bg-orange-500 text-slate-950 font-black' : 'text-slate-400 hover:text-white'
          }`}
        >
          <Tv className="w-4 h-4" />
          <span>Catalogue Chaînes ({(contents?.length || 0).toLocaleString('fr-FR')})</span>
        </button>

        <button
          onClick={() => setActiveTab('playlists')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center space-x-2 ${
            activeTab === 'playlists' ? 'bg-orange-500 text-slate-950 font-black' : 'text-slate-400 hover:text-white'
          }`}
        >
          <Layers className="w-4 h-4" />
          <span>Playlists ({playlists.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('diagnostics')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center space-x-2 ${
            activeTab === 'diagnostics' ? 'bg-orange-500 text-slate-950 font-black' : 'text-slate-400 hover:text-white'
          }`}
        >
          <Database className="w-4 h-4" />
          <span>Audit & Réconciliation</span>
        </button>

        <button
          onClick={() => setActiveTab('health')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center space-x-2 ${
            activeTab === 'health' ? 'bg-orange-500 text-slate-950 font-black' : 'text-slate-400 hover:text-white'
          }`}
        >
          <Activity className="w-4 h-4" />
          <span>Santé des Flux</span>
        </button>

        <button
          onClick={() => setActiveTab('logs')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center space-x-2 ${
            activeTab === 'logs' ? 'bg-orange-500 text-slate-950 font-black' : 'text-slate-400 hover:text-white'
          }`}
        >
          <FileText className="w-4 h-4" />
          <span>Journaux ({logs.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('settings')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center space-x-2 ${
            activeTab === 'settings' ? 'bg-orange-500 text-slate-950 font-black' : 'text-slate-400 hover:text-white'
          }`}
        >
          <Sparkles className="w-4 h-4" />
          <span>Bannière & Visuel Hero</span>
        </button>
      </div>

      {/* ==================== CHANNELS TAB WITH ADVANCED FILTERING & HIGH-SPEED PAGINATION ==================== */}
      {activeTab === 'contents' && (
        <div className="space-y-4">
          
          {/* SEARCH & FILTERS BAR */}
          <div className="bg-slate-900 p-4 rounded-2xl border border-slate-800 space-y-3 shadow-lg">
            <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
              {/* Search Bar */}
              <div className="relative flex-1">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={searchFilter}
                  onChange={(e) => handleFilterChange(setSearchFilter, e.target.value)}
                  placeholder="Rechercher par nom de chaîne, catégorie, pays ou URL de flux..."
                  className="w-full pl-9 pr-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-orange-500 transition-colors"
                />
                {searchFilter && (
                  <button
                    onClick={() => handleFilterChange(setSearchFilter, '')}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white text-xs"
                  >
                    ✕
                  </button>
                )}
              </div>

              {/* Add Single Channel Button */}
              <button
                onClick={handleOpenAddManual}
                className="px-4 py-2.5 rounded-xl bg-orange-500 hover:bg-orange-400 text-slate-950 font-black text-xs flex items-center justify-center space-x-1.5 shadow-lg whitespace-nowrap"
              >
                <Plus className="w-4 h-4" />
                <span>Ajouter une chaîne</span>
              </button>
            </div>

            {/* Category Quick Pills Bar */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-thin scrollbar-thumb-slate-800">
              <button
                onClick={() => handleFilterChange(setFilterCategory, 'ALL')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all flex items-center gap-1.5 ${
                  filterCategory === 'ALL'
                    ? 'bg-orange-500 text-slate-950 shadow-md shadow-orange-500/20'
                    : 'bg-slate-950 text-slate-400 hover:text-slate-200 hover:bg-slate-800 border border-slate-800'
                }`}
              >
                <span>🌐 Toutes</span>
                <span className={`px-1.5 py-0.2 rounded-md text-[10px] ${filterCategory === 'ALL' ? 'bg-slate-950/30 text-slate-950' : 'bg-slate-800 text-slate-400'}`}>
                  {(contents?.length || 0).toLocaleString('fr-FR')}
                </span>
              </button>

              {categoryStats.filter(c => c.totalCount > 0).map((stat) => (
                <button
                  key={stat.category}
                  onClick={() => handleFilterChange(setFilterCategory, stat.category)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all flex items-center gap-1.5 ${
                    filterCategory === stat.category
                      ? 'bg-orange-500 text-slate-950 shadow-md shadow-orange-500/20'
                      : 'bg-slate-950 text-slate-400 hover:text-slate-200 hover:bg-slate-800 border border-slate-800'
                  }`}
                >
                  <span>{stat.icon} {stat.category}</span>
                  <span className={`px-1.5 py-0.2 rounded-md text-[10px] font-mono ${
                    filterCategory === stat.category ? 'bg-slate-950/30 text-slate-950' : 'bg-slate-800 text-orange-400/90'
                  }`}>
                    {stat.totalCount.toLocaleString('fr-FR')}
                  </span>
                </button>
              ))}
            </div>

            {/* Faceted Filters Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2 pt-2 border-t border-slate-800/60 text-xs">
              {/* Type Filter */}
              <div>
                <label className="text-[10px] uppercase font-bold text-slate-400 block mb-1">Type</label>
                <select
                  value={filterType}
                  onChange={(e) => handleFilterChange(setFilterType, e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1.5 text-slate-200 focus:outline-none focus:border-orange-500"
                >
                  <option value="ALL">Tous les types</option>
                  <option value="TV">📺 TV Direct (LIVE)</option>
                  <option value="RADIO">📻 Radio (LIVE)</option>
                  <option value="DIRECT_EVENT">🏟️ Événement (LIVE)</option>
                  <option value="FILM">🎬 Film (VOD)</option>
                  <option value="SERIES">🍿 Série (VOD)</option>
                  <option value="DOCUMENTAIRE">🌍 Documentaire (VOD)</option>
                  <option value="DESSIN_ANIME">🎨 Dessin Animé (VOD)</option>
                </select>
              </div>

              {/* Category Filter */}
              <div>
                <label className="text-[10px] uppercase font-bold text-slate-400 block mb-1">Catégorie</label>
                <select
                  value={filterCategory}
                  onChange={(e) => handleFilterChange(setFilterCategory, e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1.5 text-slate-200 focus:outline-none focus:border-orange-500 font-semibold"
                >
                  <option value="ALL">Toutes les catégories ({(contents?.length || 0).toLocaleString('fr-FR')})</option>
                  {categoryStats.map((stat) => (
                    <option key={stat.category} value={stat.category}>
                      {stat.icon} {stat.category} ({stat.totalCount.toLocaleString('fr-FR')})
                    </option>
                  ))}
                </select>
              </div>

              {/* Country Filter */}
              <div>
                <label className="text-[10px] uppercase font-bold text-slate-400 block mb-1">Pays</label>
                <select
                  value={filterCountry}
                  onChange={(e) => handleFilterChange(setFilterCountry, e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1.5 text-slate-200 focus:outline-none focus:border-orange-500"
                >
                  <option value="ALL">Tous les pays ({availableCountries.length})</option>
                  {availableCountries.map((c) => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
              </div>

              {/* Playlist Filter */}
              <div>
                <label className="text-[10px] uppercase font-bold text-slate-400 block mb-1">Playlist M3U</label>
                <select
                  value={filterPlaylist}
                  onChange={(e) => handleFilterChange(setFilterPlaylist, e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1.5 text-slate-200 focus:outline-none focus:border-orange-500"
                >
                  <option value="ALL">Toutes les playlists</option>
                  {playlists.map((pl) => (
                    <option key={pl.id} value={pl.id}>{pl.name}</option>
                  ))}
                </select>
              </div>

              {/* Status Filter */}
              <div>
                <label className="text-[10px] uppercase font-bold text-slate-400 block mb-1">Statut</label>
                <select
                  value={filterStatus}
                  onChange={(e) => handleFilterChange(setFilterStatus, e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1.5 text-slate-200 focus:outline-none focus:border-orange-500"
                >
                  <option value="ALL">Tous les statuts</option>
                  <option value="Actif">🟢 Actif</option>
                  <option value="Inactif">🔴 Inactif</option>
                </select>
              </div>

              {/* Page Size & Reset */}
              <div className="flex items-end gap-1">
                <div className="flex-1">
                  <label className="text-[10px] uppercase font-bold text-slate-400 block mb-1">Par page</label>
                  <select
                    value={pageSize}
                    onChange={(e) => {
                      setPageSize(Number(e.target.value));
                      setCurrentPage(1);
                    }}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-2 py-1.5 text-slate-200 focus:outline-none focus:border-orange-500 font-bold"
                  >
                    <option value={25}>25 / p.</option>
                    <option value={50}>50 / p.</option>
                    <option value={100}>100 / p.</option>
                    <option value={250}>250 / p.</option>
                    <option value={500}>500 / p.</option>
                  </select>
                </div>
                <button
                  onClick={handleResetFilters}
                  className="px-2.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-xs font-bold border border-slate-700 transition-colors"
                  title="Réinitialiser tous les filtres"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </div>

          {/* ACTIVE FILTER SUMMARY & PAGINATION CONTROLS */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 px-2 text-xs text-slate-400 font-mono">
            <div className="flex items-center gap-3">
              <div>
                Affichage de <span className="text-white font-bold">{filteredContents.length > 0 ? ((safeCurrentPage - 1) * pageSize) + 1 : 0}</span> à <span className="text-white font-bold">{Math.min(safeCurrentPage * pageSize, filteredContents.length)}</span> sur <span className="text-orange-400 font-bold">{(filteredContents?.length || 0).toLocaleString('fr-FR')}</span> chaînes filtrées (Total : <span className="text-white">{(contents?.length || 0).toLocaleString('fr-FR')}</span>)
              </div>

              {/* View Mode Toggle: Grid vs Table */}
              <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-xl border border-slate-800">
                <button
                  type="button"
                  onClick={() => setDisplayMode('grid')}
                  className={`px-2 py-1 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
                    displayMode === 'grid'
                      ? 'bg-orange-500 text-slate-950 shadow-md shadow-orange-500/20'
                      : 'text-slate-400 hover:text-white hover:bg-slate-800'
                  }`}
                  title="Affichage en Grille OTT"
                >
                  <LayoutGrid className="w-3.5 h-3.5" />
                  <span className="hidden md:inline">Grille</span>
                </button>
                <button
                  type="button"
                  onClick={() => setDisplayMode('table')}
                  className={`px-2 py-1 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
                    displayMode === 'table'
                      ? 'bg-orange-500 text-slate-950 shadow-md shadow-orange-500/20'
                      : 'text-slate-400 hover:text-white hover:bg-slate-800'
                  }`}
                  title="Affichage en Tableau Détaillé"
                >
                  <List className="w-3.5 h-3.5" />
                  <span className="hidden md:inline">Tableau</span>
                </button>
              </div>
            </div>

            {/* Pagination Buttons */}
            <div className="flex items-center gap-1.5">
              <button
                onClick={() => setCurrentPage(1)}
                disabled={safeCurrentPage <= 1}
                className="p-1.5 rounded-lg bg-slate-800 text-slate-300 disabled:opacity-30 disabled:cursor-not-allowed hover:bg-slate-700"
                title="Première page"
              >
                <ChevronsLeft className="w-4 h-4" />
              </button>
              <button
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                disabled={safeCurrentPage <= 1}
                className="p-1.5 rounded-lg bg-slate-800 text-slate-300 disabled:opacity-30 disabled:cursor-not-allowed hover:bg-slate-700"
                title="Page précédente"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>

              <span className="px-3 py-1 bg-slate-900 border border-slate-800 rounded-lg text-xs text-slate-200">
                Page <strong className="text-orange-400">{safeCurrentPage}</strong> / {totalPages}
              </span>

              <button
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                disabled={safeCurrentPage >= totalPages}
                className="p-1.5 rounded-lg bg-slate-800 text-slate-300 disabled:opacity-30 disabled:cursor-not-allowed hover:bg-slate-700"
                title="Page suivante"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
              <button
                onClick={() => setCurrentPage(totalPages)}
                disabled={safeCurrentPage >= totalPages}
                className="p-1.5 rounded-lg bg-slate-800 text-slate-300 disabled:opacity-30 disabled:cursor-not-allowed hover:bg-slate-700"
                title="Dernière page"
              >
                <ChevronsRight className="w-4 h-4" />
              </button>

              {/* Direct Jump to page */}
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  const target = parseInt(jumpPageInput, 10);
                  if (!isNaN(target) && target >= 1 && target <= totalPages) {
                    setCurrentPage(target);
                    setJumpPageInput('');
                  }
                }}
                className="flex items-center gap-1 ml-2"
              >
                <input
                  type="number"
                  placeholder="Page..."
                  value={jumpPageInput}
                  onChange={(e) => setJumpPageInput(e.target.value)}
                  min={1}
                  max={totalPages}
                  className="w-16 px-2 py-1 bg-slate-950 border border-slate-800 rounded-lg text-xs text-white text-center focus:outline-none focus:border-orange-500"
                />
                <button
                  type="submit"
                  className="px-2 py-1 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold rounded-lg border border-slate-700"
                >
                  OK
                </button>
              </form>
            </div>
          </div>

          {/* CHANNELS GRID OR TABLE VIEW */}
          {displayMode === 'grid' ? (
            <div>
              {paginatedContents.length === 0 ? (
                <div className="bg-slate-900 border border-slate-800 rounded-2xl p-12 text-center text-slate-400 space-y-3">
                  <Tv className="w-12 h-12 mx-auto text-slate-700 mb-2" />
                  <p className="font-bold text-slate-200 text-base">Aucune chaîne ne correspond à vos critères</p>
                  <p className="text-xs text-slate-500">Essayez de réinitialiser vos filtres ou de sélectionner une autre catégorie.</p>
                  <button
                    onClick={handleResetFilters}
                    className="mt-2 px-4 py-2 rounded-xl bg-orange-500 text-slate-950 font-bold text-xs inline-flex items-center gap-2 shadow-lg"
                  >
                    <RotateCcw className="w-4 h-4" />
                    Réinitialiser les filtres
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3">
                  {paginatedContents.map((c) => {
                    const isOnline = c.status === 'Actif';
                    const isWarning = c.status === 'Instable' || c.qualityScore === 'DEGRADED';
                    
                    return (
                      <div
                        key={c.id}
                        onClick={() => setPreviewContent(c)}
                        className="group relative bg-slate-900/90 hover:bg-slate-900 border border-slate-800/80 hover:border-orange-500/50 rounded-2xl p-2.5 sm:p-3 flex flex-col justify-between transition-all duration-200 shadow-md hover:shadow-xl hover:shadow-orange-500/10 cursor-pointer overflow-hidden hover:-translate-y-0.5 select-none"
                      >
                        <div>
                          {/* Logo Container with reserved area & neutral backdrop */}
                          <div className="relative aspect-[16/10] rounded-xl bg-slate-950/80 border border-slate-800/60 group-hover:border-slate-700/80 overflow-hidden flex items-center justify-center p-2 transition-colors">
                            
                            {/* Status Indicator */}
                            <div className="absolute top-1.5 left-1.5 flex items-center gap-1 px-1.5 py-0.5 rounded-full bg-slate-950/80 backdrop-blur-md border border-slate-800 text-[9px] font-bold z-10">
                              <span
                                className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${
                                  isOnline
                                    ? 'bg-emerald-500 shadow-[0_0_6px_rgba(16,185,129,0.7)] animate-pulse'
                                    : isWarning
                                    ? 'bg-amber-500 shadow-[0_0_6px_rgba(245,158,11,0.7)]'
                                    : 'bg-rose-500 shadow-[0_0_6px_rgba(244,63,94,0.7)]'
                                }`}
                              />
                              <span
                                className={`text-[8px] uppercase tracking-wider font-extrabold ${
                                  isOnline
                                    ? 'text-emerald-400'
                                    : isWarning
                                    ? 'text-amber-400'
                                    : 'text-rose-400'
                                }`}
                              >
                                {isOnline ? 'Actif' : isWarning ? 'Instable' : 'Inactif'}
                              </span>
                            </div>

                            {/* Channel Logo with object-contain & fallback */}
                            <img
                              src={c.logoUrl || `https://ui-avatars.com/api/?name=${encodeURIComponent(c.name || 'TV')}&background=0f172a&color=f97316&bold=true&size=128`}
                              alt={c.name}
                              loading="lazy"
                              className="w-full h-full object-contain filter drop-shadow group-hover:scale-105 transition-transform duration-300 pointer-events-none"
                              onError={(e) => {
                                (e.target as HTMLImageElement).src = `https://ui-avatars.com/api/?name=${encodeURIComponent(c.name || 'TV')}&background=0f172a&color=f97316&bold=true&size=128`;
                              }}
                            />

                            {/* Hover Action Overlay */}
                            <div className="absolute inset-0 bg-slate-950/85 opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex items-center justify-center gap-1.5 p-1 z-20">
                              {/* Play Preview */}
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setPreviewContent(c);
                                }}
                                className="p-2 rounded-xl bg-orange-500 text-slate-950 hover:brightness-110 shadow-md font-bold"
                                title="Tester la lecture"
                              >
                                <Play className="w-3.5 h-3.5 fill-current" />
                              </button>

                              {/* Inspect Stream */}
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setInspectorTargetChannel(c);
                                  setShowStreamInspector(true);
                                }}
                                className="p-2 rounded-xl bg-cyan-500/20 text-cyan-400 hover:bg-cyan-500 hover:text-slate-950 border border-cyan-500/30"
                                title="Inspecter le flux"
                              >
                                <Activity className="w-3.5 h-3.5" />
                              </button>

                              {/* Edit Channel */}
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleOpenEdit(c);
                                }}
                                className="p-2 rounded-xl bg-slate-800 text-slate-300 hover:bg-slate-700 hover:text-white border border-slate-700"
                                title="Modifier"
                              >
                                <Edit2 className="w-3.5 h-3.5" />
                              </button>

                              {/* Delete Channel */}
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  if (window.confirm(`Confirmer la suppression de la chaîne "${c.name}" ?`)) {
                                    context.deleteContent(c.id);
                                  }
                                }}
                                className="p-2 rounded-xl bg-red-500/20 text-red-400 hover:bg-red-600 hover:text-white border border-red-500/30"
                                title="Supprimer"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>

                            {/* Quality Badge */}
                            {c.quality && (
                              <div className="absolute bottom-1 right-1 px-1 py-0.2 rounded bg-slate-950/90 border border-slate-800 text-[8px] font-mono font-bold text-orange-400/90">
                                {c.quality}
                              </div>
                            )}
                          </div>

                          {/* Channel Meta */}
                          <div className="mt-2 space-y-0.5">
                            <h4 className="text-xs sm:text-sm font-bold text-slate-100 group-hover:text-orange-400 transition-colors truncate" title={c.name}>
                              {c.name}
                            </h4>

                            <div className="flex items-center gap-1 text-[10px] sm:text-[11px] text-slate-400 truncate">
                              <span className="text-slate-300 font-medium truncate">
                                {c.category || 'Général'}
                              </span>
                              {c.country && (
                                <>
                                  <span className="text-slate-600">•</span>
                                  <span className="text-slate-400 truncate">{c.country}</span>
                                </>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          ) : (
            /* CHANNELS DATA TABLE */
            <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse min-w-[800px]">
                  <thead>
                    <tr className="bg-slate-950 text-slate-400 text-[11px] font-bold uppercase tracking-wider border-b border-slate-800">
                      <th className="p-3.5">Logo & Nom de la chaîne</th>
                      <th className="p-3.5">Type & Catégorie</th>
                      <th className="p-3.5">Pays & Langue</th>
                      <th className="p-3.5">Qualité</th>
                      <th className="p-3.5">Statut</th>
                      <th className="p-3.5 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60 text-xs">
                    {paginatedContents.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="p-12 text-center text-slate-500">
                          <Tv className="w-12 h-12 mx-auto text-slate-700 mb-3" />
                          <p className="font-bold text-slate-400 text-base">Aucune chaîne ne correspond à vos critères</p>
                          <p className="text-xs text-slate-500 mt-1">Essayez de réinitialiser vos filtres ou de lancer l'audit de réconciliation.</p>
                          <button
                            onClick={handleResetFilters}
                            className="mt-4 px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-orange-400 font-bold text-xs inline-flex items-center gap-2 border border-slate-700"
                          >
                            <RotateCcw className="w-4 h-4" />
                            Réinitialiser les filtres
                          </button>
                        </td>
                      </tr>
                    ) : (
                      paginatedContents.map((c) => (
                        <tr key={c.id} className="hover:bg-slate-800/40 transition-colors">
                          {/* Logo & Name */}
                          <td className="p-3.5 flex items-center space-x-3">
                            <img
                              src={c.logoUrl || `https://ui-avatars.com/api/?name=${encodeURIComponent(c.name || 'TV')}&background=f97316&color=ffffff&bold=true`}
                              alt={c.name}
                              className="w-9 h-9 rounded-xl object-contain bg-slate-950 border border-slate-800 flex-shrink-0 p-1"
                              onError={(e) => {
                                (e.target as HTMLImageElement).src = `https://ui-avatars.com/api/?name=${encodeURIComponent(c.name || 'TV')}&background=f97316&color=ffffff&bold=true`;
                              }}
                            />
                            <div className="min-w-0 max-w-sm">
                              <span className="font-extrabold text-white block truncate">{c.name}</span>
                              <span className="text-[10px] text-slate-400 font-mono truncate block max-w-xs">{c.streamUrl}</span>
                            </div>
                          </td>

                          {/* Type & Category */}
                          <td className="p-3.5">
                            <div className="flex flex-col gap-1 items-start">
                              <span className="px-2 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700 font-semibold text-[10px] uppercase">
                                {c.type}
                              </span>
                              <span className="text-slate-400 text-[11px] truncate max-w-[140px]">
                                {c.category || 'Général'}
                              </span>
                            </div>
                          </td>

                          {/* Country & Language */}
                          <td className="p-3.5 text-slate-300">
                            <div className="font-semibold text-white">{c.country || "Côte d'Ivoire"}</div>
                            <div className="text-[10px] text-slate-400">{c.language || 'Français'}</div>
                          </td>

                          {/* Quality */}
                          <td className="p-3.5">
                            <span className="px-2 py-0.5 rounded-full bg-slate-950 text-orange-400 font-mono font-bold text-[10px] border border-orange-500/20">
                              {c.quality || '1080p'}
                            </span>
                          </td>

                          {/* Status */}
                          <td className="p-3.5">
                            <button
                              onClick={() => {
                                const updatedStatus = c.status === 'Actif' ? 'Inactif' : 'Actif';
                                context.updateContent({ ...c, status: updatedStatus });
                              }}
                              className={`px-2.5 py-1 rounded-full text-[10px] font-bold transition-all ${
                                c.status === 'Actif'
                                  ? 'bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500/30'
                                  : 'bg-red-500/20 text-red-400 hover:bg-red-500/30'
                              }`}
                              title="Cliquer pour basculer le statut"
                            >
                              {c.status === 'Actif' ? '🟢 Actif' : '🔴 Inactif'}
                            </button>
                          </td>

                          {/* Actions */}
                          <td className="p-3.5 text-right">
                            <div className="flex items-center justify-end space-x-1.5">
                              {/* Inspect Stream */}
                              <button
                                onClick={() => {
                                  setInspectorTargetChannel(c);
                                  setShowStreamInspector(true);
                                }}
                                className="p-2 rounded-xl bg-cyan-500/20 hover:bg-cyan-500 text-cyan-400 hover:text-slate-950 transition-all border border-cyan-500/30"
                                title="Inspecter le flux & diagnostic technique"
                              >
                                <Activity className="w-3.5 h-3.5" />
                              </button>

                              {/* Preview Player */}
                              <button
                                onClick={() => setPreviewContent(c)}
                                className="p-2 rounded-xl bg-orange-500/20 hover:bg-orange-500 text-orange-400 hover:text-slate-950 transition-all"
                                title="Tester la lecture du flux"
                              >
                                <Play className="w-3.5 h-3.5" />
                              </button>

                              {/* Edit */}
                              <button
                                onClick={() => handleOpenEdit(c)}
                                className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-all border border-slate-700"
                                title="Modifier cette chaîne"
                              >
                                <Edit2 className="w-3.5 h-3.5" />
                              </button>

                              {/* Delete */}
                              <button
                                onClick={() => {
                                  if (window.confirm(`Confirmer la suppression de la chaîne "${c.name}" ?`)) {
                                    context.deleteContent(c.id);
                                  }
                                }}
                                className="p-2 rounded-xl bg-red-500/20 hover:bg-red-600 text-red-400 hover:text-white transition-all border border-red-500/30"
                                title="Supprimer cette chaîne"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

            {/* Bottom Pagination */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3 p-4 bg-slate-950 border-t border-slate-800 text-xs text-slate-400 font-mono">
              <div>
                Page <span className="text-orange-400 font-bold">{safeCurrentPage}</span> sur <span className="text-white font-bold">{totalPages}</span> ({(filteredContents?.length || 0).toLocaleString('fr-FR')} chaînes affichables)
              </div>

              <div className="flex items-center gap-1.5">
                <button
                  onClick={() => setCurrentPage(1)}
                  disabled={safeCurrentPage <= 1}
                  className="p-1.5 rounded-lg bg-slate-800 text-slate-300 disabled:opacity-30 disabled:cursor-not-allowed hover:bg-slate-700"
                >
                  <ChevronsLeft className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  disabled={safeCurrentPage <= 1}
                  className="p-1.5 rounded-lg bg-slate-800 text-slate-300 disabled:opacity-30 disabled:cursor-not-allowed hover:bg-slate-700"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <span className="px-3 py-1 bg-slate-900 border border-slate-800 rounded-lg text-xs text-slate-200">
                  {safeCurrentPage} / {totalPages}
                </span>
                <button
                  onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                  disabled={safeCurrentPage >= totalPages}
                  className="p-1.5 rounded-lg bg-slate-800 text-slate-300 disabled:opacity-30 disabled:cursor-not-allowed hover:bg-slate-700"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setCurrentPage(totalPages)}
                  disabled={safeCurrentPage >= totalPages}
                  className="p-1.5 rounded-lg bg-slate-800 text-slate-300 disabled:opacity-30 disabled:cursor-not-allowed hover:bg-slate-700"
                >
                  <ChevronsRight className="w-4 h-4" />
                </button>
              </div>
            </div>
        </div>
      )}

      {/* ==================== PLAYLISTS TAB ==================== */}
      {activeTab === 'playlists' && (
        <div className="space-y-4">
          <div className="flex justify-between items-center bg-slate-900 p-4 rounded-2xl border border-slate-800">
            <div>
              <h2 className="text-base font-extrabold text-white">Playlists M3U Enregistrées</h2>
              <p className="text-xs text-slate-400">Gérez les bouquets M3U/M3U8 et synchronisez leurs flux</p>
            </div>
            <button
              onClick={() => setShowAddPlaylistModal(true)}
              className="px-4 py-2 rounded-xl bg-orange-500 hover:bg-orange-400 text-slate-950 font-black text-xs flex items-center space-x-1.5 shadow-lg"
            >
              <Plus className="w-4 h-4" />
              <span>Importer une nouvelle playlist</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {playlists.map((pl) => (
              <div
                key={pl.id}
                className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-lg hover:border-slate-700 transition-all flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="px-2.5 py-0.5 rounded-full bg-orange-500/20 text-orange-400 border border-orange-500/30 text-[10px] font-bold uppercase">
                      {pl.format}
                    </span>
                    <button
                      onClick={() => context.togglePlaylistStatus(pl.id)}
                      className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                        pl.status === 'Actif' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-red-500/20 text-red-400'
                      }`}
                    >
                      {pl.status}
                    </button>
                  </div>

                  <h3 className="text-base font-extrabold text-white mb-1">{pl.name}</h3>
                  <p className="text-xs text-slate-400 mb-3">Fournisseur : {pl.provider}</p>

                  <div className="bg-slate-950 p-3 rounded-xl border border-slate-800/80 space-y-1.5 text-xs font-mono">
                    <div className="flex justify-between text-slate-300">
                      <span>Chaînes totales :</span>
                      <span className="font-bold text-white">{pl.totalChannels?.toLocaleString('fr-FR') || '0'}</span>
                    </div>
                    <div className="flex justify-between text-slate-300">
                      <span>Dernière synchro :</span>
                      <span className="text-[10px] text-slate-400">{pl.lastUpdated ? pl.lastUpdated.slice(0, 16).replace('T', ' ') : 'N/A'}</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center space-x-2 mt-4 pt-3 border-t border-slate-800">
                  <button
                    onClick={() => {
                      handleFilterChange(setFilterPlaylist, pl.id);
                      setActiveTab('contents');
                    }}
                    className="flex-1 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-orange-400 font-bold text-xs flex items-center justify-center space-x-1 transition-all border border-slate-700"
                  >
                    <Eye className="w-3.5 h-3.5" />
                    <span>Voir les chaînes</span>
                  </button>

                  <button
                    onClick={() => context.syncPlaylist(pl.id)}
                    className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-emerald-400 font-bold text-xs flex items-center justify-center transition-all border border-slate-700"
                    title="Synchroniser"
                  >
                    <RefreshCw className="w-3.5 h-3.5" />
                  </button>

                  <button
                    onClick={() => {
                      if (window.confirm(`Supprimer la playlist "${pl.name}" et toutes ses chaînes associées ?`)) {
                        context.deletePlaylist(pl.id);
                      }
                    }}
                    className="p-2 rounded-xl bg-red-600/20 hover:bg-red-600 text-red-400 hover:text-white border border-red-500/30 transition-all"
                    title="Supprimer la playlist"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ==================== DIAGNOSTIC & RECONCILIATION TAB ==================== */}
      {activeTab === 'diagnostics' && (
        <div className="space-y-6">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-4">
              <div>
                <h2 className="text-lg font-black text-white flex items-center gap-2">
                  <Database className="w-5 h-5 text-cyan-400" />
                  Audit & Réconciliation des Collections IPTV
                </h2>
                <p className="text-xs text-slate-400 mt-1">
                  Analyse l'ensemble des collections Cloud Firestore (<code className="text-cyan-300 font-mono">iptv_channels</code>, <code className="text-cyan-300 font-mono">iptv</code>, <code className="text-cyan-300 font-mono">iptv_contents</code>, <code className="text-cyan-300 font-mono">iptv_playlists</code>) et le cache local IndexedDB pour réconcilier et unifier toutes les chaînes sans perte de données.
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <button
                  onClick={handleRebuildCache}
                  disabled={isRebuildingCache}
                  className="px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-indigo-300 border border-indigo-500/30 font-bold text-xs rounded-xl shadow flex items-center space-x-1.5 transition-all"
                  title="Recharger toutes les chaînes depuis Firestore et reconstruire IndexedDB"
                >
                  <RotateCcw className={`w-3.5 h-3.5 ${isRebuildingCache ? 'animate-spin' : ''}`} />
                  <span>{isRebuildingCache ? 'Reconstruction...' : 'Reconstruire Cache'}</span>
                </button>

                <button
                  onClick={handleClearCacheAndReload}
                  disabled={isRebuildingCache}
                  className="px-4 py-2.5 bg-red-950/40 hover:bg-red-900/60 text-red-300 border border-red-500/30 font-bold text-xs rounded-xl shadow flex items-center space-x-1.5 transition-all"
                  title="Purger le cache local et forcer un rechargement propre"
                >
                  <Trash2 className="w-3.5 h-3.5 text-red-400" />
                  <span>Purger Cache Local</span>
                </button>

                <button
                  onClick={handleRunDiagnostic}
                  disabled={isRunningDiagnostic}
                  className="px-5 py-2.5 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white font-black text-xs rounded-xl shadow-lg flex items-center space-x-2 transition-all"
                >
                  <RefreshCw className={`w-4 h-4 ${isRunningDiagnostic ? 'animate-spin' : ''}`} />
                  <span>{isRunningDiagnostic ? 'Audit en cours...' : 'Lancer la Réconciliation'}</span>
                </button>
              </div>
            </div>

            {/* Maintenance Feedback Alert */}
            {maintenanceFeedback && (
              <div className="p-3.5 bg-slate-950 border border-cyan-500/40 rounded-xl flex items-center justify-between text-xs text-cyan-200">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-cyan-400 shrink-0" />
                  <span>{maintenanceFeedback}</span>
                </div>
                <button onClick={() => setMaintenanceFeedback(null)} className="text-slate-400 hover:text-white text-xs ml-3">✕</button>
              </div>
            )}

            {/* Diagnostic Results Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="p-4 bg-slate-950 rounded-xl border border-slate-800 space-y-1">
                <span className="text-[11px] font-bold text-slate-400">Total en Mémoire Active</span>
                <div className="text-2xl font-black text-orange-400">{(contents?.length || 0).toLocaleString('fr-FR')}</div>
                <p className="text-[10px] text-slate-500">Chaînes chargées et indexées dans l'interface</p>
              </div>

              <div className="p-4 bg-slate-950 rounded-xl border border-slate-800 space-y-1">
                <span className="text-[11px] font-bold text-slate-400">Collection /iptv_channels</span>
                <div className="text-2xl font-black text-emerald-400">
                  {diagnosticResult?.firestoreCounts?.iptv_channels !== undefined ? diagnosticResult.firestoreCounts.iptv_channels.toLocaleString('fr-FR') : 'Scannez...'}
                </div>
                <p className="text-[10px] text-slate-500">Documents principaux Cloud Firestore</p>
              </div>

              <div className="p-4 bg-slate-950 rounded-xl border border-slate-800 space-y-1">
                <span className="text-[11px] font-bold text-slate-400">Collection /iptv (Miroir)</span>
                <div className="text-2xl font-black text-cyan-400">
                  {diagnosticResult?.firestoreCounts?.iptv !== undefined ? diagnosticResult.firestoreCounts.iptv.toLocaleString('fr-FR') : 'Scannez...'}
                </div>
                <p className="text-[10px] text-slate-500">Documents miroirs unifiés</p>
              </div>

              <div className="p-4 bg-slate-950 rounded-xl border border-slate-800 space-y-1">
                <span className="text-[11px] font-bold text-slate-400">Cache Local IndexedDB</span>
                <div className="text-2xl font-black text-indigo-400">
                  {diagnosticResult?.totalInIndexedDb !== undefined ? diagnosticResult.totalInIndexedDb.toLocaleString('fr-FR') : 'Vérification...'}
                </div>
                <p className="text-[10px] text-slate-500">Persistance locale haute capacité</p>
              </div>
            </div>

            {/* Recommendations Box */}
            <div className="bg-slate-950/80 p-4 rounded-xl border border-slate-800 space-y-2 text-xs">
              <h3 className="font-extrabold text-white flex items-center gap-2">
                <ShieldAlert className="w-4 h-4 text-emerald-400" />
                Garantie d'intégrité et scalabilité haute capacité (100 000+ chaînes)
              </h3>
              <ul className="space-y-1 text-slate-300 list-disc list-inside text-[11px]">
                <li><strong className="text-white">Source de Vérité</strong> : Cloud Firestore conserve l'historique complet et officiel du catalogue IPTV.</li>
                <li><strong className="text-white">Cache Ultra-Rapide</strong> : IndexedDB indexe le catalogue localement pour un démarrage instantané et une recherche fluide à 0ms de latence.</li>
                <li><strong className="text-white">Anti-Perte</strong> : La réconciliation unifie sans écraser arbitrairement vos configurations manuelles.</li>
                <li><strong className="text-white">Sauvegarde</strong> : Vous pouvez exporter l'intégralité du bouquet à tout moment au format standard M3U via "Export M3U".</li>
              </ul>
            </div>
          </div>
        </div>
      )}

      {/* ==================== HEALTH MONITOR & MAINTENANCE TAB ==================== */}
      {activeTab === 'health' && (
        <div className="space-y-6">
          <StreamHealthDashboard
            onOpenPlayer={(channel) => setPreviewContent(channel)}
          />
        </div>
      )}

      {/* ==================== LOGS TAB ==================== */}
      {activeTab === 'logs' && (
        <div className="space-y-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4">
            <h2 className="text-base font-extrabold text-white flex items-center gap-2">
              <FileText className="w-5 h-5 text-orange-400" />
              Historique des Opérations & Imports IPTV
            </h2>

            <div className="space-y-2">
              {logs.map((l) => (
                <div
                  key={l.id}
                  className="bg-slate-950 p-4 rounded-xl border border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                        l.status === 'SUCCESS' ? 'bg-emerald-500/20 text-emerald-400' :
                        l.status === 'WARNING' ? 'bg-amber-500/20 text-amber-400' : 'bg-red-500/20 text-red-400'
                      }`}>
                        {l.action}
                      </span>
                      {l.playlistName && (
                        <span className="font-bold text-white">{l.playlistName}</span>
                      )}
                      {l.channelsCount !== undefined && (
                        <span className="text-orange-400 font-mono">({l.channelsCount} chaînes)</span>
                      )}
                    </div>
                    <p className="text-slate-300">{l.details}</p>
                  </div>
                  <span className="font-mono text-[10px] text-slate-500 whitespace-nowrap">
                    {l.timestamp.slice(0, 19).replace('T', ' ')}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ==================== SETTINGS & HERO BANNER CUSTOMIZATION TAB ==================== */}
      {activeTab === 'settings' && (
        <div className="space-y-6">
          
          {/* HEADER EXPLANATION */}
          <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-6 shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <div className="flex items-center space-x-4">
              <div className="w-12 h-12 rounded-2xl bg-orange-500/20 text-orange-400 border border-orange-500/30 flex items-center justify-center flex-shrink-0">
                <Sparkles className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-xl font-black text-white">Personnalisation du Module IPTV & Visuel Hero</h3>
                <p className="text-xs sm:text-sm text-slate-400">
                  Configurez l'affiche principale du module IPTV (image de fond cinématographique, titres, badges et CTA). Les modifications sont appliquées en temps réel pour tous les voyageurs.
                </p>
              </div>
            </div>

            <button
              onClick={handleSaveHeroSettings}
              disabled={isSavingHeroSettings}
              className="px-6 py-3 rounded-2xl bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-400 hover:to-amber-400 text-slate-950 font-black text-xs sm:text-sm flex items-center space-x-2 shadow-xl shadow-orange-500/25 active:scale-95 transition-all disabled:opacity-50 flex-shrink-0"
            >
              {isSavingHeroSettings ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>Enregistrement...</span>
                </>
              ) : (
                <>
                  <Check className="w-4 h-4" />
                  <span>Enregistrer les modifications</span>
                </>
              )}
            </button>
          </div>

          {/* NOTIFICATION FEEDBACK */}
          {heroSettingsFeedback && (
            <div className={`p-4 rounded-2xl border text-xs sm:text-sm font-bold flex items-center space-x-3 transition-all ${
              heroSettingsFeedback.startsWith('✅') 
                ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300' 
                : 'bg-red-500/10 border-red-500/30 text-red-300'
            }`}>
              {heroSettingsFeedback.startsWith('✅') ? (
                <CheckCircle2 className="w-5 h-5 text-emerald-400 flex-shrink-0" />
              ) : (
                <AlertTriangle className="w-5 h-5 text-red-400 flex-shrink-0" />
              )}
              <span>{heroSettingsFeedback}</span>
            </div>
          )}

          {/* LIVE PREVIEW OF THE HERO CARD AS SEEN BY TRAVELERS */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-black text-slate-400 uppercase tracking-wider flex items-center space-x-2">
                <Eye className="w-3.5 h-3.5 text-orange-400" />
                <span>Aperçu en direct (Vue Voyageur)</span>
              </span>
              <span className="text-[11px] text-slate-500">Rendu instantané avec dégradé sombre et typographie</span>
            </div>

            <div className="relative rounded-3xl overflow-hidden bg-slate-950 border border-slate-800 shadow-2xl min-h-[300px] sm:min-h-[340px] flex flex-col justify-end p-6 sm:p-8">
              {/* Background Visual Container: Ambient Backdrop + Full Uncropped Proportional Artwork */}
              <div className="absolute inset-0 z-0 overflow-hidden bg-slate-950">
                {/* Ambient Blurred Backdrop */}
                <img
                  src={heroBannerUrl || defaultHeroImage}
                  alt=""
                  aria-hidden="true"
                  className="w-full h-full object-cover filter blur-3xl opacity-30 brightness-75 scale-105 pointer-events-none"
                />

                {/* Full Proportional Natural Artwork */}
                <div className="absolute inset-0 flex items-center justify-end pointer-events-none">
                  <img
                    src={heroBannerUrl || defaultHeroImage}
                    alt="Aperçu Visuel IPTV"
                    referrerPolicy="no-referrer"
                    className="w-full h-full object-contain object-center sm:object-right brightness-100 contrast-105 transition-all duration-300"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = defaultHeroImage;
                    }}
                  />
                </div>

                {/* Light, progressive directional gradient */}
                <div className="absolute inset-0 bg-gradient-to-r from-slate-950/90 via-slate-950/60 to-transparent/10 sm:w-2/3 lg:w-1/2 pointer-events-none" />
                <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-transparent to-transparent sm:hidden pointer-events-none" />
                <div className="absolute -bottom-12 -left-12 w-72 h-72 bg-orange-600/15 rounded-full blur-3xl pointer-events-none" />
              </div>

              <div className="relative z-10 max-w-xl space-y-3">
                <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-slate-950/80 backdrop-blur-md text-orange-400 border border-orange-500/40 text-[11px] font-black tracking-wider">
                  <Sparkles className="w-3 h-3 text-amber-400" />
                  <span>{heroBadgeText || '🎬 FILMS • SÉRIES • TV • DIVERTISSEMENT'}</span>
                </div>

                <div className="space-y-0.5">
                  <h1 className="text-3xl sm:text-4xl font-black text-white tracking-tight leading-none drop-shadow-md">
                    {heroTitle || 'IPTV'}
                  </h1>
                  <p className="text-base sm:text-lg font-black text-transparent bg-clip-text bg-gradient-to-r from-orange-400 via-amber-300 to-yellow-200">
                    {heroSubtitle || 'Votre univers de divertissement'}
                  </p>
                </div>

                <p className="text-slate-300 text-xs max-w-md line-clamp-2 leading-relaxed">
                  Vivez une expérience TV & VOD haute définition : direct national ivoirien, films d'action, séries cultes, grands événements sportifs et radios FM.
                </p>

                <div className="flex items-center gap-2 pt-1">
                  <span className="px-4 py-2 rounded-xl bg-gradient-to-r from-orange-500 to-amber-500 text-slate-950 font-black text-xs flex items-center space-x-1.5 shadow-lg">
                    <Clapperboard className="w-3.5 h-3.5 fill-current" />
                    <span>{heroCtaText || 'Explorer les chaînes'}</span>
                  </span>
                  <span className="px-3 py-2 rounded-xl bg-slate-900/90 text-white font-bold text-xs border border-slate-700 backdrop-blur">
                    ▶ Direct RTI 1 HD
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* VISUAL THEME PRESETS */}
          <div className="space-y-3">
            <h4 className="text-xs font-black text-slate-300 uppercase tracking-wider flex items-center space-x-2">
              <Palette className="w-4 h-4 text-orange-400" />
              <span>Thèmes & Préréglages Visuels Recommandés</span>
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {HERO_PRESETS.map((preset) => {
                const isSelected = heroBannerUrl === preset.url;
                return (
                  <div
                    key={preset.id}
                    onClick={() => handleApplyPreset(preset)}
                    className={`group cursor-pointer rounded-2xl overflow-hidden border p-3 flex flex-col justify-between transition-all bg-slate-900 ${
                      isSelected
                        ? 'border-orange-500 ring-2 ring-orange-500/30 bg-orange-500/5'
                        : 'border-slate-800 hover:border-slate-700 hover:bg-slate-850'
                    }`}
                  >
                    <div className="space-y-2">
                      <div className="relative h-28 rounded-xl overflow-hidden bg-slate-950 border border-slate-800">
                        <img
                          src={preset.url}
                          alt={preset.name}
                          referrerPolicy="no-referrer"
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                        />
                        {isSelected && (
                          <div className="absolute top-2 right-2 bg-orange-500 text-slate-950 px-2 py-0.5 rounded-full text-[10px] font-black flex items-center space-x-1 shadow-md">
                            <Check className="w-3 h-3" />
                            <span>Actif</span>
                          </div>
                        )}
                      </div>

                      <div>
                        <h5 className="text-xs font-black text-white line-clamp-1">{preset.name}</h5>
                        <p className="text-[11px] text-slate-400 mt-0.5 line-clamp-2 leading-relaxed">
                          {preset.description}
                        </p>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleApplyPreset(preset);
                      }}
                      className={`mt-3 w-full py-1.5 rounded-xl text-xs font-extrabold transition-all ${
                        isSelected
                          ? 'bg-orange-500 text-slate-950 font-black'
                          : 'bg-slate-800 text-slate-300 hover:bg-slate-700 hover:text-white'
                      }`}
                    >
                      {isSelected ? 'Sélectionné' : 'Appliquer ce thème'}
                    </button>
                  </div>
                );
              })}
            </div>
          </div>

          {/* EDITABLE FIELDS */}
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl space-y-5">
            <h4 className="text-xs font-black text-slate-300 uppercase tracking-wider flex items-center space-x-2">
              <ImageIcon className="w-4 h-4 text-orange-400" />
              <span>Champs de Configuration Visuelle</span>
            </h4>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              
              {/* Image URL Input */}
              <div className="space-y-1 md:col-span-2">
                <label className="text-xs font-bold text-slate-300">
                  URL de l'image de fond (Bannière Hero)
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={heroBannerUrl}
                    onChange={(e) => setHeroBannerUrl(e.target.value)}
                    placeholder="https://... ou chemin d'accès local"
                    className="flex-1 bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-600 focus:outline-none focus:border-orange-500"
                  />
                  <button
                    type="button"
                    onClick={() => setHeroBannerUrl(defaultHeroImage)}
                    className="px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold whitespace-nowrap"
                  >
                    Image Super-Héros
                  </button>
                </div>
                <p className="text-[10px] text-slate-500">
                  L'image s'adapte automatiquement avec dégradé sombre immersif pour garantir une lisibilité optimale sur smartphone, tablette et écran tactile.
                </p>
              </div>

              {/* Title Input */}
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-300">
                  Titre Principal
                </label>
                <input
                  type="text"
                  value={heroTitle}
                  onChange={(e) => setHeroTitle(e.target.value)}
                  placeholder="ex: IPTV"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-600 focus:outline-none focus:border-orange-500"
                />
              </div>

              {/* Subtitle Input */}
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-300">
                  Sous-titre Lumineux
                </label>
                <input
                  type="text"
                  value={heroSubtitle}
                  onChange={(e) => setHeroSubtitle(e.target.value)}
                  placeholder="ex: Votre univers de divertissement"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-600 focus:outline-none focus:border-orange-500"
                />
              </div>

              {/* Badge Text Input */}
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-300">
                  Texte du Badge Supérieur
                </label>
                <input
                  type="text"
                  value={heroBadgeText}
                  onChange={(e) => setHeroBadgeText(e.target.value)}
                  placeholder="ex: 🎬 FILMS • SÉRIES • TV • DIVERTISSEMENT"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-600 focus:outline-none focus:border-orange-500"
                />
              </div>

              {/* CTA Button Text Input */}
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-300">
                  Texte du Bouton d'Action Principal (CTA)
                </label>
                <input
                  type="text"
                  value={heroCtaText}
                  onChange={(e) => setHeroCtaText(e.target.value)}
                  placeholder="ex: Explorer les chaînes"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-600 focus:outline-none focus:border-orange-500"
                />
              </div>

            </div>

            {/* Bottom Save Bar */}
            <div className="pt-4 border-t border-slate-800 flex justify-end">
              <button
                onClick={handleSaveHeroSettings}
                disabled={isSavingHeroSettings}
                className="px-6 py-3 rounded-2xl bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-400 hover:to-amber-400 text-slate-950 font-black text-xs sm:text-sm flex items-center space-x-2 shadow-xl shadow-orange-500/25 active:scale-95 transition-all disabled:opacity-50"
              >
                {isSavingHeroSettings ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>Enregistrement en cours...</span>
                  </>
                ) : (
                  <>
                    <Check className="w-4 h-4" />
                    <span>Enregistrer et Publier</span>
                  </>
                )}
              </button>
            </div>
          </div>

        </div>
      )}

      {/* ==================== ADD / EDIT CONTENT MODAL ==================== */}
      {showAddContentModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 max-w-lg w-full shadow-2xl space-y-4 text-slate-100">
            <div className="flex justify-between items-center border-b border-slate-800 pb-3">
              <h3 className="text-lg font-black text-white">
                {editingContent ? 'Modifier la chaîne' : 'Ajouter une nouvelle chaîne'}
              </h3>
              <button
                onClick={() => {
                  setShowAddContentModal(false);
                  setEditingContent(null);
                }}
                className="text-slate-400 hover:text-white"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-400 font-bold mb-1">Nom de la chaîne *</label>
                <input
                  type="text"
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  placeholder="ex: RTI 1 Direct Abidjan"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-orange-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-400 font-bold mb-1">Type de flux</label>
                  <select
                    value={formType}
                    onChange={(e) => setFormType(e.target.value as IPTVContentType)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-orange-500"
                  >
                    <option value="TV">TV Direct</option>
                    <option value="RADIO">Radio FM</option>
                    <option value="FILM">Film VOD</option>
                    <option value="SERIES">Série</option>
                    <option value="DOCUMENTAIRE">Documentaire</option>
                  </select>
                </div>

                <div>
                  <label className="block text-slate-400 font-bold mb-1">Catégorie</label>
                  <input
                    type="text"
                    value={formCategory}
                    onChange={(e) => setFormCategory(e.target.value)}
                    placeholder="Actualités, Sport..."
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-orange-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-400 font-bold mb-1">URL du Flux (HLS / M3U8 / MP4) *</label>
                <input
                  type="text"
                  value={formStreamUrl}
                  onChange={(e) => setFormStreamUrl(e.target.value)}
                  placeholder="https://stream.example.com/live.m3u8"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white font-mono focus:outline-none focus:border-orange-500"
                />
              </div>

              <div>
                <label className="block text-slate-400 font-bold mb-1">URL du Logo (Optionnel)</label>
                <input
                  type="text"
                  value={formLogoUrl}
                  onChange={(e) => setFormLogoUrl(e.target.value)}
                  placeholder="https://images.example.com/logo.png"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-orange-500"
                />
              </div>

              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="block text-slate-400 font-bold mb-1">Pays</label>
                  <input
                    type="text"
                    value={formCountry}
                    onChange={(e) => setFormCountry(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-2.5 py-2 text-white focus:outline-none focus:border-orange-500"
                  />
                </div>

                <div>
                  <label className="block text-slate-400 font-bold mb-1">Langue</label>
                  <input
                    type="text"
                    value={formLanguage}
                    onChange={(e) => setFormLanguage(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-2.5 py-2 text-white focus:outline-none focus:border-orange-500"
                  />
                </div>

                <div>
                  <label className="block text-slate-400 font-bold mb-1">Qualité</label>
                  <select
                    value={formQuality}
                    onChange={(e) => setFormQuality(e.target.value as IPTVQuality)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-2 py-2 text-white focus:outline-none focus:border-orange-500"
                  >
                    <option value="4K UHD">4K UHD</option>
                    <option value="1080p Full HD">1080p Full HD</option>
                    <option value="720p HD">720p HD</option>
                    <option value="SD">SD</option>
                  </select>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-end space-x-3 pt-3 border-t border-slate-800">
              <button
                onClick={() => {
                  setShowAddContentModal(false);
                  setEditingContent(null);
                }}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs rounded-xl"
              >
                Annuler
              </button>
              <button
                onClick={handleSaveContent}
                className="px-5 py-2 bg-orange-500 hover:bg-orange-400 text-slate-950 font-black text-xs rounded-xl shadow-lg"
              >
                {editingContent ? 'Mettre à jour' : 'Enregistrer'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ==================== MASS M3U PLAYLIST IMPORT MODAL ==================== */}
      {showAddPlaylistModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 max-w-lg w-full shadow-2xl space-y-4 text-slate-100">
            <div className="flex justify-between items-center border-b border-slate-800 pb-3">
              <h3 className="text-lg font-black text-white flex items-center gap-2">
                <Upload className="w-5 h-5 text-orange-400" />
                Importer une Playlist M3U / M3U8
              </h3>
              <button
                onClick={() => {
                  setShowAddPlaylistModal(false);
                  resetPlaylistForm();
                }}
                className="text-slate-400 hover:text-white"
              >
                ✕
              </button>
            </div>

            <div className="flex space-x-2 bg-slate-950 p-1 rounded-xl border border-slate-800">
              <button
                onClick={() => setImportMode('URL')}
                className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all ${
                  importMode === 'URL' ? 'bg-orange-500 text-slate-950' : 'text-slate-400 hover:text-white'
                }`}
              >
                Via URL Distante
              </button>
              <button
                onClick={() => setImportMode('FILE')}
                className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all ${
                  importMode === 'FILE' ? 'bg-orange-500 text-slate-950' : 'text-slate-400 hover:text-white'
                }`}
              >
                Téléverser un Fichier M3U
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-400 font-bold mb-1">Nom de la playlist *</label>
                <input
                  type="text"
                  value={plName}
                  onChange={(e) => setPlName(e.target.value)}
                  placeholder="ex: Bouquet National CI 2026"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-orange-500"
                />
              </div>

              <div>
                <label className="block text-slate-400 font-bold mb-1">Fournisseur / Distributeur</label>
                <input
                  type="text"
                  value={plProvider}
                  onChange={(e) => setPlProvider(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-orange-500"
                />
              </div>

              <div>
                <label className="block text-slate-400 font-bold mb-1">Portée / Agence de Destination</label>
                <select
                  value={selectedAgencyForImport}
                  onChange={(e) => setSelectedAgencyForImport(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-orange-500"
                >
                  <option value="NATIONAL">🌐 Bouquet National (Accessible par toutes les agences)</option>
                  {props.agencies && props.agencies.map((ag) => (
                    <option key={ag.id} value={ag.id}>
                      🏢 Agence : {ag.name}
                    </option>
                  ))}
                </select>
              </div>

              {importMode === 'URL' ? (
                <div>
                  <label className="block text-slate-400 font-bold mb-1">Lien URL du fichier .m3u / .m3u8 *</label>
                  <input
                    type="text"
                    value={plUrl}
                    onChange={(e) => setPlUrl(e.target.value)}
                    placeholder="https://iptv.example.com/playlist.m3u"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white font-mono focus:outline-none focus:border-orange-500"
                  />
                  <div className="flex gap-2 mt-2">
                    <button
                      onClick={() => handleLoadSampleM3U('https://iptv-org.github.io/iptv/countries/ci.m3u', 'Chaînes Côte d\'Ivoire (IPTV-Org)')}
                      className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-orange-400 text-[10px] font-bold rounded-lg border border-slate-700"
                    >
                      Exemple CI (.m3u)
                    </button>
                    <button
                      onClick={() => handleLoadSampleM3U('https://iptv-org.github.io/iptv/languages/fra.m3u', 'Chaînes Francophones (IPTV-Org)')}
                      className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-orange-400 text-[10px] font-bold rounded-lg border border-slate-700"
                    >
                      Exemple Monde Francophone
                    </button>
                  </div>
                </div>
              ) : (
                <div>
                  <label className="block text-slate-400 font-bold mb-1">Fichier M3U / M3U8 *</label>
                  <input
                    type="file"
                    accept=".m3u,.m3u8,.txt"
                    onChange={handleFileUpload}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white file:mr-3 file:py-1 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-bold file:bg-orange-500 file:text-slate-950 hover:file:bg-orange-400"
                  />
                  {selectedFileName && (
                    <span className="text-[11px] text-emerald-400 font-mono mt-1 block">
                      Fichier chargé : {selectedFileName}
                    </span>
                  )}
                </div>
              )}
            </div>

            {importFeedback && (
              <div className={`p-3 rounded-xl text-xs font-bold ${
                importFeedback.success ? 'bg-emerald-500/20 text-emerald-400' : 'bg-red-500/20 text-red-400'
              }`}>
                {importFeedback.message}
              </div>
            )}

            <div className="flex items-center justify-end space-x-3 pt-3 border-t border-slate-800">
              <button
                onClick={() => {
                  setShowAddPlaylistModal(false);
                  resetPlaylistForm();
                }}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs rounded-xl"
              >
                Annuler
              </button>
              <button
                onClick={handleImportPlaylist}
                disabled={isImporting}
                className="px-5 py-2 bg-orange-500 hover:bg-orange-400 disabled:opacity-50 text-slate-950 font-black text-xs rounded-xl shadow-lg flex items-center space-x-2"
              >
                {isImporting && <RefreshCw className="w-3.5 h-3.5 animate-spin" />}
                <span>{isImporting ? 'Traitement & Import...' : 'Démarrer l\'importation'}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ==================== IMPORT SUMMARY / ANALYTICS MODAL ==================== */}
      {showImportSummaryModal && context.lastImportSummary && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 max-w-lg w-full shadow-2xl space-y-4 text-slate-100 animate-in fade-in zoom-in-95 duration-200">
            <div className="flex justify-between items-center border-b border-slate-800 pb-3">
              <div className="flex items-center space-x-2.5">
                <div className="w-8 h-8 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center border border-emerald-500/30">
                  <CheckCircle2 className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-black text-white">Rapport d'Importation Haute Capacité</h3>
                  <p className="text-[11px] text-slate-400">Pipeline de validation et déduplication intelligente</p>
                </div>
              </div>
              <button
                onClick={() => setShowImportSummaryModal(false)}
                className="text-slate-400 hover:text-white text-base font-bold"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="bg-slate-950 p-3.5 rounded-xl border border-slate-800 space-y-1.5 font-mono">
                <div className="flex justify-between text-slate-300">
                  <span>Playlist :</span>
                  <span className="font-bold text-white">{context.lastImportSummary.playlistName || 'Import M3U'}</span>
                </div>
                <div className="flex justify-between text-slate-300">
                  <span>Fournisseur :</span>
                  <span className="text-orange-400">{context.lastImportSummary.provider || 'Auto-Détecté'}</span>
                </div>
                <div className="flex justify-between text-slate-300">
                  <span>Portée :</span>
                  <span className="text-cyan-400">{context.lastImportSummary.agencyId === 'NATIONAL' ? '🌐 National (Toutes)' : `🏢 Agence #${context.lastImportSummary.agencyId || 'NATIONAL'}`}</span>
                </div>
                <div className="flex justify-between text-slate-300">
                  <span>Durée d'exécution :</span>
                  <span className="text-slate-400">{context.lastImportSummary.durationSeconds ?? 0}s</span>
                </div>
              </div>

              {/* Stats Grid */}
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 text-center space-y-0.5">
                  <span className="text-[10px] text-slate-400 uppercase font-bold">Lignes Analysées</span>
                  <div className="text-xl font-black text-white">{(context.lastImportSummary.totalProcessed ?? context.lastImportSummary.processedCount ?? context.lastImportSummary.totalToImport ?? 0).toLocaleString('fr-FR')}</div>
                </div>

                <div className="bg-slate-950 p-3 rounded-xl border border-emerald-500/30 text-center space-y-0.5">
                  <span className="text-[10px] text-emerald-400 uppercase font-bold">Nouvelles Chaînes Uniques</span>
                  <div className="text-xl font-black text-emerald-400">+{(context.lastImportSummary.addedUnique ?? context.lastImportSummary.succeededCount ?? 0).toLocaleString('fr-FR')}</div>
                </div>
              </div>

              {/* Deduplication Breakdown */}
              <div className="bg-slate-950/80 p-3.5 rounded-xl border border-slate-800 space-y-2">
                <span className="text-[11px] font-bold text-amber-400 flex items-center gap-1.5">
                  <Layers className="w-3.5 h-3.5" />
                  Doublons Filtrés : {(context.lastImportSummary.deduplicatedCount ?? context.lastImportSummary.duplicateCount ?? 0).toLocaleString('fr-FR')} chaînes
                </span>
                <div className="space-y-1 font-mono text-[11px] text-slate-400">
                  <div className="flex justify-between">
                    <span>• Même URL de flux :</span>
                    <span className="text-slate-200">{(context.lastImportSummary.deduplicationReasonBreakdown?.streamUrl ?? 0).toLocaleString('fr-FR')}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>• Même TVG-ID (EPG) :</span>
                    <span className="text-slate-200">{(context.lastImportSummary.deduplicationReasonBreakdown?.tvgId ?? 0).toLocaleString('fr-FR')}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>• Même nom & pays :</span>
                    <span className="text-slate-200">{(context.lastImportSummary.deduplicationReasonBreakdown?.nameAndCountry ?? 0).toLocaleString('fr-FR')}</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex justify-end pt-3 border-t border-slate-800">
              <button
                onClick={() => setShowImportSummaryModal(false)}
                className="px-5 py-2 bg-orange-500 hover:bg-orange-400 text-slate-950 font-black text-xs rounded-xl shadow-lg"
              >
                Fermer & Explorer
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ==================== VIDEO PLAYER PREVIEW MODAL ==================== */}
      {previewContent && (
        <IPTVPlayerModal
          content={previewContent}
          onClose={() => setPreviewContent(null)}
        />
      )}

      {/* ==================== REAL-TIME STREAM INSPECTOR MODAL ==================== */}
      {showStreamInspector && (
        <ChannelStreamInspectorModal
          contents={contents}
          initialSelectedChannel={inspectorTargetChannel}
          onClose={() => {
            setShowStreamInspector(false);
            setInspectorTargetChannel(null);
          }}
          onPlayChannel={(channel) => {
            setShowStreamInspector(false);
            setPreviewContent(channel);
          }}
        />
      )}
    </div>
  );
};
