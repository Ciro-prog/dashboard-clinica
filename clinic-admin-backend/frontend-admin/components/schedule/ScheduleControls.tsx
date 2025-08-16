import React from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ChevronLeft, ChevronRight, List, CalendarDays, Grid3X3, Calendar, Clock, User } from 'lucide-react';

type ViewMode = 'day' | 'week' | 'month' | 'monthWeeks';

interface ScheduleControlsProps {
  viewMode: ViewMode;
  loading: boolean;
  eventsCount: number;
  onNavigate: (direction: 'prev' | 'next') => void;
  onToday: () => void;
  onViewModeChange: (mode: ViewMode) => void;
}

export default function ScheduleControls({
  viewMode,
  loading,
  eventsCount,
  onNavigate,
  onToday,
  onViewModeChange
}: ScheduleControlsProps) {
  return (
    <div className="space-y-4">
      {/* Controles de navegación y vista */}
      <div className="flex flex-col space-y-4 mb-4 sm:flex-row sm:items-center sm:justify-between sm:space-y-0">
        {/* Navegación de fechas */}
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => onNavigate('prev')}
            disabled={loading}
            className="h-10 px-3"
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          
          <Button
            variant="outline"
            size="sm"
            onClick={onToday}
            disabled={loading}
            className="h-10 px-4"
          >
            Hoy
          </Button>
          
          <Button
            variant="outline"
            size="sm"
            onClick={() => onNavigate('next')}
            disabled={loading}
            className="h-10 px-3"
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
        
        {/* Selector de vista */}
        <div className="flex items-center border border-border dark:border-border rounded-lg p-1 w-full sm:w-auto bg-card dark:bg-card">
          <Button
            variant={viewMode === 'day' ? 'default' : 'ghost'}
            size="sm"
            onClick={() => onViewModeChange('day')}
            disabled={loading}
            className="h-9 flex-1 sm:flex-none sm:px-3"
          >
            <List className="h-4 w-4 sm:mr-1" />
            <span className="hidden sm:inline">Día</span>
          </Button>
          <Button
            variant={viewMode === 'week' ? 'default' : 'ghost'}
            size="sm"
            onClick={() => onViewModeChange('week')}
            disabled={loading}
            className="h-9 flex-1 sm:flex-none sm:px-3"
          >
            <CalendarDays className="h-4 w-4 sm:mr-1" />
            <span className="hidden sm:inline">Semana</span>
          </Button>
          <Button
            variant={viewMode === 'month' ? 'default' : 'ghost'}
            size="sm"
            onClick={() => onViewModeChange('month')}
            disabled={loading}
            className="h-9 flex-1 sm:flex-none sm:px-3"
          >
            <Grid3X3 className="h-4 w-4 sm:mr-1" />
            <span className="hidden sm:inline">Mes</span>
          </Button>
        </div>
      </div>

      {/* Estados y errores */}
      <div className="flex flex-wrap gap-2 sm:gap-4">
        <Badge variant="default" className="flex items-center gap-1">
          <Calendar className="h-3 w-3" />
          Estado: Conectado
        </Badge>
        <Badge variant="outline" className="flex items-center gap-1">
          <Clock className="h-3 w-3" />
          Vista: {viewMode === 'day' ? 'Día' : viewMode === 'week' ? 'Semana' : 'Mes'}
        </Badge>
        <Badge variant="outline" className="flex items-center gap-1">
          <User className="h-3 w-3" />
          Eventos: {eventsCount}
        </Badge>
      </div>
    </div>
  );
}