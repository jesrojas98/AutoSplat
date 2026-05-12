import { Link } from 'react-router-dom'

export function CtaSection() {
  return (
    <section className="py-24 px-[var(--spacing-gutter)] max-w-4xl mx-auto">
      <div className="glass-card p-12 rounded-3xl relative overflow-hidden" style={{ borderColor: 'rgba(180,197,255,0.2)' }}>
        {/* Blob de glow */}
        <div
          className="absolute top-0 right-0 w-64 h-64 -mr-32 -mt-32 blur-3xl rounded-full pointer-events-none"
          style={{ background: 'rgba(180,197,255,0.05)' }}
        />

        <h2
          className="mb-6 text-center"
          style={{ fontFamily: 'var(--font-headline)', fontSize: 40, fontWeight: 700 }}
        >
          ¿Listo para digitalizar tu inventario?
        </h2>
        <p className="text-[var(--color-on-surface-variant)] text-center mb-8" style={{ fontSize: 18 }}>
          Únete a los vendedores que usan AutoSplat para cerrar tratos más rápido con showrooms virtuales.
        </p>

        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link
            to="/register"
            className="glow-primary px-10 py-4 bg-[var(--color-primary)] text-[var(--color-on-primary)] label-caps font-bold rounded-lg hover:scale-105 transition-all text-center"
          >
            COMENZAR GRATIS
          </Link>
          <Link
            to="/catalog"
            className="px-10 py-4 border border-[var(--color-outline-variant)]/50 text-[var(--color-on-surface)] label-caps font-bold rounded-lg hover:bg-[var(--color-surface-container)] transition-all text-center"
          >
            VER CATÁLOGO
          </Link>
        </div>
      </div>
    </section>
  )
}
