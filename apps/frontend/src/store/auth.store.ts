import { create } from 'zustand'
import { api } from '@/lib/api'

interface User {
  id: string
  name: string
  email: string
  role: string
  avatar_url: string | null
}

interface AuthStore {
  user: User | null
  token: string | null
  loading: boolean
  login: (email: string, password: string) => Promise<void>
  register: (name: string, email: string, password: string) => Promise<void>
  logout: () => void
  fetchMe: () => Promise<void>
}

export const useAuthStore = create<AuthStore>((set) => ({
  user: null,
  token: localStorage.getItem('autosplat-token'),
  loading: false,

  async login(email, password) {
    set({ loading: true })
    try {
      const { data } = await api.post('/auth/login', { email, password })
      localStorage.setItem('autosplat-token', data.access_token)
      set({ token: data.access_token, user: data.user, loading: false })
    } catch (err) {
      set({ loading: false })
      throw err
    }
  },

  async register(name, email, password) {
    set({ loading: true })
    try {
      const { data } = await api.post('/auth/register', { name, email, password })
      localStorage.setItem('autosplat-token', data.access_token)
      set({ token: data.access_token, user: data.user, loading: false })
    } catch (err) {
      set({ loading: false })
      throw err
    }
  },

  logout() {
    localStorage.removeItem('autosplat-token')
    set({ user: null, token: null })
  },

  async fetchMe() {
    const token = localStorage.getItem('autosplat-token')
    if (!token) return
    try {
      const { data } = await api.get('/users/me')
      set({ user: data })
    } catch {
      localStorage.removeItem('autosplat-token')
      set({ user: null, token: null })
    }
  },
}))
