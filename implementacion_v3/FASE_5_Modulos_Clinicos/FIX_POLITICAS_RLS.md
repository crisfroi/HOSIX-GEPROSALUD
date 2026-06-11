# FASE 5 - FIX PARA ERROR DE POLÍTICAS RLS

## Error Encontrado

```
ERROR: 42710: policy "presupuestos_read" for table "hosix_presupuestos" already exists
```

## Causa

Las tablas fueron creadas exitosamente, pero las **políticas RLS ya existen** de un intento anterior.

## Solución ✅

Usa el nuevo script **APPLY_FASE5_COMBINED_FIXED.sql** que:

1. **Elimina las políticas existentes primero:**
   ```sql
   DROP POLICY IF EXISTS "presupuestos_read" ON hosix_presupuestos CASCADE;
   DROP POLICY IF EXISTS "licitaciones_read" ON hosix_licitaciones CASCADE;
   -- ... etc
   ```

2. **Recrea las tablas (IF NOT EXISTS evita conflictos)**
3. **Recrea todas las políticas**

## Pasos para Aplicar el Fix

### En Supabase Dashboard:

1. Ve a: https://app.supabase.com
2. SQL Editor → New Query
3. Abre: `supabase/migrations/APPLY_FASE5_COMBINED_FIXED.sql`
4. Copia TODO el contenido
5. Pega en Supabase
6. Click en "Run"

### Resultado Esperado:

✅ "Query executed successfully"

Si ves errores pero algunos statements se ejecutaron, es normal - las tablas ahora existen completamente.

## Verificación

Una vez ejecutado, las tablas y políticas deberían estar en su lugar:

```sql
-- Verifica que las políticas fueron creadas
SELECT schemaname, tablename, policyname, permissive
FROM pg_policies
WHERE tablename LIKE 'hosix_presupuestos%'
   OR tablename LIKE 'hosix_licitaciones%'
   OR tablename LIKE 'hosix_farmacia%'
ORDER BY tablename, policyname;
```

---

**¡Listo! El fix debería resolver el error de políticas duplicadas.** ✅
