import { createClient } from '@supabase/supabase-js'
const SUPABASE_URL = 'https://mcp.supabase.com/mcp?project_ref=abxusmjvsuabvbbwwxqg'
const SUPABASE_SERVICE_ROLE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFieHVzbWp2c3VhYnZiYnd3eHFnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODAwNTYwMDYsImV4cCI6MjA5NTYzMjAwNn0.ysswcWo1viznFK9zOOrVkg7nzAqLVrrlHSXPgYNszVA'
const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)
const schema = 'public'
const { data, error } = await supabase.rpc('pg_catalog.pg_tables')
// fallback if rpc not allowed
console.log({ data: data?.slice(0,10), error })
