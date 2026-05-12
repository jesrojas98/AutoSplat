import { useState } from 'react'
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
}

const INITIAL_FORM: VehicleForm = {
  brand: '', model: '', year: '', price: '', mileage: '',
  transmission: '', fuelType: '', bodyType: '', color: '',
  doors: '', location: '', region: '', description: '',
  galleryImages: [],
  reconstructionImages: [],
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

  function updateForm(fields: Partial<VehicleForm>) {
    setForm((f) => ({ ...f, ...fields }))
  }

  function next() { setStep((s) => Math.min(s + 1, 4)) }
  function prev() { setStep((s) => Math.max(s - 1, 1)) }

  return (
    <div className="px-[var(--spacing-gutter)] py-12 max-w-4xl mx-auto">
      {/* Título */}
      <div className="mb-10">
        <p className="label-caps text-[var(--color-primary)] mb-2">NUEVO AVISO</p>
        <h1 style={{ fontFamily: 'var(--font-headline)', fontSize: 32, fontWeight: 700 }}>
          Publicar vehículo
        </h1>
      </div>

      {/* Stepper */}
      <div className="flex items-center mb-10">
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
              <div className={`flex-1 h-px mx-3 transition-colors ${step > s.id ? 'bg-[var(--color-primary)]/50' : 'bg-[var(--color-outline-variant)]/30'}`} />
            )}
          </div>
        ))}
      </div>

      {/* Contenido del paso */}
      <div className="glass-card rounded-2xl p-8">
        {step === 1 && <StepInfo form={form} onChange={updateForm} onNext={next} />}
        {step === 2 && <StepPhotos form={form} onChange={updateForm} onNext={next} onPrev={prev} />}
        {step === 3 && <Step3D form={form} onChange={updateForm} onNext={next} onPrev={prev} />}
        {step === 4 && <StepReview form={form} onPrev={prev} />}
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
  { angle: 'interior-front',  label: 'Interior delantero' },
  { angle: 'interior-rear',   label: 'Interior trasero' },
  { angle: 'dashboard',       label: 'Tablero' },
  { angle: 'engine',          label: 'Motor (opcional)' },
]
