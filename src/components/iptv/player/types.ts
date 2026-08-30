import { IPTVContentType, IPTVQuality, IPTVContentItem } from '../../../types/iptv';
import { StreamDiagnosticVerdict, StreamAnalysisResult } from './StreamAnalyzer';

export type PlayerDisplayMode = 'NORMAL' | 'CINEMA' | 'FULLSCREEN' | 'PIP';

export type PlaybackEngineType = 'HLS_JS' | 'NATIVE_HLS' | 'HTML5_VIDEO' | 'AUDIO_ONLY' | 'DIRECT_FETCH';

export type PlayerState = 
  | 'IDLE' 
  | 'LOADING' 
  | 'PLAYING' 
  | 'PAUSED' 
  | 'BUFFERING' 
  | 'STALLED' 
  | 'RECOVERING' 
  | 'ERROR' 
  | 'ENDED';

export interface StreamQualityLevel {
  id: number;
  label: string;
  width?: number;
  height?: number;
  bitrate?: number;
  isAuto?: boolean;
}

export interface StreamAudioTrack {
  id: number;
  label: string;
  lang?: string;
  isDefault?: boolean;
}

export interface StreamSubtitleTrack {
  id: number;
  label: string;
  lang?: string;
  isDefault?: boolean;
}

export interface StreamStats {
  engine: PlaybackEngineType;
  protocol: string;
  resolution: string;
  fps: number;
  bitrateKbps: number;
  bufferLengthSec: number;
  droppedFrames: number;
  latencySec: number;
  timeToFirstFrameMs?: number;
  manifestLoadTimeMs?: number;
  engineCascadeStep?: string;
  audioCodec?: string;
  videoCodec?: string;
  levelsCount: number;
  currentLevelIndex: number;
  audioTracksCount: number;
  currentAudioTrackIndex: number;
  subtitlesCount: number;
  reconnectionAttempts: number;
  diagnosticVerdict?: StreamDiagnosticVerdict;
  analysis?: StreamAnalysisResult;
}

export interface CastSessionState {
  isAvailable: boolean;
  isCasting: boolean;
  deviceName?: string;
  status: 'DISCONNECTED' | 'CONNECTING' | 'CONNECTED' | 'PAUSED' | 'ERROR';
}

export interface AirPlaySessionState {
  isAvailable: boolean;
  isAirPlayActive: boolean;
}

export interface EPGScheduleItem {
  id: string;
  title: string;
  subtitle?: string;
  category: string;
  startTime: string; // e.g. "20:00"
  endTime: string;   // e.g. "21:30"
  startMinutes: number; // minutes from midnight
  endMinutes: number;
  durationMinutes: number;
  progressPercent: number; // 0 to 100
  isLive: boolean;
  description?: string;
  rating?: string;
  presenter?: string;
}

export interface PlaybackDiagnosticLog {
  id: string;
  timestamp: string;
  level: 'INFO' | 'WARN' | 'ERROR' | 'RECOVERY' | 'SUCCESS';
  message: string;
  details?: Record<string, any>;
}

export interface SmartIPTVPlayerProps {
  content: IPTVContentItem;
  allContents: IPTVContentItem[];
  isFavorite: boolean;
  onToggleFavorite: (contentId: string) => void;
  onSelectContent: (content: IPTVContentItem) => void;
  onClose: () => void;
  savedProgressSeconds?: number;
  onRecordProgress?: (content: IPTVContentItem, progressSeconds: number, totalSeconds: number) => void;
  userRole?: string;
  userAgencyId?: string;
}

export type { StreamDiagnosticVerdict, StreamAnalysisResult };
