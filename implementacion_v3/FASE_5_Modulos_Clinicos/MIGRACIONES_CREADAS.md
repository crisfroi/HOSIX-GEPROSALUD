# FASE 5 - MIGRACIONES CREADAS

## Status de Migraciones para Fase 5

### ✅ MIGRACIONES QUE YA EXISTÍAN

#### 1. Recobros ✅
- **Archivo:** `supabase/migrations/20250121_007_hosix_recobros.sql`
- **Tablas:** 
  - `hosix_recobros`
  - `hosix_recobros_notas_cargo`
  - `hosix_recobros_notas_credito`
  - `hosix_recobros_solicitudes`
  - `hosix_recobros_morosidad`
- **Status:** LISTA PARA APLICAR

#### 2. Interconsultas ✅
- **Archivo:** `supabase/migrations/20250206_014_hosix_interconsultas_asis_11.sql`
- **Tablas:**
  - `hosix_interconsultas`
  - `hosix_interconsultas_respuestas`
  - `hosix_interconsultas_especialidades`
- **Status:** LISTA PARA APLICAR

#### 3. Cajas ✅
- **Archivo:** `supabase/migrations/20250121_006_hosix_cajas_completo.sql`
- **Status:** LISTA PARA APLICAR

#### 4. Quirófanos ✅
- **Archivo:** `supabase/migrations/20250206_013_hosix_quirofanos_asis_3.sql`
- **Status:** LISTA PARA APLICAR

#### 5. Obstetricia ✅
- **Archivo:** `supabase/migrations/20260601_015_obstetricia_partograma.sql`
- **Status:** LISTA PARA APLICAR

#### 6. Farmacia (Parcial)
- **Archivo:** `supabase/migrations/20250116_004_hosix_hospitalizacion_quirofanos_farmacia.sql`
- **Status:** Tiene algunas tablas pero probablemente incompleta

---

### ✅ MIGRACIONES QUE ACABAMOS DE CREAR

#### 1. Compras (NUEVA)
- **Archivo:** `supabase/migrations/20260610_fase5_compras_presupuestos.sql`
- **Tablas creadas:**
  - `hosix_presupuestos`
  - `hosix_licitaciones`
  - `hosix_licitaciones_ofertas`
  - `hosix_adjudicaciones`
- **Status:** LISTA PARA APLICAR ✅
- **Características:**
  - RLS habilitado con políticas básicas
  - Índices para consultas eficientes
  - ForeignKeys a tablas existentes (centros_coste, proveedores)

#### 2. Farmacia Dispensario (NUEVA)
- **Archivo:** `supabase/migrations/20260610_fase5_farmacia_dispensario.sql`
- **Tablas creadas:**
  - `hosix_farmacia_dispensario`
  - `hosix_farmacia_dispensaciones`
  - `hosix_farmacia_farmacovigilancia`
- **Status:** LISTA PARA APLICAR ✅
- **Características:**
  - RLS habilitado con políticas básicas
  - Índices para consultas eficientes
  - ForeignKeys a hosix_usuarios, hosix_pacientes, hosix_articulos, hosix_prescripciones

---

## 🎯 Próximo Paso: APLICAR LAS MIGRACIONES

### En Supabase Console o CLI:
```bash
# Option 1: Via Supabase CLI
supabase db push

# Option 2: Manual en dashboard
1. Dashboard → SQL Editor
2. Copiar contenido de cada archivo .sql
3. Ejecutar
```

### Orden recomendado de aplicación:
1. **20260610_fase5_compras_presupuestos.sql** (nueva)
2. **20260610_fase5_farmacia_dispensario.sql** (nueva)
3. **20250121_007_hosix_recobros.sql** (si aún no se aplicó)
4. **20250206_014_hosix_interconsultas_asis_11.sql** (si aún no se aplicó)

---

## 📝 CAMBIOS EN CÓDIGO REQUERIDOS

Una vez que las migraciones se apliquen, necesitarás:

1. **Reactivar hooks desactivados:**
   - `useHosixCompras.ts` - Descomentar queries
   - `useHosixRecobros.ts` - Descomentar queries
   - `useHosixFarmacia.ts` - Descomentar queries
   - `useHosixInterconsultas.ts` - Descomentar queries

2. **Actualizar Prescripciones:**
   - Si `hosix_prescripciones` tiene FK a `profesionales_sanitarios`, restaurar el join

3. **Regenerar TypeScript types:**
   - Supabase puede auto-generar types
   - O actualizar manualmente si es necesario

---

## ✅ CHECKLIST PARA COMPLETAR FASE 5

- [ ] Aplicar migraciones a BD
- [ ] Verificar que tablas fueron creadas correctamente
- [ ] Reactivar hooks en código
- [ ] Restaurar JOINs en Prescripciones si aplica
- [ ] Testing de cada módulo
- [ ] Verificar que no hay 404 errors en console
- [ ] Deploy a producción

---

## 📊 RESUMEN FINAL

**Total de Migraciones Necesarias:** 6
- **Ya existían:** 4 (Recobros, Interconsultas, Cajas, Quirófanos)
- **Acabamos de crear:** 2 (Compras, Farmacia)
- **Obstetricia:** Parcialmente existe

**Status General:** LISTO PARA APLICAR ✅
