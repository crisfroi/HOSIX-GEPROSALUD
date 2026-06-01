import React from 'react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { TooltipProvider } from '@/components/ui/tooltip'
import { Toaster } from '@/components/ui/toaster'
import { ToastProvider as ToastStoreProvider } from '@/hooks/use-toast'

import HosixLogin from '@/pages/Hosix/HosixLogin'
import HosixLayout from '@/components/hosix/HosixLayout'
import HosixDashboard from '@/pages/Hosix/HosixDashboard'
import Pacientes from '@/pages/Hosix/Pacientes'
import Epidemiologia from '@/pages/Hosix/Epidemiologia'

const queryClient = new QueryClient()

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ToastStoreProvider>
        <TooltipProvider>
          <Toaster />
          <BrowserRouter>
          <Routes>
            <Route path="/hosix/login" element={<HosixLogin />} />
            <Route path="/hosix" element={<HosixLayout />}>
              <Route index element={<HosixDashboard />} />
              <Route path="pacientes" element={<Pacientes />} />
              <Route path="epidemiologia" element={<Epidemiologia />} />
            </Route>
          </Routes>
          </BrowserRouter>
        </TooltipProvider>
      </ToastStoreProvider>
    </QueryClientProvider>
  )
}

export default App
