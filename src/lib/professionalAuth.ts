// src/lib/professionalAuth.ts - Sistema de autenticación para profesionales

const API_URL = '/api';

export interface ProfessionalUser {
  id: string;
  clinic_id: string;
  first_name: string;
  last_name: string;
  email: string;
  speciality: string;
  permissions: string[];
  status: string;
}

export interface ProfessionalAuthResponse {
  professional: ProfessionalUser;
  jwt: string;
  user_type: 'professional';
}

// Función para login de profesional
export async function loginProfessional(email: string, password: string): Promise<ProfessionalAuthResponse> {
  try {
    console.log('🔐 Iniciando login de profesional:', email);
    
    const url = `${API_URL}/auth/login`;
    console.log('📡 Request URL:', url);
    
    const loginData = {
      username: email,
      password: password,
      user_type: "professional"
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

    // Adaptar la respuesta del backend al formato esperado por el frontend
    const professionalUser: ProfessionalUser = {
      id: data.user_data.id,
      clinic_id: data.user_data.clinic_id,
      first_name: data.user_data.first_name,
      last_name: data.user_data.last_name,
      email: data.user_data.email,
      speciality: data.user_data.speciality,
      permissions: data.user_data.permissions,
      status: data.user_data.status
    };

    console.log('✅ Login exitoso para profesional:', `${professionalUser.first_name} ${professionalUser.last_name}`);

    return {
      professional: professionalUser,
      jwt: data.access_token,
      user_type: 'professional'
    };

  } catch (error) {
    console.error('❌ Error en login de profesional:', error);
    throw error;
  }
}

// Función para logout de profesional
export function logoutProfessional(): void {
  if (typeof window !== 'undefined') {
    localStorage.removeItem('professional_token');
    localStorage.removeItem('professional_data');
    console.log('👋 Professional logout completado');
  }
}

// Función para obtener token almacenado de profesional
export function getStoredProfessionalToken(): string | null {
  if (typeof window !== 'undefined') {
    return localStorage.getItem('professional_token');
  }
  return null;
}

// Función para guardar datos de autenticación de profesional
export function saveProfessionalAuthData(authResponse: ProfessionalAuthResponse): void {
  if (typeof window !== 'undefined') {
    localStorage.setItem('professional_token', authResponse.jwt);
    localStorage.setItem('professional_data', JSON.stringify(authResponse.professional));
    console.log('💾 Datos de autenticación de profesional guardados');
  }
}

// Función para obtener datos almacenados de profesional
export function getStoredProfessionalData() {
  if (typeof window !== 'undefined') {
    const token = localStorage.getItem('professional_token');
    const professionalStr = localStorage.getItem('professional_data');
    
    return {
      token,
      professional: professionalStr ? JSON.parse(professionalStr) : null,
    };
  }
  return { token: null, professional: null };
}

// Función para verificar si el profesional está autenticado
export function isProfessionalAuthenticated(): boolean {
  const token = getStoredProfessionalToken();
  if (!token) return false;
  
  try {
    // Verificar si el token no ha expirado
    const payload = JSON.parse(atob(token.split('.')[1]));
    const now = Date.now() / 1000;
    
    if (payload.exp && payload.exp < now) {
      logoutProfessional();
      return false;
    }
    
    return true;
  } catch {
    logoutProfessional();
    return false;
  }
}

// Función para obtener información del profesional desde el token
export function getProfessionalFromToken(): ProfessionalUser | null {
  const data = getStoredProfessionalData();
  return data.professional;
}

// Middleware para requests autenticados de profesional
export function createProfessionalAuthenticatedRequest() {
  const token = getStoredProfessionalToken();
  
  return async function<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    if (!isProfessionalAuthenticated()) {
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
      const response = await fetch(`${API_URL}${endpoint}`, config);
      
      if (!response.ok) {
        if (response.status === 401) {
          logoutProfessional();
          throw new Error('Sesión expirada. Por favor, inicia sesión nuevamente.');
        }
        
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.detail || `Error HTTP: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error(`❌ Error en request autenticado ${endpoint}:`, error);
      throw error;
    }
  };
}