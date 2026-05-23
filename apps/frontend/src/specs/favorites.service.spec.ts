import { describe, it, expect, vi, beforeEach } from 'vitest'

vi.mock('@/lib/api', () => ({
  api: {
    get: vi.fn(),
    post: vi.fn(),
  },
}))

import { api } from '@/lib/api'
import { favoritesService } from '../services/favorites.service'

const mockApi = api as { get: ReturnType<typeof vi.fn>; post: ReturnType<typeof vi.fn> }

beforeEach(() => vi.clearAllMocks())

describe('favoritesService', () => {

  // ── getAll ─────────────────────────────────────────────────────────────

  describe('getAll()', () => {
    it('retorna la lista de favoritos del usuario', async () => {
      const favs = [{ id: 'f1', vehicle: { id: 'v1', brand: 'Toyota' } }]
      mockApi.get.mockResolvedValue({ data: favs })

      const result = await favoritesService.getAll()

      expect(result).toEqual(favs)
      expect(mockApi.get).toHaveBeenCalledWith('/favorites')
    })

    it('retorna array vacío si no hay favoritos', async () => {
      mockApi.get.mockResolvedValue({ data: [] })

      const result = await favoritesService.getAll()

      expect(result).toEqual([])
    })
  })

  // ── toggle ─────────────────────────────────────────────────────────────

  describe('toggle()', () => {
    it('retorna { saved: true } al agregar favorito', async () => {
      mockApi.post.mockResolvedValue({ data: { saved: true } })

      const result = await favoritesService.toggle('v1')

      expect(result).toEqual({ saved: true })
      expect(mockApi.post).toHaveBeenCalledWith('/favorites/v1/toggle')
    })

    it('retorna { saved: false } al quitar favorito', async () => {
      mockApi.post.mockResolvedValue({ data: { saved: false } })

      const result = await favoritesService.toggle('v1')

      expect(result).toEqual({ saved: false })
    })

    it('usa la URL correcta con el vehicleId', async () => {
      mockApi.post.mockResolvedValue({ data: { saved: true } })

      await favoritesService.toggle('vehicle-uuid-abc')

      expect(mockApi.post).toHaveBeenCalledWith('/favorites/vehicle-uuid-abc/toggle')
    })
  })

  // ── isSaved ────────────────────────────────────────────────────────────

  describe('isSaved()', () => {
    it('retorna { saved: true } cuando el vehículo está en favoritos', async () => {
      mockApi.get.mockResolvedValue({ data: { saved: true } })

      const result = await favoritesService.isSaved('v1')

      expect(result).toEqual({ saved: true })
      expect(mockApi.get).toHaveBeenCalledWith('/favorites/v1/saved')
    })

    it('retorna { saved: false } cuando no está en favoritos', async () => {
      mockApi.get.mockResolvedValue({ data: { saved: false } })

      const result = await favoritesService.isSaved('v2')

      expect(result).toEqual({ saved: false })
    })
  })
})
