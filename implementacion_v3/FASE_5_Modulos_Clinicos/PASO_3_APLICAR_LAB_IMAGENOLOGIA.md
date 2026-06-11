# Fase 5 - Paso 3: Aplicación de Migraciones Laboratorio, Imagenología, Enfermería

## Estado Actual

El Recobros ya fue aplicado correctamente. Ahora faltan:
- **Laboratorio Clínico** (hosix_laboratorio_*)
- **Imagenología** (hosix_imagenologia_*)  
- **Enfermería** (hosix_enfermeria_*) - Migración existe pero verificar aplicación

## Tablas Nuevas a Crear

### Laboratorio (6 tablas):
- `hosix_laboratorio_pruebas_catalogo` - Catálogo de pruebas de laboratorio
- `hosix_laboratorio_solicitudes` - Solicitudes de laboratorio
- `hosix_laboratorio_solicitudes_items` - Detalles de qué pruebas se solicitan
- `hosix_laboratorio_resultados` - Resultados de laboratorio
- `hosix_laboratorio_control_calidad` - Control de calidad

### Imagenología (4 tablas):
- `hosix_imagenologia_modalidades` - Modalidades disponibles (radiología, ultrasound, TAC, RMN, etc.)
- `hosix_imagenologia_solicitudes` - Solicitudes de imagenología
- `hosix_imagenologia_estudios` - Estudios realizados
- `hosix_imagenologia_reportes` - Reportes de radiólogo

### Enfermería (ya debería existir):
- `hosix_enfermeria_worklist`
- `hosix_enfermeria_constantes`
- `hosix_enfermeria_evaluaciones`
- `hosix_enfermeria_planes`
- `hosix_enfermeria_kardex`
- `hosix_enfermeria_balance_hidrico`
- `hosix_enfermeria_diario`

## Instrucciones de Aplicación

### Opción 1: Aplicar todo en una sola ejecución (RECOMENDADO)

1. Abre Supabase Dashboard: https://wdieynendfjbkbhfovrx.supabase.co
2. Ve a **SQL Editor**
3. Abre el archivo: `supabase/migrations/APPLY_FASE5_LABORATORIO_IMAGENOLOGIA_ENFERMERIA.sql`
4. Copia TODO el contenido
5. Pega en el SQL Editor de Supabase
6. Haz clic en **Run** (Ctrl+Enter)

### Opción 2: Aplicar de forma individual (si la opción 1 falla)

Ejecuta en orden:

1. **Laboratorio**: `supabase/migrations/20260610_fase5_laboratorio_diagnostico.sql`
2. **Imagenología**: `supabase/migrations/20260610_fase5_imagenologia.sql`

## Pasos Post-Aplicación

Después de aplicar las migraciones:

1. **Verificar tablas en Supabase SQL**:
   ```sql
   SELECT table_name 
   FROM information_schema.tables 
   WHERE table_schema = 'public' 
   AND table_name LIKE 'hosix_laboratorio%' 
   OR table_name LIKE 'hosix_imagenologia%'
   ORDER BY table_name;
   ```

2. **Refrescar el navegador** (F5)

3. **Revisar consola del navegador** para verificar que los 404s han desaparecido

## Problemas Comunes y Soluciones

### Error: "policy already exists"
Si ves `ERROR: 42710: policy ... already exists`, es porque ya se intentó aplicar antes.
**Solución**: El archivo `.sql` ya incluye `DROP POLICY IF EXISTS` al inicio, así que debería funcionar.

### Error: FK constraint violation
Si une tabla depende de otra que no existe aún:
**Solución**: Se han ordenado las tablas por dependencia, debería funcionar.

### Tablas no aparecen en la UI
Si refrescas y aún no ves las tablas:
1. Espera 5 segundos
2. Refrescia nuevamente (Ctrl+Shift+R) para limpiar cache
3. Verifica en Supabase Dashboard que las tablas existen

## Errores en el Frontend Después de Aplicación

Hay dos errores 400 Bad Request en:
- `profesionales_sanitarios` - columna `esta_en_turno` buscada en tabla incorrecta
- `hosix_usuarios` - posible problema de RLS o selección

Estos se revisarán después de que las nuevas tablas se apliquen correctamente.

## Checklist Final

- [ ] Migraciones aplicadas sin errores
- [ ] Tablas aparecen en Supabase Dashboard
- [ ] Console del navegador no muestra 404s para laboratorio/imagenología/enfermería
- [ ] Hooks se ejecutan sin errores
- [ ] Componentes cargan correctamente
