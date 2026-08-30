# Cahier de recommandations – Architecture de la base de données d'IVOIReXpress

## Vision générale

Après la refonte complète de l'architecture d'IVOIReXpress, la base de données est conçue comme le socle stratégique de la plateforme. Elle ne doit pas être un simple espace de stockage, mais une infrastructure robuste, modulaire, hautement sécurisée, évolutive et indépendante de toute technologie spécifique.

L'objectif est de construire une architecture capable d'accompagner durablement le développement des modules Transport, Hôtellerie, Vidéosurveillance, IPTV, Paiements, Intelligence Artificielle et des futurs services, tout en garantissant des performances élevées et une maintenance simplifiée.

---

## 1. Séparation stricte des logiques métiers

La base de données respecte exactement la séparation des logiques métiers mise en place lors du développement.

Chaque domaine fonctionnel dispose de ses propres modèles de données, de ses propres services, de ses propres règles métier et de ses propres mécanismes de sécurité.

Les principaux domaines sont :
1. **Authentification et gestion des identités**
2. **Gestion des utilisateurs**
3. **Gestion des rôles et permissions (RBAC)**
4. **Transport**
5. **Hôtellerie**
6. **Vidéosurveillance (Vision IA)**
7. **IPTV**
8. **Paiements**
9. **Notifications**
10. **Intelligence Artificielle (AI Core)**
11. **Journalisation (Audit)**
12. **Paramètres système**

Aucun module ne devra accéder directement aux données internes d'un autre module. Toute communication passe par des services et des repositories clairement définis afin de limiter les dépendances et de préserver l'intégrité de l'architecture.

---

## 2. Architecture modulaire

Chaque module est totalement indépendant et possède :
- ses propres modèles de données (interfaces & entités) ;
- ses propres services (use cases) ;
- ses propres règles métier (domain functions) ;
- ses propres validations (schema validators) ;
- ses propres contrôleurs / ports ;
- ses propres paramètres.

L'ajout, la modification ou la suppression d'un module ne perturbe jamais le fonctionnement des autres modules.

---

## 3. Base de données multi-tenant

La plateforme fonctionne en mode **multi-tenant** :
- Chaque agence de transport est strictement isolée (`agencyId`).
- Chaque hôtel est strictement isolé (`hotelId`).
- Chaque utilisateur ne peut accéder qu'aux données correspondant à son périmètre d'autorisation.
- Le Super Admin conserve une vision globale et transversale de l'ensemble de la plateforme.

---

## 4. Couche d'abstraction des données (DAL / Repository Pattern)

Les modules métiers ne communiquent **jamais** directement avec le moteur physique de la base de données.

Une couche d'abstraction (*Repository / Data Access Layer*) est seule responsable :
- des lectures ;
- des écritures ;
- des mises à jour ;
- des suppressions ;
- des transactions atomiques ;
- des recherches et filtres multi-critères.

Cette architecture permet de remplacer ou faire évoluer le moteur de base de données sans modifier la logique métier applicative.

---

## 5. Indépendance vis-à-vis du fournisseur (Agnosticisme SGBD)

La plateforme est conçue pour être 100% agnostique vis-à-vis du SGBD sous-jacent. Elle peut s'exécuter indifféremment sur :
- **Firebase Firestore**
- **PostgreSQL / CockroachDB**
- **MySQL / MariaDB**
- **Supabase**
- **Cloud SQL**
- **MongoDB**
- **Azure SQL / Amazon RDS**

La logique métier reste strictement neutre. Une migration technique ne nécessite que la substitution des adaptateurs de la couche d'accès aux données.

---

## 6. Gestion des utilisateurs et des rôles (RBAC Hiérarchique)

Gestion centralisée des utilisateurs avec un système RBAC hiérarchique et granulaire.

Profils et rôles pris en charge :
- **Super Admin** : Contrôle global de la plateforme nationale.
- **Admin Agence** : Gestionnaire d'une compagnie de transport (UTB, STT, CTE, etc.).
- **Admin Hôtel** : Gestionnaire d'un établissement hôtelier (Sofitel, etc.).
- **Agent de comptoir** : Vente de billets en gare et guichet physique.
- **Chauffeur / Conducteur VIP** : Contrôle d'accès à bord, scan QR billets, suivi d'itinéraire.
- **Voyageur** : Client final grand public.
- **Technicien** : Maintenance des caméras, capteurs et boîtiers IPTV.
- **Support** : Assistance client et traitement des litiges.
- **Partenaire** : Acteurs tiers interconnectés.

---

## 7. Module Transport

Structures de données dédiées :
- `agencies` (Agences & compagnies)
- `regions`, `cities`, `stations` (Maillage territorial & gares)
- `vehicles` (Flotte de car VIP & mini-bus)
- `drivers` (Chauffeurs qualifiés)
- `routes` & `schedules` (Lignes, trajets & horaires)
- `seats` (Disposition & états des sièges)
- `reservations` & `tickets` (Billets QR sécurisés)
- `payments` (Transactions associées)
- `histories` (Historique d'exploitation)

*Note technique* : Le verrouillage des sièges est strictement **transactionnel** afin d'empêcher toute double réservation simultanée.

---

## 8. Module Hôtellerie

Structures de données dédiées :
- `hotels` (Établissements)
- `categories` & `rooms` (Types de chambres, capacités & commodités)
- `galleries` (Photos & médias)
- `amenities` (Équipements)
- `availabilities` & `pricing` (Tarification dynamique)
- `reservations` (Réservations de séjours)
- `check_ins` & `check_outs` (Flux clients)
- `reviews` (Avis certifiés)

### Auto-provisioning transactionnel automatique :
Lorsqu'un hôtel est créé par le Super Admin, le système exécute dans une **transaction unique** :
1. La création de la fiche établissement ;
2. La génération du compte `Admin Hôtel` ;
3. L'attribution du rôle et des permissions RBAC ;
4. Le rattachement direct de l'admin à l'hôtel (`hotelId`) ;
5. L'initialisation des paramètres par défaut ;
6. L'activation immédiate de l'établissement.

*Même principe pour la création d'une agence de transport* (Création de l'agence + compte `Admin Agence` + permissions + activation en 1 transaction atomique).

---

## 9. Module Vidéosurveillance (Vision IA)

Structures indépendantes pour :
- `cameras` (Caméras embarquées & gares, protocoles RTSP/ONVIF)
- `camera_groups` (Secteurs & flottes)
- `events` & `ai_alerts` (Détection de fatigue, intrusion, objets oubliés)
- `configurations` & `permissions`
- `recordings` (Métadonnées de stockage)

*Note de sécurité* : Les flux vidéos et enregistrements lourds sont stockés sur un espace binaire sécurisé (Blob Storage / S3 / Bucket) ; la BDD conserve uniquement les références URL sécurisées et signées.

---

## 10. Module IPTV

Structures spécifiques pour :
- `channels` (Chaînes télévisées en direct)
- `categories` & `bouquets` (Thématiques)
- `programs` (Guide EPG)
- `vod_content` (Films, séries, documentaires Ivoiriens & régionaux)
- `favorites` & `playback_history` (Préférences utilisateur)

---

## 11. Moteur de Paiement Unique Partagé

Moteur de paiement centralisé partagé par l'ensemble des modules :
- Réservations de transport (Tickets autocar)
- Réservations hôtelières (Nuitées & suites)
- Abonnements & recharges IPTV
- Services annexes & futurs modules

Toutes les transactions financières sont immuables, historisées et auditables (Horodatage, Montant FCFA, Référence Wave/MTN/Orange/Moov/CB, Token de confirmation).

---

## 12. Journalisation (Audit Immuable)

Registre d'audit centralisé enregistrant de manière traçable :
- Connexions & déconnexions
- Créations, modifications & suppressions d'entités
- Réservations & paiements
- Création d'agences et d'hôtels
- Modifications de rôles et privilèges RBAC

Chaque événement enregistre : `timestamp`, `userId`, `userRole`, `actionType`, `targetEntity`, `ipAddress`, `status`.

---

## 13. Sécurité By-Design

- Authentification fortifiée avec jetons de session sécurisés ;
- Contrôle d'accès granulaire (RBAC) vérifié à la couche UseCase ;
- Chiffrement des données sensibles (mots de passe, tokens, numéros de téléphone) ;
- Validation stricte côté client et côté serveur (Data Sanitization) ;
- Protection contre les injections SQL/NoSQL et CSRF ;
- Rate-limiting (Limitation des tentatives de connexion) ;
- Procédures automatisées de sauvegarde et restauration rapide.

---

## 14. Performances & Haute Disponibilité

- Optimisation pour plusieurs milliers d'utilisateurs simultanés ;
- Temps de réponse en lecture < 50ms grâce aux index stratégiques (`tenantId`, `status`, `createdAt`) ;
- Opérations d'écriture gérées de manière ACID / Transactionnelle ;
- Pagination systématique des grands ensembles de données (`cursor-based` ou `offset`) ;
- Synchronisation temps réel (WebSockets / Firestore Listeners) réservée aux données critiques (Alertes Vision IA, disponibilité des sièges car).

---

## 15. Évolutivité & Migration

- Extension modulaire sans régression sur les modules existants ;
- Dictionnaire de données et schéma type documenté ;
- Conventions de nommage homogènes (`snake_case` ou `camelCase` selon couche) ;
- Scripts d'exportation/importation de données (JSON / SQL Dumps) ;
- Procédures de migration testées et réversibles sans interruption de service.
