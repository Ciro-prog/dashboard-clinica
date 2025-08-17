# 🚀 CLINIC ADMIN SYSTEM - GUÍA DE DEPLOYMENT

## 📋 Resumen del Sistema

**Clinic Admin System** es un sistema de gestión de clínicas médicas que incluye:
- ✅ **Backend FastAPI** con API REST completa
- ✅ **Frontend React** con dashboard administrativo  
- ✅ **Base de datos MongoDB** externa
- ✅ **Integración WhatsApp** (WAHA) y **N8N** workflows

---

## 🏗️ Arquitectura del Sistema

```
┌─────────────────────────────────────────────────────────────┐
│                    PRODUCTION SERVER                        │
├─────────────────────────────────────────────────────────────┤
│  🔧 Admin System (Port 60519)                              │
│  │   ├── FastAPI Backend                                  │
│  │   ├── React Frontend (/admin)                          │
│  │   └── API Docs (/docs)                                 │
│                                                             │
│  👥 Client System (Port 60521)                             │
│  │   └── React Frontend (público)                         │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│                   EXTERNAL SERVICES                        │
├─────────────────────────────────────────────────────────────┤
│  🗄️  MongoDB (192.168.1.23:60516)                         │
│  📱 WAHA WhatsApp (pampaservers.com:60513)                 │
│  🔄 N8N Workflows (dev-n8n.pampaservers.com)               │
│  📊 CMS Strapi (pampaservers.com:60520)                    │
└─────────────────────────────────────────────────────────────┘
```

---

## 📦 Archivos Necesarios para Deploy

### Core del Sistema
```
clinic-admin-backend/
├── 📁 app/                          # Código del backend
├── 📁 frontend-admin/               # Código del frontend admin
├── 📄 main.py                       # Punto de entrada FastAPI
├── 📄 requirements.txt              # Dependencias Python
├── 📄 Dockerfile.admin              # Build del contenedor
├── 📄 docker-compose.production.yml # Configuración producción
└── 📄 .env.prod                     # Variables de producción
```

### Documentación Esencial
```
📄 DEPLOYMENT.md                     # Esta guía
📄 CLAUDE.md                         # Documentación del proyecto
```

### Scripts de Gestión
```
scripts/
└── 📄 fix-cors-and-rebuild.sh       # Script de corrección/rebuild
```

---

## 🚀 DEPLOYMENT EN SERVIDOR

### Paso 1: Preparación del Servidor

```bash
# 1. Clonar el repositorio
git clone <repo-url> /opt/dashboard-clinica
cd /opt/dashboard-clinica

# 2. Verificar Docker está instalado
docker --version
docker-compose --version
```

### Paso 2: Configuración de Producción

```bash
cd clinic-admin-backend

# Crear archivo de configuración de producción
cat > .env.prod << 'EOF'
# Base de datos externa
MONGODB_URL=mongodb://admin:PampaServers2025@192.168.1.23:60516/clinica-dashboard?authSource=admin

# Configuración de servidor
ADMIN_USERNAME=admin
ADMIN_PASSWORD=admin123
JWT_SECRET_KEY=clinic-production-jwt-key-2024-secure

# API Keys
API_KEY_DEV=test123456
API_KEY_PROD=pampaserver2025enservermuA!

# CORS para producción
CORS_ORIGINS=http://pampaservers.com:60519,http://pampaservers.com:60521,http://localhost:60519,http://localhost:60521

# Environment
ENVIRONMENT=production
DEBUG=false
HOST=0.0.0.0
PORT=8000

# URLs servicios externos
WAHA_BASE_URL=http://pampaservers.com:60513
WAHA_API_KEY=pampaserver2025enservermuA!
N8N_BASE_URL=http://dev-n8n.pampaservers.com
EOF
```

### Paso 3: Deploy en Producción

```bash
# Construir y lanzar el sistema
docker-compose -f docker-compose.production.yml up -d --build

# Verificar que está funcionando
docker ps --filter "name=clinic"
curl -f http://localhost:60519/health
```

### Paso 4: Verificación del Deploy

```bash
# URLs de verificación:
echo "🔧 Admin Dashboard: http://pampaservers.com:60519/admin"
echo "📚 API Docs: http://pampaservers.com:60519/docs" 
echo "⚡ Health Check: http://pampaservers.com:60519/health"
```

---

## 💻 DESARROLLO LOCAL

### Opción 1: Desarrollo Directo (Sin Docker) - RECOMENDADO

#### Backend
```bash
# 1. Instalar dependencias Python
cd clinic-admin-backend
pip install -r requirements.txt

# 2. Configurar variables de entorno
copy .env.development .env

# 3. Ejecutar backend
start-backend-local.bat
# O manualmente: uvicorn main:app --host 127.0.0.1 --port 8000 --reload
```

#### Frontend
```bash
# 1. Instalar dependencias Node.js
cd clinic-admin-backend/frontend-admin
npm install

# 2. Ejecutar frontend
start-frontend-local.bat
# O manualmente: npm run dev
```

#### URLs Locales:
- 🔧 **Backend**: http://127.0.0.1:8000/admin
- 📚 **API Docs**: http://127.0.0.1:8000/docs
- 🎯 **Frontend**: http://localhost:5173

### Opción 2: Desarrollo con Docker

```bash
# 1. Usar configuración local (apunta a misma DB de producción)
cd clinic-admin-backend
docker-compose -f docker-compose.local.yml up -d

# 2. URLs locales:
# 🔧 Admin Dashboard: http://localhost:8000/admin
# 📚 API Docs: http://localhost:8000/docs
# ⚡ Health Check: http://localhost:8000/health
```

### Scripts de Desarrollo (Windows)
```batch
# Desarrollo directo (recomendado)
start-backend-local.bat   # Backend en puerto 8000
start-frontend-local.bat  # Frontend en puerto 5173

# Desarrollo con Docker
start-local-dev.bat       # Sistema completo
stop-local-dev.bat        # Detener sistema
```

---

## 🔧 COMANDOS DE GESTIÓN

### Scripts de Producción (Linux)
```bash
# Deploy completo del sistema
./scripts/production-deploy.sh

# Actualizar desde Git
./scripts/production-update.sh

# Monitorear sistema
./scripts/production-monitor.sh

# Corrección de problemas
./scripts/fix-cors-and-rebuild.sh
```

### Gestión Manual de Contenedores
```bash
# Ver estado
docker ps --filter "name=clinic"

# Ver logs
docker logs clinic-admin-system -f

# Reiniciar servicio
docker-compose -f docker-compose.production.yml restart

# Rebuild completo
docker-compose -f docker-compose.production.yml down
docker-compose -f docker-compose.production.yml up -d --build --force-recreate
```

### Actualización Manual desde Git
```bash
# 1. Actualizar código
git pull origin main

# 2. Rebuild sistema
cd clinic-admin-backend
docker-compose -f docker-compose.production.yml down
docker-compose -f docker-compose.production.yml up -d --build

# 3. Verificar funcionamiento
curl -f http://localhost:60519/health
```

### Backup y Restauración
```bash
# La base de datos es externa (192.168.1.23:60516)
# Solo necesitas backup de:
# - Configuraciones (.env.prod)
# - Uploads (si los hay)
# - Logs del sistema

# Backup de uploads
docker cp clinic-admin-system:/app/uploads ./backup-uploads-$(date +%Y%m%d)

# Backup de configuración
cp .env.prod .env.prod.backup-$(date +%Y%m%d)
```

---

## 🚨 TROUBLESHOOTING

### Problema: Contenedor en restart loop
```bash
# Verificar logs
docker logs clinic-admin-system --tail=50

# Problemas comunes:
# 1. Error de conexión MongoDB
# 2. Error en configuración CORS
# 3. Assets frontend no encontrados
```

### Problema: Assets 404 en frontend
```bash
# Aplicar fix de assets
cd /opt/dashboard-clinica/scripts
./fix-cors-and-rebuild.sh
```

### Problema: Error de CORS
```bash
# Verificar CORS_ORIGINS en .env.prod
# Debe incluir todas las URLs necesarias
```

---

## 📊 MONITOREO

### Health Checks
```bash
# Verificación automática cada 30s
curl -f http://localhost:60519/health

# Respuesta esperada:
{
  "status": "healthy",
  "service": "clinic-admin-backend",
  "version": "1.0.0", 
  "database": "connected"
}
```

### Logs Importantes
```bash
# Logs de inicio exitoso:
docker logs clinic-admin-system | grep -E "(SUCCESS|Mounted|Found)"

# Esperado:
# Found UNIFIED frontend at static/admin
# Mounted admin assets at /admin/assets
# Mounted admin assets at /assets (404 fix)
# SUCCESS: Application started successfully
```

---

## 🔐 SEGURIDAD

### Credenciales Importantes
- **MongoDB:** `admin:PampaServers2025@192.168.1.23:60516`
- **Admin Login:** `admin / admin123`
- **API Key Prod:** `pampaserver2025enservermuA!`
- **API Key Dev:** `test123456`

### Puertos en Uso
- **Admin System:** `60519` (producción), `8000` (local)
- **Client System:** `60521`
- **MongoDB:** `60516` (externo)
- **WAHA:** `60513` (externo)
- **CMS:** `60520` (externo)

---

## 📞 CONTACTO Y SOPORTE

Para issues o mejoras, consultar:
- 📄 **CLAUDE.md** - Documentación técnica completa
- 🔧 **Scripts** - Herramientas de gestión y troubleshooting

---

**✅ Sistema listo para producción con configuración optimizada y documentación completa.**