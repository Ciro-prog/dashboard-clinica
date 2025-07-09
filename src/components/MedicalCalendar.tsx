import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Badge } from '@/components/ui/badge';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

const MedicalCalendar = () => {
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());
  
  const appointments = [
    {
      id: 1,
      time: '09:00',
      patient: 'María García',
      type: 'Consulta General',
      status: 'confirmada',
      duration: 30
    },
    {
      id: 2,
      time: '10:00',
      patient: 'Juan Pérez',
      type: 'Control',
      status: 'pendiente',
      duration: 30
    },
    {
      id: 3,
      time: '11:30',
      patient: 'Ana Rodríguez',
      type: 'Especialista',
      status: 'confirmada',
      duration: 45
    },
    {
      id: 4,
      time: '14:00',
      patient: 'Carlos López',
      type: 'Primera Vez',
      status: 'nueva',
      duration: 60
    },
    {
      id: 5,
      time: '15:30',
      patient: 'Elena Martín',
      type: 'Seguimiento',
      status: 'confirmada',
      duration: 30
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
      default:
        return 'bg-slate-500';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'confirmada':
        return 'Confirmada';
      case 'pendiente':
        return 'Pendiente';
      case 'nueva':
        return 'Nueva';
      default:
        return status;
    }
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Calendar */}
        <Card className="lg:col-span-1 medical-card">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <span>📅</span>
              <span>Calendario</span>
            </CardTitle>
            <CardDescription>
              Selecciona una fecha para ver las citas
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Calendar
              mode="single"
              selected={selectedDate}
              onSelect={setSelectedDate}
              locale={es}
              className="rounded-md border"
            />
          </CardContent>
        </Card>

        {/* Appointments */}
        <Card className="lg:col-span-2 medical-card">
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <span>🕒</span>
                <span>Citas del Día</span>
              </div>
              <span className="text-sm font-normal text-slate-500">
                {selectedDate ? format(selectedDate, 'PPPP', { locale: es }) : 'Hoy'}
              </span>
            </CardTitle>
            <CardDescription>
              Agenda médica y consultas programadas
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {appointments.map((appointment) => (
              <div 
                key={appointment.id} 
                className="flex items-center justify-between p-4 bg-slate-50 rounded-lg hover:bg-slate-100 transition-colors"
              >
                <div className="flex items-center space-x-4">
                  <div className="text-center">
                    <div className="text-lg font-semibold text-medical-600">
                      {appointment.time}
                    </div>
                    <div className="text-xs text-slate-500">
                      {appointment.duration} min
                    </div>
                  </div>
                  
                  <div className="flex-1">
                    <h4 className="font-semibold text-slate-800">
                      {appointment.patient}
                    </h4>
                    <p className="text-sm text-slate-600">
                      {appointment.type}
                    </p>
                  </div>
                </div>
                
                <div className="flex items-center space-x-3">
                  <Badge className={`${getStatusColor(appointment.status)} text-white`}>
                    {getStatusText(appointment.status)}
                  </Badge>
                  <Button size="sm" variant="outline" className="text-medical-600 border-medical-200 hover:bg-medical-50">
                    Ver
                  </Button>
                </div>
              </div>
            ))}
            
            {appointments.length === 0 && (
              <div className="text-center py-8">
                <div className="text-4xl mb-2">📅</div>
                <p className="text-slate-600">No hay citas programadas para este día</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="medical-card">
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-medical-600">5</div>
            <div className="text-sm text-slate-600">Citas Hoy</div>
          </CardContent>
        </Card>
        
        <Card className="medical-card">
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-health-600">3</div>
            <div className="text-sm text-slate-600">Confirmadas</div>
          </CardContent>
        </Card>
        
        <Card className="medical-card">
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-medical-400">1</div>
            <div className="text-sm text-slate-600">Pendientes</div>
          </CardContent>
        </Card>
        
        <Card className="medical-card">
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-slate-600">4h 30m</div>
            <div className="text-sm text-slate-600">Tiempo Total</div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default MedicalCalendar;
