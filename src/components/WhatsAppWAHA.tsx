import React, { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { type ClinicUser } from '@/lib/clinicAuth';
import { useWAHAService } from '@/hooks/useWAHAService';

interface WAHASession {
  name: string;
  status: 'WORKING' | 'STARTING' | 'SCAN_QR_CODE' | 'STOPPED' | 'FAILED';
  qr?: string;
  me?: {
    id: string;
    pushName: string;
  };
}

interface WhatsAppWAHAProps {
  clinic?: ClinicUser;
}

const WhatsAppWAHA = ({ clinic }: WhatsAppWAHAProps) => {
  const [error, setError] = useState<string>('');
  const [success, setSuccess] = useState<string>('');
  const [sessionName, setSessionName] = useState<string>('');
  const [autoRefresh, setAutoRefresh] = useState(false);
  const [lastCheck, setLastCheck] = useState<Date | null>(null);

  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const isPollingActive = useRef(false);

  // ✅ CONFIGURAR NOMBRE DE SESIÓN (UNA SOLA VEZ)
  useEffect(() => {
    if (clinic && !sessionName) {
      let finalSessionName = '';
      
      if (clinic.suscriber?.trim()) {
        finalSessionName = clinic.suscriber.trim();
      } else if (clinic.clinic_id?.trim()) {
        finalSessionName = clinic.clinic_id.trim();
      } else {
        finalSessionName = `clinic-${clinic.clinic_id || 'unknown'}`;
      }
      
      console.log('📱 Configurando nombre de sesión:', finalSessionName);
      setSessionName(finalSessionName);
    }
  }, [clinic, sessionName]);

  // ✅ Hook personalizado para WAHA con autenticación persistente
  const {
    isLoading,
    session,
    qrCode,
    checkSession,
    startAndGetQR,
    deleteSession,
    cleanup
  } = useWAHAService({
    sessionName,
    onSessionUpdate: (sessionData) => {
      setLastCheck(new Date());
    },
    onQRCodeUpdate: (qr) => {
      // QR code se maneja automáticamente en el hook
    },
    onError: (errorMessage) => {
      setError(errorMessage);
      setSuccess('');
    },
    onSuccess: (successMessage) => {
      setSuccess(successMessage);
      setError('');
    }
  });

  // ✅ CLEANUP
  useEffect(() => {
    return () => {
      isPollingActive.current = false;
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      cleanup();
      console.log('🧹 Componente WhatsApp desmontado');
    };
  }, [cleanup]);

  // ✅ VERIFICAR SESIÓN - ULTRA SIMPLE
  const checkSession = useCallback(async (silent = false) => {
    if (!sessionName || !isMounted.current) return;

    // ✅ Si es acción manual, detener polling automático
    if (!silent) {
      console.log('🔍 Verificando sesión manualmente:', sessionName);
      isPollingActive.current = false; // Detener cualquier polling activo
    }
    
    if (!silent) {
      console.log('🔍 Verificando sesión:', sessionName);
    }
    
    try {
      const response = await wahaRequest(`/api/sessions/${sessionName}`);

      if (!isMounted.current) return;

      if (response.ok) {
        const data = await response.json();
        if (!silent) {
          console.log('✅ Sesión encontrada:', data.status);
          console.log('📊 Datos completos de sesión:', data);
        }
        setSession(data);
        setError('');
        setLastCheck(new Date());
        if (data.status !== 'SCAN_QR_CODE') {
          setQrCode('');
        } else if (data.status === 'SCAN_QR_CODE' && !qrCode && !silent) {
          // ✅ Si detectamos SCAN_QR_CODE y no tenemos QR, iniciar polling
          console.log('📱 Estado SCAN_QR_CODE detectado, iniciando polling para sincronizar...');
          setTimeout(() => {
            if (isMounted.current) {
              pollSessionStateAndQR();
            }
          }, 1000);
        } else if (data.status === 'SCAN_QR_CODE' && qrCode && !silent) {
          // ✅ Si ya tenemos QR pero verificamos manualmente, iniciar monitoreo
          console.log('👀 QR ya disponible, iniciando monitoreo de escaneo...');
          setTimeout(() => {
            if (isMounted.current) {
              pollSessionStateAndQR(1, 30, true); // Monitoreo con QR existente
            }
          }, 1000);
        }
      } else if (response.status === 404) {
        if (!silent) {
          console.log('ℹ️ Sesión no existe - se puede crear una nueva');
        }
        setSession(null);
        setQrCode('');
        setError('');
        setLastCheck(new Date());
      } else {
        const errorText = await response.text();
        console.error('❌ Error HTTP:', response.status, errorText);
        if (!silent) {
          setError(`Error ${response.status}: ${errorText}`);
        }
      }
    } catch (err) {
      console.error('❌ Error de conexión:', err);
      if (!silent) {
        setError('🔌 Verificando conexión... Reintenta en unos momentos.');
      }
    }
  }, [sessionName]); // ✅ Solo depende de sessionName

  // ✅ PROBAR CONECTIVIDAD CON SERVIDOR WAHA
  const testWAHAConnection = useCallback(async () => {
    console.log('🔌 Probando conectividad con servidor WAHA...');
    
    try {
      // ✅ Probar primero el endpoint que ya sabemos que funciona
      const response = await wahaRequest('/api/sessions?all=false');

      console.log('🔌 Test conectividad GET /sessions - Status:', response.status);
      
      if (response.ok) {
        const data = await response.json();
        console.log('✅ WAHA servidor está corriendo. Sesiones existentes:', data);
        return true;
      } else if (response.status === 401) {
        console.error('🚨 API Key incorrecto o faltante');
        return false;
      } else {
        console.log('⚠️ Servidor responde pero con error:', response.status);
        return false;
      }
    } catch (err) {
      console.error('❌ No se puede conectar con servidor WAHA:', err);
      return false;
    }
  }, []);

  // ✅ CREAR SESIÓN - CORREGIDO SEGÚN DOCUMENTACIÓN WAHA
  const createSession = useCallback(async () => {
    if (!sessionName || !isMounted.current) return;

    setIsLoading(true);
    setError('');
    setSuccess('');

    try {
      console.log('➕ Creando sesión WAHA:', sessionName);
      
      // ✅ Primero probar conectividad
      const isConnected = await testWAHAConnection();
      if (!isConnected) {
        throw new Error('No se puede conectar con el servidor WAHA. Verifica que esté corriendo en pampaservers.com:60513');
      }
      
      // ✅ Estructura correcta según curl funcionando
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
      
      console.log('📤 Enviando petición a /api/sessions (directo):', requestBody);
      console.log('📤 Headers enviados:', headers);
      console.log('📤 URL será: http://pampaservers.com:60513/api/sessions');
      
      const response = await wahaRequest('/api/sessions', {
        method: 'POST',
        body: JSON.stringify(requestBody)
      });

      console.log('📡 Response status:', response.status);
      console.log('📡 Response headers:', Object.fromEntries(response.headers.entries()));

      if (!isMounted.current) return;

      if (response.ok) {
        const data = await response.json();
        console.log('✅ Sesión creada exitosamente:', data);
        setSession(data);
        setSuccess(`✅ Sesión "${sessionName}" creada correctamente`);
        
        // ✅ Flujo automático: verificar estado y obtener QR si es necesario
        setTimeout(async () => {
          if (isMounted.current) {
            console.log('🔄 Verificando estado post-creación...');
            
            // Verificar estado actual del servidor
            try {
              const response = await fetch(`/api/sessions/${sessionName}`, {
                method: 'GET',
                headers
              });

              if (response.ok) {
                const currentData = await response.json();
                console.log('📊 Estado actual verificado:', currentData.status);
                setSession(currentData);
                
                // Iniciar polling persistente para obtener el QR
                console.log('🚀 Iniciando polling persistente para sincronizar con panel WAHA...');
                setTimeout(() => {
                  if (isMounted.current) {
                    pollSessionStateAndQR();
                  }
                }, 2000);
              }
            } catch (err) {
              console.error('❌ Error en verificación post-creación:', err);
            }
          }
        }, 3000);
      } else {
        const responseText = await response.text();
        console.error('❌ Error completo:', {
          status: response.status,
          statusText: response.statusText,
          headers: Object.fromEntries(response.headers.entries()),
          body: responseText
        });
        
        let errorData;
        try {
          errorData = JSON.parse(responseText);
        } catch {
          errorData = { message: responseText };
        }
        
        // ✅ Diagnóstico especial para errores comunes
        if (response.status === 405) {
          console.error('🚨 Error 405 - Method Not Allowed. Posibles causas:');
          console.error('   1. Servidor WAHA no está corriendo');
          console.error('   2. Endpoint incorrecto');
          console.error('   3. Método HTTP no soportado');
          console.error('   4. Headers incorrectos');
          throw new Error('Método no permitido - Verifica que el servidor WAHA esté corriendo');
        }
        
        if (response.status === 401) {
          console.error('🚨 Error 401 - Unauthorized. API Key incorrecto o faltante');
          console.error('   Current API Key:', headers['X-Api-Key']);
          console.error('   Verifica que el API Key sea correcto en el servidor WAHA');
          throw new Error('No autorizado - Verifica el API Key del servidor WAHA');
        }
        
        throw new Error(errorData.message || `HTTP ${response.status}: ${responseText}`);
      }
    } catch (err) {
      console.error('❌ Error completo creando sesión:', err);
      if (isMounted.current) {
        const errorMsg = err instanceof Error ? err.message : 'Error desconocido';
        setError(`Error al crear sesión: ${errorMsg}`);
      }
    } finally {
      if (isMounted.current) {
        setIsLoading(false);
      }
    }
  }, [sessionName, headers, checkSession]);

  // ✅ ACTUALIZAR SESIÓN
  const updateSession = useCallback(async () => {
    if (!sessionName || !isMounted.current) return;

    setIsLoading(true);
    setError('');
    setSuccess('');

    try {
      console.log('🔄 Actualizando sesión:', sessionName);
      
      const response = await fetch(`/api/sessions/${sessionName}`, {
        method: 'PUT',
        headers,
        body: JSON.stringify({ name: sessionName })
      });

      if (!isMounted.current) return;

      if (response.ok) {
        const data = await response.json();
        console.log('✅ Sesión actualizada');
        setSession(data);
        setSuccess('✅ Sesión actualizada correctamente');
        
        setTimeout(() => {
          if (isMounted.current) checkSession();
        }, 10000);
      } else {
        const errorText = await response.text();
        throw new Error(errorText);
      }
    } catch (err) {
      console.error('❌ Error actualizando sesión:', err);
      if (isMounted.current) {
        setError(`Error al actualizar sesión: ${err instanceof Error ? err.message : 'Error desconocido'}`);
      }
    } finally {
      if (isMounted.current) {
        setIsLoading(false);
      }
    }
  }, [sessionName, headers, checkSession]);

  // ✅ INICIAR SESIÓN - CORREGIDO SEGÚN DOCUMENTACIÓN WAHA
  const startSession = useCallback(async () => {
    if (!sessionName || !isMounted.current) return;

    setIsLoading(true);
    setError('');
    setSuccess('');

    try {
      console.log('▶️ Iniciando sesión WAHA:', sessionName);
      
      // ✅ Endpoint correcto: /api/sessions/{session}/start
      const response = await fetch(`/api/sessions/${sessionName}/start`, {
        method: 'POST',
        headers
      });

      console.log('📡 Response status para start:', response.status);

      if (!isMounted.current) return;

      if (response.ok) {
        const data = await response.json();
        console.log('✅ Sesión iniciada:', data);
        setSuccess('✅ Sesión iniciada correctamente');
        
        // Verificar estado después de iniciar
        setTimeout(() => {
          if (isMounted.current) {
            console.log('🔄 Verificando estado post-inicio...');
            checkSession();
          }
        }, 10000); // Más tiempo para que se inicie completamente
      } else {
        const errorText = await response.text();
        console.error('❌ Error al iniciar:', response.status, errorText);
        throw new Error(`HTTP ${response.status}: ${errorText}`);
      }
    } catch (err) {
      console.error('❌ Error iniciando sesión:', err);
      if (isMounted.current) {
        const errorMsg = err instanceof Error ? err.message : 'Error desconocido';
        setError(`Error al iniciar sesión: ${errorMsg}`);
      }
    } finally {
      if (isMounted.current) {
        setIsLoading(false);
      }
    }
  }, [sessionName, headers, checkSession]);

  // ✅ DETENER SESIÓN
  const stopSession = useCallback(async () => {
    if (!sessionName || !isMounted.current) return;

    setIsLoading(true);
    setError('');
    setSuccess('');

    try {
      console.log('⏹️ Deteniendo sesión:', sessionName);
      
      // ✅ Endpoint correcto: /api/sessions/{session}/stop
      const response = await fetch(`/api/sessions/${sessionName}/stop`, {
        method: 'POST',
        headers
      });

      if (!isMounted.current) return;

      if (response.ok) {
        console.log('✅ Sesión detenida');
        setSuccess('✅ Sesión detenida correctamente');
        setQrCode('');
        
        setTimeout(() => {
          if (isMounted.current) checkSession();
        }, 1000);
      } else {
        const errorText = await response.text();
        throw new Error(errorText);
      }
    } catch (err) {
      console.error('❌ Error deteniendo sesión:', err);
      if (isMounted.current) {
        setError(`Error al detener sesión: ${err instanceof Error ? err.message : 'Error desconocido'}`);
      }
    } finally {
      if (isMounted.current) {
        setIsLoading(false);
      }
    }
  }, [sessionName, headers, checkSession]);

  // ✅ REINICIAR SESIÓN
  const restartSession = useCallback(async () => {
    if (!sessionName || !isMounted.current) return;

    setIsLoading(true);
    setError('');
    setSuccess('');

    try {
      console.log('🔄 Reiniciando sesión:', sessionName);
      
      // ✅ Endpoint correcto: /api/sessions/{session}/restart
      const response = await fetch(`/api/sessions/${sessionName}/restart`, {
        method: 'POST',
        headers
      });

      if (!isMounted.current) return;

      if (response.ok) {
        console.log('✅ Sesión reiniciada');
        setSuccess('✅ Sesión reiniciada correctamente');
        
        setTimeout(() => {
          if (isMounted.current) checkSession();
        }, 2000);
      } else {
        const errorText = await response.text();
        throw new Error(errorText);
      }
    } catch (err) {
      console.error('❌ Error reiniciando sesión:', err);
      if (isMounted.current) {
        setError(`Error al reiniciar sesión: ${err instanceof Error ? err.message : 'Error desconocido'}`);
      }
    } finally {
      if (isMounted.current) {
        setIsLoading(false);
      }
    }
  }, [sessionName, headers, checkSession]);

  // ✅ ELIMINAR SESIÓN
  const deleteSession = useCallback(async () => {
    if (!sessionName || !isMounted.current) return;
    
    if (!confirm(`¿Eliminar la sesión "${sessionName}"?`)) return;

    setIsLoading(true);
    setError('');
    setSuccess('');

    try {
      console.log('🗑️ Eliminando sesión:', sessionName);
      
      // ✅ Endpoint correcto para eliminar: /api/sessions/{session}
      const response = await fetch(`/api/sessions/${sessionName}`, {
        method: 'DELETE',
        headers
      });

      if (!isMounted.current) return;

      if (response.ok) {
        console.log('✅ Sesión eliminada');
        setSession(null);
        setQrCode('');
        setSuccess('✅ Sesión eliminada correctamente');
      } else {
        const errorText = await response.text();
        throw new Error(errorText);
      }
    } catch (err) {
      console.error('❌ Error eliminando sesión:', err);
      if (isMounted.current) {
        setError(`Error al eliminar sesión: ${err instanceof Error ? err.message : 'Error desconocido'}`);
      }
    } finally {
      if (isMounted.current) {
        setIsLoading(false);
      }
    }
  }, [sessionName, headers]);

  // ✅ POLLING PERSISTENTE PARA QR AUTOMÁTICO Y DETECCIÓN DE ESCANEO
  const pollSessionStateAndQR = useCallback(async (attempt = 1, maxAttempts = 50, hasQR = false) => {
    if (!sessionName || !isMounted.current) return;

    // ✅ EVITAR MÚLTIPLES POLLINGS SIMULTÁNEOS
    if (isPollingActive.current && attempt === 1) {
      console.log('⚠️ Polling ya está activo, cancelando nuevo inicio');
      return;
    }

    if (attempt === 1) {
      isPollingActive.current = true;
      console.log('🚀 Iniciando nuevo ciclo de polling');
    }

    // ✅ VERIFICAR SI POLLING FUE DETENIDO
    if (!isPollingActive.current) {
      console.log('⏹️ Polling cancelado por control externo');
      return;
    }

    const phase = hasQR ? 'monitoreo' : 'obtención QR';
    console.log(`🔄 Polling ${phase} - Intento ${attempt}/${maxAttempts}`);
    
    try {
      // Verificar estado actual
      const response = await fetch(`/api/sessions/${sessionName}`, {
        method: 'GET',
        headers
      });

      if (!isMounted.current) return;

      if (response.ok) {
        const data = await response.json();
        console.log(`📊 Polling ${attempt}: Estado = ${data.status}`);
        setSession(data);
        setError('');
        setLastCheck(new Date());
        
        // ✅ DETECTAR CONEXIÓN EXITOSA (QR ESCANEADO)
        if (data.status === 'WORKING') {
          console.log('🎉 ¡QR ESCANEADO! Sesión conectada exitosamente');
          setSuccess('🎉 ¡Código QR escaneado exitosamente! WhatsApp conectado');
          setQrCode(''); // Limpiar QR ya que no se necesita más
          isPollingActive.current = false; // ✅ Detener polling
          return; // ✅ Éxito total, terminar polling
        }
        
        // ❌ DETECTAR FALLO DE SESIÓN
        if (data.status === 'FAILED') {
          console.log('❌ Sesión falló, deteniendo polling');
          setError('🔄 Reconectando... Si el problema persiste, inicia una nueva sesión.');
          setQrCode(''); // Limpiar QR
          isPollingActive.current = false; // ✅ Detener polling
          return; // ❌ Error, terminar polling
        }
        
        // 📱 OBTENER QR AUTOMÁTICAMENTE
        if (data.status === 'SCAN_QR_CODE' && !hasQR) {
          console.log('✅ Estado SCAN_QR_CODE confirmado, obteniendo QR automáticamente...');
          
          try {
            const qrResponse = await fetch(`/api/sessions/${sessionName}/auth/qr`, {
              method: 'GET',
              headers
            });

            if (qrResponse.ok) {
              const contentType = qrResponse.headers.get('content-type');
              
              if (contentType?.includes('image/png')) {
                const blob = await qrResponse.blob();
                const reader = new FileReader();
                reader.onload = () => {
                  if (isMounted.current) {
                    setQrCode(reader.result as string);
                    setSuccess(`📱 Código QR listo para escanear`);
                    console.log(`🎯 QR obtenido exitosamente, iniciando monitoreo de escaneo...`);
                    
                    // ✅ CONTINUAR POLLING PARA DETECTAR ESCANEO
                    setTimeout(() => {
                      if (isMounted.current) {
                        pollSessionStateAndQR(1, 30, true); // Nuevo ciclo con más intentos para monitoreo
                      }
                    }, 3000);
                  }
                };
                reader.readAsDataURL(blob);
                return; // QR obtenido, nuevo ciclo iniciado
              } else {
                const qrData = await qrResponse.json();
                if (qrData.qr) {
                  if (isMounted.current) {
                    setQrCode(qrData.qr);
                    setSuccess(`📱 Código QR listo para escanear`);
                    console.log(`🎯 QR obtenido exitosamente, iniciando monitoreo de escaneo...`);
                    
                    // ✅ CONTINUAR POLLING PARA DETECTAR ESCANEO
                    setTimeout(() => {
                      if (isMounted.current) {
                        pollSessionStateAndQR(1, 30, true); // Nuevo ciclo con más intentos para monitoreo
                      }
                    }, 3000);
                  }
                  return; // QR obtenido, nuevo ciclo iniciado
                }
              }
            }
            
            console.log(`⚠️ Intento ${attempt}: QR no disponible, status ${qrResponse.status}`);
            
          } catch (qrError) {
            console.log(`⚠️ Intento ${attempt}: Error obteniendo QR:`, qrError);
          }
        }
        
        // 👀 MONITOREO CONTINUO POST-QR
        if (data.status === 'SCAN_QR_CODE' && hasQR) {
          console.log(`👀 Monitoreando escaneo de QR - ${attempt}/${maxAttempts}`);
          setSuccess(`📱 Esperando que escanees el código QR... (${attempt}/${maxAttempts})`);
        }
        
        // ⏳ ESTADO TRANSITORIO
        if (data.status === 'STARTING') {
          console.log(`⏳ Sesión iniciando - ${attempt}/${maxAttempts}`);
          setSuccess(`⏳ Iniciando WhatsApp... (${attempt}/${maxAttempts})`);
        }
        
        // 🔄 CONTINUAR POLLING
        if (attempt < maxAttempts && isMounted.current && isPollingActive.current) {
          setTimeout(() => {
            if (isMounted.current && isPollingActive.current) {
              pollSessionStateAndQR(attempt + 1, maxAttempts, hasQR);
            }
          }, 3000);
        } else if (attempt >= maxAttempts) {
          console.log(`⏰ Se agotaron los ${maxAttempts} intentos de polling`);
          isPollingActive.current = false; // ✅ Detener polling
          
          if (hasQR) {
            setError(`⏰ El código QR no fue escaneado en el tiempo esperado. El QR sigue siendo válido, puedes escanearlo cuando gustes.`);
          } else {
            setError(`⏰ No se pudo obtener el QR después de ${maxAttempts} intentos. Usa el botón "Verificar Estado" manualmente.`);
          }
        }
        
      } else {
        console.log(`❌ Polling ${attempt}: Error HTTP ${response.status}`);
        
        // Continuar polling en caso de errores temporales
        if (attempt < maxAttempts && isMounted.current && isPollingActive.current) {
          setTimeout(() => {
            if (isMounted.current && isPollingActive.current) {
              pollSessionStateAndQR(attempt + 1, maxAttempts, hasQR);
            }
          }, 3000);
        } else {
          isPollingActive.current = false; // ✅ Detener polling
          setError('🔄 Reintentando conexión... Usa el botón "Verificar Estado" si continúa.');
        }
      }
      
    } catch (error) {
      console.error(`❌ Polling ${attempt} error:`, error);
      
      // Continuar polling en caso de errores de red
      if (attempt < maxAttempts && isMounted.current && isPollingActive.current) {
        setTimeout(() => {
          if (isMounted.current && isPollingActive.current) {
            pollSessionStateAndQR(attempt + 1, maxAttempts, hasQR);
          }
        }, 3000);
      } else {
        isPollingActive.current = false; // ✅ Detener polling
        setError('🔄 Reintentando conexión... Usa el botón "Verificar Estado" si continúa.');
      }
    }
  }, [sessionName, headers]);

  // ✅ OBTENER QR CON REINTENTOS AUTOMÁTICOS PARA 404
  const getQR = useCallback(async (retryCount = 0, maxRetries = 5) => {
    if (!sessionName || !isMounted.current) return;

    // ✅ ACCIÓN MANUAL - Detener polling automático
    if (retryCount === 0) {
      console.log('📱 Obteniendo QR manualmente - deteniendo polling automático');
      isPollingActive.current = false; // Detener polling
      setIsLoading(true);
      setError('');
    }

    // Solo mostrar loading en el primer intento
    if (retryCount === 0) {
      setIsLoading(true);
      setError('');
    }

    // ✅ Endpoint correcto según documentación WAHA: /api/sessions/{session}/auth/qr
    const qrEndpoints = [
      `/api/sessions/${sessionName}/auth/qr`, // ✅ Formato correcto según docs
      `/api/${sessionName}/auth/qr`, // Fallback
      `/api/${sessionName}/qr`, // Fallback adicional
    ];

    try {
      if (retryCount === 0) {
        console.log('📷 Obteniendo QR para sesión:', sessionName);
      } else {
        console.log(`📷 Reintento ${retryCount}/${maxRetries} obteniendo QR para sesión:`, sessionName);
        setSuccess(`🔄 Reintentando obtener QR (${retryCount}/${maxRetries})...`);
      }
      
      let qrFound = false;
      let lastError = null;

      for (const endpoint of qrEndpoints) {
        if (!isMounted.current || qrFound) break;

        try {
          console.log(`🔍 Probando: ${endpoint} ${retryCount > 0 ? `(reintento ${retryCount})` : ''}`);
          
          const response = await fetch(endpoint, {
            method: 'GET',
            headers
          });

          if (response.ok) {
            const contentType = response.headers.get('content-type');
            
            if (contentType?.includes('image/png')) {
              const blob = await response.blob();
              const reader = new FileReader();
              reader.onload = () => {
                if (isMounted.current) {
                  setQrCode(reader.result as string);
                  setSuccess(`✅ QR obtenido desde: ${endpoint}${retryCount > 0 ? ` (tras ${retryCount} reintentos)` : ''}`);
                  qrFound = true;
                }
              };
              reader.readAsDataURL(blob);
              break;
            } else {
              const data = await response.json();
              if (data.qr) {
                if (isMounted.current) {
                  setQrCode(data.qr);
                  setSuccess(`✅ QR obtenido desde: ${endpoint}${retryCount > 0 ? ` (tras ${retryCount} reintentos)` : ''}`);
                  qrFound = true;
                }
                break;
              }
            }
          } else if (response.status === 404) {
            // ✅ Error 404 - puede ser temporal, guardar para reintentar
            lastError = `QR no disponible aún (404)`;
            console.log(`⚠️ ${endpoint}: 404 - QR no disponible aún`);
          } else {
            // Otros errores HTTP
            lastError = `HTTP ${response.status}`;
            console.log(`❌ ${endpoint}: ${response.status}`);
          }
        } catch (endpointErr) {
          lastError = endpointErr instanceof Error ? endpointErr.message : 'Error de conexión';
          console.log(`❌ Error en ${endpoint}:`, endpointErr);
        }
      }

      // ✅ Si no se encontró QR y es un 404, reintentar
      if (!qrFound && isMounted.current) {
        if (lastError?.includes('404') && retryCount < maxRetries) {
          console.log(`🔄 QR no disponible, reintentando en 3 segundos... (${retryCount + 1}/${maxRetries})`);
          
          // Esperar 3 segundos antes del siguiente intento
          setTimeout(() => {
            if (isMounted.current) {
              getQR(retryCount + 1, maxRetries);
            }
          }, 3000);
          
          return; // No finalizar la función aún
        } else {
          // Se agotaron los reintentos o es otro tipo de error
          const errorMsg = lastError?.includes('404') 
            ? `QR no disponible después de ${maxRetries} intentos. La sesión puede no estar lista para mostrar el QR aún.`
            : `No se pudo obtener el QR: ${lastError || 'Error desconocido'}`;
          
          throw new Error(errorMsg);
        }
      }
    } catch (err) {
      console.error('❌ Error obteniendo QR:', err);
      if (isMounted.current) {
        setError(`Error al obtener QR: ${err instanceof Error ? err.message : 'Error desconocido'}`);
      }
    } finally {
      // Solo finalizar loading si no vamos a reintentar
      if (isMounted.current && (retryCount >= maxRetries || retryCount === 0)) {
        setIsLoading(false);
      }
    }
  }, [sessionName, headers]);

  // ✅ INICIAR Y OBTENER QR
  const startAndGetQR = useCallback(async () => {
    if (!sessionName || !isMounted.current) return;

    setIsLoading(true);
    setError('');
    setSuccess('');

    try {
      console.log('🚀 Iniciando sesión y obteniendo QR');
      
      // ✅ Iniciar sesión con endpoint correcto
      const startResponse = await fetch(`/api/sessions/${sessionName}/start`, {
        method: 'POST',
        headers
      });

      if (!startResponse.ok) {
        const errorText = await startResponse.text();
        throw new Error(`Error al iniciar: ${errorText}`);
      }

      if (!isMounted.current) return;

      // Esperar un momento para que la sesión se inicialice
      await new Promise(resolve => setTimeout(resolve, 3000));

      if (!isMounted.current) return;

      // Verificar estado ACTUAL del servidor antes de obtener QR
      const response = await fetch(`/api/sessions/${sessionName}`, {
        method: 'GET',
        headers
      });

      if (response.ok) {
        const currentData = await response.json();
        console.log('📊 Estado actual después de iniciar:', currentData.status);
        setSession(currentData);
        
        // Iniciar polling persistente independientemente del estado
        console.log('🚀 Iniciando polling persistente desde startAndGetQR...');
        pollSessionStateAndQR();
      } else {
        console.error('❌ Error verificando estado después de iniciar:', response.status);
      }
      
    } catch (err) {
      console.error('❌ Error en startAndGetQR:', err);
      if (isMounted.current) {
        setError(`Error: ${err instanceof Error ? err.message : 'Error desconocido'}`);
      }
    } finally {
      if (isMounted.current) {
        setIsLoading(false);
      }
    }
  }, [sessionName, headers, checkSession, getQR]);

  // ✅ VERIFICAR AL CARGAR
  useEffect(() => {
    if (sessionName && isMounted.current) {
      checkSession();
    }
  }, [sessionName, checkSession]);

  // ✅ SISTEMA DE AUTO-REFRESH CADA 3 MINUTOS - CORREGIDO
  useEffect(() => {
    if (sessionName && autoRefresh && isMounted.current) {
      console.log('⏰ Configurando auto-refresh cada 3 minutos para:', sessionName);
      
      // Limpiar interval existente
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      
      // Crear nuevo interval
      intervalRef.current = setInterval(() => {
        if (isMounted.current && autoRefresh) {
          console.log('🔄 Auto-refresh ejecutándose...');
          // ✅ Llamar directamente a la función para evitar dependencias circulares
          const doSilentCheck = async () => {
            if (!sessionName || !isMounted.current) return;
            
            try {
              const response = await fetch(`/api/sessions/${sessionName}`, {
                method: 'GET',
                headers
              });

              if (!isMounted.current) return;

              if (response.ok) {
                const data = await response.json();
                setSession(data);
                setError('');
                setLastCheck(new Date());
                if (data.status !== 'SCAN_QR_CODE') {
                  setQrCode('');
                }
              } else if (response.status === 404) {
                setSession(null);
                setQrCode('');
                setError('');
                setLastCheck(new Date());
              }
            } catch (err) {
              // Error silencioso en auto-refresh
              console.log('🔄 Auto-refresh: Error de conexión (normal)');
            }
          };
          
          doSilentCheck();
        }
      }, 3 * 60 * 1000); // 3 minutos
      
      return () => {
        if (intervalRef.current) {
          clearInterval(intervalRef.current);
          intervalRef.current = null;
        }
      };
    }
  }, [sessionName, autoRefresh]); // ✅ Solo estas dependencias

  // ✅ TOGGLE PARA AUTO-REFRESH
  const toggleAutoRefresh = useCallback(() => {
    setAutoRefresh(prev => {
      const newValue = !prev;
      console.log(`🔄 Auto-refresh ${newValue ? 'activado' : 'desactivado'}`);
      
      if (!newValue && intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
        console.log('⏰ Interval limpiado');
      }
      
      return newValue;
    });
  }, []);

  // ✅ LIMPIAR MENSAJES
  useEffect(() => {
    if (success) {
      const timer = setTimeout(() => {
        if (isMounted.current) setSuccess('');
      }, 4000);
      return () => clearTimeout(timer);
    }
  }, [success]);

  // ✅ FUNCIONES HELPER
  const getBadgeColor = (status: string) => {
    switch (status) {
      case 'WORKING': return 'bg-green-500';
      case 'STARTING': return 'bg-yellow-500';
      case 'SCAN_QR_CODE': return 'bg-blue-500';
      case 'STOPPED': return 'bg-gray-500';
      case 'FAILED': return 'bg-red-500';
      default: return 'bg-gray-400';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'WORKING': return '✅ Conectado';
      case 'STARTING': return '🟡 Iniciando...';
      case 'SCAN_QR_CODE': return '📷 Escanear QR';
      case 'STOPPED': return '⏹️ Detenido';
      case 'FAILED': return '❌ Error';
      default: return '❓ Desconocido';
    }
  };

  // ✅ LOADING STATE
  if (!clinic) {
    return (
      <div className="flex justify-center items-center py-8">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto"></div>
          <p className="mt-2 text-sm text-gray-600">Cargando...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* HEADER SIMPLIFICADO */}
      <Card className="bg-gradient-to-r from-green-50 to-blue-50 dark:from-green-900/20 dark:to-blue-900/20 border-green-200 dark:border-green-700">
        <CardHeader className="text-center">
          <CardTitle className="text-xl flex items-center justify-center gap-2">
            📱 WhatsApp Business
            {session && (
              <Badge className={`${getBadgeColor(session.status)} text-white ml-2`}>
                {getStatusText(session.status)}
              </Badge>
            )}
          </CardTitle>
          <CardDescription className="text-lg">
            {clinic.name_clinic}
          </CardDescription>
        </CardHeader>
      </Card>

      {/* MENSAJES IMPORTANTES */}
      {error && (
        <Alert className="border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-900/20">
          <AlertDescription className="text-red-700 dark:text-red-300 text-center font-medium">
            ❌ {error}
          </AlertDescription>
        </Alert>
      )}
      
      {success && (
        <Alert className="border-green-200 dark:border-green-800 bg-green-50 dark:bg-green-900/20">
          <AlertDescription className="text-green-700 dark:text-green-300 text-center font-medium">
            {success}
          </AlertDescription>
        </Alert>
      )}

      {/* ESTADO ACTUAL Y ACCIONES PRINCIPALES */}
      <Card className="bg-card dark:bg-card">
        <CardContent className="py-6 bg-card dark:bg-card">
          {!session ? (
            <div className="text-center space-y-4">
              <div className="text-gray-600 dark:text-gray-300 mb-4">
                <p className="text-lg">🔗 No hay conexión con WhatsApp</p>
                <p className="text-sm">Necesitas crear una nueva conexión</p>
              </div>
              <Button 
                onClick={createSession} 
                disabled={isLoading} 
                className="bg-green-600 hover:bg-green-700 dark:bg-green-500 dark:hover:bg-green-600 text-white px-8 py-3 text-lg"
                size="lg"
              >
                {isLoading ? '⏳ Creando...' : '🚀 Conectar WhatsApp'}
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              {/* ESTADO WORKING - CONECTADO */}
              {session.status === 'WORKING' && (
                <div className="text-center space-y-4">
                  <div className="text-green-600 dark:text-green-400 mb-4">
                    <div className="w-16 h-16 bg-green-100 dark:bg-green-900 rounded-full flex items-center justify-center mx-auto mb-3">
                      <span className="text-2xl">✅</span>
                    </div>
                    <p className="text-xl font-semibold text-foreground">¡WhatsApp Conectado!</p>
                    {session.me && (
                      <p className="text-sm text-foreground">Conectado como: <strong>{session.me.pushName}</strong></p>
                    )}
                  </div>
                  <Button 
                    onClick={stopSession} 
                    disabled={isLoading} 
                    variant="outline"
                    className="border-red-300 dark:border-red-700 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20"
                  >
                    {isLoading ? '⏳ Desconectando...' : '🔌 Desconectar'}
                  </Button>
                </div>
              )}

              {/* ESTADO SCAN_QR_CODE - NECESITA ESCANEAR */}
              {session.status === 'SCAN_QR_CODE' && (
                <div className="text-center space-y-4">
                  <div className="text-blue-600 dark:text-blue-400 mb-4">
                    <div className="w-16 h-16 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center mx-auto mb-3">
                      <span className="text-2xl">📱</span>
                    </div>
                    <p className="text-xl font-semibold text-foreground">Escanea el código QR</p>
                    <p className="text-sm text-foreground">Abre WhatsApp en tu teléfono para conectar</p>
                  </div>
                  
                  {!qrCode && (
                    <Button 
                      onClick={getQR} 
                      disabled={isLoading} 
                      className="bg-blue-600 hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600 text-white"
                    >
                      {isLoading ? '⏳ Generando...' : '📷 Mostrar código QR'}
                    </Button>
                  )}
                </div>
              )}

              {/* ESTADO STARTING - INICIANDO */}
              {session.status === 'STARTING' && (
                <div className="text-center space-y-4">
                  <div className="text-yellow-600 dark:text-yellow-400 mb-4">
                    <div className="w-16 h-16 bg-yellow-100 dark:bg-yellow-900 rounded-full flex items-center justify-center mx-auto mb-3">
                      <div className="w-8 h-8 border-4 border-yellow-600 dark:border-yellow-400 border-t-transparent rounded-full animate-spin"></div>
                    </div>
                    <p className="text-xl font-semibold text-foreground">Iniciando WhatsApp...</p>
                    <p className="text-sm text-foreground">Esto puede tomar unos momentos</p>
                  </div>
                </div>
              )}

              {/* ESTADO STOPPED - DETENIDO */}
              {session.status === 'STOPPED' && (
                <div className="text-center space-y-4">
                  <div className="text-gray-600 mb-4">
                    <div className="w-16 h-16 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center mx-auto mb-3">
                      <span className="text-2xl">⏸️</span>
                    </div>
                    <p className="text-xl font-semibold">WhatsApp Desconectado</p>
                    <p className="text-sm">La conexión está pausada</p>
                  </div>
                  <div className="flex gap-3 justify-center">
                    <Button 
                      onClick={startAndGetQR} 
                      disabled={isLoading} 
                      className="bg-green-600 hover:bg-green-700 text-white"
                    >
                      {isLoading ? '⏳ Iniciando...' : '🚀 Iniciar y Conectar'}
                    </Button>
                    <Button 
                      onClick={deleteSession} 
                      disabled={isLoading} 
                      variant="outline"
                      className="border-red-300 dark:border-red-700 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20"
                    >
                      {isLoading ? '⏳ Eliminando...' : '🗑️ Eliminar'}
                    </Button>
                  </div>
                </div>
              )}

              {/* ESTADO FAILED - ERROR */}
              {session.status === 'FAILED' && (
                <div className="text-center space-y-4">
                  <div className="text-red-600 mb-4">
                    <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-3">
                      <span className="text-2xl">❌</span>
                    </div>
                    <p className="text-xl font-semibold">Error de Conexión</p>
                    <p className="text-sm">Algo salió mal con la conexión</p>
                  </div>
                  <div className="flex gap-3 justify-center">
                    <Button 
                      onClick={restartSession} 
                      disabled={isLoading} 
                      className="bg-blue-600 hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600 text-white"
                    >
                      {isLoading ? '⏳ Reintentando...' : '🔄 Reintentar'}
                    </Button>
                    <Button 
                      onClick={deleteSession} 
                      disabled={isLoading} 
                      variant="outline"
                      className="border-red-300 dark:border-red-700 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20"
                    >
                      {isLoading ? '⏳ Eliminando...' : '🗑️ Empezar de Nuevo'}
                    </Button>
                  </div>
                </div>
              )}

              {/* BOTONES AUXILIARES */}
              <div className="flex justify-center pt-4">
                <Button 
                  onClick={() => checkSession()} 
                  disabled={isLoading} 
                  variant="ghost" 
                  size="sm"
                  className="text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200"
                >
                  {isLoading ? '🔄' : '🔍'} Verificar Estado
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* QR CODE - AUTO MOSTRADO */}
      {session?.status === 'SCAN_QR_CODE' && qrCode && (
        <Card className="border-blue-200 dark:border-blue-700 bg-card dark:bg-card">
          <CardContent className="py-6">
            <div className="text-center space-y-4">
              <h3 className="text-lg font-semibold text-blue-800 dark:text-blue-200">📱 Escanear con WhatsApp</h3>
              
              <div className="bg-white dark:bg-gray-800 p-4 rounded-lg inline-block shadow-md">
                <img 
                  src={qrCode} 
                  alt="Código QR de WhatsApp" 
                  className="w-56 h-56 mx-auto"
                  onError={() => setError('📷 Código QR no disponible. Usa el botón "Actualizar Código".')}
                />
              </div>

              <div className="bg-blue-50 dark:bg-gray-700 p-4 rounded-lg text-sm text-gray-700 dark:text-gray-200 max-w-md mx-auto">
                <p className="font-semibold mb-2 text-blue-800 dark:text-blue-200">📲 Pasos para conectar:</p>
                <div className="text-left space-y-1">
                  <p className="text-gray-700 dark:text-gray-200">1️⃣ Abre WhatsApp en tu teléfono</p>
                  <p className="text-gray-700 dark:text-gray-200">2️⃣ Ve a Menú (⋮) → Dispositivos vinculados</p>
                  <p className="text-gray-700 dark:text-gray-200">3️⃣ Toca "Vincular dispositivo"</p>
                  <p className="text-gray-700 dark:text-gray-200">4️⃣ Escanea este código QR</p>
                </div>
              </div>

              <Button 
                onClick={getQR} 
                variant="outline" 
                size="sm"
                className="border-blue-300 dark:border-blue-600 text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/30"
              >
                🔄 Actualizar Código
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default WhatsAppWAHA;