import { CameraCategoryType, CameraProtocol, CameraTechnology, AIModelDetection, UserRole } from './index';

export type CameraStatusCode = 'ONLINE' | 'DEGRADED' | 'OFFLINE' | 'INCOMPLETE_CONFIG' | 'ALERT';

export type CameraManufacturer = 
  | 'Hikvision'
  | 'Dahua Technology'
  | 'Axis Communications'
  | 'Reolink'
  | 'Uniview (UNV)'
  | 'Bosch Security'
  | 'TP-Link Tapo'
  | 'Hanwha Techwin'
  | 'Ubiquiti UniFi'
  | 'Générique ONVIF'
  | 'Autre / Personnalisé';

export type CameraVideoCodec = 'H.264' | 'H.265 / HEVC' | 'MJPEG' | 'AV1';
export type CameraAudioCodec = 'G.711a (PCMA)' | 'G.711u (PCMU)' | 'AAC' | 'Opus' | 'Désactivé';

export interface CameraNetworkConfig {
  ipAddress: string;
  port: number;
  rtspPort: number;
  onvifPort: number;
  httpPort: number;
  httpsPort: number;
  useHttps: boolean;
  protocol: 'ONVIF' | 'RTSP' | 'HTTP/HTTPS' | 'HLS' | 'WebRTC';
  macAddress?: string;
  gateway?: string;
  subnetMask?: string;
  dns?: string;
  mtu?: number;
  connectionTested: boolean;
  lastPingMs?: number;
  lastTestTimestamp?: string;
  lastTestSuccess?: boolean;
}

export interface CameraSecurityCredentials {
  username: string;
  passwordMasked: string;
  isPasswordSet: boolean;
  authMethod: 'Digest' | 'Basic' | 'Token' | 'None';
  encryptionStandard: 'AES-256' | 'TLS 1.3' | 'Standard';
  lastCredentialsUpdate?: string;
}

export interface CameraVideoStreamConfig {
  mainStreamUrl: string;
  subStreamUrl?: string;
  hlsStreamUrl?: string;
  snapshotUrl?: string;
  activeStream: 'MAIN' | 'SUB';
  codec: CameraVideoCodec;
  resolution: '4K Ultra HD (3840x2160)' | '1080p Full HD (1920x1080)' | '720p HD (1280x720)' | '480p SD Éco (640x480)';
  fps: number; // 15, 20, 25, 30, 60
  bitrateKbps: number; // 512, 1024, 2048, 4096, 8192
  rateControl: 'CBR' | 'VBR';
  qualityLevel: 'Excellente' | 'Haute' | 'Standard' | 'Basse';
  videoProfile: 'Main Profile' | 'High Profile' | 'Baseline';
  orientation: '0° (Normal)' | '90° (Vertical)' | '180° (Inversé)' | '270° (Vertical inversé)';
  nightVisionMode: 'Auto (Capteur Crépusculaire)' | 'Couleur Permanent (ColorVu / Full-Color)' | 'Infrarouge N&B' | 'Double Éclairage Intelligent';
  irLedIntensity: number; // 0-100%
  wdrEnabled: boolean; // Wide Dynamic Range
}

export interface CameraAudioConfig {
  supported: boolean;
  enabled: boolean;
  microphoneEnabled: boolean;
  speakerEnabled: boolean;
  twoWayAudioSupported: boolean;
  codec: CameraAudioCodec;
  inputVolume: number; // 0-100
  outputVolume: number; // 0-100
  noiseSuppression: boolean;
}

export interface CameraMotionConfig {
  enabled: boolean;
  source: 'NATIVE_CAMERA' | 'SOFTWARE_AI_CORE';
  sensitivity: number; // 1-100
  threshold: number; // 1-100
  detectionGrid: boolean[][]; // 8x8 matrix for zone selection
  excludedZonesCount: number;
  armingSchedule: '24/7 (Permanent)' | 'Heures de Fermeture (Nuit)' | 'Heures Ouvrables' | 'Personnalisé';
  recordOnMotion: boolean;
  sendPushNotification: boolean;
  sendEmailNotification: boolean;
  triggerSiren: boolean;
  aiDetectionRules: AIModelDetection[];
}

export interface PTZPreset {
  id: string;
  name: string;
  pan: number;
  tilt: number;
  zoom: number;
}

export interface CameraPTZConfig {
  supported: boolean;
  panSpeed: number; // 1-10
  tiltSpeed: number;
  zoomSpeed: number;
  presets: PTZPreset[];
  activePresetId?: string;
  patrolModeEnabled: boolean;
  patrolIntervalSeconds: number;
  autoTrackingEnabled: boolean;
}

export interface CameraRecordingConfig {
  mode: 'CONTINUOUS' | 'ON_EVENT' | 'SCHEDULED' | 'MANUAL';
  retentionDays: 7 | 14 | 30 | 60 | 90;
  storageTarget: 'Cloud Sécurisé IVOIReXpress' | 'NVR Local Dédié' | 'Carte SD Interne';
  diskSpaceAllocatedGb: number;
  diskSpaceUsedGb: number;
  overflowPolicy: 'FIFO_AUTO_OVERWRITE' | 'STOP_AND_ALERT';
  recordingStream: 'MAIN_STREAM_HD' | 'SUB_STREAM_ECO';
}

export interface CameraAccessPermissions {
  tenantScope: 'TRAVELER' | 'AGENCY' | 'HOTEL' | 'GLOBAL';
  assignedAgencyId?: string;
  assignedHotelId?: string;
  assignedUserId?: string;
  allowedRoles: UserRole[];
  isPublicForTravelers: boolean;
}

export interface DiscoveredONVIFDevice {
  ipAddress: string;
  port: number;
  manufacturer: CameraManufacturer;
  model: string;
  firmwareVersion: string;
  serialNumber: string;
  macAddress: string;
  onvifVersion: string;
  profiles: {
    mainProfile: { name: string; resolution: string; codec: string; streamUri: string };
    subProfile?: { name: string; resolution: string; codec: string; streamUri: string };
  };
  ptzSupported: boolean;
  audioSupported: boolean;
}

export interface CameraDiagnosticStep {
  id: string;
  name: string;
  description: string;
  status: 'PENDING' | 'RUNNING' | 'SUCCESS' | 'WARNING' | 'FAILED';
  durationMs?: number;
  details?: string;
}

export interface CameraEventLog {
  id: string;
  cameraId: string;
  cameraName: string;
  timestamp: string;
  eventType: 'MOTION' | 'AI_ALERT' | 'ONLINE' | 'OFFLINE' | 'CONFIG_CHANGE' | 'PTZ_PATROL' | 'RECORDING_START' | 'AUTH_ERROR';
  severity: 'INFO' | 'WARNING' | 'CRITICAL';
  description: string;
  user?: string;
}
