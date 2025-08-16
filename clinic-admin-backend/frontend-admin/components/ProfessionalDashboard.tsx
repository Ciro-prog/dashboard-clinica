import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from '@/hooks/use-toast';
import { 
  User, 
  Stethoscope, 
  Users, 
  Calendar, 
  FileText, 
  Search,
  Share,
  Settings,
  LogOut,
  Clock,
  Phone,
  Mail
} from 'lucide-react';
import { 
  getProfessionalFromToken, 
  logoutProfessional, 
  createProfessionalAuthenticatedRequest,
  type ProfessionalUser 
} from '@/lib/professionalAuth';

interface Patient {
  id: string;
  first_name: string;
  last_name: string;
  dni: string;
  cell_phone: string;
  email?: string;
  last_visit?: string;
  visit_history: any[];
  status_patient: string;
  clinic_id: string;
  shared_with?: any[];
}

interface ProfessionalDashboardProps {
  onLogout: () => void;
}

const ProfessionalDashboard = ({ onLogout }: ProfessionalDashboardProps) => {
  const [professional, setProfessional] = useState<ProfessionalUser | null>(null);
  const [patients, setPatients] = useState<Patient[]>([]);
  const [filteredPatients, setFilteredPatients] = useState<Patient[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [patientFilter, setPatientFilter] = useState<'all' | 'own' | 'shared'>('all');
  const [activeTab, setActiveTab] = useState<'overview' | 'patients' | 'profile'>('overview');

  const authenticatedRequest = createProfessionalAuthenticatedRequest();

  useEffect(() => {
    loadProfessionalData();
  }, []);

  useEffect(() => {
    filterPatients();
  }, [patients, searchTerm, patientFilter, professional]);

  const loadProfessionalData = async () => {
    try {
      const professionalData = getProfessionalFromToken();
      if (!professionalData) {
        onLogout();
        return;
      }

      setProfessional(professionalData);
      
      // Cargar pacientes de la clínica
      await loadPatients(professionalData.clinic_id);
    } catch (error) {
      console.error('❌ Error cargando datos del profesional:', error);
      toast({
        title: "Error",
        description: "Error al cargar los datos del profesional",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const loadPatients = async (clinicId: string) => {
    try {
      const response = await authenticatedRequest<Patient[]>(`/patients/clinic/${clinicId}`);
      console.log('📊 Pacientes cargados:', response.length);
      setPatients(response);
    } catch (error) {
      console.error('❌ Error cargando pacientes:', error);
      toast({
        title: "Error",
        description: "Error al cargar la lista de pacientes",
        variant: "destructive"
      });
    }
  };

  const filterPatients = () => {
    if (!professional) return;

    let filtered = patients;

    // Filtrar por búsqueda
    if (searchTerm) {
      filtered = filtered.filter(patient => 
        `${patient.first_name} ${patient.last_name}`.toLowerCase().includes(searchTerm.toLowerCase()) ||
        patient.dni.includes(searchTerm) ||
        patient.cell_phone.includes(searchTerm) ||
        (patient.email && patient.email.toLowerCase().includes(searchTerm.toLowerCase()))
      );
    }

    // Filtrar por relación con el profesional
    switch (patientFilter) {
      case 'own':
        // Pacientes que han tenido consultas con este profesional
        filtered = filtered.filter(patient => 
          patient.visit_history?.some(visit => visit.professional_id === professional.id)
        );
        break;
      case 'shared':
        // Pacientes que han sido compartidos con este profesional
        filtered = filtered.filter(patient => 
          patient.shared_with?.some(share => share.professional_id === professional.id)
        );
        break;
      case 'all':
      default:
        // Todos los pacientes de la clínica
        break;
    }

    setFilteredPatients(filtered);
  };

  const handleLogout = () => {
    logoutProfessional();
    onLogout();
  };

  const getLastVisitDisplay = (patient: Patient): string => {
    if (!patient.last_visit) return 'Sin visitas';
    
    const date = new Date(patient.last_visit);
    const now = new Date();
    const diffDays = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) return 'Hoy';
    if (diffDays === 1) return 'Ayer';
    if (diffDays < 30) return `Hace ${diffDays} días`;
    if (diffDays < 365) return `Hace ${Math.floor(diffDays / 30)} meses`;
    return `Hace ${Math.floor(diffDays / 365)} años`;
  };

  const getPatientStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return <Badge className="bg-green-100 text-green-800">Activo</Badge>;
      case 'inactive':
        return <Badge className="bg-gray-100 text-gray-800">Inactivo</Badge>;
      case 'archived':
        return <Badge className="bg-red-100 text-red-800">Archivado</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const getMyPatientsCount = (): number => {
    if (!professional) return 0;
    return patients.filter(patient => 
      patient.visit_history?.some(visit => visit.professional_id === professional.id)
    ).length;
  };

  const getSharedPatientsCount = (): number => {
    if (!professional) return 0;
    return patients.filter(patient => 
      patient.shared_with?.some(share => share.professional_id === professional.id)
    ).length;
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-medical-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Cargando dashboard...</p>
        </div>
      </div>
    );
  }

  if (!professional) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center space-x-4">
              <div className="w-10 h-10 medical-gradient rounded-full flex items-center justify-center">
                <User className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-900">
                  Dr. {professional.first_name} {professional.last_name}
                </h1>
                <p className="text-sm text-gray-600">{professional.speciality}</p>
              </div>
            </div>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={handleLogout}
              className="flex items-center space-x-2"
            >
              <LogOut className="w-4 h-4" />
              <span>Cerrar Sesión</span>
            </Button>
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-6">
        <div className="flex space-x-1 bg-gray-100 rounded-lg p-1">
          <button
            className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
              activeTab === 'overview' 
                ? 'bg-white text-medical-600 shadow-sm' 
                : 'text-gray-600 hover:text-gray-900'
            }`}
            onClick={() => setActiveTab('overview')}
          >
            Resumen
          </button>
          <button
            className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
              activeTab === 'patients' 
                ? 'bg-white text-medical-600 shadow-sm' 
                : 'text-gray-600 hover:text-gray-900'
            }`}
            onClick={() => setActiveTab('patients')}
          >
            Pacientes
          </button>
          <button
            className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
              activeTab === 'profile' 
                ? 'bg-white text-medical-600 shadow-sm' 
                : 'text-gray-600 hover:text-gray-900'
            }`}
            onClick={() => setActiveTab('profile')}
          >
            Mi Perfil
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {activeTab === 'overview' && (
          <div className="space-y-6">
            {/* Statistics Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total Pacientes</CardTitle>
                  <Users className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{patients.length}</div>
                  <p className="text-xs text-muted-foreground">En la clínica</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Mis Pacientes</CardTitle>
                  <Stethoscope className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{getMyPatientsCount()}</div>
                  <p className="text-xs text-muted-foreground">Consultas realizadas</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Compartidos</CardTitle>
                  <Share className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{getSharedPatientsCount()}</div>
                  <p className="text-xs text-muted-foreground">Pacientes compartidos</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Estado</CardTitle>
                  <Settings className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{professional.status === 'active' ? 'Activo' : 'Inactivo'}</div>
                  <p className="text-xs text-muted-foreground">Estado actual</p>
                </CardContent>
              </Card>
            </div>

            {/* Recent Activity */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Calendar className="w-5 h-5" />
                  <span>Actividad Reciente</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600">Vista de actividad reciente próximamente...</p>
              </CardContent>
            </Card>
          </div>
        )}

        {activeTab === 'patients' && (
          <div className="space-y-6">
            {/* Patients Filters */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Users className="w-5 h-5" />
                  <span>Gestión de Pacientes</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex flex-col sm:flex-row gap-4">
                  <div className="flex-1">
                    <Label htmlFor="search">Buscar paciente</Label>
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                      <Input
                        id="search"
                        placeholder="Nombre, DNI, teléfono o email..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="pl-10"
                      />
                    </div>
                  </div>
                  
                  <div className="sm:w-48">
                    <Label htmlFor="filter">Filtrar por</Label>
                    <Select value={patientFilter} onValueChange={(value: any) => setPatientFilter(value)}>
                      <SelectTrigger>
                        <SelectValue placeholder="Filtrar" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">Todos ({patients.length})</SelectItem>
                        <SelectItem value="own">Mis Pacientes ({getMyPatientsCount()})</SelectItem>
                        <SelectItem value="shared">Compartidos ({getSharedPatientsCount()})</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Patients List */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredPatients.map(patient => (
                <Card key={patient.id} className="hover:shadow-md transition-shadow">
                  <CardHeader className="pb-3">
                    <div className="flex justify-between items-start">
                      <div>
                        <CardTitle className="text-lg">
                          {patient.first_name} {patient.last_name}
                        </CardTitle>
                        <p className="text-sm text-gray-600">DNI: {patient.dni}</p>
                      </div>
                      {getPatientStatusBadge(patient.status_patient)}
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="flex items-center space-x-2 text-sm">
                      <Phone className="w-4 h-4 text-gray-400" />
                      <span>{patient.cell_phone}</span>
                    </div>
                    
                    {patient.email && (
                      <div className="flex items-center space-x-2 text-sm">
                        <Mail className="w-4 h-4 text-gray-400" />
                        <span>{patient.email}</span>
                      </div>
                    )}
                    
                    <div className="flex items-center space-x-2 text-sm">
                      <Clock className="w-4 h-4 text-gray-400" />
                      <span>Última visita: {getLastVisitDisplay(patient)}</span>
                    </div>

                    <div className="flex items-center space-x-2 text-sm">
                      <FileText className="w-4 h-4 text-gray-400" />
                      <span>{patient.visit_history?.length || 0} consultas</span>
                    </div>

                    {/* Show if patient is shared with this professional */}
                    {patient.shared_with?.some(share => share.professional_id === professional.id) && (
                      <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
                        <Share className="w-3 h-3 mr-1" />
                        Compartido
                      </Badge>
                    )}

                    {/* Show if professional has seen this patient */}
                    {patient.visit_history?.some(visit => visit.professional_id === professional.id) && (
                      <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                        <Stethoscope className="w-3 h-3 mr-1" />
                        Mi Paciente
                      </Badge>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>

            {filteredPatients.length === 0 && (
              <Card>
                <CardContent className="text-center py-8">
                  <Users className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-600">No se encontraron pacientes con los filtros aplicados.</p>
                </CardContent>
              </Card>
            )}
          </div>
        )}

        {activeTab === 'profile' && (
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <User className="w-5 h-5" />
                  <span>Mi Información Professional</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <Label className="text-sm font-medium text-gray-700">Nombre Completo</Label>
                    <p className="text-lg">{professional.first_name} {professional.last_name}</p>
                  </div>
                  
                  <div>
                    <Label className="text-sm font-medium text-gray-700">Especialidad</Label>
                    <p className="text-lg">{professional.speciality}</p>
                  </div>
                  
                  <div>
                    <Label className="text-sm font-medium text-gray-700">Email</Label>
                    <p className="text-lg">{professional.email}</p>
                  </div>
                  
                  <div>
                    <Label className="text-sm font-medium text-gray-700">Estado</Label>
                    <p className="text-lg">
                      {professional.status === 'active' ? (
                        <Badge className="bg-green-100 text-green-800">Activo</Badge>
                      ) : (
                        <Badge className="bg-red-100 text-red-800">Inactivo</Badge>
                      )}
                    </p>
                  </div>
                </div>

                <div>
                  <Label className="text-sm font-medium text-gray-700">Permisos</Label>
                  <div className="flex flex-wrap gap-2 mt-2">
                    {professional.permissions.map(permission => (
                      <Badge key={permission} variant="outline">
                        {permission.replace('_', ' ').toUpperCase()}
                      </Badge>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
};

export default ProfessionalDashboard;