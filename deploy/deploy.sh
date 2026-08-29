#!/usr/bin/env bash
set -euo pipefail

APP_DIR="/opt/support-desk"
REPO_URL="git@github.com:tu-org/tu-repo.git"
BRANCH="${1:-main}"
USER="support"
NGINX_CONF="/etc/nginx/sites-available/support.conf"
NGINX_ENABLED="/etc/nginx/sites-enabled/support.conf"

echo "==> Despliegue Huella de soporte - Rama: ${BRANCH}"

if [ ! -d "${APP_DIR}/.git" ]; then
  echo "==> Clonando repositorio..."
  git clone "${REPO_URL}" "${APP_DIR}"
else
  echo "==> Actualizando repositorio..."
  git -C "${APP_DIR}" fetch origin
  git -C "${APP_DIR}" checkout "${BRANCH}"
  git -C "${APP_DIR}" pull origin "${BRANCH}"
fi

echo "==> Instalando dependencias backend..."
cd "${APP_DIR}/backend"
sudo -u "${USER}" pnpm install --frozen-lockfile=false
sudo -u "${USER}" pnpm build

echo "==> Instalando dependencias frontend..."
cd "${APP_DIR}/frontend"
sudo -u "${USER}" pnpm install --frozen-lockfile=false
sudo -u "${USER}" pnpm build

echo "==> Asegurando permisos..."
mkdir -p /var/log/support-desk
chown -R "${USER}:${USER}" "${APP_DIR}"
chown -R "${USER}:${USER}" /var/log/support-desk

echo "==> Recargando servicios..."
systemctl daemon-reload
systemctl restart support-backend
systemctl enable support-backend --now

echo "==> Verificando nginx..."
if [ -f "${NGINX_CONF}" ]; then
  nginx -t
  systemctl reload nginx
else
  echo "Aviso: falta copiar ${NGINX_CONF} y habilitarlo con ln -s"
fi

echo "==> Despliegue finalizado."
echo "Backend: http://127.0.0.1:3000/api/health"
echo "Frontend: http://127.0.0.1"
