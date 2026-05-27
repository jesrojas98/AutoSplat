import { useState, useEffect } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { api } from '@/lib/api'
import { Avatar } from '@/components/ui/Avatar'
import { vehiclesService, type Vehicle } from '@/services/vehicles.service'
import { formatPriceNumber } from '@/utils/formatters'

type Role = 'buyer' | 'seller' | 'admin'
type AdminTab = 'usuarios' | 'vehiculos'

interface UserRow {
  id: string
  name: string
  email: string
  role: Role
  avatar_url: string | null
  created_at: string
}

const ROLE_COLOR: Record<Role, string> = {
  buyer: 'var(--color-on-surface-variant)',
  seller: 'var(--color-primary)',
  admin: 'var(--color-tertiary)',
}

const STATUS_CONFIG = {
  published:     { label: 'PUBLICADO',    color: 'text-[var(--color-primary)]',   bg: 'bg-[var(--color-primary)]/10' },
  draft:         { label: 'BORRADOR',     color: 'text-[var(--color-outline)]',   bg: 'bg-[var(--color-surface-container-high)]' },
  processing_3d: { label: 'GENERANDO 3D', color: 'text-[var(--color-tertiary)]',  bg: 'bg-[var(--color-tertiary)]/10' },
  sold:          { label: 'VENDIDO',      color: 'text-[var(--color-secondary)]', bg: 'bg-[var(--color-secondary)]/10' },
  inactive:      { label: 'INACTIVO',     color: 'text-[var(--color-outline)]',   bg: 'bg-[var(--color-surface-container-high)]' },
} as const

export function Admin() {
  const navigate = useNavigate()
  const [searchParams, setSearchParams] = useSearchParams()
  const tab = (searchParams.get('tab') as AdminTab) ?? 'usuarios'
  const setTab = (t: AdminTab) => setSearchParams({ tab: t })

  // Users state
  const [users, setUsers] = useState<UserRow[]>([])
  const [loadingUsers, setLoadingUsers] = useState(true)
  const [apiError, setApiError] = useState<string | null>(null)
  const [userSearch, setUserSearch] = useState('')
  const [updatingUser, setUpdatingUser] = useState<string | null>(null)
  const [deletingUser, setDeletingUser] = useState<string | null>(null)
  const [confirmDeleteUser, setConfirmDeleteUser] = useState<UserRow | null>(null)

  // Vehicles state
  const [vehicles, setVehicles] = useState<Vehicle[]>([])
  const [loadingVehicles, setLoadingVehicles] = useState(false)
  const [vehicleError, setVehicleError] = useState<string | null>(null)
  const [vehicleSearch, setVehicleSearch] = useState('')
  const [vehicleStatusFilter, setVehicleStatusFilter] = useState<string>('all')
  const [deletingVehicle, setDeletingVehicle] = useState<string | null>(null)
  const [confirmDeleteVehicle, setConfirmDeleteVehicle] = useState<Vehicle | null>(null)

  useEffect(() => {
    api.get<UserRow[]>('/admin/users')
      .then((r) => setUsers(r.data))
      .catch((e) => setApiError(e.response?.data?.message ?? e.message ?? 'Error al cargar usuarios'))
      .finally(() => setLoadingUsers(false))
  }, [])

  useEffect(() => {
    if (tab !== 'vehiculos') return
    setLoadingVehicles(true)
    setVehicleError(null)
    api.get<Vehicle[]>('/admin/vehicles')
      .then((r) => setVehicles(r.data))
      .catch((e) => setVehicleError(e.response?.data?.message ?? e.message ?? 'Error al cargar vehículos'))
      .finally(() => setLoadingVehicles(false))
  }, [tab])

  async function handleRoleChange(userId: string, role: Role) {
    setUpdatingUser(userId)
    try {
      const { data } = await api.patch<UserRow>(`/admin/users/${userId}/role`, { role })
      setUsers((prev) => prev.map((u) => u.id === userId ? { ...u, role: data.role } : u))
    } finally {
      setUpdatingUser(null)
    }
  }

  async function handleDeleteUser(user: UserRow) {
    setDeletingUser(user.id)
    try {
      await api.delete(`/admin/users/${user.id}`)
      setUsers((prev) => prev.filter((u) => u.id !== user.id))
    } finally {
      setDeletingUser(null)
      setConfirmDeleteUser(null)
    }
  }

  async function handleDeleteVehicle(vehicle: Vehicle) {
    setDeletingVehicle(vehicle.id)
    try {
      await vehiclesService.remove(vehicle.id)
      setVehicles((prev) => prev.filter((v) => v.id !== vehicle.id))
      setConfirmDeleteVehicle(null)
    } finally {
      setDeletingVehicle(null)
    }
  }

  const filteredUsers = users.filter((u) =>
    u.name.toLowerCase().includes(userSearch.toLowerCase()) ||
    u.email.toLowerCase().includes(userSearch.toLowerCase())
  )

  const filteredVehicles = vehicles.filter((v) => {
    const matchesStatus = vehicleStatusFilter === 'all' || v.status === vehicleStatusFilter
    const q = vehicleSearch.toLowerCase()
    const matchesSearch = !q ||
      `${v.brand} ${v.model} ${v.year}`.toLowerCase().includes(q) ||
      v.location?.toLowerCase().includes(q)
    return matchesStatus && matchesSearch
  })

  return (
    <div className="max-w-[var(--spacing-max-width)] mx-auto px-[var(--spacing-gutter)] py-12">

      {/* Header */}
      <div className="mb-8">
        <p className="label-caps text-[var(--color-primary)] text-xs mb-1">PANEL DE ADMINISTRACIÓN</p>
        <h1 style={{ fontFamily: 'var(--font-headline)', fontSize: 32, fontWeight: 700 }}>
          Administración
        </h1>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 mb-6 border-b border-[var(--color-outline-variant)]/30">
        {([
          { id: 'usuarios', label: 'Usuarios', icon: 'group', count: users.length },
          { id: 'vehiculos', label: 'Vehículos', icon: 'directions_car', count: vehicles.length },
        ] as { id: AdminTab; label: string; icon: string; count: number }[]).map((t) => (
          <button key={t.id} onClick={() => setTab(t.id)}
            className={`flex items-center gap-2 px-4 py-3 label-caps text-xs border-b-2 transition-all -mb-px ${
              tab === t.id
                ? 'border-[var(--color-primary)] text-[var(--color-primary)]'
                : 'border-transparent text-[var(--color-on-surface-variant)] hover:text-[var(--color-on-surface)]'
            }`}>
            <span className="material-symbols-outlined text-base">{t.icon}</span>
            {t.label.toUpperCase()}
            {t.count > 0 && (
              <span className={`text-[10px] px-1.5 py-0.5 rounded-full ${tab === t.id ? 'bg-[var(--color-primary)]/15 text-[var(--color-primary)]' : 'bg-[var(--color-surface-container-highest)] text-[var(--color-outline)]'}`}>
                {t.count}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Error global */}
      {apiError && (
        <div className="mb-6 px-5 py-4 rounded-xl bg-[var(--color-secondary)]/10 border border-[var(--color-secondary)]/30 flex items-center gap-3">
          <span className="material-symbols-outlined text-[var(--color-secondary)]">error</span>
          <p className="text-[var(--color-secondary)] text-sm">{apiError}</p>
        </div>
      )}

      {/* ── Tab Usuarios ── */}
      {tab === 'usuarios' && (
        <>
          <div className="flex items-center justify-between mb-5 gap-4">
            <p className="text-[var(--color-on-surface-variant)] text-sm">{users.length} usuarios registrados</p>
            <div className="relative">
              <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-[var(--color-outline)] text-base">search</span>
              <input
                value={userSearch}
                onChange={(e) => setUserSearch(e.target.value)}
                placeholder="Buscar por nombre o email..."
                className="pl-9 pr-4 py-2.5 rounded-lg border border-[var(--color-outline-variant)]/40 bg-[var(--color-surface-container)] text-[var(--color-on-surface)] text-sm outline-none focus:border-[var(--color-primary)] transition-colors w-72"
              />
            </div>
          </div>

          <div className="glass-card rounded-2xl overflow-hidden">
            {loadingUsers ? (
              <div className="flex items-center justify-center py-20">
                <span className="material-symbols-outlined text-[var(--color-primary)] animate-spin" style={{ fontSize: 36 }}>progress_activity</span>
              </div>
            ) : filteredUsers.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-20 gap-3 text-[var(--color-outline)]">
                <span className="material-symbols-outlined text-4xl">group_off</span>
                <p className="text-sm">No se encontraron usuarios</p>
              </div>
            ) : (
              <table className="w-full">
                <thead>
                  <tr className="border-b border-[var(--color-outline-variant)]/20">
                    <th className="text-left px-6 py-4 label-caps text-[10px] text-[var(--color-on-surface-variant)]">USUARIO</th>
                    <th className="text-left px-6 py-4 label-caps text-[10px] text-[var(--color-on-surface-variant)] hidden md:table-cell">EMAIL</th>
                    <th className="text-left px-6 py-4 label-caps text-[10px] text-[var(--color-on-surface-variant)]">ROL</th>
                    <th className="text-left px-6 py-4 label-caps text-[10px] text-[var(--color-on-surface-variant)] hidden sm:table-cell">REGISTRO</th>
                    <th className="px-6 py-4" />
                  </tr>
                </thead>
                <tbody>
                  {filteredUsers.map((u) => (
                    <tr key={u.id} className="border-b border-[var(--color-outline-variant)]/10 last:border-0 hover:bg-[var(--color-surface-container-high)]/50 transition-colors">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-full overflow-hidden shrink-0">
                            <Avatar src={u.avatar_url} name={u.name} size={36} className="rounded-full" />
                          </div>
                          <span className="text-[var(--color-on-surface)] text-sm font-medium">{u.name}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-[var(--color-on-surface-variant)] text-sm hidden md:table-cell">{u.email}</td>
                      <td className="px-6 py-4">
                        {updatingUser === u.id ? (
                          <span className="material-symbols-outlined text-[var(--color-primary)] animate-spin text-base">progress_activity</span>
                        ) : (
                          <select
                            value={u.role}
                            onChange={(e) => handleRoleChange(u.id, e.target.value as Role)}
                            className="label-caps text-[10px] px-3 py-1.5 rounded-lg border border-[var(--color-outline-variant)]/40 bg-[var(--color-surface-container)] outline-none cursor-pointer transition-colors focus:border-[var(--color-primary)]"
                            style={{ color: ROLE_COLOR[u.role] }}
                          >
                            <option value="buyer">Comprador</option>
                            <option value="seller">Vendedor</option>
                            <option value="admin">Admin</option>
                          </select>
                        )}
                      </td>
                      <td className="px-6 py-4 text-[var(--color-on-surface-variant)] text-xs hidden sm:table-cell">
                        {new Date(u.created_at).toLocaleDateString('es-CL')}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <button
                          onClick={() => setConfirmDeleteUser(u)}
                          disabled={deletingUser === u.id || u.role === 'admin'}
                          title={u.role === 'admin' ? 'No se puede eliminar a otro admin' : 'Eliminar usuario'}
                          className="p-2 rounded-lg text-[var(--color-secondary)] hover:bg-[var(--color-secondary)]/10 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                        >
                          <span className="material-symbols-outlined text-base">delete</span>
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </>
      )}

      {/* ── Tab Vehículos ── */}
      {tab === 'vehiculos' && (
        <>
          {vehicleError && (
            <div className="mb-5 px-4 py-3 rounded-xl bg-[var(--color-secondary)]/10 border border-[var(--color-secondary)]/30 flex items-center gap-2">
              <span className="material-symbols-outlined text-[var(--color-secondary)] text-base">error</span>
              <p className="text-[var(--color-secondary)] text-sm">{vehicleError}</p>
            </div>
          )}

          {/* Barra de filtros */}
          <div className="glass-card rounded-xl px-4 py-3 mb-5 flex flex-col sm:flex-row gap-3 items-start sm:items-center">
            {/* Buscador */}
            <div className="relative flex-1 min-w-0">
              <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-[var(--color-outline)] text-base">search</span>
              <input
                value={vehicleSearch}
                onChange={(e) => setVehicleSearch(e.target.value)}
                placeholder="Buscar por marca, modelo, ciudad..."
                className="pl-9 pr-4 py-2.5 w-full rounded-lg border border-[var(--color-outline-variant)]/40 bg-[var(--color-surface-container)] text-[var(--color-on-surface)] text-sm outline-none focus:border-[var(--color-primary)] transition-colors"
              />
            </div>

            {/* Filtro de estado */}
            <div className="flex items-center gap-1.5 flex-wrap">
              {([
                { value: 'all',          label: 'Todos',        count: vehicles.length },
                { value: 'published',    label: 'Publicados',   count: vehicles.filter(v => v.status === 'published').length },
                { value: 'draft',        label: 'Borradores',   count: vehicles.filter(v => v.status === 'draft').length },
                { value: 'inactive',     label: 'Inactivos',    count: vehicles.filter(v => v.status === 'inactive').length },
                { value: 'sold',         label: 'Vendidos',     count: vehicles.filter(v => v.status === 'sold').length },
                { value: 'processing_3d',label: '3D',           count: vehicles.filter(v => v.status === 'processing_3d').length },
              ] as { value: string; label: string; count: number }[])
                .filter(f => f.value === 'all' || f.count > 0)
                .map((f) => (
                  <button
                    key={f.value}
                    type="button"
                    onClick={() => setVehicleStatusFilter(f.value)}
                    className={`flex items-center gap-1 px-3 py-1.5 rounded-lg label-caps text-[10px] transition-all ${
                      vehicleStatusFilter === f.value
                        ? 'bg-[var(--color-primary-container)] text-[var(--color-on-primary-container)] border border-[var(--color-primary)]/30'
                        : 'border border-[var(--color-outline-variant)]/30 text-[var(--color-on-surface-variant)] hover:bg-[var(--color-surface-container-high)]'
                    }`}
                  >
                    {f.label}
                    <span className={`text-[9px] px-1 py-0.5 rounded-full ${vehicleStatusFilter === f.value ? 'bg-[var(--color-primary)]/20' : 'bg-[var(--color-surface-container-highest)]'}`}>
                      {f.count}
                    </span>
                  </button>
                ))
              }
            </div>

            {/* Contador de resultados */}
            <p className="label-caps text-[10px] text-[var(--color-outline)] shrink-0">
              {filteredVehicles.length} / {vehicles.length}
            </p>
          </div>

          <div className="flex flex-col gap-3">
            {loadingVehicles ? (
              Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="glass-card rounded-xl p-4 h-20 animate-pulse bg-[var(--color-surface-container-high)]" />
              ))
            ) : filteredVehicles.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-20 gap-3 text-[var(--color-outline)]">
                <span className="material-symbols-outlined text-4xl">directions_car</span>
                <p className="text-sm">No hay publicaciones</p>
              </div>
            ) : filteredVehicles.map((v) => {
              const st = STATUS_CONFIG[v.status as keyof typeof STATUS_CONFIG] ?? STATUS_CONFIG.draft
              const thumb = v.vehicle_images?.find((i) => i.image_type === 'thumbnail')?.image_url ?? v.vehicle_images?.[0]?.image_url ?? ''
              return (
                <div key={v.id} className="glass-card rounded-xl p-4 flex flex-col sm:flex-row gap-4 items-start sm:items-center">
                  <div className="w-20 h-14 rounded-lg overflow-hidden shrink-0 bg-[var(--color-surface-container-high)]">
                    {thumb && <img src={thumb} alt="" className="w-full h-full object-cover" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 style={{ fontFamily: 'var(--font-headline)', fontWeight: 600 }} className="text-sm">
                      {v.brand} {v.model} {v.year}
                    </h3>
                    <div className="flex flex-wrap items-center gap-3 mt-0.5">
                      <span style={{ fontFamily: 'var(--font-display)', fontWeight: 700 }} className="text-base">
                        {formatPriceNumber(v.price)}
                        <span className="label-caps text-[var(--color-on-surface-variant)] text-[10px] ml-1">CLP</span>
                      </span>
                      <span className="text-[var(--color-on-surface-variant)] text-xs">{v.location}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <span className={`label-caps text-[10px] px-2.5 py-1 rounded-full ${st.bg} ${st.color}`}>{st.label}</span>
                    {v.has_3d_model && (
                      <span className="label-caps text-[9px] bg-[var(--color-primary)]/10 text-[var(--color-primary)] px-1.5 py-0.5 rounded">3D</span>
                    )}
                    <button
                      type="button"
                      onClick={() => navigate(`/vehicles/${v.id}/edit`)}
                      className="p-2 rounded-lg hover:bg-[var(--color-primary)]/10 transition-colors"
                      title="Editar"
                    >
                      <span className="material-symbols-outlined text-[var(--color-primary)] text-base">edit</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setConfirmDeleteVehicle(v)}
                      className="p-2 rounded-lg hover:bg-[var(--color-secondary)]/10 transition-colors"
                      title="Eliminar"
                    >
                      <span className="material-symbols-outlined text-[var(--color-secondary)] text-base">delete</span>
                    </button>
                  </div>
                </div>
              )
            })}
          </div>
        </>
      )}

      {/* Modal eliminar usuario */}
      {confirmDeleteUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="glass-card rounded-2xl p-8 max-w-sm w-full shadow-2xl">
            <div className="w-14 h-14 rounded-full bg-[var(--color-secondary)]/10 flex items-center justify-center mx-auto mb-4">
              <span className="material-symbols-outlined text-[var(--color-secondary)]" style={{ fontSize: 32 }}>person_remove</span>
            </div>
            <h3 style={{ fontFamily: 'var(--font-headline)', fontWeight: 700, fontSize: 22 }} className="text-center mb-2">
              ¿Eliminar usuario?
            </h3>
            <p className="text-[var(--color-on-surface-variant)] text-sm text-center mb-6">
              Se eliminará permanentemente a <strong className="text-[var(--color-on-surface)]">{confirmDeleteUser.name}</strong> ({confirmDeleteUser.email}) y todos sus datos.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setConfirmDeleteUser(null)}
                className="flex-1 py-3 border border-[var(--color-outline-variant)]/50 label-caps text-xs rounded-lg hover:bg-[var(--color-surface-container)] transition-colors"
              >
                CANCELAR
              </button>
              <button
                onClick={() => handleDeleteUser(confirmDeleteUser)}
                disabled={!!deletingUser}
                className="flex-1 py-3 bg-[var(--color-secondary-container)] text-[var(--color-on-secondary-container)] label-caps text-xs font-bold rounded-lg hover:bg-[var(--color-secondary)] transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {deletingUser ? <span className="material-symbols-outlined text-sm animate-spin">progress_activity</span> : 'ELIMINAR'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal eliminar vehículo */}
      {confirmDeleteVehicle && (
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
              ¿Eliminar <span className="text-[var(--color-on-surface)] font-medium">{confirmDeleteVehicle.brand} {confirmDeleteVehicle.model} {confirmDeleteVehicle.year}</span>?
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setConfirmDeleteVehicle(null)}
                disabled={!!deletingVehicle}
                className="flex-1 py-2.5 border border-[var(--color-outline-variant)]/50 text-[var(--color-on-surface)] label-caps text-xs rounded-lg hover:bg-[var(--color-surface-container)] transition-all disabled:opacity-40"
              >
                CANCELAR
              </button>
              <button
                onClick={() => handleDeleteVehicle(confirmDeleteVehicle)}
                disabled={!!deletingVehicle}
                className="flex-1 py-2.5 bg-[var(--color-secondary)]/20 border border-[var(--color-secondary)]/40 text-[var(--color-secondary)] label-caps text-xs font-bold rounded-lg hover:bg-[var(--color-secondary)]/30 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {deletingVehicle
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
