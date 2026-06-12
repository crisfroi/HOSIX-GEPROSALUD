# GUÍA: Usar Historia Clínica Única (HCU) en Lab-Imagen-Facturación

**Propósito:** Referencia rápida para cambiar validaciones que usan cédula por HCU
**Estado:** 🟡 OPCIONAL PARA PRÓXIMA MIGRACIÓN
**Aplicar después de:** Implementación actual completada

---

## 🔄 CAMBIOS EN EDGE FUNCTIONS

### hosix-caja-scan

**ANTES (usando cédula):**
```typescript
const { data: paciente } = await supabase
  .from("hosix_pacientes")
  .select("id, numero_cedula, nombre_completo")
  .eq("numero_cedula", cedula) // ← CÉDULA
  .single()
```

**DESPUÉS (usando HCU):**
```typescript
const { data: paciente } = await supabase
  .from("hosix_pacientes")
  .select("id, hcu, numero_historia_clinica, nombre_completo, tarjeta_sanitaria")
  .eq("hcu", hcu) // ← HCU (Historia Clínica Única)
  .single()
```

---

## 🔄 CAMBIOS EN COMPONENTES

### SelectorSolicitudesInline (cuando se implemente)

**Para vincular solicitud con paciente:**
```typescript
// ANTES
paciente_cedula: paciente.numero_cedula

// DESPUÉS
paciente_hcu: paciente.hcu,
paciente_historia_clinica: paciente.numero_historia_clinica,
paciente_tarjeta_sanitaria: paciente.tarjeta_sanitaria
```

---

## 🔄 CAMBIOS EN MIGRACIONES

### Al aplicar `20260611_fase6_integracion_lab_imagen_facturacion.sql`

**Nota importante:**

En lugar de:
```sql
ALTER TABLE hosix_laboratorio_solicitudes ADD COLUMN IF NOT EXISTS numero_cedula VARCHAR(20);
```

Usar:
```sql
-- Estos campos SOLO si hosix_pacientes no tiene estos campos aún
-- De lo contrario, la solicitud ya tiene paciente_id que referencia hosix_pacientes
-- y hosix_pacientes tendrá hcu, numero_historia_clinica, tarjeta_sanitaria
```

**La relación ya existe:**
```sql
ALTER TABLE hosix_laboratorio_solicitudes
  ADD CONSTRAINT IF NOT EXISTS fk_lab_paciente
  FOREIGN KEY (paciente_id) REFERENCES hosix_pacientes(id);
```

Entonces podés acceder a través de:
```sql
SELECT ls.*, p.hcu, p.numero_historia_clinica, p.tarjeta_sanitaria
FROM hosix_laboratorio_solicitudes ls
JOIN hosix_pacientes p ON ls.paciente_id = p.id
WHERE ls.id = '...'
```

---

## 📋 CHECKLIST PARA CAMBIOS POSTERIORES

Cuando implementes la sincronización con Nodo Central:

- [ ] Migración adicional para agregar campos a `hosix_pacientes`:
  - `hcu VARCHAR(50) UNIQUE`
  - `numero_historia_clinica VARCHAR(50) UNIQUE`
  - `tarjeta_sanitaria VARCHAR(50) UNIQUE`
  - `sincronizado_con_central BOOLEAN DEFAULT false`

- [ ] Actualizar `AdmisionCentralForm.tsx` para:
  - Buscar paciente por cédula en Nodo Central (obtener HCU)
  - Si existe: asignar HCU + numero_historia_clinica
  - Si no existe: generar nuevos

- [ ] Actualizar edge functions para usar HCU en búsquedas

- [ ] Actualizar componentes de caja para escanear/buscar por HCU o tarjeta sanitaria

---

## 🎯 POR AHORA

**Mantener igual:**
- `hosix_pacientes` usa cédula como identificador único
- Edge functions usan cédula para búsquedas
- Sin campos HCU/tarjeta_sanitaria

**Después (Fase 7+):**
- Agregar HCU como identificador único nacional
- Implementar sincronización con Nodo Central
- Cambiar búsquedas a usar HCU

---

## 📌 NOTA

Esta guía es referencia para **no perder de vista** cómo se integraría HCU cuando esté lista.

**No afecta la implementación actual** de Lab-Imagen-Facturación.

Seguir adelante con cédula como identificador local, y cuando Nodo Central esté listo, migrar a HCU.
