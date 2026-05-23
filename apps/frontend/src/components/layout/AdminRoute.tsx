import { Link } from 'react-router-dom'
import { useAuthStore, getUserRole } from '@/store/auth.store'

export function AdminRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuthStore()

  if (loading) return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <span className="material-symbols-outlined text-[var(--color-primary)] animate-spin" style={{ fontSize: 40 }}>
        progress_activity
      </span>
    </div>
  )

  if (!user || getUserRole(user) !== 'admin') return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] px-[var(--spacing-gutter)] text-center gap-6">
      <div className="w-20 h-20 rounded-full bg-[var(--color-secondary)]/10 flex items-center justify-center">
        <span className="material-symbols-outlined text-[var(--color-secondary)]" style={{ fontSize: 44 }}>admin_panel_settings</span>
      </div>
      <div>
        <h2 style={{ fontFamily: 'var(--font-headline)', fontSize: 28, fontWeight: 700 }} className="mb-2">
          Acceso restringido
        </h2>
        <p className="text-[var(--color-on-surface-variant)] text-sm max-w-md">
          Esta sección es exclusiva para administradores del sistema.
        </p>
      </div>
      <Link to="/" className="label-caps text-[10px] px-6 py-3 border border-[var(--color-outline-variant)]/50 rounded-lg hover:bg-[var(--color-surface-container)] transition-all">
        VOLVER AL INICIO
      </Link>
    </div>
  )

  return <>{children}</>
}
