import { Test, TestingModule } from '@nestjs/testing'
import { NotFoundException } from '@nestjs/common'
import { UsersService } from '../users/users.service'
import { SupabaseService } from '../supabase/supabase.service'

function buildChain(result: { data?: any; error?: any; count?: any } = {}) {
  const r = { data: null, error: null, count: null, ...result }
  const chain: any = {}
  for (const m of ['select', 'insert', 'update', 'eq', 'is', 'order', 'limit']) {
    chain[m] = jest.fn().mockReturnValue(chain)
  }
  chain.single = jest.fn().mockResolvedValue(r)
  chain.then = (res: any, rej: any) => Promise.resolve(r).then(res, rej)
  return chain
}

describe('UsersService', () => {
  let service: UsersService
  let supabase: { admin: { from: jest.Mock }; client: { from: jest.Mock } }

  beforeEach(async () => {
    supabase = { admin: { from: jest.fn() }, client: { from: jest.fn() } }

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UsersService,
        { provide: SupabaseService, useValue: supabase },
      ],
    }).compile()

    service = module.get(UsersService)
  })

  // ── findByEmail ───────────────────────────────────────────────────────────

  describe('findByEmail()', () => {
    it('retorna el usuario cuando existe', async () => {
      const user = { id: 'u1', email: 'a@b.com', name: 'Ana', role: 'buyer', avatar_url: null }
      supabase.admin.from.mockReturnValue(buildChain({ data: user }))

      const result = await service.findByEmail('a@b.com')

      expect(result).toEqual(user)
    })

    it('retorna null cuando el usuario no existe', async () => {
      supabase.admin.from.mockReturnValue(buildChain({ data: null }))

      const result = await service.findByEmail('noexiste@b.com')

      expect(result).toBeNull()
    })
  })

  // ── findByEmailWithPassword ───────────────────────────────────────────────

  describe('findByEmailWithPassword()', () => {
    it('retorna el usuario con password_hash', async () => {
      const user = { id: 'u1', email: 'a@b.com', password_hash: 'hash123' }
      supabase.admin.from.mockReturnValue(buildChain({ data: user }))

      const result = await service.findByEmailWithPassword('a@b.com')

      expect(result).toHaveProperty('password_hash', 'hash123')
    })
  })

  // ── findById ──────────────────────────────────────────────────────────────

  describe('findById()', () => {
    it('retorna el usuario cuando existe', async () => {
      const user = { id: 'u1', name: 'Ana', email: 'a@b.com', role: 'buyer', avatar_url: null }
      supabase.admin.from.mockReturnValue(buildChain({ data: user }))

      const result = await service.findById('u1')

      expect(result).toEqual(user)
    })

    it('lanza NotFoundException cuando el usuario no existe', async () => {
      supabase.admin.from.mockReturnValue(buildChain({ data: null, error: { message: 'not found' } }))

      await expect(service.findById('unknown')).rejects.toThrow(NotFoundException)
    })

    it('lanza NotFoundException con mensaje correcto', async () => {
      supabase.admin.from.mockReturnValue(buildChain({ data: null, error: { message: 'not found' } }))

      await expect(service.findById('unknown')).rejects.toThrow('Usuario no encontrado')
    })
  })

  // ── create ────────────────────────────────────────────────────────────────

  describe('create()', () => {
    it('crea un usuario y lo retorna', async () => {
      const newUser = { id: 'u2', name: 'Bob', email: 'b@c.com', role: 'seller', avatar_url: null }
      supabase.admin.from.mockReturnValue(buildChain({ data: newUser }))

      const result = await service.create({ name: 'Bob', email: 'b@c.com', password: 'hashedpw' })

      expect(result).toEqual(newUser)
    })

    it('asigna rol seller por defecto', async () => {
      const chain = buildChain({ data: { id: 'u2', role: 'seller' } })
      supabase.admin.from.mockReturnValue(chain)

      await service.create({ name: 'Bob', email: 'b@c.com', password: 'hashedpw' })

      expect(chain.insert).toHaveBeenCalledWith(
        expect.objectContaining({ role: 'seller' }),
      )
    })

    it('lanza un error si Supabase devuelve error', async () => {
      supabase.admin.from.mockReturnValue(
        buildChain({ data: null, error: { message: 'duplicate key' } }),
      )

      await expect(
        service.create({ name: 'Bob', email: 'b@c.com', password: 'pw' }),
      ).rejects.toThrow('duplicate key')
    })
  })

  // ── updateProfile ─────────────────────────────────────────────────────────

  describe('updateProfile()', () => {
    it('actualiza y retorna el perfil del usuario', async () => {
      const updated = { id: 'u1', name: 'Nuevo Nombre', phone: '+56999' }
      supabase.admin.from.mockReturnValue(buildChain({ data: updated }))

      const result = await service.updateProfile('u1', { name: 'Nuevo Nombre', phone: '+56999' })

      expect(result).toEqual(updated)
    })

    it('incluye updated_at en la actualización', async () => {
      const chain = buildChain({ data: { id: 'u1' } })
      supabase.admin.from.mockReturnValue(chain)

      await service.updateProfile('u1', { name: 'Test' })

      expect(chain.update).toHaveBeenCalledWith(
        expect.objectContaining({ updated_at: expect.any(String) }),
      )
    })

    it('lanza error si Supabase devuelve error', async () => {
      supabase.admin.from.mockReturnValue(buildChain({ data: null, error: { message: 'update failed' } }))

      await expect(service.updateProfile('u1', {})).rejects.toThrow('update failed')
    })
  })
})
