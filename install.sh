#!/usr/bin/env bash
# ============================================================
#  KATASHIE BOT — Installateur automatique v1.0.0
#  https://github.com/abesskamer237/katashie_bot.git
#  Support : https://wa.me/237682229367
# ============================================================
#  Ce script installe KATASHIE BOT sur un serveur Debian/Ubuntu
#  ou RHEL/CentOS. Il gère les dépendances, Node.js, Nginx,
#  Certbot, la compilation, la base de données, et la mise en
#  place du service systemd.
# ============================================================

set -Eeuo pipefail  # Mode strict : erreur, pipefail, et gestion des trap

# ── Couleurs pour l'affichage ────────────────────────────────
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
WHITE='\033[1;37m'
BOLD='\033[1m'
NC='\033[0m'        # No Color

# ── Variables globales ──────────────────────────────────────
REPO_URL="https://github.com/abesskamer237/katashie_bot.git"
INSTALL_DIR="/opt/katashie-bot"          # Répertoire d'installation
SERVICE_USER="katashie"                  # Utilisateur système dédié
LOG_FILE="/var/log/katashie-install.log" # Fichier de log
NODE_VERSION="22"                        # Version de Node.js
BACKUP_DIR="${INSTALL_DIR}.backup.$(date +%s)" # Sauvegarde en cas de mise à jour
BACKUP_CREATED=false
ROLLBACK_NEEDED=false
REPAIR_MODE=false

# ── Fonctions d'affichage ────────────────────────────────────
print_banner() {
  echo -e "${GREEN}"
  echo '  ██╗  ██╗ █████╗ ████████╗ █████╗ ███████╗██╗  ██╗██╗███████╗'
  echo '  ██║ ██╔╝██╔══██╗╚══██╔══╝██╔══██╗██╔════╝██║  ██║██║██╔════╝'
  echo '  █████╔╝ ███████║   ██║   ███████║███████╗███████║██║█████╗  '
  echo '  ██╔═██╗ ██╔══██║   ██║   ██╔══██║╚════██║██╔══██║██║██╔══╝  '
  echo '  ██║  ██╗██║  ██║   ██║   ██║  ██║███████║██║  ██║██║███████╗'
  echo '  ╚═╝  ╚═╝╚═╝  ╚═╝   ╚═╝   ╚═╝  ╚═╝╚══════╝╚═╝  ╚═╝╚═╝╚══════╝'
  echo -e "${CYAN}                      BOT PANEL — v1.0.0${NC}"
  echo -e "${WHITE}          Plateforme SaaS de gestion de bots WhatsApp${NC}"
  echo ""
  echo -e "${YELLOW}  Support : https://wa.me/237682229367${NC}"
  echo -e "${YELLOW}  GitHub  : ${REPO_URL}${NC}"
  echo ""
  echo -e "  ${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
  echo ""
}

# Fonctions de log avec couleurs et écriture dans le fichier
log()     { echo -e "  ${GREEN}[✓]${NC} $1" | tee -a "$LOG_FILE"; }
info()    { echo -e "  ${CYAN}[→]${NC} $1" | tee -a "$LOG_FILE"; }
warn()    { echo -e "  ${YELLOW}[!]${NC} $1" | tee -a "$LOG_FILE"; }
error()   { echo -e "  ${RED}[✗]${NC} $1" | tee -a "$LOG_FILE"; exit 1; }
section() { echo -e "\n  ${BOLD}${WHITE}── $1 ──${NC}\n"; }
prompt()  { echo -e -n "  ${CYAN}?${NC} $1: "; }

require_command() {
  local cmd="$1"
  command -v "$cmd" >/dev/null 2>&1 || error "Commande introuvable : $cmd"
}

# ── Vérifications préliminaires ──────────────────────────────

# Vérifie que le script est exécuté en root
check_root() {
  if [[ $EUID -ne 0 ]]; then
    error "Ce script doit être exécuté en tant que root. Utilisez : sudo bash install.sh"
  fi
}

# Détection du système d'exploitation
check_os() {
  if [[ -f /etc/debian_version ]]; then
    OS="debian"
    log "Système détecté : Debian/Ubuntu"
  elif [[ -f /etc/redhat-release ]]; then
    OS="rhel"
    log "Système détecté : CentOS/RHEL"
  else
    error "Système d'exploitation non supporté. Utilisez Debian/Ubuntu ou CentOS/RHEL."
  fi
}

# Vérification que le port choisi pour le backend est libre (uniquement ce port)
check_ports() {
  section "Vérification des ports"
  local ports=("${APP_PORT}")
  if command -v ss >/dev/null 2>&1; then
    for port in "${ports[@]}"; do
      if ss -ltn 2>/dev/null | grep -q ":${port} "; then
        error "Le port ${port} est déjà utilisé. Veuillez libérer ce port avant d'installer."
      fi
    done
  else
    warn "Commande ss indisponible — vérification du port ignorée"
  fi
  log "Port ${APP_PORT} libre"
}

# ── Gestion du mode repair ──────────────────────────────────

parse_args() {
  while [[ $# -gt 0 ]]; do
    case "$1" in
      --repair)
        REPAIR_MODE=true
        shift
        ;;
      *)
        error "Argument inconnu : $1"
        ;;
    esac
  done
}

# ── Gestion des sauvegardes ──────────────────────────────────

# Sauvegarde automatique des données critiques (.env, database, uploads, logs)
backup_existing() {
  if [[ -d "$INSTALL_DIR" ]]; then
    warn "Une installation existante a été trouvée."
    info "Création d'une sauvegarde dans ${BACKUP_DIR}..."
    mkdir -p "${BACKUP_DIR}"
    for item in .env database uploads logs; do
      if [[ -e "$INSTALL_DIR/$item" ]]; then
        cp -a "$INSTALL_DIR/$item" "${BACKUP_DIR}/" 2>/dev/null || true
      fi
    done
    BACKUP_CREATED=true
    ROLLBACK_NEEDED=true
    log "Sauvegarde effectuée : ${BACKUP_DIR}"
  fi
}

# Fonction de rollback (gardée mais non utilisée automatiquement)
rollback() {
  if [[ "$ROLLBACK_NEEDED" == true && -d "$BACKUP_DIR" ]]; then
    echo -e "\n  ${YELLOW}[!] Une erreur est survenue. Restauration de la sauvegarde...${NC}"
    if [[ -d "$INSTALL_DIR" ]]; then
      rm -rf "$INSTALL_DIR"
    fi
    mkdir -p "$INSTALL_DIR"
    cp -a "$BACKUP_DIR/." "$INSTALL_DIR/" 2>/dev/null || true
    echo -e "  ${GREEN}[✓] Sauvegarde restaurée depuis ${BACKUP_DIR}${NC}"
    ROLLBACK_NEEDED=false
  fi
}

# ── Installation des dépendances ─────────────────────────────

# Installation des paquets système essentiels
install_dependencies() {
  section "Installation des dépendances système"
  info "Mise à jour des paquets..."

  if [[ "$OS" == "debian" ]]; then
    apt-get update -qq >> "$LOG_FILE" 2>&1
    apt-get install -y -qq \
      curl \
      git \
      wget \
      unzip \
      build-essential \
      python3 \
      pkg-config \
      libsqlite3-dev \
      openssl \
      ca-certificates >> "$LOG_FILE" 2>&1
  else
    yum update -y -q >> "$LOG_FILE" 2>&1
    yum install -y -q curl git wget unzip gcc gcc-c++ make python3 openssl ca-certificates >> "$LOG_FILE" 2>&1
  fi
  log "Dépendances système installées"
}

# Installation de Node.js (version définie) et affichage des versions
install_nodejs() {
  section "Installation de Node.js ${NODE_VERSION}"
  if command -v node &> /dev/null; then
    CURRENT_NODE=$(node --version | cut -d 'v' -f 2 | cut -d '.' -f 1)
    if [[ $CURRENT_NODE -ge $NODE_VERSION ]]; then
      log "Node.js $(node --version) déjà installé"
      node -v | tee -a "$LOG_FILE"
      npm -v | tee -a "$LOG_FILE"
      return
    fi
  fi

  info "Téléchargement de NodeSource..."
  curl -fsSL "https://deb.nodesource.com/setup_${NODE_VERSION}.x" | bash - >> "$LOG_FILE" 2>&1

  if [[ "$OS" == "debian" ]]; then
    apt-get install -y -qq nodejs >> "$LOG_FILE" 2>&1
  else
    yum install -y -q nodejs >> "$LOG_FILE" 2>&1
  fi

  log "Node.js $(node --version) installé"
  node -v | tee -a "$LOG_FILE"
  npm -v | tee -a "$LOG_FILE"
}

# Installation de Nginx
install_nginx() {
  section "Installation de Nginx (reverse proxy)"
  if command -v nginx &> /dev/null; then
    log "Nginx déjà installé"
    return
  fi

  if [[ "$OS" == "debian" ]]; then
    apt-get install -y -qq nginx >> "$LOG_FILE" 2>&1
  else
    yum install -y -q nginx >> "$LOG_FILE" 2>&1
  fi
  log "Nginx installé"
}

# Installation de Certbot (pour SSL)
install_certbot() {
  section "Installation de Certbot (SSL)"
  if [[ "$OS" == "debian" ]]; then
    apt-get install -y -qq certbot python3-certbot-nginx >> "$LOG_FILE" 2>&1
  else
    yum install -y -q certbot python3-certbot-nginx >> "$LOG_FILE" 2>&1
  fi
  log "Certbot installé"
}

# ── Collecte des informations de configuration ──────────────

collect_config() {
  section "Configuration de KATASHIE BOT"

  if [[ -z "${APP_DOMAIN:-}" ]]; then
    if [[ -t 0 ]]; then
      prompt "Domaine ou IP du serveur (ex: katashie.exemple.com)"
      read -r APP_DOMAIN
    else
      APP_DOMAIN=""
    fi
  fi
  APP_DOMAIN=${APP_DOMAIN:-"localhost"}
  if [[ "$APP_DOMAIN" == "localhost" ]]; then
    warn "Aucun domaine n’a été fourni ; l’URL sera configurée sur http://localhost."
  fi

  if [[ -z "${APP_PORT:-}" ]]; then
    if [[ -t 0 ]]; then
      prompt "Port du backend (défaut: 3000)"
      read -r APP_PORT
    else
      APP_PORT=""
    fi
  fi
  APP_PORT=${APP_PORT:-"3000"}

  if [[ -z "${ADMIN_EMAIL:-}" ]]; then
    if [[ -t 0 ]]; then
      prompt "E-mail administrateur (défaut: admin@katashie.com)"
      read -r ADMIN_EMAIL
    else
      ADMIN_EMAIL=""
    fi
  fi
  ADMIN_EMAIL=${ADMIN_EMAIL:-"admin@katashie.com"}

  if [[ -z "${ADMIN_PASSWORD:-}" ]]; then
    if [[ -t 0 ]]; then
      prompt "Mot de passe administrateur (min. 8 caractères)"
      read -rs ADMIN_PASSWORD
      echo ""
    else
      ADMIN_PASSWORD=""
    fi
  fi
  ADMIN_PASSWORD=${ADMIN_PASSWORD:-"Admin@123456"}

  if [[ -z "${ADMIN_WHATSAPP:-}" ]]; then
    if [[ -t 0 ]]; then
      prompt "Numéro WhatsApp admin (défaut: 237682229367)"
      read -r ADMIN_WHATSAPP
    else
      ADMIN_WHATSAPP=""
    fi
  fi
  ADMIN_WHATSAPP=${ADMIN_WHATSAPP:-"237682229367"}

  # Génération de secrets aléatoires pour la sécurité
  JWT_SECRET=$(openssl rand -hex 64)
  SESSION_SECRET=$(openssl rand -hex 32)
  REFRESH_SECRET=$(openssl rand -hex 64)

  log "Configuration collectée"
}

# ── Installation des sources ──────────────────────────────────

# Copie des fichiers du projet depuis le répertoire courant (compatible ZIP)
clone_repository() {
  section "Installation des sources"

  # Répertoire où se trouve le script
  SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

  # Vérification préalable de la présence du dossier backend
  if [ ! -d "$SCRIPT_DIR/backend" ]; then
    error "Le dossier backend est introuvable. Exécutez install.sh depuis le dossier du projet cloné."
  fi

  if [ ! -f "$SCRIPT_DIR/backend/package.json" ] || [ ! -f "$SCRIPT_DIR/frontend/package.json" ]; then
    error "Le dépôt cloné est incomplet : package.json manquant."
  fi

  # Sauvegarde de l'ancienne installation
  backup_existing

  # Sécurisation : ne jamais supprimer / ou un répertoire vide
  if [[ "$INSTALL_DIR" == "/" || -z "$INSTALL_DIR" ]]; then
    error "INSTALL_DIR invalide : '$INSTALL_DIR'"
  fi

  if [ "$SCRIPT_DIR" == "$INSTALL_DIR" ]; then
    warn "Le script est déjà exécuté depuis le répertoire d’installation ; aucune copie n’est nécessaire."
    return
  fi

  if [ -d "$INSTALL_DIR" ]; then
    rm -rf "$INSTALL_DIR"
  fi

  mkdir -p "$INSTALL_DIR"

  info "Copie des fichiers..."
  cp -a "$SCRIPT_DIR/." "$INSTALL_DIR/"
  if [ ! -d "$INSTALL_DIR/backend" ] || [ ! -d "$INSTALL_DIR/frontend" ]; then
    error "La copie des sources est incomplète : backend/frontend introuvables."
  fi

  # Vérifications post-copie pour s'assurer que tout est présent
  [ -d "$INSTALL_DIR/backend" ] || error "backend absent après copie"
  [ -d "$INSTALL_DIR/frontend" ] || error "frontend absent après copie"
  [ -f "$INSTALL_DIR/backend/package.json" ] || error "backend/package.json absent"
  [ -f "$INSTALL_DIR/frontend/package.json" ] || error "frontend/package.json absent"
  [ -f "$INSTALL_DIR/backend/src/database/seed.ts" ] || error "seed.ts absent"

  log "Sources copiées avec succès."
}

# ── Création du fichier .env ─────────────────────────────────

create_env_file() {
  section "Création du fichier de configuration"
  local app_url="https://${APP_DOMAIN}"
  if [[ "$APP_DOMAIN" == "localhost" ]]; then
    app_url="http://${APP_DOMAIN}"
  fi

  cat > "$INSTALL_DIR/.env" <<EOF
# KATASHIE BOT — Configuration générée automatiquement
# Généré le : $(date)

NODE_ENV=production
PORT=${APP_PORT}
APP_NAME=KATASHIE BOT
APP_URL=${app_url}

DB_PATH=${INSTALL_DIR}/database/katashie.db

JWT_SECRET=${JWT_SECRET}
JWT_EXPIRES_IN=7d
JWT_REFRESH_SECRET=${REFRESH_SECRET}
JWT_REFRESH_EXPIRES_IN=30d

SESSION_SECRET=${SESSION_SECRET}

ADMIN_WHATSAPP=${ADMIN_WHATSAPP}
ADMIN_EMAIL=${ADMIN_EMAIL}
ADMIN_PASSWORD=${ADMIN_PASSWORD}
ADMIN_USERNAME=admin

RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX=100
LOGIN_LIMIT_MAX=5

LOG_LEVEL=info
LOG_DIR=${INSTALL_DIR}/logs

UPLOAD_DIR=${INSTALL_DIR}/uploads
MAX_FILE_SIZE=52428800

MIN_CREDITS_FOR_SERVER=15
EOF
  chmod 600 "$INSTALL_DIR/.env"
  log "Fichier .env créé avec APP_URL=${app_url}"
}

# ── Compilation et installation de l'application ─────────────

install_app() {
  # --------------------- Backend ---------------------
  section "Installation des dépendances backend"
  cd "$INSTALL_DIR/backend"
  require_command npm
  npm install --no-audit --no-fund >> "$LOG_FILE" 2>&1
  log "Dépendances backend installées"

  section "Compilation du backend TypeScript → JavaScript"
  npm run build >> "$LOG_FILE" 2>&1
  if [ ! -d dist ]; then
    error "La compilation du backend a échoué : dossier dist non créé."
  fi
  log "Backend compilé dans dist/"

  section "Suppression des devDependencies"
  npm prune --production >> "$LOG_FILE" 2>&1
  log "devDependencies supprimées"

  # --------------------- Frontend --------------------
  section "Installation des dépendances frontend"
  cd "$INSTALL_DIR/frontend"
  npm install --no-audit --no-fund >> "$LOG_FILE" 2>&1
  npm run build >> "$LOG_FILE" 2>&1
  log "Frontend construit dans dist/"

  rm -rf node_modules >> "$LOG_FILE" 2>&1

  # --------------------- Base de données -------------
  section "Initialisation de la base de données"
  cd "$INSTALL_DIR/backend"
  mkdir -p "$INSTALL_DIR/database"
  chown "$SERVICE_USER:$SERVICE_USER" "$INSTALL_DIR/database" 2>/dev/null || true

  if [ -f dist/database/seed.js ]; then
    node dist/database/seed.js >> "$LOG_FILE" 2>&1
  else
    npx ts-node src/database/seed.ts >> "$LOG_FILE" 2>&1
  fi
  log "Base de données initialisée et données de démarrage insérées"
}

# ── Création de l'utilisateur système et permissions ────────

create_system_user() {
  section "Création de l'utilisateur système dédié"
  if id "$SERVICE_USER" &>/dev/null; then
    log "Utilisateur $SERVICE_USER existe déjà"
  else
    useradd --system --no-create-home --shell /usr/sbin/nologin "$SERVICE_USER" >> "$LOG_FILE" 2>&1
    log "Utilisateur système $SERVICE_USER créé"
  fi

  # Préparation des répertoires de données avant d'appliquer les permissions
  mkdir -p "$INSTALL_DIR/database" "$INSTALL_DIR/logs" "$INSTALL_DIR/uploads"

  chown -R "$SERVICE_USER:$SERVICE_USER" "$INSTALL_DIR" >> "$LOG_FILE" 2>&1
  chown -R "$SERVICE_USER:$SERVICE_USER" "$INSTALL_DIR/database" "$INSTALL_DIR/logs" "$INSTALL_DIR/uploads"
  chmod 775 "$INSTALL_DIR/database" "$INSTALL_DIR/logs" "$INSTALL_DIR/uploads"
  log "Permissions configurées pour $SERVICE_USER"
}

# ── Service systemd ───────────────────────────────────────────

create_systemd_service() {
  section "Création du service systemd"
  cat > /etc/systemd/system/katashie-bot.service <<EOF
[Unit]
Description=KATASHIE BOT — Plateforme de gestion de bots WhatsApp
Documentation=${REPO_URL}
After=network.target

[Service]
Type=simple
User=${SERVICE_USER}
Group=${SERVICE_USER}
WorkingDirectory=${INSTALL_DIR}/backend
ExecStart=/usr/bin/env node dist/index.js
Restart=on-failure
RestartSec=10
StandardOutput=journal
StandardError=journal
SyslogIdentifier=katashie-bot
Environment=NODE_ENV=production
Environment=PATH=/usr/local/sbin:/usr/local/bin:/usr/sbin:/usr/bin:/sbin:/bin
EnvironmentFile=${INSTALL_DIR}/.env

NoNewPrivileges=true
PrivateTmp=true
ProtectSystem=strict
ReadWritePaths=${INSTALL_DIR}/database ${INSTALL_DIR}/logs ${INSTALL_DIR}/uploads ${INSTALL_DIR}/backend

LimitNOFILE=65535

[Install]
WantedBy=multi-user.target
EOF

  systemctl daemon-reload >> "$LOG_FILE" 2>&1
  systemctl enable katashie-bot >> "$LOG_FILE" 2>&1
  log "Service systemd créé et activé (utilisateur : $SERVICE_USER)"
}

# ── Configuration de Nginx ────────────────────────────────────

configure_nginx() {
  section "Configuration de Nginx"
  cat > /etc/nginx/sites-available/katashie-bot <<EOF
server {
    listen 80;
    server_name ${APP_DOMAIN};

    client_max_body_size 50M;

    gzip on;
    gzip_vary on;
    gzip_types text/plain application/json application/javascript text/css;

    location /api {
        proxy_pass http://127.0.0.1:${APP_PORT};
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        proxy_cache_bypass \$http_upgrade;
        proxy_read_timeout 300;
    }

    location /uploads {
        proxy_pass http://127.0.0.1:${APP_PORT};
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
    }

    location / {
        root ${INSTALL_DIR}/frontend/dist;
        try_files \$uri \$uri/ /index.html;
        expires 1d;
        add_header Cache-Control "public";
    }

    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$ {
        root ${INSTALL_DIR}/frontend/dist;
        expires 30d;
        add_header Cache-Control "public, immutable";
    }

    add_header X-Frame-Options "SAMEORIGIN";
    add_header X-Content-Type-Options "nosniff";
    add_header X-XSS-Protection "1; mode=block";
    add_header Referrer-Policy "strict-origin-when-cross-origin";
}
EOF

  if [[ -d /etc/nginx/sites-enabled ]]; then
    ln -sf /etc/nginx/sites-available/katashie-bot /etc/nginx/sites-enabled/ 2>/dev/null || true
    rm -f /etc/nginx/sites-enabled/default 2>/dev/null || true
  fi

  # Vérification de la syntaxe Nginx
  nginx -t >> "$LOG_FILE" 2>&1 || error "La configuration Nginx est invalide."

  # Activation puis redémarrage (ordre plus propre)
  systemctl enable nginx >> "$LOG_FILE" 2>&1
  systemctl restart nginx >> "$LOG_FILE" 2>&1
  log "Nginx configuré, activé et redémarré"
}

# ── Démarrage des services ────────────────────────────────────

start_services() {
  section "Démarrage des services"

  info "Démarrage du service systemd..."
  systemctl start katashie-bot >> "$LOG_FILE" 2>&1
  sleep 5

  if systemctl is-active --quiet katashie-bot; then
    log "Service KATASHIE BOT démarré avec succès"
  else
    warn "Le service n’a pas démarré correctement. Vérifiez les logs avec : journalctl -u katashie-bot -n 50"
    exit 1
  fi
}

# ── Résumé final ──────────────────────────────────────────────

print_summary() {
  echo ""
  echo -e "  ${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
  echo -e "  ${GREEN}${BOLD}  INSTALLATION TERMINÉE AVEC SUCCÈS !${NC}"
  echo -e "  ${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
  echo ""
  echo -e "  ${WHITE}${BOLD}Informations de connexion :${NC}"
  echo -e "  ${CYAN}→${NC} URL           : ${WHITE}https://${APP_DOMAIN}${NC}"
  echo -e "  ${CYAN}→${NC} Admin Email   : ${WHITE}${ADMIN_EMAIL}${NC}"
  echo -e "  ${CYAN}→${NC} Admin Mdp     : ${WHITE}${ADMIN_PASSWORD}${NC}"
  echo -e "  ${CYAN}→${NC} Admin Panel   : ${WHITE}https://${APP_DOMAIN}/admin${NC}"
  echo ""
  echo -e "  ${WHITE}${BOLD}Commandes utiles :${NC}"
  echo -e "  ${CYAN}→${NC} Démarrer   : ${WHITE}systemctl start katashie-bot${NC}"
  echo -e "  ${CYAN}→${NC} Arrêter    : ${WHITE}systemctl stop katashie-bot${NC}"
  echo -e "  ${CYAN}→${NC} Logs       : ${WHITE}journalctl -u katashie-bot -f${NC}"
  echo -e "  ${CYAN}→${NC} Mettre à j : ${WHITE}bash ${INSTALL_DIR}/update.sh${NC}"
  echo ""
  echo -e "  ${YELLOW}⚠️  Notez ces informations — elles ne seront plus affichées.${NC}"
  echo -e "  ${YELLOW}⚠️  Changez le mot de passe admin après la première connexion.${NC}"
  echo ""
  echo -e "  ${GREEN}Support WhatsApp : https://wa.me/237682229367${NC}"
  echo ""
}

# ── Programme principal───────────────────────────────────────

parse_args "$@"

# Création du répertoire de logs
mkdir -p "$(dirname "$LOG_FILE")"
echo "" > "$LOG_FILE"
echo "Installation KATASHIE BOT — $(date)" >> "$LOG_FILE"

clear
print_banner

if [[ "$REPAIR_MODE" == true ]]; then
  warn "Mode réparation activé : le script tentera de reprendre l’installation existante."
fi

# Étape 1 : Vérifications initiales
check_root
check_os

# Étape 2 : Configuration interactive (domaine, port, identifiants)
collect_config

# Étape 3 : Vérification du port choisi pour le backend
check_ports

# Étape 4 : Installation des prérequis système
install_dependencies
install_nodejs
install_nginx
install_certbot

# Étape 5 : Copie des sources du projet
clone_repository

# Étape 6 : Création du fichier .env avec HTTPS
create_env_file

# Étape 7 : Création de l'utilisateur système (avant compilation pour les permissions)
create_system_user

# Étape 8 : Compilation et installation de l'application (backend, frontend, base)
install_app

# Étape 9 : Mise en place du service systemd
create_systemd_service

# Étape 10 : Configuration de Nginx
configure_nginx

# Étape 11 : Démarrage du service et vérification
start_services

# Étape 12 : Affichage du résumé final
print_summary

echo "  Log complet : $LOG_FILE"