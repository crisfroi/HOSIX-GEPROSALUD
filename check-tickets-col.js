
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
  const { error } = await supabase.from('hosix_tickets').select('asignado_a').limit(1)
  if (error) {
    console.log('Column asignado_a: MISSING (' + error.message + ')')
  } else {
    console.log('Column asignado_a: EXISTS')
  }
}

check()
