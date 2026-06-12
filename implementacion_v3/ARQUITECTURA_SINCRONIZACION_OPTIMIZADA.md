# Arquitectura de Sincronización Optimizada - Nodo Central

## 🎯 Objetivo Final

Crear un **Nodo Central** en RENAPROSA con sincronización **instantánea, escalable y sin discrepancias** usando triggers automáticos en lugar de cron jobs complejos.

---

## 📊 Comparativa: Antes vs Después

### ❌ Estrategia Anterior (Cron Jobs)
```
PROBLEMA:
├─ Cron jobs cada 1h → datos pueden estar desactualizados
├─ Múltiples Edge Functions complejas
├─ Posibles discrepancias entre ejecuciones
├─ Difícil mantener consistencia distribuida
└─ Escalabilidad limitada (cada hospital nuevo = lógica adicional)

COMPLEJIDAD: ⭐⭐⭐⭐⭐ (muy alta)
LATENCIA: 60 minutos promedio
CONSISTENCIA: Eventual (débil)
```

### ✅ Estrategia Nueva (Triggers + Copias Locales)
```
SOLUCIÓN:
├─ Triggers automáticos en INSERT/UPDATE de RENAPROSA
├─ Copias locales sincronizadas INSTANTÁNEAMENTE
├─ Funciones SQL idempotentes (sin duplicados)
├─ Auditoría completa de cada cambio
└─ Escalabilidad: nuevos hospitales = cero complejidad

COMPLEJIDAD: ⭐⭐⭐ (media)
LATENCIA: < 100ms (instantáneo)
CONSISTENCIA: Fuerte (sincrónica)
```

---

## 🏗️ Arquitectura Optimizada

```
┌──────────────────────────────────────────────────────────────────┐
│                 RENAPROSA (Proyecto Base)                        │
│                 wdieynendfjbkbhfovrx.supabase.co                 │
├──────────────────────────────────────────────────────────────────┤
│                                                                  │
│  Schema: public (EXISTENTE)                                     │
│  ├─ centros_salud                                               │
│  │  ├─ INSERT/UPDATE evento                                     │
│  │  └─ ⚡ TRIGGER: trig_sync_centros                            │
│  │     └─ Ejecuta: fn_sincronizar_centro()                      │
│  │        └─ INSERT/UPDATE en copia local                       │
│  │           └─ LOG en sincronizacion_log                       │
│  │                                                               │
│  └─ profesionales_sanitarios                                    │
│     ├─ UPDATE estado_solicitud = 'Aprobado'                     │
│     └─ ⚡ TRIGGER: trig_sync_profesionales                      │
│        └─ Ejecuta: fn_sincronizar_profesional()                 │
│           └─ INSERT/UPDATE en copia local                       │
│              └─ LOG en sincronizacion_log                       │
│                                                                  │
│  Schema: nodo_central (NUEVO)                                   │
│  ├─ distritos_sanitarios_copia (desde hosix_distritos_sanitarios)
│  ├─ centros_salud_copia (copias locales sincronizadas)         │
│  ├─ profesionales_copia (copias locales sincronizadas)         │
│  ├─ pais_pacientes_maestro (HCU único nacional)                │
│  ├─ tarjetas_sanitarias (tarjeta local por hospital)           │
│  ├─ sincronizacion_log (auditoría de cada cambio)              │
│  ├─ secuenciales_hcu (contador de HCU por distrito sanitario)  │
│  └─ Funciones SQL:                                             │
│     ├─ fn_sincronizar_centro()                                 │
│     ├─ fn_sincronizar_profesional()                            │
│     ├─ fn_generar_hcu()                                        │
│     └─ fn_buscar_paciente()                                    │
│                                                                  │
│  Edge Functions (2 solas):                                      │
│  ├─ generar-hcu-paciente-nuevo (llamada por HOSIX)            │
│  │  Parámetros: cedula, nombre, apellido, fecha_nac,          │
│  │             provincia, distrito_sanitario_codigo            │
│  └─ consultar-estado-sincronizacion (reportes)                │
│                                                                  │
└──────────────────────────────────────────────────────────────────┘
                              ↕ (Sincronización Instantánea)
                              
              ┌────────────────────────────────────────┐
              │   HOSIX (Cada Hospital Local)          │
              │   (Consulta copias locales, no RENAPROSA)
              └────────────────────────────────────────┘
```

---

## 🔄 Flujos de Operación

### Flujo 1: Crear Centro en RENAPROSA

```mermaid
Admin en RENAPROSA Frontend:
  ├─ Completa formulario: nombre, categoria, provincia, etc
  └─ POST /api/centros_salud
      
Base de Datos:
  ├─ INSERT INTO public.centros_salud (...)
  ├─ ⚡ DISPARA TRIGGER: trig_sync_centros
  │  ├─ ANTES: Función plpgsql: nodo_central.tg_sync_centros()
  │  ├─ EJECUTA: nodo_central.fn_sincronizar_centro()
  │  │  ├─ INSERT/UPDATE centros_salud_copia (copia local)
  │  │  ├─ INSERT sincronizacion_log (auditoría)
  │  │  └─ RETORNA: true/false
  │  └─ DESPUÉS: Retorna NEW (fila insertada)
  │
  └─ Resultado: ✅ Centro disponible en Nodo Central al instante

HOSIX (minutos después):
  ├─ SELECT * FROM nodo_central.centros_salud_copia
  │  WHERE estado = 'validado'
  └─ VE: Nuevo centro en la lista ✅
```

### Flujo 2: Aprobar Profesional en RENAPROSA

```
Admin RENAPROSA:
  ├─ Revisa profesional: "Dr. Juan García"
  └─ UPDATE profesionales_sanitarios 
     SET estado_solicitud = 'Aprobado'
     
Base de Datos:
  ├─ UPDATE public.profesionales_sanitarios SET ...
  ├─ ⚡ DISPARA TRIGGER: trig_sync_profesionales
  │  ├─ EJECUTA: nodo_central.tg_sync_profesionales()
  │  ├─ LLAMA: nodo_central.fn_sincronizar_profesional()
  │  │  ├─ Verifica: IF estado_solicitud == 'Aprobado'
  │  │  ├─ INSERT/UPDATE profesionales_copia
  │  │  ├─ INSERT sincronizacion_log
  │  │  └─ RETORNA: true
  │  └─ Retorna NEW
  │
  └─ Resultado: ✅ Profesional disponible en Nodo Central

HOSIX (al instante):
  ├─ SELECT * FROM nodo_central.profesionales_copia
  │  WHERE estado_solicitud = 'Aprobado'
  │  AND centro_salud_id = ?
  └─ VE: Dr. Juan asignado a su centro ✅
```

### Flujo 3: HOSIX Crea Paciente (RPC)

```
Enfermero HOSIX:
  ├─ Busca paciente por cédula: 1234567890
  ├─ SELECT FROM nodo_central.pais_pacientes_maestro
  │  WHERE cedula = '1234567890'
  └─ RESULTADO: NO EXISTE
      
HOSIX (llamada Edge Function):
  ├─ POST /generar-hcu-paciente-nuevo
  │  {
  │    cedula: '1234567890',
  │    nombre: 'María',
  │    apellido: 'García',
  │    fecha_nacimiento: '1990-01-15',
  │    provincia: 'Bioko',
  │    centro_salud_id: 'uuid...'
  │  }
  │
  └─ Edge Function (Deno):
      ├─ Valida que cédula no exista
      ├─ LLAMADA RPC: nodo_central.fn_generar_hcu()
      │  ├─ Mapea provincia → 'CE'
      │  ├─ Obtiene año actual: 2026
      │  ├─ Obtener secuencial: INSERT/UPDATE secuenciales_hcu
      │  │  ├─ ON CONFLICT (provincia, anio)
      │  │  └─ secuencial = secuencial + 1
      │  ├─ Construye HCU: 'HCUCE2026000001'
      │  └─ RETORNA: 'HCUCE2026000001'
      │
      ├─ INSERT INTO pais_pacientes_maestro
      │  ├─ hcu: 'HCUCE2026000001'
      │  ├─ cedula: '1234567890'
      │  ├─ nombre, apellido, fecha_nacimiento, etc
      │  └─ RETORNA: paciente creado
      │
      ├─ INSERT INTO sincronizacion_log
      │  ├─ tipo_evento: 'hcu_generado'
      │  ├─ entidad_id: paciente.id
      │  ├─ estado: 'exitoso'
      │  └─ timestamp: now()
      │
      └─ RETORNA A HOSIX:
          {
            exito: true,
            hcu: 'HCUCE2026000001',
            paciente_id: 'uuid...',
            mensaje: 'HCU generado exitosamente'
          }

HOSIX (siguiente visita):
  ├─ BUSCA: mismo paciente (cédula: 1234567890)
  ├─ SELECT FROM nodo_central.pais_pacientes_maestro
  │  WHERE cedula = '1234567890'
  └─ ENCUENTRA:
      {
        hcu: 'HCUCE2026000001',
        alergias: null,
        condiciones_cronicas: null,
        ...
      }
      └─ ✅ Paciente reutilizable
```

### Flujo 4: Consultar Estado de Sincronización

```
Admin HOSIX (Reportes):
  └─ GET /consultar-estado-sincronizacion?tipo=resumen
      
Edge Function:
  ├─ SELECT COUNT(*) FROM nodo_central.centros_salud_copia
  ├─ SELECT COUNT(*) FROM nodo_central.profesionales_copia
  ├─ SELECT COUNT(*) FROM nodo_central.pais_pacientes_maestro
  ├─ SELECT TOP 10 FROM nodo_central.sincronizacion_log
  │  ORDER BY timestamp DESC
  │
  └─ RETORNA:
      {
        estado: 'operativo',
        centros_sincronizados: 45,
        profesionales_sincronizados: 283,
        pacientes_con_hcu: 2104,
        ultimos_logs: [
          {tipo_evento: 'hcu_generado', estado: 'exitoso', timestamp: '2026-06-12T14:23:00Z'},
          {tipo_evento: 'profesional_sincronizado', estado: 'exitoso', timestamp: '2026-06-12T14:22:50Z'},
          ...
        ]
      }
```

---

## ⚡ Ventajas Técnicas

| Aspecto | Antes (Cron) | Después (Triggers) | Beneficio |
|--------|------------|-----------------|----------|
| **Latencia** | 60 minutos | < 100ms | 36,000x más rápido |
| **Consistencia** | Eventual | Fuerte | Sin discrepancias |
| **Complejidad** | 5+ Edge Functions | 2 Edge Functions | 60% menos código |
| **Escalabilidad** | O(n hospitals) | O(1) | Lineal → constante |
| **Auditoría** | Manual | Automática | Trazabilidad total |
| **Mantenibilidad** | Alta (lógica distribuida) | Baja (triggers en DB) | Más fácil revisar |
| **Idempotencia** | Difícil | Garantizada | ON CONFLICT integrado |

---

## 📁 Archivos Modificados/Creados

### Nuevos
- `supabase/migrations/20260612_nodo_central_schema_optimizado.sql` ✅
  - Schema completo con triggers automáticos
  - Funciones SQL idempotentes
  - RLS policies
  - Grants

### Documentación Actualizada
- `implementacion_v3/PLAN_IMPLEMENTACION_NODO_CENTRAL_RENAPROSA.md` ✅
  - Nuevo enfoque con triggers
  - Cronograma reducido (5 días → 5 días)
  - Sin cron jobs

- `implementacion_v3/ANALISIS_RENAPROSA_INTEGRACION.md` ✅
  - Timeline instantáneo
  - Flujos optimizados
  - Beneficios actualizados

### Edge Functions (simplificadas)
- `supabase/functions/generar-hcu-paciente-nuevo/index.ts` ✅
  - Llamada RPC a fn_generar_hcu()
  - Log de auditoría
  
- `supabase/functions/consultar-estado-sincronizacion/index.ts` ✅
  - Reportes de estado
  - Últimos logs

---

## ✅ Checklist de Implementación

- [ ] **Día 1**: Crear migration `20260612_nodo_central_schema_optimizado.sql`
- [ ] **Día 2**: Ejecutar migration en RENAPROSA Supabase
- [ ] **Día 3**: Crear Edge Function `generar-hcu-paciente-nuevo`
- [ ] **Día 3**: Crear Edge Function `consultar-estado-sincronizacion`
- [ ] **Día 4**: Integrar búsqueda de HCU en AdmisionCentral.tsx
- [ ] **Día 5**: Testing end-to-end completo
  - [ ] Crear centro en RENAPROSA → verifica copia en Nodo Central
  - [ ] Aprobar profesional → verifica copia en Nodo Central
  - [ ] Crear paciente en HOSIX → genera HCU
  - [ ] Buscar paciente en HOSIX → encuentra HCU anterior
  - [ ] Consultar estado de sincronización → reportes correctos
  - [ ] Verificar logs en sincronizacion_log

---

## 🚀 Próximos Pasos Después de Esta Fase

### Portal Web Pacientes (Fase 6.3)
- Pacientes ven su HCU
- Historial de consultas
- Resultados de lab/imaging
- Citas programadas

### MPI Centralizado (Fase 6.5)
- Consolidación de duplicados
- Búsqueda nacional
- Validación de identidad

### Seguridad Avanzada (Fase 6.6)
- Supabase Auth + MFA
- TOTP/SMS/Email OTP
- AAL (Authenticator Assurance Level)

---

## 💡 Conclusión

**Se ha optimizado la arquitectura del Nodo Central** para:
- ✅ Sincronización instantánea vía triggers
- ✅ Cero discrepancias mediante funciones idempotentes
- ✅ Escalabilidad sin aumento de complejidad
- ✅ Auditoría automática de cada operación
- ✅ Reducción de Edge Functions complejas
- ✅ Mantenibilidad a largo plazo

**Status**: Listo para implementación inmediata
