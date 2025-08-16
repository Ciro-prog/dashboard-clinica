import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';

interface Patient {
  id: string;
  nombre: string;
  documento: string;
  telefono: string;
  email: string;
  obra_social: string;
  estado: string;
  ultima_consulta?: string;
  notas_consulta?: string;
  fecha_ultima_consulta?: string;
}

const PatientList = () => {
  const [patients, setPatients] = useState<Patient[]>([]);
  const [filteredPatients, setFilteredPatients] = useState<Patient[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);
  const [consultationNotes, setConsultationNotes] = useState('');
  const [isAddingNote, setIsAddingNote] = useState(false);

  // Datos simulados de pacientes con consultas
  const mockPatients: Patient[] = [
    {
      id: '1',
      nombre: 'María García López',
      documento: '12345678',
      telefono: '+54 9 11 1234-5678',
      email: 'maria.garcia@email.com',
      obra_social: 'OSDE',
      estado: 'Activo',
      ultima_consulta: 'Dolor de cabeza recurrente, prescripción de analgésicos',
      notas_consulta: 'Paciente refiere cefaleas tensionales. Se indica paracetamol 500mg c/8hs por 3 días.',
      fecha_ultima_consulta: '2024-01-15'
    },
    {
      id: '2',
      nombre: 'Juan Carlos Pérez',
      documento: '87654321',
      telefono: '+54 9 11 8765-4321',
      email: 'juan.perez@email.com',
      obra_social: 'Swiss Medical',
      estado: 'Activo',
      ultima_consulta: 'Control de presión arterial',
      notas_consulta: 'TA: 140/90. Se ajusta medicación antihipertensiva. Control en 15 días.',
      fecha_ultima_consulta: '2024-01-14'
    },
    {
      id: '3',
      nombre: 'Ana Rodríguez Silva',
      documento: '11223344',
      telefono: '+54 9 11 2233-4455',
      email: 'ana.rodriguez@email.com',
      obra_social: 'Galeno',
      estado: 'Pendiente',
      ultima_consulta: 'Consulta por síntomas gripales',
      notas_consulta: 'Cuadro viral. Reposo, hidratación y sintomáticos. Evolución favorable.',
      fecha_ultima_consulta: '2024-01-13'
    },
    {
      id: '4',
      nombre: 'Carlos López Martín',
      documento: '55667788',
      telefono: '+54 9 11 5566-7788',
      email: 'carlos.lopez@email.com',
      obra_social: 'Medicus',
      estado: 'Activo',
      ultima_consulta: 'Primera consulta - Chequeo general',
      notas_consulta: 'Paciente nuevo. Examen físico normal. Se solicitan estudios de rutina.',
      fecha_ultima_consulta: '2024-01-12'
    },
    {
      id: '5',
      nombre: 'Elena Martín González',
      documento: '99887766',
      telefono: '+54 9 11 9988-7766',
      email: 'elena.martin@email.com',
      obra_social: 'OSDE',
      estado: 'Activo',
      ultima_consulta: 'Seguimiento diabetes tipo 2',
      notas_consulta: 'Glucemia en ayunas: 110 mg/dl. Buen control metabólico. Continúa tratamiento.',
      fecha_ultima_consulta: '2024-01-11'
    }
  ];

  useEffect(() => {
    // Simular carga de pacientes
    setLoading(true);
    setTimeout(() => {
      setPatients(mockPatients);
      setFilteredPatients(mockPatients);
      setLoading(false);
    }, 1000);
  }, []);

  useEffect(() => {
    const filtered = patients.filter(patient =>
      patient.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
      patient.documento.includes(searchTerm) ||
      patient.telefono.includes(searchTerm) ||
      patient.obra_social.toLowerCase().includes(searchTerm.toLowerCase())
    );
    setFilteredPatients(filtered);
  }, [searchTerm, patients]);

  const handleAddConsultationNote = async () => {
    if (!selectedPatient || !consultationNotes.trim()) return;

    setIsAddingNote(true);
    try {
      // Simular guardado de nota
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      const updatedPatients = patients.map(patient => 
        patient.id === selectedPatient.id 
          ? {
              ...patient,
              ultima_consulta: consultationNotes.substring(0, 50) + '...',
              notas_consulta: consultationNotes,
              fecha_ultima_consulta: new Date().toISOString().split('T')[0]
            }
          : patient
      );
      
      setPatients(updatedPatients);
      setConsultationNotes('');
      setSelectedPatient(null);
      
      toast({
        title: "Nota agregada",
        description: "La consulta ha sido registrada exitosamente.",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "No se pudo guardar la nota de consulta.",
        variant: "destructive"
      });
    } finally {
      setIsAddingNote(false);
    }
  };

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

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('es-AR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  };

  return (
    <div className="space-y-6">
      <Card className="medical-card">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2 text-base sm:text-lg">
            <span>👥</span>
            <span>Lista de Pacientes</span>
          </CardTitle>
          <CardDescription className="text-sm">
            Gestión de pacientes y registro de consultas
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="mb-4">
            <Input
              placeholder="Buscar por nombre, documento, teléfono u obra social..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="transition-all focus:ring-2 focus:ring-medical-500"
            />
          </div>
        </CardContent>
      </Card>

      <div className="space-y-4">
        <h3 className="text-base sm:text-lg font-semibold text-slate-800">
          Pacientes Registrados ({filteredPatients.length})
        </h3>
        
        {loading ? (
          <div className="text-center text-slate-500 py-8">Cargando pacientes...</div>
        ) : filteredPatients.length > 0 ? (
          <div className="grid gap-4">
            {filteredPatients.map((patient) => (
              <Card key={patient.id} className="medical-card hover:shadow-xl transition-all duration-300">
                <CardContent className="p-4 sm:p-6">
                  <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start mb-4 space-y-3 sm:space-y-0">
                    <div className="flex-1">
                      <h4 className="text-base sm:text-lg font-semibold text-slate-800 mb-2">
                        {patient.nombre}
                      </h4>
                      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 text-sm">
                        <div className="space-y-1">
                          <div className="flex items-center space-x-2">
                            <span className="text-slate-500">📄</span>
                            <span className="text-slate-700">DNI: {patient.documento}</span>
                          </div>
                          <div className="flex items-center space-x-2">
                            <span className="text-slate-500">📞</span>
                            <span className="text-slate-700 break-all">{patient.telefono}</span>
                          </div>
                          <div className="flex items-center space-x-2">
                            <span className="text-slate-500">🏥</span>
                            <span className="text-slate-700">{patient.obra_social}</span>
                          </div>
                        </div>
                        <div className="space-y-1">
                          <div className="flex items-center space-x-2">
                            <span className="text-slate-500">✉️</span>
                            <span className="text-slate-700 break-all">{patient.email}</span>
                          </div>
                          {patient.fecha_ultima_consulta && (
                            <div className="flex items-center space-x-2">
                              <span className="text-slate-500">📅</span>
                              <span className="text-slate-700">
                                Última consulta: {formatDate(patient.fecha_ultima_consulta)}
                              </span>
                            </div>
                          )}
                        </div>
                      </div>
                      
                      {patient.ultima_consulta && (
                        <div className="mt-3 p-3 bg-slate-50 rounded-lg">
                          <p className="text-sm text-slate-600 font-medium mb-1">Última consulta:</p>
                          <p className="text-sm text-slate-700">{patient.ultima_consulta}</p>
                        </div>
                      )}
                    </div>
                    
                    <div className="flex flex-row sm:flex-col items-start sm:items-end space-x-2 sm:space-x-0 sm:space-y-2 sm:ml-4">
                      <Badge className={`${getStatusColor(patient.estado)} text-white text-xs`}>
                        {patient.estado}
                      </Badge>
                    </div>
                  </div>
                  
                  <div className="flex flex-col sm:flex-row justify-end space-y-2 sm:space-y-0 sm:space-x-2 mt-4 pt-4 border-t border-slate-200">
                    <Dialog>
                      <DialogTrigger asChild>
                        <Button 
                          size="sm" 
                          variant="outline" 
                          className="text-medical-600 border-medical-200 hover:bg-medical-50 text-sm"
                          onClick={() => setSelectedPatient(patient)}
                        >
                          Ver Historial
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="max-w-md sm:max-w-2xl">
                        <DialogHeader>
                          <DialogTitle className="text-base sm:text-lg">Historial Médico - {patient.nombre}</DialogTitle>
                          <DialogDescription className="text-sm">
                            Consultas y notas médicas del paciente
                          </DialogDescription>
                        </DialogHeader>
                        <div className="space-y-4">
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
                            <div>
                              <Label className="font-medium">DNI:</Label>
                              <p>{patient.documento}</p>
                            </div>
                            <div>
                              <Label className="font-medium">Obra Social:</Label>
                              <p>{patient.obra_social}</p>
                            </div>
                          </div>
                          
                          {patient.notas_consulta && (
                            <div>
                              <Label className="font-medium">Última Consulta:</Label>
                              <div className="mt-2 p-3 bg-slate-50 rounded-lg">
                                <p className="text-sm text-slate-700">{patient.notas_consulta}</p>
                                <p className="text-xs text-slate-500 mt-2">
                                  Fecha: {patient.fecha_ultima_consulta ? formatDate(patient.fecha_ultima_consulta) : 'No registrada'}
                                </p>
                              </div>
                            </div>
                          )}
                        </div>
                      </DialogContent>
                    </Dialog>
                    
                    <Dialog>
                      <DialogTrigger asChild>
                        <Button 
                          size="sm" 
                          className="medical-gradient hover:opacity-90 text-sm"
                          onClick={() => {
                            setSelectedPatient(patient);
                            setConsultationNotes('');
                          }}
                        >
                          Nueva Consulta
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="max-w-md sm:max-w-lg">
                        <DialogHeader>
                          <DialogTitle className="text-base sm:text-lg">Nueva Consulta - {selectedPatient?.nombre}</DialogTitle>
                          <DialogDescription className="text-sm">
                            Registrar detalles de la consulta médica
                          </DialogDescription>
                        </DialogHeader>
                        <div className="space-y-4">
                          <div>
                            <Label htmlFor="consultation-notes" className="text-sm">Notas de la Consulta</Label>
                            <Textarea
                              id="consultation-notes"
                              placeholder="Describe los síntomas, diagnóstico, tratamiento prescrito..."
                              value={consultationNotes}
                              onChange={(e) => setConsultationNotes(e.target.value)}
                              rows={6}
                              className="mt-1 text-sm"
                            />
                          </div>
                          <div className="flex flex-col sm:flex-row justify-end space-y-2 sm:space-y-0 sm:space-x-2">
                            <Button variant="outline" onClick={() => setSelectedPatient(null)} className="text-sm">
                              Cancelar
                            </Button>
                            <Button 
                              onClick={handleAddConsultationNote}
                              disabled={isAddingNote || !consultationNotes.trim()}
                              className="medical-gradient hover:opacity-90 text-sm"
                            >
                              {isAddingNote ? 'Guardando...' : 'Guardar Consulta'}
                            </Button>
                          </div>
                        </div>
                      </DialogContent>
                    </Dialog>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <Card className="medical-card">
            <CardContent className="text-center py-12">
              <div className="text-4xl sm:text-6xl mb-4">👥</div>
              <h3 className="text-base sm:text-lg font-semibold text-slate-800 mb-2">
                No se encontraron pacientes
              </h3>
              <p className="text-sm text-slate-600">
                Intenta con otro término de búsqueda
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};

export default PatientList;