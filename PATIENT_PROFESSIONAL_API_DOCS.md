# Patient & Professional Management API Documentation

## Overview

Esta documentación cubre los endpoints de la API para la gestión de pacientes y profesionales en el sistema de clínicas médicas. Todos los endpoints soportan autenticación dual: Bearer Token (para frontend) y X-API-Key (para servicios externos).

## Authentication

### Bearer Token (Frontend)
```
Authorization: Bearer <jwt_token>
```

### X-API-Key (External Services)
```
X-API-Key: test123456
```

## Patient Management Endpoints

### 1. List Patients
**GET** `/api/patients/`
- **Description**: List patients with filters
- **Authentication**: Bearer Token or X-API-Key
- **Query Parameters**:
  - `skip` (int, default=0): Skip results for pagination
  - `limit` (int, default=50, max=100): Limit results
  - `clinic_id` (str, optional): Filter by clinic ID
  - `status` (str, optional): Filter by patient status (active|inactive|archived)
  - `search` (str, optional): Search in name, DNI, email, phone

**Example**:
```bash
curl -H "X-API-Key: test123456" \
  "http://pampaservers.com:60519/api/patients/?clinic_id=TEST_CLINIC_2024&limit=10"
```

### 2. Get Patient by ID
**GET** `/api/patients/{patient_id}`
- **Description**: Get specific patient by ID
- **Authentication**: Bearer Token or X-API-Key
- **Path Parameters**: `patient_id` (str): Patient ObjectId

**Example**:
```bash
curl -H "X-API-Key: test123456" \
  "http://pampaservers.com:60519/api/patients/67890abcdef123456789012"
```

### 3. Search Patient by DNI ⭐ NEW
**GET** `/api/patients/search/by-dni`
- **Description**: Search patient by DNI within a specific clinic
- **Authentication**: Bearer Token or X-API-Key
- **Query Parameters**:
  - `clinic_id` (str, required): Clinic ID
  - `dni` (str, required): Patient DNI

**Example**:
```bash
curl -H "X-API-Key: test123456" \
  "http://pampaservers.com:60519/api/patients/search/by-dni?clinic_id=TEST_CLINIC_2024&dni=12345678"
```

### 4. Get Patients by Clinic
**GET** `/api/patients/clinic/{clinic_id}`
- **Description**: Get all patients for a specific clinic
- **Authentication**: Bearer Token or X-API-Key
- **Path Parameters**: `clinic_id` (str): Clinic ID
- **Query Parameters**: Same as list patients

### 5. Create Patient
**POST** `/api/patients/`
- **Description**: Create new patient
- **Authentication**: Bearer Token or X-API-Key (Admin only)
- **Required Fields**:
  - `clinic_id` (str): Clinic ID
  - `first_name` (str): Patient first name
  - `last_name` (str): Patient last name
  - `dni` (str): Patient DNI (unique per clinic)
  - `address` (str): Patient address
  - `cell_phone` (str): Patient phone
- **Optional Fields**:
  - `mutual` (str): Insurance/mutual
  - `email` (str): Patient email
  - `birth_date` (date): Birth date
  - `medical_notes` (str): Medical notes

**Example**:
```bash
curl -X POST -H "X-API-Key: test123456" \
  -H "Content-Type: application/json" \
  -d '{
    "clinic_id": "TEST_CLINIC_2024",
    "first_name": "Juan",
    "last_name": "Pérez",
    "dni": "98765432",
    "address": "Av. Rivadavia 1000",
    "cell_phone": "+54 9 11 9876-5432",
    "email": "juan.perez@email.com"
  }' \
  "http://pampaservers.com:60519/api/patients/"
```

### 6. Update Patient ⭐ ENHANCED
**PUT** `/api/patients/{patient_id}`
- **Description**: Update patient information
- **Authentication**: Bearer Token or X-API-Key
- **Path Parameters**: `patient_id` (str): Patient ObjectId
- **Body**: PatientUpdate model (all fields optional)
- **Notes**: 
  - `last_visit` cannot be updated directly (only through appointments)
  - DNI uniqueness validated within clinic

**Example**:
```bash
curl -X PUT -H "X-API-Key: test123456" \
  -H "Content-Type: application/json" \
  -d '{
    "cell_phone": "+54 9 11 1111-2222",
    "email": "juan.perez.new@email.com",
    "medical_notes": "Updated medical history"
  }' \
  "http://pampaservers.com:60519/api/patients/67890abcdef123456789012"
```

### 7. Share Patient with Professional ⭐ NEW
**PATCH** `/api/patients/{patient_id}/share`
- **Description**: Share patient information with a professional
- **Authentication**: Bearer Token or X-API-Key
- **Path Parameters**: `patient_id` (str): Patient ObjectId
- **Query Parameters**:
  - `professional_id` (str, required): Professional ObjectId
  - `notes` (str, optional): Notes about sharing

**Example**:
```bash
curl -X PATCH -H "X-API-Key: test123456" \
  "http://pampaservers.com:60519/api/patients/67890abcdef123456789012/share?professional_id=12345abcdef678901234567&notes=Derivación para evaluación especializada"
```

### 8. Create Appointment with Visit History ⭐ NEW
**POST** `/api/patients/clinic/{clinic_id}/appointment`
- **Description**: Create appointment and add visit to patient history
- **Authentication**: Bearer Token or X-API-Key
- **Path Parameters**: `clinic_id` (str): Clinic ID
- **Query Parameters**:
  - `patient_id` (str, required): Patient ObjectId
  - `professional_id` (str, required): Professional ObjectId
  - `appointment_date` (datetime, required): Appointment date/time
  - `diagnosis` (str, optional): Medical diagnosis
  - `treatment` (str, optional): Treatment prescribed
  - `notes` (str, optional): Visit notes

**Example**:
```bash
curl -X POST -H "X-API-Key: test123456" \
  "http://pampaservers.com:60519/api/patients/clinic/TEST_CLINIC_2024/appointment?patient_id=67890abcdef123456789012&professional_id=12345abcdef678901234567&appointment_date=2024-01-15T10:30:00&diagnosis=Control rutinario&treatment=Continuar medicación&notes=Paciente estable"
```

### 9. Add Visit to History
**POST** `/api/patients/{patient_id}/visit`
- **Description**: Add visit to patient history
- **Authentication**: Bearer Token or X-API-Key (Admin only)

### 10. Get Patient History
**GET** `/api/patients/{patient_id}/history`
- **Description**: Get patient visit history
- **Authentication**: Bearer Token or X-API-Key

### 11. Archive Patient (Soft Delete)
**DELETE** `/api/patients/{patient_id}`
- **Description**: Archive patient (soft delete)
- **Authentication**: Bearer Token or X-API-Key (Admin only)

## Professional Management Endpoints

### 1. List Professionals
**GET** `/api/professionals/`
- **Description**: List professionals with filters
- **Authentication**: Bearer Token or X-API-Key
- **Query Parameters**:
  - `skip`, `limit`: Pagination
  - `clinic_id` (str, optional): Filter by clinic
  - `status` (str, optional): Filter by status (active|inactive|vacation)
  - `speciality` (str, optional): Filter by specialty
  - `search` (str, optional): Search in name, email, specialty, license

### 2. Get Professional by ID
**GET** `/api/professionals/{professional_id}`
- **Description**: Get specific professional by ID
- **Authentication**: Bearer Token or X-API-Key

### 3. Get Professionals by Clinic
**GET** `/api/professionals/clinic/{clinic_id}`
- **Description**: Get professionals for a specific clinic
- **Authentication**: Bearer Token or X-API-Key

### 4. Create Professional
**POST** `/api/professionals/`
- **Description**: Create new professional
- **Authentication**: Bearer Token or X-API-Key (Admin only)
- **Required Fields**:
  - `clinic_id` (str): Clinic ID
  - `first_name`, `last_name` (str): Professional name
  - `speciality` (str): Medical specialty
  - `email` (str): Professional email (unique per clinic)
  - `phone` (str): Professional phone
  - `password` (str): Login password
- **Optional Fields**:
  - `license_number` (str): Professional license
  - `bio` (str): Professional biography
  - `working_hours` (str): Working schedule
  - `consultation_fee` (float): Consultation price

### 5. Update Professional
**PUT** `/api/professionals/{professional_id}`
- **Description**: Update professional information
- **Authentication**: Bearer Token or X-API-Key (Admin only)

### 6. Toggle Professional Status
**PATCH** `/api/professionals/{professional_id}/status`
- **Description**: Change professional status
- **Authentication**: Bearer Token or X-API-Key (Admin only)
- **Query Parameters**: `status_professional` (active|inactive|vacation)

### 7. Deactivate Professional
**DELETE** `/api/professionals/{professional_id}`
- **Description**: Deactivate professional (soft delete)
- **Authentication**: Bearer Token or X-API-Key (Admin only)

### 8. Get Professional Statistics
**GET** `/api/professionals/clinic/{clinic_id}/stats`
- **Description**: Get professional statistics for a clinic
- **Authentication**: Bearer Token or X-API-Key

## Data Models

### Patient Model
```json
{
  "id": "ObjectId",
  "clinic_id": "string",
  "first_name": "string",
  "last_name": "string", 
  "dni": "string",
  "address": "string",
  "cell_phone": "string",
  "mutual": "string|null",
  "email": "string|null",
  "birth_date": "date|null",
  "status_patient": "active|inactive|archived",
  "last_visit": "datetime|null",
  "visit_history": [
    {
      "visit_date": "datetime",
      "professional_id": "string",
      "professional_name": "string",
      "diagnosis": "string|null",
      "treatment": "string|null", 
      "notes": "string|null",
      "files": []
    }
  ],
  "medical_files": [],
  "medical_notes": "string|null",
  "shared_with": [
    {
      "professional_id": "string",
      "professional_name": "string",
      "shared_date": "datetime",
      "shared_by": "string",
      "notes": "string|null"
    }
  ],
  "created_at": "datetime",
  "updated_at": "datetime"
}
```

### Professional Model
```json
{
  "id": "ObjectId",
  "clinic_id": "string",
  "first_name": "string",
  "last_name": "string",
  "speciality": "string",
  "email": "string",
  "phone": "string",
  "license_number": "string|null",
  "status_professional": "active|inactive|vacation",
  "is_active": "boolean",
  "can_login": "boolean",
  "permissions": ["string"],
  "bio": "string|null",
  "working_hours": "string|null",
  "consultation_fee": "float|null",
  "created_at": "datetime",
  "updated_at": "datetime",
  "last_login": "datetime|null"
}
```

## Key Features

### 🔐 Dual Authentication
- **Bearer Token**: For frontend React application
- **X-API-Key**: For external services and integrations

### 📊 Patient Management
- ✅ CRUD operations with clinic isolation
- ✅ DNI-based search within clinics
- ✅ Visit history tracking with professional attribution
- ✅ Information sharing between professionals
- ✅ Automatic last_visit updates through appointments

### 👨‍⚕️ Professional Management  
- ✅ Complete CRUD with clinic limits enforcement
- ✅ Status management (active/inactive/vacation)
- ✅ Specialty and license tracking
- ✅ Statistics and reporting

### 🏥 Business Logic
- **Clinic Isolation**: All operations respect clinic boundaries
- **Data Integrity**: DNI uniqueness per clinic, email uniqueness per professional
- **Visit Tracking**: last_visit only updated through actual appointments
- **Professional Limits**: Enforced based on clinic subscription plan
- **Soft Deletes**: Archive instead of hard delete for audit trail

## Testing with Test Data

Run the test data loader to create sample clinic with professionals and patients:

```bash
cd clinic-admin-backend
python test_data_loader.py
```

This creates:
- **Test Clinic**: `TEST_CLINIC_2024`
- **Professionals**: 
  - María Fernández (General Medicine) - `maria.fernandez@clinicagarcia.com`
  - Carlos Rodríguez (Cardiology) - `carlos.rodriguez@clinicagarcia.com`
- **Patients**:
  - Ana González (DNI: 12345678)
  - Roberto Martínez (DNI: 87654321)  
  - Laura Silva (DNI: 11223344)
- **Sample visit history and sharing records**

## Swagger Documentation

Access interactive API documentation at:
- **Production**: http://pampaservers.com:60519/docs
- **Authorization**: Use "Authorize" button with `test123456` for X-API-Key testing