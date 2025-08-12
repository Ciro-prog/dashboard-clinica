# Clinic Admin Backend

Backend API para el sistema de gestión de clínicas médicas. Desarrollado con FastAPI, MongoDB y Python.

## 🚀 Características

- **FastAPI**: API REST moderna y rápida
- **MongoDB**: Base de datos NoSQL con Motor (async driver)
- **JWT Authentication**: Autenticación segura para clínicas y administradores
- **Pydantic**: Validación de datos robusta
- **CORS**: Configurado para el frontend
- **Upload de archivos**: Manejo de documentos médicos
- **Admin UI**: Interface administrativa con Streamlit

## 📋 Requisitos

- Python 3.8+
- MongoDB 4.4+
- pip o poetry

## 🛠️ Instalación

### 1. Clonar y configurar el proyecto

```bash
cd clinic-admin-backend
```

### 2. Crear entorno virtual

```bash
python -m venv venv

# En Windows
venv\Scripts\activate

# En Linux/Mac
source venv/bin/activate
```

### 3. Instalar dependencias

```bash
pip install -r requirements.txt
```

### 4. Configurar variables de entorno

```bash
# Copiar el archivo de ejemplo
cp .env.example .env

# Editar las variables según tu configuración
```

Variables principales:
```env
MONGODB_URL=mongodb://localhost:27017/clinica-dashboard
DATABASE_NAME=clinica-dashboard
SECRET_KEY=tu-clave-secreta-super-segura
```

### 5. Inicializar la base de datos

```bash
python init_db.py
```

Este comando creará:
- Índices necesarios
- Usuario admin por defecto
- Clínica de ejemplo
- Datos de prueba

### 6. Ejecutar la aplicación

```bash
python main.py
```

La API estará disponible en: `http://localhost:8000`

## 🔐 Credenciales por defecto

### Administrador
- **Usuario**: admin
- **Email**: admin@clinica-dashboard.com
- **Password**: admin123
- **Rol**: super_admin

### Clínica de prueba
- **Clinic ID**: clinica-demo
- **Email**: demo@clinica-dashboard.com
- **Password**: demo123

## 📚 API Endpoints

### Autenticación
- `POST /api/auth/login` - Login para admin/clínica
- `POST /api/auth/token` - OAuth2 compatible

### Clínicas
- `GET /api/clinics/` - Listar clínicas (admin)
- `GET /api/clinics/{id}` - Obtener clínica
- `POST /api/clinics/` - Crear clínica (admin)
- `PUT /api/clinics/{id}` - Actualizar clínica
- `PATCH /api/clinics/{id}/subscription` - Actualizar suscripción

### Profesionales
- `GET /api/professionals/` - Listar profesionales
- `GET /api/professionals/clinic/{clinic_id}` - Por clínica
- `POST /api/professionals/` - Crear profesional
- `PUT /api/professionals/{id}` - Actualizar profesional
- `PATCH /api/professionals/{id}/status` - Cambiar estado

### Pacientes
- `GET /api/patients/` - Listar pacientes
- `GET /api/patients/clinic/{clinic_id}` - Por clínica
- `POST /api/patients/` - Crear paciente
- `PUT /api/patients/{id}` - Actualizar paciente
- `POST /api/patients/{id}/visit` - Agregar visita
- `POST /api/patients/{id}/files` - Subir archivo médico

## 🗂️ Estructura del proyecto

```
clinic-admin-backend/
├── app/
│   ├── api/              # Endpoints REST
│   │   ├── auth.py
│   │   ├── clinics.py
│   │   ├── patients.py
│   │   └── professionals.py
│   ├── auth/             # Autenticación y seguridad
│   │   ├── dependencies.py
│   │   └── security.py
│   ├── core/             # Configuración core
│   │   ├── config.py
│   │   └── database.py
│   └── models/           # Modelos Pydantic
│       ├── admin.py
│       ├── clinic.py
│       ├── patient.py
│       └── professional.py
├── admin_ui/             # Interface administrativa
├── uploads/              # Archivos subidos
├── main.py               # Punto de entrada
├── init_db.py            # Inicialización BD
└── requirements.txt      # Dependencias
```

## 📊 Modelos de datos

### Clínica
- Información básica (nombre, email, teléfono)
- Estado y suscripción
- Límites de profesionales/pacientes
- Configuración WhatsApp/N8N

### Profesional
- Datos personales y contacto
- Especialidad y matrícula
- Estado (activo/inactivo/vacaciones)
- Vinculación a clínica

### Paciente
- **Campos obligatorios**: nombre, DNI, domicilio, teléfono
- **Campos opcionales**: email, obra social, fecha nacimiento
- Historial de visitas
- Archivos médicos
- Última visita

## 🔒 Autenticación

El sistema soporta dos tipos de usuarios:

1. **Administradores**: Gestión completa del sistema
2. **Clínicas**: Acceso a sus propios datos

Los tokens JWT incluyen información del tipo de usuario y permisos correspondientes.

## 📁 Manejo de archivos

Los archivos médicos se almacenan en la carpeta `uploads/` con la estructura:
```
uploads/patients/{patient_id}/archivo.pdf
```

Para producción, se recomienda usar un servicio de almacenamiento en la nube.

## 🐳 Docker (Opcional)

```dockerfile
# Dockerfile básico
FROM python:3.9-slim

WORKDIR /app
COPY requirements.txt .
RUN pip install -r requirements.txt

COPY . .
EXPOSE 8000

CMD ["python", "main.py"]
```

## 🧪 Testing

### Configuración de Testing

El backend corre en **puerto 8000** por defecto. Para testing manual y automatizado:

```bash
# Iniciar servidor de desarrollo
python main.py
# Servidor disponible en: http://localhost:8000

# Ejecutar tests (cuando estén implementados)
pytest

# Coverage
pytest --cov=app

# Test manual con curl
curl -X GET http://localhost:8000/api/health
```

### Testing de Tipos de Consulta

#### Endpoints para Testing de Servicios:
```bash
# Obtener profesionales con servicios
GET http://localhost:8000/api/admin/clinics/{clinic_id}/professionals
Authorization: Bearer {admin_token}

# Crear profesional con servicios
POST http://localhost:8000/api/admin/clinics/{clinic_id}/professionals
Content-Type: application/json
Authorization: Bearer {admin_token}
{
  "first_name": "Dr. Juan",
  "last_name": "Pérez",
  "speciality": "Cardiología",
  "phone": "+54911234567",
  "password": "password123",
  "services": [
    {
      "service_type": "Consulta General",
      "description": "Consulta médica general",
      "price": 5000,
      "duration_minutes": 30,
      "is_active": true
    }
  ]
}

# Actualizar profesional y servicios
PUT http://localhost:8000/api/admin/clinics/{clinic_id}/professionals/{professional_id}
Content-Type: application/json
Authorization: Bearer {admin_token}
{
  "services": [
    {
      "id": "srv-consulta-123456",
      "service_type": "Consulta Especializada",
      "description": "Consulta con especialista",
      "price": 8000,
      "duration_minutes": 45,
      "is_active": true
    }
  ]
}
```

#### Tipos de Consulta Predefinidos:
- **Consulta General** - Consulta médica general (precio base)
- **Consulta de Control** - Seguimiento y control
- **Implante Dental** - Procedimiento de implante
- **Limpieza Dental** - Limpieza y profilaxis
- **Ortodoncia** - Tratamiento ortodóntico
- **Endodoncia** - Tratamiento de conducto
- **Cirugía Oral** - Procedimientos quirúrgicos
- **Estética Dental** - Odontología estética
- **Prótesis** - Trabajo protésico
- **Radiografía** - Estudios radiológicos
- **Urgencia** - Consulta de urgencia
- **Evaluación Inicial** - Primera consulta

#### Testing Manual de Funcionalidades:

1. **Buscar Tipos de Consulta**:
   - Frontend: Puerto 8082 (npm run dev)
   - Backend: Puerto 8000 (python main.py)
   - Acceder: Admin Dashboard → Clínicas → Profesionales → Servicios
   - Probar búsqueda en tiempo real por tipo de servicio

2. **Crear Tipos Personalizados**:
   - Escribir nombre no existente en campo "Tipo de Servicio"
   - Verificar que aparece indicador "Nuevo tipo de servicio"
   - Guardar y verificar que se marca como "Personalizado"

3. **Filtrado de Servicios**:
   - Usar campo "Buscar Servicios" en modal de gestión
   - Probar términos: "consulta", "dental", "implante"
   - Verificar contador de resultados

4. **Validación de Precios**:
   - Probar precios negativos (debe prevenir)
   - Probar precios con decimales (debe funcionar)
   - Verificar formato de moneda en display

### Scripts de Testing Rápido:

```bash
# Test de conexión backend
curl http://localhost:8000/api/health

# Test de autenticación admin
curl -X POST http://localhost:8000/api/auth/admin/login \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"admin123"}'

# Test de obtener clínicas
curl -X GET http://localhost:8000/api/admin/clinics \
  -H "Authorization: Bearer {token}"
```

## 🚀 Producción

### Configuraciones importantes:

1. **SECRET_KEY**: Usar una clave fuerte y única
2. **MongoDB**: Configurar replica set y autenticación
3. **CORS**: Ajustar origins permitidos
4. **SSL/TLS**: Certificados para HTTPS
5. **Logs**: Configurar logging adecuado
6. **Backup**: Estrategia de respaldo de MongoDB

### Variables de producción:
```env
DEBUG=False
SECRET_KEY=clave-super-secreta-de-produccion
MONGODB_URL=mongodb+srv://user:pass@cluster.mongodb.net/clinica-dashboard
CORS_ORIGINS=https://tu-dominio.com
```

## 🔧 Desarrollo

### Agregar nuevas funcionalidades:

1. Crear modelo en `app/models/`
2. Implementar API en `app/api/`
3. Agregar rutas en `main.py`
4. Actualizar `init_db.py` si es necesario

### Code style:
```bash
# Formatear código
black app/
isort app/

# Linting
flake8 app/
```

## 📞 Soporte

Para problemas o consultas, contactar al equipo de desarrollo.

## 📄 Licencia

Proyecto propietario - Todos los derechos reservados.