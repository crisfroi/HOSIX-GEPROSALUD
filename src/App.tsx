import React from 'react'
import { QueryClientProvider } from '@tanstack/react-query'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { TooltipProvider } from '@/components/ui/tooltip'
import { Toaster } from '@/components/ui/toaster'
import { ToastProvider } from '@/hooks/use-toast'
import { NotificationProvider } from '@/contexts/NotificationContext'
import { NotificationToast } from '@/components/NotificationToast'
import { queryClient } from '@/lib/queryClient'

import HosixLogin from '@/pages/Hosix/HosixLogin'
import HosixLayout from '@/components/hosix/HosixLayout'
import ProtectedRoute from '@/components/hosix/ProtectedRoute'
import HosixDashboard from '@/pages/Hosix/HosixDashboard'
import Pacientes from '@/pages/Hosix/Pacientes'
import Epidemiologia from '@/pages/Hosix/Epidemiologia'
import Urgencias from '@/pages/Hosix/Urgencias'
import Hospitalizacion from '@/pages/Hosix/Hospitalizacion'
import Citas from '@/pages/Hosix/Citas'
import Quirofanos from '@/pages/Hosix/Quirofanos'
import Obstetricia from '@/pages/Hosix/Obstetricia'
import Medicos from '@/pages/Hosix/Medicos'
import Enfermeria from '@/pages/Hosix/Enfermeria'
import Laboratorio from '@/pages/Hosix/Laboratorio'
import Imagenologia from '@/pages/Hosix/Imagenologia'
import Facturacion from '@/pages/Hosix/Facturacion'
import Farmacia from '@/pages/Hosix/Farmacia'
import Prescripcion from '@/pages/Hosix/Prescripcion'
import Almacenes from '@/pages/Hosix/Almacenes'
import Configuracion from '@/pages/Hosix/Configuracion'
import SalaEspera from '@/pages/Hosix/SalaEspera'
import PantallasManager from '@/pages/Hosix/Pantallas'
import AdmisionCentral from '@/pages/Hosix/AdmisionCentral'
import CRED from '@/pages/Hosix/CRED'
import Cajas from '@/pages/Hosix/Cajas'
import Compras from '@/pages/Hosix/Compras'
import Interconsultas from '@/pages/Hosix/Interconsultas'
import Recobros from '@/pages/Hosix/Recobros'
import Suministros from '@/pages/Hosix/Suministros'
import BI from '@/pages/Hosix/BI'
import Kiosko from '@/pages/Hosix/Kiosko'

// Portal Routes
import PortalLogin from '@/pages/Portal/PortalLogin'
import PortalRegister from '@/pages/Portal/PortalRegister'
import PortalLayout from '@/pages/Portal/PortalLayout'
import ProtectedPortalRoute from '@/components/portal/ProtectedRoute'
import PortalDashboard from '@/pages/Portal/PortalDashboard'
import PortalHistorial from '@/pages/Portal/PortalHistorial'
import PortalResultados from '@/pages/Portal/PortalResultados'
import PortalCitas from '@/pages/Portal/PortalCitas'
import PortalRecetas from '@/pages/Portal/PortalRecetas'
import PortalPerfil from '@/pages/Portal/PortalPerfil'
import PortalContacto from '@/pages/Portal/PortalContacto'

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <ToastProvider>
          <NotificationProvider>
            <Toaster />
            <NotificationToast />
            <BrowserRouter>
              <Routes>
                <Route path="/" element={<Navigate to="/hosix/login" replace />} />
                <Route path="/hosix/login" element={<HosixLogin />} />
                <Route path="/hosix" element={<ProtectedRoute><HosixLayout /></ProtectedRoute>}>
                  <Route index element={<HosixDashboard />} />
                  <Route path="pacientes" element={<Pacientes />} />
                  <Route path="epidemiologia" element={<Epidemiologia />} />
                  <Route path="urgencias" element={<Urgencias />} />
                  <Route path="hospitalizacion" element={<Hospitalizacion />} />
                  <Route path="citas" element={<Citas />} />
                  <Route path="quirofanos" element={<Quirofanos />} />
                  <Route path="obstetricia" element={<Obstetricia />} />
                  <Route path="medicos" element={<Medicos />} />
                  <Route path="enfermeria" element={<Enfermeria />} />
                  <Route path="laboratorio" element={<Laboratorio />} />
                  <Route path="imagenologia" element={<Imagenologia />} />
                  <Route path="facturacion" element={<Facturacion />} />
                  <Route path="farmacia" element={<Farmacia />} />
                  <Route path="prescripcion" element={<Prescripcion />} />
                  <Route path="almacenes" element={<Almacenes />} />
                  <Route path="configuracion" element={<Configuracion />} />
                  <Route path="sala-espera" element={<SalaEspera />} />
                  <Route path="pantallas" element={<PantallasManager />} />
                  <Route path="admision-central" element={<AdmisionCentral />} />
                  <Route path="cred" element={<CRED />} />
                  <Route path="cajas" element={<Cajas />} />
                  <Route path="compras" element={<Compras />} />
                  <Route path="interconsultas" element={<Interconsultas />} />
                  <Route path="recobros" element={<Recobros />} />
                  <Route path="suministros" element={<Suministros />} />
                  <Route path="bi" element={<BI />} />
                  <Route path="kioscos" element={<Kiosko />} />
                </Route>

                {/* Portal Routes */}
                <Route path="/portal/login" element={<PortalLogin />} />
                <Route path="/portal/register" element={<PortalRegister />} />
                <Route path="/portal" element={<ProtectedPortalRoute><PortalLayout /></ProtectedPortalRoute>}>
                  <Route path="dashboard" element={<PortalDashboard />} />
                  <Route path="historial" element={<PortalHistorial />} />
                  <Route path="resultados" element={<PortalResultados />} />
                  <Route path="citas" element={<PortalCitas />} />
                  <Route path="recetas" element={<PortalRecetas />} />
                  <Route path="perfil" element={<PortalPerfil />} />
                  <Route path="contacto" element={<PortalContacto />} />
                </Route>
              </Routes>
            </BrowserRouter>
          </NotificationProvider>
        </ToastProvider>
      </TooltipProvider>
    </QueryClientProvider>
  )
}

export default App
