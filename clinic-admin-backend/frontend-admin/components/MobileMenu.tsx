import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Menu, X, LogOut, HelpCircle, MessageCircle } from 'lucide-react';
import { type ClinicUser } from '@/lib/clinicAuth';
import ThemeToggle from './ThemeToggle';

interface MobileMenuProps {
  clinic: ClinicUser;
  activeTab: string;
  onTabChange: (tab: string) => void;
  onLogout: () => void;
  whatsappConnected?: boolean;
  n8nConnected?: boolean;
}

export default function MobileMenu({ clinic, activeTab, onTabChange, onLogout, whatsappConnected = false, n8nConnected = false }: MobileMenuProps) {
  const [isOpen, setIsOpen] = useState(false);

  const menuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: '📊' },
    { id: 'connections', label: 'Conexiones', icon: '🔗' },
    { id: 'patients', label: 'Pacientes', icon: '👥' },
    { id: 'schedule', label: 'Agenda', icon: '📅' },
    { id: 'professionals', label: 'Profesionales', icon: '👨‍⚕️' },
    { id: 'whatsapp', label: 'WhatsApp', icon: '📱' },
  ];

  const handleTabChange = (tabId: string) => {
    onTabChange(tabId);
    setIsOpen(false);
  };

  const handleLogout = () => {
    setIsOpen(false);
    onLogout();
  };

  return (
    <>
      {/* Botón hamburguesa - solo visible en móvil */}
      <div className="block sm:hidden">
        <Button
          variant="outline"
          size="sm"
          onClick={() => setIsOpen(true)}
          className="p-2"
        >
          <Menu className="h-5 w-5" />
        </Button>
      </div>

      {/* Overlay y menú deslizante */}
      {isOpen && (
        <div className="fixed inset-0 z-50 sm:hidden">
          {/* Overlay oscuro */}
          <div 
            className="fixed inset-0 bg-black/50"
            onClick={() => setIsOpen(false)}
          />
          
          {/* Panel del menú */}
          <div className="fixed top-0 left-0 h-screen w-80 max-w-[85vw] bg-white dark:bg-gray-900 shadow-xl transform transition-transform duration-300 ease-in-out">
            <div className="flex flex-col h-full min-h-screen">
              {/* Header del menú */}
              <div className="flex items-center justify-between p-4 border-b border-gray-200 bg-gradient-to-r from-medical-500 to-medical-600">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center">
                    <span className="text-medical-600 font-bold text-lg">
                      {clinic.name_clinic.charAt(0)}
                    </span>
                  </div>
                  <div className="text-white">
                    <h2 className="font-semibold text-sm truncate">{clinic.name_clinic}</h2>
                    <p className="text-xs opacity-90 truncate">{clinic.suscriber}</p>
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setIsOpen(false)}
                  className="text-white hover:bg-white/20 p-1"
                >
                  <X className="h-5 w-5" />
                </Button>
              </div>

              {/* Área de navegación expandible */}
              <div className="flex-1 flex flex-col overflow-hidden">
                {/* Navegación principal */}
                <div className="flex-1 overflow-y-auto py-4">
                  <nav className="space-y-1 px-3">
                    {menuItems.map((item) => (
                      <button
                        key={item.id}
                        onClick={() => handleTabChange(item.id)}
                        className={`w-full flex items-center gap-3 px-4 py-3 text-left rounded-lg transition-all duration-200 ${
                          activeTab === item.id
                            ? 'bg-medical-50 dark:bg-medical-900/30 text-medical-700 dark:text-medical-300 border border-medical-200 dark:border-medical-700'
                            : 'text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800'
                        }`}
                      >
                        <span className="text-xl">{item.icon}</span>
                        <div className="flex items-center gap-2 flex-1">
                          <span className="font-medium">{item.label}</span>
                          {item.id === 'dashboard' && (
                            <span className="text-xs text-gray-500 dark:text-gray-400">(Inicio)</span>
                          )}
                        </div>
                        {activeTab === item.id && (
                          <div className="ml-auto w-2 h-2 bg-medical-500 rounded-full"></div>
                        )}
                      </button>
                    ))}
                  </nav>
                  
                  {/* Separador */}
                  <div className="my-4 mx-6 border-t border-gray-200 dark:border-gray-700"></div>

                  {/* Botón de Tema - Solo mobile */}
                  <div className="px-3 mb-3">
                    <div className="flex items-center gap-3 px-4 py-3 rounded-lg">
                      <span className="font-medium text-gray-700 dark:text-gray-300">Tema</span>
                      <div className="ml-auto">
                        <ThemeToggle />
                      </div>
                    </div>
                  </div>

                  {/* Contacto de soporte */}
                  <div className="px-3 mb-3">
                    <button
                      onClick={() => window.open('https://wa.me/5492604843883', '_blank')}
                      className="w-full flex items-center gap-3 px-4 py-3 text-left rounded-lg text-green-600 dark:text-green-400 hover:bg-green-50 dark:hover:bg-green-900/20 transition-all duration-200"
                    >
                      <HelpCircle className="h-5 w-5" />
                      <span className="font-medium">Contactar Soporte</span>
                      <MessageCircle className="h-4 w-4 ml-auto" />
                    </button>
                  </div>

                  {/* Botón de cerrar sesión */}
                  <div className="px-3 mb-4">
                    <button
                      onClick={handleLogout}
                      className="w-full flex items-center gap-3 px-4 py-3 text-left rounded-lg text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-all duration-200"
                    >
                      <LogOut className="h-5 w-5" />
                      <span className="font-medium">Cerrar Sesión</span>
                    </button>
                  </div>
                </div>
              </div>

              {/* Información de clínica y suscripción - Footer fijo */}
              <div className="flex-shrink-0 p-3 border-t border-gray-200 dark:border-gray-700 bg-gradient-to-r from-slate-50 to-slate-100 dark:from-slate-800 dark:to-slate-900">
                <div className="text-center">
                  <div className="text-xl mb-1">👋</div>
                  <h3 className="text-sm font-semibold text-gray-800 dark:text-gray-200 mb-1">
                    ¡Bienvenido, {clinic.suscriber}!
                  </h3>
                  <p className="text-xs text-gray-600 dark:text-gray-400 leading-relaxed mb-2">
                    Gestiona tu clínica desde cualquier lugar.
                  </p>
                  
                  {/* Estados de la clínica */}
                  <div className="space-y-1">
                    <div className="flex items-center justify-center gap-2">
                      <div className={`w-2 h-2 rounded-full ${
                        clinic.status_clinic === 'active' ? 'bg-green-500' : 'bg-red-500'
                      }`}></div>
                      <span className="text-xs text-gray-600 dark:text-gray-400">
                        Estado: {clinic.status_clinic === 'active' ? 'Activa' : 'Inactiva'}
                      </span>
                    </div>
                    
                    <div className="flex items-center justify-center gap-2">
                      <div className={`w-2 h-2 rounded-full ${
                        clinic.subcription ? 'bg-green-500' : 'bg-red-500'
                      }`}></div>
                      <span className="text-xs text-gray-600 dark:text-gray-400">
                        {clinic.subcription ? 'Suscripción activa' : 'Suscripción vencida'}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}