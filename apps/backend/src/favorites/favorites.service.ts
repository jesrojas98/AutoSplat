import { Injectable, ConflictException } from '@nestjs/common'
import { SupabaseService } from '../supabase/supabase.service'

@Injectable()
export class FavoritesService {
  constructor(private supabase: SupabaseService) {}

  async findByUser(userId: string) {
    const { data, error } = await this.supabase.admin
      .from('favorites')
      .select(`
        id, created_at,
        vehicle:vehicles(
          id, brand, model, year, price, mileage, status, has_3d_model,
          vehicle_images(image_url, thumbnail_url, image_type, sort_order)
        )
      `)
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
    if (error) throw new Error(error.message)
    return data ?? []
  }

  async toggle(userId: string, vehicleId: string) {
    const { data: existing } = await this.supabase.admin
      .from('favorites')
      .select('id')
      .eq('user_id', userId)
      .eq('vehicle_id', vehicleId)
      .single()

    if (existing) {
      await this.supabase.admin.from('favorites').delete().eq('id', existing.id)
      return { saved: false }
    }

    await this.supabase.admin.from('favorites').insert({ user_id: userId, vehicle_id: vehicleId })
    return { saved: true }
  }

  async isSaved(userId: string, vehicleId: string) {
    const { data } = await this.supabase.admin
      .from('favorites')
      .select('id')
      .eq('user_id', userId)
      .eq('vehicle_id', vehicleId)
      .single()
    return { saved: !!data }
  }
}
