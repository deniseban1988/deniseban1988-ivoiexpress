export type IPTVContentType = 
  | 'TV' 
  | 'RADIO' 
  | 'FILM' 
  | 'SERIES' 
  | 'DOCUMENTAIRE' 
  | 'DESSIN_ANIME' 
  | 'DIRECT_EVENT';

export type IPTVCategory = 
  | 'Actualités'
  | 'Sport'
  | 'Cinéma'
  | 'Musique'
  | 'Jeunesse'
  | 'Documentaires'
  | 'Culture'
  | 'Religion'
  | 'Divertissement'
  | 'International'
  | 'Radio Local';

export type IPTVQuality = '4K Ultra HD' | '1080p Full HD' | '720p HD' | 'SD Standard' | 'Auto';

export type StreamHealthClassification = 'ACTIVE' | 'UNSTABLE' | 'DEAD' | 'PENDING';

export interface IPTVEpisode {
  id: string;
  seasonNumber: number;
  episodeNumber: number;
  title: string;
  duration: string;
  streamUrl: string;
  thumbnailUrl?: string;
  synopsis?: string;
}

export interface IPTVContentItem {
  id: string;
  name: string;
  logoUrl: string;
  bannerUrl?: string;
  type: IPTVContentType;
  category: IPTVCategory | string;
  rawCategory?: string; // Original raw category / group-title string from M3U playlist
  groupTitle?: string; // Preserved group-title attribute from M3U
  language: string; // e.g. 'Français', 'Baoulé', 'Dioula', 'Anglais'
  country: string; // e.g. 'Côte d'Ivoire', 'France', 'Sénégal', 'International'
  quality: IPTVQuality;
  status: 'Actif' | 'Inactif' | 'Maintenance';
  streamUrl: string;
  backupStreamUrl?: string;
  synopsis?: string;
  duration?: string; // e.g. "1h 45m" or "En Direct"
  year?: number;
  viewsCount: number;
  rating?: number; // e.g. 4.8
  playlistId?: string;
  providerName?: string;
  isFeatured?: boolean;
  currentProgram?: string; // For TV/Radio
  nextProgram?: string;
  frequencyFm?: string; // For Radio, e.g. "88.0 FM"
  tvgId?: string;
  tvgName?: string;
  agencyId?: string | 'NATIONAL'; // Multi-tenant isolation: 'NATIONAL' or agency ID
  httpUserAgent?: string;
  episodes?: IPTVEpisode[];
  createdAt: string;
  lastHealthCheck?: string;
  healthStatus?: 'HEALTHY' | 'UNREACHABLE' | 'DEGRADED';
  // Advanced Health Check & Auto-Cleaning fields
  healthClassification?: StreamHealthClassification;
  consecutiveFailures?: number; // Count of failed probes (1, 2, 3+)
  lastTestedAt?: string;
  startupTimeMs?: number; // First fragment / response time (ms)
  lastHealthError?: string;
  healthConfidence?: number; // 0-100%
  isActivePlaylistEligible?: boolean; // true if active or unstable, false if confirmed dead
  probeProtocol?: 'HTTPS' | 'HTTP' | 'WSS' | 'WS' | 'UNKNOWN';
  probeFormat?: string;
  probeHttpStatus?: number;
}

export interface IPTVPlaylist {
  id: string;
  name: string;
  provider: string;
  format: 'M3U' | 'M3U8' | 'Xtream Codes' | 'JSON API';
  sourceUrl: string;
  totalChannels: number;
  activeChannels?: number;
  status: 'Actif' | 'Inactif' | 'Mise à jour requise';
  lastUpdated: string;
  autoSync: boolean;
  agencyId?: string | 'NATIONAL';
  lastSyncResult?: {
    success: boolean;
    addedCount: number;
    updatedCount: number;
    duplicateCount: number;
    error?: string;
  };
}

export interface IPTVProvider {
  id: string;
  name: string;
  type: 'Satellite' | 'Fibre' | 'CDN Web' | 'Local Broadcaster';
  status: 'Opérationnel' | 'Perturbé' | 'Hors ligne';
  latencyMs: number;
  uptimePercent: number;
  contactEmail: string;
}

export interface IPTVWatchHistoryItem {
  id: string;
  contentId: string;
  contentTitle: string;
  contentType: IPTVContentType;
  logoUrl: string;
  watchedAt: string;
  progressSeconds: number;
  totalSeconds: number;
  completed: boolean;
}

export interface IPTVNotification {
  id: string;
  title: string;
  message: string;
  type: 'INFO' | 'NOUVEAUTE' | 'MAINTENANCE' | 'INCIDENT';
  timestamp: string;
  isRead: boolean;
}

export interface IPTVGlobalSettings {
  moduleEnabled: boolean;
  allowVoyageurAccess: boolean;
  agencyAccess: Record<string, boolean>;
  defaultQuality: IPTVQuality;
  maxSimultaneousStreams: number;
  enableAiRecommendations: boolean;
  autoSaveHistory: boolean;
  m3uAutoSyncIntervalHours: number;
  defaultTenantScope: 'NATIONAL' | 'AGENCY_ISOLATED';
  autoDeadStreamDetection: boolean;
  healthCheckIntervalMinutes: number;
  // Enhanced Health Check & Self-Healing Settings
  healthCheckConsecutiveFailureThreshold: number; // e.g. 3 consecutive failures before marking DEAD
  healthCheckAutoCleaning: boolean; // Auto-filter DEAD streams from Active Playlist
  healthCheckAutoReactivation: boolean; // Periodically re-check DEAD streams and revive them if working
  healthCheckConcurrency: number; // Parallel stream probe workers (e.g. 4-8)
  healthCheckScheduleMinutes: number; // Periodic background check interval (minutes)
  activePlaylistOnlyForTraveler: boolean; // Only present ACTIVE/UNSTABLE channels to travelers
  // Hero Banner Customization (Configurable from SuperAdmin)
  heroBannerUrl?: string;
  heroTitle?: string;
  heroSubtitle?: string;
  heroBadgeText?: string;
  heroCtaText?: string;
}

export interface StreamHealthJobSummary {
  id: string;
  startedAt: string;
  finishedAt?: string;
  durationMs?: number;
  totalTested: number;
  activeCount: number;
  unstableCount: number;
  deadCount: number;
  pendingCount: number;
  reactivatedCount: number; // Count of streams that revived from DEAD -> ACTIVE
  averageStartupTimeMs: number;
  status: 'IDLE' | 'RUNNING' | 'COMPLETED' | 'CANCELLED';
  activePlaylistTotal: number;
  sourceCatalogTotal: number;
}

export interface StreamHealthCheckProgress {
  isRunning: boolean;
  testedCount: number;
  totalCount: number;
  activeCount: number;
  unstableCount: number;
  deadCount: number;
  currentChannelName?: string;
  estimatedTimeRemainingSec?: number;
}

export interface IPTVAnalyticsData {
  categoryName: string;
  viewersCount: number;
  sharePercent: number;
}

export interface IPTVImportJobSummary {
  id: string;
  playlistName: string;
  provider: string;
  sourceUrl: string;
  agencyId?: string;
  startedAt: string;
  finishedAt?: string;
  durationSeconds?: number;
  totalToImport: number;
  processedCount: number;
  succeededCount: number;
  rejectedCount: number;
  duplicateCount: number;
  totalProcessed?: number;
  addedUnique?: number;
  deduplicatedCount?: number;
  deduplicationReasonBreakdown?: {
    streamUrl: number;
    tvgId: number;
    nameAndCountry: number;
  };
  duplicateDetails?: Array<{
    name: string;
    streamUrl: string;
    reason: 'STREAM_URL_COLLISION' | 'TVG_ID_COLLISION' | 'SIGNATURE_MATCH';
  }>;
  rejectedDetails?: Array<{
    name: string;
    rawUrl: string;
    reason: string;
  }>;
  errors: string[];
  status: 'EN_COURS' | 'TERMINE' | 'ECHEC' | 'ANNULE';
}

export interface IPTVHealthReport {
  totalChannels: number;
  activeChannels: number;
  inactiveChannels: number;
  maintenanceChannels: number;
  missingLogosCount: number;
  missingEpgCount: number;
  invalidUrlCount: number;
  duplicatesCount: number;
  healthScore: number;
  checkedAt: string;
  playlistStatuses: Array<{
    id: string;
    name: string;
    total: number;
    active: number;
    status: string;
    lastUpdated: string;
  }>;
  topCategories: Array<{ category: string; count: number }>;
  topCountries: Array<{ country: string; count: number }>;
}

export interface IPTVMaintenanceTask {
  id: string;
  type: 'HEALTH_PROBE' | 'DEAD_CHANNEL_PURGE' | 'DUPLICATE_CLEANUP' | 'RECONCILIATION' | 'SERVER_CACHE_REBUILD';
  status: 'SUCCESS' | 'WARNING' | 'FAILED';
  affectedCount: number;
  executedAt: string;
  executedBy: string;
  details: string;
}
