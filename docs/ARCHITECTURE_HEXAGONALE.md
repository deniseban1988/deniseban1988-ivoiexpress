# IVOIReXpress - Spécification d'Architecture Hexagonale (Ports & Adapters)

## 1. Introduction & Principes Directeurs
Pour la nouvelle génération d'**IVOIReXpress**, la plateforme adopte une **Architecture Hexagonale (Ports & Adapters)** conforme aux exigences de découplage strict, de maintenabilité et de sécurité de niveau financier.

Chaque module métier (**Transport**, **Hôtellerie**, **IVOIReXpress Vision**, **IPTV**, **Services Transversaux**, **AI Core**) est totalement autonome et structuré en 4 couches concentriques étanches.

---

## 2. Découpage en 4 Couches Concentriques

```
+-----------------------------------------------------------------------------------+
| 4. PRESENTATION LAYER (Voyageur, Admin Agence, Admin Hôtel, Super Admin UI)       |
|    - Standard React UI components                                                 |
|    - No business rules, no direct DB query                                        |
+-----------------------------------------------------------------------------------+
                                       |
                                       v  (Calls Input Ports)
+-----------------------------------------------------------------------------------+
| 2. APPLICATION LAYER (Use Cases)                                                  |
|    - TransportUseCases, HotelUseCases, VisionUseCases, IPTVUseCases               |
|    - Orchestrates business domain flow and transversal security                   |
+-----------------------------------------------------------------------------------+
                                       |
                                       v  (Applies Domain Entities & Rules)
+-----------------------------------------------------------------------------------+
| 1. DOMAIN LAYER (Pure Domain Rules - Zero External Dependencies)                   |
|    - TransportDomain, HotelDomain, VisionDomain, IPTVDomain, TransversalDomain    |
|    - Validation, seat calculation, encrypted signature, RBAC isolation            |
+-----------------------------------------------------------------------------------+
                                       ^
                                       |  (Implements Secondary Output Ports)
+-----------------------------------------------------------------------------------+
| 3. INFRASTRUCTURE LAYER (Adapters & External Systems)                             |
|    - Database / Local Storage Adapters                                            |
|    - Transversal Payment Hub (Wave, MTN, Orange, Moov, Card)                      |
|    - Multi-Channel Notification Dispatcher (Push, Email, SMS)                     |
|    - AI Core Orchestrator (Gemini 3.6 Flash)                                      |
+-----------------------------------------------------------------------------------+
```

### Couche 1 : Domaine Métier (Domain)
- **Localisation** : `/src/core/domain/`
- **Responsabilité** : Contient exclusivement les règles pures métier (calcul de tarifs, signatures numériques de billets, validation de capacité, matrice de permissions RBAC).
- **Invariants** : Aucune dépendance vers l'IHM, la base de données ou les SDKs tiers.

### Couche 2 : Application (Use Cases)
- **Localisation** : `/src/core/application/`
- **Responsabilité** : Contient les cas d'usage métiers (`reserveSeat`, `bookRoom`, `addNewCamera`, `processUnifiedPayment`).
- **Lien** : Fait l'interface entre la couche de présentation et la couche domaine sans altérer les règles fondamentales.

### Couche 3 : Infrastructure (Adapters)
- **Localisation** : `/src/core/infrastructure/`
- **Responsabilité** : Gère l'accès aux données physiques, la passerelle de paiement unifiée (Wave, MTN, Orange, Moov), le centre de notification multi-canal, le streaming RTSP/ONVIF et la journalisation immuable.

### Couche 4 : Présentation (Presentation)
- **Localisation** : `/src/components/`
- **Responsabilité** : Composants visuels React (Voyageur, Admin Agence, Admin Hôtel, Super Admin). Ne contient aucune logique métier directe : délègue à 100% aux Use Cases.

---

## 3. Séparation Stricte des Domaines Métier & Isolation des Données
1. **Module Transport** : Autonome. Aucune connaissance de l'Hôtellerie ou de l'IPTV.
2. **Module Hôtellerie** : Autonome. Gestion de la fréquentation et des chambres.
3. **Module IVOIReXpress Vision** : Service de vidéosurveillance IA autonome avec règles RTSP/ONVIF.
4. **Module IPTV** : Distribution vidéo/audio en direct et VOD hors-ligne.
5. **AI Core Orchestrator** : Interagit uniquement via les Ports Applicatifs officiels.
   - Ne contourne jamais le RBAC.
   - Demande la confirmation explicite (Human-in-the-Loop) pour les actions sensibles.

---

## 4. Sécurité & Gouvernance Financière
- **Contrôle d'accès granulaire (RBAC)** : Matrice d'autorisation évaluée sur chaque cas d'usage.
- **Journalisation d'audit immuable** : Toute transaction financière ou modification de sécurité est enregistrée dans le registre d'audit avec horodatage, utilisateur et IP.
- **Isolation d'entreprise** : Filtrage strict par `agencyId` et `hotelId`.
