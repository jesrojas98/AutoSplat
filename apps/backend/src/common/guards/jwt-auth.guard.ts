import { Injectable, CanActivate, ExecutionContext, UnauthorizedException } from '@nestjs/common'
import { SupabaseService } from '../../supabase/supabase.service'

type Role = 'buyer' | 'seller' | 'admin'

function normalizeRole(role: unknown): Role {
  return role === 'seller' || role === 'admin' ? role : 'buyer'
}

@Injectable()
export class JwtAuthGuard implements CanActivate {
  constructor(private supabase: SupabaseService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const req = context.switchToHttp().getRequest()
    const auth = req.headers.authorization as string | undefined

    if (!auth?.startsWith('Bearer ')) throw new UnauthorizedException()

    const token = auth.slice(7)

    // Validar contra los servidores de Supabase — no depende del JWT secret local
    const { data: { user }, error } = await this.supabase.admin.auth.getUser(token)

    if (error || !user) throw new UnauthorizedException()

    req.user = {
      id: user.id,
      email: user.email ?? '',
      role: normalizeRole(user.user_metadata?.role),
    }

    return true
  }
}
