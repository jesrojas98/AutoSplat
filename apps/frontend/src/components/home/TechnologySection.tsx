export function TechnologySection() {
  return (
    <section className="py-32 px-[var(--spacing-gutter)] overflow-hidden relative">
      <div className="absolute inset-0 bg-[var(--color-surface-container-lowest)] -z-10" />

      <div className="max-w-[var(--spacing-max-width)] mx-auto flex flex-col items-center text-center">
        <span className="label-caps text-[var(--color-primary)] mb-4 tracking-widest">
          LA TECNOLOGÍA
        </span>
        <h2
          className="mb-16"
          style={{ fontFamily: 'var(--font-headline)', fontSize: 40, fontWeight: 700 }}
        >
          De 40 fotos a precisión milimétrica.
        </h2>

        <div className="w-full grid grid-cols-1 lg:grid-cols-3 gap-8 items-center">
          {/* Paso 1 */}
          <div className="glass-card flex flex-col items-center p-8 rounded-2xl border-dashed border-[var(--color-outline-variant)]/50">
            <div className="mb-6 grid grid-cols-3 gap-2 opacity-50">
              {Array.from({ length: 9 }).map((_, i) => (
                <div
                  key={i}
                  className="w-12 h-12 bg-[var(--color-surface-container-highest)] rounded-sm border border-[var(--color-outline-variant)]/30"
                />
              ))}
            </div>
            <h4
              className="text-lg mb-2"
              style={{ fontFamily: 'var(--font-headline)', fontWeight: 600 }}
            >
              Captura Multi-Ángulo
            </h4>
            <p className="text-[var(--color-on-surface-variant)] text-sm">
              Nuestro motor procesa entre 40 y 80 imágenes de alta resolución desde todos los ángulos posibles.
            </p>
          </div>

          {/* Flecha */}
          <div className="hidden lg:flex justify-center text-[var(--color-primary)]">
            <span className="material-symbols-outlined" style={{ fontSize: 48 }}>
              trending_flat
            </span>
          </div>

          {/* Paso 2 */}
          <div
            className="glass-card flex flex-col items-center p-8 rounded-2xl"
            style={{ border: '2px solid rgba(180,197,255,0.3)' }}
          >
            <div className="mb-6 h-24 w-24 relative flex items-center justify-center">
              <div
                className="absolute inset-0 rounded-full animate-pulse"
                style={{ background: 'rgba(180,197,255,0.15)' }}
              />
              <span
                className="material-symbols-outlined text-[var(--color-primary)]"
                style={{ fontSize: 48, fontVariationSettings: "'FILL' 1" }}
              >
                blur_on
              </span>
            </div>
            <h4
              className="text-lg mb-2 text-[var(--color-primary)]"
              style={{ fontFamily: 'var(--font-headline)', fontWeight: 600 }}
            >
              Gaussian Splatting
            </h4>
            <p className="text-[var(--color-on-surface-variant)] text-sm">
              Armónicos esféricos y nubes de puntos crean un volumen 3D fotorrealista
              que mantiene nitidez desde cualquier ángulo.
            </p>
          </div>
        </div>
      </div>
    </section>
  )
}
