/**
 * Achica una foto antes de subirla. Las fotos de un teléfono moderno pesan 5–15 MB (12–48 MP): el backend
 * (plan gratuito de Render, 512 MB) las recibe en memoria y rechaza las de más de 10 MB, y el teléfono lo ve
 * como "sin conexión" porque el servidor corta la subida a medias.
 *
 * Las fotos que ya son JPEG livianos (por ejemplo las de la captura guiada, 1920 px) se suben intactas.
 */
export interface PrepareImageOptions {
  /** Lado más largo máximo, en píxeles */
  maxSide: number
  /** Calidad JPEG (0–1) al recomprimir */
  quality: number
  /** Un JPEG de hasta este peso se sube tal cual, sin decodificarlo */
  keepBelowBytes: number
}

export const GALLERY_IMAGE: PrepareImageOptions = { maxSide: 2560, quality: 0.85, keepBelowBytes: 1.5 * 1024 * 1024 }
// Para el 3D se conserva más calidad: solo se recomprimen fotos muy pesadas (no las de la captura guiada)
export const RECONSTRUCTION_IMAGE: PrepareImageOptions = { maxSide: 2560, quality: 0.92, keepBelowBytes: 4 * 1024 * 1024 }

const LOAD_TIMEOUT_MS = 15000 // si el navegador no responde, se sube el original en vez de quedar colgado

function loadImage(file: File): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file)
    const img = new Image()
    const done = (ok: boolean) => {
      clearTimeout(timer)
      URL.revokeObjectURL(url)
      if (ok) resolve(img)
      else reject(new Error('no se pudo leer la imagen'))
    }
    const timer = setTimeout(() => done(false), LOAD_TIMEOUT_MS)
    img.onload = () => done(true)
    img.onerror = () => done(false)
    img.src = url // el navegador aplica la orientación EXIF al decodificar
  })
}

export function targetSize(width: number, height: number, maxSide: number): { width: number; height: number } {
  const scale = Math.min(1, maxSide / Math.max(width, height))
  return { width: Math.round(width * scale), height: Math.round(height * scale) }
}

export async function prepareImage(file: File, opts: PrepareImageOptions): Promise<File> {
  if (file.type === 'image/jpeg' && file.size <= opts.keepBelowBytes) return file

  let img: HTMLImageElement
  try {
    img = await loadImage(file)
  } catch {
    return file // formato que el navegador no decodifica: se sube tal cual y el servidor decide
  }
  const { width, height } = targetSize(img.naturalWidth, img.naturalHeight, opts.maxSide)
  const canvas = document.createElement('canvas')
  canvas.width = width
  canvas.height = height
  const ctx = canvas.getContext('2d')
  if (!ctx) return file
  ctx.drawImage(img, 0, 0, width, height)
  const blob = await new Promise<Blob | null>((r) => canvas.toBlob(r, 'image/jpeg', opts.quality))
  canvas.width = 0 // libera la memoria del canvas enseguida (importante en iPhone)
  canvas.height = 0
  if (!blob || blob.size >= file.size) return file
  const name = file.name.replace(/\.[^.]+$/, '') + '.jpg'
  return new File([blob], name, { type: 'image/jpeg' })
}
