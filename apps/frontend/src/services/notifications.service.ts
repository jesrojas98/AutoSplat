import { api } from '@/lib/api'

export interface Notification {
  id: string
  user_id: string
  type: 'message' | 'favorite' | 'views_milestone' | 'model_ready' | 'vehicle_sold'
  title: string
  body: string
  icon: string
  link: string | null
  read_at: string | null
  created_at: string
}

export const notificationsService = {
  getAll: () => api.get<Notification[]>('/notifications').then(r => r.data),
  getUnreadCount: () => api.get<{ count: number }>('/notifications/unread-count').then(r => r.data),
  markRead: (id: string) => api.patch(`/notifications/${id}/read`).then(r => r.data),
  markAllRead: () => api.patch('/notifications/read-all').then(r => r.data),
}
