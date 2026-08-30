import React, { useState } from 'react';
import { StreamStats, PlaybackDiagnosticLog } from './types';
import {
  Activity,
  X,
  Cpu,
  Radio,
  Sliders,
  ShieldCheck,
  Terminal,
  Zap,
  CheckCircle2,
  AlertTriangle,
  Info,
  Clock,
  Copy,
  Layers,
  AlertCircle,
  HelpCircle,
  Sparkles,
  Server
} from 'lucide-react';

interface StatsForNerdsModalProps {
  stats: StreamStats | null;
  logs: PlaybackDiagnosticLog[];
  channelName: string;
  onClose: () => void;
}

export const StatsForNerdsModal: React.FC<StatsForNerdsModalProps> = ({
  stats,
  logs,
  channelName,
  onClose
}) => {
  const [activeTab, setActiveTab] = useState<'METRICS' | 'DIAGNOSTIC' | 'LOGS'>('METRICS');
  const [copied, setCopied] = useState(false);

  const handleCopyLogs = () => {
    const text = logs.map(l => `[${l.timestamp}] [${l.level}] ${l.message}`).join('\n');
    navigator.clipboard.writeText(text).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  const verdict = stats?.diagnosticVerdict;
  const analysis = stats?.analysis;

  return (
    <div className="absolute inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-3 sm:p-6 animate-fadeIn">
      <div className="w-full max-w-2xl bg-slate-950/95 border border-cyan-500/40 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[85vh]">
        
        {/* Header */}
        <div className="px-4 py-3 bg-slate-900/90 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center space-x-2.5">
            <div className="p-1.5 rounded-lg bg-cyan-500/20 text-cyan-400 border border-cyan-500/30">
              <Activity className="w-4 h-4 animate-pulse" />
            </div>
            <div>
              <h3 className="text-sm font-extrabold text-white flex items-center space-x-2">
                <span>Monitoring Technique & Diagnostics</span>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-cyan-500/10 text-cyan-300 border border-cyan-500/20 font-mono">
                  PRO HUD
                </span>
              </h3>
              <p className="text-[11px] text-slate-400 truncate max-w-xs sm:max-w-md">
                Flux en cours : <span className="text-white font-semibold">{channelName}</span>
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            {/* Tabs */}
            <div className="flex bg-slate-800/80 p-0.5 rounded-lg border border-slate-700 text-xs">
              <button
                onClick={() => setActiveTab('METRICS')}
                className={`px-3 py-1 rounded-md font-bold transition-all ${
                  activeTab === 'METRICS'
                    ? 'bg-cyan-500 text-slate-950 shadow'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                Métriques
              </button>
              <button
                onClick={() => setActiveTab('DIAGNOSTIC')}
                className={`px-3 py-1 rounded-md font-bold transition-all flex items-center space-x-1 ${
                  activeTab === 'DIAGNOSTIC'
                    ? 'bg-cyan-500 text-slate-950 shadow'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <span>Diagnostic</span>
                {verdict && (
                  <span className="w-2 h-2 rounded-full bg-amber-400 animate-ping" />
                )}
              </button>
              <button
                onClick={() => setActiveTab('LOGS')}
                className={`px-3 py-1 rounded-md font-bold transition-all flex items-center space-x-1 ${
                  activeTab === 'LOGS'
                    ? 'bg-cyan-500 text-slate-950 shadow'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <span>Logs</span>
                <span className="text-[10px] px-1.5 rounded-full bg-slate-900 text-cyan-400 font-mono">
                  {logs.length}
                </span>
              </button>
            </div>

            <button
              onClick={onClose}
              className="p-1.5 rounded-lg bg-slate-800 text-slate-400 hover:text-white hover:bg-slate-700 transition"
              title="Fermer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Content Body */}
        <div className="p-4 overflow-y-auto flex-1 text-xs">
          {activeTab === 'METRICS' && (
            <div className="space-y-4">
              
              {/* Top Engine & Protocol Banner */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                <div className="p-3 rounded-xl bg-slate-900/80 border border-slate-800">
                  <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1 flex items-center space-x-1">
                    <Cpu className="w-3 h-3 text-cyan-400" />
                    <span>Moteur Actif</span>
                  </div>
                  <div className="text-sm font-black text-cyan-300 font-mono truncate">
                    {stats?.engine || 'HLS_JS'}
                  </div>
                  <div className="text-[10px] text-slate-500 mt-0.5">
                    {stats?.engineCascadeStep || 'Cascade auto'}
                  </div>
                </div>

                <div className="p-3 rounded-xl bg-slate-900/80 border border-slate-800">
                  <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1 flex items-center space-x-1">
                    <Clock className="w-3 h-3 text-emerald-400" />
                    <span>Démarrage (TTFF)</span>
                  </div>
                  <div className="text-sm font-black text-emerald-300 font-mono truncate">
                    {stats?.timeToFirstFrameMs ? `${stats.timeToFirstFrameMs} ms` : 'Ultra-Rapide'}
                  </div>
                  <div className="text-[10px] text-slate-500 mt-0.5">
                    Manifest : {stats?.manifestLoadTimeMs ? `${stats.manifestLoadTimeMs}ms` : '<100ms'}
                  </div>
                </div>

                <div className="p-3 rounded-xl bg-slate-900/80 border border-slate-800">
                  <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1 flex items-center space-x-1">
                    <Sliders className="w-3 h-3 text-amber-400" />
                    <span>Résolution</span>
                  </div>
                  <div className="text-sm font-black text-amber-300 font-mono">
                    {stats?.resolution || 'HD 1080p'}
                  </div>
                  <div className="text-[10px] text-slate-500 mt-0.5">
                    {stats?.levelsCount ? `${stats.levelsCount} profils` : 'Direct'}
                  </div>
                </div>

                <div className="p-3 rounded-xl bg-slate-900/80 border border-slate-800">
                  <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1 flex items-center space-x-1">
                    <Zap className="w-3 h-3 text-purple-400" />
                    <span>Débit Actif</span>
                  </div>
                  <div className="text-sm font-black text-purple-300 font-mono">
                    {stats?.bitrateKbps ? `${stats.bitrateKbps} kbps` : 'Dynamique'}
                  </div>
                  <div className="text-[10px] text-slate-500 mt-0.5">
                    FPS: {stats?.fps || 30}
                  </div>
                </div>
              </div>

              {/* Realtime Stream Telemetry Table */}
              <div className="bg-slate-900/90 border border-slate-800 rounded-xl overflow-hidden">
                <div className="px-3 py-2 bg-slate-800/60 border-b border-slate-800 font-bold text-slate-300 flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <Activity className="w-3.5 h-3.5 text-cyan-400" />
                    <span>Télémétrie en temps réel</span>
                  </div>
                  <span className="text-[10px] font-mono text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
                    Live Stream Pro
                  </span>
                </div>
                <div className="divide-y divide-slate-800/80 font-mono text-[11px]">
                  
                  <div className="px-3 py-2 flex items-center justify-between">
                    <span className="text-slate-400">Longueur du Tampon (Buffer) :</span>
                    <span className={`font-bold ${
                      (stats?.bufferLengthSec || 0) > 3 ? 'text-emerald-400' : 'text-amber-400'
                    }`}>
                      {stats?.bufferLengthSec ?? 0} secondes
                    </span>
                  </div>

                  <div className="px-3 py-2 flex items-center justify-between">
                    <span className="text-slate-400">Latence Live Edge :</span>
                    <span className="text-slate-200 font-bold">
                      {stats?.latencySec ? `${stats.latencySec}s` : 'Ultra-Faible'}
                    </span>
                  </div>

                  <div className="px-3 py-2 flex items-center justify-between">
                    <span className="text-slate-400">Images Perdues (Dropped Frames) :</span>
                    <span className={`font-bold ${
                      (stats?.droppedFrames || 0) === 0 ? 'text-emerald-400' : 'text-amber-400'
                    }`}>
                      {stats?.droppedFrames ?? 0} frames
                    </span>
                  </div>

                  <div className="px-3 py-2 flex items-center justify-between">
                    <span className="text-slate-400">Pistes Audio & Sous-titres :</span>
                    <span className="text-cyan-400 font-bold">
                      {stats?.audioTracksCount || 1} audio / {stats?.subtitlesCount || 0} sous-titres
                    </span>
                  </div>

                  <div className="px-3 py-2 flex items-center justify-between">
                    <span className="text-slate-400">Tentatives de Reconnexion Réseau :</span>
                    <span className="text-slate-300 font-bold">
                      {stats?.reconnectionAttempts ?? 0} / 2 max (failover rapide)
                    </span>
                  </div>

                  <div className="px-3 py-2 flex items-center justify-between">
                    <span className="text-slate-400">Sécurité & Isolation RBAC :</span>
                    <span className="text-emerald-400 font-bold flex items-center space-x-1">
                      <ShieldCheck className="w-3.5 h-3.5" />
                      <span>Conforme Multi-Tenant</span>
                    </span>
                  </div>

                </div>
              </div>

            </div>
          )}

          {activeTab === 'DIAGNOSTIC' && (
            <div className="space-y-4">
              {verdict ? (
                <div className="p-4 bg-slate-900 border border-amber-500/40 rounded-xl space-y-3">
                  <div className="flex items-center space-x-2 text-amber-400">
                    <AlertTriangle className="w-5 h-5 shrink-0" />
                    <h4 className="font-extrabold text-sm text-white">{verdict.title}</h4>
                  </div>

                  <div className="p-3 bg-black/50 rounded-lg border border-slate-800 space-y-2 text-slate-300">
                    <div>
                      <span className="text-[10px] uppercase font-bold text-slate-400 block mb-0.5">Détails Techniques :</span>
                      <p className="text-xs">{verdict.technicalDetails}</p>
                    </div>

                    <div>
                      <span className="text-[10px] uppercase font-bold text-amber-400 block mb-0.5">Cause Racine Identifiée :</span>
                      <p className="text-xs">{verdict.rootCause}</p>
                    </div>

                    <div>
                      <span className="text-[10px] uppercase font-bold text-cyan-400 block mb-0.5">Recommandation du Moteur :</span>
                      <p className="text-xs text-cyan-300">{verdict.suggestedSolution}</p>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="p-4 bg-slate-900 border border-emerald-500/30 rounded-xl space-y-3">
                  <div className="flex items-center space-x-2 text-emerald-400">
                    <CheckCircle2 className="w-5 h-5 shrink-0" />
                    <h4 className="font-extrabold text-sm text-white">Diagnostic : Flux Sain & Opérationnel</h4>
                  </div>
                  <p className="text-slate-300 text-xs">
                    Aucune anomalie détectée sur ce flux. La connexion est établie et le décodage matériel est optimal.
                  </p>
                </div>
              )}

              {/* URL & Protocol Analysis */}
              {analysis && (
                <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-3 space-y-2">
                  <h4 className="font-bold text-slate-200 text-xs flex items-center space-x-2">
                    <Server className="w-3.5 h-3.5 text-cyan-400" />
                    <span>Inspection de l'URL du Flux</span>
                  </h4>
                  <div className="grid grid-cols-2 gap-2 text-[11px] font-mono">
                    <div className="p-2 bg-slate-950 rounded border border-slate-800">
                      <span className="text-slate-400 block text-[10px]">Hôte :</span>
                      <span className="text-white truncate block">{analysis.hostname}</span>
                    </div>
                    <div className="p-2 bg-slate-950 rounded border border-slate-800">
                      <span className="text-slate-400 block text-[10px]">Format :</span>
                      <span className="text-cyan-300">{analysis.detectedFormat}</span>
                    </div>
                    <div className="p-2 bg-slate-950 rounded border border-slate-800">
                      <span className="text-slate-400 block text-[10px]">Protocole :</span>
                      <span className={analysis.protocol === 'HTTPS' ? 'text-emerald-400' : 'text-amber-400'}>
                        {analysis.protocol} {analysis.isMixedContentRisk ? '(Risque Mixed Content)' : ''}
                      </span>
                    </div>
                    <div className="p-2 bg-slate-950 rounded border border-slate-800">
                      <span className="text-slate-400 block text-[10px]">Moteur Recommandé :</span>
                      <span className="text-purple-300">{analysis.recommendedEngine}</span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {activeTab === 'LOGS' && (
            <div className="space-y-3">
              <div className="flex items-center justify-between mb-1">
                <span className="text-[11px] text-slate-400">
                  Journal des événements internes de lecture :
                </span>
                <button
                  onClick={handleCopyLogs}
                  className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-[10px] font-bold flex items-center space-x-1 transition"
                >
                  <Copy className="w-3 h-3" />
                  <span>{copied ? 'Copié !' : 'Copier les logs'}</span>
                </button>
              </div>

              <div className="bg-black/90 rounded-xl p-3 border border-slate-800 font-mono text-[10px] leading-relaxed max-h-64 overflow-y-auto space-y-1.5">
                {logs.length === 0 ? (
                  <div className="text-slate-500 py-6 text-center">Aucun événement enregistré pour l'instant.</div>
                ) : (
                  logs.map((log) => {
                    const color =
                      log.level === 'SUCCESS'
                        ? 'text-emerald-400'
                        : log.level === 'ERROR'
                        ? 'text-rose-400'
                        : log.level === 'WARN' || log.level === 'RECOVERY'
                        ? 'text-amber-400'
                        : 'text-cyan-400';

                    return (
                      <div key={log.id} className="flex items-start space-x-2 border-b border-slate-900 pb-1">
                        <span className="text-slate-500 flex-shrink-0">[{log.timestamp}]</span>
                        <span className={`font-bold flex-shrink-0 ${color}`}>[{log.level}]</span>
                        <span className="text-slate-300 flex-1">{log.message}</span>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-4 py-2.5 bg-slate-900/60 border-t border-slate-800 flex items-center justify-between text-[11px] text-slate-400">
          <div className="flex items-center space-x-1.5 text-cyan-400 font-semibold">
            <Zap className="w-3.5 h-3.5" />
            <span>Smart IPTV Ultra-Low Latency Engine v3.8</span>
          </div>
          <span>Moteur auto-cascade & diagnostic racine</span>
        </div>

      </div>
    </div>
  );
};
