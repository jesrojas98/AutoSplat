import { useEffect, useMemo, useRef, useState } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { vehiclesService } from '@/services/vehicles.service'
import { useAuthStore, getUserRole } from '@/store/auth.store'
import { formatPriceNumber } from '@/utils/formatters'
import { CHILE_REGIONS } from '@/data/chileLocations'
import { VEHICLE_CATALOG } from '@/data/vehicleCatalog'

// ── Opciones ──────────────────────────────────────────────────────────────────
const TRANSMISSIONS = [
  { value: 'manual',    label: 'Manual' },
  { value: 'automatic', label: 'Automático' },
  { value: 'cvt',       label: 'CVT' },
]
const FUEL_TYPES = [
  { value: 'gasoline', label: 'Bencina' },
  { value: 'diesel',   label: 'Diésel' },
  { value: 'electric', label: 'Eléctrico' },
  { value: 'hybrid',   label: 'Híbrido' },
]
const BODY_TYPES = [
  { value: 'sedan',       label: 'Sedán' },
  { value: 'suv',         label: 'SUV / Camioneta' },
  { value: 'hatchback',   label: 'Hatchback' },
  { value: 'coupe',       label: 'Coupé' },
  { value: 'convertible', label: 'Descapotable' },
  { value: 'pickup',      label: 'Pickup' },
  { value: 'van',         label: 'Van / Minivan' },
]
const STATUS_OPTIONS = [
  { value: 'published', label: 'Publicado' },
  { value: 'draft',     label: 'Borrador' },
  { value: 'inactive',  label: 'Inactivo' },
  { value: 'sold',      label: 'Vendido' },
]

// ── Helpers de marca ──────────────────────────────────────────────────────────
function normalizeSearch(v: string) {
  return v.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase()
}

function makeWordmarkLogo(brand: string, color = '#111827') {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 320 92"><rect width="320" height="92" rx="14" fill="white"/><text x="160" y="58" text-anchor="middle" font-family="Arial, Helvetica, sans-serif" font-size="40" font-weight="800" letter-spacing="2" fill="${color}">${brand}</text></svg>`
  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`
}

function getBrandLogoUrls(brand: string): string[] {
  const wordmarks: Record<string, string> = {
    Deepal: makeWordmarkLogo('DEEPAL'), DFSK: makeWordmarkLogo('DFSK', '#d71920'),
    Soueast: makeWordmarkLogo('SOUEAST', '#1f2937'), SWM: makeWordmarkLogo('SWM', '#d71920'),
  }
  const brandInfo = VEHICLE_CATALOG.find((b) => b.brand === brand)
  const preferWordmark = ['Deepal', 'Soueast', 'SWM'].includes(brand)
  return [
    preferWordmark ? wordmarks[brand] : null,
    ...(brandInfo?.logoUrls ?? []),
    brandInfo?.logoUrl,
    brandInfo?.logoSlug ? `https://cdn.jsdelivr.net/npm/simple-icons/icons/${brandInfo.logoSlug}.svg` : null,
    wordmarks[brand] ?? null,
    brandInfo?.logoDomain ? `https://logo.clearbit.com/${brandInfo.logoDomain}` : null,
  ].filter((u): u is string => Boolean(u))
}

function BrandLogo({ brand }: { brand: string }) {
  const [idx, setIdx] = useState(0)
  const urls = getBrandLogoUrls(brand)
  useEffect(() => setIdx(0), [brand])
  if (!brand || !urls[idx]) return (
    <span className="w-16 h-7 rounded-lg bg-[var(--color-primary)]/10 border border-[var(--color-outline-variant)]/20 flex items-center justify-center label-caps text-[8px] text-[var(--color-primary)] shrink-0 px-1">
      <span className="truncate">{(brand || '--').toUpperCase()}</span>
    </span>
  )
  return (
    <span className="w-16 h-7 rounded-lg bg-white border border-[var(--color-outline-variant)]/30 flex items-center justify-center shrink-0 overflow-hidden">
      <img src={urls[idx]} alt="" loading="lazy" onError={() => setIdx((i) => i + 1)} className="w-14 h-5 object-contain" />
    </span>
  )
}

// ── SearchableSelect ──────────────────────────────────────────────────────────
function SearchableSelect({
  value, options, placeholder, searchPlaceholder, disabled = false,
  helper, icon, optionIcon = 'location_on', getOptionVisual, onChange,
}: {
  value: string; options: string[]; placeholder: string; searchPlaceholder: string
  disabled?: boolean; helper?: string; icon: string; optionIcon?: string
  getOptionVisual?: (o: string) => React.ReactNode; onChange: (v: string) => void
}) {
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState('')
  const rootRef = useRef<HTMLDivElement>(null)

  const filtered = useMemo(() => {
    const q = normalizeSearch(query.trim())
    return q ? options.filter((o) => normalizeSearch(o).includes(q)) : options
  }, [options, query])

  useEffect(() => {
    if (!open) return
    const handler = (e: MouseEvent) => { if (!rootRef.current?.contains(e.target as Node)) setOpen(false) }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [open])

  useEffect(() => { if (!open) setQuery('') }, [open])

  return (
    <div ref={rootRef} className="relative">
      <button
        type="button" disabled={disabled}
        onClick={() => setOpen((v) => !v)}
        className={`w-full min-h-12 px-4 py-3 rounded-lg border bg-[var(--color-surface-container)] transition-all flex items-center gap-3 text-left ${
          open ? 'border-[var(--color-primary)] shadow-[0_0_0_3px_color-mix(in_srgb,var(--color-primary)_14%,transparent)]'
               : 'border-[var(--color-outline-variant)]/30 hover:border-[var(--color-outline-variant)]/70'
        } ${disabled ? 'opacity-55 cursor-not-allowed' : 'cursor-pointer'}`}
      >
        {value && getOptionVisual ? getOptionVisual(value)
          : <span className="material-symbols-outlined text-[var(--color-primary)] text-xl shrink-0">{icon}</span>}
        <span className="flex-1 min-w-0">
          <span className={`block text-sm truncate ${value ? 'text-[var(--color-on-surface)]' : 'text-[var(--color-outline)]'}`}>
            {value || placeholder}
          </span>
          {helper && <span className="block label-caps text-[9px] text-[var(--color-on-surface-variant)] mt-0.5 truncate">{helper}</span>}
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
              <input autoFocus value={query} onChange={(e) => setQuery(e.target.value)}
                placeholder={searchPlaceholder}
                className="w-full bg-transparent outline-none text-sm text-[var(--color-on-surface)] placeholder:text-[var(--color-outline)]" />
            </div>
            <p className="label-caps text-[9px] text-[var(--color-outline)] mt-2">{filtered.length} OPCIONES</p>
          </div>
          <div className="max-h-64 overflow-y-auto py-1">
            {filtered.length === 0
              ? <div className="px-4 py-8 text-center text-sm text-[var(--color-on-surface-variant)]">Sin resultados</div>
              : filtered.map((opt) => (
                <button key={opt} type="button"
                  onClick={() => { onChange(opt); setOpen(false) }}
                  className={`w-full px-4 py-2.5 text-left text-sm transition-colors flex items-center gap-3 ${
                    value === opt ? 'bg-[var(--color-primary)]/10 text-[var(--color-primary)]'
                                  : 'text-[var(--color-on-surface)] hover:bg-[var(--color-surface-container-high)]'}`}
                >
                  {getOptionVisual ? getOptionVisual(opt)
                    : <span className="material-symbols-outlined text-base shrink-0">{value === opt ? 'check_circle' : optionIcon}</span>}
                  <span className="truncate">{opt}</span>
                  {value === opt && getOptionVisual && (
                    <span className="material-symbols-outlined text-base ml-auto shrink-0">check_circle</span>
                  )}
                </button>
              ))
            }
          </div>
        </div>
      )}
    </div>
  )
}

// ── Helpers de formulario ─────────────────────────────────────────────────────
const inputCls = 'w-full bg-[var(--color-surface-container)] border border-[var(--color-outline-variant)]/30 rounded-lg px-4 py-3 text-sm text-[var(--color-on-surface)] outline-none focus:border-[var(--color-primary)]/60 transition-colors placeholder:text-[var(--color-outline)]'

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="label-caps text-[var(--color-on-surface-variant)] block mb-2 text-[11px]">{label}</label>
      {children}
    </div>
  )
}

// ── Página principal ──────────────────────────────────────────────────────────
export function EditVehicle() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { user } = useAuthStore()
  const role = getUserRole(user)

  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [notFound, setNotFound] = useState(false)

  const [form, setForm] = useState({
    brand: '', model: '', year: '', price: '', mileage: '',
    transmission: '', fuel_type: '', body_type: '', color: '',
    doors: '', location: '', region: '', description: '', status: 'published',
  })

  // Datos derivados del catálogo
  const brandModels = useMemo(() =>
    VEHICLE_CATALOG.find((b) => b.brand === form.brand)?.models ?? [], [form.brand])
  const regionData = useMemo(() =>
    CHILE_REGIONS.find((r) => r.region === form.region), [form.region])
  const communes = regionData?.communes ?? []

  useEffect(() => {
    if (!id) return
    vehiclesService.getOne(id)
      .then((v) => {
        if (v.seller_id !== user?.id && role !== 'admin') { setNotFound(true); return }
        setForm({
          brand: v.brand ?? '', model: v.model ?? '',
          year: String(v.year ?? ''), price: String(v.price ?? ''),
          mileage: String(v.mileage ?? ''),
          transmission: v.transmission ?? '', fuel_type: v.fuel_type ?? '',
          body_type: v.body_type ?? '', color: v.color ?? '',
          doors: v.doors ? String(v.doors) : '',
          location: v.location ?? '', region: v.region ?? '',
          description: v.description ?? '', status: v.status ?? 'published',
        })
      })
      .catch(() => setNotFound(true))
      .finally(() => setLoading(false))
  }, [id, user?.id, role])

  function set(field: string, value: string) {
    setForm((f) => ({ ...f, [field]: value }))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true); setError('')
    try {
      await vehiclesService.update(id!, {
        brand: form.brand, model: form.model,
        year: Number(form.year), price: Number(form.price),
        mileage: Number(form.mileage),
        transmission: form.transmission || undefined,
        fuel_type: form.fuel_type || undefined,
        body_type: form.body_type || undefined,
        color: form.color || undefined,
        doors: form.doors ? Number(form.doors) : undefined,
        location: form.location, region: form.region || undefined,
        description: form.description || undefined,
        status: form.status,
      })
      navigate(role === 'admin' ? '/admin?tab=vehiculos' : '/dashboard')
    } catch (err: any) {
      setError(err.response?.data?.message ?? 'Error al guardar los cambios')
    } finally {
      setSaving(false)
    }
  }

  if (loading) return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <span className="material-symbols-outlined text-[var(--color-primary)] animate-spin" style={{ fontSize: 40 }}>progress_activity</span>
    </div>
  )

  if (notFound) return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4 text-center">
      <span className="material-symbols-outlined text-[var(--color-outline)]" style={{ fontSize: 52 }}>block</span>
      <p className="text-[var(--color-on-surface-variant)]">Publicación no encontrada o sin permiso para editarla.</p>
      <Link to="/dashboard" className="label-caps text-xs text-[var(--color-primary)] hover:underline">VOLVER AL DASHBOARD</Link>
    </div>
  )

  return (
    <div className="px-[var(--spacing-gutter)] py-12 max-w-3xl mx-auto">
      <div className="mb-8">
        <button type="button" onClick={() => navigate(-1)}
          className="flex items-center gap-1.5 label-caps text-[10px] text-[var(--color-on-surface-variant)] hover:text-[var(--color-on-surface)] mb-4 transition-colors">
          <span className="material-symbols-outlined text-sm">arrow_back</span>VOLVER
        </button>
        <p className="label-caps text-[var(--color-primary)] mb-1 text-xs">EDITAR PUBLICACIÓN</p>
        <h1 style={{ fontFamily: 'var(--font-headline)', fontSize: 28, fontWeight: 700 }}>
          {form.brand} {form.model} {form.year}
        </h1>
      </div>

      <form onSubmit={handleSubmit} className="glass-card rounded-2xl p-8 flex flex-col gap-6">
        {error && (
          <div className="px-4 py-3 rounded-lg bg-[var(--color-secondary)]/10 border border-[var(--color-secondary)]/30 flex items-center gap-2">
            <span className="material-symbols-outlined text-[var(--color-secondary)] text-base">error</span>
            <p className="text-[var(--color-secondary)] text-sm">{error}</p>
          </div>
        )}

        {/* Vehículo */}
        <div>
          <p className="label-caps text-[var(--color-on-surface-variant)] text-[10px] mb-4 pb-2 border-b border-[var(--color-outline-variant)]/20">VEHÍCULO</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <Field label="MARCA">
              <SearchableSelect
                value={form.brand}
                options={VEHICLE_CATALOG.map((b) => b.brand)}
                placeholder="Selecciona una marca"
                searchPlaceholder="Buscar marca..."
                helper={form.brand ? `${brandModels.length} modelos disponibles` : 'Elige desde el catálogo'}
                icon="directions_car"
                optionIcon="directions_car"
                getOptionVisual={(b) => <BrandLogo brand={b} />}
                onChange={(brand) => setForm((f) => ({ ...f, brand, model: '' }))}
              />
            </Field>
            <Field label="MODELO">
              <SearchableSelect
                value={form.model}
                options={brandModels}
                disabled={!form.brand}
                placeholder={form.brand ? 'Selecciona un modelo' : 'Selecciona una marca primero'}
                searchPlaceholder="Buscar modelo..."
                helper={form.brand || 'Disponible después de la marca'}
                icon="minor_crash"
                optionIcon="minor_crash"
                onChange={(model) => set('model', model)}
              />
            </Field>
            <Field label="AÑO">
              <input className={inputCls} type="number" value={form.year}
                onChange={(e) => set('year', e.target.value)} required
                min={1960} max={new Date().getFullYear() + 1} placeholder={String(new Date().getFullYear())} />
            </Field>
            <Field label="COLOR">
              <input className={inputCls} value={form.color}
                onChange={(e) => set('color', e.target.value)} placeholder="ej. Blanco perla" />
            </Field>
          </div>
        </div>

        {/* Precio y km */}
        <div>
          <p className="label-caps text-[var(--color-on-surface-variant)] text-[10px] mb-4 pb-2 border-b border-[var(--color-outline-variant)]/20">PRECIO Y KILOMETRAJE</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <Field label="PRECIO (CLP)">
              <div className="relative">
                <input className={`${inputCls} pr-14`} type="number" value={form.price}
                  onChange={(e) => set('price', e.target.value)} required min={0} placeholder="ej. 12000000" />
                <span className="absolute right-4 top-1/2 -translate-y-1/2 label-caps text-[var(--color-outline)] text-[10px]">CLP</span>
              </div>
              {form.price && <p className="text-[var(--color-primary)] text-xs mt-1.5">{formatPriceNumber(Number(form.price))} CLP</p>}
            </Field>
            <Field label="KILOMETRAJE">
              <div className="relative">
                <input className={`${inputCls} pr-10`} type="number" value={form.mileage}
                  onChange={(e) => set('mileage', e.target.value)} required min={0} placeholder="ej. 50000" />
                <span className="absolute right-4 top-1/2 -translate-y-1/2 label-caps text-[var(--color-outline)] text-[10px]">KM</span>
              </div>
            </Field>
          </div>
        </div>

        {/* Características */}
        <div>
          <p className="label-caps text-[var(--color-on-surface-variant)] text-[10px] mb-4 pb-2 border-b border-[var(--color-outline-variant)]/20">CARACTERÍSTICAS</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <Field label="TRANSMISIÓN">
              <div className="flex gap-2">
                {TRANSMISSIONS.map((t) => (
                  <button key={t.value} type="button" onClick={() => set('transmission', t.value)}
                    className={`flex-1 py-3 rounded-lg border label-caps text-xs transition-all ${
                      form.transmission === t.value
                        ? 'border-[var(--color-primary)] bg-[var(--color-primary)]/10 text-[var(--color-primary)]'
                        : 'border-[var(--color-outline-variant)]/30 text-[var(--color-on-surface-variant)] hover:border-[var(--color-outline-variant)]'
                    }`}>{t.label.toUpperCase()}</button>
                ))}
              </div>
            </Field>
            <Field label="COMBUSTIBLE">
              <div className="grid grid-cols-2 gap-2">
                {FUEL_TYPES.map((f) => (
                  <button key={f.value} type="button" onClick={() => set('fuel_type', f.value)}
                    className={`py-3 rounded-lg border label-caps text-xs transition-all ${
                      form.fuel_type === f.value
                        ? 'border-[var(--color-primary)] bg-[var(--color-primary)]/10 text-[var(--color-primary)]'
                        : 'border-[var(--color-outline-variant)]/30 text-[var(--color-on-surface-variant)] hover:border-[var(--color-outline-variant)]'
                    }`}>{f.label.toUpperCase()}</button>
                ))}
              </div>
            </Field>
            <Field label="CARROCERÍA">
              <select className={inputCls} value={form.body_type} onChange={(e) => set('body_type', e.target.value)}>
                <option value="">Seleccionar...</option>
                {BODY_TYPES.map((b) => <option key={b.value} value={b.value}>{b.label}</option>)}
              </select>
            </Field>
            <Field label="PUERTAS">
              <div className="flex gap-2">
                {['2', '3', '4', '5'].map((d) => (
                  <button key={d} type="button" onClick={() => set('doors', d)}
                    className={`flex-1 py-3 rounded-lg border label-caps text-xs transition-all ${
                      form.doors === d
                        ? 'border-[var(--color-primary)] bg-[var(--color-primary)]/10 text-[var(--color-primary)]'
                        : 'border-[var(--color-outline-variant)]/30 text-[var(--color-on-surface-variant)] hover:border-[var(--color-outline-variant)]'
                    }`}>{d}</button>
                ))}
              </div>
            </Field>
          </div>
        </div>

        {/* Ubicación */}
        <div>
          <p className="label-caps text-[var(--color-on-surface-variant)] text-[10px] mb-4 pb-2 border-b border-[var(--color-outline-variant)]/20">UBICACIÓN</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <Field label="REGIÓN">
              <SearchableSelect
                value={form.region}
                options={CHILE_REGIONS.map((r) => r.region)}
                placeholder="Selecciona una región"
                searchPlaceholder="Buscar región..."
                helper={form.region ? `${communes.length} comunas disponibles` : 'Primero elige la región'}
                icon="map"
                onChange={(region) => setForm((f) => ({ ...f, region, location: '' }))}
              />
            </Field>
            <Field label="COMUNA / CIUDAD">
              <SearchableSelect
                value={form.location}
                options={communes}
                disabled={!form.region}
                placeholder={form.region ? 'Selecciona una comuna' : 'Selecciona una región primero'}
                searchPlaceholder="Buscar comuna..."
                helper={form.region ? regionData?.region : 'Disponible después de la región'}
                icon="location_on"
                onChange={(location) => set('location', location)}
              />
            </Field>
          </div>
        </div>

        {/* Estado */}
        <div>
          <p className="label-caps text-[var(--color-on-surface-variant)] text-[10px] mb-4 pb-2 border-b border-[var(--color-outline-variant)]/20">ESTADO DE LA PUBLICACIÓN</p>
          <div className="flex flex-wrap gap-2">
            {STATUS_OPTIONS.map((s) => (
              <button key={s.value} type="button" onClick={() => set('status', s.value)}
                className={`px-4 py-2 rounded-lg label-caps text-xs transition-all ${
                  form.status === s.value
                    ? 'bg-[var(--color-primary-container)] text-[var(--color-on-primary-container)] border border-[var(--color-primary)]/40'
                    : 'border border-[var(--color-outline-variant)]/30 text-[var(--color-on-surface-variant)] hover:bg-[var(--color-surface-container-high)]'
                }`}>{s.label}</button>
            ))}
          </div>
        </div>

        {/* Descripción */}
        <Field label="DESCRIPCIÓN">
          <textarea className={`${inputCls} resize-none`} rows={4} value={form.description}
            onChange={(e) => set('description', e.target.value)}
            placeholder="Describe el estado del vehículo, historial de mantención, accesorios incluidos, etc." />
        </Field>

        {/* Acciones */}
        <div className="flex justify-between pt-2">
          <button type="button" onClick={() => navigate(-1)}
            className="px-8 py-3 border border-[var(--color-outline-variant)]/50 text-[var(--color-on-surface)] label-caps text-xs rounded-lg hover:bg-[var(--color-surface-container)] transition-all">
            CANCELAR
          </button>
          <button type="submit" disabled={saving || !form.brand || !form.model || !form.location}
            className="glow-primary px-10 py-3 bg-[var(--color-primary-container)] text-[var(--color-on-primary-container)] label-caps text-xs font-bold rounded-lg hover:bg-[var(--color-primary)] transition-all disabled:opacity-50 flex items-center gap-2">
            {saving
              ? <><span className="w-4 h-4 border-2 border-[var(--color-on-primary-container)]/30 border-t-[var(--color-on-primary-container)] rounded-full animate-spin" />GUARDANDO...</>
              : <><span className="material-symbols-outlined text-base">save</span>GUARDAR CAMBIOS</>}
          </button>
        </div>
      </form>
    </div>
  )
}
