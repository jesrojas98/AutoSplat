import { Test, TestingModule } from '@nestjs/testing'
import { FavoritesService } from '../favorites/favorites.service'
import { SupabaseService } from '../supabase/supabase.service'

function buildChain(result: { data?: any; error?: any } = {}) {
  const r = { data: null, error: null, ...result }
  const chain: any = {}
  for (const m of ['select', 'insert', 'delete', 'eq', 'order', 'limit']) {
    chain[m] = jest.fn().mockReturnValue(chain)
  }
  chain.single = jest.fn().mockResolvedValue(r)
  chain.then = (res: any, rej: any) => Promise.resolve(r).then(res, rej)
  return chain
}

describe('FavoritesService', () => {
  let service: FavoritesService
  let supabase: { admin: { from: jest.Mock } }

  beforeEach(async () => {
    supabase = { admin: { from: jest.fn() } }

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        FavoritesService,
        { provide: SupabaseService, useValue: supabase },
      ],
    }).compile()

    service = module.get(FavoritesService)
  })

  // ── findByUser ────────────────────────────────────────────────────────────

  describe('findByUser()', () => {
    it('retorna los favoritos del usuario con datos del vehículo', async () => {
      const favs = [
        {
          id: 'f1',
          created_at: '2024-01-01',
          vehicle: { id: 'v1', brand: 'Toyota', model: 'Corolla', year: 2022, price: 15000000 },
        },
      ]
      supabase.admin.from.mockReturnValue(buildChain({ data: favs }))

      const result = await service.findByUser('user-1')

      expect(result).toHaveLength(1)
      expect(result[0].vehicle).toMatchObject({ brand: 'Toyota' })
    })

    it('retorna array vacío cuando el usuario no tiene favoritos', async () => {
      supabase.admin.from.mockReturnValue(buildChain({ data: null }))

      const result = await service.findByUser('user-sin-favs')

      expect(result).toEqual([])
    })

    it('lanza error si Supabase devuelve error', async () => {
      supabase.admin.from.mockReturnValue(buildChain({ data: null, error: { message: 'query error' } }))

      await expect(service.findByUser('user-1')).rejects.toThrow('query error')
    })
  })

  // ── toggle ────────────────────────────────────────────────────────────────

  describe('toggle()', () => {
    it('agrega a favoritos si no existe y retorna { saved: true }', async () => {
      // Primera llamada: buscar existente → null
      supabase.admin.from
        .mockReturnValueOnce(buildChain({ data: null }))  // select existing
        .mockReturnValueOnce(buildChain({ data: null }))  // insert

      const result = await service.toggle('user-1', 'v1')

      expect(result).toEqual({ saved: true })
    })

    it('elimina de favoritos si ya existe y retorna { saved: false }', async () => {
      supabase.admin.from
        .mockReturnValueOnce(buildChain({ data: { id: 'f1' } }))  // select existing
        .mockReturnValueOnce(buildChain({ data: null }))            // delete

      const result = await service.toggle('user-1', 'v1')

      expect(result).toEqual({ saved: false })
    })

    it('llama delete con el id correcto al quitar favorito', async () => {
      const deleteChain = buildChain({ data: null })
      supabase.admin.from
        .mockReturnValueOnce(buildChain({ data: { id: 'f1' } }))
        .mockReturnValueOnce(deleteChain)

      await service.toggle('user-1', 'v1')

      expect(deleteChain.eq).toHaveBeenCalledWith('id', 'f1')
    })

    it('llama insert con user_id y vehicle_id correctos al agregar favorito', async () => {
      const insertChain = buildChain({ data: null })
      supabase.admin.from
        .mockReturnValueOnce(buildChain({ data: null }))
        .mockReturnValueOnce(insertChain)

      await service.toggle('user-1', 'v1')

      expect(insertChain.insert).toHaveBeenCalledWith({ user_id: 'user-1', vehicle_id: 'v1' })
    })
  })

  // ── isSaved ───────────────────────────────────────────────────────────────

  describe('isSaved()', () => {
    it('retorna { saved: true } cuando el favorito existe', async () => {
      supabase.admin.from.mockReturnValue(buildChain({ data: { id: 'f1' } }))

      const result = await service.isSaved('user-1', 'v1')

      expect(result).toEqual({ saved: true })
    })

    it('retorna { saved: false } cuando el favorito no existe', async () => {
      supabase.admin.from.mockReturnValue(buildChain({ data: null }))

      const result = await service.isSaved('user-1', 'v2')

      expect(result).toEqual({ saved: false })
    })
  })
})
