import React, { useState, useEffect } from 'react'
import { supabase } from '@/app/supabase'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { User, Phone, FileText, Heart, AlertCircle } from 'lucide-react'
import { toast } from 'sonner'

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
  contacto_emergencia: {
    nombre: string
    telefono: string
    relacion: string
  }
}

export default function PortalPerfil() {
  const [perfil, setPerfil] = useState<PerfilData | null>(null)
  const [isEditing, setIsEditing] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    loadPerfil()
  }, [])

  const loadPerfil = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser()

      if (user) {
        const { data: paciente } = await supabase
          .from('portal_pacientes')
          .select('*')
          .eq('id', user.id)
          .single()

        if (paciente) {
          setPerfil({
            nombre_completo: paciente.nombre_completo || '',
            cedula: paciente.cedula || '',
            hcu: paciente.hcu || '',
            telefono: paciente.telefono || '',
            email: paciente.email || '',
            fecha_nacimiento: paciente.fecha_nacimiento || '',
            genero: paciente.genero || '',
            tipo_sangre: paciente.tipo_sangre || '',
            alergias: paciente.alergias || [],
            condiciones_cronicas: paciente.condiciones_cronicas || [],
            contacto_emergencia: paciente.contacto_emergencia || { nombre: '', telefono: '', relacion: '' }
          })
        }
      }
    } catch (error) {
      console.error('Error cargando perfil:', error)
      toast.error('Error al cargar el perfil')
    } finally {
      setIsLoading(false)
    }
  }

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

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
          <p className="mt-4 text-gray-600">Cargando perfil...</p>
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
    <div className="space-y-6 max-w-2xl">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Mi Perfil</h1>
        <p className="text-gray-600 mt-2">
          Administra tu información personal y médica
        </p>
      </div>

      {/* Información Personal */}
      <Card>
        <CardHeader className="flex items-center justify-between">
          <div>
            <CardTitle>Información Personal</CardTitle>
            <CardDescription>Datos básicos de tu cuenta</CardDescription>
          </div>
          <Button
            variant="outline"
            onClick={() => setIsEditing(!isEditing)}
          >
            {isEditing ? 'Cancelar' : 'Editar'}
          </Button>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            {/* Nombre */}
            <div>
              <Label htmlFor="nombre">Nombre Completo</Label>
              <Input
                id="nombre"
                value={perfil.nombre_completo}
                onChange={(e) => setPerfil({ ...perfil, nombre_completo: e.target.value })}
                disabled={!isEditing}
              />
            </div>

            {/* Cédula */}
            <div>
              <Label htmlFor="cedula">Cédula</Label>
              <Input
                id="cedula"
                value={perfil.cedula}
                disabled
                className="opacity-75"
              />
            </div>

            {/* HCU */}
            <div>
              <Label htmlFor="hcu">HCU</Label>
              <Input
                id="hcu"
                value={perfil.hcu}
                disabled
                className="opacity-75"
              />
            </div>

            {/* Teléfono */}
            <div>
              <Label htmlFor="telefono">Teléfono</Label>
              <Input
                id="telefono"
                value={perfil.telefono}
                onChange={(e) => setPerfil({ ...perfil, telefono: e.target.value })}
                disabled={!isEditing}
              />
            </div>

            {/* Email */}
            <div>
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={perfil.email}
                onChange={(e) => setPerfil({ ...perfil, email: e.target.value })}
                disabled={!isEditing}
              />
            </div>

            {/* Fecha Nacimiento */}
            <div>
              <Label htmlFor="fecha">Fecha de Nacimiento</Label>
              <Input
                id="fecha"
                type="date"
                value={perfil.fecha_nacimiento}
                onChange={(e) => setPerfil({ ...perfil, fecha_nacimiento: e.target.value })}
                disabled={!isEditing}
              />
            </div>
          </div>

          {isEditing && (
            <Button 
              onClick={handleSave}
              disabled={isSaving}
              className="w-full bg-indigo-600 hover:bg-indigo-700"
            >
              {isSaving ? 'Guardando...' : 'Guardar Cambios'}
            </Button>
          )}
        </CardContent>
      </Card>

      {/* Información Médica */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Heart className="h-5 w-5 text-red-600" />
            Información Médica
          </CardTitle>
          <CardDescription>Datos relevantes para tu atención médica</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Tipo de Sangre</Label>
              <Input
                value={perfil.tipo_sangre}
                onChange={(e) => setPerfil({ ...perfil, tipo_sangre: e.target.value })}
                disabled={!isEditing}
              />
            </div>

            <div>
              <Label>Género</Label>
              <Input
                value={perfil.genero}
                onChange={(e) => setPerfil({ ...perfil, genero: e.target.value })}
                disabled={!isEditing}
              />
            </div>
          </div>

          {/* Alergias */}
          <div>
            <Label>Alergias (Separadas por comas)</Label>
            <Input
              value={perfil.alergias.join(', ')}
              onChange={(e) => setPerfil({ 
                ...perfil, 
                alergias: e.target.value.split(',').map(a => a.trim())
              })}
              disabled={!isEditing}
              placeholder="Penicilina, Mariscos, ..."
            />
          </div>

          {/* Condiciones Crónicas */}
          <div>
            <Label>Condiciones Crónicas (Separadas por comas)</Label>
            <Input
              value={perfil.condiciones_cronicas.join(', ')}
              onChange={(e) => setPerfil({ 
                ...perfil, 
                condiciones_cronicas: e.target.value.split(',').map(c => c.trim())
              })}
              disabled={!isEditing}
              placeholder="Diabetes, Hipertensión, ..."
            />
          </div>

          {isEditing && (
            <Button 
              onClick={handleSave}
              disabled={isSaving}
              className="w-full bg-indigo-600 hover:bg-indigo-700"
            >
              {isSaving ? 'Guardando...' : 'Guardar Cambios'}
            </Button>
          )}
        </CardContent>
      </Card>

      {/* Contacto de Emergencia */}
      <Card>
        <CardHeader>
          <CardTitle>Contacto de Emergencia</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label>Nombre</Label>
            <Input
              value={perfil.contacto_emergencia.nombre}
              onChange={(e) => setPerfil({
                ...perfil,
                contacto_emergencia: { ...perfil.contacto_emergencia, nombre: e.target.value }
              })}
              disabled={!isEditing}
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Teléfono</Label>
              <Input
                value={perfil.contacto_emergencia.telefono}
                onChange={(e) => setPerfil({
                  ...perfil,
                  contacto_emergencia: { ...perfil.contacto_emergencia, telefono: e.target.value }
                })}
                disabled={!isEditing}
              />
            </div>
            <div>
              <Label>Relación</Label>
              <Input
                value={perfil.contacto_emergencia.relacion}
                onChange={(e) => setPerfil({
                  ...perfil,
                  contacto_emergencia: { ...perfil.contacto_emergencia, relacion: e.target.value }
                })}
                disabled={!isEditing}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Seguridad */}
      <Card>
        <CardHeader>
          <CardTitle>Seguridad</CardTitle>
          <CardDescription>Opciones de seguridad de tu cuenta</CardDescription>
        </CardHeader>
        <CardContent className="space-y-2">
          <Button variant="outline" className="w-full">
            Cambiar Contraseña
          </Button>
          <Button variant="outline" className="w-full">
            Cerrar Todas las Sesiones
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}
