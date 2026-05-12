import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import type { VehicleForm } from '@/pages/PublishVehicle'
import { formatPriceNumber } from '@/utils/formatters'

interface Props {
  form: VehicleForm
  onPrev: () => void
}

const FUEL_LABEL: Record<string, string> = {
  gasoline: 'Bencina', diesel: 'Diésel', electric: 'Eléctrico', hybrid: 'Híbrido',
}
const TRANSMISSION_LABEL: Record<string, string> = {
  manual: 'Manual', automatic: 'Automático', cvt: 'CVT',
}

export function StepReview({ form, onPrev }: Props) {
  const navigate = useNavigate()
  const [publishing, setPublishing] = useState(false)
  const [done, setDone] = useState(false)
  const covered3D = form.reconstructionImages.filter((a) => a.file !== null).length

  async function handlePublish() {
    setPublishing(true)
    // TODO: llamada real a la API
    await new Promise((r) => setTimeout(r, 2000))
    setDone(true)
    setPublishing(false)
  }

  if (done) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center gap-6">
        <div className="w-20 h-20 rounded-full bg-[var(--color-primary)]/10 flex items-center justify-center">
          <span className="material-symbols-outlined text-[var(--color-primary)]" style={{ fontSize: 44 }}>
            check_circle
          </span>
        </div>
        <div>
          <h2 style={{ fontFamily: 'var(--font-headline)', fontSize: 28, fontWeight: 700 }} className="mb-2">
            ¡Publicación creada!
          </h2>
          <p className="text-[var(--color-on-surface-variant)] text-sm max-w-md">
            Tu vehículo fue publicado correctamente. Si subiste fotos para la vista 3D, el procesamiento comenzará en breve.
          </p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={() => navigate('/catalog')}
            className="px-8 py-3 border border-[var(--color-outline-variant)]/50 text-[var(--color-on-surface)] label-caps rounded-lg hover:bg-[var(--color-surface-container)] transition-all"
          >
            VER CATÁLOGO
          </button>
          <button
            onClick={() => navigate('/dashboard')}
            className="glow-primary px-8 py-3 bg-[var(--color-primary-container)] text-[var(--color-on-primary-container)] label-caps font-bold rounded-lg hover:bg-[var(--color-primary)] transition-all"
          >
            IR A MI CUENTA
          </button>
        </div>
      </div>
    )
  }

  return (
    <div>
      <h2 style={{ fontFamily: 'var(--font-headline)', fontSize: 22, fontWeight: 600 }} className="mb-6">
        Revisión y publicación
      </h2>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        {/* Resumen del vehículo */}
        <div className="bg-[var(--color-surface-container)] rounded-xl p-5">
          <p className="label-caps text-[var(--color-on-surface-variant)] text-xs mb-4">DATOS DEL VEHÍCULO</p>
          <div className="space-y-3">
            <ReviewRow label="Vehículo" value={`${form.brand} ${form.model} ${form.year}`} />
            <ReviewRow
              label="Precio"
              value={
                <span className="flex items-baseline gap-1">
                  <span>{formatPriceNumber(Number(form.price))}</span>
                  <span className="label-caps text-[var(--color-on-surface-variant)] text-[10px]">CLP</span>
                </span>
              }
            />
            <ReviewRow label="Kilometraje" value={`${Number(form.mileage).toLocaleString('es-CL')} km`} />
            <ReviewRow label="Transmisión" value={TRANSMISSION_LABEL[form.transmission] ?? form.transmission} />
            <ReviewRow label="Combustible" value={FUEL_LABEL[form.fuelType] ?? form.fuelType} />
            <ReviewRow label="Ubicación" value={`${form.location}, ${form.region}`} />
          </div>
        </div>

        {/* Resumen de fotos */}
        <div className="bg-[var(--color-surface-container)] rounded-xl p-5">
          <p className="label-caps text-[var(--color-on-surface-variant)] text-xs mb-4">FOTOS Y MODELO 3D</p>
          <div className="space-y-3">
            <ReviewRow label="Fotos de galería" value={`${form.galleryImages.length} fotos`} />
            <ReviewRow
              label="Ángulos para 3D"
              value={
                <span className={covered3D >= 24 ? 'text-[var(--color-primary)]' : 'text-[var(--color-on-surface-variant)]'}>
                  {covered3D} / {form.reconstructionImages.length} ángulos
                </span>
              }
            />
            <ReviewRow
              label="Vista 3D"
              value={
                covered3D >= 24
                  ? <span className="label-caps text-[10px] bg-[var(--color-primary-container)] text-[var(--color-on-primary-container)] px-2 py-1 rounded">SE GENERARÁ</span>
                  : <span className="label-caps text-[10px] text-[var(--color-outline)]">SIN MODELO 3D</span>
              }
            />
          </div>

          {/* Preview primera foto */}
          {form.galleryImages[0] && (
            <div className="mt-4 aspect-[16/9] rounded-lg overflow-hidden">
              <img
                src={URL.createObjectURL(form.galleryImages[0])}
                alt="Portada"
                className="w-full h-full object-cover"
              />
            </div>
          )}
        </div>
      </div>

      {/* Descripción preview */}
      {form.description && (
        <div className="bg-[var(--color-surface-container)] rounded-xl p-5 mb-6">
          <p className="label-caps text-[var(--color-on-surface-variant)] text-xs mb-3">DESCRIPCIÓN</p>
          <p className="text-[var(--color-on-surface-variant)] text-sm leading-relaxed">
            {form.description}
          </p>
        </div>
      )}

      {/* Aviso 3D */}
      {covered3D >= 24 && (
        <div className="flex items-start gap-3 bg-[var(--color-primary)]/5 border border-[var(--color-primary)]/20 rounded-lg px-4 py-3 mb-6">
          <span className="material-symbols-outlined text-[var(--color-primary)] text-base mt-0.5">blur_on</span>
          <p className="text-[var(--color-on-surface-variant)] text-sm">
            <span className="text-[var(--color-primary)] font-medium">Vista 3D incluida:</span> El procesamiento Gaussian Splatting comenzará automáticamente después de publicar. El modelo estará disponible en 30–60 minutos.
          </p>
        </div>
      )}

      {/* Navegación */}
      <div className="flex justify-between">
        <button
          type="button"
          onClick={onPrev}
          disabled={publishing}
          className="px-8 py-3 border border-[var(--color-outline-variant)]/50 text-[var(--color-on-surface)] label-caps rounded-lg hover:bg-[var(--color-surface-container)] transition-all flex items-center gap-2 disabled:opacity-40"
        >
          <span className="material-symbols-outlined text-base">arrow_back</span>
          ANTERIOR
        </button>
        <button
          type="button"
          onClick={handlePublish}
          disabled={publishing}
          className="glow-primary px-10 py-3 bg-[var(--color-primary-container)] text-[var(--color-on-primary-container)] label-caps font-bold rounded-lg hover:bg-[var(--color-primary)] transition-all flex items-center gap-2 disabled:opacity-70"
        >
          {publishing ? (
            <>
              <span className="w-4 h-4 border-2 border-[var(--color-on-primary-container)]/30 border-t-[var(--color-on-primary-container)] rounded-full animate-spin" />
              PUBLICANDO...
            </>
          ) : (
            <>
              <span className="material-symbols-outlined text-base">rocket_launch</span>
              PUBLICAR AHORA
            </>
          )}
        </button>
      </div>
    </div>
  )
}

function ReviewRow({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-4">
      <span className="label-caps text-[var(--color-on-surface-variant)] text-[10px] shrink-0">{label.toUpperCase()}</span>
      <span className="mono-spec text-[var(--color-on-surface)] text-sm text-right">{value}</span>
    </div>
  )
}
