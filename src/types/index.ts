export type UserRole = 'VOYAGEUR' | 'ADMIN_AGENCE' | 'ADMIN_HOTEL' | 'SUPER_ADMIN';

export type PaymentMethod = 'Wave' | 'MTN Mobile Money' | 'Orange Money' | 'Moov Money' | 'Carte Bancaire';

export interface MaintenanceRecord {
  id: string;
  date: string;
  type: 'Vidange' | 'Freinage' | 'Pneumatiques' | 'Climatisation' | 'Révision Générale';
  description: string;
  cost: number;
}

export interface DriverMission {
  id: string;
  date: string;
  route: string;
  busImmatriculation: string;
  status: 'Terminée' | 'En cours' | 'Programmée';
}

export interface TransportAgency {
  id: string;
  name: string;
  code: string;
  logo?: string;
  logoUrl?: string;
  rating: number;
  totalBuses?: number;
  activeBuses?: number;
  totalDrivers?: number;
  contactPhone?: string;
  phone?: string;
  email: string;
  address?: string;
  region?: string;
  city?: string;
  commune?: string;
  rccmNumber?: string;
  mobileMoneyAccount?: string;
  primaryCities?: string[];
  status: 'Actif' | 'Suspendu' | 'En attente';
  adminUserId?: string;
  adminEmail?: string;
  createdAt?: string;
}

export interface BusTrip {
  id: string;
  agencyId: string;
  agencyName: string;
  agencyLogo: string;
  departureCity: string;
  arrivalCity: string;
  departureStation: string;
  arrivalStation: string;
  distanceKm: number;
  estimatedDuration: string;
  departureTime: string;
  arrivalTime: string;
  date: string;
  price: number; // In FCFA
  availableSeats: number;
  totalSeats: number;
  vehicleId: string;
  driverName: string;
  busType: 'VIP Standard' | 'Business Class' | 'Luxe Climatisé';
  amenities: string[];
  occupiedSeats: number[];
  digitalSignature?: string;
  publicationStatus?: 'Publié' | 'Brouillon' | 'Terminé' | 'Annulé';
  isPublished?: boolean;
}

export interface Vehicle {
  id: string;
  agencyId: string;
  immatriculation: string;
  brand: string;
  model: string;
  type: string;
  capacity: number;
  hasAC: boolean;
  hasWifi: boolean;
  hasUSB: boolean;
  status: 'En service' | 'En maintenance' | 'Hors service';
  lastInspectionDate: string;
  driverId?: string;
  driverName?: string;
  maintenanceHistory: MaintenanceRecord[];
}

export interface Driver {
  id: string;
  agencyId: string;
  fullName: string;
  photoUrl: string;
  licenseNumber: string;
  licenseExpirationDate: string;
  phone: string;
  experienceYears: number;
  status: 'Disponible' | 'En trajet' | 'En repos' | 'Suspendu';
  assignedVehicleId?: string;
  missionHistory: DriverMission[];
}

export interface TicketBooking {
  id: string;
  ticketCode: string;
  passengerName: string;
  passengerPhone: string;
  passengerEmail?: string;
  seatNumber: number;
  busTripId: string;
  agencyId: string;
  agencyName: string;
  departureCity: string;
  arrivalCity: string;
  departureStation: string;
  arrivalStation: string;
  date: string;
  departureTime: string;
  price: number;
  paymentMethod: PaymentMethod;
  paymentReference: string;
  paymentStatus: 'Payé' | 'En attente' | 'Remboursé';
  ticketStatus: 'Valide' | 'Scanné / Utilisé' | 'Annulé';
  digitalSignature: string;
  createdAt: string;
  qrCodeData: string;

  // Traçabilité Achat Tiers & Attribution Bénéficiaire
  isThirdPartyPurchase?: boolean; // Acheté pour une autre personne
  buyerId?: string;               // ID du compte utilisateur acheteur
  buyerName?: string;             // Nom complet de l'acheteur
  buyerPhone?: string;            // Téléphone de l'acheteur
  buyerEmail?: string;            // Email de l'acheteur
  beneficiaryId?: string;         // ID du compte bénéficiaire (si compte existant)
  beneficiaryName?: string;       // Nom du bénéficiaire
  beneficiaryPhone?: string;      // Téléphone du bénéficiaire
  beneficiaryEmail?: string;      // Email du bénéficiaire
  attributionStatus?: 'DIRECT_ACCOUNT' | 'PENDING_CLAIM' | 'SELF'; // Statut d'attribution
  claimToken?: string;            // Jeton unique de réclamation sécurisée
  beneficiaryNotified?: boolean;  // Indique si le bénéficiaire a été notifié
  transferNotes?: string;         // Notes ou message personnalisé accompagnant le billet offert
}

export interface SystemNotification {
  id: string;
  targetRole: UserRole | 'ALL';
  targetAgencyId?: string;
  title: string;
  message: string;
  timestamp: string;
  type: 'INFO' | 'SUCCESS' | 'WARNING' | 'ALERT';
  isRead: boolean;
}

export type AccommodationType = 'Hôtel' | 'Résidence Meublée' | 'Maison d\'Hôtes' | 'Appartement' | 'Auberge' | 'Complexe Touristique';

export interface Hotel {
  id: string;
  name: string;
  type: AccommodationType;
  stars: number; // 0 to 5
  logoUrl?: string;
  imageUrl: string; // Photo principale / Façade
  gallery: string[]; // Galerie multimédia complète
  description: string;
  country: string; // Côte d'Ivoire
  region: string; // Lagunes, Gbêkê, Tonkpi, San-Pédro, Sud-Comoé, Poro, Indénié-Djuablin
  city: string; // Abidjan, Yamoussoukro, San-Pédro, Bouaké, Man, Assinie, Korhogo
  commune: string; // Cocody, Marcory, Plateau, San-Pédro Port, etc.
  district?: string; // Quartier (ex: Palmeraie, Zone 4)
  address: string;
  coordinates?: { lat: number; lng: number };
  contactPhone: string;
  email: string;
  website?: string;
  receptionHours: string; // ex: 24h/24 & 7j/7
  cancellationPolicy: string; // ex: Annulation gratuite jusqu'à 24h avant l'arrivée
  pricePerNight: number; // Tarif à partir de (FCFA)
  rating: number;
  totalRooms: number;
  amenities: string[]; // Wi-Fi, Climatisation, Télévision, Restaurant, Piscine, Salle de sport, Parking, Navette, Blanchisserie, Salle de conférence, Accessibilité PMR
  status: 'Actif' | 'En attente' | 'Suspendu';
  adminUserId?: string;
  adminEmail?: string;
}

export interface HotelRoom {
  id: string;
  hotelId: string;
  roomNumber: string;
  name: string; // ex: Chambre Deluxe Vue Laguna, Suite Executive Royale
  type: 'Standard' | 'Deluxe King' | 'Suite Executive' | 'Bungalow Vue Mer' | 'Appartement 2 Pièces' | 'Chambre Familiale';
  description: string;
  pricePerNight: number; // FCFA
  maxCapacity: number;
  bedCount: number;
  bedType: string; // ex: 1 Lit King Size, 2 Lits Jumeaux
  isAvailable: boolean;
  features: string[];
  imageUrl: string;
  gallery?: string[];
}

export interface HotelBooking {
  id: string;
  bookingCode: string; // ex: RES-HOT-CI-8812
  hotelId: string;
  hotelName: string;
  hotelCity: string;
  hotelAddress?: string;
  roomId: string;
  roomType: string;
  guestName: string;
  guestPhone: string;
  guestEmail?: string;
  checkInDate: string;
  checkOutDate: string;
  nightsCount: number;
  guestsCount: number;
  totalPrice: number;
  paymentMethod: PaymentMethod;
  paymentReference: string;
  paymentStatus: 'Payé' | 'En attente' | 'Remboursé';
  status: 'Confirmé' | 'Check-in' | 'Check-out' | 'Annulé';
  qrCodeData: string;
  digitalSignature: string;
  createdAt: string;
}

export type CameraTechnology = 'Caméra IP' | 'Caméra Wi-Fi' | 'DVR' | 'NVR' | 'Caméra Solaire 4G';
export type CameraProtocol = 'ONVIF' | 'RTSP' | 'WebRTC' | 'HTTP-FLV';
export type CameraCategoryType = 'Gare Routière' | 'Hôtel' | 'Résidence Privée' | 'Entrée Agence' | 'Parking' | 'Quai d\'Embarquement' | 'Commerce / Boutique' | 'Autocar';

export type AIModelDetection = 
  | 'Mouvement' 
  | 'Intrusion Zone Sécurisée' 
  | 'Présence Humaine' 
  | 'Chute de Personne' 
  | 'Attroupement Suspect' 
  | 'Objet Abandonné / Bagage' 
  | 'Véhicule Suspect' 
  | 'Anomalie Visuelle / Incendie';

export interface Camera {
  id: string;
  code?: string;
  name: string;
  description?: string;
  locationName: string;
  siteName?: string; // Nom du site / agence (ex: Gare Adjamé VIP)
  building?: string;
  floor?: string;
  zone?: string;
  city: string;
  timezone?: string;
  type: CameraCategoryType;
  technology: CameraTechnology;
  protocol: CameraProtocol;
  brand?: string;
  model?: string;
  serialNumber?: string;
  firmwareVersion?: string;
  agencyId?: string; // Si rattaché à une agence de transport
  hotelId?: string;  // Si rattaché à un établissement hôtelier
  ownerId?: string;
  ownerType: 'Traveler' | 'Agency' | 'Global';
  streamUrl: string;
  snapshotUrl?: string;
  status: 'En direct' | 'Hors ligne' | 'Alerte IA' | 'Désactivé' | 'Dégradée' | 'Incomplète';
  statusCode?: 'ONLINE' | 'DEGRADED' | 'OFFLINE' | 'INCOMPLETE_CONFIG' | 'ALERT';
  resolution: '4K Ultra HD' | '1080p HD Night Vision' | '720p HD' | '480p Éco';
  fps: number;
  motionDetected: boolean;
  lastAlertTime?: string;
  lastOnlineTime?: string;
  uptimePercent?: number;
  sensitivity: 'Haute' | 'Moyenne' | 'Basse';
  isEnabled: boolean;
  
  // Advanced configuration parameters (optional)
  ipAddress?: string;
  port?: number;
  username?: string;
  passwordMasked?: string;
  substreamUrl?: string;
  latencyMs?: number;
  bitrateKbps?: number;
  codec?: string;
  aiDetectionRules?: AIModelDetection[];
  recordOnEvent?: boolean;
  continuousRecord?: boolean;
  retentionDays?: number;
  hasAudio?: boolean;
  hasTwoWayTalk?: boolean;
  hasPTZ?: boolean;
  createdAt?: string;
  updatedAt?: string;

  // Granular Modular Configurations
  networkConfig?: {
    ipAddress: string;
    port: number;
    rtspPort?: number;
    onvifPort?: number;
    httpPort?: number;
    httpsPort?: number;
    useHttps: boolean;
    protocol: string;
    macAddress?: string;
    gateway?: string;
    subnetMask?: string;
    dns?: string;
    connectionTested: boolean;
    lastPingMs?: number;
  };
  securityCredentials?: {
    username: string;
    passwordMasked: string;
    authMethod: string;
    isPasswordSet: boolean;
  };
  videoConfig?: {
    mainStreamUrl: string;
    subStreamUrl?: string;
    activeStream: 'MAIN' | 'SUB';
    codec: string;
    resolution: string;
    fps: number;
    bitrateKbps: number;
    orientation: string;
    nightVisionMode: string;
  };
  audioConfig?: {
    supported: boolean;
    enabled: boolean;
    microphoneEnabled: boolean;
    speakerEnabled: boolean;
    twoWayAudioSupported: boolean;
    codec: string;
    inputVolume: number;
    outputVolume: number;
  };
  motionConfig?: {
    enabled: boolean;
    source: 'NATIVE_CAMERA' | 'SOFTWARE_AI_CORE';
    sensitivity: number;
    threshold: number;
    armingSchedule: string;
    recordOnMotion: boolean;
    sendPushNotification: boolean;
    sendEmailNotification: boolean;
    triggerSiren: boolean;
    aiDetectionRules: AIModelDetection[];
  };
  ptzConfig?: {
    supported: boolean;
    panSpeed: number;
    tiltSpeed: number;
    zoomSpeed: number;
    presets: Array<{ id: string; name: string; pan: number; tilt: number; zoom: number }>;
    activePresetId?: string;
    patrolModeEnabled: boolean;
    patrolIntervalSeconds: number;
  };
  recordingConfig?: {
    mode: 'CONTINUOUS' | 'ON_EVENT' | 'SCHEDULED' | 'MANUAL';
    retentionDays: number;
    storageTarget: string;
    diskSpaceAllocatedGb: number;
    diskSpaceUsedGb: number;
    overflowPolicy: string;
    recordingStream: string;
  };
  permissionsConfig?: {
    tenantScope: 'TRAVELER' | 'AGENCY' | 'HOTEL' | 'GLOBAL';
    assignedAgencyId?: string;
    assignedHotelId?: string;
    assignedUserId?: string;
    allowedRoles: UserRole[];
    isPublicForTravelers: boolean;
  };
}

export interface VisionAlert {
  id: string;
  cameraId: string;
  cameraName: string;
  locationName: string;
  agencyId?: string;
  timestamp: string;
  alertType: AIModelDetection;
  severity: 'Critique' | 'Moyenne' | 'Faible';
  description: string;
  status: 'Actif' | 'Résolu' | 'Faux Positif';
  imageUrl?: string;
  clipUrl?: string;
  notifiedByEmail?: boolean;
}

export interface CameraRecording {
  id: string;
  cameraId: string;
  cameraName: string;
  locationName: string;
  startTime: string;
  endTime: string;
  duration: string; // ex: "04:12"
  recordType: 'Continu' | 'Événement IA' | 'Manuel';
  eventType?: AIModelDetection;
  thumbnailUrl: string;
  videoUrl: string;
  fileSizeMb: number;
  aiSummary?: string;
}

export interface CameraPermissionState {
  hasGrantedPermission: boolean;
  permissionStatus: 'prompt' | 'granted' | 'denied' | 'unknown';
  lastRequestedAt?: string;
}

export interface VisionSystemStats {
  totalCameras: number;
  activeLiveCameras: number;
  offlineCameras: number;
  aiAlertsToday: number;
  serviceAvailabilityPercent: number; // e.g. 99.8%
  averageLatencyMs: number; // e.g. 115ms
  totalBandwidthGbps: number; // e.g. 2.4 Gbps
  storageUsedTb: number; // e.g. 18.5 TB
  activeEncryptedStreams: number;
}

export type ExtendedRole = UserRole | 'CONTROLEUR_GARE' | 'SUPPORT_CLIENT' | 'GESTIONNAIRE_HOTEL';

export type AccountLifecycleStatus = 
  | 'ACTIVE' 
  | 'PENDING_VERIFICATION' 
  | 'SUSPENDED' 
  | 'LOCKED' 
  | 'DISABLED' 
  | 'DELETED'
  | 'Actif' 
  | 'Suspendu' 
  | 'En attente de validation';

export interface UserAccount {
  id: string;
  fullName: string;
  email: string;
  phone: string;
  role: UserRole;
  extendedRole?: ExtendedRole;
  status: AccountLifecycleStatus;
  agencyId?: string; // Set if role === 'ADMIN_AGENCE'
  agencyName?: string;
  hotelId?: string;  // Set if role === 'ADMIN_HOTEL'
  hotelName?: string;
  avatarUrl?: string;
  failedLoginAttempts: number;
  isLocked: boolean;
  lastLoginAt?: string;
  createdAt: string;
  twoFactorEnabled?: boolean;
}

export interface AuthSession {
  token: string;
  user: UserAccount;
  loginTimestamp: string;
  expiresAt: string;
  ipAddress: string;
  deviceInfo: string;
}

export interface AuditLog {
  id: string;
  timestamp: string;
  user: string;
  role: UserRole;
  action: string;
  module: 'Transport' | 'Hôtellerie' | 'Vision' | 'Sécurité' | 'RBAC' | 'Système';
  details: string;
  status: 'Succès' | 'Avertissement' | 'Refusé';
  ipAddress: string;
}

