import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  Deno.env.get('SUPABASE_URL')!,
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
)

interface SearchRequest {
  cedula: string
  hospital_id?: string
}

interface SearchResponse {
  encontrado: boolean
  paciente?: {
    id: string
    hcu: string
    cedula: string
    nombre_completo: string
    fecha_nacimiento: string
    genero: string
    alergias: string
    condiciones_cronicas: string
    tarjetas: Array<{
      numero_tarjeta: string
      hospital: string
      activa: boolean
      fecha_emision: string
    }>
  }
  error?: string
}

Deno.serve(async (req) => {
  // Validar método
  if (req.method !== 'POST') {
    return new Response(
      JSON.stringify({ error: 'Método no permitido' }),
      { status: 405, headers: { 'Content-Type': 'application/json' } }
    )
  }

  try {
    // Validar API Key
    const apiKey = req.headers.get('x-api-key')
    if (!apiKey) {
      return new Response(
        JSON.stringify({ error: 'API Key requerida' }),
        { status: 401, headers: { 'Content-Type': 'application/json' } }
      )
    }

    // Verificar que el hospital exista y API key sea válida
    const { data: hospital, error: hospitalError } = await supabase
      .from('nodo_central.hospitales_registrados')
      .select('id, codigo')
      .eq('api_key', apiKey)
      .single()

    if (hospitalError || !hospital) {
      return new Response(
        JSON.stringify({ error: 'API Key inválida' }),
        { status: 401, headers: { 'Content-Type': 'application/json' } }
      )
    }

    // Parsear body
    const body: SearchRequest = await req.json()

    if (!body.cedula) {
      return new Response(
        JSON.stringify({ error: 'Cédula requerida' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      )
    }

    // Buscar paciente
    const { data, error } = await supabase.rpc(
      'nodo_central.buscar_paciente_por_cedula',
      { p_cedula: body.cedula }
    )

    if (error) {
      console.error('Error buscando paciente:', error)
      return new Response(
        JSON.stringify({ error: 'Error en búsqueda' }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      )
    }

    if (!data || data.length === 0) {
      // Registrar intento de búsqueda
      await supabase
        .from('nodo_central.sincronizacion_log')
        .insert({
          hospital_id: hospital.id,
          tipo_sincronizacion: 'buscar_paciente',
          direccion: 'hospital_a_central',
          estado: 'exitoso',
          payload: { cedula: body.cedula, resultado: 'no_encontrado' }
        })

      const response: SearchResponse = {
        encontrado: false
      }
      return new Response(JSON.stringify(response), {
        headers: { 'Content-Type': 'application/json' },
        status: 200
      })
    }

    // Paciente encontrado
    const paciente = data[0]

    // Registrar búsqueda exitosa
    await supabase
      .from('nodo_central.sincronizacion_log')
      .insert({
        hospital_id: hospital.id,
        hcu: paciente.hcu,
        tipo_sincronizacion: 'buscar_paciente',
        direccion: 'hospital_a_central',
        estado: 'exitoso',
        payload: { cedula: body.cedula, resultado: 'encontrado' }
      })

    const response: SearchResponse = {
      encontrado: true,
      paciente: {
        id: paciente.id,
        hcu: paciente.hcu,
        cedula: paciente.cedula,
        nombre_completo: paciente.nombre_completo,
        fecha_nacimiento: paciente.fecha_nacimiento,
        genero: paciente.genero,
        alergias: paciente.alergias || '',
        condiciones_cronicas: paciente.condiciones_cronicas || '',
        tarjetas: paciente.tarjetas || []
      }
    }

    return new Response(JSON.stringify(response), {
      headers: { 'Content-Type': 'application/json' },
      status: 200
    })
  } catch (error) {
    console.error('Error en función:', error)
    return new Response(
      JSON.stringify({ error: 'Error interno del servidor' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    )
  }
})
