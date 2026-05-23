import { describe, it, expect, vi, beforeEach } from 'vitest'

vi.mock('@/lib/api', () => ({
  api: {
    get: vi.fn(),
    patch: vi.fn(),
  },
}))

import { api } from '@/lib/api'
import { notificationsService, type Notification } from '../services/notifications.service'

const mockApi = api as { get: ReturnType<typeof vi.fn>; patch: ReturnType<typeof vi.fn> }

const mockNotification: Notification = {
  id: 'n1',
  user_id: 'user-1',
  type: 'message',
  title: 'Nuevo mensaje',
  body: 'Tienes un mensaje nuevo de Juan',
  icon: 'chat',
  link: '/dashboard',
  read_at: null,
  created_at: '2024-01-01T10:00:00Z',
}

beforeEach(() => vi.clearAllMocks())

describe('notificationsService', () => {

  // ── getAll ─────────────────────────────────────────────────────────────

  describe('getAll()', () => {
    it('retorna la lista de notificaciones', async () => {
      mockApi.get.mockResolvedValue({ data: [mockNotification] })

      const result = await notificationsService.getAll()

      expect(result).toHaveLength(1)
      expect(result[0]).toMatchObject({ id: 'n1', type: 'message' })
      expect(mockApi.get).toHaveBeenCalledWith('/notifications')
    })

    it('retorna array vacío cuando no hay notificaciones', async () => {
      mockApi.get.mockResolvedValue({ data: [] })

      const result = await notificationsService.getAll()

      expect(result).toEqual([])
    })
  })

  // ── getUnreadCount ─────────────────────────────────────────────────────

  describe('getUnreadCount()', () => {
    it('retorna el conteo de notificaciones sin leer', async () => {
      mockApi.get.mockResolvedValue({ data: { count: 5 } })

      const result = await notificationsService.getUnreadCount()

      expect(result).toEqual({ count: 5 })
      expect(mockApi.get).toHaveBeenCalledWith('/notifications/unread-count')
    })

    it('retorna { count: 0 } cuando no hay sin leer', async () => {
      mockApi.get.mockResolvedValue({ data: { count: 0 } })

      const result = await notificationsService.getUnreadCount()

      expect(result.count).toBe(0)
    })
  })

  // ── markRead ───────────────────────────────────────────────────────────

  describe('markRead()', () => {
    it('llama PATCH a la ruta correcta', async () => {
      const updated = { ...mockNotification, read_at: '2024-01-02T00:00:00Z' }
      mockApi.patch.mockResolvedValue({ data: updated })

      const result = await notificationsService.markRead('n1')

      expect(mockApi.patch).toHaveBeenCalledWith('/notifications/n1/read')
      expect(result).toMatchObject({ id: 'n1' })
    })

    it('usa el id correcto en la URL', async () => {
      mockApi.patch.mockResolvedValue({ data: mockNotification })

      await notificationsService.markRead('notif-uuid-xyz')

      expect(mockApi.patch).toHaveBeenCalledWith('/notifications/notif-uuid-xyz/read')
    })
  })

  // ── markAllRead ────────────────────────────────────────────────────────

  describe('markAllRead()', () => {
    it('llama PATCH a la ruta read-all', async () => {
      mockApi.patch.mockResolvedValue({ data: { success: true } })

      const result = await notificationsService.markAllRead()

      expect(mockApi.patch).toHaveBeenCalledWith('/notifications/read-all')
      expect(result).toEqual({ success: true })
    })
  })
})
