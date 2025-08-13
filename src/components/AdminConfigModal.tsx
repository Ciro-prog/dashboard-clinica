import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { 
  Settings, 
  Key, 
  Eye, 
  EyeOff, 
  Copy, 
  RefreshCw, 
  CheckCircle,
  AlertCircle,
  Server,
  Database
} from 'lucide-react';
import { updateAPIConfig } from '@/lib/persistentAuth';

interface AdminConfigModalProps {
  open: boolean;
  onClose: () => void;
}

interface APIConfig {
  backend_url: string;
  backend_api_key: string;
  n8n_folder: string;
  admin_session_duration: number;
}

export default function AdminConfigModal({ open, onClose }: AdminConfigModalProps) {
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [showKeys, setShowKeys] = useState<Record<string, boolean>>({});
  const [testResults, setTestResults] = useState<Record<string, boolean>>({});
  const [testing, setTesting] = useState<Record<string, boolean>>({});
  const isMountedRef = React.useRef(true);

  const [config, setConfig] = useState<APIConfig>({
    backend_url: 'http://localhost:8000',
    backend_api_key: 'test123456', // Default test key
    n8n_folder: '',
    admin_session_duration: 24
  });

  // Cleanup to prevent memory leaks and DOM errors
  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  useEffect(() => {
    if (open) {
      loadConfiguration();
    }
  }, [open]);

  const loadConfiguration = async () => {
    try {
      setLoading(true);
      setError(null);

      const token = localStorage.getItem('admin_token');
      if (!token) {
        throw new Error('Token de administrador no encontrado');
      }

      let configData = null;

      // Intentar cargar desde backend primero
      try {
        const response = await fetch('/api/admin/configuration', {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });

        if (response.ok) {
          configData = await response.json();
          console.log('✅ Configuration loaded from backend:', configData);
        } else {
          console.warn('⚠️ Backend config not available, trying localStorage');
        }
      } catch (backendError) {
        console.warn('⚠️ Backend not available, trying localStorage:', backendError);
      }

      // Fallback a localStorage
      if (!configData) {
        const localConfig = localStorage.getItem('admin_api_config');
        if (localConfig) {
          try {
            configData = JSON.parse(localConfig);
            console.log('✅ Configuration loaded from localStorage:', configData);
          } catch (parseError) {
            console.error('❌ Error parsing localStorage config:', parseError);
          }
        }
      }

      // Si no hay configuración, usar defaults
      if (!configData) {
        console.log('⚠️ No configuration found, using defaults');
        configData = {};
      }

      setConfig({
        backend_url: configData.backend_url || 'http://localhost:8000',
        backend_api_key: configData.backend_api_key || '',
        n8n_folder: configData.n8n_folder || '',
        admin_session_duration: configData.admin_session_duration || 24
      });

    } catch (err) {
      console.error('❌ Error loading configuration:', err);
      setError(err instanceof Error ? err.message : 'Error desconocido');
    } finally {
      setLoading(false);
    }
  };

  const saveConfiguration = async () => {
    try {
      setSaving(true);
      setError(null);
      setSuccess(null);

      const token = localStorage.getItem('admin_token');
      if (!token) {
        throw new Error('Token de administrador no encontrado');
      }

      try {
        const response = await fetch('/api/admin/configuration', {
          method: 'PUT',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(config)
        });

        if (response.ok) {
          console.log('✅ Configuration saved to backend successfully');
        } else {
          console.warn('⚠️ Backend save failed, using local storage fallback');
        }
      } catch (backendError) {
        console.warn('⚠️ Backend not available, using local storage fallback:', backendError);
      }

      // SIEMPRE actualizar la configuración en PersistentAuth (funciona sin backend)
      updateAPIConfig(config);
      
      // Almacenar también en localStorage como respaldo
      localStorage.setItem('admin_api_config', JSON.stringify(config));
      
      console.log('✅ Configuration saved locally');
      setSuccess('Configuración guardada exitosamente (almacenada localmente)');
      
      // Limpiar mensaje de éxito después de 3 segundos
      setTimeout(() => setSuccess(null), 3000);

    } catch (err) {
      console.error('❌ Error saving configuration:', err);
      setError(err instanceof Error ? err.message : 'Error desconocido');
    } finally {
      setSaving(false);
    }
  };

  const testConnection = async (service: string) => {
    try {
      setTesting(prev => ({ ...prev, [service]: true }));
      setTestResults(prev => ({ ...prev, [service]: false }));

      if (service === 'backend') {
        // Probar conexión al backend usando la API key
        if (!config.backend_api_key) {
          throw new Error('API Key del backend no configurada');
        }

        const testUrl = `${config.backend_url}/api/health`;
        const response = await fetch(testUrl, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            'X-API-Key': config.backend_api_key
          }
        });

        if (response.ok) {
          setTestResults(prev => ({ ...prev, [service]: true }));
          console.log(`✅ Backend connection test successful`);
          setSuccess(`Conexión exitosa con el backend en ${config.backend_url}`);
        } else {
          setTestResults(prev => ({ ...prev, [service]: false }));
          console.error(`❌ Backend connection test failed:`, response.status);
          setError(`Error ${response.status} conectando al backend`);
        }
      }

    } catch (err) {
      console.error(`❌ Error testing ${service} connection:`, err);
      setTestResults(prev => ({ ...prev, [service]: false }));
      setError(`Error probando conexión: ${err instanceof Error ? err.message : 'Error desconocido'}`);
    } finally {
      setTesting(prev => ({ ...prev, [service]: false }));
    }
  };

  const toggleShowKey = (keyName: string) => {
    setShowKeys(prev => ({
      ...prev,
      [keyName]: !prev[keyName]
    }));
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setSuccess('Copiado al portapapeles');
    setTimeout(() => setSuccess(null), 2000);
  };

  const generateApiKey = () => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let result = '';
    for (let i = 0; i < 32; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
  };

  const handleInputChange = (field: keyof APIConfig, value: string | number) => {
    setConfig(prev => ({
      ...prev,
      [field]: value
    }));
  };

  return (
    <Dialog open={open} onOpenChange={(newOpen) => {
      if (!newOpen && !loading && !saving) {
        // Reset state in next tick to prevent DOM manipulation conflicts
        setTimeout(() => {
          setError(null);
          setSuccess(null);
        }, 0);
        onClose();
      }
    }}>
      <DialogContent 
        key={`admin-config-${open ? 'open' : 'closed'}`}
        className="max-w-4xl max-h-[90vh] overflow-y-auto bg-slate-800 border-slate-700"
        onInteractOutside={(e) => e.preventDefault()}
        onEscapeKeyDown={(e) => !loading && !saving && onClose()}
      >
        <DialogHeader>
          <DialogTitle className="text-white flex items-center gap-2">
            <Settings className="h-5 w-5" />
            Configuración del Sistema
          </DialogTitle>
        </DialogHeader>

        {loading ? (
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-medical-500"></div>
            <p className="ml-3 text-slate-300">Cargando configuración...</p>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Messages */}
            {error && (
              <div className="p-3 bg-red-900/30 border border-red-700 rounded-lg flex items-center gap-2 text-red-200">
                <AlertCircle className="h-4 w-4" />
                <span>{error}</span>
              </div>
            )}

            {success && (
              <div className="p-3 bg-green-900/30 border border-green-700 rounded-lg flex items-center gap-2 text-green-200">
                <CheckCircle className="h-4 w-4" />
                <span>{success}</span>
              </div>
            )}

            <Tabs defaultValue="backend" className="w-full">
              <TabsList className="grid w-full grid-cols-2 bg-slate-700">
                <TabsTrigger value="backend" className="data-[state=active]:bg-medical-500">
                  <Server className="h-4 w-4 mr-2" />
                  Backend API
                </TabsTrigger>
                <TabsTrigger value="automation" className="data-[state=active]:bg-medical-500">
                  <Settings className="h-4 w-4 mr-2" />
                  Automatización
                </TabsTrigger>
              </TabsList>

              {/* Backend API Tab */}
              <TabsContent value="backend" className="space-y-4">
                {/* Main Backend Configuration */}
                <Card className="bg-slate-700 border-slate-600">
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <div>
                        <CardTitle className="text-slate-100 flex items-center gap-2">
                          <Server className="h-4 w-4" />
                          Backend API Principal
                        </CardTitle>
                        <CardDescription className="text-slate-400">
                          API principal del sistema (puerto 8000/doc)
                        </CardDescription>
                      </div>
                      <div className="flex items-center gap-2">
                        {testResults.backend && (
                          <Badge className="bg-green-600 text-green-100">
                            <CheckCircle className="h-3 w-3 mr-1" />
                            Conectado
                          </Badge>
                        )}
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => testConnection('backend')}
                          disabled={testing.backend}
                          className="border-slate-600 bg-slate-600 text-slate-200 hover:bg-slate-500"
                        >
                          {testing.backend ? (
                            <RefreshCw className="h-4 w-4 animate-spin" />
                          ) : (
                            'Probar'
                          )}
                        </Button>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="backend_url" className="text-slate-200">URL del Backend</Label>
                        <Input
                          id="backend_url"
                          value={config.backend_url}
                          onChange={(e) => handleInputChange('backend_url', e.target.value)}
                          className="bg-slate-600 border-slate-500 text-slate-100"
                          placeholder="http://localhost:8000"
                        />
                        <p className="text-xs text-slate-400 mt-1">
                          URL base del backend (incluye /doc para documentación)
                        </p>
                      </div>
                      <div>
                        <Label htmlFor="backend_api_key" className="text-slate-200">API Key</Label>
                        <div className="flex gap-2">
                          <div className="relative flex-1">
                            <Input
                              id="backend_api_key"
                              type={showKeys.backend ? "text" : "password"}
                              value={config.backend_api_key}
                              onChange={(e) => handleInputChange('backend_api_key', e.target.value)}
                              className="bg-slate-600 border-slate-500 text-slate-100 pr-20"
                              placeholder="API Key del backend"
                            />
                            <div className="absolute right-2 top-1/2 -translate-y-1/2 flex gap-1">
                              <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                onClick={() => toggleShowKey('backend')}
                                className="h-6 w-6 p-0 text-slate-400 hover:text-slate-200"
                              >
                                {showKeys.backend ? <EyeOff className="h-3 w-3" /> : <Eye className="h-3 w-3" />}
                              </Button>
                              {config.backend_api_key && (
                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => copyToClipboard(config.backend_api_key)}
                                  className="h-6 w-6 p-0 text-slate-400 hover:text-slate-200"
                                >
                                  <Copy className="h-3 w-3" />
                                </Button>
                              )}
                            </div>
                          </div>
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => handleInputChange('backend_api_key', generateApiKey())}
                            className="border-slate-600 bg-slate-600 text-slate-200 hover:bg-slate-500"
                          >
                            Generar
                          </Button>
                        </div>
                        <p className="text-xs text-slate-400 mt-1">
                          Esta key se usará para todas las operaciones (GET, POST, PUT, DELETE)
                        </p>
                      </div>
                    </div>

                    {/* Session Duration */}
                    <div>
                      <Label htmlFor="admin_session_duration" className="text-slate-200">
                        Duración de Sesión Admin (horas)
                      </Label>
                      <Input
                        id="admin_session_duration"
                        type="number"
                        min="1"
                        max="168"
                        value={config.admin_session_duration}
                        onChange={(e) => handleInputChange('admin_session_duration', parseInt(e.target.value) || 24)}
                        className="bg-slate-600 border-slate-500 text-slate-100"
                      />
                      <p className="text-xs text-slate-400 mt-1">
                        Tiempo antes de que expire la sesión del administrador
                      </p>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Automation Tab */}
              <TabsContent value="automation" className="space-y-4">
                {/* N8N Configuration */}
                <Card className="bg-slate-700 border-slate-600">
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <div>
                        <CardTitle className="text-slate-100 flex items-center gap-2">
                          <Settings className="h-4 w-4" />
                          N8N Automation
                        </CardTitle>
                        <CardDescription className="text-slate-400">
                          Configuración de carpetas de automatización
                        </CardDescription>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <Label htmlFor="n8n_folder" className="text-slate-200">Carpeta N8N</Label>
                      <Input
                        id="n8n_folder"
                        value={config.n8n_folder}
                        onChange={(e) => handleInputChange('n8n_folder', e.target.value)}
                        className="bg-slate-600 border-slate-500 text-slate-100"
                        placeholder="Ej: empresa-operativa"
                      />
                      <p className="text-xs text-slate-400 mt-1">
                        Nombre de la carpeta en N8N para organizar los workflows de automatización
                      </p>
                    </div>

                    <div className="p-4 bg-blue-900/20 border border-blue-700 rounded-lg">
                      <div className="flex items-center gap-2 text-blue-200 mb-2">
                        <Server className="h-4 w-4" />
                        <span className="font-medium">Información sobre WAHA</span>
                      </div>
                      <p className="text-sm text-blue-100">
                        WAHA (WhatsApp Business API) se configura directamente en cada clínica desde el frontend. 
                        Cada empresa gestiona su propia conexión de WhatsApp desde su dashboard.
                      </p>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>

            {/* Actions */}
            <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-600">
              <Button 
                variant="outline" 
                onClick={onClose}
                className="border-slate-600 bg-slate-600 text-slate-200 hover:bg-slate-500"
              >
                Cancelar
              </Button>
              <Button 
                onClick={saveConfiguration}
                disabled={saving}
                className="bg-medical-500 hover:bg-medical-600"
              >
                {saving ? (
                  <>
                    <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                    Guardando...
                  </>
                ) : (
                  'Guardar Configuración'
                )}
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}