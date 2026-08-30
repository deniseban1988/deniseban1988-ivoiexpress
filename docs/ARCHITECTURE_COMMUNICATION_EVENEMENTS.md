# Architecture de Communication inter-modules – IVOIReXpress

## Vision Générale

Pour préserver l'indépendance stricte des 12 modules applicatifs (Transport, Hôtellerie, Vidéosurveillance, IPTV, Paiements, Notifications, AI Core, Auth, Audit, etc.), **aucun module n'appelle directement un autre module**.

Toute communication transversale s'effectue via :
1. **Un Bus d'Événements Internes (`DomainEventBus`)** fonctionnant en mode Publish/Subscribe asynchrone ;
2. **Une Couche de Services (`Service Layer`)** encapsulant les orchestration complexes.

---

## 1. Principes Directeurs

- **Autonomie Absolue** : Le module Transport ne sait pas comment le module Notification délivre un SMS, ni comment le module Audit stocke ses logs.
- **Découplage Asynchrone** : La publication d'un événement (`DomainEventBus.getInstance().publish(...)`) ne bloque pas le UseCase émetteur.
- **Transversalité Sécurisée** : Chaque événement transporte son `tenantId`, son `correlationId` et son `timestamp` certifié.
- **Audit Logging Automatique** : Le module Journalisation s'abonne universellement à tous les événements majeurs pour assurer une traçabilité immuable.

---

## 2. Liste des Événements du Domaine

| Domaine Émetteur | Nom de l'Événement | Description & Effets Déclenchés |
| :--- | :--- | :--- |
| **Auth & Users** | `UserCreated` | Inscription utilisateur -> Envoi email/SMS de bienvenue + Log Audit |
| **Auth & Users** | `UserRoleChanged` | Escalade RBAC -> Mise à jour des claims JWT + Notification de sécurité |
| **Transport** | `AgenceCreated` | Création Agence -> Auto-provisioning du compte Admin Agence + Audit Log |
| **Transport** | `TripCreated` | Ouverture ligne de car -> Notification aux voyageurs abonnés à la ligne |
| **Transport** | `TripCancelled` | Annulation trajet -> Remboursement automatique Wave/Mobile Money + SMS d'alerte |
| **Transport** | `ReservationCreated` | Réservation siège -> Verrouillage temporaire du siège (ACID) |
| **Transport** | `ReservationConfirmed` | Confirmation Billet -> Génération Billet QR signée ED25519 + Notification |
| **Hôtellerie** | `HotelCreated` | Création Établissement -> Auto-provisioning du compte Admin Hôtel + Audit Log |
| **Hôtellerie** | `HotelUpdated` | Mise à jour tarifs/chambres -> Recalcul de la disponibilité en temps réel |
| **Vision IA** | `CameraAlertDetected` | Alerte fatigue / intrusion -> Notification Push urgence aux opérateurs + Log |
| **IPTV** | `IPTVSubscriptionActivated` | Activation Bouquet -> Déblocage des flux HLS/DASH + Reçu de paiement |
| **Paiements** | `PaymentCompleted` | Validation Transaction -> Émission reçu PDF, déblocage des services |
| **Paiements** | `PaymentFailed` | Échec Transaction -> Notification au voyageur + Libération du siège |

---

## 3. Exemple de Flux Découplé (Création d'Hôtel)

```
[SuperAdmin Dashboard]
       │
       ▼ (Exécute CreateHotelUseCase)
[HotelUseCases] ──► [Firestore / Postgres Repository] (Écriture Fiche Hôtel)
       │
       ▼ (Publie l'événement découplé)
[DomainEventBus.publish('HotelCreated')]
       ├───► [NotificationService] ──► SMS au nouveau gérant
       ├───► [AuthService]        ──► Gen. Compte Admin Hôtel + Rôle RBAC
       └───► [AuditService]       ──► Log "HotelCreated" avec Timestamp ISO
```

Aucun import du module `NotificationService` ou `AuthService` n'existe dans `HotelUseCases`. Tout passe par l'Event Bus.

---

## 4. Avantages Métier et Techniques

1. **Évolutivité Infos-Services** : L'ajout d'un module de Fidélité ou de Statistique ne nécessite que l'ajout de nouveaux subscribers sans toucher au code existant.
2. **Maintenance Sans Risque** : Un dysfonctionnement dans l'envoi de SMS n'empêche jamais la réservation d'un billet ou la création d'un hôtel.
3. **Traçabilité Totale** : Journalisation automatique de 100% des événements de la plateforme.
4. **Prêt pour Microservices / Event Sourcing** : L'architecture peut migrer vers RabbitMQ, Kafka ou GCP Pub/Sub sans modifier la logique applicative.
