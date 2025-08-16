# 🚀 Production Deployment Guide

Guía completa para implementar el sistema en servidor de producción.

## 📋 Pre-requisitos en el Servidor

### Sistema Base
```bash
# Ubuntu/Debian
sudo apt update && sudo apt upgrade -y
sudo apt install -y curl wget git python3 python3-pip python3-venv nodejs npm

# CentOS/RHEL
sudo yum update -y
sudo yum install -y curl wget git python3 python3-pip nodejs npm
```

### Docker (Recomendado)
```bash
# Instalar Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh
sudo usermod -aG docker $USER

# Instalar Docker Compose
sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose

# Reiniciar sesión para aplicar cambios
logout
```

### MongoDB (Si no usa Docker)
```bash
# Ubuntu/Debian
wget -qO - https://www.mongodb.org/static/pgp/server-7.0.asc | sudo apt-key add -
echo "deb [ arch=amd64,arm64 ] https://repo.mongodb.org/apt/ubuntu jammy/mongodb-org/7.0 multiverse" | sudo tee /etc/apt/sources.list.d/mongodb-org-7.0.list
sudo apt update
sudo apt install -y mongodb-org
sudo systemctl start mongod
sudo systemctl enable mongod
```

## 🌐 Deployment en Servidor

### Option 1: Docker Deployment (Recomendado)

```bash
# 1. Clonar el repositorio
git clone <your-repo-url>
cd dashboard-clinica

# 2. Configurar variables de producción
cp clinic-admin-backend/.env.example clinic-admin-backend/.env
nano clinic-admin-backend/.env

# Variables críticas:
# MONGODB_URL=mongodb://admin:your-password@localhost:27017/clinic_admin?authSource=admin
# JWT_SECRET_KEY=your-super-secret-production-key-minimum-32-chars
# API_KEY_PROD=your-production-api-key
# ADMIN_PASSWORD=your-secure-admin-password
# ENVIRONMENT=production

# 3. Construir y iniciar servicios
cd clinic-admin-backend
chmod +x scripts/start-admin.sh
./scripts/start-admin.sh

# 4. Verificar deployment
curl http://localhost:8000/health
curl http://localhost:8000/admin
```

### Option 2: Standalone Deployment

```bash
# 1. Clonar repositorio
git clone <your-repo-url>
cd dashboard-clinica/clinic-admin-backend

# 2. Crear entorno virtual
python3 -m venv venv
source venv/bin/activate

# 3. Instalar dependencias Python
pip install -r requirements.txt

# 4. Instalar dependencias Node.js y compilar frontend
cd frontend-admin
npm install
npm run build
cd ..

# 5. Copiar frontend compilado
rm -rf static/admin
mkdir -p static/admin
cp -r frontend-admin/dist/* static/admin/

# 6. Configurar variables de entorno
export MONGODB_URL="mongodb://localhost:27017/clinic_admin"
export JWT_SECRET_KEY="your-super-secret-production-key"
export API_KEY_PROD="your-production-api-key"
export ADMIN_PASSWORD="your-secure-admin-password"
export ENVIRONMENT="production"

# 7. Iniciar servidor
python -m uvicorn main:app --host 0.0.0.0 --port 8000
```

### Option 3: Systemd Service (Producción)

```bash
# 1. Crear archivo de servicio
sudo nano /etc/systemd/system/clinic-admin.service

[Unit]
Description=Clinic Admin Backend
After=network.target mongod.service

[Service]
Type=simple
User=www-data
WorkingDirectory=/var/www/clinic-admin
Environment=PATH=/var/www/clinic-admin/venv/bin
Environment=MONGODB_URL=mongodb://localhost:27017/clinic_admin
Environment=JWT_SECRET_KEY=your-super-secret-production-key
Environment=API_KEY_PROD=your-production-api-key
Environment=ADMIN_PASSWORD=your-secure-admin-password
Environment=ENVIRONMENT=production
ExecStart=/var/www/clinic-admin/venv/bin/python -m uvicorn main:app --host 0.0.0.0 --port 8000
Restart=always

[Install]
WantedBy=multi-user.target

# 2. Activar servicio
sudo systemctl daemon-reload
sudo systemctl enable clinic-admin
sudo systemctl start clinic-admin
sudo systemctl status clinic-admin
```

## 🔧 Nginx Reverse Proxy

```bash
# Instalar Nginx
sudo apt install nginx

# Configurar site
sudo nano /etc/nginx/sites-available/clinic-admin

server {
    listen 80;
    server_name your-domain.com;

    location / {
        proxy_pass http://localhost:8000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    location /admin {
        proxy_pass http://localhost:8000/admin;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    location /api {
        proxy_pass http://localhost:8000/api;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}

# Activar site
sudo ln -s /etc/nginx/sites-available/clinic-admin /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx
```

## 🔒 SSL con Let's Encrypt

```bash
# Instalar Certbot
sudo apt install certbot python3-certbot-nginx

# Obtener certificado
sudo certbot --nginx -d your-domain.com

# Verificar renovación automática
sudo certbot renew --dry-run
```

## 🔐 Seguridad en Producción

### Firewall
```bash
# UFW (Ubuntu)
sudo ufw allow ssh
sudo ufw allow 80
sudo ufw allow 443
sudo ufw enable

# Bloquear puerto 8000 directo
sudo ufw deny 8000
```

### MongoDB Security
```bash
# Crear usuario admin
mongo
use admin
db.createUser({
  user: "admin",
  pwd: "your-secure-password",
  roles: ["userAdminAnyDatabase", "dbAdminAnyDatabase"]
})

# Editar configuración
sudo nano /etc/mongod.conf
# Descomentar:
security:
  authorization: enabled

sudo systemctl restart mongod
```

### Environment Variables
```bash
# Crear archivo .env seguro
sudo nano /var/www/clinic-admin/.env

MONGODB_URL=mongodb://admin:secure-password@localhost:27017/clinic_admin?authSource=admin
JWT_SECRET_KEY=your-super-secret-production-key-minimum-32-characters-long
API_KEY_PROD=your-production-api-key-complex-and-unique
ADMIN_USERNAME=admin
ADMIN_PASSWORD=your-secure-admin-password
ENVIRONMENT=production
DEBUG=false
ALLOWED_ORIGINS=https://your-domain.com

# Proteger archivo
sudo chmod 600 /var/www/clinic-admin/.env
sudo chown www-data:www-data /var/www/clinic-admin/.env
```

## 📊 Monitoreo

### Health Checks
```bash
# Script de monitoreo
cat > /usr/local/bin/clinic-health-check.sh << 'EOF'
#!/bin/bash
HEALTH=$(curl -s http://localhost:8000/health | jq -r '.status')
if [ "$HEALTH" != "healthy" ]; then
    echo "$(date): Clinic Admin not healthy" >> /var/log/clinic-admin-health.log
    systemctl restart clinic-admin
fi
EOF

chmod +x /usr/local/bin/clinic-health-check.sh

# Cron para monitoreo cada 5 minutos
echo "*/5 * * * * /usr/local/bin/clinic-health-check.sh" | sudo crontab -
```

### Logs
```bash
# Ver logs del servicio
sudo journalctl -u clinic-admin -f

# Logs de Nginx
sudo tail -f /var/log/nginx/access.log
sudo tail -f /var/log/nginx/error.log

# Logs de MongoDB
sudo tail -f /var/log/mongodb/mongod.log
```

## 🔄 Updates & Maintenance

### Update Script
```bash
# Crear script de actualización
cat > /usr/local/bin/clinic-update.sh << 'EOF'
#!/bin/bash
set -e

echo "🔄 Actualizando Clinic Admin System..."

# Backup
cd /var/www/clinic-admin
sudo -u www-data git stash
sudo -u www-data git pull origin main

# Build frontend
cd frontend-admin
sudo -u www-data npm install
sudo -u www-data npm run build
cd ..

# Update backend
sudo -u www-data pip install -r requirements.txt

# Copy frontend
sudo rm -rf static/admin
sudo mkdir -p static/admin
sudo cp -r frontend-admin/dist/* static/admin/
sudo chown -R www-data:www-data static/admin

# Restart service
sudo systemctl restart clinic-admin

echo "✅ Actualización completada"
EOF

chmod +x /usr/local/bin/clinic-update.sh
```

### Backup Script
```bash
# Script de backup
cat > /usr/local/bin/clinic-backup.sh << 'EOF'
#!/bin/bash
DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_DIR="/var/backups/clinic-admin"

mkdir -p $BACKUP_DIR

# Backup MongoDB
mongodump --out $BACKUP_DIR/mongodb_$DATE

# Backup code
tar -czf $BACKUP_DIR/code_$DATE.tar.gz -C /var/www clinic-admin

# Cleanup old backups (keep last 7 days)
find $BACKUP_DIR -name "*.tar.gz" -mtime +7 -delete
find $BACKUP_DIR -name "mongodb_*" -mtime +7 -exec rm -rf {} \;

echo "✅ Backup completado: $DATE"
EOF

chmod +x /usr/local/bin/clinic-backup.sh

# Backup automático diario
echo "0 2 * * * /usr/local/bin/clinic-backup.sh" | sudo crontab -
```

## 🌐 Acceso Post-Deployment

### URLs de Producción
```
🏠 Homepage:        https://your-domain.com
🖥️  Admin Dashboard: https://your-domain.com/admin
🔧 API Backend:     https://your-domain.com/api
📚 API Docs:        https://your-domain.com/docs
💚 Health Check:    https://your-domain.com/health
```

### Credenciales por Defecto
```
🔐 Admin Login:
   URL: https://your-domain.com/admin
   Usuario: admin
   Contraseña: [configurada en variables de entorno]
```

### Verificación Post-Deployment
```bash
# Health check
curl https://your-domain.com/health

# Admin access
curl -I https://your-domain.com/admin

# API access
curl https://your-domain.com/api/info

# Database connection
curl https://your-domain.com/api/admin/dashboard/stats \
  -H "Authorization: Bearer YOUR_TOKEN"
```

## 🚨 Troubleshooting

### Problemas Comunes
```bash
# Puerto 8000 ocupado
sudo lsof -i :8000
sudo kill -9 <PID>

# MongoDB no conecta
sudo systemctl status mongod
sudo systemctl restart mongod

# Permisos de archivos
sudo chown -R www-data:www-data /var/www/clinic-admin
sudo chmod -R 755 /var/www/clinic-admin

# Logs de errores
sudo journalctl -u clinic-admin -n 50
```

---

## ✅ Checklist de Producción

- [ ] Servidor preparado con dependencias
- [ ] Docker instalado y funcionando
- [ ] MongoDB configurado con autenticación
- [ ] Variables de entorno configuradas
- [ ] SSL certificado instalado
- [ ] Firewall configurado
- [ ] Monitoreo activado
- [ ] Backups programados
- [ ] Health checks funcionando
- [ ] Admin dashboard accesible
- [ ] API endpoints funcionando
- [ ] ApiDocumentationModal operativo

**🎉 Sistema listo para producción con máxima seguridad y monitoreo**