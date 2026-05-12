import type { VehicleForm } from '@/pages/PublishVehicle'

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

const REGIONS = [
  'Región Metropolitana', 'Valparaíso', 'Biobío', 'La Araucanía',
  'Los Lagos', 'O\'Higgins', 'Maule', 'Ñuble', 'Los Ríos',
  'Antofagasta', 'Atacama', 'Coquimbo', 'Tarapacá', 'Arica y Parinacota',
  'Aysén', 'Magallanes',
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

export function StepInfo({ form, onChange, onNext }: Props) {
  const currentYear = new Date().getFullYear()

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
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
          <input
            required
            type="text"
            className={inputCls}
            placeholder="ej. Toyota"
            value={form.brand}
            onChange={(e) => onChange({ brand: e.target.value })}
          />
        </Field>

        {/* Modelo */}
        <Field label="MODELO">
          <input
            required
            type="text"
            className={inputCls}
            placeholder="ej. Corolla"
            value={form.model}
            onChange={(e) => onChange({ model: e.target.value })}
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
          <select
            required
            className={inputCls}
            value={form.region}
            onChange={(e) => onChange({ region: e.target.value })}
          >
            <option value="">Seleccionar...</option>
            {REGIONS.map((r) => (
              <option key={r} value={r}>{r}</option>
            ))}
          </select>
        </Field>

        {/* Ciudad */}
        <Field label="CIUDAD">
          <input
            required
            type="text"
            className={inputCls}
            placeholder="ej. Santiago"
            value={form.location}
            onChange={(e) => onChange({ location: e.target.value })}
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
          className="glow-primary px-10 py-3 bg-[var(--color-primary-container)] text-[var(--color-on-primary-container)] label-caps font-bold rounded-lg hover:bg-[var(--color-primary)] transition-all flex items-center gap-2"
        >
          SIGUIENTE
          <span className="material-symbols-outlined text-base">arrow_forward</span>
        </button>
      </div>
    </form>
  )
}
