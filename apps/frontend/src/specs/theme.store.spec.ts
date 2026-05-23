import { describe, it, expect, beforeEach, vi } from 'vitest'

// Zustand persist usa localStorage — lo mockeamos antes de importar el store
const localStorageMock = (() => {
  let store: Record<string, string> = {}
  return {
    getItem: (key: string) => store[key] ?? null,
    setItem: (key: string, value: string) => { store[key] = value },
    removeItem: (key: string) => { delete store[key] },
    clear: () => { store = {} },
  }
})()
Object.defineProperty(globalThis, 'localStorage', { value: localStorageMock })

// Importar dinámicamente para cada test con un store fresco
async function freshStore() {
  vi.resetModules()
  const mod = await import('../store/theme.store')
  return mod.useThemeStore
}

describe('useThemeStore', () => {
  beforeEach(() => {
    localStorageMock.clear()
    document.documentElement.className = ''
  })

  // ── estado inicial ─────────────────────────────────────────────────────

  it('tema inicial es dark', async () => {
    const useStore = await freshStore()
    expect(useStore.getState().theme).toBe('dark')
  })

  // ── toggle ─────────────────────────────────────────────────────────────

  it('toggle cambia de dark a light', async () => {
    const useStore = await freshStore()
    useStore.getState().toggle()
    expect(useStore.getState().theme).toBe('light')
  })

  it('toggle cambia de light a dark', async () => {
    const useStore = await freshStore()
    useStore.getState().toggle() // dark → light
    useStore.getState().toggle() // light → dark
    expect(useStore.getState().theme).toBe('dark')
  })

  it('toggle agrega clase "light" al html cuando cambia a light', async () => {
    const useStore = await freshStore()
    useStore.getState().toggle()
    expect(document.documentElement.classList.contains('light')).toBe(true)
  })

  it('toggle remueve clase "light" del html cuando vuelve a dark', async () => {
    const useStore = await freshStore()
    useStore.getState().toggle() // dark → light
    useStore.getState().toggle() // light → dark
    expect(document.documentElement.classList.contains('light')).toBe(false)
  })

  it('toggle agrega clase "dark" al html cuando vuelve a dark', async () => {
    const useStore = await freshStore()
    useStore.getState().toggle() // dark → light
    useStore.getState().toggle() // light → dark
    expect(document.documentElement.classList.contains('dark')).toBe(true)
  })

  // ── apply ──────────────────────────────────────────────────────────────

  it('apply aplica el tema actual al document', async () => {
    const useStore = await freshStore()
    useStore.setState({ theme: 'light' })
    useStore.getState().apply()
    expect(document.documentElement.classList.contains('light')).toBe(true)
  })

  it('apply en tema dark agrega clase dark', async () => {
    const useStore = await freshStore()
    // tema es dark por defecto
    useStore.getState().apply()
    expect(document.documentElement.classList.contains('dark')).toBe(true)
  })

  // ── persistencia ───────────────────────────────────────────────────────

  it('persiste el tema en localStorage', async () => {
    const useStore = await freshStore()
    useStore.getState().toggle() // dark → light
    const stored = JSON.parse(localStorageMock.getItem('autosplat-theme') ?? '{}')
    expect(stored.state?.theme).toBe('light')
  })
})
