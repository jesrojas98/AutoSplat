import { useEffect, useRef } from 'react'

const COLORS_DARK: [number, number, number][] = [
  [37,  99,  235],
  [59,  130, 246],
  [6,   182, 212],
  [34,  211, 238],
  [99,  102, 241],
  [139, 92,  246],
  [96,  165, 250],
]

// Colores más oscuros y saturados para contrastar con fondo blanco
const COLORS_LIGHT: [number, number, number][] = [
  [29,  78,  216],
  [37,  99,  235],
  [3,   105, 161],
  [14,  116, 144],
  [67,  56,  202],
  [109, 40,  217],
  [30,  64,  175],
]

function getColors(): [number, number, number][] {
  return document.documentElement.classList.contains('light') ? COLORS_LIGHT : COLORS_DARK
}

type Dot = {
  x: number; y: number; vx: number; vy: number
  r: number; rgb: [number, number, number]; a: number
  life: number; maxLife: number
}

type Ring = {
  x: number; y: number; r: number; maxR: number
  age: number; maxAge: number; rgb: [number, number, number]
}

function spawnDot(W: number, H: number): Dot {
  return {
    x: W * (0.38 + Math.random() * 0.56),
    y: H * (0.08 + Math.random() * 0.84),
    vx: (Math.random() - 0.5) * 0.5,
    vy: -0.12 - Math.random() * 0.32,
    r: 1.2 + Math.random() * 2.8,
    rgb: getColors()[Math.floor(Math.random() * getColors().length)],
    a: 0.45 + Math.random() * 0.55,
    life: 0,
    maxLife: 180 + Math.random() * 280,
  }
}

function spawnRing(W: number, H: number): Ring {
  return {
    x: W * (0.58 + (Math.random() - 0.5) * 0.18),
    y: H * (0.44 + (Math.random() - 0.5) * 0.18),
    r: 10,
    maxR: 90 + Math.random() * 130,
    age: 0,
    maxAge: 80 + Math.random() * 70,
    rgb: getColors()[Math.floor(Math.random() * getColors().length)],
  }
}

export function HeroBackground3D() {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const el = canvas
    const ctx = canvas.getContext('2d')!

    const dots: Dot[] = []
    const rings: Ring[] = []
    let frameN = 0
    let raf: number

    function resize() {
      const dpr = window.devicePixelRatio || 1
      el.width = el.offsetWidth * dpr
      el.height = el.offsetHeight * dpr
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
    }
    resize()
    const ro = new ResizeObserver(resize)
    ro.observe(el)

    // Prepopulate dots
    const W0 = el.offsetWidth, H0 = el.offsetHeight
    for (let i = 0; i < 80; i++) {
      const d = spawnDot(W0, H0)
      d.life = Math.floor(Math.random() * d.maxLife)
      dots.push(d)
    }

    function frame() {
      frameN++
      const W = el.offsetWidth
      const H = el.offsetHeight
      ctx.clearRect(0, 0, W, H)

      if (frameN % 3 === 0 && dots.length < 130) dots.push(spawnDot(W, H))
      if (frameN % 55 === 0) rings.push(spawnRing(W, H))

      // Rings
      for (let i = rings.length - 1; i >= 0; i--) {
        const rg = rings[i]
        rg.age++
        rg.r = rg.maxR * (rg.age / rg.maxAge)
        const t = rg.age / rg.maxAge
        const a = (1 - t) * 0.28
        const [r, g, b] = rg.rgb
        ctx.beginPath()
        ctx.arc(rg.x, rg.y, rg.r, 0, Math.PI * 2)
        ctx.strokeStyle = `rgba(${r},${g},${b},${a})`
        ctx.lineWidth = 1.2
        ctx.stroke()
        if (rg.age >= rg.maxAge) rings.splice(i, 1)
      }

      // Dots
      for (let i = dots.length - 1; i >= 0; i--) {
        const d = dots[i]
        d.x += d.vx
        d.y += d.vy
        d.life++

        const t = d.life / d.maxLife
        const fadeIn = Math.min(t * 6, 1)
        const fadeOut = t > 0.65 ? 1 - (t - 0.65) / 0.35 : 1
        const alpha = d.a * fadeIn * fadeOut

        if (alpha > 0.015) {
          const [r, g, b] = d.rgb
          const br = d.r * 2.8
          const grad = ctx.createRadialGradient(d.x, d.y, 0, d.x, d.y, br)
          grad.addColorStop(0,   `rgba(${r},${g},${b},${alpha})`)
          grad.addColorStop(0.4, `rgba(${r},${g},${b},${alpha * 0.3})`)
          grad.addColorStop(1,   `rgba(${r},${g},${b},0)`)
          ctx.beginPath()
          ctx.arc(d.x, d.y, br, 0, Math.PI * 2)
          ctx.fillStyle = grad
          ctx.fill()
        }

        if (d.life >= d.maxLife) dots.splice(i, 1)
      }

      raf = requestAnimationFrame(frame)
    }

    frame()
    return () => { cancelAnimationFrame(raf); ro.disconnect() }
  }, [])

  return (
    <>
      <style>{`
        @keyframes gsFloat1 {
          0%,100% { transform: translate(0,0) scale(1); }
          33%      { transform: translate(-28px, 38px) scale(1.07); }
          66%      { transform: translate(20px, -25px) scale(0.93); }
        }
        @keyframes gsFloat2 {
          0%,100% { transform: translate(0,0) scale(1); }
          40%     { transform: translate(32px, -30px) scale(1.09); }
          75%     { transform: translate(-18px, 22px) scale(0.95); }
        }
        @keyframes gsFloat3 {
          0%,100% { transform: translate(0,0) scale(1); }
          50%     { transform: translate(-20px, 28px) scale(1.05); }
        }
        @keyframes gsFloat4 {
          0%,100% { transform: translate(0,0) scale(1); }
          50%     { transform: translate(22px, -32px) scale(0.91); }
        }
        @keyframes gsFloat5 {
          0%,100% { transform: translate(0,0) scale(1); }
          50%     { transform: translate(-12px, -20px) scale(1.06); }
        }
      `}</style>

      {/* Orbs CSS */}
      <div className="hero-bg-orb absolute inset-0 overflow-hidden pointer-events-none">

        {/* Orb principal — azul eléctrico */}
        <div style={{
          position: 'absolute', right: '6%', top: '18%',
          width: 520, height: 520, borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(37,99,235,0.50) 0%, rgba(59,130,246,0.22) 48%, transparent 70%)',
          filter: 'blur(48px)',
          animation: 'gsFloat1 9s ease-in-out infinite',
        }} />

        {/* Orb cyan superior */}
        <div style={{
          position: 'absolute', right: '22%', top: '3%',
          width: 360, height: 360, borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(6,182,212,0.45) 0%, transparent 68%)',
          filter: 'blur(42px)',
          animation: 'gsFloat2 12s ease-in-out infinite',
        }} />

        {/* Orb índigo derecha */}
        <div style={{
          position: 'absolute', right: '-4%', top: '42%',
          width: 400, height: 400, borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(99,102,241,0.42) 0%, transparent 68%)',
          filter: 'blur(52px)',
          animation: 'gsFloat3 8s ease-in-out infinite',
        }} />

        {/* Orb violeta inferior */}
        <div style={{
          position: 'absolute', right: '28%', top: '58%',
          width: 260, height: 260, borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(139,92,246,0.38) 0%, transparent 70%)',
          filter: 'blur(38px)',
          animation: 'gsFloat4 10s ease-in-out infinite',
        }} />

        {/* Orb cyan pequeño acento */}
        <div style={{
          position: 'absolute', right: '12%', top: '62%',
          width: 200, height: 200, borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(34,211,238,0.35) 0%, transparent 70%)',
          filter: 'blur(30px)',
          animation: 'gsFloat5 7s ease-in-out infinite',
        }} />

        {/* Halo de fondo grande — da profundidad */}
        <div style={{
          position: 'absolute', right: '-10%', top: '5%',
          width: 750, height: 750, borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(37,99,235,0.10) 0%, transparent 65%)',
          filter: 'blur(80px)',
          animation: 'gsFloat1 15s ease-in-out infinite reverse',
        }} />
      </div>

      {/* Canvas partículas + rings */}
      <canvas
        ref={canvasRef}
        className="hero-bg-canvas absolute inset-0 w-full h-full pointer-events-none"
      />
    </>
  )
}
