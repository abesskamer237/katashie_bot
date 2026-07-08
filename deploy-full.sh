#!/usr/bin/env bash
set -euo pipefail

DOMAIN="${1:-katashie.pagnol.xyz}"
REPO_URL="${REPO_URL:-https://github.com/abesskamer237/katashie_bot.git}"
APP_DIR="${APP_DIR:-/var/www/katashie-bot}"
APP_USER="${APP_USER:-$(logname 2>/dev/null || whoami)}"
ADMIN_EMAIL="${ADMIN_EMAIL:-admin@katashie.com}"
ADMIN_PASSWORD="${ADMIN_PASSWORD:-Admin@123456}"
ADMIN_USERNAME="${ADMIN_USERNAME:-admin}"

if [ "$EUID" -ne 0 ]; then
  echo "Exécutez ce script en root : sudo bash deploy-full.sh $DOMAIN"
  exit 1
fi

export DEBIAN_FRONTEND=noninteractive

apt-get update
apt-get install -y ca-certificates curl gnupg lsb-release git nginx ufw certbot python3-certbot-nginx

install -m 0755 -d /etc/apt/keyrings
if [ ! -f /etc/apt/keyrings/docker.gpg ]; then
  curl -fsSL https://download.docker.com/linux/ubuntu/gpg | gpg --dearmor -o /etc/apt/keyrings/docker.gpg
fi
cat >/etc/apt/sources.list.d/docker.list <<EOF
deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.gpg] https://download.docker.com/linux/ubuntu $(. /etc/os-release && echo "\$VERSION_CODENAME") stable
EOF

apt-get update
apt-get install -y docker-ce docker-ce-cli containerd.io docker-compose-plugin
systemctl enable docker
systemctl start docker
usermod -aG docker "$APP_USER" || true

ufw --force reset
ufw default deny incoming
ufw default allow outgoing
ufw allow OpenSSH
ufw allow 'Nginx Full'
ufw --force enable

mkdir -p /var/www
if [ ! -d "$APP_DIR/.git" ]; then
  rm -rf "$APP_DIR"
  git clone "$REPO_URL" "$APP_DIR"
else
  cd "$APP_DIR"
  git pull --ff-only || true
fi

cd "$APP_DIR"
if [ ! -f .env ]; then
  cp .env.example .env
fi

sed -i "s|^APP_URL=.*|APP_URL=https://$DOMAIN|" .env
sed -i 's|^JWT_SECRET=.*|JWT_SECRET=changez_ce_secret_tres_long_et_aleatoire_minimum_64_chars|' .env
sed -i 's|^JWT_REFRESH_SECRET=.*|JWT_REFRESH_SECRET=changez_ce_secret_refresh_tres_long_et_aleatoire_64_chars|' .env
sed -i 's|^SESSION_SECRET=.*|SESSION_SECRET=changez_ce_secret_de_session_tres_long|' .env
sed -i "s|^ADMIN_EMAIL=.*|ADMIN_EMAIL=$ADMIN_EMAIL|" .env
sed -i "s|^ADMIN_PASSWORD=.*|ADMIN_PASSWORD=$ADMIN_PASSWORD|" .env
sed -i "s|^ADMIN_USERNAME=.*|ADMIN_USERNAME=$ADMIN_USERNAME|" .env

cat >/etc/nginx/sites-available/katashie <<EOF
server {
    listen 80;
    server_name $DOMAIN;
    client_max_body_size 50M;

    location / {
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection "upgrade";
    }
}
EOF

ln -sf /etc/nginx/sites-available/katashie /etc/nginx/sites-enabled/katashie
rm -f /etc/nginx/sites-enabled/default
nginx -t
systemctl reload nginx

chown -R "$APP_USER:$APP_USER" "$APP_DIR"
docker compose -f "$APP_DIR/docker-compose.yml" up -d --build

if command -v certbot >/dev/null 2>&1; then
  certbot --nginx -d "$DOMAIN" --non-interactive --agree-tos -m "$ADMIN_EMAIL" || true
fi

echo ""
echo "Déploiement terminé."
echo "Vérifiez :"
echo "  curl http://127.0.0.1:3000/api/health"
echo "  curl https://$DOMAIN/api/health"
