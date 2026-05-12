import { useParams, Link } from 'react-router-dom'
import { formatPriceNumber } from '@/utils/formatters'

const MOCK: Record<string, {
  id: string; brand: string; model: string; year: number; price: number
  mileage: number; transmission: string; fuelType: string; location: string
  has3dModel: boolean; images: string[]; description: string
  specs: { label: string; value: string; icon: string }[]
}> = {
  '1': {
    id: '1', brand: 'PORSCHE', model: '911 GT3', year: 2023, price: 224900,
    mileage: 4000, transmission: 'PDK', fuelType: 'Bencina', location: 'Santiago',
    has3dModel: true,
    images: [
      'https://images.unsplash.com/photo-1503736334956-4c8f8e4dc1d4?w=900&q=80',
      'https://images.unsplash.com/photo-1544636331-e26879cd4d9b?w=900&q=80',
      'https://images.unsplash.com/photo-1494976388531-d1058494cdd8?w=900&q=80',
    ],
    description: 'Porsche 911 GT3 2023 en excelente estado. Vehículo de colección con historial de mantención completo en servicio oficial. Motor boxer de 4.0L atmosférico con 510 CV, caja PDK de 7 velocidades. Equipado con paquete Weissach y llantas de magnesio. Único dueño desde cero km.',
    specs: [
      { label: 'MOTOR', value: '4.0L Boxer 6', icon: 'settings' },
      { label: 'POTENCIA', value: '510 CV', icon: 'bolt' },
      { label: 'TRANSMISIÓN', value: 'PDK 7 vel.', icon: 'auto_transmission' },
      { label: 'COMBUSTIBLE', value: 'Bencina', icon: 'oil_barrel' },
      { label: 'KILOMETRAJE', value: '4.000 km', icon: 'speed' },
      { label: 'TRACCIÓN', value: 'Trasera', icon: 'directions_car' },
    ],
  },
}


export function VehicleDetail() {
  const { id } = useParams()
  const vehicle = id ? MOCK[id] : null

  if (!vehicle) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] px-[var(--spacing-gutter)] text-center">
        <p className="label-caps text-[var(--color-primary)] mb-4">404</p>
        <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 40, fontWeight: 700 }} className="mb-6">
          Vehículo no encontrado
        </h1>
        <Link to="/catalog" className="glow-primary px-8 py-3 bg-[var(--color-primary-container)] text-[var(--color-on-primary-container)] label-caps font-bold rounded-lg hover:bg-[var(--color-primary)] transition-all">
          VER CATÁLOGO
        </Link>
      </div>
    )
  }

  return (
    <div className="px-[var(--spacing-gutter)] py-10 max-w-[var(--spacing-max-width)] mx-auto">
      {/* Breadcrumb */}
      <nav className="flex items-center gap-2 label-caps text-[var(--color-on-surface-variant)] text-xs mb-8">
        <Link to="/" className="hover:text-[var(--color-primary)] transition-colors">INICIO</Link>
        <span>/</span>
        <Link to="/catalog" className="hover:text-[var(--color-primary)] transition-colors">CATÁLOGO</Link>
        <span>/</span>
        <span className="text-[var(--color-on-surface)]">{vehicle.brand} {vehicle.model}</span>
      </nav>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">

        {/* Columna izquierda — galería */}
        <div className="flex flex-col gap-4">
          {/* Imagen principal */}
          <div className="aspect-[16/10] rounded-xl overflow-hidden relative">
            <img
              src={vehicle.images[0]}
              alt={`${vehicle.brand} ${vehicle.model}`}
              className="w-full h-full object-cover"
            />
            {vehicle.has3dModel && (
              <div className="absolute top-4 left-4 flex items-center gap-2 glass-card px-3 py-2 rounded-lg">
                <span className="material-symbols-outlined text-[var(--color-primary)] text-base">view_in_ar</span>
                <span className="label-caps text-[var(--color-primary)] text-[10px]">VISTA 3D DISPONIBLE</span>
              </div>
            )}
          </div>

          {/* Miniaturas */}
          <div className="flex gap-3">
            {vehicle.images.map((img, i) => (
              <div key={i} className={`flex-1 aspect-[4/3] rounded-lg overflow-hidden border-2 cursor-pointer transition-colors ${i === 0 ? 'border-[var(--color-primary)]' : 'border-[var(--color-outline-variant)]/30 hover:border-[var(--color-primary)]/50'}`}>
                <img src={img} alt="" className="w-full h-full object-cover" />
              </div>
            ))}
          </div>

          {/* Visor 3D placeholder */}
          {vehicle.has3dModel && (
            <div className="glass-card rounded-xl overflow-hidden">
              <div className="flex items-center justify-between px-4 py-3 border-b border-[var(--color-outline-variant)]/30">
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-[var(--color-primary)] animate-pulse" />
                  <span className="label-caps text-[var(--color-primary)] text-[10px]">VISTA 3D EN VIVO</span>
                </div>
                <span className="mono-spec text-[var(--color-on-surface-variant)] text-xs">Gaussian Splatting</span>
              </div>
              <div className="h-64 flex flex-col items-center justify-center gap-3 bg-[var(--color-surface-container-lowest)]">
                <span
                  className="material-symbols-outlined text-[var(--color-primary)]"
                  style={{ fontSize: 48, fontVariationSettings: "'FILL' 1" }}
                >
                  blur_on
                </span>
                <p className="label-caps text-[var(--color-on-surface-variant)] text-xs">Visor 3D — próximamente</p>
              </div>
            </div>
          )}
        </div>

        {/* Columna derecha — información */}
        <div className="flex flex-col gap-6">
          {/* Header */}
          <div>
            <p className="label-caps text-[var(--color-on-surface-variant)] mb-1">
              {vehicle.year} · {vehicle.brand}
            </p>
            <h1 style={{ fontFamily: 'var(--font-headline)', fontSize: 36, fontWeight: 700, lineHeight: 1.2 }} className="mb-3">
              {vehicle.model}
            </h1>
            <p className="flex items-baseline gap-2">
              <span style={{ fontFamily: 'var(--font-display)', fontSize: 40, fontWeight: 700 }} className="text-[var(--color-on-surface)]">
                {formatPriceNumber(vehicle.price)}
              </span>
              <span className="label-caps text-[var(--color-on-surface-variant)] text-xs">CLP</span>
            </p>
          </div>

          {/* Ubicación */}
          <div className="flex items-center gap-2 text-[var(--color-on-surface-variant)]">
            <span className="material-symbols-outlined text-base">location_on</span>
            <span className="text-sm">{vehicle.location}</span>
          </div>

          {/* Botón CTA */}
          <button className="glow-primary w-full py-4 bg-[var(--color-primary-container)] text-[var(--color-on-primary-container)] label-caps font-bold rounded-lg hover:bg-[var(--color-primary)] active:scale-[0.98] transition-all text-base">
            CONTACTAR AL VENDEDOR
          </button>

          <button className="w-full py-3 border border-[var(--color-outline-variant)]/50 text-[var(--color-on-surface)] label-caps rounded-lg hover:bg-[var(--color-surface-container)] transition-all flex items-center justify-center gap-2">
            <span className="material-symbols-outlined text-base">favorite_border</span>
            GUARDAR EN FAVORITOS
          </button>

          {/* Especificaciones técnicas */}
          <div className="glass-card rounded-xl p-6">
            <h3 className="label-caps text-[var(--color-on-surface-variant)] mb-4">ESPECIFICACIONES</h3>
            <div className="grid grid-cols-2 gap-4">
              {vehicle.specs.map(({ label, value, icon }) => (
                <div key={label} className="flex items-start gap-3">
                  <span className="material-symbols-outlined text-[var(--color-primary)] text-base mt-0.5">{icon}</span>
                  <div>
                    <p className="label-caps text-[var(--color-on-surface-variant)] text-[10px]">{label}</p>
                    <p className="mono-spec text-[var(--color-on-surface)] text-sm">{value}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Descripción */}
          <div className="glass-card rounded-xl p-6">
            <h3 className="label-caps text-[var(--color-on-surface-variant)] mb-3">DESCRIPCIÓN</h3>
            <p className="text-[var(--color-on-surface-variant)] text-sm leading-relaxed">
              {vehicle.description}
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
