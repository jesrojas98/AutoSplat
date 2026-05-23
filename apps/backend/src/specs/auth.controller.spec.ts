import { Test, TestingModule } from '@nestjs/testing'
import { ConflictException, UnauthorizedException } from '@nestjs/common'
import { AuthController } from '../auth/auth.controller'
import { AuthService } from '../auth/auth.service'
import { RateLimitGuard } from '../common/guards/rate-limit.guard'
import { Reflector } from '@nestjs/core'

const mockTokenResponse = {
  access_token: 'mock.jwt.token',
  user: { id: 'u1', name: 'Test', email: 'test@example.com', role: 'buyer', avatar_url: null },
}

describe('AuthController', () => {
  let controller: AuthController
  let authService: jest.Mocked<AuthService>

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AuthController],
      providers: [
        {
          provide: AuthService,
          useValue: {
            register: jest.fn(),
            login: jest.fn(),
          },
        },
        Reflector,
        RateLimitGuard,
      ],
    })
      .overrideGuard(RateLimitGuard)
      .useValue({ canActivate: () => true })
      .compile()

    controller = module.get(AuthController)
    authService = module.get(AuthService)
  })

  // ── register ──────────────────────────────────────────────────────────────

  describe('register()', () => {
    const dto = { name: 'Test', email: 'test@example.com', password: 'Pass123', role: 'buyer' as any }

    it('retorna token y usuario al registrar exitosamente', async () => {
      authService.register.mockResolvedValue(mockTokenResponse)

      const result = await controller.register(dto)

      expect(result).toEqual(mockTokenResponse)
    })

    it('delega al AuthService', async () => {
      authService.register.mockResolvedValue(mockTokenResponse)

      await controller.register(dto)

      expect(authService.register).toHaveBeenCalledWith(dto)
    })

    it('propaga ConflictException cuando el email ya existe', async () => {
      authService.register.mockRejectedValue(new ConflictException('El correo ya está registrado'))

      await expect(controller.register(dto)).rejects.toThrow(ConflictException)
    })
  })

  // ── login ─────────────────────────────────────────────────────────────────

  describe('login()', () => {
    const dto = { email: 'test@example.com', password: 'Pass123' }

    it('retorna token y usuario al hacer login exitosamente', async () => {
      authService.login.mockResolvedValue(mockTokenResponse)

      const result = await controller.login(dto)

      expect(result).toEqual(mockTokenResponse)
    })

    it('delega al AuthService', async () => {
      authService.login.mockResolvedValue(mockTokenResponse)

      await controller.login(dto)

      expect(authService.login).toHaveBeenCalledWith(dto)
    })

    it('propaga UnauthorizedException cuando las credenciales son incorrectas', async () => {
      authService.login.mockRejectedValue(new UnauthorizedException('Credenciales incorrectas'))

      await expect(controller.login(dto)).rejects.toThrow(UnauthorizedException)
    })
  })
})
