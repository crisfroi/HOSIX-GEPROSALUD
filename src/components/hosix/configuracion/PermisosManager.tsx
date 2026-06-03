import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Checkbox } from '@/components/ui/checkbox';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/components/ui/use-toast';
import { useHosixUsers } from '@/hooks/useHosixUsers';
import { useHosixPermisos } from '@/hooks/useHosixPermisos';
import { useHosixEquipos } from '@/hooks/useHosixEquipos';
import { AlertCircle, Save, Shield, CheckSquare, Square } from 'lucide-react';
import { supabase } from '@/integrations/supabase/hosixClient';

interface PermisoModulo {
  perfil_id?: string;
  usuario_id?: string;
  equipo_id?: string;
  modulo: string;
  puede_leer: boolean;
  puede_crear: boolean;
  puede_editar: boolean;
  puede_eliminar: boolean;
  puede_aprobar: boolean;
}

interface PermisoEquipo {
  equipo_id: string;
  modulo: string;
  puede_leer: boolean;
  puede_crear: boolean;
  puede_editar: boolean;
  puede_eliminar: boolean;
}

const MODULOS = [
  { codigo: 'admision', nombre: 'Admisión Central' },
  { codigo: 'cred', nombre: 'CRED' },
  { codigo: 'citas', nombre: 'Citas y Agendas' },
  { codigo: 'cajas', nombre: 'Cajas' },
  { codigo: 'compras', nombre: 'Compras' },
  { codigo: 'urgencias', nombre: 'Urgencias' },
  { codigo: 'hospitalizacion', nombre: 'Hospitalización' },
  { codigo: 'quirofanos', nombre: 'Quirófanos' },
  { codigo: 'farmacia', nombre: 'Farmacia' },
  { codigo: 'laboratorio', nombre: 'Laboratorio' },
  { codigo: 'imagenologia', nombre: 'Imagenología' },
  { codigo: 'facturacion', nombre: 'Facturación' },
  { codigo: 'recobros', nombre: 'Recobros' },
  { codigo: 'suministros', nombre: 'Suministros' },
  { codigo: 'reportes', nombre: 'Reportes' },
  { codigo: 'configuracion', nombre: 'Configuración' },
];

export const PermisosManager: React.FC = () => {
  const { toast } = useToast();
  const { perfiles, usuarios } = useHosixUsers();
  const { equipos } = useHosixEquipos();
  
  // Estado para Tab: Por Rol
  const [perfilSeleccionado, setPerfilSeleccionado] = useState<string>('');
  const [permisosRol, setPermisosRol] = useState<Record<string, PermisoModulo>>({});
  
  // Estado para Tab: Por Usuario
  const [usuarioSeleccionado, setUsuarioSeleccionado] = useState<string>('');
  const [permisosUsuario, setPermisosUsuario] = useState<Record<string, PermisoModulo>>({});
  
  // Estado para Tab: Por Equipo
  const [equipoSeleccionado, setEquipoSeleccionado] = useState<string>('');
  const [permisosEquipo, setPermisosEquipo] = useState<Record<string, PermisoEquipo>>({});
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Cargar permisos por rol
  useEffect(() => {
    if (perfilSeleccionado) {
      cargarPermisosRol();
    }
  }, [perfilSeleccionado]);

  // Cargar permisos por usuario
  useEffect(() => {
    if (usuarioSeleccionado) {
      cargarPermisosUsuario();
    }
  }, [usuarioSeleccionado]);

  // Cargar permisos por equipo
  useEffect(() => {
    if (equipoSeleccionado) {
      cargarPermisosEquipo();
    }
  }, [equipoSeleccionado]);

  const cargarPermisosRol = async () => {
    try {
      setLoading(true);
      setError('');

      const { data, error: queryError } = await supabase
        .from('hosix_permisos_modulos')
        .select('*')
        .eq('perfil_id', perfilSeleccionado)
        .is('usuario_id', null)
        .is('equipo_id', null);

      if (queryError) throw queryError;

      const permisosMap: Record<string, PermisoModulo> = {};
      data?.forEach(p => {
        permisosMap[p.modulo] = p;
      });

      MODULOS.forEach(m => {
        if (!permisosMap[m.codigo]) {
          permisosMap[m.codigo] = {
            perfil_id: perfilSeleccionado,
            modulo: m.codigo,
            puede_leer: false,
            puede_crear: false,
            puede_editar: false,
            puede_eliminar: false,
            puede_aprobar: false,
          };
        }
      });

      setPermisosRol(permisosMap);
    } catch (err: any) {
      setError(err.message || 'Error al cargar permisos del rol');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const cargarPermisosUsuario = async () => {
    try {
      setLoading(true);
      setError('');

      const { data, error: queryError } = await supabase
        .from('hosix_permisos_modulos')
        .select('*')
        .eq('usuario_id', usuarioSeleccionado);

      if (queryError) throw queryError;

      const permisosMap: Record<string, PermisoModulo> = {};
      data?.forEach(p => {
        permisosMap[p.modulo] = p;
      });

      MODULOS.forEach(m => {
        if (!permisosMap[m.codigo]) {
          permisosMap[m.codigo] = {
            usuario_id: usuarioSeleccionado,
            modulo: m.codigo,
            puede_leer: false,
            puede_crear: false,
            puede_editar: false,
            puede_eliminar: false,
            puede_aprobar: false,
          };
        }
      });

      setPermisosUsuario(permisosMap);
    } catch (err: any) {
      setError(err.message || 'Error al cargar permisos del usuario');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const cargarPermisosEquipo = async () => {
    try {
      setLoading(true);
      setError('');

      const { data, error: queryError } = await supabase
        .from('hosix_permisos_equipos')
        .select('*')
        .eq('equipo_id', equipoSeleccionado);

      if (queryError) throw queryError;

      const permisosMap: Record<string, PermisoEquipo> = {};
      data?.forEach(p => {
        permisosMap[p.modulo] = p;
      });

      MODULOS.forEach(m => {
        if (!permisosMap[m.codigo]) {
          permisosMap[m.codigo] = {
            equipo_id: equipoSeleccionado,
            modulo: m.codigo,
            puede_leer: false,
            puede_crear: false,
            puede_editar: false,
            puede_eliminar: false,
          };
        }
      });

      setPermisosEquipo(permisosMap);
    } catch (err: any) {
      setError(err.message || 'Error al cargar permisos del equipo');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handlePermisoChangeRol = (
    modulo: string,
    permiso: keyof Omit<PermisoModulo, 'perfil_id' | 'modulo' | 'usuario_id' | 'equipo_id'>,
    value: boolean
  ) => {
    setPermisosRol(prev => ({
      ...prev,
      [modulo]: {
        ...prev[modulo],
        [permiso]: value,
      },
    }));
  };

  const handlePermisoChangeUsuario = (
    modulo: string,
    permiso: keyof Omit<PermisoModulo, 'perfil_id' | 'modulo' | 'usuario_id' | 'equipo_id'>,
    value: boolean
  ) => {
    setPermisosUsuario(prev => ({
      ...prev,
      [modulo]: {
        ...prev[modulo],
        [permiso]: value,
      },
    }));
  };

  const handlePermisoChangeEquipo = (
    modulo: string,
    permiso: keyof Omit<PermisoEquipo, 'equipo_id' | 'modulo'>,
    value: boolean
  ) => {
    setPermisosEquipo(prev => ({
      ...prev,
      [modulo]: {
        ...prev[modulo],
        [permiso]: value,
      },
    }));
  };

  const selectAllRol = () => {
    setPermisosRol(prev => {
      const updated = { ...prev };
      Object.keys(updated).forEach(modulo => {
        updated[modulo] = {
          ...updated[modulo],
          puede_leer: true,
          puede_crear: true,
          puede_editar: true,
          puede_eliminar: true,
          puede_aprobar: true,
        };
      });
      return updated;
    });
  };

  const clearAllRol = () => {
    setPermisosRol(prev => {
      const updated = { ...prev };
      Object.keys(updated).forEach(modulo => {
        updated[modulo] = {
          ...updated[modulo],
          puede_leer: false,
          puede_crear: false,
          puede_editar: false,
          puede_eliminar: false,
          puede_aprobar: false,
        };
      });
      return updated;
    });
  };

  const selectAllUsuario = () => {
    setPermisosUsuario(prev => {
      const updated = { ...prev };
      Object.keys(updated).forEach(modulo => {
        updated[modulo] = {
          ...updated[modulo],
          puede_leer: true,
          puede_crear: true,
          puede_editar: true,
          puede_eliminar: true,
          puede_aprobar: true,
        };
      });
      return updated;
    });
  };

  const clearAllUsuario = () => {
    setPermisosUsuario(prev => {
      const updated = { ...prev };
      Object.keys(updated).forEach(modulo => {
        updated[modulo] = {
          ...updated[modulo],
          puede_leer: false,
          puede_crear: false,
          puede_editar: false,
          puede_eliminar: false,
          puede_aprobar: false,
        };
      });
      return updated;
    });
  };

  const handleGuardarRol = async () => {
    if (!perfilSeleccionado) {
      setError('Seleccione un rol');
      return;
    }

    try {
      setLoading(true);
      setError('');

      for (const [modulo, permisoData] of Object.entries(permisosRol)) {
        const { error: upsertError } = await supabase
          .from('hosix_permisos_modulos')
          .upsert(
            {
              perfil_id: perfilSeleccionado,
              modulo,
              puede_leer: permisoData.puede_leer,
              puede_crear: permisoData.puede_crear,
              puede_editar: permisoData.puede_editar,
              puede_eliminar: permisoData.puede_eliminar,
              puede_aprobar: permisoData.puede_aprobar,
            },
            { onConflict: 'perfil_id,modulo' }
          );

        if (upsertError) throw upsertError;
      }

      toast({
        title: 'Éxito',
        description: 'Permisos del rol actualizados',
      });
    } catch (err: any) {
      setError(err.message || 'Error al guardar permisos');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleGuardarUsuario = async () => {
    if (!usuarioSeleccionado) {
      setError('Seleccione un usuario');
      return;
    }

    try {
      setLoading(true);
      setError('');

      for (const [modulo, permisoData] of Object.entries(permisosUsuario)) {
        const { error: upsertError } = await supabase
          .from('hosix_permisos_modulos')
          .upsert(
            {
              usuario_id: usuarioSeleccionado,
              modulo,
              puede_leer: permisoData.puede_leer,
              puede_crear: permisoData.puede_crear,
              puede_editar: permisoData.puede_editar,
              puede_eliminar: permisoData.puede_eliminar,
              puede_aprobar: permisoData.puede_aprobar,
            },
            { onConflict: 'usuario_id,modulo' }
          );

        if (upsertError) throw upsertError;
      }

      toast({
        title: 'Éxito',
        description: 'Permisos del usuario actualizados',
      });
    } catch (err: any) {
      setError(err.message || 'Error al guardar permisos');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleGuardarEquipo = async () => {
    if (!equipoSeleccionado) {
      setError('Seleccione un equipo');
      return;
    }

    try {
      setLoading(true);
      setError('');

      for (const [modulo, permisoData] of Object.entries(permisosEquipo)) {
        const { error: upsertError } = await supabase
          .from('hosix_permisos_equipos')
          .upsert(
            {
              equipo_id: equipoSeleccionado,
              modulo,
              puede_leer: permisoData.puede_leer,
              puede_crear: permisoData.puede_crear,
              puede_editar: permisoData.puede_editar,
              puede_eliminar: permisoData.puede_eliminar,
            },
            { onConflict: 'equipo_id,modulo' }
          );

        if (upsertError) throw upsertError;
      }

      toast({
        title: 'Éxito',
        description: 'Permisos del equipo actualizados. Se heredarán a sus miembros.',
      });
    } catch (err: any) {
      setError(err.message || 'Error al guardar permisos');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const renderTablaPermisos = (
    permisos: Record<string, any>,
    onChange: (modulo: string, permiso: string, value: boolean) => void,
    tieneAprobar: boolean = true
  ) => (
    <div className="border rounded-lg overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b sticky top-0">
            <tr>
              <th className="px-4 py-3 text-left font-medium min-w-[200px]">Módulo</th>
              <th className="px-4 py-3 text-center font-medium">Leer</th>
              <th className="px-4 py-3 text-center font-medium">Crear</th>
              <th className="px-4 py-3 text-center font-medium">Editar</th>
              <th className="px-4 py-3 text-center font-medium">Eliminar</th>
              {tieneAprobar && <th className="px-4 py-3 text-center font-medium">Aprobar</th>}
            </tr>
          </thead>
          <tbody>
            {MODULOS.map(mod => (
              <tr key={mod.codigo} className="border-b hover:bg-gray-50">
                <td className="px-4 py-3 font-medium text-gray-700">
                  {mod.nombre}
                </td>
                <td className="px-4 py-3 text-center">
                  <Checkbox
                    checked={permisos[mod.codigo]?.puede_leer || false}
                    onCheckedChange={(checked) =>
                      onChange(mod.codigo, 'puede_leer', checked as boolean)
                    }
                    disabled={loading}
                  />
                </td>
                <td className="px-4 py-3 text-center">
                  <Checkbox
                    checked={permisos[mod.codigo]?.puede_crear || false}
                    onCheckedChange={(checked) =>
                      onChange(mod.codigo, 'puede_crear', checked as boolean)
                    }
                    disabled={loading}
                  />
                </td>
                <td className="px-4 py-3 text-center">
                  <Checkbox
                    checked={permisos[mod.codigo]?.puede_editar || false}
                    onCheckedChange={(checked) =>
                      onChange(mod.codigo, 'puede_editar', checked as boolean)
                    }
                    disabled={loading}
                  />
                </td>
                <td className="px-4 py-3 text-center">
                  <Checkbox
                    checked={permisos[mod.codigo]?.puede_eliminar || false}
                    onCheckedChange={(checked) =>
                      onChange(mod.codigo, 'puede_eliminar', checked as boolean)
                    }
                    disabled={loading}
                  />
                </td>
                {tieneAprobar && (
                  <td className="px-4 py-3 text-center">
                    <Checkbox
                      checked={permisos[mod.codigo]?.puede_aprobar || false}
                      onCheckedChange={(checked) =>
                        onChange(mod.codigo, 'puede_aprobar', checked as boolean)
                      }
                      disabled={loading}
                    />
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="w-5 h-5" />
            Matriz de Permisos Avanzada
          </CardTitle>
          <CardDescription>
            Configure permisos por rol, usuario o equipo médico. Los permisos de equipo se heredan a sus miembros.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {error && (
            <Alert variant="destructive">
              <AlertCircle className="w-4 h-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <Tabs defaultValue="roles" className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="roles">Por Rol</TabsTrigger>
              <TabsTrigger value="usuarios">Por Usuario</TabsTrigger>
              <TabsTrigger value="equipos">Por Equipo Médico</TabsTrigger>
            </TabsList>

            {/* TAB: Por Rol */}
            <TabsContent value="roles" className="space-y-4 mt-6">
              <div className="space-y-2">
                <label className="text-sm font-medium">Seleccionar Rol</label>
                <select
                  value={perfilSeleccionado}
                  onChange={(e) => setPerfilSeleccionado(e.target.value)}
                  disabled={loading}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                >
                  <option value="">Seleccione un rol...</option>
                  {perfiles?.map(perfil => (
                    <option key={perfil.id} value={perfil.id}>
                      {perfil.nombre} (Nivel {perfil.nivel_acceso || '?'})
                    </option>
                  ))}
                </select>
              </div>

              {perfilSeleccionado && Object.keys(permisosRol).length > 0 && (
                <div className="space-y-4">
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={selectAllRol}
                      disabled={loading}
                      className="gap-2"
                    >
                      <CheckSquare className="w-4 h-4" />
                      Seleccionar Todo
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={clearAllRol}
                      disabled={loading}
                      className="gap-2"
                    >
                      <Square className="w-4 h-4" />
                      Limpiar Todo
                    </Button>
                  </div>
                  {renderTablaPermisos(permisosRol, handlePermisoChangeRol)}
                  <Button
                    onClick={handleGuardarRol}
                    disabled={loading}
                    className="w-full"
                  >
                    <Save className="w-4 h-4 mr-2" />
                    {loading ? 'Guardando...' : 'Guardar Permisos del Rol'}
                  </Button>
                </div>
              )}
            </TabsContent>

            {/* TAB: Por Usuario */}
            <TabsContent value="usuarios" className="space-y-4 mt-6">
              <div className="space-y-2">
                <label className="text-sm font-medium">Seleccionar Usuario</label>
                <select
                  value={usuarioSeleccionado}
                  onChange={(e) => setUsuarioSeleccionado(e.target.value)}
                  disabled={loading}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                >
                  <option value="">Seleccione un usuario...</option>
                  {usuarios?.map(usuario => (
                    <option key={usuario.id} value={usuario.id}>
                      {usuario.nombre || usuario.email} ({usuario.rol || 'Sin rol'})
                    </option>
                  ))}
                </select>
              </div>

              {usuarioSeleccionado && Object.keys(permisosUsuario).length > 0 && (
                <div className="space-y-4">
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 text-sm">
                    <p className="text-blue-800">
                      💡 <strong>Nota:</strong> Los permisos aquí sobrescriben los del rol del usuario.
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={selectAllUsuario}
                      disabled={loading}
                      className="gap-2"
                    >
                      <CheckSquare className="w-4 h-4" />
                      Seleccionar Todo
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={clearAllUsuario}
                      disabled={loading}
                      className="gap-2"
                    >
                      <Square className="w-4 h-4" />
                      Limpiar Todo
                    </Button>
                  </div>
                  {renderTablaPermisos(permisosUsuario, handlePermisoChangeUsuario)}
                  <Button
                    onClick={handleGuardarUsuario}
                    disabled={loading}
                    className="w-full"
                  >
                    <Save className="w-4 h-4 mr-2" />
                    {loading ? 'Guardando...' : 'Guardar Permisos del Usuario'}
                  </Button>
                </div>
              )}
            </TabsContent>

            {/* TAB: Por Equipo Médico */}
            <TabsContent value="equipos" className="space-y-4 mt-6">
              <div className="space-y-2">
                <label className="text-sm font-medium">Seleccionar Equipo Médico</label>
                <select
                  value={equipoSeleccionado}
                  onChange={(e) => setEquipoSeleccionado(e.target.value)}
                  disabled={loading}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                >
                  <option value="">Seleccione un equipo...</option>
                  {equipos?.map(equipo => (
                    <option key={equipo.id} value={equipo.id}>
                      {equipo.nombre} ({equipo.codigo})
                    </option>
                  ))}
                </select>
              </div>

              {equipoSeleccionado && Object.keys(permisosEquipo).length > 0 && (
                <div className="space-y-4">
                  <div className="bg-green-50 border border-green-200 rounded-lg p-3 text-sm">
                    <p className="text-green-800">
                      ✨ <strong>Herencia de Permisos:</strong> Los permisos asignados al equipo se heredarán automáticamente a todos sus miembros.
                    </p>
                  </div>
                  {renderTablaPermisos(permisosEquipo, handlePermisoChangeEquipo, false)}
                  <Button
                    onClick={handleGuardarEquipo}
                    disabled={loading}
                    className="w-full bg-green-600 hover:bg-green-700"
                  >
                    <Save className="w-4 h-4 mr-2" />
                    {loading ? 'Guardando...' : 'Guardar Permisos del Equipo (+ Heredar)'}
                  </Button>
                </div>
              )}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      {/* Card de Referencia */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm">📚 Referencia Rápida</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm">
          <div>
            <p className="font-medium text-gray-700">Operaciones CRUD:</p>
            <ul className="list-disc list-inside text-gray-600 space-y-1 mt-1">
              <li><strong>Leer:</strong> Ver datos, acceder al módulo</li>
              <li><strong>Crear:</strong> Agregar nuevos registros</li>
              <li><strong>Editar:</strong> Modificar datos existentes</li>
              <li><strong>Eliminar:</strong> Borrar registros</li>
              <li><strong>Aprobar:</strong> Validar cambios importantes (solo roles)</li>
            </ul>
          </div>
          <div>
            <p className="font-medium text-gray-700">Orden de Precedencia:</p>
            <p className="text-gray-600">Usuario (específico) → Rol (genérico) → Equipo (heredado)</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
  
  const [perfilSeleccionado, setPerfilSeleccionado] = useState<string>('');
  const [permisos, setPermisos] = useState<Record<string, PermisoModulo>>({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (perfilSeleccionado) {
      cargarPermisos();
    }
  }, [perfilSeleccionado]);

  const cargarPermisos = async () => {
    try {
      setLoading(true);
      setError('');

      const { data, error: queryError } = await supabase
        .from('hosix_permisos_modulos')
        .select('*')
        .eq('perfil_id', perfilSeleccionado);

      if (queryError) throw queryError;

      const permisosMap: Record<string, PermisoModulo> = {};
      data?.forEach(p => {
        permisosMap[p.modulo] = p;
      });

      // Agregar módulos faltantes con permisos vacíos
      MODULOS.forEach(modulo => {
        if (!permisosMap[modulo]) {
          permisosMap[modulo] = {
            perfil_id: perfilSeleccionado,
            modulo,
            puede_leer: false,
            puede_crear: false,
            puede_editar: false,
            puede_eliminar: false,
            puede_aprobar: false,
          };
        }
      });

      setPermisos(permisosMap);
    } catch (err: any) {
      setError(err.message || 'Error al cargar permisos');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handlePermisoChange = (
    modulo: string,
    permiso: keyof Omit<PermisoModulo, 'perfil_id' | 'modulo'>,
    value: boolean
  ) => {
    setPermisos(prev => ({
      ...prev,
      [modulo]: {
        ...prev[modulo],
        [permiso]: value,
      },
    }));
  };

  const handleGuardar = async () => {
    if (!perfilSeleccionado) {
      setError('Seleccione un perfil');
      return;
    }

    try {
      setLoading(true);
      setError('');

      for (const [modulo, permisoData] of Object.entries(permisos)) {
        const { error: upsertError } = await supabase
          .from('hosix_permisos_modulos')
          .upsert(
            {
              perfil_id: perfilSeleccionado,
              modulo,
              puede_leer: permisoData.puede_leer,
              puede_crear: permisoData.puede_crear,
              puede_editar: permisoData.puede_editar,
              puede_eliminar: permisoData.puede_eliminar,
              puede_aprobar: permisoData.puede_aprobar,
            },
            { onConflict: 'perfil_id,modulo' }
          );

        if (upsertError) throw upsertError;
      }

      toast({
        title: 'Éxito',
        description: 'Permisos actualizados correctamente',
      });
    } catch (err: any) {
      setError(err.message || 'Error al guardar permisos');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="w-5 h-5" />
            Gestor de Permisos
          </CardTitle>
          <CardDescription>
            Configure los permisos de acceso a módulos por perfil
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {error && (
            <Alert variant="destructive">
              <AlertCircle className="w-4 h-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {/* Selector de Perfil */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Seleccionar Perfil</label>
            <select
              value={perfilSeleccionado}
              onChange={(e) => setPerfilSeleccionado(e.target.value)}
              disabled={loading}
              className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
            >
              <option value="">Seleccione un perfil...</option>
              {perfiles?.map(perfil => (
                <option key={perfil.id} value={perfil.id}>
                  {perfil.nombre} (Nivel: {perfil.nivel_acceso})
                </option>
              ))}
            </select>
          </div>

          {/* Tabla de Permisos */}
          {perfilSeleccionado && Object.keys(permisos).length > 0 && (
            <div className="space-y-4">
              <div className="border rounded-lg overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead className="bg-gray-50 border-b">
                      <tr>
                        <th className="px-4 py-3 text-left font-medium">Módulo</th>
                        <th className="px-4 py-3 text-center font-medium">Leer</th>
                        <th className="px-4 py-3 text-center font-medium">Crear</th>
                        <th className="px-4 py-3 text-center font-medium">Editar</th>
                        <th className="px-4 py-3 text-center font-medium">Eliminar</th>
                        <th className="px-4 py-3 text-center font-medium">Aprobar</th>
                      </tr>
                    </thead>
                    <tbody>
                      {MODULOS.map(modulo => (
                        <tr key={modulo} className="border-b hover:bg-gray-50">
                          <td className="px-4 py-3 font-medium capitalize">
                            {modulo.replace('_', ' ')}
                          </td>
                          <td className="px-4 py-3 text-center">
                            <Checkbox
                              checked={permisos[modulo]?.puede_leer || false}
                              onCheckedChange={(checked) =>
                                handlePermisoChange(modulo, 'puede_leer', checked as boolean)
                              }
                              disabled={loading}
                            />
                          </td>
                          <td className="px-4 py-3 text-center">
                            <Checkbox
                              checked={permisos[modulo]?.puede_crear || false}
                              onCheckedChange={(checked) =>
                                handlePermisoChange(modulo, 'puede_crear', checked as boolean)
                              }
                              disabled={loading}
                            />
                          </td>
                          <td className="px-4 py-3 text-center">
                            <Checkbox
                              checked={permisos[modulo]?.puede_editar || false}
                              onCheckedChange={(checked) =>
                                handlePermisoChange(modulo, 'puede_editar', checked as boolean)
                              }
                              disabled={loading}
                            />
                          </td>
                          <td className="px-4 py-3 text-center">
                            <Checkbox
                              checked={permisos[modulo]?.puede_eliminar || false}
                              onCheckedChange={(checked) =>
                                handlePermisoChange(modulo, 'puede_eliminar', checked as boolean)
                              }
                              disabled={loading}
                            />
                          </td>
                          <td className="px-4 py-3 text-center">
                            <Checkbox
                              checked={permisos[modulo]?.puede_aprobar || false}
                              onCheckedChange={(checked) =>
                                handlePermisoChange(modulo, 'puede_aprobar', checked as boolean)
                              }
                              disabled={loading}
                            />
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              <Button
                onClick={handleGuardar}
                disabled={loading}
                className="w-full"
              >
                <Save className="w-4 h-4 mr-2" />
                {loading ? 'Guardando...' : 'Guardar Permisos'}
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
