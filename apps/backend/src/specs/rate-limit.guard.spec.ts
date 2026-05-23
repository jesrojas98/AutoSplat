import { ExecutionContext, HttpException } from '@nestjs/common'
import { Reflector } from '@nestjs/core'
import { RateLimitGuard, RateLimit, RATE_LIMIT_KEY } from '../common/guards/rate-limit.guard'

function buildContext(options: {
  ip?: string
  className?: string
  handlerName?: string
  metadata?: { limit: number; windowMs: number } | null
}): ExecutionContext {
  const {
    ip = '127.0.0.1',
    className = `TestController_${Math.random()}`,
    handlerName = `handler_${Math.random()}`,
    metadata = { limit: 3, windowMs: 60_000 },
  } = options

  const handler = jest.fn()
  Object.defineProperty(handler, 'name', { value: handlerName })

  const ctx = {
    switchToHttp: () => ({
      getRequest: () => ({
        headers: { 'x-forwarded-for': ip },
        socket: { remoteAddress: ip },
      }),
    }),
    getHandler: () => handler,
    getClass: () => {
      const cls = function () {}
      Object.defineProperty(cls, 'name', { value: className })
      return cls
    },
  } as unknown as ExecutionContext

  return ctx
}

describe('RateLimitGuard', () => {
  let guard: RateLimitGuard
  let reflector: Reflector

  beforeEach(() => {
    reflector = new Reflector()
    guard = new RateLimitGuard(reflector)
  })

  // ── sin metadata ──────────────────────────────────────────────────────────

  describe('sin decorador @RateLimit', () => {
    it('permite la petición cuando no hay metadata de rate limit', () => {
      jest.spyOn(reflector, 'get').mockReturnValue(undefined)
      const ctx = buildContext({ metadata: null })

      expect(guard.canActivate(ctx)).toBe(true)
    })
  })

  // ── dentro del límite ─────────────────────────────────────────────────────

  describe('dentro del límite permitido', () => {
    it('permite peticiones hasta alcanzar el límite', () => {
      const limit = 3
      const className = `TestClass_within_${Date.now()}`
      const handlerName = `testHandler_within_${Date.now()}`
      const options = { limit, windowMs: 60_000 }

      jest.spyOn(reflector, 'get').mockReturnValue(options)

      for (let i = 0; i < limit; i++) {
        const ctx = buildContext({ className, handlerName })
        expect(guard.canActivate(ctx)).toBe(true)
      }
    })

    it('permite la primera petición siempre', () => {
      jest.spyOn(reflector, 'get').mockReturnValue({ limit: 1, windowMs: 60_000 })
      const ctx = buildContext({
        className: `TestClass_first_${Date.now()}`,
        handlerName: `handler_first_${Date.now()}`,
      })

      expect(guard.canActivate(ctx)).toBe(true)
    })
  })

  // ── límite excedido ───────────────────────────────────────────────────────

  describe('límite excedido', () => {
    it('lanza HttpException 429 al exceder el límite', () => {
      const limit = 2
      const className = `TestClass_exceed_${Date.now()}`
      const handlerName = `handler_exceed_${Date.now()}`
      const options = { limit, windowMs: 60_000 }

      jest.spyOn(reflector, 'get').mockReturnValue(options)

      // Consume el límite
      for (let i = 0; i < limit; i++) {
        guard.canActivate(buildContext({ className, handlerName }))
      }

      // La siguiente debe fallar
      expect(() => guard.canActivate(buildContext({ className, handlerName }))).toThrow(HttpException)
    })

    it('lanza 429 con el mensaje correcto', () => {
      const className = `TestClass_msg_${Date.now()}`
      const handlerName = `handler_msg_${Date.now()}`
      const options = { limit: 1, windowMs: 60_000 }

      jest.spyOn(reflector, 'get').mockReturnValue(options)
      guard.canActivate(buildContext({ className, handlerName })) // consume límite

      try {
        guard.canActivate(buildContext({ className, handlerName }))
        fail('Debería haber lanzado HttpException')
      } catch (e: any) {
        expect(e.getStatus()).toBe(429)
        expect(e.getResponse().message).toMatch(/Demasiadas solicitudes/)
      }
    })
  })

  // ── aislamiento por IP ────────────────────────────────────────────────────

  describe('aislamiento por IP', () => {
    it('distintas IPs tienen contadores independientes', () => {
      const className = `TestClass_ip_${Date.now()}`
      const handlerName = `handler_ip_${Date.now()}`
      const options = { limit: 1, windowMs: 60_000 }

      jest.spyOn(reflector, 'get').mockReturnValue(options)

      // IP A consume su límite
      guard.canActivate(buildContext({ ip: '192.168.1.1', className, handlerName }))

      // IP B aún puede pasar
      expect(guard.canActivate(buildContext({ ip: '192.168.1.2', className, handlerName }))).toBe(true)
    })

    it('IP que excedió límite no bloquea a otra IP', () => {
      const className = `TestClass_iso_${Date.now()}`
      const handlerName = `handler_iso_${Date.now()}`
      const options = { limit: 1, windowMs: 60_000 }

      jest.spyOn(reflector, 'get').mockReturnValue(options)

      // IP A: consume y excede
      guard.canActivate(buildContext({ ip: '10.0.0.1', className, handlerName }))
      expect(() =>
        guard.canActivate(buildContext({ ip: '10.0.0.1', className, handlerName })),
      ).toThrow(HttpException)

      // IP B: sigue libre
      expect(guard.canActivate(buildContext({ ip: '10.0.0.2', className, handlerName }))).toBe(true)
    })
  })

  // ── aislamiento por handler ───────────────────────────────────────────────

  describe('aislamiento por handler', () => {
    it('distintos handlers tienen contadores independientes', () => {
      const className = `TestClass_handler_${Date.now()}`
      const options = { limit: 1, windowMs: 60_000 }

      jest.spyOn(reflector, 'get').mockReturnValue(options)

      // Handler A consume su límite
      guard.canActivate(buildContext({ className, handlerName: `handlerA_${Date.now()}` }))

      // Handler B aún puede
      expect(guard.canActivate(buildContext({ className, handlerName: `handlerB_${Date.now()}` }))).toBe(true)
    })
  })

  // ── ventana de tiempo ─────────────────────────────────────────────────────

  describe('ventana de tiempo', () => {
    it('reinicia el contador cuando la ventana expira', () => {
      const className = `TestClass_window_${Date.now()}`
      const handlerName = `handler_window_${Date.now()}`
      const options = { limit: 1, windowMs: 100 }

      jest.spyOn(reflector, 'get').mockReturnValue(options)

      // Consume el límite
      guard.canActivate(buildContext({ className, handlerName }))

      // Simula que el tiempo avanzó más allá del windowMs
      jest.spyOn(Date, 'now').mockReturnValue(Date.now() + 200)

      // Ahora debería poder pasar
      expect(guard.canActivate(buildContext({ className, handlerName }))).toBe(true)

      jest.restoreAllMocks()
    })
  })

  // ── extrae IP correctamente ───────────────────────────────────────────────

  describe('extracción de IP', () => {
    it('usa x-forwarded-for cuando está disponible', () => {
      const className = `TestClass_fwd_${Date.now()}`
      const handlerName = `handler_fwd_${Date.now()}`

      jest.spyOn(reflector, 'get').mockReturnValue({ limit: 1, windowMs: 60_000 })

      const ctx = {
        switchToHttp: () => ({
          getRequest: () => ({
            headers: { 'x-forwarded-for': '203.0.113.1, 10.0.0.1' }, // proxy chain
            socket: { remoteAddress: '10.0.0.1' },
          }),
        }),
        getHandler: () => { const fn = jest.fn(); Object.defineProperty(fn, 'name', { value: handlerName }); return fn },
        getClass: () => { const c = function () {}; Object.defineProperty(c, 'name', { value: className }); return c },
      } as unknown as ExecutionContext

      // Solo verifica que no lanza (la IP es extraída correctamente y la petición pasa)
      expect(guard.canActivate(ctx)).toBe(true)
    })
  })
})

// ── decorador @RateLimit ──────────────────────────────────────────────────────

describe('@RateLimit decorator', () => {
  it('define metadata en el método decorado', () => {
    class TestController {
      @RateLimit(5, 60_000)
      login() {}
    }

    const meta = Reflect.getMetadata(RATE_LIMIT_KEY, TestController.prototype.login)
    expect(meta).toEqual({ limit: 5, windowMs: 60_000 })
  })

  it('define metadata en la clase cuando se aplica al constructor', () => {
    @RateLimit(10, 30_000)
    class TestController {}

    const meta = Reflect.getMetadata(RATE_LIMIT_KEY, TestController)
    expect(meta).toEqual({ limit: 10, windowMs: 30_000 })
  })
})
