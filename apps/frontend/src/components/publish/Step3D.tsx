import { useRef } from 'react'
import type { VehicleForm } from '@/pages/PublishVehicle'

interface Props {
  form: VehicleForm
  onChange: (f: Partial<VehicleForm>) => void
  onNext: () => void
  onPrev: () => void
}

export function Step3D({ form, onChange, onNext, onPrev }: Props) {
  const covered = form.reconstructionImages.filter((a) => a.file !== null).length
  const total = form.reconstructionImages.length
  const progress = Math.round((covered / total) * 100)
  const canContinue = covered >= 24

  function setAngleFile(index: number, file: File | null) {
    const next = [...form.reconstructionImages]
    next[index] = { ...next[index], file }
    onChange({ reconstructionImages: next })
  }

  return (
    <div>
      <h2 style={{ fontFamily: 'var(--font-headline)', fontSize: 22, fontWeight: 600 }} className="mb-2">
        Fotos para vista 3D
      </h2>
      <p className="text-[var(--color-on-surface-variant)] text-sm mb-6">
        Para generar el modelo 3D necesitas cubrir los ángulos indicados. Cuantos más ángulos captures,
        mejor será la calidad de la reconstrucción.
      </p>

      {/* Barra de progreso */}
      <div className="glass-panel rounded-xl px-5 py-4 mb-6">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-[var(--color-primary)] text-base">view_in_ar</span>
            <span className="label-caps text-[var(--color-on-surface-variant)] text-xs">ÁNGULOS CUBIERTOS</span>
          </div>
          <span
            className={`label-caps text-xs font-bold ${canContinue ? 'text-[var(--color-primary)]' : 'text-[var(--color-on-surface-variant)]'}`}
          >
            {covered} / {total}
          </span>
        </div>
        <div className="w-full h-1.5 bg-[var(--color-surface-container-highest)] rounded-full overflow-hidden">
          <div
            className="h-full rounded-full transition-all duration-500"
            style={{
              width: `${progress}%`,
              background: canContinue
                ? 'var(--color-primary)'
                : 'linear-gradient(to right, var(--color-primary-container), var(--color-primary))',
            }}
          />
        </div>
        <p className="text-[var(--color-on-surface-variant)] text-xs mt-2">
          {canContinue
            ? '¡Excelente! Tienes suficientes ángulos para una buena reconstrucción 3D.'
            : `Necesitas al menos 24 ángulos para continuar. Te faltan ${24 - covered}.`}
        </p>
      </div>

      {/* Tip */}
      <div className="flex items-start gap-3 bg-[var(--color-primary)]/5 border border-[var(--color-primary)]/20 rounded-lg px-4 py-3 mb-6">
        <span className="material-symbols-outlined text-[var(--color-primary)] text-base mt-0.5">tips_and_updates</span>
        <p className="text-[var(--color-on-surface-variant)] text-sm">
          <span className="text-[var(--color-primary)] font-medium">Consejo pro:</span> Asegúrate de mantener iluminación uniforme y el vehículo centrado en cada foto. Evita fondos con objetos que se muevan entre tomas.
        </p>
      </div>

      {/* Grid de ángulos */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 mb-8">
        {form.reconstructionImages.map((item, i) => (
          <AngleSlot
            key={item.angle}
            label={item.label}
            file={item.file}
            onSelect={(file) => setAngleFile(i, file)}
            onRemove={() => setAngleFile(i, null)}
          />
        ))}
      </div>

      {/* Navegación */}
      <div className="flex justify-between">
        <button
          type="button"
          onClick={onPrev}
          className="px-8 py-3 border border-[var(--color-outline-variant)]/50 text-[var(--color-on-surface)] label-caps rounded-lg hover:bg-[var(--color-surface-container)] transition-all flex items-center gap-2"
        >
          <span className="material-symbols-outlined text-base">arrow_back</span>
          ANTERIOR
        </button>
        <button
          type="button"
          onClick={onNext}
          disabled={!canContinue}
          className="glow-primary px-10 py-3 bg-[var(--color-primary-container)] text-[var(--color-on-primary-container)] label-caps font-bold rounded-lg hover:bg-[var(--color-primary)] transition-all flex items-center gap-2 disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-[var(--color-primary-container)]"
        >
          REVISAR Y PUBLICAR
          <span className="material-symbols-outlined text-base">arrow_forward</span>
        </button>
      </div>
    </div>
  )
}

function AngleSlot({
  label,
  file,
  onSelect,
  onRemove,
}: {
  label: string
  file: File | null
  onSelect: (f: File) => void
  onRemove: () => void
}) {
  const inputRef = useRef<HTMLInputElement>(null)

  return (
    <div className="flex flex-col gap-1.5">
      <div
        onClick={() => !file && inputRef.current?.click()}
        className={`aspect-square rounded-lg border flex flex-col items-center justify-center transition-all overflow-hidden relative ${
          file
            ? 'border-[var(--color-primary)]/60 cursor-default'
            : 'border-[var(--color-outline-variant)]/30 border-dashed cursor-pointer hover:border-[var(--color-primary)]/50 hover:bg-[var(--color-primary)]/5'
        }`}
      >
        {file ? (
          <>
            <img
              src={URL.createObjectURL(file)}
              alt={label}
              className="w-full h-full object-cover"
            />
            <button
              type="button"
              onClick={(e) => { e.stopPropagation(); onRemove() }}
              className="absolute top-1 right-1 w-6 h-6 rounded-full bg-black/60 text-white flex items-center justify-center"
            >
              <span className="material-symbols-outlined text-sm">close</span>
            </button>
            <div className="absolute bottom-1 left-1 w-5 h-5 rounded-full bg-[var(--color-primary-container)] flex items-center justify-center">
              <span className="material-symbols-outlined text-[var(--color-on-primary-container)] text-sm">check</span>
            </div>
          </>
        ) : (
          <>
            <span className="material-symbols-outlined text-[var(--color-outline)] mb-1" style={{ fontSize: 28 }}>
              photo_camera
            </span>
            <span className="label-caps text-[var(--color-outline)] text-[9px]">SUBIR</span>
          </>
        )}
        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={(e) => {
            const f = e.target.files?.[0]
            if (f) onSelect(f)
          }}
        />
      </div>
      <p className="text-[var(--color-on-surface-variant)] text-[11px] text-center leading-tight">
        {label}
      </p>
    </div>
  )
}
