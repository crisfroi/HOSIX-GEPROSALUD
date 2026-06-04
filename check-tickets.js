
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
  const { data, error } = await supabase.from('hosix_tickets').select('*').limit(1)
  if (error) {
    console.log('Error checking hosix_tickets:', error.message)
  } else {
    console.log('Columns in hosix_tickets:', data.length > 0 ? Object.keys(data[0]) : 'No data, checking columns via RPC/query if possible')
  }
}

check()
