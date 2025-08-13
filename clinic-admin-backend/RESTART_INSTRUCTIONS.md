# 🔄 Server Restart Instructions - New Services Endpoints

## Problem Identified
The new services endpoints are implemented but **not appearing in OpenAPI docs at 8000/docs** because the server needs to be restarted to load the new routes.

## ✅ What's Already Implemented

### 1. Backend API Endpoints (Ready)
- ✅ `GET /api/clinics/{clinic_id}/services` - Complete clinic info for N8N
- ✅ `PUT /api/clinics/{clinic_id}/services` - Update services
- ✅ `PUT /api/clinics/{clinic_id}/schedule` - Update schedule  
- ✅ `PUT /api/clinics/{clinic_id}/contact-info` - Update contact info
- ✅ `POST /api/clinics/{clinic_id}/services/initialize` - Initialize defaults

### 2. OpenAPI Documentation (Ready)
- ✅ Complete response models defined
- ✅ Detailed descriptions for all endpoints
- ✅ Proper tags: "Clinic Services"
- ✅ Parameter documentation
- ✅ Example responses

### 3. Enhanced Admin Interface (Ready)
- ✅ Tabbed clinic creation modal
- ✅ Services management interface
- ✅ Schedule configuration
- ✅ Contact info management

## 🚀 How to Restart Server

### Step 1: Stop Current Server
1. Find the terminal/command prompt running the FastAPI server
2. Press `Ctrl+C` to stop it

### Step 2: Restart Server
```bash
# Navigate to backend directory
cd D:\dashboard-clinica\clinic-admin-backend

# Start server with reload
python main.py
```

**Alternative command:**
```bash
uvicorn main:app --host 0.0.0.0 --port 8000 --reload
```

### Step 3: Verify Endpoints Loaded
Run the test script to verify endpoints are working:
```bash
python simple_openapi_test.py
```

**Expected output after restart:**
```
=== OpenAPI Documentation Test ===

1. Testing OpenAPI schema...
Total endpoints in schema: 70
FOUND: /api/clinics/{clinic_id}/services
FOUND: /api/clinics/{clinic_id}/schedule
FOUND: /api/clinics/{clinic_id}/contact-info  
FOUND: /api/clinics/{clinic_id}/services/initialize
Services endpoints found: 4/4
SUCCESS: All services endpoints in OpenAPI schema

2. Testing docs page...
SUCCESS: Docs page accessible at http://localhost:8000/docs

3. Testing live services endpoint...
SUCCESS: Services endpoint working
Clinic: Clinica Demo
Services: 6
```

## 📖 Access Documentation

After restart, the complete API documentation will be available at:

### Swagger UI (Recommended)
**http://localhost:8000/docs**
- Interactive API testing
- Try out endpoints directly
- See all parameters and responses

### ReDoc (Alternative)
**http://localhost:8000/redoc**
- Clean documentation format
- Detailed descriptions
- Better for reading

## 🧪 Test the New Endpoints

### 1. Get Clinic Services (GET)
```bash
curl -X GET "http://localhost:8000/api/clinics/{clinic_id}/services" \
  -H "X-API-Key: test123456" \
  -H "Content-Type: application/json"
```

### 2. Initialize Default Services (POST)
```bash
curl -X POST "http://localhost:8000/api/clinics/{clinic_id}/services/initialize" \
  -H "X-API-Key: test123456" \
  -H "Content-Type: application/json"
```

### 3. Update Services (PUT)
```bash
curl -X PUT "http://localhost:8000/api/clinics/{clinic_id}/services" \
  -H "X-API-Key: test123456" \
  -H "Content-Type: application/json" \
  -d '[{"service_type": "Consulta General", "base_price": 50000, "duration_minutes": 30}]'
```

## 🎯 What You'll See in Docs

After restart, in the **Swagger UI at localhost:8000/docs**, you'll find:

### New "Clinic Services" Section
1. **GET** `/api/clinics/{clinic_id}/services`
   - **Description**: Get comprehensive clinic information for N8N integration
   - **Response**: Complete clinic data with services, professionals, schedule
   - **Use case**: N8N workflows, admin interface

2. **PUT** `/api/clinics/{clinic_id}/services` 
   - **Description**: Update clinic services configuration
   - **Request Body**: Array of ClinicService objects
   - **Use case**: Admin interface service management

3. **PUT** `/api/clinics/{clinic_id}/schedule`
   - **Description**: Update clinic working schedule  
   - **Request Body**: ClinicSchedule object with working hours
   - **Use case**: Schedule configuration

4. **PUT** `/api/clinics/{clinic_id}/contact-info`
   - **Description**: Update clinic contact information
   - **Request Body**: ClinicContactInfo object
   - **Use case**: Contact details management

5. **POST** `/api/clinics/{clinic_id}/services/initialize`
   - **Description**: Initialize clinic with N8N default services
   - **Response**: Confirmation with counts
   - **Use case**: New clinic setup

## ✨ Key Benefits

### For N8N Integration
- Single endpoint provides all clinic data
- Replaces hardcoded values with dynamic data  
- Backward compatible with existing workflows

### For Admin Interface
- Complete clinic setup in tabbed interface
- Service pricing and scheduling management
- Professional information integration

### For API Users
- RESTful, well-documented endpoints
- Comprehensive response data
- Type-safe with Pydantic models

## 🔍 Troubleshooting

### If endpoints still don't appear:
1. Check server logs for import errors
2. Verify all dependencies installed: `pip install -r requirements.txt`
3. Check Python path: `python --version`
4. Try force restart: Kill all Python processes and restart

### If docs page not loading:
1. Clear browser cache
2. Try different browser
3. Check server is running on port 8000
4. Verify no firewall blocking port

### If endpoints return errors:
1. Check database connection
2. Verify clinic IDs exist
3. Check API key authentication
4. Review server logs

## Status
- ✅ **Implementation**: Complete
- ❌ **Server Status**: Needs restart
- ⏳ **Next Step**: Restart server to enable endpoints