import { Injectable, NotFoundException } from '@nestjs/common'
import { SupabaseService } from '../supabase/supabase.service'

@Injectable()
export class UsersService {
  constructor(private supabase: SupabaseService) {}

  async findById(id: string) {
    const { data, error } = await this.supabase.admin
      .from('users')
      .select('id, name, email, role, avatar_url, phone, created_at')
      .eq('id', id)
      .single()
    if (error || !data) throw new NotFoundException('Usuario no encontrado')
    return data
  }

  async updateProfile(id: string, dto: { name?: string; phone?: string; avatar_url?: string }) {
    const { data, error } = await this.supabase.admin
      .from('users')
      .update({ ...dto, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select('id, name, email, role, avatar_url, phone')
      .single()
    if (error) throw new Error(error.message)
    return data
  }
}
