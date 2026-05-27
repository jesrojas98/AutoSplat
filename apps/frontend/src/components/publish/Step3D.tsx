import { useRef, useState } from 'react'
import type { VehicleForm } from '@/pages/PublishVehicle'

interface Props {
  form: VehicleForm
  onChange: (f: Partial<VehicleForm>) => void
  onNext: () => void
  onPrev: () => void
}

function getQuality(total: number): { label: string; color: string; desc: string } {
  if (total >= 80) return { label: 'EXCELENTE', color: 'var(--color-primary)', desc: 'Detalle máximo, texturas muy nítidas.' }
  if (total >= 50) return { label: 'MUY BUENA', color: '#4ade80', desc: 'Buena definición y cobertura completa.' }
  if (total >= 30) return { label: 'BUENA', color: '#facc15', desc: 'Modelo reconocible con algunos artefactos.' }
  return { label: 'BÁSICA', color: 'var(--color-outline)', desc: `Necesitas al menos 20 fotos. Te faltan ${Math.max(0, 20 - total)}.` }
}

export function Step3D({ form, onChange, onNext, onPrev }: Props) {
  const [tab, setTab] = useState<'free' | 'guided'>('free')

  const guidedCount = form.reconstructionImages.filter((a) => a.file !== null).length
  const totalCount = guidedCount + form.freeImages.length
  const canContinue = totalCount >= 20
  const quality = getQuality(totalCount)

  function setAngleFile(index: number, file: File | null) {
    const next = [...form.reconstructionImages]
    next[index] = { ...next[index], file }
    onChange({ reconstructionImages: next })
  }

  function addFreeImages(files: FileList | null) {
    if (!files) return
    const next = [...form.freeImages, ...Array.from(files)].slice(0, 200)
    onChange({ freeImages: next })
  }

  function removeFreeImage(index: number) {
    onChange({ freeImages: form.freeImages.filter((_, i) => i !== index) })
  }

  return (
    <div>
      <h2 style={{ fontFamily: 'var(--font-headline)', fontSize: 22, fontWeight: 600 }} className="mb-2">
        Fotos para vista 3D
      </h2>
      <p className="text-[var(--color-on-surface-variant)] text-sm mb-6">
        Cuantas más fotos subas cubriendo todos los ángulos del vehículo, mejor será la calidad del modelo 3D.
      </p>

      {/* Indicador de calidad */}
      <div className="glass-panel rounded-xl px-5 py-4 mb-6">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-base" style={{ color: quality.color }}>view_in_ar</span>
            <span className="label-caps text-[var(--color-on-surface-variant)] text-xs">TOTAL DE FOTOS</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="label-caps text-xs font-bold" style={{ color: quality.color }}>
              {totalCount} fotos — {quality.label}
            </span>
          </div>
        </div>
        <div className="w-full h-1.5 bg-[var(--color-surface-container-highest)] rounded-full overflow-hidden mb-2">
          <div
            className="h-full rounded-full transition-all duration-500"
            style={{
              width: `${Math.min(100, (totalCount / 80) * 100)}%`,
              background: quality.color,
            }}
          />
        </div>
        <div className="flex items-center justify-between">
          <p className="text-[var(--color-on-surface-variant)] text-xs">{quality.desc}</p>
          <div className="flex gap-3 text-[10px] label-caps text-[var(--color-outline)]">
            <span>20 básica</span>
            <span>50 buena</span>
            <span>80+ excelente</span>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 p-1 bg-[var(--color-surface-container)] rounded-lg mb-6">
        {[
          { id: 'free', label: 'Fotos libres', icon: 'add_photo_alternate', count: form.freeImages.length },
          { id: 'guided', label: 'Ángulos guiados', icon: 'grid_view', count: guidedCount },
        ].map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => setTab(t.id as 'free' | 'guided')}
            className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-md label-caps text-xs transition-all ${
              tab === t.id
                ? 'bg-[var(--color-primary-container)] text-[var(--color-on-primary-container)]'
                : 'text-[var(--color-on-surface-variant)] hover:bg-[var(--color-surface-container-high)]'
            }`}
          >
            <span className="material-symbols-outlined text-sm">{t.icon}</span>
            {t.label.toUpperCase()}
            {t.count > 0 && (
              <span className={`text-[10px] px-1.5 py-0.5 rounded-full ${tab === t.id ? 'bg-[var(--color-primary)]/20' : 'bg-[var(--color-outline-variant)]/30'}`}>
                {t.count}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Tab: fotos libres */}
      {tab === 'free' && (
        <FreeUploadZone
          images={form.freeImages}
          onAdd={addFreeImages}
          onRemove={removeFreeImage}
        />
      )}

      {/* Tab: ángulos guiados */}
      {tab === 'guided' && (
        <div>
          <div className="flex items-start gap-3 bg-[var(--color-primary)]/5 border border-[var(--color-primary)]/20 rounded-lg px-4 py-3 mb-5">
            <span className="material-symbols-outlined text-[var(--color-primary)] text-base mt-0.5">tips_and_updates</span>
            <p className="text-[var(--color-on-surface-variant)] text-sm">
              <span className="text-[var(--color-primary)] font-medium">Opcional pero recomendado:</span> estos ángulos guiados aseguran cobertura completa. Complementan las fotos libres.
            </p>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
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
        </div>
      )}

      {/* Navegación */}
      <div className="flex justify-between mt-8">
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

function FreeUploadZone({
  images,
  onAdd,
  onRemove,
}: {
  images: File[]
  onAdd: (f: FileList | null) => void
  onRemove: (i: number) => void
}) {
  const inputRef = useRef<HTMLInputElement>(null)

  function handleDrop(e: React.DragEvent) {
    e.preventDefault()
    onAdd(e.dataTransfer.files)
  }

  return (
    <div>
      <div
        onDrop={handleDrop}
        onDragOver={(e) => e.preventDefault()}
        onClick={() => inputRef.current?.click()}
        className="border-2 border-dashed border-[var(--color-outline-variant)]/40 rounded-xl p-8 flex flex-col items-center justify-center gap-3 cursor-pointer hover:border-[var(--color-primary)]/50 hover:bg-[var(--color-primary)]/5 transition-all mb-5"
      >
        <span className="material-symbols-outlined text-[var(--color-primary)]" style={{ fontSize: 40 }}>
          add_photo_alternate
        </span>
        <p style={{ fontFamily: 'var(--font-headline)', fontWeight: 600 }} className="text-base text-center">
          Arrastra fotos aquí o haz clic para seleccionar
        </p>
        <p className="label-caps text-[var(--color-on-surface-variant)] text-xs text-center">
          JPG, PNG · HASTA 200 FOTOS · RODEA EL AUTO CADA 10–15°
        </p>
        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          multiple
          className="hidden"
          onChange={(e) => onAdd(e.target.files)}
        />
      </div>

      {/* Tip de técnica */}
      <div className="flex items-start gap-3 bg-[var(--color-primary)]/5 border border-[var(--color-primary)]/20 rounded-lg px-4 py-3 mb-5">
        <span className="material-symbols-outlined text-[var(--color-primary)] text-base mt-0.5">directions_walk</span>
        <div className="text-sm text-[var(--color-on-surface-variant)] space-y-1">
          <p><span className="text-[var(--color-primary)] font-medium">Técnica recomendada:</span> camina alrededor del auto tomando una foto cada 10–15°. Haz 3 pasadas a alturas distintas (rodilla, cintura, hombro). Incluye fotos del interior.</p>
        </div>
      </div>

      {images.length > 0 && (
        <div>
          <div className="flex items-center justify-between mb-3">
            <p className="label-caps text-[var(--color-on-surface-variant)] text-xs">{images.length} FOTOS AÑADIDAS</p>
            <button type="button" onClick={() => { for (let i = images.length - 1; i >= 0; i--) onRemove(i) }}
              className="label-caps text-[var(--color-secondary)] text-xs hover:underline">
              ELIMINAR TODAS
            </button>
          </div>
          <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 gap-2">
            {images.map((file, i) => (
              <div key={i} className="relative group aspect-square rounded-lg overflow-hidden border border-[var(--color-outline-variant)]/30">
                <img src={URL.createObjectURL(file)} alt="" className="w-full h-full object-cover" />
                <button
                  type="button"
                  onClick={() => onRemove(i)}
                  className="absolute top-0.5 right-0.5 w-5 h-5 rounded-full bg-black/70 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <span className="material-symbols-outlined text-xs">close</span>
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

function AngleSlot({
  label, file, onSelect, onRemove,
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
            <img src={URL.createObjectURL(file)} alt={label} className="w-full h-full object-cover" />
            <button type="button" onClick={(e) => { e.stopPropagation(); onRemove() }}
              className="absolute top-1 right-1 w-6 h-6 rounded-full bg-black/60 text-white flex items-center justify-center">
              <span className="material-symbols-outlined text-sm">close</span>
            </button>
            <div className="absolute bottom-1 left-1 w-5 h-5 rounded-full bg-[var(--color-primary-container)] flex items-center justify-center">
              <span className="material-symbols-outlined text-[var(--color-on-primary-container)] text-sm">check</span>
            </div>
          </>
        ) : (
          <>
            <span className="material-symbols-outlined text-[var(--color-outline)] mb-1" style={{ fontSize: 28 }}>photo_camera</span>
            <span className="label-caps text-[var(--color-outline)] text-[9px]">SUBIR</span>
          </>
        )}
        <input ref={inputRef} type="file" accept="image/*" className="hidden"
          onChange={(e) => { const f = e.target.files?.[0]; if (f) onSelect(f) }} />
      </div>
      <p className="text-[var(--color-on-surface-variant)] text-[11px] text-center leading-tight">{label}</p>
    </div>
  )
}
