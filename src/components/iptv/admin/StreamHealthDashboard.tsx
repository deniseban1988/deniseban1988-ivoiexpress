import React, { useState, useMemo } from 'react';
import {
  IPTVContentItem,
  IPTVPlaylist,
  StreamHealthClassification,
  StreamHealthJobSummary,
  StreamHealthCheckProgress
} from '../../../types/iptv';
import { useIPTV } from '../../../core/context/IPTVContext';
import { ChannelStreamInspectorModal } from './ChannelStreamInspectorModal';
import { IPTVPlayerModal } from '../IPTVPlayerModal';
import {
  Activity,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Clock,
  Play,
  Zap,
  RotateCcw,
  Search,
  Filter,
  ShieldCheck,
  Server,
  Layers,
  ChevronRight,
  ChevronLeft,
  ChevronsLeft,
  ChevronsRight,
  Info,
  RefreshCw,
  Sliders,
  Check,
  Radio,
  Tv,
  CheckSquare,
  Sparkles,
  ArrowRight
} from 'lucide-react';

interface StreamHealthDashboardProps {
  onOpenPlayer?: (channel: IPTVContentItem) => void;
}

export const StreamHealthDashboard: React.FC<StreamHealthDashboardProps> = () => {
  const {
    contents,
    activePlaylist,
    playlists,
    settings,
    updateSettings,
    streamHealthProgress,
    lastHealthJobSummary,
    startStreamHealthCheck,
    cancelStreamHealthCheck,
    testSingleStream,
    reactivateDeadStream,
    cleanActivePlaylist
  } = useIPTV();

  // Job Run Configuration
  const [selectedScope, setSelectedScope] = useState<'ALL' | 'SAMPLE' | 'PENDING' | 'DEAD' | 'UNSTABLE'>('SAMPLE');
  const [sampleSize, setSampleSize] = useState<number>(100);
  const [selectedPlaylistId, setSelectedPlaylistId] = useState<string>('ALL');
  const [isCleaning, setIsCleaning] = useState<boolean>(false);
  const [cleanFeedback, setCleanFeedback] = useState<string | null>(null);

  // Table Filters & Pagination
  const [filterClassification, setFilterClassification] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [filterCategory, setFilterCategory] = useState<string>('ALL');
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [pageSize, setPageSize] = useState<number>(25);

  // Inspector & Player Modals
  const [selectedInspectorChannel, setSelectedInspectorChannel] = useState<IPTVContentItem | null>(null);
  const [previewChannel, setPreviewChannel] = useState<IPTVContentItem | null>(null);
  const [singleTestingId, setSingleTestingId] = useState<string | null>(null);

  // Calculate Health Breakdown
  const healthStats = useMemo(() => {
    let active = 0;
    let unstable = 0;
    let dead = 0;
    let pending = 0;
    let totalStartupTime = 0;
    let testedCount = 0;

    contents.forEach(c => {
      const cls = c.healthClassification || 'PENDING';
      if (cls === 'ACTIVE') {
        active++;
        testedCount++;
        if (c.startupTimeMs) totalStartupTime += c.startupTimeMs;
      } else if (cls === 'UNSTABLE') {
        unstable++;
        testedCount++;
        if (c.startupTimeMs) totalStartupTime += c.startupTimeMs;
      } else if (cls === 'DEAD') {
        dead++;
        testedCount++;
      } else {
        pending++;
      }
    });

    const avgStartupTime = testedCount > 0 ? Math.round(totalStartupTime / Math.max(active + unstable, 1)) : 0;
    const healthScore = contents.length > 0
      ? Math.round(((active * 1.0 + unstable * 0.5) / contents.length) * 100)
      : 100;

    return {
      total: contents.length,
      active,
      unstable,
      dead,
      pending,
      testedCount,
      avgStartupTime,
      healthScore,
      activePlaylistCount: activePlaylist.length
    };
  }, [contents, activePlaylist]);

  // Handle Health Check Launch
  const handleStartCheck = async () => {
    try {
      await startStreamHealthCheck({
        scope: selectedScope,
        sampleSize: selectedScope === 'SAMPLE' ? sampleSize : undefined,
        targetPlaylistId: selectedPlaylistId === 'ALL' ? undefined : selectedPlaylistId
      });
    } catch (err: any) {
      console.error('Health check execution error:', err);
    }
  };

  // Handle Clean Active Playlist
  const handleCleanActive = async () => {
    setIsCleaning(true);
    try {
      const res = await cleanActivePlaylist();
      setCleanFeedback(res.message);
      setTimeout(() => setCleanFeedback(null), 7000);
    } catch (err: any) {
      setCleanFeedback(`Erreur lors du nettoyage : ${err.message}`);
    } finally {
      setIsCleaning(false);
    }
  };

  // Test Single Stream
  const handleTestSingle = async (channelId: string) => {
    setSingleTestingId(channelId);
    try {
      await testSingleStream(channelId);
    } catch (e) {
      console.warn('Single test error:', e);
    } finally {
      setSingleTestingId(null);
    }
  };

  // Filter Channels for Table
  const filteredChannels = useMemo(() => {
    return contents.filter(c => {
      const cls = c.healthClassification || 'PENDING';
      if (filterClassification !== 'ALL') {
        if (filterClassification === 'ACTIVE' && cls !== 'ACTIVE') return false;
        if (filterClassification === 'UNSTABLE' && cls !== 'UNSTABLE') return false;
        if (filterClassification === 'DEAD' && cls !== 'DEAD') return false;
        if (filterClassification === 'PENDING' && cls !== 'PENDING') return false;
      }

      if (filterCategory !== 'ALL' && c.category !== filterCategory) return false;

      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchName = c.name?.toLowerCase().includes(q);
        const matchUrl = c.streamUrl?.toLowerCase().includes(q);
        const matchError = c.lastHealthError?.toLowerCase().includes(q);
        const matchCountry = c.country?.toLowerCase().includes(q);
        if (!matchName && !matchUrl && !matchError && !matchCountry) return false;
      }

      return true;
    });
  }, [contents, filterClassification, filterCategory, searchQuery]);

  // Pagination
  const totalPages = Math.max(1, Math.ceil(filteredChannels.length / pageSize));
  const safePage = Math.min(Math.max(1, currentPage), totalPages);
  const paginatedChannels = useMemo(() => {
    const start = (safePage - 1) * pageSize;
    return filteredChannels.slice(start, start + pageSize);
  }, [filteredChannels, safePage, pageSize]);

  // Categories list
  const categoryOptions = useMemo(() => {
    const cats = new Set<string>();
    contents.slice(0, 2000).forEach(c => {
      if (c.category) cats.add(c.category);
    });
    return Array.from(cats);
  }, [contents]);

  return (
    <div className="space-y-6">
      
      {/* 1. TOP BANNER / HEALTH CHECK ENGINE COCKPIT */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-orange-500/5 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-80 h-80 bg-emerald-500/5 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 space-y-6">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-slate-800 pb-6">
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1 bg-orange-500/10 border border-orange-500/20 rounded-full text-xs font-bold text-orange-400 mb-2">
                <ShieldCheck className="w-3.5 h-3.5" />
                Stream Health Check Engine v4.0 & Auto-Cleaning
              </div>
              <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight">
                Vérification des Flux & Nettoyage Automatique
              </h2>
              <p className="text-xs sm:text-sm text-slate-400 mt-1 max-w-3xl">
                Teste l'accessibilité des flux, la latence au premier segment (TTFF) et isole les liens morts sans altérer la playlist source originale de 13 536+ chaînes.
              </p>
            </div>

            {/* Quick Actions (Run / Stop / Clean) */}
            <div className="flex flex-wrap items-center gap-2.5">
              {streamHealthProgress?.isRunning ? (
                <button
                  onClick={cancelStreamHealthCheck}
                  className="px-4 py-2.5 bg-red-600/90 hover:bg-red-600 text-white rounded-xl text-xs font-bold transition-all shadow-lg flex items-center gap-2"
                >
                  <XCircle className="w-4 h-4" />
                  Arrêter la vérification
                </button>
              ) : (
                <button
                  onClick={handleStartCheck}
                  className="px-5 py-2.5 bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white rounded-xl text-xs font-black transition-all shadow-lg shadow-orange-500/20 flex items-center gap-2 active:scale-95"
                >
                  <Zap className="w-4 h-4" />
                  Lancer le Health Check
                </button>
              )}

              <button
                onClick={handleCleanActive}
                disabled={isCleaning}
                className="px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-xl text-xs font-bold transition-all flex items-center gap-2"
              >
                <CheckSquare className="w-4 h-4 text-emerald-400" />
                {isCleaning ? 'Nettoyage en cours...' : 'Nettoyer la Playlist Active'}
              </button>
            </div>
          </div>

          {/* Feedback alert */}
          {cleanFeedback && (
            <div className="p-3.5 bg-emerald-500/10 border border-emerald-500/30 rounded-xl flex items-center justify-between text-xs text-emerald-200 animate-fadeIn">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>{cleanFeedback}</span>
              </div>
              <button onClick={() => setCleanFeedback(null)} className="text-slate-400 hover:text-white">✕</button>
            </div>
          )}

          {/* Real-time Progress Bar if Running */}
          {streamHealthProgress?.isRunning && (
            <div className="p-4 bg-slate-950/80 border border-orange-500/30 rounded-2xl space-y-3 animate-pulse-border">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
                <div className="flex items-center gap-2">
                  <RefreshCw className="w-4 h-4 text-orange-400 animate-spin" />
                  <span className="font-bold text-white">Vérification en temps réel des flux IPTV...</span>
                  <span className="text-slate-400 font-mono">
                    ({streamHealthProgress.testedCount} / {streamHealthProgress.totalCount})
                  </span>
                </div>
                <div className="flex items-center gap-3 text-slate-400">
                  {streamHealthProgress.currentChannelName && (
                    <span className="truncate max-w-xs text-orange-300 font-medium">
                      En cours : {streamHealthProgress.currentChannelName}
                    </span>
                  )}
                  {streamHealthProgress.estimatedTimeRemainingSec !== undefined && (
                    <span className="font-mono text-slate-300 bg-slate-900 px-2 py-0.5 rounded text-[11px]">
                      ~{streamHealthProgress.estimatedTimeRemainingSec}s restant
                    </span>
                  )}
                </div>
              </div>

              {/* Progress Bar */}
              <div className="w-full h-2.5 bg-slate-900 rounded-full overflow-hidden border border-slate-800">
                <div
                  className="h-full bg-gradient-to-r from-orange-500 to-emerald-400 transition-all duration-300 rounded-full"
                  style={{
                    width: `${Math.min(100, Math.round((streamHealthProgress.testedCount / Math.max(streamHealthProgress.totalCount, 1)) * 100))}%`
                  }}
                />
              </div>

              {/* Live Sub-Counters */}
              <div className="flex items-center gap-4 text-xs font-mono">
                <span className="text-emerald-400 flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-emerald-400" />
                  {streamHealthProgress.activeCount} Actifs
                </span>
                <span className="text-amber-400 flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-amber-400" />
                  {streamHealthProgress.unstableCount} Instables
                </span>
                <span className="text-red-400 flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-red-400" />
                  {streamHealthProgress.deadCount} Morts
                </span>
              </div>
            </div>
          )}

          {/* Scope and Target Parameters */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
            <div>
              <label className="block text-slate-400 font-bold mb-1.5">Périmètre de test</label>
              <select
                value={selectedScope}
                onChange={(e) => setSelectedScope(e.target.value as any)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white font-medium focus:outline-none focus:border-orange-500"
              >
                <option value="SAMPLE">⚡ Échantillon Rapide (100 chaînes)</option>
                <option value="ALL">🌐 Tout le Catalogue ({contents.length} chaînes)</option>
                <option value="PENDING">⚪ Flux non testés (En attente)</option>
                <option value="DEAD">🔴 Flux Morts (Tester réactivation)</option>
                <option value="UNSTABLE">🟠 Flux Instables / Lents</option>
              </select>
            </div>

            {selectedScope === 'SAMPLE' && (
              <div>
                <label className="block text-slate-400 font-bold mb-1.5">Taille de l'échantillon</label>
                <select
                  value={sampleSize}
                  onChange={(e) => setSampleSize(Number(e.target.value))}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white font-medium focus:outline-none focus:border-orange-500"
                >
                  <option value={50}>50 flux</option>
                  <option value={100}>100 flux</option>
                  <option value={250}>250 flux</option>
                  <option value={500}>500 flux</option>
                  <option value={1000}>1 000 flux</option>
                </select>
              </div>
            )}

            <div>
              <label className="block text-slate-400 font-bold mb-1.5">Filtrer par Playlist</label>
              <select
                value={selectedPlaylistId}
                onChange={(e) => setSelectedPlaylistId(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white font-medium focus:outline-none focus:border-orange-500"
              >
                <option value="ALL">Toutes les playlists</option>
                {playlists.map(pl => (
                  <option key={pl.id} value={pl.id}>{pl.name} ({pl.totalChannels} ch)</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-slate-400 font-bold mb-1.5">Seuil d'échecs consécutifs</label>
              <select
                value={settings.healthCheckConsecutiveFailureThreshold || 3}
                onChange={(e) => updateSettings({ ...settings, healthCheckConsecutiveFailureThreshold: Number(e.target.value) })}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white font-medium focus:outline-none focus:border-orange-500"
              >
                <option value={1}>1 échec (Strict)</option>
                <option value={2}>2 échecs</option>
                <option value={3}>3 échecs consécutifs (Recommandé)</option>
                <option value={5}>5 échecs (Tolérant)</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* 2. DUAL PLAYLIST ARCHITECTURE CARD */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Source Catalog */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Server className="w-5 h-5 text-cyan-400" />
              <span className="text-sm font-extrabold text-white">Playlist Source (Originale)</span>
            </div>
            <span className="px-2.5 py-0.5 bg-cyan-500/20 text-cyan-400 rounded-full text-xs font-bold">
              100% Préservée
            </span>
          </div>
          <div className="text-3xl font-black text-white font-mono">
            {contents.length.toLocaleString('fr-FR')} <span className="text-xs font-normal text-slate-400">flux bruts</span>
          </div>
          <p className="text-xs text-slate-400 leading-relaxed">
            Conserve l'intégralité des flux importés par les administrateurs. Aucune donnée n'est supprimée définitivement lors des nettoyages.
          </p>
        </div>

        {/* Active Clean Playlist */}
        <div className="bg-slate-900 border border-emerald-500/30 rounded-2xl p-5 space-y-3 bg-gradient-to-br from-slate-900 to-emerald-950/20">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-emerald-400" />
              <span className="text-sm font-extrabold text-white">Playlist Active (Voyageurs)</span>
            </div>
            <span className="px-2.5 py-0.5 bg-emerald-500/20 text-emerald-400 rounded-full text-xs font-bold flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              Auto-Nettoyée
            </span>
          </div>
          <div className="text-3xl font-black text-emerald-400 font-mono">
            {healthStats.activePlaylistCount.toLocaleString('fr-FR')} <span className="text-xs font-normal text-slate-400">flux opérationnels</span>
          </div>
          <div className="flex items-center justify-between text-xs pt-1">
            <span className="text-slate-400">Réservé uniquement aux voyageurs :</span>
            <button
              onClick={() => updateSettings({ ...settings, activePlaylistOnlyForTraveler: !settings.activePlaylistOnlyForTraveler })}
              className={`px-3 py-1 rounded-full text-[11px] font-bold transition-all ${
                settings.activePlaylistOnlyForTraveler !== false
                  ? 'bg-emerald-500 text-slate-950'
                  : 'bg-slate-800 text-slate-400'
              }`}
            >
              {settings.activePlaylistOnlyForTraveler !== false ? 'Actif (Filtrage appliqué)' : 'Inactif (Tous les flux)'}
            </button>
          </div>
        </div>
      </div>

      {/* 3. EXECUTIVE KPI CARDS */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        {/* 🟢 Active */}
        <div className="bg-slate-900 border border-slate-800 p-4 rounded-2xl space-y-1">
          <span className="text-[11px] font-bold text-slate-400 flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-400" />
            Flux Actifs 🟢
          </span>
          <div className="text-2xl font-black text-emerald-400 font-mono">
            {healthStats.active.toLocaleString('fr-FR')}
          </div>
          <p className="text-[10px] text-slate-500">Réponse immédiate</p>
        </div>

        {/* 🟠 Unstable */}
        <div className="bg-slate-900 border border-slate-800 p-4 rounded-2xl space-y-1">
          <span className="text-[11px] font-bold text-slate-400 flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-amber-400" />
            Flux Instables 🟠
          </span>
          <div className="text-2xl font-black text-amber-400 font-mono">
            {healthStats.unstable.toLocaleString('fr-FR')}
          </div>
          <p className="text-[10px] text-slate-500">Latence élevée ou CORS</p>
        </div>

        {/* 🔴 Dead */}
        <div className="bg-slate-900 border border-slate-800 p-4 rounded-2xl space-y-1">
          <span className="text-[11px] font-bold text-slate-400 flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-red-400" />
            Flux Morts 🔴
          </span>
          <div className="text-2xl font-black text-red-400 font-mono">
            {healthStats.dead.toLocaleString('fr-FR')}
          </div>
          <p className="text-[10px] text-slate-500">Exclus de la lecture</p>
        </div>

        {/* ⚪ Pending */}
        <div className="bg-slate-900 border border-slate-800 p-4 rounded-2xl space-y-1">
          <span className="text-[11px] font-bold text-slate-400 flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-slate-400" />
            En Attente ⚪
          </span>
          <div className="text-2xl font-black text-slate-300 font-mono">
            {healthStats.pending.toLocaleString('fr-FR')}
          </div>
          <p className="text-[10px] text-slate-500">À auditer prochainement</p>
        </div>

        {/* TTFF Latency */}
        <div className="bg-slate-900 border border-slate-800 p-4 rounded-2xl space-y-1">
          <span className="text-[11px] font-bold text-slate-400 flex items-center gap-1.5">
            <Clock className="w-3.5 h-3.5 text-cyan-400" />
            Moyenne TTFF
          </span>
          <div className="text-2xl font-black text-cyan-400 font-mono">
            {healthStats.avgStartupTime > 0 ? `${(healthStats.avgStartupTime / 1000).toFixed(2)}s` : '--'}
          </div>
          <p className="text-[10px] text-slate-500">Temps de premier segment</p>
        </div>

        {/* Health Score */}
        <div className="bg-slate-900 border border-slate-800 p-4 rounded-2xl space-y-1">
          <span className="text-[11px] font-bold text-slate-400 flex items-center gap-1.5">
            <Activity className="w-3.5 h-3.5 text-orange-400" />
            Disponibilité
          </span>
          <div className="text-2xl font-black text-orange-400 font-mono">
            {healthStats.healthScore}%
          </div>
          <p className="text-[10px] text-slate-500">Score global de santé</p>
        </div>
      </div>

      {/* 4. CHANNELS TABLE & SEARCH / FILTER INTERACTION */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h3 className="text-base font-extrabold text-white flex items-center gap-2">
              <Activity className="w-4 h-4 text-orange-400" />
              Catalogue & Diagnostics Individuels des Chaînes
            </h3>
            <p className="text-xs text-slate-400">
              {filteredChannels.length.toLocaleString('fr-FR')} chaînes affichées selon les critères de filtrage
            </p>
          </div>

          {/* Quick Filters */}
          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={() => { setFilterClassification('ALL'); setCurrentPage(1); }}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                filterClassification === 'ALL' ? 'bg-orange-500 text-white' : 'bg-slate-950 text-slate-400 border border-slate-800'
              }`}
            >
              Tous
            </button>
            <button
              onClick={() => { setFilterClassification('ACTIVE'); setCurrentPage(1); }}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
                filterClassification === 'ACTIVE' ? 'bg-emerald-500 text-slate-950' : 'bg-slate-950 text-slate-400 border border-slate-800'
              }`}
            >
              <span className="w-2 h-2 rounded-full bg-emerald-400" />
              Actifs ({healthStats.active})
            </button>
            <button
              onClick={() => { setFilterClassification('UNSTABLE'); setCurrentPage(1); }}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
                filterClassification === 'UNSTABLE' ? 'bg-amber-500 text-slate-950' : 'bg-slate-950 text-slate-400 border border-slate-800'
              }`}
            >
              <span className="w-2 h-2 rounded-full bg-amber-400" />
              Instables ({healthStats.unstable})
            </button>
            <button
              onClick={() => { setFilterClassification('DEAD'); setCurrentPage(1); }}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
                filterClassification === 'DEAD' ? 'bg-red-500 text-white' : 'bg-slate-950 text-slate-400 border border-slate-800'
              }`}
            >
              <span className="w-2 h-2 rounded-full bg-red-400" />
              Morts ({healthStats.dead})
            </button>
          </div>
        </div>

        {/* Search bar & Category filter */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="relative sm:col-span-2">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => { setSearchQuery(e.target.value); setCurrentPage(1); }}
              placeholder="Rechercher par nom, URL, pays, message d'erreur..."
              className="w-full pl-10 pr-4 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-orange-500"
            />
          </div>

          <div>
            <select
              value={filterCategory}
              onChange={(e) => { setFilterCategory(e.target.value); setCurrentPage(1); }}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-orange-500"
            >
              <option value="ALL">Toutes les catégories ({categoryOptions.length})</option>
              {categoryOptions.map(cat => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Table of channels */}
        <div className="overflow-x-auto border border-slate-800 rounded-2xl">
          <table className="w-full text-left text-xs text-slate-300">
            <thead className="bg-slate-950 text-[11px] uppercase tracking-wider text-slate-400 border-b border-slate-800">
              <tr>
                <th className="py-3 px-4">Chaîne & Format</th>
                <th className="py-3 px-4">Diagnostic & État</th>
                <th className="py-3 px-4">Latence (TTFF)</th>
                <th className="py-3 px-4">Échecs Consécutifs</th>
                <th className="py-3 px-4">Dernière vérification</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 bg-slate-900/50">
              {paginatedChannels.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-slate-500">
                    Aucune chaîne ne correspond à vos filtres.
                  </td>
                </tr>
              ) : (
                paginatedChannels.map(channel => {
                  const cls = channel.healthClassification || 'PENDING';
                  const isTesting = singleTestingId === channel.id;

                  return (
                    <tr key={channel.id} className="hover:bg-slate-800/40 transition-colors">
                      {/* Name and Logo */}
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-3">
                          <img
                            src={channel.logoUrl || `https://ui-avatars.com/api/?name=${encodeURIComponent(channel.name)}&background=0f172a&color=f97316`}
                            alt={channel.name}
                            referrerPolicy="no-referrer"
                            className="w-8 h-8 rounded-lg object-contain bg-slate-950 border border-slate-800 p-0.5 shrink-0"
                            onError={(e) => {
                              (e.currentTarget as HTMLImageElement).src = `https://ui-avatars.com/api/?name=${encodeURIComponent(channel.name)}&background=0f172a&color=f97316`;
                            }}
                          />
                          <div className="min-w-0">
                            <div className="font-bold text-white truncate max-w-xs">{channel.name}</div>
                            <div className="flex items-center gap-2 text-[10px] text-slate-400 mt-0.5">
                              <span className="px-1.5 py-0.2 bg-slate-800 rounded">{channel.category || 'Général'}</span>
                              <span>{channel.country || 'International'}</span>
                              <span className="font-mono text-slate-500 truncate max-w-[120px]">{channel.probeFormat || 'HLS'}</span>
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Classification Badge */}
                      <td className="py-3 px-4">
                        <div className="space-y-1">
                          {cls === 'ACTIVE' && (
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                              Actif & Fluide 🟢
                            </span>
                          )}
                          {cls === 'UNSTABLE' && (
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-amber-500/20 text-amber-400 border border-amber-500/30">
                              <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
                              Instable / Lent 🟠
                            </span>
                          )}
                          {cls === 'DEAD' && (
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-red-500/20 text-red-400 border border-red-500/30">
                              <span className="w-1.5 h-1.5 rounded-full bg-red-400" />
                              Mort Confirmé 🔴
                            </span>
                          )}
                          {cls === 'PENDING' && (
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-slate-800 text-slate-400">
                              <span className="w-1.5 h-1.5 rounded-full bg-slate-500" />
                              En Attente ⚪
                            </span>
                          )}

                          {channel.lastHealthError && (
                            <div className="text-[10px] text-red-300 truncate max-w-xs" title={channel.lastHealthError}>
                              {channel.lastHealthError}
                            </div>
                          )}
                        </div>
                      </td>

                      {/* Latency */}
                      <td className="py-3 px-4 font-mono text-xs">
                        {channel.startupTimeMs ? (
                          <span className={
                            channel.startupTimeMs < 2500 ? 'text-emerald-400' :
                            channel.startupTimeMs < 4500 ? 'text-amber-400' : 'text-orange-400'
                          }>
                            {channel.startupTimeMs} ms
                          </span>
                        ) : (
                          <span className="text-slate-600">--</span>
                        )}
                      </td>

                      {/* Consecutive failures */}
                      <td className="py-3 px-4 font-mono">
                        <span className={`px-2 py-0.5 rounded text-[11px] font-bold ${
                          (channel.consecutiveFailures || 0) === 0 ? 'bg-emerald-500/10 text-emerald-400' :
                          (channel.consecutiveFailures || 0) < (settings.healthCheckConsecutiveFailureThreshold || 3) ? 'bg-amber-500/20 text-amber-400' :
                          'bg-red-500/20 text-red-400'
                        }`}>
                          {channel.consecutiveFailures || 0} / {settings.healthCheckConsecutiveFailureThreshold || 3}
                        </span>
                      </td>

                      {/* Last Tested */}
                      <td className="py-3 px-4 text-slate-400 text-[11px]">
                        {channel.lastTestedAt ? (
                          new Date(channel.lastTestedAt).toLocaleTimeString('fr-FR', {
                            hour: '2-digit',
                            minute: '2-digit',
                            second: '2-digit'
                          })
                        ) : (
                          <span className="text-slate-600">Jamais</span>
                        )}
                      </td>

                      {/* Action buttons */}
                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {/* Test now */}
                          <button
                            onClick={() => handleTestSingle(channel.id)}
                            disabled={isTesting}
                            title="Tester ce flux maintenant"
                            className="p-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white rounded-lg transition-all"
                          >
                            <RefreshCw className={`w-3.5 h-3.5 ${isTesting ? 'animate-spin text-orange-400' : ''}`} />
                          </button>

                          {/* Inspect Modal */}
                          <button
                            onClick={() => setSelectedInspectorChannel(channel)}
                            title="Inspecteur Technique de Flux"
                            className="p-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-cyan-400 rounded-lg transition-all"
                          >
                            <Info className="w-3.5 h-3.5" />
                          </button>

                          {/* Preview Player */}
                          <button
                            onClick={() => setPreviewChannel(channel)}
                            title="Lire dans le Smart Player"
                            className="p-1.5 bg-slate-800 hover:bg-orange-500 text-slate-300 hover:text-white rounded-lg transition-all"
                          >
                            <Play className="w-3.5 h-3.5" />
                          </button>

                          {/* Reactivate if dead */}
                          {cls === 'DEAD' && (
                            <button
                              onClick={() => reactivateDeadStream(channel.id)}
                              title="Réactiver manuellement ce flux"
                              className="p-1.5 bg-emerald-500/20 hover:bg-emerald-500 text-emerald-400 hover:text-slate-950 rounded-lg transition-all"
                            >
                              <RotateCcw className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Bar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs text-slate-400 pt-2 border-t border-slate-800">
          <div>
            Page <span className="text-white font-bold">{safePage}</span> sur <span className="text-white font-bold">{totalPages}</span> ({filteredChannels.length.toLocaleString('fr-FR')} résultats)
          </div>

          <div className="flex items-center gap-1.5">
            <button
              onClick={() => setCurrentPage(1)}
              disabled={safePage <= 1}
              className="p-1.5 bg-slate-950 border border-slate-800 rounded-lg disabled:opacity-30 hover:bg-slate-800 text-white"
            >
              <ChevronsLeft className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
              disabled={safePage <= 1}
              className="p-1.5 bg-slate-950 border border-slate-800 rounded-lg disabled:opacity-30 hover:bg-slate-800 text-white"
            >
              <ChevronLeft className="w-3.5 h-3.5" />
            </button>

            <span className="px-3 py-1 bg-slate-950 border border-slate-800 rounded-lg font-mono font-bold text-white">
              {safePage}
            </span>

            <button
              onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
              disabled={safePage >= totalPages}
              className="p-1.5 bg-slate-950 border border-slate-800 rounded-lg disabled:opacity-30 hover:bg-slate-800 text-white"
            >
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => setCurrentPage(totalPages)}
              disabled={safePage >= totalPages}
              className="p-1.5 bg-slate-950 border border-slate-800 rounded-lg disabled:opacity-30 hover:bg-slate-800 text-white"
            >
              <ChevronsRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* Inspector Modal */}
      {selectedInspectorChannel && (
        <ChannelStreamInspectorModal
          isOpen={true}
          channel={selectedInspectorChannel}
          onClose={() => setSelectedInspectorChannel(null)}
          onUpdateChannel={(updated) => {
            // Updated channel will be reflected through context
            setSelectedInspectorChannel(null);
          }}
        />
      )}

      {/* Preview Player Modal */}
      {previewChannel && (
        <IPTVPlayerModal
          isOpen={true}
          content={previewChannel}
          onClose={() => setPreviewChannel(null)}
          channelsList={contents}
          onSelectChannel={(newCh) => setPreviewChannel(newCh)}
        />
      )}

    </div>
  );
};
