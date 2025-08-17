# 🏥 Clinic Management System - Deployment Guide

Sistema completo separado en dos componentes independientes para máxima flexibilidad y seguridad.

## 🏗️ Arquitectura Separada

```
📦 Sistema Separado:
├── 🔧 Admin System (Puerto 8000)
│   ├── Backend API: localhost:8000/api
│   ├── Admin UI: localhost:8000/admin  
│   ├── Docs: localhost:8000/docs
│   └── MongoDB integrado
│
└── 🏥 Client Dashboard (Puerto 8080)
    ├── Dashboard Clínicas: localhost:8080
    ├── Se conecta al Admin System
    └── Incluye WhatsApp + N8N
```

## 🚀 Deployment Options

### Option 1: Sistema Admin Only (Recomendado)

Para administrar clínicas desde un servidor central:

```bash
# Windows
cd clinic-admin-backend
./scripts/start-admin.bat

# Linux/Mac  
cd clinic-admin-backend
./scripts/start-admin.sh
```

**Acceso:**
- 🖥️  **Admin Dashboard**: `http://localhost:8000/admin`
- 🔧  **API Backend**: `http://localhost:8000/api`
- 📚  **API Docs**: `http://localhost:8000/docs`

**Credenciales:** `admin` / `admin123`

### Option 2: Client Dashboard Only

Para desplegar dashboard de clientes en servidores separados:

```bash
# Windows
./scripts/start-client.bat

# Docker Compose directo
docker-compose -f docker-compose.client.yml up -d
```

**Acceso:**
- 🏥  **Client Dashboard**: `http://localhost:8080`

### Option 3: Sistema Completo

Para desarrollo o testing completo:

```bash
# Terminal 1: Admin System
cd clinic-admin-backend
./scripts/start-admin.bat

# Terminal 2: Client Dashboard  
./scripts/start-client.bat
```

## 🔧 Configuración

### Variables de Entorno Admin System

```env
# Database
MONGODB_URL=mongodb://admin:password123@mongodb:27017/clinic_admin?authSource=admin

# Admin Auth
ADMIN_USERNAME=admin
ADMIN_PASSWORD=admin123
JWT_SECRET_KEY=your-super-secret-jwt-key

# API Keys
API_KEY_DEV=test123456
API_KEY_PROD=pampaserver2025enservermuA!

# Environment
ADMIN_ONLY=true
ENVIRONMENT=production
```

### Variables de Entorno Client Dashboard

```env
# Backend Connection
VITE_API_URL=http://localhost:8000/api
VITE_BACKEND_URL=http://localhost:8000

# External Services
VITE_WAHA_URL=http://pampaservers.com:60513
VITE_N8N_URL=http://dev-n8n.pampaservers.com
```

## 📋 Funcionalidades por Sistema

### 🔧 Admin System Features
- ✅ **Dashboard Estadísticas** - Métricas completas del sistema
- ✅ **Gestión de Clínicas** - CRUD completo con búsqueda
- ✅ **Planes de Suscripción** - 4 planes configurables
- ✅ **Configuración Visual** - Logos, colores, branding
- ✅ **Formularios Personalizables** - Campos de pacientes
- ✅ **Documentación API** - **ApiDocumentationModal con endpoints N8N**
- ✅ **Gestión de Profesionales** - Por clínica
- ✅ **Analytics y Métricas** - Uso del sistema

### 🏥 Client Dashboard Features
- ✅ **Dashboard por Clínica** - Vista específica por clínica
- ✅ **Gestión de Pacientes** - CRUD con búsqueda
- ✅ **Portal Profesionales** - Acceso específico
- ✅ **Integración WhatsApp** - WAHA API
- ✅ **Calendarios** - Google Calendar integration
- ✅ **N8N Workflows** - Automatización

## 🎯 Acceso al ApiDocumentationModal

### Desde Admin System:
1. Ir a `http://localhost:8000/admin`
2. Login: `admin` / `admin123`  
3. Tab **"Clínicas"**
4. En cualquier clínica → botón **"Documentación"**
5. **Se abre el modal con endpoints para N8N**

### Endpoints disponibles:
- **Clínicas**: 6 endpoints (servicios, horarios, contacto)
- **Pacientes**: 5 endpoints (CRUD, búsqueda, historial)
- **Profesionales**: 2 endpoints (lista, estadísticas)  
- **Públicos**: 2 endpoints (sin autenticación)

## 🐳 Docker Commands

### Admin System
```bash
# Construir y ejecutar
docker-compose -f clinic-admin-backend/docker-compose.admin.yml up -d

# Ver logs
docker-compose -f clinic-admin-backend/docker-compose.admin.yml logs -f

# Parar servicios
docker-compose -f clinic-admin-backend/docker-compose.admin.yml down

# Rebuild
docker-compose -f clinic-admin-backend/docker-compose.admin.yml build --no-cache
```

### Client Dashboard
```bash
# Construir y ejecutar
docker-compose -f docker-compose.client.yml up -d

# Ver logs
docker-compose -f docker-compose.client.yml logs -f

# Parar servicios
docker-compose -f docker-compose.client.yml down
```

## 🔐 Seguridad

### Admin System
- JWT authentication para administradores
- API Keys para acceso programático
- MongoDB con autenticación
- CORS configurado para producción
- Variables de entorno para secrets

### Client Dashboard
- Autenticación por clínica individual
- Conexión segura al Admin System
- Aislamiento de datos por clínica
- API proxy para evitar CORS

## 📊 Monitoreo

### Health Checks
```bash
# Admin System
curl http://localhost:8000/health

# Client Dashboard
curl http://localhost:8080/health
```

### Logs
```bash
# Admin System
docker-compose -f clinic-admin-backend/docker-compose.admin.yml logs admin-system

# Client Dashboard  
docker-compose -f docker-compose.client.yml logs client-dashboard
```

## 🚀 Production Deployment

### 📂 **Acceso al Servidor Linux**

#### **Conexión SSH**
```bash
ssh cirolinux@IP_SERVIDOR
# O usando tu configuración específica
ssh cirolinux@pampaservers.com
```

#### **Navegación a la Aplicación**
```bash
# Ir al directorio del proyecto
cd /opt/dashboard-clinica

# Verificar ubicación de scripts
ls -la scripts/
```

### 🔧 **Scripts de Deployment Disponibles**

#### **1. 📋 `scripts/production-update.sh` - ACTUALIZACIÓN RÁPIDA ⭐**
**✅ RECOMENDADO PARA ACTUALIZACIONES NORMALES**

```bash
# Navegar a la carpeta de scripts
cd /opt/dashboard-clinica/scripts

# Ejecutar actualización
./production-update.sh
```

**¿Qué hace?**
- 🔄 Pull del código más reciente desde Git  
- 🐳 Rebuild de containers Docker
- ⏱️ Restart sin downtime
- 🧪 Verificación automática de salud
- 📊 Muestra logs recientes

**⏱️ Tiempo estimado:** 2-3 minutos

---

#### **2. 🚀 `scripts/production-deploy.sh` - DEPLOYMENT COMPLETO**
**Para instalación inicial o cambios mayores**

```bash
cd /opt/dashboard-clinica/scripts
./production-deploy.sh
```

**¿Qué hace?**
- 📊 Verificaciones pre-deployment
- 🔧 Setup completo de Docker
- 🐳 Build desde cero
- 🧪 Tests completos de salud
- 📋 Verificación de todos los servicios

**⏱️ Tiempo estimado:** 5-8 minutos

---

#### **3. 📊 `scripts/production-monitor.sh` - MONITOREO**
**Para verificar estado del sistema**

```bash
cd /opt/dashboard-clinica/scripts
./production-monitor.sh
```

**¿Qué hace?**
- 📊 Estado de containers
- 💾 Uso de recursos (CPU, RAM)
- 🌐 Health checks de servicios
- 📋 Logs recientes
- 🔍 Conectividad externa

---

### 🎯 **Flujo de Trabajo Recomendado**

#### **Para Actualizaciones Normales:**
```bash
# 1. Conectar al servidor
ssh cirolinux@pampaservers.com

# 2. Ir a scripts
cd /opt/dashboard-clinica/scripts

# 3. Actualizar sistema
./production-update.sh

# 4. (Opcional) Monitorear después de la actualización
./production-monitor.sh
```

#### **Para Verificar Estado:**
```bash
cd /opt/dashboard-clinica/scripts
./production-monitor.sh
```

#### **Para Problemas Mayores:**
```bash
cd /opt/dashboard-clinica/scripts
./production-deploy.sh
```

---

### 🌐 **URLs de Verificación**

Después del deployment, verificar que estos URLs funcionen:

- 🔧 **Admin Dashboard**: http://pampaservers.com:60519/admin
- 📚 **API Docs**: http://pampaservers.com:60519/docs  
- ⚡ **Health Check**: http://pampaservers.com:60519/health

---

### 🐳 **Comandos Docker Útiles**

#### **Estado de Containers**
```bash
# Ver containers del sistema
docker ps --filter "name=clinic"

# Logs en tiempo real
docker logs -f clinic-admin-system

# Logs de las últimas 50 líneas
docker logs clinic-admin-system --tail=50
```

#### **Restart Manual**
```bash
# Navegar al directorio del backend
cd /opt/dashboard-clinica/clinic-admin-backend

# Restart completo
docker-compose -f docker-compose.production.yml down
docker-compose -f docker-compose.production.yml up -d --build
```

#### **Verificación de Salud**
```bash
# Health check directo
curl http://localhost:60519/health

# Verificar puertos abiertos
netstat -tlnp | grep 60519
```

---

### 🔧 **Troubleshooting**

#### **Conflictos de Git durante actualización**
```bash
# Si aparece error de merge conflicts
git stash push -m "Local changes before update"
git pull origin main
./scripts/production-update.sh

# Para ver cambios en stash
git stash list
git stash show -p

# Para recuperar cambios si son necesarios
git stash pop
```

#### **Container no inicia**
```bash
# Ver logs del container
docker logs clinic-admin-system

# Verificar docker-compose
cd /opt/dashboard-clinica/clinic-admin-backend
docker-compose -f docker-compose.production.yml ps
```

#### **Error de permisos**
```bash
# Dar permisos de ejecución a scripts
chmod +x /opt/dashboard-clinica/scripts/*.sh
```

#### **MongoDB no conecta**
```bash
# Verificar conectividad a MongoDB
nc -z 192.168.1.23 60516
```

#### **Puerto ocupado**
```bash
# Ver qué usa el puerto 60519
sudo lsof -i :60519

# Matar proceso si es necesario
sudo kill -9 PID
```

---

### 📋 **Checklist de Deployment**

#### **Pre-Deployment**
- [ ] Código subido a Git (main branch)
- [ ] Cambios probados en desarrollo
- [ ] MongoDB server operativo (192.168.1.23:60516)
- [ ] Permisos SSH al servidor

#### **Durante Deployment**
- [ ] Ejecutar script de actualización
- [ ] Verificar logs sin errores
- [ ] Comprobar health check
- [ ] Probar admin dashboard

#### **Post-Deployment**  
- [ ] Admin dashboard carga correctamente
- [ ] API docs accesibles
- [ ] Funcionalidades principales operativas
- [ ] Logs sin errores críticos

---

### 🚨 **Scripts de Emergencia**

#### **Restart Rápido**
```bash
cd /opt/dashboard-clinica/clinic-admin-backend
docker-compose -f docker-compose.production.yml restart
```

#### **Rebuild Completo**
```bash
cd /opt/dashboard-clinica/clinic-admin-backend
docker-compose -f docker-compose.production.yml down
docker system prune -f
docker-compose -f docker-compose.production.yml up -d --build --force-recreate
```

#### **Logs de Depuración**
```bash
# Ver todos los logs
docker-compose -f docker-compose.production.yml logs

# Seguir logs en tiempo real
docker-compose -f docker-compose.production.yml logs -f
```

### 1. Admin System (Servidor Central)
```bash
# Variables de producción
export ENVIRONMENT=production
export MONGODB_URL="mongodb://user:pass@prod-mongo:27017/clinic_admin"
export JWT_SECRET_KEY="your-production-secret"
export API_KEY_PROD="your-production-api-key"

# Deploy
docker-compose -f clinic-admin-backend/docker-compose.admin.yml up -d
```

### 2. Client Dashboard (Múltiples Instancias)
```bash
# Por cada clínica o región
export VITE_API_URL="https://admin.yourclinic.com/api"
export VITE_BACKEND_URL="https://admin.yourclinic.com"

# Deploy
docker-compose -f docker-compose.client.yml up -d
```

## 📱 Mobile & PWA

Ambos sistemas incluyen:
- ✅ Responsive design mobile-first
- ✅ PWA capabilities (manifest.json)
- ✅ Service workers para offline
- ✅ App icons y splash screens

## 🔄 Updates & Maintenance

### Admin System Updates
```bash
cd clinic-admin-backend
git pull
docker-compose -f docker-compose.admin.yml build --no-cache
docker-compose -f docker-compose.admin.yml up -d
```

### Client Dashboard Updates
```bash
git pull
docker-compose -f docker-compose.client.yml build --no-cache  
docker-compose -f docker-compose.client.yml up -d
```

---

## 🎉 Quick Start

**Para administradores del sistema:**
```bash
cd clinic-admin-backend
./scripts/start-admin.bat
# Ir a http://localhost:8000/admin
```

**Para clínicas individuales:**
```bash
./scripts/start-client.bat  
# Ir a http://localhost:8080
```

**Para acceso al ApiDocumentationModal:**
- Admin System → Clínicas → Documentación ✅