import { Link, useLocation, useNavigate } from 'react-router-dom';
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
import TurnoActivationButton from './turnos/TurnoActivationButton';
import { SermedLogo } from '@/components/SermedLogo';

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
  const navigate = useNavigate();
  const { user, logout } = useAuthStore();

  const handleLogout = async () => {
    await logout();
    navigate('/hosix/login');
  };

  const menuItems: MenuItem[] = [
    { label: 'Dashboard', icon: LayoutDashboard, path: '/hosix' },
    { label: 'Admisión Central', icon: Users, path: '/hosix/admision-central', roles: ['MEDICO', 'RECEPCIONISTA', 'DIRECTOR', 'SUPER_ADMINISTRADOR'] },
    { label: 'Pacientes', icon: Users, path: '/hosix/pacientes' },
    { label: 'Epidemiología', icon: Activity, path: '/hosix/epidemiologia', roles: ['MEDICO', 'DIRECTOR', 'SUPER_ADMINISTRADOR'] },
    { label: 'Urgencias', icon: AlertCircle, path: '/hosix/urgencias', roles: ['MEDICO', 'ENFERMERO', 'DIRECTOR', 'SUPER_ADMINISTRADOR'] },
    { label: 'Citas', icon: Calendar, path: '/hosix/citas', roles: ['RECEPCIONISTA', 'MEDICO', 'DIRECTOR', 'SUPER_ADMINISTRADOR'] },
    { label: 'Hospitalización', icon: Hospital, path: '/hosix/hospitalizacion', roles: ['MEDICO', 'ENFERMERO', 'DIRECTOR', 'SUPER_ADMINISTRADOR'] },
    { label: 'Quirófanos (ASIS 3.0)', icon: Zap, path: '/hosix/quirofanos', roles: ['MEDICO', 'DIRECTOR', 'SUPER_ADMINISTRADOR'] },
    { label: 'Obstetricia (ASIS 4.0)', icon: Baby, path: '/hosix/obstetricia', roles: ['MEDICO', 'ENFERMERO', 'DIRECTOR', 'SUPER_ADMINISTRADOR'] },
    { label: 'CRED (ASIS 5.0)', icon: Heart, path: '/hosix/cred', roles: ['MEDICO', 'ENFERMERO', 'DIRECTOR', 'SUPER_ADMINISTRADOR'] },
    { label: 'Médicos (ASIS 1.0)', icon: Stethoscope, path: '/hosix/medicos', roles: ['MEDICO', 'DIRECTOR', 'SUPER_ADMINISTRADOR'] },
    { label: 'Enfermería (ASIS 2.0)', icon: Heart, path: '/hosix/enfermeria', roles: ['ENFERMERO', 'DIRECTOR', 'SUPER_ADMINISTRADOR'] },
    { label: 'Laboratorio (ASIS 8.0)', icon: Microscope, path: '/hosix/laboratorio', roles: ['MEDICO', 'DIRECTOR', 'SUPER_ADMINISTRADOR'] },
    { label: 'Imagenología (ASIS 9.0)', icon: ImageIcon, path: '/hosix/imagenologia', roles: ['MEDICO', 'DIRECTOR', 'SUPER_ADMINISTRADOR'] },
    { label: 'Farmacia (ASIS 10.0)', icon: Pill, path: '/hosix/farmacia', roles: ['MEDICO', 'FARMACISTA', 'DIRECTOR', 'SUPER_ADMINISTRADOR'] },
    { label: 'Interconsultas (ASIS 11.0)', icon: Share2, path: '/hosix/interconsultas', roles: ['MEDICO', 'DIRECTOR', 'SUPER_ADMINISTRADOR'] },
    { label: 'Prescripción (CPOE)', icon: Pill, path: '/hosix/prescripcion', roles: ['MEDICO', 'DIRECTOR', 'SUPER_ADMINISTRADOR'] },
    { label: 'Facturación', icon: DollarSign, path: '/hosix/facturacion', roles: ['CONTADOR', 'CONTADOR_GENERAL', 'DIRECTOR', 'SUPER_ADMINISTRADOR'] },
    { label: 'Cajas', icon: Vault, path: '/hosix/cajas', roles: ['CAJERO', 'CONTADOR', 'DIRECTOR', 'SUPER_ADMINISTRADOR'] },
    { label: 'Recobros', icon: TrendingDown, path: '/hosix/recobros', roles: ['CONTADOR', 'CONTADOR_GENERAL', 'DIRECTOR', 'SUPER_ADMINISTRADOR'] },
    { label: 'Suministros', icon: Package, path: '/hosix/suministros', roles: ['ALMACEN', 'COMPRAS', 'DIRECTOR', 'SUPER_ADMINISTRADOR'] },
    { label: 'Almacenes', icon: Package, path: '/hosix/almacenes', roles: ['ALMACEN', 'COMPRAS', 'DIRECTOR', 'SUPER_ADMINISTRADOR'] },
    { label: 'Compras', icon: ShoppingCart, path: '/hosix/compras', roles: ['COMPRAS', 'DIRECTOR', 'SUPER_ADMINISTRADOR'] },
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
      } bg-gradient-to-b from-sermed-blue-dark to-sermed-blue text-white transition-all duration-300 flex flex-col`}
    >
      {/* Logo/Header */}
      <div className="p-4 border-b border-sermed-green/30">
        <div className="flex items-center justify-center h-12 bg-white rounded-lg shadow-md">
          <div className="flex items-center gap-2">
            <SermedLogo size="sm" />
            {isOpen && <span className="font-bold text-lg text-sermed-blue">SERMED</span>}
          </div>
        </div>
        {isOpen && user && (
          <div className="mt-3 text-xs text-white/90">
            <p className="truncate font-semibold">{user.nombre}</p>
            <p className="text-sermed-green text-xs font-medium">{user.rol}</p>
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
                      ? 'bg-sermed-green hover:bg-sermed-green'
                      : 'text-white/80 hover:bg-white/10'
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

      <Separator className="bg-sermed-green/30" />

      {/* Configuration Section */}
      <div className="p-4">
        <Link to="/hosix/configuracion">
          <Button
            variant="ghost"
            className="w-full justify-start text-white/80 hover:bg-white/10"
            title="Configuración"
          >
            <Settings className="w-5 h-5 flex-shrink-0" />
            {isOpen && <span className="ml-3">Configuración</span>}
          </Button>
        </Link>
      </div>

      {/* Logout */}
      <div className="p-4 border-t border-sermed-green/30">
        <div className="mb-3">
          <TurnoActivationButton />
        </div>
        <Button
          variant="ghost"
          className="w-full justify-start text-red-200 hover:bg-red-500/20"
          title="Cerrar sesión"
          onClick={handleLogout}
        >
          <LogOut className="w-5 h-5 flex-shrink-0" />
          {isOpen && <span className="ml-3">Salir</span>}
        </Button>
      </div>
    </aside>
  );
};

export default HosixSidebar;
