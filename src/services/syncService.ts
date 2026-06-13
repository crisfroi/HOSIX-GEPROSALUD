import React from 'react'
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
  private supabaseHospital: SupabaseClient
  private renaprosaUrl: string
  private renaprosaAnonKey: string
  private renaprosaServiceKey: string
  private centroSaludId: string | null = null

  constructor(
    supabaseClient: SupabaseClient,
    renaprosaUrl: string = 'https://wdieynendfjbkbhfovrx.supabase.co',
    renaprosaAnonKey: string = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndkaWV5bmVuZGZqYmtiaGZvdnJ4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTA3ODI5MjEsImV4cCI6MjA2NjM1ODkyMX0.yFnLHavy8wzVjlg3sAI2mEG-XGDCV5FSr7OQsMefxL8',
    renaprosaServiceKey: string = 'REPLACE_RENAPROSA_SERVICE_KEY',
    centroSaludId: string | null = null
  ) {
    const { supabaseUrl, supabaseKey } = (supabaseClient as any)
    
    console.log('🔌 [SyncService] Instanciando cliente Supabase con esquema de aislamiento "hospital_local"');
    this.supabaseHospital = createClient(supabaseUrl, supabaseKey, {
      auth: { persistSession: false },
      db: { schema: 'hospital_local' }
    })

    this.renaprosaUrl = renaprosaUrl
    this.renaprosaAnonKey = renaprosaAnonKey
    this.renaprosaServiceKey = renaprosaServiceKey
    this.centroSaludId = centroSaludId
    console.log(`🎯 [SyncService] ID de Centro asignado inicialmente en constructor:`, centroSaludId);
  }

  establecerCentroSalud(centroId: string) {
    this.centroSaludId = centroId
    console.log(`🏥 [SyncService] Ajuste dinámico de hospital_config -> Centro Asignado: ${centroId}`)
  }

  async inicializarHospitalLocal(): Promise<{
    exitoso: boolean
    distritos?: number
    centros?: number
    profesionales?: number
    pacientes?: number
    error?: string
  }> {
    console.log('🏁 [START INICIALIZACIÓN] Iniciando sincronización estructural profunda...');
    console.log(`ℹ️ [Config actual] Buscando datos para Centro ID: ${this.centroSaludId || 'Global / Todo (Advertencia)'}`);
    
    try {
      let totalDescargas = 0;

      // A. DISTRITOS
      console.log('⏳ [A] Invocando pull de catálogos de Distritos Sanitarios...');
      const respDistritos = await this.pullDatos('distritos');
      console.log('📡 [A Respuesta Central]', respDistritos);
      
      if (respDistritos.exitoso && respDistritos.datos && respDistritos.datos.length > 0) {
        const distritosMap = respDistritos.datos.map((d: any) => ({
          nombre_distrito: d.nombre_distrito,
          abreviatura_provincia: d.abreviatura_provincia,
          nombre_provincia: d.nombre_provincia,
          abreviatura_distrito: d.abreviatura_distrito,
          sincronizado_desde_central: new Date().toISOString(),
          version_central: d.version_renaprosa || 1
        }));
        
        console.log(`💾 Guardando en cascada ${distritosMap.length} distritos sanitarios locales...`);
        const { error } = await this.supabaseHospital
          .from('distritos_sincronizado')
          .upsert(distritosMap, { onConflict: 'nombre_distrito' });
        
        if (error) throw new Error(`Error insertando distritos: ${error.message}`);
        totalDescargas += distritosMap.length;
        console.log('✅ Catálogo de distritos consolidado perfectamente.');
      }

      // B. CENTROS DE SALUD (Aislamiento de nodo activo)
      console.log('⏳ [B] Invocando pull de Centros de Salud...');
      const respCentros = await this.pullDatos('centros');
      console.log('📡 [B Respuesta Central]', respCentros);
      
      if (respCentros.exitoso && respCentros.datos && respCentros.datos.length > 0) {
        // Si hay centro configurado, filtramos en cliente para forzar el nodo
        let centrosFiltrados = respCentros.datos;
        if (this.centroSaludId) {
          centrosFiltrados = respCentros.datos.filter((c: any) => c.id === this.centroSaludId);
          console.log(`✂️ Filtro aplicado: Reduciendo de ${respCentros.datos.length} centros globales a ${centrosFiltrados.length} local asignado.`);
        }

        const centrosMap = centrosFiltrados.map((c: any) => ({
          id: c.id,
          nombre: c.nombre,
          categoria: c.categoria,
          subcategoria: c.subcategoria,
          provincia: c.provincia,
          distrito: c.distrito,
          distrito_sanitario: c.distrito_sanitario,
          sector: c.sector,
          director: c.director,
          telefono: c.telefono,
          especialidades: c.especialidades,
          estado: c.estado,
          numero_registro: c.numero_registro,
          fecha_registro: c.fecha_registro,
          nif: c.nif,
          responsable: c.responsable,
          fotos_establecimiento: c.fotos_establecimiento,
          sincronizado_desde_central: new Date().toISOString(),
          version_central: c.version_renaprosa || 1
        }));

        console.log(`💾 Escribiendo ${centrosMap.length} registros en centros_salud_sincronizado...`);
        const { error } = await this.supabaseHospital
          .from('centros_salud_sincronizado')
          .upsert(centrosMap, { onConflict: 'id' });
        
        if (error) throw new Error(`Error insertando centros: ${error.message}`);
        totalDescargas += centrosMap.length;
      }

      // C. PROFESIONALES ASIGNADOS (Filtro para evitar la descarga de los 37 globales)
      console.log('⏳ [C] Invocando pull del cuerpo médico nacional...');
      const respProf = await this.pullDatos('profesionales');
      console.log('📡 [C Respuesta Central]', respProf);
      
      if (respProf.exitoso && respProf.datos && respProf.datos.length > 0) {
        let profesionalesFiltrados = respProf.datos;
        
        // CORRECCIÓN RADICAL: Forzamos el filtrado por tu hospital activo
        if (this.centroSaludId) {
          profesionalesFiltrados = respProf.datos.filter((p: any) => p.centro_salud_id === this.centroSaludId);
          console.log(`🎯 [AISLAMIENTO] Filtrando profesionales de este centro. Reduciendo de ${respProf.datos.length} globales a ${profesionalesFiltrados.length} locales de este hospital.`);
        } else {
          console.warn('⚠️ No se ha detectado centroSaludId en el servicio. Se cargarán todos los profesionales libres.');
        }

        const profMap = profesionalesFiltrados.map((p: any) => ({
          id: p.id,
          nombre_completo: p.nombre_completo,
          numero_dip: p.numero_dip,
          area_profesional: p.area_profesional,
          especialidad: p.especialidad,
          provincia: p.provincia,
          distrito: p.distrito,
          distrito_sanitario: p.distrito_sanitario,
          categoria_centro: p.categoria_centro,
          tipo_sector: p.tipo_sector,
          centro_salud_id: p.centro_salud_id,
          nombre_centro: p.nombre_centro,
          estado_solicitud: p.estado_solicitud,
          fecha_aprobacion: p.fecha_aprobacion,
          funcion_publica: p.funcion_publica,
          estatus_funcionario: p.estatus_funcionario,
          sincronizado_desde_central: new Date().toISOString(),
          version_central: p.version_renaprosa || 1
        }));

        // Limpieza de seguridad previa para no dejar fantasmas de los 37 antiguos si existieran
        if (this.centroSaludId) {
          console.log('🧹 Limpiando registros antiguos que pertenezcan a otros centros...');
          await this.supabaseHospital.from('profesionales_sincronizado').delete().neq('centro_salud_id', this.centroSaludId);
        }

        console.log(`💾 Guardando base local: ${profMap.length} profesionales médicos vinculados asignados.`);
        const { error } = await this.supabaseHospital
          .from('profesionales_sincronizado')
          .upsert(profMap, { onConflict: 'id' });
        
        if (error) throw new Error(`Error insertando profesionales: ${error.message}`);
        totalDescargas += profMap.length;
      }

      // D. PACIENTES MAESTRO
      console.log('⏳ [D] Ejecutando pull masivo de la libreta de Pacientes...');
      const respPacientes = await this.pullDatos('pacientes', { limite: 2000 });
      console.log('📡 [D Respuesta Central]', respPacientes);
      
      if (respPacientes.exitoso && respPacientes.datos && respPacientes.datos.length > 0) {
        const pacientesMap = respPacientes.datos.map((p: any) => ({
          id: p.id,
          hcu: p.hcu,
          cedula: p.cedula,
          nombre: p.nombre,
          apellido: p.apellido,
          fecha_nacimiento: p.fecha_nacimiento,
          genero: p.genero,
          estado: p.estado || 'activo',
          sincronizado_desde_central: new Date().toISOString(),
          version_central: 1
        }));

        console.log(`💾 Escribiendo base de datos maestra local de pacientes (${pacientesMap.length} registros)...`);
        const { error } = await this.supabaseHospital
          .from('pacientes_maestro_local')
          .upsert(pacientesMap, { onConflict: 'cedula' });
        
        if (error) throw new Error(`Error insertando pacientes: ${error.message}`);
        totalDescargas += pacientesMap.length;
      }

      console.log(`🏁 [FIN DE INICIALIZACIÓN SUCCESFUL] Total de operaciones locales indexadas: ${totalDescargas}`);
      return {
        exitoso: true,
        distritos: respDistritos.datos?.length || 0,
        centros: respCentros.datos?.length || 0,
        profesionales: respProf.datos?.length || 0, // Se reporta lo procesado filtrado por el cliente
        pacientes: respPacientes.datos?.length || 0
      }
    } catch (error: any) {
      console.error('💥 [CRITICAL CRASH IN INITIALIZATION]', error);
      return { exitoso: false, error: error.message || String(error) }
    }
  }

  async crearPacienteLocal(paciente: PacientePendiente): Promise<{
    exitoso: boolean; encontrado: boolean; hcu?: string; estado?: string; error?: string
  }> {
    console.log(`📝 [Crear Paciente] Evaluando inserción local: Cédula ${paciente.cedula}`);
    try {
      const { cedula, nombre, apellido, fecha_nacimiento, nombre_distrito, genero } = paciente

      const { data: existe, error: errCheck } = await this.supabaseHospital
        .from('pacientes_maestro_local')
        .select('hcu')
        .eq('cedula', cedula)
        .limit(1)

      if (errCheck) console.error('⚠️ Advertencia en verificación previa:', errCheck);

      if (existe && existe.length > 0) {
        console.log(`🎯 Paciente localizado en tabla local. Usando HCU existente: ${existe[0].hcu}`);
        return { exitoso: true, encontrado: true, hcu: existe[0].hcu, estado: 'sincronizado' }
      }

      console.log(`🧮 Solicitando firma HCU provisional al motor de la BD local...`);
      const { data: hcuResult, error: errRpc } = await this.supabaseHospital.rpc(
        'fn_generar_hcu_temporal',
        { p_nombre_distrito: nombre_distrito }
      );

      if (errRpc || !hcuResult) throw new Error(`La función fn_generar_hcu_temporal falló: ${errRpc?.message}`);
      console.log(`⚙️ HCU Temporal asignado provisionalmente: ${hcuResult}`);

      const { data: pacienteInsertado, error: errorInsert } = await this.supabaseHospital
        .from('pacientes_pendientes_sync')
        .insert({
          cedula, nombre, apellido, fecha_nacimiento,
          genero: genero || null,
          nombre_distrito, hcu_temporal: hcuResult, estado: 'pendiente'
        })
        .select().single()

      if (errorInsert) throw new Error(`Error en buffer local: ${errorInsert.message}`)

      await this.supabaseHospital.from('sync_queue').insert({
        accion: 'crear',
        entidad_tipo: 'paciente',
        entidad_id: pacienteInsertado.id,
        datos_nuevos: { cedula, nombre, apellido, fecha_nacimiento, nombre_distrito, genero: genero || null },
        prioridad: 1,
        estado: 'pendiente'
      });

      console.log(`✅ Registro acoplado con éxito al búfer.`);
      return { exitoso: true, encontrado: false, hcu: hcuResult, estado: 'pendiente_sincronizacion' }
    } catch (error) {
      console.error('❌ Excepción atrapada en creación de paciente offline:', error)
      return { exitoso: false, encontrado: false, error: String(error) }
    }
  }

  async sincronizar(): Promise<{
    exitoso: boolean; sincronizados?: number; errores?: number; mapeos?: any[]; error?: string
  }> {
    console.log('🚀 [SINCRONIZACIÓN] Iniciando ráfaga bidireccional...');
    try {
      const respRef = await this.pullDatos('distritos')
      if (respRef.exitoso && respRef.datos.length > 0) {
        await this.supabaseHospital.from('distritos_sincronizado').upsert(respRef.datos, { onConflict: 'nombre_distrito' })
      }

      console.log('📅 Leyendo logs históricos para calcular delta incremental...');
      const { data: ultimoLog } = await this.supabaseHospital
        .from('sync_log_local')
        .select('created_at')
        .eq('tipo_evento', 'sincronizacion_completada')
        .eq('estado', 'exitoso')
        .order('created_at', { ascending: false })
        .limit(1);

      const fechaUltimaSync = ultimoLog && ultimoLog.length > 0 ? ultimoLog[0].created_at : null;
      console.log(`📶 Descargando registros centrales modificados después de: ${fechaUltimaSync || 'El inicio de los tiempos'}`);

      const respPacientesNuevos = await this.pullDatos('pacientes', { 
        fecha_ultima_sync: fechaUltimaSync,
        limite: 2000 
      })

      if (respPacientesNuevos.exitoso && respPacientesNuevos.datos.length > 0) {
        console.log(`📥 Descargados ${respPacientesNuevos.datos.length} nuevos pacientes. Combinando maestros...`);
        const pacientesMap = respPacientesNuevos.datos.map((p: any) => ({
          id: p.id,
          hcu: p.hcu,
          cedula: p.cedula,
          nombre: p.nombre,
          apellido: p.apellido,
          fecha_nacimiento: p.fecha_nacimiento,
          genero: p.genero,
          estado: p.estado || 'activo',
          sincronizado_desde_central: new Date().toISOString(),
          version_central: 1
        }))
        await this.supabaseHospital.from('pacientes_maestro_local').upsert(pacientesMap, { onConflict: 'cedula' })
      }

      console.log('⏳ Extrayendo eventos de la cola transaccional local sync_queue...');
      const { data: pendientes, error: errorPendientes } = await this.supabaseHospital
        .from('sync_queue')
        .select('*')
        .eq('estado', 'pendiente')
        .order('prioridad', { ascending: true })

      if (errorPendientes) throw new Error(errorPendientes.message);
      
      if (!pendientes || pendientes.length === 0) {
        console.log('✨ Cola limpia. No hay cambios locales que subir al Nodo Central.');
        await this.supabaseHospital.from('sync_log_local').insert({
          tipo_evento: 'sincronizacion_completada', 
          estado: 'exitoso',
          detalles: { cambios_subidos: 0, cambios_descargados: respPacientesNuevos.datos?.length || 0 }
        })
        return { exitoso: true, sincronizados: 0 }
      }

// 📤 Enviando los registros pendientes de subida incorporando el ID del Centro de Salud local
const respPush = await this.pushDatos(
  pendientes.map((p) => ({ 
    ...p.datos_nuevos, 
    accion: p.accion,
    centro_salud_id: this.centroSaludId // Inyección crítica del nodo origen
  }))
)

if (!respPush.exitoso) throw new Error(respPush.error);

const mapeos = respPush.mapeos || [];
console.log(`⛓️ Mapeos de HCU recibidos desde el nodo central: ${mapeos.length}`);

for (const mapeo of mapeos) {
  // Manejamos de forma idéntica si fue creado de cero o si se unificó por deduplicación
  if (mapeo.resultado === 'creado' || mapeo.resultado === 'paciente_existe') {
    
    // 1. Actualizar/Insertar en la caché maestra local
    await this.supabaseHospital
      .from('pacientes_maestro_local')
      .upsert({ hcu: mapeo.hcu, cedula: mapeo.cedula, estado: 'activo' }, { onConflict: 'cedula' })

    // 2. Localizar el ID exacto del registro de la tabla de admisión temporal
    const { data: pendiente } = await this.supabaseHospital
      .from('pacientes_pendientes_sync')
      .select('id, hcu_temporal')
      .eq('cedula', mapeo.cedula)
      .limit(1)

    if (pendiente && pendiente.length > 0) {
      // Registrar el mapeo histórico
      await this.supabaseHospital.from('hcu_mapping').insert({
        hcu_temporal: pendiente[0].hcu_temporal,
        hcu_real: mapeo.hcu,
        cedula: mapeo.cedula,
        paciente_pendientes_id: pendiente[0].id
      })

      // Cerrar admisión temporal local
      await this.supabaseHospital
        .from('pacientes_pendientes_sync')
        .update({ hcu_final: mapeo.hcu, estado: 'completado' })
        .eq('cedula', mapeo.cedula)

      // CORRECCIÓN AQUÍ: Cambiamos 'entidad_id' por el id real de la tabla de pendientes_sync
      // y limpiamos la cola transaccional para ESTE paciente específico con éxito
      await this.supabaseHospital
        .from('sync_queue')
        .update({ estado: 'completado' })
        .eq('entidad_id', pendiente[0].id)
        .eq('entidad_tipo', 'paciente')
        
      console.log(`   └─ [SINCRONIZADO OK] Cédula ${mapeo.cedula} consolidada y cerrada.`);
    }
  } else if (mapeo.resultado === 'error') {
    console.error(`❌ El lote central rechazó el registro ${mapeo.cedula}. Razón: ${mapeo.error}`);
    // Opcional: Podrías marcar el sync_queue como 'fallido' para no reintentarlo
    // o dejarlo pendiente para revisión manual del administrador de admisión.
  }
}

      await this.supabaseHospital.from('sync_log_local').insert({
        tipo_evento: 'sincronizacion_completada', 
        estado: 'exitoso',
        detalles: { cambios_procesados: pendientes.length, mapeos: mapeos.length, cambios_descargados: respPacientesNuevos.datos?.length || 0 }
      });

      return { exitoso: true, sincronizados: mapeos.length, mapeos }
    } catch (error) {
      console.error('💥 Error crítico en proceso de sincronización:', error);
      try {
        await this.supabaseHospital.from('sync_log_local').insert({
          tipo_evento: 'sincronizacion_completada', estado: 'fallido', detalles: { error: String(error) }
        })
      } catch (e) {}
      return { exitoso: false, error: String(error) }
    }
  }

  async obtenerEstadoSync(): Promise<EstadoSync | null> {
    console.log('📊 [SyncService] Ejecutando lectura de métricas PostgREST...');
    try {
      const [centros, profesionales, pacientesHCU, pacientesPendientes, cambios, lastSync] = await Promise.allSettled([
        this.supabaseHospital.from('centros_salud_sincronizado').select('*', { count: 'exact', head: true }),
        this.supabaseHospital.from('profesionales_sincronizado').select('*', { count: 'exact', head: true }),
        this.supabaseHospital.from('pacientes_maestro_local').select('*', { count: 'exact', head: true }).not('hcu', 'is', null),
        this.supabaseHospital.from('pacientes_pendientes_sync').select('*', { count: 'exact', head: true }).eq('estado', 'pendiente'),
        this.supabaseHospital.from('sync_queue').select('*', { count: 'exact', head: true }).eq('estado', 'pendiente'),
        this.supabaseHospital.from('sync_log_local').select('*').eq('tipo_evento', 'sincronizacion_completada').order('created_at', { ascending: false }).limit(1)
      ])

      const getCountFromResult = (result: PromiseSettledResult<any>, label: string) => {
        if (result.status === 'fulfilled') {
          console.log(`   📈 [Métrica ${label}]:`, result.value.count);
          return result.value.count || 0;
        }
        console.error(`   ❌ [Métrica ${label} Fallida]:`, (result as PromiseRejectedResult).reason);
        return 0;
      };

      const getLastSync = (result: PromiseSettledResult<any>) => {
        if (result.status === 'fulfilled' && result.value.data && result.value.data.length > 0) {
          return result.value.data[0].created_at;
        }
        return null;
      };

      return {
        centros_locales: getCountFromResult(centros, 'Centros'),
        profesionales_locales: getCountFromResult(profesionales, 'Profesionales'),
        pacientes_con_hcu: getCountFromResult(pacientesHCU, 'Pacientes_HCU'),
        pacientes_pendientes: getCountFromResult(pacientesPendientes, 'Pacientes_Pend'),
        cambios_en_cola: getCountFromResult(cambios, 'Queue'),
        ultima_sincronizacion: getLastSync(lastSync)
      }
    } catch (error) {
      console.error('❌ Error total leyendo métricas del estado:', error);
      return null
    }
  }

  private async pullDatos(tipo: string, opciones: any = {}): Promise<any> {
    try {
      const response = await fetch(`${this.renaprosaUrl}/functions/v1/sync-pull`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${this.renaprosaAnonKey}` },
        body: JSON.stringify({ tipo, centro_salud_id: this.centroSaludId, ...opciones })
      })
      return await response.json()
    } catch (error) {
      console.error(`Error de red en pull de [${tipo}]:`, error);
      return { exitoso: false, datos: [] }
    }
  }

  /**
   * Envía pacientes nuevos al nodo central (RENAPROSA)
   *
   * FLUJO:
   * 1. Lee pacientes de hospital_local.pacientes_pendientes_sync (estado='pendiente')
   * 2. Envía vía Edge Function sync-push a RENAPROSA
   * 3. RENAPROSA:
   *    - Verifica si cedula existe
   *    - Si existe: retorna HCU existente
   *    - Si no existe: crea paciente + genera HCU real
   * 4. Actualiza localmente:
   *    - pacientes_maestro_local: inserta con HCU real
   *    - pacientes_pendientes_sync: marca como 'sincronizado' con HCU real
   */
  async pushPacientes(): Promise<{
    exitoso: boolean
    procesados?: number
    sincronizados?: number
    errores?: number
    mapeos?: any[]
    error?: string
  }> {
    try {
      console.log('📤 Iniciando envío de pacientes locales al Nodo Central...')

      // 1. Leer pacientes pendientes de sincronización
      const { data: pacientesPendientes, error: errorLectura } = await this.supabase
        .from('hospital_local.pacientes_pendientes_sync')
        .select('*')
        .eq('estado', 'pendiente')

      if (errorLectura) throw errorLectura

      if (!pacientesPendientes || pacientesPendientes.length === 0) {
        console.log('✨ No hay pacientes pendientes de sincronización')
        return { exitoso: true, procesados: 0, sincronizados: 0, errores: 0, mapeos: [] }
      }

      console.log(`📋 ${pacientesPendientes.length} pacientes pendientes encontrados`)

      // 2. Preparar datos para enviar
      const cambios = pacientesPendientes.map((p: any) => ({
        accion: 'crear',
        cedula: p.cedula,
        nombre: p.nombre,
        apellido: p.apellido,
        fecha_nacimiento: p.fecha_nacimiento,
        nombre_distrito: p.nombre_distrito,
        genero: p.genero || undefined
      }))

      // 3. Enviar a RENAPROSA via Edge Function
      const resultado = await this.pushDatos(cambios)

      if (!resultado.exitoso) {
        console.error('❌ Error en sync-push:', resultado.error)
        return { exitoso: false, error: resultado.error }
      }

      const mapeos = resultado.mapeos || []
      console.log(`✅ Recibidos ${mapeos.length} mapeos de HCU desde Nodo Central`)

      // 4. Actualizar localmente con HCUs reales
      let sincronizados = 0
      let errores = 0

      for (const mapeo of mapeos) {
        try {
          if (mapeo.resultado === 'creado' || mapeo.resultado === 'paciente_existe') {
            const hcu = mapeo.hcu
            const cedula = mapeo.cedula

            // Insertar en tabla de maestro (pacientes confirmados)
            await this.supabase
              .from('hospital_local.pacientes_maestro_local')
              .upsert({
                hcu,
                cedula,
                nombre: mapeo.nombre,
                apellido: mapeo.apellido,
                estado: 'activo'
              }, { onConflict: 'cedula' })

            // Actualizar paciente pendiente a sincronizado
            await this.supabase
              .from('hospital_local.pacientes_pendientes_sync')
              .update({
                estado: 'sincronizado',
                hcu_final: hcu,
                fecha_ultimo_sync_intento: new Date().toISOString()
              })
              .eq('cedula', cedula)

            sincronizados++
            console.log(`✅ Paciente sincronizado: ${cedula} → HCU: ${hcu}`)
          } else {
            errores++
            console.warn(`⚠️ Paciente no sincronizado: ${mapeo.cedula} (${mapeo.resultado})`)
          }
        } catch (err) {
          errores++
          console.error(`❌ Error procesando mapeo de ${mapeo.cedula}:`, err)
        }
      }

      // 5. Registrar en log local
      await this.supabase
        .from('hospital_local.sync_log_local')
        .insert({
          tipo_evento: 'pacientes_sincronizados',
          estado: 'exitoso',
          detalles: {
            procesados: pacientesPendientes.length,
            sincronizados,
            errores
          }
        })

      console.log(`📊 Resumen push: ${sincronizados} sincronizados, ${errores} errores`)

      return {
        exitoso: errores === 0,
        procesados: pacientesPendientes.length,
        sincronizados,
        errores,
        mapeos
      }

    } catch (error) {
      console.error('❌ Error en pushPacientes:', error)
      return { exitoso: false, error: String(error) }
    }
  }

  private async pushDatos(cambios: any[]): Promise<any> {
    try {
      const response = await fetch(`${this.renaprosaUrl}/functions/v1/sync-push`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${this.renaprosaServiceKey}` },
        body: JSON.stringify({ cambios })
      })
      return await response.json()
    } catch (error) {
      return { exitoso: false, error: String(error) }
    }
  }
}

export function useSyncService(supabase: SupabaseClient, centroSaludId?: string) {
  const [syncService, setSyncService] = React.useState<SyncService | null>(null)

  React.useEffect(() => {
    const loadConfiguration = async () => {
      let centroId = centroSaludId
      console.log('🔍 [Hook useSyncService] Evaluando credenciales de hospital_config...');
      
      if (!centroId) {
        try {
          const { data, error } = await supabase.from('hospital_config').select('centro_salud_id').eq('activo', true).limit(1)
          if (error) console.error('Error leyendo hospital_config local:', error);
          if (data && data.length > 0) {
            centroId = data[0].centro_salud_id;
            console.log(`🎯 [Hook] Encontrado Centro Activo en configuración local: ${centroId}`);
          }
        } catch (err) {
          console.error('Fallo capturando configuración automática:', err);
        }
      }

      const instance = new SyncService(
        supabase,
        'https://wdieynendfjbkbhfovrx.supabase.co',
        'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndkaWV5bmVuZGZqYmtiaGZvdnJ4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTA3ODI5MjEsImV4cCI6MjA2NjM1ODkyMX0.yFnLHavy8wzVjlg3sAI2mEG-XGDCV5FSr7OQsMefxL8',
        import.meta.env.VITE_RENAPROSA_SERVICE_KEY || 'REPLACE_RENAPROSA_SERVICE_KEY',
        centroId || null
      );
      
      setSyncService(instance);
    }
    loadConfiguration()
  }, [supabase, centroSaludId])

  return syncService || new SyncService(supabase)
}
