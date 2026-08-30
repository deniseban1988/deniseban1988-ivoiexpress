import React, { useState, useEffect } from 'react';
import { Camera, AIModelDetection } from '../../types';
import { 
  Maximize2, Minimize2, RefreshCw, Sparkles, Video, Volume2, VolumeX, 
  Camera as CameraIcon, ShieldAlert, Circle, Grid, Layers, Play, Pause, Radio,
  Move, ChevronUp, ChevronDown, ChevronLeft, ChevronRight, ZoomIn, ZoomOut,
  Mic, MicOff, Download, Activity, CheckCircle2, ShieldCheck, Zap, Info
} from 'lucide-react';

interface VideoLivePlayerProps {
  camera: Camera;
  onAnalyzeAI?: (camera: Camera) => void;
  onStartManualRecord?: (camera: Camera) => void;
  allCameras?: Camera[];
  onSelectCameraFromGrid?: (camera: Camera) => void;
}

export const VideoLivePlayer: React.FC<VideoLivePlayerProps> = ({
  camera,
  onAnalyzeAI,
  onStartManualRecord,
  allCameras = [],
  onSelectCameraFromGrid
}) => {
  // Player Controls State
  const [streamProfile, setStreamProfile] = useState<'MAIN' | 'SUB'>('MAIN');
  const [quality, setQuality] = useState<'4K' | '1080p' | '720p' | '480p'>(
    camera.resolution.includes('4K') ? '4K' : camera.resolution.includes('1080p') ? '1080p' : '720p'
  );
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);
  const [isMuted, setIsMuted] = useState<boolean>(true);
  const [isTalking, setIsTalking] = useState<boolean>(false);
  const [showAIBoundingBox, setShowAIBoundingBox] = useState<boolean>(true);
  const [showStatsOverlay, setShowStatsOverlay] = useState<boolean>(false);
  const [showPTZControls, setShowPTZControls] = useState<boolean>(camera.hasPTZ || false);
  const [isRecording, setIsRecording] = useState<boolean>(false);
  const [recordingSeconds, setRecordingSeconds] = useState<number>(0);

  // Connection & Auto-reconnect state
  const [isReconnecting, setIsReconnecting] = useState<boolean>(false);
  const [reconnectAttempts, setReconnectAttempts] = useState<number>(0);
  const [connectionStatus, setConnectionStatus] = useState<'CONNECTED' | 'RECONNECTING' | 'DISCONNECTED'>('CONNECTED');

  // PTZ State
  const [ptzPan, setPtzPan] = useState<number>(0);
  const [ptzTilt, setPtzTilt] = useState<number>(0);
  const [ptzZoom, setPtzZoom] = useState<number>(1);
  const [activePreset, setActivePreset] = useState<string>('Quai 1 (Principal)');

  // Multi-View Layout Mode (1x1, 2x2, 3x3)
  const [gridMode, setGridMode] = useState<'1x1' | '2x2' | '3x3'>('1x1');

  // Snapshot flash effect
  const [snapshotFlash, setSnapshotFlash] = useState<boolean>(false);

  // Recording Timer Effect
  useEffect(() => {
    let interval: any = null;
    if (isRecording) {
      interval = setInterval(() => {
        setRecordingSeconds(prev => prev + 1);
      }, 1000);
    } else {
      setRecordingSeconds(0);
    }
    return () => clearInterval(interval);
  }, [isRecording]);

  const handleManualReconnect = () => {
    setConnectionStatus('RECONNECTING');
    setIsReconnecting(true);
    setReconnectAttempts(prev => prev + 1);

    setTimeout(() => {
      setConnectionStatus('CONNECTED');
      setIsReconnecting(false);
    }, 1200);
  };

  const handleToggleRecord = () => {
    if (!isRecording) {
      setIsRecording(true);
      if (onStartManualRecord) onStartManualRecord(camera);
    } else {
      setIsRecording(false);
      alert(`Enregistrement manuel de la caméra "${camera.name}" sauvegardé avec succès (${recordingSeconds}s) dans les archives.`);
    }
  };

  const handleCaptureSnapshot = () => {
    setSnapshotFlash(true);
    setTimeout(() => setSnapshotFlash(false), 300);
    const dateStr = new Date().toISOString().replace(/:/g, '-').substring(0, 19);
    alert(`📸 Capture instantanée horodatée exportée :\nSNAPSHOT_${camera.code || 'CAM'}_${dateStr}.jpg\nRésolution : ${quality} • Site : ${camera.locationName}`);
  };

  const handlePTZMove = (direction: 'UP' | 'DOWN' | 'LEFT' | 'RIGHT' | 'ZOOM_IN' | 'ZOOM_OUT' | 'RESET') => {
    if (direction === 'UP') setPtzTilt(prev => Math.min(prev + 5, 90));
    if (direction === 'DOWN') setPtzTilt(prev => Math.max(prev - 5, -90));
    if (direction === 'LEFT') setPtzPan(prev => (prev - 5 + 360) % 360);
    if (direction === 'RIGHT') setPtzPan(prev => (prev + 5) % 360);
    if (direction === 'ZOOM_IN') setPtzZoom(prev => Math.min(prev + 0.5, 25));
    if (direction === 'ZOOM_OUT') setPtzZoom(prev => Math.max(prev - 0.5, 1));
    if (direction === 'RESET') {
      setPtzPan(0);
      setPtzTilt(0);
      setPtzZoom(1);
    }
  };

  const formatRecTime = (sec: number) => {
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  return (
    <div className="space-y-4">
      
      {/* Top Bar: View Mode & Quality Switcher */}
      <div className="flex flex-wrap items-center justify-between gap-2 bg-slate-900 p-3 rounded-2xl border border-slate-800 text-xs">
        <div className="flex items-center space-x-2">
          <span className="font-bold text-slate-300">Mode Affichage :</span>
          <div className="flex space-x-1">
            <button
              onClick={() => setGridMode('1x1')}
              className={`px-3 py-1 rounded-lg border font-bold transition ${
                gridMode === '1x1' 
                  ? 'bg-blue-600 text-white border-blue-500' 
                  : 'bg-slate-950 text-slate-400 border-slate-800 hover:border-slate-700'
              }`}
            >
              Vue Unique (1x1)
            </button>
            <button
              onClick={() => setGridMode('2x2')}
              className={`px-3 py-1 rounded-lg border font-bold transition flex items-center space-x-1 ${
                gridMode === '2x2' 
                  ? 'bg-blue-600 text-white border-blue-500' 
                  : 'bg-slate-950 text-slate-400 border-slate-800 hover:border-slate-700'
              }`}
            >
              <Grid className="w-3.5 h-3.5" />
              <span>Grille (2x2)</span>
            </button>
            <button
              onClick={() => setGridMode('3x3')}
              className={`px-3 py-1 rounded-lg border font-bold transition flex items-center space-x-1 ${
                gridMode === '3x3' 
                  ? 'bg-blue-600 text-white border-blue-500' 
                  : 'bg-slate-950 text-slate-400 border-slate-800 hover:border-slate-700'
              }`}
            >
              <Layers className="w-3.5 h-3.5" />
              <span>Mosaïque (3x3)</span>
            </button>
          </div>
        </div>

        {/* Stream Profile Switcher (Main Stream HD vs Sub-Stream Eco) */}
        <div className="flex items-center space-x-2">
          <div className="flex items-center bg-slate-950 p-0.5 rounded-xl border border-slate-800">
            <button
              onClick={() => { setStreamProfile('MAIN'); setQuality('1080p'); }}
              className={`px-2.5 py-1 rounded-lg text-[10px] font-extrabold transition ${
                streamProfile === 'MAIN' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-white'
              }`}
              title="Flux Principal Haute Résolution (Usage Wi-Fi / Fibre)"
            >
              Flux Principal (HD)
            </button>
            <button
              onClick={() => { setStreamProfile('SUB'); setQuality('480p'); }}
              className={`px-2.5 py-1 rounded-lg text-[10px] font-extrabold transition ${
                streamProfile === 'SUB' ? 'bg-emerald-600 text-white' : 'text-slate-400 hover:text-white'
              }`}
              title="Sous-Flux Éco Basse Résolution (Économie Bande Passante 3G/4G)"
            >
              Sous-Flux (Éco 480p)
            </button>
          </div>

          <button
            onClick={() => setShowStatsOverlay(!showStatsOverlay)}
            className={`p-1.5 rounded-lg border transition ${
              showStatsOverlay ? 'bg-blue-600/30 border-blue-500 text-blue-300' : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-white'
            }`}
            title="Afficher Télémétrie & Statistiques Réseau"
          >
            <Activity className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Main Single Camera Player */}
      {gridMode === '1x1' && (
        <div className="space-y-3">
          
          {/* Video Container Box */}
          <div className={`relative rounded-3xl overflow-hidden bg-black border border-slate-800 shadow-2xl group ${
            isFullscreen ? 'fixed inset-0 z-50 rounded-none w-full h-full' : 'aspect-video'
          }`}>
            
            {/* Flash Effect on snapshot */}
            {snapshotFlash && (
              <div className="absolute inset-0 bg-white/80 z-40 animate-out fade-out duration-300" />
            )}

            {/* Video Snapshot Feed */}
            <img
              src={camera.streamUrl || camera.snapshotUrl || 'https://images.unsplash.com/photo-1544620347-c4fd4a3d5957?w=800&auto=format&fit=crop&q=80'}
              alt={camera.name}
              className={`w-full h-full object-cover transition duration-300 ${
                connectionStatus !== 'CONNECTED' ? 'filter blur-sm brightness-50' : ''
              }`}
            />

            {/* Connection Status & Live Indicator Banner */}
            <div className="absolute top-4 left-4 flex flex-wrap items-center gap-2 z-20">
              <div className="flex items-center space-x-1.5 px-3 py-1 bg-slate-950/85 backdrop-blur-md rounded-full border border-slate-700/80 text-xs font-bold text-white shadow-lg">
                <span className={`w-2 h-2 rounded-full ${
                  connectionStatus === 'CONNECTED' 
                    ? camera.status === 'Alerte IA' ? 'bg-rose-500 animate-ping' : 'bg-emerald-500 animate-pulse'
                    : 'bg-amber-500 animate-ping'
                }`} />
                <span className="text-[11px] uppercase tracking-wider">
                  {connectionStatus === 'CONNECTED' ? (camera.status === 'Alerte IA' ? 'ALERTE IA LIVE' : 'LIVE 🟢') : 'RECONNEXION...'}
                </span>
              </div>

              <div className="px-3 py-1 bg-slate-950/85 backdrop-blur-md rounded-full border border-slate-700/80 text-[11px] font-mono text-blue-400 font-bold">
                {camera.name} • {camera.locationName}
              </div>

              {camera.hasPTZ && (
                <div className="px-2.5 py-1 bg-amber-500/20 backdrop-blur-md rounded-full border border-amber-500/40 text-[10px] font-mono text-amber-300 font-bold">
                  PTZ Actif (P:{ptzPan}° T:{ptzTilt}° Z:{ptzZoom}x)
                </div>
              )}
            </div>

            {/* Top Right Controls (HUD & Tools) */}
            <div className="absolute top-4 right-4 flex items-center space-x-2 z-20">
              {isRecording && (
                <div className="flex items-center space-x-1.5 px-3 py-1 bg-rose-600/90 text-white rounded-full font-bold text-[11px] animate-pulse shadow-lg">
                  <span className="w-2 h-2 rounded-full bg-white animate-ping" />
                  <span>REC {formatRecTime(recordingSeconds)}</span>
                </div>
              )}

              <button
                onClick={handleCaptureSnapshot}
                className="p-2 bg-slate-950/80 hover:bg-slate-800 text-slate-300 hover:text-white rounded-xl border border-slate-700/80 backdrop-blur transition"
                title="Prendre une photo instantanée horodatée"
              >
                <CameraIcon className="w-4 h-4" />
              </button>

              <button
                onClick={() => setIsFullscreen(!isFullscreen)}
                className="p-2 bg-slate-950/80 hover:bg-slate-800 text-slate-300 hover:text-white rounded-xl border border-slate-700/80 backdrop-blur transition"
                title="Plein écran"
              >
                {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
              </button>
            </div>

            {/* AI Bounding Boxes Mock Overlay */}
            {showAIBoundingBox && camera.status === 'Alerte IA' && connectionStatus === 'CONNECTED' && (
              <div className="absolute inset-0 pointer-events-none z-10">
                <div className="absolute top-[28%] left-[36%] w-[24%] h-[48%] border-2 border-rose-500 rounded-lg animate-pulse bg-rose-500/10">
                  <div className="absolute -top-6 left-0 bg-rose-600 text-white px-2 py-0.5 rounded text-[10px] font-bold flex items-center space-x-1 shadow-md">
                    <ShieldAlert className="w-3 h-3" />
                    <span>Intrusion Détectée (98.4%)</span>
                  </div>
                </div>
              </div>
            )}

            {/* Diagnostic Stats Overlay */}
            {showStatsOverlay && (
              <div className="absolute top-16 left-4 z-20 p-3 rounded-2xl bg-slate-950/90 backdrop-blur-md border border-slate-800 text-[10px] font-mono text-slate-300 space-y-1 shadow-2xl max-w-xs pointer-events-none">
                <div className="text-emerald-400 font-bold flex items-center space-x-1">
                  <Activity className="w-3 h-3" />
                  <span>TÉLÉMÉTRIE FLUX TEMPS RÉEL</span>
                </div>
                <div>IP: <span className="text-white font-bold">{camera.ipAddress || '192.168.1.100'}:{camera.port || 554}</span></div>
                <div>Protocole: <span className="text-blue-400 font-bold">{camera.protocol} ({streamProfile})</span></div>
                <div>Codec: <span className="text-white">{camera.codec || 'H.265 / HEVC'}</span> • Transport: <span className="text-white">RTP/TCP</span></div>
                <div>Résolution: <span className="text-white font-bold">{quality}</span> • FPS: <span className="text-emerald-400 font-bold">30.0 fps</span></div>
                <div>Débit Actuel: <span className="text-cyan-400 font-bold">{streamProfile === 'MAIN' ? '4096' : '768'} Kbps</span> (CBR)</div>
                <div>Latence RTT: <span className="text-emerald-400 font-bold">{camera.latencyMs || 85} ms</span> (Jitter: 1.2ms)</div>
                <div>Rétention: <span className="text-amber-400 font-bold">{camera.retentionDays || 30} Jours</span> (Cloud Chiffré)</div>
              </div>
            )}

            {/* Reconnecting Overlay Screen */}
            {connectionStatus === 'RECONNECTING' && (
              <div className="absolute inset-0 bg-slate-950/80 backdrop-blur-sm z-30 flex flex-col items-center justify-center space-y-3">
                <RefreshCw className="w-10 h-10 text-blue-400 animate-spin" />
                <div className="text-center">
                  <div className="font-extrabold text-white text-sm">Négociation du Flux Sécurisé...</div>
                  <div className="text-xs text-slate-400 mt-0.5">Tentative #{reconnectAttempts} avec Backoff Exponentiel</div>
                </div>
              </div>
            )}

            {/* Bottom Floating Control Bar */}
            <div className="absolute bottom-4 left-4 right-4 flex items-center justify-between bg-slate-950/85 backdrop-blur-md px-4 py-2.5 rounded-2xl border border-slate-700/80 z-20">
              
              <div className="flex items-center space-x-2">
                {/* Mute/Audio Button */}
                <button
                  onClick={() => setIsMuted(!isMuted)}
                  className={`p-2 rounded-xl border transition ${
                    !isMuted 
                      ? 'bg-emerald-600 text-white border-emerald-500' 
                      : 'bg-slate-900 text-slate-400 border-slate-700 hover:text-white'
                  }`}
                  title={isMuted ? 'Activer le son du micro caméra' : 'Couper le son'}
                >
                  {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
                </button>

                {/* Talkback Push-to-Talk Intercom */}
                {camera.hasTwoWayTalk && (
                  <button
                    onMouseDown={() => setIsTalking(true)}
                    onMouseUp={() => setIsTalking(false)}
                    onTouchStart={() => setIsTalking(true)}
                    onTouchEnd={() => setIsTalking(false)}
                    className={`px-3 py-1.5 rounded-xl border text-xs font-bold transition flex items-center space-x-1.5 ${
                      isTalking 
                        ? 'bg-rose-600 text-white border-rose-500 animate-pulse' 
                        : 'bg-slate-900 text-slate-300 border-slate-700 hover:text-white'
                    }`}
                    title="Maintenir enfoncé pour parler dans le haut-parleur de la caméra"
                  >
                    {isTalking ? <Mic className="w-3.5 h-3.5" /> : <MicOff className="w-3.5 h-3.5" />}
                    <span className="hidden sm:inline">{isTalking ? 'Micro Enclenché...' : 'Push-to-Talk'}</span>
                  </button>
                )}

                {/* PTZ Toggle */}
                {camera.hasPTZ && (
                  <button
                    onClick={() => setShowPTZControls(!showPTZControls)}
                    className={`px-3 py-1.5 rounded-xl border text-xs font-bold transition flex items-center space-x-1.5 ${
                      showPTZControls 
                        ? 'bg-amber-600 text-white border-amber-500 shadow-md' 
                        : 'bg-slate-900 text-slate-300 border-slate-700 hover:text-white'
                    }`}
                  >
                    <Move className="w-3.5 h-3.5" />
                    <span className="hidden sm:inline">Contrôles PTZ</span>
                  </button>
                )}
              </div>

              <div className="flex items-center space-x-2">
                {/* AI Bounding Boxes Toggle */}
                <button
                  onClick={() => setShowAIBoundingBox(!showAIBoundingBox)}
                  className={`px-3 py-1.5 rounded-xl border text-xs font-bold transition flex items-center space-x-1.5 ${
                    showAIBoundingBox 
                      ? 'bg-purple-600/30 text-purple-300 border-purple-500' 
                      : 'bg-slate-900 text-slate-400 border-slate-700 hover:text-white'
                  }`}
                >
                  <Sparkles className="w-3.5 h-3.5 text-purple-400" />
                  <span className="hidden sm:inline">IA Bounding Box</span>
                </button>

                {/* Manual Record Toggle */}
                <button
                  onClick={handleToggleRecord}
                  className={`px-3.5 py-1.5 rounded-xl border text-xs font-bold transition flex items-center space-x-1.5 ${
                    isRecording 
                      ? 'bg-rose-600 text-white border-rose-500' 
                      : 'bg-slate-900 text-slate-300 border-slate-700 hover:bg-slate-800 hover:text-white'
                  }`}
                >
                  <Circle className={`w-3.5 h-3.5 ${isRecording ? 'fill-white' : 'text-rose-400'}`} />
                  <span>{isRecording ? 'Arrêter REC' : 'Enregistrer'}</span>
                </button>

                {/* Manual Reconnect */}
                <button
                  onClick={handleManualReconnect}
                  disabled={isReconnecting}
                  className="p-2 bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-white rounded-xl border border-slate-700 transition"
                  title="Forcer reconnexion du flux"
                >
                  <RefreshCw className={`w-4 h-4 ${isReconnecting ? 'animate-spin' : ''}`} />
                </button>
              </div>

            </div>

          </div>

          {/* PTZ Interactive Overlay Box (if enabled) */}
          {camera.hasPTZ && showPTZControls && (
            <div className="p-4 bg-slate-900 rounded-3xl border border-slate-800 shadow-xl space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Move className="w-4 h-4 text-amber-400" />
                  <span className="text-xs font-extrabold text-white">
                    Console Joystick & Contrôles Motorisés PTZ
                  </span>
                </div>
                <div className="text-[11px] text-amber-400 font-mono">
                  Pan : {ptzPan}° | Tilt : {ptzTilt}° | Zoom : {ptzZoom}x
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-12 gap-4 items-center">
                
                {/* Virtual Joystick Directional Pad (5 cols) */}
                <div className="sm:col-span-5 flex flex-col items-center justify-center p-3 bg-slate-950 rounded-2xl border border-slate-800">
                  <div className="grid grid-cols-3 gap-2 w-36">
                    <div />
                    <button
                      onClick={() => handlePTZMove('UP')}
                      className="p-3 rounded-xl bg-slate-800 hover:bg-amber-600 text-white flex items-center justify-center transition"
                      title="Incliner vers le haut"
                    >
                      <ChevronUp className="w-5 h-5" />
                    </button>
                    <div />

                    <button
                      onClick={() => handlePTZMove('LEFT')}
                      className="p-3 rounded-xl bg-slate-800 hover:bg-amber-600 text-white flex items-center justify-center transition"
                      title="Pivoter à gauche"
                    >
                      <ChevronLeft className="w-5 h-5" />
                    </button>
                    <button
                      onClick={() => handlePTZMove('RESET')}
                      className="p-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-400 text-[9px] font-bold flex items-center justify-center transition"
                      title="Centrer la caméra"
                    >
                      RESET
                    </button>
                    <button
                      onClick={() => handlePTZMove('RIGHT')}
                      className="p-3 rounded-xl bg-slate-800 hover:bg-amber-600 text-white flex items-center justify-center transition"
                      title="Pivoter à droite"
                    >
                      <ChevronRight className="w-5 h-5" />
                    </button>

                    <div />
                    <button
                      onClick={() => handlePTZMove('DOWN')}
                      className="p-3 rounded-xl bg-slate-800 hover:bg-amber-600 text-white flex items-center justify-center transition"
                      title="Incliner vers le bas"
                    >
                      <ChevronDown className="w-5 h-5" />
                    </button>
                    <div />
                  </div>
                </div>

                {/* Zoom & Presets (7 cols) */}
                <div className="sm:col-span-7 space-y-3">
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => handlePTZMove('ZOOM_IN')}
                      className="flex-1 py-2 px-3 bg-slate-950 hover:bg-slate-800 text-amber-300 font-bold text-xs rounded-xl border border-slate-800 flex items-center justify-center space-x-1.5 transition"
                    >
                      <ZoomIn className="w-4 h-4" />
                      <span>Zoom +</span>
                    </button>
                    <button
                      onClick={() => handlePTZMove('ZOOM_OUT')}
                      className="flex-1 py-2 px-3 bg-slate-950 hover:bg-slate-800 text-amber-300 font-bold text-xs rounded-xl border border-slate-800 flex items-center justify-center space-x-1.5 transition"
                    >
                      <ZoomOut className="w-4 h-4" />
                      <span>Zoom -</span>
                    </button>
                  </div>

                  {/* Quick Presets Jump */}
                  <div>
                    <div className="text-[10px] font-bold text-slate-400 uppercase mb-1.5">
                      Positions Favorites (Presets 1-Clic) :
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      {[
                        { name: 'Quai 1 (Principal)', p: 0, t: 15, z: 1 },
                        { name: 'Zone Caisse & Billets', p: 45, t: -10, z: 2 },
                        { name: 'Barrière Entrée VIP', p: -90, t: 0, z: 3 },
                        { name: 'Vue Panoramique Gare', p: 180, t: 30, z: 1 }
                      ].map((preset, idx) => (
                        <button
                          key={idx}
                          onClick={() => {
                            setPtzPan(preset.p);
                            setPtzTilt(preset.t);
                            setPtzZoom(preset.z);
                            setActivePreset(preset.name);
                          }}
                          className={`p-2 rounded-xl text-left border text-xs font-semibold transition truncate ${
                            activePreset === preset.name
                              ? 'bg-amber-500/20 border-amber-500 text-amber-300'
                              : 'bg-slate-950 border-slate-800 text-slate-300 hover:border-slate-700'
                          }`}
                        >
                          📍 {preset.name}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

              </div>
            </div>
          )}

        </div>
      )}

      {/* Multi-Grid 2x2 or 3x3 Layout */}
      {(gridMode === '2x2' || gridMode === '3x3') && (
        <div className={`grid gap-3 ${
          gridMode === '2x2' ? 'grid-cols-1 sm:grid-cols-2' : 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3'
        }`}>
          {(allCameras.length > 0 ? allCameras : [camera]).slice(0, gridMode === '2x2' ? 4 : 9).map((cam) => (
            <div
              key={cam.id}
              onClick={() => {
                if (onSelectCameraFromGrid) onSelectCameraFromGrid(cam);
                setGridMode('1x1');
              }}
              className="relative aspect-video bg-black rounded-2xl overflow-hidden border border-slate-800 hover:border-blue-500 cursor-pointer shadow-lg group transition"
            >
              <img
                src={cam.streamUrl || 'https://images.unsplash.com/photo-1544620347-c4fd4a3d5957?w=800&auto=format&fit=crop&q=80'}
                alt={cam.name}
                className="w-full h-full object-cover group-hover:scale-105 transition duration-300"
              />

              <div className="absolute top-2 left-2 px-2 py-0.5 bg-slate-950/80 backdrop-blur rounded text-[10px] font-bold text-white flex items-center space-x-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                <span className="truncate max-w-[140px]">{cam.name}</span>
              </div>

              <div className="absolute bottom-2 right-2 px-2 py-0.5 bg-slate-950/80 backdrop-blur rounded text-[9px] font-mono text-blue-400">
                {cam.resolution.split(' ')[0]}
              </div>
            </div>
          ))}
        </div>
      )}

    </div>
  );
};
