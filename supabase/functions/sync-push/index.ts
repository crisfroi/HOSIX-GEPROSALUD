import "jsr:@supabase/functions-js/edge-runtime.d.ts"
import { createClient } from "jsr:@supabase/supabase-js@2"

interface CambioPaciente {
  accion: string
  cedula: string
  nombre: string
  apellido: string
  fecha_nacimiento: string
  nombre_distrito: string
  genero?: string
  datos_nuevos?: any
}

interface SyncPushRequest {
  cambios: CambioPaciente[]
}

console.info("sync-push function started")

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
    // Usar el service role key para operaciones de escritura
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey, {
      auth: { persistSession: false }
    })

    const body: SyncPushRequest = await req.json()
    const cambios: CambioPaciente[] = body.cambios || []

    console.log(`📤 SYNC PUSH: procesando ${cambios.length} cambios`)

    const mapeos: any[] = []
    const errores: any[] = []

    for (const cambio of cambios) {
      try {
        if (cambio.accion === 'crear') {
          const { data: existe, error: errorBusqueda } = await supabase
            .from('nodo_central.pais_pacientes_maestro')
            .select('hcu, nombre, apellido')
            .eq('cedula', cambio.cedula)
            .limit(1)

          if (errorBusqueda) {
            throw new Error(`Error buscando paciente: ${errorBusqueda.message}`)
          }

          if (existe && existe.length > 0) {
            mapeos.push({
              cedula: cambio.cedula,
              resultado: 'paciente_existe',
              hcu: existe[0].hcu,
              hospital_origen: existe[0].nombre && existe[0].apellido ? 'otro_hospital' : 'desconocido'
            })
            continue
          }

          const { data: hcu, error: errorHcu } = await supabase.rpc(
            'nodo_central.fn_generar_hcu',
            {
              p_cedula: cambio.cedula,
              p_nombre_distrito: cambio.nombre_distrito,
              p_centro_salud_id: null
            }
          )

          if (errorHcu) {
            throw new Error(`Error generando HCU: ${errorHcu.message}`)
          }

          const { data: pacienteCreado, error: errorInsert } = await supabase
            .from('nodo_central.pais_pacientes_maestro')
            .insert({
              hcu: hcu,
              cedula: cambio.cedula,
              nombre: cambio.nombre,
              apellido: cambio.apellido,
              fecha_nacimiento: cambio.fecha_nacimiento,
              genero: cambio.genero || null,
              estado: 'activo'
            })
            .select()
            .single()

          if (errorInsert) {
            throw new Error(`Error insertando paciente: ${errorInsert.message}`)
          }

          await supabase.from('nodo_central.sincronizacion_log').insert({
            tipo_evento: 'hcu_generado',
            entidad_tipo: 'paciente',
            entidad_id: pacienteCreado.id,
            datos_nuevos: {
              cedula: cambio.cedula,
              hcu: hcu,
              nombre: cambio.nombre,
              apellido: cambio.apellido
            },
            estado: 'exitoso'
          })

          mapeos.push({
            cedula: cambio.cedula,
            resultado: 'creado',
            hcu: hcu,
            paciente_id: pacienteCreado.id
          })

        } else {
          mapeos.push({
            cedula: cambio.cedula,
            resultado: 'accion_no_soportada',
            accion: cambio.accion
          })
        }

      } catch (error) {
        console.error(`❌ Error procesando cambio para ${cambio.cedula}:`, error)
        errores.push({
          cedula: cambio.cedula,
          error: String(error)
        })
        mapeos.push({
          cedula: cambio.cedula,
          resultado: 'error',
          error: String(error)
        })
      }
    }

    console.log(`✅ SYNC PUSH completado: ${mapeos.length} mapeos, ${errores.length} errores`)

    return new Response(
      JSON.stringify({
        exitoso: errores.length === 0,
        procesados: cambios.length,
        exitosos: mapeos.filter((m) => m.resultado === 'creado' || m.resultado === 'paciente_existe').length,
        con_error: errores.length,
        mapeos: mapeos,
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
    console.error('❌ Error fatal en sync push:', error)

    return new Response(
      JSON.stringify({
        exitoso: false,
        error: String(error),
        tipo: 'error_fatal'
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
