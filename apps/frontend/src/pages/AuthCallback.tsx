import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '@/lib/supabase'

export function AuthCallback() {
  const navigate = useNavigate()

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      if (data.session?.user) {
        const user = data.session.user
        // Sincronizar perfil en public.users
        supabase.from('users').upsert({
          id: user.id,
          email: user.email!,
          name: user.user_metadata?.full_name ?? user.email!.split('@')[0],
          password_hash: '',
          role: 'seller',
        }).then(() => navigate('/dashboard'))
      } else {
        navigate('/login')
      }
    })
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
