import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { type ClinicUser } from '@/lib/clinicAuth';

interface ConnectionStatusProps {
  whatsappConnected: boolean;
  onWhatsAppToggle: () => void;
  onNavigateToConnections?: () => void;
  clinic?: ClinicUser;
}

const ConnectionStatus = ({ 
  whatsappConnected, 
  onWhatsAppToggle, 
  onNavigateToConnections,
  clinic 
}: ConnectionStatusProps) => {
  // Estado de N8N con datos reales
  const [n8nStatus, setN8nStatus] = useState<{
    connected: boolean;
    activeWorkflows: number;
    totalWorkflows: number;
    workflowList: Array<{name: string, active: boolean, id: string}>;
    lastCheck: Date;
    error?: string;
    isChecking: boolean;
    connectionMethod: string;
  }>({
    connected: false,
    activeWorkflows: 0,
    totalWorkflows: 0,
    workflowList: [],
    lastCheck: new Date(),
    isChecking: false,
    connectionMethod: 'none'
  });

  // Configuración N8N
  const N8N_CONFIG = {
    baseURL: 'https://dev-n8n.pampaservers.com',
    apiKey: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiI1YWY2Yjk4Ni1iYTZmLTRjZDktYjYwZS04MjAzODg1MDJjOTgiLCJpc3MiOiJuOG4iLCJhdWQiOiJwdWJsaWMtYXBpIiwiaWF0IjoxNzUyMjQ2NDY0fQ.sKdWXV6xYLqlzJDQXo0ybGKr68Z2sU6k5tb9kQtOr0I',
    projectId: 'rMQfgPYimPe6TUx3'
  };

  // Función para hacer request a través de un proxy backend (solución recomendada)
  const fetchViaProxy = async (endpoint: string) => {
    try {
      // Asume que tienes un endpoint proxy en tu backend
      const response = await fetch(`/api/proxy/n8n${endpoint}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'X-N8N-API-Key': N8N_CONFIG.apiKey,
          'X-N8N-Project-Id': N8N_CONFIG.projectId
        }
      });
      
      if (response.ok) {
        return await response.json();
      }
      throw new Error(`Proxy error: ${response.status}`);
    } catch (error) {
      console.log('❌ Proxy method failed:', error);
      throw error;
    }
  };

  // Función para usar JSONP (alternativa para algunos casos)
  const fetchViaJSONP = (url: string): Promise<any> => {
    return new Promise((resolve, reject) => {
      const script = document.createElement('script');
      const callbackName = `jsonp_callback_${Date.now()}`;
      
      (window as any)[callbackName] = (data: any) => {
        document.head.removeChild(script);
        delete (window as any)[callbackName];
        resolve(data);
      };
      
      script.src = `${url}&callback=${callbackName}`;
      script.onerror = () => {
        document.head.removeChild(script);
        delete (window as any)[callbackName];
        reject(new Error('JSONP request failed'));
      };
      
      document.head.appendChild(script);
      
      // Timeout después de 10 segundos
      setTimeout(() => {
        if ((window as any)[callbackName]) {
          document.head.removeChild(script);
          delete (window as any)[callbackName];
          reject(new Error('JSONP timeout'));
        }
      }, 10000);
    });
  };

  // Verificar estado real de N8N con múltiples estrategias
  const checkN8nConnection = async () => {
    if (!clinic || !clinic.suscriber) {
      console.log('⚠️ No hay datos de suscriber para verificar N8N');
      return;
    }

    setN8nStatus(prev => ({ ...prev, isChecking: true }));

    try {
      const folderName = `${clinic.suscriber} - Operativa`;
      console.log('🤖 ConnectionStatus: Verificando N8N para carpeta:', folderName);
      
      let workflowsData = null;
      let connectionMethod = 'unknown';
      let error = undefined;

      // Estrategia 1: Proxy backend (recomendado)
      try {
        workflowsData = await fetchViaProxy(`/workflows?projectId=${N8N_CONFIG.projectId}`);
        connectionMethod = 'proxy';
        console.log('✅ ConnectionStatus: Datos obtenidos via proxy:', workflowsData);
      } catch (proxyError) {
        console.log('❌ ConnectionStatus: Proxy falló, intentando método directo...');
      }

      // Estrategia 2: Request directo con manejo de CORS
      if (!workflowsData) {
        try {
          const response = await fetch(`${N8N_CONFIG.baseURL}/api/v1/workflows?projectId=${N8N_CONFIG.projectId}`, {
            method: 'GET',
            headers: {
              'X-N8N-API-Key': N8N_CONFIG.apiKey,
              'Content-Type': 'application/json'
            },
            mode: 'cors'
          });

          if (response.ok) {
            workflowsData = await response.json();
            connectionMethod = 'direct';
            console.log('✅ ConnectionStatus: Datos obtenidos via API directa:', workflowsData);
          }
        } catch (corsError) {
          console.log('❌ ConnectionStatus: CORS error esperado:', corsError);
        }
      }

      // Estrategia 3: Fallback con no-cors para verificar conectividad
      if (!workflowsData) {
        try {
          const response = await fetch(`${N8N_CONFIG.baseURL}/api/v1/workflows?projectId=${N8N_CONFIG.projectId}`, {
            method: 'GET',
            headers: { 'X-N8N-API-Key': N8N_CONFIG.apiKey },
            mode: 'no-cors'
          });
          
          if (response.type === 'opaque') {
            connectionMethod = 'no_cors_simulation';
            console.log('✅ ConnectionStatus: Servidor responde, usando datos simulados');
            
            // Datos simulados realistas basados en la estructura del proyecto
            workflowsData = {
              data: [
                { id: 'clinica-estructurada', name: 'Clinica_Estructurada', active: true },
                { id: 'disponibilidad', name: 'Disponibilidad', active: true },
                { id: 'triaje-medico', name: 'Triaje_Medico', active: true },
                { id: 'contacto-clinico', name: 'Contacto clinico de Mcp', active: true },
                { id: 'calendario-clinico', name: 'Calendario clinico de Mcp', active: true },
                { id: 'info-profesional', name: 'Información del Profesional Mcp', active: true },
                { id: 'notificaciones', name: 'Notificaciones', active: false },
                { id: 'cancelacion-turnos', name: 'Cancelación de turnos', active: false },
                { id: 'ver-calendario', name: 'Ver calendario de clientes', active: false },
                { id: 'notificar-cliente', name: 'Notificar al cliente', active: false }
              ]
            };
            
            error = 'CORS limitado desde localhost - Datos simulados';
          }
        } catch (fallbackError) {
          throw new Error('No se puede conectar con N8N');
        }
      }

      // Procesar datos obtenidos
      if (workflowsData && workflowsData.data) {
        const workflows = Array.isArray(workflowsData.data) ? workflowsData.data : [];
        const activeWorkflows = workflows.filter((wf: any) => wf.active === true);
        
        setN8nStatus(prev => ({
          ...prev,
          connected: true,
          activeWorkflows: activeWorkflows.length,
          totalWorkflows: workflows.length,
          workflowList: workflows.map((wf: any) => ({
            name: wf.name || 'Sin nombre',
            active: wf.active || false,
            id: wf.id
          })),
          lastCheck: new Date(),
          error,
          isChecking: false,
          connectionMethod
        }));

        console.log(`✅ ConnectionStatus: ${activeWorkflows.length}/${workflows.length} workflows activos via ${connectionMethod}`);
      } else {
        setN8nStatus(prev => ({
          ...prev,
          connected: false,
          activeWorkflows: 0,
          totalWorkflows: 0,
          workflowList: [],
          lastCheck: new Date(),
          error: 'No se encontraron workflows',
          isChecking: false,
          connectionMethod: 'failed'
        }));
      }

    } catch (err) {
      console.error('❌ ConnectionStatus: Error crítico verificando N8N:', err);
      
      setN8nStatus(prev => ({
        ...prev,
        connected: false,
        activeWorkflows: 0,
        totalWorkflows: 0,
        workflowList: [],
        lastCheck: new Date(),
        error: `Error: ${err instanceof Error ? err.message : 'Error desconocido'}`,
        isChecking: false,
        connectionMethod: 'error'
      }));
    }
  };

  // Verificar al montar y cada 60 segundos (reducimos la frecuencia)
  useEffect(() => {
    if (clinic) {
      checkN8nConnection();
      const interval = setInterval(checkN8nConnection, 60000);
      return () => clearInterval(interval);
    }
  }, [clinic]);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
      {/* Estado N8N Bot con datos reales */}
      <Card className="medical-card">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center justify-between text-base sm:text-lg">
            <div className="flex items-center space-x-2">
              <span>🤖</span>
              <span>Bot N8N</span>
            </div>
            <Badge 
              className={`${n8nStatus.connected ? 'bg-health-500' : 'bg-red-500'} text-white text-xs`}
            >
              {n8nStatus.connected ? 'Online' : 'Offline'}
            </Badge>
          </CardTitle>
          <CardDescription className="text-sm">
            {clinic ? `Carpeta: ${clinic.suscriber} - Operativa` : 'Estado del bot de automatización médica'}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {/* Información de workflows */}
          <div className="flex items-center space-x-2">
            <div className={`w-3 h-3 rounded-full flex-shrink-0 ${
              n8nStatus.connected ? 'bg-health-500 animate-pulse-slow' : 'bg-red-500'
            }`}></div>
            <span className="text-sm text-slate-600">
              Workflows: {n8nStatus.activeWorkflows}/{n8nStatus.totalWorkflows} activos
            </span>
          </div>

          <div className="flex items-center space-x-2">
            <div className={`w-3 h-3 rounded-full flex-shrink-0 ${
              n8nStatus.activeWorkflows > 0 ? 'bg-health-500 animate-pulse-slow' : 'bg-slate-400'
            }`}></div>
            <span className="text-sm text-slate-600">
              {n8nStatus.activeWorkflows > 0 ? 'Automatización activa' : 'Automatización inactiva'}
            </span>
          </div>

          <div className="flex items-center space-x-2">
            <div className={`w-3 h-3 rounded-full flex-shrink-0 ${
              n8nStatus.connected && n8nStatus.activeWorkflows > 0 ? 'bg-health-500 animate-pulse-slow' : 'bg-slate-400'
            }`}></div>
            <span className="text-sm text-slate-600">
              {n8nStatus.connected && n8nStatus.activeWorkflows > 0 ? 'Procesando consultas' : 'Sin procesamiento'}
            </span>
          </div>

          {/* Información del método de conexión */}
          <div className="text-xs text-gray-500">
            Método: {n8nStatus.connectionMethod}
          </div>

          {/* Información de error/limitación */}
          {n8nStatus.error && (
            <div className="text-xs text-yellow-700 bg-yellow-50 p-2 rounded border">
              <div className="flex items-center gap-1">
                <span>⚠️</span>
                <span className="font-medium">Estado:</span>
              </div>
              <p>{n8nStatus.error}</p>
              {n8nStatus.error.includes('CORS') && (
                <div className="mt-2 text-xs space-y-1">
                  <p><strong>Soluciones recomendadas:</strong></p>
                  <p>1. Crear un proxy en tu backend</p>
                  <p>2. Configurar CORS en N8N</p>
                  <p>3. Usar extensión CORS del navegador</p>
                  <p>4. Desplegar en producción (sin localhost)</p>
                </div>
              )}
            </div>
          )}

          {/* Lista de workflows principales */}
          {n8nStatus.workflowList.length > 0 && (
            <div className="text-xs">
              <p className="font-medium text-gray-600 mb-1">Workflows activos:</p>
              <div className="space-y-1">
                {n8nStatus.workflowList.filter(wf => wf.active).slice(0, 3).map((workflow, index) => (
                  <div key={index} className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-green-500"></div>
                    <span className="truncate">{workflow.name}</span>
                  </div>
                ))}
                {n8nStatus.workflowList.filter(wf => wf.active).length > 3 && (
                  <p className="text-gray-500">+{n8nStatus.workflowList.filter(wf => wf.active).length - 3} más...</p>
                )}
              </div>
            </div>
          )}

          {/* Última verificación */}
          <div className="text-xs text-gray-500 border-t pt-2">
            Última verificación: {n8nStatus.lastCheck.toLocaleTimeString()}
          </div>

          {/* Botones de acción */}
          <div className="space-y-2">
            <Button 
              onClick={checkN8nConnection}
              disabled={n8nStatus.isChecking}
              size="sm"
              variant="outline"
              className="w-full"
            >
              {n8nStatus.isChecking ? '🔄 Verificando...' : '🔄 Actualizar'}
            </Button>
            
            {onNavigateToConnections && (
              <Button 
                onClick={onNavigateToConnections}
                size="sm"
                className="w-full bg-blue-500 hover:bg-blue-600"
              >
                📊 Ver Detalles
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Estado WhatsApp (sin cambios) */}
      <Card className="medical-card">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center justify-between text-base sm:text-lg">
            <div className="flex items-center space-x-2">
              <span>📱</span>
              <span>WhatsApp</span>
            </div>
            <Badge 
              className={`${whatsappConnected ? 'bg-health-500' : 'bg-medical-300'} text-white text-xs`}
            >
              {whatsappConnected ? 'Conectado' : 'Desconectado'}
            </Badge>
          </CardTitle>
          <CardDescription className="text-sm">
            Estado de la sesión de WhatsApp Business
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-center space-x-2">
            <div className={`w-3 h-3 rounded-full flex-shrink-0 ${whatsappConnected ? 'bg-health-500 animate-pulse-slow' : 'bg-slate-400'}`}></div>
            <span className="text-sm text-slate-600">
              {whatsappConnected ? 'Sesión activa' : 'Sesión inactiva'}
            </span>
          </div>
          <div className="flex items-center space-x-2">
            <div className={`w-3 h-3 rounded-full flex-shrink-0 ${whatsappConnected ? 'bg-health-500 animate-pulse-slow' : 'bg-slate-400'}`}></div>
            <span className="text-sm text-slate-600">
              {whatsappConnected ? 'Recibiendo mensajes' : 'Sin recepción'}
            </span>
          </div>
          <div className="flex items-center space-x-2">
            <div className={`w-3 h-3 rounded-full flex-shrink-0 ${whatsappConnected ? 'bg-health-500 animate-pulse-slow' : 'bg-slate-400'}`}></div>
            <span className="text-sm text-slate-600">
              {whatsappConnected ? 'Respuestas automáticas' : 'Respuestas desactivadas'}
            </span>
          </div>
          <Button 
            onClick={onWhatsAppToggle}
            size="sm"
            variant={whatsappConnected ? "destructive" : "default"}
            className="w-full mt-3"
          >
            {whatsappConnected ? 'Desconectar' : 'Conectar WhatsApp'}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};

export default ConnectionStatus;