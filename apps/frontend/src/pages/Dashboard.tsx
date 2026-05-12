import { Link, useSearchParams } from 'react-router-dom'
import { formatPriceNumber } from '@/utils/formatters'

type Tab = 'publicaciones' | 'favoritos' | 'mensajes' | 'perfil'

const MOCK_USER = {
  name: 'Jesús Rojas',
  email: 'jesusalerojasguti@gmail.com',
  role: 'seller' as const,
  memberSince: 'Enero 2024',
}

const MOCK_LISTINGS = [
  { id: '1', brand: 'PORSCHE', model: '911 GT3', year: 2023, price: 224900000, status: 'published', has3dModel: true, views: 1240, imageUrl: 'https://images.unsplash.com/photo-1503736334956-4c8f8e4dc1d4?w=400&q=80' },
  { id: '2', brand: 'BMW', model: 'M5 Competition', year: 2022, price: 108500000, status: 'processing_3d', has3dModel: false, views: 87, imageUrl: 'https://images.unsplash.com/photo-1555215695-3004980ad54e?w=400&q=80' },
  { id: '3', brand: 'TOYOTA', model: 'GR Supra', year: 2022, price: 54900000, status: 'draft', has3dModel: false, views: 0, imageUrl: 'https://images.unsplash.com/photo-1621007947382-bb3c3994e3fb?w=400&q=80' },
]

const MOCK_FAVORITES = [
  { id: '4', brand: 'TESLA', model: 'Model S Plaid', year: 2024, price: 89900000, imageUrl: 'https://images.unsplash.com/photo-1560958089-b8a1929cea89?w=400&q=80' },
  { id: '5', brand: 'LUCID', model: 'Air Sapphire', year: 2024, price: 249000000, imageUrl: 'https://images.unsplash.com/photo-1494976388531-d1058494cdd8?w=400&q=80' },
]

const STATUS_CONFIG = {
  published:     { label: 'PUBLICADO',      color: 'text-[var(--color-primary)]',    bg: 'bg-[var(--color-primary)]/10', icon: 'check_circle' },
  draft:         { label: 'BORRADOR',        color: 'text-[var(--color-outline)]',    bg: 'bg-[var(--color-surface-container-high)]', icon: 'edit' },
  processing_3d: { label: 'GENERANDO 3D',   color: 'text-[var(--color-tertiary)]',   bg: 'bg-[var(--color-tertiary)]/10', icon: 'blur_on' },
  sold:          { label: 'VENDIDO',         color: 'text-[var(--color-secondary)]',  bg: 'bg-[var(--color-secondary)]/10', icon: 'sell' },
  inactive:      { label: 'INACTIVO',        color: 'text-[var(--color-outline)]',    bg: 'bg-[var(--color-surface-container-high)]', icon: 'pause_circle' },
} as const

const STATS = [
  { label: 'PUBLICACIONES', value: '3', icon: 'directions_car' },
  { label: 'VISTAS TOTALES', value: '1.327', icon: 'visibility' },
  { label: 'MODELOS 3D', value: '1', icon: 'view_in_ar' },
  { label: 'MENSAJES', value: '8', icon: 'chat_bubble' },
]

export function Dashboard() {
  const [searchParams, setSearchParams] = useSearchParams()
  const tab: Tab = (searchParams.get('tab') as Tab) ?? 'publicaciones'
  const setTab = (t: Tab) => setSearchParams({ tab: t })

  return (
    <div className="px-[var(--spacing-gutter)] py-12 max-w-[var(--spacing-max-width)] mx-auto">

      {/* Header perfil */}
      <div className="glass-card rounded-2xl p-6 mb-8 flex flex-col sm:flex-row items-start sm:items-center gap-6">
        <div className="w-16 h-16 rounded-full bg-[var(--color-primary-container)] flex items-center justify-center shrink-0">
          <span className="material-symbols-outlined text-[var(--color-on-primary-container)]" style={{ fontSize: 32 }}>
            person
          </span>
        </div>
        <div className="flex-1">
          <h1 style={{ fontFamily: 'var(--font-headline)', fontSize: 24, fontWeight: 700 }}>
            {MOCK_USER.name}
          </h1>
          <p className="text-[var(--color-on-surface-variant)] text-sm">{MOCK_USER.email}</p>
          <div className="flex items-center gap-3 mt-2">
            <span className="label-caps text-[10px] bg-[var(--color-primary-container)] text-[var(--color-on-primary-container)] px-2 py-1 rounded">
              {MOCK_USER.role === 'seller' ? 'VENDEDOR' : 'COMPRADOR'}
            </span>
            <span className="label-caps text-[var(--color-outline)] text-[10px]">
              MIEMBRO DESDE {MOCK_USER.memberSince.toUpperCase()}
            </span>
          </div>
        </div>
        <Link
          to="/publish"
          className="glow-primary px-6 py-3 bg-[var(--color-primary-container)] text-[var(--color-on-primary-container)] label-caps font-bold rounded-lg hover:bg-[var(--color-primary)] transition-all flex items-center gap-2 shrink-0"
        >
          <span className="material-symbols-outlined text-base">add</span>
          PUBLICAR VEHÍCULO
        </Link>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        {STATS.map(({ label, value, icon }) => (
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
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`flex items-center gap-2 px-4 py-3 label-caps text-xs border-b-2 transition-all -mb-px ${
              tab === t.id
                ? 'border-[var(--color-primary)] text-[var(--color-primary)]'
                : 'border-transparent text-[var(--color-on-surface-variant)] hover:text-[var(--color-on-surface)]'
            }`}
          >
            <span className="material-symbols-outlined text-base">{t.icon}</span>
            <span className="hidden sm:inline">{t.label.toUpperCase()}</span>
          </button>
        ))}
      </div>

      {/* Tab: Mis publicaciones */}
      {tab === 'publicaciones' && (
        <div className="flex flex-col gap-4">
          {MOCK_LISTINGS.map((v) => {
            const st = STATUS_CONFIG[v.status as keyof typeof STATUS_CONFIG] ?? STATUS_CONFIG.draft
            return (
              <div key={v.id} className="glass-card rounded-xl p-4 flex flex-col sm:flex-row gap-4 items-start sm:items-center">
                <div className="w-24 h-18 rounded-lg overflow-hidden shrink-0">
                  <img src={v.imageUrl} alt="" className="w-24 h-16 object-cover rounded-lg" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 style={{ fontFamily: 'var(--font-headline)', fontWeight: 600 }}>
                      {v.brand} {v.model} {v.year}
                    </h3>
                    {v.has3dModel && (
                      <span className="label-caps text-[9px] bg-[var(--color-primary)]/10 text-[var(--color-primary)] px-1.5 py-0.5 rounded">
                        3D
                      </span>
                    )}
                  </div>
                  <div className="flex flex-wrap items-center gap-3">
                    <span className="flex items-baseline gap-1">
                      <span style={{ fontFamily: 'var(--font-display)', fontWeight: 700 }} className="text-lg">
                        {formatPriceNumber(v.price)}
                      </span>
                      <span className="label-caps text-[var(--color-on-surface-variant)] text-[10px]">CLP</span>
                    </span>
                    <span className="flex items-center gap-1 text-[var(--color-on-surface-variant)] text-sm">
                      <span className="material-symbols-outlined text-sm">visibility</span>
                      {v.views.toLocaleString('es-CL')} vistas
                    </span>
                  </div>
                </div>
                <div className="flex items-center gap-3 shrink-0">
                  <span className={`flex items-center gap-1.5 label-caps text-[10px] px-3 py-1.5 rounded-full ${st.bg} ${st.color}`}>
                    <span className="material-symbols-outlined text-sm">{st.icon}</span>
                    {st.label}
                  </span>
                  <Link
                    to={`/vehicles/${v.id}`}
                    className="p-2 rounded-lg hover:bg-[var(--color-surface-container-high)] transition-colors"
                    title="Ver publicación"
                  >
                    <span className="material-symbols-outlined text-[var(--color-on-surface-variant)] text-base">open_in_new</span>
                  </Link>
                  <button
                    className="p-2 rounded-lg hover:bg-[var(--color-surface-container-high)] transition-colors"
                    title="Editar"
                  >
                    <span className="material-symbols-outlined text-[var(--color-on-surface-variant)] text-base">edit</span>
                  </button>
                </div>
              </div>
            )
          })}

          {MOCK_LISTINGS.length === 0 && <EmptyState icon="directions_car" text="Aún no tienes publicaciones." action={{ label: 'PUBLICAR VEHÍCULO', to: '/publish' }} />}
        </div>
      )}

      {/* Tab: Favoritos */}
      {tab === 'favoritos' && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {MOCK_FAVORITES.map((v) => (
            <Link key={v.id} to={`/vehicles/${v.id}`} className="glass-card rounded-xl overflow-hidden group flex flex-col hover:border-[var(--color-primary)]/50 transition-all">
              <div className="aspect-[16/9] overflow-hidden">
                <img src={v.imageUrl} alt="" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
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
          ))}
          {MOCK_FAVORITES.length === 0 && <EmptyState icon="favorite" text="No tienes vehículos guardados." />}
        </div>
      )}

      {/* Tab: Mensajes */}
      {tab === 'mensajes' && (
        <div className="flex flex-col gap-3">
          {[
            { from: 'Carlos Méndez', vehicle: 'Porsche 911 GT3 2023', message: '¿Está disponible para verlo este fin de semana?', time: 'hace 2h', unread: true },
            { from: 'Andrea Torres', vehicle: 'Porsche 911 GT3 2023', message: '¿Acepta permuta con BMW Serie 3?', time: 'ayer', unread: false },
          ].map((msg, i) => (
            <div key={i} className={`glass-card rounded-xl p-4 flex gap-4 items-start cursor-pointer hover:border-[var(--color-primary)]/40 transition-all ${msg.unread ? 'border-[var(--color-primary)]/30' : ''}`}>
              <div className="w-10 h-10 rounded-full bg-[var(--color-surface-container-high)] flex items-center justify-center shrink-0">
                <span className="material-symbols-outlined text-[var(--color-on-surface-variant)] text-base">person</span>
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-2 mb-1">
                  <p style={{ fontWeight: 600 }} className="text-sm truncate">{msg.from}</p>
                  <span className="label-caps text-[var(--color-outline)] text-[10px] shrink-0">{msg.time.toUpperCase()}</span>
                </div>
                <p className="label-caps text-[var(--color-primary)] text-[10px] mb-1">{msg.vehicle.toUpperCase()}</p>
                <p className="text-[var(--color-on-surface-variant)] text-sm truncate">{msg.message}</p>
              </div>
              {msg.unread && <div className="w-2 h-2 rounded-full bg-[var(--color-primary)] shrink-0 mt-1" />}
            </div>
          ))}
        </div>
      )}

      {/* Tab: Perfil */}
      {tab === 'perfil' && (
        <div className="max-w-lg">
          <div className="glass-card rounded-xl p-6 flex flex-col gap-5">
            <h2 style={{ fontFamily: 'var(--font-headline)', fontSize: 18, fontWeight: 600 }} className="mb-2">
              Información personal
            </h2>
            {[
              { label: 'NOMBRE', value: MOCK_USER.name, icon: 'person' },
              { label: 'CORREO', value: MOCK_USER.email, icon: 'mail' },
              { label: 'ROL', value: 'Vendedor', icon: 'storefront' },
              { label: 'MIEMBRO DESDE', value: MOCK_USER.memberSince, icon: 'calendar_today' },
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
