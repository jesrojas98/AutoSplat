import { create } from 'zustand'
import { supabase } from '@/lib/supabase'
import type { User, Session } from '@supabase/supabase-js'

interface AuthStore {
  user: User | null
  session: Session | null
  loading: boolean
  loginWithGoogle: () => Promise<void>
  loginWithEmail: (email: string, password: string) => Promise<void>
  registerWithEmail: (name: string, email: string, password: string, role: 'buyer' | 'seller') => Promise<void>
  logout: () => Promise<void>
  init: () => () => void
}

export const useAuthStore = create<AuthStore>((set) => ({
  user: null,
  session: null,
  loading: true,

  async loginWithGoogle() {
    await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: `${window.location.origin}/auth/callback` },
    })
  },

  async loginWithEmail(email, password) {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) throw error
    set({ user: data.user, session: data.session })
  },

  async registerWithEmail(name, email, password, role) {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { name, role } },
    })
    if (error) throw error
    if (data.user) {
      await supabase.from('users').upsert({
        id: data.user.id,
        email: data.user.email!,
        name,
        password_hash: '',
        role,
      })
    }
    set({ user: data.user, session: data.session })
  },

  async logout() {
    await supabase.auth.signOut()
    set({ user: null, session: null })
  },

  init() {
    supabase.auth.getSession().then(({ data }) => {
      set({ user: data.session?.user ?? null, session: data.session, loading: false })
    })

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      set({ user: session?.user ?? null, session, loading: false })
    })

    return () => subscription.unsubscribe()
  },
}))

// Helper para leer el rol desde el user de Supabase
export function getUserRole(user: User | null): 'buyer' | 'seller' | 'admin' {
  return (user?.user_metadata?.role ?? 'buyer') as 'buyer' | 'seller' | 'admin'
}
