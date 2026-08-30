# Volume 7 – Cahier des charges du Moteur de Workflows Métier Intelligent d'IVOIReXpress

## Vision Générale

Le **Moteur de Workflows Métier Intelligent** est le cœur décisionnel et opérationnel de la plateforme IVOIReXpress. Il orchestre de façon automatique, transactionnelle, sécurisée et traçable l'ensemble des chaînes de traitements entre les modules Transport, Hôtellerie, Vidéosurveillance, IPTV, Paiements, Notifications, AI Core, IAM et Audit.

Chaque action utilisateur déclenche un workflow composé d'étapes ordonnées avec gestion d'états (`PENDING`, `IN_PROGRESS`, `COMPLETED`, `FAILED`, `CANCELLED`), traçabilité étape par étape, et mécanismes de reprise ou d'annulation (rollback).

---

## 1. Principes Fondamentaux de l'Orchestrateur

1. **Orienté Événements (Event Driven)** : Déclenchement automatique suite aux événements du `DomainEventBus`.
2. **Transactionnel & Atomique** : Échecs contrôlés sans laisser de données dans un état incohérent.
3. **Traçabilité Totale** : Chaque exécution possède un `workflowId` unique, une horodatage certifié, et un historique d'étapes.
4. **Isolé & Multi-Tenant** : Respect des cloisons `agencyId` et `hotelId` avec supervision dédiée par profil.
5. **Supervision et Reprise** : Possibilité de relancer manuellement ou automatiquement une étape échouée.

---

## 2. Définition des 10 Workflows Métiers Orchestrés

### Workflow 1 – Réservation de billet de transport (12 Étapes)
1. Vérification de l'identité & habilitations du voyageur.
2. Vérification de la disponibilité du car et de la ligne.
3. Verrouillage temporaire du siège (ACID).
4. Calcul dynamique du tarif FCFA (réductions, frais & commission).
5. Création de la réservation provisoire.
6. Déclenchement de la transaction de paiement (Wave/Mobile Money/CB).
7. Confirmation ou annulation de la réservation selon la réponse du paiement.
8. Génération du Billet QR sécurisé signé ED25519.
9. Notification Push & SMS au voyageur.
10. Mise à jour du tableau de bord de l'Admin Agence.
11. Représentation statistique globale pour le Super Admin.
12. Enregistrement irréversible au journal d'audit.

### Workflow 2 – Réservation hôtelière (10 Étapes)
1. Vérification des disponibilités des chambres.
2. Verrouillage temporaire de la chambre.
3. Calcul du prix total du séjour FCFA.
4. Création du dossier de réservation hôtelière.
5. Déclenchement du paiement unifié.
6. Confirmation définitive du séjour.
7. Génération de la confirmation avec Pass QR.
8. Envoi d'une alerte à l'Admin Hôtel.
9. Mise à jour automatique du calendrier d'occupation des chambres.
10. Journalisation complète de l'opération dans l'audit.

### Workflow 3 – Création d'une agence (Auto-Provisioning Atomique)
- Création de la fiche Agence.
- Génération automatique du compte `Admin Agence`.
- Attribution du rôle RBAC `ADMIN_AGENCY` et des permissions.
- Initialisation des paramètres par défaut et flotte.
- Génération du tableau de bord de l'agence.
- Émission de l'événement `AgenceCreated` & écriture au journal d'audit.

### Workflow 4 – Création d'un hôtel (Auto-Provisioning Atomique)
- Création de la fiche Établissement Hôtelier.
- Génération automatique du compte `Admin Hôtel`.
- Attribution du rôle RBAC `ADMIN_HOTEL` et des privilèges.
- Initialisation de la grille tarifaire et des chambres.
- Activation de la console de gestion hôtelière.
- Émission de l'événement `HotelCreated` & inscription dans l'audit.

### Workflow 5 – Moteur de Paiements Unifié
- Validation & contrôle de fraude.
- Refus avec message explicite.
- Gestion des remboursements automatiques en cas d'annulation.
- Émission du reçu financier PDF.
- Recalcul des commissions de la plateforme national.
- Écriture des pièces comptables d'audit.

### Workflow 6 – Vidéosurveillance & Vision IA
- Capture de l'événement par caméra embarquée/gare.
- Lancement de l'analyse comportementale (Fatigue, Somnolence, Intrusion).
- Classification du niveau de gravité (`INFO`, `WARNING`, `CRITICAL`).
- Diffusion de la notification d'urgence aux opérateurs.
- Stockage sécurisé de la séquence vidéo sur Blob Storage.
- Enregistrement des métadonnées et horodatage dans la BDD.

### Workflow 7 – IPTV & Expérience Client
- Vérification du statut de la réservation chambre.
- Activation automatique des droits IPTV (Bouquet VIP).
- Mise à jour du profil de la chambre connectée.
- Envoi du guide EPG et message de bienvenue.

### Workflow 8 – Centre Centralisé de Notifications
- Routage automatique selon la préférence du destinataire (Push App, SMS, Email, Message Interne).
- Garanties de délivrabilité.

### Workflow 9 – AI Core Orchestrator
- Assistance conversationnelle voyageur & administrateur.
- Détection d'anomalies de réservation ou de fraude.
- Recommandation d'optimisation de lignes de transport.
- *Garantie de Sécurité* : L'IA ne modifie jamais directement les données critiques sans approbation humaine expresse.

### Workflow 10 – Centre de Supervision et Reprise après Incident
- Visualisation en temps réel de tous les workflows (`PENDING`, `IN_PROGRESS`, `COMPLETED`, `FAILED`).
- Historique d'exécution étape par étape.
- Action de Relance / Reprise manuelle ou automatique.

---

## 3. Centre de Supervision Multi-Tenant

- **Super Admin** : Supervision nationale globale de 100% des workflows exécutés avec filtres par statut, temps d'exécution, et agences/hôtels.
- **Admin Agence** : Filtrage strict sur les workflows transport de son agence (`agencyId`).
- **Admin Hôtel** : Filtrage strict sur les workflows réservations et IPTV de son établissement (`hotelId`).
