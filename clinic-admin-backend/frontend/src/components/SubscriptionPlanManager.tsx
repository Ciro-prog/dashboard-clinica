import React, { useState, useEffect } from 'react';
import { 
  CreditCard, Plus, Edit, Trash2, Save, X, Eye, EyeOff, 
  Copy, DollarSign, Users, Database, Calendar, Settings,
  CheckCircle, XCircle, AlertTriangle
} from 'lucide-react';

interface PlanFeatures {
  whatsapp_integration: boolean;
  patient_history: boolean;
  appointment_scheduling: boolean;
  medical_records: boolean;
  analytics_dashboard: boolean;
  custom_branding: boolean;
  api_access: boolean;
  priority_support: boolean;
  custom_features?: { [key: string]: any };
}

interface SubscriptionPlan {
  id: string;
  plan_id: string;
  name: string;
  description: string;
  price: number;
  currency: string;
  duration_days: number;
  max_professionals: number;
  max_patients: number;
  storage_limit_gb: number;
  features: PlanFeatures;
  is_active: boolean;
  is_custom: boolean;
  display_order: number;
  color: string;
  highlight: boolean;
  created_at: string;
  clinics_count?: number;
  monthly_revenue?: number;
}

interface SubscriptionPlanManagerProps {
  onBack: () => void;
}

const SubscriptionPlanManager: React.FC<SubscriptionPlanManagerProps> = ({ onBack }) => {
  const [plans, setPlans] = useState<SubscriptionPlan[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [editingPlan, setEditingPlan] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  
  const [formData, setFormData] = useState<Partial<SubscriptionPlan>>({
    plan_id: '',
    name: '',
    description: '',
    price: 0,
    currency: 'USD',
    duration_days: 30,
    max_professionals: 5,
    max_patients: 200,
    storage_limit_gb: 25,
    features: {
      whatsapp_integration: true,
      patient_history: true,
      appointment_scheduling: false,
      medical_records: false,
      analytics_dashboard: false,
      custom_branding: false,
      api_access: false,
      priority_support: false
    },
    is_active: true,
    display_order: 0,
    color: '#3B82F6',
    highlight: false
  });

  const featureLabels = {
    whatsapp_integration: 'Integración WhatsApp',
    patient_history: 'Historial de Pacientes',
    appointment_scheduling: 'Programación de Citas',
    medical_records: 'Registros Médicos',
    analytics_dashboard: 'Dashboard de Análisis',
    custom_branding: 'Personalización de Marca',
    api_access: 'Acceso a API',
    priority_support: 'Soporte Prioritario'
  };

  useEffect(() => {
    loadPlans();
  }, []);

  const loadPlans = async () => {
    try {
      const token = localStorage.getItem('admin_token');
      const response = await fetch('/api/subscription-plans/', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        console.log('🔍 API Response Structure:', data);
        console.log('🔍 Response Type:', typeof data);
        console.log('🔍 Is Array:', Array.isArray(data));
        
        // Simplificar lógica - la API retorna array directo de planes
        if (Array.isArray(data)) {
          console.log('✅ Processing array of plans, count:', data.length);
          setPlans(data);
        } else if (data && typeof data === 'object') {
          console.log('🔍 Object structure keys:', Object.keys(data));
          // Intentar encontrar el array de planes en propiedades comunes
          const plansArray = data.plans || data.data || data.results || data.items;
          if (Array.isArray(plansArray)) {
            console.log('✅ Found plans in nested property, count:', plansArray.length);
            setPlans(plansArray);
          } else {
            console.warn('❌ No array found in response object');
            setPlans([]);
          }
        } else {
          console.warn('❌ Unexpected response format:', typeof data);
          setPlans([]);
        }
      } else {
        const errorText = await response.text();
        console.error('❌ HTTP Error:', response.status, response.statusText);
        console.error('❌ Error Response:', errorText);
        setPlans([]);
      }
    } catch (error) {
      console.error('❌ Network/Parse Error:', error);
      setPlans([]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreatePlan = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);

    try {
      const token = localStorage.getItem('admin_token');
      const response = await fetch('/api/subscription-plans/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(formData)
      });

      if (response.ok) {
        alert('¡Plan de suscripción creado exitosamente!');
        setShowCreateForm(false);
        resetForm();
        loadPlans();
      } else {
        const errorData = await response.json();
        throw new Error(errorData.detail || 'Error al crear el plan');
      }
    } catch (error: any) {
      alert(`Error: ${error.message}`);
    } finally {
      setIsSaving(false);
    }
  };

  const handleUpdatePlan = async (planId: string, updates: Partial<SubscriptionPlan>) => {
    setIsSaving(true);
    try {
      const token = localStorage.getItem('admin_token');
      const response = await fetch(`/api/subscription-plans/${planId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(updates)
      });

      if (response.ok) {
        alert('¡Plan actualizado exitosamente!');
        setEditingPlan(null);
        loadPlans();
      } else {
        const errorData = await response.json();
        throw new Error(errorData.detail || 'Error al actualizar el plan');
      }
    } catch (error: any) {
      alert(`Error: ${error.message}`);
    } finally {
      setIsSaving(false);
    }
  };

  const handleTogglePlanStatus = async (planId: string) => {
    try {
      const token = localStorage.getItem('admin_token');
      const response = await fetch(`/api/subscription-plans/${planId}/toggle-status`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        const result = await response.json();
        alert(result.message);
        loadPlans();
      } else {
        throw new Error('Error al cambiar estado del plan');
      }
    } catch (error: any) {
      alert(`Error: ${error.message}`);
    }
  };

  const handleDuplicatePlan = async (sourcePlanId: string) => {
    const newPlanId = prompt('ID para el nuevo plan:');
    const newName = prompt('Nombre para el nuevo plan:');
    
    if (!newPlanId || !newName) return;

    try {
      const token = localStorage.getItem('admin_token');
      const response = await fetch(`/api/subscription-plans/${sourcePlanId}/duplicate?new_plan_id=${newPlanId}&new_name=${encodeURIComponent(newName)}`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        alert('¡Plan duplicado exitosamente!');
        loadPlans();
      } else {
        const errorData = await response.json();
        throw new Error(errorData.detail || 'Error al duplicar el plan');
      }
    } catch (error: any) {
      alert(`Error: ${error.message}`);
    }
  };

  const handleDeletePlan = async (planId: string) => {
    if (!confirm('¿Estás seguro de que quieres eliminar este plan? Esta acción no se puede deshacer.')) {
      return;
    }

    try {
      const token = localStorage.getItem('admin_token');
      const response = await fetch(`/api/subscription-plans/${planId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        alert('¡Plan eliminado exitosamente!');
        loadPlans();
      } else {
        const errorData = await response.json();
        throw new Error(errorData.detail || 'Error al eliminar el plan');
      }
    } catch (error: any) {
      alert(`Error: ${error.message}`);
    }
  };

  const resetForm = () => {
    setFormData({
      plan_id: '',
      name: '',
      description: '',
      price: 0,
      currency: 'USD',
      duration_days: 30,
      max_professionals: 5,
      max_patients: 200,
      storage_limit_gb: 25,
      features: {
        whatsapp_integration: true,
        patient_history: true,
        appointment_scheduling: false,
        medical_records: false,
        analytics_dashboard: false,
        custom_branding: false,
        api_access: false,
        priority_support: false
      },
      is_active: true,
      display_order: 0,
      color: '#3B82F6',
      highlight: false
    });
  };

  const updateFormFeature = (feature: keyof PlanFeatures, value: boolean) => {
    setFormData(prev => ({
      ...prev,
      features: {
        ...prev.features!,
        [feature]: value
      }
    }));
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-medical-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Cargando planes de suscripción...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <button
            onClick={onBack}
            className="flex items-center px-3 py-2 text-sm border border-gray-300 rounded hover:bg-gray-50 mb-4"
          >
            ← Volver
          </button>
          <h1 className="text-2xl font-bold text-gray-900">Gestión de Planes de Suscripción</h1>
          <p className="text-gray-600">Administra los planes disponibles para las clínicas</p>
        </div>
        <button
          onClick={() => setShowCreateForm(true)}
          className="flex items-center px-4 py-2 bg-medical-600 text-white rounded-lg hover:bg-medical-700 transition-colors"
        >
          <Plus className="w-4 h-4 mr-2" />
          Crear Nuevo Plan
        </button>
      </div>

      {/* Create/Edit Form */}
      {(showCreateForm || editingPlan) && (
        <div className="bg-white rounded-lg card-shadow p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-medium text-gray-900">
              {editingPlan ? 'Editar Plan' : 'Crear Nuevo Plan'}
            </h3>
            <button
              onClick={() => {
                setShowCreateForm(false);
                setEditingPlan(null);
                resetForm();
              }}
              className="text-gray-400 hover:text-gray-600"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <form onSubmit={handleCreatePlan} className="space-y-6">
            {/* Basic Information */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  ID del Plan * (Se generará automáticamente si se deja vacío)
                </label>
                <input
                  type="text"
                  value={formData.plan_id}
                  onChange={(e) => setFormData({...formData, plan_id: e.target.value})}
                  placeholder="Se generará automáticamente basado en el nombre"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-medical-500"
                  disabled={!!editingPlan}
                />
                <p className="text-xs text-gray-500 mt-1">
                  💡 Deja vacío para generar ID único automáticamente
                </p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Nombre del Plan *
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({...formData, name: e.target.value})}
                  placeholder="Plan Personalizado"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-medical-500"
                  required
                />
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Descripción
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({...formData, description: e.target.value})}
                  placeholder="Descripción del plan..."
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-medical-500"
                />
              </div>
            </div>

            {/* Pricing and Limits */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <DollarSign className="w-4 h-4 inline mr-1" />
                  Precio Mensual *
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={formData.price}
                  onChange={(e) => setFormData({...formData, price: parseFloat(e.target.value) || 0})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-medical-500"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <Users className="w-4 h-4 inline mr-1" />
                  Max. Profesionales *
                </label>
                <input
                  type="number"
                  min="1"
                  max="1000"
                  value={formData.max_professionals}
                  onChange={(e) => setFormData({...formData, max_professionals: parseInt(e.target.value) || 1})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-medical-500"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <Database className="w-4 h-4 inline mr-1" />
                  Max. Pacientes *
                </label>
                <input
                  type="number"
                  min="1"
                  max="100000"
                  value={formData.max_patients}
                  onChange={(e) => setFormData({...formData, max_patients: parseInt(e.target.value) || 1})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-medical-500"
                  required
                />
              </div>
            </div>

            {/* Features */}
            <div>
              <h4 className="text-sm font-medium text-gray-700 mb-3">Características del Plan</h4>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {Object.entries(featureLabels).map(([key, label]) => (
                  <div key={key} className="flex items-center">
                    <input
                      type="checkbox"
                      id={key}
                      checked={formData.features?.[key as keyof PlanFeatures] || false}
                      onChange={(e) => updateFormFeature(key as keyof PlanFeatures, e.target.checked)}
                      className="rounded border-gray-300 text-medical-600 focus:ring-medical-500"
                    />
                    <label htmlFor={key} className="ml-2 text-sm text-gray-700">
                      {label}
                    </label>
                  </div>
                ))}
              </div>
            </div>

            {/* Styling */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Color del Plan
                </label>
                <div className="flex items-center space-x-2">
                  <input
                    type="color"
                    value={formData.color}
                    onChange={(e) => setFormData({...formData, color: e.target.value})}
                    className="w-12 h-10 rounded-md border border-gray-300 cursor-pointer"
                  />
                  <input
                    type="text"
                    value={formData.color}
                    onChange={(e) => setFormData({...formData, color: e.target.value})}
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-medical-500"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Orden de Visualización
                </label>
                <input
                  type="number"
                  min="0"
                  value={formData.display_order}
                  onChange={(e) => setFormData({...formData, display_order: parseInt(e.target.value) || 0})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-medical-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Opciones
                </label>
                <div className="space-y-2">
                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      id="highlight"
                      checked={formData.highlight || false}
                      onChange={(e) => setFormData({...formData, highlight: e.target.checked})}
                      className="rounded border-gray-300 text-medical-600 focus:ring-medical-500"
                    />
                    <label htmlFor="highlight" className="ml-2 text-sm text-gray-700">
                      Destacar como "Recomendado"
                    </label>
                  </div>
                </div>
              </div>
            </div>

            {/* Form Actions */}
            <div className="flex space-x-3 pt-4 border-t">
              <button
                type="submit"
                disabled={isSaving}
                className="px-6 py-2 bg-medical-600 text-white rounded-md hover:bg-medical-700 transition-colors disabled:opacity-50"
              >
                {isSaving ? 'Guardando...' : (editingPlan ? 'Actualizar Plan' : 'Crear Plan')}
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowCreateForm(false);
                  setEditingPlan(null);
                  resetForm();
                }}
                className="px-6 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 transition-colors"
              >
                Cancelar
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Plans Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {Array.isArray(plans) && plans.map((plan) => (
          <div key={plan.id} className="bg-white rounded-lg card-shadow p-6 relative">
            {/* Plan Status Indicator */}
            <div className="absolute top-4 right-4 flex space-x-2">
              {!plan.is_active && (
                <span className="w-3 h-3 bg-red-500 rounded-full" title="Inactivo"></span>
              )}
              {plan.highlight && (
                <span className="px-2 py-1 bg-yellow-100 text-yellow-800 text-xs rounded-full">Popular</span>
              )}
              {!plan.is_custom && (
                <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full">Sistema</span>
              )}
            </div>

            {/* Plan Header */}
            <div className="mb-4">
              <div 
                className="w-12 h-12 rounded-lg mb-3"
                style={{ backgroundColor: plan.color }}
              ></div>
              <h3 className="text-lg font-semibold text-gray-900">{plan.name}</h3>
              <p className="text-sm text-gray-600 mb-2">{plan.description}</p>
              <div className="text-2xl font-bold text-gray-900">
                ${plan.price}
                <span className="text-sm font-normal text-gray-600">/mes</span>
              </div>
            </div>

            {/* Plan Details */}
            <div className="space-y-2 mb-4">
              <div className="flex items-center text-sm text-gray-600">
                <Users className="w-4 h-4 mr-2" />
                {plan.max_professionals} profesionales
              </div>
              <div className="flex items-center text-sm text-gray-600">
                <Database className="w-4 h-4 mr-2" />
                {plan.max_patients} pacientes
              </div>
              {plan.clinics_count !== undefined && (
                <div className="flex items-center text-sm text-gray-600">
                  <CreditCard className="w-4 h-4 mr-2" />
                  {plan.clinics_count} clínicas activas
                </div>
              )}
              {plan.monthly_revenue !== undefined && plan.monthly_revenue > 0 && (
                <div className="flex items-center text-sm text-green-600">
                  <DollarSign className="w-4 h-4 mr-2" />
                  ${plan.monthly_revenue}/mes revenue
                </div>
              )}
            </div>

            {/* Features Preview */}
            <div className="mb-4">
              <div className="text-xs text-gray-500 mb-2">Características:</div>
              <div className="space-y-1">
                {Object.entries(plan.features).slice(0, 3).map(([key, enabled]) => (
                  <div key={key} className="flex items-center text-xs">
                    {enabled ? (
                      <CheckCircle className="w-3 h-3 text-green-500 mr-1" />
                    ) : (
                      <XCircle className="w-3 h-3 text-gray-300 mr-1" />
                    )}
                    <span className={enabled ? 'text-gray-700' : 'text-gray-400'}>
                      {featureLabels[key as keyof typeof featureLabels] || key}
                    </span>
                  </div>
                ))}
                {Object.keys(plan.features).length > 3 && (
                  <div className="text-xs text-gray-500">
                    +{Object.keys(plan.features).length - 3} más...
                  </div>
                )}
              </div>
            </div>

            {/* Actions */}
            <div className="flex space-x-2">
              <button
                onClick={() => {
                  setFormData({
                    ...plan,
                    features: plan.features
                  });
                  setEditingPlan(plan.plan_id);
                  setShowCreateForm(true);
                }}
                className="flex-1 flex items-center justify-center px-3 py-1 text-sm border border-gray-300 rounded hover:bg-gray-50"
              >
                <Edit className="w-3 h-3 mr-1" />
                Editar
              </button>
              <button
                onClick={() => handleTogglePlanStatus(plan.plan_id)}
                className={`flex items-center justify-center px-3 py-1 text-sm rounded transition-colors ${
                  plan.is_active
                    ? 'bg-red-100 text-red-700 hover:bg-red-200'
                    : 'bg-green-100 text-green-700 hover:bg-green-200'
                }`}
              >
                {plan.is_active ? (
                  <EyeOff className="w-3 h-3" />
                ) : (
                  <Eye className="w-3 h-3" />
                )}
              </button>
              <button
                onClick={() => handleDuplicatePlan(plan.plan_id)}
                className="flex items-center justify-center px-3 py-1 text-sm border border-gray-300 rounded hover:bg-gray-50"
              >
                <Copy className="w-3 h-3" />
              </button>
              {plan.is_custom && plan.clinics_count === 0 && (
                <button
                  onClick={() => handleDeletePlan(plan.plan_id)}
                  className="flex items-center justify-center px-3 py-1 text-sm bg-red-100 text-red-700 rounded hover:bg-red-200"
                >
                  <Trash2 className="w-3 h-3" />
                </button>
              )}
            </div>
          </div>
        ))}
      </div>

      {Array.isArray(plans) && plans.length === 0 && (
        <div className="text-center py-12">
          <CreditCard className="w-12 h-12 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No hay planes configurados</h3>
          <p className="text-gray-600 mb-4">Crea el primer plan de suscripción para el sistema</p>
          <button
            onClick={() => setShowCreateForm(true)}
            className="px-4 py-2 bg-medical-600 text-white rounded-lg hover:bg-medical-700 transition-colors"
          >
            Crear Primer Plan
          </button>
        </div>
      )}
    </div>
  );
};

export default SubscriptionPlanManager;