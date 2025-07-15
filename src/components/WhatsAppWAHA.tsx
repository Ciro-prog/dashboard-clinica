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
  const [autoRefresh, setAutoRefresh] = useState(true);

  // ✅ REF INICIALIZADO CORRECTAMENTE
  const isMounted = useRef(true);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  // ✅ CLEANUP SIMPLE Y SEGURO
  useEffect(() => {
    isMounted.current = true;
    return () => {
      isMounted.current = false;
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      console.log('🧹 Componente WhatsApp desmontado');
    };
  }, []);

  // ✅ CONFIGURAR NOMBRE DE SESIÓN (UNA SOLA VEZ)
  useEffect(() => {
    if (clinic && !sessionName && isMounted.current) {
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

  // ✅ HEADERS SIMPLES
  const headers = {
    'Content-Type': 'application/json',
    'X-API-Key': 'pampaserver2025enservermuA!'
  };

  // ✅ VERIFICAR SESIÓN - ULTRA SIMPLE
  const checkSession = useCallback(async (silent = false) => {
    if (!sessionName || !isMounted.current) return;

    if (!silent) {
      console.log('🔍 Verificando sesión:', sessionName);
    }
    
    try {
      const response = await fetch(`/api/waha/sessions/${sessionName}`, {
        method: 'GET',
        headers
      });

      if (!isMounted.current) return;

      if (response.ok) {
        const data = await response.json();
        if (!silent) {
          console.log('✅ Sesión encontrada:', data.status);
        }
        setSession(data);
        setError('');
        if (data.status !== 'SCAN_QR_CODE') {
          setQrCode('');
        }
      } else if (response.status === 404) {
        if (!silent) {
          console.log('ℹ️ Sesión no existe');
        }
        setSession(null);
        setQrCode('');
        setError('');
      } else {
        throw new Error(`Error ${response.status}`);
      }
    } catch (err) {
      if (!silent) {
        console.error('❌ Error verificando sesión:', err);
        setError('Error al verificar sesión');
      }
      // En modo silencioso, no mostrar errores al usuario
    }
  }, [sessionName, headers]);

  // ✅ CREAR SESIÓN
  const createSession = useCallback(async () => {
    if (!sessionName || !isMounted.current) return;

    setIsLoading(true);
    setError('');
    setSuccess('');

    try {
      console.log('➕ Creando sesión:', sessionName);
      
      const response = await fetch('/api/waha/sessions', {
        method: 'POST',
        headers,
        body: JSON.stringify({ name: sessionName })
      });

      if (!isMounted.current) return;

      if (response.ok) {
        const data = await response.json();
        console.log('✅ Sesión creada');
        setSession(data);
        setSuccess('✅ Sesión creada correctamente');
        
        // Verificar después de crear
        setTimeout(() => {
          if (isMounted.current) checkSession();
        }, 1000);
      } else {
        const errorText = await response.text();
        throw new Error(errorText);
      }
    } catch (err) {
      console.error('❌ Error creando sesión:', err);
      if (isMounted.current) {
        setError(`Error al crear sesión: ${err instanceof Error ? err.message : 'Error desconocido'}`);
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
      
      const response = await fetch(`/api/waha/sessions/${sessionName}`, {
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
        }, 1000);
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

  // ✅ INICIAR SESIÓN
  const startSession = useCallback(async () => {
    if (!sessionName || !isMounted.current) return;

    setIsLoading(true);
    setError('');
    setSuccess('');

    try {
      console.log('▶️ Iniciando sesión:', sessionName);
      
      const response = await fetch(`/api/waha/sessions/${sessionName}/start`, {
        method: 'POST',
        headers
      });

      if (!isMounted.current) return;

      if (response.ok) {
        console.log('✅ Sesión iniciada');
        setSuccess('✅ Sesión iniciada correctamente');
        
        setTimeout(() => {
          if (isMounted.current) checkSession();
        }, 2000);
      } else {
        const errorText = await response.text();
        throw new Error(errorText);
      }
    } catch (err) {
      console.error('❌ Error iniciando sesión:', err);
      if (isMounted.current) {
        setError(`Error al iniciar sesión: ${err instanceof Error ? err.message : 'Error desconocido'}`);
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
      
      const response = await fetch(`/api/waha/sessions/${sessionName}/stop`, {
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
      
      const response = await fetch(`/api/waha/sessions/${sessionName}/restart`, {
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
      
      const response = await fetch(`/api/waha/sessions/${sessionName}`, {
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

  // ✅ OBTENER QR - MÚLTIPLES ENDPOINTS
  const getQR = useCallback(async () => {
    if (!sessionName || !isMounted.current) return;

    setIsLoading(true);
    setError('');

    // Lista de endpoints a probar
    const qrEndpoints = [
      `/api/waha/sessions/${sessionName}/auth/qr`,
      `/api/waha/sessions/${sessionName}/qr`,
      `/api/waha/${sessionName}/auth/qr`,
      `/api/waha/${sessionName}/qr`
    ];

    try {
      console.log('📷 Obteniendo QR para sesión:', sessionName);
      
      let qrFound = false;

      for (const endpoint of qrEndpoints) {
        if (!isMounted.current || qrFound) break;

        try {
          console.log(`🔍 Probando: ${endpoint}`);
          
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
                  setSuccess(`✅ QR obtenido desde: ${endpoint}`);
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
                  setSuccess(`✅ QR obtenido desde: ${endpoint}`);
                  qrFound = true;
                }
                break;
              }
            }
          } else {
            console.log(`❌ ${endpoint}: ${response.status}`);
          }
        } catch (endpointErr) {
          console.log(`❌ Error en ${endpoint}:`, endpointErr);
        }
      }

      if (!qrFound && isMounted.current) {
        throw new Error('No se pudo obtener el QR desde ningún endpoint. Verifica que la sesión esté en estado SCAN_QR_CODE.');
      }
    } catch (err) {
      console.error('❌ Error obteniendo QR:', err);
      if (isMounted.current) {
        setError(`Error al obtener QR: ${err instanceof Error ? err.message : 'Error desconocido'}`);
      }
    } finally {
      if (isMounted.current) {
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
      
      // Iniciar sesión
      const startResponse = await fetch(`/api/waha/sessions/${sessionName}/start`, {
        method: 'POST',
        headers
      });

      if (!startResponse.ok) {
        const errorText = await startResponse.text();
        throw new Error(`Error al iniciar: ${errorText}`);
      }

      if (!isMounted.current) return;

      // Esperar un momento
      await new Promise(resolve => setTimeout(resolve, 3000));

      if (!isMounted.current) return;

      // Verificar estado
      await checkSession();

      // Intentar obtener QR
      await getQR();
      
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
      {/* INFORMACIÓN DE CLÍNICA */}
      <Card className="bg-blue-50 border-blue-200">
        <CardHeader>
          <CardTitle className="text-lg">🏥 {clinic.name_clinic}</CardTitle>
          <CardDescription>
            Sesión: <code className="bg-blue-200 px-1 rounded">{sessionName}</code>
          </CardDescription>
        </CardHeader>
      </Card>

      {/* ESTADO DE SESIÓN */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>📱 WhatsApp Business</span>
            {session && (
              <Badge className={`${getBadgeColor(session.status)} text-white`}>
                {getStatusText(session.status)}
              </Badge>
            )}
          </CardTitle>
          <CardDescription>
            {session ? `Estado: ${session.status}` : 'Sin sesión'}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* INFORMACIÓN */}
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="font-medium">Estado:</span>
              <span className={`ml-2 ${session?.status === 'WORKING' ? 'text-green-600' : 'text-gray-600'}`}>
                {session ? getStatusText(session.status) : 'Sin sesión'}
              </span>
            </div>
            <div>
              <span className="font-medium">Sesión:</span>
              <span className="ml-2 font-mono text-xs">{sessionName}</span>
            </div>
            {session?.me && (
              <div className="col-span-2">
                <span className="font-medium">Conectado:</span>
                <span className="ml-2 text-green-600">{session.me.pushName}</span>
              </div>
            )}
          </div>

          {/* MENSAJES */}
          {error && (
            <Alert className="border-red-200 bg-red-50">
              <AlertDescription className="text-red-700">{error}</AlertDescription>
            </Alert>
          )}
          
          {success && (
            <Alert className="border-green-200 bg-green-50">
              <AlertDescription className="text-green-700">{success}</AlertDescription>
            </Alert>
          )}

          {/* BOTONES */}
          <div className="flex gap-2 flex-wrap">
            <Button onClick={checkSession} disabled={isLoading} variant="outline" size="sm">
              {isLoading ? '🔄' : '🔍'} Verificar
            </Button>

            {!session ? (
              <>
                <Button onClick={createSession} disabled={isLoading} className="bg-green-600" size="sm">
                  {isLoading ? '➕' : '➕'} Crear
                </Button>
                <Button onClick={updateSession} disabled={isLoading} className="bg-blue-600" size="sm">
                  {isLoading ? '🔄' : '🔄'} Actualizar
                </Button>
              </>
            ) : (
              <>
                {session.status === 'STOPPED' && (
                  <>
                    <Button onClick={startSession} disabled={isLoading} className="bg-green-600" size="sm">
                      {isLoading ? '▶️' : '▶️'} Iniciar
                    </Button>
                    <Button onClick={startAndGetQR} disabled={isLoading} className="bg-purple-600" size="sm">
                      {isLoading ? '🚀' : '🚀'} Iniciar + QR
                    </Button>
                    <Button onClick={deleteSession} disabled={isLoading} variant="destructive" size="sm">
                      {isLoading ? '🗑️' : '🗑️'} Eliminar
                    </Button>
                  </>
                )}

                {session.status === 'STARTING' && (
                  <Button onClick={restartSession} disabled={isLoading} variant="outline" size="sm">
                    {isLoading ? '🔄' : '🔄'} Reiniciar
                  </Button>
                )}

                {session.status === 'WORKING' && (
                  <Button onClick={stopSession} disabled={isLoading} variant="destructive" size="sm">
                    {isLoading ? '⏹️' : '⏹️'} Detener
                  </Button>
                )}

                {session.status === 'SCAN_QR_CODE' && (
                  <>
                    <Button onClick={getQR} disabled={isLoading} className="bg-blue-600" size="sm">
                      {isLoading ? '📷' : '📷'} Obtener QR
                    </Button>
                    <Button onClick={restartSession} disabled={isLoading} variant="outline" size="sm">
                      {isLoading ? '🔄' : '🔄'} Reiniciar
                    </Button>
                  </>
                )}

                {session.status === 'FAILED' && (
                  <>
                    <Button onClick={restartSession} disabled={isLoading} variant="outline" size="sm">
                      {isLoading ? '🔄' : '🔄'} Reiniciar
                    </Button>
                    <Button onClick={deleteSession} disabled={isLoading} variant="destructive" size="sm">
                      {isLoading ? '🗑️' : '🗑️'} Eliminar
                    </Button>
                  </>
                )}

                {/* BOTÓN UNIVERSAL PARA PROBAR QR */}
                {session.status !== 'WORKING' && (
                  <Button onClick={getQR} disabled={isLoading} variant="outline" size="sm">
                    {isLoading ? '🔍' : '🔍'} Probar QR
                  </Button>
                )}
              </>
            )}
          </div>
        </CardContent>
      </Card>

      {/* QR CODE */}
      {session?.status === 'SCAN_QR_CODE' && qrCode && (
        <Card className="border-blue-200">
          <CardHeader>
            <CardTitle>📷 Código QR WhatsApp</CardTitle>
            <CardDescription>Escanea con tu WhatsApp</CardDescription>
          </CardHeader>
          <CardContent className="text-center space-y-4">
            <img 
              src={qrCode} 
              alt="QR Code" 
              className="w-64 h-64 mx-auto border rounded-lg bg-white p-2"
              onError={() => setError('Error al cargar imagen QR')}
            />
            <div className="text-sm text-gray-600 bg-blue-50 p-3 rounded">
              <p><strong>Pasos:</strong></p>
              <p>1. Abre WhatsApp en tu teléfono</p>
              <p>2. Menú → Dispositivos vinculados</p>
              <p>3. Vincular dispositivo</p>
              <p>4. Escanea este código</p>
            </div>
            <Button onClick={getQR} variant="outline" size="sm">
              🔄 Actualizar QR
            </Button>
          </CardContent>
        </Card>
      )}

      {/* INFORMACIÓN TÉCNICA */}
      <Card className="bg-gray-50">
        <CardHeader>
          <CardTitle className="text-base">⚙️ Información</CardTitle>
        </CardHeader>
        <CardContent className="text-sm space-y-2">
          <div><strong>Servidor:</strong> pampaservers.com:60513</div>
          <div><strong>API Key:</strong> ✅ Configurado</div>
          <div><strong>Sesión:</strong> {sessionName}</div>
          <div><strong>Estado actual:</strong> {session?.status || 'No detectada'}</div>
        </CardContent>
      </Card>
    </div>
  );
};

export default WhatsAppWAHA;