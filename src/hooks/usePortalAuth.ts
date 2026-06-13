import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '@/app/supabase'

export interface PortalPaciente {
  id: string
  nombre_completo: string
  hcu: string
  telefono: string
  genero?: string
  fecha_nacimiento?: string
  centro_salud_id?: string
  alergias?: any
  condiciones_cronicas?: any
  tipo_sangre?: string
  contacto_emergencia?: string
  estado?: string
}

interface UsePortalAuthReturn {
  paciente: PortalPaciente | null
  isLoading: boolean
  error: string | null
  logout: () => Promise<void>
}

/**
 * Hook reutilizable para autenticación y carga de datos del paciente en el portal
 * 
 * Maneja:
 * - Verificación de sesión
 * - Carga de datos del paciente
 * - Logout
 * - Redirección si no autenticado
 */
export function usePortalAuth(): UsePortalAuthReturn {
  const navigate = useNavigate()
  const [paciente, setPaciente] = useState<PortalPaciente | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    loadPatientData()
  }, [])

  const loadPatientData = async () => {
    try {
      // Obtener usuario autenticado
      const { data: { user }, error: authError } = await supabase.auth.getUser()

      if (authError || !user) {
        navigate('/portal/login')
        return
      }

      // Cargar datos del paciente
      const { data: pacienteData, error: patientError } = await supabase
        .from('portal_pacientes')
        .select('*')
        .eq('id', user.id)
        .single()

      if (patientError) {
        setError('No se pudo cargar los datos del paciente')
        console.error('Error cargando paciente:', patientError)
        return
      }

      setPaciente(pacienteData)
      setError(null)
    } catch (err: any) {
      setError(err.message || 'Error desconocido')
      console.error('Error en loadPatientData:', err)
    } finally {
      setIsLoading(false)
    }
  }

  const logout = async () => {
    try {
      await supabase.auth.signOut()
      navigate('/portal/login', { replace: true })
    } catch (err) {
      console.error('Error al cerrar sesión:', err)
      throw err
    }
  }

  return {
    paciente,
    isLoading,
    error,
    logout
  }
}
