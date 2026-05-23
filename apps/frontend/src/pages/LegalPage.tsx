import { Link } from 'react-router-dom'

type LegalPageProps = {
  type: 'privacy' | 'terms'
}

const CONTENT = {
  privacy: {
    eyebrow: 'POLÍTICA DE PRIVACIDAD',
    title: 'Privacidad',
    intro: 'Explicamos cómo AutoSplat maneja la información necesaria para publicar, vender y contactar por vehículos.',
    sections: [
      {
        title: 'Información que usamos',
        body: 'Podemos usar datos de cuenta, contacto, publicaciones, fotografías, mensajes, favoritos y actividad básica dentro de la plataforma para operar el servicio.',
      },
      {
        title: 'Uso de la información',
        body: 'Usamos estos datos para autenticar usuarios, mostrar avisos, procesar publicaciones, habilitar contacto entre interesados y mejorar la seguridad de la plataforma.',
      },
      {
        title: 'Contenido de vehículos',
        body: 'Las imágenes, descripciones y datos del vehículo que publiques podrán mostrarse públicamente en el catálogo mientras el aviso esté activo.',
      },
      {
        title: 'Conservación y seguridad',
        body: 'Mantenemos medidas razonables para proteger la información y conservamos datos mientras sean necesarios para prestar el servicio o cumplir obligaciones aplicables.',
      },
    ],
  },
  terms: {
    eyebrow: 'TÉRMINOS DE SERVICIO',
    title: 'Términos y condiciones',
    intro: 'Estas reglas ayudan a que AutoSplat funcione como un espacio claro y confiable para compradores y vendedores.',
    sections: [
      {
        title: 'Uso de la plataforma',
        body: 'Debes entregar información veraz sobre tu cuenta, tus publicaciones y el estado de los vehículos que ofreces.',
      },
      {
        title: 'Publicaciones',
        body: 'AutoSplat puede revisar, ocultar o eliminar avisos con información falsa, imágenes inadecuadas, contenido duplicado o señales de fraude.',
      },
      {
        title: 'Relación entre usuarios',
        body: 'La negociación, inspección, pago, transferencia y entrega del vehículo son responsabilidad de comprador y vendedor.',
      },
      {
        title: 'Disponibilidad',
        body: 'Trabajamos para mantener el servicio disponible, pero pueden existir mantenciones, errores o interrupciones temporales.',
      },
    ],
  },
} satisfies Record<LegalPageProps['type'], {
  eyebrow: string
  title: string
  intro: string
  sections: { title: string; body: string }[]
}>

export function LegalPage({ type }: LegalPageProps) {
  const content = CONTENT[type]

  return (
    <div className="px-[var(--spacing-gutter)] py-12 max-w-3xl mx-auto">
      <p className="label-caps text-[var(--color-primary)] mb-3">{content.eyebrow}</p>
      <h1 style={{ fontFamily: 'var(--font-headline)', fontSize: 36, fontWeight: 700 }} className="mb-4">
        {content.title}
      </h1>
      <p className="text-[var(--color-on-surface-variant)] text-base leading-relaxed mb-8">
        {content.intro}
      </p>

      <div className="flex flex-col gap-5">
        {content.sections.map((section) => (
          <section key={section.title} className="border-b border-[var(--color-outline-variant)]/20 pb-5 last:border-0">
            <h2 style={{ fontFamily: 'var(--font-headline)', fontSize: 18, fontWeight: 600 }} className="mb-2">
              {section.title}
            </h2>
            <p className="text-[var(--color-on-surface-variant)] text-sm leading-relaxed">
              {section.body}
            </p>
          </section>
        ))}
      </div>

      <div className="mt-10">
        <Link
          to="/support"
          className="label-caps text-[var(--color-primary)] hover:text-[var(--color-on-surface)] transition-colors text-xs"
        >
          CONTACTAR SOPORTE
        </Link>
      </div>
    </div>
  )
}
