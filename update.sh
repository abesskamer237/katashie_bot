#!/bin/bash
# KATASHIE BOT — Script de mise à jour
# Usage : télécharger le nouveau ZIP, extraire, puis lancer :
#   sudo bash katashie-bot/update.sh
#
# Le script copie les nouveaux fichiers source dans /opt/katashie-bot
# (sans écraser .env ni database/) puis recompile et redémarre.

set -e
GREEN='\033[0;32m'; CYAN='\033[0;36m'; YELLOW='\033[1;33m'; RED='\033[0;31m'; NC='\033[0m'

log()  { echo -e "  ${GREEN}[✓]${NC} $1"; }
info() { echo -e "  ${CYAN}[→]${NC} $1"; }
warn() { echo -e "  ${YELLOW}[!]${NC} $1"; }
err()  { echo -e "  ${RED}[✗]${NC} $1"; exit 1; }

INSTALL_DIR="/opt/katashie-bot"

echo ""
echo -e "  ${GREEN}KATASHIE BOT — Mise à jour${NC}"
echo ""

if [[ $EUID -ne 0 ]]; then
  err "Lancez en root : sudo bash update.sh"
fi

if [[ ! -d "$INSTALL_DIR" ]]; then
  err "$INSTALL_DIR introuvable — lancez d'abord install.sh"
fi

# Répertoire du script (là où le ZIP a été extrait)
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

info "Arrêt du service..."
systemctl stop katashie-bot 2>/dev/null || true

# BUG FIX : on copie les fichiers locaux au lieu de faire git pull
# (l'installation utilise des fichiers locaux, pas un repo git)
info "Mise à jour des sources (sans écraser .env ni database/)..."
# Sauvegarder .env et database avant la copie
cp -p "$INSTALL_DIR/.env" /tmp/katashie-env-backup 2>/dev/null || true
rsync -a --exclude='.env' --exclude='database/' --exclude='logs/' --exclude='uploads/' \
  "$SCRIPT_DIR/" "$INSTALL_DIR/" 2>/dev/null || \
  cp -r "$SCRIPT_DIR/backend" "$SCRIPT_DIR/frontend" "$SCRIPT_DIR/configs" \
        "$SCRIPT_DIR/scripts" "$INSTALL_DIR/" 2>/dev/null || true
# Restaurer .env si écrasé
if [[ -f /tmp/katashie-env-backup ]]; then
  cp -p /tmp/katashie-env-backup "$INSTALL_DIR/.env"
  rm -f /tmp/katashie-env-backup
fi
log "Sources mises à jour"

info "Installation des dépendances backend (devDeps inclus pour TypeScript)..."
cd "$INSTALL_DIR/backend"
npm install

info "Construction du backend TypeScript → JavaScript..."
npm run build
log "Backend compilé dans dist/"

info "Suppression des devDependencies post-build..."
npm prune --production

info "Construction du frontend..."
cd "$INSTALL_DIR/frontend"
npm install
npm run build
rm -rf node_modules

info "Redémarrage du service..."
systemctl start katashie-bot
sleep 3

if systemctl is-active --quiet katashie-bot; then
  log "Mise à jour terminée — Service actif ✓"
else
  warn "Problème au redémarrage. Vérifiez : journalctl -u katashie-bot -n 50"
fi
