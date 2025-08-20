// src/lib/clinicAuth.ts - Sistema de autenticación usando Clínica como usuario principal

// 🚀 URL para usar el nuevo backend FastAPI
const API_URL = '/api';

console.log('🔐 Auth API_URL configurado:', API_URL);

export interface ClinicUser {
  id: string;
  clinic_id: string;
  name_clinic: string;
  suscriber: string;
  address: string;  
  email: string;
  cell_phone: string;
  subscription_status: 'trial' | 'active' | 'expired' | 'cancelled';
  subscription_plan: string; // Now supports generated plan IDs
  status_clinic: 'active' | 'inactive' | 'suspended';
  domain_name: string;
  email_domain?: string;
  subscription_expires?: string;
  max_professionals: number;
  max_patients: number;
  whatsapp_session_name?: string;
  created_at: string;
  updated_at: string;
  last_login?: string;
}

export interface ClinicAuthResponse {
  clinic: ClinicUser;
  jwt: string;
}

export interface AuthError {
  error: {
    status: number;
    name: string;
    message: string;
    details: string;
  };
}

// Función para login con email y password de clínica
export async function loginClinic(email: string, password: string): Promise<ClinicAuthResponse> {
  try {
    console.log('🔐 Iniciando login de clínica:', email);
    
    // ✅ NUEVO FLUJO - Usar el backend FastAPI
    console.log('🔗 Usando API URL:', API_URL);
    
    const url = `${API_URL}/auth/login`;
    console.log('📡 Request URL:', url);
    
    const loginData = {
      username: email,
      password: password,
      user_type: "clinic"
    };
    
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(loginData)
    });

    console.log('📡 Response status:', response.status);
    
    const data = await response.json();

    if (!response.ok) {
      console.error('❌ Error response:', data);
      throw new Error(data.detail || 'Error de autenticación');
    }

    console.log('📊 Login response:', data);

    // Adaptar la respuesta del backend MongoDB al formato esperado por el frontend
    const clinicUser: ClinicUser = {
      id: data.user_data.id,
      clinic_id: data.user_data.clinic_id,
      name_clinic: data.user_data.name_clinic,
      suscriber: data.user_data.suscriber,
      address: data.user_data.address,
      email: data.user_data.email,
      cell_phone: data.user_data.cell_phone,
      subscription_status: data.user_data.subscription_status,
      subscription_plan: data.user_data.subscription_plan,
      status_clinic: data.user_data.status_clinic,
      domain_name: data.user_data.domain_name || '',
      email_domain: data.user_data.email_domain,
      subscription_expires: data.user_data.subscription_expires,
      max_professionals: data.user_data.max_professionals || 2,
      max_patients: data.user_data.max_patients || 50,
      whatsapp_session_name: data.user_data.whatsapp_number,
      created_at: data.user_data.created_at || '',
      updated_at: data.user_data.updated_at || '',
      last_login: data.user_data.last_login
    };

    console.log('✅ Login exitoso para:', clinicUser.name_clinic);

    return {
      clinic: clinicUser,
      jwt: data.access_token
    };

  } catch (error) {
    console.error('❌ Error en login de clínica:', error);
    throw error;
  }
}

// Función para generar JWT simple (SOLO PARA DESARROLLO)
function generateSimpleJWT(clinic): string {
  const header = {
    alg: 'HS256',
    typ: 'JWT'
  };

  const payload = {
    clinic_id: clinic.id,
    clinic_email: clinic.email,
    clinic_name: clinic.name_clinic,
    iat: Math.floor(Date.now() / 1000),
    exp: Math.floor(Date.now() / 1000) + (24 * 60 * 60) // 24 horas
  };

  // En producción, usar una clave secreta real y una biblioteca de JWT
  const secret = 'your-secret-key-change-in-production';
  
  // Simulación simple de JWT (NO usar en producción)
  const encodedHeader = btoa(JSON.stringify(header));
  const encodedPayload = btoa(JSON.stringify(payload));
  const signature = btoa(`${encodedHeader}.${encodedPayload}.${secret}`);
  
  return `${encodedHeader}.${encodedPayload}.${signature}`;
}

// Función para verificar JWT simple
function verifySimpleJWT(token: string): string {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) {
      throw new Error('Token inválido');
    }

    const payload = JSON.parse(atob(parts[1]));
    
    // Verificar expiración
    if (payload.exp && payload.exp < Math.floor(Date.now() / 1000)) {
      throw new Error('Token expirado');
    }

    return payload;
  } catch (error) {
    throw new Error('Token inválido');
  }
}

// Función para obtener clínica actual desde token
export async function getCurrentClinic(token: string): Promise<ClinicUser> {
  try {
    const payload: any = verifySimpleJWT(token);
    
    const response = await fetch(`${API_URL}/api/clinics/${payload.clinic_id}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error?.message || 'Error al obtener clínica');
    }

    return data.data;
  } catch (error) {
    console.error('❌ Error al obtener clínica actual:', error);
    throw error;
  }
}

// Función para logout
export function logoutClinic(): void {
  if (typeof window !== 'undefined') {
    localStorage.removeItem('clinic_token');
    localStorage.removeItem('clinic_data');
    console.log('👋 Logout completado');
  }
}

// Función para obtener token almacenado
export function getStoredClinicToken(): string | null {
  if (typeof window !== 'undefined') {
    return localStorage.getItem('clinic_token');
  }
  return null;
}

// Función para guardar datos de autenticación
export function saveClinicAuthData(authResponse: ClinicAuthResponse): void {
  if (typeof window !== 'undefined') {
    localStorage.setItem('clinic_token', authResponse.jwt);
    localStorage.setItem('clinic_data', JSON.stringify(authResponse.clinic));
    console.log('💾 Datos de autenticación guardados');
  }
}

// Función para obtener datos almacenados
export function getStoredClinicData() {
  if (typeof window !== 'undefined') {
    const token = localStorage.getItem('clinic_token');
    const clinicStr = localStorage.getItem('clinic_data');
    
    return {
      token,
      clinic: clinicStr ? JSON.parse(clinicStr) : null,
    };
  }
  return { token: null, clinic: null };
}

// Función para verificar si está autenticado
export function isClinicAuthenticated(): boolean {
  const token = getStoredClinicToken();
  if (!token) return false;
  
  try {
    verifySimpleJWT(token);
    return true;
  } catch {
    // Token inválido, limpiar storage
    logoutClinic();
    return false;
  }
}

// Función para actualizar datos de clínica
export async function updateClinicData(clinicId: number, updates: Partial<ClinicUser>): Promise<ClinicUser> {
  const token = getStoredClinicToken();
  if (!token) {
    throw new Error('No autenticado');
  }

  try {
    verifySimpleJWT(token);
  } catch {
    throw new Error('Sesión expirada');
  }

  const response = await fetch(`${API_URL}/api/clinics/${clinicId}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ data: updates }),
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.error?.message || 'Error al actualizar clínica');
  }

  // Actualizar datos en localStorage
  const currentData = getStoredClinicData();
  if (currentData.clinic) {
    const updatedClinic = { ...currentData.clinic, ...updates };
    localStorage.setItem('clinic_data', JSON.stringify(updatedClinic));
  }

  return data.data;
}

// Función para cambiar contraseña
export async function changeClinicPassword(clinicId: number, currentPassword: string, newPassword: string): Promise<void> {
  const token = getStoredClinicToken();
  if (!token) {
    throw new Error('No autenticado');
  }

  // En un caso real, verificarías la contraseña con el backend
  const response = await fetch(`${API_URL}/api/clinics/${clinicId}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ 
      data: { 
        password: newPassword 
      } 
    }),
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.error?.message || 'Error al cambiar contraseña');
  }
}

// Middleware para requests autenticados
export function createAuthenticatedRequest() {
  const token = getStoredClinicToken();
  
  return async function<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    if (!isClinicAuthenticated()) {
      throw new Error('Sesión expirada. Por favor, inicia sesión nuevamente.');
    }

    const config: RequestInit = {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...(token && { 'Authorization': `Bearer ${token}` }),
        ...options.headers,
      },
    };

    try {
      const response = await fetch(`${API_URL}/api${endpoint}`, config);
      
      if (!response.ok) {
        if (response.status === 401) {
          logoutClinic();
          throw new Error('Sesión expirada. Por favor, inicia sesión nuevamente.');
        }
        
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error?.message || `Error HTTP: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error(`❌ Error en request autenticado ${endpoint}:`, error);
      throw error;
    }
  };
}