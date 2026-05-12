import { Link } from 'react-router-dom'
import { formatPriceNumber, formatMileage } from '@/utils/formatters'
import type { Vehicle } from '@/services/vehicles.service'

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
}

const FUEL_LABEL: Record<string, string> = {
  gasoline: 'Bencina',
  diesel: 'Diésel',
  electric: 'Eléctrico',
  hybrid: 'Híbrido',
}

function getThumbnail(vehicle: Vehicle): string {
  const thumb = vehicle.vehicle_images?.find((i) => i.image_type === 'thumbnail')
  const first = vehicle.vehicle_images?.[0]
  return thumb?.image_url ?? first?.image_url ?? 'https://images.unsplash.com/photo-1503736334956-4c8f8e4dc1d4?w=800&q=80'
}

export function VehicleCard({ vehicle }: { vehicle: Vehicle }) {
  const imageUrl = getThumbnail(vehicle)

  return (
    <Link to={`/vehicles/${vehicle.id}`} className="group block">
      <div className="glass-card rounded-xl overflow-hidden h-full flex flex-col transition-all duration-300 hover:border-[var(--color-primary)]/50">
        <div className="aspect-[4/3] relative overflow-hidden">
          <img
            src={imageUrl}
            alt={`${vehicle.brand} ${vehicle.model}`}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          />
          {vehicle.has_3d_model && (
            <span className="absolute top-4 left-4 bg-[var(--color-primary-container)] text-[var(--color-on-primary-container)] px-2 py-1 rounded label-caps text-[10px] font-bold">
              VISTA 3D
            </span>
          )}
        </div>

        <div className="p-6 flex flex-col flex-1">
          <p className="label-caps text-[var(--color-on-surface-variant)] mb-1">
            {vehicle.year} · {vehicle.brand}
          </p>
          <h3 className="text-xl mb-1" style={{ fontFamily: 'var(--font-headline)', fontWeight: 600 }}>
            {vehicle.model}
          </h3>

          <p className="mb-4 flex items-baseline gap-1.5">
            <span className="text-2xl font-bold text-[var(--color-on-surface)]" style={{ fontFamily: 'var(--font-display)' }}>
              {formatPriceNumber(vehicle.price)}
            </span>
            <span className="label-caps text-[var(--color-on-surface-variant)] text-[10px]">CLP</span>
          </p>

          <div className="flex flex-wrap gap-4 mb-6 text-[var(--color-on-surface-variant)]">
            <span className="flex items-center gap-1">
              <span className="material-symbols-outlined text-base">speed</span>
              <span className="mono-spec text-xs">{formatMileage(vehicle.mileage)}</span>
            </span>
            {vehicle.transmission && (
              <span className="flex items-center gap-1">
                <span className="material-symbols-outlined text-base">settings</span>
                <span className="mono-spec text-xs">{TRANSMISSION_LABEL[vehicle.transmission] ?? vehicle.transmission}</span>
              </span>
            )}
            {vehicle.fuel_type && (
              <span className="flex items-center gap-1">
                <span className="material-symbols-outlined text-base">{FUEL_ICON[vehicle.fuel_type] ?? 'local_gas_station'}</span>
                <span className="mono-spec text-xs">{FUEL_LABEL[vehicle.fuel_type] ?? vehicle.fuel_type}</span>
              </span>
            )}
          </div>

          <button className="mt-auto w-full py-3 bg-[var(--color-surface-container-highest)] border border-[var(--color-outline-variant)]/30 text-[var(--color-on-surface)] rounded-lg label-caps hover:bg-[var(--color-primary-container)] hover:text-[var(--color-on-primary-container)] transition-all flex items-center justify-center gap-2">
            <span className="material-symbols-outlined text-sm">{vehicle.has_3d_model ? 'view_in_ar' : 'visibility'}</span>
            {vehicle.has_3d_model ? 'VER FICHA Y MODELO 3D' : 'VER DETALLES'}
          </button>
        </div>
      </div>
    </Link>
  )
}
