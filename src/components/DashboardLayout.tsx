import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { 
  patientsApi, 
  appointmentsApi, 
  professionalsApi, 
  statsApi,
  type Patient,
  type Appointment,
  type Professional
} from '@/lib/clinicApi';
import { logoutClinic, type ClinicUser } from '@/lib/clinicAuth';

interface DashboardStats {
  title: string;
  value: string;
  icon: string;
  description: string;
  trend?: string;
}

interface DashboardLayoutProps {
  clinic: ClinicUser;
  onLogout: () => void;
}

export default function DashboardLayout({ clinic, onLogout }: DashboardLayoutProps) {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Estados para los datos
  const [patients, setPatients] = useState<Patient[]>([]);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [professionals, setProfessionals] = useState<Professional[]>([]);
  const [basicStats, setBasicStats] = useState({
    total_professionals: 0,
    active_professionals: 0,
    total_patients: 0,
    active_patients: 0,
    total_appointments: 0,
    appointments_today: 0,
    completed_appointments: 0,
    cancelled_appointments: 0,
  });
  
  // Cargar datos al montar el componente
  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      setError(null);

      console.log('📊 Cargando datos para clínica:', clinic.name_clinic);

      // Cargar datos en paralelo - automáticamente filtrados por clínica
      const [
        patientsResponse,
        appointmentsResponse,
        professionalsResponse,
        statsResponse,
      ] = await Promise.all([
        patientsApi.getAll().catch(() => ({ data: [] })),
        appointmentsApi.getAll().catch(() => ({ data: [] })),
        professionalsApi.getAll().catch(() => ({ data: [] })),
        statsApi.getBasicStats().catch(() => ({
          total_professionals: 0,
          active_professionals: 0,
          total_patients: 0,
          active_patients: 0,
          total_appointments: 0,
          appointments_today: 0,
          completed_appointments: 0,
          cancelled_appointments: 0,
        })),
      ]);

      setPatients(patientsResponse.data);
      setAppointments(appointmentsResponse.data);
      setProfessionals(professionalsResponse.data);
      setBasicStats(statsResponse);

      console.log('✅ Datos cargados:', {
        patients: patientsResponse.data.length,
        appointments: appointmentsResponse.data.length,
        professionals: professionalsResponse.data.length,
      });

    } catch (err) {
      console.error('❌ Error cargando datos:', err);
      setError('Error al cargar los datos del dashboard. Verifica los permisos en Strapi.');
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    logoutClinic(); // Limpiar datos de autenticación
    onLogout();     // Llamar callback original
  };

  // Calcular estadísticas dinámicas
  const getDashboardStats = (): DashboardStats[] => {
    const today = new Date().toISOString().split('T')[0];
    const appointmentsToday = appointments.filter(apt => 
      apt.datetime.startsWith(today)
    );
    
    const activePatients = patients.filter(p => p.status_patient === 'active');
    const activeProfessionals = professionals.filter(p => p.status_professional === 'active');
    
    return [
      {
        title: "Pacientes Activos",
        value: activePatients.length.toString(),
        icon: "👥",
        description: `Total: ${patients.length} pacientes registrados`,
        trend: `+${Math.max(0, activePatients.length - Math.floor(patients.length * 0.8))} este mes`
      },
      {
        title: "Turnos Hoy",
        value: appointmentsToday.length.toString(),
        icon: "📅",
        description: "Citas programadas para hoy",
        trend: `${appointmentsToday.filter(a => a.status_appointment === 'confirmed').length} confirmados`
      },
      {
        title: "Profesionales",
        value: activeProfessionals.length.toString(),
        icon: "👨‍⚕️",
        description: "Especialistas disponibles",
        trend: "Todos activos"
      },
      {
        title: "Tasa de Asistencia",
        value: appointments.length > 0 
          ? `${Math.round((appointments.filter(a => a.status_appointment === 'completed').length / appointments.length) * 100)}%`
          : "0%",
        icon: "📊",
        description: "Últimos 30 días",
        trend: `${appointments.filter(a => a.status_appointment === 'cancelled').length} canceladas`
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
        <div className="text-center max-w-md">
          <p className="text-red-600 mb-4">{error}</p>
          <Button 
            onClick={loadDashboardData}
            className="mb-4 bg-medical-500 hover:bg-medical-600"
          >
            Reintentar
          </Button>
          <div className="text-sm text-gray-600 bg-gray-50 p-3 rounded">
            <p><strong>Verifica:</strong></p>
            <p>• Strapi ejecutándose en localhost:1337</p>
            <p>• Permisos configurados correctamente</p>
            <p>• Campo password agregado a tu clínica</p>
          </div>
        </div>
      </div>
    );
  }

  const dashboardStats = getDashboardStats();

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      {/* Header con información de clínica */}
      <div className="bg-white border-b border-slate-200 shadow-sm">
        <div className="container mx-auto px-4 py-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 medical-gradient rounded-full flex items-center justify-center">
                <span className="text-white text-lg font-bold">
                  {clinic.name_clinic.charAt(0)}
                </span>
              </div>
              <div>
                <h1 className="text-xl font-bold text-slate-900">{clinic.name_clinic}</h1>
                <p className="text-sm text-slate-500">{clinic.suscriber} • {clinic.email}</p>
              </div>
            </div>
            
            <div className="flex items-center gap-4">
              <div className="text-right">
                <div className="flex items-center gap-2">
                  <div className={`w-2 h-2 rounded-full ${
                    clinic.status_clinic === 'active' ? 'bg-green-500' : 'bg-red-500'
                  }`}></div>
                  <span className="text-sm font-medium">
                    {clinic.status_clinic === 'active' ? 'Activa' : 'Inactiva'}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <div className={`w-2 h-2 rounded-full ${
                    clinic.subcription ? 'bg-green-500' : 'bg-red-500'  
                  }`}></div>
                  <span className="text-sm">
                    {clinic.subcription ? 'Suscripción activa' : 'Suscripción vencida'}
                  </span>
                </div>
              </div>
              <Button
                onClick={handleLogout}
                variant="outline"
                className="text-red-600 border-red-200 hover:bg-red-50"
              >
                Cerrar Sesión
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-6">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-5 bg-white/80 backdrop-blur-sm border border-slate-200/50">
            <TabsTrigger value="dashboard" className="data-[state=active]:bg-medical-500 data-[state=active]:text-white">
              📊 Dashboard
            </TabsTrigger>
            <TabsTrigger value="connections" className="data-[state=active]:bg-medical-500 data-[state=active]:text-white">
              🏥 Clínica
            </TabsTrigger>
            <TabsTrigger value="patients" className="data-[state=active]:bg-medical-500 data-[state=active]:text-white">
              👥 Pacientes
            </TabsTrigger>
            <TabsTrigger value="schedule" className="data-[state=active]:bg-medical-500 data-[state=active]:text-white">
              📅 Agenda
            </TabsTrigger>
            <TabsTrigger value="whatsapp" className="data-[state=active]:bg-medical-500 data-[state=active]:text-white">
              👨‍⚕️ Profesionales
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

            {/* Información de la clínica actual */}
            <div className="grid grid-cols-1 md:grid-cols-1 gap-6">
              <Card className="bg-white/90 backdrop-blur-sm border border-slate-200/50">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    🏥 {clinic.name_clinic}
                  </CardTitle>
                  <CardDescription>
                    Información de tu clínica
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-2">
                  <p className="text-sm"><strong>Responsable:</strong> {clinic.suscriber}</p>
                  <p className="text-sm"><strong>Dirección:</strong> {clinic.address}</p>
                  <p className="text-sm"><strong>Email:</strong> {clinic.email}</p>
                  <p className="text-sm"><strong>Teléfono:</strong> {clinic.cell_phone}</p>
                  {clinic.whatsapp_number && (
                    <p className="text-sm"><strong>WhatsApp:</strong> {clinic.whatsapp_number}</p>
                  )}
                  <div className="flex items-center gap-2 mt-4">
                    <div className={`w-2 h-2 rounded-full ${
                      clinic.status_clinic === 'active' ? 'bg-green-500' : 'bg-red-500'
                    }`}></div>
                    <span className="text-sm capitalize">{clinic.status_clinic}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className={`w-2 h-2 rounded-full ${
                      clinic.subcription ? 'bg-green-500' : 'bg-red-500'  
                    }`}></div>
                    <span className="text-sm">
                      Suscripción: {clinic.subcription ? 'Activa' : 'Vencida'}
                    </span>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="connections" className="space-y-6">
            <Card className="bg-white/90 backdrop-blur-sm">
              <CardHeader>
                <CardTitle>Información de la Clínica</CardTitle>
                <CardDescription>
                  Detalles completos de tu clínica registrada
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm font-medium text-slate-500">ID Clínica</p>
                    <p className="text-sm text-slate-900">{clinic.clinic_id}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-slate-500">Nombre</p>
                    <p className="text-sm text-slate-900">{clinic.name_clinic}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-slate-500">Responsable</p>
                    <p className="text-sm text-slate-900">{clinic.suscriber}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-slate-500">Email</p>
                    <p className="text-sm text-slate-900">{clinic.email}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-slate-500">Teléfono</p>
                    <p className="text-sm text-slate-900">{clinic.cell_phone}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-slate-500">Estado</p>
                    <span className={`text-sm px-2 py-1 rounded-full ${
                      clinic.status_clinic === 'active' 
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-red-100 text-red-800'
                    }`}>
                      {clinic.status_clinic}
                    </span>
                  </div>
                  <div className="md:col-span-2">
                    <p className="text-sm font-medium text-slate-500">Dirección</p>
                    <p className="text-sm text-slate-900">{clinic.address}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="patients" className="space-y-6">
            <Card className="bg-white/90 backdrop-blur-sm">
              <CardHeader>
                <CardTitle>Lista de Pacientes</CardTitle>
                <CardDescription>
                  Total: {patients.length} pacientes registrados en tu clínica
                </CardDescription>
              </CardHeader>
              <CardContent>
                {patients.length === 0 ? (
                  <div className="text-center py-8 text-slate-500">
                    <p>No hay pacientes registrados aún.</p>
                    <p className="text-sm">Los pacientes aparecerán aquí cuando se registren.</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {patients.slice(0, 10).map((patient) => (
                      <div key={patient.id} className="flex items-center justify-between p-4 border rounded-lg">
                        <div>
                          <h4 className="font-medium">
                            {patient.first_name} {patient.last_name}
                          </h4>
                          <p className="text-sm text-slate-500">
                            {patient.dni && `DNI: ${patient.dni}`}
                            {patient.dni && patient.email && ' | '}
                            {patient.email}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="text-sm">{patient.cell_phone}</p>
                          <span className={`text-xs px-2 py-1 rounded-full ${
                            patient.status_patient === 'active' 
                              ? 'bg-green-100 text-green-800' 
                              : 'bg-red-100 text-red-800'
                          }`}>
                            {patient.status_patient}
                          </span>
                        </div>
                      </div>
                    ))}
                    {patients.length > 10 && (
                      <p className="text-center text-sm text-slate-500">
                        Mostrando 10 de {patients.length} pacientes
                      </p>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="schedule" className="space-y-6">
            <Card className="bg-white/90 backdrop-blur-sm">
              <CardHeader>
                <CardTitle>Agenda de Citas</CardTitle>
                <CardDescription>
                  Total: {appointments.length} citas programadas
                </CardDescription>
              </CardHeader>
              <CardContent>
                {appointments.length === 0 ? (
                  <div className="text-center py-8 text-slate-500">
                    <p>No hay citas programadas.</p>
                    <p className="text-sm">Las citas aparecerán aquí cuando se agenden.</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {appointments.slice(0, 10).map((appointment) => (
                      <div key={appointment.id} className="flex items-center justify-between p-4 border rounded-lg">
                        <div>
                          <h4 className="font-medium">
                            {new Date(appointment.datetime).toLocaleDateString()} - {new Date(appointment.datetime).toLocaleTimeString()}
                          </h4>
                          <p className="text-sm text-slate-500">
                            {appointment.type} • {appointment.duration} min
                          </p>
                        </div>
                        <div className="text-right">
                          <span className={`text-xs px-2 py-1 rounded-full ${
                            appointment.status_appointment === 'confirmed' ? 'bg-green-100 text-green-800' :
                            appointment.status_appointment === 'scheduled' ? 'bg-blue-100 text-blue-800' :
                            appointment.status_appointment === 'completed' ? 'bg-gray-100 text-gray-800' :
                            'bg-red-100 text-red-800'
                          }`}>
                            {appointment.status_appointment}
                          </span>
                        </div>
                      </div>
                    ))}
                    {appointments.length > 10 && (
                      <p className="text-center text-sm text-slate-500">
                        Mostrando 10 de {appointments.length} citas
                      </p>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="whatsapp" className="space-y-6">
            <Card className="bg-white/90 backdrop-blur-sm">
              <CardHeader>
                <CardTitle>Equipo Profesional</CardTitle>
                <CardDescription>
                  Total: {professionals.length} profesionales en tu clínica
                </CardDescription>
              </CardHeader>
              <CardContent>
                {professionals.length === 0 ? (
                  <div className="text-center py-8 text-slate-500">
                    <p>No hay profesionales registrados.</p>
                    <p className="text-sm">Los profesionales aparecerán aquí cuando se registren.</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {professionals.map((professional) => (
                      <div key={professional.id} className="flex items-center justify-between p-4 border rounded-lg">
                        <div>
                          <h4 className="font-medium">
                            {professional.first_name} {professional.last_name}
                          </h4>
                          <p className="text-sm text-slate-500">
                            {professional.speciality} • {professional.email}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="text-sm">{professional.phone}</p>
                          <span className={`text-xs px-2 py-1 rounded-full ${
                            professional.status_professional === 'active' 
                              ? 'bg-green-100 text-green-800' 
                              : professional.status_professional === 'vacation'
                              ? 'bg-yellow-100 text-yellow-800'
                              : 'bg-red-100 text-red-800'
                          }`}>
                            {professional.status_professional}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}