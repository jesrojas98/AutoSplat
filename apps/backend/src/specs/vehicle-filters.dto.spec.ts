import { ValidationPipe, BadRequestException } from '@nestjs/common'
import { VehicleFiltersDto } from '../vehicles/dto/vehicle-filters.dto'

// Misma configuración que app.module.ts
const pipe = new ValidationPipe({ whitelist: true, transform: true, forbidNonWhitelisted: true })
const run = (query: Record<string, string>) =>
  pipe.transform(query, { type: 'query', metatype: VehicleFiltersDto }) as Promise<VehicleFiltersDto>

describe('VehicleFiltersDto (query de GET /vehicles)', () => {
  it('convierte page y limit a número (antes llegaban como string)', async () => {
    const q = await run({ page: '2', limit: '12' })
    expect(q.page).toBe(2)
    expect(q.limit).toBe(12)
    expect(typeof q.page).toBe('number')
  })

  it('el cálculo de rango de la página 2 queda correcto', async () => {
    const { page = 1, limit = 12 } = await run({ page: '2', limit: '3' })
    const offset = (page - 1) * limit
    expect([offset, offset + limit - 1]).toEqual([3, 5])
  })

  it('convierte los filtros numéricos', async () => {
    const q = await run({ minPrice: '1000000', maxPrice: '5000000', minYear: '2015' })
    expect(q).toMatchObject({ minPrice: 1_000_000, maxPrice: 5_000_000, minYear: 2015 })
  })

  it('rechaza un limit sobre el tope', async () => {
    await expect(run({ limit: '100000' })).rejects.toBeInstanceOf(BadRequestException)
  })

  it('rechaza page o limit no numéricos', async () => {
    await expect(run({ page: 'abc' })).rejects.toBeInstanceOf(BadRequestException)
    await expect(run({ limit: '0' })).rejects.toBeInstanceOf(BadRequestException)
  })

  it('rechaza parámetros desconocidos', async () => {
    await expect(run({ status: 'draft' })).rejects.toBeInstanceOf(BadRequestException)
  })

  it('acepta una query vacía', async () => {
    await expect(run({})).resolves.toBeInstanceOf(VehicleFiltersDto)
  })
})
