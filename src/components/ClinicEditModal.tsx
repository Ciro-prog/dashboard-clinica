import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Building2, Loader2, Edit, Eye, EyeOff } from 'lucide-react';

interface Clinic {
  id: string;
  clinic_id: string;
  name_clinic: string;
  suscriber: string;
  email: string;
  cell_phone: string;
  address: string;
  status_clinic: string;
  subscription_status: string;
  subscription_plan: string;
  subscription_expires: string | null;
  created_at: string;
  updated_at: string;
}

interface ClinicEditModalProps {
  clinic: Clinic;
  open: boolean;
  onClose: () => void;
  onClinicUpdated: () => void;
}

export default function ClinicEditModal({ clinic, open, onClose, onClinicUpdated }: ClinicEditModalProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [changePassword, setChangePassword] = useState(false);
  
  const [formData, setFormData] = useState({
    name_clinic: '',
    suscriber: '',
    email: '',
    cell_phone: '',
    address: '',
    subscription_plan: '',
    status_clinic: '',
    password: ''
  });

  useEffect(() => {
    if (clinic) {
      setFormData({
        name_clinic: clinic.name_clinic,
        suscriber: clinic.suscriber,
        email: clinic.email,
        cell_phone: clinic.cell_phone,
        address: clinic.address,
        subscription_plan: clinic.subscription_plan,
        status_clinic: clinic.status_clinic,
        password: ''
      });
      setChangePassword(false);
      setShowPassword(false);
    }
  }, [clinic]);

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      setLoading(true);
      setError(null);
      
      console.log('✏️ Actualizando clínica:', formData);
      
      const token = localStorage.getItem('admin_token');
      if (!token) {
        throw new Error('Token de administrador no encontrado');
      }

      // Preparar datos para envío
      const updateData = {
        name_clinic: formData.name_clinic,
        suscriber: formData.suscriber,
        email: formData.email,
        cell_phone: formData.cell_phone,
        address: formData.address,
        subscription_plan: formData.subscription_plan,
        status_clinic: formData.status_clinic,
        ...(changePassword && formData.password && { password: formData.password })
      };

      const response = await fetch(`/api/admin/clinics/${clinic.clinic_id}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(updateData)
      });

      if (!response.ok) {
        const errorData = await response.text();
        console.error('❌ Error actualizando clínica:', response.status, errorData);
        
        if (response.status === 400) {
          throw new Error('Datos inválidos');
        } else if (response.status === 401) {
          throw new Error('Sesión expirada. Por favor, inicia sesión nuevamente');
        } else if (response.status === 404) {
          throw new Error('Clínica no encontrada');
        } else {
          throw new Error(`Error del servidor: ${response.status}`);
        }
      }

      const updatedClinic = await response.json();
      console.log('✅ Clínica actualizada exitosamente:', updatedClinic);
      
      // Cerrar modal y notificar al padre
      onClose();
      onClinicUpdated();
      
    } catch (err) {
      console.error('❌ Error en actualización de clínica:', err);
      setError(err instanceof Error ? err.message : 'Error desconocido');
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    if (clinic) {
      setFormData({
        name_clinic: clinic.name_clinic,
        suscriber: clinic.suscriber,
        email: clinic.email,
        cell_phone: clinic.cell_phone,
        address: clinic.address,
        subscription_plan: clinic.subscription_plan,
        status_clinic: clinic.status_clinic
      });
    }
    setError(null);
  };

  return (
    <Dialog open={open} onOpenChange={(newOpen) => {
      if (!newOpen) {
        onClose();
        resetForm();
      }
    }}>
      <DialogContent 
        className="sm:max-w-[600px] bg-slate-800 border-slate-700 text-slate-100 max-h-[90vh] overflow-y-auto"
        onInteractOutside={(e) => e.preventDefault()}
        onEscapeKeyDown={(e) => !loading && onClose()}
      >
        <DialogHeader>
          <DialogTitle className="text-white flex items-center gap-2">
            <Edit className="h-5 w-5 text-medical-400" />
            Editar Clínica - {clinic.name_clinic}
          </DialogTitle>
          <DialogDescription className="text-slate-400">
            Modifica la información de la clínica médica.
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
              <Label htmlFor="name_clinic" className="text-slate-200">Nombre de la Clínica *</Label>
              <Input
                id="name_clinic"
                value={formData.name_clinic}
                onChange={(e) => handleInputChange('name_clinic', e.target.value)}
                placeholder="Clínica Médica Demo"
                className="bg-slate-700 border-slate-600 text-slate-100 placeholder:text-slate-400"
                required
                disabled={loading}
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
                disabled={loading}
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
                disabled={loading}
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
                disabled={loading}
              />
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
              disabled={loading}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Plan de Suscripción */}
            <div className="space-y-2">
              <Label htmlFor="subscription_plan" className="text-slate-200">Plan de Suscripción</Label>
              <Select 
                value={formData.subscription_plan} 
                onValueChange={(value) => handleInputChange('subscription_plan', value)}
                disabled={loading}
              >
                <SelectTrigger className="bg-slate-700 border-slate-600 text-slate-100">
                  <SelectValue placeholder="Seleccionar plan" />
                </SelectTrigger>
                <SelectContent 
                  className="bg-slate-700 border-slate-600"
                  position="popper"
                  sideOffset={4}
                >
                  <SelectItem value="trial" className="text-slate-100 hover:bg-slate-600 focus:bg-slate-600">
                    Trial (Gratuito)
                  </SelectItem>
                  <SelectItem value="basic" className="text-slate-100 hover:bg-slate-600 focus:bg-slate-600">
                    Básico ($29.99/mes)
                  </SelectItem>
                  <SelectItem value="premium" className="text-slate-100 hover:bg-slate-600 focus:bg-slate-600">
                    Premium ($59.99/mes)
                  </SelectItem>
                  <SelectItem value="test-plan" className="text-slate-100 hover:bg-slate-600 focus:bg-slate-600">
                    Plan de Prueba ($49.99/mes)
                  </SelectItem>
                  <SelectItem value="enterprise" className="text-slate-100 hover:bg-slate-600 focus:bg-slate-600">
                    Empresarial ($99.99/mes)
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Estado */}
            <div className="space-y-2">
              <Label htmlFor="status_clinic" className="text-slate-200">Estado</Label>
              <Select 
                value={formData.status_clinic} 
                onValueChange={(value) => handleInputChange('status_clinic', value)}
                disabled={loading}
              >
                <SelectTrigger className="bg-slate-700 border-slate-600 text-slate-100">
                  <SelectValue placeholder="Seleccionar estado" />
                </SelectTrigger>
                <SelectContent 
                  className="bg-slate-700 border-slate-600"
                  position="popper"
                  sideOffset={4}
                >
                  <SelectItem value="active" className="text-slate-100 hover:bg-slate-600 focus:bg-slate-600">
                    Activo
                  </SelectItem>
                  <SelectItem value="inactive" className="text-slate-100 hover:bg-slate-600 focus:bg-slate-600">
                    Inactivo
                  </SelectItem>
                  <SelectItem value="suspended" className="text-slate-100 hover:bg-slate-600 focus:bg-slate-600">
                    Suspendido
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Información de solo lectura */}
          <div className="space-y-2">
            <Label className="text-slate-200">Información del Sistema</Label>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-3 bg-slate-700/50 rounded-md">
              <div>
                <span className="text-xs text-slate-400">ID de Clínica:</span>
                <div className="font-mono text-sm text-slate-200">{clinic.clinic_id}</div>
              </div>
              <div>
                <span className="text-xs text-slate-400">Fecha de Creación:</span>
                <div className="text-sm text-slate-200">{new Date(clinic.created_at).toLocaleDateString()}</div>
              </div>
            </div>
          </div>

          {/* Gestión de Contraseña */}
          <div className="space-y-3 p-4 bg-slate-700/30 rounded-lg border border-slate-600">
            <div className="flex items-center justify-between">
              <Label className="text-slate-200">Contraseña de Acceso</Label>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setChangePassword(!changePassword)}
                className="border-slate-500 bg-slate-600 text-slate-200 hover:bg-slate-500"
              >
                {changePassword ? 'Cancelar Cambio' : 'Cambiar Contraseña'}
              </Button>
            </div>
            
            {changePassword ? (
              <div className="space-y-2">
                <Label htmlFor="password" className="text-slate-200">Nueva Contraseña *</Label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    value={formData.password}
                    onChange={(e) => handleInputChange('password', e.target.value)}
                    placeholder="••••••••"
                    className="bg-slate-700 border-slate-600 text-slate-100 placeholder:text-slate-400 pr-10"
                    required={changePassword}
                    minLength={8}
                    disabled={loading}
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-0 top-0 h-full px-3 text-slate-400 hover:text-slate-200"
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </Button>
                </div>
                <p className="text-xs text-slate-500">Mínimo 8 caracteres - Dejar vacío para mantener actual</p>
              </div>
            ) : (
              <div className="text-sm text-slate-400">
                <p>• Contraseña actual se mantiene sin cambios</p>
                <p>• Haz clic en "Cambiar Contraseña" para establecer una nueva</p>
              </div>
            )}
          </div>

          <DialogFooter className="flex gap-2 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
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
                  Actualizando...
                </>
              ) : (
                <>
                  <Edit className="mr-2 h-4 w-4" />
                  Actualizar Clínica
                </>
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}