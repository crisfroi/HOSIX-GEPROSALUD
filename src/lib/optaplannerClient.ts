import { supabase } from '@/integrations/supabase/hosixClient'

const SOLVER_URL = import.meta.env.VITE_OPTAPLANNER_URL || 'http://localhost:8080/solve'

export async function solveAssignment(payload: any) {
  // Send problem JSON to the solver service and return solution
  try {
    const res = await fetch(SOLVER_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    })

    if (!res.ok) {
      const txt = await res.text()
      throw new Error(`Solver error: ${res.status} ${txt}`)
    }

    const data = await res.json()
    return data
  } catch (err) {
    console.error('Error calling solver', err)
    throw err
  }
}
