import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Hospital, Lock, User } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { useProfesionalAuth } from '@/hooks/useProfesionalAuth'

const ProfesionalLogin: React.FC = () => {
  const navigate = useNavigate()
  const { loginProfesional, isLoading, error, profesionalSession, cambiarContrasena } =
    useProfesionalAuth()

  const [idProfesional, setIdProfesional] = useState('')
  const [password, setPassword] = useState('')
  const [showChangePassword, setShowChangePassword] = useState(false)
  const [passwordAnterior, setPasswordAnterior] = useState('')
  const [passwordNueva, setPasswordNueva] = useState('')
  const [passwordNuevaRepetida, setPasswordNuevaRepetida] = useState('')
  const [changePasswordError, setChangePasswordError] = useState('')
  const [changePasswordLoading, setChangePasswordLoading] = useState(false)

  // Redirigir si ya está autenticado
  useEffect(() => {
    if (profesionalSession) {
      if (profesionalSession.cambio_password_requerido) {
        setShowChangePassword(true)
      } else {
        navigate('/hosix')
      }
    }
  }, [profesionalSession, navigate])

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!idProfesional || !password) {
      return
    }

    const result = await loginProfesional(idProfesional, password)

    if (result.success) {
      if (result.requiresPasswordChange) {
        setShowChangePassword(true)
        // Limpiar campos de login
        setPassword('')
      } else {
        navigate('/hosix')
      }
    }
  }

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault()
    setChangePasswordError('')

    // Validaciones
    if (!passwordAnterior || !passwordNueva || !passwordNuevaRepetida) {
      setChangePasswordError('Todos los campos son requeridos')
      return
    }

    if (passwordNueva !== passwordNuevaRepetida) {
      setChangePasswordError('Las contraseñas nuevas no coinciden')
      return
    }

    if (passwordNueva.length < 8) {
      setChangePasswordError('La contraseña debe tener al menos 8 caracteres')
      return
    }

    if (passwordAnterior === passwordNueva) {
      setChangePasswordError('La nueva contraseña debe ser diferente a la actual')
      return
    }

    setChangePasswordLoading(true)

    try {
      if (!profesionalSession) {
        throw new Error('Sesión no encontrada')
      }

      const success = await cambiarContrasena(
        profesionalSession.usuario_id,
        passwordAnterior,
        passwordNueva
      )

      if (success) {
        // Limpiar formulario
        setPasswordAnterior('')
        setPasswordNueva('')
        setPasswordNuevaRepetida('')
        setShowChangePassword(false)
        // Redirigir
        navigate('/hosix')
      }
    } catch (err) {
      setChangePasswordError(err instanceof Error ? err.message : 'Error desconocido')
    } finally {
      setChangePasswordLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-900 to-emerald-800 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="flex justify-center mb-4">
            <div className="bg-white rounded-lg p-3">
              <Hospital className="w-8 h-8 text-emerald-900" />
            </div>
          </div>
          <h1 className="text-3xl font-bold text-white">HOSIX</h1>
          <p className="text-emerald-100 mt-2">Portal de Profesionales Sanitarios</p>
        </div>

        {/* Tabs para login vs cambio de contraseña */}
        {!showChangePassword ? (
          <Card className="border-0 shadow-xl">
            <CardHeader>
              <CardTitle>Iniciar Sesión</CardTitle>
              <CardDescription>
                Ingrese su ID de profesional y contraseña para acceder
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleLogin} className="space-y-4">
                {error && (
                  <Alert variant="destructive">
                    <AlertDescription>{error}</AlertDescription>
                  </Alert>
                )}

                {/* ID Profesional */}
                <div className="space-y-2">
                  <label htmlFor="idProfesional" className="text-sm font-medium">
                    ID de Profesional
                  </label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <Input
                      id="idProfesional"
                      type="text"
                      placeholder="Ej: MED-2025-001"
                      value={idProfesional}
                      onChange={(e) => setIdProfesional(e.target.value)}
                      className="pl-10"
                      disabled={isLoading}
                      autoComplete="username"
                    />
                  </div>
                </div>

                {/* Password */}
                <div className="space-y-2">
                  <label htmlFor="password" className="text-sm font-medium">
                    Contraseña
                  </label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <Input
                      id="password"
                      type="password"
                      placeholder="Ingrese su contraseña"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="pl-10"
                      disabled={isLoading}
                      autoComplete="current-password"
                    />
                  </div>
                </div>

                {/* Login Button */}
                <Button
                  type="submit"
                  className="w-full bg-emerald-600 hover:bg-emerald-700"
                  disabled={isLoading}
                >
                  {isLoading ? 'Iniciando sesión...' : 'Iniciar Sesión'}
                </Button>
              </form>

              {/* Información adicional */}
              <div className="mt-6 pt-6 border-t space-y-2 text-sm text-gray-600">
                <p>
                  ¿Es administrador? <a href="/hosix/login" className="text-blue-600 hover:underline">
                    Ir a login de administrador
                  </a>
                </p>
                <p className="text-xs text-gray-500">
                  Su ID de profesional le será proporcionado por el director del centro
                </p>
              </div>
            </CardContent>
          </Card>
        ) : (
          /* Formulario de cambio de contraseña */
          <Card className="border-0 shadow-xl">
            <CardHeader>
              <CardTitle>Cambiar Contraseña</CardTitle>
              <CardDescription>
                Se requiere cambiar su contraseña en el primer acceso
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="mb-4 p-4 bg-amber-50 border border-amber-200 rounded-lg">
                <p className="text-sm text-amber-900">
                  <strong>Nota:</strong> La contraseña actual fue generada automáticamente. Por
                  seguridad, debe cambiarla ahora.
                </p>
              </div>

              <form onSubmit={handleChangePassword} className="space-y-4">
                {changePasswordError && (
                  <Alert variant="destructive">
                    <AlertDescription>{changePasswordError}</AlertDescription>
                  </Alert>
                )}

                {/* Contraseña anterior */}
                <div className="space-y-2">
                  <label htmlFor="passwordAnterior" className="text-sm font-medium">
                    Contraseña Actual
                  </label>
                  <Input
                    id="passwordAnterior"
                    type="password"
                    placeholder="Ingrese su contraseña actual"
                    value={passwordAnterior}
                    onChange={(e) => setPasswordAnterior(e.target.value)}
                    disabled={changePasswordLoading}
                  />
                </div>

                {/* Contraseña nueva */}
                <div className="space-y-2">
                  <label htmlFor="passwordNueva" className="text-sm font-medium">
                    Contraseña Nueva
                  </label>
                  <Input
                    id="passwordNueva"
                    type="password"
                    placeholder="Ingrese su nueva contraseña"
                    value={passwordNueva}
                    onChange={(e) => setPasswordNueva(e.target.value)}
                    disabled={changePasswordLoading}
                  />
                </div>

                {/* Confirmar nueva contraseña */}
                <div className="space-y-2">
                  <label htmlFor="passwordNuevaRepetida" className="text-sm font-medium">
                    Confirmar Nueva Contraseña
                  </label>
                  <Input
                    id="passwordNuevaRepetida"
                    type="password"
                    placeholder="Confirme su nueva contraseña"
                    value={passwordNuevaRepetida}
                    onChange={(e) => setPasswordNuevaRepetida(e.target.value)}
                    disabled={changePasswordLoading}
                  />
                </div>

                {/* Requerimientos */}
                <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg text-sm text-blue-900">
                  <p className="font-medium mb-2">Requerimientos de contraseña:</p>
                  <ul className="list-disc list-inside space-y-1">
                    <li>Mínimo 8 caracteres</li>
                    <li>Debe ser diferente a la contraseña actual</li>
                  </ul>
                </div>

                {/* Submit Button */}
                <Button
                  type="submit"
                  className="w-full bg-emerald-600 hover:bg-emerald-700"
                  disabled={changePasswordLoading}
                >
                  {changePasswordLoading ? 'Cambiando contraseña...' : 'Cambiar Contraseña'}
                </Button>
              </form>
            </CardContent>
          </Card>
        )}

        {/* Footer */}
        <div className="mt-6 text-center text-emerald-100 text-sm">
          <p>Sistema de Gestión Hospitalaria - GEPROSTEC</p>
          <p className="text-xs mt-2 opacity-75">© 2025 Todos los derechos reservados</p>
        </div>
      </div>
    </div>
  )
}

export default ProfesionalLogin
