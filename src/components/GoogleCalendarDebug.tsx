// src/components/GoogleCalendarDebug.tsx - Debug de Google Calendar OAuth

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useGoogleCalendar } from '@/lib/googleCalendar';

const GoogleCalendarDebug: React.FC = () => {
  const googleCalendar = useGoogleCalendar();
  const [debugInfo, setDebugInfo] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);

  // Cargar información de debug al montar
  useEffect(() => {
    loadDebugInfo();
  }, []);

  const loadDebugInfo = () => {
    const tokenInfo = googleCalendar.getTokenInfo();
    const storedTokens = localStorage.getItem('google_calendar_tokens');
    
    setDebugInfo({
      ...tokenInfo,
      storedTokens: storedTokens ? JSON.parse(storedTokens) : null,
      localStorage: {
        hasItem: !!storedTokens,
        itemLength: storedTokens?.length || 0
      }
    });
  };

  const testUserInfo = async () => {
    setIsLoading(true);
    try {
      console.log('🧪 Testing getUserInfo...');
      const userInfo = await googleCalendar.getUserInfo();
      console.log('✅ getUserInfo exitoso:', userInfo);
      alert(`✅ getUserInfo exitoso: ${userInfo.name} (${userInfo.email})`);
    } catch (error) {
      console.error('❌ getUserInfo falló:', error);
      alert(`❌ getUserInfo falló: ${error.message}`);
    } finally {
      setIsLoading(false);
      loadDebugInfo();
    }
  };

  const testCalendars = async () => {
    setIsLoading(true);
    try {
      console.log('🧪 Testing getCalendars...');
      const calendars = await googleCalendar.getCalendars();
      console.log('✅ getCalendars exitoso:', calendars);
      alert(`✅ getCalendars exitoso: ${calendars.length} calendarios encontrados`);
    } catch (error) {
      console.error('❌ getCalendars falló:', error);
      alert(`❌ getCalendars falló: ${error.message}`);
    } finally {
      setIsLoading(false);
      loadDebugInfo();
    }
  };

  const clearTokensDebug = () => {
    googleCalendar.clearTokens();
    loadDebugInfo();
    alert('🧹 Tokens eliminados');
  };

  const forceReauth = () => {
    googleCalendar.clearTokens();
    googleCalendar.initiateAuth();
    loadDebugInfo();
  };

  return (
    <Card className="bg-white/90 backdrop-blur-sm border-yellow-200">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          🐛 Google Calendar Debug
          <Badge className="bg-yellow-100 text-yellow-800">
            Desarrollo
          </Badge>
        </CardTitle>
        <CardDescription>
          Herramientas de debugging para OAuth de Google Calendar
        </CardDescription>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {/* Información de tokens */}
        <div className="space-y-3">
          <h4 className="font-medium">📊 Estado de Tokens</h4>
          
          {debugInfo && (
            <div className="bg-gray-50 p-3 rounded border text-sm font-mono">
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <strong>Tiene tokens:</strong> {debugInfo.hasTokens ? '✅ Sí' : '❌ No'}
                </div>
                <div>
                  <strong>Autenticado:</strong> {debugInfo.isAuthenticated ? '✅ Sí' : '❌ No'}
                </div>
                <div className="col-span-2">
                  <strong>Expira en:</strong> {debugInfo.expiresAt || 'No disponible'}
                </div>
                <div>
                  <strong>localStorage:</strong> {debugInfo.localStorage.hasItem ? '✅ Existe' : '❌ Vacío'}
                </div>
                <div>
                  <strong>Tamaño:</strong> {debugInfo.localStorage.itemLength} chars
                </div>
              </div>
              
              {debugInfo.storedTokens && (
                <div className="mt-3 border-t pt-3">
                  <strong>Tokens guardados:</strong>
                  <div className="mt-1 space-y-1">
                    <div>• access_token: {debugInfo.storedTokens.access_token ? `${debugInfo.storedTokens.access_token.substring(0, 20)}...` : 'No'}</div>
                    <div>• refresh_token: {debugInfo.storedTokens.refresh_token ? `${debugInfo.storedTokens.refresh_token.substring(0, 20)}...` : 'No'}</div>
                    <div>• expires_in: {debugInfo.storedTokens.expires_in}</div>
                    <div>• scope: {debugInfo.storedTokens.scope}</div>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Botones de prueba */}
        <div className="space-y-3">
          <h4 className="font-medium">🧪 Pruebas</h4>
          
          <div className="grid grid-cols-2 gap-2">
            <Button
              onClick={testUserInfo}
              disabled={isLoading}
              variant="outline"
              className="border-blue-300 text-blue-700 hover:bg-blue-50"
            >
              {isLoading ? '⏳' : '👤'} Test getUserInfo
            </Button>
            
            <Button
              onClick={testCalendars}
              disabled={isLoading}
              variant="outline"
              className="border-green-300 text-green-700 hover:bg-green-50"
            >
              {isLoading ? '⏳' : '📅'} Test getCalendars
            </Button>
            
            <Button
              onClick={clearTokensDebug}
              disabled={isLoading}
              variant="outline"
              className="border-red-300 text-red-700 hover:bg-red-50"
            >
              🧹 Limpiar Tokens
            </Button>
            
            <Button
              onClick={forceReauth}
              disabled={isLoading}
              variant="outline"
              className="border-purple-300 text-purple-700 hover:bg-purple-50"
            >
              🔄 Reautenticar
            </Button>
          </div>
        </div>

        {/* Botón para recargar debug info */}
        <div className="border-t pt-3">
          <Button
            onClick={loadDebugInfo}
            size="sm"
            variant="ghost"
            className="w-full"
          >
            🔄 Actualizar Info Debug
          </Button>
        </div>

        {/* Información de configuración */}
        <div className="border-t pt-3">
          <h4 className="font-medium mb-2">⚙️ Configuración OAuth</h4>
          <div className="bg-blue-50 p-3 rounded border text-sm">
            <div className="space-y-1">
              <div><strong>Client ID:</strong> 258798827340-7...googleusercontent.com</div>
              <div><strong>Redirect URI:</strong> http://localhost:8080/auth/google/callback</div>
              <div><strong>Scopes:</strong></div>
              <ul className="ml-4 list-disc">
                <li>calendar.readonly</li>
                <li>userinfo.profile</li>
                <li>userinfo.email</li>
              </ul>
            </div>
          </div>
        </div>

        {/* Instrucciones de troubleshooting */}
        <div className="border-t pt-3">
          <h4 className="font-medium mb-2">🔧 Troubleshooting</h4>
          <div className="bg-yellow-50 p-3 rounded border text-sm space-y-2">
            <p><strong>Si tienes Error 401:</strong></p>
            <ol className="ml-4 list-decimal space-y-1">
              <li>Verifica que el redirect URI esté registrado en Google Cloud Console</li>
              <li>Asegúrate de que los scopes estén configurados correctamente</li>
              <li>Prueba limpiar tokens y reautenticar</li>
              <li>Revisa la consola del navegador para logs detallados</li>
            </ol>
            
            <p className="mt-3"><strong>Pasos para registrar redirect URI:</strong></p>
            <ol className="ml-4 list-decimal space-y-1">
              <li>Ve a Google Cloud Console</li>
              <li>Selecciona tu proyecto</li>
              <li>Ve a APIs & Services > Credentials</li>
              <li>Edita tu OAuth 2.0 client</li>
              <li>Agrega: http://localhost:8080/auth/google/callback</li>
              <li>Guarda los cambios</li>
            </ol>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default GoogleCalendarDebug;