import { describe, expect, it, vi } from 'vitest'
import { GALLERY_IMAGE, prepareImage, targetSize } from '@/utils/prepareImage'

describe('targetSize', () => {
  it('achica una foto de 48 MP al lado máximo conservando la proporción', () => {
    expect(targetSize(8064, 6048, 2560)).toEqual({ width: 2560, height: 1920 })
    expect(targetSize(6048, 8064, 2560)).toEqual({ width: 1920, height: 2560 })
  })

  it('no agranda fotos chicas', () => {
    expect(targetSize(1920, 1080, 2560)).toEqual({ width: 1920, height: 1080 })
  })
})

describe('prepareImage', () => {
  it('un JPEG liviano (captura guiada) se sube intacto, sin decodificarlo', async () => {
    const f = new File([new Uint8Array(400 * 1024)], 'guided-1mid-00.jpg', { type: 'image/jpeg' })
    expect(await prepareImage(f, GALLERY_IMAGE)).toBe(f)
  })

  it('si el navegador no puede leer el formato (HEIC en Chrome), devuelve el original para que lo convierta el servidor', async () => {
    // Imagen que falla al decodificar, como una HEIC en Chrome
    class FailingImage {
      onload: (() => void) | null = null
      onerror: (() => void) | null = null
      set src(_v: string) { setTimeout(() => this.onerror?.(), 0) }
    }
    vi.stubGlobal('Image', FailingImage)
    vi.stubGlobal('URL', { ...URL, createObjectURL: () => 'blob:x', revokeObjectURL: () => {} })
    try {
      const f = new File([new Uint8Array(3 * 1024 * 1024)], 'IMG_0001.HEIC', { type: 'image/heic' })
      expect(await prepareImage(f, GALLERY_IMAGE)).toBe(f)
    } finally {
      vi.unstubAllGlobals()
    }
  })
})
