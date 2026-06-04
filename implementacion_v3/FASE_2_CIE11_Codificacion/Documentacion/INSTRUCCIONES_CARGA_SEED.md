# 🚀 INSTRUCCIONES PARA CARGAR SEED DATA CIE-11

**Tiempo estimado:** 5 minutos

---

## PASO 1: ABRIR SUPABASE SQL EDITOR

```
1. Ir a: https://app.supabase.com
2. Seleccionar proyecto: wdieynendfjbkbhfovrx
3. Menú izquierdo: SQL Editor
4. Click en "New query" (botón +)
```

---

## PASO 2: COPIAR Y EJECUTAR SCRIPT

```
1. Abrir archivo: Scripts_Validacion/seed_cie11_ejemplos.sql
2. Seleccionar TODO (Cmd+A)
3. Copiar (Cmd+C)
4. Ir a Supabase SQL Editor
5. Pegar (Cmd+V)
6. Click "Run" o Cmd+Enter
```

**Esperado:**
```
Query completed successfully.
Affected rows: 27
```

---

## PASO 3: VERIFICAR CARGA

```sql
SELECT COUNT(*) FROM hosix_cie11_cache;
```

Debe retornar: **27**

---

## ✅ LISTO PARA TESTING

Una vez confirmado, proceder con testing en formularios clínicos.

---

**Última actualización:** 4 JUN 2026
