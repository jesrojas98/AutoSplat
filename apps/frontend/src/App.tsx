import { useEffect } from 'react'
import { BrowserRouter } from 'react-router-dom'
import { AppRouter } from '@/router'
import { useThemeStore } from '@/store/theme.store'
import { useAuthStore } from '@/store/auth.store'

export default function App() {
  const apply = useThemeStore((s) => s.apply)
  const init = useAuthStore((s) => s.init)

  useEffect(() => {
    apply()
    const unsub = init()
    return unsub
  }, [apply, init])

  return (
    <BrowserRouter>
      <AppRouter />
    </BrowserRouter>
  )
}
