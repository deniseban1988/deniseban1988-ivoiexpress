import { IPTVContentItem } from '../../../types/iptv';
import { CastSessionState, AirPlaySessionState } from './types';

declare global {
  interface Window {
    __onGCastApiAvailable?: (isAvailable: boolean) => void;
    cast?: any;
    chrome?: any;
  }
}

export class CastController {
  private static instance: CastController | null = null;
  private castContext: any = null;
  private remotePlayer: any = null;
  private remotePlayerController: any = null;
  private isCastSdkLoaded = false;
  private castListeners: Array<(state: CastSessionState) => void> = [];
  private airPlayListeners: Array<(state: AirPlaySessionState) => void> = [];

  private currentCastState: CastSessionState = {
    isAvailable: false,
    isCasting: false,
    deviceName: undefined,
    status: 'DISCONNECTED'
  };

  private currentAirPlayState: AirPlaySessionState = {
    isAvailable: false,
    isAirPlayActive: false
  };

  private constructor() {
    this.initCastSdk();
  }

  public static getInstance(): CastController {
    if (!CastController.instance) {
      CastController.instance = new CastController();
    }
    return CastController.instance;
  }

  /**
   * Initializes Google Cast Web Sender SDK safely
   */
  private initCastSdk(): void {
    if (typeof window === 'undefined') return;

    // Check if script is already present
    if (window.cast && window.cast.framework) {
      this.setupCastFramework();
      return;
    }

    window.__onGCastApiAvailable = (isAvailable: boolean) => {
      if (isAvailable && window.cast && window.cast.framework) {
        this.setupCastFramework();
      }
    };

    // Load Google Cast Sender SDK dynamically if not present
    if (!document.getElementById('google-cast-sender-sdk')) {
      const script = document.createElement('script');
      script.id = 'google-cast-sender-sdk';
      script.src = 'https://www.gstatic.com/cv/js/sender/v1/cast_sender.js?loadCastFramework=1';
      script.async = true;
      script.onerror = () => {
        // Cast SDK not supported or blocked in sandbox; gracefully degrade
        this.updateCastState({
          isAvailable: false,
          isCasting: false,
          status: 'DISCONNECTED'
        });
      };
      document.head.appendChild(script);
    }
  }

  private setupCastFramework(): void {
    try {
      const cast = window.cast;
      const chrome = window.chrome;
      if (!cast || !cast.framework) return;

      this.castContext = cast.framework.CastContext.getInstance();
      
      // Default receiver application ID (supports HLS and standard media)
      this.castContext.setOptions({
        receiverApplicationId: chrome.cast.media.DEFAULT_MEDIA_RECEIVER_APP_ID,
        autoJoinPolicy: chrome.cast.AutoJoinPolicy.ORIGIN_SCOPED
      });

      this.remotePlayer = new cast.framework.RemotePlayer();
      this.remotePlayerController = new cast.framework.RemotePlayerController(this.remotePlayer);

      this.isCastSdkLoaded = true;

      // Listen for Cast state changes
      this.castContext.addEventListener(
        cast.framework.CastContextEventType.CAST_STATE_CHANGED,
        (event: any) => {
          const castState = event.castState;
          const isAvailable = castState !== cast.framework.CastState.NO_DEVICES_AVAILABLE;
          const isConnected = castState === cast.framework.CastState.CONNECTED;
          const isConnecting = castState === cast.framework.CastState.CONNECTING;

          const session = this.castContext.getCurrentSession();
          const deviceName = session ? session.getCastDevice()?.friendlyName : undefined;

          this.updateCastState({
            isAvailable,
            isCasting: isConnected,
            deviceName,
            status: isConnected ? 'CONNECTED' : isConnecting ? 'CONNECTING' : 'DISCONNECTED'
          });
        }
      );

      // Listen for session state changes
      this.castContext.addEventListener(
        cast.framework.CastContextEventType.SESSION_STATE_CHANGED,
        (event: any) => {
          const sessionState = event.sessionState;
          if (sessionState === cast.framework.SessionState.SESSION_ENDED) {
            this.updateCastState({
              isCasting: false,
              deviceName: undefined,
              status: 'DISCONNECTED'
            });
          }
        }
      );

      // Check current initial cast state
      const initialCastState = this.castContext.getCastState();
      this.updateCastState({
        isAvailable: initialCastState !== cast.framework.CastState.NO_DEVICES_AVAILABLE,
        isCasting: initialCastState === cast.framework.CastState.CONNECTED
      });
    } catch (err) {
      console.warn('[CastController] Error setting up Cast Framework:', err);
    }
  }

  /**
   * Request user to connect to a Chromecast
   */
  public async requestCastSession(): Promise<boolean> {
    if (!this.castContext) return false;
    try {
      this.updateCastState({ status: 'CONNECTING' });
      await this.castContext.requestSession();
      const session = this.castContext.getCurrentSession();
      if (session) {
        this.updateCastState({
          isCasting: true,
          deviceName: session.getCastDevice()?.friendlyName || 'Chromecast',
          status: 'CONNECTED'
        });
        return true;
      }
      return false;
    } catch (err) {
      console.warn('[CastController] Cast session request cancelled or failed:', err);
      this.updateCastState({ status: 'DISCONNECTED', isCasting: false });
      return false;
    }
  }

  /**
   * Disconnect from current Cast session
   */
  public endCastSession(): void {
    if (!this.castContext) return;
    try {
      this.castContext.endCurrentSession(true);
      this.updateCastState({
        isCasting: false,
        deviceName: undefined,
        status: 'DISCONNECTED'
      });
    } catch (err) {
      console.warn('[CastController] Error ending Cast session:', err);
    }
  }

  /**
   * Cast a specific media content to the connected receiver
   */
  public async loadMediaToCast(content: IPTVContentItem, currentTimeSec = 0, isLive = true): Promise<boolean> {
    if (!this.castContext || !this.currentCastState.isCasting) return false;

    const chrome = window.chrome;
    const session = this.castContext.getCurrentSession();
    if (!session || !chrome) return false;

    try {
      const isM3U8 = content.streamUrl.includes('.m3u8') || content.streamUrl.includes('m3u8');
      const contentType = isM3U8 
        ? 'application/x-mpegURL' 
        : content.type === 'RADIO' 
          ? 'audio/mp3' 
          : 'video/mp4';

      const mediaInfo = new chrome.cast.media.MediaInfo(content.streamUrl, contentType);
      mediaInfo.metadata = new chrome.cast.media.GenericMediaMetadata();
      mediaInfo.metadata.title = content.name;
      mediaInfo.metadata.subtitle = content.currentProgram || `${content.category} • ${content.country}`;
      mediaInfo.streamType = isLive ? chrome.cast.media.StreamType.LIVE : chrome.cast.media.StreamType.BUFFERED;

      if (content.logoUrl || content.bannerUrl) {
        mediaInfo.metadata.images = [
          new chrome.cast.Image(content.bannerUrl || content.logoUrl)
        ];
      }

      const request = new chrome.cast.media.LoadRequest(mediaInfo);
      request.currentTime = isLive ? 0 : currentTimeSec;
      request.autoplay = true;

      await session.loadMedia(request);
      return true;
    } catch (err) {
      console.error('[CastController] Failed to load media to cast device:', err);
      return false;
    }
  }

  /**
   * Checks and triggers AirPlay on compatible WebKit video elements
   */
  public checkAirPlaySupport(videoElement: HTMLVideoElement | null): boolean {
    if (!videoElement) return false;
    
    // WebKit AirPlay API check
    const hasWebKitAirPlay = 
      (window as any).WebKitPlaybackTargetAvailabilityEvent !== undefined ||
      (videoElement as any).webkitShowPlaybackTargetPicker !== undefined;

    // Remote Playback API check (modern Android / Chrome / SmartTV)
    const hasRemotePlayback = (videoElement as any).remote !== undefined;

    const isAvailable = Boolean(hasWebKitAirPlay || hasRemotePlayback);
    this.updateAirPlayState({ isAvailable });
    return isAvailable;
  }

  /**
   * Prompts the AirPlay / Remote Playback picker dialog
   */
  public triggerAirPlay(videoElement: HTMLVideoElement | null): void {
    if (!videoElement) return;

    if ((videoElement as any).webkitShowPlaybackTargetPicker) {
      try {
        (videoElement as any).webkitShowPlaybackTargetPicker();
      } catch (err) {
        console.warn('[CastController] AirPlay picker error:', err);
      }
    } else if ((videoElement as any).remote && (videoElement as any).remote.prompt) {
      try {
        (videoElement as any).remote.prompt().catch((err: any) => {
          console.warn('[CastController] Remote Playback prompt error:', err);
        });
      } catch (err) {
        console.warn('[CastController] Remote prompt failed:', err);
      }
    }
  }

  // Subscriptions & State updates
  public subscribeCastState(callback: (state: CastSessionState) => void): () => void {
    this.castListeners.push(callback);
    callback(this.currentCastState);
    return () => {
      this.castListeners = this.castListeners.filter(cb => cb !== callback);
    };
  }

  public subscribeAirPlayState(callback: (state: AirPlaySessionState) => void): () => void {
    this.airPlayListeners.push(callback);
    callback(this.currentAirPlayState);
    return () => {
      this.airPlayListeners = this.airPlayListeners.filter(cb => cb !== callback);
    };
  }

  private updateCastState(partial: Partial<CastSessionState>): void {
    this.currentCastState = { ...this.currentCastState, ...partial };
    this.castListeners.forEach(cb => cb(this.currentCastState));
  }

  private updateAirPlayState(partial: Partial<AirPlaySessionState>): void {
    this.currentAirPlayState = { ...this.currentAirPlayState, ...partial };
    this.airPlayListeners.forEach(cb => cb(this.currentAirPlayState));
  }

  public getCastState(): CastSessionState {
    return this.currentCastState;
  }

  public getAirPlayState(): AirPlaySessionState {
    return this.currentAirPlayState;
  }
}
