# ✅ FASE 2 - TESTING DETALLADO PASO A PASO

**Fecha:** 4 de Junio 2026  
**Status:** 🔴 EN EJECUCIÓN - TESTING ACTIVO  
**Responsable:** Dev Team  
**Duración estimada:** 2 horas  

---

## 📋 PRE-REQUISITOS VERIFICADOS

- ✅ Docker ICD-API corriendo en `http://localhost:8090`
- ✅ Swagger API disponible: `http://localhost:8090/swagger/index.html`
- ✅ Migración CIE-11 aplicada en Supabase
- ✅ Componente `DiagnosticoCIE11Selector.tsx` corregido
- ✅ Hook `useHosixCIE11.ts` creado
- ✅ Variable `VITE_ICD_API_URL=http://localhost:8090` configurada en `.env.local`
- ✅ Seed data script listo

---

## 🔧 PASO 1: CARGAR SEED DATA

### 1.1 Acceder a Supabase SQL Editor

```
1. Ir a https://app.supabase.com
2. Seleccionar proyecto: wdieynendfjbkbhfovrx
3. Ir a SQL Editor
4. Crear nueva query
```

### 1.2 Ejecutar script de seed CIE-11

```
1. Copiar: FASE_2_CIE11_Codificacion/Scripts_Validacion/seed_cie11_ejemplos.sql
2. Pegar en el editor SQL
3. Click "Run" o Cmd+Enter
4. Esperar confirmación
```

**Esperado:**
```
Query completed successfully.
Affected rows: 27
```

**Checklist:**
- [ ] SQL ejecutado sin errores
- [ ] 27+ registros insertados
- [ ] Datos distribuidos en 9+ capítulos

---

## 🎨 PASO 3: TESTING FUNCIONAL EN BROWSER

### 3.1 Iniciar dev server

```bash
npm run dev
```

**Checklist:**
- [ ] npm run dev ejecuta sin errores
- [ ] Preview disponible
- [ ] Sin errores en terminal

### 3.2 Prueba: Búsqueda ECT en Español

```
1. Navegar a cualquier formulario clínico con CIE-11
2. Escribir: "tuberculosis"
3. Esperar resultados
```

**Esperado:**
- Código: BA12.34
- Título: Tuberculosis pulmonar
- Descripción en español
- Sin errores CORS

**Checklist:**
- [ ] ECT busca automáticamente
- [ ] Resultados aparecen en español
- [ ] Sin timeout o errores

---

## 📝 PASO 4: TESTING EN FORMULARIOS CLÍNICOS

### 4.1 Consulta Médica

```
1. Crear nueva consulta médica
2. Buscar "diabetes" en CIE-11
3. Seleccionar "Diabetes mellitus tipo 1"
4. Guardar Consulta
```

**Verificar en Supabase:**
```sql
SELECT * FROM hosix_diagnosticos WHERE codigo_cie11 = '5A11.1';
```

### 4.2 Urgencias

```
1. Crear atención de urgencia
2. Buscar "covid"
3. Seleccionar "COVID-19"
4. Cerrar Episodio
```

### 4.3 Ingreso Hospital

```
1. Crear nuevo ingreso
2. Buscar "asma"
3. Seleccionar "Asma bronquial"
4. Crear Hospitalización
```

### 4.4 Alta Hospital

```
1. Abrir hospitalización activa
2. Click "Dar de Alta"
3. Buscar "hipertensión"
4. Dar de Alta
```

---

## ✅ PASO 7: CHECKLIST FINAL

- [ ] ECT carga sin errores CORS
- [ ] Búsqueda en español funciona
- [ ] 4 formularios funcionan
- [ ] Datos se guardan en BD
- [ ] Datos persisten después de reload
- [ ] BI tiene datos
- [ ] Console sin errores rojos

---

**Última actualización:** 4 JUN 2026
