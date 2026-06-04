
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

async function findExecSql() {
  const { data, error } = await supabase.from('information_schema.routines').select('routine_name, routine_schema').ilike('routine_name', '%exec_sql%')
  if (error) {
    console.log('Error:', error.message)
  } else {
    console.log('Found:', data)
  }
}

findExecSql()
