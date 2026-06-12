import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  Deno.env.get('SUPABASE_URL')!,
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
)

interface CreateRequest {
  cedula: string
  nombre: string
  apellido: string
  fecha_nacimiento: string
  genero: string
  distrito_id: string
  telefono?: string
  email?: string
  direccion?: string
}

interface CreateResponse {
  exitoso: boolean
  hcu?: string
  paciente_id?: string
  mensaje: string
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

    // Verificar hospital
    const { data: hospital, error: hospitalError } = await supabase
      .from('nodo_central.hospitales_registrados')
      .select('id, codigo, distrito_id')
      .eq('api_key', apiKey)
      .single()

    if (hospitalError || !hospital) {
      return new Response(
        JSON.stringify({ error: 'API Key inválida' }),
        { status: 401, headers: { 'Content-Type': 'application/json' } }
      )
    }

    // Parsear body
    const body: CreateRequest = await req.json()

    // Validar campos obligatorios
    const requiredFields = ['cedula', 'nombre', 'apellido', 'fecha_nacimiento', 'genero', 'distrito_id']
    for (const field of requiredFields) {
      if (!body[field as keyof CreateRequest]) {
        return new Response(
          JSON.stringify({ error: `Campo obligatorio: ${field}` }),
          { status: 400, headers: { 'Content-Type': 'application/json' } }
        )
      }
    }

    // Validar formato de cédula (solo números, 6-12 dígitos)
    if (!/^\d{6,12}$/.test(body.cedula)) {
      return new Response(
        JSON.stringify({ error: 'Cédula inválida: solo números, 6-12 dígitos' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      )
    }

    // Validar fecha
    if (isNaN(new Date(body.fecha_nacimiento).getTime())) {
      return new Response(
        JSON.stringify({ error: 'Fecha de nacimiento inválida' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      )
    }

    // Crear paciente usando RPC
    const { data, error } = await supabase.rpc(
      'nodo_central.crear_paciente_central',
      {
        p_cedula: body.cedula,
        p_nombre: body.nombre,
        p_apellido: body.apellido,
        p_fecha_nacimiento: body.fecha_nacimiento,
        p_genero: body.genero,
        p_distrito_id: body.distrito_id,
        p_telefono: body.telefono || null,
        p_email: body.email || null,
        p_direccion: body.direccion || null
      }
    )

    if (error) {
      console.error('Error creando paciente:', error)
      
      // Registrar error
      await supabase
        .from('nodo_central.sincronizacion_log')
        .insert({
          hospital_id: hospital.id,
          tipo_sincronizacion: 'crear_paciente',
          direccion: 'hospital_a_central',
          estado: 'error',
          mensaje_error: error.message,
          payload: body
        })

      return new Response(
        JSON.stringify({ 
          exitoso: false, 
          mensaje: 'Error al crear paciente',
          error: error.message 
        }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      )
    }

    if (!data || data.length === 0 || !data[0].hcu_generado) {
      const mensaje = data?.[0]?.mensaje || 'Error desconocido'
      
      // Registrar error
      await supabase
        .from('nodo_central.sincronizacion_log')
        .insert({
          hospital_id: hospital.id,
          tipo_sincronizacion: 'crear_paciente',
          direccion: 'hospital_a_central',
          estado: 'error',
          mensaje_error: mensaje,
          payload: body
        })

      return new Response(
        JSON.stringify({ 
          exitoso: false, 
          mensaje 
        }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      )
    }

    const resultado = data[0]

    // Registrar éxito
    await supabase
      .from('nodo_central.sincronizacion_log')
      .insert({
        hospital_id: hospital.id,
        hcu: resultado.hcu_generado,
        tipo_sincronizacion: 'crear_paciente',
        direccion: 'hospital_a_central',
        estado: 'exitoso',
        payload: { ...body, hcu_generado: resultado.hcu_generado }
      })

    const response: CreateResponse = {
      exitoso: true,
      hcu: resultado.hcu_generado,
      paciente_id: resultado.id_paciente,
      mensaje: resultado.mensaje
    }

    return new Response(JSON.stringify(response), {
      headers: { 'Content-Type': 'application/json' },
      status: 201
    })
  } catch (error) {
    console.error('Error en función:', error)
    return new Response(
      JSON.stringify({ 
        exitoso: false, 
        mensaje: 'Error interno del servidor',
        error: error instanceof Error ? error.message : 'Desconocido'
      }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    )
  }
})
