import React, { useState, useEffect } from 'react';
import LoginForm from '@/components/LoginForm';
import ProfessionalLoginForm from '@/components/ProfessionalLoginForm';
import DashboardLayout from '@/components/DashboardLayout';
import ProfessionalDashboard from '@/components/ProfessionalDashboard';
import { 
  isClinicAuthenticated, 
  getStoredClinicData, 
  logoutClinic, 
  type ClinicUser 
} from '@/lib/clinicAuth';
import { 
  isProfessionalAuthenticated, 
  getStoredProfessionalData, 
  logoutProfessional, 
  type ProfessionalUser 
} from '@/lib/professionalAuth';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Building2, UserCheck } from 'lucide-react';

type UserType = 'clinic' | 'professional' | null;
type AuthMode = 'selector' | 'clinic-login' | 'professional-login';

const Index = () => {
  const [clinic, setClinic] = useState<ClinicUser | null>(null);
  const [professional, setProfessional] = useState<ProfessionalUser | null>(null);
  const [userType, setUserType] = useState<UserType>(null);
  const [authMode, setAuthMode] = useState<AuthMode>('selector');
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // Verificar autenticación al cargar
  useEffect(() => {
    checkAuthStatus();
  }, []);

  const checkAuthStatus = () => {
    try {
      // Verificar autenticación de clínica
      if (isClinicAuthenticated()) {
        const { clinic: storedClinic } = getStoredClinicData();
        if (storedClinic) {
          setClinic(storedClinic);
          setUserType('clinic');
          setIsAuthenticated(true);
          console.log('✅ Clínica autenticada:', storedClinic.name_clinic);
          return;
        }
      }
      
      // Verificar autenticación de profesional
      if (isProfessionalAuthenticated()) {
        const { professional: storedProfessional } = getStoredProfessionalData();
        if (storedProfessional) {
          setProfessional(storedProfessional);
          setUserType('professional');
          setIsAuthenticated(true);
          console.log('✅ Profesional autenticado:', `${storedProfessional.first_name} ${storedProfessional.last_name}`);
          return;
        }
      }
      
      // No hay autenticación válida
      setIsAuthenticated(false);
      setClinic(null);
      setProfessional(null);
      setUserType(null);
      
    } catch (error) {
      console.error('❌ Error verificando autenticación:', error);
      setIsAuthenticated(false);
      setClinic(null);
      setProfessional(null);
      setUserType(null);
    } finally {
      setIsLoading(false);
    }
  };

  const handleClinicLogin = (clinicData: ClinicUser) => {
    setClinic(clinicData);
    setUserType('clinic');
    setIsAuthenticated(true);
    console.log('🏥 Login exitoso para clínica:', clinicData.name_clinic);
  };

  const handleProfessionalLogin = (professionalData: ProfessionalUser) => {
    setProfessional(professionalData);
    setUserType('professional');
    setIsAuthenticated(true);
    console.log('👨‍⚕️ Login exitoso para profesional:', `${professionalData.first_name} ${professionalData.last_name}`);
  };

  const handleLogout = () => {
    if (userType === 'clinic') {
      logoutClinic();
      setClinic(null);
    } else if (userType === 'professional') {
      logoutProfessional();
      setProfessional(null);
    }
    
    setUserType(null);
    setIsAuthenticated(false);
    setAuthMode('selector');
    console.log('👋 Sesión cerrada');
  };

  const handleSelectUserType = (type: 'clinic' | 'professional') => {
    setUserType(type);
    setAuthMode(type === 'clinic' ? 'clinic-login' : 'professional-login');
  };

  const handleBackToSelector = () => {
    setAuthMode('selector');
    setUserType(null);
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

  // Componente selector de tipo de acceso
  const renderLoginSelector = () => (
    <div className="min-h-screen flex items-center justify-center bg-white p-4">
      <Card className="w-full max-w-md card-shadow bg-white">
        <CardHeader className="text-center space-y-2">
          <div className="mx-auto w-16 h-16 medical-gradient rounded-full flex items-center justify-center mb-4">
            <Building2 className="w-8 h-8 text-white" />
          </div>
          <CardTitle className="text-2xl font-bold text-medical-800">Clínica Dashboard</CardTitle>
          <CardDescription>Selecciona tu tipo de acceso</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Button
            onClick={() => handleSelectUserType('clinic')}
            className="w-full medical-gradient hover:opacity-90 transition-all text-medical-50 h-12"
          >
            <Building2 className="w-5 h-5 mr-2" />
            Acceso Administrador de Clínica
          </Button>
          
          <Button
            onClick={() => handleSelectUserType('professional')}
            variant="outline"
            className="w-full border-medical-300 text-medical-600 hover:bg-medical-50 h-12"
          >
            <UserCheck className="w-5 h-5 mr-2" />
            Acceso Portal Profesional
          </Button>
          
          <div className="mt-4 p-3 bg-gray-50 rounded-lg text-sm text-gray-600">
            <p className="font-medium text-gray-700 mb-1">💡 Información:</p>
            <p><strong>Administrador:</strong> Gestión completa de la clínica</p>
            <p><strong>Profesional:</strong> Acceso a pacientes y consultas</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );

  return (
    <>
      {!isAuthenticated ? (
        <>
          {authMode === 'selector' && renderLoginSelector()}
          {authMode === 'clinic-login' && (
            <LoginForm onLogin={handleClinicLogin} onBackToSelector={handleBackToSelector} />
          )}
          {authMode === 'professional-login' && (
            <ProfessionalLoginForm onLogin={handleProfessionalLogin} onBackToClinic={handleBackToSelector} />
          )}
        </>
      ) : (
        <>
          {userType === 'clinic' && clinic && (
            <DashboardLayout clinic={clinic} onLogout={handleLogout} />
          )}
          {userType === 'professional' && professional && (
            <ProfessionalDashboard onLogout={handleLogout} />
          )}
        </>
      )}
    </>
  );
};

export default Index;