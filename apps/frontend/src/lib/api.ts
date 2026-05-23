import axios from 'axios'
import { supabase } from './supabase'

export const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL ?? 'http://localhost:3000/api',
})

api.interceptors.request.use(async (config) => {
  const { data } = await supabase.auth.getSession()
  const token = data.session?.access_token
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

let signingOut = false

api.interceptors.response.use(
  (res) => res,
  async (err) => {
    if (err.response?.status === 401 && !signingOut) {
      // Solo forzar logout si la sesión de Supabase realmente no existe
      const { data } = await supabase.auth.getSession()
      if (!data.session) {
        signingOut = true
        await supabase.auth.signOut()
        signingOut = false
        window.location.replace('/login')
      }
    }
    return Promise.reject(err)
  },
)
