import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '@/lib/supabase'
import { normalizeUserRole, createUserProfile, type UserRole } from '@/store/auth.store'
import type { User } from '@supabase/supabase-js'

// Google o Supabase devuelven los errores en la URL (?error=...&error_description=... o en el
// hash). Antes se ignoraban y a los 10s salía un mensaje genérico sin pista de la causa.
function readUrlError(): { code: string; description: string } | null {
  const query = new URLSearchParams(window.location.search)
  const hash = new URLSearchParams(window.location.hash.replace(/^#/, ''))
  const pick = (key: string) => hash.get(key) ?? query.get(key)
  const code = pick('error_code') ?? pick('error')
  const description = pick('error_description')
  if (!code && !description) return null
  return { code: code ?? 'error', description: description ?? '' }
}

function friendlyReason(err: { code: string; description: string }): string {
  if (err.code === 'access_denied') return 'Se canceló el acceso o Google no dio permiso.'
  if (/database error/i.test(err.description)) return 'No se pudo crear tu cuenta en nuestra base de datos.'
  if (/exchange external code/i.test(err.description)) return 'Google no confirmó el acceso a tiempo.'
  return 'Google o nuestro servidor de acceso devolvió un error.'
}

export function AuthCallback() {
  const navigate = useNavigate()
  const [failure, setFailure] = useState(false)
  const [reason, setReason] = useState('')
  const [detail, setDetail] = useState('')

  useEffect(() => {
    let done = false

    const urlError = readUrlError()
    if (urlError) {
      done = true
      setReason(friendlyReason(urlError))
      setDetail(`${urlError.code}${urlError.description ? `: ${urlError.description}` : ''}`)
      setFailure(true)
      return
    }
    let manualError = ''

    async function syncAndRedirect(user: User) {
      if (done) return
      done = true
      const storedRole = localStorage.getItem('oauth_role')
      const pendingRole: Extract<UserRole, 'buyer' | 'seller'> | null =
        storedRole === 'buyer' || storedRole === 'seller' ? storedRole : null
      localStorage.removeItem('oauth_role')

      // La tabla users manda: un usuario que ya existe conserva su rol (p. ej. admin) aunque
      // el login de Google llegue con otro rol elegido en /register o con metadata desfasada.
      const { data: existing, error: lookupError } = await supabase
        .from('users')
        .select('role')
        .eq('id', user.id)
        .maybeSingle()
      if (lookupError) { navigate('/dashboard'); return }
      if (existing) {
        const dbRole = normalizeUserRole(existing.role)
        if (user.user_metadata?.role !== dbRole) {
          await supabase.auth.updateUser({ data: { role: dbRole } })
        }
        navigate('/dashboard')
        return
      }

      // Un alta nueva solo puede ser comprador o vendedor: la metadata la edita el propio usuario,
      // así que un "admin" ahí no cuenta (los admin se asignan desde el panel o la base de datos).
      const rawMeta = user.user_metadata?.role
      const metaRole: Extract<UserRole, 'buyer' | 'seller'> | null =
        rawMeta === 'buyer' || rawMeta === 'seller' ? rawMeta : null
      const role = pendingRole ?? metaRole

      // Sin rol elegido (p. ej. entró con Google desde /login, o el navegador perdió el
      // localStorage en la redirección) NO se asume "comprador": antes eso convertía en
      // compradores a quienes querían vender. Se le pregunta.
      if (!role) { navigate('/auth/role', { replace: true }); return }

      // Si falla el alta, el backend crea la fila con el rol de la metadata en la primera llamada
      try { await createUserProfile(user, role) } catch { /* no bloquear el acceso */ }
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
        if (error) manualError = error.message
        else if (data.session?.user) syncAndRedirect(data.session.user)
      } catch (e) {
        manualError = e instanceof Error ? e.message : String(e)
      }
    }, 3_000)

    // Fallback: si en 10 segundos no llega sesión, avisar en vez de volver al login en silencio
    const timeout = setTimeout(() => {
      if (done) return
      done = true
      const hasTokens = /access_token=/.test(window.location.hash) || /[?&]code=/.test(window.location.search)
      setDetail(manualError || (hasTokens ? 'La sesión llegó pero no se pudo validar.' : 'La URL de retorno no trae sesión.'))
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
            No pudimos completar el acceso con Google. {reason} Inténtalo de nuevo.
          </p>
          {detail && (
            <p className="text-xs text-[var(--color-on-surface-variant)] opacity-70 break-words">
              Detalle: {detail}
            </p>
          )}
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
