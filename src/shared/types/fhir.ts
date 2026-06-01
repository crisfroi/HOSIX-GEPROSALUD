export interface FHIRPatient {
  id: string
  name?: { family?: string; given?: string[] }[]
  gender?: 'male' | 'female' | 'other' | 'unknown'
  birthDate?: string
}

export interface FHIRAllergyIntolerance {
  id: string
  clinicalStatus?: { coding?: { system?: string; code?: string; display?: string }[] }
  verificationStatus?: { coding?: { system?: string; code?: string; display?: string }[] }
  code?: { coding?: { system?: string; code?: string; display?: string }[]; text?: string }
  reaction?: { manifestation?: { text?: string }[]; severity?: string }[]
}

export interface FHIROrganization {
  id: string
  name?: string
}

export interface FHIRObservation {
  id: string
  status?: string
  code?: { text?: string }
  valueString?: string
  valueQuantity?: { value?: number; unit?: string }
  effectiveDateTime?: string
}

export interface FHIREncounter {
  id: string
  status?: string
  class?: { code?: string }
  period?: { start?: string; end?: string }
}
