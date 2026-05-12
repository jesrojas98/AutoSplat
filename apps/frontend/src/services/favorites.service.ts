import { api } from '@/lib/api'

export const favoritesService = {
  async getAll() {
    const { data } = await api.get('/favorites')
    return data
  },

  async toggle(vehicleId: string): Promise<{ saved: boolean }> {
    const { data } = await api.post(`/favorites/${vehicleId}/toggle`)
    return data
  },

  async isSaved(vehicleId: string): Promise<{ saved: boolean }> {
    const { data } = await api.get(`/favorites/${vehicleId}/saved`)
    return data
  },
}
