import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common'
import { SupabaseService } from '../supabase/supabase.service'
import { CreateVehicleDto } from './dto/create-vehicle.dto'

const VEHICLE_SELECT = `
  id, brand, model, year, price, mileage, transmission, fuel_type,
  body_type, color, doors, location, region, description, status,
  views_count, has_3d_model, created_at, seller_id,
  vehicle_images(id, image_url, thumbnail_url, image_type, sort_order),
  vehicle_3d_models(id, status, model_url, preview_image_url)
`

export interface VehicleFilters {
  brand?: string
  minPrice?: number
  maxPrice?: number
  minYear?: number
  maxYear?: number
  transmission?: string
  fuel_type?: string
  location?: string
  search?: string
  page?: number
  limit?: number
}

@Injectable()
export class VehiclesService {
  constructor(private supabase: SupabaseService) {}

  async findAll(filters: VehicleFilters = {}) {
    const { page = 1, limit = 12, search, brand, minPrice, maxPrice, minYear, maxYear, transmission, fuel_type, location } = filters
    const offset = (page - 1) * limit

    let query = this.supabase.client
      .from('vehicles')
      .select(VEHICLE_SELECT, { count: 'exact' })
      .eq('status', 'published')
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1)

    if (brand) query = query.ilike('brand', `%${brand}%`)
    if (search) query = query.or(`brand.ilike.%${search}%,model.ilike.%${search}%`)
    if (minPrice) query = query.gte('price', minPrice)
    if (maxPrice) query = query.lte('price', maxPrice)
    if (minYear) query = query.gte('year', minYear)
    if (maxYear) query = query.lte('year', maxYear)
    if (transmission) query = query.eq('transmission', transmission)
    if (fuel_type) query = query.eq('fuel_type', fuel_type)
    if (location) query = query.ilike('location', `%${location}%`)

    const { data, error, count } = await query
    if (error) throw new Error(error.message)

    return {
      data: data ?? [],
      total: count ?? 0,
      page,
      limit,
      pages: Math.ceil((count ?? 0) / limit),
    }
  }

  async findOne(id: string) {
    const { data, error } = await this.supabase.client
      .from('vehicles')
      .select(VEHICLE_SELECT)
      .eq('id', id)
      .single()
    if (error || !data) throw new NotFoundException('Vehículo no encontrado')

    // Incrementa vistas sin bloquear la respuesta
    this.supabase.admin
      .from('vehicles')
      .update({ views_count: (data.views_count ?? 0) + 1 })
      .eq('id', id)
      .then(() => {})

    return data
  }

  async findByUser(userId: string) {
    const { data, error } = await this.supabase.admin
      .from('vehicles')
      .select(VEHICLE_SELECT)
      .eq('seller_id', userId)
      .order('created_at', { ascending: false })
    if (error) throw new Error(error.message)
    return data ?? []
  }

  async create(userId: string, dto: CreateVehicleDto) {
    const { data, error } = await this.supabase.admin
      .from('vehicles')
      .insert({ ...dto, seller_id: userId, status: 'draft' })
      .select(VEHICLE_SELECT)
      .single()
    if (error) throw new Error(error.message)
    return data
  }

  async update(id: string, userId: string, dto: Partial<CreateVehicleDto> & { status?: string }) {
    await this.assertOwner(id, userId)
    const { data, error } = await this.supabase.admin
      .from('vehicles')
      .update({ ...dto, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select(VEHICLE_SELECT)
      .single()
    if (error) throw new Error(error.message)
    return data
  }

  async remove(id: string, userId: string) {
    await this.assertOwner(id, userId)
    const { error } = await this.supabase.admin.from('vehicles').delete().eq('id', id)
    if (error) throw new Error(error.message)
    return { message: 'Vehículo eliminado' }
  }

  async publish(id: string, userId: string) {
    return this.update(id, userId, { status: 'published' })
  }

  private async assertOwner(vehicleId: string, userId: string) {
    const { data } = await this.supabase.admin
      .from('vehicles')
      .select('seller_id')
      .eq('id', vehicleId)
      .single()
    if (!data) throw new NotFoundException('Vehículo no encontrado')
    if (data.seller_id !== userId) throw new ForbiddenException('No tienes permiso')
  }
}
