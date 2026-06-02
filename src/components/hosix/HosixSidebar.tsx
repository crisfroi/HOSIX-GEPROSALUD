import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import {
  LayoutDashboard,
  Users,
  AlertCircle,
  Calendar,
  Hospital,
  Stethoscope,
  Pill,
  Heart,
  DollarSign,
  BarChart3,
  Settings,
  LogOut,
  Vault,
  TrendingDown,
  Package,
  ShoppingCart,
  Zap,
  Baby,
  Microscope,
  ImageIcon,
  Share2,
  Activity,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { useAuthStore } from '@/stores/authStore';

interface HosixSidebarProps {
  isOpen: boolean;
}

interface MenuItem {
  label: string;
  icon: React.ComponentType<any>;
  path: string;
  roles?: string[]; // Si no se especifica, visible para todos
}

const HosixSidebar: React.FC<HosixSidebarProps> = ({ isOpen }) => {
  const location = useLocation();
  const { user } = useAuthStore();

  const menuItems: MenuItem[] = [
    { label: 'Dashboard', icon: LayoutDashboard, path: '/hosix' },
    { label: 'Admisión Central', icon: Users, path: '/hosix/admision', roles: ['MEDICO', 'RECEPCIONISTA', 'DIRECTOR'] },
    { label: 'Pacientes', icon: Users, path: '/hosix/pacientes' },
    { label: 'Epidemiología', icon: Activity, path: '/hosix/epidemiologia', roles: ['MEDICO', 'DIRECTOR', 'SUPER_ADMINISTRADOR'] },
    { label: 'Urgencias', icon: AlertCircle, path: '/hosix/urgencias', roles: ['MEDICO', 'ENFERMERO', 'DIRECTOR'] },
    { label: 'Citas', icon: Calendar, path: '/hosix/citas', roles: ['RECEPCIONISTA', 'MEDICO', 'DIRECTOR'] },
    { label: 'Hospitalización', icon: Hospital, path: '/hosix/hospitalizacion', roles: ['MEDICO', 'ENFERMERO', 'DIRECTOR'] },
    { label: 'Quirófanos (ASIS 3.0)', icon: Zap, path: '/hosix/quirofanos', roles: ['MEDICO', 'DIRECTOR'] },
    { label: 'Obstetricia (ASIS 4.0)', icon: Baby, path: '/hosix/obstetricia', roles: ['MEDICO', 'ENFERMERO', 'DIRECTOR'] },
    { label: 'CRED (ASIS 5.0)', icon: Heart, path: '/hosix/cred', roles: ['MEDICO', 'ENFERMERO', 'DIRECTOR'] },
    { label: 'Médicos (ASIS 1.0)', icon: Stethoscope, path: '/hosix/medicos', roles: ['MEDICO', 'DIRECTOR'] },
    { label: 'Enfermería (ASIS 2.0)', icon: Heart, path: '/hosix/enfermeria', roles: ['ENFERMERO', 'DIRECTOR'] },
    { label: 'Laboratorio (ASIS 8.0)', icon: Microscope, path: '/hosix/laboratorio', roles: ['MEDICO', 'DIRECTOR'] },
    { label: 'Imagenología (ASIS 9.0)', icon: ImageIcon, path: '/hosix/imagenologia', roles: ['MEDICO', 'DIRECTOR'] },
    { label: 'Farmacia (ASIS 10.0)', icon: Pill, path: '/hosix/farmacia', roles: ['MEDICO', 'FARMACISTA', 'DIRECTOR'] },
    { label: 'Interconsultas (ASIS 11.0)', icon: Share2, path: '/hosix/interconsultas', roles: ['MEDICO', 'DIRECTOR'] },
    { label: 'Prescripción (CPOE)', icon: Pill, path: '/hosix/prescripcion', roles: ['MEDICO', 'DIRECTOR'] },
    { label: 'Facturación', icon: DollarSign, path: '/hosix/facturacion', roles: ['CONTADOR', 'CONTADOR_GENERAL', 'DIRECTOR'] },
    { label: 'Cajas', icon: Vault, path: '/hosix/cajas', roles: ['CAJERO', 'CONTADOR', 'DIRECTOR'] },
    { label: 'Recobros', icon: TrendingDown, path: '/hosix/recobros', roles: ['CONTADOR', 'CONTADOR_GENERAL', 'DIRECTOR'] },
    { label: 'Suministros', icon: Package, path: '/hosix/suministros', roles: ['ALMACEN', 'COMPRAS', 'DIRECTOR'] },
    { label: 'Almacenes', icon: Package, path: '/hosix/almacenes', roles: ['ALMACEN', 'COMPRAS', 'DIRECTOR'] },
    { label: 'Compras', icon: ShoppingCart, path: '/hosix/compras', roles: ['COMPRAS', 'DIRECTOR'] },
    { label: 'BI & Reportes', icon: BarChart3, path: '/hosix/bi', roles: ['DIRECTOR', 'CONTADOR_GENERAL', 'SUPER_ADMINISTRADOR'] },
  ];

  // Filtrar items según rol del usuario
  const visibleItems = menuItems.filter((item) => {
    // Si el item no tiene roles especificados, mostrarlo a todos
    if (!item.roles) return true;
    // Si el usuario tiene uno de los roles requeridos, mostrar
    return item.roles.includes(user?.rol || '');
  });

  const isActive = (path: string) => location.pathname === path || location.pathname.startsWith(path + '/');

  return (
    <aside
      className={`${
        isOpen ? 'w-64' : 'w-20'
      } bg-gradient-to-b from-blue-900 to-blue-800 text-white transition-all duration-300 flex flex-col`}
    >
      {/* Logo/Header */}
      <div className="p-4 border-b border-blue-700">
        <div className="flex items-center justify-center h-12 bg-blue-800 rounded-lg">
          <Hospital className="w-6 h-6" />
          {isOpen && <span className="ml-2 font-bold text-lg">HOSIX</span>}
        </div>
        {isOpen && user && (
          <div className="mt-2 text-xs text-blue-200">
            <p className="truncate font-semibold">{user.nombre}</p>
            <p className="text-blue-300 text-xs">{user.rol}</p>
          </div>
        )}
      </div>

      {/* Navigation Menu */}
      <nav className="flex-1 overflow-y-auto py-4">
        <div className="space-y-2 px-2">
          {visibleItems.map((item) => {
            const Icon = item.icon;
            const active = isActive(item.path);
            return (
              <Link key={item.path} to={item.path}>
                <Button
                  variant={active ? 'default' : 'ghost'}
                  className={`w-full justify-start ${
                    active
                      ? 'bg-blue-600 hover:bg-blue-600'
                      : 'text-blue-100 hover:bg-blue-700'
                  }`}
                  title={item.label}
                >
                  <Icon className="w-5 h-5 flex-shrink-0" />
                  {isOpen && <span className="ml-3">{item.label}</span>}
                </Button>
              </Link>
            );
          })}
        </div>
      </nav>

      <Separator className="bg-blue-700" />

      {/* Configuration Section */}
      <div className="p-4">
        <Link to="/hosix/configuracion">
          <Button
            variant="ghost"
            className="w-full justify-start text-blue-100 hover:bg-blue-700"
            title="Configuración"
          >
            <Settings className="w-5 h-5 flex-shrink-0" />
            {isOpen && <span className="ml-3">Configuración</span>}
          </Button>
        </Link>
      </div>

      {/* Logout */}
      <div className="p-4 border-t border-blue-700">
        <Button
          variant="ghost"
          className="w-full justify-start text-red-300 hover:bg-red-900/30"
          title="Cerrar sesión"
        >
          <LogOut className="w-5 h-5 flex-shrink-0" />
          {isOpen && <span className="ml-3">Salir</span>}
        </Button>
      </div>
    </aside>
  );
};

export default HosixSidebar;

  const isActive = (path: string) => location.pathname === path || location.pathname.startsWith(path + '/');

  return (
    <aside
      className={`${
        isOpen ? 'w-64' : 'w-20'
      } bg-gradient-to-b from-blue-900 to-blue-800 text-white transition-all duration-300 flex flex-col`}
    >
      {/* Logo/Header */}
      <div className="p-4 border-b border-blue-700">
        <div className="flex items-center justify-center h-12 bg-blue-800 rounded-lg">
          <Hospital className="w-6 h-6" />
          {isOpen && <span className="ml-2 font-bold text-lg">HOSIX</span>}
        </div>
        {isOpen && user && (
          <div className="mt-2 text-xs text-blue-200">
            <p className="truncate font-semibold">{user.nombre}</p>
            <p className="text-blue-300 text-xs">{user.rol}</p>
          </div>
        )}
      </div>

      {/* Navigation Menu */}
      <nav className="flex-1 overflow-y-auto py-4">
        <div className="space-y-2 px-2">
          {visibleItems.map((item) => {
            const Icon = item.icon;
            const active = isActive(item.path);
            return (
              <Link key={item.path} to={item.path}>
                <Button
                  variant={active ? 'default' : 'ghost'}
                  className={`w-full justify-start ${
                    active
                      ? 'bg-blue-600 hover:bg-blue-600'
                      : 'text-blue-100 hover:bg-blue-700'
                  }`}
                  title={item.label}
                >
                  <Icon className="w-5 h-5 flex-shrink-0" />
                  {isOpen && <span className="ml-3">{item.label}</span>}
                </Button>
              </Link>
            );
          })}
        </div>
      </nav>

      <Separator className="bg-blue-700" />

      {/* Configuration Section */}
      <div className="p-4">
        <Link to="/hosix/configuracion">
          <Button
            variant="ghost"
            className="w-full justify-start text-blue-100 hover:bg-blue-700"
            title="Configuración"
          >
            <Settings className="w-5 h-5 flex-shrink-0" />
            {isOpen && <span className="ml-3">Configuración</span>}
          </Button>
        </Link>
      </div>

      {/* Logout */}
      <div className="p-4 border-t border-blue-700">
        <Button
          variant="ghost"
          className="w-full justify-start text-red-300 hover:bg-red-900/30"
          title="Cerrar sesión"
        >
          <LogOut className="w-5 h-5 flex-shrink-0" />
          {isOpen && <span className="ml-3">Salir</span>}
        </Button>
      </div>
    </aside>
  );
};

export default HosixSidebar;
