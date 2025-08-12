import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import ProfessionalServicesManager from './ProfessionalServicesManager';
import { 
  Users, 
  Loader2, 
  X, 
  UserPlus, 
  User,
  Phone,
  Mail,
  Star,
  Calendar,
  Trash2,
  Edit,
  DollarSign
} from 'lucide-react';

interface ProfessionalService {
  id: string;
  service_type: string;
  description: string;
  price: number;
  duration_minutes?: number;
  is_active: boolean;
}

interface Professional {
  id: string;
  clinic_id: string;
  first_name: string;
  last_name: string;
  speciality: string;
  license_number?: string;
  email: string;
  phone: string;
  status_professional: 'active' | 'inactive' | 'vacation';
  bio?: string;
  working_hours?: string;
  consultation_fee?: number;
  services?: ProfessionalService[];
  created_at: string;
  updated_at: string;
}

interface ProfessionalManagementModalProps {
  clinic: {
    id: string;
    clinic_id: string;
    name_clinic: string;
    suscriber: string;
  };
  onClose: () => void;
}

export default function ProfessionalManagementModal({ clinic, onClose }: ProfessionalManagementModalProps) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [professionals, setProfessionals] = useState<Professional[]>([]);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [creating, setCreating] = useState(false);
  const [editingProfessional, setEditingProfessional] = useState<Professional | null>(null);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [managingServices, setManagingServices] = useState<Professional | null>(null);
  
  const [formData, setFormData] = useState({
    first_name: '',
    last_name: '',
    speciality: '',
    license_number: '',
    phone: '',
    password: '',
    bio: '',
    working_hours: '',
    consultation_fee: ''
  });

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const loadProfessionals = async () => {
    try {
      setLoading(true);
      setError(null);
      
      console.log(`👨‍⚕️ Cargando profesionales para clínica ${clinic.clinic_id}...`);
      
      const token = localStorage.getItem('admin_token');
      if (!token) {
        throw new Error('Token de administrador no encontrado');
      }

      const response = await fetch(`/api/admin/clinics/${clinic.clinic_id}/professionals`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        if (response.status === 404) {
          // No hay profesionales, inicializar con array vacío
          setProfessionals([]);
          return;
        }
        throw new Error(`Error obteniendo profesionales: ${response.status}`);
      }

      const data = await response.json();
      setProfessionals(Array.isArray(data) ? data : []);
      
    } catch (err) {
      console.error('❌ Error cargando profesionales:', err);
      setError(err instanceof Error ? err.message : 'Error desconocido');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateProfessional = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      setCreating(true);
      setError(null);
      
      const professionalData = {
        ...formData,
        clinic_id: clinic.clinic_id,
        consultation_fee: formData.consultation_fee ? parseFloat(formData.consultation_fee) : undefined
      };
      
      console.log('👨‍⚕️ Creando nuevo profesional:', professionalData);
      
      const token = localStorage.getItem('admin_token');
      if (!token) {
        throw new Error('Token de administrador no encontrado');
      }

      const response = await fetch(`/api/admin/clinics/${clinic.clinic_id}/professionals`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(professionalData)
      });

      if (!response.ok) {
        const errorData = await response.text();
        console.error('❌ Error creando profesional:', response.status, errorData);
        throw new Error(`Error del servidor: ${response.status}`);
      }

      const newProfessional = await response.json();
      console.log('✅ Profesional creado exitosamente:', newProfessional);
      
      // Resetear formulario y recargar lista
      resetForm();
      setShowCreateForm(false);
      await loadProfessionals();
      
    } catch (err) {
      console.error('❌ Error en creación de profesional:', err);
      setError(err instanceof Error ? err.message : 'Error desconocido');
    } finally {
      setCreating(false);
    }
  };

  const resetForm = () => {
    setFormData({
      first_name: '',
      last_name: '',
      speciality: '',
      license_number: '',
      phone: '',
      password: '',
      bio: '',
      working_hours: '',
      consultation_fee: ''
    });
    setError(null);
  };

  const handleEditProfessional = (professional: Professional) => {
    setEditingProfessional(professional);
    setFormData({
      first_name: professional.first_name,
      last_name: professional.last_name,
      speciality: professional.speciality,
      license_number: professional.license_number || '',
      phone: professional.phone,
      password: '', // No mostrar password actual
      bio: professional.bio || '',
      working_hours: professional.working_hours || '',
      consultation_fee: professional.consultation_fee?.toString() || ''
    });
    setShowCreateForm(true);
  };

  const handleUpdateProfessional = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!editingProfessional) return;
    
    try {
      setCreating(true);
      setError(null);
      
      const updateData = {
        first_name: formData.first_name,
        last_name: formData.last_name,
        speciality: formData.speciality,
        license_number: formData.license_number || undefined,
        phone: formData.phone,
        bio: formData.bio || undefined,
        working_hours: formData.working_hours || undefined,
        consultation_fee: formData.consultation_fee ? parseFloat(formData.consultation_fee) : undefined,
        ...(formData.password && { password: formData.password }) // Solo incluir si se cambió
      };
      
      console.log('✏️ Actualizando profesional:', updateData);
      
      const token = localStorage.getItem('admin_token');
      if (!token) {
        throw new Error('Token de administrador no encontrado');
      }

      const response = await fetch(`/api/admin/clinics/${clinic.clinic_id}/professionals/${editingProfessional.id}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(updateData)
      });

      if (!response.ok) {
        const errorData = await response.text();
        console.error('❌ Error actualizando profesional:', response.status, errorData);
        throw new Error(`Error del servidor: ${response.status}`);
      }

      const updatedProfessional = await response.json();
      console.log('✅ Profesional actualizado exitosamente:', updatedProfessional);
      
      // Resetear formulario y recargar lista
      setEditingProfessional(null);
      resetForm();
      setShowCreateForm(false);
      await loadProfessionals();
      
    } catch (err) {
      console.error('❌ Error en actualización de profesional:', err);
      setError(err instanceof Error ? err.message : 'Error desconocido');
    } finally {
      setCreating(false);
    }
  };

  const handleDeleteProfessional = async (professional: Professional) => {
    if (!confirm(`¿Estás seguro de eliminar al profesional ${professional.first_name} ${professional.last_name}?`)) {
      return;
    }
    
    try {
      setDeleting(professional.id);
      setError(null);
      
      console.log('🗑️ Eliminando profesional:', professional.id);
      
      const token = localStorage.getItem('admin_token');
      if (!token) {
        throw new Error('Token de administrador no encontrado');
      }

      const response = await fetch(`/api/admin/clinics/${clinic.clinic_id}/professionals/${professional.id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        const errorData = await response.text();
        console.error('❌ Error eliminando profesional:', response.status, errorData);
        throw new Error(`Error del servidor: ${response.status}`);
      }

      console.log('✅ Profesional eliminado exitosamente');
      
      // Recargar lista
      await loadProfessionals();
      
    } catch (err) {
      console.error('❌ Error en eliminación de profesional:', err);
      setError(err instanceof Error ? err.message : 'Error desconocido');
    } finally {
      setDeleting(null);
    }
  };

  useEffect(() => {
    loadProfessionals();
  }, [clinic.clinic_id]);

  return (
    <div 
      className="fixed inset-0 z-[100] flex items-center justify-center"
      style={{ 
        backgroundColor: 'rgba(0, 0, 0, 0.8)',
        backdropFilter: 'blur(4px)' 
      }}
    >
      <div 
        className="relative bg-slate-800 border border-slate-700 rounded-lg shadow-2xl w-full max-w-[900px] max-h-[90vh] overflow-y-auto m-4"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-slate-700">
          <div>
            <h2 className="text-xl font-semibold text-white flex items-center gap-2">
              <Users className="h-5 w-5 text-medical-400" />
              Profesionales - {clinic.name_clinic}
            </h2>
            <p className="text-sm text-slate-400 mt-1">
              Gestiona el equipo médico de la clínica
            </p>
          </div>
          <Button
            onClick={onClose}
            variant="ghost"
            size="sm"
            className="text-slate-400 hover:text-slate-200 hover:bg-slate-700"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>

        {/* Contenido */}
        <div className="p-6">
          {error && (
            <Alert variant="destructive" className="bg-red-900/30 border-red-800 text-red-200 mb-4">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {/* Acciones principales */}
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-lg font-medium text-slate-200">
                Profesionales Registrados ({professionals.length})
              </h3>
              <p className="text-sm text-slate-400">
                Clínica ID: {clinic.clinic_id}
              </p>
            </div>
            <Button
              onClick={() => setShowCreateForm(!showCreateForm)}
              className="bg-medical-500 hover:bg-medical-600"
            >
              <UserPlus className="h-4 w-4 mr-2" />
              {showCreateForm ? 'Cancelar' : 'Agregar Profesional'}
            </Button>
          </div>

          {/* Formulario de creación */}
          {showCreateForm && (
            <Card className="bg-slate-700 border-slate-600 mb-6">
              <CardHeader>
                <CardTitle className="text-slate-200 flex items-center gap-2">
                  {editingProfessional ? (
                    <>
                      <Edit className="h-4 w-4 text-medical-400" />
                      Editar Profesional
                    </>
                  ) : (
                    <>
                      <UserPlus className="h-4 w-4 text-medical-400" />
                      Nuevo Profesional
                    </>
                  )}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <form onSubmit={editingProfessional ? handleUpdateProfessional : handleCreateProfessional} className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="first_name" className="text-slate-200">Nombre *</Label>
                      <Input
                        id="first_name"
                        value={formData.first_name}
                        onChange={(e) => handleInputChange('first_name', e.target.value)}
                        placeholder="Juan"
                        className="bg-slate-600 border-slate-500 text-slate-100 placeholder:text-slate-400"
                        required
                        disabled={creating}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="last_name" className="text-slate-200">Apellido *</Label>
                      <Input
                        id="last_name"
                        value={formData.last_name}
                        onChange={(e) => handleInputChange('last_name', e.target.value)}
                        placeholder="Pérez"
                        className="bg-slate-600 border-slate-500 text-slate-100 placeholder:text-slate-400"
                        required
                        disabled={creating}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="speciality" className="text-slate-200">Especialidad *</Label>
                      <Input
                        id="speciality"
                        value={formData.speciality}
                        onChange={(e) => handleInputChange('speciality', e.target.value)}
                        placeholder="Cardiología"
                        className="bg-slate-600 border-slate-500 text-slate-100 placeholder:text-slate-400"
                        required
                        disabled={creating}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="license_number" className="text-slate-200">Número de Matrícula</Label>
                      <Input
                        id="license_number"
                        value={formData.license_number}
                        onChange={(e) => handleInputChange('license_number', e.target.value)}
                        placeholder="MP 12345"
                        className="bg-slate-600 border-slate-500 text-slate-100 placeholder:text-slate-400"
                        disabled={creating}
                      />
                      <p className="text-xs text-slate-500">Opcional - Número de matrícula profesional</p>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="phone" className="text-slate-200">Teléfono *</Label>
                      <Input
                        id="phone"
                        value={formData.phone}
                        onChange={(e) => handleInputChange('phone', e.target.value)}
                        placeholder="+54911234567"
                        className="bg-slate-600 border-slate-500 text-slate-100 placeholder:text-slate-400"
                        required
                        disabled={creating}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="password" className="text-slate-200">
                        Contraseña {editingProfessional ? '(opcional - dejar vacío para mantener actual)' : '*'}
                      </Label>
                      <Input
                        id="password"
                        type="password"
                        value={formData.password}
                        onChange={(e) => handleInputChange('password', e.target.value)}
                        placeholder={editingProfessional ? "Dejar vacío para mantener actual" : "••••••••"}
                        className="bg-slate-600 border-slate-500 text-slate-100 placeholder:text-slate-400"
                        required={!editingProfessional}
                        minLength={8}
                        disabled={creating}
                      />
                      <p className="text-xs text-slate-500">
                        {editingProfessional 
                          ? 'Email se genera automáticamente - Solo cambiar contraseña si es necesario'
                          : 'Mínimo 8 caracteres - Email se genera automáticamente'
                        }
                      </p>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="working_hours" className="text-slate-200">Horarios de Trabajo</Label>
                      <Input
                        id="working_hours"
                        value={formData.working_hours}
                        onChange={(e) => handleInputChange('working_hours', e.target.value)}
                        placeholder="Lun-Vie 9:00-17:00"
                        className="bg-slate-600 border-slate-500 text-slate-100 placeholder:text-slate-400"
                        disabled={creating}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="consultation_fee" className="text-slate-200">Tarifa de Consulta</Label>
                      <Input
                        id="consultation_fee"
                        type="number"
                        value={formData.consultation_fee}
                        onChange={(e) => handleInputChange('consultation_fee', e.target.value)}
                        placeholder="5000"
                        className="bg-slate-600 border-slate-500 text-slate-100 placeholder:text-slate-400"
                        min="0"
                        step="0.01"
                        disabled={creating}
                      />
                      <p className="text-xs text-slate-500">Opcional - Tarifa en pesos argentinos</p>
                    </div>
                  </div>

                  {/* Bio */}
                  <div className="space-y-2">
                    <Label htmlFor="bio" className="text-slate-200">Biografía</Label>
                    <Textarea
                      id="bio"
                      value={formData.bio}
                      onChange={(e) => handleInputChange('bio', e.target.value)}
                      placeholder="Experiencia profesional, estudios, especialidades..."
                      className="bg-slate-600 border-slate-500 text-slate-100 placeholder:text-slate-400"
                      rows={3}
                      disabled={creating}
                    />
                  </div>

                  <div className="flex justify-end gap-3 pt-4">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => {
                        setShowCreateForm(false);
                        setEditingProfessional(null);
                        resetForm();
                      }}
                      className="border-slate-500 bg-slate-600 text-slate-200 hover:bg-slate-500"
                      disabled={creating}
                    >
                      Cancelar
                    </Button>
                    <Button
                      type="submit"
                      disabled={creating}
                      className="bg-medical-500 hover:bg-medical-600"
                    >
                      {creating ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          {editingProfessional ? 'Actualizando...' : 'Creando...'}
                        </>
                      ) : editingProfessional ? (
                        <>
                          <Edit className="mr-2 h-4 w-4" />
                          Actualizar Profesional
                        </>
                      ) : (
                        <>
                          <UserPlus className="mr-2 h-4 w-4" />
                          Crear Profesional
                        </>
                      )}
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          )}

          {/* Lista de profesionales */}
          {loading ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-medical-500 mx-auto"></div>
              <p className="mt-4 text-slate-400">Cargando profesionales...</p>
            </div>
          ) : professionals.length === 0 ? (
            <div className="text-center py-8 text-slate-400">
              <Users className="h-12 w-12 mx-auto mb-4 text-slate-500" />
              <p>No hay profesionales registrados en esta clínica.</p>
              <p className="text-sm">Haz clic en "Agregar Profesional" para comenzar.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {professionals.map((professional) => (
                <Card key={professional.id} className="bg-slate-700 border-slate-600">
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-medical-500/20 rounded-lg flex items-center justify-center">
                          <User className="h-5 w-5 text-medical-400" />
                        </div>
                        <div>
                          <CardTitle className="text-slate-100 text-base">
                            {professional.first_name} {professional.last_name}
                          </CardTitle>
                          <div className="flex items-center gap-2 mt-1">
                            <Star className="h-3 w-3 text-medical-400" />
                            <span className="text-sm text-slate-300">{professional.speciality}</span>
                          </div>
                        </div>
                      </div>
                      <Badge
                        variant={professional.status_professional === 'active' ? 'default' : 'destructive'}
                        className={
                          professional.status_professional === 'active' 
                            ? 'bg-green-600 text-green-100' 
                            : professional.status_professional === 'vacation'
                            ? 'bg-yellow-600 text-yellow-100'
                            : 'bg-red-600 text-red-100'
                        }
                      >
                        {professional.status_professional === 'active' ? 'Activo' : 
                         professional.status_professional === 'vacation' ? 'Vacaciones' : 'Inactivo'}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    <div className="text-sm space-y-1">
                      <div className="flex items-center gap-2 text-slate-300">
                        <Mail className="h-3 w-3 text-slate-400" />
                        <span>{professional.email}</span>
                      </div>
                      <div className="flex items-center gap-2 text-slate-300">
                        <Phone className="h-3 w-3 text-slate-400" />
                        <span>{professional.phone}</span>
                      </div>
                      {professional.license_number && (
                        <div className="flex items-center gap-2 text-slate-300">
                          <Calendar className="h-3 w-3 text-slate-400" />
                          <span>MP: {professional.license_number}</span>
                        </div>
                      )}
                      {professional.consultation_fee && (
                        <div className="flex items-center gap-2 text-slate-300">
                          <span className="text-slate-400">$</span>
                          <span>${professional.consultation_fee}</span>
                        </div>
                      )}
                      {professional.services && professional.services.length > 0 && (
                        <div className="flex items-center gap-2 text-slate-300">
                          <span className="text-slate-400">Servicios:</span>
                          <Badge className="bg-medical-500/20 text-medical-300 border-medical-500/30">
                            {professional.services.filter(s => s.is_active).length} activos
                          </Badge>
                        </div>
                      )}
                    </div>
                    
                    <div className="flex justify-end gap-1 pt-2 flex-wrap">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setManagingServices(professional)}
                        className="border-slate-500 bg-slate-600 text-slate-200 hover:bg-slate-500"
                        disabled={creating || deleting === professional.id}
                      >
                        <DollarSign className="h-3 w-3 mr-1" />
                        Servicios
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleEditProfessional(professional)}
                        className="border-slate-500 bg-slate-600 text-slate-200 hover:bg-slate-500"
                        disabled={creating || deleting === professional.id}
                      >
                        <Edit className="h-3 w-3 mr-1" />
                        Editar
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDeleteProfessional(professional)}
                        className="border-red-600 bg-red-900/30 text-red-300 hover:bg-red-900/50"
                        disabled={creating || deleting === professional.id}
                      >
                        {deleting === professional.id ? (
                          <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                        ) : (
                          <Trash2 className="h-3 w-3 mr-1" />
                        )}
                        Eliminar
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex justify-end p-6 border-t border-slate-700">
          <Button
            onClick={onClose}
            variant="outline"
            className="border-slate-600 bg-slate-700 text-slate-200 hover:bg-slate-600"
          >
            Cerrar
          </Button>
        </div>
      </div>

      {/* Services Management Modal */}
      {managingServices && (
        <div 
          className="fixed inset-0 z-[110] flex items-center justify-center"
          style={{ 
            backgroundColor: 'rgba(0, 0, 0, 0.9)',
            backdropFilter: 'blur(6px)' 
          }}
        >
          <div 
            className="relative bg-slate-800 border border-slate-700 rounded-lg shadow-2xl w-full max-w-[800px] max-h-[90vh] overflow-y-auto m-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between p-6 border-b border-slate-700">
              <div>
                <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                  <DollarSign className="h-5 w-5 text-medical-400" />
                  Servicios - {managingServices.first_name} {managingServices.last_name}
                </h3>
                <p className="text-sm text-slate-400 mt-1">
                  Configura precios por tipo de consulta
                </p>
              </div>
              <Button
                onClick={() => setManagingServices(null)}
                variant="ghost"
                size="sm"
                className="text-slate-400 hover:text-slate-200 hover:bg-slate-700"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
            
            <div className="p-6">
              <ProfessionalServicesManager
                professionalId={managingServices.id}
                services={managingServices.services || []}
                onServicesUpdate={(services) => {
                  // Actualizar los servicios del profesional
                  const updatedProfessionals = professionals.map(p => 
                    p.id === managingServices.id ? { ...p, services } : p
                  );
                  setProfessionals(updatedProfessionals);
                  setManagingServices({ ...managingServices, services });
                }}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}