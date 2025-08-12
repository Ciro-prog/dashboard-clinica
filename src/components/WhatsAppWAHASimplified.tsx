import React, { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { 
  MessageSquare, 
  QrCode, 
  RefreshCw, 
  Trash2,
  CheckCircle,
  AlertCircle,
  Clock,
  Smartphone,
  Wifi,
  WifiOff
} from 'lucide-react';
import { type ClinicUser } from '@/lib/clinicAuth';
import { useWAHAService } from '@/hooks/useWAHAService';

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

const WhatsAppWAHASimplified = ({ clinic }: WhatsAppWAHAProps) => {
  const [error, setError] = useState<string>('');
  const [success, setSuccess] = useState<string>('');
  const [sessionName, setSessionName] = useState<string>('');
  const [autoRefresh, setAutoRefresh] = useState(false);
  const [lastCheck, setLastCheck] = useState<Date | null>(null);

  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  // ✅ CONFIGURAR NOMBRE DE SESIÓN
  useEffect(() => {
    if (clinic && !sessionName) {
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

  // ✅ Hook personalizado para WAHA con configuración por empresa
  const {
    isLoading,
    session,
    qrCode,
    checkSession,
    startAndGetQR,
    deleteSession,
    cleanup
  } = useWAHAService({
    sessionName,
    clinicId: clinic?.clinic_id,
    onSessionUpdate: (sessionData) => {
      setLastCheck(new Date());
    },
    onQRCodeUpdate: (qr) => {
      // QR code se maneja automáticamente en el hook
    },
    onError: (errorMessage) => {
      setError(errorMessage);
      setSuccess('');
      clearMessages();
    },
    onSuccess: (successMessage) => {
      setSuccess(successMessage);
      setError('');
      clearMessages();
    }
  });

  // ✅ CLEANUP
  useEffect(() => {
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      cleanup();
      console.log('🧹 Componente WhatsApp desmontado');
    };
  }, [cleanup]);

  // Función para limpiar mensajes después de un tiempo
  const clearMessages = () => {
    setTimeout(() => {
      setError('');
      setSuccess('');
    }, 5000);
  };

  // ✅ AUTO-REFRESH SYSTEM
  useEffect(() => {
    if (autoRefresh && sessionName) {
      console.log('🔄 Iniciando auto-refresh cada 3 minutos');
      intervalRef.current = setInterval(() => {
        console.log('🔄 Auto-refresh ejecutándose...');
        checkSession(true); // Silent check
      }, 3 * 60 * 1000); // 3 minutos

      return () => {
        if (intervalRef.current) {
          clearInterval(intervalRef.current);
          intervalRef.current = null;
        }
      };
    } else {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
        console.log('⏸️ Auto-refresh deshabilitado');
      }
    }
  }, [autoRefresh, sessionName, checkSession]);

  // Handlers para botones
  const handleCheckSession = () => {
    checkSession(false);
  };

  const handleStartAndGetQR = () => {
    startAndGetQR();
  };

  const handleDeleteSession = () => {
    if (confirm('¿Eliminar sesión de WhatsApp?\n\nEsto desconectará WhatsApp de este dispositivo.')) {
      deleteSession();
    }
  };

  // Obtener el icono del estado
  const getStatusIcon = () => {
    if (!session) return <WifiOff className="h-4 w-4" />;
    
    switch (session.status) {
      case 'WORKING':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'STARTING':
        return <Clock className="h-4 w-4 text-yellow-500" />;
      case 'SCAN_QR_CODE':
        return <QrCode className="h-4 w-4 text-blue-500" />;
      case 'STOPPED':
        return <WifiOff className="h-4 w-4 text-gray-500" />;
      case 'FAILED':
        return <AlertCircle className="h-4 w-4 text-red-500" />;
      default:
        return <WifiOff className="h-4 w-4" />;
    }
  };

  // Obtener el color del badge según el estado
  const getStatusBadgeVariant = () => {
    if (!session) return 'secondary';
    
    switch (session.status) {
      case 'WORKING':
        return 'default';
      case 'STARTING':
        return 'secondary';
      case 'SCAN_QR_CODE':
        return 'secondary';
      case 'STOPPED':
        return 'secondary';
      case 'FAILED':
        return 'destructive';
      default:
        return 'secondary';
    }
  };

  // Mensaje de ayuda según el estado
  const getStatusMessage = () => {
    if (!session) {
      return {
        title: 'Sin Sesión',
        description: 'No hay una sesión activa de WhatsApp. Haz clic en "Conectar" para comenzar.',
        variant: 'default' as const
      };
    }
    
    switch (session.status) {
      case 'WORKING':
        return {
          title: '✅ WhatsApp Conectado',
          description: `WhatsApp está funcionando correctamente. Conectado como: ${session.me?.pushName || 'Usuario'}`,
          variant: 'default' as const
        };
      case 'STARTING':
        return {
          title: '🔄 Iniciando...',
          description: 'La sesión se está inicializando. Esto puede tomar unos momentos.',
          variant: 'default' as const
        };
      case 'SCAN_QR_CODE':
        return {
          title: '📱 Escanea el Código QR',
          description: 'Abre WhatsApp en tu teléfono, ve a Configuración > Dispositivos vinculados > Vincular un dispositivo y escanea este código QR.',
          variant: 'default' as const
        };
      case 'STOPPED':
        return {
          title: '⏹️ Sesión Detenida',
          description: 'La sesión de WhatsApp está detenida. Haz clic en "Conectar" para reiniciarla.',
          variant: 'destructive' as const
        };
      case 'FAILED':
        return {
          title: '❌ Error de Conexión',
          description: 'No se pudo conectar con WhatsApp. Intenta eliminando la sesión y creando una nueva.',
          variant: 'destructive' as const
        };
      default:
        return {
          title: 'Estado Desconocido',
          description: 'Estado de WhatsApp no reconocido.',
          variant: 'destructive' as const
        };
    }
  };

  if (!clinic) {
    return (
      <Card className="w-full">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MessageSquare className="h-5 w-5" />
            WhatsApp Business
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">
            Carga los datos de la clínica para configurar WhatsApp.
          </p>
        </CardContent>
      </Card>
    );
  }

  const statusInfo = getStatusMessage();

  return (
    <Card className="w-full">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <MessageSquare className="h-5 w-5" />
            <CardTitle>WhatsApp Business</CardTitle>
          </div>
          <div className="flex items-center gap-2">
            {getStatusIcon()}
            <Badge variant={getStatusBadgeVariant()}>
              {session?.status || 'SIN_SESION'}
            </Badge>
          </div>
        </div>
        <CardDescription>
          Sesión: <code className="bg-muted px-1 py-0.5 rounded text-sm">{sessionName || 'No configurado'}</code>
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Messages */}
        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {success && (
          <Alert>
            <CheckCircle className="h-4 w-4" />
            <AlertDescription>{success}</AlertDescription>
          </Alert>
        )}

        {/* Status Information */}
        <Alert variant={statusInfo.variant}>
          <div className="flex items-start gap-2">
            {getStatusIcon()}
            <div className="flex-1">
              <div className="font-semibold">{statusInfo.title}</div>
              <div className="text-sm mt-1">{statusInfo.description}</div>
            </div>
          </div>
        </Alert>

        {/* QR Code Display */}
        {qrCode && session?.status === 'SCAN_QR_CODE' && (
          <div className="flex flex-col items-center p-4 border rounded-lg bg-white">
            <div className="text-center mb-3">
              <h3 className="font-semibold text-gray-900 mb-1">Código QR de WhatsApp</h3>
              <p className="text-sm text-gray-600">Escanea este código con tu WhatsApp</p>
            </div>
            
            <div className="relative bg-white p-4 border rounded-lg shadow-sm">
              <img 
                src={qrCode} 
                alt="QR Code WhatsApp" 
                className="w-48 h-48 block"
                style={{ imageRendering: 'pixelated' }}
              />
            </div>
            
            <div className="mt-3 p-3 bg-blue-50 rounded-lg border border-blue-200 max-w-md">
              <div className="flex items-center gap-2 text-blue-800 font-medium mb-2">
                <Smartphone className="h-4 w-4" />
                <span>Pasos para conectar:</span>
              </div>
              <ol className="text-sm text-blue-700 space-y-1">
                <li>1. Abre WhatsApp en tu teléfono</li>
                <li>2. Ve a <strong>Configuración</strong> &gt; <strong>Dispositivos vinculados</strong></li>
                <li>3. Toca <strong>"Vincular un dispositivo"</strong></li>
                <li>4. Escanea este código QR con tu cámara</li>
              </ol>
            </div>
          </div>
        )}

        {/* Controls */}
        <div className="flex flex-wrap gap-3">
          <Button 
            onClick={handleCheckSession}
            disabled={isLoading || !sessionName}
            variant="outline"
            size="sm"
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
            Verificar
          </Button>

          <Button 
            onClick={handleStartAndGetQR}
            disabled={isLoading || !sessionName}
            size="sm"
          >
            <Wifi className="h-4 w-4 mr-2" />
            Conectar
          </Button>

          {session && (
            <Button 
              onClick={handleDeleteSession}
              disabled={isLoading}
              variant="destructive"
              size="sm"
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Eliminar
            </Button>
          )}
        </div>

        {/* Auto-refresh Controls */}
        <div className="flex items-center gap-3 pt-2 border-t">
          <div className="flex items-center space-x-2">
            <Switch
              id="auto-refresh"
              checked={autoRefresh}
              onCheckedChange={setAutoRefresh}
              disabled={!sessionName}
            />
            <Label htmlFor="auto-refresh" className="text-sm">
              Auto-verificación (cada 3 min)
            </Label>
          </div>
          
          {lastCheck && (
            <div className="text-xs text-muted-foreground ml-auto">
              Última verificación: {lastCheck.toLocaleTimeString()}
            </div>
          )}
        </div>

        {/* Debug Info */}
        {session?.me && (
          <div className="pt-2 border-t">
            <div className="text-xs text-muted-foreground space-y-1">
              <div><strong>Dispositivo:</strong> {session.me.pushName}</div>
              <div><strong>WhatsApp ID:</strong> {session.me.id}</div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default WhatsAppWAHASimplified;