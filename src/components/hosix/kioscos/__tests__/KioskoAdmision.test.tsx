import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { QueryClientProvider } from '@tanstack/react-query'
import { queryClient } from '@/lib/queryClient'
import { KioskoAdmision } from '../KioskoAdmision'

vi.mock('@/integrations/supabase/hosixClient', () => {
  const mockSupabase = {
    from: vi.fn((table: string) => {
      const chainable = {
        select: vi.fn(function() { return this }),
        eq: vi.fn(function() { return this }),
        insert: vi.fn(function() { return this }),
        order: vi.fn(function() { return this }),
        single: vi.fn(function() { return this }),
      }

      if (table === 'hosix_pacientes') {
        chainable.single.mockResolvedValue({
          data: {
            id: 'paciente-123',
            nombre_completo: 'JUAN PÉREZ',
            numero_cedula: '123-456-789',
            edad: 45,
            sexo: 'M',
          },
          error: null,
        })
      } else if (table === 'hosix_lista_espera') {
        chainable.order.mockResolvedValue({
          data: [
            {
              id: 'ticket-1',
              numero_turno: 1,
              paciente_id: 'pac-1',
              tipo_solicitud: 'consulta_ambulatoria',
              estado: 'activa',
            },
          ],
          error: null,
        })
        chainable.single.mockResolvedValue({
          data: {
            id: 'ticket-123',
            numero_turno: 2,
            paciente_id: 'paciente-123',
            tipo_solicitud: 'consulta_ambulatoria',
            estado: 'activa',
            fecha_solicitud: new Date().toISOString(),
          },
          error: null,
        })
      }

      return chainable
    }),
  }

  return {
    supabase: mockSupabase,
  }
})

vi.mock('sonner', () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}))

const renderWithProviders = (component: React.ReactElement) => {
  return render(
    <QueryClientProvider client={queryClient}>
      {component}
    </QueryClientProvider>
  )
}

describe('KioskoAdmision', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('debe renderizar pantalla inicial de cédula', () => {
    renderWithProviders(<KioskoAdmision />)
    expect(screen.getByText(/generar ticket de admisión/i)).toBeInTheDocument()
    expect(screen.getByPlaceholderText(/ejemplo: 123-456-789/i)).toBeInTheDocument()
  })

  it('debe tener botón continuar deshabilitado sin entrada', () => {
    renderWithProviders(<KioskoAdmision />)
    const continueButton = screen.getByText(/continuar/i)
    expect(continueButton).toBeDisabled()
  })

  it('debe habilitar botón cuando hay cédula', async () => {
    const user = userEvent.setup()
    renderWithProviders(<KioskoAdmision />)

    const input = screen.getByPlaceholderText(/ejemplo: 123-456-789/i)
    await user.type(input, '123-456-789')

    const continueButton = screen.getByText(/continuar/i)
    expect(continueButton).not.toBeDisabled()
  })

  it('debe avanzar a pantalla de selección de tipo después de buscar paciente', async () => {
    const user = userEvent.setup()
    renderWithProviders(<KioskoAdmision />)

    const input = screen.getByPlaceholderText(/ejemplo: 123-456-789/i)
    await user.type(input, '123-456-789')

    const continueButton = screen.getByText(/continuar/i)
    await user.click(continueButton)

    await waitFor(
      () => {
        expect(screen.getByText(/¿qué servicio necesitas/i)).toBeInTheDocument()
      },
      { timeout: 3000 }
    )
  })

  it('debe mostrar datos del paciente en pantalla de selección', async () => {
    const user = userEvent.setup()
    renderWithProviders(<KioskoAdmision />)

    const input = screen.getByPlaceholderText(/ejemplo: 123-456-789/i)
    await user.type(input, '123-456-789')

    const continueButton = screen.getByText(/continuar/i)
    await user.click(continueButton)

    await waitFor(
      () => {
        expect(screen.getByText(/juan pérez/i)).toBeInTheDocument()
        expect(screen.getByText(/123-456-789/i)).toBeInTheDocument()
      },
      { timeout: 3000 }
    )
  })

  it('debe mostrar opciones de tipo de servicio', async () => {
    const user = userEvent.setup()
    renderWithProviders(<KioskoAdmision />)

    const input = screen.getByPlaceholderText(/ejemplo: 123-456-789/i)
    await user.type(input, '123-456-789')

    const continueButton = screen.getByText(/continuar/i)
    await user.click(continueButton)

    await waitFor(
      () => {
        expect(screen.getByText(/consulta ambulatoria/i)).toBeInTheDocument()
        expect(screen.getByText(/hospitalización/i)).toBeInTheDocument()
        expect(screen.getByText(/cirugía/i)).toBeInTheDocument()
        expect(screen.getByText(/examen diagnóstico/i)).toBeInTheDocument()
      },
      { timeout: 3000 }
    )
  })

  it('debe permitir seleccionar tipo de servicio', async () => {
    const user = userEvent.setup()
    renderWithProviders(<KioskoAdmision />)

    const input = screen.getByPlaceholderText(/ejemplo: 123-456-789/i)
    await user.type(input, '123-456-789')

    const continueButton = screen.getByText(/continuar/i)
    await user.click(continueButton)

    await waitFor(
      () => {
        expect(screen.getByText(/consulta ambulatoria/i)).toBeInTheDocument()
      },
      { timeout: 3000 }
    )

    const consultaOption = screen.getByText(/consulta ambulatoria/i)
    await user.click(consultaOption)

    // Verificar que la opción se seleccionó
    expect(consultaOption.closest('div')).toHaveClass('border-orange-500')
  })

  it('debe generar ticket después de seleccionar tipo', async () => {
    const user = userEvent.setup()
    renderWithProviders(<KioskoAdmision />)

    // Paso 1: Ingresar cédula
    const input = screen.getByPlaceholderText(/ejemplo: 123-456-789/i)
    await user.type(input, '123-456-789')

    const continueButton = screen.getByText(/continuar/i)
    await user.click(continueButton)

    // Paso 2: Seleccionar tipo
    await waitFor(
      () => {
        expect(screen.getByText(/consulta ambulatoria/i)).toBeInTheDocument()
      },
      { timeout: 3000 }
    )

    const consultaOption = screen.getByText(/consulta ambulatoria/i)
    await user.click(consultaOption)

    const generateButton = screen.getByText(/generar ticket/i)
    await user.click(generateButton)

    // Paso 3: Verificar ticket generado
    await waitFor(
      () => {
        expect(screen.getByText(/¡ticket generado!/i)).toBeInTheDocument()
      },
      { timeout: 3000 }
    )
  })

  it('debe mostrar número de turno después de generar ticket', async () => {
    const user = userEvent.setup()
    renderWithProviders(<KioskoAdmision />)

    const input = screen.getByPlaceholderText(/ejemplo: 123-456-789/i)
    await user.type(input, '123-456-789')

    const continueButton = screen.getByText(/continuar/i)
    await user.click(continueButton)

    await waitFor(
      () => {
        const consultaOption = screen.getByText(/consulta ambulatoria/i)
        return consultaOption
      },
      { timeout: 3000 }
    )

    const consultaOption = screen.getByText(/consulta ambulatoria/i)
    await user.click(consultaOption)

    const generateButton = screen.getByText(/generar ticket/i)
    await user.click(generateButton)

    await waitFor(
      () => {
        // Buscar el texto que indica ticket generado
        expect(screen.getByText(/¡ticket generado!/i)).toBeInTheDocument()
      },
      { timeout: 3000 }
    )
  })

  it('debe permitir imprimir ticket', async () => {
    const user = userEvent.setup()
    const printSpy = vi.spyOn(window, 'print').mockImplementation(() => {})

    renderWithProviders(<KioskoAdmision />)

    const input = screen.getByPlaceholderText(/ejemplo: 123-456-789/i)
    await user.type(input, '123-456-789')

    const continueButton = screen.getByText(/continuar/i)
    await user.click(continueButton)

    await waitFor(
      () => {
        const consultaOption = screen.getByText(/consulta ambulatoria/i)
        return consultaOption
      },
      { timeout: 3000 }
    )

    const consultaOption = screen.getByText(/consulta ambulatoria/i)
    await user.click(consultaOption)

    const generateButton = screen.getByText(/generar ticket/i)
    await user.click(generateButton)

    await waitFor(
      () => {
        expect(screen.getByText(/imprimir ticket/i)).toBeInTheDocument()
      },
      { timeout: 3000 }
    )

    const printButton = screen.getByText(/imprimir ticket/i)
    await user.click(printButton)
    expect(printSpy).toHaveBeenCalled()

    printSpy.mockRestore()
  })

  it('debe permitir volver atrás desde pantalla de selección', async () => {
    const user = userEvent.setup()
    renderWithProviders(<KioskoAdmision />)

    const input = screen.getByPlaceholderText(/ejemplo: 123-456-789/i)
    await user.type(input, '123-456-789')

    const continueButton = screen.getByText(/continuar/i)
    await user.click(continueButton)

    await waitFor(
      () => {
        expect(screen.getByText(/¿qué servicio necesitas/i)).toBeInTheDocument()
      },
      { timeout: 3000 }
    )

    const backButton = screen.getByText(/atrás/i)
    await user.click(backButton)

    expect(screen.getByPlaceholderText(/ejemplo: 123-456-789/i)).toBeInTheDocument()
    expect(screen.queryByText(/¿qué servicio necesitas/i)).not.toBeInTheDocument()
  })

  it('debe permitir generar nuevo ticket', async () => {
    const user = userEvent.setup()
    renderWithProviders(<KioskoAdmision />)

    const input = screen.getByPlaceholderText(/ejemplo: 123-456-789/i)
    await user.type(input, '123-456-789')

    const continueButton = screen.getByText(/continuar/i)
    await user.click(continueButton)

    await waitFor(
      () => {
        const consultaOption = screen.getByText(/consulta ambulatoria/i)
        return consultaOption
      },
      { timeout: 3000 }
    )

    const consultaOption = screen.getByText(/consulta ambulatoria/i)
    await user.click(consultaOption)

    const generateButton = screen.getByText(/generar ticket/i)
    await user.click(generateButton)

    await waitFor(
      () => {
        expect(screen.getByText(/nuevo ticket/i)).toBeInTheDocument()
      },
      { timeout: 3000 }
    )

    const newTicketButton = screen.getByText(/nuevo ticket/i)
    await user.click(newTicketButton)

    expect(screen.getByPlaceholderText(/ejemplo: 123-456-789/i)).toBeInTheDocument()
  })
})
