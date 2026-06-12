import "jsr:@supabase/functions-js/edge-runtime.d.ts"
import { createClient } from "jsr:@supabase/supabase-js@2"

interface SyncPullRequest {
  tipo: 'distritos' | 'centros' | 'profesionales' | 'pacientes'
  ultima_version?: number
  fecha_ultima_sync?: string
  limite?: number
}

console.info("sync-pull function started")

Deno.serve(async (req) => {
  // CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', {
      status: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization, apikey'
      }
    })
  }

  // Solo POST
  if (req.method !== 'POST') {
    return new Response(
      JSON.stringify({ error: 'Method not allowed' }),
      { 
        status: 405, 
        headers: { 
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*'
        } 
      }
    )
  }

  try {
    // Usar el anon key (pública) para acceder a datos públicos
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY')!
    
    const supabase = createClient(supabaseUrl, supabaseAnonKey, {
      auth: { persistSession: false }
    })

    const body: SyncPullRequest = await req.json()
    
    console.log(`📥 SYNC PULL: tipo=${body.tipo}`)

    let datos: any[] = []
    let total = 0

    if (body.tipo === 'distritos') {
      const { data, count } = await supabase
        .from('nodo_central.distritos_sanitarios_copia')
        .select('*', { count: 'exact' })
        .order('nombre_distrito')

      datos = data || []
      total = count || 0

    } else if (body.tipo === 'centros') {
      const { data, count } = await supabase
        .from('nodo_central.centros_salud_copia')
        .select('*', { count: 'exact' })
        .eq('estado', 'Activo')
        .order('nombre')

      datos = data || []
      total = count || 0

    } else if (body.tipo === 'profesionales') {
      const { data, count } = await supabase
        .from('nodo_central.profesionales_copia')
        .select('*', { count: 'exact' })
        .eq('estado_solicitud', 'Aprobado')
        .order('nombre_completo')

      datos = data || []
      total = count || 0

    } else if (body.tipo === 'pacientes') {
      let query = supabase
        .from('nodo_central.pais_pacientes_maestro')
        .select(
          'id, hcu, cedula, nombre, apellido, fecha_nacimiento, genero, estado, updated_at',
          { count: 'exact' }
        )
        .eq('estado', 'activo')

      if (body.fecha_ultima_sync) {
        query = query.gt('updated_at', body.fecha_ultima_sync)
      }

      const { data: fetchedData, count } = await query
        .order('updated_at', { ascending: false })
        .limit(body.limite || 1000)

      datos = fetchedData || []
      total = count || 0
    }

    console.log(`✅ SYNC PULL completado: ${total} registros de ${body.tipo}`)

    return new Response(
      JSON.stringify({
        exitoso: true,
        tipo: body.tipo,
        total: total,
        registros: datos.length,
        datos: datos,
        timestamp: new Date().toISOString()
      }),
      {
        status: 200,
        headers: { 
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*'
        }
      }
    )

  } catch (error) {
    console.error('❌ Error en sync pull:', error)

    return new Response(
      JSON.stringify({
        exitoso: false,
        error: String(error),
        tipo: 'error'
      }),
      {
        status: 500,
        headers: { 
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*'
        }
      }
    )
  }
})
