# Documentation de l'API Centrale IVOIReXpress (Web & APK)

Version: 1.0.0
Base URL: `https://ais-dev-pfq3lrxrzzfpeomdyuwybr-147511348837.europe-west3.run.app/api`

## Authentification

Toutes les requêtes (sauf `/health`) nécessitent un en-tête d'autorisation Bearer avec un **Firebase ID Token** valide.

```http
Authorization: Bearer <firebase_id_token>
```

## Format des Réponses Standard

Toutes les réponses de l'API suivent cette structure :

```json
{
  "success": true,
  "data": { ... },
  "error": null,
  "code": null,
  "timestamp": "2026-08-30T01:00:00Z"
}
```

## Endpoints Utilisateurs

### `GET /users/me`
Récupère le profil de l'utilisateur actuellement authentifié.

### `GET /users`
Liste les utilisateurs. Filtrable par `agencyId`, `role`, et `search`. Paginations supportée.
- **Permissions** : Super Admin ou Admin Agence (restreint à son agence).

### `PATCH /users/:uid`
Met à jour le profil d'un utilisateur.
- **Permissions** : Super Admin (tous champs) ou Utilisateur (champs limités).

## Endpoints Transport

### `GET /transport/trips`
Liste les voyages disponibles. Filtres : `departure`, `destination`, `date`.

### `POST /transport/seats/lock`
Verrouille un ou plusieurs sièges pour une durée déterminée.
- **Corps** : `{ "tripId": "...", "seatNumbers": [1, 2], "userId": "...", "durationSeconds": 600 }`

### `POST /transport/seats/unlock`
Libère des sièges verrouillés.

### `POST /transport/boarding/verify-qr`
Vérifie la validité d'un QR Code d'embarquement.
- **Permissions** : Super Admin ou Admin Agence.

## Endpoints Hôtellerie

### `GET /hotels`
Liste les établissements hôteliers partenaires.

### `GET /hotels/:hotelId/rooms`
Liste les chambres disponibles pour un hôtel spécifique.

## Endpoints IPTV & Vision

### `GET /iptv/channels`
Catalogue des chaînes IPTV avec pagination et filtrage par catégorie.

### `POST /ai/vision-analyze`
Analyse de flux vidéo par IA.
- **Permissions** : Super Admin, Admin Agence ou rôle Vision.

## Codes d'Erreurs Communs

- `UNAUTHENTICATED` : Token manquant ou invalide.
- `FORBIDDEN` : Rôle insuffisant pour cette opération.
- `NOT_FOUND` : Ressource inexistante.
- `INTERNAL_ERROR` : Erreur serveur.
