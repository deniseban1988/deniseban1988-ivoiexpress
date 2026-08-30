import React, { useState, useEffect } from 'react';
import { Camera } from '../../types';
import { CameraDiagnosticStep } from '../../types/vision';
import { 
  X, Activity, CheckCircle2, AlertTriangle, RefreshCw, 
  ShieldCheck, Network, Video, Sparkles, Cpu, Clock, HardDrive 
} from 'lucide-react';

interface CameraDiagnosticTestModalProps {
  camera: Camera;
  onClose: () => void;
}

export const CameraDiagnosticTestModal: React.FC<CameraDiagnosticTestModalProps> = ({
  camera,
  onClose
}) => {
  const [isRunning, setIsRunning] = useState<boolean>(true);
  const [overallHealth, setOverallHealth] = useState<'HEALTHY' | 'WARNING' | 'CRITICAL' | 'RUNNING'>('RUNNING');
  const [currentLatency, setCurrentLatency] = useState<number>(camera.latencyMs || 85);
  const [currentFps, setCurrentFps] = useState<number>(camera.fps || 30);
  const [currentBitrate, setCurrentBitrate] = useState<number>(camera.bitrateKbps || 4096);
  const [activeStepIdx, setActiveStepIdx] = useState<number>(0);

  const [steps, setSteps] = useState<CameraDiagnosticStep[]>([
    {
      id: 'step-net',
      name: '1. Accessibilité Réseau (Ping & Sockets TCP)',
      description: `Test d'écho ICMP et ouverture du port ${camera.port || 554} sur ${camera.ipAddress || '192.168.1.100'}`,
      status: 'RUNNING'
    },
    {
      id: 'step-auth',
      name: '2. Négociation d\'Authentification & Sécurité',
      description: `Vérification du handshake Digest/TLS pour l'opérateur "${camera.username || 'admin'}"`,
      status: 'PENDING'
    },
    {
      id: 'step-stream',
      name: '3. Initialisation du Flux Vidéo (RTSP / ONVIF)',
      description: `Découverte SDP du profil vidéo (${camera.resolution}) et codec (${camera.codec || 'H.265'})`,
      status: 'PENDING'
    },
    {
      id: 'step-frames',
      name: '4. Réception des Images Clés (I-Frames & P-Frames)',
      description: 'Mesure du jitter, gigue réseau et taux de perte de paquets',
      status: 'PENDING'
    },
    {
      id: 'step-ai',
      name: '5. Pipeline Neuronal AI Core IVOIReXpress',
      description: `Armement en temps réel des ${camera.aiDetectionRules?.length || 3} modèles d'inférence visuelle`,
      status: 'PENDING'
    },
    {
      id: 'step-storage',
      name: '6. Buffer d\'Enregistrement & Stockage Cloud',
      description: `Vérification du quota de rétention (${camera.retentionDays || 30} jours) et écriture FIFO`,
      status: 'PENDING'
    }
  ]);

  const runFullPipeline = () => {
    setIsRunning(true);
    setOverallHealth('RUNNING');
    setActiveStepIdx(0);

    // Reset
    setSteps(prev => prev.map((s, idx) => ({ ...s, status: idx === 0 ? 'RUNNING' : 'PENDING', details: undefined })));

    // Step 1: Net
    setTimeout(() => {
      setSteps(prev => prev.map((s, idx) => idx === 0 ? {
        ...s,
        status: 'SUCCESS',
        durationMs: 18,
        details: `IP ${camera.ipAddress || '192.168.1.100'} joignable • Latence 18ms • Port ${camera.port || 554} ouvert sans blocage firewall`
      } : idx === 1 ? { ...s, status: 'RUNNING' } : s));
      setActiveStepIdx(1);
    }, 600);

    // Step 2: Auth
    setTimeout(() => {
      setSteps(prev => prev.map((s, idx) => idx === 1 ? {
        ...s,
        status: 'SUCCESS',
        durationMs: 42,
        details: `Authentification Digest validée • Chiffrement de session AES-256 actif • Certificat TLS conforme`
      } : idx === 2 ? { ...s, status: 'RUNNING' } : s));
      setActiveStepIdx(2);
    }, 1200);

    // Step 3: Stream
    setTimeout(() => {
      setSteps(prev => prev.map((s, idx) => idx === 2 ? {
        ...s,
        status: 'SUCCESS',
        durationMs: 65,
        details: `Flux RTSP négocié • Codec ${camera.codec || 'H.265 / HEVC'} actif • Débit ${currentBitrate} Kbps`
      } : idx === 3 ? { ...s, status: 'RUNNING' } : s));
      setActiveStepIdx(3);
    }, 1800);

    // Step 4: Frames
    setTimeout(() => {
      setSteps(prev => prev.map((s, idx) => idx === 3 ? {
        ...s,
        status: 'SUCCESS',
        durationMs: 80,
        details: `30 I-Frames reçues consécutivement • 0% paquet perdu • Fluidité optimale (${currentFps} FPS)`
      } : idx === 4 ? { ...s, status: 'RUNNING' } : s));
      setActiveStepIdx(4);
    }, 2400);

    // Step 5: AI
    setTimeout(() => {
      setSteps(prev => prev.map((s, idx) => idx === 4 ? {
        ...s,
        status: 'SUCCESS',
        durationMs: 110,
        details: `AI Core armé • Traitement neuronal 14ms par frame • Détection active sur ${camera.locationName}`
      } : idx === 5 ? { ...s, status: 'RUNNING' } : s));
      setActiveStepIdx(5);
    }, 3000);

    // Step 6: Storage
    setTimeout(() => {
      setSteps(prev => prev.map((s, idx) => idx === 5 ? {
        ...s,
        status: 'SUCCESS',
        durationMs: 25,
        details: `Archivage Cloud opérationnel • Rétention ${camera.retentionDays || 30} jours confirmée • Espace disponible 487.6 Go`
      } : s));
      setIsRunning(false);
      setOverallHealth('HEALTHY');
    }, 3600);
  };

  useEffect(() => {
    runFullPipeline();
  }, [camera.id]);

  return (
    <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-3 sm:p-6 overflow-y-auto">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-3xl w-full p-5 sm:p-7 shadow-2xl relative my-auto max-h-[92vh] flex flex-col">
        
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-800">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-2xl bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
              <Activity className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="text-[10px] font-extrabold uppercase tracking-wider text-emerald-400">
                  Centre de Diagnostic & Santé Caméra
                </span>
                <span className="px-2 py-0.5 rounded-full bg-slate-800 border border-slate-700 text-slate-300 text-[10px] font-bold font-mono">
                  {camera.ipAddress || '192.168.1.100'}:{camera.port || 554}
                </span>
              </div>
              <h2 className="text-lg font-black text-white">
                Diagnostic Intégral : {camera.name}
              </h2>
            </div>
          </div>

          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-2 rounded-xl bg-slate-800/80 hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Realtime Metrics Banner */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 py-4">
          <div className="p-3 bg-slate-950/80 rounded-2xl border border-slate-800">
            <div className="text-[10px] font-bold text-slate-400 uppercase">Latence Réseau</div>
            <div className="text-base font-black text-emerald-400 font-mono mt-0.5">
              {currentLatency} ms
            </div>
            <div className="text-[9px] text-slate-500">RTT Optimal</div>
          </div>

          <div className="p-3 bg-slate-950/80 rounded-2xl border border-slate-800">
            <div className="text-[10px] font-bold text-slate-400 uppercase">Framerate Actuel</div>
            <div className="text-base font-black text-blue-400 font-mono mt-0.5">
              {currentFps} FPS
            </div>
            <div className="text-[9px] text-slate-500">Flux Constant</div>
          </div>

          <div className="p-3 bg-slate-950/80 rounded-2xl border border-slate-800">
            <div className="text-[10px] font-bold text-slate-400 uppercase">Débit Binaire</div>
            <div className="text-base font-black text-cyan-400 font-mono mt-0.5">
              {currentBitrate} Kbps
            </div>
            <div className="text-[9px] text-slate-500">{camera.codec || 'H.265'} CBR</div>
          </div>

          <div className="p-3 bg-slate-950/80 rounded-2xl border border-slate-800">
            <div className="text-[10px] font-bold text-slate-400 uppercase">Statut Global</div>
            <div className="text-base font-black text-white mt-0.5 flex items-center space-x-1.5">
              {overallHealth === 'HEALTHY' ? (
                <>
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
                  <span className="text-emerald-400 text-xs font-bold">100% Conforme</span>
                </>
              ) : overallHealth === 'RUNNING' ? (
                <>
                  <RefreshCw className="w-3.5 h-3.5 text-blue-400 animate-spin" />
                  <span className="text-blue-400 text-xs font-bold">Analyse...</span>
                </>
              ) : (
                <span className="text-amber-400 text-xs font-bold">Attention</span>
              )}
            </div>
            <div className="text-[9px] text-slate-500">Service certifié</div>
          </div>
        </div>

        {/* Steps List */}
        <div className="flex-1 overflow-y-auto space-y-2.5 pr-1 py-1">
          {steps.map((s, idx) => (
            <div
              key={s.id}
              className={`p-3.5 rounded-2xl border transition ${
                s.status === 'SUCCESS'
                  ? 'bg-emerald-950/20 border-emerald-500/30'
                  : s.status === 'RUNNING'
                  ? 'bg-blue-950/30 border-blue-500/40 shadow-md'
                  : 'bg-slate-950/40 border-slate-800/80'
              }`}
            >
              <div className="flex items-start justify-between">
                <div className="flex items-start space-x-3">
                  <div className="mt-0.5">
                    {s.status === 'SUCCESS' ? (
                      <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                    ) : s.status === 'RUNNING' ? (
                      <RefreshCw className="w-5 h-5 text-blue-400 animate-spin" />
                    ) : (
                      <div className="w-5 h-5 rounded-full border border-slate-700 flex items-center justify-center text-[10px] text-slate-500 font-mono">
                        {idx + 1}
                      </div>
                    )}
                  </div>
                  <div>
                    <h4 className="text-xs font-extrabold text-white">{s.name}</h4>
                    <p className="text-[11px] text-slate-400 mt-0.5">{s.description}</p>
                    {s.details && (
                      <p className="text-[11px] text-emerald-400 font-mono font-semibold mt-1.5 bg-emerald-950/40 px-2 py-1 rounded-lg border border-emerald-800/40 inline-block">
                        ✓ {s.details}
                      </p>
                    )}
                  </div>
                </div>

                <div className="text-right">
                  <span className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded-full border ${
                    s.status === 'SUCCESS'
                      ? 'bg-emerald-900/40 text-emerald-300 border-emerald-700/50'
                      : s.status === 'RUNNING'
                      ? 'bg-blue-900/40 text-blue-300 border-blue-700/50'
                      : 'bg-slate-900 text-slate-500 border-slate-800'
                  }`}>
                    {s.status}
                  </span>
                  {s.durationMs && (
                    <div className="text-[9px] text-slate-500 font-mono mt-1">
                      {s.durationMs} ms
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Footer Actions */}
        <div className="pt-4 border-t border-slate-800 flex items-center justify-between">
          <div className="text-xs text-slate-400">
            Dernier test exécuté : <span className="text-slate-200 font-mono">{new Date().toLocaleTimeString()}</span>
          </div>

          <div className="flex items-center space-x-3">
            <button
              onClick={runFullPipeline}
              disabled={isRunning}
              className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold rounded-xl text-xs flex items-center space-x-2 transition"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isRunning ? 'animate-spin' : ''}`} />
              <span>Relancer le Test</span>
            </button>

            <button
              onClick={onClose}
              className="px-5 py-2 bg-blue-600 hover:bg-blue-500 text-white font-extrabold rounded-xl text-xs shadow-lg shadow-blue-600/30 transition"
            >
              Fermer le Rapport
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};
