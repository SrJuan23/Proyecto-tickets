#!/usr/bin/env bash
set -euo pipefail

echo "==> Huella de soporte - Setup servidor Ubuntu 24.04"
echo "==> Este script prepara el sistema para despliegue productivo."
echo ""

if [ "$(id -u)" -ne 0 ]; then
  echo "Por seguridad, este script debe ejecutarse como root o con sudo."
  exit 1
fi

apt-get update
apt-get install -y --no-install-recommends \
  ca-certificates \
  curl \
  git \
  gnupg \
  lsb-release \
  software-properties-common \
  build-essential \
  python3 \
  make \
  g++ \
  nginx \
  certbot \
  python3-certbot-nginx \
  ufw

echo "==> Instalando Node.js 20.x..."
curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
apt-get install -y nodejs

echo "==> Instalando pnpm..."
npm install -g pnpm

echo "==> Creando usuario de servicio 'support'..."
if ! id -u support >/dev/null 2>&1; then
  useradd --system --create-home --shell /bin/bash support
fi

echo "==> Directorios comunes..."
mkdir -p /opt/support-desk
mkdir -p /var/log/support-desk
chown -R support:support /var/log/support-desk

echo ""
echo "==> Setup básico completado."
echo "==> Ahora tenés que:"
echo "1) Clonar el repo en /opt/support-desk"
echo "2) Configurar backend/.env con JWT_SECRET y DB real"
echo "3) Copiar el unit file de systemd y el vhost de nginx"
