import { useState, useCallback, useRef } from 'react';
import { wahaRequest } from '@/lib/wahaConfig';

interface WAHASession {
  name: string;
  status: 'WORKING' | 'STARTING' | 'SCAN_QR_CODE' | 'STOPPED' | 'FAILED';
  qr?: string;
  me?: {
    id: string;
    pushName: string;
  };
}

interface UseWAHAServiceOptions {
  sessionName: string;
  clinicId?: string;
  onSessionUpdate?: (session: WAHASession | null) => void;
  onQRCodeUpdate?: (qr: string) => void;
  onError?: (error: string) => void;
  onSuccess?: (message: string) => void;
}

export const useWAHAService = ({
  sessionName,
  clinicId,
  onSessionUpdate,
  onQRCodeUpdate,
  onError,
  onSuccess
}: UseWAHAServiceOptions) => {
  const [isLoading, setIsLoading] = useState(false);
  const [session, setSession] = useState<WAHASession | null>(null);
  const [qrCode, setQrCode] = useState<string>('');
  const isMounted = useRef(true);

  // Probar conectividad con WAHA
  const testConnection = useCallback(async (): Promise<boolean> => {
    try {
      const response = await wahaRequest('/api/sessions?all=false', {}, clinicId);
      
      if (response.ok) {
        console.log('✅ WAHA servidor está corriendo');
        return true;
      } else if (response.status === 401) {
        console.error('🚨 API Key incorrecto o faltante');
        onError?.('Error de autenticación con WAHA');
        return false;
      } else {
        console.log('⚠️ Servidor responde pero con error:', response.status);
        return false;
      }
    } catch (err) {
      console.error('❌ No se puede conectar con servidor WAHA:', err);
      onError?.('No se puede conectar con el servidor WAHA');
      return false;
    }
  }, [clinicId, onError]);

  // Verificar sesión existente
  const checkSession = useCallback(async (silent = false): Promise<WAHASession | null> => {
    if (!sessionName || !isMounted.current) return null;

    try {
      const response = await wahaRequest(`/api/sessions/${sessionName}`, {}, clinicId);

      if (!isMounted.current) return null;

      if (response.ok) {
        const data = await response.json();
        if (!silent) {
          console.log('✅ Sesión encontrada:', data.status);
        }
        
        const sessionData: WAHASession = {
          name: data.name,
          status: data.status,
          me: data.me
        };

        setSession(sessionData);
        onSessionUpdate?.(sessionData);

        if (data.status !== 'SCAN_QR_CODE') {
          setQrCode('');
          onQRCodeUpdate?.('');
        }

        return sessionData;
      } else if (response.status === 404) {
        if (!silent) {
          console.log('ℹ️ Sesión no existe - se puede crear una nueva');
        }
        setSession(null);
        setQrCode('');
        onSessionUpdate?.(null);
        onQRCodeUpdate?.('');
        return null;
      } else {
        const errorText = await response.text();
        console.error('❌ Error HTTP:', response.status, errorText);
        if (!silent) {
          onError?.(`Error ${response.status}: ${errorText}`);
        }
        return null;
      }
    } catch (err) {
      console.error('❌ Error de conexión:', err);
      if (!silent) {
        onError?.('Error de conexión con WAHA');
      }
      return null;
    }
  }, [sessionName, clinicId, onSessionUpdate, onQRCodeUpdate, onError]);

  // Crear nueva sesión
  const createSession = useCallback(async (): Promise<boolean> => {
    if (!sessionName || !isMounted.current) return false;

    setIsLoading(true);

    try {
      console.log('➕ Creando sesión WAHA:', sessionName);
      
      // Probar conectividad primero
      const isConnected = await testConnection();
      if (!isConnected) {
        throw new Error('No se puede conectar con el servidor WAHA');
      }
      
      const requestBody = {
        name: sessionName,
        start: true,
        config: {
          metadata: {
            "user.id": sessionName,
            "user.email": "dashboard@clinica.com",
            "clinic": sessionName
          },
          proxy: null,
          debug: false,
          noweb: {
            store: {
              enabled: true,
              fullSync: false
            }
          },
          webhooks: []
        }
      };
      
      const response = await wahaRequest('/api/sessions', {
        method: 'POST',
        body: JSON.stringify(requestBody)
      }, clinicId);

      if (!isMounted.current) return false;

      if (response.ok) {
        const data = await response.json();
        console.log('✅ Sesión creada exitosamente:', data);
        
        onSuccess?.('Sesión WhatsApp creada exitosamente');
        
        // Verificar el estado inmediatamente
        setTimeout(() => {
          if (isMounted.current) {
            checkSession();
          }
        }, 1000);
        
        return true;
      } else {
        const errorData = await response.text();
        console.error('❌ Error creando sesión:', response.status, errorData);
        throw new Error(`Error ${response.status}: ${errorData}`);
      }
    } catch (err) {
      console.error('❌ Error en createSession:', err);
      onError?.(err instanceof Error ? err.message : 'Error desconocido al crear sesión');
      return false;
    } finally {
      setIsLoading(false);
    }
  }, [sessionName, clinicId, testConnection, onSuccess, onError, checkSession]);

  // Obtener código QR
  const getQRCode = useCallback(async (): Promise<string | null> => {
    if (!sessionName || !isMounted.current) return null;

    try {
      // Endpoints de QR a probar en orden de prioridad
      const qrEndpoints = [
        `/api/sessions/${sessionName}/auth/qr`,
        `/api/${sessionName}/auth/qr`,
        `/api/sessions/${sessionName}/qr`,
        `/api/${sessionName}/qr`
      ];

      for (const endpoint of qrEndpoints) {
        try {
          console.log(`🔍 Probando endpoint QR: ${endpoint}`);
          
          const response = await wahaRequest(endpoint, {}, clinicId);
          
          if (response.ok) {
            const data = await response.json();
            
            if (data.qr && data.qr.trim() !== '') {
              console.log(`✅ QR obtenido desde: ${endpoint}`);
              setQrCode(data.qr);
              onQRCodeUpdate?.(data.qr);
              return data.qr;
            } else {
              console.log(`⚠️ ${endpoint} - QR vacío o no disponible`);
            }
          } else if (response.status === 404) {
            console.log(`⚠️ ${endpoint} - Endpoint no existe`);
          } else {
            console.log(`⚠️ ${endpoint} - Error ${response.status}`);
          }
        } catch (err) {
          console.log(`⚠️ ${endpoint} - Error de conexión:`, err);
        }
      }

      console.log('❌ No se pudo obtener QR desde ningún endpoint');
      return null;
    } catch (err) {
      console.error('❌ Error obteniendo QR:', err);
      onError?.('Error obteniendo código QR');
      return null;
    }
  }, [sessionName, clinicId, onQRCodeUpdate, onError]);

  // Iniciar y obtener QR en un paso
  const startAndGetQR = useCallback(async (): Promise<boolean> => {
    if (!sessionName || !isMounted.current) return false;

    setIsLoading(true);

    try {
      console.log('🚀 Iniciando proceso completo para:', sessionName);

      // 1. Verificar si ya existe una sesión
      const existingSession = await checkSession(true);
      
      if (existingSession) {
        if (existingSession.status === 'WORKING') {
          onSuccess?.('WhatsApp ya está conectado y funcionando');
          setIsLoading(false);
          return true;
        } else if (existingSession.status === 'SCAN_QR_CODE') {
          console.log('📱 Sesión en estado SCAN_QR_CODE, obteniendo QR...');
          const qr = await getQRCode();
          if (qr) {
            onSuccess?.('Código QR listo para escanear');
            setIsLoading(false);
            return true;
          }
        }
      }

      // 2. Si no hay sesión o está fallida, crear nueva
      console.log('➕ Creando nueva sesión...');
      const sessionCreated = await createSession();
      
      if (!sessionCreated) {
        return false;
      }

      // 3. Esperar un poco y verificar estado
      console.log('⏳ Esperando que la sesión se inicialice...');
      await new Promise(resolve => setTimeout(resolve, 2000));

      // 4. Verificar estado y obtener QR si es necesario
      const updatedSession = await checkSession(true);
      
      if (updatedSession?.status === 'SCAN_QR_CODE') {
        console.log('📱 Obteniendo código QR...');
        const qr = await getQRCode();
        
        if (qr) {
          onSuccess?.('¡Código QR listo! Escanéalo con WhatsApp desde tu teléfono.');
          return true;
        } else {
          onError?.('Sesión creada pero no se pudo obtener el código QR');
          return false;
        }
      } else if (updatedSession?.status === 'WORKING') {
        onSuccess?.('WhatsApp conectado exitosamente');
        return true;
      } else {
        onError?.('Error en el estado de la sesión después de crearla');
        return false;
      }

    } catch (err) {
      console.error('❌ Error en startAndGetQR:', err);
      onError?.(err instanceof Error ? err.message : 'Error desconocido');
      return false;
    } finally {
      setIsLoading(false);
    }
  }, [sessionName, checkSession, createSession, getQRCode, onSuccess, onError]);

  // Eliminar sesión
  const deleteSession = useCallback(async (): Promise<boolean> => {
    if (!sessionName || !isMounted.current) return false;

    setIsLoading(true);

    try {
      console.log('🗑️ Eliminando sesión:', sessionName);
      
      const response = await wahaRequest(`/api/sessions/${sessionName}`, {
        method: 'DELETE'
      }, clinicId);

      if (response.ok) {
        console.log('✅ Sesión eliminada exitosamente');
        setSession(null);
        setQrCode('');
        onSessionUpdate?.(null);
        onQRCodeUpdate?.('');
        onSuccess?.('Sesión WhatsApp eliminada exitosamente');
        return true;
      } else {
        const errorData = await response.text();
        console.error('❌ Error eliminando sesión:', response.status, errorData);
        throw new Error(`Error ${response.status}: ${errorData}`);
      }
    } catch (err) {
      console.error('❌ Error en deleteSession:', err);
      onError?.(err instanceof Error ? err.message : 'Error eliminando sesión');
      return false;
    } finally {
      setIsLoading(false);
    }
  }, [sessionName, clinicId, onSessionUpdate, onQRCodeUpdate, onSuccess, onError]);

  return {
    // Estado
    isLoading,
    session,
    qrCode,
    
    // Funciones
    checkSession,
    createSession,
    getQRCode,
    startAndGetQR,
    deleteSession,
    testConnection,
    
    // Cleanup
    cleanup: () => {
      isMounted.current = false;
    }
  };
};