import { useNavigate } from 'react-router-dom'
import { useState } from 'react'

export function HeroSection() {
  const navigate = useNavigate()
  const [search, setSearch] = useState({ brand: '', model: '', location: '' })

  function handleSearch() {
    const params = new URLSearchParams()
    if (search.brand) params.set('brand', search.brand)
    if (search.model) params.set('model', search.model)
    if (search.location) params.set('location', search.location)
    navigate(`/catalog?${params.toString()}`)
  }

  return (
    <section className="relative min-h-[90vh] flex flex-col items-center justify-center text-center px-[var(--spacing-gutter)] overflow-hidden">
      {/* Gradient overlay */}
      <div
        className="absolute inset-0 -z-10"
        style={{ background: 'linear-gradient(to bottom, rgba(37,99,235,0.08), var(--color-background))' }}
      />

      {/* Background pattern */}
      <div className="absolute inset-0 -z-20 opacity-5">
        <div
          className="w-full h-full"
          style={{
            backgroundImage: 'radial-gradient(circle, #b4c5ff 1px, transparent 1px)',
            backgroundSize: '48px 48px',
          }}
        />
      </div>

      {/* Eyebrow */}
      <span className="label-caps text-[var(--color-primary)] mb-6 tracking-widest">
        NEXT-GEN AUTOMOTIVE MARKETPLACE
      </span>

      {/* Headline */}
      <h1
        className="mb-6 max-w-4xl tracking-tight leading-none uppercase"
        style={{
          fontFamily: 'var(--font-display)',
          fontSize: 'clamp(40px, 6vw, 64px)',
          fontWeight: 700,
          letterSpacing: '-0.02em',
          lineHeight: 1.1,
        }}
      >
        The Future of Car Buying is{' '}
        <span className="text-[var(--color-primary)] text-glow">3D.</span>
      </h1>

      <p
        className="text-[var(--color-on-surface-variant)] mb-12 max-w-2xl mx-auto"
        style={{ fontFamily: 'var(--font-body)', fontSize: 18, lineHeight: 1.6 }}
      >
        Step inside the showroom of tomorrow. Explore vehicles with millimeter-precision
        3D Gaussian Splatting technology.
      </p>

      {/* Search bar */}
      <div className="glass-card p-2 rounded-xl flex flex-col md:flex-row items-stretch gap-2 w-full max-w-3xl">
        <SearchInput
          icon="directions_car"
          placeholder="Marca (ej. Toyota)"
          value={search.brand}
          onChange={(v) => setSearch((s) => ({ ...s, brand: v }))}
        />
        <SearchInput
          icon="settings"
          placeholder="Modelo (ej. Corolla)"
          value={search.model}
          onChange={(v) => setSearch((s) => ({ ...s, model: v }))}
        />
        <SearchInput
          icon="location_on"
          placeholder="Ubicación"
          value={search.location}
          onChange={(v) => setSearch((s) => ({ ...s, location: v }))}
        />
        <button
          onClick={handleSearch}
          className="glow-primary bg-[var(--color-primary-container)] text-[var(--color-on-primary-container)] px-8 py-3 rounded-lg label-caps font-bold hover:bg-[var(--color-primary)] active:scale-95 transition-all whitespace-nowrap"
        >
          SEARCH
        </button>
      </div>

      {/* Stats */}
      <div className="flex flex-wrap justify-center gap-8 mt-12 opacity-60">
        {[
          { value: '2.400+', label: 'VEHÍCULOS' },
          { value: '380+', label: 'MODELOS 3D' },
          { value: '48H', label: 'PROCESAMIENTO' },
        ].map(({ value, label }) => (
          <div key={label} className="text-center">
            <p
              className="text-[var(--color-primary)]"
              style={{ fontFamily: 'var(--font-display)', fontSize: 28, fontWeight: 700 }}
            >
              {value}
            </p>
            <p className="label-caps text-[var(--color-on-surface-variant)]">{label}</p>
          </div>
        ))}
      </div>
    </section>
  )
}

function SearchInput({
  icon,
  placeholder,
  value,
  onChange,
}: {
  icon: string
  placeholder: string
  value: string
  onChange: (v: string) => void
}) {
  return (
    <div className="flex-1 flex items-center px-4 py-3 bg-[var(--color-surface-container)] rounded-lg border border-[var(--color-outline-variant)]/30">
      <span className="material-symbols-outlined text-[var(--color-outline)] mr-3 text-xl">
        {icon}
      </span>
      <input
        type="text"
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="bg-transparent border-none outline-none text-[var(--color-on-surface)] w-full text-sm placeholder:text-[var(--color-outline)]"
        style={{ fontFamily: 'var(--font-body)' }}
      />
    </div>
  )
}
