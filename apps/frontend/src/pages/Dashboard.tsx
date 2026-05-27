import { useState, useEffect, useRef } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { Avatar } from '@/components/ui/Avatar'
import { formatPriceNumber } from '@/utils/formatters'
import { useAuthStore, getUserRole } from '@/store/auth.store'
import { vehiclesService, type Vehicle } from '@/services/vehicles.service'
import { favoritesService } from '@/services/favorites.service'
import { api } from '@/lib/api'
import { supabase } from '@/lib/supabase'

type Tab = 'publicaciones' | 'favoritos' | 'mensajes' | 'perfil'

const ROLE_LABELS: Record<string, string> = {
  buyer: 'Comprador',
  seller: 'Vendedor',
  admin: 'Administrador',
}

const STATUS_CONFIG = {
  published:     { label: 'PUBLICADO',    color: 'text-[var(--color-primary)]',   bg: 'bg-[var(--color-primary)]/10',             icon: 'check_circle' },
  draft:         { label: 'BORRADOR',     color: 'text-[var(--color-outline)]',   bg: 'bg-[var(--color-surface-container-high)]', icon: 'edit' },
  processing_3d: { label: 'GENERANDO 3D', color: 'text-[var(--color-tertiary)]',  bg: 'bg-[var(--color-tertiary)]/10',            icon: 'blur_on' },
  sold:          { label: 'VENDIDO',      color: 'text-[var(--color-secondary)]', bg: 'bg-[var(--color-secondary)]/10',           icon: 'sell' },
  inactive:      { label: 'INACTIVO',     color: 'text-[var(--color-outline)]',   bg: 'bg-[var(--color-surface-container-high)]', icon: 'pause_circle' },
} as const

export function Dashboard() {
  const [searchParams, setSearchParams] = useSearchParams()
  const navigate = useNavigate()
  const tab: Tab = (searchParams.get('tab') as Tab) ?? 'publicaciones'
  const setTab = (t: Tab) => setSearchParams({ tab: t })

  const { user, loading: authLoading } = useAuthStore()
  const role = getUserRole(user)
  const isSeller = role === 'seller' || role === 'admin'
  const displayName = user?.user_metadata?.full_name ?? user?.email?.split('@')[0] ?? ''
  const avatarUrl = user?.user_metadata?.avatar_url ?? null

  const [listings, setListings] = useState<Vehicle[]>([])
  const [favorites, setFavorites] = useState<any[]>([])
  const [messages, setMessages] = useState<any[]>([])
  const [loadingListings, setLoadingListings] = useState(true)
  const [confirmDelete, setConfirmDelete] = useState<Vehicle | null>(null)
  const [deleting, setDeleting] = useState(false)
  const [listingSearch, setListingSearch] = useState('')
  const [listingStatusFilter, setListingStatusFilter] = useState<string>('all')

  // Profile edit state
  const [editMode, setEditMode] = useState(false)
  const [editName, setEditName] = useState(displayName)
  const [editPhone, setEditPhone] = useState('')
  const [savingProfile, setSavingProfile] = useState(false)
  const [profileError, setProfileError] = useState('')
  const [uploadingAvatar, setUploadingAvatar] = useState(false)
  const [localAvatar, setLocalAvatar] = useState<string | null>(null)
  const avatarInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    vehiclesService.getMine().then(setListings).finally(() => setLoadingListings(false))
    api.get('/messages').then((r) => setMessages(r.data)).catch(() => {})
  }, [])

  useEffect(() => {
    if (tab === 'favoritos') favoritesService.getAll().then(setFavorites)
    if (tab === 'mensajes') api.get('/messages').then((r) => setMessages(r.data))
  }, [tab])

  async function handleSaveProfile(e: React.FormEvent) {
    e.preventDefault()
    setSavingProfile(true)
    setProfileError('')
    try {
      await api.patch('/users/me', { name: editName, phone: editPhone || undefined })
      setEditMode(false)
    } catch {
      setProfileError('Error al guardar los cambios')
    } finally {
      setSavingProfile(false)
    }
  }

  async function handleAvatarChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setUploadingAvatar(true)
    try {
      const form = new FormData()
      form.append('avatar', file)
      const { data } = await api.post<{ url: string }>('/upload/avatar', form)
      await api.patch('/users/me', { avatar_url: data.url })
      await supabase.auth.updateUser({ data: { avatar_url: data.url } })
      setLocalAvatar(data.url)
    } catch {
      // silently fail — avatar is non-critical
    } finally {
      setUploadingAvatar(false)
      e.target.value = ''
    }
  }

  async function handleDelete(vehicle: Vehicle) {
    setDeleting(true)
    try {
      await vehiclesService.remove(vehicle.id)
      setListings((prev) => prev.filter((v) => v.id !== vehicle.id))
      setConfirmDelete(null)
    } catch {
      // silently fail — user stays on page
    } finally {
      setDeleting(false)
    }
  }

  const stats = [
    { label: 'PUBLICACIONES', value: String(listings.length), icon: 'directions_car' },
    { label: 'VISTAS TOTALES', value: listings.reduce((s, v) => s + (v.views_count ?? 0), 0).toLocaleString('es-CL'), icon: 'visibility' },
    { label: 'MODELOS 3D', value: String(listings.filter((v) => v.has_3d_model).length), icon: 'view_in_ar' },
    { label: 'MENSAJES', value: String(messages.length), icon: 'chat_bubble' },
  ]

  if (authLoading) return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <span className="material-symbols-outlined text-[var(--color-primary)] animate-spin" style={{ fontSize: 40 }}>progress_activity</span>
    </div>
  )

  if (!user) return null

  return (
    <div className="px-[var(--spacing-gutter)] py-12 max-w-[var(--spacing-max-width)] mx-auto">

      {/* Header perfil */}
      <div className="glass-card rounded-2xl p-6 mb-8 flex flex-col sm:flex-row items-start sm:items-center gap-6">
        <div className="w-16 h-16 rounded-full overflow-hidden shrink-0">
          <Avatar src={avatarUrl} name={displayName} size={64} className="rounded-full" />
        </div>
        <div className="flex-1">
          <h1 style={{ fontFamily: 'var(--font-headline)', fontSize: 24, fontWeight: 700 }}>{displayName}</h1>
          <p className="text-[var(--color-on-surface-variant)] text-sm">{user.email}</p>
          <div className="flex items-center gap-3 mt-2">
            <span className="label-caps text-[10px] bg-[var(--color-primary-container)] text-[var(--color-on-primary-container)] px-2 py-1 rounded">
              {(ROLE_LABELS[role] ?? role).toUpperCase()}
            </span>
          </div>
        </div>
        {isSeller && (
          <Link to="/publish"
            className="glow-primary px-6 py-3 bg-[var(--color-primary-container)] text-[var(--color-on-primary-container)] label-caps font-bold rounded-lg hover:bg-[var(--color-primary)] transition-all flex items-center gap-2 shrink-0">
            <span className="material-symbols-outlined text-base">add</span>
            PUBLICAR VEHÍCULO
          </Link>
        )}
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
          {/* Barra de filtros (solo cuando hay publicaciones) */}
          {!loadingListings && listings.length > 0 && (
            <div className="glass-card rounded-xl px-4 py-3 flex flex-col sm:flex-row gap-3 items-start sm:items-center">
              <div className="relative flex-1 min-w-0">
                <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-[var(--color-outline)] text-base">search</span>
                <input
                  value={listingSearch}
                  onChange={(e) => setListingSearch(e.target.value)}
                  placeholder="Buscar por marca, modelo..."
                  className="pl-9 pr-4 py-2 w-full rounded-lg border border-[var(--color-outline-variant)]/30 bg-[var(--color-surface-container)] text-[var(--color-on-surface)] text-sm outline-none focus:border-[var(--color-primary)]/60 transition-colors"
                />
              </div>
              <div className="flex items-center gap-1.5 flex-wrap">
                {([
                  { value: 'all',          label: 'Todos' },
                  { value: 'published',    label: 'Publicados' },
                  { value: 'draft',        label: 'Borradores' },
                  { value: 'inactive',     label: 'Inactivos' },
                  { value: 'sold',         label: 'Vendidos' },
                  { value: 'processing_3d',label: '3D' },
                ] as { value: string; label: string }[])
                  .filter(f => f.value === 'all' || listings.some(v => v.status === f.value))
                  .map((f) => (
                    <button
                      key={f.value}
                      type="button"
                      onClick={() => setListingStatusFilter(f.value)}
                      className={`px-3 py-1.5 rounded-lg label-caps text-[10px] transition-all ${
                        listingStatusFilter === f.value
                          ? 'bg-[var(--color-primary-container)] text-[var(--color-on-primary-container)] border border-[var(--color-primary)]/30'
                          : 'border border-[var(--color-outline-variant)]/30 text-[var(--color-on-surface-variant)] hover:bg-[var(--color-surface-container-high)]'
                      }`}
                    >
                      {f.label}
                    </button>
                  ))
                }
              </div>
            </div>
          )}

          {(() => {
            const filtered = listings.filter((v) => {
              const matchesStatus = listingStatusFilter === 'all' || v.status === listingStatusFilter
              const q = listingSearch.toLowerCase()
              const matchesSearch = !q || `${v.brand} ${v.model} ${v.year}`.toLowerCase().includes(q)
              return matchesStatus && matchesSearch
            })
            return loadingListings ? (
            Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="glass-card rounded-xl p-4 h-24 animate-pulse bg-[var(--color-surface-container-high)]" />
            ))
          ) : listings.length === 0 ? (
            <EmptyState icon="directions_car" text="Aún no tienes publicaciones." action={isSeller ? { label: 'PUBLICAR VEHÍCULO', to: '/publish' } : undefined} />
          ) : filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 gap-3 text-center">
              <span className="material-symbols-outlined text-[var(--color-outline)]" style={{ fontSize: 44 }}>search_off</span>
              <p className="text-[var(--color-on-surface-variant)] text-sm">Sin resultados para ese filtro.</p>
              <button type="button" onClick={() => { setListingSearch(''); setListingStatusFilter('all') }}
                className="label-caps text-[10px] text-[var(--color-primary)] hover:underline">LIMPIAR FILTROS</button>
            </div>
          ) : filtered.map((v) => {
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
                <div className="flex items-center gap-2 shrink-0">
                  <span className={`flex items-center gap-1.5 label-caps text-[10px] px-3 py-1.5 rounded-full ${st.bg} ${st.color}`}>
                    <span className="material-symbols-outlined text-sm">{st.icon}</span>
                    {st.label}
                  </span>
                  <Link to={`/vehicles/${v.id}`}
                    className="p-2 rounded-lg hover:bg-[var(--color-surface-container-high)] transition-colors" title="Ver publicación">
                    <span className="material-symbols-outlined text-[var(--color-on-surface-variant)] text-base">open_in_new</span>
                  </Link>
                  <button
                    type="button"
                    onClick={() => navigate(`/vehicles/${v.id}/edit`)}
                    className="p-2 rounded-lg hover:bg-[var(--color-primary)]/10 transition-colors"
                    title="Editar publicación"
                  >
                    <span className="material-symbols-outlined text-[var(--color-primary)] text-base">edit</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setConfirmDelete(v)}
                    className="p-2 rounded-lg hover:bg-[var(--color-secondary)]/10 transition-colors"
                    title="Eliminar publicación"
                  >
                    <span className="material-symbols-outlined text-[var(--color-secondary)] text-base">delete</span>
                  </button>
                </div>
              </div>
            )
          })
          })()}
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

            {/* Avatar */}
            <div className="flex items-center gap-5 pb-4 border-b border-[var(--color-outline-variant)]/20">
              <div className="relative shrink-0">
                <div className="w-20 h-20 rounded-full overflow-hidden">
                  <Avatar src={localAvatar ?? avatarUrl} name={displayName} size={80} className="rounded-full" />
                </div>
                {uploadingAvatar && (
                  <div className="absolute inset-0 rounded-full bg-black/50 flex items-center justify-center">
                    <span className="material-symbols-outlined text-white animate-spin text-xl">progress_activity</span>
                  </div>
                )}
              </div>
              <div>
                <p className="text-[var(--color-on-surface)] text-sm font-medium mb-1">{displayName}</p>
                <input ref={avatarInputRef} type="file" accept="image/*" className="hidden" onChange={handleAvatarChange} />
                <button
                  type="button"
                  onClick={() => avatarInputRef.current?.click()}
                  disabled={uploadingAvatar}
                  className="label-caps text-[10px] px-3 py-1.5 border border-[var(--color-outline-variant)]/50 rounded-lg hover:bg-[var(--color-surface-container)] transition-colors disabled:opacity-50 flex items-center gap-1.5"
                >
                  <span className="material-symbols-outlined text-sm">photo_camera</span>
                  CAMBIAR FOTO
                </button>
              </div>
            </div>

            {!editMode ? (
              <>
                {[
                  { label: 'NOMBRE', value: displayName, icon: 'person' },
                  { label: 'CORREO', value: user.email ?? '', icon: 'mail' },
                  { label: 'ROL', value: ROLE_LABELS[role] ?? role, icon: 'storefront' },
                ].map(({ label, value, icon }) => (
                  <div key={label} className="flex items-center gap-4 py-3 border-b border-[var(--color-outline-variant)]/20 last:border-0">
                    <span className="material-symbols-outlined text-[var(--color-primary)] text-base">{icon}</span>
                    <div className="flex-1">
                      <p className="label-caps text-[var(--color-on-surface-variant)] text-[10px]">{label}</p>
                      <p className="text-[var(--color-on-surface)] text-sm mt-0.5">{value}</p>
                    </div>
                  </div>
                ))}
                <button
                  onClick={() => { setEditName(displayName); setEditMode(true) }}
                  className="glow-primary w-full py-3 bg-[var(--color-primary-container)] text-[var(--color-on-primary-container)] label-caps font-bold rounded-lg hover:bg-[var(--color-primary)] transition-all mt-2"
                >
                  EDITAR PERFIL
                </button>
              </>
            ) : (
              <form onSubmit={handleSaveProfile} className="flex flex-col gap-4">
                {profileError && (
                  <div className="px-4 py-3 rounded-lg bg-[var(--color-secondary)]/10 border border-[var(--color-secondary)]/30 flex items-center gap-2">
                    <span className="material-symbols-outlined text-[var(--color-secondary)] text-base">error</span>
                    <p className="text-[var(--color-secondary)] text-sm">{profileError}</p>
                  </div>
                )}
                <div>
                  <label className="label-caps text-[var(--color-on-surface-variant)] block mb-2">NOMBRE</label>
                  <div className="flex items-center bg-[var(--color-surface-container)] border border-[var(--color-outline-variant)]/30 rounded-lg px-4 py-3 focus-within:border-[var(--color-primary)]/60 transition-colors">
                    <span className="material-symbols-outlined text-[var(--color-outline)] mr-3 text-xl">person</span>
                    <input
                      type="text" required value={editName} onChange={(e) => setEditName(e.target.value)}
                      className="bg-transparent border-none outline-none text-[var(--color-on-surface)] w-full text-sm"
                    />
                  </div>
                </div>
                <div>
                  <label className="label-caps text-[var(--color-on-surface-variant)] block mb-2">TELÉFONO (opcional)</label>
                  <div className="flex items-center bg-[var(--color-surface-container)] border border-[var(--color-outline-variant)]/30 rounded-lg px-4 py-3 focus-within:border-[var(--color-primary)]/60 transition-colors">
                    <span className="material-symbols-outlined text-[var(--color-outline)] mr-3 text-xl">phone</span>
                    <input
                      type="tel" value={editPhone} onChange={(e) => setEditPhone(e.target.value)}
                      placeholder="+56 9 1234 5678"
                      className="bg-transparent border-none outline-none text-[var(--color-on-surface)] w-full text-sm placeholder:text-[var(--color-outline)]"
                    />
                  </div>
                </div>
                <div className="flex gap-3 mt-2">
                  <button
                    type="button"
                    onClick={() => { setEditMode(false); setProfileError('') }}
                    className="flex-1 py-3 border border-[var(--color-outline-variant)]/50 text-[var(--color-on-surface)] label-caps rounded-lg hover:bg-[var(--color-surface-container)] transition-all"
                  >
                    CANCELAR
                  </button>
                  <button
                    type="submit" disabled={savingProfile}
                    className="flex-1 glow-primary py-3 bg-[var(--color-primary-container)] text-[var(--color-on-primary-container)] label-caps font-bold rounded-lg hover:bg-[var(--color-primary)] transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                  >
                    {savingProfile ? (
                      <><span className="material-symbols-outlined text-base animate-spin">progress_activity</span>GUARDANDO...</>
                    ) : 'GUARDAR'}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
      {/* Modal confirmación eliminar */}
      {confirmDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="glass-card rounded-2xl p-6 max-w-sm w-full shadow-2xl">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-full bg-[var(--color-secondary)]/10 flex items-center justify-center shrink-0">
                <span className="material-symbols-outlined text-[var(--color-secondary)] text-base">delete</span>
              </div>
              <div>
                <p style={{ fontFamily: 'var(--font-headline)', fontWeight: 600 }}>Eliminar publicación</p>
                <p className="text-[var(--color-on-surface-variant)] text-xs mt-0.5">Esta acción no se puede deshacer</p>
              </div>
            </div>
            <p className="text-[var(--color-on-surface-variant)] text-sm mb-6">
              ¿Eliminar <span className="text-[var(--color-on-surface)] font-medium">{confirmDelete.brand} {confirmDelete.model} {confirmDelete.year}</span>? Se borrará junto con sus fotos y modelo 3D.
            </p>
            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => setConfirmDelete(null)}
                disabled={deleting}
                className="flex-1 py-2.5 border border-[var(--color-outline-variant)]/50 text-[var(--color-on-surface)] label-caps text-xs rounded-lg hover:bg-[var(--color-surface-container)] transition-all disabled:opacity-40"
              >
                CANCELAR
              </button>
              <button
                type="button"
                onClick={() => handleDelete(confirmDelete)}
                disabled={deleting}
                className="flex-1 py-2.5 bg-[var(--color-secondary)]/20 border border-[var(--color-secondary)]/40 text-[var(--color-secondary)] label-caps text-xs font-bold rounded-lg hover:bg-[var(--color-secondary)]/30 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {deleting
                  ? <><span className="w-3.5 h-3.5 border-2 border-[var(--color-secondary)]/30 border-t-[var(--color-secondary)] rounded-full animate-spin" />ELIMINANDO...</>
                  : 'ELIMINAR'}
              </button>
            </div>
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
