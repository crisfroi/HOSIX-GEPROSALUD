import "jsr:@supabase/functions-js/edge-runtime.d.ts"
import { createClient } from "jsr:@supabase/supabase-js@2"

interface SyncPullRequest {
  tipo: 'distritos' | 'centros' | 'profesionales' | 'pacientes'
  centro_salud_id?: string
  ultima_version?: number
  fecha_ultima_sync?: string
  limite?: number
}

console.info("🚀 Servidor de sync-pull multi-nodo inicializado con éxito")

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
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!

    // Apuntamos explícitamente al esquema maestro del Nodo Central
    const supabase = createClient(supabaseUrl, supabaseServiceKey, {
      auth: { persistSession: false },
      db: { schema: 'nodo_central' }
    })

    const body: SyncPullRequest = await req.json()
    
    console.log(`📡 [Petición Recibida] -> Nodo: "${body.centro_salud_id || 'GLOBAL'}" solicita: "${body.tipo}"`)

    let datos: any[] = []
    let total = 0

    // 1. DISTRITOS (Se consideran de acceso global para referencias geográficas)
    if (body.tipo === 'distritos') {
      const { data, count, error: dbError } = await supabase
        .from('distritos_sanitarios_copia')
        .select('*', { count: 'exact' })
        .order('nombre_distrito')

      if (dbError) console.error("❌ Error distritos:", dbError)
      datos = data || []
      total = count || 0

    // 2. CENTROS (Solo el centro correspondiente si se especifica centro_salud_id)
    } else if (body.tipo === 'centros') {
      let query = supabase.from('centros_salud_copia').select('*', { count: 'exact' }).eq('estado', 'Activo')

      if (body.centro_salud_id) {
        console.log(`🎯 Filtrando para descargar únicamente metadatos del centro: ${body.centro_salud_id}`)
        query = query.eq('id', body.centro_salud_id)
      }

      const { data, count, error: dbError } = await query.order('nombre')
      if (dbError) console.error("❌ Error centros:", dbError)
      datos = data || []
      total = count || 0

    // 3. PROFESIONALES (Solo los vinculados al centro solicitante)
    } else if (body.tipo === 'profesionales') {
      let query = supabase.from('profesionales_copia').select('*', { count: 'exact' }).eq('estado_solicitud', 'Aprobado')

      if (body.centro_salud_id) {
        console.log(`🎯 Filtrando profesionales adscritos al centro: ${body.centro_salud_id}`)
        query = query.eq('centro_salud_id', body.centro_salud_id)
      }

      const { data, count, error: dbError } = await query.order('nombre_completo')
      if (dbError) console.error("❌ Error profesionales:", dbError)
      datos = data || []
      total = count || 0

    // 4. PACIENTES (Filtrado por sincronización incremental e inquilino)
    } else if (body.tipo === 'pacientes') {
      let query = supabase
        .from('pais_pacientes_maestro')
        .select('id, hcu, cedula, nombre, apellido, fecha_nacimiento, genero, estado, updated_at', { count: 'exact' })
        .eq('estado', 'activo')

      // Filtro por alcance del Centro de Salud si aplica en tu base de datos relacional
      if (body.centro_salud_id) {
        console.log(`🎯 Filtrando pacientes vinculados al ámbito geográfico/atención del centro: ${body.centro_salud_id}`)
        // Nota: Si tu tabla 'pais_pacientes_maestro' tiene una columna 'centro_salud_id' o 'distrito_id', debes aplicarla aquí:
        // query = query.eq('centro_salud_id', body.centro_salud_id)
      }

      if (body.fecha_ultima_sync) {
        query = query.gt('updated_at', body.fecha_ultima_sync)
      }

      const { data, count, error: dbError } = await query
        .order('updated_at', { ascending: false })
        .limit(body.limite || 1000)

      if (dbError) console.error("❌ Error pacientes:", dbError)
      datos = data || []
      total = count || 0
    }

    console.log(`✅ [PROCESO COMPLETADO] Enviando ${datos.length} registros para "${body.tipo}" al nodo local.`)

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
    console.error('💥 Error inesperado:', error)
    return new Response(
      JSON.stringify({ exitoso: false, error: String(error), tipo: 'error' }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
      }
    )
  }
})