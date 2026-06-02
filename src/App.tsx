import React from 'react'
import { QueryClientProvider } from '@tanstack/react-query'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { TooltipProvider } from '@/components/ui/tooltip'
import { Toaster } from '@/components/ui/toaster'
import { queryClient } from '@/lib/queryClient'

import HosixLogin from '@/pages/Hosix/HosixLogin'
import HosixLayout from '@/components/hosix/HosixLayout'
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

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <BrowserRouter>
          <Routes>
            <Route path="/hosix/login" element={<HosixLogin />} />
            <Route path="/hosix" element={<HosixLayout />}>
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
            </Route>
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
  )
}

export default App
