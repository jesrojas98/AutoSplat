import { Link } from 'react-router-dom'

export function NotFound() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] px-[var(--spacing-gutter)] text-center">
      <p className="label-caps text-[var(--color-primary)] mb-4">ERROR 404</p>
      <h1
        style={{ fontFamily: 'var(--font-display)', fontSize: 64, fontWeight: 700, lineHeight: 1.1 }}
        className="mb-6"
      >
        Página no encontrada.
      </h1>
      <p className="text-[var(--color-on-surface-variant)] mb-8 max-w-md">
        La página que buscas no existe o fue movida.
      </p>
      <Link
        to="/"
        className="glow-primary px-8 py-3 bg-[var(--color-primary-container)] text-[var(--color-on-primary-container)] label-caps font-bold rounded-lg hover:bg-[var(--color-primary)] transition-all"
      >
        VOLVER AL INICIO
      </Link>
    </div>
  )
}
