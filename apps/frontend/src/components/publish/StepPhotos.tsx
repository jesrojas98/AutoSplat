import { useRef } from 'react'
import type { VehicleForm } from '@/pages/PublishVehicle'

interface Props {
  form: VehicleForm
  onChange: (f: Partial<VehicleForm>) => void
  onNext: () => void
  onPrev: () => void
}

export function StepPhotos({ form, onChange, onNext, onPrev }: Props) {
  const inputRef = useRef<HTMLInputElement>(null)

  function handleFiles(files: FileList | null) {
    if (!files) return
    const next = [...form.galleryImages, ...Array.from(files)].slice(0, 20)
    onChange({ galleryImages: next })
  }

  function removeImage(index: number) {
    onChange({ galleryImages: form.galleryImages.filter((_, i) => i !== index) })
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault()
    handleFiles(e.dataTransfer.files)
  }

  return (
    <div>
      <h2 style={{ fontFamily: 'var(--font-headline)', fontSize: 22, fontWeight: 600 }} className="mb-2">
        Fotos de la galería
      </h2>
      <p className="text-[var(--color-on-surface-variant)] text-sm mb-6">
        Sube entre 4 y 20 fotos que representen bien el vehículo (exterior, interior, detalles).
        Estas fotos se mostrarán en el catálogo.
      </p>

      {/* Zona de drop */}
      <div
        onDrop={handleDrop}
        onDragOver={(e) => e.preventDefault()}
        onClick={() => inputRef.current?.click()}
        className="border-2 border-dashed border-[var(--color-outline-variant)]/40 rounded-xl p-10 flex flex-col items-center justify-center gap-3 cursor-pointer hover:border-[var(--color-primary)]/50 hover:bg-[var(--color-primary)]/5 transition-all mb-6"
      >
        <span className="material-symbols-outlined text-[var(--color-primary)]" style={{ fontSize: 40 }}>
          add_photo_alternate
        </span>
        <p style={{ fontFamily: 'var(--font-headline)', fontWeight: 600 }} className="text-base">
          Arrastra fotos aquí o haz clic para seleccionar
        </p>
        <p className="label-caps text-[var(--color-on-surface-variant)] text-xs">
          JPG, PNG · MÁXIMO 20 FOTOS · 10 MB POR FOTO
        </p>
        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          multiple
          className="hidden"
          onChange={(e) => handleFiles(e.target.files)}
        />
      </div>

      {/* Preview de imágenes */}
      {form.galleryImages.length > 0 && (
        <div>
          <div className="flex items-center justify-between mb-3">
            <p className="label-caps text-[var(--color-on-surface-variant)] text-xs">
              {form.galleryImages.length} / 20 FOTOS SELECCIONADAS
            </p>
            <button
              type="button"
              onClick={() => onChange({ galleryImages: [] })}
              className="label-caps text-[var(--color-secondary)] text-xs hover:underline"
            >
              ELIMINAR TODAS
            </button>
          </div>
          <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-3 mb-6">
            {form.galleryImages.map((file, i) => (
              <div key={i} className="relative group aspect-square rounded-lg overflow-hidden border border-[var(--color-outline-variant)]/30">
                <img
                  src={URL.createObjectURL(file)}
                  alt=""
                  className="w-full h-full object-cover"
                />
                {i === 0 && (
                  <span className="absolute bottom-1 left-1 label-caps text-[9px] bg-[var(--color-primary-container)] text-[var(--color-on-primary-container)] px-1.5 py-0.5 rounded">
                    PORTADA
                  </span>
                )}
                <button
                  type="button"
                  onClick={(e) => { e.stopPropagation(); removeImage(i) }}
                  className="absolute top-1 right-1 w-6 h-6 rounded-full bg-black/60 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <span className="material-symbols-outlined text-sm">close</span>
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tip */}
      <div className="flex items-start gap-3 bg-[var(--color-primary)]/5 border border-[var(--color-primary)]/20 rounded-lg px-4 py-3 mb-8">
        <span className="material-symbols-outlined text-[var(--color-primary)] text-base mt-0.5">lightbulb</span>
        <p className="text-[var(--color-on-surface-variant)] text-sm">
          <span className="text-[var(--color-primary)] font-medium">Consejo:</span> La primera foto será la portada de tu publicación. Asegúrate de que muestre el vehículo completo con buena iluminación.
        </p>
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
          disabled={form.galleryImages.length < 4}
          className="glow-primary px-10 py-3 bg-[var(--color-primary-container)] text-[var(--color-on-primary-container)] label-caps font-bold rounded-lg hover:bg-[var(--color-primary)] transition-all flex items-center gap-2 disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-[var(--color-primary-container)]"
        >
          SIGUIENTE
          <span className="material-symbols-outlined text-base">arrow_forward</span>
        </button>
      </div>
    </div>
  )
}
