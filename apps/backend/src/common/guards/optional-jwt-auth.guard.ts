import { Injectable, ExecutionContext } from '@nestjs/common'
import { JwtAuthGuard } from './jwt-auth.guard'
import { SupabaseService } from '../../supabase/supabase.service'

/**
 * Para rutas públicas que se comportan distinto con sesión (p. ej. el dueño ve sus borradores):
 * si hay un token válido puebla req.user; si no hay o es inválido, deja pasar como anónimo.
 */
@Injectable()
export class OptionalJwtAuthGuard extends JwtAuthGuard {
  constructor(supabase: SupabaseService) {
    super(supabase)
  }

  async canActivate(context: ExecutionContext): Promise<boolean> {
    try {
      return await super.canActivate(context)
    } catch {
      return true
    }
  }
}
