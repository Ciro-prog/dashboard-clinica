# X-API-Key Authentication Setup

## Overview

The FastAPI backend now supports X-API-Key header authentication alongside the existing JWT Bearer token authentication. This enables users to test APIs directly in Swagger UI using the "Try it out" feature.

## Changes Made

### 1. Updated Dependencies (`app/auth/dependencies.py`)
- Added `APIKeyHeader` for X-API-Key detection
- Created `verify_api_key()` function to validate API keys
- Added `get_user_or_api_key()` for dual authentication support
- Made HTTPBearer optional to prevent conflicts

### 2. Updated Main Application (`main.py`)
- Added custom OpenAPI schema with security definitions
- Added authentication schemes for both Bearer and API Key
- Created new endpoints demonstrating X-API-Key usage
- Added proper tags for better Swagger organization

### 3. New Endpoints

#### `/api/health-auth` (GET)
- **Description**: Authenticated health check supporting both Bearer and X-API-Key
- **Authentication**: Bearer token OR X-API-Key header
- **Response**: Shows authentication method used

#### `/api/test-key` (GET)
- **Description**: Test endpoint specifically for X-API-Key authentication
- **Authentication**: X-API-Key header required
- **Response**: Confirmation of successful API key authentication

#### Updated Debug Endpoints
- `/debug/plans` - Now requires X-API-Key authentication
- `/debug/clinics` - Now requires X-API-Key authentication

## Valid API Keys

The following API keys are accepted:
- `test123456` - Development/testing key
- `pampaserver2025enservermuA!` - Production key

## How to Use in Swagger UI

1. **Open Swagger Documentation**:
   ```
   http://localhost:8000/docs
   ```

2. **Click "Authorize" Button**:
   - Look for the lock icon or "Authorize" button at the top
   - Two authentication options will appear:
     - **bearerAuth**: For JWT tokens
     - **apiKeyAuth**: For X-API-Key header

3. **Enter API Key**:
   - Select "apiKeyAuth"
   - Enter: `test123456`
   - Click "Authorize"

4. **Test Endpoints**:
   - Try the "Try it out" button on any protected endpoint
   - The X-API-Key header will be automatically included

## Testing from Command Line

### Using curl:
```bash
# Test basic health (no auth required)
curl http://localhost:8000/health

# Test authenticated health with X-API-Key
curl -H "X-API-Key: test123456" http://localhost:8000/api/health-auth

# Test API key specific endpoint
curl -H "X-API-Key: test123456" http://localhost:8000/api/test-key

# Test debug endpoints
curl -H "X-API-Key: test123456" http://localhost:8000/debug/plans
```

### Using the provided scripts:
```bash
# Set up API key (already done)
./api-test.sh set-key test123456

# Test endpoints
./api-test.sh test     # Health check
./api-test.sh plans    # Debug plans endpoint
```

## Technical Implementation Details

### Authentication Flow
1. **X-API-Key Priority**: API key is checked first if present
2. **Bearer Token Fallback**: If no API key, falls back to JWT token
3. **Error Handling**: Clear error messages for authentication failures

### Security Considerations
- API keys are validated against a predefined list
- In production, API keys should be stored in database or environment variables
- All authentication errors return 401 status with descriptive messages

### OpenAPI Configuration
The Swagger UI now shows:
- **Security Schemes**: Both Bearer and API Key authentication
- **Endpoint Tags**: Organized by functionality (health, debug, auth, etc.)
- **Authentication Requirements**: Clear indication of which endpoints need authentication

## File Changes Summary

```
clinic-admin-backend/
├── app/auth/dependencies.py     # Added X-API-Key functions
├── main.py                      # Added OpenAPI config and new endpoints
├── test_api_key.py             # Test script for validation
└── API_KEY_SETUP.md            # This documentation
```

## Next Steps

1. **Production Deployment**: Update API keys for production environment
2. **Database Integration**: Store API keys in database with user association
3. **Rate Limiting**: Implement rate limiting for API key usage
4. **Logging**: Add detailed logging for API key authentication attempts

## Troubleshooting

### Common Issues:
1. **401 Unauthorized**: Check API key spelling and validity
2. **403 Forbidden**: Endpoint may require specific permissions
3. **Connection Refused**: Ensure backend is running on port 8000

### Debug Commands:
```bash
# Check backend status
curl http://localhost:8000/health

# Validate API key
curl -H "X-API-Key: test123456" http://localhost:8000/api/test-key

# Check Swagger documentation
# Open: http://localhost:8000/docs
```