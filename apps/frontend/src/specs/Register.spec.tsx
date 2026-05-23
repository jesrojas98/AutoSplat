import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'

const mockRegisterWithEmail = vi.fn()
const mockLoginWithGoogle = vi.fn()
const mockNavigate = vi.fn()

vi.mock('@/store/auth.store', () => ({
  useAuthStore: () => ({
    registerWithEmail: mockRegisterWithEmail,
    loginWithGoogle: mockLoginWithGoogle,
    loading: false,
  }),
}))

vi.mock('react-router-dom', async (importOriginal) => {
  const mod = await importOriginal<typeof import('react-router-dom')>()
  return { ...mod, useNavigate: () => mockNavigate }
})

import { Register } from '../pages/Register'

function renderRegister() {
  return render(
    <MemoryRouter>
      <Register />
    </MemoryRouter>,
  )
}

beforeEach(() => vi.clearAllMocks())

describe('Register', () => {

  // ── renderizado ────────────────────────────────────────────────────────

  describe('renderizado', () => {
    it('muestra el título "Crear cuenta"', () => {
      renderRegister()
      expect(screen.getByRole('heading', { name: /Crear cuenta/i })).toBeTruthy()
    })

    it('muestra el campo de nombre completo', () => {
      renderRegister()
      expect(screen.getByPlaceholderText('Tu nombre')).toBeTruthy()
    })

    it('muestra el campo de correo electrónico', () => {
      renderRegister()
      expect(screen.getByPlaceholderText('tu@correo.com')).toBeTruthy()
    })

    it('muestra el campo de contraseña', () => {
      renderRegister()
      const passInput = document.querySelector('input[type="password"]')
      expect(passInput).toBeTruthy()
    })

    it('muestra los botones de selección de rol (Comprador y Vendedor)', () => {
      renderRegister()
      expect(screen.getByText('COMPRADOR')).toBeTruthy()
      expect(screen.getByText('VENDEDOR')).toBeTruthy()
    })

    it('muestra el botón CREAR CUENTA', () => {
      renderRegister()
      expect(screen.getByRole('button', { name: /CREAR CUENTA/i })).toBeTruthy()
    })

    it('muestra el botón de Google', () => {
      renderRegister()
      expect(screen.getByText(/CONTINUAR CON GOOGLE/i)).toBeTruthy()
    })

    it('muestra link para ir a login', () => {
      renderRegister()
      expect(screen.getByText(/Inicia sesión/i)).toBeTruthy()
    })

    it('no muestra mensaje de error inicialmente', () => {
      renderRegister()
      expect(screen.queryByText(/Error/i)).toBeNull()
    })
  })

  // ── selección de rol ───────────────────────────────────────────────────

  describe('selección de rol', () => {
    it('rol inicial es Comprador', () => {
      renderRegister()
      const buyerBtn = screen.getByText('COMPRADOR').closest('button')!
      // El botón activo tiene border-[var(--color-primary)]
      expect(buyerBtn.className).toContain('border-[var(--color-primary)]')
    })

    it('cambia a Vendedor al hacer click', () => {
      renderRegister()
      const sellerBtn = screen.getByText('VENDEDOR').closest('button')!
      fireEvent.click(sellerBtn)
      expect(sellerBtn.className).toContain('border-[var(--color-primary)]')
    })

    it('llama registerWithEmail con role "seller" cuando se selecciona Vendedor', async () => {
      mockRegisterWithEmail.mockResolvedValue(undefined)
      renderRegister()

      // Seleccionar Vendedor
      fireEvent.click(screen.getByText('VENDEDOR').closest('button')!)

      // Llenar formulario
      fireEvent.change(screen.getByPlaceholderText('Tu nombre'), { target: { value: 'Ana' } })
      fireEvent.change(screen.getByPlaceholderText('tu@correo.com'), { target: { value: 'ana@x.com' } })
      fireEvent.change(document.querySelector('input[type="password"]')!, { target: { value: 'Password1' } })
      fireEvent.submit(document.querySelector('form')!)

      await waitFor(() => {
        expect(mockRegisterWithEmail).toHaveBeenCalledWith('Ana', 'ana@x.com', 'Password1', 'seller')
      })
    })

    it('llama registerWithEmail con role "buyer" por defecto', async () => {
      mockRegisterWithEmail.mockResolvedValue(undefined)
      renderRegister()

      fireEvent.change(screen.getByPlaceholderText('Tu nombre'), { target: { value: 'Bob' } })
      fireEvent.change(screen.getByPlaceholderText('tu@correo.com'), { target: { value: 'bob@x.com' } })
      fireEvent.change(document.querySelector('input[type="password"]')!, { target: { value: 'Password1' } })
      fireEvent.submit(document.querySelector('form')!)

      await waitFor(() => {
        expect(mockRegisterWithEmail).toHaveBeenCalledWith('Bob', 'bob@x.com', 'Password1', 'buyer')
      })
    })
  })

  // ── formulario ─────────────────────────────────────────────────────────

  describe('formulario', () => {
    it('actualiza el campo nombre al escribir', () => {
      renderRegister()
      const nameInput = screen.getByPlaceholderText('Tu nombre') as HTMLInputElement
      fireEvent.change(nameInput, { target: { value: 'María López' } })
      expect(nameInput.value).toBe('María López')
    })

    it('navega a /dashboard tras registro exitoso', async () => {
      mockRegisterWithEmail.mockResolvedValue(undefined)
      renderRegister()

      fireEvent.change(screen.getByPlaceholderText('Tu nombre'), { target: { value: 'Test' } })
      fireEvent.change(screen.getByPlaceholderText('tu@correo.com'), { target: { value: 'test@x.com' } })
      fireEvent.change(document.querySelector('input[type="password"]')!, { target: { value: 'Password1' } })
      fireEvent.submit(document.querySelector('form')!)

      await waitFor(() => {
        expect(mockNavigate).toHaveBeenCalledWith('/dashboard')
      })
    })

    it('muestra error cuando el registro falla', async () => {
      mockRegisterWithEmail.mockRejectedValue({
        response: { data: { message: 'El correo ya está registrado' } },
      })
      renderRegister()

      fireEvent.submit(document.querySelector('form')!)

      await waitFor(() => {
        expect(screen.getByText('El correo ya está registrado')).toBeTruthy()
      })
    })

    it('muestra error genérico si no hay response.data.message', async () => {
      mockRegisterWithEmail.mockRejectedValue(new Error('Network error'))
      renderRegister()

      fireEvent.submit(document.querySelector('form')!)

      await waitFor(() => {
        expect(screen.getByText('Error al crear la cuenta')).toBeTruthy()
      })
    })
  })

  // ── Google OAuth ───────────────────────────────────────────────────────

  describe('Google OAuth', () => {
    it('llama loginWithGoogle al hacer click en el botón de Google', async () => {
      mockLoginWithGoogle.mockResolvedValue(undefined)
      renderRegister()

      const googleBtn = screen.getByText(/CONTINUAR CON GOOGLE/i).closest('button')!
      fireEvent.click(googleBtn)

      await waitFor(() => {
        expect(mockLoginWithGoogle).toHaveBeenCalledTimes(1)
      })
    })
  })
})
