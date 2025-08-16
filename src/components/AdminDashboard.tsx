import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Building2, 
  Users, 
  DollarSign, 
  Calendar, 
  Settings, 
  LogOut,
  Plus,
  Edit,
  Eye,
  Search,
  MoreVertical,
  TrendingUp,
  TrendingDown
} from 'lucide-react';
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

interface AdminUser {
  username: string;
  email: string;
  role: string;
}

interface AdminDashboardProps {
  user: AdminUser;
  onLogout: () => void;
}

interface DashboardStats {
  totalClinics: number;
  activeClinics: number;
  totalUsers: number;
  totalRevenue: number;
  monthlyGrowth: number;
}

interface Clinic {
  id: string;
  name: string;
  email: string;
  status: 'active' | 'inactive' | 'trial';
  plan: string;
  users: number;
  revenue: number;
  lastLogin: string;
}

export default function AdminDashboard({ user, onLogout }: AdminDashboardProps) {
  const [stats, setStats] = useState<DashboardStats>({
    totalClinics: 0,
    activeClinics: 0,
    totalUsers: 0,
    totalRevenue: 0,
    monthlyGrowth: 0
  });
  
  const [clinics, setClinics] = useState<Clinic[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedTab, setSelectedTab] = useState('overview');

  // Simulated data - replace with real API calls
  useEffect(() => {
    // Load dashboard stats
    setStats({
      totalClinics: 25,
      activeClinics: 22,
      totalUsers: 156,
      totalRevenue: 15420,
      monthlyGrowth: 12.5
    });

    // Load clinics
    setClinics([
      {
        id: '1',
        name: 'Clínica San Pedro',
        email: 'admin@sanpedro.com',
        status: 'active',
        plan: 'Premium',
        users: 12,
        revenue: 299,
        lastLogin: '2024-01-15'
      },
      {
        id: '2',
        name: 'Centro Médico Los Andes',
        email: 'info@losandes.com',
        status: 'trial',
        plan: 'Trial',
        users: 5,
        revenue: 0,
        lastLogin: '2024-01-14'
      }
    ]);
  }, []);

  const getStatusBadgeColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
      case 'trial': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200';
      case 'inactive': return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200';
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200';
    }
  };

  const filteredClinics = clinics.filter(clinic =>
    clinic.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    clinic.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-gray-900">
      {/* Header */}
      <header className="bg-gray-800 border-b border-gray-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-4">
              <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg"></div>
              <div>
                <h1 className="text-xl font-bold text-white">Panel de Administración</h1>
              </div>
            </div>
            
            <div className="flex items-center space-x-4">
              <span className="text-sm text-gray-300">
                Bienvenido, <span className="font-medium text-white">{user.username}</span>
              </span>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="sm" className="text-gray-300 hover:text-white hover:bg-gray-700">
                    <MoreVertical className="w-4 h-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="bg-gray-800 border-gray-700">
                  <DropdownMenuLabel className="text-gray-200">Mi Cuenta</DropdownMenuLabel>
                  <DropdownMenuSeparator className="bg-gray-700" />
                  <DropdownMenuItem className="text-gray-300 hover:bg-gray-700 hover:text-white">
                    <Settings className="w-4 h-4 mr-2" />
                    Configuración
                  </DropdownMenuItem>
                  <DropdownMenuSeparator className="bg-gray-700" />
                  <DropdownMenuItem 
                    onClick={onLogout}
                    className="text-red-400 hover:bg-red-900 hover:text-red-300"
                  >
                    <LogOut className="w-4 h-4 mr-2" />
                    Cerrar Sesión
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card className="bg-gray-800 border-gray-700">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-400">Total Clínicas</p>
                  <p className="text-2xl font-bold text-white">{stats.totalClinics}</p>
                  <p className="text-xs text-gray-500">{stats.activeClinics} activas</p>
                </div>
                <Building2 className="h-8 w-8 text-blue-500" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gray-800 border-gray-700">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-400">Total Usuarios</p>
                  <p className="text-2xl font-bold text-white">{stats.totalUsers}</p>
                  <p className="text-xs text-gray-500">Activos en el sistema</p>
                </div>
                <Users className="h-8 w-8 text-green-500" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gray-800 border-gray-700">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-400">Ingresos Mensuales</p>
                  <p className="text-2xl font-bold text-white">${stats.totalRevenue.toLocaleString()}</p>
                  <div className="flex items-center text-xs">
                    <TrendingUp className="w-3 h-3 text-green-500 mr-1" />
                    <span className="text-green-500">+{stats.monthlyGrowth}%</span>
                  </div>
                </div>
                <DollarSign className="h-8 w-8 text-yellow-500" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gray-800 border-gray-700">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-400">Soporte Activo</p>
                  <p className="text-2xl font-bold text-white">24/7</p>
                  <p className="text-xs text-gray-500">Sistema operativo</p>
                </div>
                <Calendar className="h-8 w-8 text-purple-500" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Clinics Management */}
        <Card className="bg-gray-800 border-gray-700">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-white">Gestión de Clínicas</CardTitle>
                <CardDescription className="text-gray-400">
                  Administra todas las clínicas registradas en el sistema
                </CardDescription>
              </div>
              <Button className="bg-blue-600 hover:bg-blue-700 text-white">
                <Plus className="w-4 h-4 mr-2" />
                Nueva Clínica
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {/* Search */}
            <div className="mb-6">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <input
                  type="text"
                  placeholder="Buscar clínicas..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 bg-gray-700 border border-gray-600 rounded-md text-white placeholder-gray-400 focus:outline-none focus:border-blue-500"
                />
              </div>
            </div>

            {/* Clinics Table */}
            <div className="space-y-4">
              {filteredClinics.map((clinic) => (
                <div key={clinic.id} className="flex items-center justify-between p-4 bg-gray-750 rounded-lg border border-gray-600">
                  <div className="flex-1">
                    <div className="flex items-center space-x-3">
                      <h4 className="font-medium text-white">{clinic.name}</h4>
                      <Badge className={getStatusBadgeColor(clinic.status)}>
                        {clinic.status}
                      </Badge>
                      <span className="text-sm text-gray-400">{clinic.plan}</span>
                    </div>
                    <p className="text-sm text-gray-400 mt-1">{clinic.email}</p>
                    <div className="flex items-center space-x-4 mt-2 text-xs text-gray-500">
                      <span>{clinic.users} usuarios</span>
                      <span>${clinic.revenue}/mes</span>
                      <span>Último acceso: {clinic.lastLogin}</span>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Button variant="ghost" size="sm" className="text-gray-400 hover:text-white hover:bg-gray-700">
                      <Eye className="w-4 h-4" />
                    </Button>
                    <Button variant="ghost" size="sm" className="text-gray-400 hover:text-white hover:bg-gray-700">
                      <Edit className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}