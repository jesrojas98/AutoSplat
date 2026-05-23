import { describe, it, expect } from 'vitest'
import { formatPriceNumber, formatMileage } from '../utils/formatters'

describe('formatPriceNumber()', () => {
  it('formatea un precio en formato es-CL sin decimales', () => {
    expect(formatPriceNumber(15000000)).toBe('15.000.000')
  })

  it('formatea precio bajo sin puntos de miles', () => {
    expect(formatPriceNumber(500)).toBe('500')
  })

  it('formatea cero', () => {
    expect(formatPriceNumber(0)).toBe('0')
  })

  it('formatea números con exactamente un punto de miles', () => {
    expect(formatPriceNumber(1000)).toBe('1.000')
  })

  it('no incluye decimales aunque se pasen', () => {
    expect(formatPriceNumber(15000000.99)).toBe('15.000.001')
  })

  it('formatea precio alto (tres grupos)', () => {
    expect(formatPriceNumber(1234567890)).toBe('1.234.567.890')
  })
})

describe('formatMileage()', () => {
  it('retorna "0 km" cuando el kilometraje es 0', () => {
    expect(formatMileage(0)).toBe('0 km')
  })

  it('retorna km exactos cuando es menor a 1000', () => {
    expect(formatMileage(500)).toBe('500 km')
  })

  it('retorna km exactos en el límite inferior (999)', () => {
    expect(formatMileage(999)).toBe('999 km')
  })

  it('convierte a "k km" cuando es exactamente 1000', () => {
    expect(formatMileage(1000)).toBe('1k km')
  })

  it('convierte a "k km" para valores mayores a 1000', () => {
    expect(formatMileage(20000)).toBe('20k km')
  })

  it('redondea a entero en la conversión a "k"', () => {
    expect(formatMileage(15500)).toBe('16k km')
  })

  it('formatea 100000 km correctamente', () => {
    expect(formatMileage(100000)).toBe('100k km')
  })

  it('formatea valores decimales de miles', () => {
    expect(formatMileage(1500)).toBe('2k km')
  })
})
