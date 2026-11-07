import { ForbiddenException, NotFoundException, BadRequestException, ValidationPipe } from '@nestjs/common'
import { AdminService } from '../admin/admin.service'
import { UpdateRoleDto } from '../admin/dto/update-role.dto'

describe('AdminService — roles y borrado', () => {
  let service: AdminService
  let upsert: jest.Mock
  let updateUserById: jest.Mock
  let deleteUser: jest.Mock
  let authUser: any

  beforeEach(() => {
    authUser = { id: 'target', email: 't@x.cl', user_metadata: { full_name: 'Target', avatar_url: 'a' } }
    upsert = jest.fn().mockResolvedValue({ error: null })
    updateUserById = jest.fn().mockResolvedValue({ error: null })
    deleteUser = jest.fn().mockResolvedValue({ error: null })

    const supabase = {
      admin: {
        from: jest.fn(() => ({ upsert })),
        auth: {
          admin: {
            getUserById: jest.fn().mockImplementation(async () => (authUser ? { data: { user: authUser }, error: null } : { data: { user: null }, error: { message: 'x' } })),
            updateUserById,
            deleteUser,
          },
        },
      },
    }
    service = new AdminService(supabase as any)
  })

  describe('updateRole()', () => {
    it('cambia el rol en la tabla users y lo sincroniza en Auth', async () => {
      const res = await service.updateRole('admin-1', 'target', 'seller')
      expect(upsert).toHaveBeenCalledWith(expect.objectContaining({ id: 'target', role: 'seller' }))
      expect(updateUserById).toHaveBeenCalledWith('target', { user_metadata: expect.objectContaining({ role: 'seller', avatar_url: 'a' }) })
      expect(res).toMatchObject({ id: 'target', role: 'seller' })
    })

    it('un admin no puede quitarse su propio rol', async () => {
      await expect(service.updateRole('admin-1', 'admin-1', 'buyer')).rejects.toThrow(ForbiddenException)
      expect(upsert).not.toHaveBeenCalled()
    })

    it('un admin sí puede "cambiarse" a admin (sin efecto)', async () => {
      await expect(service.updateRole('admin-1', 'admin-1', 'admin')).resolves.toMatchObject({ role: 'admin' })
    })

    it('404 si el usuario no existe', async () => {
      authUser = null
      await expect(service.updateRole('admin-1', 'target', 'buyer')).rejects.toThrow(NotFoundException)
    })

    it('falla (y no sincroniza Auth) si no se pudo guardar en la tabla users', async () => {
      upsert.mockResolvedValue({ error: { message: 'db error' } })
      await expect(service.updateRole('admin-1', 'target', 'buyer')).rejects.toThrow('db error')
      expect(updateUserById).not.toHaveBeenCalled()
    })

    it('falla si no se pudo sincronizar el rol en Auth', async () => {
      updateUserById.mockResolvedValue({ error: { message: 'auth error' } })
      await expect(service.updateRole('admin-1', 'target', 'buyer')).rejects.toThrow('auth error')
    })
  })

  describe('deleteUser()', () => {
    it('elimina a otro usuario', async () => {
      await expect(service.deleteUser('admin-1', 'target')).resolves.toEqual({ ok: true })
      expect(deleteUser).toHaveBeenCalledWith('target')
    })

    it('un admin no puede eliminar su propia cuenta', async () => {
      await expect(service.deleteUser('admin-1', 'admin-1')).rejects.toThrow(ForbiddenException)
      expect(deleteUser).not.toHaveBeenCalled()
    })

    it('404 si Auth no lo encuentra', async () => {
      deleteUser.mockResolvedValue({ error: { message: 'not found' } })
      await expect(service.deleteUser('admin-1', 'target')).rejects.toThrow(NotFoundException)
    })
  })
})

describe('UpdateRoleDto', () => {
  const pipe = new ValidationPipe({ whitelist: true, transform: true, forbidNonWhitelisted: true })
  const run = (body: unknown) => pipe.transform(body, { type: 'body', metatype: UpdateRoleDto })

  it.each(['buyer', 'seller', 'admin'])('acepta el rol %s', async (role) => {
    await expect(run({ role })).resolves.toMatchObject({ role })
  })

  it.each([{ role: 'superuser' }, { role: '' }, {}, { role: 'admin', extra: 1 }])('rechaza %j', async (body) => {
    await expect(run(body)).rejects.toBeInstanceOf(BadRequestException)
  })
})
