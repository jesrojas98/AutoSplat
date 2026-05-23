import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '@/lib/supabase'
import { normalizeUserRole, type UserRole } from '@/store/auth.store'
import type { User } from '@supabase/supabase-js'

export function AuthCallback() {
  const navigate = useNavigate()

  useEffect(() => {
    let done = false

    async function syncAndRedirect(user: User) {
      if (done) return
      done = true
      const storedRole = localStorage.getItem('oauth_role')
      const pendingRole: Extract<UserRole, 'buyer' | 'seller'> | null =
        storedRole === 'buyer' || storedRole === 'seller' ? storedRole : null
      const role = pendingRole ?? normalizeUserRole(user.user_metadata?.role)
      localStorage.removeItem('oauth_role')
      await supabase.from('users').upsert({
        id: user.id,
        email: user.email!,
        name: user.user_metadata?.full_name ?? user.email!.split('@')[0],
        password_hash: '',
        role,
      })
      // Persistir el rol en user_metadata para que getUserRole() lo lea correctamente
      if (pendingRole || user.user_metadata?.role !== role) {
        await supabase.auth.updateUser({ data: { role } })
      }
      navigate('/dashboard')
    }

    // onAuthStateChange recibe SIGNED_IN una vez que Supabase procesa los tokens del URL
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (session?.user) {
        syncAndRedirect(session.user)
      } else if (event === 'SIGNED_OUT') {
        if (!done) { done = true; navigate('/login') }
      }
      // INITIAL_SESSION sin sesión = tokens aún procesándose → esperar
    })

    // Fallback: si en 10 segundos no llega sesión, redirigir a login
    const timeout = setTimeout(() => {
      if (!done) { done = true; navigate('/login') }
    }, 10_000)

    return () => {
      subscription.unsubscribe()
      clearTimeout(timeout)
    }
  }, [navigate])

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="flex flex-col items-center gap-4">
        <span className="material-symbols-outlined text-[var(--color-primary)] animate-spin" style={{ fontSize: 40 }}>
          progress_activity
        </span>
        <p className="label-caps text-[var(--color-on-surface-variant)]">VERIFICANDO SESIÓN...</p>
      </div>
    </div>
  )
}
