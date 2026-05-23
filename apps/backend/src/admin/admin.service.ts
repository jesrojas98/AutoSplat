import { Injectable, NotFoundException } from '@nestjs/common'
import { SupabaseService } from '../supabase/supabase.service'

type Role = 'buyer' | 'seller' | 'admin'

function normalizeRole(role: unknown): Role {
  return role === 'seller' || role === 'admin' ? role : 'buyer'
}

@Injectable()
export class AdminService {
  constructor(private supabase: SupabaseService) {}

  async listUsers() {
    // Fuente de verdad: Supabase Auth (service role) — incluye OAuth users aunque no estén en la tabla users
    const { data: authData, error: authError } = await this.supabase.admin.auth.admin.listUsers({ perPage: 1000 })
    if (authError) throw new Error(authError.message)

    // Roles y nombres desde la tabla users (puede estar incompleta)
    const { data: dbUsers } = await this.supabase.admin
      .from('users')
      .select('id, role, name, avatar_url, created_at')
    const dbMap = new Map((dbUsers ?? []).map((u) => [u.id, u]))

    return authData.users.map((u) => {
      const db = dbMap.get(u.id)
      return {
        id: u.id,
        email: u.email ?? '',
        name: db?.name ?? u.user_metadata?.full_name ?? u.email?.split('@')[0] ?? 'Sin nombre',
        role: normalizeRole(db?.role ?? u.user_metadata?.role),
        avatar_url: db?.avatar_url ?? u.user_metadata?.avatar_url ?? null,
        created_at: u.created_at,
      }
    }).sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
  }

  async updateRole(targetId: string, role: 'buyer' | 'seller' | 'admin') {
    // Obtener datos del usuario de Auth
    const { data: authUser, error: authErr } = await this.supabase.admin.auth.admin.getUserById(targetId)
    if (authErr || !authUser.user) throw new NotFoundException('Usuario no encontrado')

    const u = authUser.user
    // Upsert en tabla users (por si no tiene fila aún)
    await this.supabase.admin.from('users').upsert({
      id: targetId,
      email: u.email ?? '',
      name: u.user_metadata?.full_name ?? u.email?.split('@')[0] ?? 'Sin nombre',
      password_hash: '',
      role,
    })

    // Sincronizar en user_metadata de Supabase Auth
    await this.supabase.admin.auth.admin.updateUserById(targetId, {
      user_metadata: { ...u.user_metadata, role },
    })

    return { id: targetId, email: u.email, role }
  }

  async deleteUser(targetId: string) {
    // Eliminar de Supabase Auth (cascada elimina la fila de users por FK)
    const { error } = await this.supabase.admin.auth.admin.deleteUser(targetId)
    if (error) throw new NotFoundException('Usuario no encontrado o ya eliminado')
    return { ok: true }
  }
}
