import React, { useState, useEffect } from 'react';
import { ArrowLeft, Building2, Palette, CreditCard, FileText, Folder, Settings, Eye, Upload } from 'lucide-react';
import { ClinicData, SubscriptionPlan, ClinicBranding, CustomField } from '../types';
import { formatCurrency, formatDate } from '../lib/utils';

interface ClinicEditorProps {
  clinicId: string;
  onBack: () => void;
}

const ClinicEditor = ({ clinicId, onBack }: ClinicEditorProps) => {
  const [clinic, setClinic] = useState<ClinicData | null>(null);
  const [plans, setPlans] = useState<Record<string, SubscriptionPlan>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('general');
  const [isSaving, setIsSaving] = useState(false);

  // Estados para branding
  const [branding, setBranding] = useState<ClinicBranding>({
    clinic_title: 'ClinicaAdmin',
    clinic_subtitle: 'Sistema de Gestión Médica',
    logo_url: '',
    primary_color: '#3B82F6',
    secondary_color: '#1E40AF'
  });

  // Estados para suscripción
  const [selectedPlan, setSelectedPlan] = useState('trial');
  const [extendCurrent, setExtendCurrent] = useState(false);

  // Estados para campos de pacientes
  const [selectedFields, setSelectedFields] = useState<string[]>([
    'first_name', 'last_name', 'dni', 'address', 'cell_phone'
  ]);

  useEffect(() => {
    loadClinicData();
    loadSubscriptionPlans();
  }, [clinicId]);

  const loadClinicData = async () => {
    try {
      const response = await fetch(`/api/admin/clinics/${clinicId}`);
      if (response.ok) {
        const data = await response.json();
        setClinic(data);
        
        // Inicializar estados con los datos de la clínica
        if (data.branding) {
          setBranding(data.branding);
        }
        if (data.subscription_plan) {
          setSelectedPlan(data.subscription_plan);
        }
        if (data.patient_form_fields) {
          setSelectedFields(data.patient_form_fields);
        }
      } else {
        alert('Error al cargar la información de la clínica');
      }
    } catch (error) {
      alert('Error de conexión al cargar la clínica');
    } finally {
      setIsLoading(false);
    }
  };

  const loadSubscriptionPlans = async () => {
    try {
      const response = await fetch('/api/subscription-plans/');
      if (response.ok) {
        const data = await response.json();
        setPlans(data);
      }
    } catch (error) {
      console.error('Error loading subscription plans:', error);
    }
  };

  const handleUpdateBranding = async () => {
    setIsSaving(true);
    try {
      const response = await fetch(`/api/admin/clinics/${clinicId}/branding`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(branding)
      });

      if (response.ok) {
        alert('¡Configuración de identidad visual actualizada!');
        if (clinic) {
          setClinic({ ...clinic, branding });
        }
      } else {
        throw new Error('Error al actualizar la configuración');
      }
    } catch (error) {
      alert(`Error: ${error.message}`);
    } finally {
      setIsSaving(false);
    }
  };

  const handleUpdateSubscription = async () => {
    setIsSaving(true);
    try {
      const subscriptionData = {
        subscription_plan: selectedPlan,
        extend_current: extendCurrent
      };

      const response = await fetch(`/api/admin/clinics/${clinicId}/subscription`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(subscriptionData)
      });

      if (response.ok) {
        const data = await response.json();
        alert(`¡Suscripción actualizada! Plan: ${plans[selectedPlan]?.name}`);
        
        // Actualizar datos locales
        if (clinic) {
          setClinic({
            ...clinic,
            subscription_plan: selectedPlan,
            subscription_status: selectedPlan === 'trial' ? 'trial' : 'active',
            subscription_expires: data.expires,
            subscription_features: plans[selectedPlan]?.features || clinic.subscription_features,
            max_professionals: plans[selectedPlan]?.max_professionals || clinic.max_professionals,
            max_patients: plans[selectedPlan]?.max_patients || clinic.max_patients
          });
        }
      } else {
        throw new Error('Error al actualizar la suscripción');
      }
    } catch (error) {
      alert(`Error: ${error.message}`);
    } finally {
      setIsSaving(false);
    }
  };

  const handleUpdatePatientFields = async () => {
    setIsSaving(true);
    try {
      const fieldsData = {
        patient_form_fields: selectedFields,
        custom_patient_fields: []
      };

      const response = await fetch(`/api/admin/clinics/${clinicId}/patient-fields`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(fieldsData)
      });

      if (response.ok) {
        alert('¡Configuración de formularios actualizada!');
        if (clinic) {
          setClinic({ ...clinic, patient_form_fields: selectedFields });
        }
      } else {
        throw new Error('Error al actualizar la configuración');
      }
    } catch (error) {
      alert(`Error: ${error.message}`);
    } finally {
      setIsSaving(false);
    }
  };

  const generateColorPalette = (baseColor: string) => {
    return [
      baseColor,
      '#10B981', // Verde médico
      '#3B82F6', // Azul médico
      '#8B5CF6', // Morado
      '#F59E0B', // Amarillo
      '#EF4444', // Rojo
    ];
  };

  const DEFAULT_FIELDS = [
    { id: 'first_name', label: 'Nombre', required: true },
    { id: 'last_name', label: 'Apellido', required: true },
    { id: 'dni', label: 'DNI', required: true },
    { id: 'address', label: 'Dirección', required: true },
    { id: 'cell_phone', label: 'Teléfono Celular', required: true },
    { id: 'mutual', label: 'Obra Social/Mutual', required: false },
    { id: 'email', label: 'Email', required: false },
    { id: 'birth_date', label: 'Fecha de Nacimiento', required: false },
    { id: 'emergency_contact', label: 'Contacto de Emergencia', required: false },
    { id: 'emergency_phone', label: 'Teléfono de Emergencia', required: false },
  ];

  const getPlanBadgeColor = (plan: string) => {
    const colors = {
      trial: 'bg-gray-100 text-gray-800',
      basic: 'bg-blue-100 text-blue-800',
      premium: 'bg-purple-100 text-purple-800',
      enterprise: 'bg-green-100 text-green-800'
    };
    return colors[plan] || 'bg-gray-100 text-gray-800';
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-medical-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Cargando información de la clínica...</p>
        </div>
      </div>
    );
  }

  if (!clinic) {
    return (
      <div className="text-center py-8">
        <Building2 className="w-16 h-16 text-gray-400 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-gray-900 mb-2">Clínica no encontrada</h3>
        <p className="text-gray-600 mb-4">No se pudo cargar la información de la clínica</p>
        <button
          onClick={onBack}
          className="flex items-center px-4 py-2 text-sm border border-gray-300 rounded hover:bg-gray-50"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Volver
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <button
            onClick={onBack}
            className="flex items-center px-3 py-2 text-sm border border-gray-300 rounded hover:bg-gray-50"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Volver
          </button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{clinic.name_clinic}</h1>
            <p className="text-gray-600">{clinic.suscriber} • {clinic.email}</p>
          </div>
        </div>
        <div className="flex items-center space-x-2">
          <span className={`inline-block px-3 py-1 rounded-full text-sm font-medium ${
            clinic.status_clinic === 'active' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
          }`}>
            {clinic.status_clinic}
          </span>
          <span className={`inline-block px-3 py-1 rounded-full text-sm font-medium ${getPlanBadgeColor(clinic.subscription_plan)}`}>
            {clinic.subscription_plan}
          </span>
        </div>
      </div>

      {/* Información General */}
      <div className="bg-white rounded-lg card-shadow p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
          <Building2 className="w-5 h-5 mr-2" />
          Información General
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <div>
            <div className="text-sm font-medium text-gray-500">ID de Clínica</div>
            <div className="font-mono">{clinic.clinic_id}</div>
          </div>
          <div>
            <div className="text-sm font-medium text-gray-500">Teléfono</div>
            <div>{clinic.cell_phone}</div>
          </div>
          <div>
            <div className="text-sm font-medium text-gray-500">Dirección</div>
            <div>{clinic.address}</div>
          </div>
          <div>
            <div className="text-sm font-medium text-gray-500">Límite Profesionales</div>
            <div>{clinic.max_professionals}</div>
          </div>
          <div>
            <div className="text-sm font-medium text-gray-500">Límite Pacientes</div>
            <div>{clinic.max_patients}</div>
          </div>
          <div>
            <div className="text-sm font-medium text-gray-500">Fecha de Registro</div>
            <div>{formatDate(clinic.created_at)}</div>
          </div>
        </div>
      </div>

      {/* Tabs de Configuración */}
      <div className="bg-white rounded-lg card-shadow">
        {/* Tab Navigation */}
        <div className="border-b border-gray-200">
          <nav className="-mb-px flex space-x-8 px-6">
            {[
              { id: 'general', name: 'General', icon: Settings },
              { id: 'branding', name: 'Identidad', icon: Palette },
              { id: 'subscription', name: 'Suscripción', icon: CreditCard },
              { id: 'forms', name: 'Formularios', icon: FileText },
              { id: 'integrations', name: 'N8N', icon: Folder }
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center py-4 px-1 border-b-2 font-medium text-sm ${
                  activeTab === tab.id
                    ? 'border-medical-500 text-medical-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <tab.icon className="w-4 h-4 mr-2" />
                {tab.name}
              </button>
            ))}
          </nav>
        </div>

        {/* Tab Content */}
        <div className="p-6">
          {/* General Tab */}
          {activeTab === 'general' && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <div className="text-sm font-medium text-gray-700 mb-2">WhatsApp Session</div>
                  <div className="p-3 bg-gray-50 rounded border font-mono">
                    {clinic.suscriber || clinic.clinic_id}
                  </div>
                  <p className="text-xs text-gray-500 mt-1">
                    Nombre de sesión usado para WhatsApp Business
                  </p>
                </div>
                <div>
                  <div className="text-sm font-medium text-gray-700 mb-2">Estado de Suscripción</div>
                  <div className="flex items-center space-x-2">
                    <span className={`inline-block px-3 py-1 rounded-full text-sm font-medium ${
                      clinic.subscription_status === 'active' ? 'bg-green-100 text-green-800' : 'bg-orange-100 text-orange-800'
                    }`}>
                      {clinic.subscription_status}
                    </span>
                    {clinic.subscription_expires && (
                      <span className="text-sm text-gray-500">
                        Expira: {formatDate(clinic.subscription_expires)}
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {clinic.subscription_features && (
                <div>
                  <div className="text-sm font-medium text-gray-700 mb-3">Características Habilitadas</div>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                    {Object.entries(clinic.subscription_features).map(([feature, enabled]) => (
                      <div key={feature} className={`p-2 rounded text-sm ${enabled ? 'bg-green-50 text-green-800' : 'bg-gray-50 text-gray-500'}`}>
                        <div className="flex items-center space-x-1">
                          <span>{enabled ? '✓' : '✗'}</span>
                          <span className="text-xs">
                            {feature.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Professionals Tab */}
          {activeTab === 'professionals' && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-lg font-medium text-gray-900 mb-2">Gestión de Profesionales</h4>
                  <p className="text-gray-600">Administra los profesionales de la clínica y sus accesos</p>
                </div>
                <button
                  onClick={() => setShowCreateProfessional(true)}
                  className="flex items-center px-4 py-2 bg-medical-600 text-white rounded-lg hover:bg-medical-700 transition-colors"
                  disabled={clinic && professionals.length >= clinic.max_professionals}
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Agregar Profesional
                </button>
              </div>

              {clinic && (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <div className="flex items-center justify-between">
                    <div className="text-sm text-blue-800">
                      <strong>Profesionales:</strong> {professionals.length} / {clinic.max_professionals}
                    </div>
                    <div className="text-sm text-blue-600">
                      Plan {clinic.subscription_plan} • {clinic.max_professionals - professionals.length} disponibles
                    </div>
                  </div>
                </div>
              )}

              {/* Create Professional Form */}
              {showCreateProfessional && (
                <div className="bg-gray-50 border border-gray-200 rounded-lg p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h5 className="font-medium text-gray-900">Crear Nuevo Profesional</h5>
                    <button
                      onClick={() => setShowCreateProfessional(false)}
                      className="text-gray-400 hover:text-gray-600"
                    >
                      ✕
                    </button>
                  </div>
                  
                  <form onSubmit={handleCreateProfessional} className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Nombre *</label>
                        <input
                          type="text"
                          value={newProfessional.first_name}
                          onChange={(e) => setNewProfessional({...newProfessional, first_name: e.target.value})}
                          placeholder="Juan Carlos"
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-medical-500 focus:border-transparent"
                          required
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Apellido *</label>
                        <input
                          type="text"
                          value={newProfessional.last_name}
                          onChange={(e) => setNewProfessional({...newProfessional, last_name: e.target.value})}
                          placeholder="García López"
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-medical-500 focus:border-transparent"
                          required
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Especialidad *</label>
                        <input
                          type="text"
                          value={newProfessional.speciality}
                          onChange={(e) => setNewProfessional({...newProfessional, speciality: e.target.value})}
                          placeholder="Cardiología"
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-medical-500 focus:border-transparent"
                          required
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Teléfono *</label>
                        <input
                          type="tel"
                          value={newProfessional.phone}
                          onChange={(e) => setNewProfessional({...newProfessional, phone: e.target.value})}
                          placeholder="+54911234567"
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-medical-500 focus:border-transparent"
                          required
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Nº Matrícula</label>
                        <input
                          type="text"
                          value={newProfessional.license_number}
                          onChange={(e) => setNewProfessional({...newProfessional, license_number: e.target.value})}
                          placeholder="MP-12345"
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-medical-500 focus:border-transparent"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Contraseña *</label>
                        <input
                          type="password"
                          value={newProfessional.password}
                          onChange={(e) => setNewProfessional({...newProfessional, password: e.target.value})}
                          placeholder="Mínimo 8 caracteres"
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-medical-500 focus:border-transparent"
                          required
                          minLength={8}
                        />
                      </div>
                    </div>

                    {newProfessional.first_name && newProfessional.last_name && (
                      <div className="p-3 bg-blue-50 border border-blue-200 rounded-md">
                        <div className="text-sm">
                          <strong>Email generado:</strong> {generateEmailPreview(newProfessional.first_name, newProfessional.last_name)}
                        </div>
                      </div>
                    )}

                    <div className="flex space-x-3">
                      <button
                        type="submit"
                        disabled={isSaving}
                        className="px-6 py-2 bg-medical-600 text-white rounded-md hover:bg-medical-700 transition-colors disabled:opacity-50"
                      >
                        {isSaving ? 'Creando...' : 'Crear Profesional'}
                      </button>
                      <button
                        type="button"
                        onClick={() => setShowCreateProfessional(false)}
                        className="px-6 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 transition-colors"
                      >
                        Cancelar
                      </button>
                    </div>
                  </form>
                </div>
              )}

              {/* Professionals List */}
              <div className="bg-white border border-gray-200 rounded-lg">
                <div className="px-6 py-4 border-b border-gray-200">
                  <h5 className="font-medium text-gray-900">Profesionales Registrados ({professionals.length})</h5>
                </div>
                
                {loadingProfessionals ? (
                  <div className="p-6 text-center">
                    <div className="w-6 h-6 border-2 border-medical-500 border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
                    <p className="text-gray-600 text-sm">Cargando profesionales...</p>
                  </div>
                ) : professionals.length === 0 ? (
                  <div className="p-6 text-center text-gray-500">
                    <Users className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                    <p>No hay profesionales registrados aún</p>
                    <p className="text-sm">Haz clic en "Agregar Profesional" para crear el primero</p>
                  </div>
                ) : (
                  <div className="divide-y divide-gray-200">
                    {professionals.map((professional) => (
                      <div key={professional.id} className="p-6">
                        <div className="flex items-center justify-between">
                          <div className="flex-1">
                            <div className="flex items-center space-x-3">
                              <div>
                                <h6 className="font-medium text-gray-900">
                                  {professional.first_name} {professional.last_name}
                                </h6>
                                <div className="flex items-center space-x-2 mt-1">
                                  <Mail className="w-4 h-4 text-gray-400" />
                                  <span className="text-sm text-gray-600">{professional.email}</span>
                                </div>
                              </div>
                              <div className="flex space-x-2">
                                <span className={`inline-block px-2 py-1 rounded-full text-xs font-medium ${
                                  professional.is_active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                                }`}>
                                  {professional.is_active ? 'Activo' : 'Inactivo'}
                                </span>
                                {professional.can_login && (
                                  <span className="inline-block px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                                    Acceso Web
                                  </span>
                                )}
                              </div>
                            </div>
                            <div className="mt-2 text-sm text-gray-500">
                              <div className="flex items-center space-x-4">
                                <span><strong>Especialidad:</strong> {professional.speciality}</span>
                                <span><strong>Teléfono:</strong> {professional.phone}</span>
                                {professional.license_number && (
                                  <span><strong>Matrícula:</strong> {professional.license_number}</span>
                                )}
                              </div>
                              <div className="mt-1">
                                <span><strong>Registrado:</strong> {formatDate(professional.created_at)}</span>
                              </div>
                            </div>
                          </div>
                          <div className="flex space-x-2">
                            <button
                              onClick={() => handleToggleProfessionalStatus(professional.id, professional.is_active)}
                              className={`flex items-center px-3 py-1 text-sm rounded-md transition-colors ${
                                professional.is_active 
                                  ? 'bg-red-100 text-red-700 hover:bg-red-200' 
                                  : 'bg-green-100 text-green-700 hover:bg-green-200'
                              }`}
                              disabled={isSaving}
                            >
                              {professional.is_active ? (
                                <>
                                  <AlertTriangle className="w-4 h-4 mr-1" />
                                  Desactivar
                                </>
                              ) : (
                                <>
                                  <Eye className="w-4 h-4 mr-1" />
                                  Activar
                                </>
                              )}
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Branding Tab */}
          {activeTab === 'branding' && (
            <div className="space-y-6">
              <div>
                <h4 className="text-lg font-medium text-gray-900 mb-4">Configuración de Identidad Visual</h4>
                <p className="text-gray-600 mb-6">Personaliza el título, logo y colores de la clínica</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Título Principal</label>
                  <input
                    type="text"
                    value={branding.clinic_title}
                    onChange={(e) => setBranding({...branding, clinic_title: e.target.value})}
                    placeholder="ClinicaAdmin"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-medical-500 focus:border-transparent"
                  />
                  <p className="text-xs text-gray-500 mt-1">Aparece en el header del sistema</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Subtítulo</label>
                  <input
                    type="text"
                    value={branding.clinic_subtitle}
                    onChange={(e) => setBranding({...branding, clinic_subtitle: e.target.value})}
                    placeholder="Sistema de Gestión Médica"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-medical-500 focus:border-transparent"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">URL del Logo</label>
                <div className="flex space-x-2">
                  <input
                    type="text"
                    value={branding.logo_url}
                    onChange={(e) => setBranding({...branding, logo_url: e.target.value})}
                    placeholder="https://ejemplo.com/logo.png"
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-medical-500 focus:border-transparent"
                  />
                  <button className="px-3 py-2 border border-gray-300 rounded-md hover:bg-gray-50">
                    <Upload className="w-4 h-4" />
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-3">Paleta de Colores</label>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm text-gray-600 mb-2">Color Primario</label>
                    <div className="flex items-center space-x-3">
                      <input
                        type="color"
                        value={branding.primary_color}
                        onChange={(e) => setBranding({...branding, primary_color: e.target.value})}
                        className="w-12 h-10 rounded-md border border-gray-300 cursor-pointer"
                      />
                      <input
                        type="text"
                        value={branding.primary_color}
                        onChange={(e) => setBranding({...branding, primary_color: e.target.value})}
                        className="w-32 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-medical-500 focus:border-transparent"
                      />
                      <div className="flex space-x-1">
                        {generateColorPalette(branding.primary_color).map((color, index) => (
                          <button
                            key={index}
                            type="button"
                            onClick={() => setBranding({...branding, primary_color: color})}
                            className="w-8 h-8 rounded-full border-2 border-gray-200 hover:border-gray-400 transition-colors"
                            style={{ backgroundColor: color }}
                            title={color}
                          />
                        ))}
                      </div>
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm text-gray-600 mb-2">Color Secundario</label>
                    <div className="flex items-center space-x-3">
                      <input
                        type="color"
                        value={branding.secondary_color}
                        onChange={(e) => setBranding({...branding, secondary_color: e.target.value})}
                        className="w-12 h-10 rounded-md border border-gray-300 cursor-pointer"
                      />
                      <input
                        type="text"
                        value={branding.secondary_color}
                        onChange={(e) => setBranding({...branding, secondary_color: e.target.value})}
                        className="w-32 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-medical-500 focus:border-transparent"
                      />
                    </div>
                  </div>
                </div>
              </div>

              <button
                onClick={handleUpdateBranding}
                disabled={isSaving}
                className="px-6 py-2 medical-gradient text-white rounded-md hover:opacity-90 transition-all disabled:opacity-50"
              >
                {isSaving ? 'Guardando...' : 'Guardar Configuración'}
              </button>
            </div>
          )}

          {/* Subscription Tab */}
          {activeTab === 'subscription' && (
            <div className="space-y-6">
              <div>
                <h4 className="text-lg font-medium text-gray-900 mb-4">Gestión de Suscripción</h4>
                <p className="text-gray-600 mb-6">Cambiar el plan de suscripción de la clínica</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Nuevo Plan</label>
                <select
                  value={selectedPlan}
                  onChange={(e) => setSelectedPlan(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-medical-500 focus:border-transparent"
                >
                  {Object.entries(plans).map(([key, plan]) => (
                    <option key={key} value={key}>
                      {plan.name} - {formatCurrency(plan.price)}/mes
                    </option>
                  ))}
                </select>
              </div>

              {clinic.subscription_expires && selectedPlan !== 'trial' && (
                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="extend-current"
                    checked={extendCurrent}
                    onChange={(e) => setExtendCurrent(e.target.checked)}
                    className="rounded border-gray-300 text-medical-600 focus:ring-medical-500"
                  />
                  <label htmlFor="extend-current" className="text-sm text-gray-700">
                    Extender desde la fecha actual de expiración
                  </label>
                </div>
              )}

              {plans[selectedPlan] && (
                <div className="border rounded-lg p-4 bg-gray-50">
                  <h5 className="font-medium mb-3">Características del plan {plans[selectedPlan].name}:</h5>
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    {Object.entries(plans[selectedPlan].features).map(([feature, enabled]) => (
                      <div key={feature} className="flex items-center space-x-2">
                        <span className={`w-4 h-4 flex items-center justify-center rounded-full text-xs ${
                          enabled ? 'bg-green-500 text-white' : 'bg-gray-300 text-gray-600'
                        }`}>
                          {enabled ? '✓' : '✗'}
                        </span>
                        <span className={enabled ? 'text-gray-900' : 'text-gray-500'}>
                          {feature.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <button
                onClick={handleUpdateSubscription}
                disabled={isSaving || selectedPlan === clinic.subscription_plan}
                className="px-6 py-2 medical-gradient text-white rounded-md hover:opacity-90 transition-all disabled:opacity-50"
              >
                {isSaving ? 'Actualizando...' : 'Actualizar Suscripción'}
              </button>
            </div>
          )}

          {/* Forms Tab */}
          {activeTab === 'forms' && (
            <div className="space-y-6">
              <div>
                <h4 className="text-lg font-medium text-gray-900 mb-4">Configuración de Formularios de Pacientes</h4>
                <p className="text-gray-600 mb-6">Personaliza qué campos aparecen en el formulario de registro</p>
              </div>

              <div>
                <h5 className="font-medium mb-3">Campos Disponibles</h5>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                  {DEFAULT_FIELDS.map((field) => (
                    <div
                      key={field.id}
                      className={`border rounded-lg p-3 cursor-pointer transition-colors ${
                        selectedFields.includes(field.id)
                          ? 'border-medical-500 bg-medical-50'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                      onClick={() => {
                        if (selectedFields.includes(field.id)) {
                          setSelectedFields(selectedFields.filter(id => id !== field.id));
                        } else {
                          setSelectedFields([...selectedFields, field.id]);
                        }
                      }}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                          <input
                            type="checkbox"
                            checked={selectedFields.includes(field.id)}
                            onChange={() => {}}
                            className="rounded border-gray-300 text-medical-600 focus:ring-medical-500 pointer-events-none"
                          />
                          <div>
                            <div className="font-medium text-sm">{field.label}</div>
                            <div className="text-xs text-gray-500">Campo de texto</div>
                          </div>
                        </div>
                        {field.required && (
                          <span className="px-2 py-1 bg-red-100 text-red-800 text-xs rounded-full">
                            Obligatorio
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="border rounded-lg p-4 bg-gray-50">
                <div className="text-sm text-gray-600 mb-3">
                  Campos seleccionados ({selectedFields.length} campos):
                </div>
                <div className="space-y-2">
                  {selectedFields.map((fieldId, index) => {
                    const fieldInfo = DEFAULT_FIELDS.find(f => f.id === fieldId);
                    if (!fieldInfo) return null;
                    
                    return (
                      <div key={fieldId} className="flex items-center space-x-2 text-sm">
                        <span className="text-gray-400">{index + 1}.</span>
                        <span className="font-medium">{fieldInfo.label}</span>
                        {fieldInfo.required && (
                          <span className="px-1 py-0.5 bg-red-100 text-red-800 text-xs rounded">*</span>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>

              <button
                onClick={handleUpdatePatientFields}
                disabled={isSaving || selectedFields.length === 0}
                className="px-6 py-2 medical-gradient text-white rounded-md hover:opacity-90 transition-all disabled:opacity-50"
              >
                {isSaving ? 'Guardando...' : 'Guardar Configuración'}
              </button>
            </div>
          )}

          {/* N8N Integration Tab */}
          {activeTab === 'integrations' && (
            <div className="space-y-6">
              <div>
                <h4 className="text-lg font-medium text-gray-900 mb-4">Configuración N8N</h4>
                <p className="text-gray-600 mb-6">Configuración de carpeta y workflows de automatización</p>
              </div>

              <div>
                <div className="text-sm font-medium text-gray-700 mb-2">Carpeta N8N Actual</div>
                <div className="p-3 bg-gray-50 rounded border font-mono">
                  {clinic.n8n_folder_name || `${clinic.suscriber} - Operativa`}
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  Nombre de la carpeta donde se organizarán los workflows de esta clínica
                </p>
              </div>

              <div>
                <div className="text-sm font-medium text-gray-700 mb-3">Workflows Sugeridos</div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div className="p-3 border rounded-lg">
                    <div className="font-medium text-sm">WhatsApp Notifications</div>
                    <div className="text-xs text-gray-500">Notificaciones automáticas por WhatsApp</div>
                  </div>
                  <div className="p-3 border rounded-lg">
                    <div className="font-medium text-sm">Appointment Reminders</div>
                    <div className="text-xs text-gray-500">Recordatorios de citas médicas</div>
                  </div>
                  <div className="p-3 border rounded-lg">
                    <div className="font-medium text-sm">Patient Follow-up</div>
                    <div className="text-xs text-gray-500">Seguimiento post-consulta</div>
                  </div>
                  <div className="p-3 border rounded-lg">
                    <div className="font-medium text-sm">Medical Reports</div>
                    <div className="text-xs text-gray-500">Generación de reportes automáticos</div>
                  </div>
                </div>
              </div>

              <div className="pt-4 border-t">
                <button 
                  onClick={() => window.open('https://dev-n8n.pampaservers.com', '_blank')}
                  className="px-6 py-2 medical-gradient text-white rounded-md hover:opacity-90 transition-all"
                >
                  Abrir N8N Dashboard
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Bulk Professional Creator Modal */}
      {showBulkCreator && clinic && (
        <BulkProfessionalCreator
          clinicId={clinicId}
          clinicDomain={clinic.suscriber || clinic.clinic_id}
          maxProfessionals={clinic.max_professionals}
          currentCount={professionals.length}
          onClose={() => setShowBulkCreator(false)}
          onSuccess={handleBulkProfessionalSuccess}
        />
      )}
    </div>
  );
};

export default ClinicEditor;