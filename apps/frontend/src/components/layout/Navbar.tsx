import { useEffect, useRef, useState, useCallback } from 'react'
import { NavLink, Link, useNavigate, useLocation } from 'react-router-dom'
import { useThemeStore } from '@/store/theme.store'
import { useAuthStore, getUserRole } from '@/store/auth.store'
import { notificationsService, type Notification } from '@/services/notifications.service'
import { Avatar } from '@/components/ui/Avatar'

const BASE_LINKS = [
  { to: '/', label: 'INICIO' },
  { to: '/catalog', label: 'CATÁLOGO' },
  { to: '/dashboard', label: 'MI CUENTA' },
]

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 60) return `hace ${mins}m`
  const hours = Math.floor(mins / 60)
  if (hours < 24) return `hace ${hours}h`
  const days = Math.floor(hours / 24)
  if (days === 1) return 'ayer'
  return `hace ${days}d`
}

export function Navbar() {
  const { theme, toggle } = useThemeStore()
  const { user, logout } = useAuthStore()
  const role = getUserRole(user)
  const isSeller = role === 'seller' || role === 'admin'
  const displayName: string = user?.user_metadata?.full_name ?? user?.email?.split('@')[0] ?? ''
  const avatarUrl: string | null = user?.user_metadata?.avatar_url ?? null

  const isAdmin = role === 'admin'
  const links = isAdmin
    ? [BASE_LINKS[0], BASE_LINKS[1], { to: '/admin', label: 'ADMIN' }, BASE_LINKS[2]]
    : isSeller
    ? [BASE_LINKS[0], BASE_LINKS[1], { to: '/publish', label: 'PUBLICAR' }, BASE_LINKS[2]]
    : BASE_LINKS
  const navigate = useNavigate()
  const location = useLocation()
  const [notifOpen, setNotifOpen] = useState(false)
  const [userOpen, setUserOpen] = useState(false)
  const [notifications, setNotifications] = useState<Notification[]>([])

  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  const notifRef = useRef<HTMLDivElement>(null)
  const userRef = useRef<HTMLDivElement>(null)

  const unreadCount = notifications.filter((n) => n.read_at === null).length

  const fetchNotifications = useCallback(async () => {
    if (!user) return
    try {
      const data = await notificationsService.getAll()
      setNotifications(data)
    } catch {
      // silently fail — notifications are non-critical
    }
  }, [user])

  useEffect(() => {
    fetchNotifications()
    const interval = setInterval(fetchNotifications, 30000)
    return () => clearInterval(interval)
  }, [fetchNotifications])

  async function handleMarkAllRead() {
    await notificationsService.markAllRead()
    setNotifications((prev) => prev.map((n) => ({ ...n, read_at: new Date().toISOString() })))
  }

  async function handleNotifClick(n: Notification) {
    if (!n.read_at) {
      await notificationsService.markRead(n.id)
      setNotifications((prev) =>
        prev.map((item) => item.id === n.id ? { ...item, read_at: new Date().toISOString() } : item)
      )
    }
    if (n.link) {
      setNotifOpen(false)
      navigate(n.link)
    }
  }

  // Cierra dropdown al hacer click fuera
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) setNotifOpen(false)
      if (userRef.current && !userRef.current.contains(e.target as Node)) setUserOpen(false)
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  // Cierra el menú móvil al cambiar de ruta
  useEffect(() => {
    setMobileMenuOpen(false)
  }, [location.pathname])

  // Bloquea el scroll del body mientras el menú móvil está abierto
  useEffect(() => {
    if (mobileMenuOpen) {
      document.body.style.overflow = 'hidden'
      return () => { document.body.style.overflow = '' }
    }
  }, [mobileMenuOpen])

  return (
    <header className="sticky top-0 z-50 border-b border-[var(--color-outline-variant)]/30 bg-[var(--color-surface)]/80 backdrop-blur-xl transition-colors duration-300">
      <div className="flex justify-between items-center h-16 sm:h-20 px-4 sm:px-[var(--spacing-gutter)] max-w-[var(--spacing-max-width)] mx-auto w-full gap-2">

        {/* Logo + Nav */}
        <div className="flex items-center gap-8 min-w-0">
          <NavLink
            to="/"
            className="relative flex items-center shrink-0 h-8 w-[140px] sm:h-11 sm:w-[230px]"
            aria-label="AutoSplat"
          >
            <img
              src="/brand/autosplat-logo-dark-transparent.png"
              alt="AutoSplat"
              className="brand-logo-dark h-full w-full"
            />
            <img
              src="/brand/autosplat-logo-light-transparent.png"
              alt="AutoSplat"
              className="brand-logo-light h-full w-full"
            />
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
        <div className="flex items-center gap-0.5 sm:gap-1 shrink-0">

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
          {user && (
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
                <div className="fixed sm:absolute left-4 right-4 sm:left-auto sm:right-0 top-16 sm:top-full mt-0 sm:mt-2 w-auto sm:w-80 dropdown-card rounded-xl overflow-hidden shadow-xl">
                  <div className="flex items-center justify-between px-4 py-3 border-b border-[var(--color-outline-variant)]/20">
                    <p style={{ fontFamily: 'var(--font-headline)', fontWeight: 600, fontSize: 14 }}>
                      Notificaciones
                    </p>
                    {unreadCount > 0 && (
                      <button
                        onClick={handleMarkAllRead}
                        className="label-caps text-[var(--color-primary)] text-[10px] hover:underline"
                      >
                        MARCAR TODAS LEÍDAS
                      </button>
                    )}
                  </div>

                  <div className="max-h-80 overflow-y-auto">
                    {notifications.length === 0 ? (
                      <div className="flex flex-col items-center justify-center py-10 gap-2 text-[var(--color-outline)]">
                        <span className="material-symbols-outlined text-3xl">notifications_none</span>
                        <p className="text-sm">Sin notificaciones</p>
                      </div>
                    ) : (
                      notifications.map((n) => (
                        <div
                          key={n.id}
                          onClick={() => handleNotifClick(n)}
                          className={`flex items-start gap-3 px-4 py-3 hover:bg-[var(--color-surface-container-high)] transition-colors cursor-pointer border-b border-[var(--color-outline-variant)]/10 last:border-0 ${n.read_at === null ? 'bg-[var(--color-primary)]/5' : ''}`}
                        >
                          <div className="w-8 h-8 rounded-full bg-[var(--color-primary)]/10 flex items-center justify-center shrink-0 mt-0.5">
                            <span className="material-symbols-outlined text-[var(--color-primary)] text-sm">{n.icon}</span>
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-[var(--color-on-surface)] text-sm font-medium leading-snug">{n.title}</p>
                            <p className="text-[var(--color-on-surface-variant)] text-xs leading-snug mt-0.5">{n.body}</p>
                            <p className="label-caps text-[var(--color-outline)] text-[10px] mt-1">{timeAgo(n.created_at).toUpperCase()}</p>
                          </div>
                          {n.read_at === null && (
                            <div className="w-2 h-2 rounded-full bg-[var(--color-primary)] shrink-0 mt-1.5" />
                          )}
                        </div>
                      ))
                    )}
                  </div>

                  <div className="px-4 py-3 border-t border-[var(--color-outline-variant)]/20">
                    <Link
                      to="/dashboard?tab=notificaciones"
                      onClick={() => setNotifOpen(false)}
                      className="w-full label-caps text-[var(--color-primary)] text-[10px] hover:underline text-center block"
                    >
                      VER TODAS LAS NOTIFICACIONES
                    </Link>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Usuario autenticado o botones de acceso */}
          {user ? (
            <div ref={userRef} className="relative">
              <button
                onClick={() => { setUserOpen((v) => !v); setNotifOpen(false) }}
                className="flex items-center gap-2 p-1 sm:pl-2 sm:pr-3 sm:py-1.5 rounded-full hover:bg-[var(--color-surface-container-high)] transition-all"
              >
                <div className="w-8 h-8 rounded-full overflow-hidden">
                  <Avatar src={avatarUrl} name={displayName} size={32} className="rounded-full" />
                </div>
                <span className="hidden sm:block label-caps text-[var(--color-on-surface)] text-[10px] max-w-24 truncate">
                  {displayName.split(' ')[0].toUpperCase()}
                </span>
                <span className="hidden sm:inline material-symbols-outlined text-[var(--color-on-surface-variant)] text-base">
                  {userOpen ? 'expand_less' : 'expand_more'}
                </span>
              </button>

              {userOpen && (
                <div className="absolute right-0 top-full mt-2 w-60 max-w-[calc(100vw-2rem)] dropdown-card rounded-xl overflow-hidden shadow-xl">
                  <div className="px-4 py-4 border-b border-[var(--color-outline-variant)]/20">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full overflow-hidden shrink-0">
                        <Avatar src={avatarUrl} name={displayName} size={40} className="rounded-full" />
                      </div>
                      <div className="min-w-0">
                        <p style={{ fontWeight: 600, fontSize: 14 }} className="text-[var(--color-on-surface)] truncate">{displayName}</p>
                        <p className="label-caps text-[var(--color-primary)] text-[10px]">{user.email}</p>
                      </div>
                    </div>
                  </div>

                  <div className="py-1">
                    {[
                      { to: '/dashboard', icon: 'directions_car', label: 'Mis publicaciones' },
                      { to: '/dashboard?tab=mensajes', icon: 'chat_bubble', label: 'Mensajes' },
                      ...(isSeller ? [{ to: '/publish', icon: 'add_circle', label: 'Publicar vehículo' }] : []),
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
                      onClick={() => { logout().then(() => { setUserOpen(false); navigate('/') }) }}
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
            <div className="hidden sm:flex items-center gap-2">
              <Link to="/login" className="label-caps text-[10px] whitespace-nowrap text-[var(--color-on-surface-variant)] hover:text-[var(--color-on-surface)] px-3 py-2 transition-colors">
                INGRESAR
              </Link>
              <Link to="/register" className="label-caps text-[10px] whitespace-nowrap px-4 py-2 bg-[var(--color-primary-container)] text-[var(--color-on-primary-container)] rounded-full hover:bg-[var(--color-primary)] transition-all">
                REGISTRARSE
              </Link>
            </div>
          )}

          {/* Botón hamburguesa (solo mobile) */}
          <button
            onClick={() => setMobileMenuOpen((v) => !v)}
            className="md:hidden p-2 rounded-full hover:bg-[var(--color-surface-container-high)] transition-all"
            aria-label={mobileMenuOpen ? 'Cerrar menú' : 'Abrir menú'}
            aria-expanded={mobileMenuOpen}
          >
            <span className="material-symbols-outlined text-[var(--color-on-surface)]">
              {mobileMenuOpen ? 'close' : 'menu'}
            </span>
          </button>

        </div>
      </div>

      {/* Menú móvil — overlay + panel deslizante */}
      {mobileMenuOpen && (
        <>
          <div
            className="md:hidden fixed inset-0 top-16 bg-black/50 z-40"
            onClick={() => setMobileMenuOpen(false)}
          />
          <div className="md:hidden fixed inset-x-0 top-16 z-40 bg-[var(--color-surface)] border-b border-[var(--color-outline-variant)]/30 max-h-[calc(100vh-4rem)] overflow-y-auto">
            <nav className="flex flex-col px-4 py-2">
              {links.map(({ to, label }) => (
                <NavLink
                  key={to}
                  to={to}
                  end={to === '/'}
                  className={({ isActive }) =>
                    [
                      'label-caps text-sm py-3.5 border-b border-[var(--color-outline-variant)]/15 transition-colors',
                      isActive
                        ? 'text-[var(--color-primary)]'
                        : 'text-[var(--color-on-surface-variant)]',
                    ].join(' ')
                  }
                >
                  {label}
                </NavLink>
              ))}
            </nav>

            {user ? (
              <div className="px-4 pb-4">
                <div className="flex items-center gap-3 py-3 border-b border-[var(--color-outline-variant)]/15">
                  <div className="w-10 h-10 rounded-full overflow-hidden shrink-0">
                    <Avatar src={avatarUrl} name={displayName} size={40} className="rounded-full" />
                  </div>
                  <div className="min-w-0">
                    <p style={{ fontWeight: 600, fontSize: 14 }} className="text-[var(--color-on-surface)] truncate">{displayName}</p>
                    <p className="label-caps text-[var(--color-primary)] text-[10px] truncate">{user.email}</p>
                  </div>
                </div>

                <div className="flex flex-col">
                  {[
                    { to: '/dashboard', icon: 'directions_car', label: 'Mis publicaciones' },
                    { to: '/dashboard?tab=mensajes', icon: 'chat_bubble', label: 'Mensajes' },
                    ...(isSeller ? [{ to: '/publish', icon: 'add_circle', label: 'Publicar vehículo' }] : []),
                    { to: '/dashboard?tab=favoritos', icon: 'favorite', label: 'Favoritos' },
                    { to: '/dashboard?tab=perfil', icon: 'manage_accounts', label: 'Mi perfil' },
                  ].map(({ to, icon, label }) => (
                    <Link key={label} to={to} onClick={() => setMobileMenuOpen(false)}
                      className="flex items-center gap-3 py-3 border-b border-[var(--color-outline-variant)]/15">
                      <span className="material-symbols-outlined text-[var(--color-on-surface-variant)] text-base">{icon}</span>
                      <span className="text-[var(--color-on-surface)] text-sm">{label}</span>
                    </Link>
                  ))}
                  <button
                    onClick={() => { logout().then(() => { setMobileMenuOpen(false); navigate('/') }) }}
                    className="flex items-center gap-3 py-3 text-left"
                  >
                    <span className="material-symbols-outlined text-[var(--color-secondary)] text-base">logout</span>
                    <span className="text-[var(--color-secondary)] text-sm">Cerrar sesión</span>
                  </button>
                </div>
              </div>
            ) : (
              <div className="px-4 pb-4 flex flex-col gap-2">
                <Link
                  to="/login"
                  onClick={() => setMobileMenuOpen(false)}
                  className="label-caps text-xs text-center py-3 border border-[var(--color-outline-variant)]/40 rounded-lg text-[var(--color-on-surface)]"
                >
                  INGRESAR
                </Link>
                <Link
                  to="/register"
                  onClick={() => setMobileMenuOpen(false)}
                  className="label-caps text-xs text-center py-3 bg-[var(--color-primary-container)] text-[var(--color-on-primary-container)] rounded-lg"
                >
                  REGISTRARSE
                </Link>
              </div>
            )}
          </div>
        </>
      )}
    </header>
  )
}
