#!/bin/bash
# KATASHIE BOT — Script de sauvegarde automatique

set -e
INSTALL_DIR="/opt/katashie-bot"
BACKUP_DIR="/var/backups/katashie-bot"
DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_FILE="$BACKUP_DIR/katashie_backup_$DATE.tar.gz"

mkdir -p "$BACKUP_DIR"

echo "[$(date)] Démarrage de la sauvegarde..."

tar -czf "$BACKUP_FILE" \
  --exclude="$INSTALL_DIR/node_modules" \
  --exclude="$INSTALL_DIR/frontend/node_modules" \
  --exclude="$INSTALL_DIR/backend/node_modules" \
  --exclude="$INSTALL_DIR/backend/dist" \
  --exclude="$INSTALL_DIR/frontend/dist" \
  "$INSTALL_DIR/database" \
  "$INSTALL_DIR/.env" \
  "$INSTALL_DIR/uploads"

echo "[$(date)] Sauvegarde créée : $BACKUP_FILE"

# Conserver seulement les 7 dernières sauvegardes
ls -t "$BACKUP_DIR"/katashie_backup_*.tar.gz | tail -n +8 | xargs -r rm --
echo "[$(date)] Anciennes sauvegardes nettoyées"
