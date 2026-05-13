import { Injectable } from '@nestjs/common'
import { SupabaseService } from '../supabase/supabase.service'

@Injectable()
export class NotificationsService {
  constructor(private supabase: SupabaseService) {}

  async getAll(userId: string) {
    const { data, error } = await this.supabase.admin
      .from('notifications')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(50)
    if (error) throw new Error(error.message)
    return data ?? []
  }

  async getUnreadCount(userId: string) {
    const { count, error } = await this.supabase.admin
      .from('notifications')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId)
      .is('read_at', null)
    if (error) throw new Error(error.message)
    return { count: count ?? 0 }
  }

  async markRead(notificationId: string, userId: string) {
    const { data, error } = await this.supabase.admin
      .from('notifications')
      .update({ read_at: new Date().toISOString() })
      .eq('id', notificationId)
      .eq('user_id', userId)
      .select()
      .single()
    if (error) throw new Error(error.message)
    return data
  }

  async markAllRead(userId: string) {
    const { error } = await this.supabase.admin
      .from('notifications')
      .update({ read_at: new Date().toISOString() })
      .eq('user_id', userId)
      .is('read_at', null)
    if (error) throw new Error(error.message)
    return { success: true }
  }
}
