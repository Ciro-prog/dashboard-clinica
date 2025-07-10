import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from '@/hooks/use-toast';
import { loginClinic, saveClinicAuthData, type ClinicUser } from '@/lib/clinicAuth';

interface LoginFormProps {
  onLogin: (clinic: ClinicUser) => void;
}

const LoginForm = ({ onLogin }: LoginFormProps) => {
  const [email, setEmail] = useState('admin@admin.com');
  const [password, setPassword] = useState('Admin123!');
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
      console.log('🔐 Iniciando login para clínica:', email);
      
      // Autenticar clínica
      const authResponse = await loginClinic(email, password);
      
      console.log('✅ Login exitoso:', authResponse.clinic);

      // Guardar datos de autenticación
      saveClinicAuthData(authResponse);
      
      toast({
        title: "¡Bienvenido!",
        description: `Acceso autorizado a ${authResponse.clinic.name_clinic}`,
      });
      
      // Redirigir al dashboard con datos de clínica
      onLogin(authResponse.clinic);
      
    } catch (error) {
      console.error('❌ Error en login:', error);
      
      let errorMessage = "Error de autenticación";
      
      if (error.message?.includes('Clínica no encontrada')) {
        errorMessage = "No existe una clínica registrada con este email";
      } else if (error.message?.includes('Contraseña incorrecta')) {
        errorMessage = "La contraseña es incorrecta";
      } else if (error.message?.includes('inactiva')) {
        errorMessage = "La clínica está inactiva. Contacta al administrador.";
      } else if (error.message?.includes('suscripción')) {
        errorMessage = "La suscripción ha expirado. Contacta al administrador.";
      } else if (error.message?.includes('fetch')) {
        errorMessage = "Error de conexión. Verifica que Strapi esté ejecutándose.";
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
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <CardTitle className="text-2xl font-bold text-medical-800">Salud Inteligente</CardTitle>
          <CardDescription>Accede a tu dashboard médico</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Correo electrónico</Label>
              <Input
                id="email"
                type="email"
                placeholder="admin@admin.com"
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
                'Iniciar Sesión'
              )}
            </Button>
          </form>
          
          {/* Información de prueba */}
          <div className="mt-4 p-3 bg-gray-50 rounded-lg text-sm text-gray-600">
            <p className="font-medium text-gray-700 mb-2">💡 Credenciales de prueba:</p>
            <p><strong>Email:</strong> admin@admin.com</p>
            <p><strong>Contraseña:</strong> Admin123!</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default LoginForm;