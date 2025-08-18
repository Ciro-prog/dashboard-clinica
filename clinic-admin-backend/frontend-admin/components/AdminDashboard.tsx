import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { 
  Home, 
  Users, 
  Building2, 
  CreditCard, 
  Settings, 
  LogOut, 
  ChevronDown,
  Stethoscope,
  User,
  Shield,
  DollarSign,
  TrendingUp,
  Clock,
  AlertCircle,
  CheckCircle,
  RefreshCw,
  Edit,
  Trash2,
  FileText,
  Search,
  X
} from 'lucide-react';
import ClinicCreateModal from './ClinicCreateModal';
import ClinicEditModal from './ClinicEditModal';
import ProfessionalManagementModal from './ProfessionalManagementModal';
import SubscriptionCreateModal from './SubscriptionCreateModal';
import SubscriptionEditModal from './SubscriptionEditModal';
import EnhancedSubscriptionUpgradeModal from './EnhancedSubscriptionUpgradeModal';
import EnhancedPaymentManagementModal from './EnhancedPaymentManagementModal';
import BillingConfigurationModal from './BillingConfigurationModal';
import AdminConfigModal from './AdminConfigModal';
import ApiDocumentationModal from './ApiDocumentationModal';

interface AdminUser {
  username: string;
  email: string;
  role: string;
}

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
}

interface SubscriptionPlan {
  id: string;
  plan_id: string;
  name: string;
  description?: string;
  price: number;
  duration_days: number;
  features: Record<string, boolean>;
  max_professionals: number;
  max_patients: number;
  created_at?: string;
  updated_at?: string;
}

interface DashboardStats {
  total_clinics: number;
  active_clinics: number;
  trial_clinics: number;
  inactive_clinics: number;
  monthly_revenue: number;
  total_patients: number;
  total_professionals: number;
  plan_distribution: Record<string, number>;
  growth_this_month: number;
}

interface AdminDashboardProps {
  adminUser: AdminUser;
  onLogout: () => void;
}

export default function AdminDashboard({ adminUser, onLogout }: AdminDashboardProps) {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedClinicForProfessionals, setSelectedClinicForProfessionals] = useState<Clinic | null>(null);
  const [selectedClinicForEdit, setSelectedClinicForEdit] = useState<Clinic | null>(null);
  const [selectedSubscriptionForEdit, setSelectedSubscriptionForEdit] = useState<SubscriptionPlan | null>(null);
  const [selectedClinicForUpgrade, setSelectedClinicForUpgrade] = useState<Clinic | null>(null);
  const [selectedClinicForPayments, setSelectedClinicForPayments] = useState<Clinic | null>(null);
  const [selectedClinicForBilling, setSelectedClinicForBilling] = useState<Clinic | null>(null);
  const [showConfigModal, setShowConfigModal] = useState(false);
  const [showApiDocumentation, setShowApiDocumentation] = useState(false);
  const [selectedClinicForDocumentation, setSelectedClinicForDocumentation] = useState<Clinic | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [deletingClinicId, setDeletingClinicId] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [deleteSearchTerm, setDeleteSearchTerm] = useState<string>('');
  
  // Estados para los datos
  const [clinics, setClinics] = useState<Clinic[]>([]);
  const [plans, setPlans] = useState<Record<string, SubscriptionPlan>>({});
  const [stats, setStats] = useState<DashboardStats>({
    total_clinics: 0,
    active_clinics: 0,
    trial_clinics: 0,
    inactive_clinics: 0,
    monthly_revenue: 0,
    total_patients: 0,
    total_professionals: 0,
    plan_distribution: {},
    growth_this_month: 0
  });

  // Cargar datos al montar
  useEffect(() => {
    loadAdminData();
  }, []);

  const loadAdminData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      console.log('🔐 Cargando datos del admin dashboard...');
      
      const token = localStorage.getItem('admin_token');
      if (!token) {
        throw new Error('Token de administrador no encontrado');
      }

      const headers = {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      };

      // Cargar datos en paralelo
      console.log('📊 Obteniendo estadísticas...');
      const [statsResponse, clinicsResponse, plansResponse] = await Promise.all([
        fetch('/api/admin/dashboard/stats', { headers }),
        fetch('/api/admin/clinics', { headers }),
        fetch('/api/admin/subscription-plans', { headers })
      ]);

      // Verificar respuestas
      if (!statsResponse.ok) {
        const errorText = await statsResponse.text();
        console.error('❌ Error en stats:', statsResponse.status, errorText);
        throw new Error(`Error obteniendo estadísticas: ${statsResponse.status}`);
      }

      if (!clinicsResponse.ok) {
        const errorText = await clinicsResponse.text();
        console.error('❌ Error en clinics:', clinicsResponse.status, errorText);
        throw new Error(`Error obteniendo clínicas: ${clinicsResponse.status}`);
      }

      if (!plansResponse.ok) {
        const errorText = await plansResponse.text();
        console.error('❌ Error en plans:', plansResponse.status, errorText);
        throw new Error(`Error obteniendo planes: ${plansResponse.status}`);
      }

      // Parsear datos
      const statsData = await statsResponse.json();
      const clinicsData = await clinicsResponse.json();
      const plansData = await plansResponse.json();

      console.log('✅ Datos obtenidos:', {
        stats: statsData,
        clinics: Array.isArray(clinicsData) ? clinicsData.length : 'NOT_ARRAY',
        plans: Object.keys(plansData).length
      });

      // Validar estructura de datos
      if (!Array.isArray(clinicsData)) {
        console.error('⚠️ Clinics data structure not recognized:', typeof clinicsData);
        setClinics([]);
      } else {
        setClinics(clinicsData);
      }

      if (typeof plansData !== 'object') {
        console.error('⚠️ Plans data structure not recognized:', typeof plansData);
        setPlans({});
      } else {
        setPlans(plansData);
      }

      setStats(statsData);

    } catch (err) {
      console.error('❌ Error cargando datos admin:', err);
      setError(err instanceof Error ? err.message : 'Error desconocido');
    } finally {
      setLoading(false);
    }
  };

  const refreshData = () => {
    console.log('🔄 Refrescando datos...');
    loadAdminData();
  };

  const handleClinicCreated = () => {
    console.log('✅ Clínica creada - refrescando en segundo plano...');
    
    // Mostrar mensaje de éxito
    setSuccessMessage('¡Clínica creada exitosamente!');
    setTimeout(() => setSuccessMessage(null), 3000);
    
    // Cambiar a tab de clínicas para mostrar la nueva clínica
    setActiveTab('clinics');
    
    // Refrescar datos sin mostrar loading global para evitar pantalla negra
    refreshDataSilently();
  };

  const handleDeleteClinic = async (clinic: Clinic) => {
    const confirmMessage = `🚫 ELIMINAR CLÍNICA: ${clinic.name_clinic}\n\n¿Estás completamente seguro de ELIMINAR PERMANENTEMENTE esta clínica?\n\n📋 INFORMACIÓN DE LA CLÍNICA:\n• Nombre: ${clinic.name_clinic}\n• Suscriptor: ${clinic.suscriber}\n• Email: ${clinic.email}\n• ID: ${clinic.clinic_id}\n• Plan: ${clinic.subscription_plan}\n\n🗑️ ESTA ACCIÓN ELIMINARÁ PERMANENTEMENTE:\n• Todos los datos de la clínica\n• Profesionales asociados y sus datos\n• Pacientes registrados y sus historiales\n• Citas médicas y seguimientos\n• Configuraciones personalizadas\n• Facturas y registros de pagos\n\n⚠️ ADVERTENCIA CRÍTICA:\nEsta acción es IRREVERSIBLE y NO se puede deshacer.\nTodos los datos se perderán para siempre.\n\n¿Deseas continuar con la eliminación?`;
    
    if (!confirm(confirmMessage)) {
      return;
    }
    
    try {
      setDeletingClinicId(clinic.clinic_id);
      setError(null);
      
      console.log(`🗑️ Eliminando clínica ${clinic.clinic_id}...`);
      
      const token = localStorage.getItem('admin_token');
      if (!token) {
        throw new Error('Token de administrador no encontrado');
      }

      const response = await fetch(`/api/clinics/${clinic.clinic_id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        const errorData = await response.text();
        console.error('❌ Error eliminando clínica:', response.status, errorData);
        throw new Error(`Error del servidor: ${response.status}`);
      }

      console.log('✅ Clínica eliminada exitosamente');
      setSuccessMessage(`✅ Clínica "${clinic.name_clinic}" eliminada exitosamente`);
      setTimeout(() => setSuccessMessage(null), 5000);
      
      // Recargar datos
      refreshDataSilently();
      
    } catch (err) {
      console.error('❌ Error en eliminación de clínica:', err);
      setError(err instanceof Error ? err.message : 'Error desconocido eliminando clínica');
    } finally {
      setDeletingClinicId(null);
    }
  };

  // Función para filtrar clínicas por búsqueda
  const filterClinics = (clinics: Clinic[], searchTerm: string) => {
    if (!searchTerm.trim()) return clinics;
    
    const term = searchTerm.toLowerCase().trim();
    return clinics.filter((clinic) =>
      clinic.name_clinic.toLowerCase().includes(term) ||
      clinic.suscriber.toLowerCase().includes(term) ||
      clinic.email.toLowerCase().includes(term) ||
      clinic.clinic_id.toLowerCase().includes(term) ||
      clinic.subscription_plan.toLowerCase().includes(term)
    );
  };

  // Clínicas filtradas para la lista principal
  const filteredClinics = filterClinics(clinics, searchTerm);
  
  // Clínicas filtradas para el dropdown de eliminar
  const filteredClinicsForDelete = filterClinics(clinics, deleteSearchTerm);

  const handleClinicUpdated = () => {
    console.log('✅ Clínica actualizada - refrescando en segundo plano...');
    
    // Mostrar mensaje de éxito
    setSuccessMessage('¡Clínica actualizada exitosamente!');
    setTimeout(() => setSuccessMessage(null), 3000);
    
    // Refrescar datos silenciosamente
    refreshDataSilently();
  };

  const handleSubscriptionCreated = () => {
    console.log('✅ Suscripción creada - refrescando en segundo plano...');
    
    // Mostrar mensaje de éxito
    setSuccessMessage('¡Suscripción creada exitosamente!');
    setTimeout(() => setSuccessMessage(null), 3000);
    
    // Cambiar a tab de suscripciones
    setActiveTab('plans');
    
    // Refrescar datos silenciosamente
    refreshDataSilently();
  };

  const handleSubscriptionUpdated = () => {
    console.log('✅ Suscripción actualizada - refrescando en segundo plano...');
    
    // Mostrar mensaje de éxito
    setSuccessMessage('¡Suscripción actualizada exitosamente!');
    setTimeout(() => setSuccessMessage(null), 3000);
    
    // Refrescar datos silenciosamente
    refreshDataSilently();
  };

  const handleUpgradeCompleted = () => {
    console.log('✅ Upgrade completado - refrescando en segundo plano...');
    
    // Mostrar mensaje de éxito
    setSuccessMessage('¡Suscripción actualizada exitosamente!');
    setTimeout(() => setSuccessMessage(null), 3000);
    
    // Refrescar datos silenciosamente
    refreshDataSilently();
  };

  const handlePaymentProcessed = () => {
    console.log('✅ Pago procesado - refrescando en segundo plano...');
    
    // Mostrar mensaje de éxito
    setSuccessMessage('¡Pago registrado exitosamente!');
    setTimeout(() => setSuccessMessage(null), 3000);
    
    // Refrescar datos silenciosamente
    refreshDataSilently();
  };

  const handleBillingConfigUpdated = () => {
    console.log('✅ Configuración de facturación actualizada - refrescando en segundo plano...');
    
    // Mostrar mensaje de éxito
    setSuccessMessage('¡Configuración de facturación actualizada exitosamente!');
    setTimeout(() => setSuccessMessage(null), 3000);
    
    // Refrescar datos silenciosamente
    refreshDataSilently();
  };

  const handleDeleteSubscription = async (subscriptionId: string, subscriptionName: string) => {
    // Check how many clinics are using this plan
    const clinicsUsingPlan = clinics.filter(clinic => clinic.subscription_plan === subscriptionId);
    const clinicsCount = clinicsUsingPlan.length;
    
    if (clinicsCount > 0) {
      const clinicsNames = clinicsUsingPlan.map(clinic => clinic.name_clinic).join(', ');
      alert(`❌ No se puede eliminar este plan\n\nEste plan está siendo usado por ${clinicsCount} clínica${clinicsCount > 1 ? 's' : ''}:\n${clinicsNames}\n\nPara eliminar este plan, primero cambie estas clínicas a otro plan.`);
      return;
    }
    
    if (!confirm(`¿Eliminar la suscripción "${subscriptionName}"?\n\n⚠️ Esta acción no se puede deshacer.`)) {
      return;
    }

    try {
      const token = localStorage.getItem('admin_token');
      if (!token) {
        throw new Error('Token de administrador no encontrado');
      }

      const response = await fetch(`/api/admin/subscription-plans/${subscriptionId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        const errorData = await response.text();
        console.error('❌ Error eliminando suscripción:', response.status, errorData);
        
        try {
          const errorJson = JSON.parse(errorData);
          console.error('❌ Parsed error:', errorJson);
          
          // Handle specific error cases
          if (errorJson.detail && errorJson.detail.includes('Cannot delete plan')) {
            const clinicsMatch = errorJson.detail.match(/(\d+) clinics? are currently using/);
            const clinicsCount = clinicsMatch ? clinicsMatch[1] : 'algunas';
            throw new Error(`No se puede eliminar este plan porque ${clinicsCount} clínica${clinicsCount !== '1' ? 's' : ''} lo está${clinicsCount !== '1' ? 'n' : ''} usando actualmente. Para eliminar este plan, primero cambie las clínicas a otro plan.`);
          }
          
          // Use backend message if available
          throw new Error(errorJson.detail || errorJson.message || `Error eliminando suscripción: ${response.status}`);
          
        } catch (parseError) {
          console.error('❌ Error parsing response:', parseError);
          // Fallback to generic error
          throw new Error(`Error eliminando suscripción: ${response.status}`);
        }
      }

      console.log('✅ Suscripción eliminada exitosamente');
      
      // Mostrar mensaje de éxito
      setSuccessMessage('¡Suscripción eliminada exitosamente!');
      setTimeout(() => setSuccessMessage(null), 3000);
      
      // Refrescar datos
      refreshDataSilently();
      
    } catch (err) {
      console.error('❌ Error eliminando suscripción:', err);
      setError(err instanceof Error ? err.message : 'Error desconocido');
    }
  };

  const refreshDataSilently = async () => {
    try {
      console.log('🔄 Actualizando datos silenciosamente...');
      
      const token = localStorage.getItem('admin_token');
      if (!token) return;

      const headers = {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      };

      // Cargar datos sin cambiar el estado de loading global
      const [statsResponse, clinicsResponse, plansResponse] = await Promise.all([
        fetch('/api/admin/dashboard/stats', { headers }),
        fetch('/api/admin/clinics', { headers }),
        fetch('/api/admin/subscription-plans', { headers })
      ]);

      if (statsResponse.ok && clinicsResponse.ok && plansResponse.ok) {
        const statsData = await statsResponse.json();
        const clinicsData = await clinicsResponse.json();
        const plansData = await plansResponse.json();

        // Actualizar datos sin loading
        setStats(statsData);
        setClinics(Array.isArray(clinicsData) ? clinicsData : []);
        setPlans(typeof plansData === 'object' ? plansData : {});
        
        console.log('✅ Datos actualizados silenciosamente');
      }
      
    } catch (err) {
      console.warn('⚠️ Error en actualización silenciosa:', err);
      // En caso de error, usar el método normal
      setTimeout(() => loadAdminData(), 1000);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-medical-500 mx-auto"></div>
          <p className="mt-4 text-slate-600">Cargando panel de administración...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center max-w-md">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <AlertCircle className="h-8 w-8 text-red-600" />
          </div>
          <h2 className="text-xl font-semibold text-slate-900 mb-2">Error de Conexión</h2>
          <p className="text-red-600 mb-4">{error}</p>
          <div className="space-y-2">
            <Button onClick={refreshData} className="bg-medical-500 hover:bg-medical-600">
              <RefreshCw className="h-4 w-4 mr-2" />
              Reintentar
            </Button>
            <Button onClick={onLogout} variant="outline">
              Cerrar Sesión
            </Button>
          </div>
          <div className="text-sm text-gray-600 bg-gray-50 p-3 rounded mt-4">
            <p><strong>Verifica:</strong></p>
            <p>• Backend ejecutándose en localhost:8000</p>
            <p>• Token de administrador válido</p>
            <p>• Base de datos MongoDB conectada</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-900">
      {/* Header */}
      <div className="bg-slate-800 border-b border-slate-700 shadow-lg">
        <div className="container mx-auto px-4 py-3">
          <div className="flex items-center justify-between">
            {/* Logo y título */}
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-gradient-to-br from-medical-500 to-medical-600 rounded-xl shadow-lg flex items-center justify-center">
                <Shield className="h-6 w-6 text-white" strokeWidth={2} />
              </div>
              <div>
                <h1 className="text-xl font-bold text-white">Admin Dashboard</h1>
                <p className="text-sm text-slate-300">Panel de Administración ClínicaAdmin</p>
              </div>
            </div>

            {/* Acciones y usuario */}
            <div className="flex items-center gap-4">
              <Button onClick={refreshData} variant="outline" size="sm" className="border-slate-600 bg-slate-700 text-slate-200 hover:bg-slate-600">
                <RefreshCw className="h-4 w-4 mr-2" />
                Actualizar
              </Button>

              {/* Menú de usuario */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="flex items-center gap-3 hover:bg-slate-700 px-3 py-2 h-auto rounded-lg">
                    <div className="text-right">
                      <div className="text-sm font-medium text-slate-100">{adminUser.username}</div>
                      <div className="text-xs text-slate-400">{adminUser.role}</div>
                    </div>
                    <div className="w-9 h-9 bg-gradient-to-br from-slate-600 to-slate-700 rounded-lg flex items-center justify-center shadow-sm">
                      <User className="h-4 w-4 text-slate-300" strokeWidth={2} />
                    </div>
                    <ChevronDown className="h-4 w-4 text-slate-400" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-64 bg-slate-800 border-slate-700">
                  <DropdownMenuLabel>
                    <div className="flex flex-col">
                      <span className="text-slate-100 font-semibold">{adminUser.username}</span>
                      <span className="font-normal text-slate-400 text-xs">{adminUser.email}</span>
                    </div>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator className="bg-slate-600" />
                  
                  <DropdownMenuItem 
                    onClick={() => setShowConfigModal(true)}
                    className="text-slate-200 hover:bg-slate-700 cursor-pointer"
                  >
                    <Settings className="h-4 w-4 mr-2 text-slate-400" />
                    <span>Configuración</span>
                  </DropdownMenuItem>
                  
                  <DropdownMenuSeparator className="bg-slate-600" />
                  
                  <DropdownMenuItem onClick={onLogout} className="cursor-pointer hover:bg-red-900/30 text-red-400 focus:text-red-300">
                    <LogOut className="h-4 w-4 mr-2" />
                    <span>Cerrar Sesión</span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </div>
      </div>

      {/* Contenido principal */}
      <div className="container mx-auto px-4 py-6">
        {/* Mensaje de éxito */}
        {successMessage && (
          <div className="mb-4 p-4 bg-green-900/30 border border-green-700 rounded-lg">
            <div className="flex items-center gap-2 text-green-200">
              <CheckCircle className="h-4 w-4" />
              <span>{successMessage}</span>
            </div>
          </div>
        )}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          {/* Tabs */}
          <TabsList className="grid w-full grid-cols-3 bg-slate-800 backdrop-blur-sm border border-slate-700 h-auto shadow-lg">
            <TabsTrigger value="dashboard" className="data-[state=active]:bg-medical-500 data-[state=active]:text-white data-[state=inactive]:text-slate-300 py-3 hover:bg-slate-700">
              <Home className="h-4 w-4 mr-2" />
              Dashboard
            </TabsTrigger>
            <TabsTrigger value="clinics" className="data-[state=active]:bg-medical-500 data-[state=active]:text-white data-[state=inactive]:text-slate-300 py-3 hover:bg-slate-700">
              <Building2 className="h-4 w-4 mr-2" />
              Clínicas
            </TabsTrigger>
            <TabsTrigger value="plans" className="data-[state=active]:bg-medical-500 data-[state=active]:text-white data-[state=inactive]:text-slate-300 py-3 hover:bg-slate-700">
              <CreditCard className="h-4 w-4 mr-2" />
              Suscripciones
            </TabsTrigger>
          </TabsList>

          {/* Dashboard Tab */}
          <TabsContent value="dashboard" className="space-y-6">
            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <Card className="bg-slate-800 border-slate-700 shadow-lg">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium text-slate-200">Total Clínicas</CardTitle>
                  <Building2 className="h-4 w-4 text-slate-400" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-white">{stats.total_clinics}</div>
                  <p className="text-xs text-slate-400">
                    {stats.active_clinics} activas, {stats.trial_clinics} en prueba
                  </p>
                </CardContent>
              </Card>

              <Card className="bg-slate-800 border-slate-700 shadow-lg">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium text-slate-200">Ingresos Mensuales</CardTitle>
                  <DollarSign className="h-4 w-4 text-green-400" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-green-400">${stats.monthly_revenue.toFixed(2)}</div>
                  <p className="text-xs text-slate-400">
                    +{stats.growth_this_month}% este mes
                  </p>
                </CardContent>
              </Card>

              <Card className="bg-slate-800 border-slate-700 shadow-lg">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium text-slate-200">Total Profesionales</CardTitle>
                  <Users className="h-4 w-4 text-medical-400" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-medical-400">{stats.total_professionals}</div>
                  <p className="text-xs text-slate-400">
                    Equipo médico registrado
                  </p>
                </CardContent>
              </Card>

              <Card className="bg-slate-800 border-slate-700 shadow-lg">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium text-slate-200">Total Pacientes</CardTitle>
                  <Users className="h-4 w-4 text-blue-400" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-blue-400">{stats.total_patients}</div>
                  <p className="text-xs text-slate-400">
                    Pacientes en el sistema
                  </p>
                </CardContent>
              </Card>
            </div>

            {/* Distribution Chart */}
            <Card className="bg-slate-800 border-slate-700 shadow-lg">
              <CardHeader>
                <CardTitle className="text-white">Distribución de Planes</CardTitle>
                <CardDescription className="text-slate-400">Clínicas por tipo de suscripción</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {Object.entries(stats.plan_distribution).map(([plan, count]) => (
                    <div key={plan} className="flex items-center justify-between">
                      <span className="capitalize text-slate-200 font-medium">{plan}</span>
                      <div className="flex items-center gap-2">
                        <Badge variant="secondary" className="bg-medical-500 text-white hover:bg-medical-600">{count}</Badge>
                        <div className="w-32 h-2 bg-slate-600 rounded-full overflow-hidden">
                          <div 
                            className="h-full bg-medical-400"
                            style={{
                              width: `${(count / stats.total_clinics) * 100}%`
                            }}
                          ></div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Clinics Tab */}
          <TabsContent value="clinics" className="space-y-6">
            <Card className="bg-slate-800 border-slate-700 shadow-lg">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-white">Clínicas Registradas</CardTitle>
                    <CardDescription className="text-slate-400">
                      Total: {clinics.length} clínicas en el sistema
                    </CardDescription>
                  </div>
                  <div className="flex items-center gap-3">
                    <ClinicCreateModal onClinicCreated={handleClinicCreated} />
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button 
                          variant="outline" 
                          size="sm" 
                          className="border-red-600 bg-red-600/20 text-red-300 hover:bg-red-500/30"
                          disabled={clinics.length === 0}
                        >
                          <Trash2 className="h-4 w-4 mr-2" />
                          Eliminar Clínica
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="w-80 bg-slate-800 border-slate-700">
                        <DropdownMenuLabel className="text-slate-200">
                          Selecciona clínica a eliminar
                        </DropdownMenuLabel>
                        <DropdownMenuSeparator className="bg-slate-600" />
                        
                        {/* Buscador en dropdown */}
                        <div className="px-2 py-2">
                          <div className="relative">
                            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 h-3 w-3" />
                            <Input
                              placeholder="Buscar clínica a eliminar..."
                              value={deleteSearchTerm}
                              onChange={(e) => setDeleteSearchTerm(e.target.value)}
                              className="pl-8 pr-8 h-8 bg-slate-700 border-slate-600 text-slate-100 placeholder:text-slate-400 text-xs"
                            />
                            {deleteSearchTerm && (
                              <button
                                onClick={() => setDeleteSearchTerm('')}
                                className="absolute right-2 top-1/2 transform -translate-y-1/2 text-slate-400 hover:text-slate-200"
                              >
                                <X className="h-3 w-3" />
                              </button>
                            )}
                          </div>
                          {deleteSearchTerm && (
                            <p className="text-xs text-slate-400 mt-1">
                              {filteredClinicsForDelete.length} de {clinics.length} clínicas
                            </p>
                          )}
                        </div>
                        
                        <DropdownMenuSeparator className="bg-slate-600" />
                        
                        <div className="max-h-64 overflow-y-auto">
                          {filteredClinicsForDelete.length === 0 ? (
                            <DropdownMenuItem disabled className="text-slate-400">
                              {deleteSearchTerm ? 'No se encontraron clínicas' : 'No hay clínicas para eliminar'}
                            </DropdownMenuItem>
                          ) : (
                            filteredClinicsForDelete.map((clinic) => (
                            <DropdownMenuItem 
                              key={clinic.clinic_id}
                              onClick={() => handleDeleteClinic(clinic)}
                              className="text-red-300 hover:bg-red-900/30 cursor-pointer focus:text-red-200"
                              disabled={deletingClinicId === clinic.clinic_id}
                            >
                              <div className="flex items-center justify-between w-full">
                                <div className="flex items-center gap-2">
                                  <Trash2 className="h-3 w-3" />
                                  <div className="flex flex-col">
                                    <span className="text-sm font-medium">{clinic.name_clinic}</span>
                                    <span className="text-xs text-slate-400">{clinic.suscriber}</span>
                                  </div>
                                </div>
                                {deletingClinicId === clinic.clinic_id && (
                                  <RefreshCw className="h-3 w-3 animate-spin" />
                                )}
                              </div>
                            </DropdownMenuItem>
                            ))
                          )}
                        </div>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {/* Buscador de clínicas */}
                <div className="mb-6">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 h-4 w-4" />
                    <Input
                      placeholder="Buscar clínicas por nombre, suscriptor, email, ID o plan..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10 pr-10 bg-slate-700 border-slate-600 text-slate-100 placeholder:text-slate-400 focus:border-medical-500"
                    />
                    {searchTerm && (
                      <button
                        onClick={() => setSearchTerm('')}
                        className="absolute right-3 top-1/2 transform -translate-y-1/2 text-slate-400 hover:text-slate-200"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    )}
                  </div>
                  {searchTerm && (
                    <p className="text-xs text-slate-400 mt-2">
                      Mostrando {filteredClinics.length} de {clinics.length} clínicas
                    </p>
                  )}
                </div>
                
                {filteredClinics.length === 0 ? (
                  <div className="text-center py-8 text-slate-400">
                    <Building2 className="h-12 w-12 mx-auto mb-4 text-slate-500" />
                    <p>{searchTerm ? 'No se encontraron clínicas con ese criterio de búsqueda.' : 'No hay clínicas registradas.'}</p>
                    <p className="text-sm">{searchTerm ? 'Intenta con otros términos de búsqueda.' : 'Las clínicas aparecerán aquí cuando se registren.'}</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {filteredClinics.map((clinic) => (
                      <div key={clinic.id} className="flex items-center justify-between p-4 border border-slate-600 rounded-lg hover:bg-slate-700/70 bg-slate-800">
                        <div className="flex-1">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-medical-500/20 rounded-lg flex items-center justify-center">
                              <Stethoscope className="h-5 w-5 text-medical-400" />
                            </div>
                            <div>
                              <h4 className="font-semibold text-slate-100">{clinic.name_clinic}</h4>
                              <p className="text-sm text-slate-300">
                                {clinic.suscriber} • {clinic.email}
                              </p>
                            </div>
                          </div>
                        </div>
                        
                        <div className="flex items-center gap-4">
                          <div className="text-right">
                            <div className="flex items-center gap-2 mb-1">
                              <Badge
                                variant={clinic.status_clinic === 'active' ? 'default' : 'destructive'}
                                className={
                                  clinic.status_clinic === 'active' 
                                    ? 'bg-green-600 text-green-100 hover:bg-green-700' 
                                    : 'bg-red-600 text-red-100 hover:bg-red-700'
                                }
                              >
                                {clinic.status_clinic}
                              </Badge>
                              <Badge
                                variant="outline"
                                className={(() => {
                                  if (!clinic.subscription_expires) return 'border-slate-500 text-slate-400';
                                  const daysRemaining = Math.ceil((new Date(clinic.subscription_expires).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));
                                  if (daysRemaining <= 0) return 'border-red-500 text-red-300';
                                  if (daysRemaining <= 7) return 'border-yellow-500 text-yellow-300';
                                  if (daysRemaining <= 30) return 'border-orange-500 text-orange-300';
                                  return 'border-green-500 text-green-300';
                                })()}
                              >
                                <Clock className="h-3 w-3 mr-1" />
                                {(() => {
                                  if (!clinic.subscription_expires) return 'Sin vencimiento';
                                  const daysRemaining = Math.ceil((new Date(clinic.subscription_expires).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));
                                  if (daysRemaining <= 0) return 'Vencida';
                                  return `${daysRemaining}d`;
                                })()}
                              </Badge>
                            </div>
                            <p className="text-xs text-slate-400">
                              Plan: {clinic.subscription_plan}
                            </p>
                            {clinic.subscription_expires && (
                              <p className="text-xs text-slate-500">
                                Vence: {new Date(clinic.subscription_expires).toLocaleDateString()}
                              </p>
                            )}
                          </div>
                          
                          <div className="flex gap-2 flex-wrap">
                            <Button 
                              variant="outline" 
                              size="sm" 
                              onClick={() => setSelectedClinicForProfessionals(clinic)}
                              className="border-slate-600 bg-slate-600 text-slate-200 hover:bg-slate-500"
                            >
                              <Users className="h-4 w-4 mr-1" />
                              Profesionales
                            </Button>
                            <Button 
                              variant="outline" 
                              size="sm" 
                              onClick={() => setSelectedClinicForEdit(clinic)}
                              className="border-slate-600 bg-slate-600 text-slate-200 hover:bg-slate-500"
                            >
                              <Settings className="h-4 w-4 mr-1" />
                              Editar
                            </Button>
                            <Button 
                              variant="outline" 
                              size="sm" 
                              onClick={() => setSelectedClinicForUpgrade(clinic)}
                              className="border-medical-600 bg-medical-600/20 text-medical-300 hover:bg-medical-500/30"
                            >
                              <TrendingUp className="h-4 w-4 mr-1" />
                              Upgrade
                            </Button>
                            <Button 
                              variant="outline" 
                              size="sm" 
                              onClick={() => setSelectedClinicForPayments(clinic)}
                              className="border-green-600 bg-green-600/20 text-green-300 hover:bg-green-500/30"
                            >
                              <DollarSign className="h-4 w-4 mr-1" />
                              Pagos
                            </Button>
                            <Button 
                              variant="outline" 
                              size="sm" 
                              onClick={() => setSelectedClinicForBilling(clinic)}
                              className="border-blue-600 bg-blue-600/20 text-blue-300 hover:bg-blue-500/30"
                            >
                              <Clock className="h-4 w-4 mr-1" />
                              Facturación
                            </Button>
                            <Button 
                              variant="outline" 
                              size="sm" 
                              onClick={() => {
                                setSelectedClinicForDocumentation(clinic);
                                setShowApiDocumentation(true);
                              }}
                              className="border-slate-600 bg-slate-600/20 text-slate-300 hover:bg-slate-500/30"
                            >
                              <FileText className="h-4 w-4 mr-1" />
                              Documentación
                            </Button>
                            <Button 
                              variant="outline" 
                              size="sm" 
                              onClick={() => handleDeleteClinic(clinic)}
                              className="border-red-600 bg-red-900/30 text-red-300 hover:bg-red-900/50"
                              disabled={deletingClinicId === clinic.clinic_id}
                            >
                              {deletingClinicId === clinic.clinic_id ? (
                                <RefreshCw className="h-3 w-3 mr-1 animate-spin" />
                              ) : (
                                <Trash2 className="h-3 w-3 mr-1" />
                              )}
                              Eliminar
                            </Button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Plans Tab */}
          <TabsContent value="plans" className="space-y-6">
            <Card className="bg-slate-800 border-slate-700 shadow-lg">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-white">Planes de Suscripción</CardTitle>
                    <CardDescription className="text-slate-400">
                      {Object.keys(plans).length} planes disponibles
                    </CardDescription>
                  </div>
                  <SubscriptionCreateModal onSubscriptionCreated={handleSubscriptionCreated} />
                </div>
              </CardHeader>
              <CardContent>
                {Object.keys(plans).length === 0 ? (
                  <div className="text-center py-8 text-slate-400">
                    <CreditCard className="h-12 w-12 mx-auto mb-4 text-slate-500" />
                    <p>No hay planes configurados.</p>
                    <p className="text-sm">Los planes aparecerán aquí cuando se creen.</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {Object.entries(plans).map(([planId, plan]) => (
                      <Card key={planId} className="relative bg-slate-700 border-slate-600 shadow-lg">
                        <CardHeader className="pb-4">
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <CardTitle className="text-lg text-slate-100 mb-2">{plan.name}</CardTitle>
                              <div className="text-2xl font-bold text-medical-400">
                                ${plan.price}
                                <span className="text-sm font-normal text-slate-400">/mes</span>
                              </div>
                            </div>
                            <div className="flex gap-1">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => setSelectedSubscriptionForEdit(plan)}
                                className="h-8 w-8 p-0 text-slate-400 hover:text-slate-200 hover:bg-slate-600"
                              >
                                <Edit className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleDeleteSubscription(plan.id, plan.name)}
                                className="h-8 w-8 p-0 text-red-400 hover:text-red-200 hover:bg-red-900/30"
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </div>
                        </CardHeader>
                        <CardContent className="space-y-3">
                          {plan.description && (
                            <p className="text-sm text-slate-300 leading-relaxed">
                              {plan.description}
                            </p>
                          )}
                          
                          <div className="text-sm space-y-1">
                            <p className="flex justify-between text-slate-200">
                              <span>Profesionales:</span>
                              <span className="font-medium text-slate-100">{plan.max_professionals}</span>
                            </p>
                            <p className="flex justify-between text-slate-200">
                              <span>Pacientes:</span>
                              <span className="font-medium text-slate-100">{plan.max_patients}</span>
                            </p>
                            <p className="flex justify-between text-slate-200">
                              <span>Duración:</span>
                              <span className="font-medium text-slate-100">{plan.duration_days} días</span>
                            </p>
                          </div>
                          
                          <div className="pt-2 border-t border-slate-600">
                            <p className="text-xs font-medium text-slate-300 mb-2">Características:</p>
                            <div className="space-y-1">
                              {Object.entries(plan.features).map(([feature, enabled]) => (
                                <div key={feature} className="flex items-center gap-2 text-xs">
                                  {enabled ? (
                                    <CheckCircle className="h-3 w-3 text-green-400" />
                                  ) : (
                                    <div className="h-3 w-3 rounded-full border border-slate-500" />
                                  )}
                                  <span className={enabled ? 'text-slate-200' : 'text-slate-500'}>
                                    {feature.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                                  </span>
                                </div>
                              ))}
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>

      {/* Professional Management Modal */}
      {selectedClinicForProfessionals && (
        <ProfessionalManagementModal
          clinic={selectedClinicForProfessionals}
          onClose={() => setSelectedClinicForProfessionals(null)}
        />
      )}

      {/* Clinic Edit Modal */}
      {selectedClinicForEdit && (
        <ClinicEditModal
          clinic={selectedClinicForEdit}
          open={!!selectedClinicForEdit}
          onClose={() => setSelectedClinicForEdit(null)}
          onClinicUpdated={handleClinicUpdated}
        />
      )}

      {/* Subscription Edit Modal */}
      {selectedSubscriptionForEdit && (
        <SubscriptionEditModal
          subscription={selectedSubscriptionForEdit}
          open={!!selectedSubscriptionForEdit}
          onClose={() => setSelectedSubscriptionForEdit(null)}
          onSubscriptionUpdated={handleSubscriptionUpdated}
        />
      )}

      {/* Enhanced Subscription Upgrade Modal */}
      {selectedClinicForUpgrade && plans[selectedClinicForUpgrade.subscription_plan] && (
        <EnhancedSubscriptionUpgradeModal
          clinic={selectedClinicForUpgrade}
          currentPlan={plans[selectedClinicForUpgrade.subscription_plan]}
          availablePlans={plans}
          open={!!selectedClinicForUpgrade}
          onClose={() => setSelectedClinicForUpgrade(null)}
          onUpgradeCompleted={handleUpgradeCompleted}
        />
      )}
      
      {/* Error state cuando no existe el plan */}
      {selectedClinicForUpgrade && !plans[selectedClinicForUpgrade.subscription_plan] && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-slate-800 p-6 rounded-lg border border-slate-600 max-w-md w-full mx-4">
            <h3 className="text-lg font-semibold text-slate-100 mb-2">Error de Plan</h3>
            <p className="text-slate-300 text-sm mb-4">
              El plan de suscripción "{selectedClinicForUpgrade.subscription_plan}" no existe o no se ha cargado correctamente.
            </p>
            <p className="text-slate-400 text-xs mb-4">
              Planes disponibles: {Object.keys(plans).join(', ') || 'Ninguno'}
            </p>
            <Button
              onClick={() => setSelectedClinicForUpgrade(null)}
              className="w-full bg-medical-500 hover:bg-medical-600"
            >
              Cerrar
            </Button>
          </div>
        </div>
      )}

      {/* Enhanced Payment Management Modal */}
      {selectedClinicForPayments && (
        <EnhancedPaymentManagementModal
          clinic={selectedClinicForPayments}
          availablePlans={plans}
          open={!!selectedClinicForPayments}
          onClose={() => setSelectedClinicForPayments(null)}
          onPaymentProcessed={handlePaymentProcessed}
        />
      )}

      {/* Billing Configuration Modal */}
      {selectedClinicForBilling && (
        <BillingConfigurationModal
          clinic={selectedClinicForBilling}
          open={!!selectedClinicForBilling}
          onClose={() => setSelectedClinicForBilling(null)}
          onConfigurationUpdated={handleBillingConfigUpdated}
        />
      )}

      {/* Admin Configuration Modal */}
      <AdminConfigModal
        open={showConfigModal}
        onClose={() => setShowConfigModal(false)}
      />

      {/* API Documentation Modal */}
      <ApiDocumentationModal
        open={showApiDocumentation}
        onClose={() => {
          setShowApiDocumentation(false);
          setSelectedClinicForDocumentation(null);
        }}
        clinicId={selectedClinicForDocumentation?.clinic_id}
        clinicName={selectedClinicForDocumentation?.name_clinic}
      />
    </div>
  );
}