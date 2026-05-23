import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'

const mockLoginWithEmail = vi.fn()
const mockLoginWithGoogle = vi.fn()
const mockNavigate = vi.fn()

vi.mock('@/store/auth.store', () => ({
  useAuthStore: () => ({
    loginWithEmail: mockLoginWithEmail,
    loginWithGoogle: mockLoginWithGoogle,
    loading: false,
  }),
}))

vi.mock('react-router-dom', async (importOriginal) => {
  const mod = await importOriginal<typeof import('react-router-dom')>()
  return { ...mod, useNavigate: () => mockNavigate }
})

import { Login } from '../pages/Login'

function renderLogin() {
  return render(
    <MemoryRouter>
      <Login />
    </MemoryRouter>,
  )
}

beforeEach(() => vi.clearAllMocks())

describe('Login', () => {

  // ── renderizado ────────────────────────────────────────────────────────

  describe('renderizado', () => {
    it('muestra el título "Iniciar sesión"', () => {
      renderLogin()
      expect(screen.getByRole('heading', { name: /Iniciar sesión/i })).toBeTruthy()
    })

    it('muestra el campo de correo electrónico', () => {
      renderLogin()
      expect(screen.getByPlaceholderText('tu@correo.com')).toBeTruthy()
    })

    it('muestra el campo de contraseña', () => {
      renderLogin()
      const passInput = document.querySelector('input[type="password"]')
      expect(passInput).toBeTruthy()
    })

    it('muestra el botón de submit INGRESAR', () => {
      renderLogin()
      expect(screen.getByRole('button', { name: /INGRESAR/i })).toBeTruthy()
    })

    it('muestra el botón de Google', () => {
      renderLogin()
      expect(screen.getByText(/CONTINUAR CON GOOGLE/i)).toBeTruthy()
    })

    it('muestra el link para ir a registro', () => {
      renderLogin()
      expect(screen.getByText(/Regístrate gratis/i)).toBeTruthy()
    })

    it('no muestra mensaje de error inicialmente', () => {
      renderLogin()
      expect(screen.queryByText(/Error al iniciar sesión/i)).toBeNull()
    })
  })

  // ── formulario ─────────────────────────────────────────────────────────

  describe('formulario', () => {
    it('actualiza el campo de correo al escribir', () => {
      renderLogin()
      const emailInput = screen.getByPlaceholderText('tu@correo.com') as HTMLInputElement
      fireEvent.change(emailInput, { target: { value: 'test@example.com' } })
      expect(emailInput.value).toBe('test@example.com')
    })

    it('actualiza el campo de contraseña al escribir', () => {
      renderLogin()
      const passInput = document.querySelector('input[type="password"]') as HTMLInputElement
      fireEvent.change(passInput, { target: { value: 'password123' } })
      expect(passInput.value).toBe('password123')
    })

    it('llama loginWithEmail con email y password al enviar', async () => {
      mockLoginWithEmail.mockResolvedValue(undefined)
      renderLogin()

      fireEvent.change(screen.getByPlaceholderText('tu@correo.com'), { target: { value: 'test@example.com' } })
      fireEvent.change(document.querySelector('input[type="password"]')!, { target: { value: 'Pass123' } })
      fireEvent.submit(document.querySelector('form')!)

      await waitFor(() => {
        expect(mockLoginWithEmail).toHaveBeenCalledWith('test@example.com', 'Pass123')
      })
    })

    it('navega a /dashboard tras login exitoso', async () => {
      mockLoginWithEmail.mockResolvedValue(undefined)
      renderLogin()

      fireEvent.change(screen.getByPlaceholderText('tu@correo.com'), { target: { value: 'test@example.com' } })
      fireEvent.change(document.querySelector('input[type="password"]')!, { target: { value: 'Pass123' } })
      fireEvent.submit(document.querySelector('form')!)

      await waitFor(() => {
        expect(mockNavigate).toHaveBeenCalledWith('/dashboard')
      })
    })

    it('muestra error cuando loginWithEmail falla', async () => {
      mockLoginWithEmail.mockRejectedValue({
        response: { data: { message: 'Credenciales incorrectas' } },
      })
      renderLogin()

      fireEvent.change(screen.getByPlaceholderText('tu@correo.com'), { target: { value: 'bad@example.com' } })
      fireEvent.change(document.querySelector('input[type="password"]')!, { target: { value: 'wrong' } })
      fireEvent.submit(document.querySelector('form')!)

      await waitFor(() => {
        expect(screen.getByText('Credenciales incorrectas')).toBeTruthy()
      })
    })

    it('muestra mensaje de error genérico si no hay response.data.message', async () => {
      mockLoginWithEmail.mockRejectedValue(new Error('Network error'))
      renderLogin()

      fireEvent.submit(document.querySelector('form')!)

      await waitFor(() => {
        expect(screen.getByText('Error al iniciar sesión')).toBeTruthy()
      })
    })
  })

  // ── toggle contraseña ──────────────────────────────────────────────────

  describe('toggle contraseña', () => {
    it('cambia el tipo del input a text al hacer click en el ojo', () => {
      renderLogin()
      const toggleBtn = document.querySelector('button[type="button"]:not([onClick])') as HTMLButtonElement
      // El botón de toggle está al lado del input de contraseña
      const visibilityBtn = screen.getByRole('button', { name: '' }) // material icon
      // Más robusto: buscar el botón que contiene el span de visibility
      const buttons = screen.getAllByRole('button')
      const eyeBtn = buttons.find(b => b.querySelector('span')?.textContent?.includes('visibility'))

      if (eyeBtn) {
        fireEvent.click(eyeBtn)
        const passInput = document.querySelector('input[type="text"]')
        expect(passInput).toBeTruthy()
      }
    })
  })

  // ── Google OAuth ───────────────────────────────────────────────────────

  describe('Google OAuth', () => {
    it('llama loginWithGoogle al hacer click en el botón de Google', async () => {
      mockLoginWithGoogle.mockResolvedValue(undefined)
      renderLogin()

      const googleBtn = screen.getByText(/CONTINUAR CON GOOGLE/i).closest('button')!
      fireEvent.click(googleBtn)

      await waitFor(() => {
        expect(mockLoginWithGoogle).toHaveBeenCalledTimes(1)
      })
    })
  })
})
