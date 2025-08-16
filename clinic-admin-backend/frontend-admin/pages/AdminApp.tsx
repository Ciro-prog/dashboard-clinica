import React, { useState, useEffect } from 'react';
import AdminLoginForm from '../components/AdminLoginForm';
import AdminDashboard from '../components/AdminDashboard';
import { persistentAuth, createSession, logout, getAuthState } from '../lib/persistentAuth';

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
        const authState = getAuthState();
        
        if (authState.isAuthenticated && authState.user) {
          setAdminUser(authState.user);
          console.log('✅ Autenticación persistente activa:', authState.user.username);
        } else {
          // Fallback a localStorage para compatibilidad
          const token = localStorage.getItem('admin_token');
          const userData = localStorage.getItem('admin_user');

          if (token && userData) {
            try {
              const user = JSON.parse(userData);
              setAdminUser(user);
              console.log('✅ Admin token encontrado (fallback):', user.username);
            } catch (error) {
              console.error('❌ Error parseando datos de usuario admin:', error);
              localStorage.removeItem('admin_token');
              localStorage.removeItem('admin_user');
            }
          }
        }
      } catch (error) {
        console.error('❌ Error verificando autenticación:', error);
      } finally {
        setLoading(false);
      }
    };

    checkAuth();
  }, []);

  const handleLogin = async (username: string, password: string) => {
    try {
      setLoginLoading(true);
      setLoginError(null);

      console.log('🔐 Intentando login admin:', { username, user_type: 'admin' });

      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          username,
          password,
          user_type: 'admin'
        }),
      });

      if (!response.ok) {
        const errorData = await response.text();
        console.error('❌ Error login admin:', response.status, errorData);
        
        if (response.status === 401) {
          throw new Error('Credenciales inválidas. Verifica usuario y contraseña.');
        } else if (response.status === 403) {
          throw new Error('Acceso denegado. No tienes permisos de administrador.');
        } else {
          throw new Error(`Error del servidor: ${response.status}`);
        }
      }

      const data = await response.json();
      console.log('✅ Login admin exitoso:', data);

      if (!data.access_token) {
        throw new Error('Respuesta de login inválida: falta token');
      }

      // Crear sesión persistente con configuración
      const userData: AdminUser = {
        username: data.username || username,
        email: data.email || 'admin@clinica-dashboard.com',
        role: data.role || 'admin'
      };

      // Intentar obtener configuración de API del backend
      let apiConfig;
      try {
        const configResponse = await fetch('/api/admin/configuration', {
          headers: {
            'Authorization': `Bearer ${data.access_token}`,
            'Content-Type': 'application/json'
          }
        });

        if (configResponse.ok) {
          apiConfig = await configResponse.json();
          console.log('✅ Configuración de API cargada durante login');
        } else {
          // Configuración por defecto si no está disponible
          apiConfig = {
            backend_url: 'http://localhost:8000',
            backend_api_key: 'test123456', // Default test key
            n8n_folder: '',
            admin_session_duration: 24
          };
          console.log('⚠️ Usando configuración por defecto');
        }
      } catch (error) {
        console.warn('⚠️ No se pudo cargar configuración, usando defaults:', error);
        apiConfig = {
          backend_url: 'http://localhost:8000',
          backend_api_key: 'test123456', // Default test key
          n8n_folder: '',
          admin_session_duration: 24
        };
      }

      // Crear sesión persistente
      createSession(data.access_token, userData, apiConfig);
      
      // Mantener localStorage para compatibilidad
      localStorage.setItem('admin_token', data.access_token);
      localStorage.setItem('admin_user', JSON.stringify(userData));
      
      setAdminUser(userData);
      console.log('✅ Admin autenticado con sesión persistente:', userData);

    } catch (error) {
      console.error('❌ Error en login admin:', error);
      setLoginError(error instanceof Error ? error.message : 'Error desconocido en el login');
    } finally {
      setLoginLoading(false);
    }
  };

  const handleLogout = () => {
    console.log('👋 Cerrando sesión admin...');
    
    // Logout del sistema persistente
    logout();
    
    // Limpiar estado local
    setAdminUser(null);
    setLoginError(null);
    
    console.log('✅ Logout completado');
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-medical-500 mx-auto"></div>
          <p className="mt-4 text-slate-600">Verificando autenticación...</p>
        </div>
      </div>
    );
  }

  if (!adminUser) {
    return (
      <AdminLoginForm
        onLogin={handleLogin}
        error={loginError}
        loading={loginLoading}
      />
    );
  }

  return (
    <AdminDashboard
      adminUser={adminUser}
      onLogout={handleLogout}
    />
  );
}