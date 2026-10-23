import { useEffect, useRef, useState, useCallback } from 'react'
import { createPortal } from 'react-dom'

interface Props {
  onCapture: (files: File[]) => void
  onClose: () => void
}

type Phase = 'intro' | 'scan' | 'busy' | 'between'
type Sensor = 'unknown' | 'ok' | 'none'

const PASSES = [
  { id: 'mid', short: 'CINTURA', title: 'Pasada 1 de 2', hint: 'Teléfono a la altura de la cintura, apuntando al centro del auto.' },
  { id: 'high', short: 'HOMBRO', title: 'Pasada 2 de 2', hint: 'Teléfono a la altura del hombro, inclinado un poco hacia abajo.' },
] as const

const SHOTS_PER_PASS = 24
const STEP_DEG = 360 / SHOTS_PER_PASS
const CAPTURE_DEBOUNCE_MS = 350
const MAX_DEG_PER_SEC = 55 // más rápido que esto sale movida la foto

// Colores fijos: el visor de cámara es oscuro en ambos temas.
const ACCENT = '#b4c5ff'
const ACCENT_STRONG = '#2563eb'

/** Rumbo (0–360, horario) hacia donde apunta la parte trasera del teléfono, con el teléfono en cualquier inclinación. */
function compassHeading(alpha: number, beta: number, gamma: number): number {
  const d = Math.PI / 180
  const a = alpha * d, b = beta * d, g = gamma * d
  const cA = Math.cos(a), sA = Math.sin(a)
  const sB = Math.sin(b)
  const sG = Math.sin(g), cG = Math.cos(g)
  const rA = -cA * sG - sA * sB * cG
  const rB = -sA * sG + cA * sB * cG
  let h = Math.atan2(rA, rB)
  if (h < 0) h += 2 * Math.PI
  return h / d
}

function signedDelta(from: number, to: number): number {
  return ((to - from + 540) % 360) - 180
}

function sectorName(deg: number): string {
  const a = ((deg % 360) + 360) % 360
  if (a < 45 || a >= 315) return 'FRENTE DEL AUTO'
  if (a < 135) return 'COSTADO DERECHO DEL AUTO'
  if (a < 225) return 'PARTE TRASERA'
  return 'COSTADO IZQUIERDO DEL AUTO'
}

export function GuidedCameraCapture({ onCapture, onClose }: Props) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const streamRef = useRef<MediaStream | null>(null)

  const [phase, setPhaseState] = useState<Phase>('intro')
  const [passIndex, setPassIndexState] = useState(0)
  const [shots, setShotsState] = useState(0)
  const [totalShots, setTotalShots] = useState(0)
  const [angle, setAngleState] = useState(0)
  const [sensor, setSensor] = useState<Sensor>('unknown')
  const [tooFast, setTooFast] = useState(false)
  const [flash, setFlash] = useState(false)
  const [cameraError, setCameraError] = useState<string | null>(null)

  // Espejo en refs para leerlos desde el listener del sensor sin re-suscribirlo
  const phaseRef = useRef<Phase>('intro')
  const passIndexRef = useRef(0)
  const shotsRef = useRef(0)
  const angleRef = useRef(0)
  const filesRef = useRef<File[]>([])
  const lastHeadingRef = useRef<number | null>(null)
  const lastEventTimeRef = useRef(0)
  const lastCaptureTimeRef = useRef(0)
  const onCaptureRef = useRef(onCapture)
  onCaptureRef.current = onCapture

  const setPhase = (p: Phase) => { phaseRef.current = p; setPhaseState(p) }
  const setShots = (n: number) => { shotsRef.current = n; setShotsState(n) }
  const setAngle = (a: number) => { angleRef.current = a; setAngleState(a) }
  const setPassIndex = (n: number) => { passIndexRef.current = n; setPassIndexState(n) }

  const totalTarget = SHOTS_PER_PASS * PASSES.length
  const pass = PASSES[passIndex]

  // La overlay es position:fixed, pero se monta en <body> porque los ancestros con
  // backdrop-filter (glass-card) la encierran y la desplazan/recortan en el teléfono.
  useEffect(() => {
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => { document.body.style.overflow = prev }
  }, [])

  // ---- Cámara ----
  useEffect(() => {
    let cancelled = false
    async function startCamera() {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: { ideal: 'environment' }, width: { ideal: 1920 }, height: { ideal: 1080 } },
          audio: false,
        })
        if (cancelled) { stream.getTracks().forEach((t) => t.stop()); return }
        streamRef.current = stream
        if (videoRef.current) {
          videoRef.current.srcObject = stream
          await videoRef.current.play()
        }
      } catch {
        setCameraError('No se pudo acceder a la cámara. Revisa los permisos del navegador.')
      }
    }
    startCamera()
    return () => {
      cancelled = true
      streamRef.current?.getTracks().forEach((t) => t.stop())
    }
  }, [])

  const finish = useCallback(() => {
    streamRef.current?.getTracks().forEach((t) => t.stop())
    onCaptureRef.current(filesRef.current)
  }, [])

  const captureFrame = useCallback(() => {
    const video = videoRef.current
    const canvas = canvasRef.current
    if (!video || !canvas || video.videoWidth === 0) return

    // Se reserva el número de foto y se corta el disparo antes del toBlob asíncrono
    const shotIndex = shotsRef.current
    const passId = PASSES[passIndexRef.current].id
    const nextShot = shotIndex + 1
    const passDone = nextShot >= SHOTS_PER_PASS
    lastCaptureTimeRef.current = Date.now()
    shotsRef.current = nextShot
    if (passDone) { phaseRef.current = 'busy'; setPhaseState('busy') }

    canvas.width = video.videoWidth
    canvas.height = video.videoHeight
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height)

    canvas.toBlob((blob) => {
      if (blob) {
        filesRef.current = [
          ...filesRef.current,
          new File([blob], `guided-${passId}-${String(shotIndex).padStart(2, '0')}.jpg`, { type: 'image/jpeg' }),
        ]
        setTotalShots(filesRef.current.length)
      }
      setShotsState(nextShot)
      setFlash(true)
      setTimeout(() => setFlash(false), 140)
      if (navigator.vibrate) navigator.vibrate(25)

      if (passDone) {
        if (passIndexRef.current + 1 < PASSES.length) setPhase('between')
        else finish()
      }
    }, 'image/jpeg', 0.9)
  }, [finish])

  // ---- Giroscopio / brújula ----
  useEffect(() => {
    let gotHeading = false

    function onOrientation(e: DeviceOrientationEvent) {
      const ios = (e as DeviceOrientationEvent & { webkitCompassHeading?: number }).webkitCompassHeading
      let heading: number | null = null
      if (typeof ios === 'number') heading = ios
      else if (e.alpha !== null && e.beta !== null && e.gamma !== null) heading = compassHeading(e.alpha, e.beta, e.gamma)
      if (heading === null) return

      if (!gotHeading) { gotHeading = true; setSensor('ok') }

      const now = performance.now()
      const prev = lastHeadingRef.current
      const dt = now - lastEventTimeRef.current
      lastHeadingRef.current = heading
      lastEventTimeRef.current = now
      if (prev === null || phaseRef.current !== 'scan') return

      const delta = signedDelta(prev, heading)
      const speed = dt > 0 ? Math.abs(delta) / dt * 1000 : 0
      setTooFast(speed > MAX_DEG_PER_SEC)

      // Caminar a la izquierda alrededor del auto = rumbo creciente. Se acumula con signo.
      const acc = Math.max(0, angleRef.current + delta)
      if (Math.abs(acc - angleRef.current) >= 0.4) setAngle(acc)

      const target = (shotsRef.current + 1) * STEP_DEG
      if (
        acc >= target &&
        speed <= MAX_DEG_PER_SEC &&
        Date.now() - lastCaptureTimeRef.current >= CAPTURE_DEBOUNCE_MS
      ) {
        captureFrame()
      }
    }

    window.addEventListener('deviceorientation', onOrientation, true)
    // Sin eventos reales en 2.5 s (escritorio o sensor bloqueado): modo manual
    const t = setTimeout(() => { if (!gotHeading) setSensor('none') }, 2500)
    return () => {
      window.removeEventListener('deviceorientation', onOrientation, true)
      clearTimeout(t)
    }
  }, [captureFrame])

  async function start() {
    // iOS exige pedir el permiso dentro de un gesto del usuario
    const DOE = window.DeviceOrientationEvent as unknown as {
      requestPermission?: () => Promise<'granted' | 'denied'>
    }
    if (typeof DOE?.requestPermission === 'function') {
      try { await DOE.requestPermission() } catch { /* se queda en modo manual */ }
    }
    setAngle(0)
    setShots(0)
    setPhase('scan')
  }

  function nextPass() {
    setPassIndex(passIndexRef.current + 1)
    setAngle(0)
    setShots(0)
    setPhase('scan')
  }

  function manualCapture() {
    if (phaseRef.current !== 'scan') return
    // En manual el avance angular lo marca la propia foto
    if (sensor !== 'ok') setAngle((shotsRef.current + 1) * STEP_DEG)
    captureFrame()
  }

  function skipPass() {
    if (passIndexRef.current + 1 < PASSES.length) setPhase('between')
    else finish()
  }

  const remaining = Math.max(0, Math.ceil((shots + 1) * STEP_DEG - angle))
  const auto = sensor === 'ok'
  const lastPass = passIndex + 1 >= PASSES.length

  const overlay = (
    <div
      className="fixed inset-0 z-[100] bg-black flex flex-col overflow-hidden"
      style={{ height: '100dvh', width: '100vw' }}
    >
      {/* Visor */}
      <div className="relative flex-1 min-h-0 overflow-hidden">
        <video ref={videoRef} playsInline muted className="absolute inset-0 w-full h-full object-cover" />
        <canvas ref={canvasRef} className="hidden" />

        {flash && <div className="absolute inset-0 bg-white pointer-events-none" style={{ opacity: 0.85 }} />}

        {/* Marco de encuadre: el auto completo dentro */}
        <div className={`absolute inset-x-[7%] top-[22%] bottom-[24%] pointer-events-none ${phase === 'scan' || phase === 'busy' ? '' : 'hidden'}`}>
          {(['tl', 'tr', 'bl', 'br'] as const).map((c) => (
            <span
              key={c}
              className="absolute w-8 h-8"
              style={{
                top: c[0] === 't' ? 0 : undefined,
                bottom: c[0] === 'b' ? 0 : undefined,
                left: c[1] === 'l' ? 0 : undefined,
                right: c[1] === 'r' ? 0 : undefined,
                borderColor: ACCENT,
                borderStyle: 'solid',
                borderWidth: 0,
                borderTopWidth: c[0] === 't' ? 3 : 0,
                borderBottomWidth: c[0] === 'b' ? 3 : 0,
                borderLeftWidth: c[1] === 'l' ? 3 : 0,
                borderRightWidth: c[1] === 'r' ? 3 : 0,
                borderRadius: 6,
                opacity: 0.9,
              }}
            />
          ))}
          <span className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-5 h-5 rounded-full border-2 opacity-70" style={{ borderColor: ACCENT }}>
            <span className="absolute inset-[5px] rounded-full" style={{ background: ACCENT }} />
          </span>
        </div>

        {/* Barra superior */}
        <div
          className="absolute top-0 inset-x-0 flex items-center gap-2 px-3 pb-3 bg-linear-to-b from-black/80 to-transparent"
          style={{ paddingTop: 'max(0.75rem, env(safe-area-inset-top))' }}
        >
          <button
            type="button"
            onClick={onClose}
            aria-label="Cancelar captura"
            className="shrink-0 w-10 h-10 rounded-full bg-black/50 border border-white/25 text-white flex items-center justify-center"
          >
            <span className="material-symbols-outlined text-xl">close</span>
          </button>
          <div className="flex-1 min-w-0 text-center">
            <p className="label-caps text-white text-[11px] truncate">{pass.title} · {pass.short}</p>
          </div>
          <div className="shrink-0 min-w-10 h-10 px-3 rounded-full bg-black/50 border border-white/25 flex items-center justify-center">
            <span className="label-caps text-[11px] font-bold" style={{ color: ACCENT }}>{totalShots}/{totalTarget}</span>
          </div>
        </div>

        {/* Instrucción dinámica */}
        {phase === 'scan' && (
          <div className="absolute inset-x-0 top-[68px] px-4 flex justify-center pointer-events-none">
            <div className="max-w-full rounded-2xl bg-black/65 backdrop-blur-sm border border-white/15 px-4 py-2.5 text-center">
              {cameraError ? (
                <p className="text-white text-sm">{cameraError}</p>
              ) : auto ? (
                <>
                  <p className="label-caps text-[11px] mb-1" style={{ color: ACCENT }}>{sectorName(angle)}</p>
                  {tooFast ? (
                    <p className="text-sm font-semibold text-amber-300">Más lento, la foto saldría movida</p>
                  ) : (
                    <p className="text-white text-sm font-semibold flex items-center justify-center gap-2">
                      <span className="material-symbols-outlined text-xl animate-pulse" style={{ color: ACCENT }}>arrow_back</span>
                      Camina a tu izquierda
                    </p>
                  )}
                  <p className="text-white/60 text-[11px] mt-1">Próxima foto en {Math.max(1, remaining)}°</p>
                </>
              ) : sensor === 'none' ? (
                <>
                  <p className="label-caps text-[11px] mb-1" style={{ color: ACCENT }}>MODO MANUAL</p>
                  <p className="text-white text-sm">Da un paso a la izquierda y toca el botón. Repite hasta cerrar la vuelta.</p>
                </>
              ) : (
                <p className="text-white/80 text-sm">Calibrando sensores…</p>
              )}
            </div>
          </div>
        )}

        {/* Radar: dónde estás y cuánto falta */}
        {(phase === 'scan' || phase === 'busy') && (
          <div className="absolute right-3 bottom-3 pointer-events-none">
            <Radar shots={shots} angle={auto ? angle : shots * STEP_DEG} showMarker />
          </div>
        )}

        {/* Intro */}
        {phase === 'intro' && (
          <div className="absolute inset-0 bg-black/80 overflow-y-auto">
            <div className="min-h-full flex flex-col items-center justify-center px-5 py-20 gap-5">
              <div className="w-44 shrink-0">
                <Radar shots={0} angle={0} showMarker intro />
              </div>
              <div className="w-full max-w-sm">
                <p className="label-caps text-center mb-3" style={{ color: ACCENT }}>CÓMO ESCANEAR EL AUTO</p>
                <ol className="space-y-3">
                  {[
                    'Párate frente al auto, a unos 3 metros, con todo el auto dentro del marco.',
                    'Camina hacia tu izquierda rodeando el auto, mirando siempre al centro.',
                    'Haz 2 vueltas: cintura y hombro. La app toma las fotos sola mientras caminas.',
                  ].map((t, i) => (
                    <li key={i} className="flex items-start gap-3">
                      <span className="shrink-0 w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold text-white" style={{ background: ACCENT_STRONG }}>{i + 1}</span>
                      <span className="text-white/90 text-sm leading-snug">{t}</span>
                    </li>
                  ))}
                </ol>
              </div>
              <div className="w-full max-w-sm flex flex-col gap-2 mt-1">
                <button
                  type="button"
                  onClick={start}
                  disabled={!!cameraError}
                  className="w-full py-3.5 rounded-xl label-caps font-bold text-white disabled:opacity-40"
                  style={{ background: ACCENT_STRONG }}
                >
                  EMPEZAR
                </button>
                {cameraError && <p className="text-amber-300 text-xs text-center">{cameraError}</p>}
                <button type="button" onClick={onClose} className="w-full py-3 label-caps text-xs text-white/70">
                  CANCELAR
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Entre pasadas */}
        {phase === 'between' && (
          <div className="absolute inset-0 bg-black/80 flex items-center justify-center px-5">
            <div className="w-full max-w-sm rounded-2xl bg-black/70 border border-white/15 p-6 text-center">
              <span className="material-symbols-outlined mb-2" style={{ fontSize: 40, color: ACCENT }}>check_circle</span>
              <p className="label-caps text-white mb-2">PASADA {passIndex + 1} COMPLETA</p>
              <p className="text-white/80 text-sm leading-snug mb-5">
                Ahora levanta el teléfono a la altura del hombro, inclinado un poco hacia abajo, y repite el
                recorrido desde el frente del auto.
              </p>
              <button
                type="button"
                onClick={nextPass}
                className="w-full py-3.5 rounded-xl label-caps font-bold text-white"
                style={{ background: ACCENT_STRONG }}
              >
                CONTINUAR
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Panel inferior */}
      <div
        className="shrink-0 bg-black px-4 pt-3"
        style={{ paddingBottom: 'max(1rem, env(safe-area-inset-bottom))' }}
      >
        <div className="w-full h-1.5 bg-white/15 rounded-full overflow-hidden mb-2.5">
          <div
            className="h-full rounded-full transition-all duration-300"
            style={{ width: `${(totalShots / totalTarget) * 100}%`, background: ACCENT }}
          />
        </div>
        <p className="text-white/70 text-xs leading-snug mb-3 text-center min-h-[2rem]">{pass.hint}</p>

        <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-3">
          <p className="label-caps text-[11px] text-white/60 min-w-0">
            {shots}/{SHOTS_PER_PASS} FOTOS
          </p>

          <button
            type="button"
            onClick={manualCapture}
            disabled={phase !== 'scan'}
            aria-label="Tomar foto"
            className="w-16 h-16 rounded-full border-4 flex items-center justify-center disabled:opacity-40"
            style={{ borderColor: auto ? 'rgba(255,255,255,0.35)' : ACCENT }}
          >
            <span
              className={`w-11 h-11 rounded-full flex items-center justify-center ${auto ? 'bg-white/20' : 'bg-white'}`}
            >
              {auto && <span className="material-symbols-outlined text-white text-xl animate-spin" style={{ animationDuration: '3s' }}>sync</span>}
            </span>
          </button>

          <div className="flex justify-end min-w-0">
            <button
              type="button"
              onClick={skipPass}
              disabled={phase !== 'scan'}
              className="px-3 py-2 border border-white/25 text-white/80 label-caps text-[11px] rounded-lg disabled:opacity-40 whitespace-nowrap"
            >
              {lastPass ? 'FINALIZAR' : 'SALTAR'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )

  return createPortal(overlay, document.body)
}

/** Vista desde arriba: el auto al centro, un punto por foto y tu posición actual. */
function Radar({ shots, angle, showMarker, intro }: { shots: number; angle: number; showMarker?: boolean; intro?: boolean }) {
  const R = 46
  const pos = (deg: number) => {
    const r = (deg * Math.PI) / 180
    return { x: 60 - R * Math.sin(r), y: 60 + R * Math.cos(r) }
  }
  const marker = pos(angle)

  return (
    <svg viewBox="0 0 120 120" className="w-full h-auto" style={{ minWidth: intro ? undefined : 112, width: intro ? undefined : 112 }}>
      <circle cx="60" cy="60" r="58" fill="rgba(0,0,0,0.55)" stroke="rgba(255,255,255,0.18)" />
      <circle cx="60" cy="60" r={R} fill="none" stroke="rgba(255,255,255,0.15)" strokeDasharray="2 4" />

      {/* Auto visto desde arriba, con el frente hacia ti (abajo) */}
      <g>
        <rect x="47" y="33" width="26" height="54" rx="10" fill="rgba(255,255,255,0.14)" stroke="rgba(255,255,255,0.55)" strokeWidth="1.5" />
        <path d="M51 74 Q60 79 69 74 L67 66 L53 66 Z" fill="rgba(180,197,255,0.5)" />
        <rect x="52" y="52" width="16" height="12" rx="3" fill="rgba(255,255,255,0.18)" />
        <path d="M52 44 Q60 41 68 44 L67 49 L53 49 Z" fill="rgba(180,197,255,0.3)" />
        <rect x="44" y="40" width="4" height="8" rx="1.5" fill="rgba(255,255,255,0.45)" />
        <rect x="72" y="40" width="4" height="8" rx="1.5" fill="rgba(255,255,255,0.45)" />
        <rect x="44" y="72" width="4" height="8" rx="1.5" fill="rgba(255,255,255,0.45)" />
        <rect x="72" y="72" width="4" height="8" rx="1.5" fill="rgba(255,255,255,0.45)" />
      </g>

      {/* Un punto por foto */}
      {Array.from({ length: SHOTS_PER_PASS }).map((_, i) => {
        const p = pos(i * STEP_DEG + STEP_DEG / 2)
        const done = i < shots
        const next = i === shots
        return (
          <circle
            key={i}
            cx={p.x}
            cy={p.y}
            r={next ? 3.6 : 2.8}
            fill={done ? ACCENT : next ? '#fff' : 'rgba(255,255,255,0.28)'}
            className={next && !intro ? 'animate-pulse' : undefined}
          />
        )
      })}

      {intro && (
        <>
          <path d="M60 106 A46 46 0 0 1 18 84" fill="none" stroke={ACCENT} strokeWidth="2.5" strokeLinecap="round" strokeDasharray="1 5" />
          <path d="M20 90 L16 82 L25 83 Z" fill={ACCENT} />
          <text x="60" y="118" textAnchor="middle" fontSize="8" fill="rgba(255,255,255,0.8)">TÚ AQUÍ</text>
        </>
      )}

      {showMarker && (
        <g transform={`translate(${marker.x} ${marker.y}) rotate(${angle})`}>
          <path d="M0 -14 L7 0 L-7 0 Z" fill={ACCENT} opacity="0.45" />
          <circle r="4.5" fill={ACCENT_STRONG} stroke="#fff" strokeWidth="1.5" />
        </g>
      )}
    </svg>
  )
}
