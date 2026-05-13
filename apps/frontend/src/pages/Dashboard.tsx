import { useState, useEffect } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { formatPriceNumber } from '@/utils/formatters'
import { useAuthStore } from '@/store/auth.store'
import { vehiclesService, type Vehicle } from '@/services/vehicles.service'
import { favoritesService } from '@/services/favorites.service'
import { api } from '@/lib/api'

type Tab = 'publicaciones' | 'favoritos' | 'mensajes' | 'perfil'

const STATUS_CONFIG = {
  published:     { label: 'PUBLICADO',    color: 'text-[var(--color-primary)]',   bg: 'bg-[var(--color-primary)]/10',                    icon: 'check_circle' },
  draft:         { label: 'BORRADOR',     color: 'text-[var(--color-outline)]',   bg: 'bg-[var(--color-surface-container-high)]',         icon: 'edit' },
  processing_3d: { label: 'GENERANDO 3D', color: 'text-[var(--color-tertiary)]',  bg: 'bg-[var(--color-tertiary)]/10',                   icon: 'blur_on' },
  sold:          { label: 'VENDIDO',      color: 'text-[var(--color-secondary)]', bg: 'bg-[var(--color-secondary)]/10',                  icon: 'sell' },
  inactive:      { label: 'INACTIVO',     color: 'text-[var(--color-outline)]',   bg: 'bg-[var(--color-surface-container-high)]',         icon: 'pause_circle' },
} as const

export function Dashboard() {
  const [searchParams, setSearchParams] = useSearchParams()
  const tab: Tab = (searchParams.get('tab') as Tab) ?? 'publicaciones'
  const setTab = (t: Tab) => setSearchParams({ tab: t })

  const { user } = useAuthStore()
  const displayName = user?.user_metadata?.full_name ?? user?.email?.split('@')[0] ?? ''
  const avatarUrl = user?.user_metadata?.avatar_url ?? null
  const [listings, setListings] = useState<Vehicle[]>([])
  const [favorites, setFavorites] = useState<any[]>([])
  const [messages, setMessages] = useState<any[]>([])
  const [loadingListings, setLoadingListings] = useState(true)

  useEffect(() => {
    vehiclesService.getMine().then(setListings).finally(() => setLoadingListings(false))
  }, [])

  useEffect(() => {
    if (tab === 'favoritos') favoritesService.getAll().then(setFavorites)
    if (tab === 'mensajes') api.get('/messages').then((r) => setMessages(r.data))
  }, [tab])

  const stats = [
    { label: 'PUBLICACIONES', value: String(listings.length), icon: 'directions_car' },
    { label: 'VISTAS TOTALES', value: listings.reduce((s, v) => s + (v.views_count ?? 0), 0).toLocaleString('es-CL'), icon: 'visibility' },
    { label: 'MODELOS 3D', value: String(listings.filter((v) => v.has_3d_model).length), icon: 'view_in_ar' },
    { label: 'MENSAJES', value: String(messages.length), icon: 'chat_bubble' },
  ]

  if (!user) return null

  return (
    <div className="px-[var(--spacing-gutter)] py-12 max-w-[var(--spacing-max-width)] mx-auto">

      {/* Header perfil */}
      <div className="glass-card rounded-2xl p-6 mb-8 flex flex-col sm:flex-row items-start sm:items-center gap-6">
        <div className="w-16 h-16 rounded-full bg-[var(--color-primary-container)] flex items-center justify-center shrink-0 overflow-hidden">
          {avatarUrl ? (
            <img src={avatarUrl} alt="" className="w-full h-full object-cover" />
          ) : (
            <span className="material-symbols-outlined text-[var(--color-on-primary-container)]" style={{ fontSize: 32 }}>person</span>
          )}
        </div>
        <div className="flex-1">
          <h1 style={{ fontFamily: 'var(--font-headline)', fontSize: 24, fontWeight: 700 }}>{displayName}</h1>
          <p className="text-[var(--color-on-surface-variant)] text-sm">{user.email}</p>
          <div className="flex items-center gap-3 mt-2">
            <span className="label-caps text-[10px] bg-[var(--color-primary-container)] text-[var(--color-on-primary-container)] px-2 py-1 rounded">
              VENDEDOR
            </span>
          </div>
        </div>
        <Link to="/publish"
          className="glow-primary px-6 py-3 bg-[var(--color-primary-container)] text-[var(--color-on-primary-container)] label-caps font-bold rounded-lg hover:bg-[var(--color-primary)] transition-all flex items-center gap-2 shrink-0">
          <span className="material-symbols-outlined text-base">add</span>
          PUBLICAR VEHÍCULO
        </Link>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        {stats.map(({ label, value, icon }) => (
          <div key={label} className="glass-card rounded-xl p-5 flex items-center gap-4">
            <div className="w-10 h-10 rounded-lg bg-[var(--color-primary)]/10 flex items-center justify-center shrink-0">
              <span className="material-symbols-outlined text-[var(--color-primary)] text-base">{icon}</span>
            </div>
            <div>
              <p style={{ fontFamily: 'var(--font-display)', fontSize: 22, fontWeight: 700 }}>{value}</p>
              <p className="label-caps text-[var(--color-on-surface-variant)] text-[10px]">{label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div className="flex gap-1 mb-6 border-b border-[var(--color-outline-variant)]/30">
        {([
          { id: 'publicaciones', label: 'Mis publicaciones', icon: 'directions_car' },
          { id: 'favoritos',     label: 'Favoritos',         icon: 'favorite' },
          { id: 'mensajes',      label: 'Mensajes',          icon: 'chat_bubble' },
          { id: 'perfil',        label: 'Mi perfil',         icon: 'manage_accounts' },
        ] as { id: Tab; label: string; icon: string }[]).map((t) => (
          <button key={t.id} onClick={() => setTab(t.id)}
            className={`flex items-center gap-2 px-4 py-3 label-caps text-xs border-b-2 transition-all -mb-px ${
              tab === t.id
                ? 'border-[var(--color-primary)] text-[var(--color-primary)]'
                : 'border-transparent text-[var(--color-on-surface-variant)] hover:text-[var(--color-on-surface)]'
            }`}>
            <span className="material-symbols-outlined text-base">{t.icon}</span>
            <span className="hidden sm:inline">{t.label.toUpperCase()}</span>
          </button>
        ))}
      </div>

      {/* Tab: Mis publicaciones */}
      {tab === 'publicaciones' && (
        <div className="flex flex-col gap-4">
          {loadingListings ? (
            Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="glass-card rounded-xl p-4 h-24 animate-pulse bg-[var(--color-surface-container-high)]" />
            ))
          ) : listings.length === 0 ? (
            <EmptyState icon="directions_car" text="Aún no tienes publicaciones." action={{ label: 'PUBLICAR VEHÍCULO', to: '/publish' }} />
          ) : listings.map((v) => {
            const st = STATUS_CONFIG[v.status as keyof typeof STATUS_CONFIG] ?? STATUS_CONFIG.draft
            const thumb = v.vehicle_images?.[0]?.thumbnail_url ?? v.vehicle_images?.[0]?.image_url ?? ''
            return (
              <div key={v.id} className="glass-card rounded-xl p-4 flex flex-col sm:flex-row gap-4 items-start sm:items-center">
                <div className="w-24 h-16 rounded-lg overflow-hidden shrink-0 bg-[var(--color-surface-container-high)]">
                  {thumb && <img src={thumb} alt="" className="w-full h-full object-cover" />}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 style={{ fontFamily: 'var(--font-headline)', fontWeight: 600 }}>{v.brand} {v.model} {v.year}</h3>
                    {v.has_3d_model && (
                      <span className="label-caps text-[9px] bg-[var(--color-primary)]/10 text-[var(--color-primary)] px-1.5 py-0.5 rounded">3D</span>
                    )}
                  </div>
                  <div className="flex flex-wrap items-center gap-3">
                    <span className="flex items-baseline gap-1">
                      <span style={{ fontFamily: 'var(--font-display)', fontWeight: 700 }} className="text-lg">{formatPriceNumber(v.price)}</span>
                      <span className="label-caps text-[var(--color-on-surface-variant)] text-[10px]">CLP</span>
                    </span>
                    <span className="flex items-center gap-1 text-[var(--color-on-surface-variant)] text-sm">
                      <span className="material-symbols-outlined text-sm">visibility</span>
                      {(v.views_count ?? 0).toLocaleString('es-CL')} vistas
                    </span>
                  </div>
                </div>
                <div className="flex items-center gap-3 shrink-0">
                  <span className={`flex items-center gap-1.5 label-caps text-[10px] px-3 py-1.5 rounded-full ${st.bg} ${st.color}`}>
                    <span className="material-symbols-outlined text-sm">{st.icon}</span>
                    {st.label}
                  </span>
                  <Link to={`/vehicles/${v.id}`}
                    className="p-2 rounded-lg hover:bg-[var(--color-surface-container-high)] transition-colors" title="Ver publicación">
                    <span className="material-symbols-outlined text-[var(--color-on-surface-variant)] text-base">open_in_new</span>
                  </Link>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Tab: Favoritos */}
      {tab === 'favoritos' && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {favorites.length === 0
            ? <EmptyState icon="favorite" text="No tienes vehículos guardados." />
            : favorites.map((fav: any) => {
                const v = fav.vehicle
                if (!v) return null
                const thumb = v.vehicle_images?.[0]?.image_url ?? ''
                return (
                  <Link key={fav.id} to={`/vehicles/${v.id}`}
                    className="glass-card rounded-xl overflow-hidden group flex flex-col hover:border-[var(--color-primary)]/50 transition-all">
                    <div className="aspect-[16/9] overflow-hidden bg-[var(--color-surface-container-high)]">
                      {thumb && <img src={thumb} alt="" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />}
                    </div>
                    <div className="p-4">
                      <p className="label-caps text-[var(--color-on-surface-variant)] text-[10px] mb-1">{v.year} · {v.brand}</p>
                      <p style={{ fontFamily: 'var(--font-headline)', fontWeight: 600 }}>{v.model}</p>
                      <p className="flex items-baseline gap-1 mt-1">
                        <span style={{ fontFamily: 'var(--font-display)', fontWeight: 700 }} className="text-lg">{formatPriceNumber(v.price)}</span>
                        <span className="label-caps text-[var(--color-on-surface-variant)] text-[10px]">CLP</span>
                      </p>
                    </div>
                  </Link>
                )
              })
          }
        </div>
      )}

      {/* Tab: Mensajes */}
      {tab === 'mensajes' && (
        <div className="flex flex-col gap-3">
          {messages.length === 0
            ? <EmptyState icon="chat_bubble" text="No tienes mensajes aún." />
            : messages.map((msg: any) => {
                const other = msg.sender?.id === user.id ? msg.receiver : msg.sender
                return (
                  <div key={msg.id} className={`glass-card rounded-xl p-4 flex gap-4 items-start cursor-pointer hover:border-[var(--color-primary)]/40 transition-all ${!msg.read_at ? 'border-[var(--color-primary)]/30' : ''}`}>
                    <div className="w-10 h-10 rounded-full bg-[var(--color-surface-container-high)] flex items-center justify-center shrink-0">
                      <span className="material-symbols-outlined text-[var(--color-on-surface-variant)] text-base">person</span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2 mb-1">
                        <p style={{ fontWeight: 600 }} className="text-sm truncate">{other?.name ?? 'Usuario'}</p>
                        <span className="label-caps text-[var(--color-outline)] text-[10px] shrink-0">
                          {new Date(msg.created_at).toLocaleDateString('es-CL')}
                        </span>
                      </div>
                      {msg.vehicle && (
                        <p className="label-caps text-[var(--color-primary)] text-[10px] mb-1">
                          {msg.vehicle.brand} {msg.vehicle.model} {msg.vehicle.year}
                        </p>
                      )}
                      <p className="text-[var(--color-on-surface-variant)] text-sm truncate">{msg.content}</p>
                    </div>
                    {!msg.read_at && msg.receiver_id === user.id && (
                      <div className="w-2 h-2 rounded-full bg-[var(--color-primary)] shrink-0 mt-1" />
                    )}
                  </div>
                )
              })
          }
        </div>
      )}

      {/* Tab: Perfil */}
      {tab === 'perfil' && (
        <div className="max-w-lg">
          <div className="glass-card rounded-xl p-6 flex flex-col gap-5">
            <h2 style={{ fontFamily: 'var(--font-headline)', fontSize: 18, fontWeight: 600 }} className="mb-2">Información personal</h2>
            {[
              { label: 'NOMBRE', value: displayName, icon: 'person' },
              { label: 'CORREO', value: user.email ?? '', icon: 'mail' },
              { label: 'ROL', value: 'Vendedor', icon: 'storefront' },
            ].map(({ label, value, icon }) => (
              <div key={label} className="flex items-center gap-4 py-3 border-b border-[var(--color-outline-variant)]/20 last:border-0">
                <span className="material-symbols-outlined text-[var(--color-primary)] text-base">{icon}</span>
                <div className="flex-1">
                  <p className="label-caps text-[var(--color-on-surface-variant)] text-[10px]">{label}</p>
                  <p className="text-[var(--color-on-surface)] text-sm mt-0.5">{value}</p>
                </div>
              </div>
            ))}
            <button className="glow-primary w-full py-3 bg-[var(--color-primary-container)] text-[var(--color-on-primary-container)] label-caps font-bold rounded-lg hover:bg-[var(--color-primary)] transition-all mt-2">
              EDITAR PERFIL
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

function EmptyState({ icon, text, action }: { icon: string; text: string; action?: { label: string; to: string } }) {
  return (
    <div className="flex flex-col items-center justify-center py-20 col-span-full text-center gap-4">
      <span className="material-symbols-outlined text-[var(--color-outline)]" style={{ fontSize: 52 }}>{icon}</span>
      <p className="text-[var(--color-on-surface-variant)]">{text}</p>
      {action && (
        <Link to={action.to} className="glow-primary px-6 py-2 bg-[var(--color-primary-container)] text-[var(--color-on-primary-container)] label-caps text-xs font-bold rounded-lg hover:bg-[var(--color-primary)] transition-all">
          {action.label}
        </Link>
      )}
    </div>
  )
}
