import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common'
import { SupabaseService } from '../supabase/supabase.service'

import type { Role } from './dto/update-role.dto'

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

  async updateRole(actorId: string, targetId: string, role: Role) {
    // Un admin no se quita el rol a sí mismo: evita quedarse sin administradores por un clic
    if (actorId === targetId && role !== 'admin') {
      throw new ForbiddenException('No puedes quitarte tu propio rol de administrador')
    }

    // Obtener datos del usuario de Auth
    const { data: authUser, error: authErr } = await this.supabase.admin.auth.admin.getUserById(targetId)
    if (authErr || !authUser.user) throw new NotFoundException('Usuario no encontrado')

    const u = authUser.user
    // La tabla users es la fuente de verdad del rol (upsert por si no tiene fila aún)
    const { error: dbError } = await this.supabase.admin.from('users').upsert({
      id: targetId,
      email: u.email ?? '',
      name: u.user_metadata?.full_name ?? u.email?.split('@')[0] ?? 'Sin nombre',
      password_hash: '',
      role,
    })
    if (dbError) throw new Error(dbError.message)

    // Sincronizar en user_metadata de Supabase Auth
    const { error: metaError } = await this.supabase.admin.auth.admin.updateUserById(targetId, {
      user_metadata: { ...u.user_metadata, role },
    })
    if (metaError) throw new Error(metaError.message)

    return { id: targetId, email: u.email, role }
  }

  async deleteUser(actorId: string, targetId: string) {
    if (actorId === targetId) throw new ForbiddenException('No puedes eliminar tu propia cuenta desde el panel')

    // Eliminar de Supabase Auth (cascada elimina la fila de users por FK)
    const { error } = await this.supabase.admin.auth.admin.deleteUser(targetId)
    if (error) throw new NotFoundException('Usuario no encontrado o ya eliminado')
    return { ok: true }
  }

  async listVehicles() {
    const { data, error } = await this.supabase.admin
      .from('vehicles')
      .select(`
        id, brand, model, year, price, mileage, location, status,
        has_3d_model, views_count, created_at, seller_id,
        vehicle_images(id, image_url, thumbnail_url, image_type, sort_order)
      `)
      .order('created_at', { ascending: false })
    if (error) throw new Error(error.message)
    return data ?? []
  }
}
