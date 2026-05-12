import { HeroSection } from '@/components/home/HeroSection'
import { FeaturedSection } from '@/components/home/FeaturedSection'
import { TechnologySection } from '@/components/home/TechnologySection'
import { CtaSection } from '@/components/home/CtaSection'

export function Home() {
  return (
    <>
      <HeroSection />
      <FeaturedSection />
      <TechnologySection />
      <CtaSection />
    </>
  )
}
