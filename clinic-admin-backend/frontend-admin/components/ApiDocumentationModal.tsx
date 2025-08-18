import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Copy, 
  FileText, 
  Building2, 
  Users, 
  Stethoscope, 
  HelpCircle, 
  CheckCircle,
  ExternalLink
} from 'lucide-react';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';

interface ApiDocumentationModalProps {
  open: boolean;
  onClose: () => void;
  clinicId?: string;
  clinicName?: string;
}

interface ApiEndpoint {
  id: string;
  name: string;
  description: string;
  method: 'GET' | 'POST' | 'PUT' | 'DELETE';
  endpoint: string;
  curl: string;
  category: string;
  parameters?: string[];
  example_response?: string;
}

const API_ENDPOINTS: ApiEndpoint[] = [
  // Gestión de Clínicas
  {
    id: 'get-clinic-services',
    name: 'Obtener Información Completa de Clínica',
    description: 'Obtiene toda la información de la clínica incluyendo servicios, horarios, contacto, profesionales y especialidades. Endpoint principal para N8N.',
    method: 'GET',
    endpoint: '/api/clinics/{clinic_id}/services',
    category: 'Clínicas',
    parameters: ['clinic_id: ID de la clínica'],
    curl: `curl -X 'GET' \\
  'http://pampaservers.com:60519/api/clinics/{clinic_id}/services' \\
  -H 'accept: application/json' \\
  -H 'X-API-Key: test123456'`,
    example_response: '{"clinic_id": "...", "clinic_name": "...", "services": [...], "schedule": {...}, "contact_info": {...}}'
  },
  {
    id: 'get-clinic',
    name: 'Obtener Datos Básicos de Clínica',
    description: 'Obtiene información básica de una clínica específica sin incluir servicios ni horarios.',
    method: 'GET',
    endpoint: '/api/clinics/{clinic_id}',
    category: 'Clínicas',
    parameters: ['clinic_id: ID de la clínica'],
    curl: `curl -X 'GET' \\
  'http://pampaservers.com:60519/api/clinics/{clinic_id}' \\
  -H 'accept: application/json' \\
  -H 'X-API-Key: test123456'`
  },
  {
    id: 'update-clinic-services',
    name: 'Actualizar Servicios de Clínica',
    description: 'Reemplaza todos los servicios médicos de una clínica con la nueva lista proporcionada.',
    method: 'PUT',
    endpoint: '/api/clinics/{clinic_id}/services',
    category: 'Clínicas',
    parameters: ['clinic_id: ID de la clínica', 'services: Array de servicios'],
    curl: `curl -X 'PUT' \\
  'http://pampaservers.com:60519/api/clinics/{clinic_id}/services' \\
  -H 'accept: application/json' \\
  -H 'X-API-Key: test123456' \\
  -H 'Content-Type: application/json' \\
  -d '[{
    "service_type": "Consulta General",
    "description": "Consulta médica general",
    "base_price": 50000,
    "currency": "COP",
    "duration_minutes": 30,
    "category": "Medicina General",
    "requires_appointment": true,
    "is_active": true
  }]'`
  },
  {
    id: 'update-clinic-schedule',
    name: 'Actualizar Horarios de Clínica',
    description: 'Actualiza los horarios de atención de la clínica incluyendo días laborables, horarios cortados y descansos.',
    method: 'PUT',
    endpoint: '/api/clinics/{clinic_id}/schedule',
    category: 'Clínicas',
    parameters: ['clinic_id: ID de la clínica', 'schedule: Configuración de horarios'],
    curl: `curl -X 'PUT' \\
  'http://pampaservers.com:60519/api/clinics/{clinic_id}/schedule' \\
  -H 'accept: application/json' \\
  -H 'X-API-Key: test123456' \\
  -H 'Content-Type: application/json' \\
  -d '{
    "timezone": "America/Bogota",
    "working_hours": [
      {"day_of_week": "monday", "start_time": "09:00", "end_time": "13:00", "is_available": true},
      {"day_of_week": "monday", "start_time": "16:00", "end_time": "20:00", "is_available": true}
    ],
    "break_start": "13:00",
    "break_end": "16:00"
  }'`
  },
  {
    id: 'update-clinic-contact',
    name: 'Actualizar Información de Contacto',
    description: 'Actualiza la información de contacto de la clínica incluyendo teléfonos, email, dirección y website.',
    method: 'PUT',
    endpoint: '/api/clinics/{clinic_id}/contact-info',
    category: 'Clínicas',
    parameters: ['clinic_id: ID de la clínica', 'contact_info: Información de contacto'],
    curl: `curl -X 'PUT' \\
  'http://pampaservers.com:60519/api/clinics/{clinic_id}/contact-info' \\
  -H 'accept: application/json' \\
  -H 'X-API-Key: test123456' \\
  -H 'Content-Type: application/json' \\
  -d '{
    "phone": "+573001234567",
    "whatsapp": "+573001234567",
    "email": "contacto@clinica.com",
    "address": "Calle 123 #45-67",
    "website": "https://clinica.com",
    "maps_url": "https://maps.google.com/..."
  }'`
  },
  {
    id: 'initialize-clinic-services',
    name: 'Inicializar Servicios por Defecto',
    description: 'Configura una clínica nueva con servicios médicos estándar, horarios y especialidades predeterminados.',
    method: 'POST',
    endpoint: '/api/clinics/{clinic_id}/services/initialize',
    category: 'Clínicas',
    parameters: ['clinic_id: ID de la clínica'],
    curl: `curl -X 'POST' \\
  'http://pampaservers.com:60519/api/clinics/{clinic_id}/services/initialize' \\
  -H 'accept: application/json' \\
  -H 'X-API-Key: test123456'`
  },
  
  // Gestión de Pacientes
  {
    id: 'list-clinic-patients',
    name: 'Listar Pacientes de Clínica',
    description: 'Obtiene la lista de todos los pacientes registrados en una clínica específica.',
    method: 'GET',
    endpoint: '/api/patients/clinic/{clinic_id}',
    category: 'Pacientes',
    parameters: ['clinic_id: ID de la clínica'],
    curl: `curl -X 'GET' \\
  'http://pampaservers.com:60519/api/patients/clinic/{clinic_id}' \\
  -H 'accept: application/json' \\
  -H 'X-API-Key: test123456'`
  },
  {
    id: 'search-patient-dni',
    name: 'Buscar Paciente por DNI',
    description: 'Busca un paciente específico utilizando su número de documento de identidad.',
    method: 'GET',
    endpoint: '/api/patients/search/by-dni',
    category: 'Pacientes',
    parameters: ['dni: Número de documento'],
    curl: `curl -X 'GET' \\
  'http://pampaservers.com:60519/api/patients/search/by-dni?dni=12345678' \\
  -H 'accept: application/json' \\
  -H 'X-API-Key: test123456'`
  },
  {
    id: 'create-patient',
    name: 'Crear Nuevo Paciente',
    description: 'Registra un nuevo paciente en el sistema con toda su información personal y médica.',
    method: 'POST',
    endpoint: '/api/patients',
    category: 'Pacientes',
    parameters: ['patient_data: Datos del paciente'],
    curl: `curl -X 'POST' \\
  'http://pampaservers.com:60519/api/patients' \\
  -H 'accept: application/json' \\
  -H 'X-API-Key: test123456' \\
  -H 'Content-Type: application/json' \\
  -d '{
    "first_name": "Juan",
    "last_name": "Pérez",
    "dni": "12345678",
    "email": "juan@email.com",
    "cell_phone": "+573001234567",
    "address": "Calle 123",
    "birth_date": "1990-01-01",
    "clinic_id": "clinic-id-here"
  }'`
  },
  {
    id: 'get-patient-history',
    name: 'Obtener Historial de Paciente',
    description: 'Obtiene el historial médico completo de un paciente incluyendo citas, visitas y tratamientos.',
    method: 'GET',
    endpoint: '/api/patients/{patient_id}/history',
    category: 'Pacientes',
    parameters: ['patient_id: ID del paciente'],
    curl: `curl -X 'GET' \\
  'http://pampaservers.com:60519/api/patients/{patient_id}/history' \\
  -H 'accept: application/json' \\
  -H 'X-API-Key: test123456'`
  },
  {
    id: 'create-appointment',
    name: 'Crear Cita para Paciente',
    description: 'Programa una nueva cita médica para un paciente en una clínica específica.',
    method: 'POST',
    endpoint: '/api/patients/clinic/{clinic_id}/appointment',
    category: 'Pacientes',
    parameters: ['clinic_id: ID de la clínica', 'appointment_data: Datos de la cita'],
    curl: `curl -X 'POST' \\
  'http://pampaservers.com:60519/api/patients/clinic/{clinic_id}/appointment' \\
  -H 'accept: application/json' \\
  -H 'X-API-Key: test123456' \\
  -H 'Content-Type: application/json' \\
  -d '{
    "patient_id": "patient-id-here",
    "professional_id": "professional-id-here",
    "appointment_date": "2024-01-15",
    "appointment_time": "10:00",
    "service_type": "Consulta General",
    "notes": "Consulta de rutina"
  }'`
  },

  // Gestión de Profesionales
  {
    id: 'list-clinic-professionals',
    name: 'Listar Profesionales de Clínica',
    description: 'Obtiene la lista de todos los profesionales médicos registrados en una clínica.',
    method: 'GET',
    endpoint: '/api/professionals/clinic/{clinic_id}',
    category: 'Profesionales',
    parameters: ['clinic_id: ID de la clínica'],
    curl: `curl -X 'GET' \\
  'http://pampaservers.com:60519/api/professionals/clinic/{clinic_id}' \\
  -H 'accept: application/json' \\
  -H 'X-API-Key: test123456'`
  },
  {
    id: 'get-professional-stats',
    name: 'Estadísticas de Profesional',
    description: 'Obtiene estadísticas y métricas de rendimiento de los profesionales de una clínica.',
    method: 'GET',
    endpoint: '/api/professionals/clinic/{clinic_id}/stats',
    category: 'Profesionales',
    parameters: ['clinic_id: ID de la clínica'],
    curl: `curl -X 'GET' \\
  'http://pampaservers.com:60519/api/professionals/clinic/{clinic_id}/stats' \\
  -H 'accept: application/json' \\
  -H 'X-API-Key: test123456'`
  },

  // Endpoints Públicos (sin autenticación)
  {
    id: 'list-public-clinics',
    name: 'Listar Clínicas Públicas',
    description: 'Obtiene una lista de clínicas activas y disponibles públicamente (sin autenticación).',
    method: 'GET',
    endpoint: '/api/clinics/public',
    category: 'Público',
    parameters: ['limit: Número máximo de resultados (opcional)'],
    curl: `curl -X 'GET' \\
  'http://pampaservers.com:60519/api/clinics/public?limit=10' \\
  -H 'accept: application/json'`
  },
  {
    id: 'list-public-plans',
    name: 'Planes de Suscripción Públicos',
    description: 'Obtiene los planes de suscripción disponibles públicamente (sin autenticación).',
    method: 'GET',
    endpoint: '/api/subscription-plans/public',
    category: 'Público',
    parameters: [],
    curl: `curl -X 'GET' \\
  'http://pampaservers.com:60519/api/subscription-plans/public' \\
  -H 'accept: application/json'`
  }
];

const CATEGORIES = ['Clínicas', 'Pacientes', 'Profesionales', 'Público'];

export default function ApiDocumentationModal({ open, onClose, clinicId, clinicName }: ApiDocumentationModalProps) {
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [activeCategory, setActiveCategory] = useState('Clínicas');

  // Function to replace clinic_id placeholder with actual clinic ID
  const replacePlaceholders = (text: string): string => {
    if (!clinicId) return text;
    return text.replace(/{clinic_id}/g, clinicId);
  };

  const copyToClipboard = async (text: string, id: string) => {
    try {
      const processedText = replacePlaceholders(text);
      
      // Try modern clipboard API first
      if (navigator.clipboard && navigator.clipboard.writeText) {
        await navigator.clipboard.writeText(processedText);
      } else {
        // Fallback for older browsers or non-HTTPS contexts
        const textArea = document.createElement('textarea');
        textArea.value = processedText;
        textArea.style.position = 'fixed';
        textArea.style.left = '-999999px';
        textArea.style.top = '-999999px';
        document.body.appendChild(textArea);
        textArea.focus();
        textArea.select();
        document.execCommand('copy');
        document.body.removeChild(textArea);
      }
      
      setCopiedId(id);
      setTimeout(() => setCopiedId(null), 2000);
    } catch (err) {
      console.error('Error copying to clipboard:', err);
      // Show user-friendly error message
      alert('Error al copiar al portapapeles. Por favor, copia manualmente el comando.');
    }
  };

  const getMethodColor = (method: string) => {
    switch (method) {
      case 'GET': return 'bg-green-600 text-green-100';
      case 'POST': return 'bg-blue-600 text-blue-100';
      case 'PUT': return 'bg-orange-600 text-orange-100';
      case 'DELETE': return 'bg-red-600 text-red-100';
      default: return 'bg-gray-600 text-gray-100';
    }
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'Clínicas': return <Building2 className="h-4 w-4" />;
      case 'Pacientes': return <Users className="h-4 w-4" />;
      case 'Profesionales': return <Stethoscope className="h-4 w-4" />;
      case 'Público': return <ExternalLink className="h-4 w-4" />;
      default: return <FileText className="h-4 w-4" />;
    }
  };

  const filteredEndpoints = API_ENDPOINTS.filter(endpoint => 
    endpoint.category === activeCategory
  );

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-6xl bg-slate-800 border-slate-700 text-slate-100 max-h-[90vh] overflow-hidden">
        <DialogHeader>
          <DialogTitle className="text-white flex items-center gap-2">
            <FileText className="h-5 w-5 text-blue-400" />
            Documentación API para N8N
            {clinicName && (
              <span className="text-medical-400 text-sm">
                - {clinicName}
              </span>
            )}
          </DialogTitle>
          <DialogDescription className="text-slate-400">
            Ejemplos de curl listos para copiar y pegar en N8N. Todos los endpoints soportan autenticación con X-API-Key.
            {clinicId && (
              <span className="block mt-1 text-xs">
                <strong>Clínica ID:</strong> <code className="bg-slate-700 px-1 rounded">{clinicId}</code>
              </span>
            )}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* API Keys Info */}
          <Card className="bg-slate-700 border-slate-600 p-4">
            <CardHeader className="pb-2 pt-3">
              <CardTitle className="text-slate-200 text-sm flex items-center gap-2 -pt-1">
                🔑 API Keys Disponibles
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger>
                      <HelpCircle className="h-4 w-4 text-slate-400" />
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Usa estas claves en el header X-API-Key para autenticarte</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                <div className="bg-slate-800 p-2 rounded font-mono text-sm">
                  <span className="text-slate-400">Desarrollo:</span> <span className="text-green-400">test123456</span>
                </div>
                <div className="bg-slate-800 p-2 rounded font-mono text-sm">
                  <span className="text-slate-400">Producción:</span> <span className="text-orange-400">pampaserver2025enservermuA!</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Categories Tabs */}
          <Tabs value={activeCategory} onValueChange={setActiveCategory}>
            <TabsList className="grid w-full grid-cols-4 bg-slate-700">
              {CATEGORIES.map((category) => (
                <TabsTrigger 
                  key={category} 
                  value={category} 
                  className="text-slate-200 flex items-center gap-2"
                >
                  {getCategoryIcon(category)}
                  {category}
                </TabsTrigger>
              ))}
            </TabsList>

            {CATEGORIES.map((category) => (
              <TabsContent key={category} value={category} className="space-y-4 max-h-[40vh] overflow-y-auto">
                {filteredEndpoints.map((endpoint) => (
                  <Card key={endpoint.id} className="bg-slate-700 border-slate-600">
                    <CardHeader className="pb-3">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <Badge className={`${getMethodColor(endpoint.method)} font-mono text-xs`}>
                              {endpoint.method}
                            </Badge>
                            <CardTitle className="text-slate-200 text-lg flex items-center gap-2">
                              {endpoint.name}
                              <TooltipProvider>
                                <Tooltip>
                                  <TooltipTrigger>
                                    <HelpCircle className="h-4 w-4 text-slate-400 hover:text-slate-200" />
                                  </TooltipTrigger>
                                  <TooltipContent className="max-w-md">
                                    <p>{endpoint.description}</p>
                                  </TooltipContent>
                                </Tooltip>
                              </TooltipProvider>
                            </CardTitle>
                          </div>
                          <div className="font-mono text-sm text-slate-300 bg-slate-800 p-2 rounded">
                            {replacePlaceholders(endpoint.endpoint)}
                          </div>
                          {endpoint.parameters && (
                            <div className="mt-2">
                              <span className="text-xs text-slate-400">Parámetros: </span>
                              {endpoint.parameters.map((param, idx) => (
                                <Badge key={`${endpoint.id}-param-${idx}-${param.split(':')[0]}`} variant="outline" className="text-xs mr-1 border-slate-500 text-slate-300">
                                  {param}
                                </Badge>
                              ))}
                            </div>
                          )}
                        </div>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => copyToClipboard(endpoint.curl, endpoint.id)}
                          className="ml-4 border-slate-500 text-slate-200 hover:bg-slate-600"
                        >
                          {copiedId === endpoint.id ? (
                            <CheckCircle className="h-4 w-4 text-green-400" />
                          ) : (
                            <Copy className="h-4 w-4" />
                          )}
                          {copiedId === endpoint.id ? 'Copiado!' : 'Copiar'}
                        </Button>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="bg-slate-900 p-4 rounded-lg font-mono text-sm text-slate-200 overflow-x-auto">
                        <pre className="whitespace-pre-wrap">{replacePlaceholders(endpoint.curl)}</pre>
                      </div>
                      {endpoint.example_response && (
                        <div className="mt-3">
                          <span className="text-xs text-slate-400 mb-2 block">Ejemplo de respuesta:</span>
                          <div className="bg-slate-800 p-2 rounded text-xs font-mono text-slate-300">
                            {endpoint.example_response}
                          </div>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </TabsContent>
            ))}
          </Tabs>
        </div>

        <DialogFooter>
          <Button onClick={onClose} className="bg-slate-600 hover:bg-slate-500 text-slate-200">
            Cerrar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}