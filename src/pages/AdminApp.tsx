import React, { useState, useEffect } from 'react';
import AdminLoginForm from '../components/AdminLoginForm';
import AdminDashboard from '../components/AdminDashboard';

interface AdminUser {
  username: string;
  email: string;
  role: string;
}

export default function AdminApp() {
  const [adminUser, setAdminUser] = useState<AdminUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [loginError, setLoginError] = useState<string | null>(null);
  const [loginLoading, setLoginLoading] = useState(false);

  // Verificar autenticación persistente al cargar
  useEffect(() => {
    const checkAuth = async () => {
      try {
        // Verificar si hay token almacenado
        const token = localStorage.getItem('admin_token');
        const userData = localStorage.getItem('admin_user');
        
        if (token && userData) {
          const user = JSON.parse(userData);
          setAdminUser(user);
          console.log('✅ Autenticación persistente activa:', user.username);
        }
      } catch (error) {
        console.error('Error verificando autenticación:', error);
        // Limpiar tokens inválidos
        localStorage.removeItem('admin_token');
        localStorage.removeItem('admin_user');
      } finally {
        setLoading(false);
      }
    };

    checkAuth();
  }, []);

  const handleLogin = async (username: string, password: string) => {
    setLoginLoading(true);
    setLoginError(null);

    try {
      // Simulated authentication - replace with real API call
      if (username === 'admin' && password === 'admin123') {
        const user: AdminUser = {
          username: username,
          email: 'admin@clinica.com',
          role: 'admin'
        };

        // Generate a simple token (replace with real JWT)
        const token = btoa(JSON.stringify({ username, timestamp: Date.now() }));

        // Store authentication
        localStorage.setItem('admin_token', token);
        localStorage.setItem('admin_user', JSON.stringify(user));

        setAdminUser(user);
        console.log('✅ Admin login exitoso:', username);
      } else {
        throw new Error('Credenciales inválidas');
      }
    } catch (error: any) {
      console.error('❌ Error en login admin:', error);
      setLoginError(error.message || 'Error de autenticación');
    } finally {
      setLoginLoading(false);
    }
  };

  const handleLogout = () => {
    // Limpiar autenticación
    localStorage.removeItem('admin_token');
    localStorage.removeItem('admin_user');
    
    setAdminUser(null);
    setLoginError(null);
    console.log('👋 Admin logout exitoso');
  };

  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-300">Verificando autenticación...</p>
        </div>
      </div>
    );
  }

  // Show dashboard if authenticated
  if (adminUser) {
    return <AdminDashboard user={adminUser} onLogout={handleLogout} />;
  }

  // Show login form
  return (
    <AdminLoginForm
      onLogin={handleLogin}
      error={loginError}
      isLoading={loginLoading}
    />
  );
}