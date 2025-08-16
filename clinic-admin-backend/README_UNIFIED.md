# 🏥 Clinic Admin Backend - Configuración Unificada

## 🚀 Inicio Rápido

### **Desarrollo (Recomendado para cambios)**
```bash
cd scripts
./dev-start.sh
```
**Resultado**: Frontend en http://localhost:3000 con hot reload ⚡

### **Producción (Deploy final)**
```bash
cd scripts
./prod-deploy.sh
```
**Resultado**: Todo en http://localhost:60519/admin 🌐

## 📁 Estructura

```
clinic-admin-backend/
├── frontend-admin/        # 🎨 Frontend React completo
│   ├── src/components/    # AdminDashboard, pagos, etc.
│   ├── package.json       # Dependencias React
│   └── vite.config.ts     # Configuración build
├── static/admin/          # 📦 Frontend compilado (auto-generado)
├── main.py               # ⚡ FastAPI con frontend integrado
├── Dockerfile.unified    # 🐳 Multi-stage build
└── scripts/
    ├── dev-start.sh      # 🛠️ Desarrollo
    ├── dev-stop.sh       # 🛑 Detener
    └── prod-deploy.sh    # 🚀 Producción
```

## 🔧 Configuración

### **Variables de Entorno**
```bash
# Desarrollo
export NODE_ENV=development
export VITE_API_URL=http://localhost:60519

# Producción
export MONGODB_URL=mongodb://localhost:27017/clinica-dashboard
export ADMIN_SECRET_KEY=your-secret-key
```

### **Dependencias**
- **Desarrollo**: Node.js 18+, npm, Docker
- **Producción**: Docker, docker-compose

## 📊 Características del Frontend

### ✅ **Incluido (migrado desde /src)**
- **Tema oscuro**: bg-slate-900/800
- **Sistema de tarjetas**: shadcn/ui
- **Pagos avanzados**: EnhancedPaymentManagementModal
- **Upgrades**: EnhancedSubscriptionUpgradeModal
- **Facturación**: BillingConfigurationModal
- **Profesionales**: BulkProfessionalCreator
- **Gestión completa**: Clínicas, usuarios, suscripciones

### ❌ **Eliminado**
- admin_ui/ (Streamlit básico)
- Frontend separado en puerto 60523

## 🔄 Flujo de Desarrollo

1. **Iniciar desarrollo**: `./dev-start.sh`
2. **Hacer cambios** en `frontend-admin/src/`
3. **Ver cambios** automáticamente en http://localhost:3000
4. **Deploy cuando esté listo**: `./prod-deploy.sh`

## 🌐 APIs Disponibles

| Endpoint | Descripción | Modo |
|----------|-------------|------|
| `/admin` | Frontend React | Ambos |
| `/api/auth` | Autenticación | Ambos |
| `/api/admin` | Admin operations | Ambos |
| `/api/clinics` | Gestión clínicas | Ambos |
| `/docs` | OpenAPI docs | Ambos |
| `/health` | Health check | Ambos |

## 🐳 Docker

### **Desarrollo**
```bash
docker-compose -f ../docker-compose.unified.yml --profile development up
```

### **Producción**
```bash
docker-compose -f ../docker-compose.unified.yml --profile production up
```

## 🔍 Logs y Debugging

### **Ver logs en tiempo real**
```bash
# Desarrollo
docker-compose -f ../docker-compose.unified.yml --profile development logs -f

# Producción  
docker-compose -f ../docker-compose.unified.yml --profile production logs -f
```

### **Estado de servicios**
```bash
docker-compose -f ../docker-compose.unified.yml ps
```

## 🛠️ Mantenimiento

### **Actualizar dependencias**
```bash
cd frontend-admin
npm update
```

### **Limpiar builds**
```bash
rm -rf frontend-admin/dist
rm -rf static/admin
```

### **Rebuild completo**
```bash
./prod-deploy.sh  # Hace rebuild automático
```

## 🚨 Troubleshooting

### **Frontend no carga**
```bash
# Verificar build
ls -la static/admin/

# Rebuilder si necesario
cd frontend-admin && npm run build
```

### **Error de conexión**
```bash
# Verificar backend
curl http://localhost:60519/health

# Verificar frontend
curl http://localhost:60519/admin
```

### **Docker no inicia**
```bash
# Limpiar contenedores
docker system prune -f

# Rebuild desde cero
docker-compose -f ../docker-compose.unified.yml build --no-cache
```

## 📝 Notas Importantes

- **Hot reload** solo funciona en modo desarrollo
- **Producción** requiere rebuild para cambios
- **Scripts** manejan automáticamente el proceso
- **Logs** se guardan en volúmenes Docker

## 🎯 Próximas Mejoras

- [ ] CI/CD automático
- [ ] SSL/HTTPS
- [ ] Métricas de performance
- [ ] Backup automático
- [ ] Environment configs separados