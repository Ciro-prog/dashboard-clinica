import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Clinic } from '@/lib/clinicApi';

// Configuración WAHA
const WAHA_CONFIG = {
  baseURL: 'http://pampaservers.com:60513',
  apiKey: 'pampaserver2025enservermuA!'
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

const SimpleWhatsAppWAHA = () => {
  const [session, setSession] = useState<WAHASession | null>(null);
  const [qrCode, setQrCode] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string>('');
  const [clinic, setClinic] = useState<any>(null);
  const [sessionName, setSessionName] = useState<string>('');

  // Cargar datos de la clínica
  useEffect(() => {
    const loadClinic = async () => {
      try {
        const response = await Clinic.getAll();
        if (response.data && response.data.length > 0) {
          const firstClinic = response.data[0];
          setClinic(firstClinic);
          
          // Usar el suscriber como nombre de sesión, o slug como fallback
          const subscriber = firstClinic.attributes.suscriber || firstClinic.attributes.slug || `clinic-${firstClinic.id}`;
          setSessionName(subscriber);
          
          console.log('Clínica cargada:', firstClinic.attributes.name);
          console.log('Nombre de sesión:', subscriber);
        }
      } catch (err) {
        console.error('Error cargando clínica:', err);
        setError('Error al cargar datos de la clínica');
      }
    };

    loadClinic();
  }, []);

  // Headers para peticiones WAHA
  const getHeaders = () => ({
    'Content-Type': 'application/json',
    'X-API-Key': WAHA_CONFIG.apiKey
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
      const response = await fetch(`${WAHA_CONFIG.baseURL}/api/sessions/${sessionName}`, {
        method: 'GET',
        headers: getHeaders()
      });

      if (response.ok) {
        const data = await response.json();
        setSession(data);
        
        // Si necesita QR, obtenerlo
        if (data.status === 'SCAN_QR_CODE') {
          await getQR();
        } else {
          setQrCode('');
        }
        
        console.log('Estado de sesión:', data.status);
      } else if (response.status === 404) {
        setSession(null);
        setQrCode('');
        console.log('Sesión no existe');
      } else {
        throw new Error(`Error HTTP: ${response.status}`);
      }
    } catch (err) {
      console.error('Error verificando sesión:', err);
      setError('Error al verificar la sesión');
    } finally {
      setIsLoading(false);
    }
  };

  // Obtener código QR
  const getQR = async () => {
    try {
      const response = await fetch(`${WAHA_CONFIG.baseURL}/api/sessions/${sessionName}/qr`, {
        method: 'GET',
        headers: getHeaders()
      });

      if (response.ok) {
        const data = await response.json();
        if (data.qr) {
          setQrCode(data.qr);
          console.log('QR obtenido');
        }
      }
    } catch (err) {
      console.error('Error obteniendo QR:', err);
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
      const response = await fetch(`${WAHA_CONFIG.baseURL}/api/sessions/`, {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify({
          name: sessionName
        })
      });

      if (response.ok) {
        const data = await response.json();
        setSession(data);
        console.log('Sesión creada:', data.name);
        
        // Verificar estado después de crear
        setTimeout(checkSession, 2000);
      } else {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Error al crear sesión');
      }
    } catch (err) {
      console.error('Error creando sesión:', err);
      setError(err instanceof Error ? err.message : 'Error al crear sesión');
    } finally {
      setIsLoading(false);
    }
  };

  // Detener sesión
  const stopSession = async () => {
    setIsLoading(true);
    
    try {
      const response = await fetch(`${WAHA_CONFIG.baseURL}/api/sessions/${sessionName}/stop`, {
        method: 'POST',
        headers: getHeaders()
      });

      if (response.ok) {
        setSession(null);
        setQrCode('');
        console.log('Sesión detenida');
      } else {
        throw new Error('Error al detener sesión');
      }
    } catch (err) {
      console.error('Error deteniendo sesión:', err);
      setError('Error al detener sesión');
    } finally {
      setIsLoading(false);
    }
  };

  // Reiniciar sesión
  const restartSession = async () => {
    setIsLoading(true);
    
    try {
      const response = await fetch(`${WAHA_CONFIG.baseURL}/api/sessions/${sessionName}/restart`, {
        method: 'POST',
        headers: getHeaders()
      });

      if (response.ok) {
        console.log('Sesión reiniciada');
        setTimeout(checkSession, 3000);
      } else {
        throw new Error('Error al reiniciar sesión');
      }
    } catch (err) {
      console.error('Error reiniciando sesión:', err);
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
      case 'WORKING': return 'Conectado';
      case 'STARTING': return 'Iniciando...';
      case 'SCAN_QR_CODE': return 'Escanear QR';
      case 'STOPPED': return 'Detenido';
      case 'FAILED': return 'Error';
      default: return 'Desconocido';
    }
  };

  // Verificar automáticamente al cargar
  useEffect(() => {
    if (sessionName) {
      checkSession();
    }
  }, [sessionName]);

  return (
    <div className="space-y-6">
      {/* Información de la clínica */}
      {clinic && (
        <Card className="bg-blue-50 border-blue-200">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center gap-2">
              🏥 {clinic.attributes.name}
            </CardTitle>
            <CardDescription>
              Sesión WhatsApp: <strong>{sessionName}</strong>
            </CardDescription>
          </CardHeader>
        </Card>
      )}

      {/* Estado de la sesión */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span>📱</span>
              <span>Estado de WhatsApp</span>
            </div>
            {session && (
              <Badge className={`${getBadgeColor(session.status)} text-white`}>
                {getStatusText(session.status)}
              </Badge>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Información del estado */}
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="font-medium">Estado:</span>
              <span className={`ml-2 ${session?.status === 'WORKING' ? 'text-green-600' : 'text-gray-600'}`}>
                {session ? getStatusText(session.status) : 'Sin sesión'}
              </span>
            </div>
            <div>
              <span className="font-medium">Sesión:</span>
              <span className="ml-2 text-gray-600">{sessionName || 'Cargando...'}</span>
            </div>
            {session?.me && (
              <div className="col-span-2">
                <span className="font-medium">Conectado como:</span>
                <span className="ml-2 text-green-600">{session.me.pushName}</span>
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
          </div>

          {/* Errores */}
          {error && (
            <Alert className="border-red-200 bg-red-50">
              <AlertDescription className="text-red-700">
                {error}
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
              {isLoading ? 'Verificando...' : 'Verificar Estado'}
            </Button>

            {!session ? (
              <Button 
                onClick={createSession}
                disabled={isLoading || !sessionName}
                className="bg-green-600 hover:bg-green-700"
                size="sm"
              >
                Crear Sesión
              </Button>
            ) : (
              <>
                <Button 
                  onClick={restartSession}
                  disabled={isLoading}
                  variant="outline"
                  size="sm"
                >
                  Reiniciar
                </Button>
                <Button 
                  onClick={stopSession}
                  disabled={isLoading}
                  variant="destructive"
                  size="sm"
                >
                  Detener
                </Button>
              </>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Código QR */}
      {session?.status === 'SCAN_QR_CODE' && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <span>📷</span>
              <span>Código QR</span>
            </CardTitle>
            <CardDescription>
              Escanea este código con WhatsApp para conectar
            </CardDescription>
          </CardHeader>
          <CardContent className="text-center space-y-4">
            {qrCode ? (
              <div className="space-y-4">
                <img 
                  src={qrCode} 
                  alt="WhatsApp QR Code" 
                  className="w-64 h-64 mx-auto border rounded-lg"
                />
                <div className="text-sm text-gray-600 space-y-1">
                  <p>1. Abre WhatsApp en tu teléfono</p>
                  <p>2. Menú (⋮) → Dispositivos vinculados</p>
                  <p>3. "Vincular un dispositivo"</p>
                  <p>4. Escanea este código</p>
                </div>
                <Button onClick={getQR} variant="outline" size="sm">
                  Actualizar QR
                </Button>
              </div>
            ) : (
              <div className="w-64 h-64 mx-auto bg-gray-100 rounded-lg flex items-center justify-center">
                <div className="text-center">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto"></div>
                  <p className="mt-2 text-sm text-gray-600">Generando QR...</p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Información técnica */}
      <Card className="bg-gray-50">
        <CardHeader>
          <CardTitle className="text-base">Configuración WAHA</CardTitle>
        </CardHeader>
        <CardContent className="text-sm space-y-2">
          <div><strong>API:</strong> {WAHA_CONFIG.baseURL}</div>
          <div><strong>Sesión:</strong> {sessionName}</div>
          <div><strong>Clínica:</strong> {clinic?.attributes.name || 'Cargando...'}</div>
        </CardContent>
      </Card>
    </div>
  );
};

export default SimpleWhatsAppWAHA;