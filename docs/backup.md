# Sauvegarde & Restauration

## Sauvegarde manuelle

Sur le VPS, la sauvegarde peut être faite en copiant les fichiers essentiels du projet :

```bash
cd /var/www/katashie-bot
sudo tar -czf /root/katashie-backup-$(date +%F-%H%M%S).tar.gz .env backend/database uploads
```

## Sauvegarde du dépôt

```bash
cd /var/www/katashie-bot
git status
git add .
git commit -m "Backup before update"
git push origin main
```

## Restauration

```bash
cd /var/www/katashie-bot
sudo tar -xzf /root/katashie-backup-YYYYMMDD-HHMMSS.tar.gz -C /var/www/katashie-bot
sudo docker compose down
sudo docker compose up -d --build
```

## Ce qui est conseillé de sauvegarder

- le fichier `.env`
- la base SQLite dans `backend/database/`
- les fichiers uploadés si vous en avez
- les modifications de configuration Nginx ou Certbot si elles sont personnalisées

## Ce qui n’est pas nécessaire de sauvegarder

- `node_modules/`
- `dist/`
- les images Docker construites localement

## Recommandation pratique

Pour une production sérieuse, planifiez une sauvegarde automatique quotidienne avec cron ou un système de backup externe.
