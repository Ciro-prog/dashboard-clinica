# ClinicaAdmin - Sistema Administrativo Completo

Sistema administrativo independiente para la gestión de clínicas médicas, construido con FastAPI + React + TypeScript.

## 🏗️ Arquitectura del Proyecto

```
clinic-admin-backend/
├── app/                    # Backend FastAPI
│   ├── api/               # Endpoints de la API
│   ├── core/              # Configuración y database
│   ├── models/            # Modelos de datos
│   └── auth/              # Autenticación
├── frontend/              # Frontend React independiente
│   ├── src/
│   │   ├── components/    # Componentes React
│   │   ├── lib/          # Utilidades
│   │   └── types/        # Tipos TypeScript
│   ├── dist/             # Build de producción
│   └── package.json      # Configuración frontend
├── main.py               # Aplicación principal
└── requirements.txt      # Dependencias Python
```

## 🚀 Instalación y Configuración

### 1. Backend (FastAPI)

```bash
cd clinic-admin-backend

# Instalar dependencias Python
pip install -r requirements.txt

# Configurar MongoDB (asegurar que esté ejecutándose)
# Crear archivo .env con las variables necesarias

# Ejecutar el backend
python -m uvicorn main:app --reload --port 8000
```

### 2. Frontend (React)

```bash
cd clinic-admin-backend/frontend

# Instalar dependencias
npm install

# Desarrollo
npm run dev

# Construir para producción
npm run build
```

## 🌐 Acceso al Sistema

### URLs de Acceso
- **Backend API**: `http://localhost:8000`
- **Documentación API**: `http://localhost:8000/docs`
- **Frontend Admin**: `http://localhost:8000/admin` (después del build)
- **Frontend Dev**: `http://localhost:3000` (modo desarrollo)

### Credenciales de Administrador
```
Usuario: admin
Contraseña: admin123
```

## 🎯 Funcionalidades Implementadas

### 1. Sistema de Autenticación
- Login exclusivo para administradores
- JWT tokens con validación
- Sesiones persistentes
- Roles y permisos

### 2. Dashboard Principal
- **Estadísticas en Tiempo Real**:
  - Total de clínicas (activas, inactivas, en prueba)
  - Ingresos mensuales recurrentes
  - Total de pacientes y profesionales
  - Distribución por planes de suscripción

### 3. Gestión Completa de Clínicas
- **CRUD Completo**: Crear, listar, editar clínicas
- **Búsqueda Avanzada**: Por nombre, email, suscriptor
- **Estados**: active, inactive, suspended
- **Información Detallada**: Todos los datos de la clínica

### 4. Configuración de Identidad Visual
- **Títulos Personalizables**: 
  - Título principal (ej: "ClinicaAdmin")
  - Subtítulo (ej: "Sistema de Gestión Médica")
- **Gestión de Logos**: URL de imagen personalizada
- **Paleta de Colores**:
  - Color primario con selector visual
  - Color secundario complementario
  - Paleta médica predefinida
  - Vista previa en tiempo real

### 5. Gestión de Suscripciones Mensuales
- **4 Planes Configurados**:
  - **Trial** (Gratuito - 30 días): 2 profesionales, 50 pacientes
  - **Básico** ($29.99/mes): 5 profesionales, 200 pacientes
  - **Premium** ($59.99/mes): 15 profesionales, 1,000 pacientes
  - **Empresarial** ($99.99/mes): 50 profesionales, 5,000 pacientes

- **Características por Plan**:
  - WhatsApp Integration
  - Patient History
  - Appointment Scheduling
  - Medical Records
  - Analytics Dashboard
  - Custom Branding
  - API Access
  - Priority Support

- **Gestión de Fechas**:
  - Fechas de expiración automáticas
  - Extensión de períodos de prueba
  - Renovaciones desde fecha actual o de expiración

### 6. Configuración de Formularios de Pacientes
- **10 Campos Predeterminados**:
  - Obligatorios: Nombre, Apellido, DNI, Dirección, Teléfono
  - Opcionales: Obra Social, Email, Fecha Nacimiento, Contacto Emergencia
- **Sistema de Activación**: Checkbox para habilitar/deshabilitar campos
- **Vista Previa**: Visualización del formulario resultante
- **Validaciones**: Campos obligatorios marcados

### 7. Integración N8N
- **Configuración Automática**: Carpeta por clínica
- **Nomenclatura**: "{suscriber} - Operativa"
- **Workflows Sugeridos**:
  - WhatsApp Notifications
  - Appointment Reminders
  - Patient Follow-up
  - Medical Reports
- **Acceso Directo**: Link al dashboard N8N

## 📊 API Endpoints

### Autenticación
- `POST /api/auth/login` - Login de administradores

### Gestión de Clínicas
- `GET /api/admin/clinics` - Lista de todas las clínicas
- `GET /api/admin/clinics/{id}` - Detalles de una clínica
- `POST /api/admin/clinics` - Crear nueva clínica
- `PUT /api/admin/clinics/{id}/branding` - Actualizar identidad visual
- `PUT /api/admin/clinics/{id}/subscription` - Gestionar suscripción
- `PUT /api/admin/clinics/{id}/patient-fields` - Configurar formularios

### Dashboard y Estadísticas
- `GET /api/admin/dashboard/stats` - Estadísticas del dashboard
- `GET /api/admin/subscription-plans` - Planes disponibles
- `GET /api/admin/clinics/expiring-soon` - Clínicas que expiran
- `POST /api/admin/clinics/{id}/extend-trial` - Extender período de prueba

## 🎨 Interfaz de Usuario

### Componentes Principales
- **LoginForm**: Autenticación con credenciales de prueba
- **Dashboard**: Panel principal con tabs navegables
- **ClinicEditor**: Editor completo con 5 secciones:
  - General: Información básica y estado
  - Identidad: Configuración visual (títulos, colores, logo)
  - Suscripción: Gestión de planes y características
  - Formularios: Configuración de campos de pacientes
  - N8N: Integración y workflows

### Diseño y Estilos
- **Tailwind CSS**: Framework de utilidades
- **Colores Médicos**: Paleta especializada para el sector salud
- **Responsive**: Diseño adaptable para móvil y desktop
- **Iconografía**: Lucide React para iconos médicos
- **Cards y Shadows**: Diseño limpio con elevaciones

## 🔧 Comandos de Desarrollo

### Backend
```bash
# Ejecutar servidor de desarrollo
python -m uvicorn main:app --reload --port 8000

# Ver documentación API
http://localhost:8000/docs

# Verificar salud del sistema
curl http://localhost:8000/health
```

### Frontend
```bash
cd frontend

# Desarrollo con hot reload
npm run dev

# Construir para producción
npm run build

# Previsualizar build
npm run preview

# Servir archivos estáticos (alternativo)
npm run serve
```

## 🌟 Características Técnicas

### Backend (FastAPI)
- **Async/Await**: Operaciones asíncronas para mejor rendimiento
- **MongoDB**: Base de datos NoSQL con Motor (driver async)
- **Pydantic v2**: Validación de datos y serialización
- **JWT Authentication**: Tokens seguros con expiración
- **CORS Configurado**: Para desarrollo y producción
- **Static Files**: Servir frontend desde el backend

### Frontend (React)
- **TypeScript**: Tipado estático para mejor desarrollo
- **Vite**: Build tool rápido con HMR
- **Estado Local**: useState para gestión de estado
- **Fetch API**: Comunicación con backend
- **Local Storage**: Persistencia de sesión
- **Responsive Design**: Mobile-first approach

## 🚀 Despliegue

### Desarrollo Local
1. Ejecutar MongoDB en localhost:27017
2. Ejecutar backend: `python main.py`
3. Frontend automáticamente disponible en `/admin`

### Producción
1. Construir frontend: `cd frontend && npm run build`
2. El backend sirve automáticamente los archivos estáticos
3. Configurar variables de entorno para producción
4. Usar proxy reverso (nginx) si es necesario

## 📈 Próximas Funcionalidades

- [ ] Dashboard de métricas avanzadas
- [ ] Notificaciones por email de vencimientos
- [ ] Exportación de reportes (PDF, Excel)
- [ ] Integración con pasarelas de pago
- [ ] Logs de auditoría de cambios
- [ ] Backup y restauración de datos
- [ ] Multi-tenancy avanzado
- [ ] API webhooks para integraciones

## 🛠️ Tecnologías Utilizadas

**Backend**:
- FastAPI 0.104+
- Python 3.11+
- MongoDB con Motor
- Pydantic v2
- JWT Authentication
- Uvicorn

**Frontend**:
- React 18
- TypeScript 5
- Vite 4
- Tailwind CSS 3
- Lucide React
- PostCSS

---

**Sistema desarrollado para la gestión integral de clínicas médicas con interfaz administrativa completa.**