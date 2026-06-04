
import { createClient } from '@supabase/supabase-js'
import fs from 'fs'

function getEnv(key) {
  try {
    const env = fs.readFileSync('.env.local', 'utf8')
    const match = env.match(new RegExp(`^${key}=(.*)$`, 'm'))
    return match ? match[1].trim() : null
  } catch (e) {
    return null
  }
}

const SUPABASE_URL = getEnv('VITE_SUPABASE_URL')
const SUPABASE_SERVICE_ROLE_KEY = getEnv('SERVICE_ROLE_KEY')

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)

async function check() {
  const tables = [
    'hosix_usuarios',
    'hosix_obstetricia_partogramas',
    'hosix_familias',
    'hosix_plantillas_documentos'
  ]
  
  for (const table of tables) {
    const { data, error } = await supabase.from(table).select('count', { count: 'exact', head: true })
    if (error) {
      console.log(`Table ${table}: MISSING (${error.message})`)
    } else {
      console.log(`Table ${table}: EXISTS`)
    }
  }
}

check()
