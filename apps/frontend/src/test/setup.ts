// Setup global de testing — importado por Vitest antes de cada suite
import '@testing-library/jest-dom'

// Silencia errores de consola esperados durante tests (e.g. prop warnings en React)
const originalError = console.error
beforeAll(() => {
  console.error = (...args: any[]) => {
    if (typeof args[0] === 'string' && args[0].includes('Warning:')) return
    originalError(...args)
  }
})
afterAll(() => {
  console.error = originalError
})
