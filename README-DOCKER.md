# 🐳 Dashboard Clínica - Docker Setup

Dockerización completa del Dashboard Clínica con arquitectura multi-container.

## 🏗️ Arquitectura

```
┌─────────────────────────────────────────────────────────────┐
│                    DASHBOARD CLÍNICA                        │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  ┌─────────────────┐  ┌─────────────────┐  ┌──────────────┐ │
│  │  Frontend       │  │  Backend API    │  │  Admin       │ │
│  │  Cliente        │  │  (FastAPI)      │  │  Frontend    │ │
│  │  (React+Nginx)  │  │                 │  │  (React)     │ │
│  │  :60521         │  │  :60522         │  │  :60523      │ │
│  └─────────────────┘  └─────────────────┘  └──────────────┘ │
│           │                     │                   │       │
│           └─────────────────────┼───────────────────┘       │
│                                 │                           │
│                    ┌─────────────────┐                      │
│                    │   MongoDB       │                      │
│                    │   (Externo)     │                      │
│                    │   :60516        │                      │
│                    └─────────────────┘                      │
└─────────────────────────────────────────────────────────────┘
```

## 🚀 Inicio Rápido

### 1. Configurar Variables de Entorno

```bash
# Copiar configuración de ejemplo
cp .env.example .env

# Editar variables importantes
nano .env
```

### 2. Iniciar Servicios

```bash
# Desarrollo (todos los servicios)
./scripts/docker-start.sh development

# Producción (sin admin frontend)
./scripts/docker-start.sh production
```

### 3. Detener Servicios

```bash
# Detener servicios
./scripts/docker-stop.sh

# Detener y limpiar todo
./scripts/docker-stop.sh --clean
```

## 🔧 Servicios y Puertos

| Servicio | Puerto | URL | Descripción |
|----------|--------|-----|-------------|
| **Frontend Cliente** | 60521 | http://localhost:60521 | App principal React |
| **Backend API** | 60522 | http://localhost:60522 | FastAPI REST API |
| **Admin Frontend** | 60523 | http://localhost:60523 | Panel administrativo |
| **MongoDB** | 60516 | mongodb://localhost:60516 | Base de datos (externo) |

## 📦 Estructura Docker

```
dashboard-clinica/
├── Dockerfile                    # Frontend Cliente
├── docker-compose.yml           # Orquestación
├── .env.example                 # Configuración ejemplo
├── .dockerignore                # Exclusiones
│
├── clinic-admin-backend/
│   ├── Dockerfile               # Backend API
│   ├── .dockerignore           # Exclusiones backend
│   │
│   └── frontend/
│       └── Dockerfile           # Admin Frontend
│
└── scripts/
    ├── docker-start.sh          # Script inicio
    └── docker-stop.sh           # Script parada
```

## ⚙️ Configuración Detallada

### Variables de Entorno Principales

```env
# Puertos
FRONTEND_CLIENT_PORT=60521
BACKEND_API_PORT=60522
ADMIN_FRONTEND_PORT=60523

# MongoDB (contenedor existente)
MONGODB_URL=mongodb://host.docker.internal:60516/clinic_dashboard

# Seguridad
ADMIN_SECRET_KEY=your-secret-key-here
API_SECRET_KEY=your-api-key-here

# URLs
VITE_API_URL=http://localhost:60522
CORS_ORIGINS=["http://localhost:60521","http://localhost:60523"]
```

### Características Docker

- **Multi-stage builds** para imágenes optimizadas
- **Health checks** para todos los servicios
- **Volumes** para persistencia de datos
- **Networks** para comunicación entre servicios
- **Security** con usuarios no-root

## 🐞 Resolución de Problemas

### Verificar Estado

```bash
# Estado de contenedores
docker-compose ps

# Logs en tiempo real
docker-compose logs -f

# Logs específicos
docker-compose logs backend-api
docker-compose logs frontend-client
```

### Problemas Comunes

#### 1. MongoDB No Conecta
```bash
# Verificar contenedor MongoDB existente
docker ps | grep mongo

# Debe mostrar: 0.0.0.0:60516->27017/tcp
```

#### 2. Puerto Ocupado
```bash
# Verificar puertos en uso
netstat -tulpn | grep -E '60521|60522|60523'

# Cambiar puertos en .env si es necesario
```

#### 3. Permisos en Scripts
```bash
# Hacer ejecutables los scripts
chmod +x scripts/*.sh
```

#### 4. Reconstruir Imágenes
```bash
# Reconstruir sin cache
docker-compose build --no-cache

# Reconstruir servicio específico
docker-compose build frontend-client
```

### Comandos Útiles

```bash
# Entrar a un contenedor
docker-compose exec backend-api bash
docker-compose exec frontend-client sh

# Ver recursos utilizados
docker stats

# Limpiar sistema Docker
docker system prune -a

# Reiniciar servicio específico
docker-compose restart backend-api
```

## 🔒 Consideraciones de Seguridad

### En Desarrollo
- Variables de entorno en `.env`
- Contenedores con usuarios no-root
- Health checks habilitados
- CORS configurado para localhost

### En Producción
- Cambiar todas las claves secretas
- Configurar certificados SSL
- Usar proxy inverso (Nginx/Traefik)
- Monitoreo y logs centralizados

## 📈 Optimizaciones

### Performance
- Multi-stage builds reduce tamaño de imágenes
- Nginx para servir archivos estáticos
- Gzip compression habilitado
- Cache de dependencias Docker

### Escalabilidad
- Servicios separados independientes
- Volumes para persistencia
- Profiles para diferentes entornos
- Ready para Kubernetes

## 🚀 Deploy en Producción

### Opción 1: VPS Simple
```bash
# En servidor
git clone <repo>
cd dashboard-clinica
cp .env.example .env
# Configurar .env para producción
./scripts/docker-start.sh production
```

### Opción 2: Con Proxy Inverso
```bash
# Agregar Nginx/Traefik como proxy
# Configurar SSL con Let's Encrypt
# Usar docker-compose.prod.yml
```

### Opción 3: Kubernetes
```bash
# Convertir a manifiestos K8s
kompose convert

# Deploy en cluster
kubectl apply -f k8s/
```

## 📞 Soporte

Si encuentras problemas:

1. Revisa los logs: `docker-compose logs -f`
2. Verifica configuración: `cat .env`
3. Estado de servicios: `docker-compose ps`
4. Conexión MongoDB: `docker ps | grep mongo`

---

**¡Dashboard Clínica dockerizado y listo para producción! 🏥🐳**