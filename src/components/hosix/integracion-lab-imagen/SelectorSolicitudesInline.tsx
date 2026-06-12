import React, { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/integrations/supabase/hosixClient'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Badge } from '@/components/ui/badge'
import { Plus, Trash2, FlaskConical, ImageIcon } from 'lucide-react'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { toast } from 'sonner'
import { VerificadorDisponibilidad } from './VerificadorDisponibilidad'

interface SelectorSolicitudesInlineProps {
  pacienteId: string
  onSolicitudesLabAgregar?: (solicitudes: any[]) => void
  onSolicitudesImagenAgregar?: (solicitudes: any[]) => void
}

export const SelectorSolicitudesInline: React.FC<SelectorSolicitudesInlineProps> = ({
  pacienteId,
  onSolicitudesLabAgregar,
  onSolicitudesImagenAgregar,
}) => {
  const [solicitudesLab, setSolicitudesLab] = useState<any[]>([])
  const [solicitudesImagen, setSolicitudesImagen] = useState<any[]>([])
  
  const [formLab, setFormLab] = useState({
    diagnostico_clinico: '',
    observaciones: '',
    prioridad: 'normal',
    fecha_requerida: '',
    prueba_id: '',
  })
  
  const [formImagen, setFormImagen] = useState({
    diagnostico_clinico: '',
    observaciones: '',
    prioridad: 'normal',
    fecha_requerida: '',
    modalidad_id: '',
    zona_interes: '',
    requiere_contraste: false,
    tipo_contraste: '',
  })

  // Queries
  const { data: pruebas = [] } = useQuery({
    queryKey: ['hosix_laboratorio_pruebas_catalogo'],
    queryFn: async () => {
      const { data } = await supabase
        .from('hosix_laboratorio_pruebas_catalogo')
        .select('*')
        .eq('activa', true)
      return data || []
    },
  })

  const { data: modalidades = [] } = useQuery({
    queryKey: ['hosix_imagenologia_modalidades'],
    queryFn: async () => {
      const { data } = await supabase
        .from('hosix_imagenologia_modalidades')
        .select('*')
        .eq('activa', true)
      return data || []
    },
  })

  const handleAgregarLaboratorio = () => {
    if (!formLab.prueba_id) {
      toast.error('Selecciona una prueba')
      return
    }

    const prueba = pruebas.find((p: any) => p.id === formLab.prueba_id)
    const nuevaSolicitud = {
      id: `lab_${Date.now()}`,
      ...formLab,
      prueba_nombre: prueba?.nombre,
    }

    setSolicitudesLab([...solicitudesLab, nuevaSolicitud])
    toast.success('Prueba agregada')
    
    setFormLab({
      diagnostico_clinico: '',
      observaciones: '',
      prioridad: 'normal',
      fecha_requerida: '',
      prueba_id: '',
    })
  }

  const handleAgregarImagen = () => {
    if (!formImagen.modalidad_id) {
      toast.error('Selecciona una modalidad')
      return
    }

    const modalidad = modalidades.find((m: any) => m.id === formImagen.modalidad_id)
    const nuevaSolicitud = {
      id: `img_${Date.now()}`,
      ...formImagen,
      modalidad_nombre: modalidad?.nombre,
    }

    setSolicitudesImagen([...solicitudesImagen, nuevaSolicitud])
    toast.success('Estudio agregado')
    
    setFormImagen({
      diagnostico_clinico: '',
      observaciones: '',
      prioridad: 'normal',
      fecha_requerida: '',
      modalidad_id: '',
      zona_interes: '',
      requiere_contraste: false,
      tipo_contraste: '',
    })
  }

  const handleGuardar = () => {
    if (solicitudesLab.length === 0 && solicitudesImagen.length === 0) {
      toast.error('Agrega al menos una solicitud')
      return
    }

    if (solicitudesLab.length > 0) {
      onSolicitudesLabAgregar?.(solicitudesLab)
    }
    if (solicitudesImagen.length > 0) {
      onSolicitudesImagenAgregar?.(solicitudesImagen)
    }
  }

  return (
    <div className="space-y-4">
      <Tabs defaultValue="laboratorio">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="laboratorio">
            <FlaskConical className="h-4 w-4 mr-2" />
            Laboratorio
          </TabsTrigger>
          <TabsTrigger value="imagenologia">
            <ImageIcon className="h-4 w-4 mr-2" />
            Imagenología
          </TabsTrigger>
        </TabsList>

        {/* Laboratorio Tab */}
        <TabsContent value="laboratorio" className="space-y-4">
          <div className="space-y-3">
            <div>
              <label className="block text-sm font-medium mb-1">Prueba de Laboratorio</label>
              <select
                value={formLab.prueba_id}
                onChange={(e) => setFormLab({...formLab, prueba_id: e.target.value})}
                className="w-full px-3 py-2 border rounded-md"
              >
                <option value="">Selecciona una prueba</option>
                {pruebas.map((p: any) => (
                  <option key={p.id} value={p.id}>{p.nombre}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Diagnóstico Clínico</label>
              <textarea
                value={formLab.diagnostico_clinico}
                onChange={(e) => setFormLab({...formLab, diagnostico_clinico: e.target.value})}
                className="w-full px-3 py-2 border rounded-md text-sm"
                rows={2}
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium mb-1">Prioridad</label>
                <select
                  value={formLab.prioridad}
                  onChange={(e) => setFormLab({...formLab, prioridad: e.target.value})}
                  className="w-full px-3 py-2 border rounded-md text-sm"
                >
                  <option value="normal">Normal</option>
                  <option value="urgente">Urgente</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Fecha Requerida</label>
                <Input
                  type="date"
                  value={formLab.fecha_requerida}
                  onChange={(e) => setFormLab({...formLab, fecha_requerida: e.target.value})}
                  className="text-sm"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Observaciones</label>
              <textarea
                value={formLab.observaciones}
                onChange={(e) => setFormLab({...formLab, observaciones: e.target.value})}
                className="w-full px-3 py-2 border rounded-md text-sm"
                rows={2}
              />
            </div>

            <Button onClick={handleAgregarLaboratorio} className="w-full">
              <Plus className="h-4 w-4 mr-2" />
              Agregar Prueba
            </Button>
          </div>

          {solicitudesLab.length > 0 && (
            <div className="mt-4 pt-4 border-t">
              <h4 className="font-semibold mb-2">Pruebas Agregadas ({solicitudesLab.length})</h4>
              <div className="space-y-2">
                {solicitudesLab.map((s) => (
                  <div key={s.id} className="border p-2 rounded-md bg-blue-50 flex justify-between items-center">
                    <div>
                      <p className="font-medium text-sm">{s.prueba_nombre}</p>
                      <Badge variant="outline" className="text-xs mt-1">{s.prioridad}</Badge>
                    </div>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => setSolicitudesLab(solicitudesLab.filter(x => x.id !== s.id))}
                    >
                      <Trash2 className="h-3 w-3 text-red-500" />
                    </Button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </TabsContent>

        {/* Imagenología Tab */}
        <TabsContent value="imagenologia" className="space-y-4">
          <div className="space-y-3">
            <div>
              <label className="block text-sm font-medium mb-1">Modalidad de Imagenología</label>
              <select
                value={formImagen.modalidad_id}
                onChange={(e) => setFormImagen({...formImagen, modalidad_id: e.target.value})}
                className="w-full px-3 py-2 border rounded-md"
              >
                <option value="">Selecciona una modalidad</option>
                {modalidades.map((m: any) => (
                  <option key={m.id} value={m.id}>{m.nombre}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Zona de Interés</label>
              <Input
                value={formImagen.zona_interes}
                onChange={(e) => setFormImagen({...formImagen, zona_interes: e.target.value})}
                placeholder="Ej: pulmón derecho, columna lumbar"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Diagnóstico Clínico</label>
              <textarea
                value={formImagen.diagnostico_clinico}
                onChange={(e) => setFormImagen({...formImagen, diagnostico_clinico: e.target.value})}
                className="w-full px-3 py-2 border rounded-md text-sm"
                rows={2}
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium mb-1">Prioridad</label>
                <select
                  value={formImagen.prioridad}
                  onChange={(e) => setFormImagen({...formImagen, prioridad: e.target.value})}
                  className="w-full px-3 py-2 border rounded-md text-sm"
                >
                  <option value="normal">Normal</option>
                  <option value="urgente">Urgente</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Fecha Programada</label>
                <Input
                  type="date"
                  value={formImagen.fecha_requerida}
                  onChange={(e) => setFormImagen({...formImagen, fecha_requerida: e.target.value})}
                  className="text-sm"
                />
              </div>
            </div>

            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={formImagen.requiere_contraste}
                onChange={(e) => setFormImagen({...formImagen, requiere_contraste: e.target.checked})}
                className="rounded"
              />
              <span className="text-sm font-medium">Requiere Contraste</span>
            </label>

            {formImagen.requiere_contraste && (
              <Input
                value={formImagen.tipo_contraste}
                onChange={(e) => setFormImagen({...formImagen, tipo_contraste: e.target.value})}
                placeholder="Tipo de contraste (ej: gadolinio)"
              />
            )}

            <div>
              <label className="block text-sm font-medium mb-1">Observaciones</label>
              <textarea
                value={formImagen.observaciones}
                onChange={(e) => setFormImagen({...formImagen, observaciones: e.target.value})}
                className="w-full px-3 py-2 border rounded-md text-sm"
                rows={2}
              />
            </div>

            <Button onClick={handleAgregarImagen} className="w-full">
              <Plus className="h-4 w-4 mr-2" />
              Agregar Estudio
            </Button>
          </div>

          {solicitudesImagen.length > 0 && (
            <div className="mt-4 pt-4 border-t">
              <h4 className="font-semibold mb-2">Estudios Agregados ({solicitudesImagen.length})</h4>
              <div className="space-y-2">
                {solicitudesImagen.map((s) => (
                  <div key={s.id} className="border p-2 rounded-md bg-green-50 flex justify-between items-center">
                    <div>
                      <p className="font-medium text-sm">{s.modalidad_nombre}</p>
                      {s.zona_interes && <p className="text-xs text-gray-600">Zona: {s.zona_interes}</p>}
                      <Badge variant="outline" className="text-xs mt-1">{s.prioridad}</Badge>
                    </div>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => setSolicitudesImagen(solicitudesImagen.filter(x => x.id !== s.id))}
                    >
                      <Trash2 className="h-3 w-3 text-red-500" />
                    </Button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </TabsContent>
      </Tabs>

      <div className="flex gap-2 justify-end pt-4 border-t">
        <Button variant="outline" onClick={() => {
          setSolicitudesLab([])
          setSolicitudesImagen([])
        }}>
          Limpiar
        </Button>
        <Button onClick={handleGuardar}>
          Guardar Solicitudes
        </Button>
      </div>
    </div>
  )
}

export default SelectorSolicitudesInline
