import React, { useState } from 'react';
import { Shield, Lock } from 'lucide-react';
import { AdminUser } from '../types';

interface LoginFormProps {
  onLogin: (admin: AdminUser) => void;
}

const LoginForm = ({ onLogin }: LoginFormProps) => {
  const [username, setUsername] = useState('admin');
  const [password, setPassword] = useState('admin123');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');
    
    if (!username || !password) {
      setError('Por favor completa todos los campos.');
      setIsLoading(false);
      return;
    }

    try {
      console.log('🔐 Iniciando login de administrador:', username);
      
      const loginData = {
        username: username,
        password: password,
        user_type: "admin"
      };
      
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(loginData)
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.detail || 'Error de autenticación');
      }

      // Verificar que sea un administrador
      if (data.user_type !== 'admin') {
        throw new Error('Acceso no autorizado');
      }

      const adminUser: AdminUser = {
        id: data.user_data.id,
        username: data.user_data.username,
        role: data.user_data.role || 'admin',
        permissions: data.user_data.permissions || []
      };

      // Guardar token de admin
      localStorage.setItem('admin_token', data.access_token);
      localStorage.setItem('admin_data', JSON.stringify(adminUser));

      console.log('✅ Admin login exitoso:', adminUser.username);
      onLogin(adminUser);
      
    } catch (error) {
      console.error('❌ Error en login de admin:', error);
      
      let errorMessage = "Error de autenticación";
      
      if (error.message?.includes('no autorizado')) {
        errorMessage = "No tienes permisos de administrador";
      } else if (error.message?.includes('Contraseña incorrecta')) {
        errorMessage = "Credenciales incorrectas";
      } else if (error.message?.includes('fetch')) {
        errorMessage = "Error de conexión. Verifica que el backend esté ejecutándose.";
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-medical-50 to-medical-100 p-4">
      <div className="w-full max-w-md bg-white rounded-lg card-shadow p-8">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="mx-auto w-16 h-16 medical-gradient rounded-full flex items-center justify-center mb-4 shadow-lg">
            <Shield className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-medical-800">ClinicaAdmin</h1>
          <p className="text-medical-600 mt-2">Panel de Administración</p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
              {error}
            </div>
          )}
          
          <div>
            <label htmlFor="username" className="block text-sm font-medium text-medical-700 mb-2">
              Usuario
            </label>
            <input
              id="username"
              type="text"
              placeholder="admin"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full px-3 py-2 border border-medical-200 rounded-md focus:outline-none focus:ring-2 focus:ring-medical-500 focus:border-transparent transition-all"
              disabled={isLoading}
            />
          </div>
          
          <div>
            <label htmlFor="password" className="block text-sm font-medium text-medical-700 mb-2">
              Contraseña
            </label>
            <input
              id="password"
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-3 py-2 border border-medical-200 rounded-md focus:outline-none focus:ring-2 focus:ring-medical-500 focus:border-transparent transition-all"
              disabled={isLoading}
            />
          </div>
          
          <button 
            type="submit" 
            className="w-full medical-gradient hover:opacity-90 transition-all text-white font-medium py-2 px-4 rounded-md shadow-lg disabled:opacity-50"
            disabled={isLoading}
          >
            {isLoading ? (
              <div className="flex items-center justify-center space-x-2">
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                <span>Verificando...</span>
              </div>
            ) : (
              <div className="flex items-center justify-center space-x-2">
                <Lock className="w-4 h-4" />
                <span>Acceder al Panel</span>
              </div>
            )}
          </button>
        </form>
        
        {/* Demo credentials */}
        <div className="mt-6 p-3 bg-medical-50 rounded-lg text-sm text-medical-700 border border-medical-200">
          <p className="font-medium text-medical-800 mb-2 flex items-center">
            <Shield className="w-4 h-4 mr-1" />
            Credenciales de desarrollo:
          </p>
          <p><strong>Usuario:</strong> admin</p>
          <p><strong>Contraseña:</strong> admin123</p>
        </div>
      </div>
    </div>
  );
};

export default LoginForm;