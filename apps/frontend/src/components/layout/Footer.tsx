import { Link } from 'react-router-dom'

const footerLinks = [
  { label: 'Política de Privacidad', to: '/privacy' },
  { label: 'Términos de Servicio', to: '/terms' },
  { label: 'Soporte', to: '/support' },
]

export function Footer() {
  return (
    <footer className="bg-[var(--color-surface-container-lowest)] border-t border-[var(--color-outline-variant)]/20">
      <div className="flex flex-col md:flex-row justify-between items-center py-10 sm:py-12 px-[var(--spacing-gutter)] max-w-[var(--spacing-max-width)] mx-auto w-full gap-6 sm:gap-8 text-center md:text-left">
        <div className="flex flex-col items-center md:items-start">
          <Link
            to="/"
            className="relative inline-flex items-center h-12 w-[260px]"
            aria-label="AutoSplat"
          >
            <img
              src="/brand/autosplat-logo-dark-transparent.png"
              alt="AutoSplat"
              className="brand-logo-dark h-full w-full"
            />
            <img
              src="/brand/autosplat-logo-light-transparent.png"
              alt="AutoSplat"
              className="brand-logo-light h-full w-full"
            />
          </Link>
          <p className="text-[var(--color-on-surface-variant)] text-sm mt-2 opacity-60">
            © 2024 AutoSplat Technologies. Compraventa de vehículos con tecnología 3D.
          </p>
        </div>

        <div className="flex flex-wrap justify-center gap-x-6 gap-y-3 sm:gap-x-8">
          {footerLinks.map((link) => (
            <Link
              key={link.to}
              to={link.to}
              className="label-caps text-[var(--color-on-surface-variant)] hover:text-[var(--color-primary)] transition-colors"
            >
              {link.label.toUpperCase()}
            </Link>
          ))}
        </div>
      </div>
    </footer>
  )
}
