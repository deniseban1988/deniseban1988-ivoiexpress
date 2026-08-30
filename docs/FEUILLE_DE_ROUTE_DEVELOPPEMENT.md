# Feuille de route – Étape suivante après l'intégration de Firebase

## Vision Générale

Après la définition de l'architecture hexagonale et l'intégration de Firebase sous forme de service découplé (Backend-as-a-Service), le développement de la plateforme IVOIReXpress s'exécute selon une **feuille de route en 6 phases séquentielles**. Chaque étape est validée de manière étanche avant d'entamer la suivante.

---

## Phase 1 – Finalisation et Validation des Modèles de Données

Documenter, typer et valider les modèles de données de l'ensemble des 12 domaines applicatifs :

1. **Authentification & Identités** (`UserAccount`, `AuthSession`, `TokenPayload`)
2. **Gestion des Utilisateurs** (`UserProfile`, `UserStatus`)
3. **Rôles et Permissions (RBAC)** (`RoleHierarchy`, `PermissionSet`)
4. **Transport** (`BusTrip`, `TicketBooking`, `TransportAgency`, `Vehicle`, `Driver`)
5. **Hôtellerie** (`Hotel`, `Room`, `HotelReservation`, `HotelAdmin`)
6. **Vidéosurveillance (Vision IA)** (`Camera`, `AIEvent`, `AlertSeverity`, `RTSPStream`)
7. **IPTV** (`Channel`, `TVBouquet`, `VODContent`, `EPGProgram`)
8. **Paiements** (`PaymentTransaction`, `PaymentMethod`, `FinancialAudit`)
9. **Notifications** (`SystemNotification`, `PushToken`, `SMSLog`)
10. **Journalisation (Audit)** (`AuditLog`, `ActionType`, `SecurityContext`)
11. **Paramètres Système** (`SystemConfig`, `TenantSettings`)

---

## Phase 2 – Gestion des Identités et des Accès (IAM & Guichet Unifié)

- **Portail de connexion unique** : Un guichet d'authentification centralisé pour tous les profils (Super Admin, Admin Agence, Admin Hôtel, Voyageur, Chauffeur).
- **Acheminement automatique par rôle** : Redirection dynamique vers la console d'administration correspondant au niveau d'habilitation :
  - `SUPERADMIN` ➔ Console Nationale
  - `ADMIN_AGENCY` ➔ Dashboard Compagnie de Transport
  - `ADMIN_HOTEL` ➔ Dashboard Établissement Hôtelier
  - `VOYAGEUR` / `DRIVER` ➔ Interface Billet QR & Suivi
- **Évaluation dynamique des permissions RBAC** à la couche UseCase applicative.

---

## Phase 3 – Automatisation des Créations (Workflows Transactionnels)

Afin d'éviter toute incohérence de données ou compte orphelin, les créations d'établissements s'exécutent en une **transaction atomique unique** (Cloud Functions / Adaptateur DB) :

### A. Workflow Création d'Agence
1. Insertion de la fiche Agence (`agencyId`)
2. Génération automatique du compte `Admin Agence`
3. Attribution du rôle `ADMIN_AGENCY` et des permissions associées
4. Rattachement direct du compte au `agencyId`
5. Initialisation de la flotte et des paramètres par défaut
6. Activation immédiate de la compagnie

### B. Workflow Création d'Hôtel
1. Insertion de la fiche Établissement (`hotelId`)
2. Génération automatique du compte `Admin Hôtel`
3. Attribution du rôle `ADMIN_HOTEL` et des permissions associées
4. Rattachement direct du compte au `hotelId`
5. Initialisation des chambres, catégories et équipements par défaut
6. Activation immédiate de l'établissement

---

## Phase 4 – Sécurité & Hardening

Avant toute extension fonctionnelle :
- **Règles Firestore (`firestore.rules`)** : Isolation étanche multi-tenant.
- **Vérification RBAC Côté Serveur** : Contrôle systématique des requêtes.
- **Chiffrement des Données Sensibles** & Sanitization des formulaires.
- **Journal d'Audit Immuable** (`audit_logs`) traçant chaque modification privilégiée.
- **Stratégie de Sauvegarde Automatique & Plan de Restauration Testé**.

---

## Phase 5 – Développement Séquentiel des Modules Métiers

Chaque module est finalisé, testé et validé à 100% avant d'aborder le suivant :

1. **Module Transport** : Lignes, gares, autocar, sièges transactionnels anti-surréservation, e-billets QR signés ED25519.
2. **Module Hôtellerie** : Réservations de nuitées, catégories VIP, gestion de disponibilités et check-in/out.
3. **Module Vidéosurveillance (Vision IA)** : Caméras RTSP, détection d'incidents, alertes d'inattention et enregistrements sécurisés.
4. **Module IPTV** : Guide EPG, chaînes locales & internationales, bouquet VOD.

---

## Phase 6 – Tests d'Intégration Globale & Performance

- **Inter-Communication Inter-Modules** (Réservation Transport + Notification Push + Transaction Financière Unifiée + Journal d'Audit).
- **Tests de Charge** : Support de milliers de requêtes simultanées en gardant un temps de réponse < 50ms sur les endpoints indexés.
- **Validation des Workflows de bout en bout** (Voyageur ➔ Paiement Wave ➔ Validation QR Chauffeur ➔ Statistiques Super Admin).
