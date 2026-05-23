import { Injectable, CanActivate, ExecutionContext, ForbiddenException } from '@nestjs/common'
import { SupabaseService } from '../../supabase/supabase.service'

@Injectable()
export class AdminGuard implements CanActivate {
  constructor(private supabase: SupabaseService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const req = context.switchToHttp().getRequest()
    const user = req.user
    if (!user?.id) throw new ForbiddenException('Sin acceso')

    const { data } = await this.supabase.admin
      .from('users')
      .select('role')
      .eq('id', user.id)
      .single()

    if (data?.role !== 'admin') throw new ForbiddenException('Requiere rol admin')
    return true
  }
}
