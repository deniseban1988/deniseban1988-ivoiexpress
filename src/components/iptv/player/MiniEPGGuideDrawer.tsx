import React, { useState, useMemo } from 'react';
import { IPTVContentItem } from '../../../types/iptv';
import { EPGHelper } from './EPGHelper';
import {
  Tv,
  Radio,
  Search,
  X,
  Clock,
  ChevronRight,
  Sparkles,
  Calendar,
  Layers,
  Heart,
  Play,
  CheckCircle2
} from 'lucide-react';

interface MiniEPGGuideDrawerProps {
  currentContent: IPTVContentItem;
  allContents: IPTVContentItem[];
  isFavorite: boolean;
  onToggleFavorite: (id: string) => void;
  onSelectContent: (content: IPTVContentItem) => void;
  onClose: () => void;
}

export const MiniEPGGuideDrawer: React.FC<MiniEPGGuideDrawerProps> = ({
  currentContent,
  allContents,
  isFavorite,
  onToggleFavorite,
  onSelectContent,
  onClose
}) => {
  const [activeTab, setActiveTab] = useState<'SCHEDULE' | 'CHANNELS'>('SCHEDULE');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('ALL');

  // Generate dynamic 24-hour EPG schedule for the current channel
  const currentSchedule = useMemo(() => {
    return EPGHelper.getChannelSchedule(currentContent);
  }, [currentContent]);

  // Categories extraction
  const categories = useMemo(() => {
    const set = new Set<string>();
    (allContents || []).slice(0, 3000).forEach(c => {
      if (c && c.category) set.add(c.category);
    });
    return ['ALL', ...Array.from(set).sort()];
  }, [allContents]);

  // Filtered neighbor channels for fast zapping
  const filteredChannels = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    const safeContents = allContents || [];

    return safeContents.filter(c => {
      if (!c) return false;
      if (selectedCategory !== 'ALL' && c.category !== selectedCategory) return false;
      if (q && !c.name.toLowerCase().includes(q) && !c.category.toLowerCase().includes(q) && !c.country.toLowerCase().includes(q)) {
        return false;
      }
      return true;
    }).slice(0, 80); // Capped at 80 for instant buttery smooth rendering
  }, [allContents, searchQuery, selectedCategory]);

  return (
    <div className="absolute right-0 top-0 bottom-0 z-40 w-full sm:w-96 bg-slate-950/95 border-l border-slate-800 shadow-2xl backdrop-blur-xl flex flex-col animate-slideLeft">
      
      {/* Drawer Header */}
      <div className="p-4 bg-slate-900/90 border-b border-slate-800 flex items-center justify-between">
        <div className="flex items-center space-x-2.5">
          <div className="w-8 h-8 rounded-lg bg-orange-500/20 text-orange-400 border border-orange-500/30 flex items-center justify-center">
            <Tv className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm font-extrabold text-white">Guide TV & Zapping Express</h3>
            <p className="text-[11px] text-slate-400">Navigation en direct dans le lecteur</p>
          </div>
        </div>

        <button
          onClick={onClose}
          className="p-1.5 rounded-lg bg-slate-800 text-slate-400 hover:text-white hover:bg-slate-700 transition"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Tabs */}
      <div className="flex bg-slate-900 border-b border-slate-800 p-1">
        <button
          onClick={() => setActiveTab('SCHEDULE')}
          className={`flex-1 py-2 rounded-lg text-xs font-bold flex items-center justify-center space-x-1.5 transition-all ${
            activeTab === 'SCHEDULE'
              ? 'bg-orange-500 text-slate-950 shadow-md font-black'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          <Calendar className="w-3.5 h-3.5" />
          <span>Grille de {currentContent.name.slice(0, 14)}</span>
        </button>

        <button
          onClick={() => setActiveTab('CHANNELS')}
          className={`flex-1 py-2 rounded-lg text-xs font-bold flex items-center justify-center space-x-1.5 transition-all ${
            activeTab === 'CHANNELS'
              ? 'bg-orange-500 text-slate-950 shadow-md font-black'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          <Layers className="w-3.5 h-3.5" />
          <span>Zapping ({allContents.length})</span>
        </button>
      </div>

      {/* Body */}
      <div className="flex-1 overflow-y-auto p-3 space-y-2.5">
        {activeTab === 'SCHEDULE' ? (
          <div className="space-y-2">
            
            {/* Channel Info Card */}
            <div className="p-3 rounded-xl bg-slate-900/90 border border-slate-800 flex items-center justify-between mb-3">
              <div className="flex items-center space-x-3">
                <img
                  src={currentContent.logoUrl || `https://ui-avatars.com/api/?name=${encodeURIComponent(currentContent.name)}&background=f97316&color=ffffff`}
                  alt={currentContent.name}
                  className="w-10 h-10 rounded-lg object-cover border border-slate-700"
                  onError={(e) => {
                    (e.target as HTMLImageElement).src = `https://ui-avatars.com/api/?name=${encodeURIComponent(currentContent.name)}&background=f97316&color=ffffff`;
                  }}
                />
                <div>
                  <h4 className="text-xs font-bold text-white">{currentContent.name}</h4>
                  <p className="text-[10px] text-slate-400">{currentContent.category} • {currentContent.country}</p>
                </div>
              </div>

              <button
                onClick={() => onToggleFavorite(currentContent.id)}
                className={`p-2 rounded-lg border transition ${
                  isFavorite 
                    ? 'bg-red-500 text-white border-red-400' 
                    : 'bg-slate-800 text-slate-400 border-slate-700 hover:text-white'
                }`}
              >
                <Heart className={`w-3.5 h-3.5 ${isFavorite ? 'fill-current' : ''}`} />
              </button>
            </div>

            {/* 24-hour Schedule Items */}
            <div className="space-y-2">
              {currentSchedule.map((item) => (
                <div
                  key={item.id}
                  className={`p-3 rounded-xl border transition-all ${
                    item.isLive
                      ? 'bg-gradient-to-r from-orange-500/20 via-slate-900 to-slate-900 border-orange-500/50 shadow-lg'
                      : 'bg-slate-900/60 border-slate-800 hover:border-slate-700'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <div className="flex items-center space-x-2">
                      <span className="text-[11px] font-mono font-bold text-slate-300">
                        {item.startTime} - {item.endTime}
                      </span>
                      {item.isLive && (
                        <span className="px-2 py-0.5 rounded-full bg-red-600 text-white text-[9px] font-black uppercase flex items-center space-x-1 animate-pulse">
                          <span className="w-1 h-1 rounded-full bg-white" />
                          <span>EN DIRECT</span>
                        </span>
                      )}
                    </div>
                    <span className="text-[10px] text-slate-400">{item.durationMinutes} min</span>
                  </div>

                  <h5 className={`text-xs font-bold ${item.isLive ? 'text-orange-400 font-extrabold' : 'text-white'}`}>
                    {item.title}
                  </h5>

                  {item.description && (
                    <p className="text-[11px] text-slate-400 line-clamp-2 mt-1 leading-snug">
                      {item.description}
                    </p>
                  )}

                  {/* Live Progress Bar */}
                  {item.isLive && (
                    <div className="mt-2 pt-2 border-t border-slate-800/80">
                      <div className="flex items-center justify-between text-[10px] text-slate-400 mb-1">
                        <span>Progression de l'émission</span>
                        <span className="font-mono text-orange-400 font-bold">{item.progressPercent}%</span>
                      </div>
                      <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-gradient-to-r from-orange-500 to-amber-400 rounded-full transition-all duration-500"
                          style={{ width: `${item.progressPercent}%` }}
                        />
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>

          </div>
        ) : (
          <div className="space-y-3">
            
            {/* Search Bar */}
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="text"
                placeholder="Rechercher une chaîne..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-slate-900 border border-slate-800 rounded-xl pl-9 pr-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-orange-500"
              />
            </div>

            {/* Categories filter pills */}
            <div className="flex gap-1.5 overflow-x-auto pb-1 scrollbar-none text-[10px]">
              {categories.slice(0, 12).map((cat) => (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  className={`px-2.5 py-1 rounded-lg font-bold whitespace-nowrap transition ${
                    selectedCategory === cat
                      ? 'bg-orange-500 text-slate-950 font-black'
                      : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
                  }`}
                >
                  {cat === 'ALL' ? 'Toutes' : cat}
                </button>
              ))}
            </div>

            {/* Channels List */}
            <div className="space-y-1.5">
              {filteredChannels.map((item) => {
                const isSelected = item.id === currentContent.id;
                return (
                  <div
                    key={item.id}
                    onClick={() => {
                      onSelectContent(item);
                    }}
                    className={`p-2.5 rounded-xl border cursor-pointer flex items-center justify-between transition-all group ${
                      isSelected
                        ? 'bg-orange-500/20 border-orange-500/50 shadow'
                        : 'bg-slate-900/60 hover:bg-slate-800/80 border-slate-800'
                    }`}
                  >
                    <div className="flex items-center space-x-2.5 min-w-0">
                      <div className="relative w-8 h-8 rounded-lg overflow-hidden border border-slate-700 flex-shrink-0 bg-slate-950">
                        <img
                          src={item.logoUrl || `https://ui-avatars.com/api/?name=${encodeURIComponent(item.name)}&background=f97316&color=ffffff`}
                          alt={item.name}
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            (e.target as HTMLImageElement).src = `https://ui-avatars.com/api/?name=${encodeURIComponent(item.name)}&background=f97316&color=ffffff`;
                          }}
                        />
                        {isSelected && (
                          <div className="absolute inset-0 bg-orange-500/40 flex items-center justify-center">
                            <Play className="w-3.5 h-3.5 text-white fill-current animate-pulse" />
                          </div>
                        )}
                      </div>

                      <div className="min-w-0">
                        <h4 className={`text-xs font-bold truncate ${isSelected ? 'text-orange-400 font-black' : 'text-white group-hover:text-orange-300'}`}>
                          {item.name}
                        </h4>
                        <p className="text-[10px] text-slate-400 truncate">
                          {item.category} • {item.quality}
                        </p>
                      </div>
                    </div>

                    <ChevronRight className={`w-4 h-4 flex-shrink-0 transition-transform group-hover:translate-x-1 ${
                      isSelected ? 'text-orange-400' : 'text-slate-600'
                    }`} />
                  </div>
                );
              })}
            </div>

          </div>
        )}
      </div>

    </div>
  );
};
