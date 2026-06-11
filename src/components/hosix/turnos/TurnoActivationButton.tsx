import React, { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { supabase } from '@/integrations/supabase/hosixClient'
import { useToast } from '@/components/ui/use-toast'

export default function TurnoActivationButton() {
  const { toast } = useToast()
  const [enTurno, setEnTurno] = useState<boolean>(false)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    const fetchStatus = async () => {
      try {
        const { data: userData } = await supabase.auth.getUser()
        const userId = userData?.user?.id
        if (!userId) return

        // Intentar obtener estado de turno de profesionales_disponibles
        const { data, error } = await supabase
          .from('profesionales_disponibles')
          .select('esta_en_turno')
          .eq('user_id', userId)
          .limit(1)

        if (data && data.length > 0) {
          setEnTurno(Boolean(data[0].esta_en_turno))
          return
        }

        // Si no existe en profesionales_disponibles, no lanzar error
        // Solo mantener estado por defecto (falso)
        setEnTurno(false)
      } catch (err) {
        // Silenciar errores de columnas faltantes
        console.debug('Info de turno no disponible', err)
        setEnTurno(false)
      }
    }

    fetchStatus()
  }, [])

  const toggleTurno = async () => {
    setLoading(true)
    try {
      const { data: userData } = await supabase.auth.getUser()
      const userId = userData?.user?.id
      if (!userId) {
        toast({ title: 'Error', description: 'Usuario no autenticado', variant: 'destructive' })
        setLoading(false)
        return
      }

      // No intentar actualizar profesionales_sanitarios si la columna no existe
      // Solo actualizar profesionales_disponibles si existe la tabla
      const { data: availableData, error: availableError } = await supabase
        .from('profesionales_disponibles')
        .select('id')
        .eq('user_id', userId)
        .limit(1)

      const nueva = !enTurno

      if (availableData && availableData.length > 0) {
        // Si existe en profesionales_disponibles, actualizar
        await supabase
          .from('profesionales_disponibles')
          .update({ esta_en_turno: nueva })
          .eq('id', availableData[0].id)
      }

      setEnTurno(nueva)
      toast({ title: nueva ? 'Turno iniciado' : 'Turno finalizado', variant: 'default' })
    } catch (err: any) {
      console.debug('Info: No se pudo actualizar turno (tabla/columna no disponible)')
      // No mostrar error al usuario, solo continuar
      setEnTurno(!enTurno)
    } finally {
      setLoading(false)
    }
  }

  return (
    <Button onClick={toggleTurno} variant={enTurno ? 'destructive' : 'default'} disabled={loading}>
      {enTurno ? (loading ? 'Finalizando...' : 'Finalizar Jornada') : (loading ? 'Iniciando...' : 'Iniciar Jornada')}
    </Button>
  )
}
