import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { type ClinicUser } from '@/lib/clinicAuth';

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
  const [session, setSession] = useState<WAHASession | null>(null);
  const [qrCode, setQrCode] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string>('');
  const [success, setSuccess] = useState<string>('');
  const [sessionName, setSessionName] = useState<string>('');
  const [allSessions, setAllSessions] = useState<WAHASession[]>([]);

  // ✅ CONTROL ULTRA ESTABLE
  const mountedRef = useRef(true);
  const abortControllerRef = useRef<AbortController | null>(null);

  // ✅ CLEANUP COMPLETO AL DESMONTAR
  useEffect(() => {
    return () => {
      console.log('🧹 Limpiando componente WhatsApp WAHA...');
      mountedRef.current = false;
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, []);

  // ✅ HEADERS SEGUROS
  const getHeaders = useCallback(() => ({
    'Content-Type': 'application/json',
    'X-API-Key': 'pampaserver2025enservermuA!'
  }), []);

  // ✅ FUNCIÓN HELPER PARA UPDATES SEGUROS
  const safeUpdate = useCallback((updateFn: () => void) => {
    if (mountedRef.current) {
      try {
        updateFn();
      } catch (err) {
        console.error('Error en safeUpdate:', err);
      }
    }
  }, []);

  // ✅ CONFIGURAR NOMBRE DE SESIÓN (SOLO UNA VEZ)
  useEffect(() => {
    if (clinic && !sessionName && mountedRef.current) {
      let finalSessionName;
      if (clinic.suscriber && clinic.suscriber.trim() !== '') {
        finalSessionName = clinic.suscriber.trim();
      } else if (clinic.clinic_id && clinic.clinic_id.trim() !== '') {
        finalSessionName = clinic.clinic_id.trim();
      } else {
        finalSessionName = `clinic-${clinic.clinic_id || 'unknown'}`;
      }
      
      console.log('📱 Configurando nombre de sesión:', finalSessionName);
      safeUpdate(() => setSessionName(finalSessionName));
    }
  }, [clinic, sessionName, safeUpdate]);

  // ✅ VERIFICAR ESTADO DE SESIÓN - ULTRA SIMPLE
  const checkSession = useCallback(async () => {
    if (!sessionName || !mountedRef.current) return;

    console.log('🔍 Verificando sesión:', sessionName);
    
    try {
      const response = await fetch(`/api/waha/sessions/${sessionName}`, {
        method: 'GET',
        headers: getHeaders(),
        signal: abortControllerRef.current?.signal
      });

      if (!mountedRef.current) return;

      if (response.ok) {
        const sessionData = await response.json();
        console.log('✅ Sesión encontrada:', sessionData.status);
        
        safeUpdate(() => {
          setSession(sessionData);
          setError('');
          if (sessionData.status !== 'SCAN_QR_CODE') {
            setQrCode('');
          }
        });
      } else if (response.status === 404) {
        console.log('ℹ️ Sesión no existe');
        safeUpdate(() => {
          setSession(null);
          setQrCode('');
          setError('');
        });
      } else {
        throw new Error(`Error ${response.status}`);
      }
    } catch (err: any) {
      if (err.name === 'AbortError') return;
      console.error('❌ Error verificando sesión:', err);
      if (mountedRef.current) {
        safeUpdate(() => setError('Error al verificar sesión'));
      }
    }
  }, [sessionName, getHeaders, safeUpdate]);

  // ✅ VERIFICAR AUTOMÁTICAMENTE AL CARGAR (UNA SOLA VEZ)
  useEffect(() => {
    if (sessionName && mountedRef.current) {
      console.log('🔄 Verificación inicial automática');
      checkSession();
    }
  }, [sessionName]); // Solo cuando cambia sessionName

  // ✅ CREAR SESIÓN - ULTRA SIMPLIFICADO
  const createSession = useCallback(async () => {
    if (!sessionName || !mountedRef.current) return;

    safeUpdate(() => {
      setIsLoading(true);
      setError('');
      setSuccess('');
    });

    try {
      console.log('➕ Creando sesión:', sessionName);
      
      const response = await fetch('/api/waha/sessions', {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify({ name: sessionName }),
        signal: abortControllerRef.current?.signal
      });

      if (!mountedRef.current) return;

      if (response.ok) {
        const data = await response.json();
        console.log('✅ Sesión creada exitosamente');
        
        safeUpdate(() => {
          setSession(data);
          setSuccess('✅ Sesión creada correctamente');
          setError('');
        });
        
        // ✅ NO USAR TIMEOUT - Verificar inmediatamente
        if (mountedRef.current) {
          await checkSession();
        }
      } else {
        const errorText = await response.text();
        throw new Error(errorText);
      }
    } catch (err: any) {
      if (err.name === 'AbortError') return;
      console.error('❌ Error creando sesión:', err);
      if (mountedRef.current) {
        safeUpdate(() => setError(`Error al crear sesión: ${err.message}`));
      }
    } finally {
      if (mountedRef.current) {
        safeUpdate(() => setIsLoading(false));
      }
    }
  }, [sessionName, getHeaders, safeUpdate, checkSession]);

  // ✅ ACTUALIZAR SESIÓN EXISTENTE
  const updateSession = useCallback(async () => {
    if (!sessionName || !mountedRef.current) return;

    safeUpdate(() => {
      setIsLoading(true);
      setError('');
      setSuccess('');
    });

    try {
      console.log('🔄 Actualizando sesión:', sessionName);
      
      const response = await fetch(`/api/waha/sessions/${sessionName}`, {
        method: 'PUT',
        headers: getHeaders(),
        body: JSON.stringify({ name: sessionName }),
        signal: abortControllerRef.current?.signal
      });

      if (!mountedRef.current) return;

      if (response.ok) {
        const data = await response.json();
        console.log('✅ Sesión actualizada exitosamente');
        
        safeUpdate(() => {
          setSession(data);
          setSuccess('✅ Sesión actualizada correctamente');
          setError('');
        });
        
        if (mountedRef.current) {
          await checkSession();
        }
      } else {
        const errorText = await response.text();
        throw new Error(errorText);
      }
    } catch (err: any) {
      if (err.name === 'AbortError') return;
      console.error('❌ Error actualizando sesión:', err);
      if (mountedRef.current) {
        safeUpdate(() => setError(`Error al actualizar sesión: ${err.message}`));
      }
    } finally {
      if (mountedRef.current) {
        safeUpdate(() => setIsLoading(false));
      }
    }
  }, [sessionName, getHeaders, safeUpdate, checkSession]);

  // ✅ INICIAR SESIÓN
  const startSession = useCallback(async () => {
    if (!sessionName || !mountedRef.current) return;

    safeUpdate(() => {
      setIsLoading(true);
      setError('');
      setSuccess('');
    });

    try {
      console.log('▶️ Iniciando sesión:', sessionName);
      
      const response = await fetch(`/api/waha/sessions/${sessionName}/start`, {
        method: 'POST',
        headers: getHeaders(),
        signal: abortControllerRef.current?.signal
      });

      if (!mountedRef.current) return;

      if (response.ok) {
        console.log('✅ Sesión iniciada exitosamente');
        
        safeUpdate(() => {
          setSuccess('✅ Sesión iniciada correctamente');
          setError('');
        });
        
        if (mountedRef.current) {
          await checkSession();
        }
      } else {
        const errorText = await response.text();
        throw new Error(errorText);
      }
    } catch (err: any) {
      if (err.name === 'AbortError') return;
      console.error('❌ Error iniciando sesión:', err);
      if (mountedRef.current) {
        safeUpdate(() => setError(`Error al iniciar sesión: ${err.message}`));
      }
    } finally {
      if (mountedRef.current) {
        safeUpdate(() => setIsLoading(false));
      }
    }
  }, [sessionName, getHeaders, safeUpdate, checkSession]);

  // ✅ DETENER SESIÓN
  const stopSession = useCallback(async () => {
    if (!sessionName || !mountedRef.current) return;

    safeUpdate(() => {
      setIsLoading(true);
      setError('');
      setSuccess('');
    });

    try {
      console.log('⏹️ Deteniendo sesión:', sessionName);
      
      const response = await fetch(`/api/waha/sessions/${sessionName}/stop`, {
        method: 'POST',
        headers: getHeaders(),
        signal: abortControllerRef.current?.signal
      });

      if (!mountedRef.current) return;

      if (response.ok) {
        console.log('✅ Sesión detenida exitosamente');
        
        safeUpdate(() => {
          setSuccess('✅ Sesión detenida correctamente');
          setError('');
          setQrCode('');
        });
        
        if (mountedRef.current) {
          await checkSession();
        }
      } else {
        const errorText = await response.text();
        throw new Error(errorText);
      }
    } catch (err: any) {
      if (err.name === 'AbortError') return;
      console.error('❌ Error deteniendo sesión:', err);
      if (mountedRef.current) {
        safeUpdate(() => setError(`Error al detener sesión: ${err.message}`));
      }
    } finally {
      if (mountedRef.current) {
        safeUpdate(() => setIsLoading(false));
      }
    }
  }, [sessionName, getHeaders, safeUpdate, checkSession]);

  // ✅ REINICIAR SESIÓN
  const restartSession = useCallback(async () => {
    if (!sessionName || !mountedRef.current) return;

    safeUpdate(() => {
      setIsLoading(true);
      setError('');
      setSuccess('');
    });

    try {
      console.log('🔄 Reiniciando sesión:', sessionName);
      
      const response = await fetch(`/api/waha/sessions/${sessionName}/restart`, {
        method: 'POST',
        headers: getHeaders(),
        signal: abortControllerRef.current?.signal
      });

      if (!mountedRef.current) return;

      if (response.ok) {
        console.log('✅ Sesión reiniciada exitosamente');
        
        safeUpdate(() => {
          setSuccess('✅ Sesión reiniciada correctamente');
          setError('');
        });
        
        if (mountedRef.current) {
          await checkSession();
        }
      } else {
        const errorText = await response.text();
        throw new Error(errorText);
      }
    } catch (err: any) {
      if (err.name === 'AbortError') return;
      console.error('❌ Error reiniciando sesión:', err);
      if (mountedRef.current) {
        safeUpdate(() => setError(`Error al reiniciar sesión: ${err.message}`));
      }
    } finally {
      if (mountedRef.current) {
        safeUpdate(() => setIsLoading(false));
      }
    }
  }, [sessionName, getHeaders, safeUpdate, checkSession]);

  // ✅ INICIAR SESIÓN Y OBTENER QR EN UN SOLO PASO
  const startAndGetQR = useCallback(async () => {
    if (!sessionName || !mountedRef.current) return;

    safeUpdate(() => {
      setIsLoading(true);
      setError('');
      setSuccess('');
    });

    try {
      console.log('🚀 Iniciando sesión y obteniendo QR:', sessionName);
      
      // Paso 1: Iniciar la sesión si está STOPPED
      if (session?.status === 'STOPPED') {
        console.log('▶️ Primero iniciando sesión...');
        
        const startResponse = await fetch(`/api/waha/sessions/${sessionName}/start`, {
          method: 'POST',
          headers: getHeaders(),
          signal: abortControllerRef.current?.signal
        });

        if (!startResponse.ok) {
          const errorText = await startResponse.text();
          throw new Error(`Error al iniciar sesión: ${errorText}`);
        }

        console.log('✅ Sesión iniciada, esperando estado...');
        
        // Esperar un momento para que cambie el estado
        await new Promise(resolve => setTimeout(resolve, 2000));
        
        // Verificar el nuevo estado
        await checkSession();
      }

      // Paso 2: Obtener QR
      console.log('📷 Obteniendo código QR...');
      await getQR();
      
    } catch (err: any) {
      if (err.name === 'AbortError') return;
      console.error('❌ Error en startAndGetQR:', err);
      if (mountedRef.current) {
        safeUpdate(() => setError(`Error: ${err.message}`));
      }
    } finally {
      if (mountedRef.current) {
        safeUpdate(() => setIsLoading(false));
      }
    }
  }, [sessionName, session?.status, getHeaders, safeUpdate, checkSession, getQR]);

  // ✅ ELIMINAR SESIÓN
  const deleteSession = useCallback(async () => {
    if (!sessionName || !mountedRef.current) return;
    
    if (!confirm(`¿Eliminar la sesión "${sessionName}"? Esta acción no se puede deshacer.`)) {
      return;
    }

    safeUpdate(() => {
      setIsLoading(true);
      setError('');
      setSuccess('');
    });

    try {
      console.log('🗑️ Eliminando sesión:', sessionName);
      
      const response = await fetch(`/api/waha/sessions/${sessionName}`, {
        method: 'DELETE',
        headers: getHeaders(),
        signal: abortControllerRef.current?.signal
      });

      if (!mountedRef.current) return;

      if (response.ok) {
        console.log('✅ Sesión eliminada exitosamente');
        
        safeUpdate(() => {
          setSession(null);
          setQrCode('');
          setSuccess('✅ Sesión eliminada correctamente');
          setError('');
        });
      } else {
        const errorText = await response.text();
        throw new Error(errorText);
      }
    } catch (err: any) {
      if (err.name === 'AbortError') return;
      console.error('❌ Error eliminando sesión:', err);
      if (mountedRef.current) {
        safeUpdate(() => setError(`Error al eliminar sesión: ${err.message}`));
      }
    } finally {
      if (mountedRef.current) {
        safeUpdate(() => setIsLoading(false));
      }
    }
  }, [sessionName, getHeaders, safeUpdate]);

  // ✅ OBTENER QR - CORREGIDO CON MÚLTIPLES ENDPOINTS
  const getQR = useCallback(async () => {
    if (!sessionName || !mountedRef.current) return;

    safeUpdate(() => setIsLoading(true));

    try {
      console.log('📷 Obteniendo QR para sesión:', sessionName);
      
      // ✅ PROBAR MÚLTIPLES ENDPOINTS DE QR SEGÚN DOCUMENTACIÓN WAHA
      const qrEndpoints = [
        `/api/waha/sessions/${sessionName}/auth/qr`,     // Endpoint estándar
        `/api/waha/sessions/${sessionName}/qr`,          // Endpoint alternativo
        `/api/waha/sessions/${sessionName}/screenshot`,  // Endpoint de screenshot
        `/api/waha/${sessionName}/auth/qr`,              // Sin 'sessions'
        `/api/waha/${sessionName}/qr`                    // Sin 'sessions' alternativo
      ];

      let qrData = null;
      let successEndpoint = null;

      for (const endpoint of qrEndpoints) {
        try {
          console.log(`🔍 Probando endpoint: ${endpoint}`);
          
          const response = await fetch(endpoint, {
            method: 'GET',
            headers: getHeaders(),
            signal: abortControllerRef.current?.signal
          });

          console.log(`📡 Respuesta ${endpoint}: ${response.status}`);

          if (response.ok) {
            const contentType = response.headers.get('content-type');
            
            if (contentType && contentType.includes('image/png')) {
              console.log('📷 Respuesta es PNG');
              const blob = await response.blob();
              qrData = await new Promise<string>((resolve) => {
                const reader = new FileReader();
                reader.onload = () => resolve(reader.result as string);
                reader.readAsDataURL(blob);
              });
            } else {
              console.log('📷 Respuesta es JSON');
              const data = await response.json();
              if (data.qr) {
                qrData = data.qr;
              } else if (data.base64) {
                qrData = `data:image/png;base64,${data.base64}`;
              } else {
                console.log('📷 Estructura de respuesta:', data);
              }
            }
            
            if (qrData) {
              successEndpoint = endpoint;
              console.log(`✅ QR obtenido exitosamente desde: ${endpoint}`);
              break;
            }
          } else if (response.status !== 404) {
            // Si no es 404, mostrar el error para debug
            const errorText = await response.text();
            console.log(`⚠️ Error ${response.status} en ${endpoint}: ${errorText}`);
          }
        } catch (err: any) {
          if (err.name === 'AbortError') return;
          console.log(`❌ Error de red en ${endpoint}:`, err.message);
        }
      }

      if (!mountedRef.current) return;

      if (qrData) {
        safeUpdate(() => {
          setQrCode(qrData);
          setError('');
          setSuccess(`✅ QR obtenido desde: ${successEndpoint}`);
        });
      } else {
        // Si ningún endpoint funcionó, verificar el estado de la sesión
        console.log('🔍 No se pudo obtener QR, verificando estado de sesión...');
        await checkSession();
        
        throw new Error('No se pudo obtener el código QR desde ningún endpoint. Verifica que la sesión esté en estado SCAN_QR_CODE.');
      }
    } catch (err: any) {
      if (err.name === 'AbortError') return;
      console.error('❌ Error obteniendo QR:', err);
      if (mountedRef.current) {
        safeUpdate(() => setError(`Error al obtener QR: ${err.message}`));
      }
    } finally {
      if (mountedRef.current) {
        safeUpdate(() => setIsLoading(false));
      }
    }
  }, [sessionName, getHeaders, safeUpdate, checkSession]);

  // ✅ LIMPIAR MENSAJES DE ÉXITO
  useEffect(() => {
    if (success) {
      const timer = setTimeout(() => {
        if (mountedRef.current) {
          safeUpdate(() => setSuccess(''));
        }
      }, 4000);
      
      return () => clearTimeout(timer);
    }
  }, [success, safeUpdate]);

  // ✅ FUNCIONES HELPER PARA UI
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
      <div className="space-y-6">
        <Card>
          <CardContent className="flex items-center justify-center py-8">
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto"></div>
              <p className="mt-2 text-sm text-gray-600">Cargando datos de la clínica...</p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* ✅ INFORMACIÓN DE LA CLÍNICA */}
      <Card className="bg-blue-50 border-blue-200">
        <CardHeader className="pb-3">
          <CardTitle className="text-lg flex items-center gap-2">
            🏥 {clinic.name_clinic || 'Clínica'}
          </CardTitle>
          <CardDescription>
            <strong>Sesión WhatsApp:</strong> <code className="bg-blue-200 px-1 rounded">{sessionName}</code>
          </CardDescription>
        </CardHeader>
      </Card>

      {/* ✅ ESTADO DE LA SESIÓN */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span>📱</span>
              <span>WhatsApp Business</span>
            </div>
            {session && (
              <Badge className={`${getBadgeColor(session.status)} text-white`}>
                {getStatusText(session.status)}
              </Badge>
            )}
          </CardTitle>
          <CardDescription>
            {session ? `Estado: ${session.status}` : 'Sin sesión activa'}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* ✅ INFORMACIÓN BÁSICA */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <div>
              <span className="font-medium">Estado:</span>
              <span className={`ml-2 ${session?.status === 'WORKING' ? 'text-green-600' : 'text-gray-600'}`}>
                {session ? getStatusText(session.status) : 'Sin sesión'}
              </span>
            </div>
            <div>
              <span className="font-medium">Sesión:</span>
              <span className="ml-2 text-gray-600 font-mono text-xs">
                {sessionName || 'Cargando...'}
              </span>
            </div>
            {session?.me && (
              <div className="md:col-span-2">
                <span className="font-medium">Conectado como:</span>
                <span className="ml-2 text-green-600 font-medium">
                  {session.me.pushName} ({session.me.id})
                </span>
              </div>
            )}
          </div>

          {/* ✅ MENSAJES DE ERROR Y ÉXITO */}
          {error && (
            <Alert className="border-red-200 bg-red-50">
              <AlertDescription className="text-red-700">
                {error}
              </AlertDescription>
            </Alert>
          )}
          
          {/* ✅ GUÍAS ESPECÍFICAS POR ESTADO */}
          {session && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
              <div className="flex items-start gap-2">
                <span className="text-blue-600 text-sm">💡</span>
                <div className="text-sm text-blue-800">
                  <strong>Guía para tu estado actual ({session.status}):</strong>
                  <br />
                  {session.status === 'STOPPED' && (
                    <>
                      <strong>Opción 1:</strong> Usa "🚀 Iniciar + QR" para iniciar la sesión y obtener el QR automáticamente.
                      <br />
                      <strong>Opción 2:</strong> Usa "▶️ Iniciar" primero, luego "📷 Obtener QR" cuando cambie a SCAN_QR_CODE.
                    </>
                  )}
                  {session.status === 'STARTING' && 'La sesión está iniciando. Espera a que cambie a SCAN_QR_CODE para obtener el QR.'}
                  {session.status === 'WORKING' && 'WhatsApp ya está conectado y funcionando correctamente.'}
                  {session.status === 'SCAN_QR_CODE' && 'Perfecto! Ahora puedes usar "📷 Obtener QR" para generar el código QR.'}
                  {session.status === 'FAILED' && 'Hay un error. Usa "🔄 Reiniciar" para intentar reconectar.'}
                </div>
              </div>
            </div>
          )}

          {/* ✅ BOTONES DE CONTROL SIMPLIFICADOS */}
          <div className="flex gap-2 flex-wrap">
            <Button 
              onClick={checkSession}
              disabled={isLoading}
              variant="outline"
              size="sm"
            >
              {isLoading ? '🔄 Verificando...' : '🔍 Verificar'}
            </Button>

            {!session ? (
              <>
                <Button 
                  onClick={createSession}
                  disabled={isLoading}
                  className="bg-green-600 hover:bg-green-700"
                  size="sm"
                >
                  {isLoading ? '➕ Creando...' : '➕ Crear Sesión'}
                </Button>
                <Button 
                  onClick={updateSession}
                  disabled={isLoading}
                  className="bg-blue-600 hover:bg-blue-700"
                  size="sm"
                >
                  {isLoading ? '🔄 Actualizando...' : '🔄 Actualizar'}
                </Button>
              </>
            ) : (
              <>
                {session.status === 'STOPPED' && (
                  <>
                    <Button 
                      onClick={startSession}
                      disabled={isLoading}
                      className="bg-green-600 hover:bg-green-700"
                      size="sm"
                    >
                      {isLoading ? '▶️ Iniciando...' : '▶️ Iniciar'}
                    </Button>
                    <Button 
                      onClick={startAndGetQR}
                      disabled={isLoading}
                      className="bg-purple-600 hover:bg-purple-700"
                      size="sm"
                    >
                      {isLoading ? '🚀 Iniciando+QR...' : '🚀 Iniciar + QR'}
                    </Button>
                    <Button 
                      onClick={deleteSession}
                      disabled={isLoading}
                      variant="destructive"
                      size="sm"
                    >
                      {isLoading ? '🗑️ Eliminando...' : '🗑️ Eliminar'}
                    </Button>
                  </>
                )}

                {session.status === 'STARTING' && (
                  <Button 
                    onClick={restartSession}
                    disabled={isLoading}
                    variant="outline"
                    size="sm"
                  >
                    {isLoading ? '🔄 Reiniciando...' : '🔄 Reiniciar'}
                  </Button>
                )}

                {session.status === 'WORKING' && (
                  <Button 
                    onClick={stopSession}
                    disabled={isLoading}
                    variant="destructive"
                    size="sm"
                  >
                    {isLoading ? '⏹️ Deteniendo...' : '⏹️ Detener'}
                  </Button>
                )}

                {session.status === 'SCAN_QR_CODE' && (
                  <>
                    <Button 
                      onClick={getQR}
                      disabled={isLoading}
                      className="bg-blue-600 hover:bg-blue-700"
                      size="sm"
                    >
                      {isLoading ? '📷 Obteniendo...' : '📷 Obtener QR'}
                    </Button>
                    <Button 
                      onClick={restartSession}
                      disabled={isLoading}
                      variant="outline"
                      size="sm"
                    >
                      {isLoading ? '🔄 Reiniciando...' : '🔄 Reiniciar'}
                    </Button>
                  </>
                )}

                {/* ✅ BOTÓN ESPECIAL PARA CUALQUIER ESTADO - FORZAR QR */}
                {session && session.status !== 'WORKING' && (
                  <Button 
                    onClick={getQR}
                    disabled={isLoading}
                    variant="outline"
                    size="sm"
                    className="border-orange-300 text-orange-700 hover:bg-orange-50"
                  >
                    {isLoading ? '🔍 Probando...' : '🔍 Probar QR'}
                  </Button>
                )}

                {session.status === 'FAILED' && (
                  <>
                    <Button 
                      onClick={restartSession}
                      disabled={isLoading}
                      variant="outline"
                      size="sm"
                    >
                      {isLoading ? '🔄 Reiniciando...' : '🔄 Reiniciar'}
                    </Button>
                    <Button 
                      onClick={deleteSession}
                      disabled={isLoading}
                      variant="destructive"
                      size="sm"
                    >
                      {isLoading ? '🗑️ Eliminando...' : '🗑️ Eliminar'}
                    </Button>
                  </>
                )}
              </>
            )}
          </div>
        </CardContent>
      </Card>

      {/* ✅ CÓDIGO QR - SOLO SI HAY CÓDIGO */}
      {session?.status === 'SCAN_QR_CODE' && qrCode && (
        <Card className="border-blue-200">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <span>📷</span>
              <span>Código QR de WhatsApp</span>
            </CardTitle>
            <CardDescription>
              Escanea este código con tu WhatsApp para conectar la sesión
            </CardDescription>
          </CardHeader>
          <CardContent className="text-center space-y-4">
            <div className="flex justify-center">
              <img 
                src={qrCode} 
                alt="WhatsApp QR Code" 
                className="w-64 h-64 border rounded-lg shadow-lg bg-white p-2"
                onError={() => {
                  console.error('❌ Error cargando imagen QR');
                  if (mountedRef.current) {
                    safeUpdate(() => setError('Error al cargar la imagen del QR'));
                  }
                }}
              />
            </div>
            <div className="text-sm text-gray-600 space-y-1 bg-blue-50 p-4 rounded-lg">
              <p><strong>📱 Pasos para conectar:</strong></p>
              <p>1. Abre <strong>WhatsApp</strong> en tu teléfono</p>
              <p>2. Toca <strong>Menú (⋮)</strong> → <strong>Dispositivos vinculados</strong></p>
              <p>3. Toca <strong>"Vincular un dispositivo"</strong></p>
              <p>4. <strong>Escanea este código QR</strong></p>
            </div>
            <Button onClick={getQR} variant="outline" size="sm" disabled={isLoading}>
              {isLoading ? '🔄 Actualizando...' : '🔄 Actualizar QR'}
            </Button>
          </CardContent>
        </Card>
      )}

      {/* ✅ INFORMACIÓN TÉCNICA Y DEBUG */}
      <Card className="bg-gray-50">
        <CardHeader>
          <CardTitle className="text-base">⚙️ Configuración y Debug</CardTitle>
        </CardHeader>
        <CardContent className="text-sm space-y-2">
          <div><strong>Servidor:</strong> pampaservers.com:60513</div>
          <div><strong>API Key:</strong> ✅ Configurado</div>
          <div><strong>Sesión:</strong> {sessionName}</div>
          <div><strong>Estado:</strong> {session?.status || 'No detectada'}</div>
          
          {/* Debug de endpoints QR */}
          <div className="pt-2 border-t">
            <strong>Endpoints QR probados (en orden):</strong>
            <div className="mt-1 text-xs text-gray-600 space-y-1">
              <div>• <code>/api/waha/sessions/&#123;name&#125;/auth/qr</code> - Estándar WAHA</div>
              <div>• <code>/api/waha/sessions/&#123;name&#125;/qr</code> - Alternativo</div>
              <div>• <code>/api/waha/sessions/&#123;name&#125;/screenshot</code> - Screenshot</div>
              <div>• <code>/api/waha/&#123;name&#125;/auth/qr</code> - Sin 'sessions'</div>
              <div>• <code>/api/waha/&#123;name&#125;/qr</code> - Sin 'sessions' alt</div>
            </div>
          </div>

          {/* Guía de resolución */}
          <div className="pt-2 border-t">
            <strong>💡 Solución recomendada para QR:</strong>
            <div className="mt-1 text-xs text-gray-600 space-y-1">
              <div>1. <strong>Usar "🚀 Iniciar + QR"</strong> - Inicia sesión y obtiene QR</div>
              <div>2. <strong>Si sesión existe:</strong> "🔍 Probar QR" - Prueba todos los endpoints</div>
              <div>3. <strong>Verificar estado:</strong> Debe estar en SCAN_QR_CODE o STARTING</div>
              <div>4. <strong>Si falla:</strong> Reiniciar sesión y volver a intentar</div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default WhatsAppWAHA;