// Sistema de autenticación persistente con API Keys
// Permite mantener sesiones activas sin re-login manual

interface APIConfig {
  backend_url: string;
  backend_api_key: string;
  n8n_folder: string;
  admin_session_duration: number;
}

interface AuthSession {
  token: string;
  user: any;
  expires: number;
  api_config: APIConfig;
  created_at: number;
}

// Clase para manejar autenticación persistente
export class PersistentAuth {
  private static instance: PersistentAuth | null = null;
  private sessionCheckInterval: NodeJS.Timeout | null = null;
  private apiConfig: APIConfig | null = null;

  private constructor() {
    this.initializeAuth();
    this.startSessionMonitoring();
  }

  public static getInstance(): PersistentAuth {
    if (!PersistentAuth.instance) {
      PersistentAuth.instance = new PersistentAuth();
    }
    return PersistentAuth.instance;
  }

  // Inicializar autenticación al cargar la aplicación
  private initializeAuth(): void {
    try {
      const session = this.getStoredSession();
      if (session && this.isSessionValid(session)) {
        this.apiConfig = session.api_config;
        console.log('🔐 Sesión persistente cargada exitosamente');
      } else {
        console.log('⚠️ No hay sesión válida almacenada');
        this.clearStoredSession();
      }
    } catch (error) {
      console.error('❌ Error inicializando autenticación:', error);
      this.clearStoredSession();
    }
  }

  // Obtener configuración de API desde el backend o localStorage
  public async getAPIConfig(): Promise<APIConfig | null> {
    try {
      // Intentar cargar desde sesión actual
      if (this.apiConfig) {
        return this.apiConfig;
      }

      // Intentar cargar desde localStorage primero
      const localConfig = localStorage.getItem('admin_api_config');
      if (localConfig) {
        try {
          const config = JSON.parse(localConfig);
          this.apiConfig = config;
          console.log('✅ API config loaded from localStorage');
          return this.apiConfig;
        } catch (parseError) {
          console.error('❌ Error parsing localStorage API config:', parseError);
        }
      }

      // Intentar cargar desde sesión almacenada
      const session = this.getStoredSession();
      if (session && session.api_config) {
        this.apiConfig = session.api_config;
        return this.apiConfig;
      }

      // Cargar desde backend si hay token de admin
      const token = localStorage.getItem('admin_token');
      if (token) {
        const config = await this.fetchAPIConfig(token);
        if (config) {
          this.apiConfig = config;
          // Almacenar en localStorage también
          localStorage.setItem('admin_api_config', JSON.stringify(config));
          return config;
        }
      }

      console.warn('⚠️ No se pudo cargar configuración de API');
      return null;
    } catch (error) {
      console.error('❌ Error obteniendo configuración de API:', error);
      return null;
    }
  }

  // Hacer request autenticado - priorizar admin token sobre API key
  public async authenticatedRequest(endpoint: string, options: RequestInit = {}): Promise<Response> {
    // Verificar si hay token de admin activo primero
    const adminToken = localStorage.getItem('admin_token');
    const session = this.getStoredSession();
    
    if (adminToken && session && this.isSessionValid(session)) {
      // Usar token de admin - no requiere API key adicional
      const headers: HeadersInit = {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${adminToken}`,
        ...options.headers,
      };

      // Para admin, usar endpoints relativos (proxy de Vite/Vercel)
      const fullUrl = endpoint.startsWith('http') ? endpoint : endpoint;

      console.log(`👨‍💼 Request autenticado como admin: ${fullUrl}`);

      return fetch(fullUrl, {
        ...options,
        headers,
      });
    }

    // Fallback: usar API key para consultas externas
    const config = await this.getAPIConfig();
    
    if (!config) {
      throw new Error('No hay configuración de API disponible ni sesión de admin');
    }

    // Solo usar el backend principal con API key
    const baseUrl = config.backend_url;
    const apiKey = config.backend_api_key;

    if (!apiKey) {
      throw new Error('API Key del backend no configurada y no hay sesión de admin');
    }

    // Construir headers con autenticación por API key
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
      'X-API-Key': apiKey,
      ...options.headers,
    };

    // Construir URL completa
    const fullUrl = endpoint.startsWith('http') ? endpoint : `${baseUrl}${endpoint}`;

    console.log(`🔑 Request autenticado con API Key: ${fullUrl}`);

    return fetch(fullUrl, {
      ...options,
      headers,
    });
  }

  // Hacer request a N8N usando solo la información de carpeta
  public async getN8NFolder(): Promise<string> {
    const config = await this.getAPIConfig();
    return config?.n8n_folder || '';
  }

  // Actualizar configuración de API
  public updateAPIConfig(config: APIConfig): void {
    this.apiConfig = config;
    
    // Actualizar localStorage
    localStorage.setItem('admin_api_config', JSON.stringify(config));
    
    // Actualizar sesión almacenada si existe
    const session = this.getStoredSession();
    if (session) {
      session.api_config = config;
      this.storeSession(session);
    }

    console.log('✅ Configuración de API actualizada y guardada en localStorage');
  }

  // Crear nueva sesión con configuración
  public createSession(token: string, user: any, config: APIConfig): void {
    const now = Date.now();
    const expires = now + (config.admin_session_duration * 60 * 60 * 1000); // Convertir horas a ms

    const session: AuthSession = {
      token,
      user,
      expires,
      api_config: config,
      created_at: now,
    };

    this.storeSession(session);
    this.apiConfig = config;

    console.log('✅ Nueva sesión creada con configuración persistente');
  }

  // Verificar si la sesión es válida
  private isSessionValid(session: AuthSession): boolean {
    const now = Date.now();
    return session.expires > now;
  }

  // Obtener sesión almacenada
  private getStoredSession(): AuthSession | null {
    try {
      const sessionData = localStorage.getItem('persistent_session');
      if (!sessionData) return null;

      return JSON.parse(sessionData);
    } catch (error) {
      console.error('❌ Error parseando sesión almacenada:', error);
      return null;
    }
  }

  // Almacenar sesión
  private storeSession(session: AuthSession): void {
    try {
      localStorage.setItem('persistent_session', JSON.stringify(session));
      console.log('💾 Sesión almacenada exitosamente');
    } catch (error) {
      console.error('❌ Error almacenando sesión:', error);
    }
  }

  // Limpiar sesión almacenada
  private clearStoredSession(): void {
    localStorage.removeItem('persistent_session');
    this.apiConfig = null;
    console.log('🧹 Sesión limpiada');
  }

  // Obtener configuración de API desde backend
  private async fetchAPIConfig(token: string): Promise<APIConfig | null> {
    try {
      const response = await fetch('/api/admin/configuration', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        console.error('❌ Error obteniendo configuración:', response.status);
        return null;
      }

      const config = await response.json();
      console.log('✅ Configuración cargada desde backend');
      return config;
    } catch (error) {
      console.error('❌ Error fetcheando configuración:', error);
      return null;
    }
  }

  // Monitorear y renovar sesión automáticamente
  private startSessionMonitoring(): void {
    // Verificar sesión cada 5 minutos
    this.sessionCheckInterval = setInterval(async () => {
      const session = this.getStoredSession();
      
      if (!session) return;

      const now = Date.now();
      const timeUntilExpiry = session.expires - now;
      const renewThreshold = 60 * 60 * 1000; // 1 hora antes de expirar

      // Renovar si está cerca de expirar
      if (timeUntilExpiry < renewThreshold && timeUntilExpiry > 0) {
        console.log('🔄 Renovando sesión automáticamente...');
        await this.renewSession(session);
      } else if (timeUntilExpiry <= 0) {
        console.log('⏰ Sesión expirada, limpiando...');
        this.clearStoredSession();
      }
    }, 5 * 60 * 1000); // 5 minutos
  }

  // Renovar sesión existente
  private async renewSession(session: AuthSession): Promise<void> {
    try {
      const response = await fetch('/api/admin/renew-session', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${session.token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json();
        session.token = data.token;
        session.expires = Date.now() + (session.api_config.admin_session_duration * 60 * 60 * 1000);
        
        this.storeSession(session);
        
        // Actualizar token en localStorage para compatibilidad
        localStorage.setItem('admin_token', data.token);
        
        console.log('✅ Sesión renovada exitosamente');
      } else {
        console.warn('⚠️ No se pudo renovar sesión, será necesario re-login');
        this.clearStoredSession();
      }
    } catch (error) {
      console.error('❌ Error renovando sesión:', error);
    }
  }

  // Cerrar sesión y limpiar todo
  public logout(): void {
    if (this.sessionCheckInterval) {
      clearInterval(this.sessionCheckInterval);
      this.sessionCheckInterval = null;
    }
    
    this.clearStoredSession();
    localStorage.removeItem('admin_token');
    localStorage.removeItem('admin_user');
    localStorage.removeItem('admin_api_config');
    
    console.log('👋 Logout exitoso - todo limpiado');
  }

  // Obtener estado de autenticación
  public getAuthState(): { isAuthenticated: boolean; user: any; config: APIConfig | null } {
    const session = this.getStoredSession();
    
    return {
      isAuthenticated: session ? this.isSessionValid(session) : false,
      user: session?.user || null,
      config: this.apiConfig,
    };
  }
}

// Instancia singleton para usar en toda la aplicación
export const persistentAuth = PersistentAuth.getInstance();

// Helper functions para uso fácil
export const useAuthenticatedRequest = () => {
  return persistentAuth.authenticatedRequest.bind(persistentAuth);
};

export const getN8NFolder = () => {
  return persistentAuth.getN8NFolder();
};

export const getAPIConfig = () => {
  return persistentAuth.getAPIConfig();
};

export const updateAPIConfig = (config: APIConfig) => {
  return persistentAuth.updateAPIConfig(config);
};

export const createSession = (token: string, user: any, config: APIConfig) => {
  return persistentAuth.createSession(token, user, config);
};

export const logout = () => {
  return persistentAuth.logout();
};

export const getAuthState = () => {
  return persistentAuth.getAuthState();
};