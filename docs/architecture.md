# Architecture de KATASHIE BOT

## Vue d'ensemble

```
katashie-bot/
├── backend/                 # API REST Express + TypeScript
│   └── src/
│       ├── config/          # Configuration centralisée
│       ├── database/        # Init SQLite + seed
│       ├── middleware/       # Auth JWT, rate limit, validation, logs
│       ├── routes/          # Toutes les routes API
│       │   ├── auth.ts      # Authentification (register, login, reset...)
│       │   ├── servers.ts   # Gestion des serveurs/bots
│       │   ├── credits.ts   # Système de crédits et paiements
│       │   ├── admin.ts     # Routes administrateur
│       │   ├── notifications.ts
│       │   └── announcements.ts
│       ├── utils/           # Logger Winston, helpers
│       └── index.ts         # Point d'entrée Express
│
├── frontend/                # Interface React + Vite + Tailwind
│   └── src/
│       ├── components/
│       │   ├── layout/      # Sidebar, Header, AppLayout, AdminLayout
│       │   └── ui/          # NotificationDropdown...
│       ├── pages/           # Pages utilisateur
│       │   └── admin/       # Pages administrateur
│       ├── store/           # Zustand (auth state)
│       ├── lib/             # Client API Axios
│       └── utils/           # Helpers partagés
│
├── docs/                    # Documentation complète
├── configs/                 # Fichiers de config (nginx, systemd)
├── install.sh               # Installateur one-command
├── update.sh                # Script de mise à jour
├── backup.sh                # Sauvegarde automatique
└── .env.example             # Template de configuration
```

---

## Stack technique

### Backend
- **Runtime** : Node.js 20 LTS
- **Framework** : Express 4 + TypeScript
- **Base de données** : SQLite (via `better-sqlite3`) — légère, sans config, performante
- **Auth** : JWT (access + refresh tokens), bcryptjs
- **Sécurité** : Helmet, CORS, CSRF, Rate Limiting
- **Logs** : Winston + rotation quotidienne
- **Validation** : express-validator

### Frontend
- **Framework** : React 18 + Vite 5
- **Style** : Tailwind CSS (thème Matrix/Hacker custom)
- **État** : Zustand (auth) + React Query (server state)
- **HTTP** : Axios avec intercepteurs JWT auto-refresh
- **Charts** : Recharts
- **Router** : React Router v6

### Infrastructure
- **Reverse proxy** : Nginx
- **Process manager** : systemd
- **SSL** : Let's Encrypt / Certbot

---

## Flux d'authentification

```
Client                    API Server              DB
  |                           |                    |
  |-- POST /api/auth/login --> |                    |
  |                           |-- SELECT user -----> |
  |                           |<-- user data -------- |
  |                           |-- bcrypt.compare()    |
  |<-- { accessToken (7d),    |                    |
  |      refreshToken (30d) } |                    |
  |                           |                    |
  |-- GET /api/servers ------> |                    |
  |  Authorization: Bearer    |                    |
  |                           |-- jwt.verify() ----  |
  |                           |-- SELECT user -----> |
  |<-- { servers } ---------- |                    |
```

---

## Flux de paiement

```
Utilisateur              Plateforme            Admin WhatsApp
    |                        |                        |
    |-- Choisit un pack ----> |                        |
    |                        |-- Génère une référence  |
    |                        |-- Crée la demande en DB |
    |<-- Lien WhatsApp ------ |                        |
    |                        |                        |
    |-- Ouvre WhatsApp -----------------------------------------> |
    |-- Envoie le message (pré-rempli) -----------------------> |
    |                        |                        |
    |                        |<-- Admin valide -------- |
    |                        |-- Ajoute les crédits    |
    |                        |-- Notifie l'utilisateur |
    |<-- Notification reçue - |                        |
```

---

## Sécurité

| Couche | Mécanisme |
|--------|-----------|
| Transport | HTTPS (Nginx + Let's Encrypt) |
| Auth | JWT (HS256) + Refresh tokens |
| Mots de passe | bcrypt (cost=12) |
| Entrées | express-validator + sanitization |
| Rate limiting | Par IP (global + auth + actions) |
| Headers HTTP | Helmet (CSP, HSTS, XFO...) |
| CORS | Origine stricte en production |
| Logs | Journalisation complète de toutes les actions |

---

## Base de données SQLite

Avantages du choix SQLite :
- Zéro configuration requise
- Pas de serveur de base de données séparé
- Performante pour des milliers d'utilisateurs
- Sauvegarde simple (copie d'un fichier)
- Mode WAL pour les écritures concurrentes

Pour une mise à l'échelle importante (10 000+ utilisateurs actifs simultanés), migrez vers PostgreSQL en adaptant l'ORM.
