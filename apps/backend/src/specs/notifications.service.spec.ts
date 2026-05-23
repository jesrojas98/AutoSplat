import { Test, TestingModule } from '@nestjs/testing'
import { NotificationsService } from '../notifications/notifications.service'
import { SupabaseService } from '../supabase/supabase.service'

function buildChain(result: { data?: any; error?: any; count?: any } = {}) {
  const r = { data: null, error: null, count: null, ...result }
  const chain: any = {}
  for (const m of ['select', 'update', 'eq', 'is', 'order', 'limit']) {
    chain[m] = jest.fn().mockReturnValue(chain)
  }
  chain.single = jest.fn().mockResolvedValue(r)
  chain.then = (res: any, rej: any) => Promise.resolve(r).then(res, rej)
  return chain
}

describe('NotificationsService', () => {
  let service: NotificationsService
  let supabase: { admin: { from: jest.Mock } }

  beforeEach(async () => {
    supabase = { admin: { from: jest.fn() } }

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        NotificationsService,
        { provide: SupabaseService, useValue: supabase },
      ],
    }).compile()

    service = module.get(NotificationsService)
  })

  // ── getAll ────────────────────────────────────────────────────────────────

  describe('getAll()', () => {
    it('retorna las notificaciones del usuario', async () => {
      const notifs = [
        { id: 'n1', user_id: 'user-1', type: 'message', read_at: null },
        { id: 'n2', user_id: 'user-1', type: 'favorite', read_at: '2024-01-01' },
      ]
      supabase.admin.from.mockReturnValue(buildChain({ data: notifs }))

      const result = await service.getAll('user-1')

      expect(result).toHaveLength(2)
    })

    it('retorna array vacío cuando no hay notificaciones', async () => {
      supabase.admin.from.mockReturnValue(buildChain({ data: null }))

      const result = await service.getAll('user-sin-notifs')

      expect(result).toEqual([])
    })

    it('limita a 50 notificaciones', async () => {
      const chain = buildChain({ data: [] })
      supabase.admin.from.mockReturnValue(chain)

      await service.getAll('user-1')

      expect(chain.limit).toHaveBeenCalledWith(50)
    })

    it('filtra por user_id', async () => {
      const chain = buildChain({ data: [] })
      supabase.admin.from.mockReturnValue(chain)

      await service.getAll('user-1')

      expect(chain.eq).toHaveBeenCalledWith('user_id', 'user-1')
    })

    it('ordena por created_at descendente', async () => {
      const chain = buildChain({ data: [] })
      supabase.admin.from.mockReturnValue(chain)

      await service.getAll('user-1')

      expect(chain.order).toHaveBeenCalledWith('created_at', { ascending: false })
    })

    it('lanza error si Supabase devuelve error', async () => {
      supabase.admin.from.mockReturnValue(buildChain({ data: null, error: { message: 'query error' } }))

      await expect(service.getAll('user-1')).rejects.toThrow('query error')
    })
  })

  // ── getUnreadCount ────────────────────────────────────────────────────────

  describe('getUnreadCount()', () => {
    it('retorna el conteo de notificaciones no leídas', async () => {
      supabase.admin.from.mockReturnValue(buildChain({ count: 5 }))

      const result = await service.getUnreadCount('user-1')

      expect(result).toEqual({ count: 5 })
    })

    it('retorna { count: 0 } cuando no hay sin leer', async () => {
      supabase.admin.from.mockReturnValue(buildChain({ count: null }))

      const result = await service.getUnreadCount('user-1')

      expect(result).toEqual({ count: 0 })
    })

    it('filtra donde read_at es null', async () => {
      const chain = buildChain({ count: 3 })
      supabase.admin.from.mockReturnValue(chain)

      await service.getUnreadCount('user-1')

      expect(chain.is).toHaveBeenCalledWith('read_at', null)
    })

    it('lanza error si Supabase devuelve error', async () => {
      supabase.admin.from.mockReturnValue(buildChain({ count: null, error: { message: 'count error' } }))

      await expect(service.getUnreadCount('user-1')).rejects.toThrow('count error')
    })
  })

  // ── markRead ──────────────────────────────────────────────────────────────

  describe('markRead()', () => {
    it('marca la notificación como leída y la retorna', async () => {
      const updated = { id: 'n1', user_id: 'user-1', read_at: '2024-01-02T10:00:00Z' }
      supabase.admin.from.mockReturnValue(buildChain({ data: updated }))

      const result = await service.markRead('n1', 'user-1')

      expect(result).toMatchObject({ id: 'n1' })
    })

    it('filtra por id y user_id (seguridad)', async () => {
      const chain = buildChain({ data: { id: 'n1' } })
      supabase.admin.from.mockReturnValue(chain)

      await service.markRead('n1', 'user-1')

      expect(chain.eq).toHaveBeenCalledWith('id', 'n1')
      expect(chain.eq).toHaveBeenCalledWith('user_id', 'user-1')
    })

    it('actualiza read_at con fecha actual', async () => {
      const chain = buildChain({ data: { id: 'n1' } })
      supabase.admin.from.mockReturnValue(chain)

      await service.markRead('n1', 'user-1')

      expect(chain.update).toHaveBeenCalledWith(
        expect.objectContaining({ read_at: expect.any(String) }),
      )
    })

    it('lanza error si Supabase devuelve error', async () => {
      supabase.admin.from.mockReturnValue(buildChain({ data: null, error: { message: 'update error' } }))

      await expect(service.markRead('n1', 'user-1')).rejects.toThrow('update error')
    })
  })

  // ── markAllRead ───────────────────────────────────────────────────────────

  describe('markAllRead()', () => {
    it('retorna { success: true } al marcar todas como leídas', async () => {
      supabase.admin.from.mockReturnValue(buildChain({ data: null }))

      const result = await service.markAllRead('user-1')

      expect(result).toEqual({ success: true })
    })

    it('solo actualiza notificaciones no leídas (read_at is null)', async () => {
      const chain = buildChain({ data: null })
      supabase.admin.from.mockReturnValue(chain)

      await service.markAllRead('user-1')

      expect(chain.is).toHaveBeenCalledWith('read_at', null)
    })

    it('filtra por user_id para no tocar notificaciones de otros', async () => {
      const chain = buildChain({ data: null })
      supabase.admin.from.mockReturnValue(chain)

      await service.markAllRead('user-1')

      expect(chain.eq).toHaveBeenCalledWith('user_id', 'user-1')
    })

    it('lanza error si Supabase devuelve error', async () => {
      supabase.admin.from.mockReturnValue(buildChain({ data: null, error: { message: 'batch error' } }))

      await expect(service.markAllRead('user-1')).rejects.toThrow('batch error')
    })
  })
})
