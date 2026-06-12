import { createClient, SupabaseClient } from '@supabase/supabase-js'

export interface PacientePendiente {
  cedula: string
  nombre: string
  apellido: string
  fecha_nacimiento: string
  nombre_distrito: string
  genero?: string
}

export interface EstadoSync {
  centros_locales: number
  profesionales_locales: number
  pacientes_con_hcu: number
  pacientes_pendientes: number
  cambios_en_cola: number
  ultima_sincronizacion: string | null
}

export class SyncService {
  private supabase: SupabaseClient
  private renaprosaUrl: string
  private renaprosaAnonKey: string
  private renaprosaServiceKey: string

  constructor(
    supabaseClient: SupabaseClient,
    renaprosaUrl: string = 'https://wdieynendfjbkbhfovrx.supabase.co',
    renaprosaAnonKey: string = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndkaWV5bmVuZGZqYmtiaGZvdnJ4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTA3ODI5MjEsImV4cCI6MjA2NjM1ODkyMX0.yFnLHavy8wzVjlg3sAI2mEG-XGDCV5FSr7OQsMefxL8',
    renaprosaServiceKey: string = 'REPLACE_RENAPROSA_SERVICE_KEY'
  ) {
    this.supabase = supabaseClient
    // RENAPROSA remoto (donde está Nodo Central)
    this.renaprosaUrl = renaprosaUrl
    this.renaprosaAnonKey = renaprosaAnonKey
    this.renaprosaServiceKey = renaprosaServiceKey
  }

  /**
   * Inicializa la copia local del hospital descargando referencias
   */
  async inicializarHospitalLocal(): Promise<{
    exitoso: boolean
    distritos?: number
    centros?: number
    profesionales?: number
    pacientes?: number
    error?: string
  }> {
    console.log('🔄 Inicializando copia local del hospital...')

    try {
      let totalDescargas = 0

      // 1. Descargar distritos
      const respDistritos = await this.pullDatos('distritos')
      if (respDistritos.exitoso && respDistritos.datos.length > 0) {
        await this.supabase
          .from('hospital_local.distritos_sincronizado')
          .upsert(respDistritos.datos, { onConflict: 'nombre_distrito' })
        totalDescargas += respDistritos.datos.length
        console.log(`  ✅ ${respDistritos.datos.length} distritos descargados`)
      }

      // 2. Descargar centros
      const respCentros = await this.pullDatos('centros')
      if (respCentros.exitoso && respCentros.datos.length > 0) {
        await this.supabase
          .from('hospital_local.centros_salud_sincronizado')
          .upsert(respCentros.datos, { onConflict: 'id' })
        totalDescargas += respCentros.datos.length
        console.log(`  ✅ ${respCentros.datos.length} centros descargados`)
      }

      // 3. Descargar profesionales
      const respProf = await this.pullDatos('profesionales')
      if (respProf.exitoso && respProf.datos.length > 0) {
        await this.supabase
          .from('hospital_local.profesionales_sincronizado')
          .upsert(respProf.datos, { onConflict: 'id' })
        totalDescargas += respProf.datos.length
        console.log(`  ✅ ${respProf.datos.length} profesionales descargados`)
      }

      // 4. Descargar pacientes existentes (últimos 10k)
      const respPacientes = await this.pullDatos('pacientes', { limite: 10000 })
      if (respPacientes.exitoso && respPacientes.datos.length > 0) {
        await this.supabase
          .from('hospital_local.pacientes_maestro_local')
          .upsert(respPacientes.datos, { onConflict: 'cedula' })
        totalDescargas += respPacientes.datos.length
        console.log(`  ✅ ${respPacientes.datos.length} pacientes descargados`)
      }

      console.log(`✅ Hospital inicializado - ${totalDescargas} registros totales`)

      return {
        exitoso: true,
        distritos: respDistritos.datos.length,
        centros: respCentros.datos.length,
        profesionales: respProf.datos.length,
        pacientes: respPacientes.datos.length
      }

    } catch (error) {
      console.error('❌ Error inicializando hospital:', error)
      return {
        exitoso: false,
        error: String(error)
      }
    }
  }

  /**
   * Crea un paciente localmente (sin conexión)
   */
  async crearPacienteLocal(paciente: PacientePendiente): Promise<{
    exitoso: boolean
    encontrado: boolean
    hcu?: string
    estado?: string
    error?: string
  }> {
    try {
      const { cedula, nombre, apellido, fecha_nacimiento, nombre_distrito, genero } = paciente

      // 1. Verificar si existe en copia local
      const { data: existe } = await this.supabase
        .from('hospital_local.pacientes_maestro_local')
        .select('hcu, nombre, apellido')
        .eq('cedula', cedula)
        .limit(1)

      if (existe && existe.length > 0) {
        console.log(`👤 Paciente encontrado en copia local: ${existe[0].hcu}`)
        return {
          exitoso: true,
          encontrado: true,
          hcu: existe[0].hcu,
          estado: 'sincronizado'
        }
      }

      // 2. Generar HCU temporal
      const { data: hcuResult } = await this.supabase.rpc(
        'hospital_local.fn_generar_hcu_temporal',
        { p_nombre_distrito: nombre_distrito }
      )

      if (!hcuResult) {
        throw new Error('Error generando HCU temporal')
      }

      console.log(`🆕 HCU temporal generado: ${hcuResult}`)

      // 3. Insertar paciente pendiente
      const { data: pacienteInsertado, error: errorInsert } = await this.supabase
        .from('hospital_local.pacientes_pendientes_sync')
        .insert({
          cedula,
          nombre,
          apellido,
          fecha_nacimiento,
          genero: genero || null,
          nombre_distrito,
          hcu_temporal: hcuResult,
          estado: 'pendiente'
        })
        .select()
        .single()

      if (errorInsert) {
        throw new Error(`Error insertando paciente: ${errorInsert.message}`)
      }

      // 4. Enqueue para sincronización
      await this.supabase.from('hospital_local.sync_queue').insert({
        accion: 'crear',
        entidad_tipo: 'paciente',
        entidad_id: pacienteInsertado.id,
        datos_nuevos: {
          cedula,
          nombre,
          apellido,
          fecha_nacimiento,
          nombre_distrito,
          genero: genero || null
        },
        prioridad: 1,
        estado: 'pendiente'
      })

      console.log(`✅ Paciente creado localmente - pendiente de sincronizar`)

      return {
        exitoso: true,
        encontrado: false,
        hcu: hcuResult,
        estado: 'pendiente_sincronizacion'
      }

    } catch (error) {
      console.error('❌ Error creando paciente local:', error)
      return {
        exitoso: false,
        encontrado: false,
        error: String(error)
      }
    }
  }

  /**
   * Sincroniza con el Nodo Central
   */
  async sincronizar(): Promise<{
    exitoso: boolean
    sincronizados?: number
    errores?: number
    mapeos?: any[]
    error?: string
  }> {
    console.log('🔄 Iniciando sincronización con Nodo Central...')

    try {
      // PASO 1: Descargar referencias nuevas
      console.log('📥 Paso 1: Descargando referencias...')
      const respRef = await this.pullDatos('distritos')
      if (respRef.exitoso && respRef.datos.length > 0) {
        await this.supabase
          .from('hospital_local.distritos_sincronizado')
          .upsert(respRef.datos, { onConflict: 'nombre_distrito' })
      }

      // PASO 2: Obtener cambios pendientes de la cola
      console.log('📋 Paso 2: Obteniendo cambios pendientes...')
      const { data: pendientes, error: errorPendientes } = await this.supabase
        .from('hospital_local.sync_queue')
        .select('*')
        .eq('estado', 'pendiente')
        .order('prioridad', { ascending: true })
        .order('fecha_creacion', { ascending: true })

      if (errorPendientes) {
        throw new Error(`Error obteniendo cambios pendientes: ${errorPendientes.message}`)
      }

      if (!pendientes || pendientes.length === 0) {
        console.log('✅ No hay cambios pendientes')
        return { exitoso: true, sincronizados: 0 }
      }

      console.log(`📤 Paso 3: Enviando ${pendientes.length} cambios...`)

      // PASO 3: Enviar cambios al Central
      const respPush = await this.pushDatos(
        pendientes.map((p) => ({
          ...p.datos_nuevos,
          accion: p.accion
        }))
      )

      if (!respPush.exitoso) {
        throw new Error(respPush.error || 'Error en push')
      }

      const mapeos = respPush.mapeos || []

      console.log(`🔄 Paso 4: Actualizando mapeos...`)

      // PASO 4: Actualizar HCU y marcar como completado
      for (const mapeo of mapeos) {
        if (mapeo.resultado === 'creado' || mapeo.resultado === 'paciente_existe') {
          // Insertar en pacientes_maestro_local
          await this.supabase
            .from('hospital_local.pacientes_maestro_local')
            .upsert({
              hcu: mapeo.hcu,
              cedula: mapeo.cedula,
              estado: 'activo'
            }, { onConflict: 'cedula' })

          // Registrar mapeo
          const { data: pendiente } = await this.supabase
            .from('hospital_local.pacientes_pendientes_sync')
            .select('id')
            .eq('cedula', mapeo.cedula)
            .limit(1)

          if (pendiente && pendiente.length > 0) {
            // Insertar mapeo HCU
            await this.supabase.from('hospital_local.hcu_mapping').insert({
              hcu_temporal: pendiente[0].hcu_temporal,
              hcu_real: mapeo.hcu,
              cedula: mapeo.cedula,
              paciente_pendientes_id: pendiente[0].id
            })

            // Marcar paciente como completado
            await this.supabase
              .from('hospital_local.pacientes_pendientes_sync')
              .update({
                hcu_final: mapeo.hcu,
                estado: 'completado'
              })
              .eq('cedula', mapeo.cedula)

            // Actualizar sync_queue
            const { data: queueItems } = await this.supabase
              .from('hospital_local.sync_queue')
              .select('id')
              .eq('entidad_id', pendiente[0].id)

            if (queueItems && queueItems.length > 0) {
              await this.supabase
                .from('hospital_local.sync_queue')
                .update({ estado: 'completado' })
                .eq('id', queueItems[0].id)
            }
          }
        }
      }

      // Log de sincronización
      await this.supabase.from('hospital_local.sync_log_local').insert({
        tipo_evento: 'sincronizacion_completada',
        estado: 'exitoso',
        detalles: {
          cambios_procesados: pendientes.length,
          mapeos: mapeos.length
        }
      })

      console.log(`✅ Sincronización completada - ${mapeos.length} cambios procesados`)

      return {
        exitoso: true,
        sincronizados: mapeos.length,
        mapeos
      }

    } catch (error) {
      console.error('❌ Error en sincronización:', error)

      await this.supabase.from('hospital_local.sync_log_local').insert({
        tipo_evento: 'error_sincronizacion',
        estado: 'error',
        detalles: { error: String(error) }
      })

      return {
        exitoso: false,
        error: String(error)
      }
    }
  }

  /**
   * Obtiene el estado actual de sincronización desde las tablas locales
   * Maneja gracefully cuando las tablas no existen (HOSIX sin schema hospital_local)
   */
  async obtenerEstadoSync(): Promise<EstadoSync | null> {
    try {
      // Intenta obtener datos, pero si las tablas no existen, retorna valores por defecto
      const [centros, profesionales, pacientesHCU, pacientesPendientes, cambios, lastSync] = await Promise.allSettled([
        this.supabase.from('hospital_local.centros_salud_sincronizado').select('COUNT(*)', { count: 'exact' }),
        this.supabase.from('hospital_local.profesionales_sincronizado').select('COUNT(*)', { count: 'exact' }),
        this.supabase.from('hospital_local.pacientes_maestro_local').select('COUNT(*)', { count: 'exact' }).not('hcu', 'is', null),
        this.supabase.from('hospital_local.pacientes_pendientes_sync').select('COUNT(*)', { count: 'exact' }).eq('estado', 'pendiente'),
        this.supabase.from('hospital_local.sync_queue').select('COUNT(*)', { count: 'exact' }).eq('estado', 'pendiente'),
        this.supabase.from('hospital_local.sync_log_local').select('fecha_ultimo_intento').eq('tipo_evento', 'sincronizacion_completada').order('fecha_ultimo_intento', { ascending: false }).limit(1)
      ])

      const getCountFromResult = (result: PromiseSettledResult<any>) => {
        if (result.status === 'fulfilled') {
          return result.value.count || 0
        }
        return 0
      }

      const getLastSync = (result: PromiseSettledResult<any>) => {
        if (result.status === 'fulfilled' && result.value.data && result.value.data.length > 0) {
          return result.value.data[0].fecha_ultimo_intento
        }
        return null
      }

      return {
        centros_locales: getCountFromResult(centros),
        profesionales_locales: getCountFromResult(profesionales),
        pacientes_con_hcu: getCountFromResult(pacientesHCU),
        pacientes_pendientes: getCountFromResult(pacientesPendientes),
        cambios_en_cola: getCountFromResult(cambios),
        ultima_sincronizacion: getLastSync(lastSync)
      }

    } catch (error) {
      console.error('❌ Error obteniendo estado:', error)
      return {
        centros_locales: 0,
        profesionales_locales: 0,
        pacientes_con_hcu: 0,
        pacientes_pendientes: 0,
        cambios_en_cola: 0,
        ultima_sincronizacion: null
      }
    }
  }

  // Métodos privados

  private async pullDatos(tipo: string, opciones: any = {}): Promise<any> {
    try {
      // Llamar a Edge Functions EN RENAPROSA (donde está el Nodo Central)
      // Las funciones requieren el anon key como Bearer token
      const response = await fetch(
        `${this.renaprosaUrl}/functions/v1/sync-pull`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${this.renaprosaAnonKey}`
          },
          body: JSON.stringify({
            tipo,
            ...opciones
          })
        }
      )

      if (!response.ok) {
        const errorBody = await response.text()
        console.error(`❌ Sync-pull HTTP ${response.status}: ${errorBody}`)
        throw new Error(`HTTP ${response.status}: ${response.statusText}`)
      }

      const resultado = await response.json()
      console.log(`📥 Pull ${tipo} exitoso: ${resultado.registros || 0} registros`)
      return resultado

    } catch (error) {
      console.error(`❌ Error en pull ${tipo}:`, error)
      return { exitoso: false, datos: [], error: String(error) }
    }
  }

  private async pushDatos(cambios: any[]): Promise<any> {
    try {
      // Llamar a Edge Functions EN RENAPROSA (donde está el Nodo Central)
      // Las funciones requieren el service key como Bearer token para escribir
      const response = await fetch(
        `${this.renaprosaUrl}/functions/v1/sync-push`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${this.renaprosaServiceKey}`
          },
          body: JSON.stringify({ cambios })
        }
      )

      if (!response.ok) {
        const errorBody = await response.text()
        console.error(`❌ Sync-push HTTP ${response.status}: ${errorBody}`)
        throw new Error(`HTTP ${response.status}: ${response.statusText}`)
      }

      const resultado = await response.json()
      console.log(`📤 Push exitoso: ${resultado.procesados} cambios procesados`)
      return resultado

    } catch (error) {
      console.error('❌ Error en push:', error)
      return { exitoso: false, error: String(error) }
    }
  }
}

/**
 * Hook de React para usar SyncService
 * Apunta a RENAPROSA remoto por defecto
 */
export function useSyncService(supabase: SupabaseClient) {
  const syncService = new SyncService(
    supabase,
    'https://wdieynendfjbkbhfovrx.supabase.co',  // RENAPROSA remoto
    'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndkaWV5bmVuZGZqYmtiaGZvdnJ4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTA3ODI5MjEsImV4cCI6MjA2NjM1ODkyMX0.yFnLHavy8wzVjlg3sAI2mEG-XGDCV5FSr7OQsMefxL8',  // Anon key de RENAPROSA
    import.meta.env.VITE_RENAPROSA_SERVICE_KEY || 'REPLACE_RENAPROSA_SERVICE_KEY'  // Service key de RENAPROSA
  )

  // Detectar conexión y sincronizar automáticamente
  React.useEffect(() => {
    const handleOnline = async () => {
      console.log('📡 Conexión disponible - iniciando sync con RENAPROSA')
      await syncService.sincronizar()
    }

    const handleOffline = () => {
      console.log('📴 Sin conexión - modo offline (consultando BD local)')
    }

    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)

    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  }, [syncService])

  return syncService
}

// Import React para el hook
import React from 'react'
