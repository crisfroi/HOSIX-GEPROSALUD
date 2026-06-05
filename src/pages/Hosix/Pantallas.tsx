import React, { useEffect, useState } from 'react'
import { useState, useEffect } from 'react'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { useToast } from '@/components/ui/use-toast'
import { supabase } from '@/integrations/supabase/hosixClient'

export default function PantallasManager() {
  const { toast } = useToast()
  const [pantallas, setPantallas] = useState<any[]>([])
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  const [form, setForm] = useState<any>({ nombre: '', playlist_url: '', mostrar_numeros_consulta: true, tts_enabled: true, tts_language: 'es-ES', tts_voice: 'es-ES-Standard-A', configuracion_consultas: {} })

  useEffect(() => {
    fetchPantallas()
  }, [])

  const fetchPantallas = async () => {
    try {
      const { data, error } = await supabase
        .from('hosix_pantallas_turno')
        .select('*')
        .order('creado_en', { ascending: true })

      if (error) throw error
      setPantallas(data || [])
    } catch (err) {
      console.error('Error fetch pantallas', err)
    }
  }

  const handleSelect = (id: string) => {
    setSelectedId(id)
    const p = pantallas.find(p => p.id === id)
    setForm({
      nombre: p?.nombre || '',
      playlist_url: p?.playlist_url || '',
      mostrar_numeros_consulta: p?.mostrar_numeros_consulta ?? true,
      tts_enabled: p?.tts_enabled ?? true,
      tts_language: p?.tts_language || 'es-ES',
      tts_voice: p?.tts_voice || 'es-ES-Standard-A',
      configuracion_consultas: p?.configuracion_consultas || {}
    })
  }

  const handleSave = async () => {
    setLoading(true)
    try {
      if (!selectedId) {
        // Insert
        const { error } = await supabase.from('hosix_pantallas_turno').insert([form])
        if (error) throw error
        toast({ title: 'Creada', description: 'Pantalla creada', variant: 'default' })
      } else {
        const { error } = await supabase.from('hosix_pantallas_turno').update(form).eq('id', selectedId)
        if (error) throw error
        toast({ title: 'Guardada', description: 'Pantalla actualizada', variant: 'default' })
      }
      await fetchPantallas()
    } catch (err: any) {
      console.error('Error guardando pantalla', err)
      toast({ title: 'Error', description: err?.message || 'Error al guardar', variant: 'destructive' })
    } finally {
      setLoading(false)
    }
  }

  const handleNew = () => {
    setSelectedId(null)
    setForm({ nombre: '', playlist_url: '', mostrar_numeros_consulta: true, tts_enabled: true, tts_language: 'es-ES', tts_voice: 'es-ES-Standard-A', configuracion_consultas: {} })
  }

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader>
            <CardTitle>Pantallas de Turno</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {pantallas.map(p => (
                <div key={p.id} className="p-2 border rounded flex justify-between items-center">
                  <div>
                    <div className="font-semibold">{p.nombre}</div>
                    <div className="text-xs text-gray-500">{p.playlist_url}</div>
                  </div>
                  <div className="flex gap-2">
                    <Button size="sm" onClick={() => handleSelect(p.id)}>Editar</Button>
                  </div>
                </div>
              ))}
              <div className="mt-3">
                <Button onClick={handleNew}>Crear nueva pantalla</Button>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle>Editor</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 gap-3">
              <div>
                <Label>Nombre</Label>
                <Input value={form.nombre} onChange={(e) => setForm(prev => ({ ...prev, nombre: e.target.value }))} />
              </div>
              <div>
                <Label>Playlist URL</Label>
                <Input value={form.playlist_url} onChange={(e) => setForm(prev => ({ ...prev, playlist_url: e.target.value }))} />
              </div>
              <div>
                <Label>Texto TTS (voz)</Label>
                <div className="grid grid-cols-2 gap-2">
                  <Select value={form.tts_language} onValueChange={(v) => setForm(prev => ({ ...prev, tts_language: v }))}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="es-ES">Español (España)</SelectItem>
                      <SelectItem value="es-US">Español (US)</SelectItem>
                    </SelectContent>
                  </Select>
                  <Input value={form.tts_voice} onChange={(e) => setForm(prev => ({ ...prev, tts_voice: e.target.value }))} />
                </div>
              </div>
              <div>
                <Label>Configuración consultas (JSON)</Label>
                <Textarea value={JSON.stringify(form.configuracion_consultas || {}, null, 2)} onChange={(e) => {
                  try {
                    const parsed = JSON.parse(e.target.value)
                    setForm(prev => ({ ...prev, configuracion_consultas: parsed }))
                  } catch (err) {
                    // ignore parse until save
                    setForm(prev => ({ ...prev, configuracion_consultas_raw: e.target.value }))
                  }
                }} rows={6} />
              </div>

              <div className="flex gap-2">
                <Button onClick={handleSave} disabled={loading}>{loading ? 'Guardando...' : 'Guardar'}</Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
