# Installation de KATASHIE BOT

## Prérequis

| Composant | Version minimale | Recommandé |
|-----------|-----------------|------------|
| OS        | Ubuntu 22.04 LTS | Ubuntu 22.04 LTS |
| RAM       | 1 Go | 2 Go+ |
| CPU       | 1 vCPU | 2 vCPU+ |
| Disque    | 20 Go | 40 Go+ |
| Docker    | 24+ | 27+ |
| Docker Compose | 2.20+ | 2.30+ |

---

## Installation automatique sur VPS

La méthode recommandée pour un serveur Ubuntu 22.04 est la suivante :

```bash
sudo apt update && sudo apt install -y git curl ufw nginx certbot python3-certbot-nginx
cd /var/www
sudo git clone https://github.com/abesskamer237/katashie_bot.git katashie-bot
cd /var/www/katashie-bot
sudo bash deploy-full.sh votre-domaine.com
```

Ce script installe automatiquement :
1. Docker et Docker Compose
2. Nginx
3. UFW et règles de base
4. Certbot et HTTPS
5. L’application via Docker Compose
6. Le reverse proxy vers le conteneur sur le port 3000

---

## Installation locale

### 1. Cloner le dépôt

```bash
git clone https://github.com/abesskamer237/katashie_bot.git
cd katashie-bot
```

### 2. Installer les dépendances

```bash
npm run install:all
```

### 3. Initialiser la base de données

```bash
npm run db:init
npm run db:seed
```

### 4. Lancer l’application

```bash
npm run build
npm run start
```

### 5. Développement local

```bash
npm run dev:backend
npm run dev:frontend
```

---

## Variables d'environnement

Un fichier `.env` est attendu à la racine du projet. Il doit contenir au minimum :

```env
NODE_ENV=production
PORT=3000
JWT_SECRET=votre_cle_secrete_tres_longue
APP_URL=https://votre-domaine.com
ADMIN_EMAIL=admin@example.com
ADMIN_PASSWORD=motdepassefort
ADMIN_WHATSAPP=237000000000
```

Le backend charge automatiquement ce fichier via la configuration interne.

---

## Vérification

```bash
# Vérifier le conteneur
sudo docker compose ps

# Voir les logs
sudo docker compose logs app

# Test local de l'API
curl http://127.0.0.1:3000/api/health

# Test HTTPS
curl https://votre-domaine.com/api/health
```

---

## HTTPS avec Certbot

Le script de déploiement le configure automatiquement. Si vous voulez le faire manuellement :

```bash
sudo apt install -y certbot python3-certbot-nginx
sudo certbot --nginx -d votre-domaine.com
```

---

## Pare-feu

```bash
sudo ufw allow 22/tcp
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
sudo ufw enable
```

---

## Maintenance

### Mettre à jour l’application

```bash
cd /var/www/katashie-bot
git pull
sudo bash deploy-full.sh votre-domaine.com
```

### Redémarrer les services

```bash
sudo docker compose down
sudo docker compose up -d --build
```
