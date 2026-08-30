import { IPTVContentItem } from '../../../types/iptv';

export interface StreamAnalysisResult {
  url: string;
  protocol: 'HTTPS' | 'HTTP' | 'WSS' | 'WS' | 'UNKNOWN';
  detectedFormat: 'HLS' | 'MPEG_TS' | 'MP4' | 'WEBM' | 'AUDIO_MP3' | 'AUDIO_AAC' | 'XTREAM_LIVE' | 'UNKNOWN';
  isMixedContentRisk: boolean;
  isTokenized: boolean;
  hasQueryParameters: boolean;
  hostname: string;
  recommendedEngine: 'HLS_JS' | 'NATIVE_HLS' | 'HTML5_VIDEO' | 'AUDIO_ONLY';
  browserCompatibility: {
    hlsJsSupported: boolean;
    nativeHlsSupported: boolean;
    html5VideoSupported: boolean;
    audioSupported: boolean;
  };
  safetyNotes: string[];
}

export type StreamDiagnosticErrorType =
  | 'MIXED_CONTENT_BLOCKED'
  | 'CORS_RESTRICTION'
  | 'GEO_OR_AUTH_403'
  | 'STREAM_OFFLINE_404_OR_500'
  | 'CODEC_UNSUPPORTED'
  | 'TIMEOUT_OR_NETWORK_FAILURE'
  | 'UNKNOWN_ERROR';

export interface StreamDiagnosticVerdict {
  errorType: StreamDiagnosticErrorType;
  title: string;
  technicalDetails: string;
  rootCause: string;
  suggestedSolution: string;
  isRecoverable: boolean;
}

export class StreamAnalyzer {
  /**
   * Deep analysis of the actual stream URL from playlist
   */
  public static analyzeStreamUrl(url: string, contentType?: string): StreamAnalysisResult {
    const cleanUrl = (url || '').trim();
    let protocol: StreamAnalysisResult['protocol'] = 'UNKNOWN';
    let hostname = '';
    let hasQuery = false;
    let isTokenized = false;
    const safetyNotes: string[] = [];

    // Protocol & Hostname detection
    try {
      if (cleanUrl.startsWith('https://')) {
        protocol = 'HTTPS';
      } else if (cleanUrl.startsWith('http://')) {
        protocol = 'HTTP';
      } else if (cleanUrl.startsWith('wss://')) {
        protocol = 'WSS';
      } else if (cleanUrl.startsWith('ws://')) {
        protocol = 'WS';
      }

      if (cleanUrl.includes('://')) {
        const parsed = new URL(cleanUrl);
        hostname = parsed.hostname;
        hasQuery = parsed.search.length > 1;
        isTokenized = parsed.search.includes('token') || 
                      parsed.search.includes('key') || 
                      parsed.search.includes('auth') || 
                      parsed.search.includes('sign') ||
                      parsed.pathname.includes('/live/') && parsed.pathname.split('/').length >= 4;
      }
    } catch {
      hostname = 'URL non standard';
    }

    // Mixed Content Risk (if current app runs on HTTPS and stream is HTTP)
    const isAppHttps = typeof window !== 'undefined' && window.location.protocol === 'https:';
    const isMixedContentRisk = isAppHttps && protocol === 'HTTP';

    if (isMixedContentRisk) {
      safetyNotes.push('Flux HTTP sur application HTTPS : risque de blocage Mixed Content par la sandbox du navigateur.');
    }

    // Format detection
    const lower = cleanUrl.toLowerCase();
    let detectedFormat: StreamAnalysisResult['detectedFormat'] = 'UNKNOWN';

    if (lower.includes('.m3u8') || lower.includes('m3u8') || lower.includes('playlist') || lower.includes('/hls/')) {
      detectedFormat = 'HLS';
    } else if (lower.endsWith('.ts') || lower.includes('/live/') && lower.includes('.ts')) {
      detectedFormat = 'MPEG_TS';
    } else if (lower.endsWith('.mp4') || lower.includes('.mp4?')) {
      detectedFormat = 'MP4';
    } else if (lower.endsWith('.webm') || lower.includes('.webm?')) {
      detectedFormat = 'WEBM';
    } else if (lower.endsWith('.mp3') || lower.includes(':8000') || lower.includes('/stream') && contentType === 'RADIO') {
      detectedFormat = 'AUDIO_MP3';
    } else if (lower.endsWith('.aac') || lower.includes('aac')) {
      detectedFormat = 'AUDIO_AAC';
    } else if (lower.includes('/live/') && lower.split('/').length >= 4) {
      detectedFormat = 'XTREAM_LIVE';
    } else {
      detectedFormat = 'HLS'; // Default IPTV assumption
    }

    // Browser Capability Matrix
    const hasMediaSource = typeof window !== 'undefined' && 'MediaSource' in window;
    const testVideo = typeof document !== 'undefined' ? document.createElement('video') : null;
    const nativeHls = testVideo ? Boolean(testVideo.canPlayType('application/vnd.apple.mpegurl')) : false;
    const html5Video = testVideo ? Boolean(testVideo.canPlayType('video/mp4')) : true;
    const audioSupported = typeof document !== 'undefined' ? Boolean(document.createElement('audio').canPlayType('audio/mpeg')) : true;

    // Recommended Engine Strategy
    let recommendedEngine: StreamAnalysisResult['recommendedEngine'] = 'HLS_JS';

    if (contentType === 'RADIO' || detectedFormat === 'AUDIO_MP3' || detectedFormat === 'AUDIO_AAC') {
      recommendedEngine = 'AUDIO_ONLY';
    } else if (detectedFormat === 'MP4' || detectedFormat === 'WEBM') {
      recommendedEngine = 'HTML5_VIDEO';
    } else if (nativeHls && !hasMediaSource) {
      recommendedEngine = 'NATIVE_HLS';
    } else {
      recommendedEngine = 'HLS_JS';
    }

    return {
      url: cleanUrl,
      protocol,
      detectedFormat,
      isMixedContentRisk,
      isTokenized,
      hasQueryParameters: hasQuery,
      hostname,
      recommendedEngine,
      browserCompatibility: {
        hlsJsSupported: hasMediaSource,
        nativeHlsSupported: nativeHls,
        html5VideoSupported: html5Video,
        audioSupported
      },
      safetyNotes
    };
  }

  /**
   * Classify error into a precise technical diagnostic verdict
   */
  public static diagnoseFailure(
    content: IPTVContentItem,
    errorData?: {
      code?: number;
      message?: string;
      details?: string;
      hlsType?: string;
      hlsDetails?: string;
      httpStatus?: number;
    }
  ): StreamDiagnosticVerdict {
    const analysis = this.analyzeStreamUrl(content.streamUrl, content.type);
    const msg = (errorData?.message || errorData?.details || errorData?.hlsDetails || '').toLowerCase();
    const httpStatus = errorData?.httpStatus;

    // 1. Mixed Content check
    if (analysis.isMixedContentRisk && (msg.includes('network') || msg.includes('load') || msg.includes('manifestloaderror') || !msg)) {
      return {
        errorType: 'MIXED_CONTENT_BLOCKED',
        title: 'Blocage de Sécurité Navigateur (Mixed Content HTTP)',
        technicalDetails: `Le flux "${content.name}" utilise une URL non chiffrée (http://${analysis.hostname}) alors que l'application s'exécute sous protocole sécurisé HTTPS.`,
        rootCause: 'Les navigateurs modernes interdisent le chargement de médias non chiffrés (HTTP) sur un site HTTPS pour protéger l\'intégrité des sessions.',
        suggestedSolution: 'Le moteur va tenter une mise à niveau automatique en HTTPS ou la lecture via lecteur multimédia compatible.',
        isRecoverable: false
      };
    }

    // 2. HTTP 403 / 401 Forbidden or Geo-block
    if (httpStatus === 403 || httpStatus === 401 || msg.includes('403') || msg.includes('forbidden') || msg.includes('auth')) {
      return {
        errorType: 'GEO_OR_AUTH_403',
        title: 'Accès Refusé par le Fournisseur (HTTP 403 Forbidden)',
        technicalDetails: `Le serveur distant (${analysis.hostname}) a rejeté la requête avec le code HTTP 403/401.`,
        rootCause: 'Ce flux requiert soit une géolocalisation spécifique (droits de diffusion par pays), soit un jeton d\'autorisation valide fourni par la source.',
        suggestedSolution: 'Vérifiez la validité de la playlist IPTV ou les restrictions territoriales de la chaîne.',
        isRecoverable: false
      };
    }

    // 3. HTTP 404 / 500 Offline stream
    if (httpStatus === 404 || httpStatus === 500 || httpStatus === 502 || httpStatus === 503 || msg.includes('404') || msg.includes('500') || msg.includes('502')) {
      return {
        errorType: 'STREAM_OFFLINE_404_OR_500',
        title: 'Flux Temporairement Hors Ligne (Erreur Serveur Distant)',
        technicalDetails: `Le serveur de diffusion ${analysis.hostname} a retourné une erreur ${httpStatus || '5xx'} ou ressource introuvable (404).`,
        rootCause: 'L\'encodeur de diffusion de la chaîne est éteint ou le serveur IPTV distant subit une coupure temporaire.',
        suggestedSolution: 'Tentative de bascule automatique vers le flux de secours ou réessai ultérieur.',
        isRecoverable: Boolean(content.backupStreamUrl)
      };
    }

    // 4. CORS Restriction
    if (msg.includes('cors') || msg.includes('cross-origin') || msg.includes('manifestloaderror') && analysis.protocol === 'HTTPS') {
      return {
        errorType: 'CORS_RESTRICTION',
        title: 'Restriction d\'Origine Croisée (CORS)',
        technicalDetails: `Le serveur de la chaîne (${analysis.hostname}) n'inclut pas les en-têtes "Access-Control-Allow-Origin: *" requis par le protocole Web.`,
        rootCause: 'Le serveur diffuse le flux pour des décodeurs TV (Box/VLC) sans autoriser les requêtes XHR/Fetch de navigateurs web.',
        suggestedSolution: 'Activation du moteur de fallback direct ou transmission vers appareil Cast / AirPlay.',
        isRecoverable: false
      };
    }

    // 5. Codec unsupported
    if (msg.includes('codec') || msg.includes('unsupported') || msg.includes('decode') || msg.includes('demux')) {
      return {
        errorType: 'CODEC_UNSUPPORTED',
        title: 'Codec Vidéo / Audio Non Pris en Charge par le Matériel',
        technicalDetails: `Le flux utilise un encodage (ex: HEVC/H.265 ou AC3 Audio) non décodable nativement par ce navigateur.`,
        rootCause: 'Absence de décodeur matériel ou licence codec propriétaire dans le navigateur client.',
        suggestedSolution: 'Utilisation d\'un navigateur compatible ou diffusion Chromecast/AirPlay avec transcodage.',
        isRecoverable: false
      };
    }

    // 6. Generic Network timeout
    return {
      errorType: 'TIMEOUT_OR_NETWORK_FAILURE',
      title: 'Délai d\'Attente Réseau Dépassé (Timeout)',
      technicalDetails: `Aucune réponse reçue du serveur distant (${analysis.hostname}) dans le délai imparti.`,
      rootCause: 'Lenteur excessive du serveur source ou congestion de la liaison internet.',
      suggestedSolution: 'Le moteur procède à des reconnexions à intervalle progressif.',
      isRecoverable: true
    };
  }
}
