import { Injectable, BadRequestException, ForbiddenException, NotFoundException } from '@nestjs/common'
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
    await this.assertCanMessage(senderId, dto)

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

  /**
   * Los mensajes son entre un interesado y el vendedor del vehículo: el comprador solo le escribe
   * al vendedor (de un aviso publicado) y el vendedor solo responde a quien ya le escribió.
   */
  private async assertCanMessage(senderId: string, dto: { receiver_id: string; vehicle_id: string }) {
    if (senderId === dto.receiver_id) throw new BadRequestException('No puedes enviarte un mensaje a ti mismo')

    const { data: vehicle } = await this.supabase.admin
      .from('vehicles')
      .select('seller_id, status')
      .eq('id', dto.vehicle_id)
      .maybeSingle()
    if (!vehicle) throw new NotFoundException('Vehículo no encontrado')

    if (dto.receiver_id === vehicle.seller_id) {
      if (vehicle.status !== 'published') throw new NotFoundException('Vehículo no encontrado')
      return
    }

    if (senderId === vehicle.seller_id) {
      const { count } = await this.supabase.admin
        .from('messages')
        .select('id', { count: 'exact', head: true })
        .eq('vehicle_id', dto.vehicle_id)
        .eq('sender_id', dto.receiver_id)
        .eq('receiver_id', senderId)
      if (!count) throw new ForbiddenException('Solo puedes responder a quien te escribió por este vehículo')
      return
    }

    throw new ForbiddenException('Solo puedes escribirle al vendedor del vehículo')
  }
}
