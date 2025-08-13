# 🐧 Guía de Despliegue Dashboard Clínica - Servidor Linux

Guía completa para desplegar Dashboard Clínica en servidor Linux propio con Docker e integración GitHub.

## 📋 Requisitos del Servidor

### Especificaciones Mínimas
- **OS**: Ubuntu 20.04 LTS o superior / CentOS 7+ / Debian 11+
- **RAM**: 4GB mínimo (8GB recomendado)
- **CPU**: 2 cores mínimo (4 cores recomendado)
- **Disco**: 20GB libres mínimo (50GB recomendado)
- **Red**: Conexión estable a internet

### Puertos Requeridos
- **60521**: Frontend Cliente (React)
- **60522**: Backend API (FastAPI)
- **60523**: Admin Frontend (React)
- **60516**: MongoDB (existente)
- **22**: SSH (para administración)
- **80/443**: HTTP/HTTPS (opcional con proxy)

---

## 🚀 Paso 1: Preparación del Servidor

### 1.1 Conectar al Servidor
```bash
# Conectar vía SSH
ssh usuario@tu-servidor-ip

# O con clave SSH
ssh -i ~/.ssh/tu_clave_privada usuario@tu-servidor-ip
```

### 1.2 Actualizar Sistema
```bash
# Ubuntu/Debian
sudo apt update && sudo apt upgrade -y
sudo apt install -y curl wget git nano htop

# CentOS/RHEL
sudo yum update -y
sudo yum install -y curl wget git nano htop
```

### 1.3 Instalar Docker
```bash
# Ubuntu/Debian - Instalar Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh

# Agregar usuario al grupo docker
sudo usermod -aG docker $USER

# CentOS/RHEL - Instalar Docker
sudo yum install -y yum-utils
sudo yum-config-manager --add-repo https://download.docker.com/linux/centos/docker-ce.repo
sudo yum install -y docker-ce docker-ce-cli containerd.io
sudo systemctl start docker
sudo systemctl enable docker
sudo usermod -aG docker $USER
```

### 1.4 Instalar Docker Compose
```bash
# Instalar Docker Compose
sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose

# Verificar instalación
docker --version
docker-compose --version
```

### 1.5 Configurar Firewall
```bash
# Ubuntu/Debian (UFW)
sudo ufw enable
sudo ufw allow ssh
sudo ufw allow 60521
sudo ufw allow 60522
sudo ufw allow 60523
sudo ufw allow 60516
sudo ufw status

# CentOS/RHEL (firewalld)
sudo systemctl start firewalld
sudo systemctl enable firewalld
sudo firewall-cmd --permanent --add-port=22/tcp
sudo firewall-cmd --permanent --add-port=60521/tcp
sudo firewall-cmd --permanent --add-port=60522/tcp
sudo firewall-cmd --permanent --add-port=60523/tcp
sudo firewall-cmd --permanent --add-port=60516/tcp
sudo firewall-cmd --reload
```

---

## 🔧 Paso 2: Configurar GitHub SSH

### 2.1 Generar Clave SSH (si no tienes)
```bash
# Generar nueva clave SSH
ssh-keygen -t rsa -b 4096 -C "tu-email@ejemplo.com"

# Presiona Enter para ubicación por defecto
# Agrega passphrase opcional

# Mostrar clave pública
cat ~/.ssh/id_rsa.pub
```

### 2.2 Configurar GitHub
```bash
# Agregar clave SSH a GitHub:
# 1. Copia el contenido de ~/.ssh/id_rsa.pub
# 2. Ve a GitHub.com → Settings → SSH and GPG keys
# 3. Click "New SSH key"
# 4. Pega la clave y guarda

# Verificar conexión
ssh -T git@github.com
```

---

## 📦 Paso 3: Descargar e Instalar Proyecto

### 3.1 Clonar Repositorio
```bash
# Crear directorio de aplicaciones
sudo mkdir -p /opt/dashboard-clinica
sudo chown $USER:$USER /opt/dashboard-clinica
cd /opt

# Clonar desde GitHub
git clone git@github.com:TU_USUARIO/dashboard-clinica.git
# O con HTTPS si no tienes SSH configurado:
# git clone https://github.com/TU_USUARIO/dashboard-clinica.git

cd dashboard-clinica
```

### 3.2 Configurar Permisos
```bash
# Hacer ejecutables los scripts
chmod +x scripts/*.sh

# Verificar estructura
ls -la
```

---

## ⚙️ Paso 4: Configuración de Producción

### 4.1 Configurar Variables de Entorno
```bash
# Copiar archivo de ejemplo
cp .env.example .env

# Editar configuración de producción
nano .env
```

### 4.2 Configuración .env para Producción
```env
# === CONFIGURACIÓN DE PRODUCCIÓN ===

# Puertos
FRONTEND_CLIENT_PORT=60521
BACKEND_API_PORT=60522
ADMIN_FRONTEND_PORT=60523

# MongoDB (contenedor existente)
MONGODB_URL=mongodb://host.docker.internal:60516/clinic_dashboard_prod

# Seguridad - CAMBIAR ESTOS VALORES
ADMIN_SECRET_KEY=tu-clave-super-secreta-admin-2024
API_SECRET_KEY=tu-clave-api-muy-segura-2024
JWT_SECRET_KEY=tu-jwt-secret-ultra-seguro-2024

# URLs de Producción
VITE_API_URL=http://TU-SERVIDOR-IP:60522
CORS_ORIGINS=["http://TU-SERVIDOR-IP:60521","http://TU-SERVIDOR-IP:60523","https://tu-dominio.com"]

# Configuración de producción
NODE_ENV=production
PYTHONPATH=/app
UVICORN_HOST=0.0.0.0
UVICORN_PORT=60522

# Logging
LOG_LEVEL=INFO
DEBUG=false

# Base de datos
DATABASE_NAME=clinic_dashboard_prod
DATABASE_POOL_SIZE=20

# Seguridad adicional
SECURE_COOKIES=true
SESSION_TIMEOUT=3600
MAX_LOGIN_ATTEMPTS=5

# Rate limiting
RATE_LIMIT_REQUESTS=100
RATE_LIMIT_WINDOW=3600
```

### 4.3 Verificar MongoDB Existente
```bash
# Verificar contenedor MongoDB
docker ps | grep mongo

# Debería mostrar algo como:
# abf54630e862   mongo:7.0   ...   0.0.0.0:60516->27017/tcp

# Si no existe, crear uno nuevo:
# docker run -d --name mongodb \
#   -p 60516:27017 \
#   -v mongodb_data:/data/db \
#   mongo:7.0
```

---

## 🚀 Paso 5: Despliegue

### 5.1 Construir y Ejecutar
```bash
# Ejecutar en modo producción
./scripts/docker-start.sh production

# Verificar que todo esté funcionando
docker-compose ps
```

### 5.2 Verificar Servicios
```bash
# Verificar logs
docker-compose logs -f

# Verificar conectividad
curl http://localhost:60522/health
curl http://localhost:60521
curl http://localhost:60523
```

### 5.3 Configurar Arranque Automático
```bash
# Crear servicio systemd
sudo nano /etc/systemd/system/dashboard-clinica.service
```

```ini
[Unit]
Description=Dashboard Clinica Docker Services
Requires=docker.service
After=docker.service

[Service]
Type=oneshot
RemainAfterExit=yes
WorkingDirectory=/opt/dashboard-clinica
ExecStart=/opt/dashboard-clinica/scripts/docker-start.sh production
ExecStop=/opt/dashboard-clinica/scripts/docker-stop.sh
TimeoutStartSec=0
User=root

[Install]
WantedBy=multi-user.target
```

```bash
# Habilitar servicio
sudo systemctl daemon-reload
sudo systemctl enable dashboard-clinica.service
sudo systemctl start dashboard-clinica.service

# Verificar estado
sudo systemctl status dashboard-clinica.service
```

---

## 🔒 Paso 6: Configuración de Seguridad

### 6.1 Configurar SSL (Opcional)
```bash
# Instalar Nginx como proxy reverso
sudo apt install nginx -y  # Ubuntu/Debian
# sudo yum install nginx -y  # CentOS

# Configurar Nginx
sudo nano /etc/nginx/sites-available/dashboard-clinica
```

```nginx
server {
    listen 80;
    server_name tu-dominio.com;

    # Frontend Cliente
    location / {
        proxy_pass http://localhost:60521;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    # Backend API
    location /api/ {
        proxy_pass http://localhost:60522/;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    # Admin Frontend
    location /admin/ {
        proxy_pass http://localhost:60523/;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

```bash
# Habilitar sitio
sudo ln -s /etc/nginx/sites-available/dashboard-clinica /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx
sudo systemctl enable nginx
```

### 6.2 Configurar Certificado SSL
```bash
# Instalar Certbot
sudo apt install certbot python3-certbot-nginx -y

# Obtener certificado
sudo certbot --nginx -d tu-dominio.com

# Verificar renovación automática
sudo certbot renew --dry-run
```

### 6.3 Hardening Adicional
```bash
# Configurar fail2ban
sudo apt install fail2ban -y

# Configurar SSH más seguro
sudo nano /etc/ssh/sshd_config
```

```
# Cambios recomendados en sshd_config:
PermitRootLogin no
PasswordAuthentication no
PubkeyAuthentication yes
Port 2222  # Cambiar puerto SSH
MaxAuthTries 3
ClientAliveInterval 300
ClientAliveCountMax 2
```

```bash
# Reiniciar SSH
sudo systemctl restart sshd
```

---

## 📊 Paso 7: Monitoreo y Mantenimiento

### 7.1 Scripts de Mantenimiento
```bash
# Crear script de backup
nano /opt/dashboard-clinica/scripts/backup.sh
```

```bash
#!/bin/bash
BACKUP_DIR="/opt/backups/dashboard-clinica"
DATE=$(date +%Y%m%d_%H%M%S)

mkdir -p $BACKUP_DIR

# Backup de archivos de configuración
tar -czf $BACKUP_DIR/config_$DATE.tar.gz .env docker-compose.yml

# Backup de base de datos
docker exec mongodb mongodump --out /tmp/backup_$DATE
docker cp mongodb:/tmp/backup_$DATE $BACKUP_DIR/

echo "Backup completado: $DATE"
```

```bash
chmod +x /opt/dashboard-clinica/scripts/backup.sh

# Programar backup diario
crontab -e
# Agregar: 0 2 * * * /opt/dashboard-clinica/scripts/backup.sh
```

### 7.2 Logs y Monitoreo
```bash
# Ver logs en tiempo real
docker-compose logs -f

# Ver logs específicos
docker-compose logs backend-api
docker-compose logs frontend-client

# Monitorear recursos
docker stats

# Verificar salud de servicios
watch docker-compose ps
```

### 7.3 Comandos de Mantenimiento
```bash
# Actualizar desde GitHub
cd /opt/dashboard-clinica
git pull origin main
./scripts/docker-stop.sh
./scripts/docker-start.sh production

# Limpiar imágenes viejas
docker system prune -a -f

# Verificar espacio en disco
df -h
docker system df
```

---

## 🔄 Paso 8: Actualizaciones y CI/CD

### 8.1 Script de Actualización Automática
```bash
# Crear script de actualización
nano /opt/dashboard-clinica/scripts/update.sh
```

```bash
#!/bin/bash
set -e

LOG_FILE="/var/log/dashboard-clinica-update.log"
cd /opt/dashboard-clinica

echo "$(date): Iniciando actualización" >> $LOG_FILE

# Backup antes de actualizar
./scripts/backup.sh

# Detener servicios
./scripts/docker-stop.sh

# Actualizar código
git pull origin main

# Reconstruir y reiniciar
./scripts/docker-start.sh production

echo "$(date): Actualización completada" >> $LOG_FILE
```

```bash
chmod +x /opt/dashboard-clinica/scripts/update.sh
```

### 8.2 Webhook para Actualizaciones Automáticas (Opcional)
```bash
# Instalar webhook listener
sudo apt install webhook -y

# Configurar webhook
nano /opt/dashboard-clinica/hooks.json
```

```json
[
  {
    "id": "dashboard-clinica-update",
    "execute-command": "/opt/dashboard-clinica/scripts/update.sh",
    "command-working-directory": "/opt/dashboard-clinica",
    "response-message": "Updating Dashboard Clinica...",
    "trigger-rule": {
      "match": {
        "type": "payload-hash-sha1",
        "secret": "tu-webhook-secret",
        "parameter": {
          "source": "header",
          "name": "X-Hub-Signature"
        }
      }
    }
  }
]
```

---

## 🆘 Resolución de Problemas

### Problemas Comunes

#### 1. Servicios No Inician
```bash
# Verificar logs
docker-compose logs

# Verificar puertos ocupados
netstat -tulpn | grep -E '60521|60522|60523'

# Reiniciar Docker
sudo systemctl restart docker
```

#### 2. MongoDB No Conecta
```bash
# Verificar contenedor MongoDB
docker ps | grep mongo

# Verificar conectividad
telnet localhost 60516

# Reiniciar MongoDB si es necesario
docker restart mongodb
```

#### 3. Problemas de Permisos
```bash
# Verificar permisos de archivos
ls -la /opt/dashboard-clinica

# Corregir permisos
sudo chown -R $USER:$USER /opt/dashboard-clinica
chmod +x scripts/*.sh
```

#### 4. Falta de Memoria
```bash
# Verificar uso de memoria
free -h
docker stats

# Limpiar recursos no utilizados
docker system prune -a -f
```

#### 5. Problemas de Red
```bash
# Verificar conectividad de containers
docker network ls
docker network inspect dashboard-clinica_default

# Reiniciar red de Docker
docker network prune -f
```

### Comandos de Diagnóstico
```bash
# Estado completo del sistema
./scripts/docker-start.sh production
docker-compose ps
docker-compose logs --tail=50
curl -f http://localhost:60522/health
curl -f http://localhost:60521
netstat -tulpn | grep -E '60521|60522|60523'
systemctl status docker
df -h
free -h
```

---

## 📱 URLs de Acceso Final

Una vez completado el despliegue:

- **Frontend Cliente**: `http://TU-SERVIDOR-IP:60521`
- **Backend API**: `http://TU-SERVIDOR-IP:60522`
- **Admin Panel**: `http://TU-SERVIDOR-IP:60523`
- **API Docs**: `http://TU-SERVIDOR-IP:60522/docs`

Con SSL configurado:
- **Frontend Cliente**: `https://tu-dominio.com`
- **Backend API**: `https://tu-dominio.com/api`
- **Admin Panel**: `https://tu-dominio.com/admin`

---

## 📞 Soporte y Mantenimiento

### Comandos de Diagnóstico Rápido
```bash
# Script de estado completo
echo "=== ESTADO DASHBOARD CLÍNICA ===" 
echo "Contenedores:"
docker-compose ps
echo -e "\nServicios activos:"
netstat -tulpn | grep -E '60521|60522|60523|60516'
echo -e "\nEspacio en disco:"
df -h | grep -E '/$|/opt'
echo -e "\nMemoria:"
free -h
echo -e "\nUltimas líneas de log:"
docker-compose logs --tail=10
```

### Contacto de Emergencia
Para problemas críticos:
1. Revisar logs: `docker-compose logs -f`
2. Verificar servicios: `docker-compose ps`
3. Reiniciar servicios: `./scripts/docker-stop.sh && ./scripts/docker-start.sh production`
4. Backup de emergencia: `./scripts/backup.sh`

---

**¡Dashboard Clínica desplegado exitosamente en producción! 🏥🚀**