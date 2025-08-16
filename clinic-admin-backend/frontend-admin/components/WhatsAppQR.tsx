import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { toast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

const WhatsAppQR = () => {
  const [qrCode, setQrCode] = useState('');
  const [isConnected, setIsConnected] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [qrId, setQrId] = useState<string | null>(null);

  const generateQR = async () => {
    setIsLoading(true);
    
    try {
      // Obtener el usuario actual
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        toast({
          title: "Error",
          description: "Debes estar autenticado para generar un código QR.",
          variant: "destructive"
        });
        setIsLoading(false);
        return;
      }

      // Generar código QR (simulado)
      const qrData = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=whatsapp://send?phone=123456789&text=Hola, necesito asistencia médica`;
      
      // Simular descarga de imagen y conversión a blob
      const response = await fetch(qrData);
      const blob = await response.blob();
      
      // Crear nombre único para el archivo
      const fileName = `${user.id}/qr-${Date.now()}.png`;
      
      // Subir imagen a Supabase Storage
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('qr-codes')
        .upload(fileName, blob);

      if (uploadError) {
        throw uploadError;
      }

      // Obtener URL pública de la imagen
      const { data: { publicUrl } } = supabase.storage
        .from('qr-codes')
        .getPublicUrl(fileName);

      // Guardar información del QR en la base de datos
      const { data: qrRecord, error: dbError } = await supabase
        .from('whatsapp_qr')
        .insert({
          user_id: user.id,
          qr_image_url: publicUrl,
          status: 'offline',
          phone_number: '123456789'
        })
        .select()
        .single();

      if (dbError) {
        throw dbError;
      }

      setQrCode(publicUrl);
      setQrId(qrRecord.id);
      setIsLoading(false);
      
      toast({
        title: "Código QR Generado",
        description: "Escanea el código con WhatsApp para conectar.",
      });

    } catch (error) {
      console.error('Error generating QR:', error);
      toast({
        title: "Error",
        description: "No se pudo generar el código QR. Inténtalo de nuevo.",
        variant: "destructive"
      });
      setIsLoading(false);
    }
  };

  const simulateConnection = async () => {
    setTimeout(async () => {
      if (qrId) {
        try {
          // Actualizar estado a 'online' en la base de datos
          const { error } = await supabase
            .from('whatsapp_qr')
            .update({ status: 'online' })
            .eq('id', qrId);

          if (error) {
            console.error('Error updating status:', error);
          } else {
            setIsConnected(true);
            toast({
              title: "¡WhatsApp Conectado!",
              description: "El bot de IA está listo para recibir consultas.",
            });
          }
        } catch (error) {
          console.error('Error connecting:', error);
        }
      }
    }, 3000);
  };

  const disconnectWhatsApp = async () => {
    if (qrId) {
      try {
        // Actualizar estado a 'offline' en la base de datos
        const { error } = await supabase
          .from('whatsapp_qr')
          .update({ status: 'offline' })
          .eq('id', qrId);

        if (error) {
          console.error('Error updating status:', error);
        } else {
          setIsConnected(false);
          toast({
            title: "WhatsApp Desconectado",
            description: "La conexión se ha cerrado correctamente.",
          });
        }
      } catch (error) {
        console.error('Error disconnecting:', error);
      }
    }
  };

  // Cargar códigos QR existentes al montar el componente
  useEffect(() => {
    const loadExistingQR = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (user) {
        const { data: qrRecords } = await supabase
          .from('whatsapp_qr')
          .select('*')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false })
          .limit(1);

        if (qrRecords && qrRecords.length > 0) {
          const latestQR = qrRecords[0];
          setQrCode(latestQR.qr_image_url);
          setQrId(latestQR.id);
          setIsConnected(latestQR.status === 'online');
        }
      }
    };

    loadExistingQR();
  }, []);

  useEffect(() => {
    if (qrCode && !isConnected && qrId) {
      simulateConnection();
    }
  }, [qrCode, isConnected, qrId]);

  return (
    <div className="space-y-6">
      <Card className="card-shadow">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2 text-base sm:text-lg">
            <span>📱</span>
            <span>Conexión WhatsApp</span>
          </CardTitle>
          <CardDescription className="text-sm">
            Conecta tu WhatsApp Business para recibir consultas de pacientes a través del asistente IA
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="text-center">
            {!qrCode ? (
              <div className="space-y-4">
                <div className="w-40 h-40 sm:w-48 sm:h-48 mx-auto bg-slate-100 rounded-lg flex items-center justify-center">
                  <span className="text-3xl sm:text-4xl">📱</span>
                </div>
                <Button 
                  onClick={generateQR}
                  disabled={isLoading}
                  className="medical-gradient hover:opacity-90 text-sm sm:text-base"
                >
                  {isLoading ? (
                    <div className="flex items-center space-x-2">
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      <span>Generando QR...</span>
                    </div>
                  ) : (
                    'Generar Código QR'
                  )}
                </Button>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="relative inline-block">
                  <img 
                    src={qrCode} 
                    alt="WhatsApp QR Code" 
                    className="mx-auto rounded-lg shadow-lg w-40 h-40 sm:w-48 sm:h-48 object-cover"
                  />
                  {isConnected && (
                    <div className="absolute -top-2 -right-2 w-6 h-6 sm:w-8 sm:h-8 bg-green-500 rounded-full flex items-center justify-center">
                      <span className="text-white text-xs sm:text-sm">✓</span>
                    </div>
                  )}
                </div>
                <div className="space-y-2">
                  {isConnected ? (
                    <div className="space-y-2">
                      <div className="flex items-center justify-center space-x-2 text-green-600">
                        <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
                        <span className="font-medium text-sm sm:text-base">WhatsApp Online</span>
                      </div>
                      <Button 
                        onClick={disconnectWhatsApp}
                        variant="outline"
                        size="sm"
                        className="text-sm"
                      >
                        Desconectar
                      </Button>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      <div className="flex items-center justify-center space-x-2 text-slate-600">
                        <div className="w-3 h-3 bg-slate-400 rounded-full"></div>
                        <span className="font-medium text-sm sm:text-base">WhatsApp Offline</span>
                      </div>
                      <p className="text-slate-600 text-xs sm:text-sm">
                        Escanea este código con WhatsApp para conectar
                      </p>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {isConnected && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card className="card-shadow opacity-0 animate-fadeIn">
            <CardHeader>
              <CardTitle className="text-base sm:text-lg">🤖 Asistente IA Activo</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center space-x-2">
                <div className="w-2 h-2 bg-green-500 rounded-full flex-shrink-0"></div>
                <span className="text-sm text-slate-600">Respuestas automáticas: ON</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-2 h-2 bg-green-500 rounded-full flex-shrink-0"></div>
                <span className="text-sm text-slate-600">Triaje inteligente: ON</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-2 h-2 bg-green-500 rounded-full flex-shrink-0"></div>
                <span className="text-sm text-slate-600">Derivación médica: ON</span>
              </div>
            </CardContent>
          </Card>

          <Card className="card-shadow opacity-0 animate-fadeIn">
            <CardHeader>
              <CardTitle className="text-base sm:text-lg">📊 Estadísticas WhatsApp</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex justify-between">
                <span className="text-sm text-slate-600">Mensajes hoy</span>
                <span className="font-semibold text-blue-600">24</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-slate-600">Consultas resueltas</span>
                <span className="font-semibold text-green-600">18</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-slate-600">Tiempo de respuesta</span>
                <span className="font-semibold text-blue-600">2 min</span>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
};

export default WhatsAppQR;