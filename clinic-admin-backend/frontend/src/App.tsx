import React, { useState, useEffect } from 'react';
import LoginForm from './components/LoginForm';
import Dashboard from './components/Dashboard';
import { AdminUser } from './types';

const App = () => {
  const [currentAdmin, setCurrentAdmin] = useState<AdminUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    checkExistingSession();
  }, []);

  const checkExistingSession = () => {
    try {
      const token = localStorage.getItem('admin_token');
      const adminData = localStorage.getItem('admin_data');
      
      if (token && adminData) {
        const admin = JSON.parse(adminData);
        setCurrentAdmin(admin);
      }
    } catch (error) {
      console.error('Error checking admin session:', error);
      localStorage.removeItem('admin_token');
      localStorage.removeItem('admin_data');
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogin = (admin: AdminUser) => {
    setCurrentAdmin(admin);
  };

  const handleLogout = () => {
    localStorage.removeItem('admin_token');
    localStorage.removeItem('admin_data');
    setCurrentAdmin(null);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-medical-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Verificando sesión...</p>
        </div>
      </div>
    );
  }

  if (!currentAdmin) {
    return <LoginForm onLogin={handleLogin} />;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Admin Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-xl font-semibold text-gray-900">ClinicaAdmin</h1>
              <p className="text-sm text-gray-600">Panel de Administración • {currentAdmin.username}</p>
            </div>
            <div className="flex items-center space-x-4">
              <div className="text-sm text-gray-600">
                Rol: <span className="font-medium capitalize">{currentAdmin.role.replace('_', ' ')}</span>
              </div>
              <button
                onClick={handleLogout}
                className="text-sm text-gray-600 hover:text-gray-900 transition-colors px-3 py-1 rounded border border-gray-300 hover:border-gray-400"
              >
                Cerrar Sesión
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Dashboard */}
      <main>
        <Dashboard />
      </main>
    </div>
  );
};

export default App;