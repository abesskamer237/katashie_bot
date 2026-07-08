# Sauvegarde & Restauration

## Sauvegarde manuelle

```bash
bash /opt/katashie-bot/backup.sh
```

Le fichier de sauvegarde est créé dans `/var/backups/katashie-bot/`.

## Sauvegarde automatique (cron)

Ajouter dans la crontab (`crontab -e`) :

```bash
# Sauvegarde quotidienne à 3h00
0 3 * * * bash /opt/katashie-bot/backup.sh >> /var/log/katashie-backup.log 2>&1
```

## Restauration

```bash
# Arrêter le service
systemctl stop katashie-bot

# Restaurer depuis la sauvegarde
tar -xzf /var/backups/katashie-bot/katashie_backup_YYYYMMDD_HHMMSS.tar.gz -C /

# Redémarrer
systemctl start katashie-bot
```

## Ce qui est sauvegardé

- Base de données SQLite (`database/katashie.db`)
- Fichier de configuration (`.env`)
- Fichiers uploadés (`uploads/`)

## Ce qui N'est PAS sauvegardé

- `node_modules/` (réinstallable avec `npm install`)
- `dist/` (reconstructible avec `npm run build`)
- Logs (conservés séparément dans `/var/log`)
