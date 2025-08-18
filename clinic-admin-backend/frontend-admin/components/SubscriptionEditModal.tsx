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
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { CreditCard, Loader2, Edit, TrendingUp, Users, Building2 } from 'lucide-react';

interface SubscriptionPlan {
  id: string;
  name: string;
  description: string;
  price: number;
  duration_days: number;
  features: any;
  max_professionals: number;
  max_patients: number;
  created_at: string;
  updated_at: string;
}

interface SubscriptionEditModalProps {
  subscription: SubscriptionPlan;
  open: boolean;
  onClose: () => void;
  onSubscriptionUpdated: () => void;
}

export default function SubscriptionEditModal({ 
  subscription, 
  open, 
  onClose, 
  onSubscriptionUpdated 
}: SubscriptionEditModalProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    price: '',
    duration_days: '',
    max_professionals: '',
    max_patients: '',
    features: {
      whatsapp_integration: false,
      n8n_automation: false,
      advanced_reports: false,
      priority_support: false,
      custom_branding: false,
      api_access: false,
      backup_service: false,
      multi_location: false
    }
  });

  useEffect(() => {
    if (subscription) {
      setFormData({
        name: subscription.name,
        description: subscription.description || '',
        price: subscription.price.toString(),
        duration_days: subscription.duration_days.toString(),
        max_professionals: subscription.max_professionals.toString(),
        max_patients: subscription.max_patients.toString(),
        features: {
          whatsapp_integration: subscription.features?.whatsapp_integration || false,
          n8n_automation: subscription.features?.n8n_automation || false,
          advanced_reports: subscription.features?.advanced_reports || false,
          priority_support: subscription.features?.priority_support || false,
          custom_branding: subscription.features?.custom_branding || false,
          api_access: subscription.features?.api_access || false,
          backup_service: subscription.features?.backup_service || false,
          multi_location: subscription.features?.multi_location || false
        }
      });
    }
  }, [subscription]);

  const handleInputChange = (field: string, value: string | boolean) => {
    if (field.startsWith('features.')) {
      const featureKey = field.split('.')[1];
      setFormData(prev => ({
        ...prev,
        features: {
          ...prev.features,
          [featureKey]: value
        }
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [field]: value
      }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      setLoading(true);
      setError(null);
      
      console.log('✏️ Actualizando suscripción:', formData);
      
      const token = localStorage.getItem('admin_token');
      if (!token) {
        throw new Error('Token de administrador no encontrado');
      }

      const updateData = {
        name: formData.name,
        description: formData.description,
        price: parseFloat(formData.price),
        duration_days: parseInt(formData.duration_days),
        max_professionals: parseInt(formData.max_professionals),
        max_patients: parseInt(formData.max_patients),
        features: formData.features
      };

      const response = await fetch(`/api/admin/subscription-plans/${subscription.id}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(updateData)
      });

      if (!response.ok) {
        const errorData = await response.text();
        console.error('❌ Error actualizando suscripción:', response.status, errorData);
        
        if (response.status === 400) {
          throw new Error('Datos inválidos');
        } else if (response.status === 401) {
          throw new Error('Sesión expirada. Por favor, inicia sesión nuevamente');
        } else if (response.status === 404) {
          throw new Error('Suscripción no encontrada');
        } else {
          throw new Error(`Error del servidor: ${response.status}`);
        }
      }

      const updatedSubscription = await response.json();
      console.log('✅ Suscripción actualizada exitosamente:', updatedSubscription);
      
      // Cerrar modal y notificar al padre
      onClose();
      onSubscriptionUpdated();
      
    } catch (err) {
      console.error('❌ Error en actualización de suscripción:', err);
      setError(err instanceof Error ? err.message : 'Error desconocido');
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    if (subscription) {
      setFormData({
        name: subscription.name,
        description: subscription.description || '',
        price: subscription.price.toString(),
        duration_days: subscription.duration_days.toString(),
        max_professionals: subscription.max_professionals.toString(),
        max_patients: subscription.max_patients.toString(),
        features: {
          whatsapp_integration: subscription.features?.whatsapp_integration || false,
          n8n_automation: subscription.features?.n8n_automation || false,
          advanced_reports: subscription.features?.advanced_reports || false,
          priority_support: subscription.features?.priority_support || false,
          custom_branding: subscription.features?.custom_branding || false,
          api_access: subscription.features?.api_access || false,
          backup_service: subscription.features?.backup_service || false,
          multi_location: subscription.features?.multi_location || false
        }
      });
    }
    setError(null);
  };

  const handleClose = () => {
    onClose();
    resetForm();
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent 
        className="sm:max-w-[700px] bg-slate-800 border-slate-700 text-slate-100 max-h-[90vh] overflow-y-auto"
      >
        <DialogHeader>
          <DialogTitle className="text-white flex items-center gap-2">
            <Edit className="h-5 w-5 text-medical-400" />
            Editar Suscripción - {subscription.name}
          </DialogTitle>
          <DialogDescription className="text-slate-400">
            Modifica la configuración del plan de suscripción.
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
              <Label htmlFor="name" className="text-slate-200">Nombre del Plan *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => handleInputChange('name', e.target.value)}
                placeholder="Ej: Plan Profesional"
                className="bg-slate-700 border-slate-600 text-slate-100 placeholder:text-slate-400"
                required
                disabled={loading}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="price" className="text-slate-200">Precio Mensual (ARS) *</Label>
              <Input
                id="price"
                type="number"
                value={formData.price}
                onChange={(e) => handleInputChange('price', e.target.value)}
                placeholder="99.99"
                className="bg-slate-700 border-slate-600 text-slate-100 placeholder:text-slate-400"
                required
                min="0"
                step="0.01"
                disabled={loading}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="duration_days" className="text-slate-200">Duración (días) *</Label>
              <Input
                id="duration_days"
                type="number"
                value={formData.duration_days}
                onChange={(e) => handleInputChange('duration_days', e.target.value)}
                placeholder="30"
                className="bg-slate-700 border-slate-600 text-slate-100 placeholder:text-slate-400"
                required
                min="1"
                disabled={loading}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="max_professionals" className="text-slate-200">Máximo Profesionales *</Label>
              <Input
                id="max_professionals"
                type="number"
                value={formData.max_professionals}
                onChange={(e) => handleInputChange('max_professionals', e.target.value)}
                placeholder="10"
                className="bg-slate-700 border-slate-600 text-slate-100 placeholder:text-slate-400"
                required
                min="1"
                disabled={loading}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="max_patients" className="text-slate-200">Máximo Pacientes *</Label>
              <Input
                id="max_patients"
                type="number"
                value={formData.max_patients}
                onChange={(e) => handleInputChange('max_patients', e.target.value)}
                placeholder="1000"
                className="bg-slate-700 border-slate-600 text-slate-100 placeholder:text-slate-400"
                required
                min="1"
                disabled={loading}
              />
            </div>
          </div>

          {/* Descripción */}
          <div className="space-y-2">
            <Label htmlFor="description" className="text-slate-200">Descripción</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => handleInputChange('description', e.target.value)}
              placeholder="Descripción detallada del plan de suscripción..."
              className="bg-slate-700 border-slate-600 text-slate-100 placeholder:text-slate-400"
              rows={3}
              disabled={loading}
            />
          </div>

          {/* Información del Sistema */}
          <div className="space-y-2">
            <Label className="text-slate-200">Información del Sistema</Label>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-3 bg-slate-700/50 rounded-md">
              <div>
                <span className="text-xs text-slate-400">ID de Suscripción:</span>
                <div className="font-mono text-sm text-slate-200">{subscription.id}</div>
              </div>
              <div>
                <span className="text-xs text-slate-400">Fecha de Creación:</span>
                <div className="text-sm text-slate-200">{new Date(subscription.created_at).toLocaleDateString()}</div>
              </div>
            </div>
          </div>

          {/* Características */}
          <div className="space-y-3">
            <Label className="text-slate-200">Características Incluidas</Label>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 p-4 bg-slate-700/30 rounded-lg border border-slate-600 shadow-[0_0_0_1px_rgba(255,255,255,0.1)]">
              {Object.entries(formData.features).map(([feature, enabled]) => (
                <div key={feature} className="flex items-center justify-between">
                  <Label 
                    htmlFor={feature} 
                    className="text-sm text-slate-200 flex items-center gap-2 cursor-pointer"
                  >
                    {feature === 'whatsapp_integration' && <span>📱 Integración WhatsApp</span>}
                    {feature === 'n8n_automation' && <span>🔄 Automatización N8N</span>}
                    {feature === 'advanced_reports' && <span>📊 Reportes Avanzados</span>}
                    {feature === 'priority_support' && <span>🆘 Soporte Prioritario</span>}
                    {feature === 'custom_branding' && <span>🎨 Marca Personalizada</span>}
                    {feature === 'api_access' && <span>🔗 Acceso API</span>}
                    {feature === 'backup_service' && <span>💾 Servicio de Backup</span>}
                    {feature === 'multi_location' && <span>🏢 Multi-Ubicación</span>}
                  </Label>
                  <Switch
                    id={feature}
                    checked={enabled}
                    onCheckedChange={(checked) => handleInputChange(`features.${feature}`, checked)}
                    disabled={loading}
                  />
                </div>
              ))}
            </div>
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
                  Actualizar Suscripción
                </>
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}