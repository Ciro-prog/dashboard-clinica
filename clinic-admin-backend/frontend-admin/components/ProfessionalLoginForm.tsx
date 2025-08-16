import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from '@/hooks/use-toast';
import { loginProfessional, saveProfessionalAuthData, type ProfessionalUser } from '@/lib/professionalAuth';

interface ProfessionalLoginFormProps {
  onLogin: (professional: ProfessionalUser) => void;
  onBackToClinic: () => void;
}

const ProfessionalLoginForm = ({ onLogin, onBackToClinic }: ProfessionalLoginFormProps) => {
  const [email, setEmail] = useState('maria.fernandez@clinicagarcia.com');
  const [password, setPassword] = useState('medico123');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    
    if (!email || !password) {
      toast({
        title: "Error",
        description: "Por favor completa todos los campos.",
        variant: "destructive"
      });
      setIsLoading(false);
      return;
    }

    try {
      console.log('🔐 Iniciando login para profesional:', email);
      
      // Autenticar profesional
      const authResponse = await loginProfessional(email, password);
      
      console.log('✅ Login exitoso:', authResponse.professional);

      // Guardar datos de autenticación
      saveProfessionalAuthData(authResponse);
      
      toast({
        title: "¡Bienvenido!",
        description: `Acceso autorizado - Dr. ${authResponse.professional.first_name} ${authResponse.professional.last_name}`,
      });
      
      // Redirigir al dashboard con datos de profesional
      onLogin(authResponse.professional);
      
    } catch (error) {
      console.error('❌ Error en login:', error);
      
      let errorMessage = "Error de autenticación";
      
      if (error.message?.includes('Incorrect credentials')) {
        errorMessage = "Email o contraseña incorrectos";
      } else if (error.message?.includes('disabled')) {
        errorMessage = "La cuenta está deshabilitada. Contacta al administrador.";
      } else if (error.message?.includes('inactive')) {
        errorMessage = "La cuenta está inactiva. Contacta al administrador.";
      } else if (error.message?.includes('fetch')) {
        errorMessage = "Error de conexión. Verifica que el servidor esté funcionando.";
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      toast({
        title: "Error de autenticación",
        description: errorMessage,
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-white p-4">
      <Card className="w-full max-w-md card-shadow bg-white">
        <CardHeader className="text-center space-y-2">
          <div className="mx-auto w-16 h-16 medical-gradient rounded-full flex items-center justify-center mb-4">
            <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>
          </div>
          <CardTitle className="text-2xl font-bold text-medical-800">Portal Profesional</CardTitle>
          <CardDescription>Accede a tu área médica</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email Profesional</Label>
              <Input
                id="email"
                type="email"
                placeholder="doctor@clinica.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="transition-all focus:ring-2 focus:ring-medical-500"
                disabled={isLoading}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Contraseña</Label>
              <Input
                id="password"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="transition-all focus:ring-2 focus:ring-medical-500"
                disabled={isLoading}
              />
            </div>
            <Button 
              type="submit" 
              className="w-full medical-gradient hover:opacity-90 transition-all text-medical-50"
              disabled={isLoading}
            >
              {isLoading ? (
                <div className="flex items-center space-x-2">
                  <div className="w-4 h-4 border-2 border-white text-medical-900 border-t-transparent rounded-full animate-spin"></div>
                  <span>Iniciando sesión...</span>
                </div>
              ) : (
                'Acceder al Portal'
              )}
            </Button>
          </form>
          
          {/* Botón para volver al login de clínica */}
          <Button
            type="button"
            variant="outline"
            className="w-full mt-3 border-medical-300 text-medical-600 hover:bg-medical-50"
            onClick={onBackToClinic}
            disabled={isLoading}
          >
            ← Volver al Selector de Acceso
          </Button>
          
          {/* Información de prueba */}
          <div className="mt-4 p-3 bg-gray-50 rounded-lg text-sm text-gray-600">
            <p className="font-medium text-gray-700 mb-2">👨‍⚕️ Credenciales de prueba:</p>
            <p><strong>Dr. María Fernández:</strong></p>
            <p>Email: maria.fernandez@clinicagarcia.com</p>
            <p>Contraseña: medico123</p>
            <hr className="my-2" />
            <p><strong>Dr. Carlos Rodríguez:</strong></p>
            <p>Email: carlos.rodriguez@clinicagarcia.com</p>
            <p>Contraseña: cardio123</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default ProfessionalLoginForm;