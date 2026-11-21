import { describe, expect, it, vi } from 'vitest'
import {
  drawRotatedFrame,
  evaluateOrientation,
  phonePose,
  screenGravity,
  uiRotationFor,
} from '@/components/publish/captureOrientation'

describe('phonePose', () => {
  it('teléfono vertical derecho', () => {
    expect(phonePose(90, 0)).toBe('upright')
    expect(phonePose(75, 10)).toBe('upright') // inclinado hacia abajo en la vuelta del hombro
  })

  it('de lado en sentido horario (borde derecho abajo), en sus dos representaciones', () => {
    expect(phonePose(0, 90)).toBe('cw')
    expect(phonePose(180, -90)).toBe('cw')
    expect(phonePose(10, 70)).toBe('cw')
  })

  it('de lado en sentido antihorario', () => {
    expect(phonePose(0, -90)).toBe('ccw')
    expect(phonePose(180, 90)).toBe('ccw')
  })

  it('casi plano no decide', () => {
    expect(phonePose(5, 5)).toBe('flat')
  })

  it('la gravedad apunta al borde inferior con el teléfono derecho', () => {
    const g = screenGravity(90, 0)
    expect(g.gx).toBeCloseTo(0)
    expect(g.gy).toBeCloseTo(-1)
  })
})

describe('evaluateOrientation', () => {
  it('horizontal con la pantalla rotada: la cámara ya entrega horizontal', () => {
    expect(evaluateOrientation('landscape', true, 'cw')).toEqual({ rotation: 0, issue: null })
  })

  it('horizontal con la pantalla bloqueada en vertical: endereza la foto según el lado', () => {
    expect(evaluateOrientation('landscape', false, 'cw')).toEqual({ rotation: 90, issue: null })
    expect(evaluateOrientation('landscape', false, 'ccw')).toEqual({ rotation: -90, issue: null })
  })

  it('horizontal con el teléfono derecho: pide girarlo', () => {
    expect(evaluateOrientation('landscape', false, 'upright')).toEqual({ rotation: 0, issue: 'need-landscape' })
  })

  it('vertical: igual que antes con el teléfono derecho', () => {
    expect(evaluateOrientation('portrait', false, 'upright')).toEqual({ rotation: 0, issue: null })
  })

  it('vertical con el teléfono de lado o la pantalla rotada: pide ponerlo vertical', () => {
    expect(evaluateOrientation('portrait', false, 'cw').issue).toBe('need-portrait')
    expect(evaluateOrientation('portrait', true, 'ccw').issue).toBe('need-portrait')
  })

  it('sin sensores (escritorio) se captura tal cual en ambos modos', () => {
    expect(evaluateOrientation('portrait', true, null)).toEqual({ rotation: 0, issue: null })
    expect(evaluateOrientation('landscape', false, null)).toEqual({ rotation: 0, issue: null })
  })
})

describe('uiRotationFor', () => {
  it('gira los textos al revés que la foto', () => {
    expect(uiRotationFor(90)).toBe(-90)
    expect(uiRotationFor(-90)).toBe(90)
    expect(uiRotationFor(0)).toBe(0)
  })
})

describe('drawRotatedFrame', () => {
  function setup() {
    const canvas = { width: 0, height: 0 } as HTMLCanvasElement
    const ops: string[] = []
    const ctx = {
      setTransform: vi.fn(),
      translate: vi.fn((x: number, y: number) => ops.push(`t${x},${y}`)),
      rotate: vi.fn((a: number) => ops.push(`r${Math.round((a * 180) / Math.PI)}`)),
      drawImage: vi.fn(),
    } as unknown as CanvasRenderingContext2D
    const video = { videoWidth: 1080, videoHeight: 1920 } as HTMLVideoElement
    return { canvas, ctx, video, ops }
  }

  it('sin giro conserva el tamaño del fotograma', () => {
    const { canvas, ctx, video, ops } = setup()
    drawRotatedFrame(canvas, ctx, video, 0)
    expect([canvas.width, canvas.height]).toEqual([1080, 1920])
    expect(ops).toEqual([])
  })

  it('con giro la foto sale horizontal (1920×1080)', () => {
    for (const rot of [90, -90] as const) {
      const { canvas, ctx, video, ops } = setup()
      drawRotatedFrame(canvas, ctx, video, rot)
      expect([canvas.width, canvas.height]).toEqual([1920, 1080])
      expect(ops).toEqual(rot === 90 ? ['t1920,0', 'r90'] : ['t0,1080', 'r-90'])
    }
  })
})
