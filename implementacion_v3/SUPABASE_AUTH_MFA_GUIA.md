# Supabase Auth y MFA - Guía de Implementación

## ✅ Por Qué Supabase Auth es Mejor que Azure para Este Proyecto

### Ventajas de Supabase Auth

1. **TOTP MFA Gratis y Por Defecto** ✅
   - <cite index="4-1">TOTP MFA API está habilitado de forma predeterminada en todos los proyectos Supabase</cite>
   - Compatible con Google Authenticator, Authy, Microsoft Authenticator
   - Sin costo adicional

2. **Phone MFA (SMS/WhatsApp)** ✅
   - <cite index="5-1,5-2">Se envía un código compartido vía SMS o WhatsApp que el usuario usa para autenticarse</cite>
   - Integración con Twilio incluida

3. **Email OTP** ✅
   - <cite index="8-1">Códigos OTP de un solo uso enviados vía email</cite>
   - Gratis con Supabase

4. **Authenticator Assurance Levels (AAL)** ✅
   - <cite index="6-20,6-21">AAL1 para autenticación convencional; AAL2 con segundo factor verificado</cite>
   - Se añaden a JWT automáticamente
   - Ideal para RLS en BD

5. **Sin Cambios de BD** ✅
   - Todo manejado por Supabase Auth
   - Ya tienes usuarios en `auth.users`
   - No necesitas nueva tabla de usuarios

6. **Costo** ✅
   - TOTP: Gratuito
   - SMS: ~$0.10 por código (Twilio pricing)
   - Email: Incluido en plan
   - Azure AD: $0-$150/mes mínimo

---

## 🏗️ Arquitectura SUPABASE AUTH + MFA

```
┌─────────────────────────────────────────────────┐
│         AUTENTICACIÓN SUPABASE                  │
├─────────────────────────────────────────────────┤
│                                                 │
│  PASO 1: Login Primario                         │
│  ┌─────────────────────────────────────────┐   │
│  │ Email + Contraseña (aal1)               │   │
│  │ ↓                                       │   │
│  │ supabase.auth.signInWithPassword()      │   │
│  └─────────────────────────────────────────┘   │
│            ↓                                    │
│  PASO 2: Verificar si tiene MFA                │
│  ┌─────────────────────────────────────────┐   │
│  │ supabase.auth.mfa                       │   │
│  │   .getAuthenticatorAssuranceLevel()     │   │
│  │ currentLevel = aal1?                    │   │
│  │ nextLevel = aal2?                       │   │
│  └─────────────────────────────────────────┘   │
│            ↓                                    │
│  PASO 3: Desafío MFA (elegir factor)          │
│  ┌─────────────────────────────────────────┐   │
│  │ supabase.auth.mfa.challenge()           │   │
│  │ Opciones:                               │   │
│  │ - TOTP (Google Authenticator)           │   │
│  │ - SMS (código vía texto)                │   │
│  │ - Email (código vía email)              │   │
│  └─────────────────────────────────────────┘   │
│            ↓                                    │
│  PASO 4: Verificar Código                      │
│  ┌─────────────────────────────────────────┐   │
│  │ supabase.auth.mfa.verify()              │   │
│  │ challenge_id + código del usuario       │   │
│  └─────────────────────────────────────────┘   │
│            ↓                                    │
│  SESIÓN CREADA (aal2)                          │
│  JWT incluye: "aal": "aal2"                    │
│                                                 │
│  ✅ Puedes usar en RLS:                        │
│  CREATE POLICY "Require MFA"                   │
│    ON table_sensible                           │
│    USING (auth.jwt() ->> 'aal' = 'aal2')      │
│                                                 │
└─────────────────────────────────────────────────┘
```

---

## 🔧 Implementación (Pasos Reales)

### 1. Verificar Requisitos (0.5h)
- [ ] Supabase ya tiene usuarios en `auth.users`
- [ ] TOTP está habilitado por defecto (sin config)
- [ ] Para SMS: obtener credenciales Twilio (si aplica)
- [ ] Para Email: ya funciona (verifica dominio si es custom)

### 2. Componentes Frontend (4h)

#### `MFAEnrollment.tsx` - Setup de MFA
```typescript
import { useEffect, useState } from 'react'
import { supabase } from '@/integrations/supabase/hosixClient'
import { QRCodeSVG } from 'qrcode.react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

export function MFAEnrollment() {
  const [factor, setFactor] = useState<any>(null)
  const [code, setCode] = useState('')
  const [loading, setLoading] = useState(false)

  // 1. Iniciar enrollamiento
  const enrollTotp = async () => {
    setLoading(true)
    const { data, error } = await supabase.auth.mfa.enroll({
      factorType: 'totp',
      friendlyName: 'Mi Autenticador',
    })
    if (data) setFactor(data)
    setLoading(false)
  }

  // 2. Verificar código
  const verifyCode = async () => {
    const { data, error } = await supabase.auth.mfa.challenge({
      factorId: factor.id,
    })
    
    if (data?.id) {
      const { error: verifyError } = await supabase.auth.mfa.verify({
        factorId: factor.id,
        challengeId: data.id,
        code,
      })
      
      if (!verifyError) {
        alert('MFA activada')
        setFactor(null)
      }
    }
  }

  return (
    <div className="space-y-4">
      {!factor ? (
        <Button onClick={enrollTotp}>Activar MFA</Button>
      ) : (
        <>
          <div className="p-4 bg-gray-100 rounded-lg">
            {/* Render QR Code */}
            {factor.totp?.qr_code && (
              <img src={`data:image/svg+xml;base64,${btoa(factor.totp.qr_code)}`} />
            )}
          </div>
          
          <Input
            placeholder="Código del autenticador"
            value={code}
            onChange={(e) => setCode(e.target.value)}
          />
          
          <Button onClick={verifyCode}>Verificar</Button>
        </>
      )}
    </div>
  )
}
```

#### `MFAChallenge.tsx` - Verificación en login
```typescript
// Después de login exitoso (aal1)
const { data: aal } = await supabase.auth.mfa.getAuthenticatorAssuranceLevel()

if (aal?.currentLevel === 'aal1' && aal?.nextLevel === 'aal2') {
  // Usuario tiene MFA configurado - pedir desafío
  const { data: challenge } = await supabase.auth.mfa.challenge({
    factorId: /* usuario's factor id */
  })
  
  // Mostrar UI de verificación
}
```

### 3. Auditoría (2h)
- [ ] Crear tabla `hosix_auditoria_accesos`
- [ ] Crear tabla `hosix_auditoria_cambios`
- [ ] Middleware para loggear accesos
- [ ] Triggers para loggear cambios BD

### 4. RLS Policies (1h)
- [ ] Actualizar RLS para requerir AAL2 en datos sensibles
- [ ] Usar `auth.jwt() ->> 'aal' = 'aal2'` en policies

### 5. Dashboard Seguridad (1h)
- [ ] `SecuritySettings.tsx` - Config de MFA
- [ ] `AuditLog.tsx` - Historial accesos
- [ ] `ComplianceReport.tsx` - Reportes

### 6. Testing (1h)
- [ ] Test enrollamiento TOTP
- [ ] Test desafío/verificación
- [ ] Test RLS con AAL

---

## 📋 Flujos de Usuario

### Flujo 1: Activar MFA (Primera Vez)
```
1. Usuario: va a Seguridad
2. Sistema: muestra "Activar MFA"
3. Usuario: elige TOTP o SMS
4. Sistema: genera código QR (o envía SMS)
5. Usuario: escanea QR con Google Authenticator
6. Usuario: ingresa código
7. Sistema: verifica y activa
8. Usuario: guarda "recovery codes" (backup)
```

### Flujo 2: Login con MFA
```
1. Usuario: ingresa email + contraseña
2. Sistema: válida (aal1 activa)
3. Sistema: detecta MFA activo
4. Sistema: presenta opciones:
   - "Usar Autenticador" 
   - "Recibir SMS" (si tiene)
   - "Usar Recovery Code"
5. Usuario: selecciona opción
6. Usuario: ingresa código
7. Sistema: verifica y crea sesión aal2
8. Usuario: acceso full
```

### Flujo 3: Perder Autenticador
```
1. Usuario: no tiene acceso a autenticador
2. Usuario: click "No tengo acceso"
3. Sistema: pide email
4. Sistema: envía recovery code
5. Usuario: ingresa recovery code
6. Sistema: permite resetear MFA
7. Usuario: re-enrolla nuevo autenticador
```

---

## 🔐 RLS Integration

### Ejemplo: Tabla Sensible Requiere MFA

```sql
-- Crear policy que requiera AAL2
CREATE POLICY "require_mfa_for_sensitive_data"
  ON pacientes
  FOR ALL
  USING (
    auth.role() = 'authenticated' 
    AND (auth.jwt() ->> 'aal')::text = 'aal2'
  );

-- Resultado:
-- - Si usuario está aal1 (sin MFA): no puede ver datos
-- - Si usuario está aal2 (con MFA): acceso completo
```

---

## 💰 Costos Estimados (Anual)

| Factor | Costo | Notas |
|--------|-------|-------|
| TOTP | $0 | Gratis, unlimited |
| SMS (1000/mes) | ~$1,200 | Twilio: $0.1/SMS |
| Email OTP | $0 | Incluido |
| **TOTAL** | ~$1,200 | Vs. Azure: $2,000+ |

---

## ✅ Ventajas Finales

- ✅ **Costo menor** que Azure AD
- ✅ **Ya integrado** en Supabase (no requiere config externa)
- ✅ **Más opciones** de MFA (TOTP + SMS + Email)
- ✅ **AAL en JWT** para RLS automático
- ✅ **Sin tabla de usuarios extra** (usa `auth.users`)
- ✅ **Recovery codes** automáticos para recuperación
- ✅ **Admin panel** en Supabase para gestión

---

## 📝 Resumen: Fase 6.6 Simplificada

**Antes (Azure):** 20 horas
- Registrar app en Azure
- Configurar OAuth
- Edge Functions para token exchange
- Mapeo de roles
- Auto-creación usuarios

**Ahora (Supabase Auth):** 10 horas
- Activar MFA en dashboard (0h - ya está)
- Crear componentes enrollment/challenge (4h)
- Auditoría y RLS (3h)
- Testing (1.5h)
- Documentación (1.5h)

**Cambio:** -50% tiempo, sin costo adicional, mejor UX

---

**Recomendación:** Usar Supabase Auth + MFA para Fase 6.6
**Tiempo ahorrado:** 10 horas
**Costo ahorrado:** $1,000+ anuales
