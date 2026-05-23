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

        {/* Visual circular */}
        <div className="relative glass-card aspect-square rounded-full overflow-hidden p-8 flex items-center justify-center"
          style={{ border: '2px solid rgba(180,197,255,0.15)' }}
        >
          {/* Imagen (grayscale → color on hover) */}
          <div className="absolute inset-0 overflow-hidden rounded-full">
            <img
              src="https://lh3.googleusercontent.com/aida-public/AB6AXuC-UiOYVfYsxa_U5h579FqtHbYi883SBS29N97_zlRHywkiGkcltvbxzp7e3c1qFajYANIjEeCRQIUKDGw9OG-ju34jsezqbcIBc5hpi3rg4NZKCNfRC6bVU1oVpGXk7VSo7KWRzNJtSQcZzkANXlN4_LvZr4dKpnbhHWkYdUbw8_-a9hwV1aWO7PFDdXYcqr4z6PkTwZj1ZIy4efMG7NSD1QJWT3Cqv9nJAmY4o7hcZD34cj3_oLsmMujPf4yOovzSd_PqJUL4P0Q"
              alt="Motor de alto rendimiento con overlays holográficos"
              className="w-full h-full object-cover grayscale hover:grayscale-0 transition-all duration-700 scale-110"
            />
          </div>

          {/* Gradient overlay */}
          <div
            className="absolute inset-0 rounded-full pointer-events-none"
            style={{
              background: 'linear-gradient(135deg, rgba(37,99,235,0.35) 0%, transparent 60%)',
            }}
          />

          {/* Badge central */}
          <div
            className="relative z-10 flex flex-col items-center justify-center glass-card rounded-2xl px-6 py-4 text-center"
            style={{ border: '1px solid rgba(180,197,255,0.25)' }}
          >
            <span
              className="material-symbols-outlined text-[var(--color-primary)] mb-1"
              style={{ fontSize: 36, fontVariationSettings: "'FILL' 1" }}
            >
              blur_on
            </span>
            <p
              className="text-[var(--color-primary)] label-caps"
              style={{ fontSize: 11, letterSpacing: '0.12em' }}
            >
              GAUSSIAN SPLATTING
            </p>
          </div>

          {/* Anillo decorativo pulsante */}
          <div
            className="absolute inset-4 rounded-full border border-[var(--color-primary)]/15 animate-pulse pointer-events-none"
            style={{ animationDuration: '3s' }}
          />
          <div
            className="absolute inset-10 rounded-full border border-[var(--color-primary)]/10 animate-pulse pointer-events-none"
            style={{ animationDuration: '4s', animationDelay: '1s' }}
          />
        </div>

      </div>
    </section>
  )
}
