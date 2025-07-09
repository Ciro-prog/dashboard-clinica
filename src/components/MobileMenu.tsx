import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { Badge } from '@/components/ui/badge';

interface MobileMenuProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
  whatsappConnected: boolean;
  n8nConnected: boolean;
}

const MobileMenu = ({ activeTab, onTabChange, whatsappConnected, n8nConnected }: MobileMenuProps) => {
  const [isOpen, setIsOpen] = useState(false);

  const menuItems = [
    {
      id: 'dashboard',
      label: 'Dashboard',
      icon: '📊',
      description: 'Vista general del consultorio'
    },
    {
      id: 'connections',
      label: 'Conexiones',
      icon: '🔗',
      description: 'Estado de N8N y WhatsApp',
      badge: (!whatsappConnected || !n8nConnected) ? 'Offline' : 'Online',
      badgeColor: (!whatsappConnected || !n8nConnected) ? 'bg-red-500' : 'bg-green-500'
    },
    {
      id: 'patients',
      label: 'Pacientes',
      icon: '👥',
      description: 'Lista y consultas médicas'
    },
    {
      id: 'schedule',
      label: 'Agenda',
      icon: '📅',
      description: 'Horarios y citas del día'
    },
    {
      id: 'whatsapp',
      label: 'WhatsApp QR',
      icon: '📱',
      description: 'Código QR de conexión',
      badge: whatsappConnected ? 'Conectado' : 'Desconectado',
      badgeColor: whatsappConnected ? 'bg-green-500' : 'bg-slate-500'
    }
  ];

  const handleItemClick = (tabId: string) => {
    onTabChange(tabId);
    setIsOpen(false);
  };

  return (
    <Sheet open={isOpen} onOpenChange={setIsOpen}>
      <SheetTrigger asChild>
        <Button 
          variant="outline" 
          size="sm" 
          className="md:hidden flex items-center space-x-2 border-medical-200 hover:bg-medical-50"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
          </svg>
          <span>Menú</span>
        </Button>
      </SheetTrigger>
      <SheetContent side="left" className="w-80 p-0">
        <div className="flex flex-col h-full bg-white">
          {/* Header */}
          <div className="p-6 border-b border-slate-200 medical-gradient">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-white/20 rounded-lg flex items-center justify-center">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div>
                <h2 className="text-lg font-semibold text-white">Salud Inteligente</h2>
                <p className="text-sm text-white/80">Dashboard Médico</p>
              </div>
            </div>
          </div>

          {/* Menu Items */}
          <div className="flex-1 p-4 space-y-2">
            {menuItems.map((item) => (
              <button
                key={item.id}
                onClick={() => handleItemClick(item.id)}
                className={`w-full flex items-center justify-between p-4 rounded-lg transition-all duration-200 ${
                  activeTab === item.id
                    ? 'bg-medical-50 border-2 border-medical-200 text-medical-700'
                    : 'hover:bg-slate-50 border-2 border-transparent text-slate-700'
                }`}
              >
                <div className="flex items-center space-x-3">
                  <span className="text-2xl">{item.icon}</span>
                  <div className="text-left">
                    <div className="font-medium">{item.label}</div>
                    <div className="text-xs text-slate-500">{item.description}</div>
                  </div>
                </div>
                {item.badge && (
                  <Badge className={`${item.badgeColor} text-white text-xs`}>
                    {item.badge}
                  </Badge>
                )}
              </button>
            ))}
          </div>

          {/* Footer */}
          <div className="p-4 border-t border-slate-200 bg-slate-50">
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="text-slate-600">Estado del Sistema</span>
                <div className="flex space-x-1">
                  <div className={`w-2 h-2 rounded-full ${n8nConnected ? 'bg-green-500' : 'bg-red-500'}`}></div>
                  <div className={`w-2 h-2 rounded-full ${whatsappConnected ? 'bg-green-500' : 'bg-red-500'}`}></div>
                </div>
              </div>
              <div className="text-xs text-slate-500">
                N8N: {n8nConnected ? 'Online' : 'Offline'} • WhatsApp: {whatsappConnected ? 'Conectado' : 'Desconectado'}
              </div>
            </div>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
};

export default MobileMenu;