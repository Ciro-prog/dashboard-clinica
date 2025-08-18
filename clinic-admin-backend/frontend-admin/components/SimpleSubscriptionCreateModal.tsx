import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Plus, Loader2, X } from 'lucide-react';

interface SimpleSubscriptionCreateModalProps {
  onSubscriptionCreated: () => void;
}

export default function SimpleSubscriptionCreateModal({ onSubscriptionCreated }: SimpleSubscriptionCreateModalProps) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [name, setName] = useState('');

  const handleSubmit = async () => {
    try {
      setLoading(true);
      console.log('🧪 TEST: Simple modal submit triggered');
      
      // Simular guardado
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      console.log('✅ TEST: Guardado simulado completado');
      
      // Limpiar y cerrar
      setName('');
      setOpen(false);
      onSubscriptionCreated();
      
    } catch (error) {
      console.error('❌ TEST: Error en modal simple:', error);
    } finally {
      setLoading(false);
    }
  };

  if (!open) {
    return (
      <Button onClick={() => setOpen(true)} className="bg-medical-500 hover:bg-medical-600">
        <Plus className="h-4 w-4 mr-2" />
        TEST: Modal Simple
      </Button>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-black bg-opacity-50" 
        onClick={() => !loading && setOpen(false)}
      />
      
      {/* Modal */}
      <div className="relative bg-slate-800 border border-slate-700 rounded-lg p-6 w-full max-w-md mx-4 text-slate-100">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-medium text-white">
            TEST: Modal Simple
          </h2>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => !loading && setOpen(false)}
            disabled={loading}
          >
            <X className="h-4 w-4" />
          </Button>
        </div>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="test-name" className="text-slate-200">
              Nombre del Plan *
            </Label>
            <Input
              id="test-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Ej: Plan Test"
              className="bg-slate-700 border-slate-600 text-slate-100"
              disabled={loading}
            />
          </div>

          <div className="flex gap-2 pt-4">
            <Button
              variant="outline"
              onClick={() => setOpen(false)}
              disabled={loading}
              className="border-slate-600 bg-slate-700 text-slate-200 hover:bg-slate-600"
            >
              Cancelar
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={loading || !name.trim()}
              className="bg-medical-500 hover:bg-medical-600"
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Guardando...
                </>
              ) : (
                <>
                  <Plus className="mr-2 h-4 w-4" />
                  Crear Test
                </>
              )}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}