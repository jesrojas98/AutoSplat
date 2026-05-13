import { Link } from 'react-router-dom'
import { useAuthStore, getUserRole } from '@/store/auth.store'

export function SellerRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuthStore()

  if (loading) return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <span className="material-symbols-outlined text-[var(--color-primary)] animate-spin" style={{ fontSize: 40 }}>
        progress_activity
      </span>
    </div>
  )

  if (!user) return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] px-[var(--spacing-gutter)] text-center gap-6">
      <div className="w-20 h-20 rounded-full bg-[var(--color-primary)]/10 flex items-center justify-center">
        <span className="material-symbols-outlined text-[var(--color-primary)]" style={{ fontSize: 44 }}>lock</span>
      </div>
      <div>
        <h2 style={{ fontFamily: 'var(--font-headline)', fontSize: 28, fontWeight: 700 }} className="mb-2">
          Inicia sesión para publicar
        </h2>
        <p className="text-[var(--color-on-surface-variant)] text-sm max-w-md">
          Necesitas una cuenta para publicar vehículos en AutoSplat.
        </p>
      </div>
      <div className="flex gap-3">
        <Link to="/login"
          className="px-8 py-3 border border-[var(--color-outline-variant)]/50 text-[var(--color-on-surface)] label-caps rounded-lg hover:bg-[var(--color-surface-container)] transition-all">
          INICIAR SESIÓN
        </Link>
        <Link to="/register"
          className="glow-primary px-8 py-3 bg-[var(--color-primary-container)] text-[var(--color-on-primary-container)] label-caps font-bold rounded-lg hover:bg-[var(--color-primary)] transition-all">
          CREAR CUENTA
        </Link>
      </div>
    </div>
  )

  if (getUserRole(user) !== 'seller' && getUserRole(user) !== 'admin') return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] px-[var(--spacing-gutter)] text-center gap-6">
      <div className="w-20 h-20 rounded-full bg-[var(--color-tertiary)]/10 flex items-center justify-center">
        <span className="material-symbols-outlined text-[var(--color-tertiary)]" style={{ fontSize: 44 }}>storefront</span>
      </div>
      <div>
        <h2 style={{ fontFamily: 'var(--font-headline)', fontSize: 28, fontWeight: 700 }} className="mb-2">
          Solo para vendedores
        </h2>
        <p className="text-[var(--color-on-surface-variant)] text-sm max-w-md">
          Tu cuenta está registrada como <strong>comprador</strong>. Para publicar vehículos necesitas una cuenta de vendedor.
        </p>
      </div>
      <div className="flex gap-3">
        <Link to="/catalog"
          className="px-8 py-3 border border-[var(--color-outline-variant)]/50 text-[var(--color-on-surface)] label-caps rounded-lg hover:bg-[var(--color-surface-container)] transition-all">
          VER CATÁLOGO
        </Link>
        <Link to="/register"
          className="glow-primary px-8 py-3 bg-[var(--color-primary-container)] text-[var(--color-on-primary-container)] label-caps font-bold rounded-lg hover:bg-[var(--color-primary)] transition-all">
          CREAR CUENTA VENDEDOR
        </Link>
      </div>
    </div>
  )

  return <>{children}</>
}
