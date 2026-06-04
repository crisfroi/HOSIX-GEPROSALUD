
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

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  console.error('Credentials not found in .env.local')
  console.log('URL:', SUPABASE_URL)
  console.log('Key:', SUPABASE_SERVICE_ROLE_KEY ? 'Present' : 'Missing')
  process.exit(1)
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)

async function test() {
  try {
    const { data, error } = await supabase.rpc('exec_sql', { sql: 'SELECT 1;' })
    if (error) {
      console.log('Error calling exec_sql:', error.message)
    } else {
      console.log('exec_sql is available:', data)
    }
  } catch (e) {
    console.error('Exception calling exec_sql:', e.message)
  }
}

test()
