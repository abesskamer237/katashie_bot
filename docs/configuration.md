# Configuration de KATASHIE BOT

## Fichier `.env`

Le fichier `.env` doit être placé à la racine du dépôt et est lu par l’application au démarrage.

### Variables principales

| Variable | Description | Exemple |
|----------|-------------|---------|
| `NODE_ENV` | Environnement d’exécution | `production` |
| `PORT` | Port d’écoute du backend | `3000` |
| `APP_URL` | URL publique du site | `https://votre-domaine.com` |
| `JWT_SECRET` | Clé secrète JWT | `openssl rand -hex 64` |
| `ADMIN_EMAIL` | Email du compte administrateur | `admin@example.com` |
| `ADMIN_PASSWORD` | Mot de passe initial admin | `MotDePasseFort123!` |
| `ADMIN_WHATSAPP` | Numéro WhatsApp utilisé pour les paiements | `237XXXXXXXXX` |

### Variables optionnelles

| Variable | Description |
|----------|-------------|
| `JWT_EXPIRES_IN` | Durée des tokens JWT |
| `SESSION_SECRET` | Secret utilisé pour les sessions |
| `RATE_LIMIT_WINDOW_MS` | Fenêtre de limitation de requêtes |
| `RATE_LIMIT_MAX` | Limite par fenêtre |
| `LOGIN_LIMIT_MAX` | Limite de tentatives de connexion |
| `MIN_CREDITS_FOR_SERVER` | Crédits minimum pour créer un serveur |

> ⚠️ Important : utilisez des secrets longs et aléatoires en production.

---

## Configuration de la base de données

L’application utilise SQLite via le backend. La base est initialisée automatiquement au démarrage du conteneur si nécessaire.

Chemin par défaut :
- `backend/database/katashie.db`

Pour réinitialiser la base localement :

```bash
npm run db:init
npm run db:seed
```

---

## Configuration du système de paiement

Le système de paiement est piloté par WhatsApp :
1. l’utilisateur clique sur “Acheter via WhatsApp”
2. un message pré-rempli est généré
3. l’admin valide le paiement depuis le panneau d’administration
4. les crédits sont ajoutés manuellement ou automatiquement selon la logique du projet

Pour modifier le numéro utilisé :

```bash
ADMIN_WHATSAPP=237XXXXXXXXX
```

---

## Logs

Les logs sont écrits par le backend et sont visibles via :

```bash
sudo docker compose logs app
```

En local :

```bash
npm run dev:backend
```

---

## Sécurité recommandée

En production, il est conseillé de :
- ne jamais committer un `.env` réel
- utiliser un secret fort pour `JWT_SECRET`
- ouvrir uniquement les ports 22, 80 et 443 via UFW
- placer le service derrière Nginx avec HTTPS
