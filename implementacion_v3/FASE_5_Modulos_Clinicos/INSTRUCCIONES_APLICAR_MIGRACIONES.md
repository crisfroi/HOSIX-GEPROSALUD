# FASE 5 - CÓMO APLICAR LAS MIGRACIONES

## ✅ Status Actual

- ✅ **Migraciones creadas:** 2 nuevas (Compras, Farmacia)
- ✅ **Código descomentado:** Hooks reactivados (Compras, Recobros, Farmacia, Interconsultas)
- ⏳ **Pendiente:** Aplicar migraciones en Supabase

## 📋 INSTRUCCIONES PARA APLICAR MIGRACIONES

### OPCIÓN 1: Supabase Dashboard (Más Fácil) ✅ RECOMENDADO

1. **Abre Supabase Dashboard:**
   - Ve a: https://app.supabase.com
   - Selecciona tu proyecto: "HOSIX GEPROSALUD"

2. **Abre SQL Editor:**
   - Click en "SQL Editor" (lado izquierdo)
   - Click en "New Query"

3. **Copia el SQL Combinado:**
   - Abre el archivo: `supabase/migrations/APPLY_FASE5_COMBINED.sql`
   - **Copia TODO el contenido**

4. **Pega en Supabase:**
   - Pega el SQL en el editor
   - Click en "Run" (botón azul)

5. **Verifica:**
   - Debería salir: "Query executed successfully"
   - Si hay errores, verifica que las tablas referenciadas (centros_coste, proveedores, etc.) existan

### OPCIÓN 2: Supabase CLI

```bash
# Si tienes Supabase CLI instalado:
supabase db push
```

### OPCIÓN 3: Archivo por Archivo (Si tienes problemas)

Si el SQL combinado no funciona:

1. Ejecuta primero: `supabase/migrations/20260610_fase5_compras_presupuestos.sql`
2. Luego: `supabase/migrations/20260610_fase5_farmacia_dispensario.sql`

---

## 🔍 VERIFICACIÓN POST-APLICACIÓN

Una vez aplicadas las migraciones, ejecuta esto en SQL Editor para verificar:

```sql
-- Verifica que las tablas fueron creadas
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name LIKE 'hosix_presupuestos%' 
   OR table_name LIKE 'hosix_licitaciones%'
   OR table_name LIKE 'hosix_farmacia%'
ORDER BY table_name;
```

Deberías ver:
- ✅ hosix_presupuestos
- ✅ hosix_licitaciones
- ✅ hosix_licitaciones_ofertas
- ✅ hosix_adjudicaciones
- ✅ hosix_farmacia_dispensario
- ✅ hosix_farmacia_dispensaciones
- ✅ hosix_farmacia_farmacovigilancia

---

## 📝 ESTADO DEL CÓDIGO

El código ya está descomentado y listo:

| Módulo | Archivo | Status |
|--------|---------|--------|
| Compras | `src/hooks/useHosixCompras.ts` | ✅ Reactivado |
| Recobros | `src/hooks/useHosixRecobros.ts` | ✅ Reactivado |
| Farmacia | `src/hooks/useHosixFarmacia.ts` | ✅ Reactivado |
| Interconsultas | `src/hooks/useHosixInterconsultas.ts` | ✅ Reactivado |

Una vez que apliques las migraciones, el código comenzará a intentar queries reales.

---

## ⚠️ POSIBLES ERRORES Y SOLUCIONES

### Error: "Cannot insert or update on table... Foreign key constraint fails"
**Causa:** Las tablas referenciadas (centros_coste, proveedores, etc.) no existen
**Solución:** Verifica que esas tablas existan en tu BD

### Error: "Already exists"
**Causa:** Las tablas ya fueron creadas previamente
**Solución:** Esto es normal si re-ejecutas el script. Los CREATE IF NOT EXISTS lo evitan

### Error: "Column does not exist"
**Causa:** Error en el SQL
**Solución:** Copia el archivo `APPLY_FASE5_COMBINED.sql` nuevamente y asegúrate de copiar TODO

---

## 🎯 PRÓXIMOS PASOS

1. ✅ **Aplicar migraciones** (este documento)
2. ⏳ **Verificar en dashboard** (query de verificación)
3. ⏳ **Dev server testing** (npm run dev)
4. ⏳ **Check browser console** (no más 404 errors)
5. ⏳ **Test cada módulo:**
   - Compras: crear presupuesto
   - Recobros: cargar listado
   - Farmacia: crear dispensación
   - Interconsultas: crear solicitud

---

## 📞 SI TIENES PROBLEMAS

1. Verifica que el SQL sea exactamente el del archivo `APPLY_FASE5_COMBINED.sql`
2. Copia y pega sin modificaciones
3. Si un statement falla, los siguientes aún deberían ejecutarse
4. Chequea el error específico en Supabase

---

**¡Listo para aplicar las migraciones!** 🚀
