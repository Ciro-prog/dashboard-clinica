import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Switch } from '@/components/ui/switch';
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { 
  DollarSign, 
  Loader2, 
  CheckCircle, 
  CreditCard,
  Receipt,
  Calendar,
  Clock,
  AlertCircle,
  TrendingUp,
  Building2
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

interface PaymentRecord {
  id: string;
  clinic_id: string;
  amount: number;
  payment_method: string;
  payment_date: string;
  description: string;
  reference_number?: string;
  status: 'pending' | 'completed' | 'failed';
  subscription_updated?: boolean;
  subscription_extended_days?: number;
  created_at: string;
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

interface EnhancedPaymentManagementModalProps {
  clinic: Clinic;
  availablePlans: Record<string, SubscriptionPlan>;
  open: boolean;
  onClose: () => void;
  onPaymentProcessed: () => void;
}

export default function EnhancedPaymentManagementModal({ 
  clinic,
  availablePlans,
  open, 
  onClose, 
  onPaymentProcessed 
}: EnhancedPaymentManagementModalProps) {
  const [loading, setLoading] = useState(false);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [paymentHistory, setPaymentHistory] = useState<PaymentRecord[]>([]);
  const [activeTab, setActiveTab] = useState<'new' | 'history'>('new');

  // Estados para nuevo pago
  const [amount, setAmount] = useState<string>('');
  const [paymentMethod, setPaymentMethod] = useState<string>('');
  const [description, setDescription] = useState<string>('');
  const [referenceNumber, setReferenceNumber] = useState<string>('');
  const [updateSubscription, setUpdateSubscription] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<string>(clinic.subscription_plan);
  const [extensionDays, setExtensionDays] = useState<string>('30');

  const authenticatedRequest = useAuthenticatedRequest();

  // Obtener días restantes de suscripción
  const getDaysRemaining = () => {
    if (!clinic.subscription_expires) return 0;
    
    const expirationDate = new Date(clinic.subscription_expires);
    const today = new Date();
    const diffTime = expirationDate.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    return Math.max(0, diffDays);
  };

  const daysRemaining = getDaysRemaining();

  // Cargar historial de pagos
  useEffect(() => {
    if (open) {
      loadPaymentHistory();
    }
  }, [open]);

  const loadPaymentHistory = async () => {
    try {
      setLoadingHistory(true);
      
      const response = await authenticatedRequest(`/api/admin/clinics/${clinic.clinic_id}/payments`);
      
      if (response.ok) {
        const data = await response.json();
        setPaymentHistory(Array.isArray(data) ? data : []);
        console.log('✅ Payment history loaded:', data.length);
      } else {
        console.warn('⚠️ Could not load payment history:', response.status);
        setPaymentHistory([]);
      }
    } catch (err) {
      console.error('❌ Error loading payment history:', err);
      setPaymentHistory([]);
    } finally {
      setLoadingHistory(false);
    }
  };

  const handleSubmitPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!amount || !paymentMethod) {
      setError('Por favor completa todos los campos requeridos');
      return;
    }

    const amountNum = parseFloat(amount);
    if (isNaN(amountNum) || amountNum <= 0) {
      setError('El monto debe ser un número válido mayor a 0');
      return;
    }

    try {
      setLoading(true);
      setError(null);
      setSuccess(null);

      const paymentData = {
        amount: amountNum,
        payment_method: paymentMethod,
        description: description || `Pago de suscripción - ${clinic.name_clinic}`,
        reference_number: referenceNumber,
        update_subscription: updateSubscription,
        selected_plan: updateSubscription ? selectedPlan : undefined,
        extension_days: updateSubscription ? parseInt(extensionDays) : undefined
      };

      console.log('💳 Registrando pago:', paymentData);

      const response = await authenticatedRequest(`/api/admin/clinics/${clinic.clinic_id}/payments`, {
        method: 'POST',
        body: JSON.stringify(paymentData)
      });

      if (response.ok) {
        const data = await response.json();
        console.log('✅ Payment recorded successfully:', data);
        
        setSuccess(`Pago registrado exitosamente por $${amountNum.toFixed(2)}`);
        
        // Limpiar formulario
        setAmount('');
        setPaymentMethod('');
        setDescription('');
        setReferenceNumber('');
        setUpdateSubscription(false);
        setExtensionDays('30');
        
        // Recargar historial
        loadPaymentHistory();
        
        // Notificar actualización
        onPaymentProcessed();
        
        // Cerrar modal inmediatamente
        onClose();
      } else {
        const errorData = await response.text();
        console.error('❌ Error recording payment:', response.status, errorData);
        throw new Error(`Error ${response.status}: No se pudo registrar el pago`);
      }
    } catch (err) {
      console.error('❌ Error in handleSubmitPayment:', err);
      setError(err instanceof Error ? err.message : 'Error desconocido al registrar el pago');
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'completed':
        return <Badge className="bg-green-600 text-green-100 font-semibold">Completado</Badge>;
      case 'pending':
        return <Badge className="bg-yellow-600 text-yellow-100 font-semibold">Pendiente</Badge>;
      case 'failed':
        return <Badge className="bg-red-600 text-red-100 font-semibold">Fallido</Badge>;
      default:
        return <Badge className="bg-slate-600 text-slate-100 font-semibold">{status}</Badge>;
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[900px] bg-slate-800 border-slate-700 text-slate-100 max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-white flex items-center gap-2">
            <DollarSign className="h-5 w-5 text-medical-400" />
            Gestión de Pagos - {clinic.name_clinic}
          </DialogTitle>
          <DialogDescription className="text-slate-400">
            Registra pagos y gestiona la suscripción de la clínica
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {error && (
            <Alert variant="destructive" className="bg-red-900/30 border-red-800 text-red-200">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {success && (
            <Alert className="bg-green-900/30 border-green-800 text-green-200">
              <CheckCircle className="h-4 w-4" />
              <AlertDescription>{success}</AlertDescription>
            </Alert>
          )}

          {/* Información de Suscripción */}
          <Card className="bg-slate-700 border-slate-600">
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span className="text-slate-100">Estado de Suscripción</span>
                <div className="flex items-center gap-2 bg-slate-600 px-3 py-1 rounded-md border border-slate-500">
                  <Clock className="h-4 w-4 text-medical-400" />
                  <span className="text-sm font-semibold text-slate-100">
                    {daysRemaining} días restantes
                  </span>
                </div>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-slate-600 p-3 rounded-lg border border-slate-500">
                  <Label className="text-sm font-medium text-slate-400">Plan Actual</Label>
                  <div className="font-bold text-slate-100 text-lg">{clinic.subscription_plan}</div>
                </div>
                <div className="bg-slate-600 p-3 rounded-lg border border-slate-500">
                  <Label className="text-sm font-medium text-slate-400">Estado</Label>
                  <div className="flex items-center gap-2 mt-1">
                    <Badge 
                      className={clinic.subscription_status === 'active' 
                        ? 'bg-green-600 text-green-100 font-semibold' 
                        : 'bg-red-600 text-red-100 font-semibold'
                      }
                    >
                      {clinic.subscription_status}
                    </Badge>
                  </div>
                </div>
                <div className="bg-slate-600 p-3 rounded-lg border border-slate-500">
                  <Label className="text-sm font-medium text-slate-400">Vence</Label>
                  <div className="font-bold text-slate-100 text-lg">
                    {clinic.subscription_expires 
                      ? new Date(clinic.subscription_expires).toLocaleDateString()
                      : 'No definido'
                    }
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Tabs */}
          <div className="flex border-b border-slate-600">
            <button
              className={`px-4 py-2 border-b-2 font-medium text-sm ${
                activeTab === 'new'
                  ? 'border-medical-400 text-medical-400'
                  : 'border-transparent text-slate-400 hover:text-slate-200'
              }`}
              onClick={() => setActiveTab('new')}
            >
              Nuevo Pago
            </button>
            <button
              className={`px-4 py-2 border-b-2 font-medium text-sm ${
                activeTab === 'history'
                  ? 'border-medical-400 text-medical-400'
                  : 'border-transparent text-slate-400 hover:text-slate-200'
              }`}
              onClick={() => setActiveTab('history')}
            >
              Historial ({paymentHistory.length})
            </button>
          </div>

          {/* Formulario de Nuevo Pago */}
          {activeTab === 'new' && (
            <form onSubmit={handleSubmitPayment} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="amount" className="text-slate-200">Monto *</Label>
                  <div className="relative">
                    <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" />
                    <Input
                      id="amount"
                      type="number"
                      step="0.01"
                      min="0"
                      value={amount}
                      onChange={(e) => setAmount(e.target.value)}
                      className="pl-10 bg-slate-700 border-slate-500 text-slate-100 placeholder:text-slate-400"
                      placeholder="0.00"
                      required
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="payment_method" className="text-slate-200">Método de Pago *</Label>
                  <Select value={paymentMethod} onValueChange={setPaymentMethod} required>
                    <SelectTrigger className="bg-slate-700 border-slate-500 text-slate-100">
                      <SelectValue placeholder="Seleccionar método" />
                    </SelectTrigger>
                    <SelectContent className="bg-slate-700 border-slate-500">
                      <SelectItem value="cash" className="text-slate-100 hover:bg-slate-600">Efectivo</SelectItem>
                      <SelectItem value="credit_card" className="text-slate-100 hover:bg-slate-600">Tarjeta de Crédito</SelectItem>
                      <SelectItem value="debit_card" className="text-slate-100 hover:bg-slate-600">Tarjeta de Débito</SelectItem>
                      <SelectItem value="bank_transfer" className="text-slate-100 hover:bg-slate-600">Transferencia Bancaria</SelectItem>
                      <SelectItem value="check" className="text-slate-100 hover:bg-slate-600">Cheque</SelectItem>
                      <SelectItem value="paypal" className="text-slate-100 hover:bg-slate-600">PayPal</SelectItem>
                      <SelectItem value="other" className="text-slate-100 hover:bg-slate-600">Otro</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="reference_number" className="text-slate-200">Número de Referencia</Label>
                  <Input
                    id="reference_number"
                    value={referenceNumber}
                    onChange={(e) => setReferenceNumber(e.target.value)}
                    placeholder="Ej: TXN123456, CHK001"
                    className="bg-slate-700 border-slate-500 text-slate-100 placeholder:text-slate-400"
                  />
                </div>

                <div>
                  <Label htmlFor="description" className="text-slate-200">Descripción</Label>
                  <Input
                    id="description"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Descripción del pago"
                    className="bg-slate-700 border-slate-500 text-slate-100 placeholder:text-slate-400"
                  />
                </div>
              </div>

              {/* Actualización de Suscripción */}
              <Card className="bg-slate-600 border-slate-500">
                <CardHeader>
                  <div className="flex items-center space-x-2">
                    <Switch
                      id="update-subscription"
                      checked={updateSubscription}
                      onCheckedChange={setUpdateSubscription}
                    />
                    <Label htmlFor="update-subscription" className="font-medium text-slate-200">
                      Actualizar Suscripción
                    </Label>
                  </div>
                </CardHeader>
                
                {updateSubscription && (
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="selected_plan" className="text-slate-200">Plan de Suscripción</Label>
                        <Select value={selectedPlan} onValueChange={setSelectedPlan}>
                          <SelectTrigger className="bg-slate-700 border-slate-500 text-slate-100">
                            <SelectValue placeholder="Seleccionar plan" />
                          </SelectTrigger>
                          <SelectContent className="bg-slate-700 border-slate-500">
                            {Object.entries(availablePlans).map(([planId, plan]) => (
                              <SelectItem key={planId} value={planId} className="text-slate-100 hover:bg-slate-600">
                                {plan.name} - ${plan.price}/mes
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      <div>
                        <Label htmlFor="extension_days" className="text-slate-200">Días de Extensión</Label>
                        <Select value={extensionDays} onValueChange={setExtensionDays}>
                          <SelectTrigger className="bg-slate-700 border-slate-500 text-slate-100">
                            <SelectValue placeholder="Días" />
                          </SelectTrigger>
                          <SelectContent className="bg-slate-700 border-slate-500">
                            <SelectItem value="7" className="text-slate-100 hover:bg-slate-600">7 días</SelectItem>
                            <SelectItem value="15" className="text-slate-100 hover:bg-slate-600">15 días</SelectItem>
                            <SelectItem value="30" className="text-slate-100 hover:bg-slate-600">30 días (1 mes)</SelectItem>
                            <SelectItem value="60" className="text-slate-100 hover:bg-slate-600">60 días (2 meses)</SelectItem>
                            <SelectItem value="90" className="text-slate-100 hover:bg-slate-600">90 días (3 meses)</SelectItem>
                            <SelectItem value="180" className="text-slate-100 hover:bg-slate-600">180 días (6 meses)</SelectItem>
                            <SelectItem value="365" className="text-slate-100 hover:bg-slate-600">365 días (1 año)</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    <div className="bg-slate-500/30 p-4 rounded-lg border border-slate-400">
                      <div className="flex items-center gap-2 text-medical-400 mb-2">
                        <TrendingUp className="h-4 w-4" />
                        <span className="font-medium">Vista Previa de Actualización</span>
                      </div>
                      <div className="text-sm text-slate-200 space-y-1">
                        <div className="flex justify-between">
                          <span>Fecha actual de vencimiento:</span>
                          <span>{clinic.subscription_expires ? new Date(clinic.subscription_expires).toLocaleDateString() : 'No definido'}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Nueva fecha de vencimiento:</span>
                          <span>
                            {new Date(
                              (clinic.subscription_expires ? new Date(clinic.subscription_expires) : new Date()).getTime() + 
                              parseInt(extensionDays) * 24 * 60 * 60 * 1000
                            ).toLocaleDateString()}
                          </span>
                        </div>
                        <div className="flex justify-between font-medium">
                          <span>Días totales:</span>
                          <span>{daysRemaining + parseInt(extensionDays)} días</span>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                )}
              </Card>

              <div className="flex justify-end gap-3">
                <Button type="button" variant="outline" onClick={onClose} className="border-slate-500 bg-slate-700 text-slate-200 hover:bg-slate-600">
                  Cancelar
                </Button>
                <Button type="submit" disabled={loading} className="bg-medical-500 hover:bg-medical-600">
                  {loading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Procesando...
                    </>
                  ) : (
                    <>
                      <Receipt className="mr-2 h-4 w-4" />
                      Registrar Pago
                    </>
                  )}
                </Button>
              </div>
            </form>
          )}

          {/* Historial de Pagos */}
          {activeTab === 'history' && (
            <div className="space-y-4">
              {loadingHistory ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-8 w-8 animate-spin text-slate-400" />
                  <span className="ml-3 text-slate-400">Cargando historial...</span>
                </div>
              ) : paymentHistory.length === 0 ? (
                <div className="text-center py-8 text-slate-400">
                  <Receipt className="h-12 w-12 mx-auto mb-4" />
                  <p>No hay pagos registrados para esta clínica</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {paymentHistory.map((payment) => (
                    <Card key={payment.id} className="bg-slate-600/50 border-slate-500 hover:bg-slate-600/70 transition-colors">
                      <CardContent className="p-5">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-3 mb-3">
                              <div className="text-xl font-bold text-slate-100 bg-green-600/30 px-3 py-1 rounded-md border border-green-500">
                                ${payment.amount.toFixed(2)}
                              </div>
                              <div className="flex flex-wrap gap-2">
                                {getStatusBadge(payment.status)}
                                {payment.subscription_updated && (
                                  <Badge className="bg-blue-600 text-blue-100 font-medium">
                                    <TrendingUp className="h-3 w-3 mr-1" />
                                    Suscripción Actualizada
                                  </Badge>
                                )}
                              </div>
                            </div>
                            
                            <div className="space-y-2 bg-slate-500/30 p-3 rounded-md border border-slate-400">
                              <div className="flex items-center gap-2">
                                <CreditCard className="h-4 w-4 text-slate-300" />
                                <span className="font-medium text-slate-100">
                                  {payment.payment_method.replace('_', ' ').toUpperCase()}
                                </span>
                                {payment.reference_number && (
                                  <span className="text-slate-300 font-medium">• Ref: {payment.reference_number}</span>
                                )}
                              </div>
                              
                              <div className="flex items-center gap-2">
                                <Calendar className="h-4 w-4 text-slate-300" />
                                <span className="font-medium text-slate-100">
                                  {new Date(payment.payment_date).toLocaleString()}
                                </span>
                              </div>
                              
                              {payment.description && (
                                <div className="text-slate-200 font-medium bg-slate-600/50 p-2 rounded border border-slate-500">
                                  {payment.description}
                                </div>
                              )}
                              
                              {payment.subscription_extended_days && (
                                <div className="flex items-center gap-2 text-medical-200 bg-medical-600/30 p-2 rounded border border-medical-500">
                                  <Clock className="h-4 w-4" />
                                  <span className="font-medium">
                                    Suscripción extendida {payment.subscription_extended_days} días
                                  </span>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}