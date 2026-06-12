import { SupabaseClient } from '@supabase/supabase-js'
import { supabase } from '@/app/supabase'

/**
 * Hook para acceder al cliente de Supabase
 * Retorna la instancia singleton del cliente
 */
export function useSupabase() {
  return {
    supabase
  }
}

export default useSupabase
