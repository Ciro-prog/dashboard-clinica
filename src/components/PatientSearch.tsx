import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';

const PatientSearch = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [searchType, setSearchType] = useState('all');
  const [patients, setPatients] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchPatients = async () => {
      setLoading(true);
      setError(null);
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      if (userError || !user) {
        setPatients([]);
        setError('No autenticado');
        setLoading(false);
        return;
      }
      const { data, error } = await supabase
        .from('pacientes')
        .select('*')
        .eq('usuario_id', user.id);
      if (error) {
        setError('Error al obtener pacientes');
        setPatients([]);
      } else {
        setPatients(data || []);
      }
      setLoading(false);
    };
    fetchPatients();
  }, []);

  const filteredPatients = patients.filter(patient => {
    if (!searchTerm) return true;
    
    const searchLower = searchTerm.toLowerCase();
    
    switch (searchType) {
      case 'name':
        return patient.nombre?.toLowerCase().includes(searchLower);
      case 'document':
        return patient.documento?.includes(searchTerm);
      case 'phone':
        return patient.telefono?.includes(searchTerm);
      case 'insurance':
        return patient.obra_social?.toLowerCase().includes(searchLower);
      default:
        return (
          patient.nombre?.toLowerCase().includes(searchLower) ||
          patient.documento?.includes(searchTerm) ||
          patient.telefono?.includes(searchTerm) ||
          patient.obra_social?.toLowerCase().includes(searchLower)
        );
    }
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Activo':
        return 'bg-health-500';
      case 'Pendiente':
        return 'bg-medical-300';
      case 'Completado':
        return 'bg-medical-500';
      default:
        return 'bg-slate-500';
    }
  };

  return (
    <div className="space-y-6">
      <Card className="medical-card">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <span>🔍</span>
            <span>Búsqueda de Pacientes</span>
          </CardTitle>
          <CardDescription>
            Busca información de pacientes por nombre, documento, teléfono u obra social
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="md:col-span-2">
              <Input
                placeholder="Buscar paciente..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="transition-all focus:ring-2 focus:ring-medical-500"
              />
            </div>
            <Select value={searchType} onValueChange={setSearchType}>
              <SelectTrigger>
                <SelectValue placeholder="Tipo de búsqueda" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos los campos</SelectItem>
                <SelectItem value="name">Nombre</SelectItem>
                <SelectItem value="document">Documento</SelectItem>
                <SelectItem value="phone">Teléfono</SelectItem>
                <SelectItem value="insurance">Obra Social</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-slate-800">
          Pacientes Encontrados ({filteredPatients.length})
        </h3>
        
        {loading ? (
          <div className="text-center text-slate-500">Cargando pacientes...</div>
        ) : error ? (
          <div className="text-center text-red-500">{error}</div>
        ) : filteredPatients.length > 0 ? (
          <div className="grid gap-4">
            {filteredPatients.map((patient) => (
              <Card key={patient.id} className="medical-card hover:shadow-xl transition-all duration-300">
                <CardContent className="p-6">
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <h4 className="text-lg font-semibold text-slate-800 mb-1">
                        {patient.nombre}
                      </h4>
                      <p className="text-sm text-slate-600">Documento: {patient.documento}</p>
                      <p className="text-sm text-slate-600">Estado: {patient.estado}</p>
                    </div>
                    <Badge className={`${getStatusColor(patient.estado)} text-white`}>
                      {patient.estado}
                    </Badge>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm mb-2">
                    <div className="space-y-2">
                      <div className="flex items-center space-x-2">
                        <span className="text-slate-500">📞</span>
                        <span className="text-slate-700">{patient.telefono}</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <span className="text-slate-500">🏥</span>
                        <span className="text-slate-700">{patient.obra_social}</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <span className="text-slate-500">✉️</span>
                        <span className="text-slate-700">{patient.email}</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <span className="text-slate-500">📍</span>
                        <span className="text-slate-700">{patient.direccion}</span>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <div className="flex items-center space-x-2">
                        <span className="text-slate-500">🗓️</span>
                        <span className="text-slate-700">Creado: {patient.fecha_creacion ? new Date(patient.fecha_creacion).toLocaleString() : ''}</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <span className="text-slate-500">🔄</span>
                        <span className="text-slate-700">Actualizado: {patient.fecha_actualizacion ? new Date(patient.fecha_actualizacion).toLocaleString() : ''}</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex justify-end space-x-2 mt-2">
                    <Button size="sm" variant="outline" className="text-medical-600 border-medical-200 hover:bg-medical-50">
                      Ver Historial
                    </Button>
                    <Button size="sm" className="medical-gradient hover:opacity-90">
                      Contactar
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <Card className="medical-card">
            <CardContent className="text-center py-12">
              <div className="text-6xl mb-4">🔍</div>
              <h3 className="text-lg font-semibold text-slate-800 mb-2">
                No se encontraron pacientes
              </h3>
              <p className="text-slate-600">
                Intenta con otro término de búsqueda
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};

export default PatientSearch;
