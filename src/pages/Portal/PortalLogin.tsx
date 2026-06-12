import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '@/app/supabase'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { AlertCircle, Phone, Lock } from 'lucide-react'
import { toast } from 'sonner'

export default function PortalLogin() {
  const navigate = useNavigate()
  const [telefono, setTelefono] = useState('')
  const [password, setPassword] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setIsLoading(true)

    try {
      // Validar datos
      if (!telefono || !password) {
        throw new Error('Teléfono y contraseña son requeridos')
      }

      // Validar formato de teléfono (solo dígitos, al menos 8)
      const telefonoLimpio = telefono.replace(/\D/g, '')
      if (telefonoLimpio.length < 8) {
        throw new Error('Teléfono inválido (mínimo 8 dígitos)')
      }

      if (password.length < 6) {
        throw new Error('Contraseña debe tener al menos 6 caracteres')
      }

      // Buscar usuario por teléfono
      const { data: paciente, error: searchError } = await supabase
        .from('portal_pacientes')
        .select('id, telefono')
        .eq('telefono', telefonoLimpio)
        .single()

      if (searchError || !paciente) {
        throw new Error('Usuario no encontrado. Verifica tu teléfono.')
      }

      // Intentar login con email de recuperación
      const { data, error: loginError } = await supabase.auth.signInWithPassword({
        email: `${telefonoLimpio}@hosix.local`,
        password,
      })

      if (loginError) {
        throw new Error('Teléfono o contraseña incorrectos')
      }

      if (!data.user) {
        throw new Error('Usuario no encontrado')
      }

      // Registrar acceso
      const { error: logError } = await supabase
        .from('portal_acceso_log')
        .insert({
          usuario_id: data.user.id,
          paciente_id: paciente.id,
          tipo_acceso: 'login',
          ip_address: null,
        })

      if (logError) {
        console.warn('No se pudo registrar acceso:', logError)
      }

      toast.success('Login exitoso')
      navigate('/portal/dashboard')

    } catch (err: any) {
      console.error('Error en login:', err)
      setError(err.message || 'Error al ingresar')
      toast.error(err.message || 'Error al ingresar')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo & Título */}
        <div className="text-center mb-8">
          <div className="text-4xl font-bold text-indigo-600 mb-2">HOSIX</div>
          <h1 className="text-2xl font-bold text-gray-900">Portal de Pacientes</h1>
          <p className="text-gray-600 mt-2">Accede a tu historial médico</p>
        </div>

        {/* Card Login */}
        <Card>
          <CardHeader>
            <CardTitle>Iniciar Sesión</CardTitle>
            <CardDescription>
              Ingresa con tu email y contraseña
            </CardDescription>
          </CardHeader>
          <CardContent>
            {error && (
              <Alert className="mb-4 border-red-200 bg-red-50">
                <AlertCircle className="h-4 w-4 text-red-600" />
                <AlertDescription className="text-red-700">
                  {error}
                </AlertDescription>
              </Alert>
            )}

            <form onSubmit={handleLogin} className="space-y-4">
              {/* Teléfono */}
              <div>
                <Label htmlFor="telefono">Número de Teléfono</Label>
                <div className="relative mt-1">
                  <Phone className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                  <Input
                    id="telefono"
                    type="tel"
                    placeholder="+240 222 123456 o 222123456"
                    value={telefono}
                    onChange={(e) => setTelefono(e.target.value)}
                    className="pl-10"
                    disabled={isLoading}
                  />
                </div>
              </div>

              {/* Contraseña */}
              <div>
                <Label htmlFor="password">Contraseña</Label>
                <div className="relative mt-1">
                  <Lock className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                  <Input
                    id="password"
                    type="password"
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="pl-10"
                    disabled={isLoading}
                  />
                </div>
              </div>

              {/* Submit */}
              <Button 
                type="submit" 
                className="w-full bg-indigo-600 hover:bg-indigo-700"
                disabled={isLoading}
              >
                {isLoading ? 'Ingresando...' : 'Ingresar'}
              </Button>
            </form>

            {/* Links */}
            <div className="mt-6 border-t pt-4">
              <p className="text-sm text-gray-600 text-center mb-2">
                ¿No tienes cuenta?{' '}
                <button
                  onClick={() => navigate('/portal/register')}
                  className="text-indigo-600 hover:underline font-medium"
                >
                  Regístrate aquí
                </button>
              </p>
              <p className="text-sm text-center">
                <button
                  onClick={() => navigate('/portal/forgot-password')}
                  className="text-gray-600 hover:text-indigo-600 underline"
                >
                  ¿Olvidaste tu contraseña?
                </button>
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Footer */}
        <div className="mt-6 text-center text-xs text-gray-600">
          <p>Portal seguro de acceso a historial médico</p>
          <p className="mt-1">© 2026 Sistema de Salud Guinea Ecuatorial</p>
        </div>
      </div>
    </div>
  )
}
