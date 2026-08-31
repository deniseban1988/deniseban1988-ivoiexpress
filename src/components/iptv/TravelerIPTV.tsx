import React, { useState, useMemo, useRef } from 'react';
import {
  IPTVContentItem,
  IPTVWatchHistoryItem,
  IPTVNotification
} from '../../types/iptv';
import { useIPTV } from '../../core/context/IPTVContext';
import { IPTVPlayerModal } from './IPTVPlayerModal';
import defaultHeroImage from '../../assets/images/iptv_hero_cinematic_1786842131987.jpg';
import {
  Tv,
  Radio as RadioIcon,
  Film,
  Sparkles,
  Search,
  Heart,
  Star,
  History,
  Bell,
  Play,
  RotateCcw,
  SlidersHorizontal,
  Flame,
  CheckCircle2,
  Trash2,
  ChevronRight,
  ChevronLeft,
  ChevronDown,
  Zap,
  Globe,
  Clapperboard,
  Bookmark,
  AlertTriangle,
  Radio,
  Tv2,
  TvMinimal
} from 'lucide-react';
import {
  filterIPTVCatalog,
  computeCatalogCategoryStats,
  CANONICAL_CATEGORY_NAMES,
  CategoryStatItem
} from '../../lib/iptv/categoryNormalizer';

interface TravelerIPTVProps {
  contents?: IPTVContentItem[];
  favorites?: string[];
  watchHistory?: IPTVWatchHistoryItem[];
  notifications?: IPTVNotification[];
  onToggleFavorite?: (contentId: string) => void;
  onClearHistory?: () => void;
  onRemoveHistoryItem?: (id: string) => void;
}

export const TravelerIPTV: React.FC<TravelerIPTVProps> = (props) => {
  const context = useIPTV();

  // Use the auto-cleaned active playlist (functional & eligible streams only) or full catalog
  const sourceContents = (context.settings.activePlaylistOnlyForTraveler !== false)
    ? context.activePlaylist
    : context.contents;

  const contents = (sourceContents.length >= (props.contents?.length || 0))
    ? sourceContents
    : (props.contents || sourceContents);

  const favorites = props.favorites || context.favorites;
  const watchHistory = props.watchHistory || context.watchHistory;
  const notifications = props.notifications || context.notifications;
  const onToggleFavorite = props.onToggleFavorite || context.toggleFavorite;
  const onClearHistory = props.onClearHistory || context.clearWatchHistory;
  const onRemoveHistoryItem = props.onRemoveHistoryItem || context.removeWatchHistoryItem;

  // Navigation Sub-Tabs
  const [activeTab, setActiveTab] = useState<'home' | 'live' | 'vod' | 'favorites' | 'history'>('home');

  // Search & Filter state
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedCategory, setSelectedCategory] = useState<string>('Tous');
  const [selectedCountry, setSelectedCountry] = useState<string>('Tous');

  // Pagination for Traveler Grid (36 items per page for ultra smooth rendering)
  const [currentPage, setCurrentPage] = useState<number>(1);
  const pageSize = 36;

  // Selected Content for Player Modal
  const [activePlayerContent, setActivePlayerContent] = useState<IPTVContentItem | null>(null);
  const [activeResumeSeconds, setActiveResumeSeconds] = useState<number>(0);

  // Ref to scroll smoothly to channels catalog
  const catalogSectionRef = useRef<HTMLDivElement>(null);

  const scrollToCatalog = () => {
    if (catalogSectionRef.current) {
      catalogSectionRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  // Dynamic Catalog Category Statistics (Computed across all 13,436+ channels)
  const categoryStats = useMemo<CategoryStatItem[]>(() => {
    return computeCatalogCategoryStats(contents).categoryStats;
  }, [contents]);

  // Dynamic Categories list extracted from channel list
  const categoriesList = useMemo(() => {
    const activeFromStats = categoryStats
      .filter((c) => c.totalCount > 0)
      .map((c) => c.category);
    const set = new Set<string>(['Tous', ...CANONICAL_CATEGORY_NAMES, ...activeFromStats]);
    return Array.from(set);
  }, [categoryStats]);

  // Dynamic Countries list (100% full scan)
  const countriesList = useMemo(() => {
    const defaultCountries = ["Tous", "Côte d'Ivoire", "Afrique", "France", "Sénégal", "International"];
    const extracted = new Set(defaultCountries);
    const safeContents = contents || [];
    for (let i = 0; i < safeContents.length; i++) {
      if (safeContents[i]?.country) extracted.add(safeContents[i].country);
    }
    return Array.from(extracted);
  }, [contents]);

  // Filtered Content with Multi-Criteria Normalization
  const filteredContents = useMemo(() => {
    const safeFavs = favorites || [];
    
    let baseList = contents;
    if (activeTab === 'favorites') {
      baseList = (contents || []).filter((item) => safeFavs.includes(item.id));
    } else if (activeTab === 'live') {
      baseList = (contents || []).filter((item) => ['TV', 'RADIO', 'DIRECT_EVENT'].includes(item.type));
    } else if (activeTab === 'vod') {
      baseList = (contents || []).filter((item) => ['FILM', 'SERIES', 'DOCUMENTAIRE', 'DESSIN_ANIME'].includes(item.type));
    }

    return filterIPTVCatalog(baseList, {
      searchQuery,
      category: selectedCategory === 'Tous' ? 'ALL' : selectedCategory,
      country: selectedCountry === 'Tous' ? 'ALL' : selectedCountry,
      // No extra type filter here as it's already filtered in baseList
    });
  }, [contents, activeTab, searchQuery, selectedCategory, selectedCountry, favorites]);

  // Pagination Math
  const totalPages = Math.max(1, Math.ceil((filteredContents || []).length / pageSize));
  const safeCurrentPage = Math.min(Math.max(1, currentPage), totalPages);

  const paginatedContents = useMemo(() => {
    const startIdx = (safeCurrentPage - 1) * pageSize;
    return (filteredContents || []).slice(startIdx, startIdx + pageSize);
  }, [filteredContents, safeCurrentPage, pageSize]);

  // Featured Spotlight Items
  const featuredItems = useMemo(() => (contents || []).filter((c) => c && c.isFeatured && c.status === 'Actif'), [contents]);
  const heroSpotlight = featuredItems[0] || (contents || [])[0];

  // Dynamic Hero Settings from SuperAdmin / Context
  const heroBanner = context.settings?.heroBannerUrl || defaultHeroImage;
  const heroBadge = context.settings?.heroBadgeText || '🎬 FILMS • SÉRIES • TV • DIVERTISSEMENT';
  const heroTitle = context.settings?.heroTitle || 'IPTV';
  const heroSubtitle = context.settings?.heroSubtitle || 'Votre univers de divertissement';
  const heroCta = context.settings?.heroCtaText || 'Explorer les chaînes';

  const handleOpenPlayer = (item: IPTVContentItem) => {
    const historyRecord = watchHistory.find((h) => h.contentId === item.id);
    setActiveResumeSeconds(historyRecord ? historyRecord.progressSeconds : 0);
    setActivePlayerContent(item);
  };

  const handleTabSwitch = (tab: typeof activeTab) => {
    setActiveTab(tab);
    setCurrentPage(1);
  };

  return (
    <div className="space-y-6 p-4 sm:p-6 max-w-7xl mx-auto text-slate-100">
      
      {/* CINEMATIC HERO / WELCOME BANNER */}
      <div className="relative rounded-3xl overflow-hidden bg-slate-950 border border-slate-800/80 shadow-2xl min-h-[360px] sm:min-h-[380px] lg:min-h-[420px] flex flex-col justify-end p-6 sm:p-10">
        
        {/* Background Visual Container: Ambient Backdrop + Full Uncropped Proportional Artwork */}
        <div className="absolute inset-0 z-0 overflow-hidden bg-slate-950">
          
          {/* Ambient Blurred Backdrop matching image colors for natural seamless edges */}
          <img
            src={heroBanner}
            alt=""
            aria-hidden="true"
            className="w-full h-full object-cover filter blur-3xl opacity-30 brightness-75 scale-105 pointer-events-none"
          />

          {/* Full Proportional Natural Artwork: 100% visible, no crop, no stretch, unzoomed */}
          <div className="absolute inset-0 flex items-center justify-end sm:justify-end pointer-events-none">
            <img
              src={heroBanner}
              alt="IPTV Univers Cinématographique"
              referrerPolicy="no-referrer"
              className="w-full h-full object-contain object-center sm:object-right brightness-100 contrast-105 transition-all duration-300"
              onError={(e) => {
                (e.target as HTMLImageElement).src = defaultHeroImage;
              }}
            />
          </div>

          {/* Soft progressive directional gradient for text readability without obscuring characters */}
          <div className="absolute inset-0 bg-gradient-to-r from-slate-950/90 via-slate-950/60 to-transparent/10 sm:w-2/3 lg:w-1/2 pointer-events-none" />
          <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-transparent to-transparent sm:hidden pointer-events-none" />
          {/* Subtle warm atmospheric glow */}
          <div className="absolute -bottom-16 -left-16 w-80 h-80 bg-orange-600/15 rounded-full blur-3xl pointer-events-none" />
        </div>

        <div className="relative z-10 max-w-2xl space-y-3 sm:space-y-4">
          {/* Cinematic Category Badge */}
          <div className="inline-flex items-center space-x-2 px-3.5 py-1.5 rounded-full bg-slate-950/80 backdrop-blur-md text-orange-400 border border-orange-500/40 text-xs font-black tracking-wider shadow-lg shadow-orange-500/10">
            <Sparkles className="w-3.5 h-3.5 text-amber-400" />
            <span>{heroBadge}</span>
          </div>

          {/* Main Title & Subtitle */}
          <div className="space-y-1">
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black text-white tracking-tight leading-none drop-shadow-md">
              {heroTitle}
            </h1>
            <p className="text-lg sm:text-2xl font-black text-transparent bg-clip-text bg-gradient-to-r from-orange-400 via-amber-300 to-yellow-200 drop-shadow">
              {heroSubtitle}
            </p>
          </div>

          {/* Description */}
          <p className="text-slate-300 text-xs sm:text-sm max-w-xl leading-relaxed drop-shadow">
            Vivez une expérience TV & Vidéos haute définition : chaînes nationales ivoiriennes, films, séries cultes, grands événements sportifs et radios FM avec lecture fluide et instantanée.
          </p>

          {/* Action Buttons */}
          <div className="flex flex-wrap items-center gap-3 pt-2">
            <button
              onClick={scrollToCatalog}
              className="px-6 py-3 rounded-2xl bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-400 hover:to-amber-400 text-slate-950 font-black text-xs sm:text-sm flex items-center space-x-2 shadow-xl shadow-orange-500/25 active:scale-95 transition-all"
            >
              <Clapperboard className="w-4 h-4 fill-current" />
              <span>{heroCta}</span>
            </button>

            {heroSpotlight && (
              <button
                onClick={() => handleOpenPlayer(heroSpotlight)}
                className="px-5 py-3 rounded-2xl bg-slate-900/90 hover:bg-slate-800 text-white font-extrabold text-xs sm:text-sm border border-slate-700 flex items-center space-x-2 backdrop-blur transition-all active:scale-95 shadow-lg"
                title={`Regarder ${heroSpotlight.name}`}
              >
                <Play className="w-3.5 h-3.5 text-orange-400 fill-orange-400" />
                <span className="truncate max-w-[180px]">Direct {heroSpotlight.name}</span>
              </button>
            )}

            <div className="flex items-center space-x-2 px-3.5 py-3 rounded-2xl bg-slate-950/75 border border-slate-800 text-xs font-bold text-slate-300 backdrop-blur">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span>{(contents?.length || 0).toLocaleString('fr-FR')} Chaînes & Programmes</span>
            </div>
          </div>
        </div>
      </div>

      {/* SYSTEM NOTIFICATIONS BANNER IF UNREAD */}
      {notifications.length > 0 && (
        <div className="bg-slate-900/90 border border-amber-500/30 rounded-2xl p-4 shadow-xl flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/20 text-amber-400 border border-amber-500/30 flex items-center justify-center flex-shrink-0">
              <Bell className="w-5 h-5 animate-bounce" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="text-xs font-black text-amber-400 uppercase tracking-wider">Annonce IPTV</span>
                <span className="text-[10px] text-slate-400">{notifications[0].timestamp}</span>
              </div>
              <h4 className="text-sm font-bold text-white">{notifications[0].title}</h4>
              <p className="text-xs text-slate-300">{notifications[0].message}</p>
            </div>
          </div>
        </div>
      )}

      {/* TOP NAVIGATION SUB-TABS */}
      <div ref={catalogSectionRef} className="flex flex-wrap items-center justify-between gap-3 bg-slate-900 p-2 rounded-2xl border border-slate-800 shadow-xl scroll-mt-6">
        <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
          
          <button
            onClick={() => handleTabSwitch('home')}
            className={`flex items-center space-x-2 px-4 py-2 rounded-xl text-xs font-extrabold transition-all ${
              activeTab === 'home'
                ? 'bg-orange-500 text-slate-950 shadow-lg shadow-orange-500/20'
                : 'text-slate-300 hover:text-white hover:bg-slate-800'
            }`}
          >
            <Flame className="w-4 h-4" />
            <span>Tous ({(contents?.length || 0).toLocaleString('fr-FR')})</span>
          </button>

          <button
            onClick={() => handleTabSwitch('live')}
            className={`flex items-center space-x-2 px-4 py-2 rounded-xl text-xs font-extrabold transition-all ${
              activeTab === 'live'
                ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/20'
                : 'text-slate-300 hover:text-white hover:bg-slate-800'
            }`}
          >
            <Tv className="w-4 h-4" />
            <span>📺 CHAÎNES LIVE ({(contents || []).filter((c) => ['TV', 'RADIO', 'DIRECT_EVENT'].includes(c.type)).length.toLocaleString('fr-FR')})</span>
          </button>

          <button
            onClick={() => handleTabSwitch('vod')}
            className={`flex items-center space-x-2 px-4 py-2 rounded-xl text-xs font-extrabold transition-all ${
              activeTab === 'vod'
                ? 'bg-emerald-500 text-slate-950 shadow-lg shadow-emerald-500/20'
                : 'text-slate-300 hover:text-white hover:bg-slate-800'
            }`}
          >
            <Clapperboard className="w-4 h-4" />
            <span>🎬 VOD & FILMS ({(contents || []).filter((c) => ['FILM', 'SERIES', 'DOCUMENTAIRE', 'DESSIN_ANIME'].includes(c.type)).length.toLocaleString('fr-FR')})</span>
          </button>

          <button
            onClick={() => handleTabSwitch('favorites')}
            className={`flex items-center space-x-2 px-4 py-2 rounded-xl text-xs font-extrabold transition-all ${
              activeTab === 'favorites'
                ? 'bg-red-600 text-white shadow-lg shadow-red-500/20'
                : 'text-slate-300 hover:text-white hover:bg-slate-800'
            }`}
          >
            <Heart className="w-4 h-4" />
            <span>Favoris ({favorites.length})</span>
          </button>

          <button
            onClick={() => handleTabSwitch('history')}
            className={`flex items-center space-x-2 px-4 py-2 rounded-xl text-xs font-extrabold transition-all ${
              activeTab === 'history'
                ? 'bg-purple-600 text-white shadow-lg shadow-purple-500/20'
                : 'text-slate-300 hover:text-white hover:bg-slate-800'
            }`}
          >
            <History className="w-4 h-4" />
            <span>Historique ({watchHistory.length})</span>
          </button>

        </div>
      </div>

      {/* SEARCH AND FILTERS BAR */}
      {activeTab !== 'history' && (
        <div className="grid grid-cols-1 md:grid-cols-12 gap-3 bg-slate-900/80 p-4 rounded-2xl border border-slate-800 shadow-lg backdrop-blur">
          
          {/* Search Input */}
          <div className="md:col-span-6 relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setCurrentPage(1);
              }}
              placeholder="Rechercher une chaîne, un programme, un pays..."
              className="w-full pl-10 pr-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-orange-500 transition-all"
            />
            {searchQuery && (
              <button
                onClick={() => {
                  setSearchQuery('');
                  setCurrentPage(1);
                }}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white text-xs font-bold"
              >
                ✕
              </button>
            )}
          </div>

          {/* Category Dropdown */}
          <div className="md:col-span-3">
            <select
              value={selectedCategory}
              onChange={(e) => {
                setSelectedCategory(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full px-3 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-200 focus:outline-none focus:border-orange-500 transition-all"
            >
              {categoriesList.map((cat) => (
                <option key={cat} value={cat}>
                  Catégorie : {cat}
                </option>
              ))}
            </select>
          </div>

          {/* Country Dropdown */}
          <div className="md:col-span-3">
            <select
              value={selectedCountry}
              onChange={(e) => {
                setSelectedCountry(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full px-3 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-200 focus:outline-none focus:border-orange-500 transition-all"
            >
              {countriesList.map((cnt) => (
                <option key={cnt} value={cnt}>
                  Pays : {cnt}
                </option>
              ))}
            </select>
          </div>

          {/* Quick Category Chips for Travelers */}
          <div className="md:col-span-12 flex items-center gap-1.5 overflow-x-auto pt-1 pb-0.5 scrollbar-thin scrollbar-thumb-slate-800">
            <button
              onClick={() => {
                setSelectedCategory('Tous');
                setCurrentPage(1);
              }}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all flex items-center gap-1.5 ${
                selectedCategory === 'Tous'
                  ? 'bg-orange-500 text-slate-950 shadow-md shadow-orange-500/20'
                  : 'bg-slate-950 text-slate-400 hover:text-slate-200 hover:bg-slate-800 border border-slate-800'
              }`}
            >
              <span>🌐 Toutes</span>
              <span className={`px-1.5 py-0.2 rounded-md text-[10px] ${
                selectedCategory === 'Tous' ? 'bg-slate-950/30 text-slate-950' : 'bg-slate-800 text-slate-400'
              }`}>
                {(contents?.length || 0).toLocaleString('fr-FR')}
              </span>
            </button>

            {categoryStats.filter(c => c.totalCount > 0).map((stat) => (
              <button
                key={stat.category}
                onClick={() => {
                  setSelectedCategory(stat.category);
                  setCurrentPage(1);
                }}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all flex items-center gap-1.5 ${
                  selectedCategory === stat.category
                    ? 'bg-orange-500 text-slate-950 shadow-md shadow-orange-500/20'
                    : 'bg-slate-950 text-slate-400 hover:text-slate-200 hover:bg-slate-800 border border-slate-800'
                }`}
              >
                <span>{stat.icon} {stat.category}</span>
                <span className={`px-1.5 py-0.2 rounded-md text-[10px] font-mono ${
                  selectedCategory === stat.category ? 'bg-slate-950/30 text-slate-950' : 'bg-slate-800 text-orange-400/90'
                }`}>
                  {stat.totalCount.toLocaleString('fr-FR')}
                </span>
              </button>
            ))}
          </div>

        </div>
      )}

      {/* WATCH HISTORY TAB CONTENT */}
      {activeTab === 'history' && (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4">
          <div className="flex items-center justify-between border-b border-slate-800 pb-4">
            <div className="flex items-center space-x-2">
              <History className="w-5 h-5 text-purple-400" />
              <h3 className="text-base font-extrabold text-white">Historique de Visionnage</h3>
            </div>
            {watchHistory.length > 0 && (
              <button
                onClick={onClearHistory}
                className="px-3 py-1.5 rounded-xl bg-red-600/20 text-red-400 hover:bg-red-600 hover:text-white border border-red-500/30 text-xs font-bold transition-all flex items-center space-x-1.5"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Effacer tout</span>
              </button>
            )}
          </div>

          {watchHistory.length === 0 ? (
            <div className="py-12 text-center text-slate-400 space-y-2">
              <Tv className="w-12 h-12 mx-auto text-slate-600 mb-2" />
              <p className="text-sm font-bold text-slate-300">Aucun historique récent</p>
              <p className="text-xs text-slate-500">
                Les chaînes et contenus que vous regardez s'afficheront ici.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {watchHistory.map((item) => (
                <div
                  key={item.id}
                  className="p-3 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-between group hover:border-slate-700 transition-all"
                >
                  <div className="flex items-center space-x-3">
                    <img
                      src={item.logoUrl || `https://ui-avatars.com/api/?name=${encodeURIComponent(item.contentTitle || 'TV')}&background=f97316&color=ffffff`}
                      alt={item.contentTitle}
                      className="w-10 h-10 rounded-lg object-cover border border-slate-800"
                      onError={(e) => {
                        (e.target as HTMLImageElement).src = `https://ui-avatars.com/api/?name=${encodeURIComponent(item.contentTitle || 'TV')}&background=f97316&color=ffffff`;
                      }}
                    />
                    <div>
                      <h4 className="text-xs font-bold text-white group-hover:text-orange-400 transition-colors truncate max-w-[150px]">
                        {item.contentTitle}
                      </h4>
                      <p className="text-[10px] text-slate-400">Regardé : {item.watchedAt}</p>
                    </div>
                  </div>

                  <button
                    onClick={() => onRemoveHistoryItem && onRemoveHistoryItem(item.id)}
                    className="p-1.5 text-slate-500 hover:text-red-400 transition-colors"
                    title="Supprimer"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* CHANNELS GRID VIEW WITH PAGINATION */}
      {activeTab !== 'history' && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
            <h3 className="text-sm font-black text-slate-300 uppercase tracking-wider flex items-center space-x-2">
              <Tv className="w-4 h-4 text-orange-500" />
              <span>Chaînes Disponibles ({(filteredContents?.length || 0).toLocaleString('fr-FR')})</span>
            </h3>

            {/* Pagination Info & Controls */}
            {filteredContents.length > pageSize && (
              <div className="flex items-center gap-2 text-xs font-mono text-slate-400">
                <span>Page {safeCurrentPage} / {totalPages}</span>
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                    disabled={safeCurrentPage <= 1}
                    className="p-1.5 rounded-lg bg-slate-900 border border-slate-800 text-slate-300 disabled:opacity-30 disabled:cursor-not-allowed hover:bg-slate-800"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                    disabled={safeCurrentPage >= totalPages}
                    className="p-1.5 rounded-lg bg-slate-900 border border-slate-800 text-slate-300 disabled:opacity-30 disabled:cursor-not-allowed hover:bg-slate-800"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}
          </div>

          {filteredContents.length === 0 ? (
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-12 text-center text-slate-400 space-y-2">
              <Search className="w-10 h-10 mx-auto text-slate-600 mb-2" />
              <p className="text-sm font-bold text-slate-200">Aucune chaîne ne correspond à vos filtres</p>
              <p className="text-xs text-slate-500">Essayez de réinitialiser le mot-clé ou la catégorie.</p>
              <button
                onClick={() => {
                  setSearchQuery('');
                  setSelectedCategory('Tous');
                  setSelectedCountry('Tous');
                  setCurrentPage(1);
                }}
                className="mt-2 px-4 py-2 rounded-xl bg-orange-500 text-slate-950 font-bold text-xs shadow-lg"
              >
                Réinitialiser les filtres
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-2.5 sm:gap-3.5">
              {paginatedContents.map((item) => {
                const isFav = favorites.includes(item.id);
                const isOnline = item.status === 'Actif';
                const isWarning = item.status === 'Instable' || item.qualityScore === 'DEGRADED';
                
                return (
                  <div
                    key={item.id}
                    onClick={() => handleOpenPlayer(item)}
                    className="group relative bg-slate-900/90 hover:bg-slate-900 border border-slate-800/80 hover:border-orange-500/50 rounded-2xl p-2.5 sm:p-3 flex flex-col justify-between transition-all duration-200 shadow-md hover:shadow-xl hover:shadow-orange-500/10 cursor-pointer overflow-hidden hover:-translate-y-0.5 select-none"
                  >
                    <div>
                      {/* Logo Container with reserved area & neutral backdrop */}
                      <div className="relative aspect-[16/10] rounded-xl bg-slate-950/80 border border-slate-800/60 group-hover:border-slate-700/80 overflow-hidden flex items-center justify-center p-2 transition-colors">
                        
                        {/* Discreet Status Indicator Badge */}
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
                            {isOnline ? 'Direct' : isWarning ? 'Instable' : 'Inactif'}
                          </span>
                        </div>

                        {/* Favorite ⭐ Button */}
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            onToggleFavorite(item.id);
                          }}
                          className={`absolute top-1.5 right-1.5 p-1.5 rounded-lg backdrop-blur-md border transition-all z-10 ${
                            isFav
                              ? 'bg-amber-500/20 text-amber-400 border-amber-500/40 hover:bg-amber-500/30 shadow-md shadow-amber-500/20'
                              : 'bg-slate-950/60 text-slate-400 border-slate-800 hover:text-white hover:bg-slate-800'
                          }`}
                          title={isFav ? 'Retirer des favoris' : 'Ajouter aux favoris'}
                        >
                          <Star className={`w-3 h-3 ${isFav ? 'fill-amber-400 text-amber-400' : 'text-slate-300'}`} />
                        </button>

                        {/* Channel Logo with object-contain & fallback */}
                        <img
                          src={item.logoUrl || `https://ui-avatars.com/api/?name=${encodeURIComponent(item.name || 'TV')}&background=0f172a&color=f97316&bold=true&size=128`}
                          alt={item.name}
                          loading="lazy"
                          className="w-full h-full object-contain filter drop-shadow group-hover:scale-105 transition-transform duration-300 pointer-events-none"
                          onError={(e) => {
                            (e.target as HTMLImageElement).src = `https://ui-avatars.com/api/?name=${encodeURIComponent(item.name || 'TV')}&background=0f172a&color=f97316&bold=true&size=128`;
                          }}
                        />

                        {/* Hover Play Icon Overlay */}
                        <div className="absolute inset-0 bg-gradient-to-t from-slate-950/90 via-slate-950/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex items-center justify-center pointer-events-none">
                          <div className="w-9 h-9 rounded-full bg-orange-500 text-slate-950 flex items-center justify-center shadow-lg shadow-orange-500/30 transform group-hover:scale-110 transition-transform">
                            <Play className="w-3.5 h-3.5 fill-current ml-0.5" />
                          </div>
                        </div>

                        {/* Quality Badge */}
                        {item.quality && (
                          <div className="absolute bottom-1 right-1 px-1 py-0.2 rounded bg-slate-950/90 border border-slate-800 text-[8px] font-mono font-bold text-orange-400/90">
                            {item.quality}
                          </div>
                        )}
                      </div>

                      {/* Channel Info */}
                      <div className="mt-2 space-y-0.5">
                        <h4 className="text-xs sm:text-sm font-bold text-slate-100 group-hover:text-orange-400 transition-colors truncate" title={item.name}>
                          {item.name}
                        </h4>

                        <div className="flex items-center gap-1 text-[10px] sm:text-[11px] text-slate-400 truncate">
                          <span className="text-slate-300 font-medium truncate">
                            {item.category || 'Général'}
                          </span>
                          {item.country && (
                            <>
                              <span className="text-slate-600">•</span>
                              <span className="text-slate-400 truncate">{item.country}</span>
                            </>
                          )}
                        </div>

                        {/* EPG Program if available */}
                        {item.currentProgram && (
                          <p className="text-[10px] text-orange-300/90 font-medium truncate pt-1 flex items-center gap-1 border-t border-slate-800/40">
                            <span className="w-1.5 h-1.5 rounded-full bg-orange-500 flex-shrink-0 animate-pulse" />
                            <span className="truncate">{item.currentProgram}</span>
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Bottom Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-2 pt-4">
              <button
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                disabled={safeCurrentPage <= 1}
                className="px-4 py-2 rounded-xl bg-slate-900 border border-slate-800 text-xs font-bold text-slate-300 disabled:opacity-30 disabled:cursor-not-allowed hover:bg-slate-800 flex items-center gap-1"
              >
                <ChevronLeft className="w-4 h-4" />
                <span>Page précédente</span>
              </button>

              <span className="px-4 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs font-mono font-bold text-orange-400">
                {safeCurrentPage} / {totalPages}
              </span>

              <button
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                disabled={safeCurrentPage >= totalPages}
                className="px-4 py-2 rounded-xl bg-slate-900 border border-slate-800 text-xs font-bold text-slate-300 disabled:opacity-30 disabled:cursor-not-allowed hover:bg-slate-800 flex items-center gap-1"
              >
                <span>Page suivante</span>
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>
      )}

      {/* VIDEO PLAYER MODAL */}
      {activePlayerContent && (
        <IPTVPlayerModal
          content={activePlayerContent}
          allContents={contents}
          isFavorite={favorites.includes(activePlayerContent.id)}
          onToggleFavorite={onToggleFavorite}
          onSelectContent={(newContent) => setActivePlayerContent(newContent)}
          onClose={() => setActivePlayerContent(null)}
          savedProgressSeconds={activeResumeSeconds}
        />
      )}

    </div>
  );
};
