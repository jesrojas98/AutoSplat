import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '@/lib/supabase'
import { useAuthStore, createUserProfile, type UserRole } from '@/store/auth.store'

type Role = Extract<UserRole, 'buyer' | 'seller'>

// Paso intermedio para cuentas nuevas (Google) que llegaron sin elegir si compran o venden.
export function ChooseRole() {
  const { user, loading } = useAuthStore()
  const navigate = useNavigate()
  const [submitting, setSubmitting] = useState<Role | null>(null)
  const [error, setError] = useState('')

  // Si ya tiene fila en users (ya eligió antes), no hay nada que preguntar
  useEffect(() => {
    if (loading || !user) return
    supabase.from('users').select('role').eq('id', user.id).maybeSingle()
      .then(({ data }) => { if (data) navigate('/dashboard', { replace: true }) })
  }, [user, loading, navigate])

  async function choose(role: Role) {
    if (!user) return
    setError('')
    setSubmitting(role)
    try {
      await createUserProfile(user, role)
      navigate('/dashboard', { replace: true })
    } catch {
      setError('No pudimos guardar tu elección. Inténtalo de nuevo.')
      setSubmitting(null)
    }
  }

  const options: { value: Role; label: string; desc: string; icon: string }[] = [
    { value: 'seller', label: 'Vendedor', desc: 'Quiero publicar y vender vehículos', icon: 'storefront' },
    { value: 'buyer', label: 'Comprador', desc: 'Quiero buscar y comprar vehículos', icon: 'person_search' },
  ]

  return (
    <div className="min-h-[80vh] flex items-center justify-center px-[var(--spacing-gutter)] py-16">
      <div className="w-full max-w-md glass-card rounded-2xl p-8">
        <h1 style={{ fontFamily: 'var(--font-headline)', fontSize: 28, fontWeight: 700 }} className="mb-2">
          ¿Cómo usarás AutoSplat?
        </h1>
        <p className="text-[var(--color-on-surface-variant)] text-sm mb-6">
          Elige el tipo de cuenta para terminar de crearla.
        </p>

        {error && <p className="text-[var(--color-secondary)] text-sm mb-4">{error}</p>}

        <div className="flex flex-col gap-3">
          {options.map(({ value, label, desc, icon }) => (
            <button
              key={value}
              type="button"
              disabled={submitting !== null || !user}
              onClick={() => choose(value)}
              className="flex items-center gap-4 p-4 rounded-lg border border-[var(--color-outline-variant)]/30 hover:border-[var(--color-primary)] hover:bg-[var(--color-primary)]/10 transition-all text-left disabled:opacity-50"
            >
              <span className="material-symbols-outlined text-[var(--color-primary)]">
                {submitting === value ? 'progress_activity' : icon}
              </span>
              <span>
                <span className="label-caps block text-[var(--color-on-surface)]">{label.toUpperCase()}</span>
                <span className="text-sm text-[var(--color-on-surface-variant)]">{desc}</span>
              </span>
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}
