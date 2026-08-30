import React, { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import { IPTVContentItem } from '../../../types/iptv';
import {
  PlayerDisplayMode,
  PlayerState,
  StreamQualityLevel,
  StreamAudioTrack,
  StreamSubtitleTrack,
  StreamStats,
  PlaybackDiagnosticLog,
  CastSessionState,
  AirPlaySessionState,
  SmartIPTVPlayerProps
} from './types';
import { SmartPlaybackEngine } from './SmartPlaybackEngine';
import { CastController } from './CastController';
import { EPGHelper } from './EPGHelper';
import { StatsForNerdsModal } from './StatsForNerdsModal';
import { MiniEPGGuideDrawer } from './MiniEPGGuideDrawer';
import {
  Play,
  Pause,
  Volume2,
  VolumeX,
  Volume1,
  Maximize,
  Minimize,
  Sliders,
  Tv,
  Radio,
  Heart,
  RotateCcw,
  RefreshCw,
  AlertTriangle,
  Loader2,
  Lock,
  Unlock,
  Cast,
  Airplay,
  Calendar,
  Activity,
  Layers,
  ChevronLeft,
  ChevronRight,
  Sparkles,
  Gauge,
  HelpCircle,
  X,
  FastForward,
  Rewind,
  MessageSquare,
  Headphones,
  CheckCircle2,
  Share2,
  Sun,
  ShieldCheck,
  Info
} from 'lucide-react';

export const SmartIPTVPlayerPremium: React.FC<SmartIPTVPlayerProps> = ({
  content,
  allContents,
  isFavorite,
  onToggleFavorite,
  onSelectContent,
  onClose,
  savedProgressSeconds = 0,
  onRecordProgress,
  userRole,
  userAgencyId
}) => {
  // DOM References
  const containerRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const engineRef = useRef<SmartPlaybackEngine | null>(null);
  const controlsTimeoutRef = useRef<any>(null);
  const castControllerRef = useRef<CastController>(CastController.getInstance());

  // Player States
  const [displayMode, setDisplayMode] = useState<PlayerDisplayMode>('NORMAL');
  const [playerState, setPlayerState] = useState<PlayerState>('LOADING');
  const [isPlaying, setIsPlaying] = useState<boolean>(true);
  const [volume, setVolume] = useState<number>(0.85);
  const [isMuted, setIsMuted] = useState<boolean>(false);
  const [currentTime, setCurrentTime] = useState<number>(0);
  const [duration, setDuration] = useState<number>(0);
  const [playbackRate, setPlaybackRate] = useState<number>(1);
  const [isLocked, setIsLocked] = useState<boolean>(false);
  const [showControls, setShowControls] = useState<boolean>(true);

  // Stream Metrics & Tracks
  const [stats, setStats] = useState<StreamStats | null>(null);
  const [logs, setLogs] = useState<PlaybackDiagnosticLog[]>([]);
  const [qualityLevels, setQualityLevels] = useState<StreamQualityLevel[]>([]);
  const [currentQualityIndex, setCurrentQualityIndex] = useState<number>(-1);
  const [audioTracks, setAudioTracks] = useState<StreamAudioTrack[]>([]);
  const [currentAudioIndex, setCurrentAudioIndex] = useState<number>(0);
  const [subtitleTracks, setSubtitleTracks] = useState<StreamSubtitleTrack[]>([]);
  const [currentSubtitleIndex, setCurrentSubtitleIndex] = useState<number>(-1);

  // Menus & Drawers
  const [showQualityMenu, setShowQualityMenu] = useState<boolean>(false);
  const [showAudioMenu, setShowAudioMenu] = useState<boolean>(false);
  const [showSpeedMenu, setShowSpeedMenu] = useState<boolean>(false);
  const [showMiniEPG, setShowMiniEPG] = useState<boolean>(false);
  const [showStatsModal, setShowStatsModal] = useState<boolean>(false);
  const [showShortcutsModal, setShowShortcutsModal] = useState<boolean>(false);

  // Error & Recovery states
  const [streamError, setStreamError] = useState<string | null>(null);
  const [promptResume, setPromptResume] = useState<boolean>(savedProgressSeconds > 15);
  const [showSeekFeedback, setShowSeekFeedback] = useState<'+10' | '-10' | null>(null);
  const [brightnessLevel, setBrightnessLevel] = useState<number>(100);
  const [gestureOverlay, setGestureOverlay] = useState<{ type: 'VOLUME' | 'BRIGHTNESS'; value: number } | null>(null);

  // Cast & AirPlay states
  const [castState, setCastState] = useState<CastSessionState>(castControllerRef.current.getCastState());
  const [airPlayState, setAirPlayState] = useState<AirPlaySessionState>(castControllerRef.current.getAirPlayState());

  const isRadio = content.type === 'RADIO';
  const isLive = content.type === 'TV' || content.type === 'RADIO' || content.duration === 'En Direct';

  // Live EPG program calculation
  const currentLiveProgram = useMemo(() => {
    return EPGHelper.getCurrentLiveProgram(content);
  }, [content]);

  // Find neighbor channels for rapid zapping
  const { prevChannel, nextChannel } = useMemo(() => {
    const safeList = allContents || [];
    const currentIndex = safeList.findIndex(c => c && c.id === content.id);
    if (currentIndex === -1 || safeList.length <= 1) {
      return { prevChannel: null, nextChannel: null };
    }
    const prev = safeList[(currentIndex - 1 + safeList.length) % safeList.length];
    const next = safeList[(currentIndex + 1) % safeList.length];
    return { prevChannel: prev, nextChannel: next };
  }, [allContents, content.id]);

  // Auto-hide controls HUD timer
  const resetControlsTimeout = useCallback(() => {
    if (isLocked) return;
    setShowControls(true);
    if (controlsTimeoutRef.current) clearTimeout(controlsTimeoutRef.current);
    controlsTimeoutRef.current = setTimeout(() => {
      if (isPlaying && !showQualityMenu && !showAudioMenu && !showSpeedMenu && !showMiniEPG && !showStatsModal && !showShortcutsModal) {
        setShowControls(false);
      }
    }, 3800);
  }, [isPlaying, isLocked, showQualityMenu, showAudioMenu, showSpeedMenu, showMiniEPG, showStatsModal, showShortcutsModal]);

  // Handle stream initialization with SmartPlaybackEngine
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    setStreamError(null);
    setLogs([]);
    setQualityLevels([]);
    setAudioTracks([]);
    setSubtitleTracks([]);
    setPlayerState('LOADING');
    setIsPlaying(true);

    const engine = new SmartPlaybackEngine({
      onStateChange: (state) => {
        setPlayerState(state);
        if (state === 'PLAYING') setIsPlaying(true);
        if (state === 'PAUSED') setIsPlaying(false);
      },
      onStatsUpdate: (newStats) => {
        setStats(newStats);
      },
      onQualityLevels: (levels, currentIdx) => {
        setQualityLevels(levels);
        setCurrentQualityIndex(currentIdx);
      },
      onAudioTracks: (tracks, currentIdx) => {
        setAudioTracks(tracks);
        setCurrentAudioIndex(currentIdx);
      },
      onSubtitleTracks: (tracks, currentIdx) => {
        setSubtitleTracks(tracks);
        setCurrentSubtitleIndex(currentIdx);
      },
      onError: (errMsg, isFatal, canRetry, verdict) => {
        setStreamError(errMsg);
      },
      onLog: (newLog) => {
        setLogs(prev => [newLog, ...prev.slice(0, 49)]);
      },
      onStreamStarted: () => {
        setIsPlaying(true);
        setStreamError(null);
      }
    });

    engineRef.current = engine;
    engine.loadStream(video, content, savedProgressSeconds);

    // Check AirPlay & Cast support
    castControllerRef.current.checkAirPlaySupport(video);

    return () => {
      engine.destroy();
      engineRef.current = null;
    };
  }, [content.id, content.streamUrl]);

  // Subscribe to Cast and AirPlay updates
  useEffect(() => {
    const unsubCast = castControllerRef.current.subscribeCastState(setCastState);
    const unsubAirPlay = castControllerRef.current.subscribeAirPlayState(setAirPlayState);
    return () => {
      unsubCast();
      unsubAirPlay();
    };
  }, []);

  // Update volume & mute on video element
  useEffect(() => {
    if (videoRef.current) {
      videoRef.current.volume = isMuted ? 0 : volume;
    }
  }, [volume, isMuted]);

  // Video Time Update & Progress Tracker
  const handleTimeUpdate = () => {
    if (videoRef.current) {
      const cur = videoRef.current.currentTime;
      const dur = videoRef.current.duration || 0;
      setCurrentTime(cur);
      setDuration(dur);

      if (onRecordProgress && Math.floor(cur) % 6 === 0) {
        onRecordProgress(content, Math.floor(cur), Math.floor(dur));
      }
    }
  };

  // Play / Pause Action
  const togglePlay = () => {
    if (!videoRef.current) return;
    if (isPlaying) {
      videoRef.current.pause();
      setIsPlaying(false);
    } else {
      videoRef.current.play().then(() => {
        setIsPlaying(true);
        setStreamError(null);
      }).catch(() => setIsPlaying(false));
    }
    resetControlsTimeout();
  };

  // Seek Handler for VOD
  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const time = parseFloat(e.target.value);
    setCurrentTime(time);
    if (videoRef.current) {
      videoRef.current.currentTime = time;
    }
    resetControlsTimeout();
  };

  const handleSkipTime = (deltaSeconds: number) => {
    if (videoRef.current) {
      const newTime = Math.max(0, Math.min(duration || 99999, videoRef.current.currentTime + deltaSeconds));
      videoRef.current.currentTime = newTime;
      setCurrentTime(newTime);
      setShowSeekFeedback(deltaSeconds > 0 ? '+10' : '-10');
      setTimeout(() => setShowSeekFeedback(null), 800);
    }
  };

  // Toggle Fullscreen Mode
  const toggleFullscreen = () => {
    if (!containerRef.current) return;
    if (!document.fullscreenElement) {
      containerRef.current.requestFullscreen().then(() => {
        setDisplayMode('FULLSCREEN');
      }).catch(err => console.warn('Fullscreen error:', err));
    } else {
      document.exitFullscreen().then(() => {
        setDisplayMode('NORMAL');
      }).catch(() => {});
    }
  };

  // Toggle Picture-in-Picture Mode
  const togglePictureInPicture = async () => {
    if (!videoRef.current) return;
    try {
      if (document.pictureInPictureElement) {
        await document.exitPictureInPicture();
        setDisplayMode('NORMAL');
      } else if (videoRef.current.requestPictureInPicture) {
        await videoRef.current.requestPictureInPicture();
        setDisplayMode('PIP');
      }
    } catch (err) {
      console.warn('PiP error:', err);
    }
  };

  // Toggle Google Cast
  const handleCastToggle = async () => {
    if (castState.isCasting) {
      castControllerRef.current.endCastSession();
    } else {
      const success = await castControllerRef.current.requestCastSession();
      if (success) {
        await castControllerRef.current.loadMediaToCast(content, currentTime, isLive);
      }
    }
  };

  // Toggle AirPlay
  const handleAirPlayToggle = () => {
    castControllerRef.current.triggerAirPlay(videoRef.current);
  };

  // Playback Rate
  const handleSetSpeed = (speed: number) => {
    setPlaybackRate(speed);
    if (videoRef.current) {
      videoRef.current.playbackRate = speed;
    }
    setShowSpeedMenu(false);
  };

  // Quality Selection
  const handleSelectQuality = (levelId: number) => {
    setCurrentQualityIndex(levelId);
    engineRef.current?.setQualityLevel(levelId);
    setShowQualityMenu(false);
  };

  // Audio Track Selection
  const handleSelectAudioTrack = (trackId: number) => {
    setCurrentAudioIndex(trackId);
    engineRef.current?.setAudioTrack(trackId);
    setShowAudioMenu(false);
  };

  // Subtitle Track Selection
  const handleSelectSubtitleTrack = (trackId: number) => {
    setCurrentSubtitleIndex(trackId);
    engineRef.current?.setSubtitleTrack(trackId);
  };

  // Resume Playback Prompt Action
  const handleResume = () => {
    if (videoRef.current && savedProgressSeconds) {
      videoRef.current.currentTime = savedProgressSeconds;
    }
    setPromptResume(false);
  };

  // Manual Stream Retry
  const handleManualRetry = () => {
    setStreamError(null);
    engineRef.current?.manualRetry();
  };

  // Format Seconds to HH:MM:SS
  const formatTime = (secs: number) => {
    if (isNaN(secs) || secs <= 0) return '00:00';
    const hrs = Math.floor(secs / 3600);
    const mins = Math.floor((secs % 3600) / 60);
    const s = Math.floor(secs % 60);
    if (hrs > 0) {
      return `${hrs}:${mins < 10 ? '0' : ''}${mins}:${s < 10 ? '0' : ''}${s}`;
    }
    return `${mins}:${s < 10 ? '0' : ''}${s}`;
  };

  // Keyboard Shortcuts Listener
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ignore if user is writing in an input or textarea
      if (['INPUT', 'TEXTAREA', 'SELECT'].includes((e.target as HTMLElement)?.tagName)) {
        return;
      }

      switch (e.key) {
        case ' ':
          e.preventDefault();
          togglePlay();
          break;
        case 'ArrowLeft':
          e.preventDefault();
          if (!isLive) handleSkipTime(-10);
          else if (prevChannel) onSelectContent(prevChannel);
          break;
        case 'ArrowRight':
          e.preventDefault();
          if (!isLive) handleSkipTime(10);
          else if (nextChannel) onSelectContent(nextChannel);
          break;
        case 'ArrowUp':
          e.preventDefault();
          setVolume(v => Math.min(1, Number((v + 0.05).toFixed(2))));
          setIsMuted(false);
          resetControlsTimeout();
          break;
        case 'ArrowDown':
          e.preventDefault();
          setVolume(v => Math.max(0, Number((v - 0.05).toFixed(2))));
          resetControlsTimeout();
          break;
        case 'f':
        case 'F':
          e.preventDefault();
          toggleFullscreen();
          break;
        case 'm':
        case 'M':
          e.preventDefault();
          setIsMuted(m => !m);
          break;
        case 'p':
        case 'P':
          e.preventDefault();
          togglePictureInPicture();
          break;
        case 'l':
        case 'L':
          e.preventDefault();
          setIsLocked(lock => !lock);
          break;
        case 'c':
        case 'C':
          e.preventDefault();
          setDisplayMode(mode => (mode === 'CINEMA' ? 'NORMAL' : 'CINEMA'));
          break;
        case 'g':
        case 'G':
          e.preventDefault();
          setShowMiniEPG(show => !show);
          break;
        case 's':
        case 'S':
          e.preventDefault();
          setShowStatsModal(show => !show);
          break;
        case 'Escape':
          if (showMiniEPG) setShowMiniEPG(false);
          else if (showStatsModal) setShowStatsModal(false);
          else if (showShortcutsModal) setShowShortcutsModal(false);
          else if (displayMode === 'FULLSCREEN') toggleFullscreen();
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isPlaying, isLive, prevChannel, nextChannel, displayMode, showMiniEPG, showStatsModal, showShortcutsModal, isLocked]);

  // Touch Gesture Handling for mobile (double tap to skip, brightness/volume swipes)
  const touchStartRef = useRef<{ x: number; y: number; time: number; target: 'LEFT' | 'RIGHT' } | null>(null);
  const lastTapRef = useRef<{ time: number; x: number } | null>(null);

  const handleTouchStart = (e: React.TouchEvent) => {
    if (isLocked) return;
    const touch = e.touches[0];
    const rect = containerRef.current?.getBoundingClientRect();
    if (!rect) return;

    const x = touch.clientX - rect.left;
    const isLeftSide = x < rect.width / 2;

    touchStartRef.current = {
      x: touch.clientX,
      y: touch.clientY,
      time: Date.now(),
      target: isLeftSide ? 'LEFT' : 'RIGHT'
    };

    // Double-tap detection
    const now = Date.now();
    if (lastTapRef.current && now - lastTapRef.current.time < 300) {
      if (isLeftSide) {
        handleSkipTime(-10);
      } else {
        handleSkipTime(10);
      }
      lastTapRef.current = null;
    } else {
      lastTapRef.current = { time: now, x: touch.clientX };
    }
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (isLocked || !touchStartRef.current) return;
    const touch = e.touches[0];
    const deltaY = touchStartRef.current.y - touch.clientY;

    if (Math.abs(deltaY) > 30) {
      if (touchStartRef.current.target === 'LEFT') {
        // Simulated brightness adjustment
        const newBrightness = Math.min(130, Math.max(70, brightnessLevel + Math.round(deltaY / 8)));
        setBrightnessLevel(newBrightness);
        setGestureOverlay({ type: 'BRIGHTNESS', value: Math.round(((newBrightness - 70) / 60) * 100) });
      } else {
        // Volume adjustment
        const newVol = Math.min(1, Math.max(0, volume + deltaY / 400));
        setVolume(newVol);
        setIsMuted(false);
        setGestureOverlay({ type: 'VOLUME', value: Math.round(newVol * 100) });
      }
    }
  };

  const handleTouchEnd = () => {
    touchStartRef.current = null;
    setTimeout(() => setGestureOverlay(null), 1000);
  };

  return (
    <div
      className={`fixed inset-0 z-50 bg-black/95 backdrop-blur-2xl flex items-center justify-center p-0 sm:p-4 transition-all duration-300 ${
        displayMode === 'CINEMA' ? 'p-0 bg-black' : ''
      }`}
      onMouseMove={resetControlsTimeout}
      onClick={resetControlsTimeout}
    >
      
      {/* Container with dynamic sizing depending on display mode */}
      <div
        ref={containerRef}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        style={{ filter: `brightness(${brightnessLevel}%)` }}
        className={`relative bg-slate-950 overflow-hidden shadow-2xl flex flex-col justify-between select-none group ${
          displayMode === 'CINEMA'
            ? 'w-full h-full rounded-none border-none'
            : displayMode === 'FULLSCREEN'
            ? 'w-full h-full rounded-none'
            : 'w-full max-w-6xl aspect-video rounded-2xl border border-slate-800'
        }`}
      >

        {/* Video Player Core Viewport */}
        <video
          ref={videoRef}
          poster={content.bannerUrl || content.logoUrl}
          onTimeUpdate={handleTimeUpdate}
          onEnded={() => setIsPlaying(false)}
          playsInline
          autoPlay
          className="w-full h-full object-cover absolute inset-0 z-0 bg-slate-950"
        />

        {/* Radio Visualizer Animation */}
        {isRadio && !streamError && (
          <div className="absolute inset-0 z-10 bg-gradient-to-br from-slate-950 via-slate-900 to-amber-950/40 flex flex-col items-center justify-center p-6 text-center">
            <div className="relative mb-6">
              <div className="w-32 h-32 sm:w-40 sm:h-40 rounded-full overflow-hidden border-4 border-amber-500/60 shadow-2xl shadow-amber-500/30">
                <img
                  src={content.logoUrl || `https://ui-avatars.com/api/?name=${encodeURIComponent(content.name)}&background=f59e0b&color=ffffff`}
                  alt={content.name}
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    (e.target as HTMLImageElement).src = `https://ui-avatars.com/api/?name=${encodeURIComponent(content.name)}&background=f59e0b&color=ffffff`;
                  }}
                />
              </div>
              <div className="absolute -bottom-2 -right-2 px-3 py-1 rounded-full bg-amber-500 text-slate-950 font-black text-xs flex items-center space-x-1.5 shadow-lg">
                <Radio className="w-3.5 h-3.5 animate-pulse" />
                <span>{content.frequencyFm || 'FM LIVE'}</span>
              </div>
            </div>

            <h3 className="text-2xl sm:text-4xl font-extrabold text-white">{content.name}</h3>
            <p className="text-amber-400 font-medium text-sm sm:text-base mt-1">
              {currentLiveProgram ? currentLiveProgram.title : (content.currentProgram || 'Direct Radio FM')}
            </p>

            {/* Pulsing Audio Waveform */}
            {isPlaying && playerState === 'PLAYING' && (
              <div className="flex items-center space-x-1.5 mt-8 h-12">
                {[40, 75, 95, 30, 85, 100, 65, 45, 90, 70, 55, 95, 40, 80, 60].map((h, idx) => (
                  <span
                    key={idx}
                    className="w-1.5 bg-gradient-to-t from-amber-600 to-amber-400 rounded-full animate-pulse"
                    style={{
                      height: `${h}%`,
                      animationDuration: `${0.4 + (idx % 6) * 0.15}s`
                    }}
                  />
                ))}
              </div>
            )}
          </div>
        )}

        {/* LOADING & BUFFERING SPINNER OVERLAY */}
        {(playerState === 'LOADING' || playerState === 'BUFFERING' || playerState === 'RECOVERING') && !streamError && (
          <div className="absolute inset-0 z-20 bg-slate-950/80 backdrop-blur-sm flex flex-col items-center justify-center p-6 text-center">
            <div className="w-16 h-16 rounded-2xl bg-orange-500/20 text-orange-400 border border-orange-500/30 flex items-center justify-center mb-4 animate-pulse">
              <Loader2 className="w-8 h-8 animate-spin" />
            </div>
            <h4 className="text-lg font-black text-white mb-1">
              {playerState === 'RECOVERING' ? 'Rétablissement automatique du flux...' : 'Connexion au flux en cours...'}
            </h4>
            <p className="text-xs text-slate-300 max-w-sm">
              Chargement haute performance pour <span className="text-orange-400 font-bold">{content.name}</span>
            </p>
            {stats && (
              <span className="mt-3 text-[11px] font-mono text-slate-400 bg-slate-900/90 px-3 py-1 rounded-full border border-slate-800">
                Moteur : {stats.engine} • Tampon : {stats.bufferLengthSec}s
              </span>
            )}
          </div>
        )}

        {/* STREAM ERROR / RECOVERY OVERLAY */}
        {streamError && (
          <div className="absolute inset-0 z-30 bg-slate-950/95 backdrop-blur-md flex flex-col items-center justify-center p-6 text-center animate-fadeIn">
            <div className="w-14 h-14 rounded-2xl bg-rose-500/20 text-rose-400 border border-rose-500/30 flex items-center justify-center mb-3">
              <AlertTriangle className="w-7 h-7" />
            </div>
            <span className="px-3 py-1 rounded-full bg-rose-600/30 border border-rose-500/40 text-rose-300 font-bold text-[11px] uppercase mb-2">
              Diagnostic & État du Flux
            </span>
            <h3 className="text-lg sm:text-xl font-black text-white mb-2">{content.name}</h3>
            
            <div className="max-w-md bg-slate-900/90 border border-slate-800 rounded-xl p-3.5 mb-5 text-left text-xs space-y-2">
              <div className="flex items-start gap-2">
                <Info className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                <p className="text-slate-200 font-semibold">{streamError}</p>
              </div>
              {stats?.diagnosticVerdict && (
                <div className="pt-2 border-t border-slate-800 text-[11px] text-slate-400 space-y-1">
                  <p><span className="text-amber-400 font-bold">Cause identifiée :</span> {stats.diagnosticVerdict.rootCause}</p>
                  <p><span className="text-cyan-400 font-bold">Recommandation :</span> {stats.diagnosticVerdict.suggestedSolution}</p>
                </div>
              )}
            </div>
            
            <div className="flex flex-wrap items-center justify-center gap-3">
              <button
                onClick={handleManualRetry}
                className="px-5 py-2.5 rounded-xl bg-orange-500 hover:bg-orange-400 text-slate-950 font-black text-xs flex items-center space-x-2 transition-all shadow-lg"
              >
                <RefreshCw className="w-4 h-4" />
                <span>Recommencer la lecture</span>
              </button>

              {nextChannel && (
                <button
                  onClick={() => onSelectContent(nextChannel)}
                  className="px-5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs flex items-center space-x-2 border border-slate-700 transition"
                >
                  <Tv className="w-4 h-4 text-orange-400" />
                  <span>Chaîne suivante ({nextChannel.name})</span>
                </button>
              )}

              <button
                onClick={() => setShowStatsModal(true)}
                className="px-4 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-cyan-400 font-bold text-xs flex items-center space-x-1.5 border border-cyan-500/30 transition"
              >
                <Activity className="w-4 h-4" />
                <span>Monitoring Détaillé</span>
              </button>
            </div>
          </div>
        )}

        {/* RESUME PLAYBACK PROMPT BANNER */}
        {promptResume && savedProgressSeconds > 0 && !isLive && (
          <div className="absolute top-20 left-1/2 -translate-x-1/2 z-30 bg-slate-900/95 border border-amber-500/50 rounded-2xl p-4 shadow-2xl backdrop-blur max-w-md text-center animate-slideDown">
            <div className="flex items-center justify-center space-x-2 text-amber-400 font-bold text-xs mb-1">
              <RotateCcw className="w-4 h-4" />
              <span>Reprise de lecture</span>
            </div>
            <p className="text-xs text-slate-200 mb-3">
              Interrompu à <span className="font-mono font-bold text-amber-300">{formatTime(savedProgressSeconds)}</span>. Voulez-vous reprendre ?
            </p>
            <div className="flex items-center justify-center space-x-2">
              <button
                onClick={handleResume}
                className="px-4 py-1.5 rounded-xl bg-amber-500 text-slate-950 font-black text-xs shadow-md hover:bg-amber-400 transition-all"
              >
                Reprendre ici
              </button>
              <button
                onClick={() => setPromptResume(false)}
                className="px-3 py-1.5 rounded-xl bg-slate-800 text-slate-300 font-bold text-xs hover:bg-slate-700 transition-all"
              >
                Recommencer au début
              </button>
            </div>
          </div>
        )}

        {/* DOUBLE TAP SEEK FEEDBACK TOAST */}
        {showSeekFeedback && (
          <div className="absolute inset-0 z-20 flex items-center justify-center pointer-events-none">
            <div className="px-6 py-3 rounded-2xl bg-black/80 border border-white/20 text-white font-black text-lg flex items-center space-x-2 backdrop-blur animate-ping">
              {showSeekFeedback === '+10' ? <FastForward className="w-6 h-6 text-orange-400" /> : <Rewind className="w-6 h-6 text-orange-400" />}
              <span>{showSeekFeedback}s</span>
            </div>
          </div>
        )}

        {/* GESTURE OVERLAY (BRIGHTNESS / VOLUME) */}
        {gestureOverlay && (
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-30 bg-black/80 border border-white/20 px-6 py-4 rounded-2xl backdrop-blur text-white flex flex-col items-center pointer-events-none animate-fadeIn">
            {gestureOverlay.type === 'VOLUME' ? (
              <Volume2 className="w-8 h-8 text-amber-400 mb-2" />
            ) : (
              <Sun className="w-8 h-8 text-amber-400 mb-2" />
            )}
            <div className="w-32 h-2 bg-slate-700 rounded-full overflow-hidden mb-1">
              <div
                className="h-full bg-orange-500 rounded-full"
                style={{ width: `${gestureOverlay.value}%` }}
              />
            </div>
            <span className="text-xs font-mono font-bold text-slate-300">
              {gestureOverlay.type === 'VOLUME' ? 'Volume' : 'Luminosité'} : {gestureOverlay.value}%
            </span>
          </div>
        )}

        {/* SCREEN LOCK OVERLAY */}
        {isLocked && (
          <div className="absolute inset-0 z-30 bg-black/40 flex flex-col items-center justify-between p-6 pointer-events-auto">
            <div className="px-4 py-2 rounded-full bg-slate-900/90 border border-amber-500/50 text-amber-400 text-xs font-bold flex items-center space-x-2 shadow-2xl">
              <Lock className="w-4 h-4" />
              <span>Commandes Verrouillées (Mode Tactile Sécurisé)</span>
            </div>

            <button
              onClick={() => setIsLocked(false)}
              className="px-6 py-3 rounded-2xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-sm flex items-center space-x-2 shadow-2xl transition transform hover:scale-105"
            >
              <Unlock className="w-5 h-5" />
              <span>Déverrouiller le lecteur</span>
            </button>
            <div />
          </div>
        )}

        {/* ======================================================== */}
        {/* TOP HUD HEADER */}
        {/* ======================================================== */}
        <div
          className={`relative z-20 p-3 sm:p-4 bg-gradient-to-b from-black/95 via-black/60 to-transparent flex items-center justify-between transition-opacity duration-300 ${
            showControls && !isLocked ? 'opacity-100' : 'opacity-0 pointer-events-none'
          }`}
        >
          {/* Channel Identification */}
          <div className="flex items-center space-x-3 min-w-0">
            <div className="w-10 h-10 rounded-xl bg-slate-900 border border-slate-700 overflow-hidden flex-shrink-0">
              <img
                src={content.logoUrl || `https://ui-avatars.com/api/?name=${encodeURIComponent(content.name)}&background=f97316&color=ffffff`}
                alt={content.name}
                className="w-full h-full object-cover"
                onError={(e) => {
                  (e.target as HTMLImageElement).src = `https://ui-avatars.com/api/?name=${encodeURIComponent(content.name)}&background=f97316&color=ffffff`;
                }}
              />
            </div>

            <div className="min-w-0">
              <div className="flex items-center space-x-2">
                <h2 className="text-white font-extrabold text-sm sm:text-base tracking-tight truncate max-w-xs sm:max-w-md">
                  {content.name}
                </h2>
                
                {isLive ? (
                  <span className="px-2 py-0.5 rounded-full bg-red-600 text-white font-black text-[10px] uppercase tracking-wider flex items-center space-x-1 animate-pulse flex-shrink-0">
                    <span className="w-1.5 h-1.5 rounded-full bg-white" />
                    <span>DIRECT</span>
                  </span>
                ) : (
                  <span className="px-2 py-0.5 rounded bg-blue-500/20 text-blue-400 border border-blue-500/30 font-bold text-[10px] flex-shrink-0">
                    VOD
                  </span>
                )}

                {content.healthClassification === 'ACTIVE' && (
                  <span className="hidden sm:inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 font-bold text-[10px] flex-shrink-0">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                    <span>Flux Vérifié</span>
                  </span>
                )}

                {content.healthClassification === 'UNSTABLE' && (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30 font-bold text-[10px] flex-shrink-0">
                    <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
                    <span>Flux Instable</span>
                  </span>
                )}

                {content.healthClassification === 'DEAD' && (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-red-500/20 text-red-400 border border-red-500/30 font-bold text-[10px] flex-shrink-0">
                    <span className="w-1.5 h-1.5 rounded-full bg-red-400" />
                    <span>Flux Dégradé</span>
                  </span>
                )}

                {castState.isCasting && (
                  <span className="px-2 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 font-bold text-[10px] flex items-center space-x-1">
                    <Cast className="w-3 h-3 animate-pulse" />
                    <span>Cast : {castState.deviceName || 'Actif'}</span>
                  </span>
                )}
              </div>

              <div className="flex items-center space-x-2 text-xs text-slate-300 truncate max-w-xs sm:max-w-md">
                <span>{content.category}</span>
                <span>•</span>
                <span>{content.country}</span>
                {currentLiveProgram && (
                  <>
                    <span>•</span>
                    <span className="text-orange-400 font-semibold truncate">{currentLiveProgram.title}</span>
                  </>
                )}
              </div>
            </div>
          </div>

          {/* Top Actions & Quick Toggles */}
          <div className="flex items-center space-x-1.5 sm:space-x-2">
            
            {/* Google Cast Button */}
            {castState.isAvailable && (
              <button
                onClick={handleCastToggle}
                className={`p-2.5 rounded-xl border transition-all ${
                  castState.isCasting
                    ? 'bg-cyan-500 text-slate-950 border-cyan-400 shadow-lg shadow-cyan-500/30'
                    : 'bg-black/60 hover:bg-slate-800 text-slate-300 border-slate-700'
                }`}
                title={castState.isCasting ? 'Arrêter la diffusion Cast' : 'Diffuser sur Chromecast'}
              >
                <Cast className="w-4 h-4" />
              </button>
            )}

            {/* AirPlay Button */}
            {airPlayState.isAvailable && (
              <button
                onClick={handleAirPlayToggle}
                className="p-2.5 rounded-xl bg-black/60 hover:bg-slate-800 text-slate-300 border border-slate-700 transition"
                title="Diffuser via AirPlay"
              >
                <Airplay className="w-4 h-4" />
              </button>
            )}

            {/* Favorite Toggle */}
            <button
              onClick={() => onToggleFavorite(content.id)}
              className={`p-2.5 rounded-xl border transition-all ${
                isFavorite
                  ? 'bg-red-500 text-white border-red-400 shadow-lg shadow-red-500/30'
                  : 'bg-black/60 hover:bg-slate-800 text-slate-300 border-slate-700'
              }`}
              title={isFavorite ? 'Retirer des favoris' : 'Ajouter aux favoris'}
            >
              <Heart className={`w-4 h-4 ${isFavorite ? 'fill-current' : ''}`} />
            </button>

            {/* Mini EPG Guide Trigger */}
            <button
              onClick={() => setShowMiniEPG(!showMiniEPG)}
              className={`p-2.5 rounded-xl border transition flex items-center space-x-1 text-xs font-bold ${
                showMiniEPG
                  ? 'bg-orange-500 text-slate-950 border-orange-400'
                  : 'bg-slate-900/90 hover:bg-slate-800 text-slate-200 border-slate-700'
              }`}
              title="Ouvrir le Guide TV & Zapping"
            >
              <Calendar className="w-4 h-4 text-orange-400" />
              <span className="hidden md:inline">Guide TV</span>
            </button>

            {/* Theater / Cinema Mode Toggle */}
            <button
              onClick={() => setDisplayMode(m => m === 'CINEMA' ? 'NORMAL' : 'CINEMA')}
              className={`p-2.5 rounded-xl border transition hidden sm:flex ${
                displayMode === 'CINEMA'
                  ? 'bg-amber-500 text-slate-950 border-amber-400'
                  : 'bg-slate-900 hover:bg-slate-800 text-slate-300 border-slate-700'
              }`}
              title="Mode Cinéma / Élargi"
            >
              <Tv className="w-4 h-4" />
            </button>

            {/* Stats for Nerds HUD Trigger */}
            <button
              onClick={() => setShowStatsModal(true)}
              className="p-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-cyan-400 border border-slate-700 transition"
              title="Diagnostics & Stats Techniques"
            >
              <Activity className="w-4 h-4" />
            </button>

            {/* Lock Screen Trigger */}
            <button
              onClick={() => setIsLocked(true)}
              className="p-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-amber-400 border border-slate-700 transition"
              title="Verrouiller les commandes (Tactile)"
            >
              <Lock className="w-4 h-4" />
            </button>

            {/* Close Modal */}
            <button
              onClick={onClose}
              className="p-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white border border-rose-500 transition shadow-lg"
              title="Fermer le lecteur"
            >
              <X className="w-5 h-5" />
            </button>

          </div>
        </div>

        {/* ======================================================== */}
        {/* CENTER INTERACTIVE CONTROLS (ZAPPING & BIG PLAY) */}
        {/* ======================================================== */}
        <div className="absolute inset-x-0 top-1/2 -translate-y-1/2 z-20 flex items-center justify-between px-4 pointer-events-none">
          
          {/* Prev Channel Zapping Button */}
          {prevChannel && (
            <button
              onClick={() => onSelectContent(prevChannel)}
              className={`p-3 rounded-2xl bg-black/60 hover:bg-slate-900 text-white border border-slate-700 backdrop-blur pointer-events-auto transition transform hover:scale-110 shadow-2xl ${
                showControls && !isLocked ? 'opacity-100' : 'opacity-0'
              }`}
              title={`Chaîne précédente : ${prevChannel.name}`}
            >
              <ChevronLeft className="w-6 h-6 text-orange-400" />
            </button>
          )}

          <div />

          {/* Next Channel Zapping Button */}
          {nextChannel && (
            <button
              onClick={() => onSelectContent(nextChannel)}
              className={`p-3 rounded-2xl bg-black/60 hover:bg-slate-900 text-white border border-slate-700 backdrop-blur pointer-events-auto transition transform hover:scale-110 shadow-2xl ${
                showControls && !isLocked ? 'opacity-100' : 'opacity-0'
              }`}
              title={`Chaîne suivante : ${nextChannel.name}`}
            >
              <ChevronRight className="w-6 h-6 text-orange-400" />
            </button>
          )}

        </div>

        {/* ======================================================== */}
        {/* BOTTOM HUD CONTROLS BAR */}
        {/* ======================================================== */}
        <div
          className={`relative z-20 p-3 sm:p-4 bg-gradient-to-t from-black/95 via-black/80 to-transparent flex flex-col gap-2 transition-opacity duration-300 ${
            showControls && !isLocked ? 'opacity-100' : 'opacity-0 pointer-events-none'
          }`}
        >
          
          {/* VOD Timeline Scrubber */}
          {!isLive && (
            <div className="flex items-center space-x-3 text-xs font-mono text-slate-300">
              <span className="w-12 text-right">{formatTime(currentTime)}</span>
              <div className="relative flex-1 flex items-center">
                <input
                  type="range"
                  min={0}
                  max={duration || 100}
                  value={isNaN(currentTime) ? 0 : currentTime}
                  onChange={handleSeek}
                  className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-orange-500"
                />
              </div>
              <span className="w-12">{formatTime(duration)}</span>
            </div>
          )}

          {/* Live Broadcast Progress Bar for TV */}
          {isLive && currentLiveProgram && (
            <div className="flex items-center space-x-3 text-[11px] text-slate-300 bg-slate-900/60 px-3 py-1.5 rounded-xl border border-slate-800/80">
              <span className="text-orange-400 font-bold flex items-center space-x-1">
                <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-ping" />
                <span>{currentLiveProgram.title}</span>
              </span>
              <div className="flex-1 h-1 bg-slate-800 rounded-full overflow-hidden">
                <div
                  className="h-full bg-orange-500 rounded-full transition-all duration-500"
                  style={{ width: `${currentLiveProgram.progressPercent}%` }}
                />
              </div>
              <span className="font-mono text-slate-400">
                {currentLiveProgram.startTime} - {currentLiveProgram.endTime}
              </span>
            </div>
          )}

          {/* Main Controls Row */}
          <div className="flex items-center justify-between flex-wrap gap-2">
            
            {/* Left Controls: Play/Pause, Rewind/FastForward, Volume */}
            <div className="flex items-center space-x-2 sm:space-x-3">
              
              {/* Play / Pause Toggle */}
              <button
                onClick={togglePlay}
                className="p-3 rounded-xl bg-orange-500 hover:bg-orange-400 text-slate-950 font-black shadow-lg shadow-orange-500/30 transition transform hover:scale-105"
                title={isPlaying ? 'Pause (Espace)' : 'Lecture (Espace)'}
              >
                {isPlaying ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5 fill-current" />}
              </button>

              {/* VOD -10s / +10s Skip Buttons */}
              {!isLive && (
                <div className="flex items-center space-x-1">
                  <button
                    onClick={() => handleSkipTime(-10)}
                    className="p-2 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-800 transition"
                    title="Reculer de 10 secondes"
                  >
                    <Rewind className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleSkipTime(10)}
                    className="p-2 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-800 transition"
                    title="Avancer de 10 secondes"
                  >
                    <FastForward className="w-4 h-4" />
                  </button>
                </div>
              )}

              {/* Volume Slider & Mute */}
              <div className="flex items-center space-x-2 bg-slate-900/90 px-3 py-2 rounded-xl border border-slate-800">
                <button
                  onClick={() => setIsMuted(!isMuted)}
                  className="text-slate-300 hover:text-white"
                  title={isMuted ? 'Activer le son' : 'Couper le son (M)'}
                >
                  {isMuted || volume === 0 ? (
                    <VolumeX className="w-4 h-4 text-rose-400" />
                  ) : volume < 0.5 ? (
                    <Volume1 className="w-4 h-4 text-amber-400" />
                  ) : (
                    <Volume2 className="w-4 h-4 text-amber-400" />
                  )}
                </button>
                <input
                  type="range"
                  min={0}
                  max={1}
                  step={0.05}
                  value={isMuted ? 0 : volume}
                  onChange={(e) => {
                    setVolume(parseFloat(e.target.value));
                    setIsMuted(false);
                  }}
                  className="w-16 sm:w-20 h-1 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-amber-500"
                />
              </div>

              {/* Quality Selector Dropdown */}
              <div className="relative">
                <button
                  onClick={() => {
                    setShowQualityMenu(!showQualityMenu);
                    setShowAudioMenu(false);
                    setShowSpeedMenu(false);
                  }}
                  className="px-3 py-2 rounded-xl bg-slate-900/90 border border-slate-700 hover:border-orange-500/50 text-xs font-bold text-slate-200 flex items-center space-x-1.5 transition"
                >
                  <Sliders className="w-3.5 h-3.5 text-orange-400" />
                  <span>
                    {qualityLevels.find(q => q.id === currentQualityIndex)?.label || content.quality || 'Auto'}
                  </span>
                </button>

                {showQualityMenu && (
                  <div className="absolute bottom-12 left-0 bg-slate-900 border border-slate-700 rounded-xl p-1.5 shadow-2xl z-40 w-44 animate-slideUp">
                    <div className="px-3 py-1 text-[10px] font-bold text-slate-400 uppercase border-b border-slate-800 mb-1">
                      Qualité Vidéo
                    </div>
                    {qualityLevels.length === 0 ? (
                      <button
                        onClick={() => setShowQualityMenu(false)}
                        className="w-full text-left px-3 py-1.5 rounded-lg text-xs text-orange-400 font-bold"
                      >
                        {content.quality} (Défaut)
                      </button>
                    ) : (
                      qualityLevels.map((q) => (
                        <button
                          key={q.id}
                          onClick={() => handleSelectQuality(q.id)}
                          className={`w-full text-left px-3 py-1.5 rounded-lg text-xs font-medium flex items-center justify-between ${
                            currentQualityIndex === q.id
                              ? 'bg-orange-500/20 text-orange-400 font-bold'
                              : 'text-slate-300 hover:bg-slate-800'
                          }`}
                        >
                          <span className="truncate">{q.label}</span>
                          {currentQualityIndex === q.id && <CheckCircle2 className="w-3.5 h-3.5 text-orange-400" />}
                        </button>
                      ))
                    )}
                  </div>
                )}
              </div>

              {/* Audio Tracks Dropdown (if multiple available) */}
              {audioTracks.length > 1 && (
                <div className="relative">
                  <button
                    onClick={() => {
                      setShowAudioMenu(!showAudioMenu);
                      setShowQualityMenu(false);
                      setShowSpeedMenu(false);
                    }}
                    className="px-3 py-2 rounded-xl bg-slate-900/90 border border-slate-700 hover:border-orange-500/50 text-xs font-bold text-slate-200 flex items-center space-x-1.5 transition"
                  >
                    <Headphones className="w-3.5 h-3.5 text-cyan-400" />
                    <span>{audioTracks[currentAudioIndex]?.label || 'Audio'}</span>
                  </button>

                  {showAudioMenu && (
                    <div className="absolute bottom-12 left-0 bg-slate-900 border border-slate-700 rounded-xl p-1.5 shadow-2xl z-40 w-44 animate-slideUp">
                      <div className="px-3 py-1 text-[10px] font-bold text-slate-400 uppercase border-b border-slate-800 mb-1">
                        Pistes Audio
                      </div>
                      {audioTracks.map((t) => (
                        <button
                          key={t.id}
                          onClick={() => handleSelectAudioTrack(t.id)}
                          className={`w-full text-left px-3 py-1.5 rounded-lg text-xs font-medium flex items-center justify-between ${
                            currentAudioIndex === t.id
                              ? 'bg-cyan-500/20 text-cyan-400 font-bold'
                              : 'text-slate-300 hover:bg-slate-800'
                          }`}
                        >
                          <span>{t.label}</span>
                          {currentAudioIndex === t.id && <CheckCircle2 className="w-3.5 h-3.5 text-cyan-400" />}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* Playback Speed Controller (VOD only) */}
              {!isLive && (
                <div className="relative">
                  <button
                    onClick={() => {
                      setShowSpeedMenu(!showSpeedMenu);
                      setShowQualityMenu(false);
                      setShowAudioMenu(false);
                    }}
                    className="px-2.5 py-2 rounded-xl bg-slate-900/90 border border-slate-700 text-xs font-mono font-bold text-slate-200 flex items-center space-x-1"
                  >
                    <Gauge className="w-3.5 h-3.5 text-amber-400" />
                    <span>{playbackRate}x</span>
                  </button>

                  {showSpeedMenu && (
                    <div className="absolute bottom-12 left-0 bg-slate-900 border border-slate-700 rounded-xl p-1.5 shadow-2xl z-40 w-28 animate-slideUp">
                      <div className="px-2 py-1 text-[10px] font-bold text-slate-400 uppercase border-b border-slate-800 mb-1">
                        Vitesse
                      </div>
                      {[0.5, 0.75, 1, 1.25, 1.5, 2].map((rate) => (
                        <button
                          key={rate}
                          onClick={() => handleSetSpeed(rate)}
                          className={`w-full text-left px-3 py-1 rounded-lg text-xs font-mono font-medium ${
                            playbackRate === rate
                              ? 'bg-amber-500 text-slate-950 font-bold'
                              : 'text-slate-300 hover:bg-slate-800'
                          }`}
                        >
                          {rate}x {rate === 1 ? '(Normal)' : ''}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )}

            </div>

            {/* Right Controls: PiP, Shortcuts Info, Fullscreen */}
            <div className="flex items-center space-x-2">
              
              {/* Keyboard Shortcuts Trigger */}
              <button
                onClick={() => setShowShortcutsModal(true)}
                className="p-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-white border border-slate-700 transition hidden sm:flex"
                title="Raccourcis clavier"
              >
                <HelpCircle className="w-4 h-4" />
              </button>

              {/* Picture-in-Picture Button */}
              <button
                onClick={togglePictureInPicture}
                className="p-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-200 border border-slate-700 transition"
                title="Picture-in-Picture (P)"
              >
                <Tv className="w-4 h-4" />
              </button>

              {/* Fullscreen Button */}
              <button
                onClick={toggleFullscreen}
                className="p-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-200 border border-slate-700 transition"
                title={displayMode === 'FULLSCREEN' ? 'Quitter Plein Écran (F)' : 'Plein Écran (F)'}
              >
                {displayMode === 'FULLSCREEN' ? <Minimize className="w-4 h-4" /> : <Maximize className="w-4 h-4" />}
              </button>

            </div>

          </div>

        </div>

        {/* ======================================================== */}
        {/* MINI EPG & QUICK ZAPPING GUIDE DRAWER */}
        {/* ======================================================== */}
        {showMiniEPG && (
          <MiniEPGGuideDrawer
            currentContent={content}
            allContents={allContents}
            isFavorite={isFavorite}
            onToggleFavorite={onToggleFavorite}
            onSelectContent={(newContent) => {
              onSelectContent(newContent);
              setShowMiniEPG(false);
            }}
            onClose={() => setShowMiniEPG(false)}
          />
        )}

        {/* ======================================================== */}
        {/* STATS FOR NERDS & TECHNICAL DIAGNOSTICS MODAL */}
        {/* ======================================================== */}
        {showStatsModal && (
          <StatsForNerdsModal
            stats={stats}
            logs={logs}
            channelName={content.name}
            onClose={() => setShowStatsModal(false)}
          />
        )}

        {/* ======================================================== */}
        {/* KEYBOARD SHORTCUTS MODAL */}
        {/* ======================================================== */}
        {showShortcutsModal && (
          <div className="absolute inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 animate-fadeIn">
            <div className="w-full max-w-md bg-slate-950 border border-slate-800 rounded-2xl p-5 shadow-2xl">
              <div className="flex items-center justify-between mb-4 border-b border-slate-800 pb-3">
                <h3 className="text-sm font-extrabold text-white flex items-center space-x-2">
                  <HelpCircle className="w-4 h-4 text-orange-400" />
                  <span>Raccourcis Clavier du Lecteur</span>
                </h3>
                <button onClick={() => setShowShortcutsModal(false)} className="text-slate-400 hover:text-white">
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="grid grid-cols-2 gap-2 text-xs">
                <div className="p-2 bg-slate-900 rounded-xl border border-slate-800 flex justify-between items-center">
                  <span className="text-slate-400">Lecture / Pause</span>
                  <kbd className="px-2 py-0.5 bg-slate-800 text-orange-400 font-mono font-bold rounded">Espace</kbd>
                </div>
                <div className="p-2 bg-slate-900 rounded-xl border border-slate-800 flex justify-between items-center">
                  <span className="text-slate-400">Plein Écran</span>
                  <kbd className="px-2 py-0.5 bg-slate-800 text-orange-400 font-mono font-bold rounded">F</kbd>
                </div>
                <div className="p-2 bg-slate-900 rounded-xl border border-slate-800 flex justify-between items-center">
                  <span className="text-slate-400">Muet</span>
                  <kbd className="px-2 py-0.5 bg-slate-800 text-orange-400 font-mono font-bold rounded">M</kbd>
                </div>
                <div className="p-2 bg-slate-900 rounded-xl border border-slate-800 flex justify-between items-center">
                  <span className="text-slate-400">Picture-in-Picture</span>
                  <kbd className="px-2 py-0.5 bg-slate-800 text-orange-400 font-mono font-bold rounded">P</kbd>
                </div>
                <div className="p-2 bg-slate-900 rounded-xl border border-slate-800 flex justify-between items-center">
                  <span className="text-slate-400">Volume +/-</span>
                  <kbd className="px-2 py-0.5 bg-slate-800 text-orange-400 font-mono font-bold rounded">↑ / ↓</kbd>
                </div>
                <div className="p-2 bg-slate-900 rounded-xl border border-slate-800 flex justify-between items-center">
                  <span className="text-slate-400">Zapping / Reculer</span>
                  <kbd className="px-2 py-0.5 bg-slate-800 text-orange-400 font-mono font-bold rounded">← / →</kbd>
                </div>
                <div className="p-2 bg-slate-900 rounded-xl border border-slate-800 flex justify-between items-center">
                  <span className="text-slate-400">Guide TV EPG</span>
                  <kbd className="px-2 py-0.5 bg-slate-800 text-orange-400 font-mono font-bold rounded">G</kbd>
                </div>
                <div className="p-2 bg-slate-900 rounded-xl border border-slate-800 flex justify-between items-center">
                  <span className="text-slate-400">Mode Cinéma</span>
                  <kbd className="px-2 py-0.5 bg-slate-800 text-orange-400 font-mono font-bold rounded">C</kbd>
                </div>
                <div className="p-2 bg-slate-900 rounded-xl border border-slate-800 flex justify-between items-center">
                  <span className="text-slate-400">Verrouiller</span>
                  <kbd className="px-2 py-0.5 bg-slate-800 text-orange-400 font-mono font-bold rounded">L</kbd>
                </div>
                <div className="p-2 bg-slate-900 rounded-xl border border-slate-800 flex justify-between items-center">
                  <span className="text-slate-400">Diagnostics</span>
                  <kbd className="px-2 py-0.5 bg-slate-800 text-orange-400 font-mono font-bold rounded">S</kbd>
                </div>
              </div>

              <div className="mt-4 pt-3 border-t border-slate-800 text-[11px] text-slate-400 text-center">
                Gestes tactiles mobiles : Double-tape pour avancer/reculer de 10s • Glisser verticalement pour volume & luminosité.
              </div>
            </div>
          </div>
        )}

      </div>

    </div>
  );
};
