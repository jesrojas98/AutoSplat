import { useEffect } from 'react'
import { BrowserRouter } from 'react-router-dom'
import { AppRouter } from '@/router'
import { useThemeStore } from '@/store/theme.store'

export default function App() {
  const apply = useThemeStore((s) => s.apply)

  useEffect(() => {
    apply()
  }, [apply])

  return (
    <BrowserRouter>
      <AppRouter />
    </BrowserRouter>
  )
}
