// Medical Records Search Component
import React, { useState, useEffect } from 'react';
import { Search, Filter, Download, Eye, Calendar, User, FileText, Activity } from 'lucide-react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { apiRequest } from '../lib/clinicApi';
import { getStoredClinicData } from '../lib/clinicAuth';

interface Patient {
  id: string;
  first_name: string;
  last_name: string;
  dni: string;
  cell_phone: string;
  email?: string;
  last_visit?: string;
  status_patient: string;
  document_count?: number;
  latest_document?: string;
  document_types?: string[];
  total_file_size_mb?: number;
}

interface SearchParams {
  search_text: string;
  clinic_id: string;
  status?: string;
  sort_by?: string;
  sort_desc?: boolean;
}

interface MedicalRecordsAnalytics {
  clinic_id: string;
  patients: {
    total: number;
    active: number;
  };
  documents: {
    total: number;
    recent_30_days: number;
  };
  generated_at: string;
}

export function MedicalRecordsSearch() {
  const [patients, setPatients] = useState<Patient[]>([]);
  const [analytics, setAnalytics] = useState<MedicalRecordsAnalytics | null>(null);
  const [loading, setLoading] = useState(false);
  const [searchText, setSearchText] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [sortBy, setSortBy] = useState<string>('last_visit');
  const [activeTab, setActiveTab] = useState('search');
  
  const { clinic } = getStoredClinicData();
  const clinicId = clinic?.clinic_id || '';

  // Load analytics on component mount
  useEffect(() => {
    if (clinicId) {
      loadAnalytics();
    }
  }, [clinicId]);

  const loadAnalytics = async () => {
    try {
      const analyticsData = await apiRequest(`/patients/analytics/medical-records/${clinicId}`, 'GET');
      setAnalytics(analyticsData);
    } catch (error) {
      console.error('Error loading analytics:', error);
    }
  };

  const performAdvancedSearch = async () => {
    if (!clinicId) return;
    
    setLoading(true);
    try {
      const searchParams: SearchParams = {
        search_text: searchText,
        clinic_id: clinicId,
        sort_by: sortBy,
        sort_desc: true
      };

      if (statusFilter !== 'all') {
        searchParams.status = statusFilter;
      }

      const results = await apiRequest('/patients/search/advanced', 'POST', searchParams);
      setPatients(results);
    } catch (error) {
      console.error('Error performing search:', error);
      setPatients([]);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return 'Sin visitas';
    return new Date(dateString).toLocaleDateString('es-ES');
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800';
      case 'inactive': return 'bg-yellow-100 text-yellow-800';
      case 'archived': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      performAdvancedSearch();
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Historiales Clínicos</h1>
          <p className="text-gray-600">Búsqueda y gestión de registros médicos</p>
        </div>
        <div className="flex space-x-2">
          <Button variant="outline" onClick={loadAnalytics}>
            <Activity className="w-4 h-4 mr-2" />
            Actualizar Estadísticas
          </Button>
        </div>
      </div>

      {/* Analytics Cards */}
      {analytics && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center space-x-2">
                <User className="w-5 h-5 text-blue-500" />
                <div>
                  <p className="text-sm text-gray-600">Total Pacientes</p>
                  <p className="text-2xl font-bold">{analytics.patients.total}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center space-x-2">
                <Activity className="w-5 h-5 text-green-500" />
                <div>
                  <p className="text-sm text-gray-600">Pacientes Activos</p>
                  <p className="text-2xl font-bold">{analytics.patients.active}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center space-x-2">
                <FileText className="w-5 h-5 text-purple-500" />
                <div>
                  <p className="text-sm text-gray-600">Total Documentos</p>
                  <p className="text-2xl font-bold">{analytics.documents.total}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center space-x-2">
                <Calendar className="w-5 h-5 text-orange-500" />
                <div>
                  <p className="text-sm text-gray-600">Docs Últimos 30 días</p>
                  <p className="text-2xl font-bold">{analytics.documents.recent_30_days}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="search">Búsqueda de Pacientes</TabsTrigger>
          <TabsTrigger value="documents">Documentos Médicos</TabsTrigger>
        </TabsList>

        <TabsContent value="search" className="space-y-4">
          {/* Search Controls */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Search className="w-5 h-5" />
                <span>Búsqueda Avanzada</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="md:col-span-2">
                  <Input
                    placeholder="Buscar por nombre, DNI, teléfono, email..."
                    value={searchText}
                    onChange={(e) => setSearchText(e.target.value)}
                    onKeyPress={handleKeyPress}
                    className="w-full"
                  />
                </div>
                
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger>
                    <SelectValue placeholder="Estado del paciente" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos los estados</SelectItem>
                    <SelectItem value="active">Activos</SelectItem>
                    <SelectItem value="inactive">Inactivos</SelectItem>
                    <SelectItem value="archived">Archivados</SelectItem>
                  </SelectContent>
                </Select>
                
                <Select value={sortBy} onValueChange={setSortBy}>
                  <SelectTrigger>
                    <SelectValue placeholder="Ordenar por" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="last_visit">Última visita</SelectItem>
                    <SelectItem value="name">Nombre</SelectItem>
                    <SelectItem value="created_at">Fecha de registro</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="flex justify-between items-center mt-4">
                <p className="text-sm text-gray-600">
                  {patients.length > 0 && `${patients.length} pacientes encontrados`}
                </p>
                <Button onClick={performAdvancedSearch} disabled={loading}>
                  <Search className="w-4 h-4 mr-2" />
                  {loading ? 'Buscando...' : 'Buscar'}
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Results */}
          <div className="space-y-4">
            {patients.map((patient) => (
              <Card key={patient.id} className="hover:shadow-md transition-shadow">
                <CardContent className="p-4">
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <div className="flex items-center space-x-3 mb-2">
                        <h3 className="font-semibold text-lg">
                          {patient.first_name} {patient.last_name}
                        </h3>
                        <Badge className={getStatusColor(patient.status_patient)}>
                          {patient.status_patient}
                        </Badge>
                        {patient.document_count && patient.document_count > 0 && (
                          <Badge variant="outline">
                            <FileText className="w-3 h-3 mr-1" />
                            {patient.document_count} docs
                          </Badge>
                        )}
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm text-gray-600">
                        <div>
                          <strong>DNI:</strong> {patient.dni}
                        </div>
                        <div>
                          <strong>Teléfono:</strong> {patient.cell_phone}
                        </div>
                        <div>
                          <strong>Última visita:</strong> {formatDate(patient.last_visit)}
                        </div>
                        {patient.email && (
                          <div>
                            <strong>Email:</strong> {patient.email}
                          </div>
                        )}
                        {patient.latest_document && (
                          <div>
                            <strong>Último documento:</strong> {formatDate(patient.latest_document)}
                          </div>
                        )}
                        {patient.total_file_size_mb && (
                          <div>
                            <strong>Tamaño docs:</strong> {patient.total_file_size_mb} MB
                          </div>
                        )}
                      </div>
                    </div>
                    
                    <div className="flex space-x-2">
                      <Button variant="outline" size="sm">
                        <Eye className="w-4 h-4 mr-1" />
                        Ver Historial
                      </Button>
                      <Button variant="outline" size="sm">
                        <Download className="w-4 h-4 mr-1" />
                        Documentos
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
            
            {patients.length === 0 && !loading && searchText && (
              <Card>
                <CardContent className="p-8 text-center text-gray-500">
                  <Search className="w-12 h-12 mx-auto mb-4 opacity-50" />
                  <h3 className="text-lg font-medium mb-2">No se encontraron pacientes</h3>
                  <p>Intenta con diferentes términos de búsqueda o filtros.</p>
                </CardContent>
              </Card>
            )}
          </div>
        </TabsContent>

        <TabsContent value="documents">
          <Card>
            <CardContent className="p-8 text-center text-gray-500">
              <FileText className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <h3 className="text-lg font-medium mb-2">Gestión de Documentos</h3>
              <p>Esta sección estará disponible próximamente para gestionar documentos médicos.</p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}