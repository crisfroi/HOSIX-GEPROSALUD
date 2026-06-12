import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { QueryClientProvider } from '@tanstack/react-query'
import { queryClient } from '@/lib/queryClient'
import KioskoPage from '../Kiosko'

// Mock de componentes de kioscos
vi.mock('@/components/hosix/kioscos/KioskoAutofacturacion', () => ({
  KioskoAutofacturacion: ({ onBack }: { onBack?: () => void }) => (
    <div data-testid="kiosko-pago">
      <button onClick={onBack}>Mock Pago</button>
    </div>
  ),
}))

vi.mock('@/components/hosix/kioscos/KioskoResultados', () => ({
  KioskoResultados: ({ onBack }: { onBack?: () => void }) => (
    <div data-testid="kiosko-resultados">
      <button onClick={onBack}>Mock Resultados</button>
    </div>
  ),
}))

vi.mock('@/components/hosix/kioscos/KioskoAdmision', () => ({
  KioskoAdmision: ({ onBack }: { onBack?: () => void }) => (
    <div data-testid="kiosko-admision">
      <button onClick={onBack}>Mock Admisión</button>
    </div>
  ),
}))

const renderWithProviders = (component: React.ReactElement) => {
  return render(
    <QueryClientProvider client={queryClient}>
      {component}
    </QueryClientProvider>
  )
}

describe('KioskoPage', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('debe renderizar menú principal con 3 opciones', () => {
    renderWithProviders(<KioskoPage />)

    expect(screen.getByRole('heading', { name: /sistema de kioscos/i })).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: /pagar servicios/i })).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: /ver resultados/i })).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: /ticket de admisión/i })).toBeInTheDocument()
  })

  it('debe mostrar descripción de cada servicio', () => {
    renderWithProviders(<KioskoPage />)

    expect(
      screen.getByText(/escanea tu código qr para pagar servicios/i)
    ).toBeInTheDocument()
    expect(
      screen.getByText(
        /consulta los resultados de tus análisis de laboratorio/i
      )
    ).toBeInTheDocument()
    expect(
      screen.getByText(/genera tu número de turno en la lista de espera/i)
    ).toBeInTheDocument()
  })

  it('debe mostrar badges de "NUEVO" en las tarjetas', () => {
    renderWithProviders(<KioskoPage />)

    const badges = screen.getAllByText(/nuevo/i)
    expect(badges).toHaveLength(3)
  })

  it('debe navegar a kiosko de pago al hacer click', async () => {
    const user = userEvent.setup()
    renderWithProviders(<KioskoPage />)

    // Buscar la tarjeta de pago y hacer click - usar heading para especificidad
    const pagarHeading = screen.getByRole('heading', { name: /pagar servicios/i })
    const pagarCard = pagarHeading.closest('.cursor-pointer')
    await user.click(pagarCard!)

    // Verificar que se muestra el kiosko de pago
    expect(screen.getByTestId('kiosko-pago')).toBeInTheDocument()
  })

  it('debe navegar a kiosko de resultados al hacer click', async () => {
    const user = userEvent.setup()
    renderWithProviders(<KioskoPage />)

    const resultadosCard = screen.getByText(/ver resultados/i).closest('div')
    await user.click(resultadosCard!)

    expect(screen.getByTestId('kiosko-resultados')).toBeInTheDocument()
  })

  it('debe navegar a kiosko de admisión al hacer click', async () => {
    const user = userEvent.setup()
    renderWithProviders(<KioskoPage />)

    const admisionCard = screen.getByText(/ticket de admisión/i).closest('div')
    await user.click(admisionCard!)

    expect(screen.getByTestId('kiosko-admision')).toBeInTheDocument()
  })

  it('debe volver al menú principal desde kiosko de pago', async () => {
    const user = userEvent.setup()
    renderWithProviders(<KioskoPage />)

    // Ir a kiosko de pago
    const pagarHeading = screen.getByRole('heading', { name: /pagar servicios/i })
    const pagarCard = pagarHeading.closest('.cursor-pointer')
    await user.click(pagarCard!)

    // Verificar que se muestra el kiosko
    expect(screen.getByTestId('kiosko-pago')).toBeInTheDocument()

    // Hacer click en botón volver
    const backButton = screen.getByRole('button', { name: /volver al menú/i })
    await user.click(backButton)

    // Verificar que volvió al menú
    expect(screen.getByRole('heading', { name: /sistema de kioscos/i })).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: /pagar servicios/i })).toBeInTheDocument()
  })

  it('debe volver al menú principal desde kiosko de resultados', async () => {
    const user = userEvent.setup()
    renderWithProviders(<KioskoPage />)

    const resultadosCard = screen.getByText(/ver resultados/i).closest('div')
    await user.click(resultadosCard!)

    expect(screen.getByTestId('kiosko-resultados')).toBeInTheDocument()

    const backButton = screen.getByRole('button', { name: /volver al menú/i })
    await user.click(backButton)

    expect(screen.getByText(/sistema de kioscos/i)).toBeInTheDocument()
  })

  it('debe volver al menú principal desde kiosko de admisión', async () => {
    const user = userEvent.setup()
    renderWithProviders(<KioskoPage />)

    const admisionCard = screen.getByText(/ticket de admisión/i).closest('div')
    await user.click(admisionCard!)

    expect(screen.getByTestId('kiosko-admision')).toBeInTheDocument()

    const backButton = screen.getByRole('button', { name: /volver al menú/i })
    await user.click(backButton)

    expect(screen.getByText(/sistema de kioscos/i)).toBeInTheDocument()
  })

  it('debe mostrar nota de uso en menú principal', () => {
    renderWithProviders(<KioskoPage />)

    expect(screen.getByText(/estos kioscos están disponibles 24\/7/i)).toBeInTheDocument()
  })

  it('debe tener gradient background', () => {
    const { container } = renderWithProviders(<KioskoPage />)
    const mainDiv = container.firstChild as HTMLElement

    expect(mainDiv).toHaveClass('bg-gradient-to-br')
    expect(mainDiv).toHaveClass('from-blue-50')
    expect(mainDiv).toHaveClass('to-indigo-100')
  })
})
