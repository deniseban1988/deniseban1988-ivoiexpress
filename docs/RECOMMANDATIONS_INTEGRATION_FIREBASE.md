# Recommandation – Intégration de Firebase dans l'Architecture Hexagonale d'IVOIReXpress

## Vision Générale

Firebase est intégré à la plateforme IVOIReXpress en tant que **fournisseur de services externe (Backend-as-a-Service - BaaS)** et non comme le cœur monolithique de l'application. 

La logique métier applicative (Domain & Use Cases) ne dépend **jamais directement** de l'API Firebase ou du SDK Firestore. Toute communication s'effectue à travers la couche de ports et d'adaptateurs de l'Architecture Hexagonale (Repository Pattern / Data Access Layer).

---

## 1. Respect de l'Architecture Modulaire

Chaque module métier conserve sa propre autonomie et ses propres règles d'isolation :
- Authentification & Identités
- Gestion des Utilisateurs
- Contrôle d'Accès & Rôles (RBAC Hiérarchique)
- Module Transport (Gares, Lignes, Sièges transactionnels)
- Module Hôtellerie (Établissements, Chambres, Tarifs)
- Module Vidéosurveillance (Vision IA & Flux RTSP)
- Module IPTV (Chaînes, Bouquet, EPG, VOD)
- Moteur de Paiement Unifié (Wave, Mobile Money, CB)
- Centre de Notifications (FCM / Push / SMS)
- Orchestrateur IA (AI Core Gemini 3.6 Flash)
- Registre d'Audit & Journalisation
- Paramètres Système & Multi-tenant

Aucun composant React UI ou UseCase applicatif n'effectue d'appels direct aux SDKs `@firebase/*` ou `firebase-admin`. Tout passe par les Interfaces Ports (`IAuthRepository`, `ITransportRepository`, `IHotelRepository`, `IAuditLoggerPort`).

---

## 2. Architecture de l'Adaptateur Firebase (Firebase Repository Adapter)

Un ensemble d'adaptateurs Firebase dédiés est implémenté dans la couche Infrastructure (`/src/core/infrastructure/adapters/`) :

- **`FirebaseAuthAdapter`** : Gestion de l'authentification (Connexion, Inscription, Session, Tokens JWT).
- **`FirestoreRepositoryAdapter`** : Opérations de données Firestore (Lectures, Écritures transactionnelles, Indexation multi-tenant).
- **`FirebaseStorageAdapter`** : Métadonnées et stockage binaire d'images/médias avec URLs sécurisées temporaires.
- **`FirebaseFunctionsAdapter`** : Exécution des triggers d'auto-provisioning transactionnel.
- **`FirebaseFcmAdapter`** : Envoi de notifications push en temps réel.
- **`FirebaseAnalyticsAdapter`** : Télémétrie d'utilisation anonymisée.

---

## 3. Répartition des Services Firebase

### A. Firebase Authentication
- Authentification des comptes (Voyageurs, Admins, Chauffeurs).
- Vérification des jetons ID (Claims personnalisés pour les rôles RBAC).
- Réinitialisation et protection des sessions.

### B. Cloud Firestore
- Stockage document-orienté multi-tenant (`agencies/{agencyId}`, `hotels/{hotelId}`).
- Indexation multi-critères.
- Verrouillage transactionnel pour les réservations de sièges autocar et chambres.

### C. Cloud Storage
- Hébergement des médias (Photos des hôtels, galeries, avatars, pièces justificatives).
- Les vidéos lourdes de vidéosurveillance restent sur serveur binaire dédié ; Firestore conserve uniquement les références URL signées.

### D. Cloud Functions (Triggers Transactionnels)
- **Auto-Provisioning Agence** : Création Agence + Compte `Admin Agence` + Attribution RBAC + Activation.
- **Auto-Provisioning Hôtel** : Création Établissement + Compte `Admin Hôtel` + Attribution RBAC + Activation.
- Webhooks de paiement Wave / Mobile Money et alertes IA Vision en temps réel.

### E. Firebase Cloud Messaging (FCM)
- Diffusion des notifications push temps réel (mises à jour de trajets, rappels de réservation, alertes de sécurité IA).

---

## 4. Sécurité & Contrôle d'Accès

- **Règles Firestore (`firestore.rules`)** : Contrôle d'accès basé sur les rôles (`request.auth.token.role`) et l'appartenance au tenant (`request.auth.token.agencyId` ou `request.auth.token.hotelId`).
- **Validation Strict Côté Serveur** : Les Cloud Functions valident chaque payload avant mutation.
- **Audit Logging Immuable** : Traçabilité complète enregistrée dans la collection `audit_logs`.

---

## 5. Migration et Agnosticisme Garanti

Grâce au Repository Pattern :
1. Les modèles métier (`/src/core/domain/`) restent 100% neutres.
2. Les cas d'usage (`/src/core/application/`) restent 100% neutres.
3. Les vues UI (`/src/components/`) restent 100% neutres.
4. Pour remplacer Firebase par PostgreSQL, Cloud SQL ou Supabase, il suffit de remplacer la classe d'instanciation de l'adaptateur dans la configuration du Container d'Injection de Dépendances.

---

## 6. Liste de Contrôle pour la Mise en Production

- [x] Tous les modules utilisent la couche d'abstraction (Repository / Ports).
- [x] Aucun appel direct aux SDKs Firebase dans les composants UI.
- [x] Règles de sécurité Firestore configurées avec RBAC et Multi-tenant.
- [x] Auto-provisioning transactionnel géré sans faille.
- [x] Tests de migration SGBD simulés et validés.
