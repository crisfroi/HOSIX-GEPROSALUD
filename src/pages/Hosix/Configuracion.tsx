import React, { useState } from 'react';
import { Settings, Users, Lock, Database, Shield, Stethoscope, FileText } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import UsuariosList from '@/components/hosix/usuarios/UsuariosList';
import DepartamentosManager from '@/components/hosix/DepartamentosManager';
import EquiposMedicosManager from '@/components/hosix/EquiposMedicosManager';
import { CodificacionManager } from '@/components/hosix/CodificacionManager';
import ProfesionalSyncManager from '@/components/hosix/ProfesionalSyncManager';
import { EspecialidadesMedicasManager } from '@/components/hosix/configuracion/EspecialidadesMedicasManager';
import { UnidadesFuncionalesManager } from '@/components/hosix/configuracion/UnidadesFuncionalesManager';
import { RolesOrganizacionalesManager } from '@/components/hosix/configuracion/RolesOrganizacionalesManager';
import { ProveedoresManager } from '@/components/hosix/configuracion/ProveedoresManager';
import { ParametrosSistemaManager } from '@/components/hosix/configuracion/ParametrosSistemaManager';
import { ZonasCoberturaManger } from '@/components/hosix/configuracion/ZonasCoberturaManger';
import { MaterialMedicoManager } from '@/components/hosix/configuracion/MaterialMedicoManager';
import { ServiciosTercerosManager } from '@/components/hosix/configuracion/ServiciosTercerosManager';
import { PoliticasSeguridadManager } from '@/components/hosix/configuracion/PoliticasSeguridadManager';
import { CualificacionesManager } from '@/components/hosix/configuracion/CualificacionesManager';
import { PlantillasEditorAvanzado } from '@/components/hosix/PlantillasEditorAvanzado';

const ConfiguracionPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState('general');

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Configuración del Sistema</h1>
        <p className="text-gray-500 mt-1">
          Parámetros y configuraciones del HOSIX
        </p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-1">
          <TabsTrigger value="general">General</TabsTrigger>
          <TabsTrigger value="usuarios">Usuarios</TabsTrigger>
          <TabsTrigger value="profesionales">Profesionales</TabsTrigger>
          <TabsTrigger value="permisos">Permisos</TabsTrigger>
          <TabsTrigger value="maestros">Maestros</TabsTrigger>
          <TabsTrigger value="plantillas">Plantillas</TabsTrigger>
          <TabsTrigger value="seguridad">Seguridad</TabsTrigger>
        </TabsList>

        {/* General */}
        <TabsContent value="general" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Configuración General</CardTitle>
              <CardDescription>Parámetros básicos del sistema</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Nombre del Centro</label>
                <input type="text" placeholder="Hospital General" className="w-full px-3 py-2 border rounded-lg" />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Código Centro</label>
                <input type="text" placeholder="HG-001" className="w-full px-3 py-2 border rounded-lg" />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Moneda</label>
                <select className="w-full px-3 py-2 border rounded-lg">
                  <option>CFA</option>
                  <option>USD</option>
                  <option>EUR</option>
                </select>
              </div>
              <Button className="bg-blue-600 hover:bg-blue-700">Guardar Cambios</Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Usuarios */}
        <TabsContent value="usuarios" className="space-y-4">
          <UsuariosList />
        </TabsContent>

        {/* Profesionales */}
        <TabsContent value="profesionales" className="space-y-4">
          <ProfesionalSyncManager />
        </TabsContent>

        {/* Permisos */}
        <TabsContent value="permisos" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Permisos y Roles</CardTitle>
              <CardDescription>Configure accesos por rol</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 border rounded-lg">
                  <div>
                    <p className="font-medium">Administrador</p>
                    <p className="text-xs text-gray-500">Acceso total al sistema</p>
                  </div>
                  <Button variant="outline" size="sm">Configurar</Button>
                </div>
                <div className="flex items-center justify-between p-4 border rounded-lg">
                  <div>
                    <p className="font-medium">Médico</p>
                    <p className="text-xs text-gray-500">Acceso a módulos clínicos</p>
                  </div>
                  <Button variant="outline" size="sm">Configurar</Button>
                </div>
                <div className="flex items-center justify-between p-4 border rounded-lg">
                  <div>
                    <p className="font-medium">Enfermería</p>
                    <p className="text-xs text-gray-500">Módulo de enfermería</p>
                  </div>
                  <Button variant="outline" size="sm">Configurar</Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Maestros */}
        <TabsContent value="maestros" className="space-y-4">
          <div className="grid grid-cols-1 gap-4">
            {/* Sub-tabs para Maestros */}
            <Card>
              <CardHeader>
                <CardTitle>Gestión de Datos Maestros</CardTitle>
                <CardDescription>Configure departamentos, equipos, codificación y otras entidades base</CardDescription>
              </CardHeader>
              <CardContent>
                <Tabs defaultValue="departamentos" className="w-full">
                  <TabsList className="grid w-full grid-cols-6 overflow-x-auto">
                    <TabsTrigger value="departamentos" className="text-xs sm:text-sm">Departamentos</TabsTrigger>
                    <TabsTrigger value="equipos" className="text-xs sm:text-sm">Equipos</TabsTrigger>
                    <TabsTrigger value="especialidades" className="text-xs sm:text-sm">Especialidades</TabsTrigger>
                    <TabsTrigger value="unidades" className="text-xs sm:text-sm">Unidades</TabsTrigger>
                    <TabsTrigger value="roles" className="text-xs sm:text-sm">Roles</TabsTrigger>
                    <TabsTrigger value="cualificaciones" className="text-xs sm:text-sm">Cualif.</TabsTrigger>
                  </TabsList>
                  <TabsList className="grid w-full grid-cols-6 overflow-x-auto mt-2">
                    <TabsTrigger value="zonas" className="text-xs sm:text-sm">Zonas</TabsTrigger>
                    <TabsTrigger value="proveedores" className="text-xs sm:text-sm">Proveedores</TabsTrigger>
                    <TabsTrigger value="material" className="text-xs sm:text-sm">Material</TabsTrigger>
                    <TabsTrigger value="servicios" className="text-xs sm:text-sm">Servicios</TabsTrigger>
                    <TabsTrigger value="parametros" className="text-xs sm:text-sm">Parámetros</TabsTrigger>
                    <TabsTrigger value="codificacion" className="text-xs sm:text-sm">Codificación</TabsTrigger>
                  </TabsList>
                  <TabsList className="grid w-full grid-cols-2 mt-2">
                    <TabsTrigger value="politicas" className="text-xs sm:text-sm">Políticas Seguridad</TabsTrigger>
                    <TabsTrigger value="referencia" className="text-xs sm:text-sm">Referencia</TabsTrigger>
                  </TabsList>

                  {/* Departamentos */}
                  <TabsContent value="departamentos" className="mt-4">
                    <DepartamentosManager />
                  </TabsContent>

                  {/* Equipos Médicos */}
                  <TabsContent value="equipos" className="mt-4">
                    <EquiposMedicosManager />
                  </TabsContent>

                  {/* Especialidades Médicas */}
                  <TabsContent value="especialidades" className="mt-4">
                    <EspecialidadesMedicasManager />
                  </TabsContent>

                  {/* Unidades Funcionales */}
                  <TabsContent value="unidades" className="mt-4">
                    <UnidadesFuncionalesManager />
                  </TabsContent>

                  {/* Roles Organizacionales */}
                  <TabsContent value="roles" className="mt-4">
                    <RolesOrganizacionalesManager />
                  </TabsContent>

                  {/* Cualificaciones Profesionales */}
                  <TabsContent value="cualificaciones" className="mt-4">
                    <CualificacionesManager />
                  </TabsContent>

                  {/* Zonas de Cobertura */}
                  <TabsContent value="zonas" className="mt-4">
                    <ZonasCoberturaManger />
                  </TabsContent>

                  {/* Proveedores */}
                  <TabsContent value="proveedores" className="mt-4">
                    <ProveedoresManager />
                  </TabsContent>

                  {/* Material Médico */}
                  <TabsContent value="material" className="mt-4">
                    <MaterialMedicoManager />
                  </TabsContent>

                  {/* Servicios de Terceros */}
                  <TabsContent value="servicios" className="mt-4">
                    <ServiciosTercerosManager />
                  </TabsContent>

                  {/* Parámetros del Sistema */}
                  <TabsContent value="parametros" className="mt-4">
                    <ParametrosSistemaManager />
                  </TabsContent>

                  {/* Codificación CIE-11 & Procedimientos */}
                  <TabsContent value="codificacion" className="mt-4">
                    <CodificacionManager />
                  </TabsContent>

                  {/* Políticas de Seguridad */}
                  <TabsContent value="politicas" className="mt-4">
                    <PoliticasSeguridadManager />
                  </TabsContent>

                  {/* Referencia Rápida */}
                  <TabsContent value="referencia" className="mt-4">
                    <Card>
                      <CardHeader>
                        <CardTitle className="text-sm">Referencia Rápida de Maestros</CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-4 text-sm">
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <p className="font-medium text-blue-600">Departamentos</p>
                            <p className="text-gray-600">Entidades principales del hospital (Cardiología, Pediatría)</p>
                          </div>
                          <div>
                            <p className="font-medium text-blue-600">Equipos Médicos</p>
                            <p className="text-gray-600">Grupos de médicos que trabajan juntos por departamento</p>
                          </div>
                          <div>
                            <p className="font-medium text-green-600">Especialidades Médicas</p>
                            <p className="text-gray-600">Clasificación de especialidades clínicas (Cirugía, Oncología)</p>
                          </div>
                          <div>
                            <p className="font-medium text-green-600">Unidades Funcionales</p>
                            <p className="text-gray-600">Estructuras organizativas dentro del hospital (UCI, Farmacia)</p>
                          </div>
                          <div>
                            <p className="font-medium text-purple-600">Roles Organizacionales</p>
                            <p className="text-gray-600">Roles dentro de la organización (Jefe, Coordinador, Médico)</p>
                          </div>
                          <div>
                            <p className="font-medium text-purple-600">Cualificaciones</p>
                            <p className="text-gray-600">Certificaciones y competencias profesionales requeridas</p>
                          </div>
                          <div>
                            <p className="font-medium text-orange-600">Zonas de Cobertura</p>
                            <p className="text-gray-600">Áreas geográficas de responsabilidad del hospital</p>
                          </div>
                          <div>
                            <p className="font-medium text-orange-600">Proveedores</p>
                            <p className="text-gray-600">Proveedores de medicinas, materiales y servicios</p>
                          </div>
                          <div>
                            <p className="font-medium text-red-600">Material Médico</p>
                            <p className="text-gray-600">Insumos, equipos y materiales médicos del hospital</p>
                          </div>
                          <div>
                            <p className="font-medium text-red-600">Servicios Terceros</p>
                            <p className="text-gray-600">Servicios contratados (mantenimiento, limpieza, seguridad)</p>
                          </div>
                          <div>
                            <p className="font-medium text-indigo-600">Parámetros Sistema</p>
                            <p className="text-gray-600">Configuraciones dinámicas del sistema (moneda, idioma, etc)</p>
                          </div>
                          <div>
                            <p className="font-medium text-indigo-600">Codificación CIE-11</p>
                            <p className="text-gray-600">Clasificación de diagnósticos y procedimientos médicos</p>
                          </div>
                          <div className="col-span-2">
                            <p className="font-medium text-amber-600">⚠️ Políticas de Seguridad</p>
                            <p className="text-gray-600">Políticas RLS de control de acceso. ¡Cambios aquí afectan seguridad!</p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </TabsContent>
                </Tabs>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Plantillas */}
        <TabsContent value="plantillas" className="space-y-4">
          <PlantillasEditorAvanzado />
        </TabsContent>

        {/* Seguridad */}
        <TabsContent value="seguridad" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Configuración de Seguridad</CardTitle>
              <CardDescription>Parámetros de seguridad del sistema</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Tiempo de sesión (minutos)</label>
                <input type="number" placeholder="30" className="w-full px-3 py-2 border rounded-lg" />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Intentos fallidos permitidos</label>
                <input type="number" placeholder="3" className="w-full px-3 py-2 border rounded-lg" />
              </div>
              <div className="flex items-center gap-2">
                <input type="checkbox" id="2fa" defaultChecked />
                <label htmlFor="2fa" className="text-sm">Requerir autenticación de dos factores</label>
              </div>
              <Button className="bg-blue-600 hover:bg-blue-700">Guardar Configuración</Button>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default ConfiguracionPage;
