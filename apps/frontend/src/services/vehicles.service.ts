import { api } from '@/lib/api'

export interface Vehicle {
  id: string
  brand: string
  model: string
  year: number
  price: number
  mileage: number
  transmission: string | null
  fuel_type: string | null
  body_type: string | null
  color: string | null
  doors: number | null
  location: string
  region: string | null
  description: string | null
  status: string
  views_count: number
  has_3d_model: boolean
  created_at: string
  seller_id: string
  vehicle_images: { id: string; image_url: string; thumbnail_url: string; image_type: string; sort_order: number }[]
  vehicle_3d_models: { id: string; status: string; model_url: string | null }[]
}

export interface VehiclesResponse {
  data: Vehicle[]
  total: number
  page: number
  limit: number
  pages: number
}

export interface VehicleFilters {
  search?: string
  brand?: string
  minPrice?: number
  maxPrice?: number
  minYear?: number
  maxYear?: number
  transmission?: string
  fuel_type?: string
  location?: string
  page?: number
  limit?: number
}

export const vehiclesService = {
  async getAll(filters: VehicleFilters = {}): Promise<VehiclesResponse> {
    const params = Object.fromEntries(
      Object.entries(filters).filter(([, v]) => v !== undefined && v !== ''),
    )
    const { data } = await api.get('/vehicles', { params })
    return data
  },

  async getOne(id: string): Promise<Vehicle> {
    const { data } = await api.get(`/vehicles/${id}`)
    return data
  },

  async getMine(): Promise<Vehicle[]> {
    const { data } = await api.get('/vehicles/my')
    return data
  },

  async create(dto: Partial<Vehicle>) {
    const { data } = await api.post('/vehicles', dto)
    return data
  },

  async update(id: string, dto: Partial<Vehicle>) {
    const { data } = await api.patch(`/vehicles/${id}`, dto)
    return data
  },

  async publish(id: string) {
    const { data } = await api.patch(`/vehicles/${id}/publish`)
    return data
  },

  async remove(id: string) {
    const { data } = await api.delete(`/vehicles/${id}`)
    return data
  },

  getThumbnail(vehicle: Vehicle): string {
    const thumb = vehicle.vehicle_images?.find((i) => i.image_type === 'thumbnail')
    const first = vehicle.vehicle_images?.[0]
    return thumb?.image_url ?? first?.image_url ?? ''
  },
}
