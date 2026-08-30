import React, { useState } from 'react';
import { LucideIcon, ArrowUpRight, CheckCircle2, AlertTriangle, Activity, ChevronRight, X, RefreshCw, Zap } from 'lucide-react';

export type ServiceCardTheme = 'emerald' | 'blue' | 'orange' | 'purple' | 'amber' | 'cyan' | 'rose' | 'indigo' | 'slate';

export interface SmartServiceCardProps {
  id: string;
  title: string;
  category?: string;
  description: string;
  icon: LucideIcon;
  theme?: ServiceCardTheme;
  metricValue?: string | number;
  metricLabel?: string;
  statusBadge?: {
    text: string;
    type: 'success' | 'warning' | 'danger' | 'info' | 'neutral';
  };
  alertCount?: number;
  isLiveSynced?: boolean;
  quickActionLabel?: string;
  backgroundImage?: string;
  onClick?: () => void;
  onQuickAction?: () => void;
  // Optional detailed modal content or metrics breakdown
  details?: {
    subMetrics?: { label: string; value: string | number; color?: string }[];
    recentEvents?: { time: string; text: string; type?: 'info' | 'warning' | 'success' }[];
    primaryActionLabel?: string;
    secondaryActionLabel?: string;
  };
}

const themeStyles: Record<ServiceCardTheme, {
  bgIcon: string;
  textIcon: string;
  borderHover: string;
  shadowHover: string;
  badgeBg: string;
}> = {
  emerald: {
    bgIcon: 'bg-emerald-500/10 border-emerald-500/30',
    textIcon: 'text-emerald-400',
    borderHover: 'hover:border-emerald-500/60',
    shadowHover: 'hover:shadow-emerald-500/10',
    badgeBg: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30',
  },
  blue: {
    bgIcon: 'bg-blue-500/10 border-blue-500/30',
    textIcon: 'text-blue-400',
    borderHover: 'hover:border-blue-500/60',
    shadowHover: 'hover:shadow-blue-500/10',
    badgeBg: 'bg-blue-500/15 text-blue-400 border-blue-500/30',
  },
  orange: {
    bgIcon: 'bg-orange-500/10 border-orange-500/30',
    textIcon: 'text-orange-400',
    borderHover: 'hover:border-orange-500/60',
    shadowHover: 'hover:shadow-orange-500/10',
    badgeBg: 'bg-orange-500/15 text-orange-400 border-orange-500/30',
  },
  purple: {
    bgIcon: 'bg-purple-500/10 border-purple-500/30',
    textIcon: 'text-purple-400',
    borderHover: 'hover:border-purple-500/60',
    shadowHover: 'hover:shadow-purple-500/10',
    badgeBg: 'bg-purple-500/15 text-purple-400 border-purple-500/30',
  },
  amber: {
    bgIcon: 'bg-amber-500/10 border-amber-500/30',
    textIcon: 'text-amber-400',
    borderHover: 'hover:border-amber-500/60',
    shadowHover: 'hover:shadow-amber-500/10',
    badgeBg: 'bg-amber-500/15 text-amber-400 border-amber-500/30',
  },
  cyan: {
    bgIcon: 'bg-cyan-500/10 border-cyan-500/30',
    textIcon: 'text-cyan-400',
    borderHover: 'hover:border-cyan-500/60',
    shadowHover: 'hover:shadow-cyan-500/10',
    badgeBg: 'bg-cyan-500/15 text-cyan-400 border-cyan-500/30',
  },
  rose: {
    bgIcon: 'bg-rose-500/10 border-rose-500/30',
    textIcon: 'text-rose-400',
    borderHover: 'hover:border-rose-500/60',
    shadowHover: 'hover:shadow-rose-500/10',
    badgeBg: 'bg-rose-500/15 text-rose-400 border-rose-500/30',
  },
  indigo: {
    bgIcon: 'bg-indigo-500/10 border-indigo-500/30',
    textIcon: 'text-indigo-400',
    borderHover: 'hover:border-indigo-500/60',
    shadowHover: 'hover:shadow-indigo-500/10',
    badgeBg: 'bg-indigo-500/15 text-indigo-400 border-indigo-500/30',
  },
  slate: {
    bgIcon: 'bg-slate-800 border-slate-700',
    textIcon: 'text-slate-300',
    borderHover: 'hover:border-slate-600',
    shadowHover: 'hover:shadow-slate-500/10',
    badgeBg: 'bg-slate-800 text-slate-300 border-slate-700',
  },
};

export const SmartServiceCard: React.FC<SmartServiceCardProps> = ({
  title,
  category,
  description,
  icon: Icon,
  theme = 'emerald',
  metricValue,
  metricLabel,
  statusBadge,
  alertCount = 0,
  isLiveSynced = true,
  quickActionLabel = 'Ouvrir',
  backgroundImage,
  onClick,
  onQuickAction,
  details
}) => {
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const activeTheme = themeStyles[theme] || themeStyles.emerald;

  const handleCardClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onClick) {
      onClick();
    } else {
      setShowDetailModal(true);
    }
  };

  const handleActionButton = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onQuickAction) {
      onQuickAction();
    } else if (onClick) {
      onClick();
    } else {
      setShowDetailModal(true);
    }
  };

  const triggerSync = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsSyncing(true);
    setTimeout(() => setIsSyncing(false), 800);
  };

  return (
    <>
      <div
        onClick={handleCardClick}
        className={`group relative bg-slate-900/95 hover:bg-slate-900 border border-slate-800/90 ${activeTheme.borderHover} ${activeTheme.shadowHover} rounded-2xl p-5 flex flex-col justify-between transition-all duration-300 cursor-pointer ivx-card-dark-shadow hover:-translate-y-1.5 select-none overflow-hidden h-full min-h-[220px]`}
      >
        {/* Optional Photographic Background with subtle gradient veil */}
        {backgroundImage && (
          <div className="absolute inset-0 pointer-events-none overflow-hidden">
            <img
              src={backgroundImage}
              alt={title}
              referrerPolicy="no-referrer"
              className="w-full h-full object-cover object-[center_30%] filter brightness-[1.04] contrast-[1.02] opacity-60 group-hover:opacity-75 transition-opacity duration-300"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-slate-950/90 via-slate-950/60 to-slate-950/20 pointer-events-none" />
          </div>
        )}

        {/* Subtle Ambient Glow Effect on Hover */}
        <div className={`absolute -right-12 -top-12 w-28 h-28 rounded-full ${activeTheme.bgIcon} blur-2xl opacity-0 group-hover:opacity-40 transition-opacity duration-500 pointer-events-none`} />

        {/* TOP HEADER ROW: Icon + Badges */}
        <div>
          <div className="flex items-start justify-between gap-2 mb-3">
            <div className="flex items-center space-x-3">
              <div className={`p-3 rounded-xl border ${activeTheme.bgIcon} ${activeTheme.textIcon} shadow-md group-hover:scale-105 transition-transform duration-300`}>
                <Icon className="w-5 h-5" />
              </div>
              <div>
                {category && (
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                    {category}
                  </span>
                )}
                <h3 className="text-sm font-extrabold text-white group-hover:text-emerald-300 transition-colors leading-tight">
                  {title}
                </h3>
              </div>
            </div>

            {/* Badges & Alert Indicators */}
            <div className="flex items-center space-x-1.5 shrink-0">
              {alertCount > 0 && (
                <span className="px-2 py-0.5 rounded-full bg-rose-500/20 text-rose-400 border border-rose-500/40 text-[10px] font-black flex items-center space-x-1 animate-pulse">
                  <AlertTriangle className="w-3 h-3" />
                  <span>{alertCount}</span>
                </span>
              )}

              {statusBadge && (
                <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${
                  statusBadge.type === 'success' ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30' :
                  statusBadge.type === 'warning' ? 'bg-amber-500/20 text-amber-400 border-amber-500/30' :
                  statusBadge.type === 'danger' ? 'bg-rose-500/20 text-rose-400 border-rose-500/30' :
                  statusBadge.type === 'info' ? 'bg-blue-500/20 text-blue-400 border-blue-500/30' :
                  'bg-slate-800 text-slate-400 border-slate-700'
                }`}>
                  {statusBadge.text}
                </span>
              )}

              {isLiveSynced && (
                <span className="w-2 h-2 rounded-full bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.8)] animate-pulse" title="Synchronisé en temps réel" />
              )}
            </div>
          </div>

          {/* KPI METRIC DISPLAY (IF PROVIDED) */}
          {(metricValue !== undefined || metricLabel !== undefined) && (
            <div className="my-2.5 px-3 py-2 rounded-xl bg-slate-950/70 border border-slate-800/80 flex items-center justify-between">
              <div>
                {metricLabel && (
                  <span className="text-[10px] text-slate-400 font-semibold block uppercase tracking-wider">
                    {metricLabel}
                  </span>
                )}
                {metricValue !== undefined && (
                  <span className={`text-lg font-black font-mono tracking-tight ${activeTheme.textIcon}`}>
                    {metricValue}
                  </span>
                )}
              </div>
              <Activity className="w-4 h-4 text-slate-600 group-hover:text-slate-400 transition-colors" />
            </div>
          )}

          {/* DESCRIPTION */}
          <p className="text-xs text-slate-400 line-clamp-2 leading-relaxed">
            {description}
          </p>
        </div>

        {/* BOTTOM ACTION BAR */}
        <div className="mt-4 pt-3 border-t border-slate-800/80 flex items-center justify-between">
          <span className="text-[10px] text-slate-400 flex items-center space-x-1">
            <span className="w-1.5 h-1.5 rounded-full bg-slate-400" />
            <span>Domaine Métier IVX</span>
          </span>

          <button
            onClick={handleActionButton}
            className={`px-3 py-1.5 rounded-xl ${activeTheme.badgeBg} hover:brightness-125 text-xs font-extrabold flex items-center space-x-1 transition-all active:scale-95 shadow-sm`}
          >
            <span>{quickActionLabel}</span>
            <ChevronRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
          </button>
        </div>
      </div>

      {/* DOMAIN METIER DETAILED MODAL */}
      {showDetailModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-lg w-full p-6 shadow-2xl relative animate-in fade-in zoom-in duration-200">
            {/* Modal Header */}
            <div className="flex items-start justify-between border-b border-slate-800 pb-4">
              <div className="flex items-center space-x-3">
                <div className={`p-3 rounded-2xl border ${activeTheme.bgIcon} ${activeTheme.textIcon}`}>
                  <Icon className="w-6 h-6" />
                </div>
                <div>
                  <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">
                    {category || 'Espace de Gestion IVOIReXpress'}
                  </span>
                  <h2 className="text-lg font-black text-white">{title}</h2>
                </div>
              </div>

              <div className="flex items-center space-x-2">
                <button
                  onClick={triggerSync}
                  className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 transition"
                  title="Rafraîchir les données en temps réel"
                >
                  <RefreshCw className={`w-4 h-4 ${isSyncing ? 'animate-spin text-emerald-400' : ''}`} />
                </button>

                <button
                  onClick={() => setShowDetailModal(false)}
                  className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 transition"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Modal Body */}
            <div className="py-4 space-y-4">
              <p className="text-xs text-slate-300 leading-relaxed bg-slate-950 p-3.5 rounded-2xl border border-slate-800">
                {description}
              </p>

              {/* Real-time Sub Metrics Grid */}
              {details?.subMetrics && details.subMetrics.length > 0 && (
                <div className="grid grid-cols-2 gap-2.5">
                  {details.subMetrics.map((sm, i) => (
                    <div key={i} className="bg-slate-950 p-3 rounded-xl border border-slate-800">
                      <span className="text-[10px] text-slate-400 uppercase font-bold block">{sm.label}</span>
                      <span className={`text-base font-black font-mono ${sm.color || 'text-white'}`}>{sm.value}</span>
                    </div>
                  ))}
                </div>
              )}

              {/* Recent Domain Activity / Logs */}
              {details?.recentEvents && details.recentEvents.length > 0 && (
                <div>
                  <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider mb-2">Activités Récentes</h4>
                  <div className="space-y-1.5 max-h-36 overflow-y-auto">
                    {details.recentEvents.map((ev, i) => (
                      <div key={i} className="flex items-center justify-between p-2 rounded-lg bg-slate-950 border border-slate-800/60 text-xs">
                        <span className="text-slate-300">{ev.text}</span>
                        <span className="text-[10px] font-mono text-slate-500">{ev.time}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="flex items-center space-x-2 text-[11px] text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 p-3 rounded-xl">
                <Zap className="w-4 h-4 shrink-0" />
                <span>Ce module est synchronisé en temps réel avec le core IVOIReXpress.</span>
              </div>
            </div>

            {/* Modal Footer Actions */}
            <div className="mt-2 pt-4 border-t border-slate-800 flex items-center justify-end space-x-2">
              <button
                onClick={() => setShowDetailModal(false)}
                className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold transition"
              >
                Fermer
              </button>
              <button
                onClick={() => {
                  setShowDetailModal(false);
                  if (onClick) onClick();
                }}
                className={`px-5 py-2 rounded-xl ${activeTheme.badgeBg} hover:brightness-125 text-xs font-black transition`}
              >
                {details?.primaryActionLabel || 'Ouvrir l\'Espace Métier'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
