import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '@/app/supabase'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { AlertCircle, Phone, Lock, User, Calendar, FileText } from 'lucide-react'
import { toast } from 'sonner'

export default function PortalRegister() {
  const navigate = useNavigate()
  const [formData, setFormData] = useState({
    hcu: '',
    cedula: '',
    nombre_completo: '',
    telefono: '',
    password: '',
    confirmPassword: '',
    fecha_nacimiento: '',
  })
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
  }

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setIsLoading(true)

    try {
      // Validaciones
      if (!formData.hcu || !formData.cedula || !formData.nombre_completo || !formData.telefono || !formData.password) {
        throw new Error('Todos los campos son requeridos')
      }

      const telefonoLimpio = formData.telefono.replace(/\D/g, '')
      if (telefonoLimpio.length < 8) {
        throw new Error('Teléfono inválido (mínimo 8 dígitos)')
      }

      if (formData.password.length < 6) {
        throw new Error('Contraseña debe tener al menos 6 caracteres')
      }

      if (formData.password !== formData.confirmPassword) {
        throw new Error('Las contraseñas no coinciden')
      }

      // Verificar que el paciente existe en nodo_central
      const { data: paciente, error: searchError } = await supabase
        .from('portal_pacientes')
        .select('id')
        .eq('cedula', formData.cedula)
        .single()

      if (!searchError && paciente) {
        throw new Error('Este usuario ya está registrado')
      }

      // Crear usuario en Supabase Auth
      const { data: authData, error: signUpError } = await supabase.auth.signUp({
        email: `${telefonoLimpio}@hosix.local`,
        password: formData.password,
      })

      if (signUpError) {
        throw signUpError
      }

      if (!authData.user) {
        throw new Error('Error al crear usuario')
      }

      // Crear perfil en portal_pacientes
      const { error: insertError } = await supabase
        .from('portal_pacientes')
        .insert({
          id: authData.user.id,
          hcu: formData.hcu,
          cedula: formData.cedula,
          nombre_completo: formData.nombre_completo,
          telefono: telefonoLimpio,
          fecha_nacimiento: formData.fecha_nacimiento || null,
          email: authData.user.email,
        })

      if (insertError) {
        throw insertError
      }

      // Registrar acceso
      await supabase.from('portal_acceso_log').insert({
        usuario_id: authData.user.id,
        tipo_acceso: 'registro',
        ip_address: null,
      })

      toast.success('Registro exitoso. Redirigiendo...')
      setTimeout(() => navigate('/portal/login'), 1500)

    } catch (err: any) {
      console.error('Error en registro:', err)
      setError(err.message || 'Error al registrar')
      toast.error(err.message || 'Error al registrar')
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
          <h1 className="text-2xl font-bold text-gray-900">Crear Cuenta</h1>
          <p className="text-gray-600 mt-2">Accede a tu historial médico</p>
        </div>

        {/* Card Registro */}
        <Card>
          <CardHeader>
            <CardTitle>Registro de Usuario</CardTitle>
            <CardDescription>
              Completa tus datos para registrarte
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

            <form onSubmit={handleRegister} className="space-y-3">
              {/* HCU */}
              <div>
                <Label htmlFor="hcu">HCU (Historia Clínica Única)</Label>
                <div className="relative mt-1">
                  <FileText className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                  <Input
                    id="hcu"
                    name="hcu"
                    placeholder="HCU-0001-BN-2024-001"
                    value={formData.hcu}
                    onChange={handleChange}
                    className="pl-10"
                    disabled={isLoading}
                  />
                </div>
              </div>

              {/* Cédula */}
              <div>
                <Label htmlFor="cedula">Número de Cédula</Label>
                <div className="relative mt-1">
                  <User className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                  <Input
                    id="cedula"
                    name="cedula"
                    placeholder="00123456789"
                    value={formData.cedula}
                    onChange={handleChange}
                    className="pl-10"
                    disabled={isLoading}
                  />
                </div>
              </div>

              {/* Nombre Completo */}
              <div>
                <Label htmlFor="nombre_completo">Nombre Completo</Label>
                <div className="relative mt-1">
                  <User className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                  <Input
                    id="nombre_completo"
                    name="nombre_completo"
                    placeholder="Juan Pérez García"
                    value={formData.nombre_completo}
                    onChange={handleChange}
                    className="pl-10"
                    disabled={isLoading}
                  />
                </div>
              </div>

              {/* Teléfono */}
              <div>
                <Label htmlFor="telefono">Número de Teléfono</Label>
                <div className="relative mt-1">
                  <Phone className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                  <Input
                    id="telefono"
                    name="telefono"
                    type="tel"
                    placeholder="+240 222 123456"
                    value={formData.telefono}
                    onChange={handleChange}
                    className="pl-10"
                    disabled={isLoading}
                  />
                </div>
              </div>

              {/* Fecha Nacimiento */}
              <div>
                <Label htmlFor="fecha_nacimiento">Fecha de Nacimiento (Opcional)</Label>
                <div className="relative mt-1">
                  <Calendar className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                  <Input
                    id="fecha_nacimiento"
                    name="fecha_nacimiento"
                    type="date"
                    value={formData.fecha_nacimiento}
                    onChange={handleChange}
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
                    name="password"
                    type="password"
                    placeholder="••••••••"
                    value={formData.password}
                    onChange={handleChange}
                    className="pl-10"
                    disabled={isLoading}
                  />
                </div>
              </div>

              {/* Confirmar Contraseña */}
              <div>
                <Label htmlFor="confirmPassword">Confirmar Contraseña</Label>
                <div className="relative mt-1">
                  <Lock className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                  <Input
                    id="confirmPassword"
                    name="confirmPassword"
                    type="password"
                    placeholder="••••••••"
                    value={formData.confirmPassword}
                    onChange={handleChange}
                    className="pl-10"
                    disabled={isLoading}
                  />
                </div>
              </div>

              {/* Submit */}
              <Button 
                type="submit" 
                className="w-full bg-indigo-600 hover:bg-indigo-700 mt-4"
                disabled={isLoading}
              >
                {isLoading ? 'Registrando...' : 'Registrarse'}
              </Button>
            </form>

            {/* Link */}
            <div className="mt-6 border-t pt-4">
              <p className="text-sm text-gray-600 text-center">
                ¿Ya tienes cuenta?{' '}
                <button
                  onClick={() => navigate('/portal/login')}
                  className="text-indigo-600 hover:underline font-medium"
                >
                  Inicia sesión aquí
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
