# API Reference — KATASHIE BOT

Base URL : `http://votre-domaine.com/api`

## Authentification

Toutes les routes protégées nécessitent le header :
```
Authorization: Bearer <access_token>
```

---

## Auth

### POST /auth/register
Créer un compte.
```json
{ "username": "john", "email": "john@ex.com", "password": "Password123" }
```
**Réponse** : `{ user, accessToken, refreshToken }`

### POST /auth/login
Se connecter.
```json
{ "email": "john@ex.com", "password": "Password123" }
```
**Réponse** : `{ user, accessToken, refreshToken }`

### POST /auth/refresh
Renouveler les tokens.
```json
{ "refreshToken": "..." }
```

### GET /auth/me
Profil de l'utilisateur connecté. *(Auth requise)*

### POST /auth/forgot-password
Demande de réinitialisation.
```json
{ "email": "john@ex.com" }
```

### POST /auth/reset-password
Réinitialiser avec le token.
```json
{ "token": "...", "password": "NewPassword123" }
```

### PUT /auth/change-password *(Auth)*
```json
{ "currentPassword": "...", "newPassword": "..." }
```

### PUT /auth/profile *(Auth)*
```json
{ "username": "nouveau_nom" }
```

---

## Serveurs

### GET /servers *(Auth)*
Liste des serveurs de l'utilisateur.

### POST /servers/calculate *(Auth)*
Calculer le coût avant création.
```json
{ "ram": 512, "cpu": 50, "disk": 1024, "maxSessions": 1, "durationDays": 14 }
```
**Réponse** : `{ cost: 15, canAfford: true }`

### POST /servers *(Auth)*
Créer un serveur.
```json
{
  "name": "Mon Bot",
  "ram": 512, "cpu": 50, "disk": 1024,
  "maxSessions": 1, "durationDays": 14,
  "gitRepo": "https://github.com/...",
  "gitBranch": "main", "mainFile": "index.js"
}
```

### POST /servers/:id/start *(Auth)*
Démarrer un serveur.

### POST /servers/:id/stop *(Auth)*
Arrêter un serveur.

### POST /servers/:id/restart *(Auth)*
Redémarrer un serveur.

### DELETE /servers/:id *(Auth)*
Supprimer un serveur.

### GET /servers/:id/logs *(Auth)*
Logs du bot.

### PUT /servers/:id/env *(Auth)*
```json
{ "envVars": { "BOT_NAME": "MonBot", "PREFIX": "!" } }
```

### GET /servers/:id/qr *(Auth)*
QR Code WhatsApp.

---

## Crédits

### GET /credits/packs
Packs disponibles (public).

### GET /credits/balance *(Auth)*
Solde actuel.

### GET /credits/history *(Auth)*
Historique des transactions.

### POST /credits/request/:packId *(Auth)*
Créer une demande de paiement. Retourne un lien WhatsApp pré-rempli.

### GET /credits/requests *(Auth)*
Historique des demandes de paiement.

---

## Admin *(Auth + Rôle admin)*

### GET /admin/stats
Statistiques globales.

### GET /admin/users?page=1&search=
Liste des utilisateurs.

### GET /admin/users/:id
Détail d'un utilisateur.

### POST /admin/users/:id/credits
```json
{ "amount": 30, "reason": "Paiement validé" }
```
Montant positif = ajout, négatif = retrait.

### POST /admin/users/:id/toggle
Activer/désactiver un compte.

### GET /admin/payments?status=pending
Liste des paiements.

### POST /admin/payments/:id/validate
Valider un paiement et ajouter les crédits.

### POST /admin/payments/:id/reject
```json
{ "reason": "Paiement non reçu" }
```

### GET /admin/packs / POST / PUT /:id / DELETE /:id
Gestion des packs.

### GET /admin/logs
Journaux système.

### POST /admin/notifications
```json
{ "title": "Titre", "message": "...", "type": "info" }
```

### POST /admin/announcements
```json
{ "title": "Titre", "content": "...", "type": "success" }
```

---

## Codes de statut

| Code | Description |
|------|-------------|
| 200  | Succès |
| 201  | Créé avec succès |
| 400  | Données invalides |
| 401  | Non authentifié |
| 402  | Crédits insuffisants |
| 403  | Accès refusé |
| 404  | Ressource introuvable |
| 409  | Conflit (doublon) |
| 429  | Trop de requêtes |
| 500  | Erreur interne |
