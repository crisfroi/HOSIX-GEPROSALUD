import React, { useEffect, useState } from 'react'
import { supabase } from '@/integrations/supabase/hosixClient'
import { Badge } from '@/components/ui/badge'
import { AlertCircle, CheckCircle } from 'lucide-react'

interface VerificadorDisponibilidadProps {
  tipo: 'laboratorio' | 'imagenologia'
  itemId: string
  itemNombre: string
}

export const VerificadorDisponibilidad: React.FC<VerificadorDisponibilidadProps> = ({
  tipo,
  itemId,
  itemNombre
}) => {
  const [disponible, setDisponible] = useState<boolean | null>(null)
  const [centroAlterno, setCentroAlterno] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const verificarDisponibilidad = async () => {
      try {
        setLoading(true)

        if (tipo === 'laboratorio') {
          const { data } = await supabase
            .from('hosix_laboratorio_pruebas_catalogo')
            .select('id, activa, laboratorio_interno')
            .eq('id', itemId)
            .single()

          if (!data) {
            setDisponible(false)
            setCentroAlterno('Prueba no existe')
            return
          }

          if (!data.activa) {
            setDisponible(false)
            setCentroAlterno('Prueba desactivada')
            return
          }

          if (!data.laboratorio_interno) {
            setDisponible(true)
            setCentroAlterno('Laboratorio externo')
            return
          }

          setDisponible(true)
          setCentroAlterno(null)
        } else if (tipo === 'imagenologia') {
          const { data } = await supabase
            .from('hosix_imagenologia_modalidades')
            .select('id, activa')
            .eq('id', itemId)
            .single()

          if (!data) {
            setDisponible(false)
            setCentroAlterno('Modalidad no existe')
            return
          }

          if (!data.activa) {
            setDisponible(false)
            setCentroAlterno('En mantenimiento')
            return
          }

          setDisponible(true)
          setCentroAlterno(null)
        }
      } catch (error) {
        setDisponible(false)
        setCentroAlterno('Error al verificar')
      } finally {
        setLoading(false)
      }
    }

    if (itemId) {
      verificarDisponibilidad()
    }
  }, [itemId, tipo])

  if (loading) {
    return <Badge variant="outline">Verificando...</Badge>
  }

  if (disponible) {
    return (
      <div className="flex items-center gap-2">
        <Badge variant="default" className="bg-green-600 hover:bg-green-700">
          <CheckCircle className="w-3 h-3 mr-1" />
          Disponible
        </Badge>
        {centroAlterno && (
          <span className="text-xs text-gray-500">({centroAlterno})</span>
        )}
      </div>
    )
  }

  return (
    <div className="flex items-center gap-2">
      <Badge variant="destructive">
        <AlertCircle className="w-3 h-3 mr-1" />
        No disponible
      </Badge>
      {centroAlterno && (
        <span className="text-xs text-gray-600 font-medium">{centroAlterno}</span>
      )}
    </div>
  )
}

export default VerificadorDisponibilidad
