import { Navigate } from 'react-router-dom'
import { useAuthStore } from '@/store/auth.store'

export function AuthRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuthStore()

  if (loading) return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <span className="material-symbols-outlined text-[var(--color-primary)] animate-spin" style={{ fontSize: 40 }}>
        progress_activity
      </span>
    </div>
  )

  if (!user) return <Navigate to="/login" replace />

  return <>{children}</>
}
