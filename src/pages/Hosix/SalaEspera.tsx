import React, { useEffect, useState } from 'react'
import ReactPlayer from 'react-player/lazy'
import { Button } from '@/components/ui/button'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Select, SelectTrigger, SelectContent, SelectItem, SelectValue } from '@/components/ui/select'
import { supabase } from '@/integrations/supabase/hosixClient'
import { useToast } from '@/components/ui/use-toast'

type Ticket = {
  id: string
  numero: number
  tipo: string
  estado: string
  orden?: number
  consultorio?: string
  creado_en: string
}

export default function SalaEspera() {
  const { toast } = useToast()
  const [tickets, setTickets] = useState<Ticket[]>([])
  const [loading, setLoading] = useState(false)
  const [tipo, setTipo] = useState<'externa' | 'urgencias' | 'hospitalizacion'>('externa')

  useEffect(() => {
    let sub: any
    const fetchTickets = async () => {
      try {
        const { data, error } = await supabase
          .from('hosix_tickets')
          .select('*')
            .order('orden', { ascending: true })
            .order('created_at', { ascending: true })
            .limit(200)

          if (error) throw error
          // Detectar tickets "llamado" nuevos para anunciar
          const newTickets = (data || []).map((t: any) => ({
            id: t.id,
            numero: t.numero || 0,
            tipo: t.tipo,
            estado: t.estado || 'pendiente',
            orden: t.orden ?? undefined,
            consultorio: t.consultorio,
            creado_en: t.created_at
          }))

          // Comparar con tickets previos para detectar nuevos llamados
          try {
            const prevMap = new Map(tickets.map(tt => [tt.id, tt.estado]))
            newTickets.forEach(nt => {
              const prevEstado = prevMap.get(nt.id)
              if (nt.estado === 'llamado' && prevEstado !== 'llamado') {
                // Anunciar por TTS
                try {
                  const msg = new SpeechSynthesisUtterance(`Paciente número ${nt.numero}, diríjase al consultorio`)
                  window.speechSynthesis.cancel()
                  window.speechSynthesis.speak(msg)
                } catch (e) {
                  // ignore
                }
                toast({ title: 'Llamando paciente', description: `Ticket ${nt.numero} - ${nt.tipo}` })
              }
            })
          } catch (e) {
            // ignore
          }

          setTickets(newTickets)
      } catch (err) {
        console.error('Error fetching tickets', err)
      }
    }

    fetchTickets()

    try {
      sub = supabase.channel('public:hosix_tickets')
        .on('postgres_changes', { event: '*', schema: 'public', table: 'hosix_tickets' }, payload => {
          // Refrescar lista simple
          fetchTickets()
        })
        .subscribe()
    } catch (err) {
      console.warn('Realtime subscription failed', err)
    }

    return () => {
      if (sub && sub.unsubscribe) sub.unsubscribe()
    }
  }, [])

  const emitirTicket = async () => {
    setLoading(true)
    try {
      // Obtener último número
      const { data: last, error: errLast } = await supabase
        .from('hosix_tickets')
        .select('numero')
        .order('numero', { ascending: false })
        .limit(1)

      if (errLast) throw errLast
      const next = (last && last.length > 0) ? (last[0].numero || 0) + 1 : 1

      const { error } = await supabase
        .from('hosix_tickets')
        .insert([{ numero: next, tipo, estado: 'pendiente' }])

      if (error) throw error
      toast({ title: 'Ticket emitido', description: `Ticket ${next} - ${tipo}`, variant: 'default' })
    } catch (err: any) {
      console.error('Error emitiendo ticket', err)
      toast({ title: 'Error', description: err?.message || 'No se pudo emitir ticket', variant: 'destructive' })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader>
            <CardTitle>Portal Sala de Espera</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-gray-600">Emite tickets y visualiza la cola.</p>

            <div className="mt-4">
              <Select value={tipo} onValueChange={(v) => setTipo(v as any)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="externa">Consulta Externa</SelectItem>
                  <SelectItem value="urgencias">Urgencias</SelectItem>
                  <SelectItem value="hospitalizacion">Hospitalización</SelectItem>
                </SelectContent>
              </Select>
              <div className="mt-3">
                <Button onClick={emitirTicket} disabled={loading}>{loading ? '...' : 'Emitir Ticket'}</Button>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Pantalla de Turnos</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="w-full">
              <ReactPlayer url="https://www.youtube.com/watch?v=dQw4w9WgXcQ" width="100%" height={240} controls playing loop />
            </div>
            <div className="mt-4">
              <p className="text-sm text-gray-600">Turno actual: A-104 (ejemplo). Últimos llamados en la lista.</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Cola Actual</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 max-h-64 overflow-auto">
              {tickets.map(t => (
                <div key={t.id} className="p-2 border rounded flex justify-between transition-all duration-300 ease-out">
                  <div>
                    <div className="font-semibold">
                      {t.orden ? `${t.orden}. ` : ''}{t.numero} - {t.tipo}
                    </div>
                    {t.consultorio && <div className="text-xs text-slate-600">Consultorio {t.consultorio}</div>}
                    <div className="text-xs text-gray-500">{new Date(t.creado_en).toLocaleString()}</div>
                  </div>
                  <div className="text-sm">{t.estado}</div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
