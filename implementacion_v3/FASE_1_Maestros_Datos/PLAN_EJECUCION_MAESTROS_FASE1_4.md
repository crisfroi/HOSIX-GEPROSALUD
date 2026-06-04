# PLAN DE EJECUCIÓN - MAESTROS FASE 1.4

**Objetivo:** Completar TODOS los maestros de Fase 1 para tener un sistema normalizado 100%  
**Estrategia:** Rigurosa - Implementar 12 tablas + 12 UI Managers esta semana  
**Estado:** 🔴 INICIADO 4-JUN  
**Timeline:** 4 días (4-7 JUN)

---

## 📋 CHECKLIST DE MIGRACIONES

### Ya Aplicadas ✅
- [x] 20260604_023_maestros_ubicacion.sql (Provincias + Distritos)

### Por Aplicar (Esta Semana)
- [ ] 20260604_024_maestros_fase1_completo.sql (Org + RRHH)
  - Unidades Funcionales
  - Especialidades Médicas
  - Roles Organizacionales
  - Cualificaciones Profesionales
  - Relación Profesionales-Cualificaciones
  
- [ ] 20260604_025_maestros_fase1_operativos.sql (Operativos + Config)
  - Zonas de Cobertura
  - Proveedores
  - Material Médico
  - Servicios de Terceros
  - Parámetros Sistema
  - Políticas de Seguridad
  - Mantenimiento Equipos

---

## 🛠️ COMPONENTES UI A CREAR

| Manager | Tabla | Complejidad | Tiempo Est. |
|---------|-------|-------------|------------|
| UnidadesFuncionalesManager | hosix_unidades_funcionales | Media | 3h |
| EspecialidadesMedicasManager | hosix_especialidades_medicas | Baja | 2h |
| RolesOrganizacionalesManager | hosix_roles_organizacionales | Media | 3h |
| CualificacionesManager | hosix_cualificaciones_profesionales | Alta | 4h |
| ZonasCoberturaManger | hosix_zonas_cobertura | Media | 3h |
| ProveedoresManager | hosix_proveedores | Alta | 4h |
| MaterialMedicoManager | hosix_material_medico | Alta | 4h |
| ServiciosTercerosManager | hosix_servicios_terceros | Media | 3h |
| ParametrosSistemaManager | hosix_parametros_sistema | Media | 3h |
| PoliticasSeguridad | hosix_politicas_seguridad | Alta | 4h |
| **TOTAL** | **10 Managers** | - | **33h** |

**Tiempo real** (con testing): ~40 horas = 5 días de trabajo intenso

---

## 📅 CALENDARIO PROPUESTO

### Miércoles 4 JUN (HOY)
- [ ] Aplicar migración 020604_024 (Org + RRHH)
- [ ] Aplicar migración 020604_025 (Operativos)
- [ ] Verificar que todas las tablas se crearon correctamente
- [ ] **Tiempo:** 2h

### Jueves 5 JUN
- [ ] UnidadesFuncionalesManager (3h)
- [ ] EspecialidadesMedicasManager (2h)
- [ ] RolesOrganizacionalesManager (3h)
- [ ] **Subtotal:** 8h

### Viernes 6 JUN
- [ ] CualificacionesManager (4h)
- [ ] ProveedoresManager (4h)
- [ ] **Subtotal:** 8h

### Lunes 7 JUN
- [ ] MaterialMedicoManager (4h)
- [ ] ServiciosTercerosManager (3h)
- [ ] ParametrosSistemaManager (3h)
- [ ] **Subtotal:** 10h

### Martes 8 JUN
- [ ] PoliticasSeguridad (4h)
- [ ] ZonasCoberturaManger (3h)
- [ ] Testing integral (2h)
- [ ] **Subtotal:** 9h

**Total Implementación:** ~40 horas distribuidas 4-8 JUN

---

## 🔍 VERIFICACIÓN POST-MIGRACIÓN

```sql
-- Ejecutar en Supabase SQL Editor

-- 1. Contar nuevas tablas
SELECT count(*) AS tablas_creadas FROM information_schema.tables
WHERE table_schema = 'public' AND table_name LIKE 'hosix_%';

-- 2. Verificar maestros de ubicación
SELECT COUNT(*) FROM hosix_provincias; -- Debe ser 8
SELECT COUNT(*) FROM hosix_distritos_sanitarios; -- Debe ser 19

-- 3. Verificar maestros de RRHH
SELECT COUNT(*) FROM hosix_especialidades_medicas; -- Debe ser >= 15
SELECT COUNT(*) FROM hosix_roles_organizacionales; -- Debe ser 16
SELECT COUNT(*) FROM hosix_cualificaciones_profesionales; -- Debe ser >= 10

-- 4. Verificar maestros operativos
SELECT COUNT(*) FROM hosix_parametros_sistema; -- Debe ser >= 6
SELECT COUNT(*) FROM hosix_politicas_seguridad; -- Debe ser >= 4

-- 5. Verificar índices creados
SELECT indexname FROM pg_indexes 
WHERE tablename IN ('hosix_especialidades_medicas', 'hosix_proveedores', 'hosix_material_medico')
LIMIT 10;
```

---

## 🚀 INTEGRACIÓN EN CONFIGURACIÓN

Cada Manager debe integrarse en `src/pages/Hosix/Configuracion.tsx`:

```tsx
{/* Nuevo Tab en Maestros */}
<TabsContent value="maestros" className="space-y-4">
  <Tabs value="maestroTab" onValueChange={setMaestroTab}>
    <TabsList>
      <TabsTrigger value="departamentos">Departamentos</TabsTrigger>
      <TabsTrigger value="unidades">Unidades Funcionales</TabsTrigger>
      <TabsTrigger value="especialidades">Especialidades</TabsTrigger>
      <TabsTrigger value="roles">Roles Org.</TabsTrigger>
      <TabsTrigger value="cualificaciones">Cualificaciones</TabsTrigger>
      <TabsTrigger value="zonas">Zonas Cobertura</TabsTrigger>
      <TabsTrigger value="proveedores">Proveedores</TabsTrigger>
      <TabsTrigger value="material">Material Médico</TabsTrigger>
      <TabsTrigger value="servicios">Servicios Terceros</TabsTrigger>
      <TabsTrigger value="parametros">Parámetros</TabsTrigger>
      <TabsTrigger value="politicas">Políticas Seguridad</TabsTrigger>
    </TabsList>
    
    <TabsContent value="departamentos"><DepartamentosManager /></TabsContent>
    <TabsContent value="unidades"><UnidadesFuncionalesManager /></TabsContent>
    <TabsContent value="especialidades"><EspecialidadesMedicasManager /></TabsContent>
    {/* ... etc */}
  </Tabs>
</TabsContent>
```

---

## 📊 ESTRUCTURA ESTÁNDAR PARA CADA MANAGER

Cada Manager seguirá este patrón:

```typescript
// src/hooks/useHosixNuevatAbla.ts
export function useHosixNuevatAbla() {
  const [datos, setDatos] = useState([])
  const [cargando, setCargando] = useState(false)
  
  const cargar = async () => { /* ... */ }
  const crear = async (data) => { /* ... */ }
  const actualizar = async (id, data) => { /* ... */ }
  const eliminar = async (id) => { /* ... */ }
  
  return { datos, cargando, cargar, crear, actualizar, eliminar }
}

// src/components/hosix/configuracion/NuevatAblaManager.tsx
export function NuevatAblaManager() {
  const { datos, cargando, crear, actualizar, eliminar } = useHosixNuevatAbla()
  
  return (
    <Card>
      <CardHeader>
        <CardTitle>Gestionar Nueva Tabla</CardTitle>
      </CardHeader>
      <CardContent>
        {/* Dialog de crear */}
        {/* Tabla con datos */}
        {/* Acciones editar/eliminar */}
      </CardContent>
    </Card>
  )
}
```

---

## ⚠️ CONSIDERACIONES ESPECIALES

### CualificacionesManager
- Tabla relacional: `hosix_profesionales_cualificaciones`
- Funcionalidad: Asignar cualificaciones a profesionales existentes
- Validación: Fecha vencimiento, certificados
- Extra: Indicador "Vigente/Vencida"

### ProveedoresManager
- Tabla importante para compras y suministros
- Funcionalidad CRUD + historial de precios
- Vinculación con Material Médico
- Extra: Calificación del proveedor (stars)

### MaterialMedicoManager
- Tabla con muchos campos (especificaciones JSONB, presentación, etc)
- Funcionalidad CRUD + búsqueda avanzada
- Vinculación con Proveedores + Almacenes
- Extra: Stock actual (query desde tabla almacén)

### ParametrosSistemaManager
- Gestión de configuraciones dinámicas
- No debe tener "crear" (usar seeds predefinidos)
- Solo "editar" y "leer"
- Validación de tipos (numero/texto/booleano)

### PoliticasSeguridad
- Avanzado: gestión de RLS policies
- Visualización de qué usuarios/roles afecta
- Previsualization de condición SQL
- WARNING: cambios aquí afectan seguridad

---

## 📋 CRITERIOS DE ACEPTACIÓN

Cada Manager estará COMPLETO cuando:

✅ CRUD funcional (Crear, Leer, Actualizar, Eliminar)  
✅ Tabla con búsqueda mínima  
✅ Validación de datos (campos requeridos, formatos)  
✅ Mensajes de éxito/error con toast  
✅ Integración en Configuración tab  
✅ Índices creados en BD  
✅ RLS policies aplicadas  
✅ Seed data cargado donde aplique  

---

## 🎯 PRÓXIMO PASO

**Hoy (4 JUN):**
1. Aplicar migraciones 24 + 25
2. Ejecutar queries de verificación
3. Confirmar que todo se creó correctamente

**Mañana (5 JUN):**
- Iniciar primeros 3 Managers (Unidades, Especialidades, Roles)

---

**Estado:** 🔴 PENDIENTE APLICAR MIGRACIONES  
**Owner:** Sistema HOSIX  
**Prioridad:** ALTA  
**Bloqueadores:** Ninguno

