import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

interface Appointment {
  id: number;
  time: string;
  patient?: string;
  type: string;
  status: 'confirmada' | 'pendiente' | 'nueva' | 'completada' | 'cancelada';
  duration: number;
  notes?: string;
  phone?: string;
  isAvailable?: boolean;
}

const DailySchedule = () => {
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());
  const [selectedAppointment, setSelectedAppointment] = useState<Appointment | null>(null);
  
  const appointments: Appointment[] = [
    {
      id: 1,
      time: '08:00',
      patient: 'María García López',
      type: 'Control Rutinario',
      status: 'confirmada',
      duration: 30,
      notes: 'Control de presión arterial',
      phone: '+54 9 11 1234-5678'
    },
    {
      id: 2,
      time: '08:30',
      type: 'Disponible',
      status: 'pendiente',
      duration: 30,
      isAvailable: true
    },
    {
      id: 3,
      time: '09:00',
      patient: 'Juan Carlos Pérez',
      type: 'Primera Consulta',
      status: 'nueva',
      duration: 45,
      notes: 'Paciente nuevo - Chequeo general',
      phone: '+54 9 11 8765-4321'
    },
    {
      id: 4,
      time: '09:45',
      type: 'Disponible',
      status: 'pendiente',
      duration: 30,
      isAvailable: true
    },
    {
      id: 5,
      time: '10:15',
      patient: 'Ana Rodríguez Silva',
      type: 'Seguimiento',
      status: 'confirmada',
      duration: 30,
      notes: 'Control post-tratamiento',
      phone: '+54 9 11 2233-4455'
    },
    {
      id: 6,
      time: '10:45',
      type: 'Disponible',
      status: 'pendiente',
      duration: 30,
      isAvailable: true
    },
    {
      id: 7,
      time: '11:15',
      patient: 'Carlos López Martín',
      type: 'Consulta Especializada',
      status: 'confirmada',
      duration: 60,
      notes: 'Evaluación cardiológica',
      phone: '+54 9 11 5566-7788'
    },
    {
      id: 8,
      time: '12:15',
      type: 'Almuerzo',
      status: 'pendiente',
      duration: 60,
      isAvailable: false
    },
    {
      id: 9,
      time: '13:15',
      type: 'Disponible',
      status: 'pendiente',
      duration: 30,
      isAvailable: true
    },
    {
      id: 10,
      time: '13:45',
      patient: 'Elena Martín González',
      type: 'Control Diabetes',
      status: 'confirmada',
      duration: 30,
      notes: 'Seguimiento diabetes tipo 2',
      phone: '+54 9 11 9988-7766'
    },
    {
      id: 11,
      time: '14:15',
      type: 'Disponible',
      status: 'pendiente',
      duration: 30,
      isAvailable: true
    },
    {
      id: 12,
      time: '14:45',
      patient: 'Roberto Silva Fernández',
      type: 'Urgencia',
      status: 'nueva',
      duration: 45,
      notes: 'Dolor abdominal agudo',
      phone: '+54 9 11 3344-5566'
    },
    {
      id: 13,
      time: '15:30',
      type: 'Disponible',
      status: 'pendiente',
      duration: 30,
      isAvailable: true
    },
    {
      id: 14,
      time: '16:00',
      patient: 'Lucía Morales Castro',
      type: 'Consulta Completada',
      status: 'completada',
      duration: 30,
      notes: 'Consulta finalizada - Receta entregada',
      phone: '+54 9 11 7788-9900'
    },
    {
      id: 15,
      time: '16:30',
      type: 'Disponible',
      status: 'pendiente',
      duration: 30,
      isAvailable: true
    },
    {
      id: 16,
      time: '17:00',
      patient: 'Miguel Ángel Torres',
      type: 'Control Cancelado',
      status: 'cancelada',
      duration: 30,
      notes: 'Paciente canceló por motivos personales',
      phone: '+54 9 11 4455-6677'
    }
  ];

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'confirmada':
        return 'bg-health-500';
      case 'pendiente':
        return 'bg-medical-300';
      case 'nueva':
        return 'bg-medical-500';
      case 'completada':
        return 'bg-green-600';
      case 'cancelada':
        return 'bg-red-500';
      default:
        return 'bg-slate-500';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'confirmada':
        return 'Confirmada';
      case 'pendiente':
        return 'Disponible';
      case 'nueva':
        return 'Nueva';
      case 'completada':
        return 'Completada';
      case 'cancelada':
        return 'Cancelada';
      default:
        return status;
    }
  };

  const getAppointmentIcon = (appointment: Appointment) => {
    if (appointment.isAvailable) return '🕐';
    if (appointment.type === 'Almuerzo') return '🍽️';
    if (appointment.status === 'completada') return '✅';
    if (appointment.status === 'cancelada') return '❌';
    if (appointment.status === 'nueva') return '🆕';
    return '👤';
  };

  const getAppointmentStyle = (appointment: Appointment) => {
    if (appointment.isAvailable) {
      return 'bg-slate-50 border-2 border-dashed border-slate-300 hover:bg-slate-100';
    }
    if (appointment.type === 'Almuerzo') {
      return 'bg-orange-50 border border-orange-200 hover:bg-orange-100';
    }
    if (appointment.status === 'completada') {
      return 'bg-green-50 border border-green-200 hover:bg-green-100';
    }
    if (appointment.status === 'cancelada') {
      return 'bg-red-50 border border-red-200 hover:bg-red-100';
    }
    return 'bg-white border border-slate-200 hover:bg-slate-50';
  };

  const totalAppointments = appointments.filter(apt => apt.patient).length;
  const confirmedAppointments = appointments.filter(apt => apt.status === 'confirmada').length;
  const availableSlots = appointments.filter(apt => apt.isAvailable).length;
  const completedAppointments = appointments.filter(apt => apt.status === 'completada').length;

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 xl:grid-cols-4 gap-6">
        {/* Calendar */}
        <Card className="xl:col-span-1 medical-card">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2 text-base sm:text-lg">
              <span>📅</span>
              <span>Calendario</span>
            </CardTitle>
            <CardDescription className="text-sm">
              Selecciona una fecha para ver la agenda
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Calendar
              mode="single"
              selected={selectedDate}
              onSelect={setSelectedDate}
              locale={es}
              className="rounded-md border w-full"
            />
          </CardContent>
        </Card>

        {/* Daily Schedule */}
        <Card className="xl:col-span-3 medical-card">
          <CardHeader>
            <CardTitle className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-2 sm:space-y-0">
              <div className="flex items-center space-x-2">
                <span>🗓️</span>
                <span className="text-base sm:text-lg">Agenda del Día</span>
              </div>
              <span className="text-sm font-normal text-slate-500">
                {selectedDate ? format(selectedDate, 'PPPP', { locale: es }) : 'Hoy'}
              </span>
            </CardTitle>
            <CardDescription className="text-sm">
              Horarios completos con pacientes y espacios disponibles
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="max-h-96 overflow-y-auto space-y-2">
              {appointments.map((appointment) => (
                <div 
                  key={appointment.id} 
                  className={`flex items-center justify-between p-3 sm:p-4 rounded-lg transition-all duration-200 cursor-pointer ${getAppointmentStyle(appointment)}`}
                  onClick={() => !appointment.isAvailable && appointment.patient && setSelectedAppointment(appointment)}
                >
                  <div className="flex items-center space-x-3 sm:space-x-4 flex-1 min-w-0">
                    <div className="text-center min-w-[50px] sm:min-w-[60px] flex-shrink-0">
                      <div className="text-sm sm:text-lg font-semibold text-medical-600">
                        {appointment.time}
                      </div>
                      <div className="text-xs text-slate-500">
                        {appointment.duration} min
                      </div>
                    </div>
                    
                    <div className="text-xl sm:text-2xl flex-shrink-0">
                      {getAppointmentIcon(appointment)}
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      {appointment.patient ? (
                        <>
                          <h4 className="font-semibold text-slate-800 text-sm sm:text-base truncate">
                            {appointment.patient}
                          </h4>
                          <p className="text-xs sm:text-sm text-slate-600 truncate">
                            {appointment.type}
                          </p>
                          {appointment.notes && (
                            <p className="text-xs text-slate-500 mt-1 truncate hidden sm:block">
                              {appointment.notes}
                            </p>
                          )}
                        </>
                      ) : (
                        <div className="text-slate-600">
                          <span className="font-medium text-sm sm:text-base">{appointment.type}</span>
                          {appointment.isAvailable && (
                            <p className="text-xs text-slate-500 hidden sm:block">Horario disponible para citas</p>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                  
                  <div className="flex flex-col sm:flex-row items-end sm:items-center space-y-2 sm:space-y-0 sm:space-x-3 flex-shrink-0">
                    <Badge className={`${getStatusColor(appointment.status)} text-white text-xs`}>
                      {getStatusText(appointment.status)}
                    </Badge>
                    {appointment.patient && (
                      <Button size="sm" variant="outline" className="text-medical-600 border-medical-200 hover:bg-medical-50 text-xs hidden sm:inline-flex">
                        Ver
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <Card className="medical-card">
          <CardContent className="p-3 sm:p-4 text-center">
            <div className="text-xl sm:text-2xl font-bold text-medical-600">{totalAppointments}</div>
            <div className="text-xs sm:text-sm text-slate-600">Total Pacientes</div>
          </CardContent>
        </Card>
        
        <Card className="medical-card">
          <CardContent className="p-3 sm:p-4 text-center">
            <div className="text-xl sm:text-2xl font-bold text-health-600">{confirmedAppointments}</div>
            <div className="text-xs sm:text-sm text-slate-600">Confirmadas</div>
          </CardContent>
        </Card>
        
        <Card className="medical-card">
          <CardContent className="p-3 sm:p-4 text-center">
            <div className="text-xl sm:text-2xl font-bold text-slate-600">{availableSlots}</div>
            <div className="text-xs sm:text-sm text-slate-600">Disponibles</div>
          </CardContent>
        </Card>
        
        <Card className="medical-card">
          <CardContent className="p-3 sm:p-4 text-center">
            <div className="text-xl sm:text-2xl font-bold text-green-600">{completedAppointments}</div>
            <div className="text-xs sm:text-sm text-slate-600">Completadas</div>
          </CardContent>
        </Card>
      </div>

      {/* Appointment Details Dialog */}
      {selectedAppointment && (
        <Dialog open={!!selectedAppointment} onOpenChange={() => setSelectedAppointment(null)}>
          <DialogContent className="max-w-md sm:max-w-lg">
            <DialogHeader>
              <DialogTitle className="text-base sm:text-lg">Detalles de la Cita - {selectedAppointment.time}</DialogTitle>
              <DialogDescription className="text-sm">
                Información completa del paciente y consulta
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-slate-600">Paciente:</label>
                  <p className="font-semibold text-sm sm:text-base">{selectedAppointment.patient}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-slate-600">Tipo:</label>
                  <p className="text-sm sm:text-base">{selectedAppointment.type}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-slate-600">Duración:</label>
                  <p className="text-sm sm:text-base">{selectedAppointment.duration} minutos</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-slate-600">Estado:</label>
                  <Badge className={`${getStatusColor(selectedAppointment.status)} text-white ml-2 text-xs`}>
                    {getStatusText(selectedAppointment.status)}
                  </Badge>
                </div>
              </div>
              
              {selectedAppointment.phone && (
                <div>
                  <label className="text-sm font-medium text-slate-600">Teléfono:</label>
                  <p className="text-sm sm:text-base">{selectedAppointment.phone}</p>
                </div>
              )}
              
              {selectedAppointment.notes && (
                <div>
                  <label className="text-sm font-medium text-slate-600">Notas:</label>
                  <p className="text-sm bg-slate-50 p-3 rounded-lg">{selectedAppointment.notes}</p>
                </div>
              )}
              
              <div className="flex flex-col sm:flex-row justify-end space-y-2 sm:space-y-0 sm:space-x-2 pt-4">
                <Button variant="outline" onClick={() => setSelectedAppointment(null)} className="text-sm">
                  Cerrar
                </Button>
                <Button className="medical-gradient hover:opacity-90 text-sm">
                  Editar Cita
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
};

export default DailySchedule;