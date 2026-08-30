import React, { useState } from 'react';
import { Camera, AIModelDetection, CameraCategoryType, CameraTechnology, CameraProtocol } from '../../types';
import { CameraManufacturer, CameraVideoCodec, CameraAudioCodec } from '../../types/vision';
import { 
  X, Check, Sliders, Shield, Network, Video, Volume2, Move, 
  HardDrive, Sparkles, Lock, Eye, EyeOff, Save, Trash2, AlertCircle, Info 
} from 'lucide-react';

interface CameraQuickConfigModalProps {
  camera: Camera;
  onUpdateCamera: (updatedCamera: Camera) => void;
  onDeleteCamera?: (cameraId: string) => void;
  onClose: () => void;
  onAuditAction?: (action: string, details: string) => void;
}

export const CameraQuickConfigModal: React.FC<CameraQuickConfigModalProps> = ({
  camera,
  onUpdateCamera,
  onDeleteCamera,
  onClose,
  onAuditAction
}) => {
  const [activeTab, setActiveTab] = useState<'GENERAL' | 'NETWORK' | 'VIDEO' | 'AUDIO' | 'MOTION' | 'PTZ' | 'STORAGE'>('GENERAL');

  // General state
  const [name, setName] = useState<string>(camera.name);
  const [description, setDescription] = useState<string>(camera.description || '');
  const [locationName, setLocationName] = useState<string>(camera.locationName);
  const [siteName, setSiteName] = useState<string>(camera.siteName || '');
  const [building, setBuilding] = useState<string>(camera.building || 'Bâtiment Principal');
  const [floor, setFloor] = useState<string>(camera.floor || 'RDC');
  const [zone, setZone] = useState<string>(camera.zone || 'Hall');
  const [type, setType] = useState<CameraCategoryType>(camera.type);
  const [brand, setBrand] = useState<string>(camera.brand || 'Hikvision');
  const [model, setModel] = useState<string>(camera.model || 'IP Camera 4K');
  const [serialNumber, setSerialNumber] = useState<string>(camera.serialNumber || 'SN-DEFAULT');
  const [isEnabled, setIsEnabled] = useState<boolean>(camera.isEnabled);

  // Network state
  const [ipAddress, setIpAddress] = useState<string>(camera.ipAddress || '192.168.1.100');
  const [port, setPort] = useState<number>(camera.port || 554);
  const [protocol, setProtocol] = useState<CameraProtocol>(camera.protocol);
  const [username, setUsername] = useState<string>(camera.username || 'admin');
  const [newPassword, setNewPassword] = useState<string>('');
  const [showPassword, setShowPassword] = useState<boolean>(false);

  // Video state
  const [streamUrl, setStreamUrl] = useState<string>(camera.streamUrl);
  const [substreamUrl, setSubstreamUrl] = useState<string>(camera.substreamUrl || '');
  const [resolution, setResolution] = useState<'4K Ultra HD' | '1080p HD Night Vision' | '720p HD' | '480p Éco'>(camera.resolution);
  const [fps, setFps] = useState<number>(camera.fps || 30);
  const [bitrateKbps, setBitrateKbps] = useState<number>(camera.bitrateKbps || 4096);
  const [codec, setCodec] = useState<string>(camera.codec || 'H.265 / HEVC');

  // Audio state
  const [hasAudio, setHasAudio] = useState<boolean>(camera.hasAudio !== false);
  const [hasTwoWayTalk, setHasTwoWayTalk] = useState<boolean>(camera.hasTwoWayTalk || false);

  // Motion & AI
  const [sensitivity, setSensitivity] = useState<'Haute' | 'Moyenne' | 'Basse'>(camera.sensitivity);
  const [recordOnEvent, setRecordOnEvent] = useState<boolean>(camera.recordOnEvent !== false);
  const [aiDetectionRules, setAiDetectionRules] = useState<AIModelDetection[]>(
    camera.aiDetectionRules || ['Mouvement', 'Intrusion Zone Sécurisée', 'Présence Humaine']
  );

  // PTZ
  const [hasPTZ, setHasPTZ] = useState<boolean>(camera.hasPTZ || false);

  // Storage
  const [continuousRecord, setContinuousRecord] = useState<boolean>(camera.continuousRecord || false);
  const [retentionDays, setRetentionDays] = useState<number>(camera.retentionDays || 30);

  const handleToggleAIRule = (rule: AIModelDetection) => {
    setAiDetectionRules(prev => 
      prev.includes(rule) ? prev.filter(r => r !== rule) : [...prev, rule]
    );
  };

  const handleSave = () => {
    const updated: Camera = {
      ...camera,
      name,
      description,
      locationName,
      siteName,
      building,
      floor,
      zone,
      type,
      brand,
      model,
      serialNumber,
      isEnabled,
      ipAddress,
      port,
      protocol,
      username,
      streamUrl,
      substreamUrl,
      resolution,
      fps,
      bitrateKbps,
      codec,
      hasAudio,
      hasTwoWayTalk,
      sensitivity,
      recordOnEvent,
      aiDetectionRules,
      hasPTZ,
      continuousRecord,
      retentionDays,
      updatedAt: new Date().toISOString().substring(0, 10)
    };

    onUpdateCamera(updated);

    if (onAuditAction) {
      onAuditAction(
        'MODIFICATION_CONFIGURATION_CAMÉRA',
        `Paramètres de la caméra ${updated.name} mis à jour (IP: ${updated.ipAddress}, Résolution: ${updated.resolution}, Rétention: ${updated.retentionDays}j)`
      );
    }

    onClose();
  };

  const handleDelete = () => {
    if (confirm(`Êtes-vous sûr de vouloir supprimer définitivement la caméra "${camera.name}" ? Cette action est irréversible.`)) {
      if (onDeleteCamera) onDeleteCamera(camera.id);
      if (onAuditAction) {
        onAuditAction('SUPPRESSION_CAMÉRA_SURVEILLANCE', `Caméra ${camera.name} (${camera.id}) supprimée du système.`);
      }
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-3 sm:p-6 overflow-y-auto">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-3xl w-full p-5 sm:p-7 shadow-2xl relative my-auto max-h-[92vh] flex flex-col">
        
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-800">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-2xl bg-blue-600/20 border border-blue-500/30 flex items-center justify-center text-blue-400">
              <Sliders className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="text-[10px] font-extrabold uppercase tracking-wider text-blue-400">
                  Édition & Configuration Avancée
                </span>
                <span className="px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 text-[10px] font-bold font-mono">
                  ID: {camera.id}
                </span>
              </div>
              <h2 className="text-lg font-black text-white">{camera.name}</h2>
            </div>
          </div>

          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-2 rounded-xl bg-slate-800/80 hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Selection Bar */}
        <div className="flex space-x-1 py-3 overflow-x-auto border-b border-slate-800 text-xs font-bold">
          {[
            { id: 'GENERAL', label: 'Général', icon: Info },
            { id: 'NETWORK', label: 'Réseau & Sécurité', icon: Network },
            { id: 'VIDEO', label: 'Flux Vidéo', icon: Video },
            { id: 'AUDIO', label: 'Audio & Intercom', icon: Volume2 },
            { id: 'MOTION', label: 'IA & Mouvement', icon: Sparkles },
            { id: 'PTZ', label: 'Motorisation PTZ', icon: Move },
            { id: 'STORAGE', label: 'Stockage & Rétention', icon: HardDrive }
          ].map((tab) => {
            const Icon = tab.icon;
            const active = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`px-3 py-2 rounded-xl border flex items-center space-x-1.5 whitespace-nowrap transition ${
                  active
                    ? 'bg-blue-600 text-white border-blue-500 shadow-md'
                    : 'bg-slate-950/60 text-slate-400 border-slate-800 hover:text-slate-200'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* Tab Content Body */}
        <div className="flex-1 overflow-y-auto py-4 space-y-4 pr-1 text-xs">
          
          {/* TAB 1: GENERAL */}
          {activeTab === 'GENERAL' && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-slate-300 font-bold mb-1">Nom usuel</label>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2.5 text-white font-medium focus:border-blue-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-slate-300 font-bold mb-1">Emplacement affiché</label>
                  <input
                    type="text"
                    value={locationName}
                    onChange={(e) => setLocationName(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2.5 text-white font-medium focus:border-blue-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-slate-300 font-bold mb-1">Catégorie de Site</label>
                  <select
                    value={type}
                    onChange={(e) => setType(e.target.value as any)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2.5 text-white font-medium"
                  >
                    <option value="Gare Routière">Gare Routière</option>
                    <option value="Quai d'Embarquement">Quai d'Embarquement</option>
                    <option value="Entrée Agence">Entrée Agence</option>
                    <option value="Parking">Parking</option>
                    <option value="Hôtel">Hôtel</option>
                    <option value="Résidence Privée">Résidence Privée</option>
                    <option value="Autocar">Autocar</option>
                  </select>
                </div>

                <div>
                  <label className="block text-slate-300 font-bold mb-1">Marque / Fabricant</label>
                  <input
                    type="text"
                    value={brand}
                    onChange={(e) => setBrand(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2.5 text-white font-medium"
                  />
                </div>

                <div>
                  <label className="block text-slate-300 font-bold mb-1">Modèle</label>
                  <input
                    type="text"
                    value={model}
                    onChange={(e) => setModel(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2.5 text-white font-medium"
                  />
                </div>

                <div>
                  <label className="block text-slate-300 font-bold mb-1">Numéro de Série</label>
                  <input
                    type="text"
                    value={serialNumber}
                    onChange={(e) => setSerialNumber(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2.5 text-slate-300 font-mono"
                  />
                </div>
              </div>

              <div className="flex items-center justify-between p-3 bg-slate-950 rounded-2xl border border-slate-800">
                <div>
                  <div className="font-bold text-white">État de la Caméra</div>
                  <div className="text-[11px] text-slate-400">Activer ou désactiver l'acquisition de ce flux</div>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={isEnabled}
                    onChange={(e) => setIsEnabled(e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-slate-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-500"></div>
                </label>
              </div>
            </div>
          )}

          {/* TAB 2: NETWORK */}
          {activeTab === 'NETWORK' && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-slate-300 font-bold mb-1">Adresse IP</label>
                  <input
                    type="text"
                    value={ipAddress}
                    onChange={(e) => setIpAddress(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white font-mono font-bold"
                  />
                </div>

                <div>
                  <label className="block text-slate-300 font-bold mb-1">Port</label>
                  <input
                    type="number"
                    value={port}
                    onChange={(e) => setPort(Number(e.target.value))}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white font-mono"
                  />
                </div>

                <div>
                  <label className="block text-slate-300 font-bold mb-1">Protocole</label>
                  <select
                    value={protocol}
                    onChange={(e) => setProtocol(e.target.value as CameraProtocol)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white font-medium"
                  >
                    <option value="ONVIF">ONVIF</option>
                    <option value="RTSP">RTSP</option>
                    <option value="HTTP-FLV">HTTP-FLV / HLS</option>
                    <option value="WebRTC">WebRTC</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                <div>
                  <label className="block text-slate-300 font-bold mb-1">Identifiant Opérateur</label>
                  <input
                    type="text"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white font-medium"
                  />
                </div>

                <div>
                  <label className="block text-slate-300 font-bold mb-1">Modifier Mot de Passe (Optionnel)</label>
                  <div className="relative">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      placeholder="Laisser vide pour conserver le mot de passe actuel"
                      className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 pr-9 text-white font-mono text-xs"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-2.5 top-2.5 text-slate-400 hover:text-white"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: VIDEO */}
          {activeTab === 'VIDEO' && (
            <div className="space-y-4">
              <div>
                <label className="block text-slate-300 font-bold mb-1">URL Flux Principal (Main Stream)</label>
                <input
                  type="text"
                  value={streamUrl}
                  onChange={(e) => setStreamUrl(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2.5 text-blue-400 font-mono text-xs"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-bold mb-1">URL Sous-Flux (Sub-stream)</label>
                <input
                  type="text"
                  value={substreamUrl}
                  onChange={(e) => setSubstreamUrl(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2.5 text-emerald-400 font-mono text-xs"
                />
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2">
                <div>
                  <label className="block text-slate-300 font-bold mb-1">Résolution</label>
                  <select
                    value={resolution}
                    onChange={(e) => setResolution(e.target.value as any)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white font-medium"
                  >
                    <option value="4K Ultra HD">4K Ultra HD</option>
                    <option value="1080p HD Night Vision">1080p Full HD</option>
                    <option value="720p HD">720p HD</option>
                    <option value="480p Éco">480p SD</option>
                  </select>
                </div>

                <div>
                  <label className="block text-slate-300 font-bold mb-1">FPS</label>
                  <select
                    value={fps}
                    onChange={(e) => setFps(Number(e.target.value))}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white font-medium"
                  >
                    <option value={15}>15 FPS</option>
                    <option value={25}>25 FPS</option>
                    <option value={30}>30 FPS</option>
                    <option value={60}>60 FPS</option>
                  </select>
                </div>

                <div>
                  <label className="block text-slate-300 font-bold mb-1">Bitrate</label>
                  <select
                    value={bitrateKbps}
                    onChange={(e) => setBitrateKbps(Number(e.target.value))}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white font-medium"
                  >
                    <option value={1024}>1024 Kbps</option>
                    <option value={2048}>2048 Kbps</option>
                    <option value={4096}>4096 Kbps</option>
                    <option value={8192}>8192 Kbps</option>
                  </select>
                </div>

                <div>
                  <label className="block text-slate-300 font-bold mb-1">Codec</label>
                  <select
                    value={codec}
                    onChange={(e) => setCodec(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white font-medium"
                  >
                    <option value="H.265 / HEVC">H.265 / HEVC</option>
                    <option value="H.264">H.264</option>
                    <option value="AV1">AV1</option>
                  </select>
                </div>
              </div>
            </div>
          )}

          {/* TAB 4: AUDIO */}
          {activeTab === 'AUDIO' && (
            <div className="space-y-4">
              <div className="p-3 bg-slate-950 rounded-2xl border border-slate-800 flex items-center justify-between">
                <div>
                  <div className="font-bold text-white">Canal Audio Entrant</div>
                  <div className="text-[11px] text-slate-400">Captation sonore via le microphone de la caméra</div>
                </div>
                <input
                  type="checkbox"
                  checked={hasAudio}
                  onChange={(e) => setHasAudio(e.target.checked)}
                  className="rounded bg-slate-900 border-slate-700 text-blue-600"
                />
              </div>

              <div className="p-3 bg-slate-950 rounded-2xl border border-slate-800 flex items-center justify-between">
                <div>
                  <div className="font-bold text-white">Interphone Bidirectionnel (Talkback)</div>
                  <div className="text-[11px] text-slate-400">Diffusion de la voix opérateur vers le haut-parleur caméra</div>
                </div>
                <input
                  type="checkbox"
                  checked={hasTwoWayTalk}
                  onChange={(e) => setHasTwoWayTalk(e.target.checked)}
                  className="rounded bg-slate-900 border-slate-700 text-emerald-600"
                />
              </div>
            </div>
          )}

          {/* TAB 5: MOTION & AI */}
          {activeTab === 'MOTION' && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-slate-300 font-bold mb-1">Niveau de Sensibilité</label>
                  <select
                    value={sensitivity}
                    onChange={(e) => setSensitivity(e.target.value as any)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2.5 text-white font-medium"
                  >
                    <option value="Haute">Haute (Détection fine & piétons distants)</option>
                    <option value="Moyenne">Moyenne (Recommandé)</option>
                    <option value="Basse">Basse (Gros objets & véhicules uniquement)</option>
                  </select>
                </div>

                <div className="flex items-center pt-6">
                  <label className="flex items-center space-x-2 text-slate-300 font-semibold cursor-pointer">
                    <input
                      type="checkbox"
                      checked={recordOnEvent}
                      onChange={(e) => setRecordOnEvent(e.target.checked)}
                      className="rounded bg-slate-900 border-slate-700 text-blue-600"
                    />
                    <span>Enregistrer automatiquement un clip vidéo sur alerte</span>
                  </label>
                </div>
              </div>

              <div>
                <label className="block text-slate-300 font-bold mb-2">Règles Neuronales d'Analyse IA :</label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {[
                    'Mouvement',
                    'Intrusion Zone Sécurisée',
                    'Présence Humaine',
                    'Attroupement Suspect',
                    'Objet Abandonné / Bagage',
                    'Véhicule Suspect',
                    'Chute de Personne',
                    'Anomalie Visuelle / Incendie'
                  ].map((rule) => {
                    const active = aiDetectionRules.includes(rule as AIModelDetection);
                    return (
                      <button
                        key={rule}
                        type="button"
                        onClick={() => handleToggleAIRule(rule as AIModelDetection)}
                        className={`p-2 rounded-xl text-left border transition flex items-center space-x-2 ${
                          active
                            ? 'bg-blue-600/20 border-blue-500 text-blue-300 font-bold'
                            : 'bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700'
                        }`}
                      >
                        <div className={`w-3.5 h-3.5 rounded flex items-center justify-center text-[10px] ${active ? 'bg-blue-500 text-white' : 'border border-slate-700'}`}>
                          {active && '✓'}
                        </div>
                        <span className="truncate text-[11px]">{rule}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {/* TAB 6: PTZ */}
          {activeTab === 'PTZ' && (
            <div className="space-y-4">
              <div className="p-3 bg-slate-950 rounded-2xl border border-slate-800 flex items-center justify-between">
                <div>
                  <div className="font-bold text-white">Support Motorisation Pan / Tilt / Zoom</div>
                  <div className="text-[11px] text-slate-400">Active le joystick virtuel et la gestion de ronde de patrouille</div>
                </div>
                <input
                  type="checkbox"
                  checked={hasPTZ}
                  onChange={(e) => setHasPTZ(e.target.checked)}
                  className="rounded bg-slate-900 border-slate-700 text-amber-500"
                />
              </div>
            </div>
          )}

          {/* TAB 7: STORAGE */}
          {activeTab === 'STORAGE' && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-slate-300 font-bold mb-1">Durée de Conservation (Rétention)</label>
                  <select
                    value={retentionDays}
                    onChange={(e) => setRetentionDays(Number(e.target.value))}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2.5 text-white font-medium"
                  >
                    <option value={7}>7 Jours</option>
                    <option value={14}>14 Jours</option>
                    <option value={30}>30 Jours</option>
                    <option value={60}>60 Jours</option>
                    <option value={90}>90 Jours</option>
                  </select>
                </div>

                <div className="flex items-center pt-6">
                  <label className="flex items-center space-x-2 text-slate-300 font-semibold cursor-pointer">
                    <input
                      type="checkbox"
                      checked={continuousRecord}
                      onChange={(e) => setContinuousRecord(e.target.checked)}
                      className="rounded bg-slate-900 border-slate-700 text-blue-600"
                    />
                    <span>Enregistrement Continu 24/7 (Non-stop)</span>
                  </label>
                </div>
              </div>
            </div>
          )}

        </div>

        {/* Footer Actions */}
        <div className="pt-4 border-t border-slate-800 flex items-center justify-between">
          <button
            onClick={handleDelete}
            className="px-4 py-2 bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 font-bold rounded-xl text-xs flex items-center space-x-1.5 border border-rose-500/30 transition"
          >
            <Trash2 className="w-4 h-4" />
            <span>Supprimer la Caméra</span>
          </button>

          <div className="flex items-center space-x-3">
            <button
              onClick={onClose}
              className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold rounded-xl text-xs transition"
            >
              Annuler
            </button>
            <button
              onClick={handleSave}
              className="px-6 py-2 bg-blue-600 hover:bg-blue-500 text-white font-extrabold rounded-xl text-xs flex items-center space-x-2 shadow-lg shadow-blue-600/30 transition"
            >
              <Save className="w-4 h-4" />
              <span>Enregistrer les Modifications</span>
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};
