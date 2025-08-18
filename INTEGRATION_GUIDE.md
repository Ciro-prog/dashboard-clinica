# Guía de Integración Frontend-Backend

Esta guía explica cómo usar el sistema integrado de Frontend (React/TypeScript) con el Backend (FastAPI/MongoDB).

## 🚀 Inicio Rápido

### Paso 1: Iniciar el Backend
```bash
cd clinic-admin-backend
python main.py
```
El backend estará disponible en: `http://localhost:8000`

### Paso 2: Iniciar el Frontend
```bash
cd dashboard-clinica
npm run dev
```
El frontend estará disponible en: `http://localhost:8080`

## 🔐 Sistema de Autenticación Integrado

### Credenciales de Prueba

#### Clínica Demo
- **Email**: `demo@clinica-dashboard.com`
- **Password**: `demo123`
- **Tipo**: Clínica con datos completos

#### Admin (Para administración)
- **Email**: `admin@clinica-dashboard.com`
- **Password**: `admin123`
- **Tipo**: Super administrador

### Flujo de Autenticación

1. **Frontend**: Usuario ingresa credenciales en `LoginForm.tsx`
2. **API Call**: `POST /api/auth/login` con:
   ```json
   {
     "username": "email@ejemplo.com",
     "password": "contraseña",
     "user_type": "clinic"
   }
   ```
3. **Backend Response**:
   ```json
   {
     "access_token": "jwt_token",
     "token_type": "bearer",
     "user_type": "clinic",
     "user_data": {
       "id": "object_id",
       "clinic_id": "clinica-demo",
       "name_clinic": "Clínica Demo",
       "email": "demo@clinica-dashboard.com",
       ...
     }
   }
   ```
4. **Frontend**: Guarda token y datos en localStorage

## 📊 APIs Disponibles

### Autenticación
- `POST /api/auth/login` - Login de clínicas y admins

### Clínicas
- `GET /api/clinics/` - Listar clínicas (admin)
- `GET /api/clinics/{id}` - Obtener clínica específica
- `POST /api/clinics/` - Crear clínica (admin)
- `PUT /api/clinics/{id}` - Actualizar clínica

### Pacientes
- `GET /api/patients/` - Listar pacientes
- `GET /api/patients/clinic/{clinic_id}` - Pacientes por clínica
- `POST /api/patients/` - Crear paciente
- `PUT /api/patients/{id}` - Actualizar paciente
- `POST /api/patients/{id}/visit` - Agregar visita
- `POST /api/patients/{id}/files` - Subir archivo médico

### Profesionales
- `GET /api/professionals/` - Listar profesionales
- `GET /api/professionals/clinic/{clinic_id}` - Profesionales por clínica
- `POST /api/professionals/` - Crear profesional
- `PUT /api/professionals/{id}` - Actualizar profesional

## 🔧 Configuración

### Frontend (vite.config.ts)
```typescript
proxy: {
  '/api': {
    target: 'http://localhost:8000',  // Backend FastAPI
    changeOrigin: true,
    secure: false
  }
}
```

### Backend (clinic-admin-backend/.env)
```env
MONGODB_URL=mongodb://localhost:27017/clinica-dashboard
DATABASE_NAME=clinica-dashboard
SECRET_KEY=clinic-dashboard-secret-key-change-in-production-2024
CORS_ORIGINS=http://localhost:3000,http://localhost:5173,http://localhost:8080
```

## 📋 Modelos de Datos

### Clínica
```typescript
interface ClinicUser {
  id: string;
  clinic_id: string;
  name_clinic: string;
  suscriber: string;
  email: string;
  cell_phone: string;
  address: string;
  status_clinic: 'active' | 'inactive' | 'suspended';
  subscription_status: string;
  subscription_plan: string;
}
```

### Paciente
```python
class PatientBase(BaseModel):
    clinic_id: str
    first_name: str
    last_name: str
    dni: str                    # Campo obligatorio
    address: str                # Campo obligatorio  
    cell_phone: str             # Campo obligatorio
    mutual: Optional[str]       # Obra social (opcional)
    email: Optional[EmailStr]
    last_visit: Optional[datetime]
    visit_history: List[VisitHistory]
    medical_files: List[MedicalFile]
```

### Profesional
```python
class ProfessionalBase(BaseModel):
    clinic_id: str
    first_name: str
    last_name: str
    speciality: str
    email: EmailStr
    phone: str
    status_professional: str
    license_number: Optional[str]
```

## 🧪 Testing

### Test del Backend
```bash
# Health check
curl http://pampaservers.com:60519/health

# Login test
curl -X POST http://pampaservers.com:60519/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "username": "demo@clinica-dashboard.com",
    "password": "demo123",
    "user_type": "clinic"
  }'
```

### Test del Frontend
1. Abrir `http://localhost:8080`
2. Usar credenciales: `demo@clinica-dashboard.com` / `demo123`
3. Verificar acceso al dashboard

## 🔄 Flujo de Desarrollo

### Desarrollo Local
1. Backend: `cd clinic-admin-backend && python main.py`
2. Frontend: `cd dashboard-clinica && npm run dev`
3. Abrir `http://localhost:8080`

### Base de Datos
- MongoDB debe estar ejecutándose en `localhost:27017`
- Inicializar con: `cd clinic-admin-backend && python init_db_clean.py`

## 📈 Próximos Pasos

### Funcionalidades Pendientes de Integración
1. **Citas/Appointments**: Integrar modelo de citas
2. **Métricas**: Dashboard con estadísticas
3. **Archivos**: Upload de documentos médicos
4. **WhatsApp**: Integración con WAHA existente
5. **Calendario**: Sistema de citas integrado

### Mejoras Sugeridas
1. **Autenticación**: Implementar refresh tokens
2. **Validación**: Mejores mensajes de error
3. **Performance**: Paginación y filtros
4. **Security**: Rate limiting y validaciones
5. **Testing**: Tests automatizados

## 🔐 Seguridad

### Producción
- Cambiar `SECRET_KEY` en `.env`
- Usar HTTPS
- Configurar CORS apropiados
- Implementar rate limiting
- Auditoría de logs

### Desarrollo
- Las credenciales actuales son solo para desarrollo
- No usar en producción
- Rotar claves regularmente

## 📞 Soporte

Para problemas:
1. Verificar que MongoDB esté ejecutándose
2. Revisar logs del backend: `python main.py`
3. Verificar proxy configuration en `vite.config.ts`
4. Comprobar CORS settings en backend