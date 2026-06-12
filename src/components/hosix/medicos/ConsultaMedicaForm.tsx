import React, { useState } from 'react'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { Checkbox } from '@/components/ui/checkbox'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import {
  AlertCircle,
  Plus,
  Search,
  Pill,
  AlertTriangle,
  CheckCircle,
  Loader2,
  FlaskConical,
  ImageIcon,
} from 'lucide-react'
import useHosixMedicos from '@/hooks/useHosixMedicos'
import { DiagnosticoCIE11Selector } from '@/components/hosix/clinico/DiagnosticoCIE11Selector'
import { useHosixCIE11, type DiagnosticoCIE11Seleccionado } from '@/hooks/useHosixCIE11'
import { SelectorSolicitudesInline } from '@/components/hosix/integracion-lab-imagen/SelectorSolicitudesInline'
import { supabase } from '@/integrations/supabase/hosixClient'
import { toast } from 'sonner'

interface ConsultaMedicaFormProps {
  ordenId: string
  pacienteId: string
}

export const ConsultaMedicaForm: React.FC<ConsultaMedicaFormProps> = ({
  ordenId,
  pacienteId,
}) => {
  const {
    crearConsultaMedication,
    registrarDiagnosticoMutation,
    useDiagnosticosCatalogo,
    useDiagnosticosPaciente,
    registrarDiarioMutation,
  } = useHosixMedicos()

  // Estados del formulario
  const [formData, setFormData] = useState({
    antecedentes_relevantes: '',
    motivo_consulta: '',
    examen_fisico: '',
    impresion_clinica: '',
    diagnosticos_iniciales: '',
    plan_manejo: '',
    requiere_hospitalizacion: false,
    requiere_interconsulta: false,
    especialidad_interconsulta: '',
    requiere_seguimiento: false,
    dias_proximo_control: 7,
    observaciones_seguimiento: '',
  })

  // Diagnósticos
  const [diagnosticosBuscados, setDiagnosticosBuscados] = useState<string>('')
  const [diagnosticosSeleccionados, setDiagnosticosSeleccionados] = useState<
    Array<{ id: string; tipo: string; severidad?: string; observaciones?: string }>
  >([])
  const [diagnosticosCIE11, setDiagnosticosCIE11] = useState<DiagnosticoCIE11Seleccionado[]>([])
  const [dialogoDiagnostico, setDialogoDiagnostico] = useState(false)
  const { guardarDiagnosticosCIE11 } = useHosixCIE11()

  // Solicitudes de laboratorio e imagenología
  const [solicitudesLaboratorio, setSolicitudesLaboratorio] = useState<any[]>([])
  const [solicitudesImagenologia, setSolicitudesImagenologia] = useState<any[]>([])
  const [dialogoSolicitudes, setDialogoSolicitudes] = useState(false)

  // Queries
  const { data: diagnosticosCatalogo = [], isLoading: loadingDiagnosticos } =
    useDiagnosticosCatalogo(diagnosticosBuscados)
  const { data: diagnosticosActivos = [] } = useDiagnosticosPaciente(pacienteId)

  const getNombreDiagnostico = (diag: any) =>
    diag?.nombre_diagnostico ?? diag?.nombre ?? diag?.descripcion ?? diag?.codigo_cie10 ?? 'Diagnóstico'

  // Métodos para diagnósticos
  const handleAgregarDiagnostico = (diagnostico: any, tipo: string) => {
    const yaExiste = diagnosticosSeleccionados.some((d) => d.id === diagnostico.id)

    if (yaExiste) {
      toast.error('Este diagnóstico ya está seleccionado')
      return
    }

    setDiagnosticosSeleccionados([
      ...diagnosticosSeleccionados,
      {
        id: diagnostico.id,
        tipo: tipo,
        severidad: undefined,
        observaciones: undefined,
      },
    ])
    toast.success(`Diagnóstico agregado: ${diagnostico.nombre_diagnostico}`)
  }

  const handleEliminarDiagnostico = (diagnosticoId: string) => {
    setDiagnosticosSeleccionados(
      diagnosticosSeleccionados.filter((d) => d.id !== diagnosticoId)
    )
  }

  // Enviar consulta
  const handleEnviarConsulta = async () => {
    if (diagnosticosSeleccionados.length === 0 && diagnosticosCIE11.length === 0) {
      toast.error('Debe agregar al menos un diagnóstico')
      return
    }

    try {
      // Crear consulta médica
      await crearConsultaMedication.mutateAsync({
        orden_medica_id: ordenId,
        paciente_id: pacienteId,
        medico_id: '', // Se obtiene del auth en el hook
        ...formData,
        diagnosticos_confirmados: diagnosticosSeleccionados,
        diagnosticos_cie11: diagnosticosCIE11,
      })

      // Registrar diagnósticos CIE-10 en el paciente
      for (const diag of diagnosticosSeleccionados) {
        await registrarDiagnosticoMutation.mutateAsync({
          pacienteId,
          diagnosticoId: diag.id,
          tipodiagnostico: diag.tipo,
          severidad: diag.severidad,
          observaciones: diag.observaciones,
        })
      }

      // Guardar diagnósticos CIE-11 si existen
      if (diagnosticosCIE11.length > 0) {
        await guardarDiagnosticosCIE11({
          paciente_id: pacienteId,
          orden_medica_id: ordenId,
          diagnosticos: diagnosticosCIE11,
        })
      }

      // Crear solicitudes de laboratorio
      for (const sol of solicitudesLaboratorio) {
        await supabase.from('hosix_laboratorio_solicitudes').insert({
          paciente_id: pacienteId,
          diagnostico_clinico: sol.diagnostico_clinico,
          prioridad: sol.prioridad,
          fecha_requerida: sol.fecha_requerida,
          observaciones: sol.observaciones,
          estado: 'pendiente',
        })
      }

      // Crear solicitudes de imagenología
      for (const sol of solicitudesImagenologia) {
        await supabase.from('hosix_imagenologia_solicitudes').insert({
          paciente_id: pacienteId,
          diagnostico_clinico: sol.diagnostico_clinico,
          prioridad: sol.prioridad,
          zona_interes: sol.zona_interes,
          requiere_contraste: sol.requiere_contraste,
          tipo_contraste: sol.tipo_contraste,
          observaciones: sol.observaciones,
          estado: 'pendiente',
        })
      }

      // Registrar entrada en diario clínico
      await registrarDiarioMutation.mutateAsync({
        paciente_id: pacienteId,
        medico_id: '',
        tipo_entrada: 'nota_clínica',
        contenido: `Consulta médica realizada. Diagnósticos CIE-10: ${diagnosticosSeleccionados.length}, CIE-11: ${diagnosticosCIE11.length}, Lab: ${solicitudesLaboratorio.length}, Imagen: ${solicitudesImagenologia.length}`,
        firmada: false,
      })

      toast.success('Consulta médica y solicitudes registradas exitosamente')
      // Limpiar formulario
      setFormData({
        antecedentes_relevantes: '',
        motivo_consulta: '',
        examen_fisico: '',
        impresion_clinica: '',
        diagnosticos_iniciales: '',
        plan_manejo: '',
        requiere_hospitalizacion: false,
        requiere_interconsulta: false,
        especialidad_interconsulta: '',
        requiere_seguimiento: false,
        dias_proximo_control: 7,
        observaciones_seguimiento: '',
      })
      setDiagnosticosSeleccionados([])
      setDiagnosticosCIE11([])
      setSolicitudesLaboratorio([])
      setSolicitudesImagenologia([])
    } catch (error) {
      console.error('Error:', error)
      toast.error('Error al registrar consulta')
    }
  }

  return (
    <div className="space-y-6">
      {/* Antecedentes */}
      <Card>
        <CardHeader>
          <CardTitle>Antecedentes y Medicamentos</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <label className="text-sm font-medium">Antecedentes Relevantes</label>
            <Textarea
              placeholder="Historial médico relevante, alergias, cirugías previas..."
              value={formData.antecedentes_relevantes}
              onChange={(e) =>
                setFormData({ ...formData, antecedentes_relevantes: e.target.value })
              }
              className="mt-2"
            />
          </div>

          {diagnosticosActivos.length > 0 && (
            <div>
              <label className="text-sm font-medium mb-2 block">
                Diagnósticos Activos del Paciente
              </label>
              <div className="space-y-2">
                {diagnosticosActivos.slice(0, 5).map((diag) => (
                  <Badge key={diag.id} variant="secondary">
                    {getNombreDiagnostico(diag)}
                  </Badge>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Historia de Enfermedad Actual */}
      <Card>
        <CardHeader>
          <CardTitle>Historia de Enfermedad Actual</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <label className="text-sm font-medium">Motivo de Consulta / Queja Principal</label>
            <Textarea
              placeholder="Describa el motivo principal por el que acude el paciente..."
              value={formData.motivo_consulta}
              onChange={(e) =>
                setFormData({ ...formData, motivo_consulta: e.target.value })
              }
              className="mt-2"
            />
          </div>

          <div>
            <label className="text-sm font-medium">Examen Físico</label>
            <Textarea
              placeholder="Hallazgos del examen físico, vitales, etc..."
              value={formData.examen_fisico}
              onChange={(e) =>
                setFormData({ ...formData, examen_fisico: e.target.value })
              }
              className="mt-2"
            />
          </div>
        </CardContent>
      </Card>

      {/* Diagnósticos CIE-11 */}
      <Card>
        <CardHeader>
          <CardTitle>Diagnósticos CIE-11 (Herramienta de Codificación Integrada)</CardTitle>
          <CardDescription>
            Utilice la herramienta de codificación integrada para seleccionar diagnósticos en CIE-11
          </CardDescription>
        </CardHeader>
        <CardContent>
          <DiagnosticoCIE11Selector
            onDiagnosticosChange={setDiagnosticosCIE11}
            diagnosticosIniciales={diagnosticosCIE11}
            modo="multiple"
            label="Diagnósticos CIE-11"
          />
        </CardContent>
      </Card>

      {/* Diagnósticos CIE-10 */}
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <div>
              <CardTitle>Diagnósticos CIE-10 (Clásico)</CardTitle>
              <CardDescription>
                Seleccione diagnósticos adicionales del catálogo CIE-10/SNOMED CT (opcional)
              </CardDescription>
            </div>
            <Dialog open={dialogoDiagnostico} onOpenChange={setDialogoDiagnostico}>
              <DialogTrigger asChild>
                <Button size="sm">
                  <Plus className="h-4 w-4 mr-2" />
                  Agregar Diagnóstico
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl">
                <DialogHeader>
                  <DialogTitle>Seleccionar Diagnóstico</DialogTitle>
                  <DialogDescription>
                    Busque y seleccione diagnósticos del catálogo CIE-10/SNOMED CT
                  </DialogDescription>
                </DialogHeader>

                <div className="space-y-4">
                  <div className="flex gap-2">
                    <Input
                      placeholder="Buscar por código CIE-10, SNOMED o nombre..."
                      value={diagnosticosBuscados}
                      onChange={(e) => setDiagnosticosBuscados(e.target.value)}
                      className="flex-1"
                    />
                    <Button disabled={!diagnosticosBuscados}>
                      <Search className="h-4 w-4" />
                    </Button>
                  </div>

                  {loadingDiagnosticos && (
                    <div className="flex justify-center py-4">
                      <Loader2 className="h-6 w-6 animate-spin" />
                    </div>
                  )}

                  {!loadingDiagnosticos && diagnosticosCatalogo.length === 0 && (
                    <div className="text-center py-4 text-gray-500">
                      No se encontraron diagnósticos
                    </div>
                  )}

                  {!loadingDiagnosticos && diagnosticosCatalogo.length > 0 && (
                    <div className="max-h-96 overflow-y-auto space-y-2">
                      {diagnosticosCatalogo.map((diag) => (
                        <div
                          key={diag.id}
                          className="border p-3 rounded-lg hover:bg-gray-50 cursor-pointer"
                        >
                          <div className="flex justify-between items-start mb-2">
                            <div className="flex-1">
                              <p className="font-medium">{getNombreDiagnostico(diag)}</p>
                              <div className="flex gap-2 mt-1">
                                <Badge variant="outline">CIE-10: {diag.codigo_cie10}</Badge>
                                <Badge variant="outline">SNOMED: {diag.codigo_snomed}</Badge>
                              </div>
                            </div>
                          </div>

                          <Select
                            onValueChange={(tipo) => {
                              handleAgregarDiagnostico(diag, tipo)
                            }}
                          >
                            <SelectTrigger className="h-9">
                              <SelectValue placeholder="Seleccione tipo..." />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="principal">Principal</SelectItem>
                              <SelectItem value="secundario">Secundario</SelectItem>
                              <SelectItem value="complicación">Complicación</SelectItem>
                              <SelectItem value="comorbilidad">Comorbilidad</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </CardHeader>

        <CardContent className="space-y-4">
          {diagnosticosSeleccionados.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <AlertCircle className="h-12 w-12 mx-auto mb-2 opacity-50" />
              <p>No hay diagnósticos seleccionados</p>
              <p className="text-sm">Haga clic en "Agregar Diagnóstico" para comenzar</p>
            </div>
          ) : (
            <div className="space-y-3">
              {diagnosticosSeleccionados.map((diag) => {
                const diagnostico = diagnosticosCatalogo.find((d) => d.id === diag.id)
                return (
                  <div key={diag.id} className="border p-3 rounded-lg bg-blue-50">
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <p className="font-medium">{diagnostico?.nombre_diagnostico}</p>
                        <div className="flex gap-2 mt-1">
                          <Badge variant="outline">
                            {diag.tipo.charAt(0).toUpperCase() + diag.tipo.slice(1)}
                          </Badge>
                          <Badge variant="outline">{diagnostico?.codigo_cie10}</Badge>
                        </div>
                      </div>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleEliminarDiagnostico(diag.id)}
                      >
                        ✕
                      </Button>
                    </div>

                    {/* Severidad y Observaciones */}
                    <div className="grid grid-cols-2 gap-2 mt-3">
                      <Select
                        value={diag.severidad || ''}
                        onValueChange={(severidad) => {
                          const updated = diagnosticosSeleccionados.map((d) =>
                            d.id === diag.id ? { ...d, severidad } : d
                          )
                          setDiagnosticosSeleccionados(updated)
                        }}
                      >
                        <SelectTrigger className="h-8 text-sm">
                          <SelectValue placeholder="Severidad..." />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="leve">Leve</SelectItem>
                          <SelectItem value="moderada">Moderada</SelectItem>
                          <SelectItem value="grave">Grave</SelectItem>
                          <SelectItem value="crítica">Crítica</SelectItem>
                        </SelectContent>
                      </Select>

                      <Input
                        type="text"
                        placeholder="Observaciones..."
                        value={diag.observaciones || ''}
                        onChange={(e) => {
                          const updated = diagnosticosSeleccionados.map((d) =>
                            d.id === diag.id ? { ...d, observaciones: e.target.value } : d
                          )
                          setDiagnosticosSeleccionados(updated)
                        }}
                        className="h-8 text-sm"
                      />
                    </div>
                  </div>
                )
              })}
            </div>
          )}

          <div>
            <label className="text-sm font-medium">Impresión Clínica</label>
            <Textarea
              placeholder="Resumen de la impresión clínica y evaluación..."
              value={formData.impresion_clinica}
              onChange={(e) =>
                setFormData({ ...formData, impresion_clinica: e.target.value })
              }
              className="mt-2"
            />
          </div>
        </CardContent>
      </Card>

      {/* Solicitudes de Laboratorio e Imagenología */}
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <div>
              <CardTitle>Pruebas de Laboratorio e Imagenología</CardTitle>
              <CardDescription>
                Solicite pruebas de laboratorio o estudios de imagenología según sea necesario
              </CardDescription>
            </div>
            <Button
              size="sm"
              onClick={() => setDialogoSolicitudes(true)}
            >
              <Plus className="h-4 w-4 mr-2" />
              Agregar Solicitud
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {solicitudesLaboratorio.length === 0 && solicitudesImagenologia.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <AlertCircle className="h-12 w-12 mx-auto mb-2 opacity-50" />
              <p>No hay solicitudes agregadas</p>
              <p className="text-sm">Haga clic en "Agregar Solicitud" para incluir pruebas</p>
            </div>
          ) : (
            <div className="space-y-3">
              {solicitudesLaboratorio.map((sol) => (
                <div key={sol.id} className="border p-3 rounded-lg bg-blue-50">
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <FlaskConical className="h-4 w-4 text-blue-600" />
                        <p className="font-medium">{sol.prueba_nombre}</p>
                      </div>
                      <div className="flex gap-2 mt-1">
                        <Badge variant="outline">Laboratorio</Badge>
                        <Badge variant="outline">{sol.prioridad}</Badge>
                      </div>
                      {sol.diagnostico_clinico && (
                        <p className="text-sm text-gray-600 mt-2">
                          Diagnóstico: {sol.diagnostico_clinico}
                        </p>
                      )}
                    </div>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() =>
                        setSolicitudesLaboratorio(
                          solicitudesLaboratorio.filter((s) => s.id !== sol.id)
                        )
                      }
                    >
                      ✕
                    </Button>
                  </div>
                </div>
              ))}

              {solicitudesImagenologia.map((sol) => (
                <div key={sol.id} className="border p-3 rounded-lg bg-green-50">
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <ImageIcon className="h-4 w-4 text-green-600" />
                        <p className="font-medium">{sol.modalidad_nombre}</p>
                      </div>
                      <div className="flex gap-2 mt-1">
                        <Badge variant="outline">Imagenología</Badge>
                        <Badge variant="outline">{sol.prioridad}</Badge>
                      </div>
                      {sol.zona_interes && (
                        <p className="text-sm text-gray-600 mt-1">
                          Zona: {sol.zona_interes}
                        </p>
                      )}
                      {sol.requiere_contraste && (
                        <Badge className="mt-2" variant="outline">
                          Requiere Contraste
                        </Badge>
                      )}
                    </div>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() =>
                        setSolicitudesImagenologia(
                          solicitudesImagenologia.filter((s) => s.id !== sol.id)
                        )
                      }
                    >
                      ✕
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}

          <Dialog open={dialogoSolicitudes} onOpenChange={setDialogoSolicitudes}>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Agregar Solicitudes de Laboratorio e Imagenología</DialogTitle>
              </DialogHeader>
              <SelectorSolicitudesInline
                pacienteId={pacienteId}
                onSolicitudesLabAgregar={(nuevas) => {
                  setSolicitudesLaboratorio([...solicitudesLaboratorio, ...nuevas])
                  setDialogoSolicitudes(false)
                }}
                onSolicitudesImagenAgregar={(nuevas) => {
                  setSolicitudesImagenologia([...solicitudesImagenologia, ...nuevas])
                  setDialogoSolicitudes(false)
                }}
              />
            </DialogContent>
          </Dialog>
        </CardContent>
      </Card>

      {/* Plan de Manejo */}
      <Card>
        <CardHeader>
          <CardTitle>Plan de Manejo</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <label className="text-sm font-medium">Plan de Manejo</label>
            <Textarea
              placeholder="Tratamiento recomendado, medicamentos, procedimientos, etc..."
              value={formData.plan_manejo}
              onChange={(e) => setFormData({ ...formData, plan_manejo: e.target.value })}
              className="mt-2"
            />
          </div>

          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <Checkbox
                id="hospitalizacion"
                checked={formData.requiere_hospitalizacion}
                onCheckedChange={(checked) =>
                  setFormData({
                    ...formData,
                    requiere_hospitalizacion: checked as boolean,
                  })
                }
              />
              <label htmlFor="hospitalizacion" className="text-sm font-medium cursor-pointer">
                <AlertTriangle className="h-4 w-4 inline mr-1 text-red-500" />
                Requiere Hospitalización
              </label>
            </div>

            <div className="flex items-center gap-2">
              <Checkbox
                id="interconsulta"
                checked={formData.requiere_interconsulta}
                onCheckedChange={(checked) =>
                  setFormData({
                    ...formData,
                    requiere_interconsulta: checked as boolean,
                  })
                }
              />
              <label htmlFor="interconsulta" className="text-sm font-medium cursor-pointer">
                Requiere Interconsulta
              </label>
            </div>

            {formData.requiere_interconsulta && (
              <Input
                placeholder="Especialidad (Ej: Cardiología)"
                value={formData.especialidad_interconsulta}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    especialidad_interconsulta: e.target.value,
                  })
                }
                className="ml-6"
              />
            )}

            <div className="flex items-center gap-2">
              <Checkbox
                id="seguimiento"
                checked={formData.requiere_seguimiento}
                onCheckedChange={(checked) =>
                  setFormData({
                    ...formData,
                    requiere_seguimiento: checked as boolean,
                  })
                }
              />
              <label htmlFor="seguimiento" className="text-sm font-medium cursor-pointer">
                <CheckCircle className="h-4 w-4 inline mr-1 text-green-500" />
                Requiere Seguimiento
              </label>
            </div>

            {formData.requiere_seguimiento && (
              <div className="ml-6 space-y-2">
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-sm font-medium">Días para próximo control</label>
                    <Input
                      type="number"
                      min="1"
                      value={formData.dias_proximo_control}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          dias_proximo_control: parseInt(e.target.value),
                        })
                      }
                      className="mt-1"
                    />
                  </div>
                </div>
                <Textarea
                  placeholder="Observaciones de seguimiento..."
                  value={formData.observaciones_seguimiento}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      observaciones_seguimiento: e.target.value,
                    })
                  }
                />
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Botones de Acción */}
      <div className="flex gap-2 justify-end">
        <Button variant="outline">Cancelar</Button>
        <Button
          onClick={handleEnviarConsulta}
          disabled={
            crearConsultaMedication.isPending ||
            registrarDiagnosticoMutation.isPending ||
            diagnosticosSeleccionados.length === 0
          }
        >
          {crearConsultaMedication.isPending && (
            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
          )}
          Guardar Consulta
        </Button>
      </div>
    </div>
  )
}

export default ConsultaMedicaForm
