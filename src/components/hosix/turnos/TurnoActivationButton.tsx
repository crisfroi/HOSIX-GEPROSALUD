import React, { useState, useEffect } from 'react'
import { useState, useEffect } from 'react'
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

        const { data, error } = await supabase
          .from('profesionales_disponibles')
          .select('esta_en_turno')
          .eq('user_id', userId)
          .limit(1)

        if (error) throw error
        if (data && data.length > 0) {
          setEnTurno(Boolean(data[0].esta_en_turno))
          return
        }

        const { data: fallbackData, error: fallbackError } = await supabase
          .from('profesionales_sanitarios')
          .select('esta_en_turno')
          .eq('user_id', userId)
          .limit(1)

        if (fallbackError) throw fallbackError
        setEnTurno(Boolean(fallbackData && fallbackData.length > 0 && fallbackData[0].esta_en_turno))
      } catch (err) {
        console.warn('No se pudo obtener status de turno', err)
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

      const { data, error } = await supabase
        .from('profesionales_sanitarios')
        .select('id, esta_en_turno')
        .eq('user_id', userId)
        .limit(1)

      if (error) throw error

      const { data: availableData, error: availableError } = await supabase
        .from('profesionales_disponibles')
        .select('id, esta_en_turno')
        .eq('user_id', userId)
        .limit(1)

      if (availableError) throw availableError

      const existingProf = data && data.length > 0 ? data[0] : null
      const existingAvailable = availableData && availableData.length > 0 ? availableData[0] : null
      const nueva = !enTurno
      const updatePayload: any = { esta_en_turno: nueva }
      if (nueva) updatePayload.turno_inicio = new Date().toISOString()
      else updatePayload.turno_fin = new Date().toISOString()

      if (existingProf) {
        const { error: errUpd } = await supabase
          .from('profesionales_sanitarios')
          .update(updatePayload)
          .eq('id', existingProf.id)

        if (errUpd) throw errUpd
      } else {
        const { error: errIns } = await supabase
          .from('profesionales_sanitarios')
          .insert([
            { user_id: userId, esta_en_turno: nueva, turno_inicio: new Date().toISOString(), activo: true }
          ])

        if (errIns) throw errIns
      }

      if (existingAvailable) {
        const { error: errAvailUpd } = await supabase
          .from('profesionales_disponibles')
          .update(updatePayload)
          .eq('id', existingAvailable.id)

        if (errAvailUpd) throw errAvailUpd
      } else {
        const { error: errAvailIns } = await supabase
          .from('profesionales_disponibles')
          .insert([
            { user_id: userId, esta_en_turno: nueva, activo: true, ubicacion: null }
          ])

        if (errAvailIns) throw errAvailIns
      }

      setEnTurno(nueva)
      toast({ title: nueva ? 'Turno iniciado' : 'Turno finalizado', variant: 'default' })
    } catch (err: any) {
      console.error('Error toggle turno', err)
      toast({ title: 'Error', description: err?.message || 'Error al cambiar turno', variant: 'destructive' })
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
