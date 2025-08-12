// src/components/EnhancedSchedule.tsx - Agenda médica completa con vistas múltiples

import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import ScheduleHeader from './schedule/ScheduleHeader';
import ScheduleControls from './schedule/ScheduleControls';
import EventForm from './schedule/EventForm';
import { 
  Calendar, 
  Clock, 
  User, 
  Plus, 
  LogIn, 
  LogOut, 
  RefreshCw, 
  Phone,
  FileText
} from 'lucide-react';
import ApiCalendar from 'react-google-calendar-api';

// Configuración de Google Calendar API
const config = {
  clientId: '258798827340-7n62t1gp8ctkuu81ejp31o1ebb1sln3r.apps.googleusercontent.com',
  apiKey: 'AIzaSyDQVSBt0WkhBdvwYsm--aR2j_wJoQYrLZQ',
  scope: 'https://www.googleapis.com/auth/calendar',
  discoveryDocs: [
    'https://www.googleapis.com/discovery/v1/apis/calendar/v3/rest'
  ]
};

// Inicializar API Calendar
const apiCalendar = new ApiCalendar(config);

// Función para detectar errores de autenticación
const isAuthError = (error: any): boolean => {
  const errorMessage = error.message?.toLowerCase() || '';
  return (
    errorMessage.includes('401') ||
    errorMessage.includes('403') ||
    errorMessage.includes('unauthorized') ||
    errorMessage.includes('forbidden') ||
    errorMessage.includes('token') ||
    errorMessage.includes('expired')
  );
};

// Event form data interface
interface EventFormData {
  summary: string;
  fullName: string;
  phone: string;
  consultationType: string;
  description: string;
  date: string;
  startTime: string;
  endTime: string;
}

// Interfaces
interface GoogleCalendarEvent {
  id: string;
  summary: string;
  description?: string;
  start: {
    dateTime?: string;
    date?: string;
  };
  end: {
    dateTime?: string;
    date?: string;
  };
  location?: string;
  status: string;
}

interface Calendar {
  id: string;
  summary: string;
  backgroundColor?: string;
  primary?: boolean;
}

interface EventFormData {
  summary: string;
  fullName: string;
  phone: string;
  consultationType: string;
  description: string;
  date: string;
  startTime: string;
  endTime: string;
}

type ViewMode = 'day' | 'week' | 'month' | 'monthWeeks';


const EnhancedSchedule: React.FC = () => {
  // Estados principales
  const [isSignedIn, setIsSignedIn] = useState(false);
  const [events, setEvents] = useState<GoogleCalendarEvent[]>([]);
  const [calendars, setCalendars] = useState<Calendar[]>([]);
  const [selectedCalendar, setSelectedCalendar] = useState('primary');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Estados de vista y navegación
  const [viewMode, setViewMode] = useState<ViewMode>('day');
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDayInWeek, setSelectedDayInWeek] = useState<Date | null>(null);
  
  // Estados del formulario
  const [showCreateForm, setShowCreateForm] = useState(false);
  
  
  const [formData, setFormData] = useState<EventFormData>({
    summary: '',
    fullName: '',
    phone: '',
    consultationType: '',
    description: '',
    date: new Date().toISOString().split('T')[0],
    startTime: '09:00',
    endTime: '10:00'
  });

  // Funciones de utilidad para fechas
  const getStartOfWeek = (date: Date) => {
    const start = new Date(date);
    const day = start.getDay();
    const diff = start.getDate() - day + (day === 0 ? -6 : 1); // Lunes como primer día
    start.setDate(diff);
    start.setHours(0, 0, 0, 0);
    return start;
  };

  const getStartOfMonth = (date: Date) => {
    return new Date(date.getFullYear(), date.getMonth(), 1);
  };

  const getDaysInMonth = (date: Date) => {
    return new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
  };

  const formatDateForAPI = (date: Date) => {
    return date.toISOString();
  };

  const getDateRange = (date: Date, mode: ViewMode) => {
    let start: Date, end: Date;
    
    switch (mode) {
      case 'day':
        start = new Date(date);
        start.setHours(0, 0, 0, 0);
        end = new Date(date);
        end.setHours(23, 59, 59, 999);
        break;
      case 'week':
        start = getStartOfWeek(date);
        end = new Date(start);
        end.setDate(end.getDate() + 6);
        end.setHours(23, 59, 59, 999);
        break;
      case 'month':
      case 'monthWeeks':
        start = getStartOfMonth(date);
        end = new Date(date.getFullYear(), date.getMonth() + 1, 0);
        end.setHours(23, 59, 59, 999);
        break;
      default:
        start = new Date(date);
        end = new Date(date);
    }
    
    return { start, end };
  };

  // Funciones de autenticación (mantener las que ya funcionan)
  useEffect(() => {
    const checkAuthStatus = () => {
      try {
        console.log('📅 Verificando estado de autenticación...');
        
        if (apiCalendar.sign) {
          console.log('✅ Usuario ya autenticado');
          setIsSignedIn(true);
          loadCalendars();
          loadEventsForCurrentView();
        } else {
          console.log('❌ Usuario no autenticado');
          setIsSignedIn(false);
        }
      } catch (error) {
        console.error('❌ Error verificando autenticación:', error);
        setIsSignedIn(false);
      }
    };

    setTimeout(checkAuthStatus, 1000);
  }, []);

  // Obtener token de acceso (funciones que ya funcionan)
  const getAccessToken = async (): Promise<string | null> => {
    let accessToken = null;
    
    try {
      if (apiCalendar.gapi?.auth2) {
        accessToken = apiCalendar.gapi.auth2.getAuthInstance().currentUser.get().getAuthResponse().access_token;
      }
    } catch (e) {
      console.log('❌ gapi.auth2 no funciona:', e.message);
    }
    
    if (!accessToken && window.gapi?.client) {
      try {
        const tokenInfo = window.gapi.client.getToken();
        if (tokenInfo && tokenInfo.access_token) {
          accessToken = tokenInfo.access_token;
        }
      } catch (e) {
        console.log('❌ gapi.client.getToken() failed:', e.message);
      }
    }
    
    if (!accessToken && window.gapi?.auth2) {
      try {
        const authInstance = window.gapi.auth2.getAuthInstance();
        if (authInstance) {
          const user = authInstance.currentUser.get();
          if (user && user.isSignedIn()) {
            accessToken = user.getAuthResponse().access_token;
          }
        }
      } catch (e) {
        console.log('❌ gapi global method failed:', e.message);
      }
    }
    
    return accessToken;
  };

  // Manejar login
  const handleSignIn = async () => {
    try {
      setLoading(true);
      setError(null);
      console.log('🔐 Iniciando autenticación...');
      
      const authResult = await apiCalendar.handleAuthClick();
      console.log('📊 Resultado de autenticación:', authResult);
      
      const isAuth = apiCalendar.sign;
      console.log('📊 Estado de autenticación:', isAuth);
      
      if (isAuth) {
        setIsSignedIn(true);
        console.log('✅ Autenticación exitosa');
        await loadCalendars();
        await loadEventsForCurrentView();
      } else {
        console.log('⚠️ Autenticación no completada');
        setError('Autenticación no completada. Inténtalo de nuevo.');
      }
    } catch (error) {
      console.error('❌ Error en autenticación:', error);
      setError(`Error al conectar con Google Calendar: ${error.message}`);
      setIsSignedIn(false);
    } finally {
      setLoading(false);
    }
  };

  // Manejar logout
  const handleSignOut = async () => {
    try {
      console.log('🚪 Cerrando sesión...');
      await apiCalendar.handleSignoutClick();
      setIsSignedIn(false);
      setEvents([]);
      setCalendars([]);
      console.log('✅ Sesión cerrada');
    } catch (error) {
      console.error('❌ Error cerrando sesión:', error);
      setError('Error al cerrar sesión');
    }
  };

  // Cargar calendarios disponibles
  const loadCalendars = async () => {
    try {
      console.log('📅 Cargando calendarios disponibles...');
      const accessToken = await getAccessToken();
      
      if (!accessToken) {
        throw new Error('No hay token de acceso disponible');
      }
      
      const response = await fetch(
        'https://www.googleapis.com/calendar/v3/users/me/calendarList',
        {
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json'
          }
        }
      );
      
      if (!response.ok) {
        throw new Error(`Error HTTP ${response.status}`);
      }
      
      const data = await response.json();
      const calendarList = data.items || [];
      
      setCalendars(calendarList);
      console.log(`✅ ${calendarList.length} calendarios cargados`);
      
    } catch (error) {
      console.error('❌ Error cargando calendarios:', error);
      
      // Verificar si es un error de autenticación
      if (isAuthError(error)) {
        console.log('🔐 Error de autenticación detectado, requiriendo nueva autenticación...');
        setIsSignedIn(false);
        setError('Tu sesión ha expirado. Por favor, vuelve a conectar tu cuenta de Google.');
      } else {
        setError(`Error al cargar calendarios: ${error.message}`);
      }
    }
  };

  // Cargar eventos para la vista actual
  const loadEventsForCurrentView = async () => {
    try {
      setLoading(true);
      setError(null);
      console.log('📅 Cargando eventos para vista actual...');
      
      const accessToken = await getAccessToken();
      if (!accessToken) {
        throw new Error('No hay token de acceso disponible');
      }
      
      const { start, end } = getDateRange(currentDate, viewMode);
      const timeMin = formatDateForAPI(start);
      const timeMax = formatDateForAPI(end);
      
      console.log(`📅 Consultando eventos de ${selectedCalendar} desde:`, timeMin, 'hasta:', timeMax);
      
      const response = await fetch(
        `https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(selectedCalendar)}/events?` + 
        `timeMin=${encodeURIComponent(timeMin)}&` +
        `timeMax=${encodeURIComponent(timeMax)}&` +
        `maxResults=100&` +
        `singleEvents=true&` +
        `orderBy=startTime`,
        {
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json'
          }
        }
      );
      
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Error HTTP ${response.status}: ${errorText}`);
      }
      
      const data = await response.json();
      const events = data.items || [];
      setEvents(events);
      console.log(`✅ ${events.length} eventos cargados exitosamente`);
      
    } catch (error) {
      console.error('❌ Error cargando eventos:', error);
      
      // Verificar si es un error de autenticación
      if (isAuthError(error)) {
        console.log('🔐 Error de autenticación detectado, requiriendo nueva autenticación...');
        setIsSignedIn(false);
        setError('Tu sesión ha expirado. Por favor, vuelve a conectar tu cuenta de Google.');
      } else {
        setError(`Error al cargar eventos: ${error.message}`);
      }
      setEvents([]);
    } finally {
      setLoading(false);
    }
  };

  // Navegación entre fechas
  const navigateDate = (direction: 'prev' | 'next') => {
    const newDate = new Date(currentDate);
    
    switch (viewMode) {
      case 'day':
        newDate.setDate(newDate.getDate() + (direction === 'next' ? 1 : -1));
        break;
      case 'week':
        newDate.setDate(newDate.getDate() + (direction === 'next' ? 7 : -7));
        break;
      case 'month':
      case 'monthWeeks':
        newDate.setMonth(newDate.getMonth() + (direction === 'next' ? 1 : -1));
        break;
    }
    
    setCurrentDate(newDate);
  };

  // Efectos para recargar eventos cuando cambia la vista, fecha o calendario
  useEffect(() => {
    if (isSignedIn) {
      loadEventsForCurrentView();
    }
  }, [currentDate, viewMode, selectedCalendar, isSignedIn]);

  // Reset selectedDayInWeek when view mode changes
  useEffect(() => {
    if (viewMode !== 'week') {
      setSelectedDayInWeek(null);
    }
  }, [viewMode]);

  // Crear evento
  const createEvent = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      const accessToken = await getAccessToken();
      if (!accessToken) {
        throw new Error('No hay token de acceso disponible');
      }
      
      // Construir fecha y hora completa
      const startDateTime = new Date(`${formData.date}T${formData.startTime}:00`);
      const endDateTime = new Date(`${formData.date}T${formData.endTime}:00`);
      
      // Construir descripción completa
      const description = [
        `Paciente: ${formData.fullName}`,
        formData.phone ? `Teléfono: ${formData.phone}` : '',
        `Tipo de consulta: ${formData.consultationType}`,
        formData.description ? `Detalles: ${formData.description}` : ''
      ].filter(Boolean).join('\n');
      
      const event = {
        summary: `${formData.consultationType} - ${formData.fullName}`,
        description: description,
        start: {
          dateTime: startDateTime.toISOString(),
          timeZone: 'America/Argentina/Buenos_Aires'
        },
        end: {
          dateTime: endDateTime.toISOString(),
          timeZone: 'America/Argentina/Buenos_Aires'
        },
        reminders: {
          useDefault: false,
          overrides: [
            { method: 'email', minutes: 24 * 60 },
            { method: 'popup', minutes: 15 }
          ]
        }
      };
      
      console.log('📅 Evento a crear:', event);
      
      const response = await fetch(
        `https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(selectedCalendar)}/events`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(event)
        }
      );
      
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Error HTTP ${response.status}: ${errorText}`);
      }
      
      const createdEvent = await response.json();
      console.log('✅ Evento creado exitosamente:', createdEvent);
      
      // Resetear formulario y cerrar modal usando timeout para evitar conflictos DOM
      setTimeout(() => {
        setFormData({
          summary: '',
          fullName: '',
          phone: '',
          consultationType: '',
          description: '',
          date: new Date().toISOString().split('T')[0],
          startTime: '09:00',
          endTime: '10:00'
        });
        setShowCreateForm(false);
      }, 100);
      
      // Recargar eventos
      await loadEventsForCurrentView();
      
    } catch (error) {
      console.error('❌ Error creando evento:', error);
      
      // Verificar si es un error de autenticación
      if (isAuthError(error)) {
        console.log('🔐 Error de autenticación detectado, requiriendo nueva autenticación...');
        setIsSignedIn(false);
        setError('Tu sesión ha expirado. Por favor, vuelve a conectar tu cuenta de Google.');
      } else {
        setError(`Error al crear evento: ${error.message}`);
      }
    } finally {
      setLoading(false);
    }
  }, [formData, selectedCalendar]);

  // Formatear fecha para mostrar
  const formatDisplayDate = (date: Date) => {
    return date.toLocaleDateString('es-ES', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const formatDisplayTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString('es-ES', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Filtrar eventos por día específico
  const getEventsForDay = (date: Date) => {
    const dayStart = new Date(date);
    dayStart.setHours(0, 0, 0, 0);
    const dayEnd = new Date(date);
    dayEnd.setHours(23, 59, 59, 999);
    
    return events.filter(event => {
      const eventDate = new Date(event.start.dateTime || event.start.date!);
      return eventDate >= dayStart && eventDate <= dayEnd;
    });
  };

  // Renderizar vista diaria
  const renderDayView = () => {
    const dayEvents = getEventsForDay(currentDate);
    
    return (
      <div className="space-y-4">
        <div className="text-center">
          <h3 className="text-lg font-semibold capitalize">
            {formatDisplayDate(currentDate)}
          </h3>
          <p className="text-sm text-gray-500">
            {dayEvents.length} evento{dayEvents.length !== 1 ? 's' : ''} programado{dayEvents.length !== 1 ? 's' : ''}
          </p>
        </div>
        
        {dayEvents.length === 0 ? (
          <div className="text-center py-8">
            <Calendar className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-500">No hay eventos programados para este día</p>
          </div>
        ) : (
          <div className="space-y-3">
            {dayEvents.map((event) => (
              <div key={event.id} className="border border-border rounded-lg p-4 bg-card dark:bg-card hover:bg-gray-50 dark:hover:bg-gray-800">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4 text-blue-500" />
                    <span className="font-medium text-foreground">
                      {event.start.dateTime && formatDisplayTime(event.start.dateTime)}
                      {event.end.dateTime && ` - ${formatDisplayTime(event.end.dateTime)}`}
                    </span>
                  </div>
                  <Badge variant="outline">
                    {event.status === 'confirmed' ? 'Confirmado' : event.status}
                  </Badge>
                </div>
                <h4 className="font-medium mb-1 text-foreground">{event.summary}</h4>
                {event.description && (
                  <p className="text-sm text-gray-600 dark:text-gray-300 whitespace-pre-line">
                    {event.description}
                  </p>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    );
  };

  // Renderizar vista semanal
  const renderWeekView = () => {
    const weekStart = getStartOfWeek(currentDate);
    const weekDays = Array.from({ length: 7 }, (_, i) => {
      const day = new Date(weekStart);
      day.setDate(weekStart.getDate() + i);
      return day;
    });
    
    return (
      <div className="space-y-4">
        <div className="text-center">
          <h3 className="text-lg font-semibold">
            Semana del {weekStart.toLocaleDateString('es-ES')}
          </h3>
        </div>
        
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-2">
          {weekDays.map((day, index) => {
            const dayEvents = getEventsForDay(day);
            const isToday = day.toDateString() === new Date().toDateString();
            
            return (
              <div 
                key={index}
                className={`border rounded-lg p-2 sm:p-3 min-h-[100px] sm:min-h-[120px] cursor-pointer ${
                  isToday ? 'bg-blue-50 border-blue-200' : 
                  selectedDayInWeek && day.toDateString() === selectedDayInWeek.toDateString() ? 'bg-green-50 border-green-200' :
                  'hover:bg-gray-50'
                }`}
                onClick={() => setSelectedDayInWeek(day)}
              >
                <div className="text-center mb-2">
                  <div className="text-xs text-gray-500 capitalize">
                    {day.toLocaleDateString('es-ES', { weekday: 'short' })}
                  </div>
                  <div className={`text-sm sm:text-lg font-medium ${isToday ? 'text-blue-600' : ''}`}>
                    {day.getDate()}
                  </div>
                </div>
                
                {dayEvents.length > 0 && (
                  <div className="space-y-1">
                    <Badge variant="secondary" className="text-xs">
                      {dayEvents.length}
                    </Badge>
                    {dayEvents.slice(0, 1).map((event) => (
                      <div key={event.id} className="text-xs p-1 bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 rounded truncate">
                        <div className="hidden sm:block">
                          {event.start.dateTime && formatDisplayTime(event.start.dateTime)} {event.summary}
                        </div>
                        <div className="sm:hidden">
                          {event.start.dateTime && formatDisplayTime(event.start.dateTime)}
                        </div>
                      </div>
                    ))}
                    {dayEvents.length > 1 && (
                      <div className="text-xs text-gray-500">
                        +{dayEvents.length - 1} más
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
        
        {/* Detalles del día seleccionado */}
        {selectedDayInWeek && (
          <div className="mt-6 border-t pt-6">
            <div className="text-center mb-4">
              <h4 className="text-lg font-semibold">
                Eventos para {formatDisplayDate(selectedDayInWeek)}
              </h4>
              <p className="text-sm text-gray-500">
                {getEventsForDay(selectedDayInWeek).length} evento{getEventsForDay(selectedDayInWeek).length !== 1 ? 's' : ''} programado{getEventsForDay(selectedDayInWeek).length !== 1 ? 's' : ''}
              </p>
            </div>
            
            {getEventsForDay(selectedDayInWeek).length === 0 ? (
              <div className="text-center py-8 bg-gray-50 dark:bg-gray-800 rounded-lg">
                <Calendar className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                <p className="text-gray-500">No hay eventos programados para este día</p>
              </div>
            ) : (
              <div className="space-y-3">
                {getEventsForDay(selectedDayInWeek).map((event) => (
                  <div key={event.id} className="border border-border rounded-lg p-4 hover:bg-gray-50 dark:hover:bg-gray-800 bg-card">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <Clock className="h-4 w-4 text-blue-500" />
                        <span className="font-medium">
                          {event.start.dateTime && formatDisplayTime(event.start.dateTime)}
                          {event.end.dateTime && ` - ${formatDisplayTime(event.end.dateTime)}`}
                        </span>
                      </div>
                      <Badge variant="outline">
                        {event.status === 'confirmed' ? 'Confirmado' : event.status}
                      </Badge>
                    </div>
                    <h4 className="font-medium mb-1">{event.summary}</h4>
                    {event.description && (
                      <p className="text-sm text-gray-600 whitespace-pre-line">
                        {event.description}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    );
  };

  // Renderizar vista de semanas del mes
  const renderMonthWeeksView = () => {
    const monthStart = getStartOfMonth(currentDate);
    const monthName = currentDate.toLocaleDateString('es-ES', { month: 'long', year: 'numeric' });
    
    // Calcular todas las semanas del mes
    const weeks = [];
    let currentWeekStart = getStartOfWeek(monthStart);
    
    for (let i = 0; i < 6; i++) { // Máximo 6 semanas posibles en un mes
      const weekEnd = new Date(currentWeekStart);
      weekEnd.setDate(weekEnd.getDate() + 6);
      
      // Solo incluir semanas que contengan días del mes actual
      const weekDays = Array.from({ length: 7 }, (_, dayIndex) => {
        const day = new Date(currentWeekStart);
        day.setDate(day.getDate() + dayIndex);
        return day;
      });
      
      const hasCurrentMonthDays = weekDays.some(day => day.getMonth() === currentDate.getMonth());
      
      if (hasCurrentMonthDays) {
        weeks.push({
          start: new Date(currentWeekStart),
          end: new Date(weekEnd),
          days: weekDays
        });
      }
      
      currentWeekStart.setDate(currentWeekStart.getDate() + 7);
      
      // Si ya pasamos el mes, terminar
      if (currentWeekStart.getMonth() !== currentDate.getMonth() && weeks.length > 0) {
        break;
      }
    }
    
    return (
      <div className="space-y-4">
        <div className="text-center">
          <h3 className="text-lg font-semibold capitalize">{monthName}</h3>
          <p className="text-sm text-gray-500">Selecciona una semana para ver detalles</p>
        </div>
        
        <div className="space-y-3">
          {weeks.map((week, index) => {
            const weekEvents = events.filter(event => {
              const eventDate = new Date(event.start.dateTime || event.start.date!);
              return eventDate >= week.start && eventDate <= week.end;
            });
            
            const currentMonthDays = week.days.filter(day => day.getMonth() === currentDate.getMonth());
            const startDay = currentMonthDays[0];
            const endDay = currentMonthDays[currentMonthDays.length - 1];
            
            return (
              <div 
                key={index}
                className="border border-border rounded-lg p-4 hover:bg-blue-50 dark:hover:bg-blue-900/20 cursor-pointer transition-colors"
                onClick={() => {
                  setCurrentDate(week.start);
                  setViewMode('week');
                }}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-medium">
                      Semana {index + 1}: {startDay.getDate()} - {endDay.getDate()} de {monthName.split(' ')[0]}
                    </h4>
                    <p className="text-sm text-gray-500">
                      {week.start.toLocaleDateString('es-ES')} - {week.end.toLocaleDateString('es-ES')}
                    </p>
                  </div>
                  <div className="text-right">
                    <Badge variant="secondary">
                      {weekEvents.length} evento{weekEvents.length !== 1 ? 's' : ''}
                    </Badge>
                    {weekEvents.length > 0 && (
                      <p className="text-xs text-gray-500 mt-1">
                        Click para ver detalles
                      </p>
                    )}
                  </div>
                </div>
                
                {/* Preview de algunos eventos */}
                {weekEvents.length > 0 && (
                  <div className="mt-3 pt-3 border-t">
                    <div className="grid grid-cols-7 gap-1 text-xs">
                      {week.days.map((day, dayIndex) => {
                        const dayEvents = getEventsForDay(day);
                        const isCurrentMonth = day.getMonth() === currentDate.getMonth();
                        
                        return (
                          <div key={dayIndex} className={`text-center p-1 ${!isCurrentMonth ? 'text-gray-400' : ''}`}>
                            <div className="font-medium">{day.getDate()}</div>
                            {dayEvents.length > 0 && (
                              <div className="w-2 h-2 bg-blue-500 dark:bg-blue-400 rounded-full mx-auto mt-1"></div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  // Renderizar vista mensual
  const renderMonthView = () => {
    const monthStart = getStartOfMonth(currentDate);
    const monthName = currentDate.toLocaleDateString('es-ES', { month: 'long', year: 'numeric' });
    const daysInMonth = getDaysInMonth(currentDate);
    const firstDayWeekday = monthStart.getDay();
    const startDay = firstDayWeekday === 0 ? 6 : firstDayWeekday - 1; // Lunes = 0
    
    const monthDays = Array.from({ length: 42 }, (_, i) => {
      const day = new Date(monthStart);
      day.setDate(day.getDate() + i - startDay);
      return day;
    });
    
    return (
      <div className="space-y-4">
        <div className="text-center">
          <h3 className="text-lg font-semibold capitalize">{monthName}</h3>
        </div>
        {/* Encabezados de días */}
        <div className="grid grid-cols-7 gap-1 mb-2">
          {['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'].map((day) => (
            <div key={day} className="text-center text-sm font-medium text-gray-500 p-2">
              {day}
            </div>
          ))}
        </div>
        
        {/* Días del mes */}
        <div className="grid grid-cols-7 gap-1">
          {monthDays.map((day, index) => {
            const dayEvents = getEventsForDay(day);
            const isCurrentMonth = day.getMonth() === currentDate.getMonth();
            const isToday = day.toDateString() === new Date().toDateString();
            
            return (
              <div 
                key={index}
                className={`border rounded p-1 sm:p-2 min-h-[60px] sm:min-h-[80px] cursor-pointer ${
                  !isCurrentMonth ? 'bg-gray-50 text-gray-400' : 
                  isToday ? 'bg-blue-50 border-blue-200' : 'hover:bg-gray-50'
                }`}
                onClick={() => {
                  setCurrentDate(day);
                  setViewMode('monthWeeks');
                }}
              >
                <div className={`text-xs sm:text-sm font-medium mb-1 ${isToday ? 'text-blue-600' : ''}`}>
                  {day.getDate()}
                </div>
                
                {isCurrentMonth && dayEvents.length > 0 && (
                  <div className="space-y-1">
                    <Badge variant="secondary" className="text-xs py-0 px-1">
                      {dayEvents.length}
                    </Badge>
                    <div className="hidden sm:block">
                      {dayEvents.slice(0, 1).map((event) => (
                        <div key={event.id} className="text-xs p-1 bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 rounded truncate">
                          {event.summary}
                        </div>
                      ))}
                      {dayEvents.length > 1 && (
                        <div className="text-xs text-gray-500">
                          +{dayEvents.length - 1}
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  if (!isSignedIn) {
    return (
      <div className="space-y-6">
        <Card className="bg-card dark:bg-card">
          <CardContent className="flex flex-col items-center justify-center py-8 sm:py-12 px-4 bg-card dark:bg-card">
            <Calendar className="h-12 w-12 sm:h-16 sm:w-16 text-gray-400 dark:text-gray-500 mb-4" />
            <h3 className="text-lg sm:text-xl font-medium text-gray-900 dark:text-gray-100 mb-2 text-center">
              Conecta tu Google Calendar
            </h3>
            <p className="text-gray-500 dark:text-gray-400 text-center mb-6 text-sm sm:text-base max-w-md">
              Para gestionar tu agenda médica, necesitas conectar tu cuenta de Google Calendar.
            </p>
            
            {/* Mostrar error si existe */}
            {error && (
              <div className="w-full max-w-md mb-6 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
                <div className="flex items-start gap-3">
                  <div className="text-red-500 text-lg">⚠️</div>
                  <div>
                    <p className="text-sm font-medium text-red-800 dark:text-red-300 mb-1">Error de Conexión</p>
                    <p className="text-xs text-red-600 dark:text-red-400">{error}</p>
                  </div>
                </div>
              </div>
            )}
            
            <Button 
              onClick={handleSignIn} 
              disabled={loading}
              className="w-full sm:w-auto bg-blue-600 hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600 text-white"
            >
              <LogIn className="h-4 w-4 mr-2" />
              {loading ? 'Conectando...' : 'Conectar Google Calendar'}
            </Button>
            
            {/* Información adicional para móvil */}
            <div className="mt-6 text-xs text-gray-400 dark:text-gray-500 text-center sm:hidden">
              <p>✓ Tus datos están seguros</p>
              <p>✓ Solo accedemos a tu calendario</p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header con controles */}
      <ScheduleHeader
        calendars={calendars}
        selectedCalendar={selectedCalendar}
        loading={loading}
        onCalendarChange={setSelectedCalendar}
        onRefresh={loadEventsForCurrentView}
        onCreateNew={() => setShowCreateForm(true)}
        onDisconnect={handleSignOut}
      />
      
      <Card className="bg-card dark:bg-card">
        <CardContent className="bg-card dark:bg-card">
          <ScheduleControls
            viewMode={viewMode}
            loading={loading}
            eventsCount={events.length}
            onNavigate={navigateDate}
            onToday={() => setCurrentDate(new Date())}
            onViewModeChange={setViewMode}
          />

          {error && (
            <Alert variant="destructive" className="mb-4">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>

      {/* Dialog para crear nueva cita */}
      <Dialog key="create-event-dialog" open={showCreateForm} onOpenChange={setShowCreateForm}>
        <DialogContent className="max-w-md sm:max-w-lg bg-card z-[100] mx-4">
          <DialogHeader>
            <DialogTitle className="text-lg sm:text-xl">Crear Nueva Cita</DialogTitle>
            <DialogDescription className="text-sm">
              Complete los datos del paciente y la cita médica
            </DialogDescription>
          </DialogHeader>
          
          <EventForm
            formData={formData}
            loading={loading}
            onFormDataChange={(data) => setFormData({...formData, ...data})}
            onSubmit={createEvent}
            onCancel={() => setShowCreateForm(false)}
          />
        </DialogContent>
      </Dialog>

      {/* Contenido principal de la agenda */}
      <Card className="bg-card dark:bg-card">
        <CardContent className="p-6 bg-card dark:bg-card">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <RefreshCw className="h-6 w-6 animate-spin mr-2" />
              <span className="text-foreground">Cargando agenda...</span>
            </div>
          ) : (
            <>
              {viewMode === 'day' && renderDayView()}
              {viewMode === 'week' && renderWeekView()}
              {viewMode === 'month' && renderMonthView()}
              {viewMode === 'monthWeeks' && renderMonthWeeksView()}
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default EnhancedSchedule;