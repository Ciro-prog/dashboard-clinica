import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Building2, Loader2, Edit, Eye, EyeOff, Settings, Palette, Users, Clock, DollarSign, UserCheck, Plus, Trash2 } from 'lucide-react';

interface Clinic {
  id: string;
  clinic_id: string;
  name_clinic: string;
  suscriber: string;
  email: string;
  cell_phone: string;
  address: string;
  status_clinic: string;
  subscription_status: string;
  subscription_plan: string;
  subscription_expires: string | null;
  created_at: string;
  updated_at: string;
  domain_name?: string;
  max_professionals?: number;
  max_patients?: number;
  whatsapp_session_name?: string;
  n8n_folder_name?: string;
  services?: any[];
  schedule?: any;
  contact_info?: any;
  specialties?: string[];
  subscription_features?: any;
  branding?: any;
  patient_form_fields?: string[];
  custom_patient_fields?: any[];
}

interface ClinicEditModalProps {
  clinic: Clinic;
  open: boolean;
  onClose: () => void;
  onClinicUpdated: () => void;
}

export default function ClinicEditModal({ clinic, open, onClose, onClinicUpdated }: ClinicEditModalProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [changePassword, setChangePassword] = useState(false);
  const [activeTab, setActiveTab] = useState('basic');
  const [tabSwitchDisabled, setTabSwitchDisabled] = useState(false);
  
  const [formData, setFormData] = useState({
    name_clinic: '',
    suscriber: '',
    email: '',
    cell_phone: '',
    address: '',
    subscription_plan: '',
    subscription_status: '',
    subscription_expires: '',
    status_clinic: '',
    domain_name: '',
    max_professionals: 5,
    max_patients: 100,
    whatsapp_session_name: '',
    n8n_folder_name: '',
    password: ''
  });

  // Extended state for complete clinic data
  const [services, setServices] = useState<any[]>([]);
  const [schedule, setSchedule] = useState<any>({});
  const [specialties, setSpecialties] = useState<string[]>([]);
  const [contactInfo, setContactInfo] = useState<any>({});
  const [subscriptionFeatures, setSubscriptionFeatures] = useState<any>({});
  const [branding, setBranding] = useState<any>({});
  const [patientFields, setPatientFields] = useState<string[]>([]);
  const [customPatientFields, setCustomPatientFields] = useState<any[]>([]);

  useEffect(() => {
    if (clinic && open) {
      setFormData({
        name_clinic: clinic.name_clinic,
        suscriber: clinic.suscriber,
        email: clinic.email,
        cell_phone: clinic.cell_phone,
        address: clinic.address,
        subscription_plan: clinic.subscription_plan,
        subscription_status: clinic.subscription_status || 'trial',
        subscription_expires: clinic.subscription_expires || '',
        status_clinic: clinic.status_clinic,
        domain_name: clinic.domain_name || '',
        max_professionals: clinic.max_professionals || 5,
        max_patients: clinic.max_patients || 100,
        whatsapp_session_name: clinic.whatsapp_session_name || '',
        n8n_folder_name: clinic.n8n_folder_name || '',
        password: ''
      });
      
      // Load extended data
      setServices(clinic.services || []);
      setSchedule(clinic.schedule || {});
      setSpecialties(clinic.specialties || []);
      setContactInfo(clinic.contact_info || {});
      setSubscriptionFeatures(clinic.subscription_features || {});
      setBranding(clinic.branding || {});
      setPatientFields(clinic.patient_form_fields || []);
      setCustomPatientFields(clinic.custom_patient_fields || []);
      
      setChangePassword(false);
      setShowPassword(false);
      setError(null);
      
      // Only reset tab when opening modal, not when clinic changes
      if (open) {
        setActiveTab('basic');
      }
    }
  }, [clinic, open]);

  const handleInputChange = (field: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleTabChange = (newTab: string) => {
    if (!tabSwitchDisabled && !loading) {
      setActiveTab(newTab);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      setLoading(true);
      setTabSwitchDisabled(true);
      setError(null);
      
      console.log('✏️ Actualizando clínica completa:', formData);
      
      const token = localStorage.getItem('admin_token');
      if (!token) {
        throw new Error('Token de administrador no encontrado');
      }

      // Preparar datos completos para envío
      const updateData = {
        ...formData,
        services,
        schedule,
        contact_info: contactInfo,
        specialties,
        subscription_features: subscriptionFeatures,
        branding,
        patient_form_fields: patientFields,
        custom_patient_fields: customPatientFields,
        ...(changePassword && formData.password && { password: formData.password })
      };

      const response = await fetch(`/api/admin/clinics/${clinic.clinic_id}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(updateData)
      });

      if (!response.ok) {
        const errorData = await response.text();
        console.error('❌ Error actualizando clínica:', response.status, errorData);
        
        if (response.status === 400) {
          throw new Error('Datos inválidos');
        } else if (response.status === 401) {
          throw new Error('Sesión expirada. Por favor, inicia sesión nuevamente');
        } else if (response.status === 404) {
          throw new Error('Clínica no encontrada');
        } else {
          throw new Error(`Error del servidor: ${response.status}`);
        }
      }

      const updatedClinic = await response.json();
      console.log('✅ Clínica actualizada exitosamente:', updatedClinic);
      
      // Cerrar modal y notificar al padre
      onClose();
      onClinicUpdated();
      
    } catch (err) {
      console.error('❌ Error en actualización de clínica:', err);
      setError(err instanceof Error ? err.message : 'Error desconocido');
    } finally {
      setLoading(false);
      setTabSwitchDisabled(false);
    }
  };

  const resetForm = () => {
    if (clinic) {
      setFormData({
        name_clinic: clinic.name_clinic,
        suscriber: clinic.suscriber,
        email: clinic.email,
        cell_phone: clinic.cell_phone,
        address: clinic.address,
        subscription_plan: clinic.subscription_plan,
        subscription_status: clinic.subscription_status || 'trial',
        subscription_expires: clinic.subscription_expires || '',
        status_clinic: clinic.status_clinic,
        domain_name: clinic.domain_name || '',
        max_professionals: clinic.max_professionals || 5,
        max_patients: clinic.max_patients || 100,
        whatsapp_session_name: clinic.whatsapp_session_name || '',
        n8n_folder_name: clinic.n8n_folder_name || '',
        password: ''
      });
    }
    setError(null);
    setChangePassword(false);
    setShowPassword(false);
    // Don't reset activeTab here to avoid DOM manipulation conflicts
  };

  return (
    <Dialog open={open} onOpenChange={(newOpen) => {
      if (!newOpen && !loading) {
        onClose();
        // Reset tab first, then form data in next tick
        setTimeout(() => {
          setActiveTab('basic');
          resetForm();
        }, 0);
      }
    }}>
      <DialogContent 
        className="sm:max-w-[800px] bg-slate-800 border-slate-700 text-slate-100 max-h-[90vh] overflow-y-auto"
        onInteractOutside={(e) => e.preventDefault()}
        onEscapeKeyDown={(e) => !loading && onClose()}
      >
        <DialogHeader>
          <DialogTitle className="text-white flex items-center gap-2">
            <Edit className="h-5 w-5 text-medical-400" />
            Editar Clínica - {clinic.name_clinic}
          </DialogTitle>
          <DialogDescription className="text-slate-400">
            Modifica toda la información y configuración de la clínica médica.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <Alert variant="destructive" className="bg-red-900/30 border-red-800 text-red-200">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
          
          <Tabs 
            key={`clinic-edit-tabs-${clinic?.clinic_id || 'new'}`}
            value={activeTab} 
            onValueChange={handleTabChange} 
            className="w-full"
          >
            <TabsList className={`grid w-full grid-cols-4 bg-slate-700 text-xs ${tabSwitchDisabled || loading ? 'pointer-events-none opacity-50' : ''}`}>
              <TabsTrigger value="basic" className="text-slate-200">Básico</TabsTrigger>
              <TabsTrigger value="subscription" className="text-slate-200">Suscripción</TabsTrigger>
              <TabsTrigger value="branding" className="text-slate-200">Branding</TabsTrigger>
              <TabsTrigger value="integration" className="text-slate-200">Integración</TabsTrigger>
            </TabsList>
            
            {/* Información Básica */}
            <TabsContent value="basic" className="space-y-4">
              <Card className="bg-slate-700 border-slate-600">
                <CardHeader>
                  <CardTitle className="text-slate-200 flex items-center gap-2">
                    <Building2 className="h-5 w-5" />
                    Información Básica
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="name_clinic" className="text-slate-200">Nombre de la Clínica *</Label>
                      <Input
                        id="name_clinic"
                        value={formData.name_clinic}
                        onChange={(e) => handleInputChange('name_clinic', e.target.value)}
                        className="bg-slate-700 border-slate-600 text-slate-100"
                        required
                        disabled={loading}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="suscriber" className="text-slate-200">Responsable/Suscriptor *</Label>
                      <Input
                        id="suscriber"
                        value={formData.suscriber}
                        onChange={(e) => handleInputChange('suscriber', e.target.value)}
                        className="bg-slate-700 border-slate-600 text-slate-100"
                        required
                        disabled={loading}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="email" className="text-slate-200">Email *</Label>
                      <Input
                        id="email"
                        type="email"
                        value={formData.email}
                        onChange={(e) => handleInputChange('email', e.target.value)}
                        className="bg-slate-700 border-slate-600 text-slate-100"
                        required
                        disabled={loading}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="cell_phone" className="text-slate-200">Teléfono *</Label>
                      <Input
                        id="cell_phone"
                        value={formData.cell_phone}
                        onChange={(e) => handleInputChange('cell_phone', e.target.value)}
                        className="bg-slate-700 border-slate-600 text-slate-100"
                        required
                        disabled={loading}
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="domain_name" className="text-slate-200">Dominio</Label>
                      <Input
                        id="domain_name"
                        value={formData.domain_name}
                        onChange={(e) => handleInputChange('domain_name', e.target.value)}
                        className="bg-slate-700 border-slate-600 text-slate-100"
                        disabled={loading}
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="whatsapp_session_name" className="text-slate-200">Sesión WhatsApp</Label>
                      <Input
                        id="whatsapp_session_name"
                        value={formData.whatsapp_session_name}
                        onChange={(e) => handleInputChange('whatsapp_session_name', e.target.value)}
                        className="bg-slate-700 border-slate-600 text-slate-100"
                        disabled={loading}
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="address" className="text-slate-200">Dirección *</Label>
                    <Textarea
                      id="address"
                      value={formData.address}
                      onChange={(e) => handleInputChange('address', e.target.value)}
                      className="bg-slate-700 border-slate-600 text-slate-100"
                      rows={2}
                      required
                      disabled={loading}
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="subscription_plan" className="text-slate-200">Plan de Suscripción</Label>
                      <Select 
                        value={formData.subscription_plan} 
                        onValueChange={(value) => handleInputChange('subscription_plan', value)}
                        disabled={loading}
                      >
                        <SelectTrigger className="bg-slate-700 border-slate-600 text-slate-100">
                          <SelectValue placeholder="Seleccionar plan" />
                        </SelectTrigger>
                        <SelectContent className="bg-slate-700 border-slate-600">
                          <SelectItem value="trial">Trial (Gratuito)</SelectItem>
                          <SelectItem value="basic">Básico ($29.99/mes)</SelectItem>
                          <SelectItem value="premium">Premium ($59.99/mes)</SelectItem>
                          <SelectItem value="enterprise">Empresarial ($99.99/mes)</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="status_clinic" className="text-slate-200">Estado</Label>
                      <Select 
                        value={formData.status_clinic} 
                        onValueChange={(value) => handleInputChange('status_clinic', value)}
                        disabled={loading}
                      >
                        <SelectTrigger className="bg-slate-700 border-slate-600 text-slate-100">
                          <SelectValue placeholder="Seleccionar estado" />
                        </SelectTrigger>
                        <SelectContent className="bg-slate-700 border-slate-600">
                          <SelectItem value="active">Activo</SelectItem>
                          <SelectItem value="inactive">Inactivo</SelectItem>
                          <SelectItem value="suspended">Suspendido</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Suscripción */}
            <TabsContent value="subscription" className="space-y-4">
              <Card className="bg-slate-700 border-slate-600">
                <CardHeader>
                  <CardTitle className="text-slate-200 flex items-center gap-2">
                    <Settings className="h-5 w-5" />
                    Configuración de Suscripción
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label className="text-slate-200">Máximo Profesionales</Label>
                      <Input
                        type="number"
                        value={formData.max_professionals}
                        onChange={(e) => handleInputChange('max_professionals', parseInt(e.target.value) || 5)}
                        className="bg-slate-700 border-slate-600 text-slate-100"
                        min="1"
                        max="100"
                        disabled={loading}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label className="text-slate-200">Máximo Pacientes</Label>
                      <Input
                        type="number"
                        value={formData.max_patients}
                        onChange={(e) => handleInputChange('max_patients', parseInt(e.target.value) || 100)}
                        className="bg-slate-700 border-slate-600 text-slate-100"
                        min="1"
                        max="10000"
                        disabled={loading}
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label className="text-slate-200">Estado de Suscripción</Label>
                      <Select 
                        value={formData.subscription_status} 
                        onValueChange={(value) => handleInputChange('subscription_status', value)}
                        disabled={loading}
                      >
                        <SelectTrigger className="bg-slate-700 border-slate-600 text-slate-100">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent className="bg-slate-700 border-slate-600">
                          <SelectItem value="trial">Trial</SelectItem>
                          <SelectItem value="active">Activa</SelectItem>
                          <SelectItem value="expired">Expirada</SelectItem>
                          <SelectItem value="cancelled">Cancelada</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label className="text-slate-200">Fecha de Expiración</Label>
                      <Input
                        type="date"
                        value={formData.subscription_expires}
                        onChange={(e) => handleInputChange('subscription_expires', e.target.value)}
                        className="bg-slate-700 border-slate-600 text-slate-100"
                        disabled={loading}
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Branding */}
            <TabsContent value="branding" className="space-y-4">
              <Card className="bg-slate-700 border-slate-600">
                <CardHeader>
                  <CardTitle className="text-slate-200 flex items-center gap-2">
                    <Palette className="h-5 w-5" />
                    Branding y Personalización
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label className="text-slate-200">Título de la Clínica</Label>
                      <Input
                        value={branding.clinic_title || formData.name_clinic}
                        onChange={(e) => setBranding(prev => ({ ...prev, clinic_title: e.target.value }))}
                        className="bg-slate-700 border-slate-600 text-slate-100"
                        disabled={loading}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label className="text-slate-200">URL del Logo</Label>
                      <Input
                        value={branding.logo_url || ''}
                        onChange={(e) => setBranding(prev => ({ ...prev, logo_url: e.target.value }))}
                        className="bg-slate-700 border-slate-600 text-slate-100"
                        disabled={loading}
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Integración */}
            <TabsContent value="integration" className="space-y-4">
              <Card className="bg-slate-700 border-slate-600">
                <CardHeader>
                  <CardTitle className="text-slate-200 flex items-center gap-2">
                    <UserCheck className="h-5 w-5" />
                    Integración N8N
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label className="text-slate-200">Carpeta N8N</Label>
                    <Input
                      value={formData.n8n_folder_name}
                      onChange={(e) => handleInputChange('n8n_folder_name', e.target.value)}
                      placeholder="Clinica Demo - Operativa"
                      className="bg-slate-700 border-slate-600 text-slate-100"
                      disabled={loading}
                    />
                    <p className="text-xs text-slate-500">Carpeta para workflows de automatización</p>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>

          {/* Información de solo lectura */}
          <div className="space-y-2">
            <Label className="text-slate-200">Información del Sistema</Label>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-3 bg-slate-700/50 rounded-md">
              <div>
                <span className="text-xs text-slate-400">ID de Clínica:</span>
                <div className="font-mono text-sm text-slate-200">{clinic.clinic_id}</div>
              </div>
              <div>
                <span className="text-xs text-slate-400">Fecha de Creación:</span>
                <div className="text-sm text-slate-200">{new Date(clinic.created_at).toLocaleDateString()}</div>
              </div>
            </div>
          </div>

          {/* Gestión de Contraseña */}
          <div className="space-y-3 p-4 bg-slate-700/30 rounded-lg border border-slate-600">
            <div className="flex items-center justify-between">
              <Label className="text-slate-200">Contraseña de Acceso</Label>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setChangePassword(!changePassword)}
                className="border-slate-500 bg-slate-600 text-slate-200 hover:bg-slate-500"
              >
                {changePassword ? 'Cancelar Cambio' : 'Cambiar Contraseña'}
              </Button>
            </div>
            
            {changePassword ? (
              <div className="space-y-2">
                <Label htmlFor="password" className="text-slate-200">Nueva Contraseña *</Label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    value={formData.password}
                    onChange={(e) => handleInputChange('password', e.target.value)}
                    placeholder="••••••••"
                    className="bg-slate-700 border-slate-600 text-slate-100 pr-10"
                    required={changePassword}
                    minLength={8}
                    disabled={loading}
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-0 top-0 h-full px-3 text-slate-400 hover:text-slate-200"
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </Button>
                </div>
              </div>
            ) : (
              <div className="text-sm text-slate-400">
                <p>• Contraseña actual se mantiene sin cambios</p>
                <p>• Haz clic en "Cambiar Contraseña" para establecer una nueva</p>
              </div>
            )}
          </div>

          <DialogFooter className="flex gap-2 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              className="border-slate-600 bg-slate-700 text-slate-200 hover:bg-slate-600"
              disabled={loading}
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              disabled={loading}
              className="bg-medical-500 hover:bg-medical-600"
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Actualizando...
                </>
              ) : (
                <>
                  <Edit className="mr-2 h-4 w-4" />
                  Actualizar Clínica
                </>
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}