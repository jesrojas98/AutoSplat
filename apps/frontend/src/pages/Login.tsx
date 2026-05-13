import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuthStore } from '@/store/auth.store'

export function Login() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState('')
  const { loginWithEmail, loginWithGoogle, loading } = useAuthStore()
  const navigate = useNavigate()

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    try {
      await loginWithEmail(email, password)
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

          <div className="flex items-center gap-3 my-6">
            <div className="flex-1 h-px bg-[var(--color-outline-variant)]/30" />
            <span className="label-caps text-[var(--color-outline)] text-[10px]">O CONTINÚA CON</span>
            <div className="flex-1 h-px bg-[var(--color-outline-variant)]/30" />
          </div>

          <button
            type="button"
            onClick={loginWithGoogle}
            className="w-full flex items-center justify-center gap-3 py-3 rounded-lg border border-[var(--color-outline-variant)]/30 hover:border-[var(--color-outline-variant)] hover:bg-[var(--color-surface-container)] transition-all"
          >
            <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
              <path d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844c-.209 1.125-.843 2.078-1.796 2.717v2.258h2.908c1.702-1.567 2.684-3.875 2.684-6.615z" fill="#4285F4"/>
              <path d="M9 18c2.43 0 4.467-.806 5.956-2.184l-2.908-2.258c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 009 18z" fill="#34A853"/>
              <path d="M3.964 10.707A5.41 5.41 0 013.682 9c0-.593.102-1.17.282-1.707V4.961H.957A8.996 8.996 0 000 9c0 1.452.348 2.827.957 4.039l3.007-2.332z" fill="#FBBC05"/>
              <path d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 00.957 4.96L3.964 7.294C4.672 5.163 6.656 3.58 9 3.58z" fill="#EA4335"/>
            </svg>
            <span className="label-caps text-[var(--color-on-surface)] text-xs">CONTINUAR CON GOOGLE</span>
          </button>

          <p className="text-center text-[var(--color-on-surface-variant)] text-sm mt-6">
            ¿No tienes cuenta?{' '}
            <Link to="/register" className="text-[var(--color-primary)] hover:underline font-medium">Regístrate gratis</Link>
          </p>
        </div>
      </div>
    </div>
  )
}
