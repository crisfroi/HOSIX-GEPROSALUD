import React, { useState } from 'react'
import { Outlet, useNavigate } from 'react-router-dom'
import { supabase } from '@/app/supabase'
import { Button } from '@/components/ui/button'
import { 
  Menu, 
  X, 
  LogOut, 
  User, 
  LayoutDashboard, 
  FileText, 
  Calendar, 
  TestTube, 
  Pill,
  Download,
  MessageSquare,
  Bell
} from 'lucide-react'
import { toast } from 'sonner'

export default function PortalLayout() {
  const navigate = useNavigate()
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const [userMenu, setUserMenu] = useState(false)
  const [userData, setUserData] = useState<any>(null)

  React.useEffect(() => {
    loadUserData()
  }, [])

  const loadUserData = async () => {
    try {
      const { data: { user }, error } = await supabase.auth.getUser()
      
      if (user) {
        const { data: paciente } = await supabase
          .from('portal_pacientes')
          .select('nombre_completo, hcu')
          .eq('id', user.id)
          .single()

        if (paciente) {
          setUserData(paciente)
        }
      }
    } catch (error) {
      console.error('Error cargando datos del usuario:', error)
    }
  }

  const handleLogout = async () => {
    try {
      await supabase.auth.signOut()
      toast.success('Sesión cerrada')
      navigate('/portal/login', { replace: true })
    } catch (error: any) {
      toast.error('Error al cerrar sesión')
    }
  }

  const menuItems = [
    { icon: LayoutDashboard, label: 'Dashboard', path: '/portal/dashboard' },
    { icon: FileText, label: 'Historial Médico', path: '/portal/historial' },
    { icon: Calendar, label: 'Citas', path: '/portal/citas' },
    { icon: TestTube, label: 'Resultados', path: '/portal/resultados' },
    { icon: Pill, label: 'Recetas', path: '/portal/recetas' },
    { icon: Download, label: 'Documentos', path: '/portal/documentos' },
    { icon: MessageSquare, label: 'Contacto', path: '/portal/contacto' },
  ]

  return (
    <div className="flex h-screen bg-gray-100">
      {/* Sidebar */}
      <aside className={`${sidebarOpen ? 'w-64' : 'w-20'} bg-indigo-900 text-white transition-all duration-300 overflow-y-auto`}>
        <div className="p-4 flex items-center justify-between border-b border-indigo-700">
          {sidebarOpen && <h1 className="text-xl font-bold">HOSIX Portal</h1>}
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="hover:bg-indigo-800 p-2 rounded"
          >
            {sidebarOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>

        {/* Menú */}
        <nav className="p-4 space-y-2">
          {menuItems.map((item) => (
            <button
              key={item.path}
              onClick={() => navigate(item.path)}
              className="w-full flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-indigo-800 transition-colors"
              title={item.label}
            >
              <item.icon size={20} />
              {sidebarOpen && <span>{item.label}</span>}
            </button>
          ))}
        </nav>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Navbar */}
        <nav className="bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold text-gray-900">
              {userData?.nombre_completo || 'Mi Portal'}
            </h2>
            <p className="text-sm text-gray-600">HCU: {userData?.hcu}</p>
          </div>

          <div className="flex items-center gap-4">
            {/* Notificaciones */}
            <button className="relative p-2 hover:bg-gray-100 rounded-lg">
              <Bell size={20} className="text-gray-600" />
              <span className="absolute top-0 right-0 w-2 h-2 bg-red-500 rounded-full"></span>
            </button>

            {/* User Menu */}
            <div className="relative">
              <button
                onClick={() => setUserMenu(!userMenu)}
                className="p-2 hover:bg-gray-100 rounded-lg"
              >
                <User size={20} className="text-gray-600" />
              </button>

              {userMenu && (
                <div className="absolute right-0 mt-2 w-48 bg-white border border-gray-200 rounded-lg shadow-lg z-10">
                  <button
                    onClick={() => {
                      navigate('/portal/perfil')
                      setUserMenu(false)
                    }}
                    className="w-full text-left px-4 py-2 hover:bg-gray-100 text-sm"
                  >
                    Ver Perfil
                  </button>
                  <hr />
                  <button
                    onClick={handleLogout}
                    className="w-full text-left px-4 py-2 hover:bg-gray-100 text-red-600 text-sm flex items-center gap-2"
                  >
                    <LogOut size={16} />
                    Cerrar Sesión
                  </button>
                </div>
              )}
            </div>
          </div>
        </nav>

        {/* Content */}
        <main className="flex-1 overflow-auto">
          <div className="p-6">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  )
}
