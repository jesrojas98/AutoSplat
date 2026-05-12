import { Injectable } from '@nestjs/common'
import { SupabaseService } from '../supabase/supabase.service'

@Injectable()
export class MessagesService {
  constructor(private supabase: SupabaseService) {}

  async getConversations(userId: string) {
    const { data, error } = await this.supabase.admin
      .from('messages')
      .select(`
        id, content, created_at, read_at,
        sender:users!sender_id(id, name, avatar_url),
        receiver:users!receiver_id(id, name, avatar_url),
        vehicle:vehicles(id, brand, model, year)
      `)
      .or(`sender_id.eq.${userId},receiver_id.eq.${userId}`)
      .order('created_at', { ascending: false })
    if (error) throw new Error(error.message)
    return data ?? []
  }

  async sendMessage(senderId: string, dto: { receiver_id: string; vehicle_id: string; content: string }) {
    const { data, error } = await this.supabase.admin
      .from('messages')
      .insert({ sender_id: senderId, ...dto })
      .select()
      .single()
    if (error) throw new Error(error.message)
    return data
  }

  async markRead(messageId: string, userId: string) {
    const { data, error } = await this.supabase.admin
      .from('messages')
      .update({ read_at: new Date().toISOString() })
      .eq('id', messageId)
      .eq('receiver_id', userId)
      .select()
      .single()
    if (error) throw new Error(error.message)
    return data
  }
}
