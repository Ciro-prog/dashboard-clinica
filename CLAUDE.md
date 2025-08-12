# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a medical clinic dashboard built with Vite + React + TypeScript + shadcn/ui. It serves as a management interface for medical clinics to handle patients, appointments, professionals, and WhatsApp Business integration for automated patient communication.

## Key Technologies

- **Frontend**: React 18, TypeScript, Tailwind CSS
- **UI Components**: shadcn/ui (Radix UI primitives)
- **Build Tool**: Vite with SWC
- **State Management**: React hooks + TanStack Query
- **Routing**: React Router v6
- **Form Handling**: React Hook Form + Zod validation

## Development Commands

```bash
# Start development server
npm run dev

# Build for production
npm run build

# Build for development
npm run build:dev

# Lint code
npm run lint

# Preview production build
npm run preview

# Install dependencies
npm install
```

## Core Architecture

### Authentication System
- Custom JWT-based authentication for clinics (not individual users)
- Clinic data stored in localStorage (`clinic_token`, `clinic_data`)
- Login uses email/password against Strapi backend
- Authentication functions in `src/lib/clinicAuth.ts`

### API Integration
- Backend: Strapi CMS running on `pampaservers.com:60520`
- API proxy configured in vite.config.ts (`/api` → backend)
- Type-safe API client in `src/lib/clinicApi.ts`
- Supports Clinics, Patients, Professionals, Appointments, Metrics

### External Integrations

#### WhatsApp Business (WAHA)
- WhatsApp Business API via WAHA server at `pampaservers.com:60513`
- Session management for WhatsApp connections
- QR code generation for device pairing
- Component: `src/components/WhatsAppWAHA.tsx`
- Auto-refresh system for connection monitoring

#### N8N Automation
- Workflow automation server at `dev-n8n.pampaservers.com`
- Organization by clinic folders (`{suscriber} - Operativa`)
- Workflow monitoring and status checking
- CORS limitations in development environment

### Component Structure
- **Pages**: `src/pages/` - Main routes (Index, NotFound)
- **Components**: `src/components/` - Business components
- **UI Components**: `src/components/ui/` - shadcn/ui components
- **Hooks**: `src/hooks/` - Custom React hooks
- **Lib**: `src/lib/` - Utilities and API clients

### Data Models
Key entities managed by the system:
- **Clinic**: Medical facility with subscription status
- **Patient**: Clinic patients with contact info and status
- **Professional**: Medical staff with specializations
- **Appointment**: Scheduled medical appointments
- **Metric**: WhatsApp conversation analytics

## Development Patterns

### State Management
- Use React hooks for local state
- TanStack Query for server state and caching
- Authentication state in localStorage with helper functions

### Error Handling
- Try-catch blocks with console logging
- User-friendly error messages in UI
- Graceful degradation for external services

### API Calls
- Use the typed API clients in `src/lib/clinicApi.ts`
- Always handle loading and error states
- Implement proper pagination for large datasets

### Component Patterns
- Functional components with hooks
- Props interfaces defined with TypeScript
- Conditional rendering based on data states
- Loading skeletons and error boundaries

## External Service Configuration

### Proxy Configuration (vite.config.ts)
```javascript
proxy: {
  '/api': {
    target: 'http://pampaservers.com:60520',
    changeOrigin: true,
    secure: false
  }
}
```

### Vercel Deployment (vercel.json)
- API rewrites for production deployment
- WAHA integration at `/api/waha/*`
- N8N integration at `/api/n8n/*`
- Strapi proxy at `/api/proxy/*`

## Common Development Tasks

### Adding New Components
1. Create component in appropriate directory
2. Use TypeScript interfaces for props
3. Follow shadcn/ui patterns for UI components
4. Import and use in parent components

### Working with API Data
1. Define TypeScript interfaces in `clinicApi.ts`
2. Create API functions using the `apiRequest` helper
3. Use TanStack Query for data fetching
4. Handle loading/error states in components

### WhatsApp Integration
- Session names derived from clinic.suscriber or clinic.clinic_id
- Multiple QR endpoints tried for reliability
- Auto-refresh system runs every 3 minutes when enabled
- Status monitoring: WORKING, STARTING, SCAN_QR_CODE, STOPPED, FAILED

### Styling Guidelines
- Use Tailwind CSS utility classes
- Follow medical theme color scheme (medical-500, etc.)
- Responsive design with mobile-first approach
- Use shadcn/ui components for consistency

## Important Notes

### Environment-Specific Behavior
- Development: Uses localhost:8080 with proxy configuration
- Production: Uses Vercel rewrites for API routing
- CORS limitations with N8N in development (shows estimated data)

### Security Considerations
- API keys stored in environment variables
- Simple JWT implementation (development only)
- Password comparison is plaintext (not for production)
- Authentication tokens have 24-hour expiration

### Clinic Session Management
- Each clinic has a unique WhatsApp session
- Session names use suscriber field as primary identifier
- Fallback to clinic_id if suscriber not available
- Auto-cleanup of failed sessions and connections

## Professional Services System

### Service Types Management
- **Component**: `src/components/ProfessionalServicesManager.tsx`
- **Predefined Types**: Consulta General, Implante Dental, Limpieza, Ortodoncia, etc.
- **Dynamic Types**: Users can add custom service types
- **Pricing**: Individual pricing per professional per service type
- **Search & Filter**: Built-in search and filtering capabilities

### Service Type Structure
```typescript
interface ProfessionalService {
  id: string;
  service_type: string;
  description: string;
  price: number;
  duration_minutes?: number;
  is_active: boolean;
}
```

### Common Service Types
Available predefined consultation types:
- **Consulta General** - General medical consultation
- **Consulta de Control** - Follow-up consultation
- **Implante Dental** - Dental implant procedure
- **Limpieza Dental** - Dental cleaning
- **Ortodoncia** - Orthodontic treatment
- **Endodoncia** - Root canal treatment
- **Cirugía Oral** - Oral surgery
- **Estética Dental** - Cosmetic dentistry
- **Prótesis** - Prosthetic work
- **Radiografía** - X-ray imaging
- **Urgencia** - Emergency consultation
- **Evaluación Inicial** - Initial evaluation

### Testing Service Types

#### Manual Testing Steps
1. **Access Professional Management**:
   ```
   Admin Dashboard → Clínicas Tab → [Select Clinic] → Profesionales Button
   ```

2. **Create/Edit Professional**:
   ```
   Professional Management → Agregar Profesional / Editar Button
   ```

3. **Manage Services**:
   ```
   Professional Card → Servicios Button → Service Management Modal
   ```

4. **Test Service Operations**:
   - **Add Service**: Select predefined type or create custom type
   - **Search Services**: Use search filter to find specific service types
   - **Edit Service**: Modify price, duration, or description
   - **Toggle Status**: Activate/deactivate services
   - **Delete Service**: Remove services with confirmation

#### Expected Behavior
- **Service Creation**: Should generate unique IDs and validate required fields
- **Price Validation**: Must be positive numbers with decimal support
- **Search Functionality**: Should filter services by type name in real-time
- **Custom Types**: Should allow adding new service types not in predefined list
- **State Management**: Changes should reflect immediately in parent components

#### Common Test Cases
```typescript
// Test service creation
const newService = {
  service_type: "Consulta Especializada",
  description: "Consulta con especialista",
  price: 8000,
  duration_minutes: 45,
  is_active: true
};

// Test search functionality
searchTerm: "consulta" → should show all consultation types
searchTerm: "dental" → should show dental-related services
searchTerm: "custom" → should show user-created types

// Test price formatting
price: 5000.50 → should display as "$5000.50"
price: 0 → should show validation error
price: negative → should prevent submission
```

#### API Endpoints for Testing
- **GET** `/api/admin/clinics/{clinic_id}/professionals` - Get professionals with services
- **POST** `/api/admin/clinics/{clinic_id}/professionals` - Create professional
- **PUT** `/api/admin/clinics/{clinic_id}/professionals/{professional_id}` - Update professional
- **DELETE** `/api/admin/clinics/{clinic_id}/professionals/{professional_id}` - Delete professional

#### Debugging Service Issues
1. **Services Not Showing**: Check browser console for API errors
2. **Search Not Working**: Verify search state and filter logic
3. **Price Display Issues**: Check number formatting and currency display
4. **State Not Updating**: Verify onServicesUpdate callback execution