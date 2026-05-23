import { Link } from 'react-router-dom'

export function Support() {
  return (
    <div className="px-[var(--spacing-gutter)] py-12 max-w-3xl mx-auto">
      <p className="label-caps text-[var(--color-primary)] mb-3">SOPORTE</p>
      <h1 style={{ fontFamily: 'var(--font-headline)', fontSize: 36, fontWeight: 700 }} className="mb-4">
        ¿Necesitas ayuda?
      </h1>
      <p className="text-[var(--color-on-surface-variant)] text-base leading-relaxed mb-8">
        Cuéntanos qué ocurrió y revisaremos tu caso. Incluye tu correo, el enlace del aviso si aplica y una descripción clara del problema.
      </p>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8">
        <div className="border border-[var(--color-outline-variant)]/30 rounded-xl p-5 bg-[var(--color-surface-container)]">
          <span className="material-symbols-outlined text-[var(--color-primary)] mb-3">mail</span>
          <p className="label-caps text-[10px] text-[var(--color-on-surface-variant)] mb-1">CORREO</p>
          <a href="mailto:soporte@autosplat.cl" className="text-[var(--color-on-surface)] hover:text-[var(--color-primary)] transition-colors">
            soporte@autosplat.cl
          </a>
        </div>

        <div className="border border-[var(--color-outline-variant)]/30 rounded-xl p-5 bg-[var(--color-surface-container)]">
          <span className="material-symbols-outlined text-[var(--color-primary)] mb-3">schedule</span>
          <p className="label-caps text-[10px] text-[var(--color-on-surface-variant)] mb-1">HORARIO</p>
          <p className="text-[var(--color-on-surface)]">Lunes a viernes, 09:00 a 18:00</p>
        </div>
      </div>

      <Link
        to="/catalog"
        className="glow-primary inline-flex items-center gap-2 px-6 py-3 bg-[var(--color-primary-container)] text-[var(--color-on-primary-container)] label-caps font-bold rounded-lg hover:bg-[var(--color-primary)] transition-all"
      >
        VER CATÁLOGO
        <span className="material-symbols-outlined text-base">arrow_forward</span>
      </Link>
    </div>
  )
}
