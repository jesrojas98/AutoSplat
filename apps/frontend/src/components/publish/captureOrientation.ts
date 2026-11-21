/**
 * Orientación de la captura guiada (vertical u horizontal).
 *
 * En horizontal el auto llena el ancho de la foto: con la cámara de un teléfono (~65° en el lado largo,
 * ~39° en el corto), a 3 m del auto entran ~3,8 m de ancho en horizontal y solo ~2,1 m en vertical.
 *
 * Hay dos maneras en que el teléfono puede estar de lado:
 *  - la pantalla rota (rotación automática activada): la cámara ya entrega fotogramas horizontales;
 *  - la pantalla NO rota (bloqueo de rotación, muy común): la cámara sigue entregando fotogramas verticales con
 *    la escena de lado. Se detecta con el giroscopio hacia dónde cae la gravedad y la foto se endereza al guardarla.
 *
 * Todas las fotos de una captura quedan con la misma orientación: COLMAP las trata como una sola cámara.
 */

export type CaptureMode = 'landscape' | 'portrait'

/** Cómo está el teléfono respecto de la vertical. 'cw' = girado en sentido horario (la parte de arriba apunta a la derecha). */
export type PhonePose = 'upright' | 'cw' | 'ccw' | 'flat'

/** Giro (grados, horario positivo) que se aplica al fotograma para que la escena quede derecha. */
export type FrameRotation = 0 | 90 | -90

export type OrientationIssue = 'need-landscape' | 'need-portrait' | null

const SIDEWAYS = 0.6 // componente de la gravedad sobre el eje del teléfono para considerarlo de lado / derecho

/**
 * Gravedad proyectada en el plano de la pantalla a partir de DeviceOrientationEvent (beta, gamma), en el marco del
 * teléfono: x hacia su borde derecho, y hacia su borde superior. Teléfono vertical derecho → (0, -1).
 * La fórmula sale de la convención Z-X'-Y'' del estándar y es la misma para las dos representaciones equivalentes
 * de un teléfono de lado (beta≈0, gamma≈±90 o beta≈180, gamma≈∓90).
 */
export function screenGravity(beta: number, gamma: number): { gx: number; gy: number } {
  const d = Math.PI / 180
  return { gx: Math.cos(beta * d) * Math.sin(gamma * d), gy: -Math.sin(beta * d) }
}

export function phonePose(beta: number, gamma: number): PhonePose {
  const { gx, gy } = screenGravity(beta, gamma)
  if (Math.abs(gx) >= SIDEWAYS && Math.abs(gx) > Math.abs(gy)) return gx > 0 ? 'cw' : 'ccw' // borde derecho abajo = horario
  if (-gy >= SIDEWAYS) return 'upright'
  return 'flat' // casi horizontal o de cabeza: no decide
}

/**
 * Qué hacer con el fotograma según el modo elegido.
 * @param frameLandscape la cámara entrega fotogramas más anchos que altos (la pantalla rotó, o es una webcam)
 * @param pose última postura conocida del teléfono, o null si no hay giroscopio (escritorio / sensores bloqueados)
 */
export function evaluateOrientation(
  mode: CaptureMode,
  frameLandscape: boolean,
  pose: PhonePose | null,
): { rotation: FrameRotation; issue: OrientationIssue } {
  // Sin sensores no se puede saber cómo se sostiene: se guarda tal cual (como siempre funcionó en escritorio)
  if (pose === null || pose === 'flat') return { rotation: 0, issue: null }

  if (mode === 'landscape') {
    if (frameLandscape) return { rotation: 0, issue: null }
    // Pantalla bloqueada en vertical con el teléfono de lado: la escena "arriba" queda a un costado del fotograma.
    // Horario → arriba de la escena = borde izquierdo del fotograma → girar la imagen 90° en sentido horario.
    if (pose === 'cw') return { rotation: 90, issue: null }
    if (pose === 'ccw') return { rotation: -90, issue: null }
    return { rotation: 0, issue: 'need-landscape' }
  }

  if (frameLandscape || pose !== 'upright') return { rotation: 0, issue: 'need-portrait' }
  return { rotation: 0, issue: null }
}

/** Giro CSS para que los textos se lean derechos cuando la pantalla no rota y el teléfono está de lado. */
export function uiRotationFor(rotation: FrameRotation): number {
  return rotation === 90 ? -90 : rotation === -90 ? 90 : 0
}

/** Dibuja el fotograma del video en el canvas aplicando el giro (el canvas toma las dimensiones resultantes). */
export function drawRotatedFrame(
  canvas: HTMLCanvasElement,
  ctx: CanvasRenderingContext2D,
  video: HTMLVideoElement,
  rotation: FrameRotation,
): void {
  const vw = video.videoWidth
  const vh = video.videoHeight
  const swap = rotation !== 0
  if (canvas.width !== (swap ? vh : vw)) canvas.width = swap ? vh : vw
  if (canvas.height !== (swap ? vw : vh)) canvas.height = swap ? vw : vh
  ctx.setTransform(1, 0, 0, 1, 0, 0)
  if (rotation === 90) {
    ctx.translate(vh, 0)
    ctx.rotate(Math.PI / 2)
  } else if (rotation === -90) {
    ctx.translate(0, vw)
    ctx.rotate(-Math.PI / 2)
  }
  ctx.drawImage(video, 0, 0, vw, vh)
  ctx.setTransform(1, 0, 0, 1, 0, 0)
}
