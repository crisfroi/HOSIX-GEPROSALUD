import React, { useEffect } from 'react'
import { Navigate, useLocation } from 'react-router-dom'
import { useAuthStore } from '@/stores/authStore'

interface ProtectedRouteProps {
  children: React.ReactNode
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children }) => {
  const { isAuthenticated, isLoading, isInitialized, initialize } = useAuthStore()
  const location = useLocation()

  useEffect(() => {
    if (!isInitialized) {
      initialize().catch((err) => {
        console.error('Error inicializando auth en ruta protegida:', err)
      })
    }
  }, [initialize, isInitialized])

  if (!isInitialized || isLoading) {
    return (
      <div className="flex h-screen items-center justify-center bg-slate-50 text-slate-700">
        <div className="rounded-lg border border-slate-200 bg-white px-6 py-4 shadow-lg">
          <p className="font-medium">Validando sesión...</p>
        </div>
      </div>
    )
  }

  if (!isAuthenticated) {
    return <Navigate to="/hosix/login" state={{ from: location }} replace />
  }

  return <>{children}</>
}

export default ProtectedRoute
