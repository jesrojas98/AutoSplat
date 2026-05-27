import '@google/model-viewer'

export function NextGenSection() {
  return (
    <section className="py-24 px-[var(--spacing-gutter)] max-w-[var(--spacing-max-width)] mx-auto">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-16 items-center">

        {/* Texto + features */}
        <div>
          <span className="label-caps text-[var(--color-primary)] mb-4 block tracking-widest">
            VISUALIZACIÓN DE NUEVA GENERACIÓN
          </span>
          <h2
            className="mb-6 leading-tight"
            style={{ fontFamily: 'var(--font-headline)', fontSize: 'clamp(28px, 3.5vw, 40px)', fontWeight: 700 }}
          >
            No solo veas fotos.<br />
            <span className="text-[var(--color-outline)]">Explóralo en 3D.</span>
          </h2>
          <p
            className="text-[var(--color-on-surface-variant)] mb-10"
            style={{ fontSize: 18, lineHeight: 1.6 }}
          >
            Nuestro motor convierte imágenes 2D en entornos 3D inmersivos.
            Experimenta cada curva, hueco de panel y detalle interior con un realismo
            fotográfico que los modelos CAD tradicionales no pueden igualar.
          </p>

          <div className="flex flex-col gap-7">
            {[
              {
                icon: 'view_in_ar',
                title: 'Reflejos fieles a la realidad',
                desc: 'La iluminación real capturada durante el escaneo se reproduce exactamente tal como fue en el momento.',
              },
              {
                icon: 'zoom_in',
                title: 'Detalle infinito',
                desc: 'Haz zoom en el tejido de la fibra de carbono o en la textura de las costuras de cuero.',
              },
              {
                icon: 'rotate_3d',
                title: 'Vista de 360°',
                desc: 'Rota el modelo libremente desde cualquier ángulo, igual que tener el auto frente a ti.',
              },
            ].map(({ icon, title, desc }) => (
              <div key={icon} className="flex gap-4">
                <div className="bg-[var(--color-primary)]/10 p-3 rounded-xl h-fit shrink-0">
                  <span className="material-symbols-outlined text-[var(--color-primary)]">{icon}</span>
                </div>
                <div>
                  <h4
                    className="mb-1"
                    style={{ fontFamily: 'var(--font-headline)', fontWeight: 600, fontSize: 16 }}
                  >
                    {title}
                  </h4>
                  <p className="text-[var(--color-on-surface-variant)] text-sm leading-relaxed">{desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Visor 3D */}
        <div className="flex flex-col gap-3">
          <div
            className="relative rounded-2xl overflow-hidden glass-card"
            style={{
              aspectRatio: '1 / 1',
              border: '1px solid rgba(180,197,255,0.12)',
              boxShadow: '0 0 60px rgba(37,99,235,0.1)',
            }}
          >
            <model-viewer
              src="/models/engine.glb"
              alt="Motor V8 Chevrolet Corvette"
              auto-rotate
              camera-controls
              shadow-intensity="3"
              exposure="0.45"
              environment-image="legacy"
              rotation-per-second="18deg"
              style={{
                width: '100%',
                height: '100%',
                backgroundColor: 'transparent',
                '--poster-color': 'transparent',
                filter: 'brightness(0.60) contrast(1.4) saturate(0.6) grayscale(0.3)',
              } as React.CSSProperties}
            >
              {/* Slot de carga mientras no hay modelo */}
              <div slot="poster" className="w-full h-full flex flex-col items-center justify-center gap-4">
                <span
                  className="material-symbols-outlined text-[var(--color-primary)] animate-spin"
                  style={{ fontSize: 48 }}
                >
                  progress_activity
                </span>
                <p className="label-caps text-[var(--color-on-surface-variant)] text-xs">
                  CARGANDO MODELO 3D…
                </p>
              </div>
            </model-viewer>

            {/* Badge */}
            <div
              className="absolute bottom-4 left-4 flex items-center gap-2 glass-card px-3 py-2 rounded-xl pointer-events-none"
              style={{ border: '1px solid rgba(180,197,255,0.2)' }}
            >
              <span
                className="material-symbols-outlined text-[var(--color-primary)]"
                style={{ fontSize: 16, fontVariationSettings: "'FILL' 1" }}
              >
                blur_on
              </span>
              <span className="label-caps text-[var(--color-primary)]" style={{ fontSize: 10, letterSpacing: '0.1em' }}>
                MODELO 3D INTERACTIVO
              </span>
            </div>
          </div>

          <p className="text-center label-caps text-[var(--color-on-surface-variant)] text-[10px] tracking-widest">
            CHEVROLET CORVETTE V8 · ARRASTRA PARA ROTAR · SCROLL PARA ZOOM
          </p>
        </div>

      </div>
    </section>
  )
}
