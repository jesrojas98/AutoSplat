import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import type { VehicleForm } from '@/pages/PublishVehicle'
import { formatPriceNumber } from '@/utils/formatters'
import { api } from '@/lib/api'

interface Props {
  form: VehicleForm
  onPrev: () => void
}

const FUEL_LABEL: Record<string, string> = { gasoline: 'Bencina', diesel: 'Diésel', electric: 'Eléctrico', hybrid: 'Híbrido' }
const TRANSMISSION_LABEL: Record<string, string> = { manual: 'Manual', automatic: 'Automático', cvt: 'CVT' }

const STEPS_PUBLISH = [
  'Creando publicación...',
  'Subiendo fotos de galería...',
  'Subiendo fotos para 3D...',
  'Publicando vehículo...',
  'Iniciando procesamiento 3D...',
]

export function StepReview({ form, onPrev }: Props) {
  const navigate = useNavigate()
  const [publishing, setPublishing] = useState(false)
  const [publishStep, setPublishStep] = useState(0)
  const [done, setDone] = useState(false)
  const [vehicleId, setVehicleId] = useState<string | null>(null)
  const [error, setError] = useState('')
  const covered3D = form.reconstructionImages.filter((a) => a.file !== null).length

  async function handlePublish() {
    setPublishing(true)
    setError('')
    try {
      // 1. Crear vehículo en borrador
      setPublishStep(0)
      const { data: vehicle } = await api.post('/vehicles', {
        brand: form.brand,
        model: form.model,
        year: Number(form.year),
        price: Number(form.price),
        mileage: Number(form.mileage),
        transmission: form.transmission || undefined,
        fuel_type: form.fuelType || undefined,
        body_type: form.bodyType || undefined,
        color: form.color || undefined,
        doors: form.doors ? Number(form.doors) : undefined,
        location: form.location,
        region: form.region || undefined,
        description: form.description || undefined,
      })
      setVehicleId(vehicle.id)

      // 2. Subir fotos de galería
      if (form.galleryImages.length > 0) {
        setPublishStep(1)
        const fd = new FormData()
        form.galleryImages.forEach((f) => fd.append('images', f))
        await api.post(`/upload/vehicles/${vehicle.id}/images`, fd, {
          headers: { 'Content-Type': 'multipart/form-data' },
        })
      }

      // 3. Subir fotos de reconstrucción 3D
      const recon3D = form.reconstructionImages.filter((a) => a.file !== null)
      if (recon3D.length > 0) {
        setPublishStep(2)
        const fd = new FormData()
        recon3D.forEach((a) => fd.append('images', a.file!))
        await api.post(`/upload/vehicles/${vehicle.id}/reconstruction`, fd, {
          headers: { 'Content-Type': 'multipart/form-data' },
        })
      }

      // 4. Publicar vehículo
      setPublishStep(3)
      await api.patch(`/vehicles/${vehicle.id}/publish`)

      // 5. Crear job 3D si hay suficientes fotos
      if (covered3D >= 24) {
        setPublishStep(4)
        await api.post('/jobs', { vehicleId: vehicle.id, inputImagesCount: covered3D })
      }

      setDone(true)
    } catch (err: any) {
      setError(err.response?.data?.message ?? 'Error al publicar. Intenta de nuevo.')
    } finally {
      setPublishing(false)
    }
  }

  if (done) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center gap-6">
        <div className="w-20 h-20 rounded-full bg-[var(--color-primary)]/10 flex items-center justify-center">
          <span className="material-symbols-outlined text-[var(--color-primary)]" style={{ fontSize: 44 }}>check_circle</span>
        </div>
        <div>
          <h2 style={{ fontFamily: 'var(--font-headline)', fontSize: 28, fontWeight: 700 }} className="mb-2">¡Publicación creada!</h2>
          <p className="text-[var(--color-on-surface-variant)] text-sm max-w-md">
            Tu vehículo fue publicado correctamente.
            {covered3D >= 24 && ' El procesamiento 3D comenzará en breve.'}
          </p>
        </div>
        <div className="flex gap-3">
          {vehicleId && (
            <button onClick={() => navigate(`/vehicles/${vehicleId}`)}
              className="glow-primary px-8 py-3 bg-[var(--color-primary-container)] text-[var(--color-on-primary-container)] label-caps font-bold rounded-lg hover:bg-[var(--color-primary)] transition-all">
              VER PUBLICACIÓN
            </button>
          )}
          <button onClick={() => navigate('/dashboard')}
            className="px-8 py-3 border border-[var(--color-outline-variant)]/50 text-[var(--color-on-surface)] label-caps rounded-lg hover:bg-[var(--color-surface-container)] transition-all">
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

      {error && (
        <div className="mb-5 px-4 py-3 rounded-lg bg-[var(--color-secondary)]/10 border border-[var(--color-secondary)]/30 flex items-center gap-2">
          <span className="material-symbols-outlined text-[var(--color-secondary)] text-base">error</span>
          <p className="text-[var(--color-secondary)] text-sm">{error}</p>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        <div className="bg-[var(--color-surface-container)] rounded-xl p-5">
          <p className="label-caps text-[var(--color-on-surface-variant)] text-xs mb-4">DATOS DEL VEHÍCULO</p>
          <div className="space-y-3">
            <ReviewRow label="Vehículo" value={`${form.brand} ${form.model} ${form.year}`} />
            <ReviewRow label="Precio" value={
              <span className="flex items-baseline gap-1">
                <span>{formatPriceNumber(Number(form.price))}</span>
                <span className="label-caps text-[var(--color-on-surface-variant)] text-[10px]">CLP</span>
              </span>
            } />
            <ReviewRow label="Kilometraje" value={`${Number(form.mileage).toLocaleString('es-CL')} km`} />
            <ReviewRow label="Transmisión" value={TRANSMISSION_LABEL[form.transmission] ?? form.transmission} />
            <ReviewRow label="Combustible" value={FUEL_LABEL[form.fuelType] ?? form.fuelType} />
            <ReviewRow label="Ubicación" value={`${form.location}${form.region ? `, ${form.region}` : ''}`} />
          </div>
        </div>

        <div className="bg-[var(--color-surface-container)] rounded-xl p-5">
          <p className="label-caps text-[var(--color-on-surface-variant)] text-xs mb-4">FOTOS Y MODELO 3D</p>
          <div className="space-y-3">
            <ReviewRow label="Fotos de galería" value={`${form.galleryImages.length} fotos`} />
            <ReviewRow label="Ángulos para 3D" value={
              <span className={covered3D >= 24 ? 'text-[var(--color-primary)]' : 'text-[var(--color-on-surface-variant)]'}>
                {covered3D} / {form.reconstructionImages.length} ángulos
              </span>
            } />
            <ReviewRow label="Vista 3D" value={
              covered3D >= 24
                ? <span className="label-caps text-[10px] bg-[var(--color-primary-container)] text-[var(--color-on-primary-container)] px-2 py-1 rounded">SE GENERARÁ</span>
                : <span className="label-caps text-[10px] text-[var(--color-outline)]">SIN MODELO 3D</span>
            } />
          </div>
          {form.galleryImages[0] && (
            <div className="mt-4 aspect-[16/9] rounded-lg overflow-hidden">
              <img src={URL.createObjectURL(form.galleryImages[0])} alt="Portada" className="w-full h-full object-cover" />
            </div>
          )}
        </div>
      </div>

      {form.description && (
        <div className="bg-[var(--color-surface-container)] rounded-xl p-5 mb-6">
          <p className="label-caps text-[var(--color-on-surface-variant)] text-xs mb-3">DESCRIPCIÓN</p>
          <p className="text-[var(--color-on-surface-variant)] text-sm leading-relaxed">{form.description}</p>
        </div>
      )}

      {covered3D >= 24 && (
        <div className="flex items-start gap-3 bg-[var(--color-primary)]/5 border border-[var(--color-primary)]/20 rounded-lg px-4 py-3 mb-6">
          <span className="material-symbols-outlined text-[var(--color-primary)] text-base mt-0.5">blur_on</span>
          <p className="text-[var(--color-on-surface-variant)] text-sm">
            <span className="text-[var(--color-primary)] font-medium">Vista 3D incluida:</span> El procesamiento Gaussian Splatting comenzará automáticamente. El modelo estará listo en 30–60 minutos.
          </p>
        </div>
      )}

      {/* Progreso durante publicación */}
      {publishing && (
        <div className="mb-6 bg-[var(--color-surface-container)] rounded-xl p-4 flex items-center gap-3">
          <span className="material-symbols-outlined text-[var(--color-primary)] animate-spin text-base">progress_activity</span>
          <p className="text-[var(--color-on-surface-variant)] text-sm">{STEPS_PUBLISH[publishStep]}</p>
        </div>
      )}

      <div className="flex justify-between">
        <button type="button" onClick={onPrev} disabled={publishing}
          className="px-8 py-3 border border-[var(--color-outline-variant)]/50 text-[var(--color-on-surface)] label-caps rounded-lg hover:bg-[var(--color-surface-container)] transition-all flex items-center gap-2 disabled:opacity-40">
          <span className="material-symbols-outlined text-base">arrow_back</span>
          ANTERIOR
        </button>
        <button type="button" onClick={handlePublish} disabled={publishing}
          className="glow-primary px-10 py-3 bg-[var(--color-primary-container)] text-[var(--color-on-primary-container)] label-caps font-bold rounded-lg hover:bg-[var(--color-primary)] transition-all flex items-center gap-2 disabled:opacity-70">
          {publishing ? (
            <><span className="w-4 h-4 border-2 border-[var(--color-on-primary-container)]/30 border-t-[var(--color-on-primary-container)] rounded-full animate-spin" />PUBLICANDO...</>
          ) : (
            <><span className="material-symbols-outlined text-base">rocket_launch</span>PUBLICAR AHORA</>
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
