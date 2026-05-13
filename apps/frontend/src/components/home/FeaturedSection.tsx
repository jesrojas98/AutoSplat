import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { VehicleCard } from '@/components/vehicles/VehicleCard'
import { vehiclesService, type Vehicle } from '@/services/vehicles.service'

export function FeaturedSection() {
  const [vehicles, setVehicles] = useState<Vehicle[]>([])

  useEffect(() => {
    vehiclesService.getAll({ limit: 4 }).then((res) => setVehicles(res.data))
  }, [])

  return (
    <section className="py-24 bg-[var(--color-surface-container-low)] px-[var(--spacing-gutter)]">
      <div className="max-w-[var(--spacing-max-width)] mx-auto">
        <div className="flex justify-between items-end mb-12">
          <div>
            <h2 className="mb-2" style={{ fontFamily: 'var(--font-headline)', fontSize: 40, fontWeight: 700 }}>
              Escaneos Destacados
            </h2>
            <p className="text-[var(--color-on-surface-variant)] text-base">
              Capturas de alta fidelidad disponibles para inspección virtual inmediata.
            </p>
          </div>
          <Link to="/catalog" className="label-caps text-[var(--color-primary)] flex items-center gap-2 hover:gap-4 transition-all">
            VER CATÁLOGO COMPLETO
            <span className="material-symbols-outlined">arrow_forward</span>
          </Link>
        </div>

        {vehicles.length === 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="glass-card rounded-xl overflow-hidden animate-pulse">
                <div className="aspect-[4/3] bg-[var(--color-surface-container-high)]" />
                <div className="p-6 flex flex-col gap-3">
                  <div className="h-3 bg-[var(--color-surface-container-high)] rounded w-1/2" />
                  <div className="h-5 bg-[var(--color-surface-container-high)] rounded w-3/4" />
                  <div className="h-6 bg-[var(--color-surface-container-high)] rounded w-1/3" />
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {vehicles.map((vehicle) => (
              <VehicleCard key={vehicle.id} vehicle={vehicle} />
            ))}
          </div>
        )}
      </div>
    </section>
  )
}
