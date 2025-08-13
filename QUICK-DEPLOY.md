# ⚡ Dashboard Clínica - Despliegue Rápido

Comandos paso a paso para desplegar Dashboard Clínica en tu servidor Linux.

## 🚀 Opción 1: Despliegue Automático (Recomendado)

### En tu servidor Linux:

```bash
# 1. Conectar al servidor
ssh usuario@tu-servidor-ip

# 2. Crear directorio y descargar el script
sudo mkdir -p /opt/dashboard-clinica
cd /opt
sudo chown $USER:$USER dashboard-clinica

# 3. Clonar repositorio
git clone https://github.com/TU_USUARIO/dashboard-clinica.git
cd dashboard-clinica

# 4. Ejecutar despliegue automático completo
chmod +x scripts/deploy-server.sh
./scripts/deploy-server.sh setup
```

¡Listo! El script se encarga de todo automáticamente.

---

## 🔧 Opción 2: Despliegue Manual Paso a Paso

### Paso 1: Preparar Servidor
```bash
# Actualizar sistema
sudo apt update && sudo apt upgrade -y
sudo apt install -y curl wget git nano

# Instalar Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh
sudo usermod -aG docker $USER

# Instalar Docker Compose
sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose

# Cerrar sesión y volver a conectar para aplicar cambios de grupo
exit
ssh usuario@tu-servidor-ip
```

### Paso 2: Configurar Firewall
```bash
# Ubuntu/Debian
sudo ufw enable
sudo ufw allow ssh
sudo ufw allow 60521
sudo ufw allow 60522
sudo ufw allow 60523
sudo ufw allow 60516
```

### Paso 3: Descargar Proyecto
```bash
# Crear directorio
sudo mkdir -p /opt/dashboard-clinica
sudo chown $USER:$USER /opt/dashboard-clinica
cd /opt

# Clonar repositorio
git clone https://github.com/TU_USUARIO/dashboard-clinica.git
cd dashboard-clinica
```

### Paso 4: Configurar Variables de Entorno
```bash
# Copiar plantilla
cp .env.example .env

# Editar configuración
nano .env
```

**Variables importantes a cambiar:**
```env
# Cambiar IP del servidor
VITE_API_URL=http://TU-SERVIDOR-IP:60522
CORS_ORIGINS=["http://TU-SERVIDOR-IP:60521","http://TU-SERVIDOR-IP:60523"]

# Cambiar claves secretas
ADMIN_SECRET_KEY=tu-clave-super-secreta-admin-2024
API_SECRET_KEY=tu-clave-api-muy-segura-2024
JWT_SECRET_KEY=tu-jwt-secret-ultra-seguro-2024

# Producción
NODE_ENV=production
```

### Paso 5: Verificar MongoDB
```bash
# Verificar si existe
docker ps | grep mongo

# Si no existe, crear uno:
docker run -d --name mongodb-clinic \
  -p 60516:27017 \
  -v mongodb_clinic_data:/data/db \
  --restart unless-stopped \
  mongo:7.0
```

### Paso 6: Desplegar
```bash
# Hacer ejecutables los scripts
chmod +x scripts/*.sh

# Iniciar en modo producción
./scripts/docker-start.sh production

# Verificar estado
docker-compose ps
```

### Paso 7: Configurar Arranque Automático
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
```

---

## 🔄 Comandos de Actualización

### Actualización Automática
```bash
cd /opt/dashboard-clinica
./scripts/deploy-server.sh update
```

### Actualización Manual
```bash
cd /opt/dashboard-clinica

# Detener servicios
./scripts/docker-stop.sh

# Actualizar código
git pull origin main

# Reiniciar servicios
./scripts/docker-start.sh production
```

---

## 📊 Verificación y Monitoreo

### Verificar Estado
```bash
# Estado de contenedores
docker-compose ps

# Logs en tiempo real
docker-compose logs -f

# Estado del servicio systemd
sudo systemctl status dashboard-clinica
```

### URLs de Acceso
- **Frontend Cliente**: `http://TU-SERVIDOR-IP:60521`
- **Backend API**: `http://TU-SERVIDOR-IP:60522`
- **Admin Panel**: `http://TU-SERVIDOR-IP:60523`
- **API Docs**: `http://TU-SERVIDOR-IP:60522/docs`

---

## 🆘 Solución de Problemas Rápida

### Si los servicios no inician:
```bash
# Ver logs detallados
docker-compose logs

# Verificar puertos
netstat -tulpn | grep -E '60521|60522|60523'

# Reiniciar Docker
sudo systemctl restart docker
./scripts/docker-start.sh production
```

### Si MongoDB no conecta:
```bash
# Verificar contenedor
docker ps | grep mongo

# Crear nuevo si no existe
docker run -d --name mongodb-clinic \
  -p 60516:27017 \
  -v mongodb_clinic_data:/data/db \
  --restart unless-stopped \
  mongo:7.0
```

### Si hay errores de permisos:
```bash
# Corregir permisos
sudo chown -R $USER:$USER /opt/dashboard-clinica
chmod +x scripts/*.sh
```

---

## 📱 Resultado Final

Una vez completado el despliegue, tendrás:

✅ **Frontend Cliente** en puerto 60521  
✅ **Backend API** en puerto 60522  
✅ **Admin Panel** en puerto 60523  
✅ **MongoDB** en puerto 60516  
✅ **Arranque automático** configurado  
✅ **Firewall** configurado  
✅ **Scripts de mantenimiento** listos  

**¡Dashboard Clínica funcionando en producción! 🏥🚀**

---

## 📞 Comandos de Emergencia

```bash
# Reinicio completo
cd /opt/dashboard-clinica
./scripts/docker-stop.sh --clean
./scripts/docker-start.sh production

# Backup de emergencia
./scripts/auto-backup.sh

# Estado completo del sistema
docker-compose ps
docker stats
df -h
free -h
```