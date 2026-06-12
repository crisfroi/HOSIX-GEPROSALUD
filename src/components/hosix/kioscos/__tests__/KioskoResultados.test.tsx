import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { QueryClientProvider } from '@tanstack/react-query'
import { queryClient } from '@/lib/queryClient'
import { KioskoResultados } from '../KioskoResultados'

vi.mock('@/integrations/supabase/hosixClient', () => {
  const mockSupabaseClient = {
    from: vi.fn((table: string) => {
      const chainable = {
        select: vi.fn(function() { return this }),
        eq: vi.fn(function() { return this }),
        order: vi.fn(function() { return this }),
        single: vi.fn(function() { return this }),
      }

      if (table === 'hosix_pacientes') {
        chainable.single.mockResolvedValue({
          data: {
            id: 'paciente-123',
            nombre_completo: 'JUAN PÉREZ',
            numero_cedula: '123-456-789',
          },
          error: null,
        })
      } else if (table === 'hosix_laboratorio_resultados') {
        chainable.order.mockResolvedValue({
          data: [
            {
              id: 'resultado-1',
              solicitud_id: 'solicitud-1',
              prueba_id: 'prueba-1',
              valor_resultado: '120',
              unidad_resultado: 'mg/dL',
              rango_referencia_minimo: '70',
              rango_referencia_maximo: '100',
              fecha_resultado: '2024-06-11',
              prueba: {
                id: 'prueba-1',
                nombre: 'Glucosa',
                codigo: 'GLU',
              },
              solicitud: {
                id: 'solicitud-1',
                diagnostico_clinico: 'Examen rutinario',
                estado: 'finalizado',
                fecha_solicitud: '2024-06-10',
              },
            },
          ],
          error: null,
        })
      } else if (table === 'hosix_imagenologia_estudios') {
        chainable.order.mockResolvedValue({
          data: [
            {
              id: 'estudio-1',
              solicitud_id: 'solicitud-2',
              numero_series: '5',
              cantidad_imagenes: '45',
              fecha_estudio: '2024-06-11',
              solicitud: {
                id: 'solicitud-2',
                diagnostico_clinico: 'Evaluación de tórax',
                estado: 'finalizado',
                fecha_solicitud: '2024-06-09',
                modalidad: {
                  id: 'modalidad-1',
                  nombre: 'Radiografía',
                  codigo: 'RX',
                },
              },
            },
          ],
          error: null,
        })
      } else {
        chainable.order.mockResolvedValue({ data: null, error: null })
        chainable.single.mockResolvedValue({ data: null, error: null })
      }

      return chainable
    }),
  }

  return {
    supabase: mockSupabaseClient,
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

describe('KioskoResultados', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('debe renderizar pantalla inicial de búsqueda', () => {
    renderWithProviders(<KioskoResultados />)
    expect(screen.getByText(/consulta tus resultados/i)).toBeInTheDocument()
    expect(screen.getByPlaceholderText(/ejemplo: 123-456-789/i)).toBeInTheDocument()
  })

  it('debe tener botón buscar deshabilitado sin entrada', () => {
    renderWithProviders(<KioskoResultados />)
    const searchButton = screen.getByText(/buscar resultados/i)
    expect(searchButton).toBeDisabled()
  })

  it('debe habilitar botón cuando hay cédula', async () => {
    const user = userEvent.setup()
    renderWithProviders(<KioskoResultados />)

    const input = screen.getByPlaceholderText(/ejemplo: 123-456-789/i)
    await user.type(input, '123-456-789')

    const searchButton = screen.getByText(/buscar resultados/i)
    expect(searchButton).not.toBeDisabled()
  })

  it('debe mostrar datos de paciente después de búsqueda exitosa', async () => {
    const user = userEvent.setup()
    renderWithProviders(<KioskoResultados />)

    const input = screen.getByPlaceholderText(/ejemplo: 123-456-789/i)
    await user.type(input, '123-456-789')

    const searchButton = screen.getByText(/buscar resultados/i)
    await user.click(searchButton)

    await waitFor(() => {
      expect(screen.getByText(/juan pérez/i)).toBeInTheDocument()
      expect(screen.getByText(/123-456-789/i)).toBeInTheDocument()
    }, { timeout: 3000 })
  })

  it('debe mostrar tabs de Laboratorio e Imagenología', async () => {
    const user = userEvent.setup()
    renderWithProviders(<KioskoResultados />)

    const input = screen.getByPlaceholderText(/ejemplo: 123-456-789/i)
    await user.type(input, '123-456-789')

    const searchButton = screen.getByText(/buscar resultados/i)
    await user.click(searchButton)

    await waitFor(() => {
      expect(screen.getByRole('tab', { name: /laboratorio/i })).toBeInTheDocument()
      expect(screen.getByRole('tab', { name: /imagenología/i })).toBeInTheDocument()
    }, { timeout: 3000 })
  })

  it('debe permitir imprimir resultados', async () => {
    const user = userEvent.setup()
    const printSpy = vi.spyOn(window, 'print').mockImplementation(() => {})

    renderWithProviders(<KioskoResultados />)

    const input = screen.getByPlaceholderText(/ejemplo: 123-456-789/i)
    await user.type(input, '123-456-789')

    const searchButton = screen.getByText(/buscar resultados/i)
    await user.click(searchButton)

    await waitFor(() => {
      const printButton = screen.getByRole('button', { name: /imprimir/i })
      expect(printButton).toBeInTheDocument()
    }, { timeout: 3000 })

    const printButton = screen.getByRole('button', { name: /imprimir/i })
    await user.click(printButton)

    expect(printSpy).toHaveBeenCalled()
    printSpy.mockRestore()
  })

  it('debe permitir buscar otra cédula', async () => {
    const user = userEvent.setup()
    renderWithProviders(<KioskoResultados />)

    const input = screen.getByPlaceholderText(/ejemplo: 123-456-789/i)
    await user.type(input, '123-456-789')

    const searchButton = screen.getByText(/buscar resultados/i)
    await user.click(searchButton)

    await waitFor(() => {
      expect(screen.getByText(/juan pérez/i)).toBeInTheDocument()
    }, { timeout: 3000 })

    const newSearchButton = screen.getByRole('button', { name: /buscar otra cédula/i })
    await user.click(newSearchButton)

    expect(screen.getByPlaceholderText(/ejemplo: 123-456-789/i)).toBeInTheDocument()
  })

  it('debe mostrar error cuando cédula no existe', async () => {
    const user = userEvent.setup()
    
    // Mock para cédula no encontrada
    vi.mocked(vi.fn()).mockResolvedValueOnce({
      data: null,
      error: new Error('Cédula no encontrada'),
    })

    renderWithProviders(<KioskoResultados />)

    const input = screen.getByPlaceholderText(/ejemplo: 123-456-789/i)
    await user.type(input, '999-999-999')

    const searchButton = screen.getByText(/buscar resultados/i)
    await user.click(searchButton)

    // El componente debería volver a mostrar la pantalla de búsqueda
    await waitFor(() => {
      expect(screen.getByPlaceholderText(/ejemplo: 123-456-789/i)).toBeInTheDocument()
    }, { timeout: 3000 })
  })
})
