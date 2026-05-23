import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'

// Mock del canvas API y HeroBackground3D (no es relevante para este test)
vi.mock('../components/home/HeroBackground3D', () => ({
  HeroBackground3D: () => <div data-testid="hero-bg" />,
}))

// Mock de useNavigate
const mockNavigate = vi.fn()
vi.mock('react-router-dom', async (importOriginal) => {
  const mod = await importOriginal<typeof import('react-router-dom')>()
  return { ...mod, useNavigate: () => mockNavigate }
})

import { HeroSection } from '../components/home/HeroSection'

function renderHero() {
  return render(
    <MemoryRouter>
      <HeroSection />
    </MemoryRouter>,
  )
}

beforeEach(() => vi.clearAllMocks())

describe('HeroSection', () => {

  // ── renderizado ────────────────────────────────────────────────────────

  describe('renderizado', () => {
    it('muestra el título principal', () => {
      renderHero()
      expect(screen.getByText(/El futuro de la compra de autos es/i)).toBeTruthy()
    })

    it('muestra "3D." resaltado en el headline', () => {
      renderHero()
      expect(screen.getByText('3D.')).toBeTruthy()
    })

    it('muestra el subtítulo descriptivo', () => {
      renderHero()
      expect(screen.getByText(/Gaussian Splatting/i)).toBeTruthy()
    })

    it('muestra el botón BUSCAR', () => {
      renderHero()
      expect(screen.getByRole('button', { name: /BUSCAR/i })).toBeTruthy()
    })

    it('muestra los 3 campos de búsqueda', () => {
      renderHero()
      expect(screen.getByPlaceholderText(/Marca/i)).toBeTruthy()
      expect(screen.getByPlaceholderText(/Modelo/i)).toBeTruthy()
      expect(screen.getByPlaceholderText(/Ubicación/i)).toBeTruthy()
    })

    it('muestra las estadísticas (vehículos, modelos, procesamiento)', () => {
      renderHero()
      expect(screen.getByText('2.400+')).toBeTruthy()
      expect(screen.getByText('380+')).toBeTruthy()
      expect(screen.getByText('48H')).toBeTruthy()
    })

    it('muestra el label eyebrow de la sección', () => {
      renderHero()
      expect(screen.getByText(/MARKETPLACE AUTOMOTRIZ/i)).toBeTruthy()
    })

    it('renderiza el componente de fondo 3D', () => {
      renderHero()
      expect(screen.getByTestId('hero-bg')).toBeTruthy()
    })
  })

  // ── búsqueda ───────────────────────────────────────────────────────────

  describe('búsqueda', () => {
    it('navega al catálogo al hacer clic en BUSCAR sin filtros', () => {
      renderHero()
      fireEvent.click(screen.getByRole('button', { name: /BUSCAR/i }))
      expect(mockNavigate).toHaveBeenCalledWith('/catalog?')
    })

    it('navega con parámetro brand cuando se escribe en el campo Marca', () => {
      renderHero()
      fireEvent.change(screen.getByPlaceholderText(/Marca/i), { target: { value: 'Toyota' } })
      fireEvent.click(screen.getByRole('button', { name: /BUSCAR/i }))
      expect(mockNavigate).toHaveBeenCalledWith('/catalog?brand=Toyota')
    })

    it('navega con parámetro model cuando se escribe en el campo Modelo', () => {
      renderHero()
      fireEvent.change(screen.getByPlaceholderText(/Modelo/i), { target: { value: 'Corolla' } })
      fireEvent.click(screen.getByRole('button', { name: /BUSCAR/i }))
      expect(mockNavigate).toHaveBeenCalledWith('/catalog?model=Corolla')
    })

    it('navega con parámetro location cuando se escribe en Ubicación', () => {
      renderHero()
      fireEvent.change(screen.getByPlaceholderText(/Ubicación/i), { target: { value: 'Santiago' } })
      fireEvent.click(screen.getByRole('button', { name: /BUSCAR/i }))
      expect(mockNavigate).toHaveBeenCalledWith('/catalog?location=Santiago')
    })

    it('incluye todos los parámetros cuando se llenan todos los campos', () => {
      renderHero()
      fireEvent.change(screen.getByPlaceholderText(/Marca/i), { target: { value: 'Toyota' } })
      fireEvent.change(screen.getByPlaceholderText(/Modelo/i), { target: { value: 'Corolla' } })
      fireEvent.change(screen.getByPlaceholderText(/Ubicación/i), { target: { value: 'Santiago' } })
      fireEvent.click(screen.getByRole('button', { name: /BUSCAR/i }))

      const call = mockNavigate.mock.calls[0][0] as string
      expect(call).toContain('brand=Toyota')
      expect(call).toContain('model=Corolla')
      expect(call).toContain('location=Santiago')
    })

    it('actualiza el valor del campo de búsqueda al escribir', () => {
      renderHero()
      const input = screen.getByPlaceholderText(/Marca/i) as HTMLInputElement
      fireEvent.change(input, { target: { value: 'Honda' } })
      expect(input.value).toBe('Honda')
    })
  })
})
