# Installation de KATASHIE BOT

## Prérequis

| Composant | Version minimale | Recommandé |
|-----------|-----------------|------------|
| OS        | Ubuntu 20.04 / Debian 11 | Ubuntu 22.04 LTS |
| RAM       | 1 GB | 2 GB+ |
| CPU       | 1 vCPU | 2 vCPU+ |
| Disque    | 10 GB | 20 GB+ |
| Node.js   | 18+ | 20 LTS |

---

## Installation automatique (recommandé)

Une seule commande suffit :

```bash
bash <(curl -fsSL https://raw.githubusercontent.com/abesskamer237/katashie_bot/main/install.sh)
```

Le script va automatiquement :
1. Vérifier les prérequis système
2. Installer Node.js 20 LTS
3. Installer Nginx
4. Télécharger les sources depuis GitHub
5. Configurer les variables d'environnement
6. Installer les dépendances npm
7. Construire le frontend
8. Initialiser la base de données
9. Créer le service systemd
10. Configurer Nginx en reverse proxy
11. Démarrer tous les services
12. Afficher les informations de connexion

**Durée estimée : 5 à 10 minutes**

---

## Installation manuelle

### 1. Cloner le dépôt

```bash
git clone https://github.com/abesskamer237/katashie_bot.git /opt/katashie-bot
cd /opt/katashie-bot
```

### 2. Configurer l'environnement

```bash
cp .env.example .env
nano .env
```

Variables essentielles à modifier :
- `APP_URL` — URL publique du serveur
- `JWT_SECRET` — Clé secrète (64+ caractères aléatoires)
- `ADMIN_EMAIL` — Email de l'administrateur
- `ADMIN_PASSWORD` — Mot de passe admin
- `ADMIN_WHATSAPP` — Numéro WhatsApp pour les paiements

### 3. Backend

```bash
cd backend
npm install
npm run build
```

### 4. Frontend

```bash
cd ../frontend
npm install
npm run build
```

### 5. Base de données

```bash
cd ../backend
npx ts-node src/database/seed.ts
```

### 6. Service systemd

```bash
cp /opt/katashie-bot/configs/katashie-bot.service /etc/systemd/system/
systemctl daemon-reload
systemctl enable --now katashie-bot
```

### 7. Nginx

```bash
cp /opt/katashie-bot/configs/nginx.conf /etc/nginx/sites-available/katashie-bot
# Modifier VOTRE_DOMAINE dans le fichier
ln -s /etc/nginx/sites-available/katashie-bot /etc/nginx/sites-enabled/
nginx -t && systemctl restart nginx
```

---

## Vérification

```bash
# Statut du service
systemctl status katashie-bot

# Logs en temps réel
journalctl -u katashie-bot -f

# Test de l'API
curl http://localhost:3000/api/health
```

---

## HTTPS avec Certbot

```bash
apt install certbot python3-certbot-nginx -y
certbot --nginx -d votre-domaine.com
```

---

## Pare-feu

```bash
ufw allow 80/tcp
ufw allow 443/tcp
ufw allow 22/tcp
ufw enable
```
