// src/lib/clinicApi.ts - API actualizada para sistema de autenticación con Clínica

import { createAuthenticatedRequest, getStoredClinicData } from './clinicAuth';

// Configuración de la API de Strapi
const API_URL = typeof window !== 'undefined' 
  ? 'http://localhost:1337'  
  : process.env.NEXT_PUBLIC_STRAPI_URL || 'http://localhost:1337';

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

// Tipos basados en tu estructura real creada
export interface Clinic {
  id: number;
  documentId: string;
  clinic_id: string;
  name_clinic: string;
  suscriber: string;
  address: string;
  email: string;
  cell_phone: string;
  subcription: boolean;
  status_clinic: 'active' | 'inactive' | 'maintenance';
  whatsapp_number?: string;
  logo?: string;
  password?: string;
  createdAt: string;
  updatedAt: string;
  publishedAt: string;
}

export interface Professional {
  id: number;
  documentId: string;
  professional_id: string;
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
  speciality: string;
  status_professional: 'active' | 'inactive' | 'vacation';
  bio?: string;
  bio_professional?: string;
  clinic?: {
    data: Clinic;
  };
  createdAt: string;
  updatedAt: string;
  publishedAt: string;
}

export interface Patient {
  id: number;
  documentId: string;
  patient_id: string;
  dni?: string;
  first_name: string;
  last_name?: string;
  email?: string;
  cell_phone: string;
  address?: string;
  obra_social?: string;
  insurance?: string;
  status_patient: 'active' | 'inactive';
  whatsapp_id?: string;
  clinic?: {
    data: Clinic;
  };
  createdAt: string;
  updatedAt: string;
  publishedAt: string;
}

export interface Appointment {
  id: number;
  documentId: string;
  appointment_id: string;
  datetime: string;
  duration: number;
  type: string;
  status_appointment: 'scheduled' | 'confirmed' | 'cancelled' | 'completed' | 'no_show';
  notes?: string;
  reminder_sent: boolean;
  whatsapp_conversation_id?: string;
  patient?: {
    data: Patient;
  };
  professional?: {
    data: Professional;
  };
  clinic?: {
    data: Clinic;
  };
  createdAt: string;
  updatedAt: string;
  publishedAt: string;
}

// Función base para hacer requests autenticados
const authenticatedRequest = createAuthenticatedRequest();

// Función para obtener la clínica actual del localStorage
function getCurrentClinicId(): number {
  const { clinic } = getStoredClinicData();
  if (!clinic) {
    throw new Error('No hay clínica autenticada');
  }
  return clinic.id;
}

// Función para hacer requests sin autenticación (para login)
async function publicRequest<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const config: RequestInit = {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
  };

  try {
    const response = await fetch(`${API_URL}/api${endpoint}`, config);
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error?.message || `Error HTTP: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error(`Error en public request ${endpoint}:`, error);
    throw error;
  }
}

// APIs para cada entidad con filtros automáticos por clínica
export const clinicApi = {
  // Obtener datos de la clínica actual
  getCurrent: () => {
    const clinicId = getCurrentClinicId();
    return publicRequest<SingleApiResponse<Clinic>>(`/clinics/${clinicId}?populate=*`);
  },
  
  // Actualizar datos de la clínica actual
  updateCurrent: (data: Partial<Clinic>) => {
    const clinicId = getCurrentClinicId();
    return publicRequest<SingleApiResponse<Clinic>>(`/clinics/${clinicId}`, {
      method: 'PUT',
      body: JSON.stringify({ data }),
    });
  },

  // Para login (público)
  getByEmail: (email: string) => 
    publicRequest<ApiResponse<Clinic>>(`/clinics?filters[email][$eq]=${email}&filters[status_clinic][$eq]=active`),
};

export const professionalsApi = {
  // Obtener todos los profesionales de la clínica actual
  getAll: () => {
    const clinicId = getCurrentClinicId();
    return publicRequest<ApiResponse<Professional>>(`/professionals?filters[clinic][id][$eq]=${clinicId}&populate=*`);
  },
  
  // Obtener un profesional específico
  getById: (id: number) => 
    publicRequest<SingleApiResponse<Professional>>(`/professionals/${id}?populate=*`),
  
  // Crear un nuevo profesional
  create: (data: Partial<Professional>) => {
    const clinicId = getCurrentClinicId();
    const professionalData = {
      ...data,
      clinic: clinicId, // Asignar automáticamente a la clínica actual
    };
    return publicRequest<SingleApiResponse<Professional>>('/professionals', {
      method: 'POST',
      body: JSON.stringify({ data: professionalData }),
    });
  },
  
  // Actualizar un profesional
  update: (id: number, data: Partial<Professional>) => 
    publicRequest<SingleApiResponse<Professional>>(`/professionals/${id}`, {
      method: 'PUT',
      body: JSON.stringify({ data }),
    }),
  
  // Eliminar un profesional
  delete: (id: number) => 
    publicRequest<void>(`/professionals/${id}`, {
      method: 'DELETE',
    }),
};

export const patientsApi = {
  // Obtener todos los pacientes de la clínica actual
  getAll: () => {
    const clinicId = getCurrentClinicId();
    return publicRequest<ApiResponse<Patient>>(`/patients?filters[clinic][id][$eq]=${clinicId}&populate=*`);
  },
  
  // Obtener un paciente específico
  getById: (id: number) => 
    publicRequest<SingleApiResponse<Patient>>(`/patients/${id}?populate=*`),
  
  // Buscar paciente por DNI
  getByDni: (dni: string) => {
    const clinicId = getCurrentClinicId();
    return publicRequest<ApiResponse<Patient>>(`/patients?filters[dni][$eq]=${dni}&filters[clinic][id][$eq]=${clinicId}&populate=*`);
  },
  
  // Buscar pacientes por nombre
  searchByName: (name: string) => {
    const clinicId = getCurrentClinicId();
    return publicRequest<ApiResponse<Patient>>(`/patients?filters[$or][0][first_name][$containsi]=${name}&filters[$or][1][last_name][$containsi]=${name}&filters[clinic][id][$eq]=${clinicId}&populate=*`);
  },
  
  // Crear un nuevo paciente
  create: (data: Partial<Patient>) => {
    const clinicId = getCurrentClinicId();
    const patientData = {
      ...data,
      clinic: clinicId, // Asignar automáticamente a la clínica actual
    };
    return publicRequest<SingleApiResponse<Patient>>('/patients', {
      method: 'POST',
      body: JSON.stringify({ data: patientData }),
    });
  },
  
  // Actualizar un paciente
  update: (id: number, data: Partial<Patient>) => 
    publicRequest<SingleApiResponse<Patient>>(`/patients/${id}`, {
      method: 'PUT',
      body: JSON.stringify({ data }),
    }),
  
  // Eliminar un paciente
  delete: (id: number) => 
    publicRequest<void>(`/patients/${id}`, {
      method: 'DELETE',
    }),
};

export const appointmentsApi = {
  // Obtener todas las citas de la clínica actual
  getAll: () => {
    const clinicId = getCurrentClinicId();
    return publicRequest<ApiResponse<Appointment>>(`/appointments?filters[clinic][id][$eq]=${clinicId}&populate=*`);
  },
  
  // Obtener citas por fecha
  getByDate: (date: string) => {
    const clinicId = getCurrentClinicId();
    return publicRequest<ApiResponse<Appointment>>(`/appointments?filters[datetime][$gte]=${date}T00:00:00.000Z&filters[datetime][$lte]=${date}T23:59:59.999Z&filters[clinic][id][$eq]=${clinicId}&populate=*`);
  },
  
  // Obtener citas por rango de fechas
  getByDateRange: (startDate: string, endDate: string) => {
    const clinicId = getCurrentClinicId();
    return publicRequest<ApiResponse<Appointment>>(`/appointments?filters[datetime][$gte]=${startDate}&filters[datetime][$lte]=${endDate}&filters[clinic][id][$eq]=${clinicId}&populate=*`);
  },
  
  // Obtener citas de un paciente específico
  getByPatient: (patientId: number) => {
    const clinicId = getCurrentClinicId();
    return publicRequest<ApiResponse<Appointment>>(`/appointments?filters[patient][id][$eq]=${patientId}&filters[clinic][id][$eq]=${clinicId}&populate=*`);
  },
  
  // Obtener citas de un profesional específico
  getByProfessional: (professionalId: number) => {
    const clinicId = getCurrentClinicId();
    return publicRequest<ApiResponse<Appointment>>(`/appointments?filters[professional][id][$eq]=${professionalId}&filters[clinic][id][$eq]=${clinicId}&populate=*`);
  },
  
  // Obtener una cita específica
  getById: (id: number) => 
    publicRequest<SingleApiResponse<Appointment>>(`/appointments/${id}?populate=*`),
  
  // Crear una nueva cita
  create: (data: Partial<Appointment>) => {
    const clinicId = getCurrentClinicId();
    const appointmentData = {
      ...data,
      clinic: clinicId, // Asignar automáticamente a la clínica actual
    };
    return publicRequest<SingleApiResponse<Appointment>>('/appointments', {
      method: 'POST',
      body: JSON.stringify({ data: appointmentData }),
    });
  },
  
  // Actualizar una cita
  update: (id: number, data: Partial<Appointment>) => 
    publicRequest<SingleApiResponse<Appointment>>(`/appointments/${id}`, {
      method: 'PUT',
      body: JSON.stringify({ data }),
    }),
  
  // Eliminar una cita
  delete: (id: number) => 
    publicRequest<void>(`/appointments/${id}`, {
      method: 'DELETE',
    }),
};

// Funciones de estadísticas simples
export const statsApi = {
  // Obtener estadísticas básicas
  getBasicStats: async () => {
    try {
      const [
        professionalsResponse,
        patientsResponse,
        appointmentsResponse,
      ] = await Promise.all([
        professionalsApi.getAll(),
        patientsApi.getAll(),
        appointmentsApi.getAll(),
      ]);

      const professionals = professionalsResponse.data;
      const patients = patientsResponse.data;
      const appointments = appointmentsResponse.data;

      // Calcular estadísticas
      const today = new Date().toISOString().split('T')[0];
      const appointmentsToday = appointments.filter(apt => 
        apt.datetime.startsWith(today)
      );
      
      const activePatients = patients.filter(p => p.status_patient === 'active');
      const activeProfessionals = professionals.filter(p => p.status_professional === 'active');
      
      return {
        total_professionals: professionals.length,
        active_professionals: activeProfessionals.length,
        total_patients: patients.length,
        active_patients: activePatients.length,
        total_appointments: appointments.length,
        appointments_today: appointmentsToday.length,
        completed_appointments: appointments.filter(a => a.status_appointment === 'completed').length,
        cancelled_appointments: appointments.filter(a => a.status_appointment === 'cancelled').length,
      };
    } catch (error) {
      console.error('Error obteniendo estadísticas:', error);
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
  },
};

// Utilidades adicionales
export function isAuthenticated(): boolean {
  const { token } = getStoredClinicData();
  return !!token;
}

export function getCurrentClinic() {
  const { clinic } = getStoredClinicData();
  return clinic;
}

// Hook personalizado para React Query (opcional)
export const clinicQueries = {
  clinic: () => ({ queryKey: ['clinic'], queryFn: clinicApi.getCurrent }),
  professionals: () => ({ queryKey: ['professionals'], queryFn: professionalsApi.getAll }),
  patients: () => ({ queryKey: ['patients'], queryFn: patientsApi.getAll }),
  appointments: () => ({ queryKey: ['appointments'], queryFn: appointmentsApi.getAll }),
  appointmentsByDate: (date: string) => ({ 
    queryKey: ['appointments', 'date', date], 
    queryFn: () => appointmentsApi.getByDate(date) 
  }),
  stats: () => ({ queryKey: ['stats'], queryFn: statsApi.getBasicStats }),
};