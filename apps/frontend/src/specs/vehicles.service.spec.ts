import { describe, it, expect, vi, beforeEach } from 'vitest'
import { vehiclesService, type Vehicle } from '../services/vehicles.service'

// Mock del cliente axios
vi.mock('@/lib/api', () => ({
  api: {
    get: vi.fn(),
    post: vi.fn(),
    patch: vi.fn(),
    delete: vi.fn(),
  },
}))

import { api } from '@/lib/api'
const mockApi = api as { get: ReturnType<typeof vi.fn>; post: ReturnType<typeof vi.fn>; patch: ReturnType<typeof vi.fn>; delete: ReturnType<typeof vi.fn> }

const mockVehicle: Vehicle = {
  id: 'v1', brand: 'Toyota', model: 'Corolla', year: 2022, price: 15000000,
  mileage: 20000, transmission: 'automatic', fuel_type: 'gasoline', body_type: 'sedan',
  color: 'Blanco', doors: 4, location: 'Santiago', region: 'Metropolitana',
  description: 'Excelente estado', status: 'published', views_count: 10,
  has_3d_model: false, created_at: '2024-01-01', seller_id: 'user-1',
  vehicle_images: [
    { id: 'img1', image_url: 'https://cdn/main.jpg', thumbnail_url: 'https://cdn/thumb.jpg', image_type: 'main', sort_order: 0 },
    { id: 'img2', image_url: 'https://cdn/thumb.jpg', thumbnail_url: 'https://cdn/thumb.jpg', image_type: 'thumbnail', sort_order: 1 },
  ],
  vehicle_3d_models: [],
}

beforeEach(() => {
  vi.clearAllMocks()
})

describe('vehiclesService', () => {

  // ── getAll ─────────────────────────────────────────────────────────────

  describe('getAll()', () => {
    it('retorna los vehículos paginados', async () => {
      const response = { data: [mockVehicle], total: 1, page: 1, limit: 12, pages: 1 }
      mockApi.get.mockResolvedValue({ data: response })

      const result = await vehiclesService.getAll()

      expect(result).toEqual(response)
      expect(mockApi.get).toHaveBeenCalledWith('/vehicles', { params: {} })
    })

    it('excluye filtros vacíos o undefined', async () => {
      mockApi.get.mockResolvedValue({ data: { data: [], total: 0, page: 1, limit: 12, pages: 0 } })

      await vehiclesService.getAll({ brand: 'Toyota', minPrice: undefined, search: '' })

      expect(mockApi.get).toHaveBeenCalledWith('/vehicles', { params: { brand: 'Toyota' } })
    })

    it('pasa todos los filtros válidos como params', async () => {
      mockApi.get.mockResolvedValue({ data: { data: [], total: 0, page: 1, limit: 12, pages: 0 } })
      const filters = { brand: 'Honda', minPrice: 5000000, maxPrice: 20000000, page: 2, limit: 6 }

      await vehiclesService.getAll(filters)

      expect(mockApi.get).toHaveBeenCalledWith('/vehicles', { params: filters })
    })
  })

  // ── getOne ─────────────────────────────────────────────────────────────

  describe('getOne()', () => {
    it('retorna el vehículo por id', async () => {
      mockApi.get.mockResolvedValue({ data: mockVehicle })

      const result = await vehiclesService.getOne('v1')

      expect(result).toEqual(mockVehicle)
      expect(mockApi.get).toHaveBeenCalledWith('/vehicles/v1')
    })

    it('llama a la URL correcta con el id', async () => {
      mockApi.get.mockResolvedValue({ data: mockVehicle })

      await vehiclesService.getOne('abc-123')

      expect(mockApi.get).toHaveBeenCalledWith('/vehicles/abc-123')
    })
  })

  // ── getMine ────────────────────────────────────────────────────────────

  describe('getMine()', () => {
    it('retorna los vehículos del usuario autenticado', async () => {
      mockApi.get.mockResolvedValue({ data: [mockVehicle] })

      const result = await vehiclesService.getMine()

      expect(result).toHaveLength(1)
      expect(mockApi.get).toHaveBeenCalledWith('/vehicles/my')
    })
  })

  // ── create ─────────────────────────────────────────────────────────────

  describe('create()', () => {
    it('envía POST con el dto y retorna el vehículo creado', async () => {
      const dto = { brand: 'Honda', model: 'Civic', year: 2021, price: 12000000 }
      const created = { ...dto, id: 'v2', status: 'draft' }
      mockApi.post.mockResolvedValue({ data: created })

      const result = await vehiclesService.create(dto)

      expect(mockApi.post).toHaveBeenCalledWith('/vehicles', dto)
      expect(result).toMatchObject({ id: 'v2' })
    })
  })

  // ── update ─────────────────────────────────────────────────────────────

  describe('update()', () => {
    it('envía PATCH con el id y dto', async () => {
      const updated = { ...mockVehicle, price: 18000000 }
      mockApi.patch.mockResolvedValue({ data: updated })

      const result = await vehiclesService.update('v1', { price: 18000000 })

      expect(mockApi.patch).toHaveBeenCalledWith('/vehicles/v1', { price: 18000000 })
      expect(result).toMatchObject({ price: 18000000 })
    })
  })

  // ── publish ────────────────────────────────────────────────────────────

  describe('publish()', () => {
    it('envía PATCH a la ruta publish', async () => {
      const published = { ...mockVehicle, status: 'published' }
      mockApi.patch.mockResolvedValue({ data: published })

      const result = await vehiclesService.publish('v1')

      expect(mockApi.patch).toHaveBeenCalledWith('/vehicles/v1/publish')
      expect(result).toMatchObject({ status: 'published' })
    })
  })

  // ── remove ─────────────────────────────────────────────────────────────

  describe('remove()', () => {
    it('envía DELETE con el id', async () => {
      mockApi.delete.mockResolvedValue({ data: { message: 'Vehículo eliminado' } })

      const result = await vehiclesService.remove('v1')

      expect(mockApi.delete).toHaveBeenCalledWith('/vehicles/v1')
      expect(result).toEqual({ message: 'Vehículo eliminado' })
    })
  })

  // ── getThumbnail ───────────────────────────────────────────────────────

  describe('getThumbnail()', () => {
    it('retorna la imagen con image_type "thumbnail" cuando existe', () => {
      const result = vehiclesService.getThumbnail(mockVehicle)
      expect(result).toBe('https://cdn/thumb.jpg')
    })

    it('retorna la primera imagen cuando no hay thumbnail', () => {
      const vehicle = {
        ...mockVehicle,
        vehicle_images: [
          { id: 'img1', image_url: 'https://cdn/first.jpg', thumbnail_url: '', image_type: 'main', sort_order: 0 },
        ],
      }
      const result = vehiclesService.getThumbnail(vehicle)
      expect(result).toBe('https://cdn/first.jpg')
    })

    it('retorna string vacío cuando no hay imágenes', () => {
      const vehicle = { ...mockVehicle, vehicle_images: [] }
      const result = vehiclesService.getThumbnail(vehicle)
      expect(result).toBe('')
    })
  })
})
