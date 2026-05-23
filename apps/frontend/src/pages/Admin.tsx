import { useState, useEffect } from 'react'
import { api } from '@/lib/api'
import { Avatar } from '@/components/ui/Avatar'

type Role = 'buyer' | 'seller' | 'admin'

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

export function Admin() {
  const [users, setUsers] = useState<UserRow[]>([])
  const [loading, setLoading] = useState(true)
  const [apiError, setApiError] = useState<string | null>(null)
  const [search, setSearch] = useState('')
  const [updating, setUpdating] = useState<string | null>(null)
  const [deleting, setDeleting] = useState<string | null>(null)
  const [confirmDelete, setConfirmDelete] = useState<UserRow | null>(null)

  useEffect(() => {
    api.get<UserRow[]>('/admin/users')
      .then((r) => setUsers(r.data))
      .catch((e) => setApiError(e.response?.data?.message ?? e.message ?? 'Error al cargar usuarios'))
      .finally(() => setLoading(false))
  }, [])

  async function handleRoleChange(userId: string, role: Role) {
    setUpdating(userId)
    try {
      const { data } = await api.patch<UserRow>(`/admin/users/${userId}/role`, { role })
      setUsers((prev) => prev.map((u) => u.id === userId ? { ...u, role: data.role } : u))
    } finally {
      setUpdating(null)
    }
  }

  async function handleDelete(user: UserRow) {
    setDeleting(user.id)
    try {
      await api.delete(`/admin/users/${user.id}`)
      setUsers((prev) => prev.filter((u) => u.id !== user.id))
    } finally {
      setDeleting(null)
      setConfirmDelete(null)
    }
  }

  const filtered = users.filter((u) =>
    u.name.toLowerCase().includes(search.toLowerCase()) ||
    u.email.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div className="max-w-[var(--spacing-max-width)] mx-auto px-[var(--spacing-gutter)] py-12">

      {/* Header */}
      <div className="mb-8 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <p className="label-caps text-[var(--color-primary)] text-xs mb-1">PANEL DE ADMINISTRACIÓN</p>
          <h1 style={{ fontFamily: 'var(--font-headline)', fontSize: 32, fontWeight: 700 }}>
            Gestión de usuarios
          </h1>
          <p className="text-[var(--color-on-surface-variant)] text-sm mt-1">
            {users.length} usuarios registrados
          </p>
        </div>

        <div className="relative">
          <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-[var(--color-outline)] text-base">search</span>
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar por nombre o email..."
            className="pl-9 pr-4 py-2.5 rounded-lg border border-[var(--color-outline-variant)]/40 bg-[var(--color-surface-container)] text-[var(--color-on-surface)] text-sm outline-none focus:border-[var(--color-primary)] transition-colors w-72"
          />
        </div>
      </div>

      {/* Error */}
      {apiError && (
        <div className="mb-6 px-5 py-4 rounded-xl bg-[var(--color-secondary)]/10 border border-[var(--color-secondary)]/30 flex items-center gap-3">
          <span className="material-symbols-outlined text-[var(--color-secondary)]">error</span>
          <p className="text-[var(--color-secondary)] text-sm">{apiError}</p>
        </div>
      )}

      {/* Table */}
      <div className="glass-card rounded-2xl overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <span className="material-symbols-outlined text-[var(--color-primary)] animate-spin" style={{ fontSize: 36 }}>progress_activity</span>
          </div>
        ) : filtered.length === 0 ? (
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
              {filtered.map((u) => (
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
                    {updating === u.id ? (
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
                      onClick={() => setConfirmDelete(u)}
                      disabled={deleting === u.id || u.role === 'admin'}
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

      {/* Modal confirmación de eliminación */}
      {confirmDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="glass-card rounded-2xl p-8 max-w-sm w-full shadow-2xl">
            <div className="w-14 h-14 rounded-full bg-[var(--color-secondary)]/10 flex items-center justify-center mx-auto mb-4">
              <span className="material-symbols-outlined text-[var(--color-secondary)]" style={{ fontSize: 32 }}>person_remove</span>
            </div>
            <h3 style={{ fontFamily: 'var(--font-headline)', fontWeight: 700, fontSize: 22 }} className="text-center mb-2">
              ¿Eliminar usuario?
            </h3>
            <p className="text-[var(--color-on-surface-variant)] text-sm text-center mb-6">
              Se eliminará permanentemente a <strong className="text-[var(--color-on-surface)]">{confirmDelete.name}</strong> ({confirmDelete.email}) y todos sus datos.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setConfirmDelete(null)}
                className="flex-1 py-3 border border-[var(--color-outline-variant)]/50 label-caps text-xs rounded-lg hover:bg-[var(--color-surface-container)] transition-colors"
              >
                CANCELAR
              </button>
              <button
                onClick={() => handleDelete(confirmDelete)}
                disabled={!!deleting}
                className="flex-1 py-3 bg-[var(--color-secondary-container)] text-[var(--color-on-secondary-container)] label-caps text-xs font-bold rounded-lg hover:bg-[var(--color-secondary)] transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {deleting ? (
                  <span className="material-symbols-outlined text-sm animate-spin">progress_activity</span>
                ) : 'ELIMINAR'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
