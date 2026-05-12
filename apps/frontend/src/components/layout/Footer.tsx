const footerLinks = [
  'Política de Privacidad',
  'Términos de Servicio',
  'Documentación API',
  'Soporte',
]

export function Footer() {
  return (
    <footer className="bg-[var(--color-surface-container-lowest)] border-t border-[var(--color-outline-variant)]/20">
      <div className="flex flex-col md:flex-row justify-between items-center py-12 px-[var(--spacing-gutter)] max-w-[var(--spacing-max-width)] mx-auto w-full gap-8">
        <div>
          <span
            className="text-2xl font-bold text-[var(--color-on-surface)]"
            style={{ fontFamily: 'var(--font-headline)' }}
          >
            AutoSplat
          </span>
          <p className="text-[var(--color-on-surface-variant)] text-sm mt-2 opacity-60">
            © 2024 AutoSplat Technologies. Compraventa de vehículos con tecnología 3D.
          </p>
        </div>

        <div className="flex flex-wrap justify-center gap-8">
          {footerLinks.map((link) => (
            <a
              key={link}
              href="#"
              className="label-caps text-[var(--color-on-surface-variant)] hover:text-[var(--color-primary)] transition-colors"
            >
              {link.toUpperCase()}
            </a>
          ))}
        </div>
      </div>
    </footer>
  )
}
