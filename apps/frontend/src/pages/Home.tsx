import { lazy, Suspense } from 'react'
import { HeroSection } from '@/components/home/HeroSection'
import { FeaturedSection } from '@/components/home/FeaturedSection'
import { TechnologySection } from '@/components/home/TechnologySection'
import { CtaSection } from '@/components/home/CtaSection'

// NextGenSection trae @google/model-viewer (y three): se descarga después de pintar el hero
const NextGenSection = lazy(() => import('@/components/home/NextGenSection').then((m) => ({ default: m.NextGenSection })))

export function Home() {
  return (
    <>
      <HeroSection />
      <Suspense fallback={<div className="min-h-[60vh]" />}>
        <NextGenSection />
      </Suspense>
      <FeaturedSection />
      <TechnologySection />
      <CtaSection />
    </>
  )
}
