import React, { useState, useRef } from 'react'
import { Volume2, VolumeX, Send } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Badge } from '@/components/ui/badge'

interface AnunciadorAltavozProps {
  mostrarEnNavbar?: boolean
}

export function AnunciadorAltavoz({ mostrarEnNavbar = false }: AnunciadorAltavozProps) {
  const [abierto, setAbierto] = useState(false)
  const [texto, setTexto] = useState('')
  const [reproduciendo, setReproduciendo] = useState(false)
  const [velocidad, setVelocidad] = useState(1.0)
  const [volumen, setVolumen] = useState(1.0)
  const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null)

  const soportaTTS =
    typeof window !== 'undefined' && 'speechSynthesis' in window

  const anunciar = () => {
    if (!soportaTTS || !texto.trim()) return

    // Cancelar cualquier síntesis previa
    speechSynthesis.cancel()

    const utterance = new SpeechSynthesisUtterance(texto)
    utterance.lang = 'es-ES'
    utterance.rate = velocidad
    utterance.pitch = 1.0
    utterance.volume = volumen

    utterance.onstart = () => setReproduciendo(true)
    utterance.onend = () => setReproduciendo(false)
    utterance.onerror = () => setReproduciendo(false)

    utteranceRef.current = utterance
    speechSynthesis.speak(utterance)
  }

  const detener = () => {
    speechSynthesis.cancel()
    setReproduciendo(false)
  }

  const predefinidos = [
    { label: 'Turno Siguiente', texto: 'Por favor, el siguiente paciente pase a consulta' },
    { label: 'Almuerzo', texto: 'Cierre de recepción. Reapertura en una hora' },
    { label: 'Cierre', texto: 'Centro de salud cerrado. Reabriremos mañana' },
  ]

  const contenido = (
    <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium mb-2">
          Mensaje a Anunciar
        </label>
        <textarea
          value={texto}
          onChange={(e) => setTexto(e.target.value)}
          placeholder="Escribe el mensaje que deseas anunciar..."
          className="w-full p-3 border rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-blue-500"
          rows={4}
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium mb-2">
            Velocidad: {velocidad.toFixed(1)}x
          </label>
          <input
            type="range"
            min="0.5"
            max="2"
            step="0.1"
            value={velocidad}
            onChange={(e) => setVelocidad(parseFloat(e.target.value))}
            className="w-full"
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-2">
            Volumen: {Math.round(volumen * 100)}%
          </label>
          <input
            type="range"
            min="0"
            max="1"
            step="0.1"
            value={volumen}
            onChange={(e) => setVolumen(parseFloat(e.target.value))}
            className="w-full"
          />
        </div>
      </div>

      {/* Botones predefinidos */}
      {predefinidos.length > 0 && (
        <div>
          <p className="text-sm font-medium mb-2">Anuncios Predefinidos</p>
          <div className="grid grid-cols-1 gap-2">
            {predefinidos.map((pred) => (
              <Button
                key={pred.label}
                variant="outline"
                size="sm"
                onClick={() => setTexto(pred.texto)}
                className="text-left"
              >
                {pred.label}
              </Button>
            ))}
          </div>
        </div>
      )}

      {/* Botones de control */}
      <div className="flex gap-2">
        <Button
          onClick={anunciar}
          disabled={!soportaTTS || !texto.trim() || reproduciendo}
          className="flex-1 gap-2"
          variant="default"
        >
          <Volume2 className="h-4 w-4" />
          {reproduciendo ? 'Reproduciendo...' : 'Anunciar'}
        </Button>

        {reproduciendo && (
          <Button
            onClick={detener}
            variant="destructive"
            className="gap-2"
          >
            <VolumeX className="h-4 w-4" />
            Detener
          </Button>
        )}
      </div>

      {!soportaTTS && (
        <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg text-sm text-yellow-800">
          ⚠️ Tu navegador no soporta síntesis de voz. Por favor, usa un navegador moderno.
        </div>
      )}

      <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg text-sm text-blue-800">
        💡 Tip: Los anuncios son útiles para notificar a pacientes en la lista de espera
      </div>
    </div>
  )

  if (!mostrarEnNavbar) {
    return (
      <Dialog open={abierto} onOpenChange={setAbierto}>
        <DialogTrigger asChild>
          <Button variant="outline" className="gap-2">
            <Volume2 className="h-4 w-4" />
            Anunciador
          </Button>
        </DialogTrigger>

        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Sistema de Anuncios</DialogTitle>
            <DialogDescription>
              Usa esta herramienta para hacer anuncios en el sistema de altavoces
            </DialogDescription>
          </DialogHeader>
          {contenido}
        </DialogContent>
      </Dialog>
    )
  }

  // Versión para navbar (comprimida)
  return (
    <Dialog open={abierto} onOpenChange={setAbierto}>
      <DialogTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          title="Sistema de anuncios"
          aria-label="Anunciador"
        >
          <Volume2 className="h-5 w-5" />
        </Button>
      </DialogTrigger>

      <DialogContent>
        <DialogHeader>
          <DialogTitle>Sistema de Anuncios</DialogTitle>
        </DialogHeader>
        {contenido}
      </DialogContent>
    </Dialog>
  )
}
