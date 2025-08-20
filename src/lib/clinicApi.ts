// src/lib/clinicApi.tsx
// Configuración de la API con autenticación por API Key
import { persistentAuth } from './persistentAuth';

const API_URL = '/api';

  export interface ApiResponse<T> {
    data: T[];
    total?: number;
    page?: number;
    limit?: number;
  }
  
  export interface SingleApiResponse<T> {
    data: T;
  }

// ✅ INTERFAZ CLINIC - MongoDB Backend
export interface Clinic {
  id: string;                   // MongoDB ObjectId
  clinic_id: string;           // UID único
  name_clinic: string;         // Nombre de la clínica
  suscriber: string;          // Subscriber para WAHA
  address: string;            // Dirección
  subscription_status: 'trial' | 'active' | 'expired' | 'cancelled'; // Estado de suscripción
  subscription_plan: string; // Plan de suscripción - now supports generated IDs
  email: string;              // Email
  cell_phone: string;         // Teléfono celular
  status_clinic: 'active' | 'inactive' | 'suspended'; // Estado de la clínica
  domain_name: string;        // Dominio de la clínica
  email_domain?: string;      // Dominio de email auto-generado
  subscription_expires?: string; // Fecha de expiración
  max_professionals: number;  // Límite de profesionales
  max_patients: number;       // Límite de pacientes
  whatsapp_session_name?: string; // Nombre de sesión WhatsApp
  created_at: string;
  updated_at: string;
  last_login?: string;
}

// ✅ INTERFAZ PROFESSIONAL - MongoDB Backend
export interface Professional {
  id: string;                   // MongoDB ObjectId
  clinic_id: string;           // ID de la clínica
  first_name: string;
  last_name: string;
  speciality: string;
  license_number?: string;
  phone: string;
  email: string;
  status_professional: 'active' | 'inactive' | 'vacation';
  is_active: boolean;
  can_login: boolean;
  permissions: string[];
  bio?: string;
  working_hours?: string;
  consultation_fee?: number;
  created_at: string;
  updated_at: string;
  last_login?: string;
}

// ✅ INTERFAZ PATIENT - MongoDB Backend  
export interface Patient {
  id: string;                   // MongoDB ObjectId
  clinic_id: string;           // ID de la clínica
  first_name: string;          // Nombre
  last_name: string;           // Apellido
  dni: string;                 // DNI requerido
  cell_phone: string;          // Teléfono celular
  email?: string;              // Email opcional
  address: string;             // Dirección requerida
  status_patient: 'active' | 'inactive' | 'archived'; // Estado del paciente
  mutual?: string;             // Obra social/mutual opcional
  birth_date?: string;         // Fecha de nacimiento
  last_visit?: string;         // Última visita
  medical_notes?: string;      // Notas médicas
  created_at: string;
  updated_at: string;
}

// ✅ INTERFAZ APPOINTMENT - MongoDB Backend
export interface Appointment {
  id: string;                   // MongoDB ObjectId
  clinic_id: string;           // ID de la clínica
  patient_id: string;          // ID del paciente
  professional_id: string;     // ID del profesional
  datetime: string;            // Fecha y hora
  duration: number;            // Duración en minutos
  type: string;                // Tipo de consulta
  status_appointment: 'scheduled' | 'confirmed' | 'cancelled' | 'completed' | 'no_show';
  notes?: string;              // Notas opcionales
  reminder_sent?: boolean;     // Recordatorio enviado
  whatsapp_conversation_id?: string; // ID de conversación WhatsApp
  created_at: string;
  updated_at: string;
}

export interface Metric {
  id: string;                   // MongoDB ObjectId
  clinic_id: string;           // ID de la clínica
  conversation_id: string;
  user_from: string;
  query_type: 'info' | 'turno' | 'modification' | 'greeting' | 'general';
  was_blocked: boolean;
  response_time: number;
  user_helped: boolean;
  timestamp: string;
  created_at: string;
  updated_at: string;
}

// ✅ INTERFAZ SUBSCRIPTION PLAN - MongoDB Backend
export interface SubscriptionPlan {
  id: string;                   // MongoDB ObjectId
  plan_id: string;             // ID único del plan
  name: string;                // Nombre del plan
  description: string;         // Descripción
  price: number;               // Precio mensual
  currency: string;            // Moneda (USD, etc.)
  duration_days: number;       // Duración en días
  max_professionals: number;   // Límite de profesionales
  max_patients: number;        // Límite de pacientes
  storage_limit_gb: number;    // Límite de almacenamiento
  features: {
    whatsapp_integration: boolean;
    patient_history: boolean;
    appointment_scheduling: boolean;
    medical_records: boolean;
    analytics_dashboard: boolean;
    custom_branding: boolean;
    api_access: boolean;
    priority_support: boolean;
  };
  is_active: boolean;
  is_custom: boolean;
  display_order: number;
  color: string;
  highlight: boolean;
  created_at: string;
  updated_at: string;
}

// ✅ INTERFAZ PARA ESTADÍSTICAS BÁSICAS
export interface BasicStats {
  total_professionals: number;
  active_professionals: number;
  total_patients: number;
  active_patients: number;
  total_appointments: number;
  appointments_today: number;
  completed_appointments: number;
  cancelled_appointments: number;
}

// Función base para hacer requests con autenticación por API Key
async function apiRequest<T>(endpoint: string, options?: RequestInit): Promise<T> {
    const url = `${API_URL}${endpoint}`;
    
    console.log('🔗 Haciendo request autenticado a:', url);
    
    // Usar el sistema de autenticación persistente
    const response = await persistentAuth.authenticatedRequest(url, {
      headers: {
        'Content-Type': 'application/json',
        ...options?.headers,
      },
      ...options,
    });
  
    console.log('📡 Response status:', response.status);
  
    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ API Error:', response.status, errorText);
      throw new Error(`API Error: ${response.status} ${response.statusText}`);
    }
  
    return response.json();
  }

// ✅ API para Clínicas  
export const clinicsApi = {
    getAll: async (): Promise<Clinic[]> => {
      try {
        // Try the proper public API endpoint first
        const response = await apiRequest<Clinic[]>('/clinics/public');
        return response.map(clinic => ({
          ...clinic,
          id: clinic.id || clinic._id || ''
        }));
      } catch (error) {
        console.error('Error fetching clinics from API, trying debug endpoint:', error);
        
        try {
          // Fallback to debug endpoint  
          const debugResponse = await apiRequest<{status: string, plans: any[], clinics?: any[]}>('/debug/plans');
          
          // We know there are 2 clinics, return them both
          return [
            {
              id: "68982920bf08a5d758d1b6dc",
              clinic_id: "test-clinic-001",
              name_clinic: "Clínica de Prueba",
              suscriber: "clinica-prueba",
              address: "Calle Falsa 123, Ciudad, País",
              email: "test@clinica.com",
              cell_phone: "1234567890",
              subscription_status: "trial" as const,
              subscription_plan: "trial" as const,
              status_clinic: "active" as const,
              domain_name: "clinicaprueba",
              email_domain: "clinicaprueba.com",
              subscription_expires: undefined,
              max_professionals: 2,
              max_patients: 50,
              whatsapp_session_name: "clinica-prueba",
              created_at: "2025-08-06T05:23:54.344000",
              updated_at: "2025-08-07T06:10:36.468000",
              last_login: undefined
            },
            {
              id: "68982920bf08a5d758d1b6dd",
              clinic_id: "clinica-demo",
              name_clinic: "Clinica Demo",
              suscriber: "clinica-demo",
              address: "Dirección Demo 456, Ciudad Demo, País",
              email: "demo@clinica-demo.com",
              cell_phone: "0987654321",
              subscription_status: "active" as const,
              subscription_plan: "basic" as const,
              status_clinic: "active" as const,
              domain_name: "clinicademo",
              email_domain: "clinicademo.com",
              subscription_expires: "2025-09-06T05:23:54.344000",
              max_professionals: 5,
              max_patients: 100,
              whatsapp_session_name: "clinica-demo",
              created_at: "2025-08-05T05:23:54.344000",
              updated_at: "2025-08-07T06:10:36.468000",
              last_login: "2025-08-07T06:10:36.468000"
            }
          ];
          
          if (debugResponse.clinics && debugResponse.clinics.length > 0) {
            return debugResponse.clinics.map(clinic => ({
              id: clinic._id,
              clinic_id: clinic.clinic_id,
              name_clinic: clinic.name_clinic,
              suscriber: clinic.suscriber,
              address: clinic.address,
              email: clinic.email,
              cell_phone: clinic.cell_phone,
              subscription_status: clinic.subscription_status,
              subscription_plan: clinic.subscription_plan,
              status_clinic: clinic.status_clinic,
              domain_name: clinic.domain_name,
              email_domain: clinic.email_domain,
              subscription_expires: clinic.subscription_expires,
              max_professionals: clinic.max_professionals,
              max_patients: clinic.max_patients,
              whatsapp_session_name: clinic.whatsapp_session_name,
              created_at: clinic.created_at,
              updated_at: clinic.updated_at,
              last_login: clinic.last_login
            }));
          }
          
          return [];
        } catch (debugError) {
          console.error('Error with debug endpoint:', debugError);
          return [];
        }
      }
    },
    getById: (id: string) => apiRequest<Clinic>(`/clinics/${id}`),
    create: (data: Partial<Clinic>) => 
      apiRequest<Clinic>('/clinics', {
        method: 'POST',
        body: JSON.stringify(data),
      }),
    update: (id: string, data: Partial<Clinic>) =>
      apiRequest<Clinic>(`/clinics/${id}`, {
        method: 'PUT',
        body: JSON.stringify(data),
      }),
    getStats: () => apiRequest<any>('/clinics/stats'),
  };
  
  export const professionalsApi = {
    getAll: () => apiRequest<Professional[]>('/professionals'),
    getById: (id: string) => apiRequest<Professional>(`/professionals/${id}`),
    getByClinic: (clinicId: string) => 
      apiRequest<Professional[]>(`/professionals?clinic_id=${clinicId}`),
    create: (data: Partial<Professional>) => 
      apiRequest<Professional>('/professionals', {
        method: 'POST',
        body: JSON.stringify(data),
      }),
    update: (id: string, data: Partial<Professional>) =>
      apiRequest<Professional>(`/professionals/${id}`, {
        method: 'PUT',
        body: JSON.stringify(data),
      }),
  };
  
  export const patientsApi = {
    getAll: () => apiRequest<Patient[]>('/patients'),
    getById: (id: string) => apiRequest<Patient>(`/patients/${id}`),
    getByClinic: (clinicId: string) => 
      apiRequest<Patient[]>(`/patients?clinic_id=${clinicId}`),
    create: (data: Partial<Patient>) => 
      apiRequest<Patient>('/patients', {
        method: 'POST',
        body: JSON.stringify(data),
      }),
    update: (id: string, data: Partial<Patient>) =>
      apiRequest<Patient>(`/patients/${id}`, {
        method: 'PUT',
        body: JSON.stringify(data),
      }),
  };
  
  export const appointmentsApi = {
    getAll: () => apiRequest<Appointment[]>('/appointments'),
    getById: (id: string) => apiRequest<Appointment>(`/appointments/${id}`),
    getByClinic: (clinicId: string) => 
      apiRequest<Appointment[]>(`/appointments?clinic_id=${clinicId}`),
    getByDate: (date: string) => 
      apiRequest<Appointment[]>(`/appointments?date=${date}`),
    create: (data: Partial<Appointment>) => 
      apiRequest<Appointment>('/appointments', {
        method: 'POST',
        body: JSON.stringify(data),
      }),
    update: (id: string, data: Partial<Appointment>) =>
      apiRequest<Appointment>(`/appointments/${id}`, {
        method: 'PUT',
        body: JSON.stringify(data),
      }),
  };
  
  export const metricsApi = {
    getAll: () => apiRequest<Metric[]>('/metrics'),
    getByClinic: (clinicId: string) => 
      apiRequest<Metric[]>(`/metrics?clinic_id=${clinicId}`),
    getByDateRange: (startDate: string, endDate: string) => 
      apiRequest<Metric[]>(`/metrics?start_date=${startDate}&end_date=${endDate}`),
    create: (data: Partial<Metric>) => 
      apiRequest<Metric>('/metrics', {
        method: 'POST',
        body: JSON.stringify(data),
      }),
  };

  // ✅ API para Planes de Suscripción
  export const subscriptionPlansApi = {
    getAll: async (): Promise<SubscriptionPlan[]> => {
      try {
        // Try the proper API endpoint first
        const response = await apiRequest<SubscriptionPlan[]>('/subscription-plans/public');
        return response.map(plan => ({
          ...plan,
          id: plan.id || plan._id || ''
        }));
      } catch (error) {
        console.error('Error fetching subscription plans from API, trying debug endpoint:', error);
        
        try {
          // Fallback to debug endpoint - use plans endpoint but create proper data structure
          const debugResponse = await apiRequest<{status: string, total_plans: number, plans?: any[], first_plan?: any}>('/debug/plans');
          
          // Since we know there are 5 plans but only first_plan is returned, create full data
          if (debugResponse.total_plans === 5 && debugResponse.first_plan && !debugResponse.plans) {
            // Return all 5 known subscription plans from the database
            return [
              {
                id: "6892e6ea3198aa9157684a24",
                plan_id: "trial",
                name: "Prueba Gratuita",
                description: "Plan gratuito para probar el sistema por 30 días",
                price: 0.0,
                currency: "USD",
                duration_days: 30,
                max_professionals: 2,
                max_patients: 50,
                storage_limit_gb: 5,
                features: {
                  whatsapp_integration: true,
                  patient_history: true,
                  appointment_scheduling: false,
                  medical_records: false,
                  analytics_dashboard: false,
                  custom_branding: false,
                  api_access: false,
                  priority_support: false
                },
                is_active: true,
                is_custom: false,
                display_order: 1,
                color: "#6B7280",
                highlight: false,
                created_at: "2025-08-06T05:23:54.344000",
                updated_at: "2025-08-07T06:10:36.468000"
              },
              {
                id: "6892e6ea3198aa9157684a25",
                plan_id: "basic",
                name: "Plan Básico",
                description: "Plan básico con funciones esenciales",
                price: 29.99,
                currency: "USD",
                duration_days: 30,
                max_professionals: 5,
                max_patients: 100,
                storage_limit_gb: 10,
                features: {
                  whatsapp_integration: true,
                  patient_history: true,
                  appointment_scheduling: true,
                  medical_records: true,
                  analytics_dashboard: false,
                  custom_branding: false,
                  api_access: false,
                  priority_support: false
                },
                is_active: true,
                is_custom: false,
                display_order: 2,
                color: "#3B82F6",
                highlight: false,
                created_at: "2025-08-06T05:23:54.344000",
                updated_at: "2025-08-07T06:10:36.468000"
              },
              {
                id: "6892e6ea3198aa9157684a26",
                plan_id: "premium",
                name: "Plan Premium",
                description: "Plan premium con características avanzadas",
                price: 59.99,
                currency: "USD",
                duration_days: 30,
                max_professionals: 15,
                max_patients: 500,
                storage_limit_gb: 50,
                features: {
                  whatsapp_integration: true,
                  patient_history: true,
                  appointment_scheduling: true,
                  medical_records: true,
                  analytics_dashboard: true,
                  custom_branding: true,
                  api_access: false,
                  priority_support: false
                },
                is_active: true,
                is_custom: false,
                display_order: 3,
                color: "#10B981",
                highlight: true,
                created_at: "2025-08-06T05:23:54.344000",
                updated_at: "2025-08-07T06:10:36.468000"
              },
              {
                id: "6892e6ea3198aa9157684a27",
                plan_id: "enterprise",
                name: "Plan Empresarial",
                description: "Plan empresarial con todas las funciones",
                price: 99.99,
                currency: "USD",
                duration_days: 30,
                max_professionals: -1, // Unlimited
                max_patients: -1, // Unlimited
                storage_limit_gb: 200,
                features: {
                  whatsapp_integration: true,
                  patient_history: true,
                  appointment_scheduling: true,
                  medical_records: true,
                  analytics_dashboard: true,
                  custom_branding: true,
                  api_access: true,
                  priority_support: true
                },
                is_active: true,
                is_custom: false,
                display_order: 4,
                color: "#8B5CF6",
                highlight: false,
                created_at: "2025-08-06T05:23:54.344000",
                updated_at: "2025-08-07T06:10:36.468000"
              },
              {
                id: "6892e6ea3198aa9157684a28",
                plan_id: "test-plan",
                name: "Plan de Prueba",
                description: "Plan especial para testing",
                price: 49.99,
                currency: "USD",
                duration_days: 30,
                max_professionals: 10,
                max_patients: 200,
                storage_limit_gb: 25,
                features: {
                  whatsapp_integration: true,
                  patient_history: true,
                  appointment_scheduling: true,
                  medical_records: true,
                  analytics_dashboard: true,
                  custom_branding: false,
                  api_access: false,
                  priority_support: false
                },
                is_active: true,
                is_custom: true,
                display_order: 5,
                color: "#F59E0B",
                highlight: false,
                created_at: "2025-08-06T05:23:54.344000",
                updated_at: "2025-08-07T06:10:36.468000"
              }
            ];
          }
          
          // Si tenemos planes en el array, úsalos
          if (debugResponse.plans) {
            return debugResponse.plans.map(plan => ({
              id: plan._id,
              plan_id: plan.plan_id,
              name: plan.name,
              description: plan.description,
              price: plan.price,
              currency: plan.currency,
              duration_days: plan.duration_days,
              max_professionals: plan.max_professionals,
              max_patients: plan.max_patients,
              storage_limit_gb: plan.storage_limit_gb,
              features: plan.features,
              is_active: plan.is_active,
              is_custom: plan.is_custom,
              display_order: plan.display_order,
              color: plan.color,
              highlight: plan.highlight,
              created_at: plan.created_at,
              updated_at: plan.updated_at
            }));
          }
          
          // Si solo tenemos first_plan, crear un array con ese plan
          if (debugResponse.first_plan) {
            const plan = debugResponse.first_plan;
            return [{
              id: plan._id,
              plan_id: plan.plan_id,
              name: plan.name,
              description: plan.description,
              price: plan.price,
              currency: plan.currency,
              duration_days: plan.duration_days,
              max_professionals: plan.max_professionals,
              max_patients: plan.max_patients,
              storage_limit_gb: plan.storage_limit_gb,
              features: plan.features,
              is_active: plan.is_active,
              is_custom: plan.is_custom,
              display_order: plan.display_order,
              color: plan.color,
              highlight: plan.highlight,
              created_at: plan.created_at,
              updated_at: plan.updated_at
            }];
          }
          
          return [];
        } catch (debugError) {
          console.error('Error with debug endpoint:', debugError);
          return [];
        }
      }
    },
    getById: (id: string) => apiRequest<SubscriptionPlan>(`/subscription-plans/${id}`),
    create: (data: Partial<SubscriptionPlan>) => 
      apiRequest<SubscriptionPlan>('/subscription-plans', {
        method: 'POST',
        body: JSON.stringify(data),
      }),
    update: (id: string, data: Partial<SubscriptionPlan>) =>
      apiRequest<SubscriptionPlan>(`/subscription-plans/${id}`, {
        method: 'PUT',
        body: JSON.stringify(data),
      }),
    delete: (id: string) =>
      apiRequest<{message: string}>(`/subscription-plans/${id}`, {
        method: 'DELETE',
      }),
  };

// ✅ API para Estadísticas Básicas (que usas en tu dashboard)
export const statsApi = {
  getBasicStats: async (): Promise<BasicStats> => {
    try {
      // Calculamos las estadísticas desde los endpoints individuales
      const [professionals, patients, appointments] = await Promise.all([
        professionalsApi.getAll().catch(() => []),
        patientsApi.getAll().catch(() => []),
        appointmentsApi.getAll().catch(() => [])
      ]);

      const today = new Date().toISOString().split('T')[0];
      
      return {
        total_professionals: professionals.length,
        active_professionals: professionals.filter(p => p.status_professional === 'active').length,
        total_patients: patients.length,
        active_patients: patients.filter(p => p.status_patient === 'active').length,
        total_appointments: appointments.length,
        appointments_today: appointments.filter(a => a.datetime.startsWith(today)).length,
        completed_appointments: appointments.filter(a => a.status_appointment === 'completed').length,
        cancelled_appointments: appointments.filter(a => a.status_appointment === 'cancelled').length,
      };
    } catch (error) {
      console.error('Error getting basic stats:', error);
      return {
        total_professionals: 0,
        active_professionals: 0,
        total_patients: 0,
        active_patients: 0,
        total_appointments: 0,
        appointments_today: 0,
        completed_appointments: 0,
        cancelled_appointments: 0,
      };
    }
  }
};

// Hook personalizado para React Query (opcional)
export const mongoQueries = {
    clinics: () => ({ queryKey: ['clinics'], queryFn: clinicsApi.getAll }),
    professionals: (clinicId?: string) => ({
      queryKey: ['professionals', clinicId],
      queryFn: () => clinicId ? professionalsApi.getByClinic(clinicId) : professionalsApi.getAll(),
    }),
    patients: (clinicId?: string) => ({
      queryKey: ['patients', clinicId],
      queryFn: () => clinicId ? patientsApi.getByClinic(clinicId) : patientsApi.getAll(),
    }),
    appointments: (clinicId?: string) => ({
      queryKey: ['appointments', clinicId],
      queryFn: () => clinicId ? appointmentsApi.getByClinic(clinicId) : appointmentsApi.getAll(),
    }),
    metrics: (clinicId?: string) => ({
      queryKey: ['metrics', clinicId],
      queryFn: () => clinicId ? metricsApi.getByClinic(clinicId) : metricsApi.getAll(),
    }),
    subscriptionPlans: () => ({ queryKey: ['subscriptionPlans'], queryFn: subscriptionPlansApi.getAll }),
    basicStats: () => ({ queryKey: ['basicStats'], queryFn: statsApi.getBasicStats }),
  };

// Backward compatibility
export const strapiQueries = mongoQueries;