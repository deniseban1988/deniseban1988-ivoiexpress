/**
 * DÉCLARATION DES ÉVÉNEMENTS DU DOMAINE IVOIReXpress
 * Permet un couplage lâche (Event-Driven Architecture) entre les 12 modules applicatifs.
 */

export type DomainEventType =
  | 'AgenceCreated'
  | 'HotelCreated'
  | 'HotelUpdated'
  | 'TripCreated'
  | 'TripCancelled'
  | 'ReservationCreated'
  | 'ReservationConfirmed'
  | 'ReservationCancelled'
  | 'PaymentCompleted'
  | 'PaymentFailed'
  | 'CameraAlertDetected'
  | 'IPTVSubscriptionActivated'
  | 'UserCreated'
  | 'UserRoleChanged';

export interface IDomainEvent<T = any> {
  id: string;
  type: DomainEventType;
  timestamp: string;
  correlationId?: string;
  tenantId?: string;
  emitterModule: 'AUTH' | 'USERS' | 'TRANSPORT' | 'HOTEL' | 'VISION' | 'IPTV' | 'PAYMENT' | 'NOTIFICATION' | 'AICORE' | 'AUDIT';
  payload: T;
}

export type EventHandler<T = any> = (event: IDomainEvent<T>) => Promise<void> | void;

/**
 * BUS D'ÉVÉNEMENTS INTERNES (Event Bus Pattern / Mediator)
 * Garantit qu'aucun module n'appelle un autre module directement.
 */
export class DomainEventBus {
  private static instance: DomainEventBus;
  private handlers: Map<DomainEventType, EventHandler[]> = new Map();
  private eventHistory: IDomainEvent[] = [];

  private constructor() {}

  public static getInstance(): DomainEventBus {
    if (!DomainEventBus.instance) {
      DomainEventBus.instance = new DomainEventBus();
    }
    return DomainEventBus.instance;
  }

  /**
   * Enregistre un écouteur d'événement pour un module récepteur.
   */
  public subscribe<T = any>(eventType: DomainEventType, handler: EventHandler<T>): () => void {
    if (!this.handlers.has(eventType)) {
      this.handlers.set(eventType, []);
    }
    this.handlers.get(eventType)!.push(handler);

    // Fonction de désinscription (cleanup)
    return () => {
      const list = this.handlers.get(eventType);
      if (list) {
        this.handlers.set(eventType, list.filter(h => h !== handler));
      }
    };
  }

  /**
   * Publie un événement vers tous les modules abonnés.
   * L'émission est asynchrone pour ne jamais bloquer l'émetteur.
   */
  public async publish<T = any>(event: Omit<IDomainEvent<T>, 'id' | 'timestamp'>): Promise<IDomainEvent<T>> {
    const fullEvent: IDomainEvent<T> = {
      ...event,
      id: `evt-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      timestamp: new Date().toISOString()
    };

    this.eventHistory.unshift(fullEvent);
    if (this.eventHistory.length > 100) {
      this.eventHistory.pop();
    }

    const listeners = this.handlers.get(event.type) || [];
    
    // Exécution découplée des handlers sans bloquer le thread principal
    Promise.all(
      listeners.map(handler => 
        Promise.resolve().then(() => handler(fullEvent)).catch(err => {
          console.error(`[EventBus] Erreur lors du traitement de ${event.type} :`, err);
        })
      )
    );

    return fullEvent;
  }

  public getHistory(): IDomainEvent[] {
    return [...this.eventHistory];
  }

  public clearHistory(): void {
    this.eventHistory = [];
  }
}
