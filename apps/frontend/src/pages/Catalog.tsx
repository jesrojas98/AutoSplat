import { useState, useEffect, useCallback } from 'react'
import { useSearchParams } from 'react-router-dom'
import { VehicleCard } from '@/components/vehicles/VehicleCard'
import { vehiclesService, type Vehicle } from '@/services/vehicles.service'

const SORT_OPTIONS = [
  { value: 'newest', label: 'Más recientes' },
  { value: 'price-asc', label: 'Precio: menor a mayor' },
  { value: 'price-desc', label: 'Precio: mayor a menor' },
  { value: 'mileage-asc', label: 'Menor kilometraje' },
]

export function Catalog() {
  const [searchParams] = useSearchParams()
  const [brand, setBrand] = useState(searchParams.get('brand') ?? '')
  const [only3d, setOnly3d] = useState(false)
  const [minPrice, setMinPrice] = useState('')
  const [maxPrice, setMaxPrice] = useState('')
  const [sort, setSort] = useState('newest')

  const [vehicles, setVehicles] = useState<Vehicle[]>([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [pages, setPages] = useState(1)
  const [loading, setLoading] = useState(true)

  const fetchVehicles = useCallback(async (resetPage = false) => {
    setLoading(true)
    const currentPage = resetPage ? 1 : page
    if (resetPage) setPage(1)
    try {
      const res = await vehiclesService.getAll({
        brand: brand || undefined,
        minPrice: minPrice ? Number(minPrice) : undefined,
        maxPrice: maxPrice ? Number(maxPrice) : undefined,
        page: currentPage,
        limit: 12,
      })
      setVehicles(res.data)
      setTotal(res.total)
      setPages(res.pages)
    } finally {
      setLoading(false)
    }
  }, [brand, minPrice, maxPrice, page])

  useEffect(() => { fetchVehicles() }, [page])

  function applyFilters() { fetchVehicles(true) }

  function clearFilters() {
    setBrand(''); setOnly3d(false); setMinPrice(''); setMaxPrice('')
    setTimeout(() => fetchVehicles(true), 0)
  }

  const sorted = [...vehicles]
    .filter((v) => !only3d || v.has_3d_model)
    .sort((a, b) => {
      if (sort === 'price-asc') return a.price - b.price
      if (sort === 'price-desc') return b.price - a.price
      if (sort === 'mileage-asc') return a.mileage - b.mileage
      return new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    })

  return (
    <div className="px-[var(--spacing-gutter)] py-12 max-w-[var(--spacing-max-width)] mx-auto">
      <div className="flex gap-8">

        {/* Sidebar filtros */}
        <aside className="hidden lg:block w-72 shrink-0">
          <div className="glass-panel rounded-xl p-6 sticky top-28">
            <h2 style={{ fontFamily: 'var(--font-headline)', fontWeight: 600, fontSize: 20 }} className="mb-6">Filtrar</h2>

            <div className="mb-5">
              <label className="label-caps text-[var(--color-on-surface-variant)] block mb-2">Marca</label>
              <input type="text" placeholder="Buscar marca..." value={brand} onChange={(e) => setBrand(e.target.value)}
                className="w-full bg-[var(--color-surface-container)] border border-[var(--color-outline-variant)]/30 rounded-lg px-3 py-2 text-sm text-[var(--color-on-surface)] outline-none focus:border-[var(--color-primary)]/50 placeholder:text-[var(--color-outline)]" />
            </div>

            <div className="mb-5">
              <label className="label-caps text-[var(--color-on-surface-variant)] block mb-2">Precio (CLP)</label>
              <div className="flex gap-2">
                <input type="number" placeholder="Mín" value={minPrice} onChange={(e) => setMinPrice(e.target.value)}
                  className="w-full bg-[var(--color-surface-container)] border border-[var(--color-outline-variant)]/30 rounded-lg px-3 py-2 text-sm text-[var(--color-on-surface)] outline-none focus:border-[var(--color-primary)]/50 placeholder:text-[var(--color-outline)]" />
                <input type="number" placeholder="Máx" value={maxPrice} onChange={(e) => setMaxPrice(e.target.value)}
                  className="w-full bg-[var(--color-surface-container)] border border-[var(--color-outline-variant)]/30 rounded-lg px-3 py-2 text-sm text-[var(--color-on-surface)] outline-none focus:border-[var(--color-primary)]/50 placeholder:text-[var(--color-outline)]" />
              </div>
            </div>

            <div className="mb-6 flex items-center justify-between">
              <label className="label-caps text-[var(--color-on-surface-variant)]">Solo con vista 3D</label>
              <button onClick={() => setOnly3d((v) => !v)}
                className={`w-11 h-6 rounded-full transition-colors relative ${only3d ? 'bg-[var(--color-primary-container)]' : 'bg-[var(--color-surface-container-highest)]'}`}>
                <span className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-all ${only3d ? 'left-6' : 'left-1'}`} />
              </button>
            </div>

            <button onClick={applyFilters}
              className="glow-primary w-full py-3 bg-[var(--color-primary-container)] text-[var(--color-on-primary-container)] label-caps font-bold rounded-lg hover:bg-[var(--color-primary)] transition-all mb-3">
              APLICAR FILTROS
            </button>
            <button onClick={clearFilters} className="w-full py-2 text-[var(--color-on-surface-variant)] label-caps text-xs hover:text-[var(--color-on-surface)] transition-colors">
              LIMPIAR TODO
            </button>
          </div>
        </aside>

        {/* Resultados */}
        <div className="flex-1 min-w-0">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
            <div>
              <h1 style={{ fontFamily: 'var(--font-headline)', fontSize: 32, fontWeight: 700 }}>Inventario</h1>
              <p className="text-[var(--color-on-surface-variant)] text-sm mt-1">
                {loading ? 'Cargando...' : `${total} vehículos encontrados`}
              </p>
            </div>
            <div className="flex items-center gap-3">
              <label className="label-caps text-[var(--color-on-surface-variant)] text-xs whitespace-nowrap">ORDENAR POR</label>
              <select value={sort} onChange={(e) => setSort(e.target.value)}
                className="bg-[var(--color-surface-container)] border border-[var(--color-outline-variant)]/30 rounded-lg px-3 py-2 text-sm text-[var(--color-on-surface)] outline-none">
                {SORT_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
              </select>
            </div>
          </div>

          {loading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="glass-card rounded-xl overflow-hidden animate-pulse">
                  <div className="aspect-[16/10] bg-[var(--color-surface-container-high)]" />
                  <div className="p-4 flex flex-col gap-2">
                    <div className="h-3 bg-[var(--color-surface-container-high)] rounded w-1/2" />
                    <div className="h-5 bg-[var(--color-surface-container-high)] rounded w-3/4" />
                    <div className="h-6 bg-[var(--color-surface-container-high)] rounded w-1/3 mt-2" />
                  </div>
                </div>
              ))}
            </div>
          ) : sorted.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-24 text-center">
              <span className="material-symbols-outlined text-[var(--color-outline)] mb-4" style={{ fontSize: 64 }}>search_off</span>
              <p style={{ fontFamily: 'var(--font-headline)', fontSize: 20 }} className="mb-2">Sin resultados</p>
              <p className="text-[var(--color-on-surface-variant)] text-sm">Intenta ajustar los filtros para ver más vehículos.</p>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6">
                {sorted.map((vehicle) => (
                  <VehicleCard key={vehicle.id} vehicle={vehicle} />
                ))}
              </div>

              {pages > 1 && (
                <div className="flex justify-center items-center gap-2 mt-10">
                  <button onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1}
                    className="p-2 rounded-lg hover:bg-[var(--color-surface-container-high)] disabled:opacity-30 transition-colors">
                    <span className="material-symbols-outlined text-[var(--color-on-surface-variant)]">chevron_left</span>
                  </button>
                  {Array.from({ length: pages }, (_, i) => i + 1).map((p) => (
                    <button key={p} onClick={() => setPage(p)}
                      className={`w-9 h-9 rounded-lg label-caps text-xs transition-colors ${p === page ? 'bg-[var(--color-primary-container)] text-[var(--color-on-primary-container)]' : 'hover:bg-[var(--color-surface-container-high)] text-[var(--color-on-surface-variant)]'}`}>
                      {p}
                    </button>
                  ))}
                  <button onClick={() => setPage((p) => Math.min(pages, p + 1))} disabled={page === pages}
                    className="p-2 rounded-lg hover:bg-[var(--color-surface-container-high)] disabled:opacity-30 transition-colors">
                    <span className="material-symbols-outlined text-[var(--color-on-surface-variant)]">chevron_right</span>
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  )
}
