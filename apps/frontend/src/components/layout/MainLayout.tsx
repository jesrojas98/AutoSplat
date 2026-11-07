import { Suspense } from 'react'
import { Outlet } from 'react-router-dom'
import { Navbar } from './Navbar'
import { Footer } from './Footer'

export function MainLayout() {
  return (
    <div className="flex flex-col min-h-screen">
      <Navbar />
      <main className="flex-1">
        {/* Las páginas se cargan bajo demanda: el navbar y el footer quedan mientras llega el código */}
        <Suspense fallback={<PageSpinner />}>
          <Outlet />
        </Suspense>
      </main>
      <Footer />
    </div>
  )
}

export function PageSpinner() {
  return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <span className="material-symbols-outlined text-[var(--color-primary)] animate-spin" style={{ fontSize: 40 }}>
        progress_activity
      </span>
    </div>
  )
}
