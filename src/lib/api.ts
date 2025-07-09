// Configuración de la API de Strapi
const API_URL = typeof window !== 'undefined' 
  ? 'http://localhost:1337'  // En el navegador
  : process.env.NEXT_PUBLIC_STRAPI_URL || 'http://localhost:1337'; // En el servidor

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

// Tipos basados en tu CMS
export interface Clinic {
  id: number;
  attributes: {
    name: string;
    slug: string;
    description: string;
    address: string;
    phone: string;
    email: string;
    status: 'active' | 'inactive' | 'maintenance';
    whatsapp_number: string;
    createdAt: string;
    updatedAt: string;
    publishedAt: string;
  };
}

export interface Professional {
  id: number;
  attributes: {
    first_name: string;
    last_name: string;
    speciality: string;
    license_number: string;
    phone: string;
    email: string;
    status: 'active' | 'inactive' | 'vacation';
    createdAt: string;
    updatedAt: string;
  };
}

export interface Patient {
  id: number;
  attributes: {
    dni: string;
    first_name: string;
    last_name: string;
    phone: string;
    email: string;
    address: string;
    birth_date: string;
    insurance: string;
    status: 'active' | 'inactive';
    whatsapp_id: string;
    createdAt: string;
    updatedAt: string;
  };
}

export interface Appointment {
  id: number;
  attributes: {
    datetime: string;
    duration: number;
    type: string;
    status: 'scheduled' | 'confirmed' | 'cancelled' | 'completed' | 'no_show';
    notes: string;
    reminder_sent: boolean;
    whatsapp_conversation_id: string;
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

// Función base para hacer requests
async function apiRequest<T>(endpoint: string, options?: RequestInit): Promise<T> {
  const url = `${API_URL}/api${endpoint}`;
  
  const response = await fetch(url, {
    headers: {
      'Content-Type': 'application/json',
      ...options?.headers,
    },
    ...options,
  });

  if (!response.ok) {
    throw new Error(`API Error: ${response.status} ${response.statusText}`);
  }

  return response.json();
}

// Funciones para cada entidad
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
};