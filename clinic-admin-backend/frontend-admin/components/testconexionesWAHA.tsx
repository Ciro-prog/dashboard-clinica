import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

const WhatsAppWAHA = () => {
  const [results, setResults] = useState({});
  const [manualApiKey, setManualApiKey] = useState('pampaserver2025enservermuA!');
  const [isLoading, setIsLoading] = useState(false);

  // TEST 1: Sin API Key
  const testWithoutApiKey = async () => {
    setIsLoading(true);
    try {
      console.log('🧪 TEST 1: Sin API Key');
      
      const response = await fetch('/api/waha/sessions', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json'
        }
      });

      const result = {
        status: response.status,
        statusText: response.statusText,
        body: await response.text()
      };

      setResults(prev => ({ ...prev, withoutApiKey: result }));
      console.log('📊 TEST 1 resultado:', result);
    } catch (error) {
      setResults(prev => ({ ...prev, withoutApiKey: { error: error.message } }));
    }
    setIsLoading(false);
  };

  // TEST 2: Con API Key manual
  const testWithManualApiKey = async () => {
    setIsLoading(true);
    try {
      console.log('🧪 TEST 2: Con API Key manual:', manualApiKey);
      
      const response = await fetch('/api/waha/sessions', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'X-API-Key': manualApiKey
        }
      });

      const result = {
        status: response.status,
        statusText: response.statusText,
        body: await response.text(),
        sentApiKey: manualApiKey
      };

      setResults(prev => ({ ...prev, withManualApiKey: result }));
      console.log('📊 TEST 2 resultado:', result);
    } catch (error) {
      setResults(prev => ({ ...prev, withManualApiKey: { error: error.message } }));
    }
    setIsLoading(false);
  };

  // TEST 3: Diferentes variaciones del API Key
  const testApiKeyVariations = async () => {
    setIsLoading(true);
    const variations = [
      'pampaserver2025enservermuA!',  // EN minúscula
      'pampaserver2025ENservermuA!',  // EN mayúscula
      'pampaserver2025onservermuA!',  // ON minúscula
      'pampaserver2025ONservermuA!',  // ON mayúscula
    ];

    const variationResults = {};

    for (const apiKey of variations) {
      try {
        console.log(`🧪 TEST 3: Probando API Key: ${apiKey}`);
        
        const response = await fetch('/api/waha/sessions', {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            'X-API-Key': apiKey
          }
        });

        variationResults[apiKey] = {
          status: response.status,
          statusText: response.statusText,
          body: await response.text()
        };

        console.log(`📊 ${apiKey}: ${response.status}`);
        
        // Si encontramos uno que funciona, podemos parar
        if (response.ok) {
          console.log(`✅ API Key correcto encontrado: ${apiKey}`);
          break;
        }
      } catch (error) {
        variationResults[apiKey] = { error: error.message };
      }
    }

    setResults(prev => ({ ...prev, variations: variationResults }));
    setIsLoading(false);
  };

  // TEST 4: Verificar headers que llegan al servidor
  const testHeaderDebug = async () => {
    setIsLoading(true);
    try {
      console.log('🧪 TEST 4: Debug de headers');
      
      // Intentar con múltiples headers para ver cuál espera el servidor
      const response = await fetch('/api/waha/sessions', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'X-API-Key': manualApiKey,
          'Authorization': `Bearer ${manualApiKey}`,
          'api-key': manualApiKey,
          'X-Auth-Token': manualApiKey
        }
      });

      const result = {
        status: response.status,
        statusText: response.statusText,
        responseHeaders: Object.fromEntries(response.headers.entries()),
        body: await response.text()
      };

      setResults(prev => ({ ...prev, headerDebug: result }));
      console.log('📊 TEST 4 resultado:', result);
    } catch (error) {
      setResults(prev => ({ ...prev, headerDebug: { error: error.message } }));
    }
    setIsLoading(false);
  };

  // TEST 5: Probar endpoint de health/status
  const testHealthEndpoint = async () => {
    setIsLoading(true);
    try {
      console.log('🧪 TEST 5: Health endpoint');
      
      const endpoints = ['/health', '/status', '/', '/ping'];
      const healthResults = {};

      for (const endpoint of endpoints) {
        try {
          const response = await fetch(`/api/waha${endpoint}`, {
            method: 'GET',
            headers: { 'Content-Type': 'application/json' }
          });

          healthResults[endpoint] = {
            status: response.status,
            body: await response.text()
          };
        } catch (error) {
          healthResults[endpoint] = { error: error.message };
        }
      }

      setResults(prev => ({ ...prev, health: healthResults }));
      console.log('📊 TEST 5 resultado:', healthResults);
    } catch (error) {
      setResults(prev => ({ ...prev, health: { error: error.message } }));
    }
    setIsLoading(false);
  };

  // TEST 6: Verificar si el problema es específico del endpoint sessions
  const testDifferentEndpoints = async () => {
    setIsLoading(true);
    const endpoints = [
      '/sessions',
      '/auth/qr', 
      '/version',
      '/screenshots'
    ];

    const endpointResults = {};

    for (const endpoint of endpoints) {
      try {
        console.log(`🧪 TEST 6: Endpoint ${endpoint}`);
        
        const response = await fetch(`/api/waha${endpoint}`, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            'X-API-Key': manualApiKey
          }
        });

        endpointResults[endpoint] = {
          status: response.status,
          statusText: response.statusText,
          body: await response.text()
        };
      } catch (error) {
        endpointResults[endpoint] = { error: error.message };
      }
    }

    setResults(prev => ({ ...prev, endpoints: endpointResults }));
    setIsLoading(false);
  };

  const runAllTests = async () => {
    console.log('🚀 Ejecutando diagnóstico completo de producción...');
    setResults({});
    
    await testWithoutApiKey();
    await new Promise(resolve => setTimeout(resolve, 500));
    
    await testWithManualApiKey();
    await new Promise(resolve => setTimeout(resolve, 500));
    
    await testApiKeyVariations();
    await new Promise(resolve => setTimeout(resolve, 500));
    
    await testHeaderDebug();
    await new Promise(resolve => setTimeout(resolve, 500));
    
    await testHealthEndpoint();
    await new Promise(resolve => setTimeout(resolve, 500));
    
    await testDifferentEndpoints();
    
    console.log('✅ Diagnóstico completo terminado');
  };

  return (
    <div className="space-y-6">
      <Card className="bg-red-50 border-red-200">
        <CardHeader>
          <CardTitle className="text-red-800">🚨 WAHA Production Debugger</CardTitle>
          <CardDescription>
            Diagnóstico específico para error 401 en producción
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="apikey">API Key para probar manualmente:</Label>
            <Input
              id="apikey"
              value={manualApiKey}
              onChange={(e) => setManualApiKey(e.target.value)}
              placeholder="pampaserver2025enservermuA!"
            />
          </div>
          
          <Button 
            onClick={runAllTests} 
            className="w-full bg-red-600 hover:bg-red-700"
            disabled={isLoading}
          >
            {isLoading ? '🔄 Ejecutando...' : '🧪 Ejecutar Diagnóstico Completo'}
          </Button>
          
          <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
            <Button onClick={testWithoutApiKey} variant="outline" size="sm" disabled={isLoading}>
              1. Sin API Key
            </Button>
            <Button onClick={testWithManualApiKey} variant="outline" size="sm" disabled={isLoading}>
              2. API Key Manual
            </Button>
            <Button onClick={testApiKeyVariations} variant="outline" size="sm" disabled={isLoading}>
              3. Variaciones
            </Button>
            <Button onClick={testHeaderDebug} variant="outline" size="sm" disabled={isLoading}>
              4. Headers Debug
            </Button>
            <Button onClick={testHealthEndpoint} variant="outline" size="sm" disabled={isLoading}>
              5. Health Check
            </Button>
            <Button onClick={testDifferentEndpoints} variant="outline" size="sm" disabled={isLoading}>
              6. Endpoints
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Análisis automático */}
      {Object.keys(results).length > 0 && (
        <Card className="bg-blue-50 border-blue-200">
          <CardHeader>
            <CardTitle>🔍 Análisis Automático</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 text-sm">
              {/* Verificar si alguna variación del API key funcionó */}
              {results.variations && (
                <div>
                  {Object.entries(results.variations).map(([apiKey, result]) => {
                    if (result.status === 200) {
                      return (
                        <Alert key={apiKey} className="border-green-200 bg-green-50">
                          <AlertDescription className="text-green-700">
                            ✅ <strong>API Key correcto encontrado:</strong> <code>{apiKey}</code>
                            <br />
                            <strong>Acción:</strong> Actualiza tu vercel.json con este API key
                          </AlertDescription>
                        </Alert>
                      );
                    }
                    return null;
                  })}
                  
                  {/* Si ninguna variación funcionó */}
                  {!Object.values(results.variations).some(r => r.status === 200) && (
                    <Alert className="border-yellow-200 bg-yellow-50">
                      <AlertDescription className="text-yellow-700">
                        ⚠️ <strong>Ninguna variación del API key funcionó</strong>
                        <br />
                        Esto sugiere que:
                        <br />
                        • El API key en tu servidor WAHA es diferente
                        <br />
                        • O el servidor WAHA espera un formato diferente
                      </AlertDescription>
                    </Alert>
                  )}
                </div>
              )}

              {/* Verificar si el servidor responde sin API key */}
              {results.withoutApiKey && results.withoutApiKey.status === 401 && (
                <Alert className="border-blue-200 bg-blue-50">
                  <AlertDescription className="text-blue-700">
                    ℹ️ <strong>Servidor WAHA funcionando correctamente</strong>
                    <br />
                    El problema es específicamente de autenticación
                  </AlertDescription>
                </Alert>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Resultados detallados */}
      {Object.keys(results).length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>📊 Resultados Detallados</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {Object.entries(results).map(([testName, result]) => (
                <div key={testName} className="border p-3 rounded">
                  <h4 className="font-medium mb-2 capitalize">
                    {testName.replace(/([A-Z])/g, ' $1').trim()}
                  </h4>
                  <pre className="text-xs bg-gray-100 p-2 rounded overflow-auto max-h-40">
                    {JSON.stringify(result, null, 2)}
                  </pre>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Instrucciones de corrección */}
      <Card className="bg-green-50 border-green-200">
        <CardHeader>
          <CardTitle>🛠️ Cómo corregir el problema</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3 text-sm">
            <Alert>
              <AlertDescription>
                <strong>1. Si encontramos el API key correcto arriba:</strong>
                <br />
                Actualiza tu <code>vercel.json</code> con el API key que funcionó
              </AlertDescription>
            </Alert>
            
            <Alert>
              <AlertDescription>
                <strong>2. Si ningún API key funcionó:</strong>
                <br />
                • Verifica el API key configurado en tu servidor WAHA
                <br />
                • Conecta por SSH a <code>pampaservers.com</code>
                <br />
                • Revisa la configuración de WAHA en puerto 60513
              </AlertDescription>
            </Alert>
            
            <Alert>
              <AlertDescription>
                <strong>3. Comandos para verificar en el servidor:</strong>
                <br />
                <code>docker ps | grep waha</code> - Ver contenedor WAHA
                <br />
                <code>docker logs [container-id]</code> - Ver logs de WAHA
                <br />
                <code>curl -H "X-API-Key: TU_API_KEY" http://localhost:60513/sessions</code>
              </AlertDescription>
            </Alert>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default WhatsAppWAHA;
