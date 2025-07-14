import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { type ClinicUser } from '@/lib/clinicAuth';

// Configuración WAHA
const WAHA_CONFIG = {
    baseURL: '/api/waha',
    apiKey: import.meta.env.VITE_WAHA_API_KEY
  };

interface WAHASession {
  name: string;
  status: 'WORKING' | 'STARTING' | 'SCAN_QR_CODE' | 'STOPPED' | 'FAILED';
  qr?: string;
  me?: {
    id: string;
    pushName: string;
  };
}

// ✅ CAMBIO PRINCIPAL: Ahora recibe los datos de la clínica como prop
interface WhatsAppWAHAProps {
  clinic?: ClinicUser;
}

const WhatsAppWAHA = ({ clinic }: WhatsAppWAHAProps) => {
  const [session, setSession] = useState<WAHASession | null>(null);
  const [qrCode, setQrCode] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string>('');
  const [sessionName, setSessionName] = useState<string>('');

  // ✅ REPLICAR EXACTAMENTE LA LÓGICA DEL DASHBOARD
  useEffect(() => {
    if (clinic) {
      console.log('🏥 Datos de clínica recibidos:', clinic);
      console.log('👤 Suscriber disponible:', clinic.suscriber);
      console.log('🆔 Clinic ID disponible:', clinic.clinic_id);
      
      // Usar exactamente la misma lógica que en el dashboard
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

  // Headers para peticiones WAHA
  const getHeaders = () => ({
    'Content-Type': 'application/json'
    // No incluir X-API-Key aquí porque se agrega automáticamente en vercel.json
  });

  // Verificar estado de sesión
  const checkSession = async () => {
    if (!sessionName) {
      setError('No se ha cargado el nombre de sesión');
      return;
    }

    setIsLoading(true);
    setError('');
    
    try {
      console.log('📊 Verificando estado de sesión:', sessionName);
      
      const response = await fetch(`${WAHA_CONFIG.baseURL}/sessions/${sessionName}`, {
        method: 'GET',
        headers: getHeaders()
      });

      console.log('📡 Respuesta verificación status:', response.status);

      if (response.ok) {
        const data = await response.json();
        console.log('📊 Datos de sesión recibidos:', data);
        setSession(data);
        
        // Limpiar QR si el estado cambió
        if (data.status !== 'SCAN_QR_CODE') {
          setQrCode('');
          console.log('🧹 QR limpiado - estado no es SCAN_QR_CODE');
        }
        
        console.log('📊 Estado de sesión actual:', data.status);
      } else if (response.status === 404) {
        setSession(null);
        setQrCode('');
        console.log('ℹ️ Sesión no existe - puede crear una nueva');
      } else {
        const errorText = await response.text();
        console.error('❌ Error HTTP verificando sesión:', response.status, errorText);
        throw new Error(`Error ${response.status}: ${errorText}`);
      }
    } catch (err) {
      console.error('❌ Error verificando sesión:', err);
      setError('Error al verificar la sesión. Verifica que WAHA esté ejecutándose.');
    } finally {
      setIsLoading(false);
    }
  };

  // Obtener código QR - CORREGIDO para manejar PNG
  const getQR = async () => {
    if (!sessionName) {
      console.error('❌ No hay nombre de sesión para obtener QR');
      return;
    }
    
    try {
      console.log('📷 Obteniendo QR para sesión:', sessionName);
      
      const qrUrl = `${WAHA_CONFIG.baseURL}/${sessionName}/auth/qr`;
      console.log('🌐 URL del QR:', qrUrl);
      
      const response = await fetch(qrUrl, {
        method: 'GET',
        headers: getHeaders()
      });

      console.log('📡 Respuesta QR status:', response.status);
      console.log('📡 Respuesta QR headers:', response.headers.get('content-type'));
      
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
    }
  };

  // Crear sesión
  const createSession = async () => {
    if (!sessionName) {
      setError('No hay nombre de sesión disponible');
      return;
    }

    setIsLoading(true);
    setError('');
    
    try {
      const response = await fetch(`${WAHA_CONFIG.baseURL}/sessions/`, {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify({
          name: sessionName
        })
      });

      if (response.ok) {
        const data = await response.json();
        setSession(data);
        console.log('✅ Sesión creada:', data.name);
        
        // Verificar estado después de crear
        setTimeout(checkSession, 2000);
      } else {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Error al crear sesión');
      }
    } catch (err) {
      console.error('❌ Error creando sesión:', err);
      setError(err instanceof Error ? err.message : 'Error al crear sesión');
    } finally {
      setIsLoading(false);
    }
  };

  // Detener sesión
  const stopSession = async () => {
    setIsLoading(true);
    
    try {
      const response = await fetch(`${WAHA_CONFIG.baseURL}/sessions/${sessionName}/stop`, {
        method: 'POST',
        headers: getHeaders()
      });

      if (response.ok) {
        setSession(null);
        setQrCode('');
        console.log('⏹️ Sesión detenida');
      } else {
        throw new Error('Error al detener sesión');
      }
    } catch (err) {
      console.error('❌ Error deteniendo sesión:', err);
      setError('Error al detener sesión');
    } finally {
      setIsLoading(false);
    }
  };

  // Reiniciar sesión
  const restartSession = async () => {
    setIsLoading(true);
    
    try {
      const response = await fetch(`${WAHA_CONFIG.baseURL}/sessions/${sessionName}/restart`, {
        method: 'POST',
        headers: getHeaders()
      });

      if (response.ok) {
        console.log('🔄 Sesión reiniciada');
        setTimeout(checkSession, 3000);
      } else {
        throw new Error('Error al reiniciar sesión');
      }
    } catch (err) {
      console.error('❌ Error reiniciando sesión:', err);
      setError('Error al reiniciar sesión');
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

  // Verificar automáticamente al cargar
  useEffect(() => {
    if (sessionName) {
      checkSession();
    }
  }, [sessionName]);

  // Obtener QR automáticamente cuando el estado sea SCAN_QR_CODE
  useEffect(() => {
    if (session?.status === 'SCAN_QR_CODE' && !qrCode && !isLoading) {
      console.log('🔄 Estado SCAN_QR_CODE detectado, obteniendo QR automáticamente...');
      getQR();
    }
  }, [session?.status, qrCode, isLoading]);

  // ✅ CAMBIO: Mostrar loading mientras se cargan los datos de la clínica
  if (!clinic) {
    return (
      <div className="space-y-6">
        <Card>
          <CardContent className="flex items-center justify-center py-8">
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto"></div>
              <p className="mt-2 text-sm text-gray-600">Esperando datos de la clínica...</p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* ✅ CAMBIO: Información de la clínica recibida como prop */}
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

      {/* Estado de la sesión */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span>📱</span>
              <span>Estado de WhatsApp WAHA</span>
            </div>
            {session && (
              <Badge className={`${getBadgeColor(session.status)} text-white`}>
                {getStatusText(session.status)}
              </Badge>
            )}
          </CardTitle>
          <CardDescription>
            Conexión directa con WhatsApp Business API
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Información del estado */}
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

          {/* Indicadores visuales */}
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
                {session?.status === 'WORKING' ? 'Enviando respuestas' : 'Envío desactivado'}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <div className={`w-3 h-3 rounded-full ${
                sessionName ? 'bg-blue-500' : 'bg-gray-400'
              }`}></div>
              <span className="text-sm">
                API WAHA: {sessionName ? 'Configurado' : 'Sin configurar'}
              </span>
            </div>
          </div>

          {/* Errores */}
          {error && (
            <Alert className="border-red-200 bg-red-50">
              <AlertDescription className="text-red-700">
                ❌ {error}
              </AlertDescription>
            </Alert>
          )}

          {/* Botones de control */}
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
              <Button 
                onClick={createSession}
                disabled={isLoading || !sessionName}
                className="bg-green-600 hover:bg-green-700"
                size="sm"
              >
                ➕ Crear Sesión
              </Button>
            ) : (
              <>
                <Button 
                  onClick={restartSession}
                  disabled={isLoading}
                  variant="outline"
                  size="sm"
                >
                  🔄 Reiniciar
                </Button>
                <Button 
                  onClick={stopSession}
                  disabled={isLoading}
                  variant="destructive"
                  size="sm"
                >
                  ⏹️ Detener
                </Button>
              </>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Código QR */}
      {session?.status === 'SCAN_QR_CODE' && (
        <Card className="border-blue-200">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <span>📷</span>
              <span>Código QR de WhatsApp</span>
            </CardTitle>
            <CardDescription>
              Escanea este código con tu WhatsApp para conectar la sesión: <strong>{sessionName}</strong>
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
                    onError={(e) => {
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
                    <p className="mt-2 text-sm text-gray-600">Generando QR...</p>
                  </div>
                </div>
                <div className="flex gap-2 justify-center">
                  <Button onClick={getQR} variant="outline" size="sm" disabled={isLoading}>
                    {isLoading ? '🔄 Obteniendo...' : '📷 Obtener QR'}
                  </Button>
                  <Button onClick={checkSession} variant="outline" size="sm" disabled={isLoading}>
                    {isLoading ? '🔍 Verificando...' : '🔍 Verificar Estado'}
                  </Button>
                </div>
                {error && (
                  <Alert className="border-red-200 bg-red-50">
                    <AlertDescription className="text-red-700 text-sm">
                      ❌ {error}
                    </AlertDescription>
                  </Alert>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Información técnica y debug */}
      <Card className="bg-gray-50">
        <CardHeader>
          <CardTitle className="text-base">⚙️ Configuración WAHA</CardTitle>
        </CardHeader>
        <CardContent className="text-sm space-y-2">
          <div><strong>API URL:</strong> <code className="bg-gray-200 px-1 rounded">{WAHA_CONFIG.baseURL}</code></div>
          <div><strong>Sesión:</strong> <code className="bg-gray-200 px-1 rounded">{sessionName}</code></div>
          <div><strong>Clínica:</strong> {clinic.name_clinic || 'No disponible'}</div>
          <div><strong>Subscriber:</strong> <code className="bg-gray-200 px-1 rounded">"{clinic.suscriber || 'No disponible'}"</code></div>
          <div><strong>Clinic ID:</strong> <code className="bg-gray-200 px-1 rounded">"{clinic.clinic_id || 'No disponible'}"</code></div>
          <div><strong>Estado API:</strong> 
            <span className={`ml-2 ${error ? 'text-red-600' : 'text-green-600'}`}>
              {error ? '❌ Error de conexión' : '✅ Conectado'}
            </span>
          </div>
          {session && (
            <div><strong>Estado Actual:</strong> <code className="bg-gray-200 px-1 rounded">{session.status}</code></div>
          )}
        </CardContent>
      </Card>

      {/* Información adicional */}
      <Card className="bg-yellow-50 border-yellow-200">
        <CardHeader>
          <CardTitle className="text-base">ℹ️ Información Importante</CardTitle>
        </CardHeader>
        <CardContent className="text-sm space-y-2">
          <p>• <strong>Esta es una conexión básica</strong> - solo gestiona estados de sesión</p>
          <p>• <strong>Sin webhook configurado</strong> - no procesa mensajes automáticamente</p>
          <p>• <strong>Para funcionalidad completa</strong> - configurar webhook en n8n</p>
          <p>• <strong>El código QR expira</strong> - generar uno nuevo si es necesario</p>
          <p>• <strong>QR format:</strong> PNG/Data URL compatible</p>
          <p>• <strong>Sesión basada en:</strong> {clinic.suscriber ? 'Suscriber' : clinic.clinic_id ? 'Clinic ID' : 'Fallback'}</p>
        </CardContent>
      </Card>
    </div>
  );
};

export default WhatsAppWAHA;