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
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Switch } from '@/components/ui/switch';
import { 
  CreditCard, 
  Loader2, 
  TrendingUp, 
  CheckCircle, 
  ArrowRight,
  DollarSign,
  Users,
  Building2,
  Calendar,
  Star,
  Clock,
  AlertCircle
} from 'lucide-react';
import { useAuthenticatedRequest } from '@/lib/persistentAuth';

interface Clinic {
  id: string;
  clinic_id: string;
  name_clinic: string;
  suscriber: string;
  email: string;
  subscription_plan: string;
  subscription_status: string;
  subscription_expires: string | null;
}

interface SubscriptionPlan {
  id: string;
  name: string;
  description: string;
  price: number;
  duration_days: number;
  features: any;
  max_professionals: number;
  max_patients: number;
}

interface UpgradePreview {
  current_plan: string;
  new_plan: string;
  price_difference: number;
  prorated_amount: number;
  days_remaining: number;
  immediate_upgrade: boolean;
  next_billing_date: string;
  savings_if_wait: number;
}

interface SubscriptionUpgradeModalProps {
  clinic: Clinic;
  currentPlan: SubscriptionPlan;
  availablePlans: Record<string, SubscriptionPlan>;
  open: boolean;
  onClose: () => void;
  onUpgradeCompleted: () => void;
}

export default function EnhancedSubscriptionUpgradeModal({ 
  clinic,
  currentPlan,
  availablePlans,
  open, 
  onClose, 
  onUpgradeCompleted 
}: SubscriptionUpgradeModalProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedPlan, setSelectedPlan] = useState<string | null>(null);
  const [upgradePreview, setUpgradePreview] = useState<UpgradePreview | null>(null);
  const [immediateUpgrade, setImmediateUpgrade] = useState(true);
  const [calculating, setCalculating] = useState(false);
  
  const authenticatedRequest = useAuthenticatedRequest();

  // Filtrar planes disponibles para cambio (upgrade o downgrade)
  const changeablePlans = Object.entries(availablePlans).filter(([planId, plan]) => 
    planId !== clinic.subscription_plan
  );

  // Calcular días restantes de suscripción
  const getDaysRemaining = () => {
    if (!clinic.subscription_expires) return 0;
    
    const expirationDate = new Date(clinic.subscription_expires);
    const today = new Date();
    const diffTime = expirationDate.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    return Math.max(0, diffDays);
  };

  const daysRemaining = getDaysRemaining();

  // Función para obtener el primer día del próximo mes
  const getFirstOfNextMonth = () => {
    const today = new Date();
    const firstOfNext = new Date(today.getFullYear(), today.getMonth() + 1, 1);
    return firstOfNext;
  };

  useEffect(() => {
    if (selectedPlan) {
      calculateUpgradePreview();
    } else {
      setUpgradePreview(null);
    }
  }, [selectedPlan, immediateUpgrade]);

  const calculateUpgradePreview = async () => {
    if (!selectedPlan) return;
    
    try {
      setCalculating(true);
      setError(null);
      
      const response = await authenticatedRequest(`/api/admin/clinics/${clinic.clinic_id}/subscription/upgrade-preview`, {
        method: 'POST',
        body: JSON.stringify({
          new_plan: selectedPlan,
          immediate_upgrade: immediateUpgrade
        })
      });

      if (response.ok) {
        const data = await response.json();
        setUpgradePreview(data);
        console.log('✅ Upgrade preview calculated:', data);
      } else {
        // Fallback con cálculo local para desarrollo
        const newPlan = availablePlans[selectedPlan];
        const priceDiff = newPlan.price - currentPlan.price;
        const isTrial = currentPlan.price === 0;
        
        // Para trials, siempre monto 0 independiente del timing
        // Para usuarios pagos, cálculo proporcional solo si es inmediato
        const prorated = isTrial ? 0 : (immediateUpgrade ? (priceDiff * daysRemaining) / 30 : 0);
        
        // Calcular próxima fecha de facturación - siempre principio de mes para no inmediatos
        const nextBillingDate = immediateUpgrade 
          ? new Date().toISOString() 
          : getFirstOfNextMonth().toISOString();

        setUpgradePreview({
          current_plan: currentPlan.name,
          new_plan: newPlan.name,
          price_difference: priceDiff,
          prorated_amount: prorated,
          days_remaining: daysRemaining,
          immediate_upgrade: immediateUpgrade,
          next_billing_date: nextBillingDate,
          savings_if_wait: immediateUpgrade ? 0 : (isTrial ? 0 : priceDiff)
        });
        
        console.log('⚠️ Using fallback calculation for upgrade preview');
      }
    } catch (err) {
      console.error('❌ Error calculating upgrade preview:', err);
      setError('Error calculando vista previa del upgrade');
    } finally {
      setCalculating(false);
    }
  };

  const handleUpgrade = async () => {
    if (!selectedPlan || !upgradePreview) return;
    
    try {
      setLoading(true);
      setError(null);
      
      // Para upgrades de trial gratuitos, registrar pago de $0
      const isTrial = upgradePreview.prorated_amount === 0 && currentPlan.price === 0;
      
      if (isTrial) {
        // Registrar pago de $0 para trial upgrade
        const paymentResponse = await authenticatedRequest(`/api/admin/clinics/${clinic.clinic_id}/payments`, {
          method: 'POST',
          body: JSON.stringify({
            amount: 0,
            payment_method: 'trial_upgrade',
            description: `Upgrade gratuito de plan trial a ${availablePlans[selectedPlan].name}`,
            reference_number: `TRIAL-${Date.now()}`,
            update_subscription: true,
            selected_plan: selectedPlan,
            extension_days: 30 // Siempre facturación mensual desde principio de mes
          })
        });
        
        if (!paymentResponse.ok) {
          console.warn('⚠️ Could not register trial payment, continuing with upgrade');
        } else {
          console.log('✅ Trial upgrade payment registered');
        }
      }
      
      const response = await authenticatedRequest(`/api/admin/clinics/${clinic.clinic_id}/subscription/upgrade`, {
        method: 'POST',
        body: JSON.stringify({
          new_plan: selectedPlan,
          immediate_upgrade: immediateUpgrade,
          prorated_amount: upgradePreview.prorated_amount,
          is_trial_upgrade: isTrial,
          billing_start_of_month: !immediateUpgrade // Siempre facturación desde principio de mes si no es inmediato
        })
      });

      if (response.ok) {
        const data = await response.json();
        console.log('✅ Subscription upgrade completed:', data);
        
        // Crear registro de carpeta N8N para la empresa
        await createN8NFolder();
        
        onUpgradeCompleted();
        onClose();
      } else {
        const errorData = await response.text();
        console.error('❌ Error upgrading subscription:', response.status, errorData);
        throw new Error(`Error ${response.status}: No se pudo completar el upgrade`);
      }
    } catch (err) {
      console.error('❌ Error in handleUpgrade:', err);
      setError(err instanceof Error ? err.message : 'Error desconocido al hacer upgrade');
    } finally {
      setLoading(false);
    }
  };

  // Crear carpeta N8N para la empresa
  const createN8NFolder = async () => {
    try {
      const folderName = `${clinic.suscriber || clinic.name_clinic} - Operativa`.replace(/[^a-zA-Z0-9\s-]/g, '');
      
      await authenticatedRequest('/api/admin/n8n/create-folder', {
        method: 'POST',
        body: JSON.stringify({
          clinic_id: clinic.clinic_id,
          folder_name: folderName,
          principal_file: 'principal' // Archivo a verificar dentro de la carpeta
        })
      });
      
      console.log('✅ N8N folder created for clinic:', folderName);
    } catch (err) {
      console.warn('⚠️ Could not create N8N folder:', err);
      // No bloquear el upgrade por esto
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto bg-slate-800 border-slate-700 text-slate-100">
        <DialogHeader>
          <DialogTitle className="text-white flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-medical-400" />
            Actualizar Suscripción - {clinic.name_clinic}
          </DialogTitle>
          <DialogDescription className="text-slate-400">
            Cambia tu plan de suscripción para ajustarlo a tus necesidades
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {error && (
            <Alert variant="destructive" className="bg-red-900/30 border-red-800 text-red-200">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {/* Plan Actual */}
          <Card className="bg-slate-700 border-slate-600">
            <CardHeader>
              <CardTitle className="text-slate-100 flex items-center justify-between">
                <span>Plan Actual</span>
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4 text-medical-400" />
                  <span className="text-sm text-slate-400">
                    {daysRemaining} días restantes
                  </span>
                </div>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-semibold text-lg text-slate-100">{currentPlan.name}</h3>
                  <p className="text-slate-400">{currentPlan.description}</p>
                  <div className="flex items-center gap-4 mt-2 text-sm text-slate-400">
                    <span className="flex items-center gap-1">
                      <Users className="h-4 w-4" />
                      {currentPlan.max_professionals} profesionales
                    </span>
                    <span className="flex items-center gap-1">
                      <Building2 className="h-4 w-4" />
                      {currentPlan.max_patients} pacientes
                    </span>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-2xl font-bold text-slate-100">${currentPlan.price}</div>
                  <div className="text-sm text-slate-400">/mes</div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Selección de Plan */}
          <div>
            <Label className="text-base font-semibold text-slate-200">Seleccionar Nuevo Plan</Label>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-3">
              {changeablePlans.map(([planId, plan]) => (
                <Card 
                  key={planId}
                  className={`cursor-pointer transition-all border-2 shadow-sm ${
                    selectedPlan === planId 
                      ? 'ring-2 ring-medical-400 border-medical-400 bg-slate-600 shadow-md' 
                      : 'bg-slate-700 border-slate-600 hover:border-slate-500 hover:shadow-md'
                  }`}
                  onClick={() => setSelectedPlan(planId)}
                >
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-lg text-slate-100">{plan.name}</CardTitle>
                      {selectedPlan === planId && (
                        <CheckCircle className="h-5 w-5 text-medical-400" />
                      )}
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <p className="text-sm text-slate-400">{plan.description}</p>
                    
                    <div className="flex items-center justify-between">
                      <div className="text-2xl font-bold text-medical-400">${plan.price}</div>
                      {plan.price > currentPlan.price ? (
                        <Badge variant="outline" className="bg-green-900/30 text-green-300 border-green-700">
                          +${plan.price - currentPlan.price}/mes
                        </Badge>
                      ) : plan.price < currentPlan.price ? (
                        <Badge variant="outline" className="bg-orange-900/30 text-orange-300 border-orange-700">
                          -${currentPlan.price - plan.price}/mes
                        </Badge>
                      ) : (
                        <Badge variant="outline" className="bg-blue-900/30 text-blue-300 border-blue-700">
                          Mismo precio
                        </Badge>
                      )}
                    </div>

                    <div className="flex items-center gap-4 text-sm text-slate-400">
                      <span className="flex items-center gap-1">
                        <Users className="h-4 w-4" />
                        {plan.max_professionals}
                      </span>
                      <span className="flex items-center gap-1">
                        <Building2 className="h-4 w-4" />
                        {plan.max_patients}
                      </span>
                    </div>

                    <div className="space-y-1">
                      <p className="text-xs font-medium text-slate-400">Características:</p>
                      <div className="space-y-1">
                        {Object.entries(plan.features).slice(0, 3).map(([feature, enabled]) => (
                          <div key={feature} className="flex items-center gap-2 text-xs">
                            {enabled ? (
                              <CheckCircle className="h-3 w-3 text-green-400" />
                            ) : (
                              <div className="h-3 w-3 rounded-full border border-slate-500" />
                            )}
                            <span className={enabled ? 'text-slate-300' : 'text-slate-500'}>
                              {feature.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>

          {/* Opciones de Upgrade */}
          {selectedPlan && (
            <Card className="bg-slate-700 border-slate-600">
              <CardHeader>
                <CardTitle className="text-slate-100 flex items-center gap-2">
                  <Calendar className="h-5 w-5 text-medical-400" />
                  Opciones de Implementación
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center space-x-2">
                  <Switch
                    id="immediate-upgrade"
                    checked={immediateUpgrade}
                    onCheckedChange={setImmediateUpgrade}
                  />
                  <Label htmlFor="immediate-upgrade" className="text-sm font-medium text-slate-200">
                    Implementar inmediatamente
                  </Label>
                </div>
                <p className="text-xs text-slate-400 mt-1">
                  {immediateUpgrade 
                    ? 'El upgrade se implementará ahora con cálculo proporcional'
                    : 'El upgrade se implementará en el próximo ciclo de facturación'
                  }
                </p>
              </CardContent>
            </Card>
          )}

          {/* Vista Previa del Upgrade */}
          {upgradePreview && (
            <Card className="bg-slate-700 border-slate-600">
              <CardHeader>
                <CardTitle className="text-slate-100 flex items-center gap-2">
                  <DollarSign className="h-5 w-5 text-medical-400" />
                  Vista Previa del Upgrade
                  {calculating && <Loader2 className="h-4 w-4 animate-spin text-slate-400" />}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-3 bg-slate-600 p-4 rounded-lg border border-slate-500">
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-medium text-slate-400">Plan actual:</span>
                      <span className="text-sm font-semibold text-slate-200">{upgradePreview.current_plan}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-medium text-slate-400">Nuevo plan:</span>
                      <span className="text-sm font-semibold text-medical-400">{upgradePreview.new_plan}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-medium text-slate-400">Diferencia mensual:</span>
                      <span className="text-sm font-semibold text-green-400">+${upgradePreview.price_difference}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-medium text-slate-400">Días restantes:</span>
                      <span className="text-sm font-semibold text-slate-200">{upgradePreview.days_remaining} días</span>
                    </div>
                  </div>

                  <div className="space-y-3 bg-slate-600 p-4 rounded-lg border border-slate-500">
                    {immediateUpgrade ? (
                      <>
                        <div className="flex justify-between items-center">
                          <span className="text-sm font-medium text-slate-400">Monto proporcional:</span>
                          <span className="text-sm font-bold text-medical-400">
                            ${upgradePreview.prorated_amount > 0 ? upgradePreview.prorated_amount.toFixed(2) : '0.00'}
                          </span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-sm font-medium text-slate-400">Implementación:</span>
                          <span className="text-sm font-semibold text-green-400">Inmediata</span>
                        </div>
                        {upgradePreview.prorated_amount === 0 && (
                          <div className="bg-blue-900/30 p-3 rounded-md border border-blue-700">
                            <p className="text-xs text-blue-300 font-medium">
                              🎁 Plan trial - Upgrade gratuito disponible
                            </p>
                          </div>
                        )}
                      </>
                    ) : (
                      <>
                        <div className="flex justify-between items-center">
                          <span className="text-sm font-medium text-slate-400">Próxima facturación:</span>
                          <span className="text-sm font-semibold text-slate-200">
                            {new Date(upgradePreview.next_billing_date).toLocaleDateString()}
                          </span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-sm font-medium text-slate-400">Ahorro esperando:</span>
                          <span className="text-sm font-semibold text-green-400">
                            ${upgradePreview.savings_if_wait.toFixed(2)}
                          </span>
                        </div>
                      </>
                    )}
                  </div>
                </div>

                <Separator />

                <div className="bg-medical-500/20 p-4 rounded-lg border border-medical-500/30">
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-slate-200">Total a pagar ahora:</span>
                    <span className="text-2xl font-bold text-medical-400">
                      ${immediateUpgrade ? (upgradePreview.prorated_amount > 0 ? upgradePreview.prorated_amount.toFixed(2) : '0.00') : '0.00'}
                    </span>
                  </div>
                  {!immediateUpgrade && (
                    <p className="text-xs text-slate-400 mt-2 font-medium">
                      💡 El cargo de ${upgradePreview.price_difference} se aplicará a principio del próximo mes
                    </p>
                  )}
                  {immediateUpgrade && upgradePreview.prorated_amount === 0 && (
                    <p className="text-xs text-blue-300 mt-2 font-medium">
                      🚀 Upgrade gratuito desde plan trial - Se requiere registro de pago
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        <DialogFooter className="gap-3">
          <Button 
            variant="outline" 
            onClick={onClose} 
            disabled={loading}
            className="border-slate-600 bg-slate-700 text-slate-200 hover:bg-slate-600"
          >
            Cancelar
          </Button>
          
          {/* Dos botones separados para trial users o usuarios con diferencias de costo */}
          {selectedPlan && upgradePreview && (
            <div className="flex gap-2">
              <Button 
                onClick={() => {
                  setImmediateUpgrade(true);
                  setTimeout(handleUpgrade, 100);
                }} 
                disabled={loading}
                variant="default"
                className="bg-medical-500 hover:bg-medical-600 text-white"
              >
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Procesando...
                  </>
                ) : (
                  <>
                    <CreditCard className="mr-2 h-4 w-4" />
                    Implementar Automáticamente
                  </>
                )}
              </Button>
              
              <Button 
                onClick={() => {
                  setImmediateUpgrade(false);
                  setTimeout(handleUpgrade, 100);
                }} 
                disabled={loading}
                variant="secondary"
                className="border-medical-500 text-medical-400 hover:bg-medical-500/20 bg-slate-700"
              >
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Procesando...
                  </>
                ) : (
                  <>
                    <Calendar className="mr-2 h-4 w-4" />
                    Aplicar a Principio de Mes
                  </>
                )}
              </Button>
            </div>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}