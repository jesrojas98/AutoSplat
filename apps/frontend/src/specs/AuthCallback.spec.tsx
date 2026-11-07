import { describe, it, expect, beforeEach, vi } from 'vitest'
import { render, waitFor } from '@testing-library/react'

const { mockFrom, mockUpdateUser, mockOnAuthStateChange, mockSetSession, mockNavigate, state } = vi.hoisted(() => ({
  mockFrom: vi.fn(),
  mockUpdateUser: vi.fn(),
  mockOnAuthStateChange: vi.fn(),
  mockSetSession: vi.fn(),
  mockNavigate: vi.fn(),
  // Lo que devuelve la consulta del rol en la tabla users, y el usuario que "inicia sesión"
  state: {
    lookup: { data: null as { role: string } | null, error: null as unknown },
    user: null as any,
    upsert: null as any,
  },
}))

vi.mock('@/lib/supabase', () => ({
  supabase: {
    auth: { onAuthStateChange: mockOnAuthStateChange, updateUser: mockUpdateUser, setSession: mockSetSession },
    from: mockFrom,
  },
}))

vi.mock('react-router-dom', () => ({ useNavigate: () => mockNavigate }))

import { AuthCallback } from '../pages/AuthCallback'

function makeUser(metaRole?: string) {
  return {
    id: 'user-1',
    email: 'jesus@example.com',
    user_metadata: { full_name: 'Jesus', ...(metaRole ? { role: metaRole } : {}) },
  }
}

describe('AuthCallback — el rol de la tabla users manda', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    localStorage.clear()
    state.lookup = { data: null, error: null }
    state.upsert = vi.fn().mockResolvedValue({ error: null })

    mockFrom.mockImplementation(() => ({
      select: () => ({ eq: () => ({ maybeSingle: () => Promise.resolve(state.lookup) }) }),
      upsert: state.upsert,
    }))
    mockUpdateUser.mockResolvedValue({ error: null })
    // Supabase avisa SIGNED_IN apenas se procesan los tokens de la URL
    mockOnAuthStateChange.mockImplementation((cb: (e: string, s: unknown) => void) => {
      setTimeout(() => cb('SIGNED_IN', { user: state.user }), 0)
      return { data: { subscription: { unsubscribe: vi.fn() } } }
    })
  })

  it('un admin que vuelve desde /register con Google (rol "buyer" pendiente) sigue siendo admin', async () => {
    state.user = makeUser('buyer') // metadata desfasada
    state.lookup = { data: { role: 'admin' }, error: null }
    localStorage.setItem('oauth_role', 'buyer') // lo deja el botón de Google de /register

    render(<AuthCallback />)

    await waitFor(() => expect(mockNavigate).toHaveBeenCalledWith('/dashboard'))
    expect(state.upsert).not.toHaveBeenCalled()
    expect(mockUpdateUser).toHaveBeenCalledWith({ data: { role: 'admin' } })
    expect(localStorage.getItem('oauth_role')).toBeNull()
  })

  it('un usuario existente conserva su rol y no se pisan sus datos', async () => {
    state.user = makeUser('seller')
    state.lookup = { data: { role: 'seller' }, error: null }

    render(<AuthCallback />)

    await waitFor(() => expect(mockNavigate).toHaveBeenCalledWith('/dashboard'))
    expect(state.upsert).not.toHaveBeenCalled()
    expect(mockUpdateUser).not.toHaveBeenCalled() // metadata ya coincide
  })

  it('un usuario nuevo toma el rol elegido en /register', async () => {
    state.user = makeUser()
    localStorage.setItem('oauth_role', 'seller')

    render(<AuthCallback />)

    await waitFor(() => expect(mockNavigate).toHaveBeenCalledWith('/dashboard'))
    expect(state.upsert).toHaveBeenCalledWith(expect.objectContaining({ id: 'user-1', role: 'seller' }))
    expect(mockUpdateUser).toHaveBeenCalledWith({ data: { role: 'seller' } })
  })

  it('un usuario nuevo sin rol elegido queda como comprador', async () => {
    state.user = makeUser()

    render(<AuthCallback />)

    await waitFor(() => expect(mockNavigate).toHaveBeenCalledWith('/dashboard'))
    expect(state.upsert).toHaveBeenCalledWith(expect.objectContaining({ role: 'buyer' }))
  })

  it('nunca da de alta a un usuario nuevo como admin aunque su metadata lo diga', async () => {
    state.user = makeUser('admin')

    render(<AuthCallback />)

    await waitFor(() => expect(mockNavigate).toHaveBeenCalledWith('/dashboard'))
    expect(state.upsert).toHaveBeenCalledWith(expect.objectContaining({ role: 'buyer' }))
    expect(mockUpdateUser).toHaveBeenCalledWith({ data: { role: 'buyer' } })
  })

  it('si no se puede consultar el rol, no escribe nada y sigue al dashboard', async () => {
    state.user = makeUser('admin')
    state.lookup = { data: null, error: { message: 'network' } }
    localStorage.setItem('oauth_role', 'buyer')

    render(<AuthCallback />)

    await waitFor(() => expect(mockNavigate).toHaveBeenCalledWith('/dashboard'))
    expect(state.upsert).not.toHaveBeenCalled()
    expect(mockUpdateUser).not.toHaveBeenCalled()
  })
})
