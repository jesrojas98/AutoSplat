import { ExecutionContext, UnauthorizedException } from '@nestjs/common'
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard'

function setup(opts: { row: { role: string } | null; rowError?: unknown; metaRole?: string }) {
  const upsert = jest.fn().mockResolvedValue({ error: null })
  const supabase = {
    admin: {
      auth: {
        getUser: jest.fn().mockResolvedValue({
          data: { user: { id: 'u1', email: 'a@b.cl', user_metadata: { full_name: 'Ana', role: opts.metaRole } } },
          error: null,
        }),
      },
      from: jest.fn().mockReturnValue({
        select: () => ({ eq: () => ({ maybeSingle: () => Promise.resolve({ data: opts.row, error: opts.rowError ?? null }) }) }),
        upsert,
      }),
    },
  }
  const req: any = { headers: { authorization: 'Bearer tok' } }
  const ctx = { switchToHttp: () => ({ getRequest: () => req }) } as unknown as ExecutionContext
  return { guard: new JwtAuthGuard(supabase as any), ctx, req, upsert }
}

describe('JwtAuthGuard — rol', () => {
  it('usa el rol de la tabla users', async () => {
    const { guard, ctx, req, upsert } = setup({ row: { role: 'seller' }, metaRole: 'buyer' })
    await guard.canActivate(ctx)
    expect(req.user.role).toBe('seller')
    expect(upsert).not.toHaveBeenCalled()
  })

  it('sin fila en users crea la fila con el rol de registro (vendedor) en vez de dejarlo comprador', async () => {
    const { guard, ctx, req, upsert } = setup({ row: null, metaRole: 'seller' })
    await guard.canActivate(ctx)
    expect(req.user.role).toBe('seller')
    expect(upsert).toHaveBeenCalledWith(
      expect.objectContaining({ id: 'u1', role: 'seller' }),
      expect.objectContaining({ ignoreDuplicates: true }),
    )
  })

  it('sin fila y registrado como comprador crea la fila como comprador', async () => {
    const { guard, ctx, req, upsert } = setup({ row: null, metaRole: 'buyer' })
    await guard.canActivate(ctx)
    expect(req.user.role).toBe('buyer')
    expect(upsert).toHaveBeenCalledWith(expect.objectContaining({ role: 'buyer' }), expect.anything())
  })

  it('sin fila nunca se crea como admin aunque la metadata lo diga', async () => {
    const { guard, ctx, req, upsert } = setup({ row: null, metaRole: 'admin' })
    await guard.canActivate(ctx)
    expect(req.user.role).toBe('buyer')
    expect(upsert).not.toHaveBeenCalled()
  })

  it('sin fila y sin rol elegido (Google en /auth/role) no crea la fila: no le gana a la elección', async () => {
    const { guard, ctx, req, upsert } = setup({ row: null })
    await guard.canActivate(ctx)
    expect(req.user.role).toBe('buyer')
    expect(upsert).not.toHaveBeenCalled()
  })

  it('si falla la consulta del rol no escribe nada', async () => {
    const { guard, ctx, upsert } = setup({ row: null, rowError: { message: 'net' }, metaRole: 'seller' })
    await guard.canActivate(ctx)
    expect(upsert).not.toHaveBeenCalled()
  })

  it('rechaza sin token', async () => {
    const { guard, ctx, req } = setup({ row: null })
    req.headers = {}
    await expect(guard.canActivate(ctx)).rejects.toBeInstanceOf(UnauthorizedException)
  })
})
