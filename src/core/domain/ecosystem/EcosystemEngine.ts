import { getApiUrl } from '../../../lib/api';

export interface IPaymentConnectorInfo {
  id: string;
  name: string;
  providerCode: 'WAVE' | 'ORANGE_MONEY' | 'MTN_MOMO' | 'MOOV_MONEY' | 'VISA_MASTERCARD' | 'BANK_TRANSFER';
  status: 'ACTIVE' | 'INACTIVE' | 'MAINTENANCE';
  transactionFeePercent: number;
  averageLatencyMs: number;
  icon: string;
  isDefault: boolean;
}

export interface IMapProviderInfo {
  id: string;
  name: string;
  code: 'GOOGLE_MAPS' | 'OPENSTREETMAP' | 'MAPBOX';
  isActive: boolean;
  tileUrlPattern: string;
  supportsTraffic: boolean;
  supports3DBuildings: boolean;
  apiQuotaRemaining: number;
}

export interface INotificationChannelInfo {
  id: string;
  channelType: 'PUSH' | 'SMS' | 'EMAIL' | 'INTERNAL' | 'WHATSAPP';
  providerName: string;
  status: 'OPERATIONAL' | 'DEGRADED' | 'DISABLED';
  sentTodayCount: number;
  deliverySuccessRate: number;
}

export interface IPartnerInfo {
  id: string;
  name: string;
  category: 'TRANSPORT_AGENCY' | 'HOTEL_CHAIN' | 'IPTV_PROVIDER' | 'TECH_VENDOR' | 'BANK_FINTECH';
  contractStatus: 'ACTIVE' | 'PENDING_APPROVAL' | 'SUSPENDED';
  apiKey: string;
  slaTargetPercent: number;
  monthlyVolumeFCFA: number;
  joinedDate: string;
}

export interface IServiceRegistryItem {
  id: string;
  serviceName: string;
  module: 'TRANSPORT' | 'HOTEL' | 'VISION_AI' | 'IPTV' | 'PAYMENT' | 'NOTIFICATION' | 'AUDIT';
  version: string;
  ownerTeam: string;
  status: 'ONLINE' | 'DEGRADED' | 'OFFLINE';
  slaUptimePercent: number;
  dependenciesCount: number;
}

export interface IPublicApiEndpoint {
  id: string;
  path: string;
  method: 'GET' | 'POST' | 'PUT' | 'DELETE';
  title: string;
  description: string;
  requiredScope: string;
  rateLimitPerMin: number;
  sampleRequestJson?: string;
  sampleResponseJson?: string;
}

export class EcosystemEngine {
  private static instance: EcosystemEngine;

  private paymentConnectors: IPaymentConnectorInfo[] = [];
  private mapProviders: IMapProviderInfo[] = [];
  private notificationChannels: INotificationChannelInfo[] = [];
  private partners: IPartnerInfo[] = [];
  private serviceCatalog: IServiceRegistryItem[] = [];
  private publicApiEndpoints: IPublicApiEndpoint[] = [];

  private listeners: Array<() => void> = [];

  private constructor() {
    this.seedEcosystemData();
  }

  public static getInstance(): EcosystemEngine {
    if (!EcosystemEngine.instance) {
      EcosystemEngine.instance = new EcosystemEngine();
    }
    return EcosystemEngine.instance;
  }

  public subscribe(listener: () => void): () => void {
    this.listeners.push(listener);
    return () => {
      this.listeners = this.listeners.filter(l => l !== listener);
    };
  }

  private notify(): void {
    this.listeners.forEach(l => l());
  }

  // Getters
  public getPaymentConnectors(): IPaymentConnectorInfo[] {
    return [...this.paymentConnectors];
  }

  public getMapProviders(): IMapProviderInfo[] {
    return [...this.mapProviders];
  }

  public getNotificationChannels(): INotificationChannelInfo[] {
    return [...this.notificationChannels];
  }

  public getPartners(): IPartnerInfo[] {
    return [...this.partners];
  }

  public getServiceCatalog(): IServiceRegistryItem[] {
    return [...this.serviceCatalog];
  }

  public getPublicApiEndpoints(): IPublicApiEndpoint[] {
    return [...this.publicApiEndpoints];
  }

  // Actions
  public togglePaymentConnector(id: string): void {
    const conn = this.paymentConnectors.find(c => c.id === id);
    if (conn) {
      conn.status = conn.status === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE';
      this.notify();
    }
  }

  public setActiveMapProvider(code: 'GOOGLE_MAPS' | 'OPENSTREETMAP' | 'MAPBOX'): void {
    this.mapProviders.forEach(p => {
      p.isActive = p.code === code;
    });
    this.notify();
  }

  public addPartner(partner: Omit<IPartnerInfo, 'id' | 'apiKey' | 'joinedDate'>): IPartnerInfo {
    const newPartner: IPartnerInfo = {
      ...partner,
      id: `part-${Date.now().toString().slice(-5)}`,
      apiKey: `ivx_live_${Math.random().toString(36).substring(2, 12)}`,
      joinedDate: new Date().toISOString()
    };
    this.partners.unshift(newPartner);
    this.notify();
    return newPartner;
  }

  public simulatePublicApiCall(endpointId: string): { status: number; durationMs: number; body: any } {
    const endpoint = this.publicApiEndpoints.find(e => e.id === endpointId);
    if (!endpoint) {
      return { status: 404, durationMs: 12, body: { error: 'Endpoint non trouvé' } };
    }

    return {
      status: 200,
      durationMs: Math.floor(Math.random() * 30) + 15,
      body: JSON.parse(endpoint.sampleResponseJson || '{"status": "ok"}')
    };
  }

  private seedEcosystemData(): void {
    this.paymentConnectors = [
      {
        id: 'pay-wave',
        name: 'Wave Money CI',
        providerCode: 'WAVE',
        status: 'ACTIVE',
        transactionFeePercent: 1.0,
        averageLatencyMs: 120,
        icon: '🌊',
        isDefault: true
      },
      {
        id: 'pay-om',
        name: 'Orange Money CI',
        providerCode: 'ORANGE_MONEY',
        status: 'ACTIVE',
        transactionFeePercent: 1.5,
        averageLatencyMs: 210,
        icon: '🟠',
        isDefault: false
      },
      {
        id: 'pay-mtn',
        name: 'MTN Mobile Money',
        providerCode: 'MTN_MOMO',
        status: 'ACTIVE',
        transactionFeePercent: 1.5,
        averageLatencyMs: 190,
        icon: '🟡',
        isDefault: false
      },
      {
        id: 'pay-moov',
        name: 'Moov Money Flooz',
        providerCode: 'MOOV_MONEY',
        status: 'ACTIVE',
        transactionFeePercent: 1.5,
        averageLatencyMs: 230,
        icon: '🔵',
        isDefault: false
      },
      {
        id: 'pay-visa',
        name: 'Cartes VISA / Mastercard',
        providerCode: 'VISA_MASTERCARD',
        status: 'ACTIVE',
        transactionFeePercent: 2.2,
        averageLatencyMs: 340,
        icon: '💳',
        isDefault: false
      },
      {
        id: 'pay-bank',
        name: 'Virement Bancaire Entreprises',
        providerCode: 'BANK_TRANSFER',
        status: 'INACTIVE',
        transactionFeePercent: 0.5,
        averageLatencyMs: 12000,
        icon: '🏛️',
        isDefault: false
      }
    ];

    this.mapProviders = [
      {
        id: 'map-google',
        name: 'Google Maps Platform',
        code: 'GOOGLE_MAPS',
        isActive: true,
        tileUrlPattern: 'https://maps.googleapis.com/maps/api/staticmap...',
        supportsTraffic: true,
        supports3DBuildings: true,
        apiQuotaRemaining: 842000
      },
      {
        id: 'map-osm',
        name: 'OpenStreetMap (OSM)',
        code: 'OPENSTREETMAP',
        isActive: false,
        tileUrlPattern: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
        supportsTraffic: false,
        supports3DBuildings: false,
        apiQuotaRemaining: 9999999
      },
      {
        id: 'map-mapbox',
        name: 'Mapbox Vector SDK',
        code: 'MAPBOX',
        isActive: false,
        tileUrlPattern: 'https://api.mapbox.com/styles/v1/...',
        supportsTraffic: true,
        supports3DBuildings: true,
        apiQuotaRemaining: 450000
      }
    ];

    this.notificationChannels = [
      {
        id: 'notif-push',
        channelType: 'PUSH',
        providerName: 'Firebase Cloud Messaging (FCM)',
        status: 'OPERATIONAL',
        sentTodayCount: 14820,
        deliverySuccessRate: 99.4
      },
      {
        id: 'notif-sms',
        channelType: 'SMS',
        providerName: 'Orange SMS Gateway CI',
        status: 'OPERATIONAL',
        sentTodayCount: 8900,
        deliverySuccessRate: 98.7
      },
      {
        id: 'notif-email',
        channelType: 'EMAIL',
        providerName: 'SendGrid Transactional API',
        status: 'OPERATIONAL',
        sentTodayCount: 6420,
        deliverySuccessRate: 99.8
      },
      {
        id: 'notif-wa',
        channelType: 'WHATSAPP',
        providerName: 'Meta WhatsApp Business API',
        status: 'OPERATIONAL',
        sentTodayCount: 3200,
        deliverySuccessRate: 99.1
      }
    ];

    this.partners = [
      {
        id: 'part-01',
        name: 'UTB (Union des Transports de Bouaké)',
        category: 'TRANSPORT_AGENCY',
        contractStatus: 'ACTIVE',
        apiKey: 'ivx_live_utb_893201',
        slaTargetPercent: 99.9,
        monthlyVolumeFCFA: 18500000,
        joinedDate: '2025-01-15'
      },
      {
        id: 'part-02',
        name: 'Hôtel Ivoire Sofitel Abidjan',
        category: 'HOTEL_CHAIN',
        contractStatus: 'ACTIVE',
        apiKey: 'ivx_live_sofitel_9011',
        slaTargetPercent: 99.95,
        monthlyVolumeFCFA: 14200000,
        joinedDate: '2025-02-01'
      },
      {
        id: 'part-03',
        name: 'Canal+ Overseas IPTV',
        category: 'IPTV_PROVIDER',
        contractStatus: 'ACTIVE',
        apiKey: 'ivx_live_canal_33019',
        slaTargetPercent: 99.8,
        monthlyVolumeFCFA: 6500000,
        joinedDate: '2025-03-10'
      }
    ];

    this.serviceCatalog = [
      {
        id: 'srv-01',
        serviceName: 'TransportBookingService',
        module: 'TRANSPORT',
        version: 'v2.4.0',
        ownerTeam: 'Core Transport Team',
        status: 'ONLINE',
        slaUptimePercent: 99.98,
        dependenciesCount: 4
      },
      {
        id: 'srv-02',
        serviceName: 'HotelReservationService',
        module: 'HOTEL',
        version: 'v2.1.2',
        ownerTeam: 'Hospitality Team',
        status: 'ONLINE',
        slaUptimePercent: 99.95,
        dependenciesCount: 3
      },
      {
        id: 'srv-03',
        serviceName: 'VisionAIAnalysisService',
        module: 'VISION_AI',
        version: 'v1.8.0',
        ownerTeam: 'AI & Safety Team',
        status: 'ONLINE',
        slaUptimePercent: 99.90,
        dependenciesCount: 2
      },
      {
        id: 'srv-04',
        serviceName: 'IPTVStreamingGateway',
        module: 'IPTV',
        version: 'v1.5.0',
        ownerTeam: 'Media & Entertainment',
        status: 'ONLINE',
        slaUptimePercent: 99.92,
        dependenciesCount: 2
      },
      {
        id: 'srv-05',
        serviceName: 'UnifiedPaymentGateway',
        module: 'PAYMENT',
        version: 'v3.0.1',
        ownerTeam: 'Fintech Core',
        status: 'ONLINE',
        slaUptimePercent: 99.99,
        dependenciesCount: 5
      }
    ];

    this.publicApiEndpoints = [
      {
        id: 'api-01',
        path: '/api/v1/trips/search',
        method: 'GET',
        title: 'Recherche de Lignes & Horaires de Car',
        description: 'Permet aux agences et agrégateurs partenaires de consulter les départs et sièges disponibles.',
        requiredScope: 'read:trips',
        rateLimitPerMin: 300,
        sampleResponseJson: JSON.stringify({
          success: true,
          trips: [
            { id: 'trip-101', origin: 'Abidjan', destination: 'Yamoussoukro', departureTime: '08:00', priceFCFA: 5000, availableSeats: 18 }
          ]
        }, null, 2)
      },
      {
        id: 'api-02',
        path: '/api/v1/reservations/book',
        method: 'POST',
        title: 'Création Directe de Réservation Billet',
        description: 'Réservation et génération du billet QR sécurisé ED25519.',
        requiredScope: 'write:reservations',
        rateLimitPerMin: 120,
        sampleRequestJson: JSON.stringify({ tripId: 'trip-101', passengerName: 'Kouassi Marc', seatNumber: 12 }, null, 2),
        sampleResponseJson: JSON.stringify({
          success: true,
          reservationId: 'RES-99021',
          status: 'CONFIRMED',
          ticketQrUrl: getApiUrl('/api/tickets/RES-99021.png')
        }, null, 2)
      },
      {
        id: 'api-03',
        path: '/api/v1/hotels/availability',
        method: 'GET',
        title: 'Disponibilité des Chambres d’Hôtel',
        description: 'Interrogation en temps réel de l’état d’occupation du parc hôtelier.',
        requiredScope: 'read:hotels',
        rateLimitPerMin: 200,
        sampleResponseJson: JSON.stringify({
          hotelId: 'hotel-sofitel',
          availableRooms: 14,
          minPriceFCFA: 45000
        }, null, 2)
      }
    ];
  }
}
