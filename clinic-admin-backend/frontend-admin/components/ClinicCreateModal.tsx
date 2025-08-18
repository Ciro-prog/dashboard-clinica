import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Building2, Loader2, X, Clock, DollarSign, Users, Calendar, Plus, Trash2, Settings, Palette, Zap, UserCheck } from 'lucide-react';
import { generateClinicId } from '@/lib/uniqueId';
import { subscriptionPlansApi } from '@/lib/clinicApi';

interface ClinicCreateModalProps {
  onClinicCreated: () => void;
}

interface ServiceData {
  service_id: string;
  service_type: string;
  description: string;
  base_price: number;
  currency: string;
  duration_minutes: number;
  category: string;
  requires_appointment: boolean;
  is_active: boolean;
}

interface WorkingHours {
  day_of_week: string;
  start_time: string;
  end_time: string;
  is_available: boolean;
}

interface ScheduleData {
  timezone: string;
  working_hours: WorkingHours[];
  break_start: string;
  break_end: string;
  holiday_dates: string[];
  special_hours: Record<string, any>;
}

interface ContactInfo {
  phone: string;
  whatsapp: string;
  email: string;
  address: string;
  website?: string;
  maps_url?: string;
}

interface SubscriptionFeatures {
  whatsapp_integration: boolean;
  patient_history: boolean;
  appointment_scheduling: boolean;
  medical_records: boolean;
  analytics_dashboard: boolean;
  custom_branding: boolean;
  api_access: boolean;
  priority_support: boolean;
}

interface BrandingData {
  clinic_title: string;
  clinic_subtitle: string;
  logo_url: string;
  primary_color: string;
  secondary_color: string;
}

interface PatientField {
  field_name: string;
  field_label: string;
  field_type: string;
  is_required: boolean;
  is_visible: boolean;
  options?: string[];
  placeholder?: string;
  help_text?: string;
}

// Default services from N8N hardcoded data
const DEFAULT_SERVICES: ServiceData[] = [
  {
    service_id: "srv_general",
    service_type: "Consulta General",
    description: "Consulta médica general con evaluación completa",
    base_price: 50000.0,
    currency: "COP",
    duration_minutes: 30,
    category: "Medicina General",
    requires_appointment: true,
    is_active: true
  },
  {
    service_id: "srv_specialist",
    service_type: "Consulta Especializada",
    description: "Consulta con especialista médico",
    base_price: 75000.0,
    currency: "COP",
    duration_minutes: 45,
    category: "Especialidades",
    requires_appointment: true,
    is_active: true
  },
  {
    service_id: "srv_minor_surgery",
    service_type: "Cirugía Menor",
    description: "Procedimientos quirúrgicos menores ambulatorios",
    base_price: 150000.0,
    currency: "COP",
    duration_minutes: 60,
    category: "Cirugía",
    requires_appointment: true,
    is_active: true
  },
  {
    service_id: "srv_emergency",
    service_type: "Urgencia",
    description: "Atención médica de urgencias",
    base_price: 80000.0,
    currency: "COP",
    duration_minutes: 45,
    category: "Urgencias",
    requires_appointment: false,
    is_active: true
  }
];

// Default schedule from N8N hardcoded data - with split hours support
const DEFAULT_SCHEDULE: ScheduleData = {
  timezone: "America/Bogota",
  working_hours: [
    { day_of_week: "monday", start_time: "09:00", end_time: "13:00", is_available: true },
    { day_of_week: "monday", start_time: "16:00", end_time: "20:00", is_available: true },
    { day_of_week: "tuesday", start_time: "09:00", end_time: "13:00", is_available: true },
    { day_of_week: "tuesday", start_time: "16:00", end_time: "20:00", is_available: true },
    { day_of_week: "wednesday", start_time: "09:00", end_time: "13:00", is_available: true },
    { day_of_week: "wednesday", start_time: "16:00", end_time: "20:00", is_available: true },
    { day_of_week: "thursday", start_time: "09:00", end_time: "13:00", is_available: true },
    { day_of_week: "thursday", start_time: "16:00", end_time: "20:00", is_available: true },
    { day_of_week: "friday", start_time: "09:00", end_time: "13:00", is_available: true },
    { day_of_week: "friday", start_time: "16:00", end_time: "20:00", is_available: true },
    { day_of_week: "saturday", start_time: "09:00", end_time: "13:00", is_available: true },
    { day_of_week: "sunday", start_time: "00:00", end_time: "00:00", is_available: false }
  ],
  break_start: "13:00",
  break_end: "16:00",
  holiday_dates: [],
  special_hours: {}
};

const DEFAULT_SPECIALTIES = [
  "Medicina General",
  "Cardiología", 
  "Dermatología",
  "Ginecología",
  "Pediatría",
  "Ortopedia",
  "Oftalmología"
];

export default function ClinicCreateModal({ onClinicCreated }: ClinicCreateModalProps) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState('basic');
  const [availablePlans, setAvailablePlans] = useState<any[]>([]);
  
  const [formData, setFormData] = useState({
    clinic_id: '',
    name_clinic: '',
    suscriber: '',
    email: '',
    cell_phone: '',
    address: '',
    domain_name: '',
    subscription_plan: 'trial',
    subscription_status: 'trial',
    subscription_expires: '',
    max_professionals: 5,
    max_patients: 100,
    password: '',
    status_clinic: 'active',
    whatsapp_session_name: '',
    n8n_folder_name: ''
  });

  // New state for services, schedule, and contact info
  const [services, setServices] = useState<ServiceData[]>(DEFAULT_SERVICES);
  const [schedule, setSchedule] = useState<ScheduleData>(DEFAULT_SCHEDULE);
  const [specialties, setSpecialties] = useState<string[]>(DEFAULT_SPECIALTIES);
  const [contactInfo, setContactInfo] = useState<ContactInfo>({
    phone: '',
    whatsapp: '',
    email: '',
    address: '',
    website: '',
    maps_url: ''
  });
  
  // New state for subscription features, branding, and patient fields
  const [subscriptionFeatures, setSubscriptionFeatures] = useState<SubscriptionFeatures>({
    whatsapp_integration: true,
    patient_history: true,
    appointment_scheduling: true,
    medical_records: true,
    analytics_dashboard: false,
    custom_branding: false,
    api_access: false,
    priority_support: false
  });
  
  const [branding, setBranding] = useState<BrandingData>({
    clinic_title: 'ClinicaAdmin',
    clinic_subtitle: 'Sistema de Gestión Médica',
    logo_url: '',
    primary_color: '#3B82F6',
    secondary_color: '#1E40AF'
  });
  
  const [patientFields, setPatientFields] = useState<string[]>([
    'first_name', 'last_name', 'dni', 'address', 'cell_phone', 
    'mutual', 'email', 'birth_date'
  ]);
  
  const [customPatientFields, setCustomPatientFields] = useState<PatientField[]>([]);

  // Load available subscription plans
  useEffect(() => {
    const loadPlans = async () => {
      try {
        const plans = await subscriptionPlansApi.getAll();
        setAvailablePlans(plans);
        console.log('✅ Planes cargados:', plans);
      } catch (error) {
        console.error('❌ Error cargando planes:', error);
        // Fallback a planes hardcodeados si la API falla
        setAvailablePlans([
          { plan_id: 'trial', name: 'Trial', price: 0, description: 'Gratuito' },
          { plan_id: 'basic', name: 'Básico', price: 29.99, description: 'Plan básico' },
          { plan_id: 'premium', name: 'Premium', price: 59.99, description: 'Plan premium' },
          { plan_id: 'enterprise', name: 'Empresarial', price: 99.99, description: 'Plan empresarial' }
        ]);
      }
    };

    if (open) {
      loadPlans();
    }
  }, [open]);

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
    
    // Auto-sync contact info with basic clinic data
    if (field === 'cell_phone') {
      setContactInfo(prev => ({
        ...prev,
        phone: value,
        whatsapp: value
      }));
    } else if (field === 'email') {
      setContactInfo(prev => ({
        ...prev,
        email: value
      }));
    } else if (field === 'address') {
      setContactInfo(prev => ({
        ...prev,
        address: value
      }));
    }
    
    // Auto-generar domain_name, clinic_id, whatsapp_session_name y n8n_folder_name basado en name_clinic
    if (field === 'name_clinic' && value) {
      const domain = value
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '') // Remover acentos
        .replace(/[^a-z0-9]/g, '') // Solo letras y números
        .substring(0, 20); // Máximo 20 caracteres
      
      const clinicId = generateClinicId(value);
      const sessionName = formData.suscriber || clinicId;
      const folderName = `${formData.suscriber || value} - Operativa`;
      
      setFormData(prev => ({
        ...prev,
        domain_name: domain,
        clinic_id: clinicId,
        whatsapp_session_name: sessionName,
        n8n_folder_name: folderName
      }));
      
      // Auto-update branding title
      setBranding(prev => ({
        ...prev,
        clinic_title: value,
        clinic_subtitle: `Sistema de Gestión Médica - ${value}`
      }));
    }
    
    // Auto-update session name when suscriber changes
    if (field === 'suscriber' && value) {
      setFormData(prev => ({
        ...prev,
        whatsapp_session_name: value,
        n8n_folder_name: `${value} - Operativa`
      }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      setLoading(true);
      setError(null);
      
      console.log('🏥 Creando nueva clínica:', { formData, services, schedule, contactInfo });
      
      const token = localStorage.getItem('admin_token');
      if (!token) {
        throw new Error('Token de administrador no encontrado');
      }

      // Create clinic with all data
      const clinicData = {
        ...formData,
        services,
        schedule,
        contact_info: contactInfo,
        specialties,
        subscription_features: subscriptionFeatures,
        branding,
        patient_form_fields: patientFields,
        custom_patient_fields: customPatientFields.map(field => ({
          field_name: field.field_name,
          field_label: field.field_label,
          field_type: field.field_type,
          is_required: field.is_required,
          is_visible: field.is_visible,
          validation_rules: {},
          options: field.options || null,
          placeholder: field.placeholder || null,
          help_text: field.help_text || null,
          order: 0
        }))
      };

      const response = await fetch('/api/admin/clinics', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(clinicData)
      });

      if (!response.ok) {
        const errorData = await response.text();
        console.error('❌ Error creando clínica:', response.status, errorData);
        
        if (response.status === 400) {
          throw new Error('Datos inválidos o clínica ya existe con ese ID/email');
        } else if (response.status === 401) {
          throw new Error('Sesión expirada. Por favor, inicia sesión nuevamente');
        } else {
          throw new Error(`Error del servidor: ${response.status}`);
        }
      }

      const newClinic = await response.json();
      console.log('✅ Clínica creada exitosamente:', newClinic);

      // Initialize default services if not already included
      try {
        const initResponse = await fetch(`/api/clinics/${newClinic.id}/services/initialize`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });
        
        if (initResponse.ok) {
          console.log('✅ Servicios por defecto inicializados');
        }
      } catch (initErr) {
        console.warn('⚠️ Error inicializando servicios:', initErr);
        // Don't fail the entire operation
      }
      
      // PASO 2: Esperar finalización del guardado
      console.log('⏳ PASO 2: Esperando finalización del guardado...');
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // PASO 3: Limpiar formulario
      console.log('🧹 PASO 3: Limpiando formulario...');
      resetForm();
      
      // PASO 4: Notificar al padre para refrescar datos ANTES de cerrar modal
      console.log('🔄 PASO 4: Refrescando datos de clínicas...');
      onClinicCreated();
      
      // PASO 5: Esperar que se actualicen los datos
      console.log('⏳ PASO 5: Esperando actualización de datos...');
      await new Promise(resolve => setTimeout(resolve, 300));
      
      // PASO 6: Finalmente cerrar modal
      console.log('❌ PASO 6: Cerrando modal...');
      setOpen(false);
      
    } catch (err) {
      console.error('❌ Error en creación de clínica:', err);
      setError(err instanceof Error ? err.message : 'Error desconocido');
    } finally {
      // Solo quitar loading después de todo el proceso
      setTimeout(() => {
        setLoading(false);
      }, 100);
    }
  };

  const resetForm = () => {
    setFormData({
      clinic_id: '',
      name_clinic: '',
      suscriber: '',
      email: '',
      cell_phone: '',
      address: '',
      domain_name: '',
      subscription_plan: 'trial',
      subscription_status: 'trial',
      subscription_expires: '',
      max_professionals: 5,
      max_patients: 100,
      password: '',
      status_clinic: 'active',
      whatsapp_session_name: '',
      n8n_folder_name: ''
    });
    setServices(DEFAULT_SERVICES);
    setSchedule(DEFAULT_SCHEDULE);
    setSpecialties(DEFAULT_SPECIALTIES);
    setContactInfo({
      phone: '',
      whatsapp: '',
      email: '',
      address: '',
      website: '',
      maps_url: ''
    });
    setSubscriptionFeatures({
      whatsapp_integration: true,
      patient_history: true,
      appointment_scheduling: true,
      medical_records: true,
      analytics_dashboard: false,
      custom_branding: false,
      api_access: false,
      priority_support: false
    });
    setBranding({
      clinic_title: 'ClinicaAdmin',
      clinic_subtitle: 'Sistema de Gestión Médica',
      logo_url: '',
      primary_color: '#3B82F6',
      secondary_color: '#1E40AF'
    });
    setPatientFields([
      'first_name', 'last_name', 'dni', 'address', 'cell_phone', 
      'mutual', 'email', 'birth_date'
    ]);
    setCustomPatientFields([]);
    setActiveTab('basic');
    setError(null);
  };

  // Service management functions
  const addService = () => {
    const newService: ServiceData = {
      service_id: `srv_${Date.now()}`,
      service_type: '',
      description: '',
      base_price: 0,
      currency: 'COP',
      duration_minutes: 30,
      category: 'General',
      requires_appointment: true,
      is_active: true
    };
    setServices([...services, newService]);
  };

  const updateService = (index: number, field: keyof ServiceData, value: any) => {
    const updatedServices = [...services];
    updatedServices[index] = { ...updatedServices[index], [field]: value };
    setServices(updatedServices);
  };

  const removeService = (index: number) => {
    setServices(services.filter((_, i) => i !== index));
  };

  // Schedule management functions
  const updateWorkingHour = (dayIndex: number, field: keyof WorkingHours, value: any) => {
    const updatedSchedule = { ...schedule };
    updatedSchedule.working_hours[dayIndex] = {
      ...updatedSchedule.working_hours[dayIndex],
      [field]: value
    };
    setSchedule(updatedSchedule);
  };

  // Contact info management
  const updateContactInfo = (field: keyof ContactInfo, value: string) => {
    setContactInfo(prev => ({ ...prev, [field]: value }));
  };
  
  // Subscription features management
  const updateSubscriptionFeature = (field: keyof SubscriptionFeatures, value: boolean) => {
    setSubscriptionFeatures(prev => ({ ...prev, [field]: value }));
  };
  
  // Branding management
  const updateBranding = (field: keyof BrandingData, value: string) => {
    setBranding(prev => ({ ...prev, [field]: value }));
  };
  
  // Patient fields management
  const togglePatientField = (fieldName: string) => {
    setPatientFields(prev => 
      prev.includes(fieldName) 
        ? prev.filter(f => f !== fieldName)
        : [...prev, fieldName]
    );
  };
  
  const addCustomPatientField = () => {
    const newField: PatientField = {
      field_name: `custom_${Date.now()}`,
      field_label: '',
      field_type: 'text',
      is_required: false,
      is_visible: true,
      placeholder: '',
      help_text: ''
    };
    setCustomPatientFields([...customPatientFields, newField]);
  };
  
  const updateCustomPatientField = (index: number, field: keyof PatientField, value: any) => {
    const updatedFields = [...customPatientFields];
    updatedFields[index] = { ...updatedFields[index], [field]: value };
    setCustomPatientFields(updatedFields);
  };
  
  const removeCustomPatientField = (index: number) => {
    setCustomPatientFields(customPatientFields.filter((_, i) => i !== index));
  };

  const handleClose = () => {
    if (!loading) {
      setOpen(false);
      resetForm();
    }
  };

  // Modal usando solo CSS y div - garantiza visibilidad
  return (
    <>
      {/* Botón para abrir modal */}
      <Button 
        onClick={() => setOpen(true)}
        className="bg-medical-500 hover:bg-medical-600"
      >
        <Building2 className="h-4 w-4 mr-2" />
        Nueva Clínica
      </Button>

      {/* Modal overlay y contenido */}
      {open && (
        <div 
          className="fixed inset-0 z-[100] flex items-center justify-center"
          style={{ 
            backgroundColor: 'rgba(0, 0, 0, 0.8)',
            backdropFilter: 'blur(4px)' 
          }}
        >
          <div 
            className="relative bg-slate-800 border border-slate-700 rounded-lg shadow-2xl w-full max-w-[600px] max-h-[90vh] overflow-y-auto m-4"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header del modal */}
            <div className="flex items-center justify-between p-6 border-b border-slate-700">
              <div>
                <h2 className="text-xl font-semibold text-white flex items-center gap-2">
                  <Building2 className="h-5 w-5 text-medical-400" />
                  Crear Nueva Clínica
                </h2>
                <p className="text-sm text-slate-400 mt-1">
                  Registra una nueva clínica médica en el sistema con su configuración inicial.
                </p>
              </div>
              <Button
                onClick={handleClose}
                variant="ghost"
                size="sm"
                className="text-slate-400 hover:text-slate-200 hover:bg-slate-700"
                disabled={loading}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>

            {/* Contenido del formulario con tabs */}
            <div className="p-6">
              <form onSubmit={handleSubmit} className="space-y-4">
                {error && (
                  <Alert variant="destructive" className="bg-red-900/30 border-red-800 text-red-200">
                    <AlertDescription>{error}</AlertDescription>
                  </Alert>
                )}

                <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                  <TabsList className="grid w-full grid-cols-7 bg-slate-700 text-xs">
                    <TabsTrigger value="basic" className="text-slate-200">Básico</TabsTrigger>
                    <TabsTrigger value="services" className="text-slate-200">Servicios</TabsTrigger>
                    <TabsTrigger value="schedule" className="text-slate-200">Horarios</TabsTrigger>
                    <TabsTrigger value="contact" className="text-slate-200">Contacto</TabsTrigger>
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
                        <CardDescription className="text-slate-400">
                          Datos fundamentales de la clínica médica
                        </CardDescription>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <Label htmlFor="clinic_id" className="text-slate-200">ID de Clínica</Label>
                            <Input
                              id="clinic_id"
                              value={formData.clinic_id}
                              onChange={(e) => handleInputChange('clinic_id', e.target.value)}
                              placeholder="clinica-demo-001"
                              className="bg-slate-800 border-slate-600 text-slate-100"
                              required
                              disabled={loading}
                            />
                          </div>

                          <div className="space-y-2">
                            <Label htmlFor="name_clinic" className="text-slate-200">Nombre de la Clínica *</Label>
                            <Input
                              id="name_clinic"
                              value={formData.name_clinic}
                              onChange={(e) => handleInputChange('name_clinic', e.target.value)}
                              placeholder="Clínica Médica Demo"
                              className="bg-slate-800 border-slate-600 text-slate-100"
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
                              placeholder="Dr. Juan Pérez"
                              className="bg-slate-800 border-slate-600 text-slate-100"
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
                              placeholder="demo@clinicamedica.com"
                              className="bg-slate-800 border-slate-600 text-slate-100"
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
                              placeholder="+54911234567"
                              className="bg-slate-800 border-slate-600 text-slate-100"
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
                              placeholder="clinicamedica"
                              className="bg-slate-800 border-slate-600 text-slate-100"
                              required
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
                            placeholder="Av. Corrientes 1234, CABA"
                            className="bg-slate-800 border-slate-600 text-slate-100"
                            rows={2}
                            required
                            disabled={loading}
                          />
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <Label htmlFor="subscription_plan" className="text-slate-200">Plan de Suscripción</Label>
                            <select
                              id="subscription_plan"
                              value={formData.subscription_plan}
                              onChange={(e) => handleInputChange('subscription_plan', e.target.value)}
                              className="flex h-10 w-full rounded-md border border-slate-600 bg-slate-800 px-3 py-2 text-sm text-slate-100 focus:outline-none focus:ring-2 focus:ring-medical-500"
                              required
                              disabled={loading}
                            >
                              {availablePlans.length > 0 ? (
                                availablePlans.map((plan) => (
                                  <option key={plan.plan_id} value={plan.plan_id}>
                                    {plan.name} ({plan.price > 0 ? `$${plan.price}/mes` : 'Gratuito'})
                                  </option>
                                ))
                              ) : (
                                <>
                                  <option value="trial">Trial (Gratuito)</option>
                                  <option value="basic">Básico ($29.99/mes)</option>
                                  <option value="premium">Premium ($59.99/mes)</option>
                                  <option value="enterprise">Empresarial ($99.99/mes)</option>
                                </>
                              )}
                            </select>
                          </div>

                          <div className="space-y-2">
                            <Label htmlFor="password" className="text-slate-200">Contraseña Inicial *</Label>
                            <Input
                              id="password"
                              type="password"
                              value={formData.password}
                              onChange={(e) => handleInputChange('password', e.target.value)}
                              placeholder="••••••••"
                              className="bg-slate-800 border-slate-600 text-slate-100"
                              required
                              minLength={8}
                              disabled={loading}
                            />
                          </div>
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <Label htmlFor="whatsapp_session_name" className="text-slate-200">Nombre de Sesión WhatsApp</Label>
                            <Input
                              id="whatsapp_session_name"
                              value={formData.whatsapp_session_name}
                              onChange={(e) => handleInputChange('whatsapp_session_name', e.target.value)}
                              placeholder="clinica-demo-wa"
                              className="bg-slate-800 border-slate-600 text-slate-100"
                              disabled={loading}
                            />
                            <p className="text-xs text-slate-500">Se auto-genera basado en el suscriptor</p>
                          </div>

                          <div className="space-y-2">
                            <Label htmlFor="n8n_folder_name" className="text-slate-200">Carpeta N8N</Label>
                            <Input
                              id="n8n_folder_name"
                              value={formData.n8n_folder_name}
                              onChange={(e) => handleInputChange('n8n_folder_name', e.target.value)}
                              placeholder="Clinica Demo - Operativa"
                              className="bg-slate-800 border-slate-600 text-slate-100"
                              disabled={loading}
                            />
                            <p className="text-xs text-slate-500">Carpeta para workflows de automatización</p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </TabsContent>

                  {/* Servicios Médicos */}
                  <TabsContent value="services" className="space-y-4">
                    <Card className="bg-slate-700 border-slate-600">
                      <CardHeader className="flex flex-row items-center justify-between">
                        <div>
                          <CardTitle className="text-slate-200 flex items-center gap-2">
                            <DollarSign className="h-5 w-5" />
                            Servicios Médicos
                          </CardTitle>
                          <CardDescription className="text-slate-400">
                            Configurar los servicios que ofrece la clínica
                          </CardDescription>
                        </div>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={addService}
                          className="border-slate-600 bg-slate-800 text-slate-200"
                          disabled={loading}
                        >
                          <Plus className="h-4 w-4 mr-2" />
                          Agregar
                        </Button>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        {services.map((service, index) => (
                          <div key={service.service_id} className="p-4 bg-slate-800 rounded-lg border border-slate-600">
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                              <div className="space-y-2">
                                <Label className="text-slate-200">Tipo de Servicio</Label>
                                <Input
                                  value={service.service_type}
                                  onChange={(e) => updateService(index, 'service_type', e.target.value)}
                                  placeholder="Consulta General"
                                  className="bg-slate-700 border-slate-600 text-slate-100"
                                  disabled={loading}
                                />
                              </div>

                              <div className="space-y-2">
                                <Label className="text-slate-200">Precio Base (COP)</Label>
                                <Input
                                  type="number"
                                  value={service.base_price}
                                  onChange={(e) => updateService(index, 'base_price', parseFloat(e.target.value) || 0)}
                                  placeholder="50000"
                                  className="bg-slate-700 border-slate-600 text-slate-100"
                                  disabled={loading}
                                />
                              </div>

                              <div className="space-y-2">
                                <Label className="text-slate-200">Duración (min)</Label>
                                <Input
                                  type="number"
                                  value={service.duration_minutes}
                                  onChange={(e) => updateService(index, 'duration_minutes', parseInt(e.target.value) || 30)}
                                  placeholder="30"
                                  className="bg-slate-700 border-slate-600 text-slate-100"
                                  disabled={loading}
                                />
                              </div>

                              <div className="space-y-2 md:col-span-2">
                                <Label className="text-slate-200">Descripción</Label>
                                <Input
                                  value={service.description}
                                  onChange={(e) => updateService(index, 'description', e.target.value)}
                                  placeholder="Descripción del servicio"
                                  className="bg-slate-700 border-slate-600 text-slate-100"
                                  disabled={loading}
                                />
                              </div>

                              <div className="flex items-end justify-between">
                                <div className="flex items-center space-x-2">
                                  <input
                                    type="checkbox"
                                    id={`service-${index}-active`}
                                    checked={service.is_active}
                                    onChange={(e) => updateService(index, 'is_active', e.target.checked)}
                                    className="w-4 h-4"
                                    disabled={loading}
                                  />
                                  <Label htmlFor={`service-${index}-active`} className="text-slate-200 text-sm">Activo</Label>
                                </div>
                                <Button
                                  type="button"
                                  variant="destructive"
                                  size="sm"
                                  onClick={() => removeService(index)}
                                  disabled={loading || services.length <= 1}
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </div>
                            </div>
                          </div>
                        ))}
                      </CardContent>
                    </Card>
                  </TabsContent>

                  {/* Horarios de Atención */}
                  <TabsContent value="schedule" className="space-y-4">
                    <Card className="bg-slate-700 border-slate-600">
                      <CardHeader>
                        <CardTitle className="text-slate-200 flex items-center gap-2">
                          <Clock className="h-5 w-5" />
                          Horarios de Atención
                        </CardTitle>
                        <CardDescription className="text-slate-400">
                          Configurar los días y horas de operación
                        </CardDescription>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        {/* Group working hours by day */}
                        {['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'].map((dayName) => {
                          const dayHours = schedule.working_hours.filter(h => h.day_of_week === dayName);
                          const isAvailable = dayHours.some(h => h.is_available);
                          
                          return (
                            <div key={dayName} className="p-4 bg-slate-800 rounded-lg">
                              <div className="flex items-center gap-4 mb-3">
                                <div className="w-20">
                                  <Label className="text-slate-200 capitalize">{dayName}</Label>
                                </div>
                                <div className="flex items-center gap-2">
                                  <input
                                    type="checkbox"
                                    checked={isAvailable}
                                    onChange={(e) => {
                                      if (e.target.checked) {
                                        // Add default hours if none exist
                                        if (dayHours.length === 0) {
                                          setSchedule(prev => ({
                                            ...prev,
                                            working_hours: [...prev.working_hours,
                                              { day_of_week: dayName, start_time: '09:00', end_time: '13:00', is_available: true },
                                              { day_of_week: dayName, start_time: '16:00', end_time: '20:00', is_available: true }
                                            ]
                                          }));
                                        } else {
                                          // Enable existing hours
                                          setSchedule(prev => ({
                                            ...prev,
                                            working_hours: prev.working_hours.map(h => 
                                              h.day_of_week === dayName ? { ...h, is_available: true } : h
                                            )
                                          }));
                                        }
                                      } else {
                                        // Disable all hours for this day
                                        setSchedule(prev => ({
                                          ...prev,
                                          working_hours: prev.working_hours.map(h => 
                                            h.day_of_week === dayName ? { ...h, is_available: false } : h
                                          )
                                        }));
                                      }
                                    }}
                                    disabled={loading}
                                  />
                                  <Label className="text-slate-200 text-sm">Disponible</Label>
                                </div>
                              </div>
                              
                              {isAvailable && dayHours.map((hour, hourIndex) => {
                                const globalIndex = schedule.working_hours.findIndex(h => 
                                  h.day_of_week === hour.day_of_week && 
                                  h.start_time === hour.start_time && 
                                  h.end_time === hour.end_time
                                );
                                
                                return hour.is_available ? (
                                  <div key={`${dayName}-${hourIndex}-${hour.start_time}-${hour.end_time}`} className="flex items-center gap-2 ml-24 mb-2">
                                    <Input
                                      type="time"
                                      value={hour.start_time}
                                      onChange={(e) => updateWorkingHour(globalIndex, 'start_time', e.target.value)}
                                      className="bg-slate-700 border-slate-600 text-slate-100 w-32"
                                      disabled={loading}
                                    />
                                    <span className="text-slate-400">a</span>
                                    <Input
                                      type="time"
                                      value={hour.end_time}
                                      onChange={(e) => updateWorkingHour(globalIndex, 'end_time', e.target.value)}
                                      className="bg-slate-700 border-slate-600 text-slate-100 w-32"
                                      disabled={loading}
                                    />
                                    <Button
                                      type="button"
                                      variant="outline"
                                      size="sm"
                                      onClick={() => {
                                        setSchedule(prev => ({
                                          ...prev,
                                          working_hours: prev.working_hours.filter((_, i) => i !== globalIndex)
                                        }));
                                      }}
                                      className="ml-2 border-red-600 text-red-400 hover:bg-red-600"
                                      disabled={loading}
                                    >
                                      <Trash2 className="h-4 w-4" />
                                    </Button>
                                  </div>
                                ) : null;
                              })}
                              
                              {isAvailable && (
                                <Button
                                  type="button"
                                  variant="outline"
                                  size="sm"
                                  onClick={() => {
                                    setSchedule(prev => ({
                                      ...prev,
                                      working_hours: [...prev.working_hours, {
                                        day_of_week: dayName,
                                        start_time: '09:00',
                                        end_time: '13:00',
                                        is_available: true
                                      }]
                                    }));
                                  }}
                                  className="ml-24 mt-2 border-slate-600 bg-slate-700 text-slate-200"
                                  disabled={loading}
                                >
                                  <Plus className="h-4 w-4 mr-2" />
                                  Agregar Horario
                                </Button>
                              )}
                            </div>
                          );
                        })}
                      </CardContent>
                    </Card>
                  </TabsContent>

                  {/* Información de Contacto */}
                  <TabsContent value="contact" className="space-y-4">
                    <Card className="bg-slate-700 border-slate-600">
                      <CardHeader>
                        <CardTitle className="text-slate-200 flex items-center gap-2">
                          <Users className="h-5 w-5" />
                          Información de Contacto
                        </CardTitle>
                        <CardDescription className="text-slate-400">
                          Datos de contacto adicionales para la clínica
                        </CardDescription>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <Label className="text-slate-200">WhatsApp</Label>
                            <Input
                              value={contactInfo.whatsapp}
                              onChange={(e) => updateContactInfo('whatsapp', e.target.value)}
                              placeholder="+54911234567"
                              className="bg-slate-800 border-slate-600 text-slate-100"
                              disabled={loading}
                            />
                          </div>

                          <div className="space-y-2">
                            <Label className="text-slate-200">Sitio Web</Label>
                            <Input
                              value={contactInfo.website}
                              onChange={(e) => updateContactInfo('website', e.target.value)}
                              placeholder="https://www.clinica.com"
                              className="bg-slate-800 border-slate-600 text-slate-100"
                              disabled={loading}
                            />
                          </div>

                          <div className="space-y-2 md:col-span-2">
                            <Label className="text-slate-200">URL de Google Maps</Label>
                            <Input
                              value={contactInfo.maps_url}
                              onChange={(e) => updateContactInfo('maps_url', e.target.value)}
                              placeholder="https://maps.google.com/..."
                              className="bg-slate-800 border-slate-600 text-slate-100"
                              disabled={loading}
                            />
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </TabsContent>

                  {/* Suscripción y Límites */}
                  <TabsContent value="subscription" className="space-y-4">
                    <Card className="bg-slate-700 border-slate-600">
                      <CardHeader>
                        <CardTitle className="text-slate-200 flex items-center gap-2">
                          <Settings className="h-5 w-5" />
                          Configuración de Suscripción
                        </CardTitle>
                        <CardDescription className="text-slate-400">
                          Límites y características de la suscripción
                        </CardDescription>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <Label className="text-slate-200">Máximo Profesionales</Label>
                            <Input
                              type="number"
                              value={formData.max_professionals}
                              onChange={(e) => handleInputChange('max_professionals', parseInt(e.target.value) || 5)}
                              placeholder="5"
                              className="bg-slate-800 border-slate-600 text-slate-100"
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
                              placeholder="100"
                              className="bg-slate-800 border-slate-600 text-slate-100"
                              min="1"
                              max="10000"
                              disabled={loading}
                            />
                          </div>
                          
                          <div className="space-y-2">
                            <Label className="text-slate-200">Estado de Suscripción</Label>
                            <select
                              value={formData.subscription_status}
                              onChange={(e) => handleInputChange('subscription_status', e.target.value)}
                              className="flex h-10 w-full rounded-md border border-slate-600 bg-slate-800 px-3 py-2 text-sm text-slate-100"
                              disabled={loading}
                            >
                              <option value="trial">Trial</option>
                              <option value="active">Activa</option>
                              <option value="expired">Expirada</option>
                              <option value="cancelled">Cancelada</option>
                            </select>
                          </div>

                          <div className="space-y-2">
                            <Label className="text-slate-200">Fecha de Expiración</Label>
                            <Input
                              type="date"
                              value={formData.subscription_expires}
                              onChange={(e) => handleInputChange('subscription_expires', e.target.value)}
                              className="bg-slate-800 border-slate-600 text-slate-100"
                              disabled={loading}
                            />
                          </div>
                        </div>
                        
                        <div className="space-y-3">
                          <Label className="text-slate-200">Características Incluidas</Label>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                            {Object.entries(subscriptionFeatures).map(([key, value]) => (
                              <div key={key} className="flex items-center space-x-2">
                                <input
                                  type="checkbox"
                                  id={`feature-${key}`}
                                  checked={value}
                                  onChange={(e) => updateSubscriptionFeature(key as keyof SubscriptionFeatures, e.target.checked)}
                                  className="w-4 h-4"
                                  disabled={loading}
                                />
                                <Label htmlFor={`feature-${key}`} className="text-slate-200 text-sm capitalize">
                                  {key.replace(/_/g, ' ')}
                                </Label>
                              </div>
                            ))}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </TabsContent>

                  {/* Branding y Personalización */}
                  <TabsContent value="branding" className="space-y-4">
                    <Card className="bg-slate-700 border-slate-600">
                      <CardHeader>
                        <CardTitle className="text-slate-200 flex items-center gap-2">
                          <Palette className="h-5 w-5" />
                          Branding y Personalización
                        </CardTitle>
                        <CardDescription className="text-slate-400">
                          Personaliza la apariencia de la clínica
                        </CardDescription>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <Label className="text-slate-200">Título de la Clínica</Label>
                            <Input
                              value={branding.clinic_title}
                              onChange={(e) => updateBranding('clinic_title', e.target.value)}
                              placeholder="ClinicaAdmin"
                              className="bg-slate-800 border-slate-600 text-slate-100"
                              disabled={loading}
                            />
                          </div>

                          <div className="space-y-2">
                            <Label className="text-slate-200">Subtítulo</Label>
                            <Input
                              value={branding.clinic_subtitle}
                              onChange={(e) => updateBranding('clinic_subtitle', e.target.value)}
                              placeholder="Sistema de Gestión Médica"
                              className="bg-slate-800 border-slate-600 text-slate-100"
                              disabled={loading}
                            />
                          </div>

                          <div className="space-y-2">
                            <Label className="text-slate-200">URL del Logo</Label>
                            <Input
                              value={branding.logo_url}
                              onChange={(e) => updateBranding('logo_url', e.target.value)}
                              placeholder="https://example.com/logo.png"
                              className="bg-slate-800 border-slate-600 text-slate-100"
                              disabled={loading}
                            />
                          </div>

                          <div className="space-y-2">
                            <Label className="text-slate-200">Dominio de Email</Label>
                            <Input
                              value={`${formData.domain_name || 'clinic'}.com`}
                              className="bg-slate-800 border-slate-600 text-slate-100"
                              disabled
                            />
                            <p className="text-xs text-slate-500">Se genera automáticamente</p>
                          </div>

                          <div className="space-y-2">
                            <Label className="text-slate-200">Color Primario</Label>
                            <div className="flex gap-2">
                              <Input
                                type="color"
                                value={branding.primary_color}
                                onChange={(e) => updateBranding('primary_color', e.target.value)}
                                className="w-16 h-10 bg-slate-800 border-slate-600"
                                disabled={loading}
                              />
                              <Input
                                value={branding.primary_color}
                                onChange={(e) => updateBranding('primary_color', e.target.value)}
                                placeholder="#3B82F6"
                                className="bg-slate-800 border-slate-600 text-slate-100"
                                disabled={loading}
                              />
                            </div>
                          </div>

                          <div className="space-y-2">
                            <Label className="text-slate-200">Color Secundario</Label>
                            <div className="flex gap-2">
                              <Input
                                type="color"
                                value={branding.secondary_color}
                                onChange={(e) => updateBranding('secondary_color', e.target.value)}
                                className="w-16 h-10 bg-slate-800 border-slate-600"
                                disabled={loading}
                              />
                              <Input
                                value={branding.secondary_color}
                                onChange={(e) => updateBranding('secondary_color', e.target.value)}
                                placeholder="#1E40AF"
                                className="bg-slate-800 border-slate-600 text-slate-100"
                                disabled={loading}
                              />
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </TabsContent>

                  {/* Integración y Campos de Pacientes */}
                  <TabsContent value="integration" className="space-y-4">
                    <Card className="bg-slate-700 border-slate-600">
                      <CardHeader>
                        <CardTitle className="text-slate-200 flex items-center gap-2">
                          <UserCheck className="h-5 w-5" />
                          Campos de Pacientes
                        </CardTitle>
                        <CardDescription className="text-slate-400">
                          Configura los campos del formulario de pacientes
                        </CardDescription>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <div className="space-y-3">
                          <Label className="text-slate-200">Campos Estándar</Label>
                          <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                            {['first_name', 'last_name', 'dni', 'address', 'cell_phone', 'mutual', 'email', 'birth_date'].map((field) => (
                              <div key={field} className="flex items-center space-x-2">
                                <input
                                  type="checkbox"
                                  id={`patient-field-${field}`}
                                  checked={patientFields.includes(field)}
                                  onChange={() => togglePatientField(field)}
                                  className="w-4 h-4"
                                  disabled={loading}
                                />
                                <Label htmlFor={`patient-field-${field}`} className="text-slate-200 text-sm">
                                  {field.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                                </Label>
                              </div>
                            ))}
                          </div>
                        </div>
                        
                        <div className="space-y-3">
                          <div className="flex items-center justify-between">
                            <Label className="text-slate-200">Campos Personalizados</Label>
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              onClick={addCustomPatientField}
                              className="border-slate-600 bg-slate-800 text-slate-200"
                              disabled={loading}
                            >
                              <Plus className="h-4 w-4 mr-2" />
                              Agregar Campo
                            </Button>
                          </div>
                          
                          {customPatientFields.map((field, index) => (
                            <div key={`custom-field-${index}-${field.field_name || 'unnamed'}`} className="p-3 bg-slate-800 rounded-lg border border-slate-600">
                              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                                <div className="space-y-2">
                                  <Label className="text-slate-200 text-sm">Nombre del Campo</Label>
                                  <Input
                                    value={field.field_name}
                                    onChange={(e) => updateCustomPatientField(index, 'field_name', e.target.value)}
                                    placeholder="campo_personalizado"
                                    className="bg-slate-700 border-slate-600 text-slate-100"
                                    disabled={loading}
                                  />
                                </div>
                                
                                <div className="space-y-2">
                                  <Label className="text-slate-200 text-sm">Etiqueta</Label>
                                  <Input
                                    value={field.field_label}
                                    onChange={(e) => updateCustomPatientField(index, 'field_label', e.target.value)}
                                    placeholder="Campo Personalizado"
                                    className="bg-slate-700 border-slate-600 text-slate-100"
                                    disabled={loading}
                                  />
                                </div>
                                
                                <div className="space-y-2">
                                  <Label className="text-slate-200 text-sm">Tipo</Label>
                                  <select
                                    value={field.field_type}
                                    onChange={(e) => updateCustomPatientField(index, 'field_type', e.target.value)}
                                    className="flex h-10 w-full rounded-md border border-slate-600 bg-slate-700 px-3 py-2 text-sm text-slate-100"
                                    disabled={loading}
                                  >
                                    <option value="text">Texto</option>
                                    <option value="number">Número</option>
                                    <option value="email">Email</option>
                                    <option value="phone">Teléfono</option>
                                    <option value="date">Fecha</option>
                                    <option value="select">Selección</option>
                                    <option value="textarea">Texto Largo</option>
                                    <option value="boolean">Sí/No</option>
                                  </select>
                                </div>
                                
                                <div className="flex items-center space-x-4">
                                  <div className="flex items-center space-x-2">
                                    <input
                                      type="checkbox"
                                      id={`custom-required-${index}`}
                                      checked={field.is_required}
                                      onChange={(e) => updateCustomPatientField(index, 'is_required', e.target.checked)}
                                      className="w-4 h-4"
                                      disabled={loading}
                                    />
                                    <Label htmlFor={`custom-required-${index}`} className="text-slate-200 text-sm">Requerido</Label>
                                  </div>
                                  
                                  <Button
                                    type="button"
                                    variant="destructive"
                                    size="sm"
                                    onClick={() => removeCustomPatientField(index)}
                                    disabled={loading}
                                  >
                                    <Trash2 className="h-4 w-4" />
                                  </Button>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </CardContent>
                    </Card>
                  </TabsContent>
                </Tabs>

                {/* Botones */}
                <div className="flex justify-end gap-3 pt-4">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={handleClose}
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
                    {loading && (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    )}
                    {loading ? (
                      'Creando...'
                    ) : (
                      <>
                        <Building2 className="mr-2 h-4 w-4" />
                        Crear Clínica
                      </>
                    )}
                  </Button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </>
  );
}