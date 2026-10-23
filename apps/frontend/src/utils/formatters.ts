export function formatPriceNumber(price: number): string {
  return new Intl.NumberFormat('es-CL', {
    maximumFractionDigits: 0,
  }).format(price)
}

export function formatMileage(km: number): string {
  if (km === 0) return '0 km'
  return km >= 1000 ? `${(km / 1000).toFixed(0)}k km` : `${km} km`
}

/** Deja solo los dígitos de lo que escribe el usuario (valor que se guarda en el form). */
export function parseDigits(input: string): string {
  return input.replace(/\D/g, '').replace(/^0+(?=\d)/, '')
}

/** "1234567" → "1.234.567" para mostrar en campos numéricos (separador de miles es-CL). */
export function formatDigits(raw: string): string {
  return raw.replace(/\B(?=(\d{3})+(?!\d))/g, '.')
}
