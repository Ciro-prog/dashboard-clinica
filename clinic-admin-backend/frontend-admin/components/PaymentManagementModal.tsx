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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  CreditCard, 
  Loader2, 
  DollarSign, 
  Calendar,
  Clock,
  Plus,
  History,
  CheckCircle,
  AlertCircle,
  XCircle
} from 'lucide-react';

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

interface Payment {
  id: string;
  amount: number;
  payment_method: string;
  payment_date: string;
  billing_period_start: string;
  billing_period_end: string;
  status: string;
  reference: string;
  notes: string;
  created_at: string;
}

interface PaymentManagementModalProps {
  clinic: Clinic;
  open: boolean;
  onClose: () => void;
  onPaymentProcessed: () => void;
}

export default function PaymentManagementModal({ 
  clinic, 
  open, 
  onClose, 
  onPaymentProcessed 
}: PaymentManagementModalProps) {
  const [loading, setLoading] = useState(false);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [showAddPayment, setShowAddPayment] = useState(false);
  
  const [formData, setFormData] = useState({
    amount: '',
    payment_method: '',
    reference: '',
    notes: '',
    billing_period_days: '30'
  });

  // Cargar historial de pagos al abrir
  useEffect(() => {
    if (open && clinic) {
      loadPaymentHistory();
    }
  }, [open, clinic]);

  const loadPaymentHistory = async () => {
    try {
      setLoadingHistory(true);
      
      const token = localStorage.getItem('admin_token');
      if (!token) return;

      const response = await fetch(`/api/admin/clinics/${clinic.clinic_id}/payments`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const paymentsData = await response.json();
        setPayments(Array.isArray(paymentsData) ? paymentsData : []);
      }
    } catch (err) {
      console.error('❌ Error cargando historial de pagos:', err);
    } finally {
      setLoadingHistory(false);
    }
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleAddPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      setLoading(true);
      setError(null);
      
      console.log('💳 Procesando nuevo pago:', formData);
      
      const token = localStorage.getItem('admin_token');
      if (!token) {
        throw new Error('Token de administrador no encontrado');
      }

      const paymentData = {
        amount: parseFloat(formData.amount),
        payment_method: formData.payment_method,
        reference: formData.reference,
        notes: formData.notes,
        billing_period_days: parseInt(formData.billing_period_days)
      };

      const response = await fetch(`/api/admin/clinics/${clinic.clinic_id}/payments`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(paymentData)
      });

      if (!response.ok) {
        const errorData = await response.text();
        console.error('❌ Error procesando pago:', response.status, errorData);
        
        if (response.status === 400) {
          throw new Error('Datos de pago inválidos');
        } else if (response.status === 401) {
          throw new Error('Sesión expirada. Por favor, inicia sesión nuevamente');
        } else if (response.status === 404) {
          throw new Error('Clínica no encontrada');
        } else {
          throw new Error(`Error del servidor: ${response.status}`);
        }
      }

      const newPayment = await response.json();
      console.log('✅ Pago procesado exitosamente:', newPayment);
      
      // Resetear formulario
      setFormData({
        amount: '',
        payment_method: '',
        reference: '',
        notes: '',
        billing_period_days: '30'
      });
      
      // Ocultar formulario y recargar historial
      setShowAddPayment(false);
      loadPaymentHistory();
      onPaymentProcessed();
      
    } catch (err) {
      console.error('❌ Error en procesamiento de pago:', err);
      setError(err instanceof Error ? err.message : 'Error desconocido');
    } finally {
      setLoading(false);
    }
  };

  const getPaymentStatusBadge = (status: string) => {
    switch (status) {
      case 'completed':
        return <Badge className="bg-green-600 text-green-100">Completado</Badge>;
      case 'pending':
        return <Badge className="bg-yellow-600 text-yellow-100">Pendiente</Badge>;
      case 'failed':
        return <Badge className="bg-red-600 text-red-100">Fallido</Badge>;
      case 'refunded':
        return <Badge className="bg-gray-600 text-gray-100">Reembolsado</Badge>;
      default:
        return <Badge className="bg-slate-600 text-slate-100">{status}</Badge>;
    }
  };

  const getPaymentMethodDisplay = (method: string) => {
    switch (method) {
      case 'credit_card':
        return '💳 Tarjeta de Crédito';
      case 'debit_card':
        return '💳 Tarjeta de Débito';
      case 'bank_transfer':
        return '🏦 Transferencia Bancaria';
      case 'cash':
        return '💵 Efectivo';
      case 'check':
        return '📄 Cheque';
      default:
        return method;
    }
  };

  const resetForm = () => {
    setFormData({
      amount: '',
      payment_method: '',
      reference: '',
      notes: '',
      billing_period_days: '30'
    });
    setError(null);
    setShowAddPayment(false);
  };

  const handleClose = () => {
    onClose();
    resetForm();
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent 
        className="sm:max-w-[900px] bg-slate-800 border-slate-700 text-slate-100 max-h-[90vh] overflow-y-auto"
      >
        <DialogHeader>
          <DialogTitle className="text-white flex items-center gap-2">
            <CreditCard className="h-5 w-5 text-medical-400" />
            Gestión de Pagos - {clinic.name_clinic}
          </DialogTitle>
          <DialogDescription className="text-slate-400">
            Administra los pagos y ciclos de facturación de la clínica.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {error && (
            <Alert variant="destructive" className="bg-red-900/30 border-red-800 text-red-200">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {/* Información de Suscripción Actual */}
          <Card className="bg-slate-700 border-slate-600">
            <CardHeader>
              <CardTitle className="text-slate-100 text-base">Información de Suscripción</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <span className="text-xs text-slate-400">Plan Actual:</span>
                  <div className="text-sm font-medium text-slate-100 capitalize">{clinic.subscription_plan}</div>
                </div>
                <div>
                  <span className="text-xs text-slate-400">Estado:</span>
                  <div className="flex items-center gap-2">
                    {getPaymentStatusBadge(clinic.subscription_status)}
                  </div>
                </div>
                <div>
                  <span className="text-xs text-slate-400">Vence:</span>
                  <div className="text-sm text-slate-100">
                    {clinic.subscription_expires 
                      ? new Date(clinic.subscription_expires).toLocaleDateString()
                      : 'Sin fecha'
                    }
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Botón para agregar pago */}
          <div className="flex justify-between items-center">
            <h4 className="text-lg font-medium text-slate-200">Historial de Pagos</h4>
            <Button
              onClick={() => setShowAddPayment(true)}
              className="bg-medical-500 hover:bg-medical-600"
            >
              <Plus className="h-4 w-4 mr-2" />
              Registrar Pago
            </Button>
          </div>

          {/* Formulario de agregar pago */}
          {showAddPayment && (
            <Card className="bg-slate-600 border-slate-500">
              <CardHeader>
                <CardTitle className="text-slate-200 text-base">Registrar Nuevo Pago</CardTitle>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleAddPayment} className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="amount" className="text-slate-200">Monto (USD) *</Label>
                      <Input
                        id="amount"
                        type="number"
                        value={formData.amount}
                        onChange={(e) => handleInputChange('amount', e.target.value)}
                        placeholder="99.99"
                        className="bg-slate-700 border-slate-500 text-slate-100 placeholder:text-slate-400"
                        required
                        min="0"
                        step="0.01"
                        disabled={loading}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="payment_method" className="text-slate-200">Método de Pago *</Label>
                      <Select 
                        value={formData.payment_method} 
                        onValueChange={(value) => handleInputChange('payment_method', value)}
                        disabled={loading}
                      >
                        <SelectTrigger className="bg-slate-700 border-slate-500 text-slate-100">
                          <SelectValue placeholder="Seleccionar método" />
                        </SelectTrigger>
                        <SelectContent className="bg-slate-700 border-slate-500">
                          <SelectItem value="credit_card" className="text-slate-100 hover:bg-slate-600">
                            💳 Tarjeta de Crédito
                          </SelectItem>
                          <SelectItem value="debit_card" className="text-slate-100 hover:bg-slate-600">
                            💳 Tarjeta de Débito
                          </SelectItem>
                          <SelectItem value="bank_transfer" className="text-slate-100 hover:bg-slate-600">
                            🏦 Transferencia Bancaria
                          </SelectItem>
                          <SelectItem value="cash" className="text-slate-100 hover:bg-slate-600">
                            💵 Efectivo
                          </SelectItem>
                          <SelectItem value="check" className="text-slate-100 hover:bg-slate-600">
                            📄 Cheque
                          </SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="reference" className="text-slate-200">Referencia/Comprobante</Label>
                      <Input
                        id="reference"
                        value={formData.reference}
                        onChange={(e) => handleInputChange('reference', e.target.value)}
                        placeholder="Número de transacción, comprobante, etc."
                        className="bg-slate-700 border-slate-500 text-slate-100 placeholder:text-slate-400"
                        disabled={loading}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="billing_period_days" className="text-slate-200">Período de Facturación (días)</Label>
                      <Select 
                        value={formData.billing_period_days} 
                        onValueChange={(value) => handleInputChange('billing_period_days', value)}
                        disabled={loading}
                      >
                        <SelectTrigger className="bg-slate-700 border-slate-500 text-slate-100">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent className="bg-slate-700 border-slate-500">
                          <SelectItem value="30" className="text-slate-100 hover:bg-slate-600">
                            30 días (Mensual)
                          </SelectItem>
                          <SelectItem value="90" className="text-slate-100 hover:bg-slate-600">
                            90 días (Trimestral)
                          </SelectItem>
                          <SelectItem value="180" className="text-slate-100 hover:bg-slate-600">
                            180 días (Semestral)
                          </SelectItem>
                          <SelectItem value="365" className="text-slate-100 hover:bg-slate-600">
                            365 días (Anual)
                          </SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="notes" className="text-slate-200">Notas</Label>
                    <Textarea
                      id="notes"
                      value={formData.notes}
                      onChange={(e) => handleInputChange('notes', e.target.value)}
                      placeholder="Notas adicionales sobre el pago..."
                      className="bg-slate-700 border-slate-500 text-slate-100 placeholder:text-slate-400"
                      rows={2}
                      disabled={loading}
                    />
                  </div>

                  <div className="flex justify-end gap-3">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setShowAddPayment(false)}
                      className="border-slate-500 bg-slate-700 text-slate-200 hover:bg-slate-600"
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
                          Procesando...
                        </>
                      ) : (
                        <>
                          <DollarSign className="mr-2 h-4 w-4" />
                          Registrar Pago
                        </>
                      )}
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          )}

          {/* Historial de Pagos */}
          <Card className="bg-slate-700 border-slate-600">
            <CardHeader>
              <CardTitle className="text-slate-100 text-base flex items-center gap-2">
                <History className="h-4 w-4" />
                Historial de Pagos
              </CardTitle>
            </CardHeader>
            <CardContent>
              {loadingHistory ? (
                <div className="text-center py-4">
                  <Loader2 className="h-6 w-6 animate-spin mx-auto text-slate-400" />
                  <p className="text-sm text-slate-400 mt-2">Cargando historial...</p>
                </div>
              ) : payments.length === 0 ? (
                <div className="text-center py-6 text-slate-400">
                  <CreditCard className="h-8 w-8 mx-auto mb-2 text-slate-500" />
                  <p>No hay pagos registrados.</p>
                  <p className="text-sm">Los pagos aparecerán aquí cuando se registren.</p>
                </div>
              ) : (
                <div className="space-y-3 max-h-64 overflow-y-auto">
                  {payments.map((payment) => (
                    <div key={payment.id} className="flex items-center justify-between p-3 border border-slate-500 rounded-lg bg-slate-600/50">
                      <div className="flex-1">
                        <div className="flex items-center gap-3">
                          <div className="flex items-center gap-2">
                            <DollarSign className="h-4 w-4 text-green-400" />
                            <span className="font-medium text-slate-100">${payment.amount}</span>
                          </div>
                          <span className="text-sm text-slate-300">
                            {getPaymentMethodDisplay(payment.payment_method)}
                          </span>
                          {getPaymentStatusBadge(payment.status)}
                        </div>
                        
                        <div className="mt-1 text-xs text-slate-400 space-y-1">
                          <div className="flex items-center gap-4">
                            <span className="flex items-center gap-1">
                              <Calendar className="h-3 w-3" />
                              {new Date(payment.payment_date).toLocaleDateString()}
                            </span>
                            <span className="flex items-center gap-1">
                              <Clock className="h-3 w-3" />
                              Período: {new Date(payment.billing_period_start).toLocaleDateString()} - {new Date(payment.billing_period_end).toLocaleDateString()}
                            </span>
                          </div>
                          {payment.reference && (
                            <div>Ref: {payment.reference}</div>
                          )}
                          {payment.notes && (
                            <div>Notas: {payment.notes}</div>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        <DialogFooter className="flex gap-2 pt-4">
          <Button
            type="button"
            variant="outline"
            onClick={onClose}
            className="border-slate-600 bg-slate-700 text-slate-200 hover:bg-slate-600"
            disabled={loading}
          >
            Cerrar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}