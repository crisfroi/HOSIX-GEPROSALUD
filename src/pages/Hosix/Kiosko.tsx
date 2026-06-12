import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { CreditCard, FileText, CheckCircle, ArrowLeft } from 'lucide-react'
import { KioskoAutofacturacion } from '@/components/hosix/kioscos/KioskoAutofacturacion'
import { KioskoResultados } from '@/components/hosix/kioscos/KioskoResultados'
import { KioskoAdmision } from '@/components/hosix/kioscos/KioskoAdmision'

type KioskoType = 'menu' | 'pago' | 'resultados' | 'admision'

export default function KioskoPage() {
  const [activeKiosko, setActiveKiosko] = useState<KioskoType>('menu')

  const handleBack = () => {
    setActiveKiosko('menu')
  }

  return (
    <div className="w-full h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      {/* Menú Principal */}
      {activeKiosko === 'menu' && (
        <div className="w-full max-w-4xl space-y-6">
          {/* Encabezado */}
          <div className="text-center space-y-2 mb-8">
            <h1 className="text-5xl font-bold text-gray-800">SISTEMA DE KIOSCOS</h1>
            <p className="text-xl text-gray-600">Selecciona el servicio que deseas utilizar</p>
          </div>

          {/* Grid de Kioscos */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Kiosko de Autofacturación */}
            <Card
              className="cursor-pointer hover:shadow-xl transition-all hover:scale-105"
              onClick={() => setActiveKiosko('pago')}
            >
              <CardHeader className="bg-gradient-to-r from-green-500 to-green-600 text-white rounded-t-lg">
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-2">
                    <CreditCard className="h-6 w-6" />
                    Pagar Servicios
                  </CardTitle>
                  <Badge className="bg-white text-green-600">NUEVO</Badge>
                </div>
              </CardHeader>
              <CardContent className="pt-6 space-y-4">
                <CardDescription className="text-gray-700 text-base">
                  Escanea tu código QR para pagar servicios de laboratorio e imagenología
                </CardDescription>
                <div className="space-y-2">
                  <p className="text-sm font-semibold text-gray-800">✓ Pago por código QR</p>
                  <p className="text-sm font-semibold text-gray-800">✓ Múltiples métodos</p>
                  <p className="text-sm font-semibold text-gray-800">✓ Recibo inmediato</p>
                </div>
              </CardContent>
            </Card>

            {/* Kiosko de Resultados */}
            <Card
              className="cursor-pointer hover:shadow-xl transition-all hover:scale-105"
              onClick={() => setActiveKiosko('resultados')}
            >
              <CardHeader className="bg-gradient-to-r from-purple-500 to-purple-600 text-white rounded-t-lg">
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-2">
                    <FileText className="h-6 w-6" />
                    Ver Resultados
                  </CardTitle>
                  <Badge className="bg-white text-purple-600">NUEVO</Badge>
                </div>
              </CardHeader>
              <CardContent className="pt-6 space-y-4">
                <CardDescription className="text-gray-700 text-base">
                  Consulta los resultados de tus análisis de laboratorio e imagenología
                </CardDescription>
                <div className="space-y-2">
                  <p className="text-sm font-semibold text-gray-800">✓ Por cédula</p>
                  <p className="text-sm font-semibold text-gray-800">✓ Resultados inmediatos</p>
                  <p className="text-sm font-semibold text-gray-800">✓ Imprimir disponible</p>
                </div>
              </CardContent>
            </Card>

            {/* Kiosko de Admisión */}
            <Card
              className="cursor-pointer hover:shadow-xl transition-all hover:scale-105"
              onClick={() => setActiveKiosko('admision')}
            >
              <CardHeader className="bg-gradient-to-r from-orange-500 to-orange-600 text-white rounded-t-lg">
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-2">
                    <CheckCircle className="h-6 w-6" />
                    Ticket de Admisión
                  </CardTitle>
                  <Badge className="bg-white text-orange-600">NUEVO</Badge>
                </div>
              </CardHeader>
              <CardContent className="pt-6 space-y-4">
                <CardDescription className="text-gray-700 text-base">
                  Genera tu número de turno en la lista de espera automáticamente
                </CardDescription>
                <div className="space-y-2">
                  <p className="text-sm font-semibold text-gray-800">✓ Ticket automático</p>
                  <p className="text-sm font-semibold text-gray-800">✓ Sin esperas</p>
                  <p className="text-sm font-semibold text-gray-800">✓ Número de turno</p>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Nota de uso */}
          <Card className="bg-blue-50 border-blue-200">
            <CardContent className="pt-6">
              <p className="text-sm text-gray-700">
                <span className="font-semibold">Nota:</span> Estos kioscos están disponibles 24/7 para tu comodidad.
                Para asistencia, contacta a la recepción.
              </p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Kiosko de Autofacturación */}
      {activeKiosko === 'pago' && (
        <div className="w-full max-w-3xl">
          <div className="mb-4">
            <Button
              variant="outline"
              onClick={handleBack}
              className="gap-2"
            >
              <ArrowLeft className="h-4 w-4" />
              Volver al Menú
            </Button>
          </div>
          <KioskoAutofacturacion onBack={handleBack} />
        </div>
      )}

      {/* Kiosko de Resultados */}
      {activeKiosko === 'resultados' && (
        <div className="w-full max-w-3xl">
          <div className="mb-4">
            <Button
              variant="outline"
              onClick={handleBack}
              className="gap-2"
            >
              <ArrowLeft className="h-4 w-4" />
              Volver al Menú
            </Button>
          </div>
          <KioskoResultados onBack={handleBack} />
        </div>
      )}

      {/* Kiosko de Admisión */}
      {activeKiosko === 'admision' && (
        <div className="w-full max-w-3xl">
          <div className="mb-4">
            <Button
              variant="outline"
              onClick={handleBack}
              className="gap-2"
            >
              <ArrowLeft className="h-4 w-4" />
              Volver al Menú
            </Button>
          </div>
          <KioskoAdmision onBack={handleBack} />
        </div>
      )}
    </div>
  )
}
