export interface ApiIntegration {
  id: string;
  category: 'IA' | 'CINEMA' | 'MAPS' | 'PAYMENT' | 'COMMUNICATION' | 'CLOUD';
  name: string;
  url: string;
  publicKey: string;
  privateKey: string;
  secretToken: string;
  version: string;
  environment: 'DEVELOPMENT' | 'TEST' | 'PRODUCTION';
  isActive: boolean;
  lastPingResult?: {
    success: boolean;
    latencyMs: number;
    timestamp: string;
    statusMsg: string;
  };
  history: {
    timestamp: string;
    action: string;
    author: string;
  }[];
}

export interface TenantCustomization {
  id: string;
  type: 'AGENCY' | 'HOTEL';
  name: string;
  logoUrl: string;
  mainBannerUrl: string;
  secondaryBannerUrl?: string;
  photoGallery: string[];
  fleetGallery?: string[];
  presentationVideoUrl?: string;
  slogan: string;
  description: string;
  gpsCoordinates?: { lat: number; lng: number };
  contactPhone: string;
  contactEmail: string;
  operatingHours: string;
  socialLinks?: { facebook?: string; whatsapp?: string; website?: string };
  highlightedServices: string[];
  promotions: { title: string; discountPercent: number; code: string; validUntil: string }[];
}

export interface GeneralSettings {
  platformName: string;
  tagline: string;
  logoUrl: string;
  iconUrl: string;
  primaryColor: string;
  secondaryColor: string;
  defaultTheme: 'light' | 'dark' | 'system';
  defaultLanguage: 'FR' | 'EN' | 'BAOULE' | 'DIOULA';
  currency: string;
  timezone: string;
  contactEmail: string;
  contactPhone: string;
  address: string;
  cguText: string;
  privacyPolicyText: string;
  legalNoticeText: string;
}

export interface UserRBACSettings {
  autoProvisionAgencyAdmin: boolean;
  autoProvisionHotelAdmin: boolean;
  loginMaxAttempts: number;
  sessionTimeoutMinutes: number;
  requireTwoFactorForAdmins: boolean;
  allowPublicTravelerRegistration: boolean;
  defaultTravelerRole: string;
}

export interface TransportModuleSettings {
  vehicleCategories: string[];
  maxSeatsPerBooking: number;
  cancellationWindowHours: number;
  defaultCommissionRatePercent: number;
  vatRatePercent: number;
  ticketTemplate: 'QR_SECURE_DIGITAL' | 'STANDARD_PDF';
  qrCodeSigningAlgorithm: string;
  requireDriverScan: boolean;
  allowPassengerSeatChoice: boolean;
  gpsPingFrequencySec?: number;
  luggageFreeAllowanceKg?: number;
  extraLuggageFeePerKgFcfa?: number;
  mobileMoneyProviders?: string[];
  autoApproveAgencies?: boolean;
}

export interface HotelModuleSettings {
  hotelCategories: string[];
  roomCategories: string[];
  defaultCheckInTime: string;
  defaultCheckOutTime: string;
  cancellationWindowHours: number;
  defaultHotelCommissionPercent: number;
  standardAmenitiesList: string[];
  autoConfirmBookings: boolean;
  touristTaxPerNightFcfa?: number;
  allowOverbookingMarginPercent?: number;
  acceptedPaymentMethods?: string[];
}

export interface VisionModuleSettings {
  cameraRetentionDays: number;
  alertLevelsEnabled: ('CRITICAL' | 'WARNING' | 'INFO')[];
  defaultSensitivity: 'Haute' | 'Moyenne' | 'Basse';
  aiDetectionRules: string[];
  maxStreamsPerUser: number;
  cloudStorageLimitGbPerCamera: number;
  videoQualityPreset?: '720p_HD' | '1080p_FHD' | '4K_UHD';
  recordingMode?: 'CONTINUOUS' | 'ON_MOTION' | 'HYBRID';
  rtspWebRtcBridgeEnabled?: boolean;
}

export interface IptvModuleSettings {
  defaultMaxResolution: '720p' | '1080p' | '4K';
  maxConcurrentStreamsPerUser: number;
  allowedBouquets: string[];
  freeTrialDays: number;
  bandwidthThrottlingKbps: number;
  tmdbApiKeyConfigured?: boolean;
  epgAutoUpdateHours?: number;
  autoUpdatePlaylistsDays?: number;
}

export interface AiCoreSettings {
  assistantsEnabled: boolean;
  modelAlias: string;
  rateLimitPerUserMin: number;
  aiLogsEnabled: boolean;
  maxContextTokens: number;
  temperature: number;
  fallbackModelAlias?: string;
  autoDocGenerationEnabled?: boolean;
  activeAgentsList?: string[];
}

export interface NotificationSettings {
  pushEnabled: boolean;
  smsEnabled: boolean;
  emailEnabled: boolean;
  internalEnabled: boolean;
  templates: {
    welcomeMessage: string;
    bookingConfirmation: string;
    securityAlertMsg: string;
    paymentReceipt: string;
  };
}

export interface FinancialSettings {
  currency: string;
  vatPercent: number;
  agencyCommissionPercent: number;
  hotelCommissionPercent: number;
  bookingFeeFlatFcfa: number;
  acceptedPaymentMethods: string[];
  autoRefundAllowed: boolean;
  payoutSchedule: 'DAILY' | 'WEEKLY' | 'MONTHLY';
}

export interface UxUiSettings {
  customHeaderMessage: string;
  customBannerUrl: string;
  welcomeBannerImageUrl?: string;
  welcomeBannerTitle?: string;
  welcomeBannerSubtitle?: string;
  serviceCardsOrder: string[];
  themeAccentColor: string;
  compactModeEnabled: boolean;
}

export interface ConfigVersionHistory {
  version: string;
  id: string;
  timestamp: string;
  authorEmail: string;
  authorRole: string;
  changeSummary: string;
  snapshotData: HierarchicalSettings;
}

export interface SyncConflict {
  id: string;
  timestamp: string;
  module: string;
  tenantId?: string;
  tenantName?: string;
  parameterKey: string;
  globalValue: any;
  tenantValue: any;
  status: 'PENDING_RESOLVE' | 'RESOLVED_GLOBAL' | 'OVERRIDDEN_TENANT';
}

export interface ConfigAuditEntry {
  id: string;
  timestamp: string;
  userEmail: string;
  userRole: string;
  module: string;
  parameterKey: string;
  oldValue: string;
  newValue: string;
  status: 'Succès' | 'Restauré' | 'Annulé';
}

export interface HierarchicalSettings {
  version: string;
  lastUpdated: string;
  general: GeneralSettings;
  rbac: UserRBACSettings;
  transport: TransportModuleSettings;
  hotel: HotelModuleSettings;
  vision: VisionModuleSettings;
  iptv: IptvModuleSettings;
  aiCore: AiCoreSettings;
  notifications: NotificationSettings;
  financial: FinancialSettings;
  uxui: UxUiSettings;
}
