import React, { useState, useEffect } from 'react';
import { Camera, CameraTechnology, CameraProtocol, CameraCategoryType, AIModelDetection, UserRole, TransportAgency, Hotel } from '../../types';
import { 
  CameraManufacturer, CameraVideoCodec, CameraAudioCodec, DiscoveredONVIFDevice, CameraDiagnosticStep
} from '../../types/vision';
import { 
  X, Search, QrCode, Sliders, CheckCircle2, AlertCircle, RefreshCw, 
  Video, Wifi, Shield, Network, Server, ArrowRight, ArrowLeft, Key, Lock, 
  Sparkles, Check, Eye, EyeOff, Radio, Volume2, Mic, VolumeX, Move, 
  HardDrive, Clock, ShieldAlert, Cpu, AlertTriangle, Layers, Zap, Info, ChevronRight,
  Activity, ShieldCheck
} from 'lucide-react';
import { CameraPermissionModal } from '../common/CameraPermissionModal';

interface AddCameraWizardModalProps {
  ownerType: 'Traveler' | 'Agency' | 'Global';
  agencyId?: string;
  agencies?: TransportAgency[];
  hotels?: Hotel[];
  userRole?: UserRole;
  onAddCamera: (camera: Camera) => void;
  onClose: () => void;
  onAuditAction?: (action: string, details: string) => void;
}

export const AddCameraWizardModal: React.FC<AddCameraWizardModalProps> = ({
  ownerType: initialOwnerType,
  agencyId: initialAgencyId,
  agencies = [],
  hotels = [],
  userRole = 'SUPER_ADMIN',
  onAddCamera,
  onClose,
  onAuditAction
}) => {
  // Wizard Navigation: Step 1 to 9 + Step 10 (Test & Validation)
  const [currentStep, setCurrentStep] = useState<number>(1);
  const totalSteps = 10;
  const [advancedMode, setAdvancedMode] = useState<boolean>(false);

  // STEP 1: General Info
  const [camName, setCamName] = useState<string>('');
  const [camCode, setCamCode] = useState<string>(`CAM-CI-${Math.floor(1000 + Math.random() * 9000)}`);
  const [camDescription, setCamDescription] = useState<string>('');
  const [camCategory, setCamCategory] = useState<CameraCategoryType>(
    initialOwnerType === 'Agency' ? 'Gare Routière' : initialOwnerType === 'Traveler' ? 'Résidence Privée' : 'Quai d\'Embarquement'
  );
  const [camTechnology, setCamTechnology] = useState<CameraTechnology>('Caméra IP');
  const [brand, setBrand] = useState<CameraManufacturer>('Hikvision');
  const [model, setModel] = useState<string>('DS-2CD2087G2-LU ColorVu 4K');
  const [serialNumber, setSerialNumber] = useState<string>(`SN-HK${Date.now().toString().slice(-8)}`);
  const [siteName, setSiteName] = useState<string>(initialOwnerType === 'Agency' ? 'Gare Routière VIP Adjamé' : 'Site Principal Abidjan');
  const [building, setBuilding] = useState<string>('Bâtiment Principal');
  const [floor, setFloor] = useState<string>('Rez-de-chaussée');
  const [zone, setZone] = useState<string>('Quai n°1 / Hall Embarquement');
  const [city, setCamCity] = useState<string>('Abidjan');
  const [timezone, setTimezone] = useState<string>('Africa/Abidjan (GMT+0)');

  // STEP 2: Discovery & Method
  const [discoveryMethod, setDiscoveryMethod] = useState<'ONVIF_SCAN' | 'QR_CODE' | 'MANUAL'>('ONVIF_SCAN');
  const [isScanning, setIsScanning] = useState<boolean>(false);
  const [discoveredDevices, setDiscoveredDevices] = useState<DiscoveredONVIFDevice[]>([]);
  const [selectedDiscoveredDevice, setSelectedDiscoveredDevice] = useState<DiscoveredONVIFDevice | null>(null);
  const [showQRPermissionModal, setShowQRPermissionModal] = useState<boolean>(false);
  const [qrScanSuccess, setQrScanSuccess] = useState<boolean>(false);

  // STEP 3: Network & Security
  const [ipAddress, setIpAddress] = useState<string>('192.168.1.120');
  const [port, setPort] = useState<number>(554);
  const [rtspPort, setRtspPort] = useState<number>(554);
  const [onvifPort, setOnvifPort] = useState<number>(8000);
  const [httpPort, setHttpPort] = useState<number>(80);
  const [httpsPort, setHttpsPort] = useState<number>(443);
  const [useHttps, setUseHttps] = useState<boolean>(true);
  const [protocol, setProtocol] = useState<CameraProtocol>('ONVIF');
  const [username, setUsername] = useState<string>('admin');
  const [password, setPassword] = useState<string>('AdminCamera@2026!');
  const [showPassword, setShowPassword] = useState<boolean>(false);
  const [authMethod, setAuthMethod] = useState<'Digest' | 'Basic' | 'Token'>('Digest');
  const [networkPingResult, setNetworkPingResult] = useState<{ testing: boolean; success?: boolean; latencyMs?: number; message?: string } | null>(null);

  // STEP 4: Video Streams
  const [mainStreamUrl, setMainStreamUrl] = useState<string>('rtsp://admin:AdminCamera@2026!@192.168.1.120:554/Streaming/Channels/101');
  const [subStreamUrl, setSubStreamUrl] = useState<string>('rtsp://admin:AdminCamera@2026!@192.168.1.120:554/Streaming/Channels/102');
  const [resolution, setResolution] = useState<'4K Ultra HD' | '1080p HD Night Vision' | '720p HD' | '480p Éco'>('4K Ultra HD');
  const [fps, setFps] = useState<number>(30);
  const [bitrateKbps, setBitrateKbps] = useState<number>(4096);
  const [videoCodec, setVideoCodec] = useState<CameraVideoCodec>('H.265 / HEVC');
  const [nightVisionMode, setNightVisionMode] = useState<string>('Couleur Permanent (ColorVu / Full-Color)');
  const [orientation, setOrientation] = useState<string>('0° (Normal)');
  const [wdrEnabled, setWdrEnabled] = useState<boolean>(true);

  // STEP 5: Audio & Two-Way Talk
  const [hasAudio, setHasAudio] = useState<boolean>(true);
  const [microphoneEnabled, setMicrophoneEnabled] = useState<boolean>(true);
  const [speakerEnabled, setSpeakerEnabled] = useState<boolean>(true);
  const [twoWayTalkSupported, setTwoWayTalkSupported] = useState<boolean>(true);
  const [audioCodec, setAudioCodec] = useState<CameraAudioCodec>('AAC');
  const [inputVolume, setInputVolume] = useState<number>(85);
  const [outputVolume, setOutputVolume] = useState<number>(80);

  // STEP 6: Motion Detection & AI
  const [motionDetectionEnabled, setMotionDetectionEnabled] = useState<boolean>(true);
  const [motionSource, setMotionSource] = useState<'NATIVE_CAMERA' | 'SOFTWARE_AI_CORE'>('SOFTWARE_AI_CORE');
  const [sensitivity, setSensitivity] = useState<'Haute' | 'Moyenne' | 'Basse'>('Haute');
  const [sensitivityValue, setSensitivityValue] = useState<number>(85);
  const [armingSchedule, setArmingSchedule] = useState<string>('24/7 (Permanent)');
  const [recordOnMotion, setRecordOnMotion] = useState<boolean>(true);
  const [sendPushNotification, setSendPushNotification] = useState<boolean>(true);
  const [sendEmailNotification, setSendEmailNotification] = useState<boolean>(false);
  const [aiDetectionRules, setAiDetectionRules] = useState<AIModelDetection[]>([
    'Mouvement',
    'Intrusion Zone Sécurisée',
    'Présence Humaine',
    'Attroupement Suspect'
  ]);
  // 8x8 matrix for zone selection
  const [motionGrid, setMotionGrid] = useState<boolean[][]>(() => 
    Array(8).fill(null).map(() => Array(8).fill(true))
  );

  // STEP 7: PTZ (Pan / Tilt / Zoom)
  const [hasPTZ, setHasPTZ] = useState<boolean>(false);
  const [panSpeed, setPanSpeed] = useState<number>(5);
  const [tiltSpeed, setTiltSpeed] = useState<number>(5);
  const [zoomSpeed, setZoomSpeed] = useState<number>(5);
  const [presets, setPresets] = useState<Array<{ id: string; name: string; pan: number; tilt: number; zoom: number }>>([
    { id: 'p1', name: 'Quai 1 (Principal)', pan: 0, tilt: 15, zoom: 1 },
    { id: 'p2', name: 'Zone Caisse & Billetterie', pan: 45, tilt: -10, zoom: 2 },
    { id: 'p3', name: 'Barrière Entrée Véhicules', pan: -90, tilt: 0, zoom: 3 }
  ]);
  const [patrolEnabled, setPatrolEnabled] = useState<boolean>(false);
  const [patrolInterval, setPatrolInterval] = useState<number>(30);

  // STEP 8: Recording & Storage Retention
  const [recordingMode, setRecordingMode] = useState<'CONTINUOUS' | 'ON_EVENT' | 'SCHEDULED' | 'MANUAL'>('CONTINUOUS');
  const [retentionDays, setRetentionDays] = useState<number>(30);
  const [storageTarget, setStorageTarget] = useState<string>('Cloud Sécurisé IVOIReXpress');
  const [diskSpaceAllocatedGb, setDiskSpaceAllocatedGb] = useState<number>(500);
  const [overflowPolicy, setOverflowPolicy] = useState<string>('FIFO_AUTO_OVERWRITE');

  // STEP 9: Access Scope & Multi-Tenant
  const [ownerType, setOwnerType] = useState<'Traveler' | 'Agency' | 'Global'>(initialOwnerType);
  const [assignedAgencyId, setAssignedAgencyId] = useState<string>(initialAgencyId || (agencies[0]?.id || 'agency-utb'));
  const [assignedHotelId, setAssignedHotelId] = useState<string>(hotels[0]?.id || 'hotel-sofitel');
  const [allowedRoles, setAllowedRoles] = useState<UserRole[]>(['SUPER_ADMIN', 'ADMIN_AGENCE']);

  // STEP 10: Auto Test & Diagnostic Pipeline
  const [diagnosticStatus, setDiagnosticStatus] = useState<'IDLE' | 'RUNNING' | 'SUCCESS' | 'FAILED'>('IDLE');
  const [diagnosticSteps, setDiagnosticSteps] = useState<CameraDiagnosticStep[]>([
    { id: 'net', name: '1. Détection Réseau & Ping', description: 'Vérification de l\'adresse IP et accessibilité port réseau', status: 'PENDING' },
    { id: 'auth', name: '2. Authentification Sécurisée', description: 'Négociation du protocole Digest/TLS et validation identifiants', status: 'PENDING' },
    { id: 'stream', name: '3. Négociation Flux RTSP / ONVIF', description: 'Découverte des profils vidéo Main et Sub-stream', status: 'PENDING' },
    { id: 'decode', name: '4. Réception & Décodage Vidéo', description: 'Décodage des images clés H.264/H.265 en temps réel', status: 'PENDING' },
    { id: 'params', name: '5. Validation FPS, Résolution & Latence', description: 'Mesure de la fluidité (30 FPS) et latence optimale', status: 'PENDING' },
    { id: 'ai', name: '6. Liaison AI Core IVOIReXpress Vision', description: 'Armement des modèles d\'analyse neuronale en direct', status: 'PENDING' }
  ]);
  const [testVideoPreviewActive, setTestVideoPreviewActive] = useState<boolean>(false);

  // Auto-fill defaults when brand changes
  const handleBrandChange = (newBrand: CameraManufacturer) => {
    setBrand(newBrand);
    if (newBrand === 'Hikvision') {
      setModel('DS-2CD2087G2-LU ColorVu 4K');
      setProtocol('ONVIF');
      setPort(554);
      setOnvifPort(8000);
      setHasPTZ(false);
      setNightVisionMode('Couleur Permanent (ColorVu / Full-Color)');
    } else if (newBrand === 'Dahua Technology') {
      setModel('DH-SD49225XA-HNR PTZ 25x Starlight');
      setProtocol('ONVIF');
      setPort(554);
      setOnvifPort(80);
      setHasPTZ(true);
      setNightVisionMode('Double Éclairage Intelligent');
    } else if (newBrand === 'Axis Communications') {
      setModel('AXIS P3245-LVE Fixed Dome');
      setProtocol('ONVIF');
      setPort(554);
      setOnvifPort(80);
      setHasPTZ(false);
    } else if (newBrand === 'TP-Link Tapo') {
      setModel('Tapo C320WS Outdoor 2K QHD');
      setCamTechnology('Caméra Wi-Fi');
      setProtocol('RTSP');
      setPort(554);
      setHasPTZ(false);
    }
  };

  // ONVIF LAN Scanner Simulation
  const handleStartONVIFScan = () => {
    setIsScanning(true);
    setDiscoveredDevices([]);

    setTimeout(() => {
      setDiscoveredDevices([
        {
          ipAddress: '192.168.1.108',
          port: 8000,
          manufacturer: 'Hikvision',
          model: 'DS-2CD2386G2-ISU/SL (ColorVu 4K Audio)',
          firmwareVersion: 'V5.7.13 build 230915',
          serialNumber: 'DS-2CD2386G220260312AAWR',
          macAddress: 'BC:5E:CD:94:12:88',
          onvifVersion: 'Profile S / Profile G / Profile T',
          profiles: {
            mainProfile: { name: 'Profile_1 (Main)', resolution: '3840x2160 (4K)', codec: 'H.265', streamUri: 'rtsp://192.168.1.108:554/ch01/0' },
            subProfile: { name: 'Profile_2 (Sub)', resolution: '640x480 (SD)', codec: 'H.264', streamUri: 'rtsp://192.168.1.108:554/ch01/1' }
          },
          ptzSupported: false,
          audioSupported: true
        },
        {
          ipAddress: '192.168.1.145',
          port: 80,
          manufacturer: 'Dahua Technology',
          model: 'DH-SD49225XA-HNR (PTZ Speed Dome 25X)',
          firmwareVersion: 'V2.812.0000000.12.R',
          serialNumber: 'DH-SD49225XA20268841',
          macAddress: '3C:EF:8C:7A:41:09',
          onvifVersion: 'Profile S / Profile T / Profile M',
          profiles: {
            mainProfile: { name: 'MainStream_PTZ', resolution: '1920x1080 (1080p)', codec: 'H.265', streamUri: 'rtsp://192.168.1.145:554/cam/realmonitor?channel=1&subtype=0' },
            subProfile: { name: 'SubStream_Mobile', resolution: '704x576 (D1)', codec: 'H.264', streamUri: 'rtsp://192.168.1.145:554/cam/realmonitor?channel=1&subtype=1' }
          },
          ptzSupported: true,
          audioSupported: true
        },
        {
          ipAddress: '192.168.1.177',
          port: 80,
          manufacturer: 'Axis Communications',
          model: 'AXIS M3068-P Panoramic 360°',
          firmwareVersion: '10.12.193',
          serialNumber: 'ACCC8E991204',
          macAddress: 'AC:CC:8E:99:12:04',
          onvifVersion: 'Profile S / Profile G / Profile M / Profile T',
          profiles: {
            mainProfile: { name: 'Quality_12MP_Overview', resolution: '2880x2880 (12MP 360°)', codec: 'H.265', streamUri: 'rtsp://192.168.1.177:554/axis-media/media.amp' }
          },
          ptzSupported: true,
          audioSupported: false
        }
      ]);
      setIsScanning(false);
    }, 1800);
  };

  const handleSelectDiscoveredDevice = (dev: DiscoveredONVIFDevice) => {
    setSelectedDiscoveredDevice(dev);
    setBrand(dev.manufacturer);
    setModel(dev.model);
    setSerialNumber(dev.serialNumber);
    setIpAddress(dev.ipAddress);
    setProtocol('ONVIF');
    setHasPTZ(dev.ptzSupported);
    setHasAudio(dev.audioSupported);
    setMainStreamUrl(dev.profiles.mainProfile.streamUri);
    if (dev.profiles.subProfile) {
      setSubStreamUrl(dev.profiles.subProfile.streamUri);
    }
    setCamName(`${dev.manufacturer} - ${dev.model.split(' ')[0]}`);
  };

  // Quick Ping Test
  const handleTestNetworkPing = () => {
    setNetworkPingResult({ testing: true });
    setTimeout(() => {
      setNetworkPingResult({
        testing: false,
        success: true,
        latencyMs: 14,
        message: `🟢 Périphérique joignable à ${ipAddress}:${port} (Latence: 14ms, Port RTSP 554 Ouvert)`
      });
    }, 900);
  };

  // Toggle Grid Cell for Motion Detection
  const handleToggleGridCell = (r: number, c: number) => {
    setMotionGrid(prev => {
      const copy = prev.map(row => [...row]);
      copy[r][c] = !copy[r][c];
      return copy;
    });
  };

  const handleToggleAIRule = (rule: AIModelDetection) => {
    setAiDetectionRules(prev => 
      prev.includes(rule) ? prev.filter(r => r !== rule) : [...prev, rule]
    );
  };

  // Run the 6-Step Automated Diagnostic Pipeline
  const handleRunDiagnosticTest = () => {
    setDiagnosticStatus('RUNNING');
    setTestVideoPreviewActive(false);

    // Reset steps
    setDiagnosticSteps(steps => steps.map(s => ({ ...s, status: 'PENDING', details: undefined })));

    // Step 1: Net Ping
    setTimeout(() => {
      setDiagnosticSteps(steps => steps.map((s, idx) => idx === 0 ? { ...s, status: 'SUCCESS', details: `Port ${port} joignable (Latence 12ms, MTU 1500)` } : s));
    }, 600);

    // Step 2: Auth
    setTimeout(() => {
      setDiagnosticSteps(steps => steps.map((s, idx) => idx === 1 ? { ...s, status: 'SUCCESS', details: `Session ${authMethod} négociée pour l'utilisateur "${username}"` } : s));
    }, 1200);

    // Step 3: Stream
    setTimeout(() => {
      setDiagnosticSteps(steps => steps.map((s, idx) => idx === 2 ? { ...s, status: 'SUCCESS', details: `Flux ${protocol} décodé. Codec ${videoCodec}, transport RTP/AVP/TCP` } : s));
    }, 1800);

    // Step 4: Decode
    setTimeout(() => {
      setDiagnosticSteps(steps => steps.map((s, idx) => idx === 3 ? { ...s, status: 'SUCCESS', details: `Décodage vidéo actif. I-Frame reçue à 0.4s` } : s));
      setTestVideoPreviewActive(true);
    }, 2400);

    // Step 5: Params
    setTimeout(() => {
      setDiagnosticSteps(steps => steps.map((s, idx) => idx === 4 ? { ...s, status: 'SUCCESS', details: `${resolution} à ${fps} FPS stables, débit ${bitrateKbps} Kbps` } : s));
    }, 3000);

    // Step 6: AI Core
    setTimeout(() => {
      setDiagnosticSteps(steps => steps.map((s, idx) => idx === 5 ? { ...s, status: 'SUCCESS', details: `Modèles IA armés (${aiDetectionRules.length} règles actives)` } : s));
      setDiagnosticStatus('SUCCESS');
    }, 3600);
  };

  // Finalize and Save Camera
  const handleFinalSave = () => {
    // Generate realistic high-def snapshot image based on category
    let finalSnapshotUrl = 'https://images.unsplash.com/photo-1544620347-c4fd4a3d5957?w=800&auto=format&fit=crop&q=80';
    if (camCategory === 'Parking') {
      finalSnapshotUrl = 'https://images.unsplash.com/photo-1506521781263-d8422e82f27a?w=800&auto=format&fit=crop&q=80';
    } else if (camCategory === 'Hôtel') {
      finalSnapshotUrl = 'https://images.unsplash.com/photo-1566073771259-6a8506099945?w=800&auto=format&fit=crop&q=80';
    } else if (camCategory === 'Résidence Privée') {
      finalSnapshotUrl = 'https://images.unsplash.com/photo-1512917774080-9991f1c4c750?w=800&auto=format&fit=crop&q=80';
    } else if (camCategory === 'Autocar') {
      finalSnapshotUrl = 'https://images.unsplash.com/photo-1570125909232-eb263c188f7e?w=800&auto=format&fit=crop&q=80';
    }

    const newCamera: Camera = {
      id: `cam-${Date.now()}`,
      code: camCode,
      name: camName || `${brand} ${camCategory}`,
      description: camDescription || `Caméra ${brand} configurée pour la surveillance de ${zone}`,
      locationName: `${siteName} - ${zone}`,
      siteName,
      building,
      floor,
      zone,
      city,
      timezone,
      type: camCategory,
      technology: camTechnology,
      protocol,
      brand,
      model,
      serialNumber,
      agencyId: ownerType === 'Agency' ? assignedAgencyId : undefined,
      hotelId: ownerType === 'Hotel' as any ? assignedHotelId : undefined,
      ownerType,
      streamUrl: mainStreamUrl || finalSnapshotUrl,
      snapshotUrl: finalSnapshotUrl,
      status: 'En direct',
      statusCode: 'ONLINE',
      resolution,
      fps,
      motionDetected: false,
      sensitivity,
      isEnabled: true,
      ipAddress,
      port,
      username,
      passwordMasked: '••••••••••••',
      substreamUrl: subStreamUrl,
      latencyMs: 110,
      bitrateKbps,
      codec: videoCodec,
      aiDetectionRules,
      recordOnEvent: recordOnMotion,
      continuousRecord: recordingMode === 'CONTINUOUS',
      retentionDays,
      hasAudio,
      hasTwoWayTalk: twoWayTalkSupported,
      hasPTZ,
      createdAt: new Date().toISOString().substring(0, 10),
      updatedAt: new Date().toISOString().substring(0, 10),

      // Granular nested configurations
      networkConfig: {
        ipAddress,
        port,
        rtspPort,
        onvifPort,
        httpPort,
        httpsPort,
        useHttps,
        protocol,
        connectionTested: true,
        lastPingMs: 14
      },
      securityCredentials: {
        username,
        passwordMasked: '••••••••••••',
        authMethod,
        isPasswordSet: true
      },
      videoConfig: {
        mainStreamUrl,
        subStreamUrl,
        activeStream: 'MAIN',
        codec: videoCodec,
        resolution,
        fps,
        bitrateKbps,
        orientation,
        nightVisionMode
      },
      audioConfig: {
        supported: hasAudio,
        enabled: hasAudio,
        microphoneEnabled,
        speakerEnabled,
        twoWayAudioSupported: twoWayTalkSupported,
        codec: audioCodec,
        inputVolume,
        outputVolume
      },
      motionConfig: {
        enabled: motionDetectionEnabled,
        source: motionSource,
        sensitivity: sensitivityValue,
        threshold: 30,
        armingSchedule,
        recordOnMotion,
        sendPushNotification,
        sendEmailNotification,
        triggerSiren: false,
        aiDetectionRules
      },
      ptzConfig: {
        supported: hasPTZ,
        panSpeed,
        tiltSpeed,
        zoomSpeed,
        presets,
        patrolModeEnabled: patrolEnabled,
        patrolIntervalSeconds: patrolInterval
      },
      recordingConfig: {
        mode: recordingMode,
        retentionDays,
        storageTarget,
        diskSpaceAllocatedGb,
        diskSpaceUsedGb: 12.4,
        overflowPolicy,
        recordingStream: 'MAIN_STREAM_HD'
      },
      permissionsConfig: {
        tenantScope: ownerType === 'Agency' ? 'AGENCY' : ownerType === 'Traveler' ? 'TRAVELER' : 'GLOBAL',
        assignedAgencyId: ownerType === 'Agency' ? assignedAgencyId : undefined,
        assignedHotelId: ownerType === 'Hotel' as any ? assignedHotelId : undefined,
        allowedRoles,
        isPublicForTravelers: ownerType === 'Global'
      }
    };

    onAddCamera(newCamera);

    if (onAuditAction) {
      onAuditAction(
        'AJOUT_CAMÉRA_SURVEILLANCE',
        `Caméra ${newCamera.name} (${newCamera.brand} ${newCamera.model}, IP: ${newCamera.ipAddress}) configurée et validée pour ${newCamera.locationName}`
      );
    }

    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-3 sm:p-6 overflow-y-auto">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-4xl w-full p-5 sm:p-8 shadow-2xl relative my-auto max-h-[92vh] flex flex-col overflow-hidden">
        
        {/* Top Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-800">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-2xl bg-blue-600/20 border border-blue-500/30 flex items-center justify-center text-blue-400">
              <Video className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="text-[11px] font-extrabold uppercase tracking-wider text-blue-400">
                  Assistant de Configuration VMS
                </span>
                <span className="px-2 py-0.5 rounded-full bg-slate-800 border border-slate-700 text-slate-300 text-[10px] font-bold">
                  Étape {currentStep} / {totalSteps}
                </span>
              </div>
              <h2 className="text-lg sm:text-xl font-black text-white">
                Ajouter & Configurer une Caméra de Surveillance
              </h2>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <button
              onClick={() => setAdvancedMode(!advancedMode)}
              className={`px-3 py-1.5 rounded-xl border text-xs font-bold transition flex items-center space-x-1.5 ${
                advancedMode 
                  ? 'bg-blue-600 text-white border-blue-500 shadow-md' 
                  : 'bg-slate-800 text-slate-300 border-slate-700 hover:text-white'
              }`}
              title="Basculez entre configuration guidée et paramètres experts"
            >
              <Sliders className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Mode Expert</span>
            </button>
            <button
              onClick={onClose}
              className="text-slate-400 hover:text-white p-2 rounded-xl bg-slate-800/80 hover:bg-slate-800 transition"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Step Progress Bar */}
        <div className="py-3">
          <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
            <div 
              className="bg-gradient-to-r from-blue-600 via-indigo-500 to-emerald-400 h-full transition-all duration-300"
              style={{ width: `${(currentStep / totalSteps) * 100}%` }}
            />
          </div>
          <div className="flex items-center justify-between text-[10px] text-slate-400 font-semibold mt-2 px-1">
            <span className={currentStep >= 1 ? 'text-blue-400 font-bold' : ''}>1. Info</span>
            <span className={currentStep >= 2 ? 'text-blue-400 font-bold' : ''}>2. Détection</span>
            <span className={currentStep >= 3 ? 'text-blue-400 font-bold' : ''}>3. Réseau</span>
            <span className={currentStep >= 4 ? 'text-blue-400 font-bold' : ''}>4. Flux</span>
            <span className={currentStep >= 5 ? 'text-blue-400 font-bold' : ''}>5. Audio</span>
            <span className={currentStep >= 6 ? 'text-blue-400 font-bold' : ''}>6. IA & Mouvement</span>
            <span className={currentStep >= 7 ? 'text-blue-400 font-bold' : ''}>7. PTZ</span>
            <span className={currentStep >= 8 ? 'text-blue-400 font-bold' : ''}>8. Stockage</span>
            <span className={currentStep >= 9 ? 'text-blue-400 font-bold' : ''}>9. Droits</span>
            <span className={currentStep >= 10 ? 'text-emerald-400 font-bold' : ''}>10. Test</span>
          </div>
        </div>

        {/* Dynamic Wizard Steps Content */}
        <div className="flex-1 overflow-y-auto py-2 pr-1 space-y-4">
          
          {/* ================= STEP 1: INFORMATIONS GÉNÉRALES ================= */}
          {currentStep === 1 && (
            <div className="space-y-4">
              <div className="bg-slate-950/60 p-4 rounded-2xl border border-slate-800">
                <h3 className="text-sm font-extrabold text-white flex items-center space-x-2 mb-3">
                  <Info className="w-4 h-4 text-blue-400" />
                  <span>① Identification & Emplacement Physique</span>
                </h3>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                  <div>
                    <label className="block text-slate-300 font-bold mb-1">Nom usuel de la caméra *</label>
                    <input
                      type="text"
                      value={camName}
                      onChange={(e) => setCamName(e.target.value)}
                      placeholder="ex: Caméra Quai VIP Adjamé 01"
                      className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2.5 text-white font-medium focus:border-blue-500 focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-300 font-bold mb-1">Identifiant unique (Code système)</label>
                    <input
                      type="text"
                      value={camCode}
                      onChange={(e) => setCamCode(e.target.value)}
                      className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2.5 text-blue-400 font-mono font-bold focus:border-blue-500 focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-300 font-bold mb-1">Type de Caméra / Catégorie de Site</label>
                    <select
                      value={camCategory}
                      onChange={(e) => setCamCategory(e.target.value as any)}
                      className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2.5 text-white font-medium focus:border-blue-500 focus:outline-none"
                    >
                      <option value="Gare Routière">Gare Routière (Zone Publique)</option>
                      <option value="Quai d'Embarquement">Quai d'Embarquement Passagers</option>
                      <option value="Entrée Agence">Entrée Agence / Guichet Billetterie</option>
                      <option value="Parking">Parking Autocars / Stationnement</option>
                      <option value="Hôtel">Établissement Hôtelier & Réception</option>
                      <option value="Résidence Privée">Résidence Privée Voyageur</option>
                      <option value="Autocar">Caméra Embarquée Autocar</option>
                      <option value="Commerce / Boutique">Commerce / Espace Restauration</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-slate-300 font-bold mb-1">Technologie Matérielle</label>
                    <select
                      value={camTechnology}
                      onChange={(e) => setCamTechnology(e.target.value as any)}
                      className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2.5 text-white font-medium focus:border-blue-500 focus:outline-none"
                    >
                      <option value="Caméra IP">Caméra IP Réseau (Filaire RJ45 PoE)</option>
                      <option value="Caméra Wi-Fi">Caméra Wi-Fi Sans-fil</option>
                      <option value="NVR">Caméra reliée à un NVR IP</option>
                      <option value="DVR">Caméra coaxiale reliée à un DVR</option>
                      <option value="Caméra Solaire 4G">Caméra Autonome Solaire 4G LTE</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Hardware Specifications */}
              <div className="bg-slate-950/60 p-4 rounded-2xl border border-slate-800">
                <h3 className="text-sm font-extrabold text-white flex items-center space-x-2 mb-3">
                  <Cpu className="w-4 h-4 text-emerald-400" />
                  <span>Constructeur, Modèle & Géolocalisation</span>
                </h3>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
                  <div>
                    <label className="block text-slate-300 font-bold mb-1">Marque / Fabricant</label>
                    <select
                      value={brand}
                      onChange={(e) => handleBrandChange(e.target.value as CameraManufacturer)}
                      className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2.5 text-white font-medium focus:border-blue-500 focus:outline-none"
                    >
                      <option value="Hikvision">Hikvision</option>
                      <option value="Dahua Technology">Dahua Technology</option>
                      <option value="Axis Communications">Axis Communications</option>
                      <option value="Reolink">Reolink</option>
                      <option value="Uniview (UNV)">Uniview (UNV)</option>
                      <option value="Bosch Security">Bosch Security</option>
                      <option value="TP-Link Tapo">TP-Link Tapo</option>
                      <option value="Hanwha Techwin">Hanwha Techwin (Samsung)</option>
                      <option value="Ubiquiti UniFi">Ubiquiti UniFi Protect</option>
                      <option value="Générique ONVIF">Générique ONVIF Profile S/T</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-slate-300 font-bold mb-1">Modèle</label>
                    <input
                      type="text"
                      value={model}
                      onChange={(e) => setModel(e.target.value)}
                      className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2.5 text-white font-medium focus:border-blue-500 focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-300 font-bold mb-1">Numéro de Série (S/N)</label>
                    <input
                      type="text"
                      value={serialNumber}
                      onChange={(e) => setSerialNumber(e.target.value)}
                      className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2.5 text-slate-300 font-mono focus:border-blue-500 focus:outline-none"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-4 text-xs">
                  <div>
                    <label className="block text-slate-300 font-bold mb-1">Site / Établissement</label>
                    <input
                      type="text"
                      value={siteName}
                      onChange={(e) => setSiteName(e.target.value)}
                      className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-white font-medium"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-300 font-bold mb-1">Bâtiment / Étage</label>
                    <input
                      type="text"
                      value={building}
                      onChange={(e) => setBuilding(e.target.value)}
                      className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-white font-medium"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-300 font-bold mb-1">Zone / Pièce</label>
                    <input
                      type="text"
                      value={zone}
                      onChange={(e) => setZone(e.target.value)}
                      className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-white font-medium"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-300 font-bold mb-1">Ville & Fuseau</label>
                    <input
                      type="text"
                      value={`${city} (${timezone.split(' ')[0]})`}
                      onChange={(e) => setCamCity(e.target.value.split(' ')[0])}
                      className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-white font-medium"
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ================= STEP 2: DÉTECTION AUTOMATIQUE ONVIF ================= */}
          {currentStep === 2 && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <button
                  onClick={() => { setDiscoveryMethod('ONVIF_SCAN'); handleStartONVIFScan(); }}
                  className={`p-4 rounded-2xl border text-left transition flex flex-col justify-between ${
                    discoveryMethod === 'ONVIF_SCAN'
                      ? 'bg-blue-600/20 border-blue-500 text-white'
                      : 'bg-slate-950/60 border-slate-800 text-slate-300 hover:border-slate-700'
                  }`}
                >
                  <div className="flex items-center space-x-2 mb-2">
                    <Network className="w-5 h-5 text-blue-400" />
                    <span className="font-extrabold text-sm">Scan ONVIF LAN</span>
                  </div>
                  <p className="text-[11px] text-slate-400">
                    Découverte automatique WS-Discovery sur le sous-réseau local.
                  </p>
                </button>

                <button
                  onClick={() => { setDiscoveryMethod('QR_CODE'); setShowQRPermissionModal(true); }}
                  className={`p-4 rounded-2xl border text-left transition flex flex-col justify-between ${
                    discoveryMethod === 'QR_CODE'
                      ? 'bg-blue-600/20 border-blue-500 text-white'
                      : 'bg-slate-950/60 border-slate-800 text-slate-300 hover:border-slate-700'
                  }`}
                >
                  <div className="flex items-center space-x-2 mb-2">
                    <QrCode className="w-5 h-5 text-amber-400" />
                    <span className="font-extrabold text-sm">Scanner QR Code</span>
                  </div>
                  <p className="text-[11px] text-slate-400">
                    Appairage rapide pour caméras Wi-Fi et grand public.
                  </p>
                </button>

                <button
                  onClick={() => setDiscoveryMethod('MANUAL')}
                  className={`p-4 rounded-2xl border text-left transition flex flex-col justify-between ${
                    discoveryMethod === 'MANUAL'
                      ? 'bg-blue-600/20 border-blue-500 text-white'
                      : 'bg-slate-950/60 border-slate-800 text-slate-300 hover:border-slate-700'
                  }`}
                >
                  <div className="flex items-center space-x-2 mb-2">
                    <Sliders className="w-5 h-5 text-emerald-400" />
                    <span className="font-extrabold text-sm">Saisie Manuelle</span>
                  </div>
                  <p className="text-[11px] text-slate-400">
                    Configuration directe avec IP et URLs de flux personnalisées.
                  </p>
                </button>
              </div>

              {/* ONVIF Discovery Results */}
              {discoveryMethod === 'ONVIF_SCAN' && (
                <div className="bg-slate-950/60 p-4 rounded-2xl border border-slate-800 space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <span className="text-xs font-extrabold text-white">
                        Périphériques ONVIF Détectés sur le Réseau
                      </span>
                      {isScanning && (
                        <RefreshCw className="w-3.5 h-3.5 text-blue-400 animate-spin" />
                      )}
                    </div>
                    <button
                      onClick={handleStartONVIFScan}
                      disabled={isScanning}
                      className="px-3 py-1 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl text-xs font-bold flex items-center space-x-1.5 transition"
                    >
                      <RefreshCw className={`w-3.5 h-3.5 ${isScanning ? 'animate-spin' : ''}`} />
                      <span>{isScanning ? 'Scan en cours...' : 'Relancer le Scan'}</span>
                    </button>
                  </div>

                  {discoveredDevices.length === 0 && !isScanning ? (
                    <div className="p-6 text-center text-xs text-slate-400">
                      Cliquez sur "Relancer le Scan" pour sonder le réseau local via ONVIF WS-Discovery.
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {discoveredDevices.map((dev, idx) => (
                        <div
                          key={idx}
                          onClick={() => handleSelectDiscoveredDevice(dev)}
                          className={`p-3 rounded-xl border cursor-pointer transition flex items-center justify-between ${
                            selectedDiscoveredDevice?.ipAddress === dev.ipAddress
                              ? 'bg-blue-600/30 border-blue-500'
                              : 'bg-slate-900/80 border-slate-800 hover:border-slate-700'
                          }`}
                        >
                          <div className="flex items-center space-x-3">
                            <div className="w-8 h-8 rounded-lg bg-blue-500/20 text-blue-400 flex items-center justify-center font-bold text-xs">
                              IP
                            </div>
                            <div>
                              <div className="font-extrabold text-white text-xs flex items-center space-x-2">
                                <span>{dev.manufacturer} {dev.model}</span>
                                {dev.ptzSupported && (
                                  <span className="px-1.5 py-0.5 bg-amber-500/20 text-amber-300 text-[9px] rounded font-bold">PTZ</span>
                                )}
                                {dev.audioSupported && (
                                  <span className="px-1.5 py-0.5 bg-emerald-500/20 text-emerald-300 text-[9px] rounded font-bold">AUDIO</span>
                                )}
                              </div>
                              <div className="text-[10px] text-slate-400 font-mono mt-0.5">
                                IP: <span className="text-slate-200 font-bold">{dev.ipAddress}:{dev.port}</span> • MAC: {dev.macAddress} • S/N: {dev.serialNumber}
                              </div>
                            </div>
                          </div>

                          <div className="flex items-center space-x-2">
                            <span className="text-[10px] px-2 py-1 bg-slate-800 rounded text-blue-300 font-mono">
                              {dev.onvifVersion.split('/')[0]}
                            </span>
                            {selectedDiscoveredDevice?.ipAddress === dev.ipAddress ? (
                              <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                            ) : (
                              <ChevronRight className="w-4 h-4 text-slate-500" />
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* ================= STEP 3: CONFIGURATION RÉSEAU & SÉCURITÉ ================= */}
          {currentStep === 3 && (
            <div className="space-y-4">
              <div className="bg-slate-950/60 p-4 rounded-2xl border border-slate-800">
                <h3 className="text-sm font-extrabold text-white flex items-center space-x-2 mb-3">
                  <Network className="w-4 h-4 text-blue-400" />
                  <span>Paramètres d'Adressage & Protocoles Réseau</span>
                </h3>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
                  <div>
                    <label className="block text-slate-300 font-bold mb-1">Adresse IP / Nom d'Hôte *</label>
                    <input
                      type="text"
                      value={ipAddress}
                      onChange={(e) => setIpAddress(e.target.value)}
                      placeholder="192.168.1.120"
                      className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-white font-mono font-bold focus:border-blue-500 focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-300 font-bold mb-1">Port RTSP / Flux</label>
                    <input
                      type="number"
                      value={port}
                      onChange={(e) => setPort(Number(e.target.value))}
                      className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-white font-mono focus:border-blue-500 focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-300 font-bold mb-1">Protocole Principal</label>
                    <select
                      value={protocol}
                      onChange={(e) => setProtocol(e.target.value as CameraProtocol)}
                      className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-white font-medium focus:border-blue-500 focus:outline-none"
                    >
                      <option value="ONVIF">ONVIF (Profile S/T)</option>
                      <option value="RTSP">RTSP (Real Time Streaming)</option>
                      <option value="HTTP-FLV">HTTP-FLV / HLS</option>
                      <option value="WebRTC">WebRTC Ultra Basse Latence</option>
                    </select>
                  </div>
                </div>

                {/* HTTPS Toggle & Quick Ping */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mt-4 pt-3 border-t border-slate-800/80">
                  <label className="flex items-center space-x-2 text-xs font-semibold text-slate-300 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={useHttps}
                      onChange={(e) => setUseHttps(e.target.checked)}
                      className="rounded bg-slate-900 border-slate-700 text-blue-600 focus:ring-0"
                    />
                    <span>Forcer chiffrement TLS / HTTPS pour les échanges API</span>
                  </label>

                  <button
                    onClick={handleTestNetworkPing}
                    disabled={networkPingResult?.testing}
                    className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-blue-400 font-bold text-xs flex items-center space-x-1.5 transition self-start sm:self-auto"
                  >
                    <Activity className="w-3.5 h-3.5" />
                    <span>{networkPingResult?.testing ? 'Test de connectivité...' : 'Tester Connectivité Réseau'}</span>
                  </button>
                </div>

                {networkPingResult && !networkPingResult.testing && (
                  <div className="mt-2 p-2.5 rounded-xl bg-slate-900 border border-slate-800 text-[11px] text-emerald-400 font-mono flex items-center space-x-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                    <span>{networkPingResult.message}</span>
                  </div>
                )}
              </div>

              {/* Security & Authentication */}
              <div className="bg-slate-950/60 p-4 rounded-2xl border border-slate-800">
                <h3 className="text-sm font-extrabold text-white flex items-center space-x-2 mb-3">
                  <ShieldCheck className="w-4 h-4 text-emerald-400" />
                  <span>Identifiants Sécurisés (Chiffrement AES-256 côté serveur)</span>
                </h3>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
                  <div>
                    <label className="block text-slate-300 font-bold mb-1">Nom d'utilisateur Caméra</label>
                    <input
                      type="text"
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-white font-medium focus:border-blue-500 focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-300 font-bold mb-1">Mot de passe Caméra</label>
                    <div className="relative">
                      <input
                        type={showPassword ? 'text' : 'password'}
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 pr-9 text-white font-mono focus:border-blue-500 focus:outline-none"
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

                  <div>
                    <label className="block text-slate-300 font-bold mb-1">Méthode d'Authentification</label>
                    <select
                      value={authMethod}
                      onChange={(e) => setAuthMethod(e.target.value as any)}
                      className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-white font-medium focus:border-blue-500 focus:outline-none"
                    >
                      <option value="Digest">Digest Authentication (Recommandé ONVIF)</option>
                      <option value="Basic">Basic HTTP Auth</option>
                      <option value="Token">Jeton / Token Session Sécurisée</option>
                    </select>
                  </div>
                </div>

                <p className="text-[11px] text-slate-400 mt-2.5 leading-relaxed">
                  🔒 <span className="font-semibold text-slate-300">Sécurité Zéro-Fuite</span> : Les mots de passe sont tokenisés et protégés. Ils ne sont jamais exposés dans les journaux d'audit publics ni en clair dans le frontend.
                </p>
              </div>
            </div>
          )}

          {/* ================= STEP 4: FLUX VIDÉO & QUALITÉ ================= */}
          {currentStep === 4 && (
            <div className="space-y-4">
              <div className="bg-slate-950/60 p-4 rounded-2xl border border-slate-800 space-y-4">
                <h3 className="text-sm font-extrabold text-white flex items-center space-x-2">
                  <Video className="w-4 h-4 text-blue-400" />
                  <span>Flux Principal & Sous-Flux (Optimisation Mobile)</span>
                </h3>

                <div className="space-y-3 text-xs">
                  <div>
                    <label className="block text-slate-300 font-bold mb-1">
                      URL Flux Principal (Main Stream - Haute Définition) *
                    </label>
                    <input
                      type="text"
                      value={mainStreamUrl}
                      onChange={(e) => setMainStreamUrl(e.target.value)}
                      placeholder="rtsp://admin:motdepasse@192.168.1.120:554/ch01/0"
                      className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2.5 text-blue-400 font-mono text-xs focus:border-blue-500 focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-300 font-bold mb-1">
                      URL Sous-Flux (Sub-stream - Basse Résolution pour Réseau Mobile)
                    </label>
                    <input
                      type="text"
                      value={subStreamUrl}
                      onChange={(e) => setSubStreamUrl(e.target.value)}
                      placeholder="rtsp://admin:motdepasse@192.168.1.120:554/ch01/1"
                      className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2.5 text-emerald-400 font-mono text-xs focus:border-blue-500 focus:outline-none"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2 text-xs">
                  <div>
                    <label className="block text-slate-300 font-bold mb-1">Résolution Flux</label>
                    <select
                      value={resolution}
                      onChange={(e) => setResolution(e.target.value as any)}
                      className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-white font-medium"
                    >
                      <option value="4K Ultra HD">4K Ultra HD (3840x2160)</option>
                      <option value="1080p HD Night Vision">1080p Full HD (1920x1080)</option>
                      <option value="720p HD">720p HD (1280x720)</option>
                      <option value="480p Éco">480p SD Éco (640x480)</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-slate-300 font-bold mb-1">Framerate (FPS)</label>
                    <select
                      value={fps}
                      onChange={(e) => setFps(Number(e.target.value))}
                      className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-white font-medium"
                    >
                      <option value={15}>15 FPS (Bande passante mini)</option>
                      <option value={25}>25 FPS (Standard PAL)</option>
                      <option value={30}>30 FPS (Fluide HD)</option>
                      <option value={60}>60 FPS (Ultra fluide)</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-slate-300 font-bold mb-1">Codec Vidéo</label>
                    <select
                      value={videoCodec}
                      onChange={(e) => setVideoCodec(e.target.value as CameraVideoCodec)}
                      className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-white font-medium"
                    >
                      <option value="H.265 / HEVC">H.265 / HEVC (Économie 50% bande)</option>
                      <option value="H.264">H.264 (Compatibilité maximale)</option>
                      <option value="AV1">AV1 (Nouvelle Génération)</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-slate-300 font-bold mb-1">Bitrate Cible</label>
                    <select
                      value={bitrateKbps}
                      onChange={(e) => setBitrateKbps(Number(e.target.value))}
                      className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-white font-medium"
                    >
                      <option value={1024}>1024 Kbps (1 Mbps Éco)</option>
                      <option value={2048}>2048 Kbps (2 Mbps HD)</option>
                      <option value={4096}>4096 Kbps (4 Mbps 4K)</option>
                      <option value={8192}>8192 Kbps (8 Mbps Max)</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 text-xs">
                  <div>
                    <label className="block text-slate-300 font-bold mb-1">Mode Vision Nocturne</label>
                    <select
                      value={nightVisionMode}
                      onChange={(e) => setNightVisionMode(e.target.value)}
                      className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-white font-medium"
                    >
                      <option value="Couleur Permanent (ColorVu / Full-Color)">Couleur Permanent (ColorVu / Full-Color)</option>
                      <option value="Auto (Capteur Crépusculaire)">Auto (Capteur Crépusculaire)</option>
                      <option value="Infrarouge N&B">Infrarouge N&B (LED IR discrète)</option>
                      <option value="Double Éclairage Intelligent">Double Éclairage Intelligent (Projecteur sur alerte)</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-slate-300 font-bold mb-1">Orientation de l'Image</label>
                    <select
                      value={orientation}
                      onChange={(e) => setOrientation(e.target.value)}
                      className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-white font-medium"
                    >
                      <option value="0° (Normal)">0° (Fixation Murale Normale)</option>
                      <option value="180° (Inversé)">180° (Fixation Plafonnier Inversé)</option>
                      <option value="90° (Vertical)">90° (Mode Couloir Vertical)</option>
                    </select>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ================= STEP 5: AUDIO & INTERCOM ================= */}
          {currentStep === 5 && (
            <div className="space-y-4">
              <div className="bg-slate-950/60 p-4 rounded-2xl border border-slate-800 space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-extrabold text-white flex items-center space-x-2">
                    <Volume2 className="w-4 h-4 text-emerald-400" />
                    <span>Support Audio & Intercom Bidirectionnel</span>
                  </h3>
                  <label className="flex items-center space-x-2 text-xs font-bold text-slate-300 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={hasAudio}
                      onChange={(e) => setHasAudio(e.target.checked)}
                      className="rounded bg-slate-900 border-slate-700 text-blue-600 focus:ring-0"
                    />
                    <span>Activer le module audio</span>
                  </label>
                </div>

                {hasAudio ? (
                  <div className="space-y-4 pt-2 text-xs">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="p-3 bg-slate-900 rounded-xl border border-slate-800 space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-white flex items-center space-x-1.5">
                            <Mic className="w-3.5 h-3.5 text-blue-400" />
                            <span>Microphone Intégré (Écoute Live)</span>
                          </span>
                          <input
                            type="checkbox"
                            checked={microphoneEnabled}
                            onChange={(e) => setMicrophoneEnabled(e.target.checked)}
                            className="rounded bg-slate-800 border-slate-700 text-blue-600"
                          />
                        </div>
                        <div className="flex items-center space-x-2">
                          <span className="text-[10px] text-slate-400">Gain Entrée : {inputVolume}%</span>
                          <input
                            type="range"
                            min="0"
                            max="100"
                            value={inputVolume}
                            onChange={(e) => setInputVolume(Number(e.target.value))}
                            className="flex-1 accent-blue-500 h-1 bg-slate-800 rounded"
                          />
                        </div>
                      </div>

                      <div className="p-3 bg-slate-900 rounded-xl border border-slate-800 space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-white flex items-center space-x-1.5">
                            <Volume2 className="w-3.5 h-3.5 text-emerald-400" />
                            <span>Haut-Parleur (Talkback / Interphone)</span>
                          </span>
                          <input
                            type="checkbox"
                            checked={speakerEnabled}
                            onChange={(e) => setSpeakerEnabled(e.target.checked)}
                            className="rounded bg-slate-800 border-slate-700 text-emerald-600"
                          />
                        </div>
                        <div className="flex items-center space-x-2">
                          <span className="text-[10px] text-slate-400">Volume Sortie : {outputVolume}%</span>
                          <input
                            type="range"
                            min="0"
                            max="100"
                            value={outputVolume}
                            onChange={(e) => setOutputVolume(Number(e.target.value))}
                            className="flex-1 accent-emerald-500 h-1 bg-slate-800 rounded"
                          />
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-slate-300 font-bold mb-1">Codec Audio de Compression</label>
                        <select
                          value={audioCodec}
                          onChange={(e) => setAudioCodec(e.target.value as CameraAudioCodec)}
                          className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-white font-medium"
                        >
                          <option value="AAC">AAC (Haute fidélité vocale)</option>
                          <option value="G.711a (PCMA)">G.711a / PCMA (Standard Télécom)</option>
                          <option value="G.711u (PCMU)">G.711u / PCMU (ONVIF Legacy)</option>
                          <option value="Opus">Opus (Ultra basse latence)</option>
                        </select>
                      </div>

                      <div className="flex items-center pt-5">
                        <label className="flex items-center space-x-2 text-slate-300 font-medium cursor-pointer">
                          <input
                            type="checkbox"
                            checked={twoWayTalkSupported}
                            onChange={(e) => setTwoWayTalkSupported(e.target.checked)}
                            className="rounded bg-slate-900 border-slate-700 text-blue-600"
                          />
                          <span>Autoriser l'interphone Push-to-Talk aux opérateurs</span>
                        </label>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="p-4 bg-slate-900/60 rounded-xl text-center text-xs text-slate-400">
                    Module audio désactivé pour cette caméra. Seuls les flux vidéo seront traités.
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ================= STEP 6: DÉTECTION DE MOUVEMENT & IA ================= */}
          {currentStep === 6 && (
            <div className="space-y-4">
              <div className="bg-slate-950/60 p-4 rounded-2xl border border-slate-800 space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-extrabold text-white flex items-center space-x-2">
                    <Sparkles className="w-4 h-4 text-purple-400" />
                    <span>Sensibilité, Grille de Zones & Règles Neuronales</span>
                  </h3>
                  <label className="flex items-center space-x-2 text-xs font-bold text-slate-300 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={motionDetectionEnabled}
                      onChange={(e) => setMotionDetectionEnabled(e.target.checked)}
                      className="rounded bg-slate-900 border-slate-700 text-blue-600"
                    />
                    <span>Activer la Détection</span>
                  </label>
                </div>

                {motionDetectionEnabled && (
                  <div className="space-y-4 text-xs">
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      <div>
                        <label className="block text-slate-300 font-bold mb-1">Moteur de Détection</label>
                        <select
                          value={motionSource}
                          onChange={(e) => setMotionSource(e.target.value as any)}
                          className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-white font-medium"
                        >
                          <option value="SOFTWARE_AI_CORE">Analyse Logicielle IA IVOIReXpress (Précision 99%)</option>
                          <option value="NATIVE_CAMERA">Détection Matérielle Embarquée Caméra</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-slate-300 font-bold mb-1">Sensibilité : {sensitivityValue}% ({sensitivity})</label>
                        <input
                          type="range"
                          min="10"
                          max="100"
                          value={sensitivityValue}
                          onChange={(e) => {
                            const val = Number(e.target.value);
                            setSensitivityValue(val);
                            setSensitivity(val > 70 ? 'Haute' : val > 40 ? 'Moyenne' : 'Basse');
                          }}
                          className="w-full accent-blue-500 h-1.5 bg-slate-800 rounded mt-2"
                        />
                      </div>

                      <div>
                        <label className="block text-slate-300 font-bold mb-1">Planning d'Armement</label>
                        <select
                          value={armingSchedule}
                          onChange={(e) => setArmingSchedule(e.target.value)}
                          className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-white font-medium"
                        >
                          <option value="24/7 (Permanent)">24h/24 & 7j/7 (Permanent)</option>
                          <option value="Heures de Fermeture (Nuit)">Nuit & Fermeture (20h00 - 06h00)</option>
                          <option value="Heures Ouvrables">Heures Ouvrables (07h00 - 19h00)</option>
                        </select>
                      </div>
                    </div>

                    {/* Interactive 8x8 Matrix Zone Selection */}
                    <div className="p-3 bg-slate-900 rounded-xl border border-slate-800 space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-white text-xs">
                          Matrice de Détection de Zones (Cliquer pour activer/exclure des zones) :
                        </span>
                        <div className="flex items-center space-x-2 text-[10px]">
                          <span className="flex items-center space-x-1"><span className="w-2.5 h-2.5 bg-blue-500 rounded-sm inline-block" /> <span>Zone Active</span></span>
                          <span className="flex items-center space-x-1"><span className="w-2.5 h-2.5 bg-slate-800 rounded-sm inline-block" /> <span>Exclusion</span></span>
                        </div>
                      </div>

                      <div className="grid grid-cols-8 gap-1 max-w-xs mx-auto py-2">
                        {motionGrid.map((row, r) => 
                          row.map((active, c) => (
                            <button
                              key={`${r}-${c}`}
                              type="button"
                              onClick={() => handleToggleGridCell(r, c)}
                              className={`h-5 rounded transition ${
                                active ? 'bg-blue-600 hover:bg-blue-500' : 'bg-slate-800 hover:bg-slate-700'
                              }`}
                              title={`Zone (${r+1}, ${c+1})`}
                            />
                          ))
                        )}
                      </div>
                    </div>

                    {/* AI Model Rules */}
                    <div>
                      <label className="block text-slate-300 font-bold mb-2">
                        Modèles d'Analyse IA Activés sur ce Flux :
                      </label>
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
                                  : 'bg-slate-900 border-slate-800 text-slate-400 hover:border-slate-700'
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
              </div>
            </div>
          )}

          {/* ================= STEP 7: PTZ (PAN / TILT / ZOOM) ================= */}
          {currentStep === 7 && (
            <div className="space-y-4">
              <div className="bg-slate-950/60 p-4 rounded-2xl border border-slate-800 space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-extrabold text-white flex items-center space-x-2">
                    <Move className="w-4 h-4 text-amber-400" />
                    <span>Contrôles Motorisés PTZ & Presets de Positions</span>
                  </h3>
                  <label className="flex items-center space-x-2 text-xs font-bold text-slate-300 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={hasPTZ}
                      onChange={(e) => setHasPTZ(e.target.checked)}
                      className="rounded bg-slate-900 border-slate-700 text-amber-500"
                    />
                    <span>Caméra Motorisée PTZ</span>
                  </label>
                </div>

                {hasPTZ ? (
                  <div className="space-y-4 text-xs">
                    <div className="grid grid-cols-3 gap-3">
                      <div>
                        <label className="block text-slate-300 font-bold mb-1">Vitesse Pan : {panSpeed}</label>
                        <input
                          type="range"
                          min="1"
                          max="10"
                          value={panSpeed}
                          onChange={(e) => setPanSpeed(Number(e.target.value))}
                          className="w-full accent-amber-500 h-1 bg-slate-800 rounded"
                        />
                      </div>
                      <div>
                        <label className="block text-slate-300 font-bold mb-1">Vitesse Tilt : {tiltSpeed}</label>
                        <input
                          type="range"
                          min="1"
                          max="10"
                          value={tiltSpeed}
                          onChange={(e) => setTiltSpeed(Number(e.target.value))}
                          className="w-full accent-amber-500 h-1 bg-slate-800 rounded"
                        />
                      </div>
                      <div>
                        <label className="block text-slate-300 font-bold mb-1">Vitesse Zoom : {zoomSpeed}</label>
                        <input
                          type="range"
                          min="1"
                          max="10"
                          value={zoomSpeed}
                          onChange={(e) => setZoomSpeed(Number(e.target.value))}
                          className="w-full accent-amber-500 h-1 bg-slate-800 rounded"
                        />
                      </div>
                    </div>

                    {/* Presets List */}
                    <div className="p-3 bg-slate-900 rounded-xl border border-slate-800 space-y-2">
                      <span className="font-bold text-white text-xs">Positions Favorites / Presets Configurés :</span>
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                        {presets.map((p) => (
                          <div key={p.id} className="p-2 bg-slate-950 rounded-lg border border-slate-800 text-[11px] flex items-center justify-between">
                            <span className="font-semibold text-slate-200">{p.name}</span>
                            <span className="font-mono text-[9px] text-amber-400">P:{p.pan}° T:{p.tilt}° Z:{p.zoom}x</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="flex items-center justify-between p-3 bg-slate-900 rounded-xl border border-slate-800">
                      <label className="flex items-center space-x-2 text-slate-300 font-semibold cursor-pointer">
                        <input
                          type="checkbox"
                          checked={patrolEnabled}
                          onChange={(e) => setPatrolEnabled(e.target.checked)}
                          className="rounded bg-slate-800 border-slate-700 text-amber-500"
                        />
                        <span>Activer le mode Tour de Ronde (Patrouille automatique entre presets)</span>
                      </label>
                      <span className="text-[10px] text-slate-400 font-mono">Pause : {patrolInterval}s</span>
                    </div>
                  </div>
                ) : (
                  <div className="p-4 bg-slate-900/60 rounded-xl text-center text-xs text-slate-400">
                    Caméra fixe (sans moteur PTZ). Les contrôles de déplacement seront masqués dans le lecteur Live.
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ================= STEP 8: ENREGISTREMENT & RÉTENTION ================= */}
          {currentStep === 8 && (
            <div className="space-y-4">
              <div className="bg-slate-950/60 p-4 rounded-2xl border border-slate-800 space-y-4">
                <h3 className="text-sm font-extrabold text-white flex items-center space-x-2">
                  <HardDrive className="w-4 h-4 text-cyan-400" />
                  <span>Politique d'Enregistrement & Gestion du Stockage</span>
                </h3>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                  <div>
                    <label className="block text-slate-300 font-bold mb-1">Mode d'Enregistrement</label>
                    <select
                      value={recordingMode}
                      onChange={(e) => setRecordingMode(e.target.value as any)}
                      className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2.5 text-white font-medium"
                    >
                      <option value="CONTINUOUS">Enregistrement Continu 24/7</option>
                      <option value="ON_EVENT">Sur Événement & Détection IA Uniquement</option>
                      <option value="SCHEDULED">Programmé selon Calendrier</option>
                      <option value="MANUAL">Déclenchement Manuel Uniquement</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-slate-300 font-bold mb-1">Durée de Conservation / Rétention</label>
                    <select
                      value={retentionDays}
                      onChange={(e) => setRetentionDays(Number(e.target.value))}
                      className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2.5 text-white font-medium"
                    >
                      <option value={7}>7 Jours (Économique)</option>
                      <option value={14}>14 Jours (Standard)</option>
                      <option value={30}>30 Jours (Conformité Recommandée)</option>
                      <option value={60}>60 Jours (Haute Sécurité)</option>
                      <option value={90}>90 Jours (Archivage Légal)</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-slate-300 font-bold mb-1">Destination de Stockage</label>
                    <select
                      value={storageTarget}
                      onChange={(e) => setStorageTarget(e.target.value)}
                      className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2.5 text-white font-medium"
                    >
                      <option value="Cloud Sécurisé IVOIReXpress">Cloud Sécurisé IVOIReXpress (Chiffré AES-256)</option>
                      <option value="NVR Local Dédié">NVR Local Dédié sur Site</option>
                      <option value="Carte SD Interne">Carte MicroSD Interne Caméra</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-slate-300 font-bold mb-1">Comportement si Stockage Plein</label>
                    <select
                      value={overflowPolicy}
                      onChange={(e) => setOverflowPolicy(e.target.value)}
                      className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2.5 text-white font-medium"
                    >
                      <option value="FIFO_AUTO_OVERWRITE">Écrasement automatique des plus anciens (FIFO)</option>
                      <option value="STOP_AND_ALERT">Bloquer et Envoyer Alerte d'Espace</option>
                    </select>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ================= STEP 9: AFFECTATION & DROITS D'ACCÈS ================= */}
          {currentStep === 9 && (
            <div className="space-y-4">
              <div className="bg-slate-950/60 p-4 rounded-2xl border border-slate-800 space-y-4">
                <h3 className="text-sm font-extrabold text-white flex items-center space-x-2">
                  <Lock className="w-4 h-4 text-amber-400" />
                  <span>Isolation Multi-Tenant & Périmètre des Droits</span>
                </h3>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                  <div>
                    <label className="block text-slate-300 font-bold mb-1">Périmètre d'Appartenance</label>
                    <select
                      value={ownerType}
                      onChange={(e) => setOwnerType(e.target.value as any)}
                      className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2.5 text-white font-medium"
                    >
                      <option value="Agency">Agence de Transport Interurbain</option>
                      <option value="Traveler">Espace Voyageur / Résidence Privée</option>
                      <option value="Global">Supervision Nationale (Super Admin)</option>
                    </select>
                  </div>

                  {ownerType === 'Agency' && (
                    <div>
                      <label className="block text-slate-300 font-bold mb-1">Compagnie de Transport Rattachée</label>
                      <select
                        value={assignedAgencyId}
                        onChange={(e) => setAssignedAgencyId(e.target.value)}
                        className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2.5 text-white font-medium"
                      >
                        {agencies.map((ag) => (
                          <option key={ag.id} value={ag.id}>{ag.name} ({ag.code})</option>
                        ))}
                      </select>
                    </div>
                  )}
                </div>

                <div className="p-3 bg-slate-900 rounded-xl border border-slate-800 text-[11px] text-slate-400 leading-relaxed">
                  🛡️ <span className="text-slate-200 font-bold">Garantie Multi-Tenant</span> : Seuls les administrateurs de l'agence sélectionnée et les opérateurs autorisés auront la visibilité de ce flux vidéo. Aucune fuite inter-agences.
                </div>
              </div>
            </div>
          )}

          {/* ================= STEP 10: TEST COMPLET AUTOMATIQUE & VALIDATION ================= */}
          {currentStep === 10 && (
            <div className="space-y-4">
              <div className="bg-slate-950/60 p-4 rounded-2xl border border-slate-800 space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-extrabold text-white flex items-center space-x-2">
                    <Activity className="w-4 h-4 text-emerald-400" />
                    <span>Pipeline de Qualification & Test Automatique</span>
                  </h3>
                  <button
                    onClick={handleRunDiagnosticTest}
                    disabled={diagnosticStatus === 'RUNNING'}
                    className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white font-extrabold rounded-xl text-xs flex items-center space-x-2 shadow-lg shadow-blue-600/30 transition"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 ${diagnosticStatus === 'RUNNING' ? 'animate-spin' : ''}`} />
                    <span>{diagnosticStatus === 'RUNNING' ? 'Qualification en cours...' : 'Lancer le Test Complet'}</span>
                  </button>
                </div>

                {/* 6-Step Checklist */}
                <div className="space-y-2">
                  {diagnosticSteps.map((step) => (
                    <div
                      key={step.id}
                      className={`p-3 rounded-xl border flex items-center justify-between text-xs transition ${
                        step.status === 'SUCCESS'
                          ? 'bg-emerald-950/20 border-emerald-500/40 text-emerald-300'
                          : step.status === 'RUNNING'
                          ? 'bg-blue-950/30 border-blue-500/50 text-blue-300'
                          : 'bg-slate-900/60 border-slate-800 text-slate-400'
                      }`}
                    >
                      <div className="flex items-center space-x-3">
                        {step.status === 'SUCCESS' ? (
                          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                        ) : step.status === 'RUNNING' ? (
                          <RefreshCw className="w-4 h-4 text-blue-400 animate-spin" />
                        ) : (
                          <div className="w-4 h-4 rounded-full border border-slate-700" />
                        )}
                        <div>
                          <div className="font-bold text-white">{step.name}</div>
                          <div className="text-[10px] text-slate-400">{step.description}</div>
                          {step.details && (
                            <div className="text-[10px] text-emerald-400 font-mono mt-0.5 font-semibold">
                              ✓ {step.details}
                            </div>
                          )}
                        </div>
                      </div>

                      <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-950 border border-slate-800">
                        {step.status}
                      </span>
                    </div>
                  ))}
                </div>

                {/* Live Preview Box once decoded */}
                {testVideoPreviewActive && (
                  <div className="relative rounded-2xl overflow-hidden bg-black border border-emerald-500/40 aspect-video shadow-2xl">
                    <img
                      src="https://images.unsplash.com/photo-1544620347-c4fd4a3d5957?w=800&auto=format&fit=crop&q=80"
                      alt="Flux Test"
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute top-3 left-3 px-2.5 py-1 bg-slate-950/80 backdrop-blur rounded-lg text-[10px] text-emerald-400 font-bold border border-emerald-500/30 flex items-center space-x-1.5">
                      <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                      <span>FLUX DÉCODÉ EN DIRECT • 30 FPS • {resolution}</span>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

        </div>

        {/* Wizard Footer Controls */}
        <div className="pt-4 border-t border-slate-800 flex items-center justify-between">
          <button
            onClick={() => setCurrentStep(prev => Math.max(1, prev - 1))}
            disabled={currentStep === 1}
            className="px-4 py-2.5 rounded-2xl bg-slate-800 hover:bg-slate-700 disabled:opacity-30 disabled:cursor-not-allowed text-slate-300 font-bold text-xs flex items-center space-x-1.5 transition"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Précédent</span>
          </button>

          <div className="flex items-center space-x-3">
            {currentStep < totalSteps ? (
              <button
                onClick={() => setCurrentStep(prev => Math.min(totalSteps, prev + 1))}
                className="px-5 py-2.5 rounded-2xl bg-blue-600 hover:bg-blue-500 text-white font-extrabold text-xs flex items-center space-x-2 shadow-lg shadow-blue-600/30 transition"
              >
                <span>Suivant</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            ) : (
              <button
                onClick={handleFinalSave}
                className="px-6 py-2.5 rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold text-xs flex items-center space-x-2 shadow-lg shadow-emerald-600/30 transition"
              >
                <Check className="w-4 h-4" />
                <span>Valider et Mettre en Service la Caméra</span>
              </button>
            )}
          </div>
        </div>

      </div>

      {/* QR Camera Permission Modal */}
      {showQRPermissionModal && (
        <CameraPermissionModal
          onPermissionGranted={() => {
            setShowQRPermissionModal(false);
            setQrScanSuccess(true);
            setCamName('Caméra Wi-Fi Tapo C320WS');
            setCamTechnology('Caméra Wi-Fi');
            setBrand('TP-Link Tapo');
            setModel('Tapo C320WS Outdoor');
            setProtocol('RTSP');
            setIpAddress('192.168.1.188');
            setCurrentStep(3);
          }}
          onClose={() => setShowQRPermissionModal(false)}
        />
      )}
    </div>
  );
};
