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

  // ✅ REF PARA CONTROLAR SI EL COMPONENTE ESTÁ MONTADO
  const isMountedRef = useRef(true);
  const timeoutRefs = useRef<NodeJS.Timeout[]>([]);

  // ✅ CLEANUP AL DESMONTAR
  useEffect(() => {
    return () => {
      isMountedRef.current = false;
      // Limpiar todos los timeouts
      timeoutRefs.current.forEach(timeout => clearTimeout(timeout));
      timeoutRefs.current = [];
    };
  }, []);

  // ✅ FUNCIÓN HELPER PARA ACTUALIZAR ESTADO SOLO SI ESTÁ MONTADO
  // eslint-disable-next-line @typescript-eslint/no-unsafe-function-type
  const safeSetState = useCallback((setter: Function, value: any) => {
    if (isMountedRef.current) {
      setter(value);
    }
  }, []);

  // ✅ FUNCIÓN HELPER PARA TIMEOUTS SEGUROS
  const safeSetTimeout = useCallback((callback: () => void, delay: number) => {
    const timeout = setTimeout(() => {
      if (isMountedRef.current) {
        callback();
      }
    }, delay);
    timeoutRefs.current.push(timeout);
    return timeout;
  }, []);

  // ✅ REPLICAR EXACTAMENTE LA LÓGICA DEL DASHBOARD
  useEffect(() => {
    if (clinic) {
      console.log('🏥 Datos de clínica recibidos:', clinic);
      console.log('👤 Suscriber disponible:', clinic.suscriber);
      console.log('🆔 Clinic ID disponible:', clinic.clinic_id);
      
      // ✅ USAR EXACTAMENTE LA MISMA LÓGICA QUE EN EL DASHBOARD
      let finalSessionName;
      if (clinic.suscriber && clinic.suscriber.trim() !== '') {
        finalSessionName = clinic.suscriber.trim();
        console.log('✅ Usando SUSCRIBER como sesión:', finalSessionName);
      } else if (clinic.clinic_id && clinic.clinic_id.trim() !== '') {
        finalSessionName = clinic.clinic_id.trim();
        console.log('⚠️ Usando CLINIC_ID como sesión:', finalSessionName);
      } else {
        finalSessionName = `clinic-${clinic.clinic_id || 'unknown'}`;
        console.log('🆘 Usando fallback como sesión:', finalSessionName);
      }
      
      setSessionName(finalSessionName);
      console.log('📱 Nombre de sesión WAHA FINAL:', finalSessionName);
    }
  }, [clinic]);

  // ✅ HEADERS CORRECTOS - AGREGANDO API KEY MANUALMENTE
  const getHeaders = useCallback(() => ({
    'Content-Type': 'application/json',
    'X-API-Key': 'pampaserver2025enservermuA!'  // ✅ API Key correcto
  }), []);

  // ✅ OBTENER TODAS LAS SESIONES PRIMERO
  const getAllSessions = useCallback(async () => {
    try {
      console.log('📊 Obteniendo todas las sesiones disponibles...');
      
      const response = await fetch('/api/waha/sessions', {
        method: 'GET',
        headers: getHeaders()
      });

      if (response.ok && isMountedRef.current) {
        const sessions = await response.json();
        console.log('📊 Sesiones disponibles:', sessions);
        safeSetState(setAllSessions, sessions);
        return sessions;
      } else {
        console.error('❌ Error obteniendo sesiones:', response.status);
        return [];
      }
    } catch (err) {
      console.error('❌ Error de red obteniendo sesiones:', err);
      return [];
    }
  }, [safeSetState, getHeaders]);

  // ✅ VERIFICAR ESTADO DE SESIÓN ESPECÍFICA - CORREGIDO
  const checkSession = useCallback(async () => {
    if (!sessionName) {
      safeSetState(setError, 'No se ha cargado el nombre de sesión');
      return;
    }

    safeSetState(setIsLoading, true);
    safeSetState(setError, '');
    safeSetState(setSuccess, '');
    
    try {
      console.log('📊 Verificando estado de sesión específica:', sessionName);
      
      // ✅ VERIFICAR DIRECTAMENTE LA SESIÓN ESPECÍFICA
      const response = await fetch(`/api/waha/sessions/${sessionName}`, {
        method: 'GET',
        headers: getHeaders()
      });

      console.log('📡 Respuesta verificación status:', response.status);

      if (response.ok && isMountedRef.current) {
        const sessionData = await response.json();
        console.log('✅ Sesión encontrada:', sessionData);
        safeSetState(setSession, sessionData);
        
        // Limpiar QR si el estado cambió
        if (sessionData.status !== 'SCAN_QR_CODE') {
          safeSetState(setQrCode, '');
          console.log('🧹 QR limpiado - estado no es SCAN_QR_CODE');
        }
        
        console.log('📊 Estado de sesión actual:', sessionData.status);
        
      } else if (response.status === 404 && isMountedRef.current) {
        console.log('ℹ️ Sesión no existe - puede crear una nueva');
        safeSetState(setSession, null);
        safeSetState(setQrCode, '');
        
        // También intentar obtener todas las sesiones por si acaso
        await getAllSessions();
        
      } else if (isMountedRef.current) {
        const errorText = await response.text();
        console.error('❌ Error HTTP verificando sesión:', response.status, errorText);
        throw new Error(`Error ${response.status}: ${errorText}`);
      }
      
    } catch (err) {
      console.error('❌ Error verificando sesión:', err);
      if (isMountedRef.current) {
        safeSetState(setError, 'Error al verificar la sesión. Verifica que WAHA esté ejecutándose.');
      }
    } finally {
      if (isMountedRef.current) {
        safeSetState(setIsLoading, false);
      }
    }
  }, [sessionName, safeSetState, getAllSessions, getHeaders]);

  // ✅ OBTENER QR MEJORADO
  const getQR = async () => {
    if (!sessionName) {
      console.error('❌ No hay nombre de sesión para obtener QR');
      return;
    }
    
    setIsLoading(true);
    try {
      console.log('📷 Obteniendo QR para sesión:', sessionName);
      
      const qrUrl = `/api/waha/sessions/${sessionName}/auth/qr`;
      console.log('🌐 URL del QR:', qrUrl);
      
      const response = await fetch(qrUrl, {
        method: 'GET',
        headers: getHeaders()
      });

      console.log('📡 Respuesta QR status:', response.status);
      
      if (response.ok) {
        const contentType = response.headers.get('content-type');
        
        // Si es una imagen PNG, convertir a data URL
        if (contentType && contentType.includes('image/png')) {
          console.log('📷 Respuesta es PNG, convirtiendo a data URL...');
          const blob = await response.blob();
          const dataUrl = await new Promise<string>((resolve) => {
            const reader = new FileReader();
            reader.onload = () => resolve(reader.result as string);
            reader.readAsDataURL(blob);
          });
          setQrCode(dataUrl);
          console.log('✅ QR Code PNG establecido correctamente');
        } else {
          // Si es JSON con campo qr
          const data = await response.json();
          console.log('📷 Datos de QR recibidos:', data);
          
          if (data.qr) {
            setQrCode(data.qr);
            console.log('✅ QR Code JSON establecido correctamente');
          } else {
            console.warn('⚠️ No hay campo qr en la respuesta:', data);
            setError('No se pudo generar el código QR');
          }
        }
      } else {
        const errorText = await response.text();
        console.error('❌ Error HTTP obteniendo QR:', response.status, errorText);
        setError(`Error ${response.status} al obtener QR: ${errorText}`);
      }
    } catch (err) {
      console.error('❌ Error de red obteniendo QR:', err);
      setError('Error de conexión al obtener QR');
    } finally {
      setIsLoading(false);
    }
  };

  // ✅ CREAR O ACTUALIZAR SESIÓN
  const createSession = useCallback(async () => {
    if (!sessionName) {
      safeSetState(setError, 'No hay nombre de sesión disponible');
      return;
    }

    safeSetState(setIsLoading, true);
    safeSetState(setError, '');
    safeSetState(setSuccess, '');
    
    try {
      console.log('➕ Creando nueva sesión:', sessionName);
      
      const response = await fetch('/api/waha/sessions', {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify({
          name: sessionName
        })
      });

      if (response.ok && isMountedRef.current) {
        const data = await response.json();
        safeSetState(setSession, data);
        safeSetState(setSuccess, 'Sesión creada correctamente. Preparando conexión...');
        console.log('✅ Sesión creada:', data);
        
        // Verificar estado después de crear
        safeSetTimeout(() => {
          checkSession();
        }, 2000);
        
      } else if (response.status === 409 && isMountedRef.current) {
        // Conflicto - la sesión ya existe, intentar actualizarla
        console.log('⚠️ Sesión ya existe, intentando actualizar...');
        await updateSession();
        
      } else if (isMountedRef.current) {
        const errorText = await response.text();
        let errorData;
        try {
          errorData = JSON.parse(errorText);
        } catch {
          errorData = { message: errorText };
        }
        throw new Error(errorData.message || 'Error al crear sesión');
      }
    } catch (err) {
      console.error('❌ Error creando sesión:', err);
      if (isMountedRef.current) {
        safeSetState(setError, err instanceof Error ? err.message : 'Error al crear sesión');
      }
    } finally {
      if (isMountedRef.current) {
        safeSetState(setIsLoading, false);
      }
    }
  }, [sessionName, safeSetState, safeSetTimeout, checkSession, getHeaders]); // ✅ Sin updateSession para evitar ciclo

  // ✅ ACTUALIZAR SESIÓN EXISTENTE (PUT)
  const updateSession = useCallback(async () => {
    if (!sessionName) {
      safeSetState(setError, 'No hay nombre de sesión disponible');
      return;
    }

    safeSetState(setIsLoading, true);
    safeSetState(setError, '');
    safeSetState(setSuccess, '');
    
    try {
      console.log('🔄 Actualizando sesión existente:', sessionName);
      
      const response = await fetch(`/api/waha/sessions/${sessionName}`, {
        method: 'PUT',
        headers: getHeaders(),
        body: JSON.stringify({
          name: sessionName
        })
      });

      if (response.ok && isMountedRef.current) {
        const data = await response.json();
        safeSetState(setSession, data);
        safeSetState(setSuccess, 'Sesión actualizada correctamente. Preparando conexión...');
        console.log('✅ Sesión actualizada:', data);
        
        // Verificar estado después de actualizar
        safeSetTimeout(() => {
          checkSession();
        }, 2000);
      } else if (isMountedRef.current) {
        const errorText = await response.text();
        let errorData;
        try {
          errorData = JSON.parse(errorText);
        } catch {
          errorData = { message: errorText };
        }
        throw new Error(errorData.message || 'Error al actualizar sesión');
      }
    } catch (err) {
      console.error('❌ Error actualizando sesión:', err);
      if (isMountedRef.current) {
        safeSetState(setError, err instanceof Error ? err.message : 'Error al actualizar sesión');
      }
    } finally {
      if (isMountedRef.current) {
        safeSetState(setIsLoading, false);
      }
    }
  }, [sessionName, safeSetState, safeSetTimeout, checkSession]); // ✅ Sin createSession para evitar ciclo

  // ✅ DETENER SESIÓN
  const stopSession = async () => {
    setIsLoading(true);
    setError('');
    
    try {
      console.log('⏹️ Deteniendo sesión:', sessionName);
      
      const response = await fetch(`/api/waha/sessions/${sessionName}/stop`, {
        method: 'POST',
        headers: getHeaders()
      });

      if (response.ok) {
        setSession(null);
        setQrCode('');
        console.log('⏹️ Sesión detenida exitosamente');
        
        // Refrescar la lista después de detener
        setTimeout(checkSession, 1000);
      } else {
        const errorText = await response.text();
        throw new Error(`Error al detener sesión: ${errorText}`);
      }
    } catch (err) {
      console.error('❌ Error deteniendo sesión:', err);
      setError(err instanceof Error ? err.message : 'Error al detener sesión');
    } finally {
      setIsLoading(false);
    }
  };

  // ✅ INICIAR SESIÓN (para sesiones STOPPED)
  const startSession = useCallback(async () => {
    safeSetState(setIsLoading, true);
    safeSetState(setError, '');
    safeSetState(setSuccess, '');
    
    try {
      console.log('▶️ Iniciando sesión:', sessionName);
      
      const response = await fetch(`/api/waha/sessions/${sessionName}/start`, {
        method: 'POST',
        headers: getHeaders()
      });

      if (response.ok && isMountedRef.current) {
        console.log('▶️ Sesión iniciada exitosamente');
        safeSetState(setSuccess, 'Sesión iniciada correctamente. Conectando con WhatsApp...');
        
        // Verificar estado después de iniciar
        safeSetTimeout(() => {
          checkSession();
        }, 3000);
      } else if (isMountedRef.current) {
        const errorText = await response.text();
        throw new Error(`Error al iniciar sesión: ${errorText}`);
      }
    } catch (err) {
      console.error('❌ Error iniciando sesión:', err);
      if (isMountedRef.current) {
        safeSetState(setError, err instanceof Error ? err.message : 'Error al iniciar sesión');
      }
    } finally {
      if (isMountedRef.current) {
        safeSetState(setIsLoading, false);
      }
    }
  }, [sessionName, safeSetState, safeSetTimeout, checkSession]);

  // ✅ ELIMINAR SESIÓN CON CONFIRMACIÓN
  const deleteSession = useCallback(async () => {
    // Confirmación antes de eliminar
    if (!confirm(`¿Estás seguro de que quieres eliminar la sesión "${sessionName}"? Esta acción no se puede deshacer.`)) {
      return;
    }

    safeSetState(setIsLoading, true);
    safeSetState(setError, '');
    safeSetState(setSuccess, '');
    
    try {
      console.log('🗑️ Eliminando sesión:', sessionName);
      
      const response = await fetch(`/api/waha/sessions/${sessionName}`, {
        method: 'DELETE',
        headers: getHeaders()
      });

      if (response.ok && isMountedRef.current) {
        console.log('🗑️ Sesión eliminada exitosamente');
        safeSetState(setSuccess, 'Sesión eliminada correctamente.');
        safeSetState(setSession, null);
        safeSetState(setQrCode, '');
        
        // Refrescar la lista después de eliminar
        safeSetTimeout(() => {
          checkSession();
        }, 1000);
      } else if (isMountedRef.current) {
        const errorText = await response.text();
        throw new Error(`Error al eliminar sesión: ${errorText}`);
      }
    } catch (err) {
      console.error('❌ Error eliminando sesión:', err);
      if (isMountedRef.current) {
        safeSetState(setError, err instanceof Error ? err.message : 'Error al eliminar sesión');
      }
    } finally {
      if (isMountedRef.current) {
        safeSetState(setIsLoading, false);
      }
    }
  }, [sessionName, safeSetState, safeSetTimeout, checkSession]);

  // ✅ REINICIAR SESIÓN
  const restartSession = async () => {
    setIsLoading(true);
    setError('');
    setSuccess('');
    
    try {
      console.log('🔄 Reiniciando sesión:', sessionName);
      
      const response = await fetch(`/api/waha/sessions/${sessionName}/restart`, {
        method: 'POST',
        headers: getHeaders()
      });

      if (response.ok) {
        console.log('🔄 Sesión reiniciada exitosamente');
        setSuccess('Sesión reiniciada correctamente. Reestableciendo conexión...');
        
        // Verificar estado después de reiniciar
        setTimeout(() => {
          checkSession();
        }, 3000);
      } else {
        const errorText = await response.text();
        throw new Error(`Error al reiniciar sesión: ${errorText}`);
      }
    } catch (err) {
      console.error('❌ Error reiniciando sesión:', err);
      setError(err instanceof Error ? err.message : 'Error al reiniciar sesión');
    } finally {
      setIsLoading(false);
    }
  };

  // Obtener color del badge
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

  // Obtener texto del estado
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

  // Obtener mensaje descriptivo del estado con acciones disponibles
  const getStatusDescription = (status: string) => {
    switch (status) {
      case 'WORKING': 
        return 'WhatsApp conectado y funcionando correctamente. Puedes detener la sesión si es necesario.';
      case 'STARTING': 
        return 'Estableciendo conexión con WhatsApp... Si tarda mucho, puedes reiniciar.';
      case 'SCAN_QR_CODE': 
        return 'Esperando escaneo del código QR. Escanea con tu WhatsApp o reinicia si hay problemas.';
      case 'STOPPED': 
        return 'Sesión desconectada. Puedes iniciarla nuevamente o eliminarla si ya no la necesitas.';
      case 'FAILED': 
        return 'Error en la conexión. Puedes reiniciar para intentar reconectar o eliminar la sesión.';
      default: 
        return 'Estado desconocido. Verifica el estado de la sesión.';
    }
  };

  // ✅ LIMPIAR MENSAJES DE ÉXITO AUTOMÁTICAMENTE
  useEffect(() => {
    if (success) {
      const timer = setTimeout(() => {
        setSuccess('');
      }, 5000); // Limpiar después de 5 segundos
      
      return () => clearTimeout(timer);
    }
  }, [success]);

  // ✅ VERIFICAR AUTOMÁTICAMENTE AL CARGAR
  useEffect(() => {
    if (sessionName) {
      checkSession();
    }
  }, [sessionName]);

  // ✅ OBTENER QR AUTOMÁTICAMENTE CUANDO SEA NECESARIO
  useEffect(() => {
    if (session?.status === 'SCAN_QR_CODE' && !qrCode && !isLoading) {
      console.log('🔄 Estado SCAN_QR_CODE detectado, obteniendo QR automáticamente...');
      getQR();
    }
  }, [session?.status, qrCode, isLoading]);

  // ✅ MOSTRAR LOADING MIENTRAS SE CARGAN LOS DATOS
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

  // ✅ NO RENDERIZAR SI EL COMPONENTE SE ESTÁ DESMONTANDO
  if (!isMountedRef.current) {
    return null;
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
            <br />
            <strong>Subscriber:</strong> <code className="bg-blue-200 px-1 rounded">{clinic.suscriber || 'No definido'}</code>
            <br />
            <strong>Clinic ID:</strong> <code className="bg-blue-200 px-1 rounded">{clinic.clinic_id || 'No definido'}</code>
          </CardDescription>
        </CardHeader>
      </Card>

      {/* ✅ ESTADO DE LA SESIÓN PRINCIPAL */}
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
            {session ? getStatusDescription(session.status) : 'Sin sesión activa'}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* ✅ INFORMACIÓN DEL ESTADO */}
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

          {/* ✅ INDICADORES VISUALES */}
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <div className={`w-3 h-3 rounded-full ${
                session?.status === 'WORKING' ? 'bg-green-500 animate-pulse' : 'bg-gray-400'
              }`}></div>
              <span className="text-sm">
                {session?.status === 'WORKING' ? 'Recibiendo mensajes' : 'Sin recepción'}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <div className={`w-3 h-3 rounded-full ${
                session?.status === 'WORKING' ? 'bg-green-500 animate-pulse' : 'bg-gray-400'
              }`}></div>
              <span className="text-sm">
                {session?.status === 'WORKING' ? 'Bot respondiendo' : 'Bot inactivo'}
              </span>
            </div>
          </div>

          {/* ✅ INFORMACIÓN DE ACCIONES DISPONIBLES */}
          {!session ? (
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
              <div className="flex items-start gap-2">
                <span className="text-yellow-600 text-sm">⚠️</span>
                <div className="text-sm text-yellow-800">
                  <strong>No se detectó sesión activa:</strong>
                  <br />
                  • <strong>Crear Sesión:</strong> Crear una nueva sesión desde cero
                  <br />
                  • <strong>Actualizar Existente:</strong> Conectar con una sesión que ya existe pero no se detecta
                  <br />
                  <em>Si ves el error "sesión ya existe", usa "Actualizar Existente"</em>
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
              <div className="flex items-start gap-2">
                <span className="text-blue-600 text-sm">💡</span>
                <div className="text-sm text-blue-800">
                  <strong>Acciones disponibles:</strong>
                  <br />
                  {session.status === 'STOPPED' && 'Puedes iniciar la sesión para conectar WhatsApp o eliminarla si ya no la necesitas.'}
                  {session.status === 'STARTING' && 'La sesión está iniciando. Si tarda mucho, puedes reiniciarla.'}
                  {session.status === 'WORKING' && 'Todo funcionando correctamente. Puedes detener la sesión si es necesario.'}
                  {session.status === 'SCAN_QR_CODE' && 'Escanea el código QR con tu WhatsApp. Si hay problemas, puedes reiniciar o detener.'}
                  {session.status === 'FAILED' && 'Hay un error. Puedes reiniciar para intentar reconectar o eliminar la sesión.'}
                </div>
              </div>
            </div>
          )}

          {/* ✅ MENSAJES DE ERROR Y ÉXITO */}
          {error && (
            <Alert className="border-red-200 bg-red-50">
              <AlertDescription className="text-red-700">
                ❌ {error}
              </AlertDescription>
            </Alert>
          )}
          
          {success && (
            <Alert className="border-green-200 bg-green-50">
              <AlertDescription className="text-green-700">
                ✅ {success}
              </AlertDescription>
            </Alert>
          )}

          {/* ✅ BOTONES DE CONTROL SEGÚN ESTADO */}
          <div className="flex gap-2 flex-wrap">
            <Button 
              onClick={checkSession}
              disabled={isLoading || !sessionName}
              variant="outline"
              size="sm"
            >
              {isLoading ? '🔄 Verificando...' : '🔍 Verificar Estado'}
            </Button>

            {!session ? (
              // Sin sesión detectada - opciones para crear o actualizar
              <div className="flex gap-2 flex-wrap">
                <Button 
                  onClick={createSession}
                  disabled={isLoading || !sessionName}
                  className="bg-green-600 hover:bg-green-700"
                  size="sm"
                >
                  {isLoading ? '➕ Creando...' : '➕ Crear Sesión'}
                </Button>
                <Button 
                  onClick={updateSession}
                  disabled={isLoading || !sessionName}
                  className="bg-blue-600 hover:bg-blue-700"
                  size="sm"
                >
                  {isLoading ? '🔄 Actualizando...' : '🔄 Actualizar Existente'}
                </Button>
              </div>
            ) : (
              // Con sesión - botones según estado
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
                      onClick={restartSession}
                      disabled={isLoading}
                      variant="outline"
                      size="sm"
                    >
                      {isLoading ? '🔄 Reiniciando...' : '🔄 Reiniciar'}
                    </Button>
                    <Button 
                      onClick={stopSession}
                      disabled={isLoading}
                      variant="destructive"
                      size="sm"
                    >
                      {isLoading ? '⏹️ Deteniendo...' : '⏹️ Detener'}
                    </Button>
                  </>
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

      {/* ✅ CÓDIGO QR MEJORADO */}
      {session?.status === 'SCAN_QR_CODE' && (
        <Card className="border-blue-200">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <span>📷</span>
              <span>Código QR de WhatsApp</span>
            </CardTitle>
            <CardDescription>
              Escanea este código QR con tu WhatsApp para conectar la sesión: <strong>{sessionName}</strong>
            </CardDescription>
          </CardHeader>
          <CardContent className="text-center space-y-4">
            {qrCode ? (
              <div className="space-y-4">
                <div className="flex justify-center">
                  <img 
                    src={qrCode} 
                    alt="WhatsApp QR Code" 
                    className="w-64 h-64 border rounded-lg shadow-lg bg-white p-2"
                    onError={() => {
                      console.error('❌ Error cargando imagen QR');
                      setError('Error al cargar la imagen del QR');
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
                <div className="flex gap-2 justify-center">
                  <Button onClick={getQR} variant="outline" size="sm" disabled={isLoading}>
                    {isLoading ? '🔄 Actualizando...' : '🔄 Actualizar QR'}
                  </Button>
                  <Button onClick={checkSession} variant="outline" size="sm" disabled={isLoading}>
                    {isLoading ? '🔍 Verificando...' : '🔍 Verificar Estado'}
                  </Button>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="w-64 h-64 mx-auto bg-gray-100 rounded-lg flex items-center justify-center">
                  <div className="text-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto"></div>
                    <p className="mt-2 text-sm text-gray-600">Generando código QR...</p>
                  </div>
                </div>
                <div className="flex gap-2 justify-center">
                  <Button onClick={getQR} variant="outline" size="sm" disabled={isLoading}>
                    {isLoading ? '🔄 Obteniendo...' : '📷 Obtener QR'}
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* ✅ SESIONES DISPONIBLES */}
      {allSessions.length > 0 && (
        <Card className="bg-gray-50">
          <CardHeader>
            <CardTitle className="text-base">📱 Sesiones WhatsApp Disponibles</CardTitle>
            <CardDescription>
              Todas las sesiones actualmente en el servidor WAHA
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {allSessions.map((sess, index) => (
                <div 
                  key={`${sess.name}-${index}`} // ✅ Key única usando nombre e índice
                  className={`flex items-center justify-between p-3 rounded border ${
                    sess.name === sessionName ? 'border-blue-300 bg-blue-50' : 'border-gray-200'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className={`w-3 h-3 rounded-full ${getBadgeColor(sess.status).replace('bg-', 'bg-')}`}></div>
                    <div>
                      <span className="font-medium">{sess.name}</span>
                      {sess.name === sessionName && <span className="text-xs text-blue-600 ml-2">(tu sesión)</span>}
                      {sess.me && (
                        <p className="text-xs text-gray-600">
                          Conectado: {sess.me.pushName}
                        </p>
                      )}
                    </div>
                  </div>
                  <Badge className={`${getBadgeColor(sess.status)} text-white text-xs`}>
                    {getStatusText(sess.status)}
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* ✅ INFORMACIÓN TÉCNICA */}
      <Card className="bg-gray-50">
        <CardHeader>
          <CardTitle className="text-base">⚙️ Información Técnica</CardTitle>
        </CardHeader>
        <CardContent className="text-sm space-y-2">
          <div><strong>API URL:</strong> <code className="bg-gray-200 px-1 rounded">/api/waha (proxy)</code></div>
          <div><strong>Servidor:</strong> <code className="bg-gray-200 px-1 rounded">pampaservers.com:60513</code></div>
          <div><strong>API Key:</strong> <code className="bg-gray-200 px-1 rounded">✅ pampaserver2025enservermuA!</code></div>
          <div><strong>Sesión:</strong> <code className="bg-gray-200 px-1 rounded">{sessionName}</code></div>
          <div><strong>Estado API:</strong> 
            <span className={`ml-2 ${error ? 'text-red-600' : 'text-green-600'}`}>
              {error ? '❌ Error' : '✅ Conectado'}
            </span>
          </div>
          
          {/* Operaciones WAHA disponibles */}
          <div className="pt-2 border-t">
            <strong>Operaciones WAHA disponibles:</strong>
            <div className="mt-1 text-xs text-gray-600 space-y-1">
              <div>• <code>POST /sessions</code> - Crear nueva sesión</div>
              <div>• <code>PUT /sessions/&#123;name&#125;</code> - Actualizar sesión existente</div>
              <div>• <code>POST /sessions/&#123;name&#125;/start</code> - Iniciar sesión</div>
              <div>• <code>POST /sessions/&#123;name&#125;/stop</code> - Detener sesión</div>
              <div>• <code>POST /sessions/&#123;name&#125;/restart</code> - Reiniciar sesión</div>
              <div>• <code>DELETE /sessions/&#123;name&#125;</code> - Eliminar sesión</div>
              <div>• <code>GET /sessions/&#123;name&#125;</code> - Obtener estado de sesión</div>
              <div>• <code>GET /sessions/&#123;name&#125;/auth/qr</code> - Obtener código QR</div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default WhatsAppWAHA;