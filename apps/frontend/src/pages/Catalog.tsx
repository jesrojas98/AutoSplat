import { useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { VehicleCard } from '@/components/vehicles/VehicleCard'


const ALL_VEHICLES = [
  { id: '1', brand: 'PORSCHE', model: '911 GT3', year: 2023, price: 224900, mileage: 4000, transmission: 'PDK', fuelType: 'gasoline', location: 'Santiago', has3dModel: true, imageUrl: 'https://images.unsplash.com/photo-1503736334956-4c8f8e4dc1d4?w=800&q=80' },
  { id: '2', brand: 'TESLA', model: 'Model S Plaid', year: 2024, price: 89900, mileage: 0, transmission: 'automatic', fuelType: 'electric', location: 'Valparaíso', has3dModel: true, imageUrl: 'https://images.unsplash.com/photo-1560958089-b8a1929cea89?w=800&q=80' },
  { id: '3', brand: 'BMW', model: 'M5 Competition', year: 2022, price: 108500, mileage: 12000, transmission: 'automatic', fuelType: 'gasoline', location: 'Concepción', has3dModel: true, imageUrl: 'https://images.unsplash.com/photo-1555215695-3004980ad54e?w=800&q=80' },
  { id: '4', brand: 'LUCID', model: 'Air Sapphire', year: 2024, price: 249000, mileage: 500, transmission: 'automatic', fuelType: 'electric', location: 'Viña del Mar', has3dModel: false, imageUrl: 'https://images.unsplash.com/photo-1494976388531-d1058494cdd8?w=800&q=80' },
  { id: '5', brand: 'TOYOTA', model: 'GR Supra', year: 2022, price: 54900, mileage: 18000, transmission: 'automatic', fuelType: 'gasoline', location: 'Santiago', has3dModel: true, imageUrl: 'https://images.unsplash.com/photo-1621007947382-bb3c3994e3fb?w=800&q=80' },
  { id: '6', brand: 'FORD', model: 'Mustang GT', year: 2021, price: 42000, mileage: 35000, transmission: 'manual', fuelType: 'gasoline', location: 'Temuco', has3dModel: false, imageUrl: 'https://images.unsplash.com/photo-1584060573923-0dcf3e4a7d42?w=800&q=80' },
]

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
  const [applied, setApplied] = useState({ brand, only3d, minPrice, maxPrice })

  function applyFilters() {
    setApplied({ brand, only3d, minPrice, maxPrice })
  }

  function clearFilters() {
    setBrand(''); setOnly3d(false); setMinPrice(''); setMaxPrice('')
    setApplied({ brand: '', only3d: false, minPrice: '', maxPrice: '' })
  }

  const filtered = ALL_VEHICLES
    .filter((v) => {
      if (applied.only3d && !v.has3dModel) return false
      if (applied.brand && !v.brand.toLowerCase().includes(applied.brand.toLowerCase())) return false
      if (applied.minPrice && v.price < Number(applied.minPrice)) return false
      if (applied.maxPrice && v.price > Number(applied.maxPrice)) return false
      return true
    })
    .sort((a, b) => {
      if (sort === 'price-asc') return a.price - b.price
      if (sort === 'price-desc') return b.price - a.price
      if (sort === 'mileage-asc') return a.mileage - b.mileage
      return b.year - a.year
    })

  return (
    <div className="px-[var(--spacing-gutter)] py-12 max-w-[var(--spacing-max-width)] mx-auto">
      <div className="flex gap-8">

        {/* Sidebar filtros */}
        <aside className="hidden lg:block w-72 shrink-0">
          <div className="glass-panel rounded-xl p-6 sticky top-28">
            <h2 style={{ fontFamily: 'var(--font-headline)', fontWeight: 600, fontSize: 20 }} className="mb-6">
              Filtrar
            </h2>

            {/* Marca */}
            <div className="mb-5">
              <label className="label-caps text-[var(--color-on-surface-variant)] block mb-2">Marca</label>
              <input
                type="text"
                placeholder="Buscar marca..."
                value={brand}
                onChange={(e) => setBrand(e.target.value)}
                className="w-full bg-[var(--color-surface-container)] border border-[var(--color-outline-variant)]/30 rounded-lg px-3 py-2 text-sm text-[var(--color-on-surface)] outline-none focus:border-[var(--color-primary)]/50 placeholder:text-[var(--color-outline)]"
              />
            </div>

            {/* Precio */}
            <div className="mb-5">
              <label className="label-caps text-[var(--color-on-surface-variant)] block mb-2">Precio (USD)</label>
              <div className="flex gap-2">
                <input
                  type="number"
                  placeholder="Mín"
                  value={minPrice}
                  onChange={(e) => setMinPrice(e.target.value)}
                  className="w-full bg-[var(--color-surface-container)] border border-[var(--color-outline-variant)]/30 rounded-lg px-3 py-2 text-sm text-[var(--color-on-surface)] outline-none focus:border-[var(--color-primary)]/50 placeholder:text-[var(--color-outline)]"
                />
                <input
                  type="number"
                  placeholder="Máx"
                  value={maxPrice}
                  onChange={(e) => setMaxPrice(e.target.value)}
                  className="w-full bg-[var(--color-surface-container)] border border-[var(--color-outline-variant)]/30 rounded-lg px-3 py-2 text-sm text-[var(--color-on-surface)] outline-none focus:border-[var(--color-primary)]/50 placeholder:text-[var(--color-outline)]"
                />
              </div>
            </div>

            {/* Solo con vista 3D */}
            <div className="mb-6 flex items-center justify-between">
              <label className="label-caps text-[var(--color-on-surface-variant)]">Solo con vista 3D</label>
              <button
                onClick={() => setOnly3d((v) => !v)}
                className={`w-11 h-6 rounded-full transition-colors relative ${only3d ? 'bg-[var(--color-primary-container)]' : 'bg-[var(--color-surface-container-highest)]'}`}
              >
                <span
                  className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-all ${only3d ? 'left-6' : 'left-1'}`}
                />
              </button>
            </div>

            <button
              onClick={applyFilters}
              className="glow-primary w-full py-3 bg-[var(--color-primary-container)] text-[var(--color-on-primary-container)] label-caps font-bold rounded-lg hover:bg-[var(--color-primary)] transition-all mb-3"
            >
              APLICAR FILTROS
            </button>
            <button
              onClick={clearFilters}
              className="w-full py-2 text-[var(--color-on-surface-variant)] label-caps text-xs hover:text-[var(--color-on-surface)] transition-colors"
            >
              LIMPIAR TODO
            </button>
          </div>
        </aside>

        {/* Resultados */}
        <div className="flex-1 min-w-0">
          {/* Header resultados */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
            <div>
              <h1 style={{ fontFamily: 'var(--font-headline)', fontSize: 32, fontWeight: 700 }}>
                Inventario
              </h1>
              <p className="text-[var(--color-on-surface-variant)] text-sm mt-1">
                {filtered.length} vehículos encontrados
              </p>
            </div>
            <div className="flex items-center gap-3">
              <label className="label-caps text-[var(--color-on-surface-variant)] text-xs whitespace-nowrap">ORDENAR POR</label>
              <select
                value={sort}
                onChange={(e) => setSort(e.target.value)}
                className="bg-[var(--color-surface-container)] border border-[var(--color-outline-variant)]/30 rounded-lg px-3 py-2 text-sm text-[var(--color-on-surface)] outline-none"
              >
                {SORT_OPTIONS.map((o) => (
                  <option key={o.value} value={o.value}>{o.label}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Grilla */}
          {filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-24 text-center">
              <span className="material-symbols-outlined text-[var(--color-outline)] mb-4" style={{ fontSize: 64 }}>
                search_off
              </span>
              <p style={{ fontFamily: 'var(--font-headline)', fontSize: 20 }} className="mb-2">
                Sin resultados
              </p>
              <p className="text-[var(--color-on-surface-variant)] text-sm">
                Intenta ajustar los filtros para ver más vehículos.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6">
              {filtered.map((vehicle) => (
                <VehicleCard key={vehicle.id} vehicle={vehicle} />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
