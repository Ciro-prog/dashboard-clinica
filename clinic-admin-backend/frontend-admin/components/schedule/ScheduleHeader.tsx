import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Calendar, Plus, RefreshCw, LogOut } from 'lucide-react';

interface Calendar {
  id: string;
  summary: string;
  primary?: boolean;
}

interface ScheduleHeaderProps {
  calendars: Calendar[];
  selectedCalendar: string;
  loading: boolean;
  onCalendarChange: (calendarId: string) => void;
  onRefresh: () => void;
  onCreateNew: () => void;
  onDisconnect?: () => void;
}

export default function ScheduleHeader({
  calendars,
  selectedCalendar,
  loading,
  onCalendarChange,
  onRefresh,
  onCreateNew,
  onDisconnect
}: ScheduleHeaderProps) {
  return (
    <Card className="bg-card dark:bg-card">
      <CardHeader>
        <div className="flex flex-col space-y-4 lg:flex-row lg:items-center lg:justify-between lg:space-y-0">
          <div>
            <CardTitle className="flex items-center gap-2 text-lg sm:text-xl text-foreground">
              <Calendar className="h-5 w-5 sm:h-6 sm:w-6" />
              Agenda Médica
            </CardTitle>
            <CardDescription className="text-sm text-muted-foreground">
              Gestión completa de citas médicas
            </CardDescription>
          </div>
          
          <div className="flex flex-col space-y-3 sm:flex-row sm:items-center sm:gap-3 sm:space-y-0">
            {/* Selector de calendario */}
            <select 
              value={selectedCalendar} 
              onChange={(e) => onCalendarChange(e.target.value)}
              className="w-full sm:w-48 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 h-10"
            >
              <option value="" disabled>Seleccionar calendario</option>
              {calendars.map((calendar) => (
                <option key={calendar.id} value={calendar.id}>
                  {calendar.summary} {calendar.primary && '(Principal)'}
                </option>
              ))}
            </select>

            {/* Botones de acción */}
            <div className="flex gap-2">
              <Button 
                variant="outline"
                onClick={onRefresh}
                disabled={loading}
                className="flex-1 sm:flex-none h-10"
              >
                <RefreshCw className="h-4 w-4 sm:mr-2" />
                <span className="hidden sm:inline">Actualizar</span>
              </Button>
              
              <Button 
                onClick={onCreateNew}
                className="flex-1 sm:flex-none h-10"
              >
                <Plus className="h-4 w-4 sm:mr-2" />
                <span className="hidden sm:inline">Nueva Cita</span>
                <span className="sm:hidden">Nueva</span>
              </Button>
              
              {/* Botón desconectar - solo visible en móvil */}
              {onDisconnect && (
                <Button 
                  variant="outline"
                  onClick={onDisconnect}
                  disabled={loading}
                  className="block sm:hidden flex-1 h-10 text-red-600 border-red-200 hover:bg-red-50"
                >
                  <LogOut className="h-4 w-4" />
                </Button>
              )}
            </div>
          </div>
        </div>
      </CardHeader>
    </Card>
  );
}