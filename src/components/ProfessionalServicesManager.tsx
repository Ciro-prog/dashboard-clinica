import React, { useState, useCallback, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  Plus, 
  DollarSign, 
  Clock, 
  Edit, 
  Trash2, 
  Stethoscope,
  Loader2,
  Save,
  X
} from 'lucide-react';

interface ProfessionalService {
  id: string;
  service_type: string;
  description: string;
  price: number;
  duration_minutes?: number;
  is_active: boolean;
}

interface ProfessionalServicesManagerProps {
  professionalId: string;
  services: ProfessionalService[];
  onServicesUpdate: (services: ProfessionalService[]) => void;
}

const commonServiceTypes = [
  'Consulta General',
  'Consulta de Control',
  'Implante Dental',
  'Limpieza Dental',
  'Ortodoncia',
  'Endodoncia',
  'Cirugía Oral',
  'Estética Dental',
  'Prótesis',
  'Radiografía',
  'Urgencia',
  'Evaluación Inicial'
];

export default function ProfessionalServicesManager({ 
  professionalId, 
  services, 
  onServicesUpdate 
}: ProfessionalServicesManagerProps) {
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingService, setEditingService] = useState<ProfessionalService | null>(null);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [showCustomType, setShowCustomType] = useState(false);
  const [forceRender, setForceRender] = useState(0);
  const deletingRef = useRef<string | null>(null);
  const servicesRef = useRef(services);
  
  // Update services ref when services prop changes
  React.useEffect(() => {
    servicesRef.current = services;
  }, [services]);
  
  const [formData, setFormData] = useState({
    service_type: '',
    description: '',
    price: '',
    duration_minutes: '',
    is_active: true
  });

  const generateServiceId = (serviceType: string): string => {
    const typeSlug = serviceType
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9]/g, '')
      .substring(0, 10);
    
    const timestamp = Date.now().toString().slice(-6);
    return `srv-${typeSlug}-${timestamp}`;
  };

  const handleInputChange = (field: string, value: string | boolean) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  // Filtrar tipos de servicios basado en búsqueda
  const filteredServiceTypes = commonServiceTypes.filter(type =>
    type.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Filtrar servicios existentes basado en búsqueda
  const filteredServices = services.filter(service =>
    service.service_type.toLowerCase().includes(searchTerm.toLowerCase()) ||
    service.description.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleAddService = () => {
    setEditingService(null);
    setFormData({
      service_type: '',
      description: '',
      price: '',
      duration_minutes: '',
      is_active: true
    });
    setShowCustomType(false);
    setShowAddForm(true);
  };

  const handleEditService = (service: ProfessionalService) => {
    setEditingService(service);
    setFormData({
      service_type: service.service_type,
      description: service.description,
      price: service.price.toString(),
      duration_minutes: service.duration_minutes?.toString() || '',
      is_active: service.is_active
    });
    setShowAddForm(true);
  };

  const handleSubmitService = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      setSaving(true);
      
      const serviceData: ProfessionalService = {
        id: editingService?.id || generateServiceId(formData.service_type),
        service_type: formData.service_type,
        description: formData.description,
        price: parseFloat(formData.price),
        duration_minutes: formData.duration_minutes ? parseInt(formData.duration_minutes) : undefined,
        is_active: formData.is_active
      };

      let updatedServices: ProfessionalService[];
      
      if (editingService) {
        // Actualizar servicio existente
        updatedServices = services.map(s => 
          s.id === editingService.id ? serviceData : s
        );
      } else {
        // Agregar nuevo servicio
        updatedServices = [...services, serviceData];
      }

      onServicesUpdate(updatedServices);
      
      // Resetear formulario
      setShowAddForm(false);
      setEditingService(null);
      setFormData({
        service_type: '',
        description: '',
        price: '',
        duration_minutes: '',
        is_active: true
      });

    } catch (err) {
      console.error('❌ Error guardando servicio:', err);
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteService = useCallback(async (serviceId: string) => {
    // Prevent concurrent deletions
    if (deletingRef.current || deleting) return;
    
    const service = servicesRef.current.find(s => s.id === serviceId);
    if (!service) return;
    
    if (confirm(`¿Eliminar el servicio "${service.service_type}"?`)) {
      try {
        deletingRef.current = serviceId;
        setDeleting(serviceId);
        
        // Force clear search and wait for DOM to stabilize
        setSearchTerm('');
        
        // Use requestAnimationFrame to ensure DOM updates are processed
        await new Promise(resolve => {
          requestAnimationFrame(() => {
            requestAnimationFrame(() => {
              resolve(void 0);
            });
          });
        });
        
        // Filter from the most current services data
        const updatedServices = servicesRef.current.filter(s => s.id !== serviceId);
        
        // Force re-render to prevent stale DOM references
        setForceRender(prev => prev + 1);
        
        onServicesUpdate(updatedServices);
        
      } catch (error) {
        console.error('Error deleting service:', error);
      } finally {
        deletingRef.current = null;
        setDeleting(null);
      }
    }
  }, [onServicesUpdate, deleting]);

  const handleToggleServiceStatus = (serviceId: string) => {
    const updatedServices = services.map(s => 
      s.id === serviceId ? { ...s, is_active: !s.is_active } : s
    );
    onServicesUpdate(updatedServices);
  };

  return (
    <div className="space-y-4">
      {/* Header con búsqueda y botón agregar */}
      <div className="flex items-center justify-between">
        <div>
          <h4 className="text-lg font-medium text-slate-200">Servicios y Tarifas</h4>
          <p className="text-sm text-slate-400">
            Configura los diferentes tipos de consulta y sus precios
          </p>
        </div>
        <Button
          onClick={handleAddService}
          size="sm"
          className="bg-medical-500 hover:bg-medical-600"
        >
          <Plus className="h-4 w-4 mr-1" />
          Agregar Servicio
        </Button>
      </div>

      {/* Barra de búsqueda */}
      <div className="space-y-2">
        <Label htmlFor="search" className="text-slate-200">Buscar Servicios</Label>
        <Input
          id="search"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          placeholder="Buscar por tipo de servicio o descripción..."
          className="bg-slate-700 border-slate-500 text-slate-100 placeholder:text-slate-400"
        />
      </div>

      {/* Formulario de agregar/editar servicio */}
      {showAddForm && (
        <Card className="bg-slate-600 border-slate-500">
          <CardHeader>
            <CardTitle className="text-slate-200 text-base flex items-center gap-2">
              {editingService ? (
                <>
                  <Edit className="h-4 w-4 text-medical-400" />
                  Editar Servicio
                </>
              ) : (
                <>
                  <Plus className="h-4 w-4 text-medical-400" />
                  Nuevo Servicio
                </>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmitService} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="service_type" className="text-slate-200">Tipo de Servicio *</Label>
                  <div className="space-y-2">
                    {/* Campo de búsqueda para tipos */}
                    <Input
                      placeholder="Buscar tipo de servicio o escribir nuevo..."
                      value={formData.service_type}
                      onChange={(e) => {
                        const value = e.target.value;
                        handleInputChange('service_type', value);
                        
                        // Mostrar opciones personalizadas si no coincide con predefinidos
                        const isExistingType = commonServiceTypes.some(type => 
                          type.toLowerCase() === value.toLowerCase()
                        );
                        setShowCustomType(!isExistingType && value.length > 0);
                      }}
                      className="bg-slate-700 border-slate-500 text-slate-100 placeholder:text-slate-400"
                      required
                      disabled={saving}
                    />
                    
                    {/* Lista de tipos sugeridos */}
                    {formData.service_type && !showCustomType && (
                      <div className="max-h-32 overflow-y-auto border border-slate-500 rounded-md bg-slate-700">
                        {filteredServiceTypes
                          .filter(type => 
                            type.toLowerCase().includes(formData.service_type.toLowerCase())
                          )
                          .slice(0, 5)
                          .map(type => (
                            <button
                              key={type}
                              type="button"
                              onClick={() => {
                                handleInputChange('service_type', type);
                                setShowCustomType(false);
                              }}
                              className="w-full text-left px-3 py-2 text-sm text-slate-100 hover:bg-slate-600 focus:bg-slate-600"
                            >
                              {type}
                            </button>
                          ))
                        }
                      </div>
                    )}
                    
                    {showCustomType && (
                      <div className="p-2 bg-medical-500/10 border border-medical-500/30 rounded-md">
                        <p className="text-xs text-medical-300 flex items-center gap-1">
                          <Plus className="h-3 w-3" />
                          Nuevo tipo de servicio: "{formData.service_type}"
                        </p>
                      </div>
                    )}
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="price" className="text-slate-200">Precio (ARS) *</Label>
                  <Input
                    id="price"
                    type="number"
                    value={formData.price}
                    onChange={(e) => handleInputChange('price', e.target.value)}
                    placeholder="5000"
                    className="bg-slate-700 border-slate-500 text-slate-100 placeholder:text-slate-400"
                    required
                    min="0"
                    step="0.01"
                    disabled={saving}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="duration_minutes" className="text-slate-200">Duración (minutos)</Label>
                  <Input
                    id="duration_minutes"
                    type="number"
                    value={formData.duration_minutes}
                    onChange={(e) => handleInputChange('duration_minutes', e.target.value)}
                    placeholder="30"
                    className="bg-slate-700 border-slate-500 text-slate-100 placeholder:text-slate-400"
                    min="1"
                    disabled={saving}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="description" className="text-slate-200">Descripción</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => handleInputChange('description', e.target.value)}
                  placeholder="Descripción detallada del servicio, qué incluye, procedimientos..."
                  className="bg-slate-700 border-slate-500 text-slate-100 placeholder:text-slate-400"
                  rows={2}
                  disabled={saving}
                />
              </div>

              <div className="flex justify-end gap-3">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setShowAddForm(false);
                    setEditingService(null);
                  }}
                  className="border-slate-500 bg-slate-700 text-slate-200 hover:bg-slate-600"
                  disabled={saving}
                >
                  <X className="h-4 w-4 mr-1" />
                  Cancelar
                </Button>
                <Button
                  type="submit"
                  disabled={saving}
                  className="bg-medical-500 hover:bg-medical-600"
                >
                  {saving ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Guardando...
                    </>
                  ) : (
                    <>
                      <Save className="mr-2 h-4 w-4" />
                      {editingService ? 'Actualizar' : 'Agregar'} Servicio
                    </>
                  )}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {/* Lista de servicios */}
      {filteredServices.length === 0 ? (
        <div className="text-center py-6 text-slate-400">
          <Stethoscope className="h-8 w-8 mx-auto mb-2 text-slate-500" />
          {searchTerm ? (
            <div>
              <p>No se encontraron servicios para "{searchTerm}"</p>
              <p className="text-sm">Intenta con otro término de búsqueda o agrega un nuevo servicio.</p>
            </div>
          ) : (
            <div>
              <p>No hay servicios configurados.</p>
              <p className="text-sm">Agrega servicios para definir precios por tipo de consulta.</p>
            </div>
          )}
        </div>
      ) : (
        <div className="space-y-3">
          {/* Contador de resultados */}
          {searchTerm && (
            <div className="flex items-center gap-2 text-sm text-slate-400">
              <span>Mostrando {filteredServices.length} de {services.length} servicios</span>
              {searchTerm && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setSearchTerm('')}
                  className="h-6 px-2 text-xs text-slate-400 hover:text-slate-200"
                >
                  <X className="h-3 w-3 mr-1" />
                  Limpiar
                </Button>
              )}
            </div>
          )}
          
          <div key={`services-container-${forceRender}`} className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {filteredServices.map((service) => (
              <Card key={`service-card-${service.id}`} className="bg-slate-600 border-slate-500">
                <CardContent className="p-4">
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <h5 className="font-medium text-slate-100">{service.service_type}</h5>
                        <Badge
                          variant={service.is_active ? 'default' : 'secondary'}
                          className={service.is_active ? 'bg-green-600 text-green-100' : 'bg-slate-500 text-slate-300'}
                        >
                          {service.is_active ? 'Activo' : 'Inactivo'}
                        </Badge>
                        {!commonServiceTypes.includes(service.service_type) && (
                          <Badge className="bg-medical-500/20 text-medical-300 border-medical-500/30">
                            Personalizado
                          </Badge>
                        )}
                      </div>
                    
                      <div className="flex items-center gap-4 text-sm text-slate-300">
                        <div className="flex items-center gap-1">
                          <DollarSign className="h-3 w-3 text-green-400" />
                          <span className="font-medium text-green-400">${service.price}</span>
                        </div>
                        
                        {service.duration_minutes && (
                          <div className="flex items-center gap-1">
                            <Clock className="h-3 w-3 text-slate-400" />
                            <span>{service.duration_minutes} min</span>
                          </div>
                        )}
                      </div>
                      
                      {service.description && (
                        <p className="text-xs text-slate-400 mt-2 line-clamp-2">
                          {service.description}
                        </p>
                      )}
                    </div>
                    
                    <div className="flex gap-1 ml-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleEditService(service)}
                        className="h-8 w-8 p-0 text-slate-400 hover:text-slate-200 hover:bg-slate-500"
                      >
                        <Edit className="h-3 w-3" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDeleteService(service.id)}
                        disabled={deleting === service.id || saving}
                        className="h-8 w-8 p-0 text-red-400 hover:text-red-200 hover:bg-red-900/30 disabled:opacity-50"
                      >
                        {deleting === service.id ? (
                          <Loader2 className="h-3 w-3 animate-spin" />
                        ) : (
                          <Trash2 className="h-3 w-3" />
                        )}
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}