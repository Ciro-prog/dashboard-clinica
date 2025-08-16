// Configuración de WAHA independiente por empresa
// Cada clínica maneja su propia configuración de WhatsApp desde el frontend

interface WAHAConfig {
  url: string;
  api_key: string;
}

// Configuración por defecto de WAHA (manteniendo la original)
const DEFAULT_WAHA_CONFIG: WAHAConfig = {
  url: 'http://pampaservers.com:60513',
  api_key: 'pampaserver2025enservermuA!'
};

// Obtener configuración de WAHA para una clínica específica
export const getWAHAConfig = (clinicId?: string): WAHAConfig => {
  // Si hay una configuración específica por clínica en localStorage
  if (clinicId) {
    const customConfig = localStorage.getItem(`waha_config_${clinicId}`);
    if (customConfig) {
      try {
        return JSON.parse(customConfig);
      } catch (error) {
        console.warn('Error parseando configuración WAHA personalizada:', error);
      }
    }
  }

  // Verificar configuración global de WAHA
  const globalConfig = localStorage.getItem('waha_config');
  if (globalConfig) {
    try {
      return JSON.parse(globalConfig);
    } catch (error) {
      console.warn('Error parseando configuración WAHA global:', error);
    }
  }

  // Retornar configuración por defecto
  return DEFAULT_WAHA_CONFIG;
};

// Guardar configuración de WAHA para una clínica específica
export const setWAHAConfig = (config: WAHAConfig, clinicId?: string): void => {
  const key = clinicId ? `waha_config_${clinicId}` : 'waha_config';
  localStorage.setItem(key, JSON.stringify(config));
  console.log(`✅ Configuración WAHA guardada para ${clinicId || 'global'}`);
};

// Hacer request a WAHA usando la configuración de la clínica
export const wahaRequest = async (
  endpoint: string, 
  options: RequestInit = {},
  clinicId?: string
): Promise<Response> => {
  const config = getWAHAConfig(clinicId);
  
  // Construir headers con autenticación
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
    'X-Api-Key': config.api_key, // Mantener el formato original
    ...options.headers,
  };

  // Construir URL completa
  const fullUrl = endpoint.startsWith('http') ? endpoint : `${config.url}${endpoint}`;

  console.log(`📱 WAHA Request: ${fullUrl}`);

  return fetch(fullUrl, {
    ...options,
    headers,
  });
};

// Hook personalizado para usar WAHA
export const useWAHAConfig = (clinicId?: string) => {
  const config = getWAHAConfig(clinicId);
  
  const updateConfig = (newConfig: WAHAConfig) => {
    setWAHAConfig(newConfig, clinicId);
  };

  const makeRequest = (endpoint: string, options: RequestInit = {}) => {
    return wahaRequest(endpoint, options, clinicId);
  };

  return {
    config,
    updateConfig,
    makeRequest
  };
};

export type { WAHAConfig };