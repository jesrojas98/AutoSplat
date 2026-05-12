export function formatPriceNumber(price: number): string {
  return new Intl.NumberFormat('es-CL', {
    maximumFractionDigits: 0,
  }).format(price)
}

export function formatMileage(km: number): string {
  if (km === 0) return '0 km'
  return km >= 1000 ? `${(km / 1000).toFixed(0)}k km` : `${km} km`
}
