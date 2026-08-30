# Volume 9 – Plateforme d'intégration et Écosystème d'IVOIReXpress

## Vision Générale

Le **Volume 9** définit la **Plateforme d'Intégration et l'Écosystème Numérique Ouvert** d'IVOIReXpress. Il permet à la plateforme de communiquer avec des partenaires externes, des connecteurs de paiement tierces, des fournisseurs de cartographie interchangeable, et des canaux de notification sans jamais modifier le cœur métier de l'application (Architecture Hexagonale & Event-Driven).

---

## 1. Couche d'Intégration Centralisée (Integration Gateway)

Aucun module métier (Transport, Hôtellerie, IPTV, Vision IA) n'effectue d'appels directs vers des serveurs externes. Toute communication passe par la **Couche d'Intégration Centralisée** qui gère :
- Authentification & Signatures Cryptographiques (ED25519 / HMAC-SHA256).
- Gestion des Webhooks entrants et sortants avec file d'attente (Retry logic).
- Transformation et normalisation des DTOs (Data Transfer Objects).
- Masquage des clés API et gestion des secrets via variables d'environnement Cloud Run.

---

## 2. Connecteurs de Paiement Plug-and-Play

Architecture modulaire permettant l'activation, la désactivation et le paramétrage indépendant de chaque moyen de paiement :
- **Wave Money** (Paiement instantané QR & DeepLink)
- **Orange Money Côte d'Ivoire** (USSD / Web Payment API)
- **MTN Mobile Money** (MoMo API v1.0)
- **Moov Money** (Flooz API)
- **Cartes Bancaires (VISA / Mastercard)**
- **Virements & Chèques Entreprises**

Chaque connecteur implémente l'interface commune `IPaymentConnector` garantissant une interchangeabilité totale.

---

## 3. Couche Cartographique & Géolocalisation Abstraite (`IMapProvider`)

Abonnement à une couche d'abstraction cartographique permettant de commuter à tout moment sans réécriture :
- **Google Maps Platform** (Calcul d'itinéraires précis, Geocoding)
- **OpenStreetMap / Leaflet** (Solution Open-Source auto-hébergée)
- **Mapbox Vector Tiles** (Cartographie personnalisée HD)

Fonctionnalités fournies : Localisation des gares/hôtels, suivi GPS temps réel des autocars sur autoroute du Nord, calcul de temps de trajet estimé (ETA).

---

## 4. Moteur de Notifications Multicanales

Orchestrateur central de diffusion gérant :
- **Notifications Push Mobile** (Firebase Cloud Messaging - FCM)
- **SMS Gateway** (Orange SMS / Twilio / Infobip pour la Côte d'Ivoire & sub-région)
- **E-mails Transactionnels** (SendGrid / SMTP avec modèles HTML signés)
- **Messagerie Interne** (Centre de notifications dans le tableau de bord)
- **WhatsApp Business API** (Confirmations de billet et alertes de départ)

---

## 5. Moteur de Génération Documentaire (`DocumentGeneratorEngine`)

Génération asynchrone et sécurisée de pièces justificatives :
- **Billets d'Autocar Numériques** avec QR Code unique ED25519.
- **Confirmations de Séjour Hôtelier** & Passe VIP Chambre.
- **Reçus Financiers & Factures Normalisées** conformes au droit des affaires OHADA.
- **Rapports d'Audit & Relevés de Performance** aux formats PDF, Excel (XLSX) et JSON.

---

## 6. Gestion des Partenaires & Catalogue de Services

- **Profils Partenaires** : Compagnies de transport partenaires, chaînes d'hôtels affiliées, prestataires IPTV & télécoms.
- **Registry & Catalogue de Services** : Registre central listant chaque micro-service avec son propriétaire, sa version (ex: `v1.4.0`), son SLA (Service Level Agreement) et son état de disponibilité en temps réel.

---

## 7. API Publiques & Portail Développeur (`OpenAPI v3`)

Exposition sécurisée d'endpoints REST / GraphQL pour les partenaires accrédités :
- Clés API (`x-api-key`) à périmètre restreint.
- Limiteur de débit (Rate Limiting : ex: 100 requêtes/min par partenaire).
- Sandbox & Environnement de Staging pour les tests tiers.

---

## 8. Évolutivité & Vision à Long Terme

L'architecture IVOIReXpress est prête pour l'intégration future de nouveaux domaines d'activité sans remise en cause des 8 volumes précédents :
- 🚚 **Logistique & Fret** (Transport de colis inter-villes).
- 🏖️ **Tourisme & Circuits Régionaux**.
- 🛡️ **Assurance Voyageur** (Couverture automatique à l'achat du billet).
- 🛒 **E-Commerce & Services Administratifs**.
