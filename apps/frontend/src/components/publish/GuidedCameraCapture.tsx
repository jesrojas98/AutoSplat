import { useEffect, useRef, useState, useCallback } from 'react'

interface Props {
  onCapture: (files: File[]) => void
  onClose: () => void
}

type Pass = 'low' | 'mid' | 'high'

const PASSES: { id: Pass; label: string; hint: string }[] = [
  { id: 'mid', label: 'Pasada 1 de 2 — altura cintura', hint: 'Mantén el teléfono a la altura de la cintura, apuntando al centro del auto.' }
  , { id: 'high', label: 'Pasada 2 de 2 — altura hombro', hint: 'Ahora levanta el teléfono a la altura del hombro, mismo recorrido.' }
]

const SHOTS_PER_PASS = 24
const DEGREES_PER_SHOT = 360 / SHOTS_PER_PASS
const CAPTURE_DEBOUNCE_MS = 450

export function GuidedCameraCapture({ onCapture, onClose }: Props) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const streamRef = useRef<MediaStream | null>(null)

  const [passIndex, setPassIndex] = useState(0)
  const [shotsInPass, setShotsInPass] = useState(0)
  const [capturedFiles, setCapturedFiles] = useState<File[]>([])
  const [cameraError, setCameraError] = useState<string | null>(null)
  const [needsOrientationPermission, setNeedsOrientationPermission] = useState(false)
  const [orientationActive, setOrientationActive] = useState(false)
  const [currentHeading, setCurrentHeading] = useState<number | null>(null)
  const [flash, setFlash] = useState(false)

  const baseHeadingRef = useRef<number | null>(null)
  const lastCaptureHeadingRef = useRef<number>(0)
  const lastCaptureTimeRef = useRef<number>(0)
  const shotsInPassRef = useRef(0)
  const passIndexRef = useRef(0)

  const currentPass = PASSES[passIndex]
  const totalShots = capturedFiles.length
  const totalTarget = SHOTS_PER_PASS * PASSES.length

  // ---- Cámara ----
  useEffect(() => {
    let cancelled = false
    async function startCamera() {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: { ideal: 'environment' }, width: { ideal: 1280 }, height: { ideal: 720 } },
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

  // ---- Giroscopio / brújula ----
  useEffect(() => {
    const DOE = window.DeviceOrientationEvent as unknown as {
      requestPermission?: () => Promise<'granted' | 'denied'>
    }
    if (DOE && typeof DOE.requestPermission === 'function') {
      setNeedsOrientationPermission(true)
      return
    }
    attachOrientationListener()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  function attachOrientationListener() {
    function handleOrientation(e: DeviceOrientationEvent) {
      const heading = (e as DeviceOrientationEvent & { webkitCompassHeading?: number }).webkitCompassHeading
      const raw = typeof heading === 'number' ? heading : e.alpha
      if (raw === null || raw === undefined) return
      if (baseHeadingRef.current === null) baseHeadingRef.current = raw
      let delta = raw - baseHeadingRef.current
      delta = ((delta % 360) + 360) % 360
      setCurrentHeading(delta)
    }
    window.addEventListener('deviceorientation', handleOrientation, true)
    setOrientationActive(true)
  }

  async function requestOrientationPermission() {
    const DOE = window.DeviceOrientationEvent as unknown as {
      requestPermission?: () => Promise<'granted' | 'denied'>
    }
    try {
      const result = await DOE.requestPermission?.()
      if (result === 'granted') {
        setNeedsOrientationPermission(false)
        attachOrientationListener()
      } else {
        setCameraError('Sin acceso al giroscopio no podemos medir tu giro automáticamente. Puedes seguir tomando fotos manualmente.')
        setNeedsOrientationPermission(false)
      }
    } catch {
      setNeedsOrientationPermission(false)
    }
  }

  useEffect(() => { shotsInPassRef.current = shotsInPass }, [shotsInPass])
  useEffect(() => { passIndexRef.current = passIndex }, [passIndex])

  const captureFrame = useCallback(() => {
    const video = videoRef.current
    const canvas = canvasRef.current
    if (!video || !canvas || video.videoWidth === 0) return

    canvas.width = video.videoWidth
    canvas.height = video.videoHeight
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height)

    canvas.toBlob((blob) => {
      if (!blob) return
      const pass = PASSES[passIndexRef.current]
      const shot = shotsInPassRef.current
      const file = new File([blob], `guided-${pass.id}-${String(shot).padStart(2, '0')}.jpg`, { type: 'image/jpeg' })
      setCapturedFiles((prev) => [...prev, file])
      setFlash(true)
      setTimeout(() => setFlash(false), 120)

      const nextShot = shot + 1
      if (nextShot >= SHOTS_PER_PASS) {
        if (passIndexRef.current + 1 < PASSES.length) {
          setPassIndex((p) => p + 1)
          setShotsInPass(0)
          baseHeadingRef.current = null
          lastCaptureHeadingRef.current = 0
        } else {
          finish()
        }
      } else {
        setShotsInPass(nextShot)
      }
    }, 'image/jpeg', 0.88)
  }, [])

  // auto-dispara cuando el giro acumulado supera el umbral de grados por foto
  useEffect(() => {
    if (currentHeading === null) return
    const now = Date.now()
    if (now - lastCaptureTimeRef.current < CAPTURE_DEBOUNCE_MS) return

    const target = (shotsInPassRef.current + 1) * DEGREES_PER_SHOT
    const prevTarget = shotsInPassRef.current * DEGREES_PER_SHOT
    // dispara si cruzamos el siguiente umbral angular (maneja wraparound 360->0 porque heading ya es delta 0-360 creciente)
    if (currentHeading >= target && currentHeading < target + DEGREES_PER_SHOT * 1.5 && currentHeading > prevTarget) {
      lastCaptureTimeRef.current = now
      captureFrame()
    }
  }, [currentHeading, captureFrame])

  function manualCapture() {
    lastCaptureTimeRef.current = Date.now()
    captureFrame()
  }

  function finish() {
    streamRef.current?.getTracks().forEach((t) => t.stop())
    onCapture(capturedFiles)
  }

  function skipPass() {
    if (passIndex + 1 < PASSES.length) {
      setPassIndex((p) => p + 1)
      setShotsInPass(0)
      baseHeadingRef.current = null
    } else {
      finish()
    }
  }

  const progressInPass = (shotsInPass / SHOTS_PER_PASS) * 100
  const overallProgress = (totalShots / totalTarget) * 100
  const headingDeg = currentHeading ?? 0

  return (
    <div className="fixed inset-0 z-50 bg-black flex flex-col">
      {/* Video feed */}
      <div className="relative flex-1 overflow-hidden">
        <video
          ref={videoRef}
          playsInline
          muted
          className="absolute inset-0 w-full h-full object-cover"
        />
        <canvas ref={canvasRef} className="hidden" />

        {/* Flash de captura */}
        {flash && <div className="absolute inset-0 bg-white animate-[fadeOut_120ms_ease-out]" />}

        {cameraError && (
          <div className="absolute inset-0 flex items-center justify-center p-8 bg-black/80">
            <p className="text-white text-center text-sm max-w-xs">{cameraError}</p>
          </div>
        )}

        {/* Overlay: silueta guía del auto */}
        <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
          <svg viewBox="0 0 400 220" className="w-[82%] max-w-md opacity-50" style={{ filter: 'drop-shadow(0 0 2px rgba(0,0,0,0.6))' }}>
            <path
              d="M40 160 Q40 120 80 110 L110 70 Q130 50 170 48 L250 48 Q280 50 300 72 L330 110 Q365 118 365 150 L365 170 L340 170 Q340 150 320 150 Q300 150 300 170 L120 170 Q120 150 100 150 Q80 150 80 170 L40 170 Z"
              fill="none"
              stroke="var(--color-primary, #9c77e8)"
              strokeWidth="3"
              strokeDasharray="8 6"
            />
            <circle cx="100" cy="170" r="20" fill="none" stroke="var(--color-primary, #9c77e8)" strokeWidth="3" strokeDasharray="4 4" />
            <circle cx="320" cy="170" r="20" fill="none" stroke="var(--color-primary, #9c77e8)" strokeWidth="3" strokeDasharray="4 4" />
          </svg>
        </div>

        {/* Barra de giro (brújula horizontal) */}
        {orientationActive && (
          <div className="absolute top-20 left-1/2 -translate-x-1/2 w-[86%] max-w-sm pointer-events-none">
            <div className="relative h-2 rounded-full bg-white/20 overflow-hidden">
              <div
                className="absolute top-0 left-0 h-full rounded-full bg-[var(--color-primary,#9c77e8)] transition-all duration-150"
                style={{ width: `${Math.min(100, (headingDeg / 360) * 100)}%` }}
              />
              {Array.from({ length: SHOTS_PER_PASS }).map((_, i) => (
                <div
                  key={i}
                  className={`absolute top-0 h-full w-[2px] ${i < shotsInPass ? 'bg-white' : 'bg-white/30'}`}
                  style={{ left: `${(i / SHOTS_PER_PASS) * 100}%` }}
                />
              ))}
            </div>
            <p className="text-center text-white/80 text-[11px] mt-1.5 label-caps">
              GIRO {Math.round(headingDeg)}° / 360°
            </p>
          </div>
        )}

        {/* Permiso de giroscopio (iOS) */}
        {needsOrientationPermission && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/85 p-8">
            <div className="glass-panel rounded-xl p-6 max-w-xs text-center">
              <span className="material-symbols-outlined text-[var(--color-primary)] mb-3" style={{ fontSize: 36 }}>explore</span>
              <p className="text-white text-sm mb-4">
                Necesitamos acceso al giroscopio para medir tu giro alrededor del auto y tomar las fotos automáticamente.
              </p>
              <button
                type="button"
                onClick={requestOrientationPermission}
                className="glow-primary w-full px-6 py-3 bg-[var(--color-primary-container)] text-[var(--color-on-primary-container)] label-caps font-bold rounded-lg"
              >
                PERMITIR
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Panel inferior: progreso + instrucciones */}
      <div className="bg-black/90 backdrop-blur px-5 pt-4 pb-6 safe-bottom">
        <div className="flex items-center justify-between mb-1.5">
          <span className="label-caps text-white text-xs">{currentPass.label}</span>
          <span className="label-caps text-[var(--color-primary)] text-xs font-bold">{totalShots} / {totalTarget}</span>
        </div>
        <div className="w-full h-1.5 bg-white/15 rounded-full overflow-hidden mb-1.5">
          <div
            className="h-full bg-[var(--color-primary,#9c77e8)] rounded-full transition-all duration-300"
            style={{ width: `${overallProgress}%` }}
          />
        </div>
        <div className="w-full h-1 bg-white/10 rounded-full overflow-hidden mb-3">
          <div
            className="h-full bg-white/50 rounded-full transition-all duration-150"
            style={{ width: `${progressInPass}%` }}
          />
        </div>

        <p className="text-white/70 text-xs mb-4 leading-snug">{currentPass.hint}</p>

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-3 border border-white/20 text-white label-caps text-xs rounded-lg"
          >
            CANCELAR
          </button>

          {!orientationActive && (
            <button
              type="button"
              onClick={manualCapture}
              className="flex-1 glow-primary py-3 bg-[var(--color-primary-container)] text-[var(--color-on-primary-container)] label-caps font-bold text-xs rounded-lg flex items-center justify-center gap-2"
            >
              <span className="material-symbols-outlined text-base">photo_camera</span>
              TOMAR FOTO ({shotsInPass}/{SHOTS_PER_PASS})
            </button>
          )}

          {orientationActive && (
            <div className="flex-1 flex items-center justify-center gap-2 py-3 text-white/60 label-caps text-xs">
              <span className="material-symbols-outlined text-base animate-pulse" style={{ color: 'var(--color-primary, #9c77e8)' }}>sync</span>
              GIRA LENTO — CAPTURA AUTOMÁTICA
            </div>
          )}

          <button
            type="button"
            onClick={skipPass}
            className="px-5 py-3 border border-white/20 text-white/70 label-caps text-xs rounded-lg"
          >
            {passIndex + 1 < PASSES.length ? 'SIGUIENTE PASADA' : 'FINALIZAR'}
          </button>
        </div>
      </div>
    </div>
  )
}
