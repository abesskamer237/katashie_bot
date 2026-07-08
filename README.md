# KATASHIE BOT

<div align="center">
  <img src="https://img.shields.io/badge/KATASHIE_BOT-v1.0.0-00ff41?style=for-the-badge&logo=whatsapp&logoColor=white" alt="KATASHIE BOT" />
  <img src="https://img.shields.io/badge/Node.js-22+-339933?style=for-the-badge&logo=node.js&logoColor=white" />
  <img src="https://img.shields.io/badge/React-18+-61DAFB?style=for-the-badge&logo=react&logoColor=black" />
  <img src="https://img.shields.io/badge/TypeScript-5+-3178C6?style=for-the-badge&logo=typescript&logoColor=white" />
  <img src="https://img.shields.io/badge/SQLite-003B57?style=for-the-badge&logo=sqlite&logoColor=white" />
</div>

---

> Plateforme SaaS moderne pour déployer, gérer et superviser des bots WhatsApp via une interface web professionnelle.

## Vue d'ensemble

KATASHIE BOT est une application full-stack composée d'un backend API en Node.js/TypeScript, d'un frontend React/Vite et d'une base de données SQLite. Elle permet de gérer des comptes utilisateurs, des crédits, des serveurs, des notifications et des opérations d'administration depuis une interface claire et sécurisée.

## Fonctionnalités principales

- Gestion des comptes utilisateurs : inscription, connexion, profil et sécurité
- Système de crédits : achats, consommation et historique
- Gestion des serveurs et des bots WhatsApp : création, déploiement et suivi
- Panneau d'administration : gestion des utilisateurs, serveurs, paiements et logs
- Déploiement automatisé : scripts Bash et configuration Docker Compose
- Sécurité de base : JWT, rate limiting, bcrypt, logs et protection des routes sensibles

## Stack technique

- Backend : Node.js, Express, TypeScript, SQLite, JWT
- Frontend : React, Vite, TypeScript, Tailwind CSS
- Déploiement : Docker, Docker Compose, Nginx, Certbot
- Outils : Bash scripts, UFW, systemd-ready

## Démarrage rapide

### Prérequis

- Node.js 22+
- npm 10+
- Git

### Installation locale

```bash
git clone https://github.com/abesskamer237/katashie_bot.git
cd katashie-bot
npm run install:all
npm run db:init
npm run db:seed
npm run build
npm run start
```

### Développement local

```bash
npm run dev:backend
npm run dev:frontend
```

## Modes de déploiement

KATASHIE BOT a été pensé pour plusieurs scénarios de mise en production. Voici les modes que nous avons validés et que vous pouvez utiliser selon votre besoin.

### 1. Déploiement automatique sur VPS Ubuntu 22.04

Le mode le plus simple pour un serveur dédié ou VPS.

```bash
git clone https://github.com/abesskamer237/katashie_bot.git
cd katashie_bot
chmod +x install.sh
sudo bash install.sh
```

Ce mode installe automatiquement :
- les dépendances système
- Node.js
- Nginx
- Certbot / HTTPS
- les fichiers du projet
- la base de données et le compte admin initial

### 2. Déploiement avec script full VPS

Pour une mise en production plus complète avec reverse proxy, firewall et SSL.

```bash
cd /var/www/katashie-bot
git pull
sudo bash deploy-full.sh votre-domaine.com
```

Ce mode est adapté si vous voulez un déploiement prêt à l’emploi sur un VPS avec domaine public.

### 3. Déploiement Docker Compose

Pour un déploiement conteneurisé simple et reproductible.

```bash
docker compose up -d --build
```

Ce mode est pratique pour :
- des environnements portables
- un déploiement rapide
- une isolation du backend et du frontend

### 4. Déploiement manuel

Si vous préférez gérer vous-même la configuration.

```bash
npm run install:all
npm run build
npm run start
```

### 5. Mode réparation / reprise d’installation

Si une installation a déjà été tentée mais échoue, vous pouvez reprendre proprement :

```bash
sudo bash install.sh --repair
```

## Vérifications post-déploiement

Après chaque mode de déploiement, vous pouvez vérifier rapidement :

```bash
curl http://127.0.0.1:3000/api/health
curl https://votre-domaine.com/api/health
```

Et côté conteneur :

```bash
sudo docker compose ps
sudo docker compose logs app
```

## Structure du projet

```text
backend/      # API Express + logique métier + base de données
frontend/     # Interface React/Vite
configs/      # Configuration système et reverse proxy
scripts/      # Scripts utilitaires
docs/         # Documentation technique
```

## Documentation

- [Installation](docs/installation.md)
- [Configuration](docs/configuration.md)
- [Mise à jour](docs/update.md)
- [Sauvegarde & Restauration](docs/backup.md)
- [Architecture](docs/architecture.md)
- [API Reference](docs/api.md)

## Déploiement et opérations

Pour un déploiement en production, il est recommandé de préparer :

- un domaine correctement pointé vers le VPS
- un utilisateur non-root pour l’application
- un firewall configuré avec UFW
- des variables d’environnement sécurisées dans un fichier .env

## Support

- Dépôt GitHub : https://github.com/abesskamer237/katashie_bot.git
- WhatsApp : https://wa.me/237682229367

## Licence

Copyright © 2025 KATASHIE BOT — Tous droits réservés.
