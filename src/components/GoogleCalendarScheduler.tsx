// src/components/GoogleCalendarScheduler.tsx - Google Calendar usando react-google-calendar-api

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Calendar, Clock, User, Plus, LogIn, LogOut, RefreshCw } from 'lucide-react';
import ApiCalendar from 'react-google-calendar-api';

// Configuración de Google Calendar API
const config = {
  clientId: '258798827340-7n62t1gp8ctkuu81ejp31o1ebb1sln3r.apps.googleusercontent.com',
  apiKey: 'AIzaSyDQVSBt0WkhBdvwYsm--aR2j_wJoQYrLZQ',
  scope: 'https://www.googleapis.com/auth/calendar',
  discoveryDocs: [
    'https://www.googleapis.com/discovery/v1/apis/calendar/v3/rest'
  ]
};

// Verificar configuración
console.log('🔧 Configuración Google Calendar:', {
  clientId: config.clientId ? 'Configurado' : 'Faltante',
  apiKey: config.apiKey ? 'Configurado' : 'Faltante',
  scope: config.scope,
  discoveryDocs: config.discoveryDocs.length + ' documentos'
});

// Inicializar API Calendar
const apiCalendar = new ApiCalendar(config);

interface GoogleCalendarEvent {
  id: string;
  summary: string;
  description?: string;
  start: {
    dateTime?: string;
    date?: string;
  };
  end: {
    dateTime?: string;
    date?: string;
  };
  location?: string;
  status: string;
}

const GoogleCalendarScheduler: React.FC = () => {
  const [isSignedIn, setIsSignedIn] = useState(false);
  const [events, setEvents] = useState<GoogleCalendarEvent[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Verificar estado de autenticación al cargar
  useEffect(() => {
    const checkAuthStatus = () => {
      try {
        console.log('📅 Verificando estado de autenticación...');
        console.log('📊 API Calendar object:', apiCalendar);
        console.log('📊 Sign property:', apiCalendar.sign);
        
        // Verificar si ya está autenticado
        if (apiCalendar.sign) {
          console.log('✅ Usuario ya autenticado');
          setIsSignedIn(true);
          // Cargar eventos si ya está autenticado
          loadEvents();
        } else {
          console.log('❌ Usuario no autenticado');
          setIsSignedIn(false);
        }
      } catch (error) {
        console.error('❌ Error verificando autenticación:', error);
        setIsSignedIn(false);
      }
    };

    // Agregar un pequeño delay para que se inicialice la librería
    setTimeout(checkAuthStatus, 1000);
  }, []);

  // Manejar login
  const handleSignIn = async () => {
    try {
      setLoading(true);
      setError(null);
      console.log('🔐 Iniciando autenticación...');
      
      const authResult = await apiCalendar.handleAuthClick();
      console.log('📊 Resultado de autenticación:', authResult);
      
      // Verificar si la autenticación fue exitosa
      const isAuth = apiCalendar.sign;
      console.log('📊 Estado de autenticación:', isAuth);
      
      if (isAuth) {
        setIsSignedIn(true);
        console.log('✅ Autenticación exitosa');
        
        // Cargar eventos después de autenticarse
        await loadEvents();
      } else {
        console.log('⚠️ Autenticación no completada');
        setError('Autenticación no completada. Inténtalo de nuevo.');
      }
    } catch (error) {
      console.error('❌ Error en autenticación:', error);
      console.error('❌ Detalles del error:', {
        name: error.name,
        message: error.message,
        stack: error.stack
      });
      setError(`Error al conectar con Google Calendar: ${error.message}`);
      setIsSignedIn(false);
    } finally {
      setLoading(false);
    }
  };

  // Manejar logout
  const handleSignOut = async () => {
    try {
      console.log('🚪 Cerrando sesión...');
      
      await apiCalendar.handleSignoutClick();
      setIsSignedIn(false);
      setEvents([]);
      
      console.log('✅ Sesión cerrada');
    } catch (error) {
      console.error('❌ Error cerrando sesión:', error);
      setError('Error al cerrar sesión');
    }
  };

  // Cargar eventos del calendario usando API directa
  const loadEvents = async () => {
    try {
      setLoading(true);
      setError(null);
      console.log('📅 Cargando eventos...');
      
      // Investigar la estructura del objeto apiCalendar
      console.log('🔍 Estructura completa de apiCalendar:', {
        apiCalendar,
        keys: Object.keys(apiCalendar),
        gapi: apiCalendar.gapi ? Object.keys(apiCalendar.gapi) : 'No disponible',
        tokenClient: apiCalendar.tokenClient ? 'Disponible' : 'No disponible',
        sign: apiCalendar.sign
      });
      
      let accessToken = null;
      
      // Intentar diferentes métodos para obtener el token
      try {
        // Método 1: Intentar con gapi.auth2 (método tradicional)
        if (apiCalendar.gapi?.auth2) {
          console.log('🔑 Intentando método gapi.auth2...');
          accessToken = apiCalendar.gapi.auth2.getAuthInstance().currentUser.get().getAuthResponse().access_token;
          console.log('✅ Token obtenido con gapi.auth2');
        }
      } catch (e) {
        console.log('❌ gapi.auth2 no funciona:', e.message);
      }
      
      // Método 2: Intentar con tokenClient (método moderno)
      if (!accessToken && apiCalendar.tokenClient) {
        console.log('🔑 Intentando método tokenClient...');
        try {
          // Para Google Identity Services (método moderno), necesitamos usar gapi.client
          if (window.gapi?.client) {
            // El token podría estar en gapi.client.getToken()
            const tokenInfo = window.gapi.client.getToken();
            if (tokenInfo && tokenInfo.access_token) {
              accessToken = tokenInfo.access_token;
              console.log('✅ Token obtenido con gapi.client.getToken()');
            }
          }
        } catch (e) {
          console.log('❌ tokenClient method failed:', e.message);
        }
      }
      
      // Método 3: Intentar acceder directamente al gapi global
      if (!accessToken && window.gapi) {
        console.log('🔑 Intentando método gapi global...');
        try {
          if (window.gapi.auth2) {
            const authInstance = window.gapi.auth2.getAuthInstance();
            if (authInstance) {
              const user = authInstance.currentUser.get();
              if (user && user.isSignedIn()) {
                accessToken = user.getAuthResponse().access_token;
                console.log('✅ Token obtenido con gapi global');
              }
            }
          }
        } catch (e) {
          console.log('❌ gapi global method failed:', e.message);
        }
      }
      
      console.log('🔑 Access token disponible:', !!accessToken);
      
      if (!accessToken) {
        throw new Error('No se pudo obtener el token de acceso. La sesión podría haber expirado.');
      }
      
      // Construir fechas para la consulta (próximos 30 días)
      const now = new Date();
      const timeMin = now.toISOString();
      const future = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
      const timeMax = future.toISOString();
      
      console.log('📅 Consultando eventos desde:', timeMin, 'hasta:', timeMax);
      
      // Llamar directamente a la API de Google Calendar
      const response = await fetch(
        `https://www.googleapis.com/calendar/v3/calendars/primary/events?` + 
        `timeMin=${encodeURIComponent(timeMin)}&` +
        `timeMax=${encodeURIComponent(timeMax)}&` +
        `maxResults=20&` +
        `singleEvents=true&` +
        `orderBy=startTime`,
        {
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json'
          }
        }
      );
      
      console.log('📡 Respuesta HTTP:', response.status, response.statusText);
      
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Error HTTP ${response.status}: ${errorText}`);
      }
      
      const data = await response.json();
      console.log('📊 Datos recibidos:', data);
      
      const events = data.items || [];
      setEvents(events);
      console.log(`✅ ${events.length} eventos cargados exitosamente`);
      
    } catch (error) {
      console.error('❌ Error cargando eventos:', error);
      console.error('❌ Detalles del error:', {
        name: error.name,
        message: error.message,
        stack: error.stack
      });
      setError(`Error al cargar eventos: ${error.message}`);
      setEvents([]);
    } finally {
      setLoading(false);
    }
  };

  // Crear un evento de prueba usando API directa
  const createTestEvent = async () => {
    try {
      setLoading(true);
      setError(null);
      console.log('➕ Creando evento de prueba...');
      
      // Obtener token de acceso usando el mismo método que loadEvents
      let accessToken = null;
      
      // Intentar diferentes métodos para obtener el token
      try {
        if (apiCalendar.gapi?.auth2) {
          accessToken = apiCalendar.gapi.auth2.getAuthInstance().currentUser.get().getAuthResponse().access_token;
        }
      } catch (e) {
        console.log('❌ gapi.auth2 no funciona para crear evento:', e.message);
      }
      
      if (!accessToken && window.gapi?.client) {
        try {
          const tokenInfo = window.gapi.client.getToken();
          if (tokenInfo && tokenInfo.access_token) {
            accessToken = tokenInfo.access_token;
          }
        } catch (e) {
          console.log('❌ gapi.client.getToken() failed for create event:', e.message);
        }
      }
      
      if (!accessToken && window.gapi?.auth2) {
        try {
          const authInstance = window.gapi.auth2.getAuthInstance();
          if (authInstance) {
            const user = authInstance.currentUser.get();
            if (user && user.isSignedIn()) {
              accessToken = user.getAuthResponse().access_token;
            }
          }
        } catch (e) {
          console.log('❌ gapi global method failed for create event:', e.message);
        }
      }
      
      if (!accessToken) {
        throw new Error('No se pudo obtener el token de acceso para crear el evento');
      }
      
      // Crear evento para dentro de 1 hora
      const now = new Date();
      const startTime = new Date(now.getTime() + 60 * 60 * 1000); // +1 hora
      const endTime = new Date(startTime.getTime() + 60 * 60 * 1000); // +1 hora más
      
      const event = {
        summary: 'Cita Médica - Consulta General',
        description: 'Cita médica creada desde el dashboard de la clínica',
        start: {
          dateTime: startTime.toISOString(),
          timeZone: 'America/Argentina/Buenos_Aires'
        },
        end: {
          dateTime: endTime.toISOString(),
          timeZone: 'America/Argentina/Buenos_Aires'
        },
        reminders: {
          useDefault: false,
          overrides: [
            { method: 'email', minutes: 24 * 60 },
            { method: 'popup', minutes: 10 }
          ]
        }
      };
      
      console.log('📅 Evento a crear:', event);
      
      // Crear evento vía API directa
      const response = await fetch(
        'https://www.googleapis.com/calendar/v3/calendars/primary/events',
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(event)
        }
      );
      
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Error HTTP ${response.status}: ${errorText}`);
      }
      
      const createdEvent = await response.json();
      console.log('✅ Evento creado exitosamente:', createdEvent);
      
      // Recargar eventos
      await loadEvents();
    } catch (error) {
      console.error('❌ Error creando evento:', error);
      setError(`Error al crear evento: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  // Formatear fecha
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('es-ES', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  };

  // Formatear hora
  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString('es-ES', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5" />
                Google Calendar - Agenda Médica
              </CardTitle>
              <CardDescription>
                Gestión de citas integrada con Google Calendar
              </CardDescription>
            </div>
            <div className="flex items-center gap-2">
              {!isSignedIn ? (
                <Button 
                  onClick={handleSignIn}
                  disabled={loading}
                  className="flex items-center gap-2"
                >
                  <LogIn className="h-4 w-4" />
                  {loading ? 'Conectando...' : 'Conectar Google'}
                </Button>
              ) : (
                <div className="flex items-center gap-2">
                  <Button 
                    variant="outline"
                    onClick={loadEvents}
                    disabled={loading}
                    size="sm"
                  >
                    <RefreshCw className="h-4 w-4 mr-2" />
                    Actualizar
                  </Button>
                  <Button 
                    variant="outline"
                    onClick={createTestEvent}
                    disabled={loading}
                    size="sm"
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Crear Cita
                  </Button>
                  <Button 
                    variant="outline"
                    onClick={handleSignOut}
                    disabled={loading}
                    size="sm"
                    className="text-red-600 hover:text-red-700"
                  >
                    <LogOut className="h-4 w-4 mr-2" />
                    Desconectar
                  </Button>
                </div>
              )}
            </div>
          </div>
        </CardHeader>
        
        {/* Estados */}
        <CardContent>
          <div className="flex gap-4 mb-4">
            <Badge variant={isSignedIn ? "default" : "secondary"} className="flex items-center gap-1">
              <Calendar className="h-3 w-3" />
              Estado: {isSignedIn ? 'Conectado' : 'Desconectado'}
            </Badge>
            {isSignedIn && (
              <Badge variant="outline" className="flex items-center gap-1">
                <Clock className="h-3 w-3" />
                Eventos: {events.length}
              </Badge>
            )}
          </div>

          {error && (
            <Alert variant="destructive" className="mb-4">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>

      {/* Contenido Principal */}
      {!isSignedIn ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Calendar className="h-12 w-12 text-gray-400 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              Conecta tu Google Calendar
            </h3>
            <p className="text-gray-500 text-center mb-6">
              Para gestionar tus citas médicas, necesitas conectar tu cuenta de Google Calendar.
            </p>
            <Button onClick={handleSignIn} disabled={loading}>
              <LogIn className="h-4 w-4 mr-2" />
              {loading ? 'Conectando...' : 'Conectar Google Calendar'}
            </Button>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle>Próximas Citas</CardTitle>
            <CardDescription>
              Eventos desde tu Google Calendar
            </CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex items-center justify-center py-8">
                <RefreshCw className="h-6 w-6 animate-spin mr-2" />
                <span>Cargando eventos...</span>
              </div>
            ) : events.length === 0 ? (
              <div className="text-center py-8">
                <Calendar className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  No hay eventos programados
                </h3>
                <p className="text-gray-500 mb-4">
                  No se encontraron eventos próximos en tu calendario.
                </p>
                <Button onClick={createTestEvent} disabled={loading}>
                  <Plus className="h-4 w-4 mr-2" />
                  Crear Primera Cita
                </Button>
              </div>
            ) : (
              <div className="space-y-4">
                {events.map((event) => (
                  <div 
                    key={event.id}
                    className="border rounded-lg p-4 hover:bg-gray-50 transition-colors"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <div className="flex items-center gap-1 text-sm font-medium">
                            <Clock className="h-4 w-4" />
                            {event.start.dateTime ? (
                              <>
                                {formatDate(event.start.dateTime)} - {formatTime(event.start.dateTime)}
                                {event.end.dateTime && ` a ${formatTime(event.end.dateTime)}`}
                              </>
                            ) : (
                              event.start.date && formatDate(event.start.date)
                            )}
                          </div>
                          <Badge variant="outline">
                            {event.status === 'confirmed' ? 'Confirmado' : event.status}
                          </Badge>
                        </div>
                        
                        <div className="space-y-1">
                          <h4 className="font-medium">{event.summary || 'Sin título'}</h4>
                          
                          {event.description && (
                            <p className="text-sm text-gray-600">
                              {event.description}
                            </p>
                          )}
                          
                          {event.location && (
                            <div className="flex items-center gap-2 text-sm text-gray-600">
                              <User className="h-4 w-4" />
                              <span>{event.location}</span>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default GoogleCalendarScheduler;