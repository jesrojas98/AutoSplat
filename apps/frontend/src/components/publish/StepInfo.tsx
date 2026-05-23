import { useEffect, useMemo, useRef, useState } from 'react'
import type { VehicleForm } from '@/pages/PublishVehicle'
import { CHILE_REGIONS } from '@/data/chileLocations'
import { VEHICLE_CATALOG } from '@/data/vehicleCatalog'

const TRANSMISSIONS = [
  { value: 'manual', label: 'Manual' },
  { value: 'automatic', label: 'Automático' },
  { value: 'cvt', label: 'CVT' },
]

const FUEL_TYPES = [
  { value: 'gasoline', label: 'Bencina' },
  { value: 'diesel', label: 'Diésel' },
  { value: 'electric', label: 'Eléctrico' },
  { value: 'hybrid', label: 'Híbrido' },
]

const BODY_TYPES = [
  { value: 'sedan', label: 'Sedán' },
  { value: 'suv', label: 'SUV / Camioneta' },
  { value: 'hatchback', label: 'Hatchback' },
  { value: 'coupe', label: 'Coupé' },
  { value: 'convertible', label: 'Descapotable' },
  { value: 'pickup', label: 'Pickup' },
  { value: 'van', label: 'Van / Minivan' },
]

interface Props {
  form: VehicleForm
  onChange: (f: Partial<VehicleForm>) => void
  onNext: () => void
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="label-caps text-[var(--color-on-surface-variant)] block mb-2">{label}</label>
      {children}
    </div>
  )
}

const inputCls = 'w-full bg-[var(--color-surface-container)] border border-[var(--color-outline-variant)]/30 rounded-lg px-4 py-3 text-sm text-[var(--color-on-surface)] outline-none focus:border-[var(--color-primary)]/60 transition-colors placeholder:text-[var(--color-outline)]'

function normalizeSearch(value: string) {
  return value.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase()
}

function getBrandLogoUrls(brand: string) {
  const brandInfo = VEHICLE_CATALOG.find((item) => item.brand === brand)
  const candidates = [
    ...(brandInfo?.logoUrls ?? []),
    brandInfo?.logoUrl,
    brandInfo?.logoSlug ? `https://cdn.jsdelivr.net/npm/simple-icons/icons/${brandInfo.logoSlug}.svg` : null,
    brandInfo?.logoDomain ? `https://logo.clearbit.com/${brandInfo.logoDomain}` : null,
  ]

  return candidates.filter((url): url is string => Boolean(url))
}

function BrandFallback({ brand }: { brand: string }) {
  return (
    <span className="w-11 h-7 rounded-lg bg-[var(--color-primary)]/10 border border-[var(--color-outline-variant)]/20 flex items-center justify-center label-caps text-[9px] text-[var(--color-primary)] shrink-0">
      {brand.slice(0, 2).toUpperCase()}
    </span>
  )
}

function BrandLogo({ brand }: { brand: string }) {
  const [candidateIndex, setCandidateIndex] = useState(0)
  const logoUrls = getBrandLogoUrls(brand)
  const logoUrl = logoUrls[candidateIndex]

  useEffect(() => {
    setCandidateIndex(0)
  }, [brand])

  if (!brand || !logoUrl) return <BrandFallback brand={brand || '--'} />

  return (
    <span className="w-11 h-7 rounded-lg bg-white border border-[var(--color-outline-variant)]/30 flex items-center justify-center shrink-0 overflow-hidden">
      <img
        src={logoUrl}
        alt=""
        loading="lazy"
        onError={() => setCandidateIndex((current) => current + 1)}
        className="w-9 h-5 object-contain"
      />
    </span>
  )
}

function SearchableSelect({
  value,
  options,
  placeholder,
  searchPlaceholder,
  disabled = false,
  helper,
  icon,
  optionIcon = 'location_on',
  getOptionVisual,
  onChange,
}: {
  value: string
  options: string[]
  placeholder: string
  searchPlaceholder: string
  disabled?: boolean
  helper?: string
  icon: string
  optionIcon?: string
  getOptionVisual?: (option: string) => React.ReactNode
  onChange: (value: string) => void
}) {
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState('')
  const rootRef = useRef<HTMLDivElement>(null)

  const filteredOptions = useMemo(() => {
    const normalizedQuery = normalizeSearch(query.trim())
    if (!normalizedQuery) return options
    return options.filter((option) => normalizeSearch(option).includes(normalizedQuery))
  }, [options, query])

  useEffect(() => {
    if (!open) return

    function handlePointerDown(event: MouseEvent) {
      if (!rootRef.current?.contains(event.target as Node)) setOpen(false)
    }

    document.addEventListener('mousedown', handlePointerDown)
    return () => document.removeEventListener('mousedown', handlePointerDown)
  }, [open])

  useEffect(() => {
    if (!open) setQuery('')
  }, [open])

  return (
    <div ref={rootRef} className="relative">
      <button
        type="button"
        disabled={disabled}
        onClick={() => setOpen((current) => !current)}
        className={`w-full min-h-12 px-4 py-3 rounded-lg border bg-[var(--color-surface-container)] transition-all flex items-center gap-3 text-left ${
          open
            ? 'border-[var(--color-primary)] shadow-[0_0_0_3px_color-mix(in_srgb,var(--color-primary)_14%,transparent)]'
            : 'border-[var(--color-outline-variant)]/30 hover:border-[var(--color-outline-variant)]/70'
        } ${disabled ? 'opacity-55 cursor-not-allowed' : 'cursor-pointer'}`}
      >
        {value && getOptionVisual ? (
          getOptionVisual(value)
        ) : (
          <span className="material-symbols-outlined text-[var(--color-primary)] text-xl shrink-0">{icon}</span>
        )}
        <span className="flex-1 min-w-0">
          <span className={`block text-sm truncate ${value ? 'text-[var(--color-on-surface)]' : 'text-[var(--color-outline)]'}`}>
            {value || placeholder}
          </span>
          {helper && (
            <span className="block label-caps text-[9px] text-[var(--color-on-surface-variant)] mt-0.5 truncate">
              {helper}
            </span>
          )}
        </span>
        <span className="material-symbols-outlined text-[var(--color-on-surface-variant)] text-lg shrink-0">
          {open ? 'expand_less' : 'expand_more'}
        </span>
      </button>

      {open && !disabled && (
        <div className="absolute z-30 mt-2 w-full dropdown-card rounded-xl shadow-2xl border border-[var(--color-outline-variant)]/30 overflow-hidden">
          <div className="p-3 border-b border-[var(--color-outline-variant)]/20">
            <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-[var(--color-surface-container-high)] border border-[var(--color-outline-variant)]/20">
              <span className="material-symbols-outlined text-[var(--color-outline)] text-base">search</span>
              <input
                autoFocus
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder={searchPlaceholder}
                className="w-full bg-transparent outline-none text-sm text-[var(--color-on-surface)] placeholder:text-[var(--color-outline)]"
              />
            </div>
            <p className="label-caps text-[9px] text-[var(--color-outline)] mt-2">
              {filteredOptions.length} OPCIONES
            </p>
          </div>

          <div className="max-h-64 overflow-y-auto py-1">
            {filteredOptions.length === 0 ? (
              <div className="px-4 py-8 text-center text-sm text-[var(--color-on-surface-variant)]">
                Sin resultados
              </div>
            ) : (
              filteredOptions.map((option) => (
                <button
                  key={option}
                  type="button"
                  onClick={() => {
                    onChange(option)
                    setOpen(false)
                  }}
                  className={`w-full px-4 py-2.5 text-left text-sm transition-colors flex items-center gap-3 ${
                    value === option
                      ? 'bg-[var(--color-primary)]/10 text-[var(--color-primary)]'
                      : 'text-[var(--color-on-surface)] hover:bg-[var(--color-surface-container-high)]'
                  }`}
                >
                  {getOptionVisual ? (
                    getOptionVisual(option)
                  ) : (
                    <span className="material-symbols-outlined text-base shrink-0">
                      {value === option ? 'check_circle' : optionIcon}
                    </span>
                  )}
                  <span className="truncate">{option}</span>
                  {value === option && getOptionVisual && (
                    <span className="material-symbols-outlined text-base ml-auto shrink-0">check_circle</span>
                  )}
                </button>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  )
}

export function StepInfo({ form, onChange, onNext }: Props) {
  const currentYear = new Date().getFullYear()
  const selectedBrand = VEHICLE_CATALOG.find((item) => item.brand === form.brand)
  const brandModels = selectedBrand?.models ?? []
  const selectedRegion = CHILE_REGIONS.find((r) => r.region === form.region)
  const communes = selectedRegion?.communes ?? []

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!form.brand || !form.model || !form.region || !form.location) return
    onNext()
  }

  return (
    <form onSubmit={handleSubmit}>
      <h2 style={{ fontFamily: 'var(--font-headline)', fontSize: 22, fontWeight: 600 }} className="mb-6">
        Información del vehículo
      </h2>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 mb-6">
        {/* Marca */}
        <Field label="MARCA">
          <SearchableSelect
            value={form.brand}
            options={VEHICLE_CATALOG.map((item) => item.brand)}
            placeholder="Selecciona una marca"
            searchPlaceholder="Buscar marca..."
            helper={form.brand ? `${brandModels.length} modelos disponibles` : 'Elige desde el catálogo'}
            icon="directions_car"
            optionIcon="directions_car"
            getOptionVisual={(brand) => <BrandLogo brand={brand} />}
            onChange={(brand) => onChange({ brand, model: '' })}
          />
        </Field>

        {/* Modelo */}
        <Field label="MODELO">
          <SearchableSelect
            value={form.model}
            options={brandModels}
            disabled={!form.brand}
            placeholder={form.brand ? 'Selecciona un modelo' : 'Selecciona una marca primero'}
            searchPlaceholder="Buscar modelo..."
            helper={form.brand ? form.brand : 'Disponible después de la marca'}
            icon="minor_crash"
            optionIcon="minor_crash"
            onChange={(model) => onChange({ model })}
          />
        </Field>

        {/* Año */}
        <Field label="AÑO">
          <input
            required
            type="number"
            className={inputCls}
            placeholder={String(currentYear)}
            min={1960}
            max={currentYear + 1}
            value={form.year}
            onChange={(e) => onChange({ year: e.target.value })}
          />
        </Field>

        {/* Precio */}
        <Field label="PRECIO (CLP)">
          <div className="relative">
            <input
              required
              type="number"
              className={`${inputCls} pr-14`}
              placeholder="ej. 12000000"
              min={0}
              value={form.price}
              onChange={(e) => onChange({ price: e.target.value })}
            />
            <span className="absolute right-4 top-1/2 -translate-y-1/2 label-caps text-[var(--color-outline)] text-[10px]">
              CLP
            </span>
          </div>
        </Field>

        {/* Kilometraje */}
        <Field label="KILOMETRAJE">
          <div className="relative">
            <input
              required
              type="number"
              className={`${inputCls} pr-10`}
              placeholder="ej. 50000"
              min={0}
              value={form.mileage}
              onChange={(e) => onChange({ mileage: e.target.value })}
            />
            <span className="absolute right-4 top-1/2 -translate-y-1/2 label-caps text-[var(--color-outline)] text-[10px]">
              KM
            </span>
          </div>
        </Field>

        {/* Tipo de carrocería */}
        <Field label="CARROCERÍA">
          <select
            required
            className={inputCls}
            value={form.bodyType}
            onChange={(e) => onChange({ bodyType: e.target.value })}
          >
            <option value="">Seleccionar...</option>
            {BODY_TYPES.map((b) => (
              <option key={b.value} value={b.value}>{b.label}</option>
            ))}
          </select>
        </Field>

        {/* Transmisión */}
        <Field label="TRANSMISIÓN">
          <div className="flex gap-2">
            {TRANSMISSIONS.map((t) => (
              <button
                key={t.value}
                type="button"
                onClick={() => onChange({ transmission: t.value })}
                className={`flex-1 py-3 rounded-lg border label-caps text-xs transition-all ${
                  form.transmission === t.value
                    ? 'border-[var(--color-primary)] bg-[var(--color-primary)]/10 text-[var(--color-primary)]'
                    : 'border-[var(--color-outline-variant)]/30 text-[var(--color-on-surface-variant)] hover:border-[var(--color-outline-variant)]'
                }`}
              >
                {t.label.toUpperCase()}
              </button>
            ))}
          </div>
        </Field>

        {/* Combustible */}
        <Field label="COMBUSTIBLE">
          <div className="grid grid-cols-2 gap-2">
            {FUEL_TYPES.map((f) => (
              <button
                key={f.value}
                type="button"
                onClick={() => onChange({ fuelType: f.value })}
                className={`py-3 rounded-lg border label-caps text-xs transition-all ${
                  form.fuelType === f.value
                    ? 'border-[var(--color-primary)] bg-[var(--color-primary)]/10 text-[var(--color-primary)]'
                    : 'border-[var(--color-outline-variant)]/30 text-[var(--color-on-surface-variant)] hover:border-[var(--color-outline-variant)]'
                }`}
              >
                {f.label.toUpperCase()}
              </button>
            ))}
          </div>
        </Field>

        {/* Color */}
        <Field label="COLOR">
          <input
            type="text"
            className={inputCls}
            placeholder="ej. Blanco perla"
            value={form.color}
            onChange={(e) => onChange({ color: e.target.value })}
          />
        </Field>

        {/* Puertas */}
        <Field label="PUERTAS">
          <div className="flex gap-2">
            {['2', '3', '4', '5'].map((d) => (
              <button
                key={d}
                type="button"
                onClick={() => onChange({ doors: d })}
                className={`flex-1 py-3 rounded-lg border label-caps text-xs transition-all ${
                  form.doors === d
                    ? 'border-[var(--color-primary)] bg-[var(--color-primary)]/10 text-[var(--color-primary)]'
                    : 'border-[var(--color-outline-variant)]/30 text-[var(--color-on-surface-variant)] hover:border-[var(--color-outline-variant)]'
                }`}
              >
                {d}
              </button>
            ))}
          </div>
        </Field>

        {/* Región */}
        <Field label="REGIÓN">
          <SearchableSelect
            value={form.region}
            options={CHILE_REGIONS.map((r) => r.region)}
            placeholder="Selecciona una región"
            searchPlaceholder="Buscar región..."
            helper={form.region ? `${communes.length} comunas disponibles` : 'Primero elige la región'}
            icon="map"
            onChange={(region) => onChange({ region, location: '' })}
          />
        </Field>

        {/* Comuna / ciudad */}
        <Field label="COMUNA / CIUDAD">
          <SearchableSelect
            value={form.location}
            options={communes}
            disabled={!form.region}
            placeholder={form.region ? 'Selecciona una comuna' : 'Selecciona una región primero'}
            searchPlaceholder="Buscar comuna..."
            helper={form.region ? selectedRegion?.region : 'Disponible después de la región'}
            icon="location_on"
            onChange={(location) => onChange({ location })}
          />
        </Field>
      </div>

      {/* Descripción */}
      <Field label="DESCRIPCIÓN">
        <textarea
          className={`${inputCls} resize-none`}
          rows={4}
          placeholder="Describe el estado del vehículo, historial de mantención, accesorios incluidos, etc."
          value={form.description}
          onChange={(e) => onChange({ description: e.target.value })}
        />
      </Field>

      <div className="flex justify-end mt-8">
        <button
          type="submit"
          disabled={!form.brand || !form.model || !form.region || !form.location}
          className="glow-primary px-10 py-3 bg-[var(--color-primary-container)] text-[var(--color-on-primary-container)] label-caps font-bold rounded-lg hover:bg-[var(--color-primary)] transition-all flex items-center gap-2 disabled:opacity-45 disabled:cursor-not-allowed disabled:hover:bg-[var(--color-primary-container)]"
        >
          SIGUIENTE
          <span className="material-symbols-outlined text-base">arrow_forward</span>
        </button>
      </div>
    </form>
  )
}
