import { Injectable, NotFoundException } from '@nestjs/common'
import { SupabaseService } from '../supabase/supabase.service'

@Injectable()
export class UsersService {
  constructor(private supabase: SupabaseService) {}

  async findByEmail(email: string) {
    const { data } = await this.supabase.admin
      .from('users')
      .select('id, name, email, role, avatar_url')
      .eq('email', email)
      .single()
    return data
  }

  async findByEmailWithPassword(email: string) {
    const { data } = await this.supabase.admin
      .from('users')
      .select('id, name, email, role, avatar_url, password_hash')
      .eq('email', email)
      .single()
    return data
  }

  async findById(id: string) {
    const { data, error } = await this.supabase.admin
      .from('users')
      .select('id, name, email, role, avatar_url, phone, created_at')
      .eq('id', id)
      .single()
    if (error || !data) throw new NotFoundException('Usuario no encontrado')
    return data
  }

  async create(data: { name: string; email: string; password: string }) {
    const { data: user, error } = await this.supabase.admin
      .from('users')
      .insert({
        name: data.name,
        email: data.email,
        password_hash: data.password,
        role: 'seller',
      })
      .select('id, name, email, role, avatar_url')
      .single()
    if (error) throw new Error(error.message)
    return user
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
