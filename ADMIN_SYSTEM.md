# Sistema de Administración ClinicaAdmin

Sistema administrativo completo para la gestión de clínicas médicas, construido con React + TypeScript y FastAPI.

## 🏥 Características Principales

### Panel de Control
- **Dashboard Estadístico**: Métricas en tiempo real de clínicas, ingresos y usuarios
- **Gestión de Clínicas**: CRUD completo con búsqueda y filtros
- **Administración de Suscripciones**: 4 planes con características configurables

### Configuración de Clínicas
- **Identidad Visual**: Personalización de títulos, logos y colores
- **Formularios de Pacientes**: Campos configurables y personalizables
- **Integración N8N**: Configuración de carpetas y workflows
- **Planes de Suscripción**: Trial, Básico, Premium y Empresarial

## 🚀 Acceso al Sistema

### URL de Acceso
```
http://localhost:8080/admin
```

### Credenciales de Desarrollo
```
Usuario: admin
Contraseña: admin123
```

## 🎯 Funcionalidades Implementadas

### 1. Dashboard Principal
- ✅ Estadísticas generales (clínicas, ingresos, usuarios)
- ✅ Distribución de planes de suscripción
- ✅ Clínicas que expiran pronto
- ✅ Métricas de crecimiento mensual

### 2. Gestión de Clínicas
- ✅ Lista de clínicas con búsqueda
- ✅ Creación de nuevas clínicas
- ✅ Editor completo por clínica
- ✅ Estados y configuraciones

### 3. Configuración de Identidad Visual
- ✅ Títulos personalizables (ClinicaAdmin + subtítulo)
- ✅ Selector de colores con paleta predefinida
- ✅ Gestión de logos (URL)
- ✅ Vista previa en tiempo real

### 4. Gestión de Suscripciones
- ✅ 4 planes configurados: Trial, Básico, Premium, Empresarial
- ✅ Características por plan (WhatsApp, historial, API, etc.)
- ✅ Límites de profesionales y pacientes
- ✅ Fechas de expiración automáticas
- ✅ Extensión de períodos de prueba

### 5. Configuración de Formularios de Pacientes
- ✅ 15 campos predeterminados configurables
- ✅ Campos personalizados con diferentes tipos
- ✅ Vista previa del formulario
- ✅ Validaciones y configuración de obligatoriedad

### 6. Integración N8N
- ✅ Configuración de carpetas por clínica
- ✅ Nomenclatura automática: "{suscriber} - Operativa"
- ✅ Acceso directo al dashboard N8N
- ✅ Workflows sugeridos

## 📊 Planes de Suscripción

### Trial (Gratuito - 30 días)
- 2 profesionales máximo
- 50 pacientes máximo
- WhatsApp + Historial básico

### Básico ($29.99/mes)
- 5 profesionales máximo
- 200 pacientes máximo
- WhatsApp + Historial + Citas + Records

### Premium ($59.99/mes)
- 15 profesionales máximo
- 1,000 pacientes máximo
- Todas las características + Analytics + Branding + Soporte

### Empresarial ($99.99/mes)
- 50 profesionales máximo
- 5,000 pacientes máximo
- Todas las características + API + Soporte prioritario

## 🔧 Arquitectura Técnica

### Frontend
```
src/
├── pages/
│   ├── AdminApp.tsx          # App principal del admin
│   └── AdminDashboard.tsx    # Dashboard con tabs
├── components/
│   ├── AdminLoginForm.tsx    # Autenticación de admin
│   ├── ClinicEditor.tsx      # Editor completo de clínica
│   ├── ClinicBrandingForm.tsx # Configuración visual
│   ├── SubscriptionManager.tsx # Gestión de suscripciones
│   └── PatientFormConfig.tsx  # Configuración de formularios
```

### Backend
```
clinic-admin-backend/app/api/
└── admin_dashboard.py        # Endpoints de administración
```

### Endpoints Principales
- `GET /admin/dashboard/stats` - Estadísticas del dashboard
- `GET /admin/clinics` - Lista de clínicas
- `POST /admin/clinics` - Crear nueva clínica
- `PUT /admin/clinics/{id}/branding` - Actualizar identidad visual
- `PUT /admin/clinics/{id}/subscription` - Gestionar suscripción
- `PUT /admin/clinics/{id}/patient-fields` - Configurar formularios

## 🎨 Personalización Visual

### Colores Médicos Predefinidos
- **Azul Médico**: #3B82F6 (primario)
- **Verde Médico**: #10B981
- **Azul Oscuro**: #1E40AF (secundario)
- **Morado**: #8B5CF6
- **Amarillo**: #F59E0B
- **Rojo**: #EF4444

### Componentes de UI
- shadcn/ui para consistencia
- Tailwind CSS para estilos
- Lucide React para iconografía
- Radix UI para primitivos

## 💼 Casos de Uso

### Para Administradores del Sistema
1. **Onboarding de Clínicas**: Crear nueva clínica con configuración completa
2. **Gestión de Facturación**: Monitorear ingresos y vencimientos
3. **Soporte Técnico**: Extender pruebas y resolver incidencias
4. **Análisis de Negocio**: Métricas de crecimiento y uso

### Para Configuración de Clínicas
1. **Personalización de Marca**: Logo, colores y títulos únicos
2. **Formularios Específicos**: Campos adicionales según especialidad
3. **Automatización N8N**: Workflows personalizados por clínica
4. **Escalabilidad**: Cambio de plan según crecimiento

## 🔒 Seguridad

- Autenticación JWT para administradores
- Validación de permisos por endpoint
- Sanitización de datos de entrada
- Sesiones seguras con expiración

## 🚀 Próximas Funcionalidades

- [ ] Reportes avanzados y exportación
- [ ] Notificaciones push por vencimientos
- [ ] Integración con pasarelas de pago
- [ ] Logs de auditoría
- [ ] Métricas de uso por clínica
- [ ] Templates de workflows N8N

## 🛠️ Desarrollo

### Ejecutar Sistema Completo
```bash
# Backend
cd clinic-admin-backend
python -m uvicorn main:app --reload --port 8000

# Frontend
npm run dev
```

### Acceso
- **Frontend Principal**: http://localhost:8080
- **Admin Panel**: http://localhost:8080/admin
- **Backend API**: http://localhost:8000
- **Documentación API**: http://localhost:8000/docs

---
*Sistema desarrollado con React, TypeScript, FastAPI y MongoDB*