# Configuration de KATASHIE BOT

## Fichier `.env`

Le fichier `.env` contient toutes les configurations de l'application.

### Application

| Variable | Description | Défaut |
|----------|-------------|--------|
| `NODE_ENV` | Environnement (`production`/`development`) | `production` |
| `PORT` | Port d'écoute du backend | `3000` |
| `APP_NAME` | Nom affiché de la plateforme | `KATASHIE BOT` |
| `APP_URL` | URL publique (avec https si SSL) | `http://localhost:3000` |

### Sécurité

| Variable | Description |
|----------|-------------|
| `JWT_SECRET` | Clé secrète JWT (min. 64 caractères) |
| `JWT_EXPIRES_IN` | Durée de validité des tokens (`7d`, `24h`) |
| `JWT_REFRESH_SECRET` | Clé secrète pour les refresh tokens |
| `JWT_REFRESH_EXPIRES_IN` | Durée des refresh tokens (`30d`) |
| `SESSION_SECRET` | Clé secrète des sessions |

> ⚠️ **Important** : Générez des clés aléatoires sécurisées :
> ```bash
> openssl rand -hex 64
> ```

### Administrateur

| Variable | Description |
|----------|-------------|
| `ADMIN_EMAIL` | Email du compte administrateur |
| `ADMIN_PASSWORD` | Mot de passe admin (créé au premier démarrage) |
| `ADMIN_USERNAME` | Nom d'utilisateur admin |
| `ADMIN_WHATSAPP` | Numéro WhatsApp pour recevoir les paiements |

### Base de données

| Variable | Description |
|----------|-------------|
| `DB_PATH` | Chemin vers la base SQLite | 

### Rate Limiting

| Variable | Description | Défaut |
|----------|-------------|--------|
| `RATE_LIMIT_WINDOW_MS` | Fenêtre de limitation (ms) | `900000` (15 min) |
| `RATE_LIMIT_MAX` | Requêtes max par fenêtre | `100` |
| `LOGIN_LIMIT_MAX` | Tentatives de connexion max | `5` |

### Crédits

| Variable | Description | Défaut |
|----------|-------------|--------|
| `MIN_CREDITS_FOR_SERVER` | Crédits minimum pour créer un serveur | `15` |

---

## Personnalisation des packs de crédits

Les packs se gèrent depuis le panneau admin :
1. Connectez-vous sur `/admin`
2. Allez dans **Packs crédits**
3. Créez, modifiez ou supprimez les packs

Vous pouvez également les modifier directement en base de données.

---

## Configuration du système de paiement

Le système de paiement fonctionne via WhatsApp :
1. L'utilisateur clique sur "Acheter via WhatsApp"
2. Un message pré-rempli est généré avec toutes les informations
3. L'utilisateur envoie le message au numéro admin
4. L'admin valide le paiement depuis le panneau admin
5. Les crédits sont ajoutés automatiquement

Pour modifier le numéro WhatsApp : `ADMIN_WHATSAPP=237XXXXXXXXX`

---

## Logs

Les logs sont dans le répertoire configuré par `LOG_DIR` (`./logs` par défaut) :
- `katashie-YYYY-MM-DD.log` — Tous les logs
- `error-YYYY-MM-DD.log` — Erreurs uniquement

Rotation automatique : 30 jours de conservation.
