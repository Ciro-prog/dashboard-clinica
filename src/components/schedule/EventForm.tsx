import React from 'react';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';

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

interface EventFormProps {
  formData: EventFormData;
  loading: boolean;
  onFormDataChange: (data: Partial<EventFormData>) => void;
  onSubmit: () => void;
  onCancel: () => void;
}

export default function EventForm({
  formData,
  loading,
  onFormDataChange,
  onSubmit,
  onCancel
}: EventFormProps) {
  return (
    <div className="space-y-4 max-h-[70vh] overflow-y-auto">
      <div>
        <Label htmlFor="fullName" className="text-sm font-medium">Nombre Completo *</Label>
        <Input
          id="fullName"
          value={formData.fullName}
          onChange={(e) => onFormDataChange({ fullName: e.target.value })}
          placeholder="Nombre y apellido del paciente"
          className="mt-1 h-11"
        />
      </div>
      
      <div>
        <Label htmlFor="phone" className="text-sm font-medium">Teléfono</Label>
        <Input
          id="phone"
          value={formData.phone}
          onChange={(e) => onFormDataChange({ phone: e.target.value })}
          placeholder="Número de contacto (opcional)"
          className="mt-1 h-11"
        />
      </div>
      
      <div>
        <Label htmlFor="consultationType" className="text-sm font-medium">Tipo de Consulta *</Label>
        <Input
          id="consultationType"
          value={formData.consultationType}
          onChange={(e) => onFormDataChange({ consultationType: e.target.value })}
          placeholder="Ej: Consulta General, Cardiología, Pediatría..."
          className="mt-1 h-11"
        />
      </div>
      
      {/* Responsive date/time grid - vertical on mobile, horizontal on larger screens */}
      <div className="space-y-4 sm:space-y-0 sm:grid sm:grid-cols-3 sm:gap-3">
        <div>
          <Label htmlFor="date" className="text-sm font-medium">Fecha *</Label>
          <Input
            id="date"
            type="date"
            value={formData.date}
            onChange={(e) => onFormDataChange({ date: e.target.value })}
            className="mt-1 h-11"
          />
        </div>
        <div>
          <Label htmlFor="startTime" className="text-sm font-medium">Inicio *</Label>
          <Input
            id="startTime"
            type="time"
            value={formData.startTime}
            onChange={(e) => onFormDataChange({ startTime: e.target.value })}
            className="mt-1 h-11"
          />
        </div>
        <div>
          <Label htmlFor="endTime" className="text-sm font-medium">Fin *</Label>
          <Input
            id="endTime"
            type="time"
            value={formData.endTime}
            onChange={(e) => onFormDataChange({ endTime: e.target.value })}
            className="mt-1 h-11"
          />
        </div>
      </div>
      
      <div>
        <Label htmlFor="description" className="text-sm font-medium">Detalles Adicionales</Label>
        <Textarea
          id="description"
          value={formData.description}
          onChange={(e) => onFormDataChange({ description: e.target.value })}
          placeholder="Motivo de consulta, observaciones..."
          rows={3}
          className="mt-1"
        />
      </div>
      
      <div className="flex flex-col sm:flex-row gap-3 pt-4">
        <Button 
          onClick={onSubmit}
          disabled={loading || !formData.fullName || !formData.consultationType}
          className="flex-1 h-11"
        >
          {loading ? 'Creando...' : 'Crear Cita'}
        </Button>
        <Button 
          variant="outline" 
          onClick={onCancel}
          disabled={loading}
          className="h-11 sm:w-auto"
        >
          Cancelar
        </Button>
      </div>
    </div>
  );
}