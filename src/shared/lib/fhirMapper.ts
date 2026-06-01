import { FHIRPatient } from '@/shared/types/fhir'

export function mapPacienteRowToFHIR(row: any): FHIRPatient {
  if (!row) return { id: '' }
  const name = [] as { family?: string; given?: string[] }[]
  if (row.apellidos || row.nombres) {
    name.push({ family: row.apellidos, given: row.nombres ? row.nombres.split(' ') : undefined })
  }

  const gender = row.sexo === 'M' ? 'male' : row.sexo === 'F' ? 'female' : row.sexo === 'O' ? 'other' : 'unknown'

  return {
    id: row.id,
    name,
    gender,
    birthDate: row.fecha_nacimiento,
  }
}
