import React, { useState } from 'react';
import { useBanners, TargetModule } from '../../core/context/BannersContext';
import { Megaphone, ExternalLink, ChevronLeft, ChevronRight, Sparkles } from 'lucide-react';

interface SynchronizedBannersBarProps {
  targetModuleFilter?: TargetModule | 'ALL';
  className?: string;
  compactMode?: boolean;
}

const getFriendlyModuleLabel = (moduleStr: string) => {
  switch (moduleStr) {
    case 'ACCUEIL': return 'À la une';
    case 'TRANSPORT': return 'Transport';
    case 'HOTELLERIE': return 'Hôtellerie';
    case 'IPTV': return 'Streaming & Médias';
    case 'VISION': return 'Sécurité';
    case 'AICORE': return 'Assistant Ivoirexpress';
    case 'PROMOTIONS': return 'Bons Plans';
    default: return 'Actualités';
  }
};

export const SynchronizedBannersBar: React.FC<SynchronizedBannersBarProps> = ({
  targetModuleFilter = 'ALL',
  className = '',
  compactMode = false
}) => {
  const { activeBanners, isLoading } = useBanners();
  const [currentIndex, setCurrentIndex] = useState(0);

  const filteredBanners = targetModuleFilter === 'ALL'
    ? activeBanners
    : activeBanners.filter(b => b.targetModule === targetModuleFilter || b.targetModule === 'ACCUEIL' || b.targetModule === 'SYSTEME');

  if (isLoading) {
    return (
      <div className={`bg-slate-900 border border-slate-800 rounded-2xl p-4 text-center text-xs text-slate-400 animate-pulse ${className}`}>
        Chargement des actualités et offres...
      </div>
    );
  }

  if (filteredBanners.length === 0) {
    return null;
  }

  const currentBanner = filteredBanners[currentIndex % filteredBanners.length];

  const handleNext = () => {
    setCurrentIndex((prev) => (prev + 1) % filteredBanners.length);
  };

  const handlePrev = () => {
    setCurrentIndex((prev) => (prev - 1 + filteredBanners.length) % filteredBanners.length);
  };

  if (compactMode) {
    return (
      <div className={`bg-gradient-to-r from-slate-900 via-slate-900 to-slate-950 border border-emerald-500/30 rounded-xl p-3 shadow-md flex items-center justify-between gap-3 text-xs text-white ${className}`}>
        <div className="flex items-center space-x-2.5 min-w-0">
          <div className="w-8 h-8 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0 border border-emerald-500/30">
            <Megaphone className="w-4 h-4" />
          </div>
          <div className="min-w-0 truncate">
            <div className="flex items-center space-x-2">
              <span className="font-bold text-white truncate">{currentBanner.title}</span>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 font-sans font-semibold shrink-0">
                {getFriendlyModuleLabel(currentBanner.targetModule)}
              </span>
            </div>
            <p className="text-[11px] text-slate-400 truncate">{currentBanner.subtitle}</p>
          </div>
        </div>

        <div className="flex items-center space-x-2 shrink-0">
          {filteredBanners.length > 1 && (
            <div className="flex items-center space-x-1">
              <button
                onClick={handlePrev}
                className="p-1 rounded-md bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white"
              >
                <ChevronLeft className="w-3.5 h-3.5" />
              </button>
              <span className="text-[10px] text-slate-400 font-mono">
                {currentIndex + 1}/{filteredBanners.length}
              </span>
              <button
                onClick={handleNext}
                className="p-1 rounded-md bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white"
              >
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>
          )}
          {currentBanner.ctaText && (
            <a
              href={currentBanner.ctaUrl}
              className="px-3 py-1.5 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-[11px] flex items-center space-x-1 shadow transition shrink-0"
            >
              <span>{currentBanner.ctaText}</span>
              <ExternalLink className="w-3 h-3" />
            </a>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className={`relative overflow-hidden rounded-2xl bg-gradient-to-r from-slate-900 via-slate-950 to-slate-900 border border-slate-800 p-3 sm:p-4 shadow-xl ${className}`}>
      {/* Ivory Coast Accent Bar */}
      <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-orange-500 via-amber-400 to-emerald-500" />

      <div className="flex flex-col md:flex-row items-center justify-between gap-3 sm:gap-4 relative z-10">
        
        {/* Banner Thumbnail & Text */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 sm:gap-4 min-w-0 w-full md:w-auto flex-1">
          {currentBanner.imageUrl && (
            <div className="relative w-full sm:w-48 md:w-60 h-40 sm:h-32 md:h-36 rounded-xl overflow-hidden shrink-0 border border-slate-700 shadow-lg group">
              <img
                src={currentBanner.imageUrl || 'https://images.unsplash.com/photo-1544620347-c4fd4a3d5957?auto=format&fit=crop&w=1200&q=80'}
                alt={currentBanner.title}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                onError={(e) => {
                  (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1544620347-c4fd4a3d5957?auto=format&fit=crop&w=1200&q=80';
                }}
              />
              <div className="absolute top-2 left-2 bg-slate-950/85 backdrop-blur-md px-2 py-0.5 rounded-md text-[10px] font-extrabold text-emerald-400 border border-emerald-500/30 shadow">
                {getFriendlyModuleLabel(currentBanner.targetModule)}
              </div>
            </div>
          )}

          <div className="space-y-1 min-w-0 flex-1">
            {/* Badges: badgeText & agencyName only (Annonce Nationale removed) */}
            {(currentBanner.badgeText || currentBanner.agencyName) && (
              <div className="flex items-center space-x-2 flex-wrap gap-y-1">
                {currentBanner.badgeText && (
                  <span className="text-[10px] font-bold tracking-wider uppercase px-2 py-0.5 rounded-full bg-orange-500/20 text-orange-400 border border-orange-500/30">
                    {currentBanner.badgeText}
                  </span>
                )}

                {currentBanner.agencyName && (
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-500/20 text-blue-300 border border-blue-500/30">
                    {currentBanner.agencyName}
                  </span>
                )}
              </div>
            )}

            <h3 className="text-sm sm:text-base font-extrabold text-white leading-snug line-clamp-1 sm:line-clamp-2">
              {currentBanner.title}
            </h3>

            {(currentBanner.subtitle || currentBanner.description) && (
              <p className="text-xs text-slate-300 line-clamp-1 sm:line-clamp-2">
                {currentBanner.subtitle || currentBanner.description}
              </p>
            )}
          </div>
        </div>

        {/* Action Button & Carousel Controls */}
        <div className="flex items-center justify-between md:justify-end space-x-3 w-full md:w-auto shrink-0 pt-2 md:pt-0 border-t md:border-t-0 border-slate-800">
          {filteredBanners.length > 1 && (
            <div className="flex items-center space-x-1.5 bg-slate-950/80 px-2.5 py-1.5 rounded-xl border border-slate-800 text-xs">
              <button
                onClick={handlePrev}
                className="p-1 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white transition"
                title="Bannière précédente"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <span className="font-mono text-[11px] text-slate-300 font-bold px-1">
                {currentIndex + 1} / {filteredBanners.length}
              </span>
              <button
                onClick={handleNext}
                className="p-1 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white transition"
                title="Bannière suivante"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          )}

          {currentBanner.ctaText && (
            <a
              href={currentBanner.ctaUrl}
              className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-orange-500 via-amber-500 to-emerald-500 text-slate-950 font-black text-xs flex items-center space-x-2 shadow-lg shadow-orange-500/20 hover:brightness-110 active:scale-95 transition"
            >
              <span>{currentBanner.ctaText}</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
          )}
        </div>

      </div>
    </div>
  );
};
