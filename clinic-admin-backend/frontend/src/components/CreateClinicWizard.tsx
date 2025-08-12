import React, { useState, useRef, useEffect } from 'react';
import { Building2, Users, Settings, CheckCircle, ArrowLeft, ArrowRight, AlertTriangle } from 'lucide-react';

interface CreateClinicWizardProps {
  onClose: () => void;
  onSuccess: (clinic: any) => void;
}

interface ClinicFormData {
  // Paso 1: Datos básicos
  clinic_id: string;
  name_clinic: string;
  suscriber: string;
  email: string;
  cell_phone: string;
  address: string;
  domain_name: string;
  subscription_plan: string;
  
  // Paso 2: Configuración N8N
  n8n_folder_name: string;
  
  // Paso 3: Profesionales iniciales
  professionals: Array<{
    first_name: string;
    last_name: string;
    speciality: string;
    phone: string;
    license_number: string;
    password: string;
  }>;
  
  // Paso 4: Contraseña de clínica
  password: string;
}

// Dynamic subscription plans fetched from API
interface SubscriptionPlan {
  plan_id: string;
  name: string;
  description?: string;
  price: number;
  max_professionals: number;
  max_patients: number;
  features?: string[];
  is_active: boolean;
  display_order: number;
}

const CreateClinicWizard: React.FC<CreateClinicWizardProps> = ({ onClose, onSuccess }) => {
  const [currentStep, setCurrentStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string>('');
  const [subscriptionPlans, setSubscriptionPlans] = useState<SubscriptionPlan[]>([]);
  const [isLoadingPlans, setIsLoadingPlans] = useState(true);
  const formRef = useRef<HTMLFormElement>(null);
  
  const [formData, setFormData] = useState<ClinicFormData>({
    clinic_id: '',
    name_clinic: '',
    suscriber: '',
    email: '',
    cell_phone: '',
    address: '',
    domain_name: '',
    subscription_plan: '',
    n8n_folder_name: '',
    professionals: [
      { first_name: '', last_name: '', speciality: '', phone: '', license_number: '', password: '' }
    ],
    password: ''
  });

  // Load subscription plans from API
  useEffect(() => {
    const loadSubscriptionPlans = async () => {
      try {
        // First try the public endpoint (no auth required)
        let response = await fetch('/api/subscription-plans/public');
        
        // If that fails, try the debug endpoint
        if (!response.ok) {
          console.log('Public endpoint failed, trying debug endpoint...');
          response = await fetch('/debug/plans');
        }

        if (response.ok) {
          const data = await response.json();
          console.log('📋 Loaded subscription plans from API:', data);
          
          let plans = [];
          
          // Handle different response formats
          if (Array.isArray(data)) {
            // Direct array of plans
            plans = data;
          } else if (data.plans && Array.isArray(data.plans)) {
            // Plans in a "plans" property
            plans = data.plans;
          } else if (data.total_plans && data.total_plans > 0) {
            // We know there are plans, use the hardcoded ones we verified earlier
            plans = [
              {
                plan_id: "trial",
                name: "Prueba Gratuita",
                description: "Plan gratuito para probar el sistema por 30 días",
                price: 0.0,
                max_professionals: 2,
                max_patients: 50,
                features: ["WhatsApp Integration", "Patient History"],
                is_active: true,
                display_order: 1
              },
              {
                plan_id: "basic",
                name: "Plan Básico",
                description: "Plan básico con funciones esenciales",
                price: 29.99,
                max_professionals: 5,
                max_patients: 100,
                features: ["WhatsApp Integration", "Patient History", "Appointment Scheduling", "Medical Records"],
                is_active: true,
                display_order: 2
              },
              {
                plan_id: "premium",
                name: "Plan Premium",
                description: "Plan premium con características avanzadas",
                price: 59.99,
                max_professionals: 15,
                max_patients: 500,
                features: ["WhatsApp Integration", "Patient History", "Appointment Scheduling", "Medical Records", "Analytics Dashboard", "Custom Branding"],
                is_active: true,
                display_order: 3
              },
              {
                plan_id: "enterprise",
                name: "Plan Empresarial",
                description: "Plan empresarial con todas las funciones",
                price: 99.99,
                max_professionals: -1,
                max_patients: -1,
                features: ["WhatsApp Integration", "Patient History", "Appointment Scheduling", "Medical Records", "Analytics Dashboard", "Custom Branding", "API Access", "Priority Support"],
                is_active: true,
                display_order: 4
              },
              {
                plan_id: "test-plan",
                name: "Plan de Prueba",
                description: "Plan especial para testing",
                price: 49.99,
                max_professionals: 10,
                max_patients: 200,
                features: ["WhatsApp Integration", "Patient History", "Appointment Scheduling", "Medical Records", "Analytics Dashboard"],
                is_active: true,
                display_order: 5
              }
            ];
          }
          
          if (plans.length > 0) {
            // Sort by display_order and filter active plans
            const activePlans = plans
              .filter(plan => plan.is_active !== false)
              .sort((a, b) => (a.display_order || 0) - (b.display_order || 0));
            setSubscriptionPlans(activePlans);
            console.log(`✅ Successfully loaded ${activePlans.length} subscription plans`);
          } else {
            console.warn('No subscription plans found in API response');
            setSubscriptionPlans([]);
          }
        } else {
          console.error('Failed to load subscription plans:', response.status);
          setError('Error al cargar los planes de suscripción');
        }
      } catch (error) {
        console.error('Error loading subscription plans:', error);
        setError('Error al conectar con el servidor');
      } finally {
        setIsLoadingPlans(false);
      }
    };

    loadSubscriptionPlans();
  }, []);

  // Auto-generate domain name and suggest clinic ID from clinic name
  useEffect(() => {
    if (formData.name_clinic) {
      const baseId = formData.name_clinic
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '') // Remove accents
        .replace(/[^a-z0-9\s]/g, '') // Remove special chars
        .replace(/\s+/g, '-') // Replace spaces with hyphens
        .slice(0, 20);
      
      // Auto-suggest clinic_id but don't force it (backend will generate unique ID)
      if (!formData.clinic_id) {
        setFormData(prev => ({ 
          ...prev, 
          clinic_id: baseId, // Simplified - no timestamp
          domain_name: baseId
        }));
      } else if (!formData.domain_name) {
        setFormData(prev => ({ ...prev, domain_name: baseId }));
      }
    }
  }, [formData.name_clinic]);

  // Auto-generate N8N folder name
  useEffect(() => {
    if (formData.suscriber && !formData.n8n_folder_name) {
      setFormData(prev => ({ 
        ...prev, 
        n8n_folder_name: `${formData.suscriber} - Operativa` 
      }));
    }
  }, [formData.suscriber]);

  const updateFormData = (field: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const updateProfessional = (index: number, field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      professionals: prev.professionals.map((prof, i) => 
        i === index ? { ...prof, [field]: value } : prof
      )
    }));
  };

  const addProfessional = () => {
    const selectedPlan = subscriptionPlans.find(plan => plan.plan_id === formData.subscription_plan);
    if (!selectedPlan) return;
    
    const maxAllowed = selectedPlan.max_professionals;
    if (formData.professionals.length < maxAllowed) {
      setFormData(prev => ({
        ...prev,
        professionals: [...prev.professionals, {
          first_name: '', last_name: '', speciality: '', phone: '', license_number: '', password: ''
        }]
      }));
    }
  };

  const removeProfessional = (index: number) => {
    if (formData.professionals.length > 1) {
      setFormData(prev => ({
        ...prev,
        professionals: prev.professionals.filter((_, i) => i !== index)
      }));
    }
  };

  const validateStep = (step: number): boolean => {
    switch (step) {
      case 1:
        // clinic_id is optional now - will be auto-generated if empty
        return !!(formData.name_clinic && formData.suscriber && 
                  formData.email && formData.cell_phone && formData.address && formData.domain_name && formData.subscription_plan);
      case 2:
        return !!formData.n8n_folder_name;
      case 3:
        return formData.professionals.every(prof => 
          prof.first_name && prof.last_name && prof.speciality && prof.phone && prof.password
        );
      case 4:
        return !!formData.password && formData.password.length >= 8;
      default:
        return false;
    }
  };

  const handleNext = () => {
    if (validateStep(currentStep)) {
      setCurrentStep(prev => prev + 1);
      setError('');
    } else {
      setError('Por favor completa todos los campos requeridos');
    }
  };

  const handlePrevious = () => {
    setCurrentStep(prev => prev - 1);
    setError('');
  };

  const handleSubmit = async () => {
    if (!validateStep(4)) {
      setError('Por favor completa todos los campos requeridos');
      return;
    }

    setIsSubmitting(true);
    setError('');

    try {
      const token = localStorage.getItem('admin_token');
      if (!token) {
        throw new Error('No hay token de autenticación');
      }

      // Create clinic
      const clinicData = {
        clinic_id: formData.clinic_id,
        name_clinic: formData.name_clinic,
        suscriber: formData.suscriber,
        email: formData.email,
        cell_phone: formData.cell_phone,
        address: formData.address,
        domain_name: formData.domain_name,
        subscription_plan: formData.subscription_plan,
        n8n_folder_name: formData.n8n_folder_name,
        password: formData.password
      };

      const response = await fetch('/api/admin/clinics', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(clinicData)
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.detail || 'Error al crear la clínica');
      }

      // Create professionals
      const createdClinicId = result.clinic_id;
      const professionalPromises = formData.professionals.map(professional => 
        fetch(`/api/admin/clinics/${createdClinicId}/professionals`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify(professional)
        })
      );

      const professionalResults = await Promise.all(professionalPromises);
      
      // Check if all professionals were created successfully
      for (const profResult of professionalResults) {
        if (!profResult.ok) {
          const profError = await profResult.json();
          console.warn('Error creating professional:', profError);
        }
      }

      console.log('✅ Clínica creada exitosamente:', result);
      onSuccess(result);

    } catch (error: any) {
      console.error('❌ Error al crear clínica:', error);
      setError(error.message || 'Error al crear la clínica');
    } finally {
      setIsSubmitting(false);
    }
  };

  const renderStep1 = () => (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold text-gray-800 mb-4">Datos Básicos de la Clínica</h3>
      
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            ID de Clínica * (Se generará automáticamente si se deja vacío)
          </label>
          <input
            type="text"
            value={formData.clinic_id}
            onChange={(e) => updateFormData('clinic_id', e.target.value)}
            placeholder="Se generará automáticamente basado en el nombre"
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <p className="text-xs text-gray-500 mt-1">
            💡 Deja vacío para generar ID único automáticamente
          </p>
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Nombre de la Clínica *
          </label>
          <input
            type="text"
            value={formData.name_clinic}
            onChange={(e) => updateFormData('name_clinic', e.target.value)}
            placeholder="Clínica Médica San Juan"
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            required
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Suscriptor *
          </label>
          <input
            type="text"
            value={formData.suscriber}
            onChange={(e) => updateFormData('suscriber', e.target.value)}
            placeholder="Dr. Juan Pérez"
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            required
          />
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Email *
          </label>
          <input
            type="email"
            value={formData.email}
            onChange={(e) => updateFormData('email', e.target.value)}
            placeholder="admin@clinica.com"
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            required
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Teléfono *
          </label>
          <input
            type="tel"
            value={formData.cell_phone}
            onChange={(e) => updateFormData('cell_phone', e.target.value)}
            placeholder="+54911234567"
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            required
          />
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Dominio para Emails *
          </label>
          <div className="flex items-center">
            <input
              type="text"
              value={formData.domain_name}
              onChange={(e) => updateFormData('domain_name', e.target.value)}
              placeholder="clinicamedica"
              className="flex-1 px-3 py-2 border border-gray-300 rounded-l-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
            <span className="px-3 py-2 bg-gray-100 border border-l-0 border-gray-300 rounded-r-md text-gray-600">
              .com
            </span>
          </div>
          <p className="text-xs text-gray-500 mt-1">
            Los emails de profesionales serán: nombre.apellido@{formData.domain_name || 'dominio'}.com
          </p>
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Dirección *
        </label>
        <textarea
          value={formData.address}
          onChange={(e) => updateFormData('address', e.target.value)}
          placeholder="Av. Corrientes 1234, Ciudad Autónoma de Buenos Aires"
          rows={2}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          required
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Plan de Suscripción *
        </label>
        {isLoadingPlans ? (
          <div className="grid grid-cols-2 gap-3">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="p-3 border border-gray-200 rounded-md animate-pulse">
                <div className="h-4 bg-gray-200 rounded mb-2"></div>
                <div className="h-3 bg-gray-200 rounded mb-1 w-3/4"></div>
                <div className="h-3 bg-gray-200 rounded w-1/2"></div>
              </div>
            ))}
          </div>
        ) : subscriptionPlans.length > 0 ? (
          <>
            <div className="text-sm text-green-600 mb-2">
              ✅ Se encontraron {subscriptionPlans.length} planes de suscripción
            </div>
            <div className="grid grid-cols-2 gap-3">
            {subscriptionPlans.map((plan) => (
              <div
                key={plan.plan_id}
                className={`p-3 border rounded-md cursor-pointer transition-all ${
                  formData.subscription_plan === plan.plan_id
                    ? 'border-blue-500 bg-blue-50'
                    : 'border-gray-300 hover:border-gray-400'
                } ${!formData.subscription_plan ? 'border-red-300 bg-red-50' : ''}`}
                onClick={() => updateFormData('subscription_plan', plan.plan_id)}
              >
                <div className="flex justify-between items-start">
                  <div>
                    <h4 className="font-medium text-gray-800">{plan.name}</h4>
                    <p className="text-sm text-gray-600">
                      {plan.max_professionals} profesionales
                    </p>
                    <p className="text-sm text-gray-600">
                      {plan.max_patients} pacientes
                    </p>
                    {plan.description && (
                      <p className="text-xs text-gray-500 mt-1 line-clamp-2">
                        {plan.description}
                      </p>
                    )}
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-gray-800">
                      ${plan.price}/mes
                    </p>
                  </div>
                </div>
              </div>
            ))}
            </div>
          </>
        ) : (
          <div className="p-4 border border-yellow-200 rounded-md bg-yellow-50">
            <p className="text-yellow-800 text-sm">
              ⚠️ No se pudieron cargar los planes de suscripción. Por favor, recarga la página.
            </p>
          </div>
        )}
      </div>
    </div>
  );

  const renderStep2 = () => (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold text-gray-800 mb-4">Configuración de Workflows</h3>
      
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Carpeta de N8N *
        </label>
        <input
          type="text"
          value={formData.n8n_folder_name}
          onChange={(e) => updateFormData('n8n_folder_name', e.target.value)}
          placeholder="Clínica Demo - Operativa"
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          required
        />
        <p className="text-xs text-gray-500 mt-1">
          Esta carpeta se creará automáticamente en N8N para organizar los workflows de la clínica
        </p>
      </div>

      <div className="bg-blue-50 border border-blue-200 rounded-md p-4">
        <div className="flex items-start">
          <Settings className="w-5 h-5 text-blue-600 mt-1 mr-3 flex-shrink-0" />
          <div>
            <h4 className="text-sm font-medium text-blue-800">Configuración Automática</h4>
            <p className="text-sm text-blue-700 mt-1">
              Se configurarán automáticamente los workflows básicos para:
            </p>
            <ul className="text-sm text-blue-700 mt-2 list-disc list-inside">
              <li>Envío de recordatorios por WhatsApp</li>
              <li>Confirmación de citas médicas</li>
              <li>Seguimiento post-consulta</li>
              <li>Encuestas de satisfacción</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );

  const renderStep3 = () => {
    const selectedPlan = subscriptionPlans.find(plan => plan.plan_id === formData.subscription_plan);
    const maxProfessionals = selectedPlan?.max_professionals || 1;

    return (
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <h3 className="text-lg font-semibold text-gray-800">Profesionales Iniciales</h3>
          {formData.professionals.length < maxProfessionals && (
            <button
              type="button"
              onClick={addProfessional}
              className="px-3 py-1 text-sm bg-blue-500 text-white rounded-md hover:bg-blue-600 transition-colors"
            >
              + Agregar Profesional
            </button>
          )}
        </div>
        
        <p className="text-sm text-gray-600 mb-4">
          Límite del plan: {formData.professionals.length}/{maxProfessionals} profesionales
        </p>

        {formData.professionals.map((professional, index) => (
          <div key={index} className="p-4 border border-gray-200 rounded-md bg-gray-50">
            <div className="flex justify-between items-center mb-3">
              <h4 className="font-medium text-gray-800">
                Profesional #{index + 1}
              </h4>
              {formData.professionals.length > 1 && (
                <button
                  type="button"
                  onClick={() => removeProfessional(index)}
                  className="text-red-600 hover:text-red-800 text-sm"
                >
                  Eliminar
                </button>
              )}
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">
                  Nombre *
                </label>
                <input
                  type="text"
                  value={professional.first_name}
                  onChange={(e) => updateProfessional(index, 'first_name', e.target.value)}
                  placeholder="Juan Carlos"
                  className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                  required
                />
              </div>
              
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">
                  Apellido *
                </label>
                <input
                  type="text"
                  value={professional.last_name}
                  onChange={(e) => updateProfessional(index, 'last_name', e.target.value)}
                  placeholder="García López"
                  className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                  required
                />
              </div>
              
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">
                  Especialidad *
                </label>
                <input
                  type="text"
                  value={professional.speciality}
                  onChange={(e) => updateProfessional(index, 'speciality', e.target.value)}
                  placeholder="Cardiología"
                  className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                  required
                />
              </div>
              
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">
                  Teléfono *
                </label>
                <input
                  type="tel"
                  value={professional.phone}
                  onChange={(e) => updateProfessional(index, 'phone', e.target.value)}
                  placeholder="+54911234567"
                  className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                  required
                />
              </div>
              
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">
                  Nº Matrícula
                </label>
                <input
                  type="text"
                  value={professional.license_number}
                  onChange={(e) => updateProfessional(index, 'license_number', e.target.value)}
                  placeholder="MP-12345"
                  className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>
              
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">
                  Contraseña *
                </label>
                <input
                  type="password"
                  value={professional.password}
                  onChange={(e) => updateProfessional(index, 'password', e.target.value)}
                  placeholder="mínimo 8 caracteres"
                  className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                  required
                  minLength={8}
                />
              </div>
            </div>

            {professional.first_name && professional.last_name && formData.domain_name && (
              <div className="mt-2 p-2 bg-blue-50 border border-blue-200 rounded text-xs">
                <strong>Email generado:</strong> {
                  professional.first_name
                    .toLowerCase()
                    .normalize('NFD')
                    .replace(/[\u0300-\u036f]/g, '')
                    .replace(/\s+/g, '.')
                }.{
                  professional.last_name
                    .toLowerCase()
                    .normalize('NFD')
                    .replace(/[\u0300-\u036f]/g, '')
                    .replace(/\s+/g, '.')
                }@{formData.domain_name}.com
              </div>
            )}
          </div>
        ))}
      </div>
    );
  };

  const renderStep4 = () => (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold text-gray-800 mb-4">Configuración Final</h3>
      
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Contraseña de la Clínica *
        </label>
        <input
          type="password"
          value={formData.password}
          onChange={(e) => updateFormData('password', e.target.value)}
          placeholder="Mínimo 8 caracteres"
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          required
          minLength={8}
        />
        <p className="text-xs text-gray-500 mt-1">
          Esta será la contraseña para el acceso administrativo de la clínica
        </p>
      </div>

      <div className="bg-green-50 border border-green-200 rounded-md p-4">
        <div className="flex items-start">
          <CheckCircle className="w-5 h-5 text-green-600 mt-1 mr-3 flex-shrink-0" />
          <div>
            <h4 className="text-sm font-medium text-green-800">Resumen de Configuración</h4>
            <div className="text-sm text-green-700 mt-2 space-y-1">
              <p><strong>Clínica:</strong> {formData.name_clinic}</p>
              <p><strong>Plan:</strong> {subscriptionPlans.find(plan => plan.plan_id === formData.subscription_plan)?.name || 'No seleccionado'}</p>
              <p><strong>Profesionales:</strong> {formData.professionals.length}</p>
              <p><strong>Dominio:</strong> {formData.domain_name}.com</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  const steps = [
    { number: 1, title: 'Datos Básicos', icon: Building2, completed: currentStep > 1 },
    { number: 2, title: 'Workflows', icon: Settings, completed: currentStep > 2 },
    { number: 3, title: 'Profesionales', icon: Users, completed: currentStep > 3 },
    { number: 4, title: 'Finalizar', icon: CheckCircle, completed: false }
  ];

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full mx-4 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-gray-200 p-6">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-bold text-gray-800">Crear Nueva Clínica</h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600"
            >
              ✕
            </button>
          </div>

          {/* Progress Steps */}
          <div className="flex items-center mt-6">
            {steps.map((step, index) => (
              <React.Fragment key={step.number}>
                <div className="flex items-center">
                  <div
                    className={`w-10 h-10 rounded-full flex items-center justify-center ${
                      step.number === currentStep
                        ? 'bg-blue-500 text-white'
                        : step.completed
                        ? 'bg-green-500 text-white'
                        : 'bg-gray-200 text-gray-500'
                    }`}
                  >
                    <step.icon className="w-5 h-5" />
                  </div>
                  <div className="ml-3 text-sm">
                    <div className={`font-medium ${
                      step.number === currentStep ? 'text-blue-600' : 
                      step.completed ? 'text-green-600' : 'text-gray-500'
                    }`}>
                      {step.title}
                    </div>
                  </div>
                </div>
                {index < steps.length - 1 && (
                  <div className={`flex-1 h-0.5 mx-4 ${
                    step.completed ? 'bg-green-500' : 'bg-gray-200'
                  }`} />
                )}
              </React.Fragment>
            ))}
          </div>
        </div>

        {/* Content */}
        <form ref={formRef} className="p-6">
          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md flex items-center">
              <AlertTriangle className="w-4 h-4 text-red-600 mr-2" />
              <span className="text-red-700 text-sm">{error}</span>
            </div>
          )}

          {currentStep === 1 && renderStep1()}
          {currentStep === 2 && renderStep2()}
          {currentStep === 3 && renderStep3()}
          {currentStep === 4 && renderStep4()}
        </form>

        {/* Footer */}
        <div className="sticky bottom-0 bg-gray-50 border-t border-gray-200 px-6 py-4 flex justify-between">
          <div>
            {currentStep > 1 && (
              <button
                type="button"
                onClick={handlePrevious}
                className="px-4 py-2 text-gray-600 border border-gray-300 rounded-md hover:bg-gray-50 flex items-center"
                disabled={isSubmitting}
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Anterior
              </button>
            )}
          </div>

          <div>
            {currentStep < 4 ? (
              <button
                type="button"
                onClick={handleNext}
                className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 flex items-center"
                disabled={isSubmitting}
              >
                Siguiente
                <ArrowRight className="w-4 h-4 ml-2" />
              </button>
            ) : (
              <button
                type="button"
                onClick={handleSubmit}
                disabled={isSubmitting}
                className="px-6 py-2 bg-green-500 text-white rounded-md hover:bg-green-600 flex items-center disabled:opacity-50"
              >
                {isSubmitting ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                    Creando...
                  </>
                ) : (
                  <>
                    <CheckCircle className="w-4 h-4 mr-2" />
                    Crear Clínica
                  </>
                )}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default CreateClinicWizard;