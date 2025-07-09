import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  clinicsApi, 
  patientsApi, 
  appointmentsApi, 
  professionalsApi, 
  metricsApi,
  type Clinic,
  type Patient,
  type Appointment,
  type Professional,
  type Metric 
} from '@/lib/api';

interface DashboardStats {
  title: string;
  value: string;
  icon: string;
  description: string;
  trend?: string;
}

export default function DashboardLayout() {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Estados para los datos
  const [clinics, setClinics] = useState<Clinic[]>([]);
  const [patients, setPatients] = useState<Patient[]>([]);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [professionals, setProfessionals] = useState<Professional[]>([]);
  const [metrics, setMetrics] = useState<Metric[]>([]);
  
  // Cargar datos al montar el componente
  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      setError(null);

      // Cargar todos los datos en paralelo
      const [
        clinicsResponse,
        patientsResponse,
        appointmentsResponse,
        professionalsResponse,
        metricsResponse,
      ] = await Promise.all([
        clinicsApi.getAll(),
        patientsApi.getAll(),
        appointmentsApi.getAll(),
        professionalsApi.getAll(),
        metricsApi.getAll(),
      ]);

      setClinics(clinicsResponse.data);
      setPatients(patientsResponse.data);
      setAppointments(appointmentsResponse.data);
      setProfessionals(professionalsResponse.data);
      setMetrics(metricsResponse.data);

    } catch (err) {
      console.error('Error cargando datos:', err);
      setError('Error al cargar los datos del dashboard');
    } finally {
      setLoading(false);
    }
  };

  // Calcular estadísticas dinámicas
  const getDashboardStats = (): DashboardStats[] => {
    const today = new Date().toISOString().split('T')[0];
    const appointmentsToday = appointments.filter(apt => 
      apt.attributes.datetime.startsWith(today)
    );
    
    const activePatients = patients.filter(p => p.attributes.status === 'active');
    const activeProfessionals = professionals.filter(p => p.attributes.status === 'active');
    
    // Métricas de respuesta promedio (últimos 7 días)
    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 7);
    const recentMetrics = metrics.filter(m => 
      new Date(m.attributes.timestamp) >= weekAgo
    );
    const avgResponseTime = recentMetrics.length > 0 
      ? Math.round(recentMetrics.reduce((acc, m) => acc + m.attributes.response_time, 0) / recentMetrics.length)
      : 0;

    return [
      {
        title: "Pacientes Activos",
        value: activePatients.length.toString(),
        icon: "👥",
        description: "Total de pacientes registrados",
        trend: "+12% desde el mes pasado"
      },
      {
        title: "Turnos Hoy",
        value: appointmentsToday.length.toString(),
        icon: "📅",
        description: "Citas programadas para hoy",
        trend: `${appointmentsToday.filter(a => a.attributes.status === 'confirmed').length} confirmados`
      },
      {
        title: "Profesionales",
        value: activeProfessionals.length.toString(),
        icon: "👨‍⚕️",
        description: "Especialistas disponibles",
        trend: "Todos activos"
      },
      {
        title: "Tiempo Resp. Promedio",
        value: `${avgResponseTime}ms`,
        icon: "⚡",
        description: "Respuesta del sistema",
        trend: "Últimos 7 días"
      }
    ];
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-medical-500 mx-auto"></div>
          <p className="mt-4 text-slate-600">Cargando dashboard...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <p className="text-red-600 mb-4">{error}</p>
          <button 
            onClick={loadDashboardData}
            className="px-4 py-2 bg-medical-500 text-white rounded-lg hover:bg-medical-600"
          >
            Reintentar
          </button>
        </div>
      </div>
    );
  }

  const dashboardStats = getDashboardStats();

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      <div className="container mx-auto px-4 py-6">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-5 bg-white/80 backdrop-blur-sm border border-slate-200/50">
            <TabsTrigger value="dashboard" className="data-[state=active]:bg-medical-500 data-[state=active]:text-white">
              📊 Dashboard
            </TabsTrigger>
            <TabsTrigger value="connections" className="data-[state=active]:bg-medical-500 data-[state=active]:text-white">
              🔗 Conexiones
            </TabsTrigger>
            <TabsTrigger value="patients" className="data-[state=active]:bg-medical-500 data-[state=active]:text-white">
              👥 Pacientes
            </TabsTrigger>
            <TabsTrigger value="schedule" className="data-[state=active]:bg-medical-500 data-[state=active]:text-white">
              📅 Agenda
            </TabsTrigger>
            <TabsTrigger value="whatsapp" className="data-[state=active]:bg-medical-500 data-[state=active]:text-white">
              📱 WhatsApp QR
            </TabsTrigger>
          </TabsList>

          <TabsContent value="dashboard" className="space-y-6">
            {/* Stats Grid */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-6">
              {dashboardStats.map((stat, index) => (
                <Card key={index} className="bg-white/90 backdrop-blur-sm border border-slate-200/50 hover:shadow-lg transition-all duration-200">
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium text-slate-600">
                      {stat.title}
                    </CardTitle>
                    <span className="text-2xl">{stat.icon}</span>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-slate-900">{stat.value}</div>
                    <p className="text-xs text-slate-500 mt-1">{stat.description}</p>
                    {stat.trend && (
                      <p className="text-xs text-medical-600 mt-1">{stat.trend}</p>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* Información de Clínicas */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {clinics.map((clinic) => (
                <Card key={clinic.id} className="bg-white/90 backdrop-blur-sm border border-slate-200/50">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      🏥 {clinic.attributes.name}
                    </CardTitle>
                    <CardDescription>
                      {clinic.attributes.description}
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    <p className="text-sm"><strong>Dirección:</strong> {clinic.attributes.address}</p>
                    <p className="text-sm"><strong>Teléfono:</strong> {clinic.attributes.phone}</p>
                    <p className="text-sm"><strong>WhatsApp:</strong> {clinic.attributes.whatsapp_number}</p>
                    <div className="flex items-center gap-2 mt-4">
                      <div className={`w-2 h-2 rounded-full ${
                        clinic.attributes.status === 'active' ? 'bg-green-500' : 'bg-red-500'
                      }`}></div>
                      <span className="text-sm capitalize">{clinic.attributes.status}</span>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="patients" className="space-y-6">
            <Card className="bg-white/90 backdrop-blur-sm">
              <CardHeader>
                <CardTitle>Lista de Pacientes</CardTitle>
                <CardDescription>
                  Total: {patients.length} pacientes registrados
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {patients.slice(0, 10).map((patient) => (
                    <div key={patient.id} className="flex items-center justify-between p-4 border rounded-lg">
                      <div>
                        <h4 className="font-medium">
                          {patient.attributes.first_name} {patient.attributes.last_name}
                        </h4>
                        <p className="text-sm text-slate-500">
                          DNI: {patient.attributes.dni} | {patient.attributes.email}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm">{patient.attributes.phone}</p>
                        <span className={`text-xs px-2 py-1 rounded-full ${
                          patient.attributes.status === 'active' 
                            ? 'bg-green-100 text-green-800' 
                            : 'bg-red-100 text-red-800'
                        }`}>
                          {patient.attributes.status}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Otros tabs... */}
        </Tabs>
      </div>
    </div>
  );
}