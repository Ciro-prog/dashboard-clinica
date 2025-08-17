# 🏥 Clinic Admin System

Sistema de gestión administrativa para clínicas médicas con dashboard completo, integración WhatsApp y workflows automatizados.

## 🚀 Quick Start

### Desarrollo Local
```bash
# Iniciar sistema local (conecta a DB de producción)
start-local-dev.bat

# URLs locales:
# 🔧 Admin: http://localhost:8000/admin
# 📚 Docs: http://localhost:8000/docs
```

### Producción
```bash
# Deploy en servidor
cd clinic-admin-backend
docker-compose -f docker-compose.production.yml up -d

# URLs producción:
# 🔧 Admin: http://pampaservers.com:60519/admin
# 📚 Docs: http://pampaservers.com:60519/docs
```

## 📚 Documentación

- **[DEPLOYMENT.md](DEPLOYMENT.md)** - Guía completa de deployment
- **[CLAUDE.md](CLAUDE.md)** - Documentación técnica detallada

## 🛠️ Gestión

```bash
# Corrección de problemas
./scripts/fix-cors-and-rebuild.sh

# Limpiar archivos innecesarios  
cleanup-server.bat
```

## 🏗️ Arquitectura

- **Backend:** FastAPI + MongoDB
- **Frontend:** React + TypeScript
- **Integraciones:** WhatsApp (WAHA), N8N, Strapi CMS
- **Deploy:** Docker + Docker Compose

---

**✅ Sistema listo para producción**