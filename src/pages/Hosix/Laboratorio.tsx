import React, { useState } from 'react'
import { useHosixLaboratorio } from '@/hooks/useHosixLaboratorio'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { SolicitudesManager } from '@/components/hosix/laboratorio/SolicitudesManager'
import { ResultadosViewer } from '@/components/hosix/laboratorio/ResultadosViewer'

export default function LaboratorioPage() {
  const { pruebas = [], solicitudes = [], resultados = [] } = useHosixLaboratorio()
  const [activeTab, setActiveTab] = useState('solicitudes')

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Laboratorio Clínico (ASIS 8.0)</h1>
        <p className="text-gray-600 mt-2">Gestión integral de solicitudes, muestras, análisis y resultados de laboratorio</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Pruebas Disponibles</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{pruebas.length}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Solicitudes Pendientes</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{solicitudes.filter(s => s.estado === 'pendiente').length}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Resultados Disponibles</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{resultados.length}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total Solicitudes</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{solicitudes.length}</div>
          </CardContent>
        </Card>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="solicitudes">Solicitudes</TabsTrigger>
          <TabsTrigger value="resultados">Resultados</TabsTrigger>
          <TabsTrigger value="pruebas">Catálogo</TabsTrigger>
        </TabsList>

        <TabsContent value="solicitudes">
          <SolicitudesManager />
        </TabsContent>

        <TabsContent value="resultados">
          <ResultadosViewer />
        </TabsContent>

        <TabsContent value="pruebas">
          <Card>
            <CardHeader>
              <CardTitle>Catálogo de Pruebas ({pruebas.length})</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {pruebas.map((p: any) => (
                  <Card key={p.id} className="border">
                    <CardHeader className="pb-2">
                      <CardTitle className="text-base">{p.nombre}</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-2">
                      <div>
                        <p className="text-xs text-gray-600">Código</p>
                        <p className="font-mono">{p.codigo}</p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-600">Categoría</p>
                        <p>{p.categoria}</p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-600">Muestra</p>
                        <p>{p.tipo_muestra}</p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-600">Tiempo de Resultado</p>
                        <p>{p.tiempo_procesamiento_horas}h</p>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
  }
