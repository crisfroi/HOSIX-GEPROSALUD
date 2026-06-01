# Sistema de Firma Digital - Guía de Implementación

## Resumen

Se ha implementado un sistema de **firma digital interna** (sin servicios terceros) para documentos generados desde plantillas. El flujo es:

1. **Usuario genera documento** desde plantilla (PlantillasManager.tsx)
2. **Cliente convierte a PDF** y sube a Supabase Storage (bucket `documents`)
3. **Servidor firma el documento** usando Edge Function `sign-document` (HMAC-SHA256)
4. **Se guarda hash y metadatos de firma** en DB (`configuracion.documentos_generados`)

## Componentes Implementados

### Frontend (React/TypeScript)
- **`src/components/hosix/pacientes/PlantillasManager.tsx`**
  - Botón "Firmar y Guardar" que:
    - Genera PDF desde HTML con `html2canvas` + `jspdf`
    - Sube PDF a Storage bucket `documents`
    - Persiste registro en BD
    - Llama Edge Function para firma servidor

### Backend (Supabase Edge Function)
- **`sign-document`** (desplegada automáticamente)
  - Valida JWT del usuario
  - Lee documento de `configuracion.documentos_generados`
  - Calcula HMAC-SHA256 sobre contenido + usuario + timestamp
  - Actualiza registro: `firmado=true`, `firmado_por`, `firmado_en`, `hash_firma`

### Base de datos (SQL)
- **`configuracion.plantillas_documentos`** — Define plantillas con variables
- **`configuracion.documentos_generados`** — Almacena documentos generados con campos de firma:
  - `firmado: BOOLEAN` — Indica si está firmado
  - `firmado_por: UUID` — ID del usuario que firmó
  - `firmado_en: TIMESTAMPTZ` — Timestamp de la firma
  - `hash_firma: TEXT` — Hash HMAC-SHA256 para verificación
  - `pdf_url: TEXT` — URL pública del PDF en Storage

## Configuración Requerida

### 1. Crear el bucket `documents` en Supabase Storage

**Opción A: Dashboard de Supabase**
1. Ir a: Supabase Dashboard → Storage
2. Click en "New Bucket"
3. Nombre: `documents`
4. Marcar como Público (Public)
5. Limit: 50 MB (opcional)
6. Create Bucket

**Opción B: Supabase CLI**
```bash
supabase storage create documents --public
```

**Opción C: API REST** (si tienes service role key)
```bash
curl -X POST \
  https://[project-ref].supabase.co/storage/v1/bucket \
  -H "Authorization: Bearer [SERVICE_ROLE_KEY]" \
  -H "Content-Type: application/json" \
  -d '{"name":"documents","public":true}'
```

### 2. Configurar variables de entorno (si usas servidor local)

Si despliegas el servidor local [`scripts/sign-document-server.js`]:
```bash
SIGNING_SECRET=your-secret-key \
SUPABASE_URL=https://[project-ref].supabase.co \
SUPABASE_SERVICE_ROLE_KEY=[your-service-role-key] \
node scripts/sign-document-server.js
```

## Flujo de Firma

### Cliente (React)
```typescript
// 1. Usuario hace click en "Firmar y Guardar"
// 2. Componente:
- Genera PDF desde preview HTML
- Sube a Storage bucket 'documents'
- Crea registro en BD con contenido_final
- Llama Edge Function con document_id
```

### Servidor (Edge Function `sign-document`)
```typescript
POST /functions/v1/sign-document
Headers: Authorization: Bearer [user-jwt]
Body: { document_id: "uuid" }

// Edge Function:
1. Valida JWT (obtiene user.id)
2. Fetch documento de DB
3. HMAC-SHA256(contenido + user_id + timestamp)
4. UPDATE registro: firmado=true, hash_firma=hash
5. Response: { ok: true, hash }
```

### Base de datos
```sql
UPDATE configuracion.documentos_generados
SET 
  firmado = true,
  firmado_por = '[user-id]',
  firmado_en = now(),
  hash_firma = '[computed-hash]'
WHERE id = '[document_id]'
```

## Verificación de Firma

Para verificar que un documento está firmado:

```typescript
// 1. Fetch documento
const doc = await supabase
  .from('configuracion.documentos_generados')
  .select('*')
  .eq('id', document_id)
  .single();

// 2. Verificar campos
if (doc.firmado && doc.hash_firma && doc.firmado_por) {
  // Documento está firmado
  console.log(`Firmado por: ${doc.firmado_por} en ${doc.firmado_en}`);
  console.log(`Hash: ${doc.hash_firma}`);
}

// 3. (Opcional) Recomputar hash para validar integridad
// const recomputedHash = HMAC_SHA256(contenido + user_id + timestamp)
// if (recomputedHash === doc.hash_firma) { /* válido */ }
```

## Archivos Involucrados

| Archivo | Descripción |
|---------|-------------|
| `src/components/hosix/pacientes/PlantillasManager.tsx` | Componente UI con botón "Firmar y Guardar" |
| `src/hooks/useHosixPacientes.ts` | Hooks para CRUD de plantillas y documentos |
| `supabase/migrations/20260603_010_configuracion_plantillas_documentos.sql` | Schema de BD aplicada |
| `scripts/sign-document-server.js` | Servidor local (alternativo a Edge Function) |
| `src/lib/digitalSignature.ts` | Utilidades WebCrypto (ECDSA, opcional) |

## Proximos Pasos (Opcional)

1. **Agregar RLS (Row Level Security)** para control de acceso
   - Solo el dueño del documento/paciente puede verlo
   - Solo admins pueden borrar

2. **Certificado Digital (PKI)**
   - Generar certificado X.509 por usuario
   - Usar clave privada del usuario para firmar
   - Verificar con certificado público

3. **Timestamp Authority (TSA)**
   - Integrar servidor TSA externo (RFC 3161)
   - Para prueba de no-repudio temporal

4. **Base de datos de Revocación (CRL)**
   - Mantener lista de firmas revocadas
   - Validar antes de aceptar firma

5. **Auditoría**
   - Crear tabla `auditoria_firmas` para registrar intentos de firma
   - Loguear quién, cuándo, qué documento, resultado

## Troubleshooting

### Error: "bucket 'documents' not found"
→ Crear el bucket manualmente en Supabase Dashboard (Storage)

### Error: "fetch failed" en `create-storage-bucket.js`
→ Verificar que `SUPABASE_SERVICE_ROLE_KEY` y `SUPABASE_URL` están correctos

### Edge Function retorna 401 Unauthorized
→ Verificar que el usuario está autenticado en Supabase Auth

### Hash no coincide al re-validar
→ Asegurar que timestamp y contenido exacto se usan en el cálculo HMAC

## Referencias

- [Supabase Edge Functions](https://supabase.com/docs/guides/functions)
- [Supabase Storage](https://supabase.com/docs/guides/storage)
- [Web Crypto API](https://developer.mozilla.org/en-US/docs/Web/API/Web_Crypto_API)
- [HMAC-SHA256](https://en.wikipedia.org/wiki/HMAC)
