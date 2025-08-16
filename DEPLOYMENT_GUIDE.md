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