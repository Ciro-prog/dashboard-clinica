import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Building2, Loader2 } from 'lucide-react';
import { generateClinicId } from '@/lib/uniqueId';

interface ClinicCreateDialogProps {
  onClinicCreated: () => void;
}

export default function ClinicCreateDialog({ onClinicCreated }: ClinicCreateDialogProps) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const [formData, setFormData] = useState({
    clinic_id: '',
    name_clinic: '',
    suscriber: '',
    email: '',
    cell_phone: '',
    address: '',
    domain_name: '',
    subscription_plan: 'trial',
    password: '',
    status_clinic: 'active'
  });

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
    
    // Auto-generar domain_name y clinic_id basado en name_clinic
    if (field === 'name_clinic' && value) {
      const domain = value
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '') // Remover acentos
        .replace(/[^a-z0-9]/g, '') // Solo letras y números
        .substring(0, 20); // Máximo 20 caracteres
      
      const clinicId = generateClinicId(value);
      
      setFormData(prev => ({
        ...prev,
        domain_name: domain,
        clinic_id: clinicId
      }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      setLoading(true);
      setError(null);
      
      console.log('🏥 Creando nueva clínica:', formData);
      
      const token = localStorage.getItem('admin_token');
      if (!token) {
        throw new Error('Token de administrador no encontrado');
      }

      const response = await fetch('/api/admin/clinics', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(formData)
      });

      if (!response.ok) {
        const errorData = await response.text();
        console.error('❌ Error creando clínica:', response.status, errorData);
        
        if (response.status === 400) {
          throw new Error('Datos inválidos o clínica ya existe con ese ID/email');
        } else if (response.status === 401) {
          throw new Error('Sesión expirada. Por favor, inicia sesión nuevamente');
        } else {
          throw new Error(`Error del servidor: ${response.status}`);
        }
      }

      const newClinic = await response.json();
      console.log('✅ Clínica creada exitosamente:', newClinic);
      
      // Cerrar modal y limpiar formulario
      setOpen(false);
      setFormData({
        clinic_id: '',
        name_clinic: '',
        suscriber: '',
        email: '',
        cell_phone: '',
        address: '',
        domain_name: '',
        subscription_plan: 'trial',
        password: '',
        status_clinic: 'active'
      });
      
      // Notificar al componente padre para refrescar la lista
      onClinicCreated();
      
    } catch (err) {
      console.error('❌ Error en creación de clínica:', err);
      setError(err instanceof Error ? err.message : 'Error desconocido');
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      clinic_id: '',
      name_clinic: '',
      suscriber: '',
      email: '',
      cell_phone: '',
      address: '',
      domain_name: '',
      subscription_plan: 'trial',
      password: '',
      status_clinic: 'active'
    });
    setError(null);
  };

  return (
    <Dialog open={open} onOpenChange={(newOpen) => {
      setOpen(newOpen);
      if (!newOpen) resetForm();
    }} modal={true}>
      <DialogTrigger asChild>
        <Button className="bg-medical-500 hover:bg-medical-600">
          <Building2 className="h-4 w-4 mr-2" />
          Nueva Clínica
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[600px] bg-slate-800 border-slate-700 text-slate-100 max-h-[90vh] overflow-y-auto z-50 fixed top-[50%] left-[50%] translate-x-[-50%] translate-y-[-50%] shadow-2xl">
        <DialogHeader>
          <DialogTitle className="text-white flex items-center gap-2">
            <Building2 className="h-5 w-5 text-medical-400" />
            Crear Nueva Clínica
          </DialogTitle>
          <DialogDescription className="text-slate-400">
            Registra una nueva clínica médica en el sistema con su configuración inicial.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <Alert variant="destructive" className="bg-red-900/30 border-red-800 text-red-200">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Información Básica */}
            <div className="space-y-2">
              <Label htmlFor="clinic_id" className="text-slate-200">ID de Clínica</Label>
              <Input
                id="clinic_id"
                value={formData.clinic_id}
                onChange={(e) => handleInputChange('clinic_id', e.target.value)}
                placeholder="clinica-demo-001"
                className="bg-slate-700 border-slate-600 text-slate-100 placeholder:text-slate-400"
                required
              />
              <p className="text-xs text-slate-500">Identificador único para la clínica</p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="name_clinic" className="text-slate-200">Nombre de la Clínica *</Label>
              <Input
                id="name_clinic"
                value={formData.name_clinic}
                onChange={(e) => handleInputChange('name_clinic', e.target.value)}
                placeholder="Clínica Médica Demo"
                className="bg-slate-700 border-slate-600 text-slate-100 placeholder:text-slate-400"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="suscriber" className="text-slate-200">Responsable/Suscriptor *</Label>
              <Input
                id="suscriber"
                value={formData.suscriber}
                onChange={(e) => handleInputChange('suscriber', e.target.value)}
                placeholder="Dr. Juan Pérez"
                className="bg-slate-700 border-slate-600 text-slate-100 placeholder:text-slate-400"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="email" className="text-slate-200">Email *</Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) => handleInputChange('email', e.target.value)}
                placeholder="demo@clinicamedica.com"
                className="bg-slate-700 border-slate-600 text-slate-100 placeholder:text-slate-400"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="cell_phone" className="text-slate-200">Teléfono *</Label>
              <Input
                id="cell_phone"
                value={formData.cell_phone}
                onChange={(e) => handleInputChange('cell_phone', e.target.value)}
                placeholder="+54911234567"
                className="bg-slate-700 border-slate-600 text-slate-100 placeholder:text-slate-400"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="domain_name" className="text-slate-200">Dominio</Label>
              <Input
                id="domain_name"
                value={formData.domain_name}
                onChange={(e) => handleInputChange('domain_name', e.target.value)}
                placeholder="clinicamedica"
                className="bg-slate-700 border-slate-600 text-slate-100 placeholder:text-slate-400"
                required
              />
              <p className="text-xs text-slate-500">Se genera automáticamente del nombre</p>
            </div>
          </div>

          {/* Dirección */}
          <div className="space-y-2">
            <Label htmlFor="address" className="text-slate-200">Dirección *</Label>
            <Textarea
              id="address"
              value={formData.address}
              onChange={(e) => handleInputChange('address', e.target.value)}
              placeholder="Av. Corrientes 1234, CABA"
              className="bg-slate-700 border-slate-600 text-slate-100 placeholder:text-slate-400"
              rows={2}
              required
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Plan de Suscripción - SELECT NATIVO */}
            <div className="space-y-2">
              <Label htmlFor="subscription_plan" className="text-slate-200">Plan de Suscripción</Label>
              <select
                id="subscription_plan"
                value={formData.subscription_plan}
                onChange={(e) => handleInputChange('subscription_plan', e.target.value)}
                className="flex h-10 w-full rounded-md border border-slate-600 bg-slate-700 px-3 py-2 text-sm text-slate-100 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-medical-500 focus:ring-offset-2 focus:ring-offset-slate-800 disabled:cursor-not-allowed disabled:opacity-50"
                required
              >
                <option value="trial" className="bg-slate-700 text-slate-100">Trial (Gratuito)</option>
                <option value="basic" className="bg-slate-700 text-slate-100">Básico ($29.99/mes)</option>
                <option value="premium" className="bg-slate-700 text-slate-100">Premium ($59.99/mes)</option>
                <option value="test-plan" className="bg-slate-700 text-slate-100">Plan de Prueba ($49.99/mes)</option>
                <option value="enterprise" className="bg-slate-700 text-slate-100">Empresarial ($99.99/mes)</option>
              </select>
            </div>

            {/* Estado - SELECT NATIVO */}
            <div className="space-y-2">
              <Label htmlFor="status_clinic" className="text-slate-200">Estado</Label>
              <select
                id="status_clinic"
                value={formData.status_clinic}
                onChange={(e) => handleInputChange('status_clinic', e.target.value)}
                className="flex h-10 w-full rounded-md border border-slate-600 bg-slate-700 px-3 py-2 text-sm text-slate-100 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-medical-500 focus:ring-offset-2 focus:ring-offset-slate-800 disabled:cursor-not-allowed disabled:opacity-50"
                required
              >
                <option value="active" className="bg-slate-700 text-slate-100">Activo</option>
                <option value="inactive" className="bg-slate-700 text-slate-100">Inactivo</option>
                <option value="suspended" className="bg-slate-700 text-slate-100">Suspendido</option>
              </select>
            </div>
          </div>

          {/* Contraseña */}
          <div className="space-y-2">
            <Label htmlFor="password" className="text-slate-200">Contraseña Inicial *</Label>
            <Input
              id="password"
              type="password"
              value={formData.password}
              onChange={(e) => handleInputChange('password', e.target.value)}
              placeholder="••••••••"
              className="bg-slate-700 border-slate-600 text-slate-100 placeholder:text-slate-400"
              required
              minLength={8}
            />
            <p className="text-xs text-slate-500">Mínimo 8 caracteres</p>
          </div>

          <DialogFooter className="flex gap-2 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
              className="border-slate-600 bg-slate-700 text-slate-200 hover:bg-slate-600"
              disabled={loading}
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              disabled={loading}
              className="bg-medical-500 hover:bg-medical-600"
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Creando...
                </>
              ) : (
                <>
                  <Building2 className="mr-2 h-4 w-4" />
                  Crear Clínica
                </>
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}