// src/components/GoogleCalendarAuth.tsx - Componente de autenticación con Google Calendar

import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useGoogleCalendar, GoogleCalendar } from '@/lib/googleCalendar';

interface GoogleCalendarAuthProps {
  onAuthSuccess?: (calendars: GoogleCalendar[]) => void;
  onAuthError?: (error: string) => void;
  showCalendarList?: boolean;
}

const GoogleCalendarAuth: React.FC<GoogleCalendarAuthProps> = ({
  onAuthSuccess,
  onAuthError,
  showCalendarList = true
}) => {
  const googleCalendar = useGoogleCalendar();
  
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string>('');
  const [success, setSuccess] = useState<string>('');
  const [userInfo, setUserInfo] = useState<{ email: string; name: string; picture?: string } | null>(null);
  const [calendars, setCalendars] = useState<GoogleCalendar[]>([]);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  // Verificar estado de autenticación al cargar
  useEffect(() => {
    checkAuthStatus();
    
    // Escuchar mensajes de la ventana de autorización
    const handleMessage = (event: MessageEvent) => {
      if (event.origin !== window.location.origin) return;
      
      if (event.data.type === 'GOOGLE_AUTH_SUCCESS' && event.data.code) {
        handleAuthCode(event.data.code);
      } else if (event.data.type === 'GOOGLE_AUTH_ERROR') {
        setError('Error en la autorización: ' + (event.data.error || 'Error desconocido'));
        setIsLoading(false);
      }
    };

    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, []);

  // Verificar estado de autenticación
  const checkAuthStatus = useCallback(async () => {
    try {
      const authenticated = googleCalendar.isAuthenticated();
      setIsAuthenticated(authenticated);
      
      if (authenticated) {
        console.log('✅ Usuario ya autenticado, cargando datos...');
        await loadUserData();
      } else {
        console.log('❌ Usuario no autenticado');
        setUserInfo(null);
        setCalendars([]);
      }
    } catch (error) {
      console.error('❌ Error verificando autenticación:', error);
      setIsAuthenticated(false);
      setUserInfo(null);
      setCalendars([]);
    }
  }, [googleCalendar]);

  // Cargar datos del usuario autenticado
  const loadUserData = useCallback(async () => {
    try {
      setIsLoading(true);
      setError('');
      
      // Cargar información del usuario
      const user = await googleCalendar.getUserInfo();
      setUserInfo(user);
      console.log('👤 Usuario cargado:', user.email);
      
      // Cargar calendarios
      const userCalendars = await googleCalendar.getCalendars();
      setCalendars(userCalendars);
      console.log(`📅 ${userCalendars.length} calendarios cargados`);
      
      setSuccess(`✅ Conectado como ${user.name} (${user.email})`);
      
      // Notificar éxito a componente padre
      if (onAuthSuccess) {
        onAuthSuccess(userCalendars);
      }
      
    } catch (error) {
      console.error('❌ Error cargando datos del usuario:', error);
      const errorMessage = error instanceof Error ? error.message : 'Error desconocido';
      setError(`Error cargando datos: ${errorMessage}`);
      
      if (onAuthError) {
        onAuthError(errorMessage);
      }
    } finally {
      setIsLoading(false);
    }
  }, [googleCalendar, onAuthSuccess, onAuthError]);

  // Iniciar proceso de autenticación
  const handleAuth = useCallback(() => {
    try {
      setIsLoading(true);
      setError('');
      setSuccess('');
      
      console.log('🚀 Iniciando autenticación con Google...');
      googleCalendar.initiateAuth();
      
      // Mostrar mensaje de instrucciones
      setSuccess('🔐 Se abrió una ventana para autorizar el acceso a Google Calendar. Por favor, completa la autorización.');
      
    } catch (error) {
      console.error('❌ Error iniciando autenticación:', error);
      const errorMessage = error instanceof Error ? error.message : 'Error desconocido';
      setError(`Error iniciando autenticación: ${errorMessage}`);
      setIsLoading(false);
    }
  }, [googleCalendar]);

  // Manejar código de autorización recibido
  const handleAuthCode = useCallback(async (code: string) => {
    try {
      console.log('🔑 Procesando código de autorización...');
      setSuccess('🔄 Procesando autorización...');
      
      await googleCalendar.exchangeCodeForTokens(code);
      setIsAuthenticated(true);
      
      // Cargar datos del usuario
      await loadUserData();
      
    } catch (error) {
      console.error('❌ Error procesando código de autorización:', error);
      const errorMessage = error instanceof Error ? error.message : 'Error desconocido';
      setError(`Error en autorización: ${errorMessage}`);
      
      if (onAuthError) {
        onAuthError(errorMessage);
      }
    } finally {
      setIsLoading(false);
    }
  }, [googleCalendar, loadUserData, onAuthError]);

  // Cerrar sesión de Google Calendar
  const handleLogout = useCallback(() => {
    try {
      console.log('👋 Cerrando sesión de Google Calendar...');
      googleCalendar.clearTokens();
      setIsAuthenticated(false);
      setUserInfo(null);
      setCalendars([]);
      setSuccess('👋 Sesión cerrada exitosamente');
      setError('');
    } catch (error) {
      console.error('❌ Error cerrando sesión:', error);
      setError('Error cerrando sesión');
    }
  }, [googleCalendar]);

  // Recargar calendarios
  const handleRefreshCalendars = useCallback(async () => {
    if (!isAuthenticated) return;
    
    try {
      setIsLoading(true);
      setError('');
      
      const userCalendars = await googleCalendar.getCalendars();
      setCalendars(userCalendars);
      setSuccess(`🔄 ${userCalendars.length} calendarios actualizados`);
      
      if (onAuthSuccess) {
        onAuthSuccess(userCalendars);
      }
      
    } catch (error) {
      console.error('❌ Error recargando calendarios:', error);
      const errorMessage = error instanceof Error ? error.message : 'Error desconocido';
      setError(`Error recargando calendarios: ${errorMessage}`);
    } finally {
      setIsLoading(false);
    }
  }, [isAuthenticated, googleCalendar, onAuthSuccess]);

  // Limpiar mensajes después de un tiempo
  useEffect(() => {
    if (success) {
      const timer = setTimeout(() => setSuccess(''), 5000);
      return () => clearTimeout(timer);
    }
  }, [success]);

  return (
    <div className="space-y-4">
      {/* Mensajes de estado */}
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
            {success}
          </AlertDescription>
        </Alert>
      )}

      {/* Estado de autenticación */}
      <Card className="bg-white/90 backdrop-blur-sm">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            📅 Google Calendar
            {isAuthenticated && (
              <Badge className="bg-green-100 text-green-800">
                Conectado
              </Badge>
            )}
          </CardTitle>
          <CardDescription>
            {isAuthenticated 
              ? 'Conectado a Google Calendar - Puedes ver tus calendarios y eventos'
              : 'Conecta tu cuenta de Google para sincronizar calendarios'
            }
          </CardDescription>
        </CardHeader>
        
        <CardContent className="space-y-4">
          {!isAuthenticated ? (
            // Estado no autenticado
            <div className="text-center space-y-4">
              <div className="p-6 border-2 border-dashed border-gray-200 rounded-lg">
                <p className="text-gray-600 mb-4">
                  🔐 Para ver tus calendarios de Google, necesitas autorizar el acceso
                </p>
                <Button 
                  onClick={handleAuth}
                  disabled={isLoading}
                  className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2"
                >
                  {isLoading ? '⏳ Conectando...' : '🔗 Conectar con Google Calendar'}
                </Button>
              </div>
              
              <div className="text-sm text-gray-500 p-3 bg-blue-50 rounded border border-blue-200">
                <p className="font-medium mb-1">ℹ️ ¿Qué permisos necesitamos?</p>
                <ul className="text-left space-y-1">
                  <li>• Ver tus calendarios de Google</li>
                  <li>• Leer eventos de tus calendarios</li>
                  <li>• Acceso de solo lectura (no modificamos nada)</li>
                </ul>
              </div>
            </div>
          ) : (
            // Estado autenticado
            <div className="space-y-4">
              {/* Información del usuario */}
              {userInfo && (
                <div className="flex items-center gap-3 p-3 bg-green-50 rounded-lg border border-green-200">
                  {userInfo.picture && (
                    <img 
                      src={userInfo.picture} 
                      alt={userInfo.name}
                      className="w-10 h-10 rounded-full"
                    />
                  )}
                  <div className="flex-1">
                    <p className="font-medium text-green-800">{userInfo.name}</p>
                    <p className="text-sm text-green-600">{userInfo.email}</p>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      onClick={handleRefreshCalendars}
                      disabled={isLoading}
                      size="sm"
                      variant="outline"
                      className="border-green-300 text-green-700 hover:bg-green-50"
                    >
                      {isLoading ? '🔄' : '🔄'} Actualizar
                    </Button>
                    <Button
                      onClick={handleLogout}
                      size="sm"
                      variant="outline"
                      className="border-red-300 text-red-600 hover:bg-red-50"
                    >
                      🔌 Desconectar
                    </Button>
                  </div>
                </div>
              )}

              {/* Lista de calendarios */}
              {showCalendarList && calendars.length > 0 && (
                <div>
                  <h4 className="font-medium text-gray-900 mb-3">
                    📋 Tus Calendarios ({calendars.length})
                  </h4>
                  <div className="space-y-2 max-h-60 overflow-y-auto">
                    {calendars.map((calendar) => (
                      <div 
                        key={calendar.id}
                        className="flex items-center gap-3 p-3 border rounded-lg hover:bg-gray-50"
                      >
                        <div 
                          className="w-4 h-4 rounded-full border"
                          style={{ backgroundColor: calendar.backgroundColor || '#1976d2' }}
                        ></div>
                        <div className="flex-1">
                          <p className="font-medium text-sm">
                            {calendar.summary}
                            {calendar.primary && (
                              <Badge className="ml-2 bg-blue-100 text-blue-800 text-xs">
                                Principal
                              </Badge>
                            )}
                          </p>
                          {calendar.description && (
                            <p className="text-xs text-gray-500">{calendar.description}</p>
                          )}
                        </div>
                        <div className="text-xs text-gray-500">
                          {calendar.accessRole}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Estado sin calendarios */}
              {showCalendarList && calendars.length === 0 && !isLoading && (
                <div className="text-center py-4 text-gray-500">
                  <p>📅 No se encontraron calendarios</p>
                  <Button
                    onClick={handleRefreshCalendars}
                    size="sm"
                    variant="outline"
                    className="mt-2"
                  >
                    🔄 Intentar de nuevo
                  </Button>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default GoogleCalendarAuth;