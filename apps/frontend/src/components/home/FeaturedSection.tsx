import { Link } from 'react-router-dom'
import { VehicleCard } from '@/components/vehicles/VehicleCard'

const FEATURED = [
  {
    id: '1',
    brand: 'PORSCHE',
    model: '911 GT3',
    year: 2023,
    price: 224900,
    mileage: 4000,
    transmission: 'PDK',
    fuelType: 'gasoline',
    location: 'Santiago',
    has3dModel: true,
    imageUrl: 'https://images.unsplash.com/photo-1503736334956-4c8f8e4dc1d4?w=800&q=80',
  },
  {
    id: '2',
    brand: 'TESLA',
    model: 'Model S Plaid',
    year: 2024,
    price: 89900,
    mileage: 0,
    transmission: 'automatic',
    fuelType: 'electric',
    location: 'Valparaíso',
    has3dModel: true,
    imageUrl: 'https://images.unsplash.com/photo-1560958089-b8a1929cea89?w=800&q=80',
  },
  {
    id: '3',
    brand: 'BMW',
    model: 'M5 Competition',
    year: 2022,
    price: 108500,
    mileage: 12000,
    transmission: 'automatic',
    fuelType: 'gasoline',
    location: 'Concepción',
    has3dModel: true,
    imageUrl: 'https://images.unsplash.com/photo-1555215695-3004980ad54e?w=800&q=80',
  },
  {
    id: '4',
    brand: 'LUCID',
    model: 'Air Sapphire',
    year: 2024,
    price: 249000,
    mileage: 500,
    transmission: 'automatic',
    fuelType: 'electric',
    location: 'Viña del Mar',
    has3dModel: false,
    imageUrl: 'https://images.unsplash.com/photo-1494976388531-d1058494cdd8?w=800&q=80',
  },
]

export function FeaturedSection() {
  return (
    <section className="py-24 bg-[var(--color-surface-container-low)] px-[var(--spacing-gutter)]">
      <div className="max-w-[var(--spacing-max-width)] mx-auto">
        <div className="flex justify-between items-end mb-12">
          <div>
            <h2
              className="mb-2"
              style={{ fontFamily: 'var(--font-headline)', fontSize: 40, fontWeight: 700 }}
            >
              Featured Scans
            </h2>
            <p className="text-[var(--color-on-surface-variant)] text-base">
              Curated high-fidelity captures available for instant virtual inspection.
            </p>
          </div>
          <Link
            to="/catalog"
            className="label-caps text-[var(--color-primary)] flex items-center gap-2 hover:gap-4 transition-all"
          >
            VIEW ALL CATALOG
            <span className="material-symbols-outlined">arrow_forward</span>
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {FEATURED.map((vehicle) => (
            <VehicleCard key={vehicle.id} vehicle={vehicle} />
          ))}
        </div>
      </div>
    </section>
  )
}
