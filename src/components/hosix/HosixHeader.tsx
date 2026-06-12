import { Menu, Search, User } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { NotificationBell } from '@/components/NotificationBell';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

interface HosixHeaderProps {
  onToggleSidebar: () => void;
  sidebarOpen: boolean;
}

const HosixHeader: React.FC<HosixHeaderProps> = ({ onToggleSidebar }) => {
  return (
    <header className="bg-white border-b border-sermed-blue/10 px-6 py-4 flex items-center justify-between shadow-sm">
      {/* Left: Toggle & Search */}
      <div className="flex items-center gap-4 flex-1">
        <Button
          variant="ghost"
          size="icon"
          onClick={onToggleSidebar}
          className="text-sermed-blue hover:bg-sermed-blue/10"
        >
          <Menu className="w-5 h-5" />
        </Button>

        {/* Search Bar */}
        <div className="relative flex-1 max-w-md hidden sm:block">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-sermed-blue/50" />
          <Input
            type="search"
            placeholder="Buscar paciente, cita, urgencia..."
            className="pl-10 bg-sermed-blue/5 border-sermed-blue/20 focus:border-sermed-blue"
          />
        </div>
      </div>

      {/* Right: Notifications & User */}
      <div className="flex items-center gap-4">
        {/* Notifications Bell */}
        <NotificationBell />

        {/* User Menu */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="text-sermed-blue hover:bg-sermed-blue/10">
              <User className="w-5 h-5" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <div className="px-4 py-2 text-sm font-medium">
              <p>Usuario Sermed</p>
              <p className="text-xs text-sermed-blue/60">usuario@sermed.logistic</p>
            </div>
            <DropdownMenuSeparator />
            <DropdownMenuItem>Mi Perfil</DropdownMenuItem>
            <DropdownMenuItem>Cambiar Contraseña</DropdownMenuItem>
            <DropdownMenuItem>Preferencias</DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem className="text-red-600">Cerrar Sesión</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
};

export default HosixHeader;
