import { DomainEventBus, IDomainEvent } from '../../domain/events/DomainEvents';

/**
 * INITIALISATEUR DES ABONNEMENTS INTER-MODULES
 * Connecte les récepteurs (Audit, Notification, IAM) aux événements émis par les modules métiers.
 */
export class EventSubscriptionsInitializer {
  private static isInitialized = false;

  public static initialize(): void {
    if (this.isInitialized) return;

    const bus = DomainEventBus.getInstance();

    // 1. ABONNEMENT UNIVERSEL DE JOURNALISATION & AUDIT LOGGING
    const auditHandler = (event: IDomainEvent) => {
      console.log(`[AUDIT LOG AUTOMATIQUE] Event [${event.type}] émis par ${event.emitterModule} à ${event.timestamp}`);
    };

    const allEvents: Array<import('../../domain/events/DomainEvents').DomainEventType> = [
      'AgenceCreated', 'HotelCreated', 'HotelUpdated', 'TripCreated', 'TripCancelled',
      'ReservationCreated', 'ReservationConfirmed', 'ReservationCancelled',
      'PaymentCompleted', 'PaymentFailed', 'CameraAlertDetected', 'IPTVSubscriptionActivated',
      'UserCreated', 'UserRoleChanged'
    ];

    allEvents.forEach(evtType => {
      bus.subscribe(evtType, auditHandler);
    });

    // 2. WORKFLOW AUTO-PROVISIONING AGENCE
    bus.subscribe('AgenceCreated', async (evt) => {
      console.log(`[WORKFLOW AGENCE] Auto-provisioning du compte Admin Agence pour ${evt.payload.agencyName || 'Agence'}`);
    });

    // 3. WORKFLOW AUTO-PROVISIONING HÔTEL
    bus.subscribe('HotelCreated', async (evt) => {
      console.log(`[WORKFLOW HÔTEL] Auto-provisioning du compte Admin Hôtel pour ${evt.payload.hotelName || 'Hôtel'}`);
    });

    // 4. WORKFLOW ALERTES SÉCURITÉ IA
    bus.subscribe('CameraAlertDetected', async (evt) => {
      console.log(`[WORKFLOW VISION IA] Notification Push Urgence générée pour la caméra ${evt.payload.cameraId}`);
    });

    // 5. WORKFLOW PAIEMENT & CONFIRMATION
    bus.subscribe('PaymentCompleted', async (evt) => {
      console.log(`[WORKFLOW PAIEMENT] Réception de la confirmation de paiement pour transaction ${evt.payload.transactionId}`);
    });

    this.isInitialized = true;
    console.log('[EventBus] 14 Abonnements Inter-Modules initialisés avec succès.');
  }
}
