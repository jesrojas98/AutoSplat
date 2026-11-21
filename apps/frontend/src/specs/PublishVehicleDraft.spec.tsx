import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'

const mockGetOne = vi.fn()

vi.mock('@/services/vehicles.service', () => ({
  vehiclesService: { getOne: (...args: unknown[]) => mockGetOne(...args) },
}))

import { PublishVehicle } from '../pages/PublishVehicle'

function renderAt(url: string) {
  return render(
    <MemoryRouter initialEntries={[url]}>
      <PublishVehicle />
    </MemoryRouter>,
  )
}

beforeEach(() => vi.clearAllMocks())

describe('PublishVehicle — continuar borrador', () => {
  it('sin ?draft es un aviso nuevo y no consulta ningún vehículo', () => {
    renderAt('/publish')
    expect(screen.getByText('NUEVO AVISO')).toBeInTheDocument()
    expect(mockGetOne).not.toHaveBeenCalled()
  })

  it('con ?draft carga el borrador y sigue directo en las fotos', async () => {
    mockGetOne.mockResolvedValue({
      id: 'd1', status: 'draft', brand: 'Mazda', model: 'CX-5', year: 2022, price: 18000000, mileage: 40000,
      transmission: 'automatic', fuel_type: 'gasoline', body_type: 'suv', color: 'Rojo', doors: 5,
      location: 'Providencia', region: 'Metropolitana', description: null,
    })
    renderAt('/publish?draft=d1')
    expect(await screen.findByText('CONTINUAR BORRADOR')).toBeInTheDocument()
    expect(mockGetOne).toHaveBeenCalledWith('d1')
    expect(screen.getByText(/PASO 2 DE 4/)).toBeInTheDocument()
  })

  it('un vehículo que ya no es borrador no se puede retomar', async () => {
    mockGetOne.mockResolvedValue({ id: 'p1', status: 'published', brand: 'Omoda', model: 'C5' })
    renderAt('/publish?draft=p1')
    expect(await screen.findByText(/No se encontró ese borrador/)).toBeInTheDocument()
  })
})
