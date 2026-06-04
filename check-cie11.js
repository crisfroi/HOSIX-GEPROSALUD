
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
  const { data, count, error } = await supabase.from('hosix_codigos_cie').select('*', { count: 'exact', head: false }).limit(5)
  if (error) {
    console.log('Table hosix_codigos_cie: MISSING (' + error.message + ')')
  } else {
    console.log('Table hosix_codigos_cie: EXISTS, count:', count)
    console.log('Sample data:', data)
  }
}

check()
