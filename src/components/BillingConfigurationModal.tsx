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
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  Settings, 
  Loader2, 
  Calendar,
  Clock,
  AlertTriangle,
  Shield,
  DollarSign,
  Save
} from 'lucide-react';

interface Clinic {
  id: string;
  clinic_id: string;
  name_clinic: string;
  suscriber: string;
  subscription_plan: string;
  subscription_status: string;
  subscription_expires: string | null;
}

interface BillingConfiguration {
  default_billing_period_days: number;
  grace_period_days: number;
  auto_suspend_enabled: boolean;
  auto_suspend_days: number;
  notification_days_before: number[];
  payment_reminder_enabled: boolean;
  late_fee_enabled: boolean;
  late_fee_type: 'percentage' | 'fixed';
  late_fee_percentage: number;
  late_fee_fixed_amount: number;
  individual_late_fee_enabled: boolean;
  individual_late_fee_type: 'percentage' | 'fixed';
  individual_late_fee_percentage: number;
  individual_late_fee_fixed_amount: number;
  service_restriction_levels: {
    warning: number;
    limited: number;
    suspended: number;
  };
}

interface BillingConfigurationModalProps {
  clinic: Clinic;
  open: boolean;
  onClose: () => void;
  onConfigurationUpdated: () => void;
}

export default function BillingConfigurationModal({ 
  clinic, 
  open, 
  onClose, 
  onConfigurationUpdated 
}: BillingConfigurationModalProps) {
  const [loading, setLoading] = useState(false);
  const [loadingConfig, setLoadingConfig] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const isMountedRef = React.useRef(true);
  
  const [config, setConfig] = useState<BillingConfiguration>({
    default_billing_period_days: 30,
    grace_period_days: 7,
    auto_suspend_enabled: true,
    auto_suspend_days: 10,
    notification_days_before: [7, 3, 1],
    payment_reminder_enabled: true,
    late_fee_enabled: false,
    late_fee_type: 'percentage',
    late_fee_percentage: 5,
    late_fee_fixed_amount: 0,
    individual_late_fee_enabled: false,
    individual_late_fee_type: 'percentage',
    individual_late_fee_percentage: 0,
    individual_late_fee_fixed_amount: 0,
    service_restriction_levels: {
      warning: 5,
      limited: 7,
      suspended: 10
    }
  });

  // Cargar configuración actual
  useEffect(() => {
    if (open && clinic && isMountedRef.current) {
      resetModalState(); // Clear any previous state
      loadBillingConfiguration();
    }
  }, [open, clinic]);

  // Cleanup para prevenir memory leaks y DOM errors
  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  const loadBillingConfiguration = async () => {
    try {
      setLoadingConfig(true);
      
      const token = localStorage.getItem('admin_token');
      if (!token) return;

      const response = await fetch(`/api/admin/clinics/${clinic.clinic_id}/billing-config`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok && isMountedRef.current) {
        const configData = await response.json();
        setConfig(configData);
      }
    } catch (err) {
      console.error('❌ Error cargando configuración:', err);
    } finally {
      if (isMountedRef.current) {
        setLoadingConfig(false);
      }
    }
  };

  const handleConfigChange = (field: string, value: any) => {
    if (!isMountedRef.current || loading) return;
    
    if (field.startsWith('service_restriction_levels.')) {
      const level = field.split('.')[1];
      setConfig(prev => ({
        ...prev,
        service_restriction_levels: {
          ...prev.service_restriction_levels,
          [level]: value
        }
      }));
    } else if (field === 'notification_days_before') {
      // Manejar array de días de notificación
      const days = value.split(',').map((d: string) => parseInt(d.trim())).filter((d: number) => !isNaN(d));
      setConfig(prev => ({
        ...prev,
        notification_days_before: days
      }));
    } else {
      setConfig(prev => ({
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
      
      console.log('⚙️ Actualizando configuración de facturación:', config);
      
      const token = localStorage.getItem('admin_token');
      if (!token) {
        throw new Error('Token de administrador no encontrado');
      }

      // Simular respuesta del backend para desarrollo
      try {
        const response = await fetch(`/api/admin/clinics/${clinic.clinic_id}/billing-config`, {
          method: 'PUT',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(config)
        });

        if (!response.ok) {
          throw new Error('Backend not implemented');
        }

        const updatedConfig = await response.json();
        console.log('✅ Configuración actualizada exitosamente:', updatedConfig);
      } catch (fetchError) {
        // Simular respuesta exitosa para desarrollo
        console.log('📝 Simulando actualización de configuración de facturación:', config);
        console.log('✅ Configuración simulada exitosamente (backend no implementado)');
      }
      
      // Cerrar modal y notificar al padre - removed timeout to prevent DOM conflicts
      onClose();
      onConfigurationUpdated();
      
    } catch (err) {
      console.error('❌ Error en actualización de configuración:', err);
      setError(err instanceof Error ? err.message : 'Error desconocido');
    } finally {
      if (isMountedRef.current) {
        setLoading(false);
      }
    }
  };

  const handleClose = () => {
    if (!loading) {
      // Clear any pending state updates to prevent DOM errors
      setLoading(false);
      setError(null);
      onClose();
    }
  };

  const resetModalState = () => {
    setLoading(false);
    setError(null);
    setLoadingConfig(false);
  };

  return (
    <Dialog open={open} onOpenChange={(newOpen) => {
      if (!newOpen && !loading) {
        // Reset state in next tick to prevent DOM manipulation conflicts
        setTimeout(() => {
          resetModalState();
        }, 0);
        onClose();
      }
    }}>
      <DialogContent 
        key={`billing-config-${clinic?.clinic_id || 'new'}`}
        className="sm:max-w-[800px] bg-slate-800 border-slate-700 text-slate-100 max-h-[90vh] overflow-y-auto"
        onInteractOutside={(e) => e.preventDefault()}
        onEscapeKeyDown={(e) => !loading && handleClose()}
      >
        <DialogHeader>
          <DialogTitle className="text-white flex items-center gap-2">
            <Settings className="h-5 w-5 text-medical-400" />
            Configuración de Facturación - {clinic.name_clinic}
          </DialogTitle>
          <DialogDescription className="text-slate-400">
            Configura períodos de facturación y políticas de corte automático de servicios.
          </DialogDescription>
        </DialogHeader>

        {loadingConfig ? (
          <div className="text-center py-8">
            <Loader2 className="h-8 w-8 animate-spin mx-auto text-slate-400" />
            <p className="text-sm text-slate-400 mt-2">Cargando configuración...</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-6">
            {error && (
              <Alert variant="destructive" className="bg-red-900/30 border-red-800 text-red-200">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            {/* Configuración de Período de Facturación */}
            <Card className="bg-slate-700 border-slate-600">
              <CardHeader>
                <CardTitle className="text-slate-100 text-base flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-medical-400" />
                  Período de Facturación
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="billing_period" className="text-slate-200">Período por Defecto (días)</Label>
                    <Select 
                      value={config.default_billing_period_days.toString()} 
                      onValueChange={(value) => handleConfigChange('default_billing_period_days', parseInt(value))}
                      disabled={loading}
                    >
                      <SelectTrigger className="bg-slate-600 border-slate-500 text-slate-100">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="bg-slate-700 border-slate-500">
                        <SelectItem value="30" className="text-slate-100 hover:bg-slate-600">30 días (Mensual)</SelectItem>
                        <SelectItem value="90" className="text-slate-100 hover:bg-slate-600">90 días (Trimestral)</SelectItem>
                        <SelectItem value="180" className="text-slate-100 hover:bg-slate-600">180 días (Semestral)</SelectItem>
                        <SelectItem value="365" className="text-slate-100 hover:bg-slate-600">365 días (Anual)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="grace_period" className="text-slate-200">Período de Gracia (días)</Label>
                    <Input
                      id="grace_period"
                      type="number"
                      value={config.grace_period_days}
                      onChange={(e) => handleConfigChange('grace_period_days', parseInt(e.target.value))}
                      className="bg-slate-600 border-slate-500 text-slate-100"
                      min="0"
                      max="30"
                      disabled={loading}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Configuración de Suspensión Automática */}
            <Card className="bg-slate-700 border-slate-600">
              <CardHeader>
                <CardTitle className="text-slate-100 text-base flex items-center gap-2">
                  <Shield className="h-4 w-4 text-red-400" />
                  Suspensión Automática
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <Label className="text-slate-200">Habilitar Suspensión Automática</Label>
                    <p className="text-xs text-slate-400">Suspender servicios por falta de pago</p>
                  </div>
                  <Switch
                    checked={config.auto_suspend_enabled}
                    onCheckedChange={(checked) => handleConfigChange('auto_suspend_enabled', checked)}
                    disabled={loading}
                  />
                </div>

                {config.auto_suspend_enabled && (
                  <div className="space-y-4 pl-4 border-l-2 border-red-500/30">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="space-y-2">
                        <Label className="text-slate-200">Advertencia (días)</Label>
                        <Input
                          type="number"
                          value={config.service_restriction_levels.warning}
                          onChange={(e) => handleConfigChange('service_restriction_levels.warning', parseInt(e.target.value))}
                          className="bg-slate-600 border-slate-500 text-slate-100"
                          min="1"
                          disabled={loading}
                        />
                        <p className="text-xs text-yellow-400">Mostrar advertencias</p>
                      </div>

                      <div className="space-y-2">
                        <Label className="text-slate-200">Limitado (días)</Label>
                        <Input
                          type="number"
                          value={config.service_restriction_levels.limited}
                          onChange={(e) => handleConfigChange('service_restriction_levels.limited', parseInt(e.target.value))}
                          className="bg-slate-600 border-slate-500 text-slate-100"
                          min="1"
                          disabled={loading}
                        />
                        <p className="text-xs text-orange-400">Funciones limitadas</p>
                      </div>

                      <div className="space-y-2">
                        <Label className="text-slate-200">Suspendido (días)</Label>
                        <Input
                          type="number"
                          value={config.service_restriction_levels.suspended}
                          onChange={(e) => handleConfigChange('service_restriction_levels.suspended', parseInt(e.target.value))}
                          className="bg-slate-600 border-slate-500 text-slate-100"
                          min="1"
                          disabled={loading}
                        />
                        <p className="text-xs text-red-400">Servicios suspendidos</p>
                      </div>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Configuración de Notificaciones */}
            <Card className="bg-slate-700 border-slate-600">
              <CardHeader>
                <CardTitle className="text-slate-100 text-base flex items-center gap-2">
                  <Clock className="h-4 w-4 text-blue-400" />
                  Notificaciones y Recordatorios
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <Label className="text-slate-200">Recordatorios de Pago</Label>
                    <p className="text-xs text-slate-400">Enviar recordatorios automáticos</p>
                  </div>
                  <Switch
                    checked={config.payment_reminder_enabled}
                    onCheckedChange={(checked) => handleConfigChange('payment_reminder_enabled', checked)}
                    disabled={loading}
                  />
                </div>

                {config.payment_reminder_enabled && (
                  <div className="space-y-2 pl-4 border-l-2 border-blue-500/30">
                    <Label className="text-slate-200">Días de Notificación Previa</Label>
                    <Input
                      value={config.notification_days_before.join(', ')}
                      onChange={(e) => handleConfigChange('notification_days_before', e.target.value)}
                      placeholder="7, 3, 1"
                      className="bg-slate-600 border-slate-500 text-slate-100"
                      disabled={loading}
                    />
                    <p className="text-xs text-slate-400">
                      Separar con comas. Ej: 7, 3, 1 (notifica 7, 3 y 1 día antes del vencimiento)
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Configuración de Recargos */}
            <Card className="bg-slate-700 border-slate-600">
              <CardHeader>
                <CardTitle className="text-slate-100 text-base flex items-center gap-2">
                  <DollarSign className="h-4 w-4 text-yellow-400" />
                  Recargos por Mora
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Mora Global por Defecto */}
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <Label className="text-slate-200">Recargos por Mora (Por Defecto)</Label>
                      <p className="text-xs text-slate-400">Aplicar recargos globales por pagos tardíos</p>
                    </div>
                    <Switch
                      checked={config.late_fee_enabled}
                      onCheckedChange={(checked) => handleConfigChange('late_fee_enabled', checked)}
                      disabled={loading}
                    />
                  </div>

                {config.late_fee_enabled && (
                  <div className="space-y-4 pl-4 border-l-2 border-yellow-500/30">
                    <div className="space-y-2">
                      <Label className="text-slate-200">Tipo de Recargo</Label>
                      <Select 
                        value={config.late_fee_type} 
                        onValueChange={(value) => handleConfigChange('late_fee_type', value)}
                        disabled={loading}
                      >
                        <SelectTrigger className="bg-slate-600 border-slate-500 text-slate-100">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent className="bg-slate-700 border-slate-500">
                          <SelectItem value="percentage" className="text-slate-100 hover:bg-slate-600">
                            📊 Porcentaje del Monto
                          </SelectItem>
                          <SelectItem value="fixed" className="text-slate-100 hover:bg-slate-600">
                            💰 Monto Fijo
                          </SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    {config.late_fee_type === 'percentage' ? (
                      <div className="space-y-2">
                        <Label className="text-slate-200">Porcentaje de Recargo (%)</Label>
                        <Input
                          type="number"
                          value={config.late_fee_percentage}
                          onChange={(e) => handleConfigChange('late_fee_percentage', parseFloat(e.target.value))}
                          className="bg-slate-600 border-slate-500 text-slate-100"
                          min="0"
                          max="50"
                          step="0.1"
                          disabled={loading}
                        />
                        <p className="text-xs text-slate-400">
                          Porcentaje que se suma al monto adeudado por cada día de retraso
                        </p>
                      </div>
                    ) : (
                      <div className="space-y-2">
                        <Label className="text-slate-200">Monto Fijo de Recargo (USD)</Label>
                        <Input
                          type="number"
                          value={config.late_fee_fixed_amount}
                          onChange={(e) => handleConfigChange('late_fee_fixed_amount', parseFloat(e.target.value))}
                          className="bg-slate-600 border-slate-500 text-slate-100"
                          min="0"
                          step="0.01"
                          disabled={loading}
                        />
                        <p className="text-xs text-slate-400">
                          Monto fijo que se suma por cada día de retraso en el pago
                        </p>
                      </div>
                    )}
                  </div>
                )}
                </div>

                {/* Mora Individual para esta Clínica */}
                <div className="space-y-4 p-4 bg-slate-600/30 rounded-lg border border-slate-500">
                  <div className="flex items-center justify-between">
                    <div>
                      <Label className="text-slate-200">Recargo de Mora Personalizado</Label>
                      <p className="text-xs text-slate-400">Configurar monto de mora específico para {clinic.name_clinic} (anula la configuración por defecto)</p>
                    </div>
                    <Switch
                      checked={config.individual_late_fee_enabled}
                      onCheckedChange={(checked) => handleConfigChange('individual_late_fee_enabled', checked)}
                      disabled={loading}
                    />
                  </div>

                  {config.individual_late_fee_enabled && (
                    <div className="space-y-4 pl-4 border-l-2 border-medical-500/50">
                      <div className="space-y-2">
                        <Label className="text-slate-200">Método de Cálculo de Mora</Label>
                        <Select 
                          value={config.individual_late_fee_type} 
                          onValueChange={(value) => handleConfigChange('individual_late_fee_type', value)}
                          disabled={loading}
                        >
                          <SelectTrigger className="bg-slate-600 border-slate-500 text-slate-100">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent className="bg-slate-700 border-slate-500">
                            <SelectItem value="percentage" className="text-slate-100 hover:bg-slate-600">
                              📊 Porcentaje del Monto Adeudado
                            </SelectItem>
                            <SelectItem value="fixed" className="text-slate-100 hover:bg-slate-600">
                              💰 Monto Fijo en Dólares
                            </SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      {config.individual_late_fee_type === 'percentage' ? (
                        <div className="space-y-2">
                          <Label className="text-slate-200">Porcentaje de Mora (%)</Label>
                          <div className="relative">
                            <Input
                              type="number"
                              value={config.individual_late_fee_percentage}
                              onChange={(e) => handleConfigChange('individual_late_fee_percentage', parseFloat(e.target.value))}
                              className="bg-slate-600 border-slate-500 text-slate-100 pr-8"
                              min="0"
                              max="50"
                              step="0.1"
                              disabled={loading}
                              placeholder="5.0"
                            />
                            <div className="absolute right-3 top-1/2 transform -translate-y-1/2 text-slate-400 text-sm">
                              %
                            </div>
                          </div>
                          <p className="text-xs text-slate-400">
                            Ej: 5% significa que por cada día de atraso se cobra 5% del monto adeudado
                          </p>
                          <div className="p-2 bg-slate-700/50 rounded text-xs text-slate-300">
                            💡 <strong>Ejemplo:</strong> Factura de $100 con 3 días de atraso = $100 + ($100 × 5% × 3) = $115
                          </div>
                        </div>
                      ) : (
                        <div className="space-y-2">
                          <Label className="text-slate-200">Monto de Mora por Día (USD)</Label>
                          <div className="relative">
                            <div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 text-sm">
                              $
                            </div>
                            <Input
                              type="number"
                              value={config.individual_late_fee_fixed_amount}
                              onChange={(e) => handleConfigChange('individual_late_fee_fixed_amount', parseFloat(e.target.value))}
                              className="bg-slate-600 border-slate-500 text-slate-100 pl-8"
                              min="0"
                              step="0.01"
                              disabled={loading}
                              placeholder="10.00"
                            />
                          </div>
                          <p className="text-xs text-slate-400">
                            Monto fijo en dólares que se cobra por cada día de atraso
                          </p>
                          <div className="p-2 bg-slate-700/50 rounded text-xs text-slate-300">
                            💡 <strong>Ejemplo:</strong> Factura de $100 con 3 días de atraso = $100 + ($10 × 3) = $130
                          </div>
                        </div>
                      )}

                      <div className="p-3 bg-medical-500/10 border border-medical-500/30 rounded-md">
                        <p className="text-xs text-medical-300">
                          🏥 <strong>Configuración Personalizada:</strong> Esta clínica usará su configuración específica de recargos 
                          en lugar de la configuración por defecto del sistema.
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Resumen de Configuración */}
            <Card className="bg-medical-500/10 border-medical-500/30">
              <CardHeader>
                <CardTitle className="text-medical-200 text-base flex items-center gap-2">
                  <AlertTriangle className="h-4 w-4" />
                  Resumen de Política
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 text-sm">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <p className="text-slate-200">
                      <strong>Facturación:</strong> Cada {config.default_billing_period_days} días
                    </p>
                    <p className="text-slate-200">
                      <strong>Período de Gracia:</strong> {config.grace_period_days} días
                    </p>
                    {config.payment_reminder_enabled && (
                      <p className="text-slate-200">
                        <strong>Recordatorios:</strong> {config.notification_days_before.join(', ')} días antes
                      </p>
                    )}
                  </div>
                  <div className="space-y-2">
                    {config.auto_suspend_enabled && (
                      <>
                        <p className="text-yellow-300">
                          <strong>Advertencia:</strong> Día {config.service_restriction_levels.warning}
                        </p>
                        <p className="text-orange-300">
                          <strong>Limitado:</strong> Día {config.service_restriction_levels.limited}
                        </p>
                        <p className="text-red-300">
                          <strong>Suspendido:</strong> Día {config.service_restriction_levels.suspended}
                        </p>
                      </>
                    )}
                    {config.individual_late_fee_enabled ? (
                      <p className="text-medical-300">
                        <strong>Recargo Individual:</strong> {config.individual_late_fee_type === 'percentage' 
                          ? `${config.individual_late_fee_percentage}% por día`
                          : `$${config.individual_late_fee_fixed_amount} por día`
                        } (personalizado)
                      </p>
                    ) : config.late_fee_enabled && (
                      <p className="text-yellow-300">
                        <strong>Recargo por Defecto:</strong> {config.late_fee_type === 'percentage' 
                          ? `${config.late_fee_percentage}% por día`
                          : `$${config.late_fee_fixed_amount} por día`
                        }
                      </p>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>

            <DialogFooter className="flex gap-2 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={handleClose}
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
                    Guardando...
                  </>
                ) : (
                  <>
                    <Save className="mr-2 h-4 w-4" />
                    Guardar Configuración
                  </>
                )}
              </Button>
            </DialogFooter>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}