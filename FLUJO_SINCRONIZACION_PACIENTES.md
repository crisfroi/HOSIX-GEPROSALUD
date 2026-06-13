# 📱 Flujo de Sincronización de Pacientes - HOSIX ↔ RENAPROSA

## Arquitectura General

```
┌─────────────────────────────────────────────────────────────┐
│                    RENAPROSA (Nodo Central)                  │
│          nodo_central.pais_pacientes_maestro                 │
│  - HCU real (ej: 001-2024-00001)                            │
│  - Datos maestros de todos los pacientes del país           │
└─────────────────────────────────────────────────────────────┘
                            ↕ (sync-pull / sync-push)
┌─────────────────────────────────────────────────────────────┐
│              HOSIX (Hospital Local)                          │
│  hospital_local.pacientes_maestro_local   (sincronizados)   │
│  hospital_local.pacientes_pendientes_sync (nuevos locales)  │
│  hospital_local.sync_queue                (cambios en cola) │
└─────────────────────────────────────────────────────────────┘
```

---

## 1️⃣ DESCARGA DE PACIENTES (sync-pull) - ✅ Implementado

### Flujo:
```
RENAPROSA.nodo_central.pais_pacientes_maestro
  ↓ (Edge Function sync-pull)
HOSIX.hospital_local.pacientes_maestro_local
```

### Implementación:
```typescript
// En SyncService.inicializarHospitalLocal()
const respPacientes = await this.pullDatos('pacientes', { limite: 10000 })
if (respPacientes.datos.length > 0) {
  await this.supabase
    .from('hospital_local.pacientes_maestro_local')
    .upsert(pacientesMap, { onConflict: 'cedula' })
}
```

### Datos recibidos:
- `id` - UUID del paciente
- `hcu` - HCU real (ej: 001-2024-00001)
- `cedula` - Cédula única
- `nombre`, `apellido`
- `fecha_nacimiento`
- `genero`
- `estado` - 'activo'

---

## 2️⃣ CREACIÓN DE PACIENTES LOCALES (sin conexión)

### Tabla: `hospital_local.pacientes_pendientes_sync`

Cuando un usuario crea un paciente **sin conexión a RENAPROSA**:

```typescript
// 1. Generar HCU TEMPORAL (local)
const hcuTemporal = await fn_generar_hcu_temporal(nombre_distrito)
// Resultado: ej "HOS-SAMPAKA-20240001" (temporal)

// 2. Insertar en tabla pendiente
INSERT INTO hospital_local.pacientes_pendientes_sync (
  cedula, nombre, apellido, fecha_nacimiento,
  nombre_distrito, hcu_temporal, estado
) VALUES (..., hcuTemporal, 'pendiente')

// 3. Agregar a cola de sincronización
INSERT INTO hospital_local.sync_queue (
  accion, entidad_tipo, entidad_id, estado
) VALUES ('crear', 'paciente', paciente_id, 'pendiente')
```

### Estado: `'pendiente'`
- Paciente existe **solo localmente**
- Tiene HCU temporal (no es válido en RENAPROSA)
- Espera conexión para ser sincronizado

---

## 3️⃣ ENVÍO DE PACIENTES AL NODO CENTRAL (sync-push) - ⚙️ Nuevo

### Flujo:
```
hospital_local.pacientes_pendientes_sync (estado='pendiente')
  ↓
Edge Function sync-push (en RENAPROSA)
  ↓
nodo_central.pais_pacientes_maestro
  ↓ (genera HCU real)
→ Respuesta con HCU real y mapeo
  ↓
Actualizar local con HCU real
  ↓
hospital_local.pacientes_maestro_local (sincronizado)
hospital_local.pacientes_pendientes_sync (estado='sincronizado')
```

### Implementación:
```typescript
async pushPacientes(): Promise<{
  exitoso: boolean
  procesados: number
  sincronizados: number
  mapeos: any[]
}> {
  // 1. Leer pendientes
  const { data: pendientes } = await this.supabase
    .from('hospital_local.pacientes_pendientes_sync')
    .select('*')
    .eq('estado', 'pendiente')

  // 2. Preparar cambios
  const cambios = pendientes.map(p => ({
    accion: 'crear',
    cedula: p.cedula,
    nombre: p.nombre,
    apellido: p.apellido,
    fecha_nacimiento: p.fecha_nacimiento,
    nombre_distrito: p.nombre_distrito,
    genero: p.genero
  }))

  // 3. Enviar a RENAPROSA
  const resultado = await this.pushDatos(cambios)

  // 4. Procesar mapeos de HCU
  for (const mapeo of resultado.mapeos) {
    // Insertar en maestro local
    await supabase.from('hospital_local.pacientes_maestro_local')
      .upsert({
        hcu: mapeo.hcu,  // ← HCU REAL (ej: 001-2024-00001)
        cedula: mapeo.cedula,
        estado: 'activo'
      })

    // Marcar pendiente como sincronizado
    await supabase.from('hospital_local.pacientes_pendientes_sync')
      .update({
        estado: 'sincronizado',
        hcu_final: mapeo.hcu  // ← Guardar mapeo
      })
      .eq('cedula', mapeo.cedula)
  }
}
```

### En RENAPROSA (sync-push Edge Function):
```typescript
for (const cambio of cambios) {
  // 1. Verificar si existe
  const existe = await supabase
    .from('nodo_central.pais_pacientes_maestro')
    .select('hcu')
    .eq('cedula', cambio.cedula)

  if (existe.length > 0) {
    // Retornar HCU existente
    mapeos.push({
      cedula: cambio.cedula,
      hcu: existe[0].hcu,
      resultado: 'paciente_existe'
    })
  } else {
    // 2. Crear nuevo paciente
    const hcu = await fn_generar_hcu(cedula, nombre_distrito)
    const { data: creado } = await supabase
      .from('nodo_central.pais_pacientes_maestro')
      .insert({
        hcu, cedula, nombre, apellido,
        fecha_nacimiento, genero,
        estado: 'activo'
      })

    mapeos.push({
      cedula,
      hcu,
      paciente_id: creado.id,
      resultado: 'creado'
    })
  }
}

// Retornar mapeos
return {
  exitoso: true,
  mapeos,
  procesados: cambios.length
}
```

---

## 4️⃣ VISUALIZACIÓN UNIFICADA DE PACIENTES

### Hook: `usePacientes()`

Combina ambas fuentes en una sola lista:

```typescript
export function usePacientes(supabase: SupabaseClient) {
  const [pacientes, setPacientes] = useState([])

  useEffect(() => {
    // 1. Obtener sincronizados (del nodo central)
    const sincronizados = await supabase
      .from('hospital_local.pacientes_maestro_local')
      .select('*')

    // 2. Obtener pendientes (nuevos locales)
    const pendientes = await supabase
      .from('hospital_local.pacientes_pendientes_sync')
      .select('*')

    // 3. Unificar
    const todos = [
      ...sincronizados.map(p => ({
        ...p,
        origen: 'nodo_central',  // ← De RENAPROSA
        estado: 'sincronizado'
      })),
      ...pendientes.map(p => ({
        ...p,
        origen: 'pendiente',  // ← Nuevo local
        estado: p.estado  // 'pendiente' o 'sincronizado'
      }))
    ]

    setPacientes(todos)
  }, [])

  return pacientes
}
```

### En el UI:
```tsx
const pacientes = usePacientes(supabase)

return (
  <div>
    {pacientes.map(p => (
      <PatientCard
        key={p.cedula}
        nombre={p.nombre}
        apellido={p.apellido}
        hcu={p.hcu || p.hcu_temporal}
        estado={p.estado}
        origen={p.origen}
        badge={p.estado === 'pendiente' ? '⏳ Pendiente' : '✅ Sincronizado'}
      />
    ))}
  </div>
)
```

---

## 5️⃣ CICLO COMPLETO

### Caso A: Paciente ya existe en RENAPROSA

```
1. Crear localmente (sin conexión)
   - HCU temporal: "HOS-2024-00001"
   - Estado: pendiente

2. Conectar a internet → sync-push

3. RENAPROSA verifica cédula → YA EXISTE
   - Retorna HCU real: "001-2024-00001"

4. Actualizar local:
   - pacientes_maestro_local: HCU = "001-2024-00001"
   - pacientes_pendientes_sync: estado = "sincronizado"
   - Paciente ahora es accesible con HCU real
```

### Caso B: Paciente NUEVO en todo el país

```
1. Crear localmente (sin conexión)
   - HCU temporal: "HOS-2024-00001"
   - Estado: pendiente

2. Conectar a internet → sync-push

3. RENAPROSA no encuentra cédula → CREA nuevo
   - Genera HCU real: "002-2024-00001"
   - Inserta en nodo_central.pais_pacientes_maestro
   - Retorna HCU real: "002-2024-00001"

4. Actualizar local:
   - pacientes_maestro_local: HCU = "002-2024-00001"
   - pacientes_pendientes_sync: estado = "sincronizado"
   - Ahora es conocido en todo el país
```

---

## 📊 Estado de Implementación

| Componente | Estado | Notas |
|-----------|--------|-------|
| sync-pull | ✅ Completo | Descarga referencias + pacientes |
| sync-push | ✅ Nuevo | `pushPacientes()` implementado |
| usePacientes | ✅ Nuevo | Hook unificado |
| hospital_config | ✅ Nuevo | Almacena centro_salud_id |
| Filtrado por centro | ✅ Completo | sync-pull filtra por centro |
| Visualización UI | ⏳ Próximo | Usar `usePacientes()` en componentes |

---

## 🚀 Próximos Pasos

1. **Actualizar módulo de pacientes** para usar `usePacientes()`
2. **Agregar botón "Sincronizar"** que llame a `pushPacientes()`
3. **Mostrar estados visuales**:
   - 🟢 Sincronizado (HCU real, en RENAPROSA)
   - ⏳ Pendiente (HCU temporal, local)
   - ❌ Error (intentó sincronizar pero falló)
4. **Continuar con portal de pacientes**

