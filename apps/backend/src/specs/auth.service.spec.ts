import { Test, TestingModule } from '@nestjs/testing'
import { ConflictException, UnauthorizedException } from '@nestjs/common'
import { JwtService } from '@nestjs/jwt'
import { AuthService } from '../auth/auth.service'
import { UsersService } from '../users/users.service'

jest.mock('bcryptjs', () => ({
  hash: jest.fn().mockResolvedValue('hashed_password'),
  compare: jest.fn().mockResolvedValue(true),
}))

import * as bcrypt from 'bcryptjs'

const mockUser = {
  id: 'user-uuid-1',
  name: 'Test User',
  email: 'test@example.com',
  role: 'buyer',
  avatar_url: null,
  password_hash: 'hashed_password',
}

describe('AuthService', () => {
  let service: AuthService
  let usersService: jest.Mocked<UsersService>
  let jwtService: jest.Mocked<JwtService>

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        {
          provide: UsersService,
          useValue: {
            findByEmail: jest.fn(),
            findByEmailWithPassword: jest.fn(),
            create: jest.fn(),
          },
        },
        {
          provide: JwtService,
          useValue: { sign: jest.fn().mockReturnValue('mock.jwt.token') },
        },
      ],
    }).compile()

    service = module.get(AuthService)
    usersService = module.get(UsersService)
    jwtService = module.get(JwtService)
  })

  // ── register ──────────────────────────────────────────────────────────────

  describe('register()', () => {
    const dto = { name: 'Test User', email: 'test@example.com', password: 'password123', role: 'buyer' as any }

    it('lanza ConflictException si el email ya existe', async () => {
      usersService.findByEmail.mockResolvedValue(mockUser as any)
      await expect(service.register(dto)).rejects.toThrow(ConflictException)
    })

    it('lanza ConflictException con el mensaje correcto', async () => {
      usersService.findByEmail.mockResolvedValue(mockUser as any)
      await expect(service.register(dto)).rejects.toThrow('El correo ya está registrado')
    })

    it('crea usuario y retorna token cuando el email no existe', async () => {
      usersService.findByEmail.mockResolvedValue(null)
      usersService.create.mockResolvedValue(mockUser as any)

      const result = await service.register(dto)

      expect(usersService.create).toHaveBeenCalledTimes(1)
      expect(result).toHaveProperty('access_token', 'mock.jwt.token')
      expect(result.user).toMatchObject({ id: mockUser.id, email: mockUser.email })
    })

    it('hashea la contraseña antes de crear el usuario', async () => {
      usersService.findByEmail.mockResolvedValue(null)
      usersService.create.mockResolvedValue(mockUser as any)

      await service.register(dto)

      expect(bcrypt.hash).toHaveBeenCalledWith(dto.password, 10)
    })

    it('no incluye password_hash en la respuesta', async () => {
      usersService.findByEmail.mockResolvedValue(null)
      usersService.create.mockResolvedValue(mockUser as any)

      const result = await service.register(dto)

      expect(result.user).not.toHaveProperty('password_hash')
    })
  })

  // ── login ─────────────────────────────────────────────────────────────────

  describe('login()', () => {
    const dto = { email: 'test@example.com', password: 'password123' }

    it('lanza UnauthorizedException si el usuario no existe', async () => {
      usersService.findByEmailWithPassword.mockResolvedValue(null)
      await expect(service.login(dto)).rejects.toThrow(UnauthorizedException)
    })

    it('lanza UnauthorizedException si la contraseña es incorrecta', async () => {
      usersService.findByEmailWithPassword.mockResolvedValue(mockUser as any)
      ;(bcrypt.compare as jest.Mock).mockResolvedValueOnce(false)
      await expect(service.login(dto)).rejects.toThrow(UnauthorizedException)
    })

    it('lanza UnauthorizedException con el mensaje correcto', async () => {
      usersService.findByEmailWithPassword.mockResolvedValue(null)
      await expect(service.login(dto)).rejects.toThrow('Credenciales incorrectas')
    })

    it('retorna token y datos del usuario cuando las credenciales son válidas', async () => {
      usersService.findByEmailWithPassword.mockResolvedValue(mockUser as any)
      // bcrypt.compare ya está mockeado a true por defecto
      const result = await service.login(dto)

      expect(result).toHaveProperty('access_token', 'mock.jwt.token')
      expect(result.user).toMatchObject({ id: mockUser.id, email: mockUser.email, role: mockUser.role })
    })

    it('firma el JWT con sub, email y role correctos', async () => {
      usersService.findByEmailWithPassword.mockResolvedValue(mockUser as any)

      await service.login(dto)

      expect(jwtService.sign).toHaveBeenCalledWith({
        sub: mockUser.id,
        email: mockUser.email,
        role: mockUser.role,
      })
    })

    it('no incluye password_hash en la respuesta', async () => {
      usersService.findByEmailWithPassword.mockResolvedValue(mockUser as any)

      const result = await service.login(dto)

      expect(result.user).not.toHaveProperty('password_hash')
    })
  })
})
