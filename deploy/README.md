# Despliegue en producción - Ubuntu 24.04 LTS

## 1) Requisitos del servidor
- Ubuntu 24.04 LTS actualizado
- Acceso root o sudo
- Dominio público apuntando al servidor
- Puertos 80 y 443 abiertos

## 2) Variables que debés definir

En `backend/.env`:
- `NODE_ENV=production`
- `JWT_SECRET`: secreto aleatorio largo
- `CORS_ORIGIN`: tu dominio, ej: `https://soporte.tu-empresa.com`
- `DB_CLIENT=postgres`
- `DB_HOST=localhost`
- `DB_PORT=5432`
- `DB_USER=support`
- `DB_PASSWORD=support`
- `DB_NAME=support_desk`
- `SERVICENOW_BASE_URL`: si aplica
- `ENABLE_SEED=false`

## 3) Instalación automática sugerida

```bash
# Como root
bash deploy/setup-ubuntu.sh
bash deploy/setup-database.sh
```

Eso instala: Node.js 20, pnpm, nginx, certbot, git, PostgreSQL y crea el usuario `support` con su base `support_desk`.

## 4) Configuración

### 4.1 Repositorio
```bash
git clone git@github.com:tu-org/tu-repo.git /opt/support-desk
cd /opt/support-desk
```

### 4.2 Backend .env
```bash
cp backend/.env.example backend/.env
nano backend/.env
```

Cambiá el `JWT_SECRET` por uno seguro y ajustá `CORS_ORIGIN` a tu dominio.

### 4.3 Nginx
```bash
cp deploy/nginx/support.conf /etc/nginx/sites-available/support.conf
ln -sf /etc/nginx/sites-available/support.conf /etc/nginx/sites-enabled/support.conf
nginx -t && systemctl reload nginx
```

Recordá cambiar `tu-dominio.com` en `support.conf`.

### 4.4 Systemd
```bash
cp deploy/support-backend.service /etc/systemd/system/support-backend.service
systemctl daemon-reload
systemctl enable --now support-backend
```

## 5) Build y primer deploy

```bash
cd /opt/support-desk
bash deploy/deploy.sh main
```

## 6) HTTPS

```bash
certbot --nginx -d tu-dominio.com -d www.tu-dominio.com
```

## 7) Mantenimiento

```bash
# Logs
journalctl -u support-backend -f
tail -f /var/log/nginx/support-error.log

# Reiniciar backend
systemctl restart support-backend
```
