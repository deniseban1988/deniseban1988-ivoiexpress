import Hls from 'hls.js';
import { IPTVContentItem } from '../../../types/iptv';
import {
  PlaybackEngineType,
  PlayerState,
  StreamQualityLevel,
  StreamAudioTrack,
  StreamSubtitleTrack,
  StreamStats,
  PlaybackDiagnosticLog,
  StreamDiagnosticVerdict,
  StreamAnalysisResult
} from './types';
import { StreamAnalyzer } from './StreamAnalyzer';

export interface PlaybackEngineCallbacks {
  onStateChange: (state: PlayerState) => void;
  onStatsUpdate: (stats: StreamStats) => void;
  onQualityLevels: (levels: StreamQualityLevel[], currentLevel: number) => void;
  onAudioTracks: (tracks: StreamAudioTrack[], currentTrack: number) => void;
  onSubtitleTracks: (tracks: StreamSubtitleTrack[], currentTrack: number) => void;
  onError: (errorMessage: string, isFatal: boolean, canRetry: boolean, verdict?: StreamDiagnosticVerdict) => void;
  onLog: (log: PlaybackDiagnosticLog) => void;
  onStreamStarted: () => void;
}

export class SmartPlaybackEngine {
  private hls: Hls | null = null;
  private videoElement: HTMLVideoElement | null = null;
  private currentContent: IPTVContentItem | null = null;
  private callbacks: PlaybackEngineCallbacks;

  private engineType: PlaybackEngineType = 'HLS_JS';
  private playerState: PlayerState = 'IDLE';
  private retryCount = 0;
  private maxRetries = 2; // Fast bounded retries
  private retryTimeoutId: any = null;
  private statsIntervalId: any = null;
  private stallCheckIntervalId: any = null;
  private timeoutWatchdogId: any = null;

  private lastCurrentTime = 0;
  private lastStallTimestamp = 0;
  private isRecovering = false;
  private usingBackupUrl = false;

  // Performance telemetry
  private startTime = 0;
  private manifestLoadTimeMs = 0;
  private timeToFirstFrameMs = 0;
  private engineCascadeHistory: string[] = [];
  private currentCascadeIndex = 0;
  private availableEngines: PlaybackEngineType[] = [];

  private qualityLevels: StreamQualityLevel[] = [];
  private audioTracks: StreamAudioTrack[] = [];
  private subtitleTracks: StreamSubtitleTrack[] = [];
  private streamAnalysis: StreamAnalysisResult | null = null;
  private diagnosticVerdict: StreamDiagnosticVerdict | null = null;

  constructor(callbacks: PlaybackEngineCallbacks) {
    this.callbacks = callbacks;
  }

  /**
   * Attach video element and load content with smart detection and zero startup lag
   */
  public loadStream(video: HTMLVideoElement, content: IPTVContentItem, initialTimeSec = 0): void {
    this.destroy();
    this.videoElement = video;
    this.currentContent = content;
    this.retryCount = 0;
    this.usingBackupUrl = false;
    this.isRecovering = false;
    this.startTime = Date.now();
    this.manifestLoadTimeMs = 0;
    this.timeToFirstFrameMs = 0;
    this.engineCascadeHistory = [];
    this.currentCascadeIndex = 0;
    this.diagnosticVerdict = null;

    this.setPlayerState('LOADING');

    // Step 1: Deep stream analysis of real playlist URL
    this.streamAnalysis = StreamAnalyzer.analyzeStreamUrl(content.streamUrl, content.type);

    this.log('INFO', `Analyse du flux réel : ${content.name} (${this.streamAnalysis.protocol} - ${this.streamAnalysis.detectedFormat})`, {
      hostname: this.streamAnalysis.hostname,
      format: this.streamAnalysis.detectedFormat,
      isMixedContentRisk: this.streamAnalysis.isMixedContentRisk,
      recommendedEngine: this.streamAnalysis.recommendedEngine
    });

    if (this.streamAnalysis.isMixedContentRisk) {
      this.log('WARN', 'Avertissement de sécurité : Le flux utilise HTTP non chiffré alors que le site est en HTTPS.');
    }

    // Step 2: Build engine fallback cascade based on stream type & browser
    this.buildEngineCascade();

    // Step 3: Launch first engine in cascade immediately
    this.initCurrentCascadeEngine(initialTimeSec);
  }

  /**
   * Determine engine cascade order for fast, deterministic failover
   */
  private buildEngineCascade(): void {
    const analysis = this.streamAnalysis;
    const isRadio = this.currentContent?.type === 'RADIO';

    if (isRadio || analysis?.detectedFormat === 'AUDIO_MP3' || analysis?.detectedFormat === 'AUDIO_AAC') {
      this.availableEngines = ['AUDIO_ONLY', 'HTML5_VIDEO', 'HLS_JS'];
    } else if (analysis?.detectedFormat === 'MP4' || analysis?.detectedFormat === 'WEBM') {
      this.availableEngines = ['HTML5_VIDEO', 'HLS_JS', 'NATIVE_HLS'];
    } else {
      // Standard IPTV HLS stream
      if (analysis?.browserCompatibility.hlsJsSupported) {
        this.availableEngines = ['HLS_JS', 'NATIVE_HLS', 'HTML5_VIDEO'];
      } else if (analysis?.browserCompatibility.nativeHlsSupported) {
        this.availableEngines = ['NATIVE_HLS', 'HTML5_VIDEO'];
      } else {
        this.availableEngines = ['HTML5_VIDEO', 'HLS_JS'];
      }
    }
  }

  /**
   * Launch engine corresponding to current cascade index
   */
  private initCurrentCascadeEngine(initialTimeSec = 0): void {
    if (!this.videoElement || !this.currentContent) return;

    if (this.currentCascadeIndex >= this.availableEngines.length) {
      // If we exhausted all engines for primary URL and have a backup URL, try backup
      if (!this.usingBackupUrl && this.currentContent.backupStreamUrl) {
        this.usingBackupUrl = true;
        this.currentCascadeIndex = 0;
        this.log('RECOVERY', `Bascule automatique vers le flux de secours : ${this.currentContent.backupStreamUrl}`);
        this.initCurrentCascadeEngine(initialTimeSec);
        return;
      }

      // Complete failure across all engines
      this.handleFinalDiagnosticFailure();
      return;
    }

    const currentEngine = this.availableEngines[this.currentCascadeIndex];
    this.engineType = currentEngine;
    this.engineCascadeHistory.push(currentEngine);

    const streamUrl = this.usingBackupUrl && this.currentContent.backupStreamUrl
      ? this.currentContent.backupStreamUrl
      : this.currentContent.streamUrl;

    if (!streamUrl || streamUrl.trim() === '') {
      this.handleFatalError('URL de flux manquante ou vide dans la playlist.');
      return;
    }

    this.log('INFO', `Démarrage du moteur [Cascade #${this.currentCascadeIndex + 1}] : ${currentEngine}`);

    // Set a fast startup watchdog timer (6 seconds per engine attempt)
    this.armStartupWatchdog();

    switch (currentEngine) {
      case 'HLS_JS':
        this.initHlsJs(streamUrl.trim(), initialTimeSec);
        break;
      case 'NATIVE_HLS':
        this.initNativeHls(streamUrl.trim(), initialTimeSec);
        break;
      case 'HTML5_VIDEO':
        this.initHtml5Direct(streamUrl.trim(), 'HTML5_VIDEO', initialTimeSec);
        break;
      case 'AUDIO_ONLY':
        this.initHtml5Direct(streamUrl.trim(), 'AUDIO_ONLY', initialTimeSec);
        break;
      default:
        this.initHlsJs(streamUrl.trim(), initialTimeSec);
        break;
    }

    this.startMonitoring();
  }

  /**
   * Watchdog timer to prevent hanging if an engine is silently waiting
   */
  private armStartupWatchdog(): void {
    if (this.timeoutWatchdogId) clearTimeout(this.timeoutWatchdogId);
    this.timeoutWatchdogId = setTimeout(() => {
      if (this.playerState === 'LOADING' || this.playerState === 'BUFFERING') {
        this.log('WARN', `Délai de connexion dépassé pour le moteur ${this.engineType} (6s). Bascule vers le moteur suivant.`);
        this.advanceToNextEngine('Délai d\'attente dépassé (Timeout moteur)');
      }
    }, 6500);
  }

  private clearStartupWatchdog(): void {
    if (this.timeoutWatchdogId) {
      clearTimeout(this.timeoutWatchdogId);
      this.timeoutWatchdogId = null;
    }
  }

  /**
   * Advance to next engine in cascade on failure
   */
  private advanceToNextEngine(reason: string): void {
    this.clearStartupWatchdog();
    this.destroyHls();

    this.currentCascadeIndex++;
    if (this.currentCascadeIndex < this.availableEngines.length) {
      this.log('RECOVERY', `Tentative avec moteur alternatif suite à : ${reason}`);
      this.setPlayerState('RECOVERING');
      setTimeout(() => {
        this.initCurrentCascadeEngine();
      }, 150);
    } else if (!this.usingBackupUrl && this.currentContent?.backupStreamUrl) {
      this.usingBackupUrl = true;
      this.currentCascadeIndex = 0;
      this.log('RECOVERY', `Tentative sur le flux de secours suite à : ${reason}`);
      this.setPlayerState('RECOVERING');
      setTimeout(() => {
        this.initCurrentCascadeEngine();
      }, 150);
    } else {
      this.handleFinalDiagnosticFailure(reason);
    }
  }

  /**
   * Ultra-Fast Low Latency HLS.js Engine
   */
  private initHlsJs(url: string, initialTimeSec: number): void {
    this.destroyHls();

    if (!Hls.isSupported()) {
      this.log('WARN', 'MSE / Hls.js non pris en charge par ce navigateur. Bascule vers moteur suivant.');
      this.advanceToNextEngine('MSE non pris en charge');
      return;
    }

    try {
      this.hls = new Hls({
        enableWorker: true,
        lowLatencyMode: true,
        startFragPrefetch: true, // Fetch first fragment immediately without waiting for full manifest parsing
        testBandwidth: false,    // Bypass bandwidth testing delay on startup
        liveSyncDurationCount: 1, // Start on the live edge immediately
        liveMaxLatencyDurationCount: 4,
        maxBufferLength: 6,      // Fast initial buffering (6s max)
        maxMaxBufferLength: 12,
        backBufferLength: 30,
        maxBufferHole: 0.5,
        highBufferWatchdogPeriod: 2,
        nudgeOffset: 0.1,
        nudgeMaxRetry: 3,
        fragLoadingTimeOut: 6000,
        manifestLoadingTimeOut: 6000,
        levelLoadingTimeOut: 6000,
        autoStartLoad: true
      });

      this.hls.attachMedia(this.videoElement!);

      this.hls.on(Hls.Events.MEDIA_ATTACHED, () => {
        this.hls?.loadSource(url);
      });

      this.hls.on(Hls.Events.MANIFEST_LOADED, (_, data) => {
        this.manifestLoadTimeMs = Date.now() - this.startTime;
        this.log('SUCCESS', `Manifest HLS chargé en ${this.manifestLoadTimeMs}ms (${data.levels.length} qualités détectées)`);
      });

      this.hls.on(Hls.Events.MANIFEST_PARSED, (_, data) => {
        // Extract qualities
        this.qualityLevels = [
          { id: -1, label: 'Auto (Adaptatif)', isAuto: true },
          ...data.levels.map((lvl, index) => {
            const height = lvl.height || 0;
            const bitrateMbps = lvl.bitrate ? (lvl.bitrate / 1000000).toFixed(1) : '';
            const label = height > 0 
              ? `${height}p ${bitrateMbps ? `(${bitrateMbps} Mbps)` : ''}`
              : `Niveau ${index + 1} ${bitrateMbps ? `(${bitrateMbps} Mbps)` : ''}`;
            return {
              id: index,
              label,
              width: lvl.width,
              height: lvl.height,
              bitrate: lvl.bitrate
            };
          })
        ];

        this.callbacks.onQualityLevels(this.qualityLevels, -1);

        if (initialTimeSec > 0 && this.videoElement && this.currentContent?.duration !== 'En Direct') {
          this.videoElement.currentTime = initialTimeSec;
        }

        // Fast instant playback
        const playPromise = this.videoElement?.play();
        if (playPromise !== undefined) {
          playPromise.then(() => {
            this.handlePlaybackSuccess();
          }).catch((err) => {
            // Autoplay with audio was prevented, try to play
            this.log('WARN', `Autoplay en attente d'interaction : ${err?.message || ''}`);
            this.setPlayerState('PAUSED');
          });
        }
      });

      // Track extraction
      this.hls.on(Hls.Events.AUDIO_TRACKS_UPDATED, (_, data) => {
        this.audioTracks = (data.audioTracks || []).map((track, idx) => ({
          id: idx,
          label: track.name || track.lang || `Piste ${idx + 1}`,
          lang: track.lang,
          isDefault: track.default
        }));
        this.callbacks.onAudioTracks(this.audioTracks, this.hls?.audioTrack ?? 0);
      });

      this.hls.on(Hls.Events.SUBTITLE_TRACKS_UPDATED, (_, data) => {
        this.subtitleTracks = (data.subtitleTracks || []).map((track, idx) => ({
          id: idx,
          label: track.name || track.lang || `Sous-titre ${idx + 1}`,
          lang: track.lang,
          isDefault: track.default
        }));
        this.callbacks.onSubtitleTracks(this.subtitleTracks, this.hls?.subtitleTrack ?? -1);
      });

      this.hls.on(Hls.Events.FRAG_LOADED, () => {
        if (!this.timeToFirstFrameMs) {
          this.timeToFirstFrameMs = Date.now() - this.startTime;
          this.log('SUCCESS', `Premier segment vidéo décodé (TTFF: ${this.timeToFirstFrameMs}ms)`);
        }
      });

      this.hls.on(Hls.Events.ERROR, (_, data) => {
        if (data.fatal) {
          this.log('ERROR', `Erreur Hls.js [${data.type}] : ${data.details}`);
          this.advanceToNextEngine(`Erreur fatale HLS (${data.details})`);
        } else if (data.type === Hls.ErrorTypes.MEDIA_ERROR) {
          this.log('WARN', 'Erreur média non fatale, récupération du décodeur');
          this.hls?.recoverMediaError();
        }
      });

    } catch (err: any) {
      this.log('ERROR', `Exception Hls.js : ${err.message}`);
      this.advanceToNextEngine('Exception initialisation HLS');
    }
  }

  /**
   * Native Apple HLS Engine (Safari / iOS)
   */
  private initNativeHls(url: string, initialTimeSec: number): void {
    const video = this.videoElement!;
    video.src = url;

    const onLoadedMetadata = () => {
      this.manifestLoadTimeMs = Date.now() - this.startTime;
      this.log('SUCCESS', `Métadonnées HLS chargées en ${this.manifestLoadTimeMs}ms via moteur natif Apple`);
      this.qualityLevels = [{ id: -1, label: 'Auto (Apple AVFoundation)', isAuto: true }];
      this.callbacks.onQualityLevels(this.qualityLevels, -1);

      if (initialTimeSec > 0 && this.currentContent?.duration !== 'En Direct') {
        video.currentTime = initialTimeSec;
      }

      video.play().then(() => {
        this.handlePlaybackSuccess();
      }).catch(() => {
        this.setPlayerState('PAUSED');
      });
    };

    const onError = () => {
      this.advanceToNextEngine('Erreur de lecture sur moteur Apple HLS natif');
    };

    video.addEventListener('loadedmetadata', onLoadedMetadata, { once: true });
    video.addEventListener('error', onError, { once: true });
  }

  /**
   * HTML5 Direct Engine (MP4, MP3, WebM, Direct TS fallback)
   */
  private initHtml5Direct(url: string, type: 'HTML5_VIDEO' | 'AUDIO_ONLY', initialTimeSec: number): void {
    const video = this.videoElement!;
    video.src = url;

    const onLoadedData = () => {
      this.manifestLoadTimeMs = Date.now() - this.startTime;
      this.log('SUCCESS', `Connexion flux direct (${type}) établie en ${this.manifestLoadTimeMs}ms`);
      this.qualityLevels = [{ id: -1, label: 'Flux Direct Standard', isAuto: true }];
      this.callbacks.onQualityLevels(this.qualityLevels, -1);

      if (initialTimeSec > 0 && this.currentContent?.duration !== 'En Direct') {
        video.currentTime = initialTimeSec;
      }

      video.play().then(() => {
        this.handlePlaybackSuccess();
      }).catch(() => {
        this.setPlayerState('PAUSED');
      });
    };

    const onError = () => {
      this.advanceToNextEngine(`Impossible de lire le flux direct via ${type}`);
    };

    video.addEventListener('loadeddata', onLoadedData, { once: true });
    video.addEventListener('error', onError, { once: true });
  }

  /**
   * Called when stream starts playing successfully
   */
  private handlePlaybackSuccess(): void {
    this.clearStartupWatchdog();
    if (!this.timeToFirstFrameMs) {
      this.timeToFirstFrameMs = Date.now() - this.startTime;
    }
    this.setPlayerState('PLAYING');
    this.callbacks.onStreamStarted();
    this.log('SUCCESS', `Lecture active (${this.engineType}) en ${this.timeToFirstFrameMs}ms`);
  }

  /**
   * Final diagnostic when all engines in cascade fail
   */
  private handleFinalDiagnosticFailure(lastErrorReason?: string): void {
    this.clearStartupWatchdog();
    this.setPlayerState('ERROR');

    if (this.currentContent) {
      this.diagnosticVerdict = StreamAnalyzer.diagnoseFailure(this.currentContent, {
        message: lastErrorReason,
        details: this.engineCascadeHistory.join(' -> ')
      });

      this.log('ERROR', `Diagnostic Final : ${this.diagnosticVerdict.title}`, {
        rootCause: this.diagnosticVerdict.rootCause,
        solution: this.diagnosticVerdict.suggestedSolution,
        cascadeTested: this.engineCascadeHistory
      });

      this.callbacks.onError(
        this.diagnosticVerdict.title,
        true,
        this.diagnosticVerdict.isRecoverable,
        this.diagnosticVerdict
      );
    }
  }

  private handleFatalError(message: string): void {
    this.clearStartupWatchdog();
    this.setPlayerState('ERROR');
    this.log('ERROR', message);
    this.callbacks.onError(message, true, true);
  }

  /**
   * Health monitoring (every 1s) and stall watchdog
   */
  private startMonitoring(): void {
    this.stopMonitoring();

    this.statsIntervalId = setInterval(() => {
      if (!this.videoElement) return;

      const video = this.videoElement;
      let bufferLengthSec = 0;
      if (video.buffered.length > 0) {
        for (let i = 0; i < video.buffered.length; i++) {
          if (video.buffered.start(i) <= video.currentTime && video.currentTime <= video.buffered.end(i)) {
            bufferLengthSec = Number((video.buffered.end(i) - video.currentTime).toFixed(1));
            break;
          }
        }
      }

      const quality = (video as any).getVideoPlaybackQuality ? (video as any).getVideoPlaybackQuality() : null;
      const droppedFrames = quality?.droppedVideoFrames || 0;

      let bitrateKbps = 0;
      let currentLevelIndex = -1;
      let latencySec = 0;

      if (this.hls) {
        currentLevelIndex = this.hls.currentLevel;
        if (currentLevelIndex >= 0 && this.hls.levels[currentLevelIndex]) {
          bitrateKbps = Math.round((this.hls.levels[currentLevelIndex].bitrate || 0) / 1000);
        } else if (this.hls.bandwidthEstimate) {
          bitrateKbps = Math.round(this.hls.bandwidthEstimate / 1000);
        }
        latencySec = this.hls.latency || 0;
      }

      const stats: StreamStats = {
        engine: this.engineType,
        protocol: this.currentContent?.streamUrl?.startsWith('https') ? 'HTTPS Stream' : 'HTTP Stream',
        resolution: video.videoWidth ? `${video.videoWidth}x${video.videoHeight}` : (this.engineType === 'AUDIO_ONLY' ? 'Audio Direct' : 'Détection en cours'),
        fps: 30,
        bitrateKbps: bitrateKbps || (this.engineType === 'AUDIO_ONLY' ? 128 : 2500),
        bufferLengthSec,
        droppedFrames,
        latencySec: Number(latencySec.toFixed(2)),
        timeToFirstFrameMs: this.timeToFirstFrameMs,
        manifestLoadTimeMs: this.manifestLoadTimeMs,
        engineCascadeStep: `${this.engineType} (${this.currentCascadeIndex + 1}/${this.availableEngines.length})`,
        levelsCount: this.qualityLevels.length,
        currentLevelIndex,
        audioTracksCount: this.audioTracks.length,
        currentAudioTrackIndex: this.hls?.audioTrack ?? 0,
        subtitlesCount: this.subtitleTracks.length,
        reconnectionAttempts: this.retryCount,
        diagnosticVerdict: this.diagnosticVerdict || undefined,
        analysis: this.streamAnalysis || undefined
      };

      this.callbacks.onStatsUpdate(stats);
    }, 1000);

    // Stall detector interval
    this.stallCheckIntervalId = setInterval(() => {
      if (!this.videoElement || this.playerState !== 'PLAYING') return;

      const curTime = this.videoElement.currentTime;
      const now = Date.now();

      if (Math.abs(curTime - this.lastCurrentTime) < 0.05) {
        if (!this.lastStallTimestamp) {
          this.lastStallTimestamp = now;
        } else if (now - this.lastStallTimestamp > 4000 && !this.isRecovering) {
          this.log('WARN', 'Blocage du flux détecté (Stall) : Déclenchement de la relance du tampon');
          this.isRecovering = true;
          if (this.hls) {
            this.hls.recoverMediaError();
          } else {
            this.videoElement.currentTime += 0.1;
          }
          setTimeout(() => { this.isRecovering = false; }, 2000);
        }
      } else {
        this.lastStallTimestamp = 0;
        this.lastCurrentTime = curTime;
      }
    }, 3000);
  }

  private stopMonitoring(): void {
    if (this.statsIntervalId) {
      clearInterval(this.statsIntervalId);
      this.statsIntervalId = null;
    }
    if (this.stallCheckIntervalId) {
      clearInterval(this.stallCheckIntervalId);
      this.stallCheckIntervalId = null;
    }
  }

  public setQualityLevel(levelIndex: number): void {
    if (this.hls) {
      this.hls.currentLevel = levelIndex;
      this.log('INFO', `Sélection manuelle de qualité : ${levelIndex === -1 ? 'Auto' : `Niveau ${levelIndex}`}`);
    }
  }

  public setAudioTrack(trackIndex: number): void {
    if (this.hls && trackIndex >= 0 && trackIndex < this.audioTracks.length) {
      this.hls.audioTrack = trackIndex;
      this.log('INFO', `Piste audio activée : ${this.audioTracks[trackIndex]?.label}`);
    }
  }

  public setSubtitleTrack(trackIndex: number): void {
    if (this.hls) {
      this.hls.subtitleTrack = trackIndex;
      this.log('INFO', `Piste sous-titres : ${trackIndex === -1 ? 'Désactivée' : this.subtitleTracks[trackIndex]?.label}`);
    }
  }

  public manualRetry(): void {
    if (!this.videoElement || !this.currentContent) return;
    this.currentCascadeIndex = 0;
    this.usingBackupUrl = false;
    this.setPlayerState('LOADING');
    this.destroyHls();
    this.initCurrentCascadeEngine();
  }

  private setPlayerState(state: PlayerState): void {
    this.playerState = state;
    this.callbacks.onStateChange(state);
  }

  private log(level: 'INFO' | 'WARN' | 'ERROR' | 'RECOVERY' | 'SUCCESS', message: string, details?: Record<string, any>): void {
    const logItem: PlaybackDiagnosticLog = {
      id: `log-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
      timestamp: new Date().toLocaleTimeString('fr-FR'),
      level,
      message,
      details
    };
    this.callbacks.onLog(logItem);
  }

  private destroyHls(): void {
    if (this.hls) {
      try {
        this.hls.stopLoad();
        this.hls.detachMedia();
        this.hls.destroy();
      } catch (err) {
        console.warn('Error destroying HLS instance:', err);
      }
      this.hls = null;
    }
  }

  public destroy(): void {
    this.clearStartupWatchdog();
    this.stopMonitoring();
    if (this.retryTimeoutId) {
      clearTimeout(this.retryTimeoutId);
      this.retryTimeoutId = null;
    }
    this.destroyHls();
    if (this.videoElement) {
      this.videoElement.removeAttribute('src');
      this.videoElement.load();
    }
    this.playerState = 'IDLE';
  }
}
