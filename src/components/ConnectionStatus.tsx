import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

interface ConnectionStatusProps {
  whatsappConnected: boolean;
  onWhatsAppToggle: () => void;
  onN8nStatusChange?: (status: boolean) => void;
}

const ConnectionStatus = ({ whatsappConnected, onWhatsAppToggle, onN8nStatusChange }: ConnectionStatusProps) => {
  const [n8nConnected, setN8nConnected] = useState(false);
  const [isCheckingN8n, setIsCheckingN8n] = useState(false);

  const checkN8nConnection = async () => {
    setIsCheckingN8n(true);
    try {
      // Simular verificación de conexión con N8N
      await new Promise(resolve => setTimeout(resolve, 1000));
      const newStatus = Math.random() > 0.3; // 70% de probabilidad de estar conectado
      setN8nConnected(newStatus);
      onN8nStatusChange?.(newStatus);
    } catch (error) {
      setN8nConnected(false);
      onN8nStatusChange?.(false);
    } finally {
      setIsCheckingN8n(false);
    }
  };

  useEffect(() => {
    checkN8nConnection();
    // Verificar conexión cada 30 segundos
    const interval = setInterval(checkN8nConnection, 30000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
      {/* Estado N8N Bot */}
      <Card className="medical-card">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center justify-between text-base sm:text-lg">
            <div className="flex items-center space-x-2">
              <span>🤖</span>
              <span>Bot N8N</span>
            </div>
            <Badge 
              className={`${n8nConnected ? 'bg-health-500' : 'bg-red-500'} text-white text-xs`}
            >
              {n8nConnected ? 'Online' : 'Offline'}
            </Badge>
          </CardTitle>
          <CardDescription className="text-sm">
            Estado del bot de automatización médica
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-center space-x-2">
            <div className={`w-3 h-3 rounded-full flex-shrink-0 ${n8nConnected ? 'bg-health-500 animate-pulse-slow' : 'bg-red-500'}`}></div>
            <span className="text-sm text-slate-600">
              {n8nConnected ? 'Procesando consultas automáticamente' : 'Bot desconectado'}
            </span>
          </div>
          <div className="flex items-center space-x-2">
            <div className={`w-3 h-3 rounded-full flex-shrink-0 ${n8nConnected ? 'bg-health-500 animate-pulse-slow' : 'bg-slate-400'}`}></div>
            <span className="text-sm text-slate-600">
              {n8nConnected ? 'Triaje inteligente activo' : 'Triaje desactivado'}
            </span>
          </div>
          <div className="flex items-center space-x-2">
            <div className={`w-3 h-3 rounded-full flex-shrink-0 ${n8nConnected ? 'bg-health-500 animate-pulse-slow' : 'bg-slate-400'}`}></div>
            <span className="text-sm text-slate-600">
              {n8nConnected ? 'Derivación automática' : 'Derivación manual'}
            </span>
          </div>
          <Button 
            onClick={checkN8nConnection}
            disabled={isCheckingN8n}
            size="sm"
            variant="outline"
            className="w-full mt-3"
          >
            {isCheckingN8n ? 'Verificando...' : 'Verificar Conexión'}
          </Button>
        </CardContent>
      </Card>

      {/* Estado WhatsApp */}
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