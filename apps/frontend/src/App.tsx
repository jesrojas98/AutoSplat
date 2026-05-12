import { useEffect } from 'react'
import { BrowserRouter } from 'react-router-dom'
import { AppRouter } from '@/router'
import { useThemeStore } from '@/store/theme.store'
import { useAuthStore } from '@/store/auth.store'

export default function App() {
  const apply = useThemeStore((s) => s.apply)
  const fetchMe = useAuthStore((s) => s.fetchMe)

  useEffect(() => {
    apply()
    fetchMe()
  }, [apply, fetchMe])

  return (
    <BrowserRouter>
      <AppRouter />
    </BrowserRouter>
  )
}
