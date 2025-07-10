import React, { useState, useEffect } from 'react';
import LoginForm from '@/components/LoginForm';
import DashboardLayout from '@/components/DashboardLayout';
import { 
  isClinicAuthenticated, 
  getStoredClinicData, 
  logoutClinic, 
  type ClinicUser 
} from '@/lib/clinicAuth';

const Index = () => {
  const [clinic, setClinic] = useState<ClinicUser | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // Verificar autenticación al cargar
  useEffect(() => {
    checkAuthStatus();
  }, []);

  const checkAuthStatus = () => {
    try {
      if (isClinicAuthenticated()) {
        const { clinic: storedClinic } = getStoredClinicData();
        if (storedClinic) {
          setClinic(storedClinic);
          setIsAuthenticated(true);
          console.log('✅ Clínica autenticada:', storedClinic.name_clinic);
        }
      } else {
        setIsAuthenticated(false);
        setClinic(null);
      }
    } catch (error) {
      console.error('❌ Error verificando autenticación:', error);
      setIsAuthenticated(false);
      setClinic(null);
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogin = (clinicData: ClinicUser) => {
    setClinic(clinicData);
    setIsAuthenticated(true);
    console.log('🏥 Login exitoso para:', clinicData.name_clinic);
  };

  const handleLogout = () => {
    logoutClinic();
    setClinic(null);
    setIsAuthenticated(false);
    console.log('👋 Sesión cerrada');
  };

  // Pantalla de carga
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-medical-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-slate-600">Verificando acceso...</p>
        </div>
      </div>
    );
  }

  return (
    <>
      {!isAuthenticated ? (
        <LoginForm onLogin={handleLogin} />
      ) : (
        <DashboardLayout clinic={clinic!} onLogout={handleLogout} />
      )}
    </>
  );
};

export default Index;