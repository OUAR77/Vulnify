import { useEffect, useRef } from 'react'
import { gsap } from 'gsap'
import { motion } from 'framer-motion'

const FloatingPaths = ({ position = 1, opacity = 0.5 }: { position?: number; opacity?: number }) => {
  const paths = Array.from({ length: 36 }, (_, i) => ({
    id: i,
    d: `M-${380 - i * 5 * position} -${189 + i * 6}C-${380 - i * 5 * position} -${189 + i * 6} -${312 - i * 5 * position} ${216 - i * 6} ${152 - i * 5 * position} ${343 - i * 6}C${616 - i * 5 * position} ${470 - i * 6} ${684 - i * 5 * position} ${875 - i * 6} ${684 - i * 5 * position} ${875 - i * 6}`,
    width: 0.5 + i * 0.03,
  }))
  return (
    <div className="absolute inset-0 pointer-events-none" style={{ opacity }}>
      <svg className="w-full h-full text-white/20" viewBox="0 0 696 316" fill="none" preserveAspectRatio="none">
        <title>Background Paths</title>
        {paths.map((path) => (
          <motion.path
            key={path.id}
            d={path.d}
            stroke="currentColor"
            strokeWidth={path.width}
            strokeOpacity={0.04 + path.id * 0.008}
            initial={{ pathLength: 0.3, opacity: 0.4 }}
            animate={{
              pathLength: 1,
              opacity: [0.2, 0.6, 0.2],
              pathOffset: [0, 1, 0],
            }}
            transition={{
              duration: 20 + Math.random() * 15,
              repeat: Number.POSITIVE_INFINITY,
              ease: 'linear',
            }}
          />
        ))}
      </svg>
    </div>
  )
}

export function ArtificialHero() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const grainCanvasRef = useRef<HTMLCanvasElement>(null)
  const frameRef = useRef(0)
  const timeRef = useRef(0)

  useEffect(() => {
    const canvas = canvasRef.current
    const grainCanvas = grainCanvasRef.current
    if (!canvas || !grainCanvas) return
    const ctx = canvas.getContext('2d')
    const grainCtx = grainCanvas.getContext('2d')
    if (!ctx || !grainCtx) return

    const cvs: HTMLCanvasElement = canvas
    const gCvs: HTMLCanvasElement = grainCanvas
    const c: CanvasRenderingContext2D = ctx
    const gC: CanvasRenderingContext2D = grainCtx

    const density = ' .:-=+*#%@'

    const params = {
      rotation: 0,
      brightness: 0,
      glitchIntensity: 0,
    }

    gsap.to(params, {
      rotation: Math.PI * 2,
      duration: 20,
      repeat: -1,
      ease: 'none',
    })

    gsap.to(params, {
      brightness: 1,
      duration: 6,
      repeat: -1,
      yoyo: true,
      ease: 'sine.inOut',
    })

    gsap.to(params, {
      glitchIntensity: 1,
      duration: 0.1,
      repeat: -1,
      yoyo: true,
      ease: 'power2.inOut',
      repeatDelay: (() => Math.random() * 3 + 1) as unknown as number,
    })

    const generateFilmGrain = (width: number, height: number, intensity = 0.15) => {
      const imageData = gC.createImageData(width, height)
      const data = imageData.data
      for (let i = 0; i < data.length; i += 4) {
        const grain = (Math.random() - 0.5) * intensity * 255
        data[i] = Math.max(0, Math.min(255, 128 + grain))
        data[i + 1] = Math.max(0, Math.min(255, 128 + grain))
        data[i + 2] = Math.max(0, Math.min(255, 128 + grain))
        data[i + 3] = Math.abs(grain) * 3
      }
      return imageData
    }

    const drawGlitchedOrb = (cx: number, cy: number, r: number, bright: number, glitch: number) => {
      c.save()

      const shouldGlitch = Math.random() < 0.1 && glitch > 0.5
      const glitchOffset = shouldGlitch ? (Math.random() - 0.5) * 20 * glitch : 0
      const glitchScale = shouldGlitch ? 1 + (Math.random() - 0.5) * 0.3 * glitch : 1

      if (shouldGlitch) {
        c.translate(glitchOffset, glitchOffset * 0.8)
        c.scale(glitchScale, 1 / glitchScale)
      }

      const orbGradient = c.createRadialGradient(cx, cy, 0, cx, cy, r * 1.5)
      const a = 0.5 + bright * 0.4
      orbGradient.addColorStop(0, `rgba(255, 255, 255, ${0.8 * a})`)
      orbGradient.addColorStop(0.2, `rgba(220, 220, 220, ${0.5 * a})`)
      orbGradient.addColorStop(0.5, `rgba(160, 160, 160, ${0.25 * a})`)
      orbGradient.addColorStop(1, 'rgba(0, 0, 0, 0)')
      c.fillStyle = orbGradient
      c.fillRect(0, 0, cvs.width, cvs.height)

      const centerR = r * 0.3
      c.fillStyle = `rgba(255, 255, 255, ${0.6 * a})`
      c.beginPath()
      c.arc(cx, cy, centerR, 0, Math.PI * 2)
      c.fill()

      if (shouldGlitch) {
        c.globalCompositeOperation = 'screen'

        c.fillStyle = `rgba(255, 255, 255, ${0.3 * glitch})`
        c.beginPath()
        c.arc(cx + glitchOffset * 0.5, cy, centerR, 0, Math.PI * 2)
        c.fill()

        c.fillStyle = `rgba(200, 200, 255, ${0.25 * glitch})`
        c.beginPath()
        c.arc(cx - glitchOffset * 0.5, cy, centerR, 0, Math.PI * 2)
        c.fill()

        c.globalCompositeOperation = 'source-over'

        c.strokeStyle = `rgba(255, 255, 255, ${0.5 * glitch})`
        c.lineWidth = 1
        for (let i = 0; i < 5; i++) {
          const y = cy - r + Math.random() * r * 2
          c.beginPath()
          c.moveTo(cx - r + Math.random() * 20, y)
          c.lineTo(cx + r - Math.random() * 20, y)
          c.stroke()
        }

        c.fillStyle = `rgba(200, 200, 200, ${0.3 * glitch})`
        for (let i = 0; i < 3; i++) {
          const bx = cx - r + Math.random() * r * 2
          const by = cy - r + Math.random() * r * 2
          c.fillRect(bx, by, Math.random() * 10 + 2, Math.random() * 10 + 2)
        }
      }

      c.strokeStyle = `rgba(255, 255, 255, ${0.3 + 0.2 * a})`
      c.lineWidth = 2

      if (shouldGlitch) {
        const segments = 8
        for (let i = 0; i < segments; i++) {
          const startAngle = (i / segments) * Math.PI * 2
          const endAngle = ((i + 1) / segments) * Math.PI * 2
          const ringR = r * 1.2 + (Math.random() - 0.5) * 10 * glitch
          c.beginPath()
          c.arc(cx, cy, ringR, startAngle, endAngle)
          c.stroke()
        }
      } else {
        c.beginPath()
        c.arc(cx, cy, r * 1.2, 0, Math.PI * 2)
        c.stroke()
      }

      if (shouldGlitch && Math.random() < 0.3) {
        c.globalCompositeOperation = 'difference'
        c.fillStyle = `rgba(255, 255, 255, ${0.6 * glitch})`
        for (let i = 0; i < 3; i++) {
          const barY = cy - r + Math.random() * r * 2
          c.fillRect(cx - r, barY, r * 2, Math.random() * 5 + 1)
        }
        c.globalCompositeOperation = 'source-over'
      }

      c.restore()
    }

    function render() {
      timeRef.current += 0.016
      const time = timeRef.current

      const width = cvs.width = gCvs.width = window.innerWidth
      const height = cvs.height = gCvs.height = window.innerHeight

      c.fillStyle = '#000'
      c.fillRect(0, 0, width, height)

      const cx = width / 2
      const cy = height / 2
      const r = Math.min(width, height) * 0.2
      const bright = 0.5 + params.brightness * 0.5

      const bgGradient = c.createRadialGradient(cx, cy - 50, 0, cx, cy, Math.max(width, height) * 0.8)
      bgGradient.addColorStop(0, `rgba(255, 255, 255, ${0.2 * bright})`)
      bgGradient.addColorStop(0.3, `rgba(200, 200, 200, ${0.12 * bright})`)
      bgGradient.addColorStop(0.6, `rgba(100, 100, 100, ${0.08 * bright})`)
      bgGradient.addColorStop(1, 'rgba(0, 0, 0, 0.95)')
      c.fillStyle = bgGradient
      c.fillRect(0, 0, width, height)

      drawGlitchedOrb(cx, cy, r, bright, params.glitchIntensity)

      c.font = '10px "JetBrains Mono", monospace'
      c.textAlign = 'center'
      c.textBaseline = 'middle'

      const spacing = 9
      const cols = Math.floor(width / spacing)
      const rows = Math.floor(height / spacing)

      for (let i = 0; i < Math.min(cols, 150); i++) {
        for (let j = 0; j < Math.min(rows, 100); j++) {
          const x = (i - cols / 2) * spacing + cx
          const y = (j - rows / 2) * spacing + cy
          const dx = x - cx
          const dy = y - cy
          const dist = Math.sqrt(dx * dx + dy * dy)

          if (dist < r && Math.random() > 0.4) {
            const z = Math.sqrt(Math.max(0, r * r - dx * dx - dy * dy))
            const angle = params.rotation
            const rotZ = dx * Math.sin(angle) + z * Math.cos(angle)
            const brightness = (rotZ + r) / (r * 2)

            if (rotZ > -r * 0.3) {
              let char = density[Math.floor(brightness * (density.length - 1))]
              if (dist < r * 0.8 && params.glitchIntensity > 0.8 && Math.random() < 0.3) {
                const glitchChars = ['█', '▓', '▒', '░', '▄', '▀', '■', '□']
                char = glitchChars[Math.floor(Math.random() * glitchChars.length)]
              }
              c.fillStyle = `rgba(255, 255, 255, ${Math.max(0.2, brightness * bright)})`
              c.fillText(char, x, y)
            }
          }
        }
      }

      gC.clearRect(0, 0, width, height)
      const grainIntensity = 0.22 + Math.sin(time * 10) * 0.03
      const grainImageData = generateFilmGrain(width, height, grainIntensity)
      gC.putImageData(grainImageData, 0, 0)

      if (params.glitchIntensity > 0.5) {
        gC.globalCompositeOperation = 'screen'
        for (let i = 0; i < 200; i++) {
          const gx = Math.random() * width
          const gy = Math.random() * height
          const gs = Math.random() * 3 + 0.5
          gC.fillStyle = `rgba(255, 255, 255, ${Math.random() * 0.5 * params.glitchIntensity})`
          gC.beginPath()
          gC.arc(gx, gy, gs, 0, Math.PI * 2)
          gC.fill()
        }
      }

      gC.globalCompositeOperation = 'screen'
      for (let i = 0; i < 100; i++) {
        const gx = Math.random() * width
        const gy = Math.random() * height
        const gs = Math.random() * 2 + 0.5
        gC.fillStyle = `rgba(255, 255, 255, ${Math.random() * 0.3})`
        gC.beginPath()
        gC.arc(gx, gy, gs, 0, Math.PI * 2)
        gC.fill()
      }

      gC.globalCompositeOperation = 'multiply'
      for (let i = 0; i < 50; i++) {
        const gx = Math.random() * width
        const gy = Math.random() * height
        const gs = Math.random() * 1.5 + 0.5
        gC.fillStyle = `rgba(0, 0, 0, ${Math.random() * 0.5 + 0.5})`
        gC.beginPath()
        gC.arc(gx, gy, gs, 0, Math.PI * 2)
        gC.fill()
      }

      frameRef.current = requestAnimationFrame(render)
    }

    render()

    return () => {
      if (frameRef.current) cancelAnimationFrame(frameRef.current)
    }
  }, [])

  return (
    <>
      <div className="fixed inset-0 z-0 pointer-events-none" style={{ background: 'radial-gradient(ellipse 80% 50% at 50% -20%, rgba(255,255,255,0.03), rgba(255,255,255,0))' }} />
      <div className="fixed inset-0 z-0 pointer-events-none">
        <FloatingPaths position={1} opacity={0.4} />
        <FloatingPaths position={-1} opacity={0.4} />
      </div>
      <canvas
        ref={canvasRef}
        className="fixed inset-0 z-0 w-full h-full"
        style={{ background: '#000' }}
      />
      <canvas
        ref={grainCanvasRef}
        className="fixed inset-0 z-0 w-full h-full pointer-events-none"
        style={{ mixBlendMode: 'overlay', opacity: 0.6 }}
      />
    </>
  )
}
