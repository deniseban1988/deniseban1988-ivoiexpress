import React, { useState } from 'react';
import { Camera, VisionAlert, CameraRecording, UserRole } from '../../types';
import cctvControlRoomImg from '../../assets/images/cctv_control_room_1786913748181.jpg';
import { 
  Eye, Plus, ShieldCheck, Video, ShieldAlert, Film, Settings, Search, Filter, 
  RefreshCw, CheckCircle2, AlertTriangle, Sparkles, Sliders, Layers, Server, Activity, 
  Lock, ExternalLink, HardDrive, Cpu, Network, Clock, Trash2, Edit3, Check, X,
  Radio, Play, AlertCircle, FileText, ChevronRight
} from 'lucide-react';
import { VideoLivePlayer } from './VideoLivePlayer';
import { AddCameraWizardModal } from './AddCameraWizardModal';
import { CameraQuickConfigModal } from './CameraQuickConfigModal';
import { CameraDiagnosticTestModal } from './CameraDiagnosticTestModal';
import { RecordingsArchiveModal } from './RecordingsArchiveModal';
import { VisionAIModal } from '../ai/VisionAIModal';

interface VisionDashboardProps {
  userRole: UserRole;
  userAgencyId?: string;
  cameras: Camera[];
  alerts: VisionAlert[];
  recordings?: CameraRecording[];
  onAddCamera: (camera: Camera) => void;
  onUpdateCamera: (camera: Camera) => void;
  onDeleteCamera: (cameraId: string) => void;
  onResolveAlert: (alertId: string, status: 'Résolu' | 'Faux Positif') => void;
  onAuditAction?: (action: string, details: string) => void;
}

export const VisionDashboard: React.FC<VisionDashboardProps> = ({
  userRole,
  userAgencyId,
  cameras,
  alerts,
  recordings = [],
  onAddCamera,
  onUpdateCamera,
  onDeleteCamera,
  onResolveAlert,
  onAuditAction
}) => {
  // Navigation Tabs
  const [activeTab, setActiveTab] = useState<'LIVE' | 'CAMERAS' | 'ALERTS' | 'RECORDINGS' | 'DIAGNOSTICS' | 'AUDIT' | 'SUPERVISION'>('LIVE');

  // Selected Camera for Live Viewing
  const [selectedCamera, setSelectedCamera] = useState<Camera | null>(
    cameras.length > 0 ? cameras[0] : null
  );

  // Modals Control
  const [showAddWizard, setShowAddWizard] = useState<boolean>(false);
  const [showArchiveModal, setShowArchiveModal] = useState<boolean>(false);
  const [editingCamera, setEditingCamera] = useState<Camera | null>(null);
  const [diagnosingCamera, setDiagnosingCamera] = useState<Camera | null>(null);
  const [aiModalCamera, setAiModalCamera] = useState<Camera | null>(null);

  // Filters & Search
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [filterType, setFilterType] = useState<string>('ALL');
  const [filterSite, setFilterSite] = useState<string>('ALL');

  // Local Audit Logs Simulation for CCTV Operations
  const [auditLogs, setAuditLogs] = useState<Array<{ id: string; timestamp: string; user: string; action: string; details: string; severity: 'INFO' | 'WARN' | 'CRIT' }>>([
    {
      id: 'log-1',
      timestamp: new Date(Date.now() - 1000 * 60 * 12).toLocaleTimeString(),
      user: 'SuperAdmin IVX',
      action: 'INITIALISATION_FLUX_RTSP',
      details: 'Démarrage du flux sécurisé TLS pour Caméra Quai Principal (192.168.1.101)',
      severity: 'INFO'
    },
    {
      id: 'log-2',
      timestamp: new Date(Date.now() - 1000 * 60 * 45).toLocaleTimeString(),
      user: 'IA Vision Core',
      action: 'DETECTION_INTRUSION_ZONE_RESTREINTE',
      details: 'Alerte déclenchée sur Caméra Hall Central - Indice de confiance 98.4%',
      severity: 'WARN'
    },
    {
      id: 'log-3',
      timestamp: new Date(Date.now() - 1000 * 60 * 120).toLocaleTimeString(),
      user: 'Admin Agence Abidjan',
      action: 'MODIFICATION_RETENTION_CLOUD',
      details: 'Politique de rétention mise à jour à 30 jours pour le site Gare Adjamé',
      severity: 'INFO'
    }
  ]);

  const handleAuditPush = (action: string, details: string, severity: 'INFO' | 'WARN' | 'CRIT' = 'INFO') => {
    const newLog = {
      id: `log-${Date.now()}`,
      timestamp: new Date().toLocaleTimeString(),
      user: userRole === 'SUPER_ADMIN' ? 'SuperAdmin' : userRole === 'ADMIN_AGENCE' ? 'Admin Agence' : 'Voyageur',
      action,
      details,
      severity
    };
    setAuditLogs(prev => [newLog, ...prev]);
    if (onAuditAction) {
      onAuditAction(action, details);
    }
  };

  // Filter Cameras by Role
  const visibleCameras = cameras.filter(cam => {
    if (userRole === 'VOYAGEUR') {
      if (cam.ownerType !== 'Traveler' && cam.ownerType !== 'Global') return false;
    } else if (userRole === 'ADMIN_AGENCE' && userAgencyId) {
      if (cam.agencyId !== userAgencyId && cam.ownerType !== 'Global') return false;
    }

    const matchesSearch = 
      cam.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      cam.locationName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      cam.city.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (cam.brand && cam.brand.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (cam.ipAddress && cam.ipAddress.includes(searchQuery));
    
    const matchesSite = filterSite === 'ALL' || cam.type === filterSite;

    if (filterType === 'ALL') return matchesSearch && matchesSite;
    if (filterType === 'ALERT') return matchesSearch && matchesSite && cam.status === 'Alerte IA';
    if (filterType === 'LIVE') return matchesSearch && matchesSite && cam.status === 'En direct';
    if (filterType === 'PTZ') return matchesSearch && matchesSite && !!cam.hasPTZ;
    return matchesSearch && matchesSite;
  });

  // Filter Alerts
  const visibleAlerts = alerts.filter(alert => {
    if (userRole === 'ADMIN_AGENCE' && userAgencyId && alert.agencyId) {
      return alert.agencyId === userAgencyId;
    }
    return true;
  });

  const activeAlertsCount = visibleAlerts.filter(a => a.status === 'Actif').length;

  const handleToggleCameraEnabled = (cam: Camera) => {
    const nextStatus = cam.isEnabled ? 'Désactivé' as const : 'En direct' as const;
    const updated: Camera = { 
      ...cam, 
      isEnabled: !cam.isEnabled, 
      status: nextStatus 
    };
    onUpdateCamera(updated);
    handleAuditPush(
      updated.isEnabled ? 'ACTIVATION_CAMERA' : 'DESACTIVATION_CAMERA',
      `Caméra "${cam.name}" (${cam.id}) passée à l'état "${nextStatus}"`
    );
  };

  return (
    <div className="space-y-6">
      
      {/* Top Banner & Header with Multi-Screen Surveillance Control Room Background */}
      <div 
        id="cctv-control-center-banner"
        className="bg-slate-900 border border-slate-700/80 rounded-3xl p-6 relative overflow-hidden shadow-2xl group"
      >
        {/* Background photo of CCTV control room with multiple surveillance screens - brightened & clear */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          <img
            id="cctv-control-room-bg-image"
            src={cctvControlRoomImg}
            alt="Salle de surveillance et mur d'écrans de contrôle CCTV"
            className="w-full h-full object-cover object-center opacity-75 group-hover:opacity-85 scale-100 group-hover:scale-105 transition-all duration-700 filter brightness-110 contrast-105"
            referrerPolicy="no-referrer"
          />
          {/* Lighter, translucent gradient overlay to keep text ultra-sharp while displaying the room vividly */}
          <div className="absolute inset-0 bg-gradient-to-r from-slate-950/80 via-slate-900/50 to-slate-900/25" />
          <div className="absolute inset-0 bg-gradient-to-t from-slate-950/60 via-transparent to-black/30" />
        </div>

        {/* Ambient Glow */}
        <div className="absolute top-0 right-0 w-96 h-96 bg-blue-500/20 rounded-full blur-3xl pointer-events-none" />

        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 relative z-10">
          <div>
            <div className="flex items-center space-x-2 text-blue-400 font-bold text-xs uppercase tracking-wider mb-1">
              <Eye className="w-4 h-4" />
              <span>{userRole === 'VOYAGEUR' ? 'Sécurité & Surveillance de vos Espaces' : 'Centre de Contrôle & Supervision Caméras'}</span>
              <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 text-[10px] font-extrabold border border-emerald-500/30 backdrop-blur-xs">
                {userRole === 'VOYAGEUR' ? 'DIRECT SÉCURISÉ' : 'KIT PROFESSIONNEL CCTV V2'}
              </span>
            </div>

            <h1 className="text-2xl font-black text-white drop-shadow-md">
              {userRole === 'VOYAGEUR' ? 'Mes Espaces Surveillés & Bagages' : 'Centre de Contrôle & Supervision Caméras'}
            </h1>
            <p className="text-xs text-slate-300 mt-1 max-w-2xl leading-relaxed drop-shadow">
              {userRole === 'VOYAGEUR' 
                ? 'Accédez en direct aux caméras autorisées, consultez vos enregistrements récents et veillez sur vos bagages et départs en toute sérénité.'
                : 'Assistant d\'ajout universel (ONVIF, RTSP, Wi-Fi, IP), enregistrement chiffré, détection d\'anomalies par IA, joystick PTZ motorisé et diagnostic réseau en temps réel.'}
            </p>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center space-x-3">
            <button
              id="btn-cctv-archive-modal"
              onClick={() => setShowArchiveModal(true)}
              className="px-4 py-2.5 rounded-2xl bg-slate-900/90 hover:bg-slate-800 text-slate-200 font-bold text-xs flex items-center space-x-1.5 transition border border-slate-700/80 backdrop-blur-md shadow-md"
            >
              <Film className="w-4 h-4 text-amber-400" />
              <span>{userRole === 'VOYAGEUR' ? 'Enregistrements' : 'Archives Vidéo'}</span>
            </button>

            <button
              id="btn-cctv-add-wizard"
              onClick={() => setShowAddWizard(true)}
              className="px-5 py-2.5 rounded-2xl bg-blue-600 hover:bg-blue-500 text-white font-extrabold text-xs flex items-center space-x-2 shadow-lg shadow-blue-600/40 transition border border-blue-400/30"
            >
              <Plus className="w-4 h-4" />
              <span>{userRole === 'VOYAGEUR' ? 'Ajouter une Caméra' : 'Ajouter une Caméra (Wizard)'}</span>
            </button>
          </div>
        </div>

        {/* Navigation Tabs Bar */}
        <div className="flex items-center space-x-2 mt-6 pt-4 border-t border-slate-800 text-xs font-bold overflow-x-auto">
          <button
            onClick={() => setActiveTab('LIVE')}
            className={`px-4 py-2 rounded-xl transition flex items-center space-x-2 whitespace-nowrap ${
              activeTab === 'LIVE'
                ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/30'
                : 'text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
          >
            <Video className="w-4 h-4" />
            <span>Flux Direct ({visibleCameras.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('CAMERAS')}
            className={`px-4 py-2 rounded-xl transition flex items-center space-x-2 whitespace-nowrap ${
              activeTab === 'CAMERAS'
                ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/30'
                : 'text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
          >
            <Settings className="w-4 h-4" />
            <span>Gestion du Parc ({visibleCameras.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('ALERTS')}
            className={`px-4 py-2 rounded-xl transition flex items-center space-x-2 whitespace-nowrap relative ${
              activeTab === 'ALERTS'
                ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/30'
                : 'text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
          >
            <ShieldAlert className="w-4 h-4" />
            <span>Alertes IA ({visibleAlerts.length})</span>
            {activeAlertsCount > 0 && (
              <span className="w-5 h-5 rounded-full bg-red-500 text-white text-[10px] font-black flex items-center justify-center animate-pulse">
                {activeAlertsCount}
              </span>
            )}
          </button>

          <button
            onClick={() => setActiveTab('DIAGNOSTICS')}
            className={`px-4 py-2 rounded-xl transition flex items-center space-x-2 whitespace-nowrap ${
              activeTab === 'DIAGNOSTICS'
                ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/30'
                : 'text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
          >
            <Activity className="w-4 h-4" />
            <span>Centre de Diagnostic Réseau</span>
          </button>

          <button
            onClick={() => setActiveTab('AUDIT')}
            className={`px-4 py-2 rounded-xl transition flex items-center space-x-2 whitespace-nowrap ${
              activeTab === 'AUDIT'
                ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/30'
                : 'text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
          >
            <FileText className="w-4 h-4" />
            <span>Journal d'Audit CCTV</span>
          </button>

          {userRole === 'SUPER_ADMIN' && (
            <button
              onClick={() => setActiveTab('SUPERVISION')}
              className={`px-4 py-2 rounded-xl transition flex items-center space-x-2 whitespace-nowrap ${
                activeTab === 'SUPERVISION'
                  ? 'bg-amber-500 text-slate-950 font-black shadow-lg shadow-amber-500/20'
                  : 'text-amber-400 hover:bg-amber-500/10'
              }`}
            >
              <Cpu className="w-4 h-4" />
              <span>Supervision Globale CI</span>
            </button>
          )}
        </div>

      </div>

      {/* Security & Multi-tenant Privacy Guarantee */}
      <div className="bg-slate-950 p-3.5 rounded-2xl border border-slate-800 flex items-center justify-between text-xs">
        <div className="flex items-center space-x-2.5 text-slate-300">
          <ShieldCheck className="w-4 h-4 text-emerald-400" />
          <span>
            <strong>Sécurité Multi-Tenant & Chiffrement :</strong> Flux isolés par agence, authentification TLS 1.3 / AES-256 et masquage strict des identifiants opérateurs.
          </span>
        </div>
        <span className="text-[10px] font-mono text-emerald-400 font-bold bg-emerald-500/10 px-2.5 py-1 rounded-lg border border-emerald-500/20">
          CONFORME ISO/IEC 27001
        </span>
      </div>

      {/* ==================== TAB 1: LIVE PLAYER & GRID ==================== */}
      {activeTab === 'LIVE' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          
          {/* Main Video Stream Player (8 cols) */}
          <div className="lg:col-span-8 space-y-4">
            {selectedCamera ? (
              <VideoLivePlayer
                camera={selectedCamera}
                allCameras={visibleCameras}
                onAnalyzeAI={(cam) => setAiModalCamera(cam)}
                onSelectCameraFromGrid={(cam) => setSelectedCamera(cam)}
                onStartManualRecord={(cam) => handleAuditPush('ENREGISTREMENT_MANUEL_DEMARRE', `Enregistrement manuel déclenché sur ${cam.name}`)}
              />
            ) : (
              <div className="bg-slate-900 border border-slate-800 rounded-3xl p-12 text-center text-slate-400 text-xs">
                <Video className="w-12 h-12 mx-auto text-slate-600 mb-3" />
                <p className="font-bold text-white text-sm">Aucune caméra sélectionnée</p>
                <p className="mt-1">Cliquez sur une caméra de la liste ci-contre ou ajoutez-en une nouvelle.</p>
              </div>
            )}
          </div>

          {/* Camera Selection List & Filters (4 cols) */}
          <div className="lg:col-span-4 space-y-3">
            
            <div className="bg-slate-900 p-4 rounded-2xl border border-slate-800 space-y-3">
              <div className="relative">
                <Search className="w-4 h-4 text-slate-500 absolute left-3 top-2.5" />
                <input
                  type="text"
                  placeholder="Rechercher par nom, lieu, IP..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full bg-slate-950 text-white text-xs pl-9 pr-3 py-2 rounded-xl border border-slate-800 focus:outline-none focus:border-blue-500"
                />
              </div>

              <div className="grid grid-cols-3 gap-1 text-[10px]">
                <button
                  onClick={() => setFilterType('ALL')}
                  className={`py-1 rounded-lg border font-bold text-center transition ${
                    filterType === 'ALL' ? 'bg-blue-600 text-white border-blue-500' : 'bg-slate-950 text-slate-400 border-slate-800'
                  }`}
                >
                  Toutes ({visibleCameras.length})
                </button>
                <button
                  onClick={() => setFilterType('ALERT')}
                  className={`py-1 rounded-lg border font-bold text-center transition ${
                    filterType === 'ALERT' ? 'bg-rose-600 text-white border-rose-500' : 'bg-slate-950 text-slate-400 border-slate-800'
                  }`}
                >
                  Alertes IA
                </button>
                <button
                  onClick={() => setFilterType('PTZ')}
                  className={`py-1 rounded-lg border font-bold text-center transition ${
                    filterType === 'PTZ' ? 'bg-amber-600 text-white border-amber-500' : 'bg-slate-950 text-slate-400 border-slate-800'
                  }`}
                >
                  PTZ Motorisées
                </button>
              </div>
            </div>

            {/* Camera Cards List */}
            <div className="space-y-2 overflow-y-auto max-h-[560px] pr-1">
              {visibleCameras.map(cam => (
                <div
                  key={cam.id}
                  onClick={() => setSelectedCamera(cam)}
                  className={`p-3 rounded-2xl border cursor-pointer transition flex items-center justify-between ${
                    selectedCamera?.id === cam.id
                      ? 'bg-blue-600/10 border-blue-500 ring-2 ring-blue-500/20'
                      : 'bg-slate-900 border-slate-800 hover:border-slate-700'
                  }`}
                >
                  <div className="flex items-center space-x-3 min-w-0">
                    <div className="w-14 h-11 rounded-xl overflow-hidden bg-black flex-shrink-0 relative">
                      <img src={cam.streamUrl || 'https://images.unsplash.com/photo-1544620347-c4fd4a3d5957?auto=format&fit=crop&w=800&q=80'} alt={cam.name} className="w-full h-full object-cover" />
                      {cam.status === 'Alerte IA' && (
                        <div className="absolute inset-0 bg-red-500/40 animate-pulse" />
                      )}
                      {cam.hasPTZ && (
                        <span className="absolute bottom-0.5 right-0.5 px-1 bg-amber-500 text-slate-950 text-[8px] font-black rounded">
                          PTZ
                        </span>
                      )}
                    </div>

                    <div className="min-w-0 text-xs">
                      <h4 className="font-bold text-white truncate">{cam.name}</h4>
                      <p className="text-[10px] text-slate-400 truncate">{cam.locationName} ({cam.city})</p>
                      <span className="text-[9px] text-slate-500 font-mono">
                        {cam.ipAddress || '192.168.1.100'} • {cam.protocol}
                      </span>
                    </div>
                  </div>

                  <div className="text-right flex-shrink-0 ml-2 space-y-1">
                    <span className={`px-2 py-0.5 rounded text-[9px] font-extrabold uppercase block ${
                      cam.status === 'Alerte IA'
                        ? 'bg-red-500/20 text-red-400 border border-red-500/30'
                        : cam.isEnabled
                        ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                        : 'bg-slate-800 text-slate-400 border border-slate-700'
                    }`}>
                      {cam.status}
                    </span>
                    <div className="flex items-center justify-end space-x-1">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setEditingCamera(cam);
                        }}
                        className="p-1 rounded bg-slate-800 hover:bg-blue-600 text-slate-300 hover:text-white transition"
                        title="Configuration rapide"
                      >
                        <Sliders className="w-3 h-3" />
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setDiagnosingCamera(cam);
                        }}
                        className="p-1 rounded bg-slate-800 hover:bg-emerald-600 text-slate-300 hover:text-white transition"
                        title="Lancer le diagnostic"
                      >
                        <Activity className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>

          </div>

        </div>
      )}

      {/* ==================== TAB 2: PARC DES CAMÉRAS & GESTION TECHNIQUE ==================== */}
      {activeTab === 'CAMERAS' && (
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h2 className="text-lg font-extrabold text-white">Parc des Caméras de Vidéosurveillance</h2>
              <p className="text-xs text-slate-400">Inventaire complet, état du matériel, adresses IP, codecs et options de pilotage</p>
            </div>

            <button
              onClick={() => setShowAddWizard(true)}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs rounded-xl flex items-center space-x-2 shadow-lg shadow-blue-600/30 transition self-start sm:self-auto"
            >
              <Plus className="w-4 h-4" />
              <span>Nouvelle Caméra</span>
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-slate-800 text-slate-400 uppercase text-[10px] font-extrabold">
                  <th className="pb-3 px-3">Caméra / Site</th>
                  <th className="pb-3 px-3">Matériel / Marque</th>
                  <th className="pb-3 px-3">Réseau & Protocole</th>
                  <th className="pb-3 px-3">Flux & Codec</th>
                  <th className="pb-3 px-3">Options & IA</th>
                  <th className="pb-3 px-3">Statut</th>
                  <th className="pb-3 px-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {visibleCameras.map(cam => (
                  <tr key={cam.id} className="hover:bg-slate-800/30 transition">
                    <td className="py-3.5 px-3">
                      <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 rounded-xl overflow-hidden bg-black flex-shrink-0">
                          <img src={cam.streamUrl || 'https://images.unsplash.com/photo-1544620347-c4fd4a3d5957?w=800'} alt={cam.name} className="w-full h-full object-cover" />
                        </div>
                        <div>
                          <div className="font-bold text-white">{cam.name}</div>
                          <div className="text-[11px] text-slate-400">{cam.locationName} • {cam.city}</div>
                          <div className="text-[9px] text-slate-500 font-mono">{cam.id}</div>
                        </div>
                      </div>
                    </td>

                    <td className="py-3.5 px-3">
                      <div className="text-slate-300 font-medium">{cam.brand || 'Hikvision'}</div>
                      <div className="text-[10px] text-slate-500">{cam.model || 'IP Bullet 4K'}</div>
                      <div className="text-[9px] text-blue-400 font-mono">{cam.technology}</div>
                    </td>

                    <td className="py-3.5 px-3">
                      <div className="text-emerald-400 font-mono font-bold">{cam.ipAddress || '192.168.1.100'}:{cam.port || 554}</div>
                      <div className="text-[10px] text-slate-400">{cam.protocol} (TLS 1.3)</div>
                    </td>

                    <td className="py-3.5 px-3">
                      <div className="text-white font-medium">{cam.resolution}</div>
                      <div className="text-[10px] text-slate-400">{cam.codec || 'H.265'} • {cam.fps || 30} FPS</div>
                      <div className="text-[9px] text-slate-500 font-mono">{cam.bitrateKbps || 4096} Kbps</div>
                    </td>

                    <td className="py-3.5 px-3">
                      <div className="flex flex-wrap gap-1">
                        {cam.hasPTZ && (
                          <span className="px-1.5 py-0.5 bg-amber-500/20 text-amber-300 rounded text-[9px] font-bold">PTZ</span>
                        )}
                        {cam.hasAudio && (
                          <span className="px-1.5 py-0.5 bg-blue-500/20 text-blue-300 rounded text-[9px] font-bold">Audio</span>
                        )}
                        {cam.hasTwoWayTalk && (
                          <span className="px-1.5 py-0.5 bg-emerald-500/20 text-emerald-300 rounded text-[9px] font-bold">Talkback</span>
                        )}
                        <span className="px-1.5 py-0.5 bg-purple-500/20 text-purple-300 rounded text-[9px] font-bold">
                          {cam.aiDetectionRules?.length || 3} IA
                        </span>
                      </div>
                    </td>

                    <td className="py-3.5 px-3">
                      <span className={`px-2.5 py-1 rounded-full text-[10px] font-extrabold uppercase inline-block ${
                        cam.status === 'Alerte IA'
                          ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30 animate-pulse'
                          : cam.isEnabled
                          ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                          : 'bg-slate-800 text-slate-400 border border-slate-700'
                      }`}>
                        {cam.status}
                      </span>
                    </td>

                    <td className="py-3.5 px-3 text-right">
                      <div className="flex items-center justify-end space-x-1.5">
                        <button
                          onClick={() => {
                            setSelectedCamera(cam);
                            setActiveTab('LIVE');
                          }}
                          className="p-1.5 bg-slate-800 hover:bg-blue-600 text-slate-300 hover:text-white rounded-lg transition"
                          title="Ouvrir le flux en direct"
                        >
                          <Play className="w-3.5 h-3.5" />
                        </button>

                        <button
                          onClick={() => setDiagnosingCamera(cam)}
                          className="p-1.5 bg-slate-800 hover:bg-emerald-600 text-slate-300 hover:text-white rounded-lg transition"
                          title="Lancer le diagnostic de connexion"
                        >
                          <Activity className="w-3.5 h-3.5" />
                        </button>

                        <button
                          onClick={() => setEditingCamera(cam)}
                          className="p-1.5 bg-slate-800 hover:bg-amber-600 text-slate-300 hover:text-white rounded-lg transition"
                          title="Modifier la configuration"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                        </button>

                        <button
                          onClick={() => handleToggleCameraEnabled(cam)}
                          className={`p-1.5 rounded-lg transition ${
                            cam.isEnabled 
                              ? 'bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500/30' 
                              : 'bg-slate-800 text-slate-500 hover:text-slate-300'
                          }`}
                          title={cam.isEnabled ? 'Désactiver' : 'Activer'}
                        >
                          <Check className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ==================== TAB 3: ALERTES IA ==================== */}
      {activeTab === 'ALERTS' && (
        <div className="space-y-4">
          <div className="bg-slate-900 p-5 rounded-3xl border border-slate-800 flex items-center justify-between">
            <div>
              <h2 className="text-lg font-extrabold text-white">Registre des Alertes Sécurité Intelligentes</h2>
              <p className="text-xs text-slate-400">Événements analysés et qualifiés par l'AI Core IVOIReXpress Vision</p>
            </div>
            <span className="px-3 py-1 rounded-xl bg-red-500/20 border border-red-500/30 text-red-400 text-xs font-bold">
              {activeAlertsCount} alerte(s) active(s)
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {visibleAlerts.map(alert => (
              <div
                key={alert.id}
                className={`p-5 rounded-3xl border text-xs space-y-3 transition relative ${
                  alert.status === 'Actif'
                    ? 'bg-slate-900 border-red-500/50 ring-1 ring-red-500/20'
                    : 'bg-slate-950 border-slate-800'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className={`px-2.5 py-0.5 rounded-lg text-[10px] font-black uppercase ${
                    alert.severity === 'Critique'
                      ? 'bg-red-500/20 text-red-400 border border-red-500/30'
                      : 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                  }`}>
                    {alert.severity} • {alert.alertType}
                  </span>
                  <span className="text-[10px] text-slate-500 font-mono">{alert.timestamp}</span>
                </div>

                <div>
                  <h4 className="font-extrabold text-white text-sm">{alert.cameraName}</h4>
                  <p className="text-slate-400 text-xs mt-0.5">{alert.locationName}</p>
                </div>

                {alert.imageUrl && (
                  <div className="rounded-xl overflow-hidden aspect-video bg-black border border-slate-800">
                    <img src={alert.imageUrl || 'https://images.unsplash.com/photo-1544620347-c4fd4a3d5957?auto=format&fit=crop&w=800&q=80'} alt={alert.alertType} className="w-full h-full object-cover" />
                  </div>
                )}

                <p className="text-slate-300 leading-relaxed bg-slate-950 p-3 rounded-xl border border-slate-800">
                  {alert.description}
                </p>

                {alert.status === 'Actif' ? (
                  <div className="flex space-x-2 pt-1">
                    <button
                      onClick={() => onResolveAlert(alert.id, 'Résolu')}
                      className="flex-1 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs"
                    >
                      Marquer comme Traité
                    </button>
                    <button
                      onClick={() => onResolveAlert(alert.id, 'Faux Positif')}
                      className="py-2 px-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs"
                    >
                      Faux Positif
                    </button>
                  </div>
                ) : (
                  <div className="text-emerald-400 font-bold text-[11px] flex items-center space-x-1 pt-1">
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Alerte clôturée ({alert.status})</span>
                  </div>
                )}

              </div>
            ))}
          </div>
        </div>
      )}

      {/* ==================== TAB 4: DIAGNOSTICS RÉSEAU ==================== */}
      {activeTab === 'DIAGNOSTICS' && (
        <div className="space-y-4">
          <div className="bg-slate-900 p-5 rounded-3xl border border-slate-800 flex items-center justify-between">
            <div>
              <h2 className="text-lg font-extrabold text-white">Centre de Diagnostic & Test de Flux</h2>
              <p className="text-xs text-slate-400">Vérification de connectivité IP, négociation RTSP/ONVIF, gigue réseau et armement IA</p>
            </div>
            <span className="px-3 py-1 rounded-xl bg-blue-500/20 text-blue-300 border border-blue-500/30 text-xs font-bold">
              {visibleCameras.length} caméras prêtes au test
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {visibleCameras.map(cam => (
              <div key={cam.id} className="p-4 bg-slate-900 border border-slate-800 rounded-2xl space-y-3">
                <div className="flex items-start justify-between">
                  <div>
                    <h4 className="font-bold text-white text-xs">{cam.name}</h4>
                    <p className="text-[10px] text-slate-400">{cam.locationName}</p>
                    <p className="text-[10px] text-emerald-400 font-mono">{cam.ipAddress || '192.168.1.100'}:{cam.port || 554}</p>
                  </div>
                  <span className="px-2 py-0.5 rounded text-[9px] font-bold bg-slate-800 text-slate-300">
                    {cam.protocol}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-2 text-[10px] bg-slate-950 p-2.5 rounded-xl border border-slate-800">
                  <div>Latence : <span className="text-emerald-400 font-bold">{cam.latencyMs || 85}ms</span></div>
                  <div>Framerate : <span className="text-blue-400 font-bold">{cam.fps || 30} FPS</span></div>
                  <div>Résolution : <span className="text-slate-300 font-bold">{cam.resolution.split(' ')[0]}</span></div>
                  <div>Codec : <span className="text-cyan-400 font-bold">{cam.codec || 'H.265'}</span></div>
                </div>

                <button
                  onClick={() => setDiagnosingCamera(cam)}
                  className="w-full py-2 bg-emerald-600/20 hover:bg-emerald-600 text-emerald-300 hover:text-white font-bold rounded-xl text-xs border border-emerald-500/30 flex items-center justify-center space-x-1.5 transition"
                >
                  <Activity className="w-3.5 h-3.5" />
                  <span>Lancer Test Intégral 6 Étapes</span>
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ==================== TAB 5: JOURNAL D'AUDIT CCTV ==================== */}
      {activeTab === 'AUDIT' && (
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-extrabold text-white">Journal d'Audit Sécurisé CCTV</h2>
              <p className="text-xs text-slate-400">Traçabilité inaltérable des flux consultés, des modifications et des alertes sécurité</p>
            </div>
            <span className="px-3 py-1 bg-slate-800 rounded-xl text-slate-300 text-xs font-mono font-bold">
              {auditLogs.length} événements enregistrés
            </span>
          </div>

          <div className="divide-y divide-slate-800 space-y-2">
            {auditLogs.map(log => (
              <div key={log.id} className="pt-2 flex items-start justify-between text-xs">
                <div className="flex items-start space-x-3">
                  <span className={`w-2 h-2 rounded-full mt-1.5 ${
                    log.severity === 'CRIT' ? 'bg-rose-500' : log.severity === 'WARN' ? 'bg-amber-500' : 'bg-blue-500'
                  }`} />
                  <div>
                    <div className="font-bold text-white flex items-center space-x-2">
                      <span>{log.action}</span>
                      <span className="text-[10px] text-slate-500 font-mono">par {log.user}</span>
                    </div>
                    <div className="text-[11px] text-slate-400 mt-0.5">{log.details}</div>
                  </div>
                </div>
                <div className="text-[10px] text-slate-500 font-mono whitespace-nowrap ml-4">
                  {log.timestamp}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ==================== TAB 6: SUPERVISION GLOBALE (SUPER ADMIN) ==================== */}
      {activeTab === 'SUPERVISION' && userRole === 'SUPER_ADMIN' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
            <div className="bg-slate-900 p-5 rounded-3xl border border-slate-800">
              <span className="text-[11px] font-bold text-slate-400 block mb-1">Caméras Connectées</span>
              <span className="text-2xl font-black text-white">142</span>
              <span className="text-[10px] text-emerald-400 block mt-1">98.5% de disponibilité</span>
            </div>
            <div className="bg-slate-900 p-5 rounded-3xl border border-slate-800">
              <span className="text-[11px] font-bold text-slate-400 block mb-1">Bande Passante Réseau</span>
              <span className="text-2xl font-black text-blue-400">2.4 Gbps</span>
              <span className="text-[10px] text-slate-400 block mt-1">Flux chiffrés TLS 1.3</span>
            </div>
            <div className="bg-slate-900 p-5 rounded-3xl border border-slate-800">
              <span className="text-[11px] font-bold text-slate-400 block mb-1">Latence Moyenne</span>
              <span className="text-2xl font-black text-emerald-400">115 ms</span>
              <span className="text-[10px] text-slate-400 block mt-1">Serveurs Cloud Abidjan</span>
            </div>
            <div className="bg-slate-900 p-5 rounded-3xl border border-slate-800">
              <span className="text-[11px] font-bold text-slate-400 block mb-1">Détections IA Aujourd'hui</span>
              <span className="text-2xl font-black text-amber-400">28</span>
              <span className="text-[10px] text-slate-400 block mt-1">Analyse Gemini 3.6 Flash</span>
            </div>
          </div>
        </div>
      )}

      {/* ==================== ALL ACTIVE MODALS ==================== */}
      
      {/* 1. Add Camera Wizard 10 Steps */}
      {showAddWizard && (
        <AddCameraWizardModal
          ownerType={userRole === 'VOYAGEUR' ? 'Traveler' : userRole === 'ADMIN_AGENCE' ? 'Agency' : 'Global'}
          agencyId={userAgencyId}
          onAddCamera={(newCam) => {
            onAddCamera(newCam);
            handleAuditPush('AJOUT_CAMERA', `Nouvelle caméra ajoutée : ${newCam.name} (${newCam.ipAddress || 'IP Auto'})`);
            setShowAddWizard(false);
          }}
          onClose={() => setShowAddWizard(false)}
        />
      )}

      {/* 2. Quick Config Modal */}
      {editingCamera && (
        <CameraQuickConfigModal
          camera={editingCamera}
          onUpdateCamera={(updated) => {
            onUpdateCamera(updated);
            if (selectedCamera?.id === updated.id) setSelectedCamera(updated);
            setEditingCamera(null);
          }}
          onDeleteCamera={(camId) => {
            onDeleteCamera(camId);
            if (selectedCamera?.id === camId) {
              const remaining = visibleCameras.filter(c => c.id !== camId);
              setSelectedCamera(remaining.length > 0 ? remaining[0] : null);
            }
            setEditingCamera(null);
          }}
          onClose={() => setEditingCamera(null)}
          onAuditAction={handleAuditPush}
        />
      )}

      {/* 3. Diagnostic Test Modal */}
      {diagnosingCamera && (
        <CameraDiagnosticTestModal
          camera={diagnosingCamera}
          onClose={() => setDiagnosingCamera(null)}
        />
      )}

      {/* 4. Recordings Archive Modal */}
      {showArchiveModal && (
        <RecordingsArchiveModal
          recordings={recordings}
          onClose={() => setShowArchiveModal(false)}
        />
      )}

      {/* 5. Vision AI Modal */}
      {aiModalCamera && (
        <VisionAIModal
          camera={aiModalCamera}
          onClose={() => setAiModalCamera(null)}
        />
      )}

    </div>
  );
};
