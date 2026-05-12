import { useEffect, useRef, useState } from 'react'
import { NavLink, Link, useNavigate } from 'react-router-dom'
import { useThemeStore } from '@/store/theme.store'
import { useAuthStore } from '@/store/auth.store'

const links = [
  { to: '/', label: 'INICIO' },
  { to: '/catalog', label: 'CATÁLOGO' },
  { to: '/publish', label: 'PUBLICAR' },
  { to: '/dashboard', label: 'MI CUENTA' },
]

const MOCK_NOTIFICATIONS = [
  { id: 1, icon: 'chat_bubble', text: 'Carlos Méndez preguntó por tu Porsche 911', time: 'hace 2h', unread: true },
  { id: 2, icon: 'visibility', text: 'Tu publicación superó las 1.000 vistas', time: 'hace 5h', unread: true },
  { id: 3, icon: 'blur_on', text: 'El modelo 3D de tu BMW M5 está listo', time: 'ayer', unread: false },
  { id: 4, icon: 'favorite', text: 'Alguien guardó tu Porsche 911 GT3', time: 'ayer', unread: false },
]


export function Navbar() {
  const { theme, toggle } = useThemeStore()
  const { user, logout } = useAuthStore()
  const navigate = useNavigate()
  const [notifOpen, setNotifOpen] = useState(false)
  const [userOpen, setUserOpen] = useState(false)

  const notifRef = useRef<HTMLDivElement>(null)
  const userRef = useRef<HTMLDivElement>(null)

  const unreadCount = MOCK_NOTIFICATIONS.filter((n) => n.unread).length

  // Cierra dropdown al hacer click fuera
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) setNotifOpen(false)
      if (userRef.current && !userRef.current.contains(e.target as Node)) setUserOpen(false)
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  return (
    <header className="sticky top-0 z-50 border-b border-[var(--color-outline-variant)]/30 bg-[var(--color-surface)]/80 backdrop-blur-xl transition-colors duration-300">
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
        <div className="flex items-center gap-1">

          {/* Toggle tema */}
          <button
            onClick={toggle}
            title={theme === 'dark' ? 'Cambiar a modo claro' : 'Cambiar a modo oscuro'}
            className="p-2 rounded-full hover:bg-[var(--color-surface-container-high)] transition-all"
          >
            <span
              className="material-symbols-outlined text-[var(--color-primary)]"
              style={{ fontVariationSettings: theme === 'light' ? "'FILL' 1" : "'FILL' 0" }}
            >
              {theme === 'dark' ? 'dark_mode' : 'light_mode'}
            </span>
          </button>

          {/* Notificaciones */}
          <div ref={notifRef} className="relative">
            <button
              onClick={() => { setNotifOpen((v) => !v); setUserOpen(false) }}
              className="relative p-2 rounded-full hover:bg-[var(--color-surface-container-high)] transition-all"
            >
              <span className="material-symbols-outlined text-[var(--color-primary)]">notifications</span>
              {unreadCount > 0 && (
                <span className="absolute top-1 right-1 w-4 h-4 rounded-full bg-[var(--color-secondary-container)] flex items-center justify-center">
                  <span className="label-caps text-[var(--color-on-secondary-container)] text-[8px]">{unreadCount}</span>
                </span>
              )}
            </button>

            {notifOpen && (
              <div className="absolute right-0 top-full mt-2 w-80 dropdown-card rounded-xl overflow-hidden shadow-xl">
                <div className="flex items-center justify-between px-4 py-3 border-b border-[var(--color-outline-variant)]/20">
                  <p style={{ fontFamily: 'var(--font-headline)', fontWeight: 600, fontSize: 14 }}>
                    Notificaciones
                  </p>
                  {unreadCount > 0 && (
                    <button className="label-caps text-[var(--color-primary)] text-[10px] hover:underline">
                      MARCAR TODAS LEÍDAS
                    </button>
                  )}
                </div>

                <div className="max-h-80 overflow-y-auto">
                  {MOCK_NOTIFICATIONS.map((n) => (
                    <div
                      key={n.id}
                      className={`flex items-start gap-3 px-4 py-3 hover:bg-[var(--color-surface-container-high)] transition-colors cursor-pointer border-b border-[var(--color-outline-variant)]/10 last:border-0 ${n.unread ? 'bg-[var(--color-primary)]/5' : ''}`}
                    >
                      <div className="w-8 h-8 rounded-full bg-[var(--color-primary)]/10 flex items-center justify-center shrink-0 mt-0.5">
                        <span className="material-symbols-outlined text-[var(--color-primary)] text-sm">{n.icon}</span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-[var(--color-on-surface)] text-sm leading-snug">{n.text}</p>
                        <p className="label-caps text-[var(--color-outline)] text-[10px] mt-1">{n.time.toUpperCase()}</p>
                      </div>
                      {n.unread && (
                        <div className="w-2 h-2 rounded-full bg-[var(--color-primary)] shrink-0 mt-1.5" />
                      )}
                    </div>
                  ))}
                </div>

                <div className="px-4 py-3 border-t border-[var(--color-outline-variant)]/20">
                  <button className="w-full label-caps text-[var(--color-primary)] text-[10px] hover:underline text-center">
                    VER TODAS LAS NOTIFICACIONES
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Usuario autenticado o botones de acceso */}
          {user ? (
            <div ref={userRef} className="relative">
              <button
                onClick={() => { setUserOpen((v) => !v); setNotifOpen(false) }}
                className="flex items-center gap-2 pl-2 pr-3 py-1.5 rounded-full hover:bg-[var(--color-surface-container-high)] transition-all"
              >
                <div className="w-8 h-8 rounded-full bg-[var(--color-primary-container)] flex items-center justify-center">
                  <span className="material-symbols-outlined text-[var(--color-on-primary-container)] text-base">person</span>
                </div>
                <span className="hidden sm:block label-caps text-[var(--color-on-surface)] text-[10px] max-w-24 truncate">
                  {user.name.split(' ')[0].toUpperCase()}
                </span>
                <span className="material-symbols-outlined text-[var(--color-on-surface-variant)] text-base">
                  {userOpen ? 'expand_less' : 'expand_more'}
                </span>
              </button>

              {userOpen && (
                <div className="absolute right-0 top-full mt-2 w-60 dropdown-card rounded-xl overflow-hidden shadow-xl">
                  <div className="px-4 py-4 border-b border-[var(--color-outline-variant)]/20">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-[var(--color-primary-container)] flex items-center justify-center shrink-0">
                        <span className="material-symbols-outlined text-[var(--color-on-primary-container)] text-base">person</span>
                      </div>
                      <div className="min-w-0">
                        <p style={{ fontWeight: 600, fontSize: 14 }} className="text-[var(--color-on-surface)] truncate">{user.name}</p>
                        <p className="label-caps text-[var(--color-primary)] text-[10px]">{user.role.toUpperCase()}</p>
                      </div>
                    </div>
                  </div>

                  <div className="py-1">
                    {[
                      { to: '/dashboard', icon: 'dashboard', label: 'Mi cuenta' },
                      { to: '/dashboard?tab=mensajes', icon: 'chat_bubble', label: 'Mensajes' },
                      { to: '/publish', icon: 'add_circle', label: 'Publicar vehículo' },
                      { to: '/dashboard?tab=favoritos', icon: 'favorite', label: 'Favoritos' },
                      { to: '/dashboard?tab=perfil', icon: 'manage_accounts', label: 'Mi perfil' },
                    ].map(({ to, icon, label }) => (
                      <Link key={label} to={to} onClick={() => setUserOpen(false)}
                        className="flex items-center gap-3 px-4 py-2.5 hover:bg-[var(--color-surface-container-high)] transition-colors">
                        <span className="material-symbols-outlined text-[var(--color-on-surface-variant)] text-base">{icon}</span>
                        <span className="text-[var(--color-on-surface)] text-sm">{label}</span>
                      </Link>
                    ))}
                  </div>

                  <div className="border-t border-[var(--color-outline-variant)]/20 py-1">
                    <button
                      onClick={() => { logout(); setUserOpen(false); navigate('/') }}
                      className="flex items-center gap-3 px-4 py-2.5 w-full hover:bg-[var(--color-secondary-container)]/20 transition-colors"
                    >
                      <span className="material-symbols-outlined text-[var(--color-secondary)] text-base">logout</span>
                      <span className="text-[var(--color-secondary)] text-sm">Cerrar sesión</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <Link to="/login" className="label-caps text-[10px] text-[var(--color-on-surface-variant)] hover:text-[var(--color-on-surface)] px-3 py-2 transition-colors">
                INGRESAR
              </Link>
              <Link to="/register" className="label-caps text-[10px] px-4 py-2 bg-[var(--color-primary-container)] text-[var(--color-on-primary-container)] rounded-full hover:bg-[var(--color-primary)] transition-all">
                REGISTRARSE
              </Link>
            </div>
          )}

        </div>
      </div>
    </header>
  )
}
