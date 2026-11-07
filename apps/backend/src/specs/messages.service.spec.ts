import { Test, TestingModule } from '@nestjs/testing'
import { BadRequestException, ForbiddenException, NotFoundException } from '@nestjs/common'
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
    const dto = { receiver_id: 'seller-1', vehicle_id: 'v1', content: '¿Está disponible?' }
    let vehicleRow: { seller_id: string; status: string } | null
    let priorMessages: number
    let insertChain: any

    beforeEach(() => {
      vehicleRow = { seller_id: 'seller-1', status: 'published' }
      priorMessages = 0
      insertChain = buildChain({ data: { id: 'm1', content: dto.content } })
      supabase.admin.from.mockImplementation((table: string) => {
        if (table === 'vehicles') {
          const c: any = {}
          c.select = () => c
          c.eq = () => c
          c.maybeSingle = () => Promise.resolve({ data: vehicleRow })
          return c
        }
        // messages: o bien conteo de mensajes previos, o bien el insert
        const c: any = { insert: insertChain.insert, select: (_cols?: string, opts?: any) => {
          if (opts?.head) {
            const q: any = {}
            q.eq = () => q
            q.then = (res: any, rej: any) => Promise.resolve({ count: priorMessages }).then(res, rej)
            return q
          }
          return insertChain
        } }
        return c
      })
    })

    it('un comprador le escribe al vendedor de un aviso publicado y se retorna el mensaje', async () => {
      const result = await service.sendMessage('buyer-1', dto)
      expect(result).toMatchObject({ id: 'm1', content: dto.content })
    })

    it('incluye sender_id en el insert', async () => {
      await service.sendMessage('buyer-1', dto)
      expect(insertChain.insert).toHaveBeenCalledWith(expect.objectContaining({ sender_id: 'buyer-1', ...dto }))
    })

    it('no permite escribirse a uno mismo', async () => {
      await expect(service.sendMessage('seller-1', dto)).rejects.toThrow(BadRequestException)
    })

    it('rechaza un destinatario que no es el vendedor del vehículo', async () => {
      await expect(
        service.sendMessage('buyer-1', { ...dto, receiver_id: 'otro-usuario' }),
      ).rejects.toThrow(ForbiddenException)
      expect(insertChain.insert).not.toHaveBeenCalled()
    })

    it('404 si el vehículo no existe', async () => {
      vehicleRow = null
      await expect(service.sendMessage('buyer-1', dto)).rejects.toThrow(NotFoundException)
    })

    it('404 si el aviso no está publicado', async () => {
      vehicleRow = { seller_id: 'seller-1', status: 'draft' }
      await expect(service.sendMessage('buyer-1', dto)).rejects.toThrow(NotFoundException)
    })

    it('el vendedor puede responder a quien le escribió por ese vehículo', async () => {
      priorMessages = 1
      await expect(
        service.sendMessage('seller-1', { ...dto, receiver_id: 'buyer-1' }),
      ).resolves.toMatchObject({ id: 'm1' })
    })

    it('el vendedor no puede escribirle a alguien que no le escribió', async () => {
      priorMessages = 0
      await expect(
        service.sendMessage('seller-1', { ...dto, receiver_id: 'buyer-1' }),
      ).rejects.toThrow(ForbiddenException)
      expect(insertChain.insert).not.toHaveBeenCalled()
    })

    it('lanza error si Supabase devuelve error al insertar', async () => {
      insertChain = buildChain({ data: null, error: { message: 'insert failed' } })
      await expect(service.sendMessage('buyer-1', dto)).rejects.toThrow('insert failed')
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
