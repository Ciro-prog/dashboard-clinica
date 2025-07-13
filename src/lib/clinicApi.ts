// src/lib/clinicApi.tsx
// Configuración de la API de Strapi
const API_URL = '';

  export interface ApiResponse<T> {
    data: T[];
    meta: {
      pagination?: {
        page: number;
        pageSize: number;
        pageCount: number;
        total: number;
      };
    };
  }
  
  export interface SingleApiResponse<T> {
    data: T;
    meta: unknown;
  }

// ✅ INTERFAZ CLINIC - Corregida según tu uso actual
export interface Clinic {
  id: number;
  attributes: {
    clinic_id: string;           // UID único
    name_clinic: string;         // Nombre de la clínica
    suscriber: string;          // Subscriber para WAHA
    address: string;            // Dirección
    subcription: boolean;       // Estado de suscripción
    email: string;              // Email
    password?: string;          // Password (opcional/privado)
    cell_phone: number;         // Teléfono celular
    status_clinic: 'active' | 'inactive' | 'maintenance'; // Estado de la clínica
    whatsapp_number?: string;   // Número de WhatsApp (opcional)
    createdAt: string;
    updatedAt: string;
    publishedAt: string;
    // Relación con paciente
    patient?: {
      data: any;
    };
  };
}

// ✅ INTERFAZ PROFESSIONAL - Según tu uso
export interface Professional {
  id: number;
  attributes: {
    first_name: string;
    last_name: string;
    speciality: string;
    license_number?: string;
    phone: string;
    email: string;
    status_professional: 'active' | 'inactive' | 'vacation';
    createdAt: string;
    updatedAt: string;
  };
}

// ✅ INTERFAZ PATIENT - Según tu uso  
export interface Patient {
  id: number;
  attributes: {
    patient_id?: string;         // UID opcional
    first_name: string;          // Nombre
    last_name: string;           // Apellido
    dni?: string;                // DNI opcional
    cell_phone: number;          // Teléfono celular
    email?: string;              // Email opcional
    address?: string;            // Dirección opcional
    status_patient: 'active' | 'inactive'; // Estado del paciente
    obra_social?: string;        // Obra social opcional
    turno?: string;              // Fecha de turno opcional
    createdAt: string;
    updatedAt: string;
    publishedAt: string;
    // Relación con clínica
    clinic?: {
      data: any;
    };
  };
}

// ✅ INTERFAZ APPOINTMENT - Según tu uso
export interface Appointment {
  id: number;
  attributes: {
    datetime: string;            // Fecha y hora
    duration: number;            // Duración en minutos
    type: string;                // Tipo de consulta
    status_appointment: 'scheduled' | 'confirmed' | 'cancelled' | 'completed' | 'no_show';
    notes?: string;              // Notas opcionales
    reminder_sent?: boolean;     // Recordatorio enviado
    whatsapp_conversation_id?: string; // ID de conversación WhatsApp
    createdAt: string;
    updatedAt: string;
  };
}

export interface Metric {
  id: number;
  attributes: {
    conversation_id: string;
    user_from: string;
    query_type: 'info' | 'turno' | 'modification' | 'greeting' | 'general';
    was_blocked: boolean;
    response_time: number;
    user_helped: boolean;
    timestamp: string;
    createdAt: string;
    updatedAt: string;
  };
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

// Función base para hacer requests
async function apiRequest<T>(endpoint: string, options?: RequestInit): Promise<T> {
    const url = `${API_URL}/api${endpoint}`;
    
    console.log('🔗 Haciendo request a:', url);
    
    const response = await fetch(url, {
      headers: {
        'Content-Type': 'application/json',
        ...options?.headers,
      },
      ...options,
    });
  
    console.log('📡 Response status:', response.status);
  
    if (!response.ok) {
      throw new Error(`API Error: ${response.status} ${response.statusText}`);
    }
  
    return response.json();
  }

// ✅ API para Clínicas
export const clinicsApi = {
    getAll: () => apiRequest<ApiResponse<Clinic>>('/clinics?populate=*'),
    getById: (id: number) => apiRequest<SingleApiResponse<Clinic>>(`/clinics/${id}?populate=*`),
    create: (data: Partial<Clinic['attributes']>) => 
      apiRequest<SingleApiResponse<Clinic>>('/clinics', {
        method: 'POST',
        body: JSON.stringify({ data }),
      }),
    update: (id: number, data: Partial<Clinic['attributes']>) =>
      apiRequest<SingleApiResponse<Clinic>>(`/clinics/${id}`, {
        method: 'PUT',
        body: JSON.stringify({ data }),
      }),
  };
  
  export const professionalsApi = {
    getAll: () => apiRequest<ApiResponse<Professional>>('/professionals?populate=*'),
    getById: (id: number) => apiRequest<SingleApiResponse<Professional>>(`/professionals/${id}?populate=*`),
    getByClinic: (clinicId: number) => 
      apiRequest<ApiResponse<Professional>>(`/professionals?filters[clinic][id][$eq]=${clinicId}&populate=*`),
  };
  
  export const patientsApi = {
    getAll: () => apiRequest<ApiResponse<Patient>>('/patients?populate=*'),
    getById: (id: number) => apiRequest<SingleApiResponse<Patient>>(`/patients/${id}?populate=*`),
    getByClinic: (clinicId: number) => 
      apiRequest<ApiResponse<Patient>>(`/patients?filters[clinic][id][$eq]=${clinicId}&populate=*`),
    create: (data: Partial<Patient['attributes']>) => 
      apiRequest<SingleApiResponse<Patient>>('/patients', {
        method: 'POST',
        body: JSON.stringify({ data }),
      }),
  };
  
  export const appointmentsApi = {
    getAll: () => apiRequest<ApiResponse<Appointment>>('/appointments?populate=*'),
    getById: (id: number) => apiRequest<SingleApiResponse<Appointment>>(`/appointments/${id}?populate=*`),
    getByClinic: (clinicId: number) => 
      apiRequest<ApiResponse<Appointment>>(`/appointments?filters[clinic][id][$eq]=${clinicId}&populate=*`),
    getByDate: (date: string) => 
      apiRequest<ApiResponse<Appointment>>(`/appointments?filters[datetime][$gte]=${date}&populate=*`),
    create: (data: Partial<Appointment['attributes']>) => 
      apiRequest<SingleApiResponse<Appointment>>('/appointments', {
        method: 'POST',
        body: JSON.stringify({ data }),
      }),
  };
  
  export const metricsApi = {
    getAll: () => apiRequest<ApiResponse<Metric>>('/metrics?populate=*'),
    getByClinic: (clinicId: number) => 
      apiRequest<ApiResponse<Metric>>(`/metrics?filters[clinic][id][$eq]=${clinicId}&populate=*`),
    getByDateRange: (startDate: string, endDate: string) => 
      apiRequest<ApiResponse<Metric>>(`/metrics?filters[timestamp][$gte]=${startDate}&filters[timestamp][$lte]=${endDate}&populate=*`),
  };

// ✅ API para Estadísticas Básicas (que usas en tu dashboard)
export const statsApi = {
  getBasicStats: async (): Promise<BasicStats> => {
    try {
      // Esta es una implementación mock ya que no tienes endpoint específico
      // Puedes reemplazar con tu endpoint real o calcular desde los datos existentes
      const [professionalsRes, patientsRes, appointmentsRes] = await Promise.all([
        professionalsApi.getAll().catch(() => ({ data: [] })),
        patientsApi.getAll().catch(() => ({ data: [] })),
        appointmentsApi.getAll().catch(() => ({ data: [] }))
      ]);

      const professionals = professionalsRes.data || [];
      const patients = patientsRes.data || [];
      const appointments = appointmentsRes.data || [];

      const today = new Date().toISOString().split('T')[0];
      
      return {
        total_professionals: professionals.length,
        active_professionals: professionals.filter(p => p.attributes.status_professional === 'active').length,
        total_patients: patients.length,
        active_patients: patients.filter(p => p.attributes.status_patient === 'active').length,
        total_appointments: appointments.length,
        appointments_today: appointments.filter(a => a.attributes.datetime.startsWith(today)).length,
        completed_appointments: appointments.filter(a => a.attributes.status_appointment === 'completed').length,
        cancelled_appointments: appointments.filter(a => a.attributes.status_appointment === 'cancelled').length,
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
export const strapiQueries = {
    clinics: () => ({ queryKey: ['clinics'], queryFn: clinicsApi.getAll }),
    professionals: (clinicId?: number) => ({
      queryKey: ['professionals', clinicId],
      queryFn: () => clinicId ? professionalsApi.getByClinic(clinicId) : professionalsApi.getAll(),
    }),
    patients: (clinicId?: number) => ({
      queryKey: ['patients', clinicId],
      queryFn: () => clinicId ? patientsApi.getByClinic(clinicId) : patientsApi.getAll(),
    }),
    appointments: (clinicId?: number) => ({
      queryKey: ['appointments', clinicId],
      queryFn: () => clinicId ? appointmentsApi.getByClinic(clinicId) : appointmentsApi.getAll(),
    }),
    metrics: (clinicId?: number) => ({
      queryKey: ['metrics', clinicId],
      queryFn: () => clinicId ? metricsApi.getByClinic(clinicId) : metricsApi.getAll(),
    }),
    basicStats: () => ({ queryKey: ['basicStats'], queryFn: statsApi.getBasicStats }),
  };