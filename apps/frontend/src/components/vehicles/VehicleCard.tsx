import { Link } from 'react-router-dom'
import { formatPriceNumber, formatMileage } from '@/utils/formatters'

interface Vehicle {
  id: string
  brand: string
  model: string
  year: number
  price: number
  mileage: number
  transmission: string
  fuelType: string
  location: string
  has3dModel: boolean
  imageUrl: string
}

const FUEL_ICON: Record<string, string> = {
  gasoline: 'oil_barrel',
  diesel: 'oil_barrel',
  electric: 'bolt',
  hybrid: 'bolt',
}

const TRANSMISSION_LABEL: Record<string, string> = {
  manual: 'Manual',
  automatic: 'Automático',
  cvt: 'CVT',
  PDK: 'PDK',
}

const FUEL_LABEL: Record<string, string> = {
  gasoline: 'Bencina',
  diesel: 'Diésel',
  electric: 'Eléctrico',
  hybrid: 'Híbrido',
}


export function VehicleCard({ vehicle }: { vehicle: Vehicle }) {
  return (
    <Link to={`/vehicles/${vehicle.id}`} className="group block">
      <div className="glass-card rounded-xl overflow-hidden h-full flex flex-col transition-all duration-300 hover:border-[var(--color-primary)]/50">
        {/* Imagen */}
        <div className="aspect-[4/3] relative overflow-hidden">
          <img
            src={vehicle.imageUrl}
            alt={`${vehicle.brand} ${vehicle.model}`}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          />
          {vehicle.has3dModel && (
            <span className="absolute top-4 left-4 bg-[var(--color-primary-container)] text-[var(--color-on-primary-container)] px-2 py-1 rounded label-caps text-[10px] font-bold">
              VISTA 3D
            </span>
          )}
        </div>

        {/* Contenido */}
        <div className="p-6 flex flex-col flex-1">
          <p className="label-caps text-[var(--color-on-surface-variant)] mb-1">
            {vehicle.year} · {vehicle.brand}
          </p>
          <h3
            className="text-xl mb-1"
            style={{ fontFamily: 'var(--font-headline)', fontWeight: 600 }}
          >
            {vehicle.model}
          </h3>

          <p className="mb-4 flex items-baseline gap-1.5">
            <span
              className="text-2xl font-bold text-[var(--color-on-surface)]"
              style={{ fontFamily: 'var(--font-display)' }}
            >
              {formatPriceNumber(vehicle.price)}
            </span>
            <span className="label-caps text-[var(--color-on-surface-variant)] text-[10px]">CLP</span>
          </p>

          {/* Especificaciones */}
          <div className="flex flex-wrap gap-4 mb-6 text-[var(--color-on-surface-variant)]">
            <span className="flex items-center gap-1">
              <span className="material-symbols-outlined text-base">speed</span>
              <span className="mono-spec text-xs">{formatMileage(vehicle.mileage)}</span>
            </span>
            <span className="flex items-center gap-1">
              <span className="material-symbols-outlined text-base">settings</span>
              <span className="mono-spec text-xs">
                {TRANSMISSION_LABEL[vehicle.transmission] ?? vehicle.transmission}
              </span>
            </span>
            <span className="flex items-center gap-1">
              <span className="material-symbols-outlined text-base">
                {FUEL_ICON[vehicle.fuelType] ?? 'local_gas_station'}
              </span>
              <span className="mono-spec text-xs">
                {FUEL_LABEL[vehicle.fuelType] ?? vehicle.fuelType}
              </span>
            </span>
          </div>

          {/* Botón */}
          <button className="mt-auto w-full py-3 bg-[var(--color-surface-container-highest)] border border-[var(--color-outline-variant)]/30 text-[var(--color-on-surface)] rounded-lg label-caps hover:bg-[var(--color-primary-container)] hover:text-[var(--color-on-primary-container)] transition-all flex items-center justify-center gap-2">
            <span className="material-symbols-outlined text-sm">
              {vehicle.has3dModel ? 'view_in_ar' : 'visibility'}
            </span>
            {vehicle.has3dModel ? 'VER FICHA Y MODELO 3D' : 'VER DETALLES'}
          </button>
        </div>
      </div>
    </Link>
  )
}
