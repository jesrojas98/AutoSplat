import { describe, it, expect, beforeEach, vi } from 'vitest'
import { getUserRole } from '../store/auth.store'
import type { User } from '@supabase/supabase-js'

// ── Mock del cliente Supabase ─────────────────────────────────────────────────

const mockSignInWithPassword = vi.fn()
const mockSignUp = vi.fn()
const mockSignOut = vi.fn()
const mockSignInWithOAuth = vi.fn()
const mockGetSession = vi.fn()
const mockOnAuthStateChange = vi.fn()
const mockFrom = vi.fn()

vi.mock('@/lib/supabase', () => ({
  supabase: {
    auth: {
      signInWithPassword: mockSignInWithPassword,
      signUp: mockSignUp,
      signOut: mockSignOut,
      signInWithOAuth: mockSignInWithOAuth,
      getSession: mockGetSession,
      onAuthStateChange: mockOnAuthStateChange,
    },
    from: mockFrom,
  },
}))

const mockUser: Partial<User> = {
  id: 'user-uuid-1',
  email: 'test@example.com',
  user_metadata: { name: 'Test User', role: 'buyer' },
}

const mockSession = { user: mockUser, access_token: 'mock-token' }

async function getStore() {
  vi.resetModules()
  const { useAuthStore } = await import('../store/auth.store')
  return useAuthStore
}

describe('useAuthStore', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockGetSession.mockResolvedValue({ data: { session: null } })
    mockOnAuthStateChange.mockReturnValue({ data: { subscription: { unsubscribe: vi.fn() } } })
    mockFrom.mockReturnValue({
      upsert: vi.fn().mockResolvedValue({ data: null, error: null }),
    })
  })

  // ── estado inicial ─────────────────────────────────────────────────────

  it('estado inicial: user null, session null, loading true', async () => {
    const useStore = await getStore()
    const state = useStore.getState()
    expect(state.user).toBeNull()
    expect(state.session).toBeNull()
    expect(state.loading).toBe(true)
  })

  // ── loginWithEmail ─────────────────────────────────────────────────────

  describe('loginWithEmail()', () => {
    it('setea user y session al hacer login exitoso', async () => {
      mockSignInWithPassword.mockResolvedValue({ data: { user: mockUser, session: mockSession }, error: null })

      const useStore = await getStore()
      await useStore.getState().loginWithEmail('test@example.com', 'password123')

      expect(useStore.getState().user).toEqual(mockUser)
      expect(useStore.getState().session).toEqual(mockSession)
    })

    it('lanza el error cuando Supabase devuelve error', async () => {
      const authError = new Error('Invalid login credentials')
      mockSignInWithPassword.mockResolvedValue({ data: { user: null, session: null }, error: authError })

      const useStore = await getStore()

      await expect(useStore.getState().loginWithEmail('x@x.com', 'wrong')).rejects.toThrow(
        'Invalid login credentials',
      )
    })

    it('llama signInWithPassword con email y password', async () => {
      mockSignInWithPassword.mockResolvedValue({ data: { user: mockUser, session: mockSession }, error: null })

      const useStore = await getStore()
      await useStore.getState().loginWithEmail('test@example.com', 'password123')

      expect(mockSignInWithPassword).toHaveBeenCalledWith({
        email: 'test@example.com',
        password: 'password123',
      })
    })
  })

  // ── registerWithEmail ──────────────────────────────────────────────────

  describe('registerWithEmail()', () => {
    it('registra el usuario y setea user y session', async () => {
      mockSignUp.mockResolvedValue({ data: { user: mockUser, session: mockSession }, error: null })

      const useStore = await getStore()
      await useStore.getState().registerWithEmail('Test User', 'test@example.com', 'Abc123', 'buyer')

      expect(useStore.getState().user).toEqual(mockUser)
      expect(useStore.getState().session).toEqual(mockSession)
    })

    it('llama signUp con los datos correctos (name, role en metadata)', async () => {
      mockSignUp.mockResolvedValue({ data: { user: mockUser, session: mockSession }, error: null })

      const useStore = await getStore()
      await useStore.getState().registerWithEmail('Test User', 'test@example.com', 'Abc123', 'seller')

      expect(mockSignUp).toHaveBeenCalledWith({
        email: 'test@example.com',
        password: 'Abc123',
        options: { data: { name: 'Test User', role: 'seller' } },
      })
    })

    it('upsert en tabla users después de registrar', async () => {
      mockSignUp.mockResolvedValue({ data: { user: mockUser, session: mockSession }, error: null })
      const mockUpsert = vi.fn().mockResolvedValue({ data: null, error: null })
      mockFrom.mockReturnValue({ upsert: mockUpsert })

      const useStore = await getStore()
      await useStore.getState().registerWithEmail('Test User', 'test@example.com', 'Abc123', 'buyer')

      expect(mockFrom).toHaveBeenCalledWith('users')
      expect(mockUpsert).toHaveBeenCalledWith(
        expect.objectContaining({ id: mockUser.id, email: mockUser.email, name: 'Test User', role: 'buyer' }),
      )
    })

    it('lanza el error cuando Supabase devuelve error', async () => {
      mockSignUp.mockResolvedValue({ data: { user: null, session: null }, error: new Error('Email already used') })

      const useStore = await getStore()

      await expect(
        useStore.getState().registerWithEmail('Bob', 'dup@x.com', 'Abc123', 'buyer'),
      ).rejects.toThrow('Email already used')
    })
  })

  // ── logout ─────────────────────────────────────────────────────────────

  describe('logout()', () => {
    it('limpia user y session al hacer logout', async () => {
      mockSignOut.mockResolvedValue({ error: null })
      mockSignInWithPassword.mockResolvedValue({ data: { user: mockUser, session: mockSession }, error: null })

      const useStore = await getStore()
      await useStore.getState().loginWithEmail('test@example.com', 'password123')
      await useStore.getState().logout()

      expect(useStore.getState().user).toBeNull()
      expect(useStore.getState().session).toBeNull()
    })

    it('llama supabase.auth.signOut()', async () => {
      mockSignOut.mockResolvedValue({ error: null })

      const useStore = await getStore()
      await useStore.getState().logout()

      expect(mockSignOut).toHaveBeenCalledTimes(1)
    })
  })

  // ── loginWithGoogle ────────────────────────────────────────────────────

  describe('loginWithGoogle()', () => {
    it('llama signInWithOAuth con provider google', async () => {
      mockSignInWithOAuth.mockResolvedValue({ data: {}, error: null })

      const useStore = await getStore()

      // Define window.location.origin para el test
      Object.defineProperty(globalThis, 'window', {
        value: { location: { origin: 'http://localhost:5173' } },
        writable: true,
      })

      await useStore.getState().loginWithGoogle()

      expect(mockSignInWithOAuth).toHaveBeenCalledWith({
        provider: 'google',
        options: { redirectTo: 'http://localhost:5173/auth/callback' },
      })
    })
  })
})

// ── getUserRole helper ────────────────────────────────────────────────────────

describe('getUserRole()', () => {
  it('retorna el rol del user_metadata', () => {
    const user = { user_metadata: { role: 'seller' } } as unknown as User
    expect(getUserRole(user)).toBe('seller')
  })

  it('retorna buyer por defecto si no hay role en metadata', () => {
    const user = { user_metadata: {} } as unknown as User
    expect(getUserRole(user)).toBe('buyer')
  })

  it('retorna buyer cuando user es null', () => {
    expect(getUserRole(null)).toBe('buyer')
  })

  it('retorna admin cuando role es admin', () => {
    const user = { user_metadata: { role: 'admin' } } as unknown as User
    expect(getUserRole(user)).toBe('admin')
  })

  it('retorna buyer cuando role viene como objeto', () => {
    const user = { user_metadata: { role: { name: 'seller' } } } as unknown as User
    expect(getUserRole(user)).toBe('buyer')
  })

  it('retorna buyer cuando role tiene un string no soportado', () => {
    const user = { user_metadata: { role: 'authenticated' } } as unknown as User
    expect(getUserRole(user)).toBe('buyer')
  })
})
