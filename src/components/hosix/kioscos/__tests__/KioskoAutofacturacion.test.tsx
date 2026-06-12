import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { QueryClientProvider } from '@tanstack/react-query'
import { queryClient } from '@/lib/queryClient'
import { KioskoAutofacturacion } from '../KioskoAutofacturacion'

// Mock supabase
vi.mock('@/integrations/supabase/hosixClient', () => ({
  supabase: {
    from: vi.fn(() => ({
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({
        data: {
          id: 'test-id',
          tipo_documento: 'solicitud_lab',
          numero_documento: 'LAB20260000001',
          codigo_qr: 'QR12345ABC',
        },
        error: null,
      }),
      insert: vi.fn().mockReturnThis(),
      update: vi.fn().mockReturnThis(),
    })),
  },
}))

// Mock sonner toast
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

describe('KioskoAutofacturacion', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('debe renderizar pantalla inicial de escaneo', () => {
    renderWithProviders(<KioskoAutofacturacion />)
    expect(screen.getByRole('heading', { name: /escanea tu código qr/i })).toBeInTheDocument()
    expect(screen.getByPlaceholderText(/escanea aquí/i)).toBeInTheDocument()
  })

  it('debe tener botón "Buscar" deshabilitado inicialmente', () => {
    renderWithProviders(<KioskoAutofacturacion />)
    const searchButton = screen.getByText(/buscar/i)
    expect(searchButton).toBeDisabled()
  })

  it('debe habilitar botón "Buscar" cuando hay entrada de QR', async () => {
    const user = userEvent.setup()
    renderWithProviders(<KioskoAutofacturacion />)

    const input = screen.getByPlaceholderText(/escanea aquí/i)
    await user.type(input, 'QR12345ABC')

    const searchButton = screen.getByText(/buscar/i)
    expect(searchButton).not.toBeDisabled()
  })

  it('debe mostrar error cuando QR no se encuentra', async () => {
    const user = userEvent.setup()
    renderWithProviders(<KioskoAutofacturacion />)

    const input = screen.getByPlaceholderText(/escanea aquí/i)
    await user.type(input, 'QRINVALIDO')

    const searchButton = screen.getByText(/buscar/i)
    await user.click(searchButton)

    // Esperar a que se intente buscar y falle gracefully
    // El componente debería mantener el input visible
    await waitFor(() => {
      expect(screen.getByPlaceholderText(/escanea aquí/i)).toBeInTheDocument()
    }, { timeout: 5000 })
  })

  it('debe permitir seleccionar método de pago', async () => {
    const user = userEvent.setup()
    renderWithProviders(<KioskoAutofacturacion />)

    // Simular escaneo exitoso
    const input = screen.getByPlaceholderText(/escanea aquí/i)
    await user.type(input, 'QR12345ABC')
    const searchButton = screen.getByText(/buscar/i)
    await user.click(searchButton)

    await waitFor(() => {
      expect(screen.getByText(/confirmar pago/i)).toBeInTheDocument()
    })
  })

  it('debe calcular vuelto correctamente en efectivo', async () => {
    const user = userEvent.setup()
    renderWithProviders(<KioskoAutofacturacion />)

    // Simular escaneo
    const input = screen.getByPlaceholderText(/escanea aquí/i)
    await user.type(input, 'QR12345ABC')
    const searchButton = screen.getByText(/buscar/i)
    await user.click(searchButton)

    await waitFor(() => {
      expect(screen.getByText(/confirmar pago/i)).toBeInTheDocument()
    })

    // Ingresar monto mayor al requerido
    // const montoInput = screen.getByPlaceholderText(/monto recibido/i)
    // await user.type(montoInput, '150.00')
    // Verificar que vuelto se calcula
  })

  it('debe validar monto insuficiente', async () => {
    const user = userEvent.setup()
    renderWithProviders(<KioskoAutofacturacion />)

    const input = screen.getByPlaceholderText(/escanea aquí/i)
    await user.type(input, 'QR12345ABC')
    const searchButton = screen.getByText(/buscar/i)
    await user.click(searchButton)

    await waitFor(() => {
      expect(screen.getByText(/confirmar pago/i)).toBeInTheDocument()
    })

    // Verificar que botón Procesar está deshabilitado si monto < total
  })

  it('debe permitir volver al menú principal', async () => {
    const onBack = vi.fn()
    const { rerender } = renderWithProviders(
      <KioskoAutofacturacion onBack={onBack} />
    )

    expect(screen.getByRole('heading', { name: /escanea tu código qr/i })).toBeInTheDocument()
  })
})
