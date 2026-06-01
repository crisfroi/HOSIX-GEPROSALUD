import React from 'react'
import { useQuery } from '@tanstack/react-query'
import { AlertTriangle, ShieldCheck, X } from 'lucide-react'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import { supabase } from '@/app/supabase'
import { FHIRAllergyIntolerance } from '@/shared/types/fhir'

type Props = {
  pacienteId: string
}

function mapAlergiaToFHIR(alergia: any): FHIRAllergyIntolerance {
  return {
    id: alergia.id || `${alergia.sustancia || 'alergia'}-${alergia.severidad || 'unknown'}`,
    clinicalStatus: {
      coding: [{ system: 'http://terminology.hl7.org/CodeSystem/allergyintolerance-clinical', code: 'active' }],
    },
    verificationStatus: {
      coding: [{ system: 'http://terminology.hl7.org/CodeSystem/allergyintolerance-verification', code: 'confirmed' }],
    },
    code: {
      text: alergia.sustancia || alergia.descripcion || 'Alergia desconocida',
    },
    reaction: alergia.reaccion
      ? [{ manifestation: [{ text: alergia.reaccion }], severity: alergia.severidad }]
      : undefined,
  }
}

export default function AlergiasBanner({ pacienteId }: Props) {
  const { data: alergias = [], isLoading } = useQuery({
    queryKey: ['paciente-alergias', pacienteId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('hosix_pacientes')
        .select('alergias')
        .eq('id', pacienteId)
        .single()

      if (error) throw error
      return Array.isArray(data?.alergias) ? data.alergias : []
    },
    enabled: !!pacienteId,
  })

  const fhirAllergies = alergias.map((alergia: any) => mapAlergiaToFHIR(alergia))

  if (isLoading || !fhirAllergies.length) {
    return null
  }

  return (
    <Alert variant="destructive" className="border-2 border-red-500 bg-red-50">
      <div className="flex items-start gap-3">
        <AlertTriangle className="h-6 w-6 text-red-700" />
        <div className="min-w-0 flex-1">
          <AlertTitle className="text-red-800 font-semibold">Alergias críticas</AlertTitle>
          <AlertDescription className="text-sm text-red-700 mt-2">
            El paciente tiene alergias documentadas que requieren verificación antes de cualquier prescripción o formulación.
          </AlertDescription>
          <div className="mt-3 grid gap-2 sm:grid-cols-2">
            {fhirAllergies.map((alergia) => (
              <Card key={alergia.id} className="border-red-200 bg-red-50 shadow-sm">
                <CardContent className="p-3">
                  <div className="flex items-center justify-between gap-2">
                    <div>
                      <p className="text-sm font-semibold text-red-900">{alergia.code?.text}</p>
                      <p className="text-xs text-slate-600">
                        {alergia.reaction?.[0]?.manifestation?.[0]?.text || 'Reacción no especificada'}
                      </p>
                    </div>
                    <Badge variant="destructive" className="uppercase text-[10px]">
                      {alergia.reaction?.[0]?.severity || 'CRÍTICO'}
                    </Badge>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
        <div className="text-red-700">
          <X className="h-5 w-5" />
        </div>
      </div>
    </Alert>
  )
}

