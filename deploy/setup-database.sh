#!/usr/bin/env bash
set -euo pipefail

echo "==> Setup base de datos PostgreSQL para Huella de soporte"

if ! command -v psql >/dev/null 2>&1; then
  echo "==> Instalando PostgreSQL..."
  apt-get update
  apt-get install -y --no-install-recommends postgresql postgresql-contrib
fi

echo "==> Ajustando autenticación..."
PG_HBA=$(find /etc/postgresql -name pg_hba.conf | head -n1 || true)
if [ -n "${PG_HBA}" ]; then
  sed -i 's/^local\s\+all\s\+all\s\+.*/local   all             all                                     trust/' "${PG_HBA}" || true
  sed -i 's/^host\s\+all\s\+all\s\+127.0.0.1\/32\s\+.*/host    all             all             127.0.0.1\/32            trust/' "${PG_HBA}" || true
  systemctl restart postgresql || true
fi

echo "==> Creando usuario y base de datos..."
su - postgres -c "psql -v ON_ERROR_STOP=1 <<'SQL'
DO $$
BEGIN
   IF NOT EXISTS (SELECT FROM pg_roles WHERE rolname = 'support') THEN
      CREATE ROLE support LOGIN PASSWORD 'support';
   END IF;
END
$$;

DO $$
BEGIN
   IF NOT EXISTS (SELECT FROM pg_database WHERE datname = 'support_desk') THEN
      CREATE DATABASE support_desk OWNER support;
   END IF;
END
$$;

GRANT ALL PRIVILEGES ON DATABASE support_desk TO support;
SQL
"

echo "==> Base de datos lista."
echo "Host recomendado para backend/.env: localhost"
echo "Puerto: 5432"
echo "Usuario: support"
echo "Base: support_desk"
