import { Test, TestingModule } from '@nestjs/testing'
import { MessagesService } from '../messages/messages.service'
import { SupabaseService } from '../supabase/supabase.service'

function buildChain(result: { data?: any; error?: any } = {}) {
  const r = { data: null, error: null, ...result }
  const chain: any = {}
  for (const m of ['select', 'insert', 'update', 'eq', 'or', 'order']) {
    chain[m] = jest.fn().mockReturnValue(chain)
  }
  chain.single = jest.fn().mockResolvedValue(r)
  chain.then = (res: any, rej: any) => Promise.resolve(r).then(res, rej)
  return chain
}

describe('MessagesService', () => {
  let service: MessagesService
  let supabase: { admin: { from: jest.Mock } }

  beforeEach(async () => {
    supabase = { admin: { from: jest.fn() } }

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        MessagesService,
        { provide: SupabaseService, useValue: supabase },
      ],
    }).compile()

    service = module.get(MessagesService)
  })

  // ── getConversations ──────────────────────────────────────────────────────

  describe('getConversations()', () => {
    it('retorna los mensajes donde el usuario es sender o receiver', async () => {
      const messages = [
        { id: 'm1', content: 'Hola', sender: { id: 'user-1' }, receiver: { id: 'user-2' } },
        { id: 'm2', content: 'Buenas', sender: { id: 'user-2' }, receiver: { id: 'user-1' } },
      ]
      const chain = buildChain({ data: messages })
      supabase.admin.from.mockReturnValue(chain)

      const result = await service.getConversations('user-1')

      expect(chain.or).toHaveBeenCalledWith('sender_id.eq.user-1,receiver_id.eq.user-1')
      expect(result).toHaveLength(2)
    })

    it('retorna array vacío cuando no hay mensajes', async () => {
      supabase.admin.from.mockReturnValue(buildChain({ data: null }))

      const result = await service.getConversations('user-sin-mensajes')

      expect(result).toEqual([])
    })

    it('lanza error si Supabase devuelve error', async () => {
      supabase.admin.from.mockReturnValue(buildChain({ data: null, error: { message: 'query failed' } }))

      await expect(service.getConversations('user-1')).rejects.toThrow('query failed')
    })

    it('ordena por created_at descendente', async () => {
      const chain = buildChain({ data: [] })
      supabase.admin.from.mockReturnValue(chain)

      await service.getConversations('user-1')

      expect(chain.order).toHaveBeenCalledWith('created_at', { ascending: false })
    })
  })

  // ── sendMessage ───────────────────────────────────────────────────────────

  describe('sendMessage()', () => {
    const dto = { receiver_id: 'user-2', vehicle_id: 'v1', content: '¿Está disponible?' }

    it('envía el mensaje y lo retorna', async () => {
      const sent = { id: 'm1', sender_id: 'user-1', ...dto, created_at: '2024-01-01', read_at: null }
      supabase.admin.from.mockReturnValue(buildChain({ data: sent }))

      const result = await service.sendMessage('user-1', dto)

      expect(result).toMatchObject({ id: 'm1', content: dto.content })
    })

    it('incluye sender_id en el insert', async () => {
      const chain = buildChain({ data: { id: 'm1' } })
      supabase.admin.from.mockReturnValue(chain)

      await service.sendMessage('user-1', dto)

      expect(chain.insert).toHaveBeenCalledWith(
        expect.objectContaining({ sender_id: 'user-1', ...dto }),
      )
    })

    it('lanza error si Supabase devuelve error', async () => {
      supabase.admin.from.mockReturnValue(buildChain({ data: null, error: { message: 'insert failed' } }))

      await expect(service.sendMessage('user-1', dto)).rejects.toThrow('insert failed')
    })
  })

  // ── markRead ──────────────────────────────────────────────────────────────

  describe('markRead()', () => {
    it('marca el mensaje como leído y lo retorna', async () => {
      const updated = { id: 'm1', read_at: '2024-01-02T10:00:00Z', receiver_id: 'user-1' }
      supabase.admin.from.mockReturnValue(buildChain({ data: updated }))

      const result = await service.markRead('m1', 'user-1')

      expect(result).toMatchObject({ id: 'm1' })
      expect(result.read_at).toBeTruthy()
    })

    it('filtra por receiver_id para evitar que otros marquen como leído', async () => {
      const chain = buildChain({ data: { id: 'm1' } })
      supabase.admin.from.mockReturnValue(chain)

      await service.markRead('m1', 'user-1')

      expect(chain.eq).toHaveBeenCalledWith('receiver_id', 'user-1')
    })

    it('actualiza read_at con fecha actual', async () => {
      const chain = buildChain({ data: { id: 'm1' } })
      supabase.admin.from.mockReturnValue(chain)

      await service.markRead('m1', 'user-1')

      expect(chain.update).toHaveBeenCalledWith(
        expect.objectContaining({ read_at: expect.any(String) }),
      )
    })

    it('lanza error si Supabase devuelve error', async () => {
      supabase.admin.from.mockReturnValue(buildChain({ data: null, error: { message: 'update failed' } }))

      await expect(service.markRead('m1', 'user-1')).rejects.toThrow('update failed')
    })
  })
})
