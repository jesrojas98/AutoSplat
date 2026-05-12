import { NavLink } from 'react-router-dom'

const links = [
  { to: '/', label: 'INICIO' },
  { to: '/catalog', label: 'CATÁLOGO' },
  { to: '/publish', label: 'PUBLICAR' },
  { to: '/dashboard', label: 'MI CUENTA' },
]

export function Navbar() {
  return (
    <header
      className="sticky top-0 z-50 border-b border-[var(--color-outline-variant)]/30"
      style={{ background: 'rgba(17,19,27,0.8)', backdropFilter: 'blur(20px)' }}
    >
      <div className="flex justify-between items-center h-20 px-[var(--spacing-gutter)] max-w-[var(--spacing-max-width)] mx-auto w-full">
        {/* Logo + Nav */}
        <div className="flex items-center gap-8">
          <NavLink
            to="/"
            className="text-2xl font-bold tracking-tighter text-[var(--color-on-surface)]"
            style={{ fontFamily: 'var(--font-headline)' }}
          >
            AutoSplat
          </NavLink>

          <nav className="hidden md:flex items-center gap-6">
            {links.map(({ to, label }) => (
              <NavLink
                key={to}
                to={to}
                end={to === '/'}
                className={({ isActive }) =>
                  [
                    'label-caps transition-colors duration-200 pb-1',
                    isActive
                      ? 'text-[var(--color-primary)] border-b-2 border-[var(--color-primary)]'
                      : 'text-[var(--color-on-surface-variant)] hover:text-[var(--color-on-surface)]',
                  ].join(' ')
                }
              >
                {label}
              </NavLink>
            ))}
          </nav>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2">
          <button className="p-2 rounded-full hover:bg-[var(--color-surface-container-highest)]/50 transition-colors">
            <span className="material-symbols-outlined text-[var(--color-primary)]">notifications</span>
          </button>
          <button className="p-2 rounded-full hover:bg-[var(--color-surface-container-highest)]/50 transition-colors">
            <span className="material-symbols-outlined text-[var(--color-primary)]">account_circle</span>
          </button>
        </div>
      </div>
    </header>
  )
}
