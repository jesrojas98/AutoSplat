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

    // user_metadata lo puede editar el propio usuario con auth.updateUser, así que el rol
    // se lee de la tabla users (la misma fuente que usa AdminGuard).
    const { data: row, error: rowError } = await this.supabase.admin
      .from('users')
      .select('role')
      .eq('id', user.id)
      .maybeSingle()

    let role = normalizeRole(row?.role)

    // Sin fila en users (p. ej. registro por email con confirmación pendiente: el insert del
    // frontend corre sin sesión y RLS lo rechaza) el usuario quedaba como "buyer" aunque se
    // hubiera registrado como vendedor. Se crea la fila con el rol que eligió al registrarse;
    // solo buyer/seller (el insert propio ya lo permite RLS), nunca admin.
    //
    // Si todavía no eligió rol (cuenta nueva de Google que está en /auth/role) NO se crea la
    // fila: la barra de navegación llama a la API mientras se muestra esa pantalla, y crear
    // aquí un "buyer" le ganaba a la elección (y el trigger impide cambiar el rol después).
    // Mientras tanto se le trata como comprador sin persistir nada.
    if (!row && !rowError) {
      const metaRole = user.user_metadata?.role
      role = 'buyer'
      if (metaRole === 'buyer' || metaRole === 'seller') {
        role = metaRole
        await this.supabase.admin.from('users').upsert(
          {
            id: user.id,
            email: user.email ?? '',
            name: user.user_metadata?.full_name ?? user.user_metadata?.name ?? user.email?.split('@')[0] ?? 'Sin nombre',
            password_hash: '',
            role,
          },
          { onConflict: 'id', ignoreDuplicates: true },
        )
      }
    }

    req.user = {
      id: user.id,
      email: user.email ?? '',
      role,
    }

    return true
  }
}
