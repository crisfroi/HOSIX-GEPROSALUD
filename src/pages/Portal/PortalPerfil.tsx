import React, { useState } from 'react'
import { usePortalAuth } from '@/hooks/usePortalAuth'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Heart, AlertCircle, Loader } from 'lucide-react'
import { toast } from 'sonner'
import { supabase } from '@/app/supabase'

interface PerfilData {
  nombre_completo: string
  cedula: string
  hcu: string
  telefono: string
  email: string
  fecha_nacimiento: string
  genero: string
  tipo_sangre: string
  alergias: string[]
  condiciones_cronicas: string[]
}

export default function PortalPerfil() {
  const { paciente, isLoading: authLoading } = usePortalAuth()
  const [isEditing, setIsEditing] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [perfil, setPerfil] = useState<PerfilData | null>(
    paciente ? {
      nombre_completo: paciente.nombre_completo || '',
      cedula: paciente.cedula || '',
      hcu: paciente.hcu || '',
      telefono: paciente.telefono || '',
      email: paciente.email || '',
      fecha_nacimiento: paciente.fecha_nacimiento || '',
      genero: paciente.genero || '',
      tipo_sangre: paciente.tipo_sangre || '',
      alergias: paciente.alergias || [],
      condiciones_cronicas: paciente.condiciones_cronicas || []
    } : null
  )

  const handleSave = async () => {
    setIsSaving(true)
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user || !perfil) return

      const { error } = await supabase
        .from('portal_pacientes')
        .update(perfil)
        .eq('id', user.id)

      if (error) throw error
      toast.success('Perfil actualizado correctamente')
      setIsEditing(false)
    } catch (error: any) {
      toast.error('Error al guardar perfil')
    } finally {
      setIsSaving(false)
    }
  }

  if (authLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <Loader className="h-12 w-12 animate-spin mx-auto mb-3 text-indigo-600" />
          <p className="text-gray-600">Cargando perfil...</p>
        </div>
      </div>
    )
  }

  if (!perfil) {
    return (
      <div className="text-center">
        <p className="text-gray-600">Error cargando perfil</p>
      </div>
    )
  }

  return (
    <div className="space-y-4 sm:space-y-6 max-w-2xl">
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Mi Perfil</h1>
        <p className="text-sm sm:text-base text-gray-600 mt-2">
          Información personal y médica
        </p>
      </div>

      {/* Información Personal */}
      <Card>
        <CardHeader className="flex flex-col sm:flex-row sm:items-center sm:justify-between pb-3">
          <div>
            <CardTitle className="text-base sm:text-lg">Información Personal</CardTitle>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setIsEditing(!isEditing)}
            className="mt-3 sm:mt-0 text-xs sm:text-sm"
          >
            {isEditing ? 'Cancelar' : 'Editar'}
          </Button>
        </CardHeader>
        <CardContent className="space-y-3 sm:space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
            {/* Nombre */}
            <div>
              <Label htmlFor="nombre" className="text-xs sm:text-sm">Nombre Completo</Label>
              <Input
                id="nombre"
                value={perfil.nombre_completo}
                onChange={(e) => setPerfil({ ...perfil, nombre_completo: e.target.value })}
                disabled={!isEditing}
                className="mt-1 text-xs sm:text-sm"
              />
            </div>

            {/* Cédula */}
            <div>
              <Label htmlFor="cedula" className="text-xs sm:text-sm">Cédula</Label>
              <Input
                id="cedula"
                value={perfil.cedula}
                disabled
                className="mt-1 text-xs sm:text-sm opacity-75"
              />
            </div>

            {/* HCU */}
            <div>
              <Label htmlFor="hcu" className="text-xs sm:text-sm">HCU</Label>
              <Input
                id="hcu"
                value={perfil.hcu}
                disabled
                className="mt-1 text-xs sm:text-sm opacity-75"
              />
            </div>

            {/* Teléfono */}
            <div>
              <Label htmlFor="telefono" className="text-xs sm:text-sm">Teléfono</Label>
              <Input
                id="telefono"
                value={perfil.telefono}
                onChange={(e) => setPerfil({ ...perfil, telefono: e.target.value })}
                disabled={!isEditing}
                className="mt-1 text-xs sm:text-sm"
              />
            </div>

            {/* Email */}
            <div>
              <Label htmlFor="email" className="text-xs sm:text-sm">Email</Label>
              <Input
                id="email"
                type="email"
                value={perfil.email}
                onChange={(e) => setPerfil({ ...perfil, email: e.target.value })}
                disabled={!isEditing}
                className="mt-1 text-xs sm:text-sm"
              />
            </div>

            {/* Fecha Nacimiento */}
            <div>
              <Label htmlFor="fecha" className="text-xs sm:text-sm">Fecha de Nacimiento</Label>
              <Input
                id="fecha"
                type="date"
                value={perfil.fecha_nacimiento}
                onChange={(e) => setPerfil({ ...perfil, fecha_nacimiento: e.target.value })}
                disabled={!isEditing}
                className="mt-1 text-xs sm:text-sm"
              />
            </div>
          </div>

          {isEditing && (
            <Button
              onClick={handleSave}
              disabled={isSaving}
              className="w-full bg-indigo-600 hover:bg-indigo-700 text-xs sm:text-sm"
            >
              {isSaving ? 'Guardando...' : 'Guardar Cambios'}
            </Button>
          )}
        </CardContent>
      </Card>

      {/* Información Médica */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base sm:text-lg flex items-center gap-2">
            <Heart className="h-4 w-4 sm:h-5 sm:w-5 text-red-600 flex-shrink-0" />
            Información Médica
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 sm:space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
            <div>
              <Label className="text-xs sm:text-sm">Tipo de Sangre</Label>
              <Input
                value={perfil.tipo_sangre}
                onChange={(e) => setPerfil({ ...perfil, tipo_sangre: e.target.value })}
                disabled={!isEditing}
                className="mt-1 text-xs sm:text-sm"
              />
            </div>

            <div>
              <Label className="text-xs sm:text-sm">Género</Label>
              <Input
                value={perfil.genero}
                onChange={(e) => setPerfil({ ...perfil, genero: e.target.value })}
                disabled={!isEditing}
                className="mt-1 text-xs sm:text-sm"
              />
            </div>
          </div>

          {/* Alergias */}
          <div>
            <Label className="text-xs sm:text-sm">Alergias</Label>
            <Input
              value={perfil.alergias.join(', ')}
              onChange={(e) => setPerfil({
                ...perfil,
                alergias: e.target.value.split(',').map(a => a.trim()).filter(a => a)
              })}
              disabled={!isEditing}
              placeholder="Penicilina, Mariscos..."
              className="mt-1 text-xs sm:text-sm"
            />
          </div>

          {/* Condiciones Crónicas */}
          <div>
            <Label className="text-xs sm:text-sm">Condiciones Crónicas</Label>
            <Input
              value={perfil.condiciones_cronicas.join(', ')}
              onChange={(e) => setPerfil({
                ...perfil,
                condiciones_cronicas: e.target.value.split(',').map(c => c.trim()).filter(c => c)
              })}
              disabled={!isEditing}
              placeholder="Diabetes, Hipertensión..."
              className="mt-1 text-xs sm:text-sm"
            />
          </div>

          {isEditing && (
            <Button
              onClick={handleSave}
              disabled={isSaving}
              className="w-full bg-indigo-600 hover:bg-indigo-700 text-xs sm:text-sm"
            >
              {isSaving ? 'Guardando...' : 'Guardar Cambios'}
            </Button>
          )}
        </CardContent>
      </Card>

      {/* Seguridad */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base sm:text-lg">Seguridad</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <Button variant="outline" className="w-full text-xs sm:text-sm">
            Cambiar Contraseña
          </Button>
          <Button variant="outline" className="w-full text-xs sm:text-sm">
            Cerrar Todas las Sesiones
          </Button>
        </CardContent>
      </Card>

      {/* Info */}
      <Card className="bg-amber-50 border-amber-200">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm sm:text-base flex items-center gap-2">
            <AlertCircle className="h-4 w-4 text-amber-600 flex-shrink-0" />
            Información Importante
          </CardTitle>
        </CardHeader>
        <CardContent className="text-xs sm:text-sm text-amber-900">
          <p>Tus datos están protegidos y encriptados. Los cambios se guardarán inmediatamente.</p>
        </CardContent>
      </Card>
    </div>
  )
}
