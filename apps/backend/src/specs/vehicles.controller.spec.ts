import { Test, TestingModule } from '@nestjs/testing'
import { ForbiddenException, NotFoundException } from '@nestjs/common'
import { VehiclesController } from '../vehicles/vehicles.controller'
import { VehiclesService } from '../vehicles/vehicles.service'
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard'
import { RateLimitGuard } from '../common/guards/rate-limit.guard'
import { Reflector } from '@nestjs/core'

const mockUser = { id: 'user-1', email: 'seller@example.com', role: 'seller' }

const mockVehicle = {
  id: 'v1', brand: 'Toyota', model: 'Corolla', year: 2022,
  price: 15000000, status: 'published', seller_id: 'user-1',
}

const mockPaginatedResult = {
  data: [mockVehicle], total: 1, page: 1, limit: 12, pages: 1,
}

describe('VehiclesController', () => {
  let controller: VehiclesController
  let vehiclesService: jest.Mocked<VehiclesService>

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [VehiclesController],
      providers: [
        {
          provide: VehiclesService,
          useValue: {
            findAll: jest.fn(),
            findOne: jest.fn(),
            findByUser: jest.fn(),
            create: jest.fn(),
            update: jest.fn(),
            publish: jest.fn(),
            remove: jest.fn(),
          },
        },
        Reflector,
        RateLimitGuard,
        JwtAuthGuard,
      ],
    })
      .overrideGuard(JwtAuthGuard)
      .useValue({ canActivate: (ctx: any) => { ctx.switchToHttp().getRequest().user = mockUser; return true } })
      .overrideGuard(RateLimitGuard)
      .useValue({ canActivate: () => true })
      .compile()

    controller = module.get(VehiclesController)
    vehiclesService = module.get(VehiclesService)
  })

  // ── findAll ───────────────────────────────────────────────────────────────

  describe('findAll()', () => {
    it('retorna lista paginada de vehículos', async () => {
      vehiclesService.findAll.mockResolvedValue(mockPaginatedResult)

      const result = await controller.findAll({} as any)

      expect(result).toEqual(mockPaginatedResult)
    })

    it('pasa los filtros de la query al servicio', async () => {
      vehiclesService.findAll.mockResolvedValue(mockPaginatedResult)
      const query = { brand: 'Toyota', minPrice: '5000000' } as any

      await controller.findAll(query)

      expect(vehiclesService.findAll).toHaveBeenCalledWith(expect.objectContaining({ brand: 'Toyota' }))
    })
  })

  // ── findMine ──────────────────────────────────────────────────────────────

  describe('findMine()', () => {
    it('retorna los vehículos del usuario autenticado', async () => {
      vehiclesService.findByUser.mockResolvedValue([mockVehicle as any])

      const result = await controller.findMine(mockUser as any)

      expect(vehiclesService.findByUser).toHaveBeenCalledWith('user-1')
      expect(result).toHaveLength(1)
    })
  })

  // ── findOne ───────────────────────────────────────────────────────────────

  describe('findOne()', () => {
    it('retorna el vehículo por id', async () => {
      vehiclesService.findOne.mockResolvedValue(mockVehicle as any)

      const result = await controller.findOne('v1')

      expect(result).toMatchObject({ id: 'v1' })
    })

    it('propaga NotFoundException cuando el vehículo no existe', async () => {
      vehiclesService.findOne.mockRejectedValue(new NotFoundException('Vehículo no encontrado'))

      await expect(controller.findOne('v-unknown')).rejects.toThrow(NotFoundException)
    })
  })

  // ── create ────────────────────────────────────────────────────────────────

  describe('create()', () => {
    const dto = {
      brand: 'Honda', model: 'Civic', year: 2021, price: 12000000,
      mileage: 15000, transmission: 'manual' as any, fuel_type: 'gasoline' as any,
      body_type: 'sedan' as any, color: 'Negro', doors: 4,
      location: 'Valparaíso', region: 'Valparaíso', description: 'Buen estado',
    }

    it('crea un vehículo para el usuario autenticado', async () => {
      const created = { ...dto, id: 'v2', status: 'draft', seller_id: 'user-1' }
      vehiclesService.create.mockResolvedValue(created as any)

      const result = await controller.create(mockUser as any, dto)

      expect(vehiclesService.create).toHaveBeenCalledWith('user-1', dto)
      expect(result).toMatchObject({ id: 'v2' })
    })
  })

  // ── update ────────────────────────────────────────────────────────────────

  describe('update()', () => {
    it('actualiza el vehículo del usuario', async () => {
      const updated = { ...mockVehicle, price: 20000000 }
      vehiclesService.update.mockResolvedValue(updated as any)

      const result = await controller.update('v1', mockUser as any, { price: 20000000 } as any)

      expect(vehiclesService.update).toHaveBeenCalledWith('v1', 'user-1', { price: 20000000 })
      expect(result).toMatchObject({ price: 20000000 })
    })

    it('propaga ForbiddenException si el usuario no es propietario', async () => {
      vehiclesService.update.mockRejectedValue(new ForbiddenException('No tienes permiso'))

      await expect(controller.update('v1', mockUser as any, {})).rejects.toThrow(ForbiddenException)
    })
  })

  // ── publish ───────────────────────────────────────────────────────────────

  describe('publish()', () => {
    it('publica el vehículo del usuario', async () => {
      const published = { ...mockVehicle, status: 'published' }
      vehiclesService.publish.mockResolvedValue(published as any)

      const result = await controller.publish('v1', mockUser as any)

      expect(vehiclesService.publish).toHaveBeenCalledWith('v1', 'user-1')
      expect(result).toMatchObject({ status: 'published' })
    })
  })

  // ── remove ────────────────────────────────────────────────────────────────

  describe('remove()', () => {
    it('elimina el vehículo del usuario', async () => {
      vehiclesService.remove.mockResolvedValue({ message: 'Vehículo eliminado' })

      const result = await controller.remove('v1', mockUser as any)

      expect(vehiclesService.remove).toHaveBeenCalledWith('v1', 'user-1')
      expect(result).toEqual({ message: 'Vehículo eliminado' })
    })

    it('propaga ForbiddenException si no es propietario', async () => {
      vehiclesService.remove.mockRejectedValue(new ForbiddenException('No tienes permiso'))

      await expect(controller.remove('v1', mockUser as any)).rejects.toThrow(ForbiddenException)
    })
  })
})
