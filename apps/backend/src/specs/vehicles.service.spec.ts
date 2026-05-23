import { Test, TestingModule } from '@nestjs/testing'
import { NotFoundException, ForbiddenException } from '@nestjs/common'
import { VehiclesService } from '../vehicles/vehicles.service'
import { SupabaseService } from '../supabase/supabase.service'

function buildChain(result: { data?: any; error?: any; count?: any } = {}) {
  const r = { data: null, error: null, count: null, ...result }
  const chain: any = {}
  for (const m of ['select', 'insert', 'update', 'delete', 'eq', 'neq', 'gte', 'lte', 'ilike', 'or', 'is', 'order', 'range', 'limit']) {
    chain[m] = jest.fn().mockReturnValue(chain)
  }
  chain.single = jest.fn().mockResolvedValue(r)
  chain.then = (res: any, rej: any) => Promise.resolve(r).then(res, rej)
  return chain
}

const mockVehicle = {
  id: 'v1',
  brand: 'Toyota',
  model: 'Corolla',
  year: 2022,
  price: 15000000,
  mileage: 20000,
  transmission: 'automatic',
  fuel_type: 'gasoline',
  body_type: 'sedan',
  color: 'Blanco',
  doors: 4,
  location: 'Santiago',
  region: 'Metropolitana',
  description: 'Excelente estado',
  status: 'published',
  seller_id: 'user-1',
  views_count: 5,
  has_3d_model: false,
}

describe('VehiclesService', () => {
  let service: VehiclesService
  let supabase: { admin: { from: jest.Mock }; client: { from: jest.Mock } }

  beforeEach(async () => {
    supabase = { admin: { from: jest.fn() }, client: { from: jest.fn() } }

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        VehiclesService,
        { provide: SupabaseService, useValue: supabase },
      ],
    }).compile()

    service = module.get(VehiclesService)
  })

  // ── findAll ───────────────────────────────────────────────────────────────

  describe('findAll()', () => {
    it('retorna paginación por defecto (page=1, limit=12)', async () => {
      supabase.client.from.mockReturnValue(buildChain({ data: [mockVehicle], count: 1 }))

      const result = await service.findAll()

      expect(result.page).toBe(1)
      expect(result.limit).toBe(12)
      expect(result.total).toBe(1)
      expect(result.data).toHaveLength(1)
    })

    it('calcula el total de páginas correctamente', async () => {
      supabase.client.from.mockReturnValue(buildChain({ data: [], count: 25 }))

      const result = await service.findAll({ limit: 12 })

      expect(result.pages).toBe(3) // ceil(25/12)
    })

    it('retorna array vacío cuando no hay vehículos', async () => {
      supabase.client.from.mockReturnValue(buildChain({ data: null, count: 0 }))

      const result = await service.findAll()

      expect(result.data).toEqual([])
      expect(result.total).toBe(0)
    })

    it('aplica filtro de brand cuando se provee', async () => {
      const chain = buildChain({ data: [], count: 0 })
      supabase.client.from.mockReturnValue(chain)

      await service.findAll({ brand: 'Toyota' })

      expect(chain.ilike).toHaveBeenCalledWith('brand', '%Toyota%')
    })

    it('aplica filtro de búsqueda general (brand o model)', async () => {
      const chain = buildChain({ data: [], count: 0 })
      supabase.client.from.mockReturnValue(chain)

      await service.findAll({ search: 'corolla' })

      expect(chain.or).toHaveBeenCalledWith('brand.ilike.%corolla%,model.ilike.%corolla%')
    })

    it('aplica filtro de precio mínimo', async () => {
      const chain = buildChain({ data: [], count: 0 })
      supabase.client.from.mockReturnValue(chain)

      await service.findAll({ minPrice: 5000000 })

      expect(chain.gte).toHaveBeenCalledWith('price', 5000000)
    })

    it('aplica filtro de precio máximo', async () => {
      const chain = buildChain({ data: [], count: 0 })
      supabase.client.from.mockReturnValue(chain)

      await service.findAll({ maxPrice: 20000000 })

      expect(chain.lte).toHaveBeenCalledWith('price', 20000000)
    })

    it('aplica filtro de año mínimo', async () => {
      const chain = buildChain({ data: [], count: 0 })
      supabase.client.from.mockReturnValue(chain)

      await service.findAll({ minYear: 2020 })

      expect(chain.gte).toHaveBeenCalledWith('year', 2020)
    })

    it('aplica filtro de transmisión', async () => {
      const chain = buildChain({ data: [], count: 0 })
      supabase.client.from.mockReturnValue(chain)

      await service.findAll({ transmission: 'automatic' })

      expect(chain.eq).toHaveBeenCalledWith('transmission', 'automatic')
    })

    it('aplica filtro de ubicación', async () => {
      const chain = buildChain({ data: [], count: 0 })
      supabase.client.from.mockReturnValue(chain)

      await service.findAll({ location: 'Santiago' })

      expect(chain.ilike).toHaveBeenCalledWith('location', '%Santiago%')
    })

    it('filtra solo vehículos published', async () => {
      const chain = buildChain({ data: [], count: 0 })
      supabase.client.from.mockReturnValue(chain)

      await service.findAll()

      expect(chain.eq).toHaveBeenCalledWith('status', 'published')
    })

    it('lanza error cuando Supabase devuelve error', async () => {
      supabase.client.from.mockReturnValue(
        buildChain({ data: null, error: { message: 'connection error' } }),
      )

      await expect(service.findAll()).rejects.toThrow('connection error')
    })
  })

  // ── findOne ───────────────────────────────────────────────────────────────

  describe('findOne()', () => {
    it('retorna el vehículo cuando existe', async () => {
      // First call is for the select, second (fire-and-forget) is for view increment
      supabase.client.from.mockReturnValue(buildChain({ data: mockVehicle }))
      supabase.admin.from.mockReturnValue(buildChain({ data: mockVehicle }))

      const result = await service.findOne('v1')

      expect(result).toMatchObject({ id: 'v1', brand: 'Toyota' })
    })

    it('lanza NotFoundException cuando el vehículo no existe', async () => {
      supabase.client.from.mockReturnValue(buildChain({ data: null, error: { message: 'not found' } }))

      await expect(service.findOne('unknown')).rejects.toThrow(NotFoundException)
    })

    it('incrementa views_count de forma asíncrona', async () => {
      const adminChain = buildChain({ data: { views_count: 6 } })
      supabase.client.from.mockReturnValue(buildChain({ data: { ...mockVehicle, views_count: 5 } }))
      supabase.admin.from.mockReturnValue(adminChain)

      await service.findOne('v1')

      expect(supabase.admin.from).toHaveBeenCalledWith('vehicles')
    })
  })

  // ── findByUser ────────────────────────────────────────────────────────────

  describe('findByUser()', () => {
    it('retorna los vehículos del usuario', async () => {
      supabase.admin.from.mockReturnValue(buildChain({ data: [mockVehicle] }))

      const result = await service.findByUser('user-1')

      expect(result).toHaveLength(1)
      expect(result[0].seller_id).toBe('user-1')
    })

    it('retorna array vacío si el usuario no tiene vehículos', async () => {
      supabase.admin.from.mockReturnValue(buildChain({ data: null }))

      const result = await service.findByUser('user-no-vehicles')

      expect(result).toEqual([])
    })
  })

  // ── create ────────────────────────────────────────────────────────────────

  describe('create()', () => {
    const dto = {
      brand: 'Honda', model: 'Civic', year: 2021, price: 12000000,
      mileage: 15000, transmission: 'manual' as any, fuel_type: 'gasoline' as any,
      body_type: 'sedan' as any, color: 'Negro', doors: 4,
      location: 'Valparaíso', region: 'Valparaíso', description: 'Muy buen estado',
    }

    it('crea el vehículo con status draft', async () => {
      const chain = buildChain({ data: { ...dto, id: 'v2', status: 'draft' } })
      supabase.admin.from.mockReturnValue(chain)

      await service.create('user-1', dto)

      expect(chain.insert).toHaveBeenCalledWith(
        expect.objectContaining({ status: 'draft', seller_id: 'user-1' }),
      )
    })

    it('retorna el vehículo creado', async () => {
      const created = { ...dto, id: 'v2', status: 'draft', seller_id: 'user-1' }
      supabase.admin.from.mockReturnValue(buildChain({ data: created }))

      const result = await service.create('user-1', dto)

      expect(result).toMatchObject({ id: 'v2', brand: 'Honda' })
    })
  })

  // ── update ────────────────────────────────────────────────────────────────

  describe('update()', () => {
    it('actualiza el vehículo si el usuario es el propietario', async () => {
      // assertOwner query + update query
      supabase.admin.from
        .mockReturnValueOnce(buildChain({ data: { seller_id: 'user-1' } }))  // assertOwner
        .mockReturnValueOnce(buildChain({ data: { ...mockVehicle, price: 20000000 } })) // update

      const result = await service.update('v1', 'user-1', { price: 20000000 })

      expect(result).toMatchObject({ price: 20000000 })
    })

    it('lanza ForbiddenException si el usuario no es el propietario', async () => {
      supabase.admin.from.mockReturnValue(buildChain({ data: { seller_id: 'otro-user' } }))

      await expect(service.update('v1', 'user-1', {})).rejects.toThrow(ForbiddenException)
    })

    it('lanza NotFoundException si el vehículo no existe en assertOwner', async () => {
      supabase.admin.from.mockReturnValue(buildChain({ data: null }))

      await expect(service.update('v-inexistente', 'user-1', {})).rejects.toThrow(NotFoundException)
    })
  })

  // ── remove ────────────────────────────────────────────────────────────────

  describe('remove()', () => {
    it('elimina el vehículo si el usuario es el propietario', async () => {
      supabase.admin.from
        .mockReturnValueOnce(buildChain({ data: { seller_id: 'user-1' } })) // assertOwner
        .mockReturnValueOnce(buildChain({ data: null, error: null }))         // delete

      const result = await service.remove('v1', 'user-1')

      expect(result).toEqual({ message: 'Vehículo eliminado' })
    })

    it('lanza ForbiddenException si el usuario no es el propietario', async () => {
      supabase.admin.from.mockReturnValue(buildChain({ data: { seller_id: 'otro-user' } }))

      await expect(service.remove('v1', 'user-1')).rejects.toThrow(ForbiddenException)
    })
  })

  // ── publish ───────────────────────────────────────────────────────────────

  describe('publish()', () => {
    it('cambia el status a published', async () => {
      supabase.admin.from
        .mockReturnValueOnce(buildChain({ data: { seller_id: 'user-1' } }))
        .mockReturnValueOnce(buildChain({ data: { ...mockVehicle, status: 'published' } }))

      const result = await service.publish('v1', 'user-1')

      expect(result).toMatchObject({ status: 'published' })
    })
  })
})
