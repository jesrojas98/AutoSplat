import { useEffect, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { vehiclesService } from '@/services/vehicles.service'
import { StepInfo } from '@/components/publish/StepInfo'
import { StepPhotos } from '@/components/publish/StepPhotos'
import { Step3D } from '@/components/publish/Step3D'
import { StepReview } from '@/components/publish/StepReview'

export type VehicleForm = {
  brand: string
  model: string
  year: string
  price: string
  mileage: string
  transmission: string
  fuelType: string
  bodyType: string
  color: string
  doors: string
  location: string
  region: string
  description: string
  galleryImages: File[]
  reconstructionImages: { angle: string; label: string; file: File | null }[]
  freeImages: File[]
}

const INITIAL_FORM: VehicleForm = {
  brand: '', model: '', year: '', price: '', mileage: '',
  transmission: '', fuelType: '', bodyType: '', color: '',
  doors: '', location: '', region: '', description: '',
  galleryImages: [],
  reconstructionImages: [],
  freeImages: [],
}

const STEPS = [
  { id: 1, label: 'Información', icon: 'article' },
  { id: 2, label: 'Fotos', icon: 'photo_library' },
  { id: 3, label: 'Vista 3D', icon: 'view_in_ar' },
  { id: 4, label: 'Publicar', icon: 'check_circle' },
]

export function PublishVehicle() {
  const [step, setStep] = useState(1)
  const [form, setForm] = useState<VehicleForm>({
    ...INITIAL_FORM,
    reconstructionImages: ANGLES.map((a) => ({ ...a, file: null })),
  })
  // ?draft=<id>: continuar un borrador cuya subida de fotos falló. Se reutiliza el mismo vehículo (no se crea otro)
  const [params] = useSearchParams()
  const draftId = params.get('draft')
  const [draftState, setDraftState] = useState<'none' | 'loading' | 'ready' | 'error'>(draftId ? 'loading' : 'none')

  useEffect(() => {
    if (!draftId) return
    let cancelled = false
    vehiclesService.getOne(draftId)
      .then((v) => {
        if (cancelled) return
        if (v.status !== 'draft') { setDraftState('error'); return }
        const text = (x: unknown) => (x === null || x === undefined ? '' : String(x))
        setForm((f) => ({
          ...f,
          brand: text(v.brand), model: text(v.model), year: text(v.year),
          price: text(v.price), mileage: text(v.mileage),
          transmission: text(v.transmission), fuelType: text(v.fuel_type), bodyType: text(v.body_type),
          color: text(v.color), doors: text(v.doors), location: text(v.location),
          region: text(v.region), description: text(v.description),
        }))
        setStep(2) // los datos ya están: se sigue en las fotos (se puede volver al paso 1 para revisarlos)
        setDraftState('ready')
      })
      .catch(() => { if (!cancelled) setDraftState('error') })
    return () => { cancelled = true }
  }, [draftId])

  function updateForm(fields: Partial<VehicleForm>) {
    setForm((f) => ({ ...f, ...fields }))
  }

  function next() { setStep((s) => Math.min(s + 1, 4)) }
  function prev() { setStep((s) => Math.max(s - 1, 1)) }

  if (draftState === 'loading' || draftState === 'error') {
    return (
      <div className="px-4 py-16 max-w-md mx-auto text-center flex flex-col items-center gap-4">
        {draftState === 'loading' ? (
          <>
            <span className="material-symbols-outlined text-[var(--color-primary)] animate-spin" style={{ fontSize: 36 }}>progress_activity</span>
            <p className="text-[var(--color-on-surface-variant)] text-sm">Cargando el borrador…</p>
          </>
        ) : (
          <>
            <span className="material-symbols-outlined text-[var(--color-outline)]" style={{ fontSize: 40 }}>draft</span>
            <p className="text-[var(--color-on-surface-variant)] text-sm">
              No se encontró ese borrador o ya fue publicado.
            </p>
            <Link to="/dashboard" className="label-caps text-xs text-[var(--color-primary)] hover:underline">VOLVER A MIS PUBLICACIONES</Link>
          </>
        )}
      </div>
    )
  }

  return (
    <div className="px-4 sm:px-[var(--spacing-gutter)] py-6 sm:py-12 max-w-4xl mx-auto">
      {/* Título */}
      <div className="mb-6 sm:mb-10">
        <p className="label-caps text-[var(--color-primary)] mb-2">{draftId ? 'CONTINUAR BORRADOR' : 'NUEVO AVISO'}</p>
        <h1 className="text-[28px] sm:text-[32px]" style={{ fontFamily: 'var(--font-headline)', fontWeight: 700 }}>
          Publicar vehículo
        </h1>
      </div>

      {/* Stepper */}
      <div className="flex items-center mb-3 sm:mb-10">
        {STEPS.map((s, i) => (
          <div key={s.id} className="flex items-center flex-1 last:flex-none">
            <button
              onClick={() => step > s.id && setStep(s.id)}
              className={`flex flex-col items-center gap-1 group ${step > s.id ? 'cursor-pointer' : 'cursor-default'}`}
            >
              <div className={`w-10 h-10 rounded-full flex items-center justify-center border-2 transition-all ${
                step === s.id
                  ? 'border-[var(--color-primary)] bg-[var(--color-primary)]/10 active-glow'
                  : step > s.id
                  ? 'border-[var(--color-primary)] bg-[var(--color-primary-container)]'
                  : 'border-[var(--color-outline-variant)]/50 bg-[var(--color-surface-container)]'
              }`}>
                {step > s.id
                  ? <span className="material-symbols-outlined text-[var(--color-on-primary-container)] text-base">check</span>
                  : <span className={`material-symbols-outlined text-base ${step === s.id ? 'text-[var(--color-primary)]' : 'text-[var(--color-outline)]'}`}>{s.icon}</span>
                }
              </div>
              <span className={`label-caps text-[10px] hidden sm:block ${step === s.id ? 'text-[var(--color-primary)]' : step > s.id ? 'text-[var(--color-on-surface-variant)]' : 'text-[var(--color-outline)]'}`}>
                {s.label.toUpperCase()}
              </span>
            </button>
            {i < STEPS.length - 1 && (
              <div className={`flex-1 h-px mx-2 sm:mx-3 transition-colors ${step > s.id ? 'bg-[var(--color-primary)]/50' : 'bg-[var(--color-outline-variant)]/30'}`} />
            )}
          </div>
        ))}
      </div>

      {/* Etiqueta del paso actual (móvil: el stepper solo muestra íconos) */}
      <p className="sm:hidden label-caps text-xs text-[var(--color-primary)] mb-5">
        PASO {step} DE {STEPS.length} · {STEPS[step - 1].label.toUpperCase()}
      </p>

      {/* Contenido del paso */}
      <div className="glass-card rounded-2xl p-4 sm:p-8">
        {step === 1 && <StepInfo form={form} onChange={updateForm} onNext={next} />}
        {step === 2 && <StepPhotos form={form} onChange={updateForm} onNext={next} onPrev={prev} />}
        {step === 3 && <Step3D form={form} onChange={updateForm} onNext={next} onPrev={prev} />}
        {step === 4 && <StepReview form={form} onPrev={prev} draftId={draftId} />}
      </div>
    </div>
  )
}

export const ANGLES = [
  { angle: 'front-low',       label: 'Frontal bajo' },
  { angle: 'front-mid',       label: 'Frontal medio' },
  { angle: 'front-high',      label: 'Frontal alto' },
  { angle: 'front-left-low',  label: 'Frente izq. bajo' },
  { angle: 'front-left-mid',  label: 'Frente izq. medio' },
  { angle: 'rear-left-mid',   label: 'Trasera izq. medio' },
  { angle: 'rear-mid',        label: 'Trasera media' },
  { angle: 'rear-high',       label: 'Trasera alta' },
  { angle: 'side-right-low',  label: 'Lateral der. bajo' },
  { angle: 'side-right-mid',  label: 'Lateral der. medio' },
  { angle: 'front-right-mid', label: 'Frente der. medio' },
  { angle: 'front-right',     label: 'Frente der.' },
  { angle: 'wheel-fl',        label: 'Rueda delantera izq.' },
  { angle: 'wheel-fr',        label: 'Rueda delantera der.' },
  { angle: 'wheel-rl',        label: 'Rueda trasera izq.' },
  { angle: 'wheel-rr',        label: 'Rueda trasera der.' },
  { angle: 'roof',            label: 'Techo' },
  { angle: 'underbody',       label: 'Piso / zócalo' },
  { angle: 'windshield',      label: 'Parabrisas' },
  { angle: 'rear-window',     label: 'Luneta trasera' },
  { angle: 'engine',          label: 'Motor (opcional)' },
]
