import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '@/lib/supabase'
import { normalizeUserRole, type UserRole } from '@/store/auth.store'
import type { User } from '@supabase/supabase-js'

export function AuthCallback() {
  const navigate = useNavigate()
  const [failure, setFailure] = useState(false)

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

    // Algunos navegadores móviles no completan la detección automática de la URL;
    // si a los 3s no hay sesión, se intenta con los tokens del hash a mano.
    const manual = setTimeout(async () => {
      if (done) return
      const hash = new URLSearchParams(window.location.hash.replace(/^#/, ''))
      const access_token = hash.get('access_token')
      const refresh_token = hash.get('refresh_token')
      if (!access_token || !refresh_token) return
      try {
        const { data, error } = await supabase.auth.setSession({ access_token, refresh_token })
        if (!error && data.session?.user) syncAndRedirect(data.session.user)
      } catch {
        // el mensaje genérico del fallback cubre este caso
      }
    }, 3_000)

    // Fallback: si en 10 segundos no llega sesión, avisar en vez de volver al login en silencio
    const timeout = setTimeout(() => {
      if (done) return
      done = true
      setFailure(true)
    }, 10_000)

    return () => {
      subscription.unsubscribe()
      clearTimeout(timeout)
      clearTimeout(manual)
    }
  }, [navigate])

  if (failure) {
    return (
      <div className="min-h-screen flex items-center justify-center px-6">
        <div className="flex flex-col items-center gap-4 text-center max-w-sm">
          <span className="material-symbols-outlined text-[var(--color-error)]" style={{ fontSize: 40 }}>error</span>
          <p className="label-caps text-[var(--color-on-surface)]">NO SE PUDO INICIAR SESIÓN</p>
          <p className="text-sm text-[var(--color-on-surface-variant)]">
            No pudimos completar el acceso con Google. Inténtalo de nuevo.
          </p>
          <button
            onClick={() => navigate('/login')}
            className="bg-[var(--color-primary-container)] text-[var(--color-on-primary-container)] px-6 py-3 rounded-lg label-caps font-bold"
          >
            VOLVER AL LOGIN
          </button>
        </div>
      </div>
    )
  }

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
