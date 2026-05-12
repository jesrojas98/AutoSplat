import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuthStore } from '@/store/auth.store'

export function Login() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState('')
  const { login, loading } = useAuthStore()
  const navigate = useNavigate()

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    try {
      await login(email, password)
      navigate('/dashboard')
    } catch (err: any) {
      setError(err.response?.data?.message ?? 'Error al iniciar sesión')
    }
  }

  return (
    <div className="min-h-[80vh] flex items-center justify-center px-[var(--spacing-gutter)] py-16">
      <div className="w-full max-w-md">
        <div className="text-center mb-10">
          <Link to="/" style={{ fontFamily: 'var(--font-headline)', fontSize: 28, fontWeight: 700 }} className="text-[var(--color-on-surface)]">
            AutoSplat
          </Link>
          <p className="label-caps text-[var(--color-on-surface-variant)] mt-2">BIENVENIDO DE VUELTA</p>
        </div>

        <div className="glass-card rounded-2xl p-8">
          <h1 style={{ fontFamily: 'var(--font-headline)', fontSize: 28, fontWeight: 700 }} className="mb-6">
            Iniciar sesión
          </h1>

          {error && (
            <div className="mb-4 px-4 py-3 rounded-lg bg-[var(--color-secondary)]/10 border border-[var(--color-secondary)]/30 flex items-center gap-2">
              <span className="material-symbols-outlined text-[var(--color-secondary)] text-base">error</span>
              <p className="text-[var(--color-secondary)] text-sm">{error}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="flex flex-col gap-5">
            <div>
              <label className="label-caps text-[var(--color-on-surface-variant)] block mb-2">CORREO ELECTRÓNICO</label>
              <div className="flex items-center bg-[var(--color-surface-container)] border border-[var(--color-outline-variant)]/30 rounded-lg px-4 py-3 focus-within:border-[var(--color-primary)]/60 transition-colors">
                <span className="material-symbols-outlined text-[var(--color-outline)] mr-3 text-xl">mail</span>
                <input
                  type="email"
                  required
                  placeholder="tu@correo.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="bg-transparent border-none outline-none text-[var(--color-on-surface)] w-full text-sm placeholder:text-[var(--color-outline)]"
                />
              </div>
            </div>

            <div>
              <div className="flex justify-between items-center mb-2">
                <label className="label-caps text-[var(--color-on-surface-variant)]">CONTRASEÑA</label>
              </div>
              <div className="flex items-center bg-[var(--color-surface-container)] border border-[var(--color-outline-variant)]/30 rounded-lg px-4 py-3 focus-within:border-[var(--color-primary)]/60 transition-colors">
                <span className="material-symbols-outlined text-[var(--color-outline)] mr-3 text-xl">lock</span>
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="bg-transparent border-none outline-none text-[var(--color-on-surface)] w-full text-sm placeholder:text-[var(--color-outline)]"
                />
                <button type="button" onClick={() => setShowPassword((v) => !v)} className="text-[var(--color-outline)] hover:text-[var(--color-on-surface)] transition-colors ml-2">
                  <span className="material-symbols-outlined text-xl">{showPassword ? 'visibility_off' : 'visibility'}</span>
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="glow-primary w-full py-4 bg-[var(--color-primary-container)] text-[var(--color-on-primary-container)] label-caps font-bold rounded-lg hover:bg-[var(--color-primary)] active:scale-[0.98] transition-all mt-2 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <span className="material-symbols-outlined text-base animate-spin">progress_activity</span>
                  INGRESANDO...
                </>
              ) : 'INGRESAR'}
            </button>
          </form>

          <p className="text-center text-[var(--color-on-surface-variant)] text-sm mt-6">
            ¿No tienes cuenta?{' '}
            <Link to="/register" className="text-[var(--color-primary)] hover:underline font-medium">Regístrate gratis</Link>
          </p>
        </div>
      </div>
    </div>
  )
}
