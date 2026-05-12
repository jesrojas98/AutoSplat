import { useState } from 'react'
import { Link } from 'react-router-dom'

type Role = 'buyer' | 'seller'

export function Register() {
  const [role, setRole] = useState<Role>('buyer')
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    // TODO: conectar con API
  }

  return (
    <div className="min-h-[80vh] flex items-center justify-center px-[var(--spacing-gutter)] py-16">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-10">
          <Link to="/" style={{ fontFamily: 'var(--font-headline)', fontSize: 28, fontWeight: 700 }} className="text-[var(--color-on-surface)]">
            AutoSplat
          </Link>
          <p className="label-caps text-[var(--color-on-surface-variant)] mt-2">CREA TU CUENTA GRATIS</p>
        </div>

        <div className="glass-card rounded-2xl p-8">
          <h1 style={{ fontFamily: 'var(--font-headline)', fontSize: 28, fontWeight: 700 }} className="mb-6">
            Crear cuenta
          </h1>

          {/* Selector de rol */}
          <div className="flex gap-3 mb-6">
            {([
              { value: 'buyer', label: 'Comprador', icon: 'person_search' },
              { value: 'seller', label: 'Vendedor', icon: 'storefront' },
            ] as { value: Role; label: string; icon: string }[]).map(({ value, label, icon }) => (
              <button
                key={value}
                type="button"
                onClick={() => setRole(value)}
                className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-lg border label-caps text-xs transition-all ${
                  role === value
                    ? 'border-[var(--color-primary)] bg-[var(--color-primary)]/10 text-[var(--color-primary)]'
                    : 'border-[var(--color-outline-variant)]/30 text-[var(--color-on-surface-variant)] hover:border-[var(--color-outline-variant)]'
                }`}
              >
                <span className="material-symbols-outlined text-base">{icon}</span>
                {label.toUpperCase()}
              </button>
            ))}
          </div>

          <form onSubmit={handleSubmit} className="flex flex-col gap-5">
            {/* Nombre */}
            <div>
              <label className="label-caps text-[var(--color-on-surface-variant)] block mb-2">NOMBRE COMPLETO</label>
              <div className="flex items-center bg-[var(--color-surface-container)] border border-[var(--color-outline-variant)]/30 rounded-lg px-4 py-3 focus-within:border-[var(--color-primary)]/60 transition-colors">
                <span className="material-symbols-outlined text-[var(--color-outline)] mr-3 text-xl">person</span>
                <input
                  type="text"
                  required
                  placeholder="Tu nombre"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="bg-transparent border-none outline-none text-[var(--color-on-surface)] w-full text-sm placeholder:text-[var(--color-outline)]"
                />
              </div>
            </div>

            {/* Email */}
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

            {/* Contraseña */}
            <div>
              <label className="label-caps text-[var(--color-on-surface-variant)] block mb-2">CONTRASEÑA</label>
              <div className="flex items-center bg-[var(--color-surface-container)] border border-[var(--color-outline-variant)]/30 rounded-lg px-4 py-3 focus-within:border-[var(--color-primary)]/60 transition-colors">
                <span className="material-symbols-outlined text-[var(--color-outline)] mr-3 text-xl">lock</span>
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  minLength={8}
                  placeholder="Mínimo 8 caracteres"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="bg-transparent border-none outline-none text-[var(--color-on-surface)] w-full text-sm placeholder:text-[var(--color-outline)]"
                />
                <button type="button" onClick={() => setShowPassword((v) => !v)} className="text-[var(--color-outline)] hover:text-[var(--color-on-surface)] transition-colors ml-2">
                  <span className="material-symbols-outlined text-xl">
                    {showPassword ? 'visibility_off' : 'visibility'}
                  </span>
                </button>
              </div>
            </div>

            <button
              type="submit"
              className="glow-primary w-full py-4 bg-[var(--color-primary-container)] text-[var(--color-on-primary-container)] label-caps font-bold rounded-lg hover:bg-[var(--color-primary)] active:scale-[0.98] transition-all mt-2"
            >
              CREAR CUENTA
            </button>
          </form>

          <p className="text-center text-[var(--color-on-surface-variant)] text-sm mt-6">
            ¿Ya tienes cuenta?{' '}
            <Link to="/login" className="text-[var(--color-primary)] hover:underline font-medium">
              Inicia sesión
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}
