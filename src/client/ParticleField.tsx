import { useEffect, useRef } from 'react'
import type { ReactElement } from 'react'

type ParticleColor = readonly [number, number, number]
type Palette = readonly [ParticleColor, ParticleColor, ParticleColor]

interface Particle {
  x: number
  y: number
  phase: number
  size: number
  seed: number
}

interface PointerState {
  x: number
  y: number
  active: boolean
}

const LIGHT_PALETTE: Palette = [
  [103, 124, 139],
  [174, 132, 59],
  [48, 43, 37],
]

const DARK_PALETTE: Palette = [
  [198, 207, 211],
  [201, 162, 84],
  [72, 94, 143],
]

/** Return a stable pseudo-random value in the range [0, 1). */
function random(seed: number): number {
  const value = Math.sin(seed * 12.9898 + 78.233) * 43758.5453
  return value - Math.floor(value)
}

/** Return a cheap, repeatable noise value for the Canvas fallback. */
function noise(x: number, y: number, time: number, seed: number): number {
  const broad = Math.sin(x * 12.9898 + y * 78.233 + time * 1.71 + seed)
  const fine = Math.sin(x * 41.17 - y * 17.31 + time * 3.19 + seed * 2.7)
  return broad * 0.68 + fine * 0.32
}

/** Return a low-frequency color field similar to the reference shader's simplex noise. */
function colorNoise(x: number, y: number, time: number): number {
  const broad = Math.sin(x * 1.3 + y * 1.7 + time * 0.5 + 74.664)
  const detail = Math.sin(x * 3.2 - y * 2.4 + time * 0.5 + 91.556)
  return broad * 0.68 + detail * 0.32
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value))
}

function smoothstep(edge0: number, edge1: number, value: number): number {
  const range = edge1 - edge0
  const normalized = range === 0 ? 0 : clamp((value - edge0) / range, 0, 1)
  return normalized * normalized * (3 - 2 * normalized)
}

function mixColor(first: ParticleColor, second: ParticleColor, amount: number): ParticleColor {
  const progress = clamp(amount, 0, 1)
  return [
    first[0] + (second[0] - first[0]) * progress,
    first[1] + (second[1] - first[1]) * progress,
    first[2] + (second[2] - first[2]) * progress,
  ]
}

/** Build Poisson-like points so the field keeps the reference's even spacing. */
function createParticles(count: number): Particle[] {
  const minDistance = clamp(Math.sqrt(1.15 / count), 0.026, 0.065)
  const cellSize = minDistance / Math.SQRT2
  const gridWidth = Math.ceil(2 / cellSize)
  const gridHeight = gridWidth
  const grid = new Int32Array(gridWidth * gridHeight).fill(-1)
  const particles: Particle[] = []
  let seed = 1
  let attempts = 0

  while (particles.length < count && attempts < count * 140) {
    attempts += 1
    const x = random(seed++) * 2 - 1
    const y = random(seed++) * 2 - 1
    const gridX = clamp(Math.floor((x + 1) / cellSize), 0, gridWidth - 1)
    const gridY = clamp(Math.floor((y + 1) / cellSize), 0, gridHeight - 1)
    let valid = true

    for (let offsetY = -2; offsetY <= 2 && valid; offsetY += 1) {
      for (let offsetX = -2; offsetX <= 2; offsetX += 1) {
        const neighborX = gridX + offsetX
        const neighborY = gridY + offsetY
        if (neighborX < 0 || neighborX >= gridWidth || neighborY < 0 || neighborY >= gridHeight) continue
        const neighbor = grid[neighborY * gridWidth + neighborX]
        if (neighbor === undefined || neighbor < 0) continue
        const existing = particles[neighbor]
        if (existing === undefined) continue
        if (Math.hypot(existing.x - x, existing.y - y) < minDistance) {
          valid = false
          break
        }
      }
    }

    if (!valid) continue
    grid[gridY * gridWidth + gridX] = particles.length
    particles.push({
      x,
      y,
      phase: random(seed++) * Math.PI * 2,
      size: 0.5 + random(seed++) * 0.9,
      seed: random(seed++),
    })
  }

  // Keep the field populated on unusually small canvases where the spacing
  // constraint can exhaust its candidate budget before reaching the target.
  for (let index = particles.length; index < count; index += 1) {
    const angle = index * 2.399963229728653
    const radius = Math.sqrt(random(index + 3001))
    particles.push({
      x: Math.cos(angle) * radius,
      y: Math.sin(angle) * radius,
      phase: random(index + 4001) * Math.PI * 2,
      size: 0.5 + random(index + 5001) * 0.9,
      seed: random(index + 6001),
    })
  }

  return particles
}

function drawCapsule(
  context: CanvasRenderingContext2D,
  x: number,
  y: number,
  length: number,
  thickness: number,
  angle: number,
): void {
  const radius = thickness / 2
  const halfLength = Math.max(0, length / 2 - radius)
  context.save()
  context.translate(x, y)
  context.rotate(angle)
  context.beginPath()
  context.moveTo(-halfLength, -radius)
  context.lineTo(halfLength, -radius)
  context.arc(halfLength, 0, radius, -Math.PI / 2, Math.PI / 2)
  context.lineTo(-halfLength, radius)
  context.arc(-halfLength, 0, radius, Math.PI / 2, Math.PI * 1.5)
  context.closePath()
  context.fill()
  context.restore()
}

function colorForParticle(particle: Particle, palette: Palette, time: number): ParticleColor {
  const value = (colorNoise(particle.x, particle.y, time) + 1) * 0.5
  const progress = smoothstep(0, 0.75, value * value)
  if (progress < 0.8) return mixColor(palette[0], palette[1], progress / 0.8)
  return mixColor(palette[1], palette[2], (progress - 0.8) / 0.2)
}

/**
 * Canvas approximation of the Antigravity landing-page particle renderer.
 *
 * Particles use Poisson-like spacing, rounded dash geometry, multi-scale
 * noise, and an invisible displacement ring. The renderer has no application
 * state, does not intercept pointer input, and stops when motion is reduced
 * or the document is hidden.
 * @returns An aria-hidden canvas layer.
 */
export function ParticleField(): ReactElement {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (canvas === null) return
    const host = canvas.parentElement
    if (host === null) return
    if (typeof CanvasRenderingContext2D === 'undefined') return

    let context: CanvasRenderingContext2D | null
    try {
      context = canvas.getContext('2d', { alpha: true })
    } catch {
      return
    }
    if (context === null) return

    const motionQuery = typeof window.matchMedia === 'function'
      ? window.matchMedia('(prefers-reduced-motion: reduce)')
      : undefined
    let reducedMotion = motionQuery?.matches ?? false
    let visible = document.visibilityState === 'visible'
    let frameId: number | null = null
    let width = 1
    let height = 1
    let originX = 0
    let originY = 0
    let pixelRatio = 1
    let particles: Particle[] = []
    const targetPointer: PointerState = { x: 0, y: 0, active: false }
    const pointer: PointerState = { x: 0, y: 0, active: false }
    const ring = { x: 0, y: 0 }

    const resize = (): void => {
      const rect = host.getBoundingClientRect()
      originX = rect.left
      originY = rect.top
      width = Math.max(1, rect.width)
      height = Math.max(1, rect.height)
      pixelRatio = Math.min(window.devicePixelRatio || 1, 1.5)
      canvas.width = Math.max(1, Math.floor(width * pixelRatio))
      canvas.height = Math.max(1, Math.floor(height * pixelRatio))
      context.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0)
      const area = width * height
      const count = width < 700
        ? 160
        : clamp(Math.round(area / 3600), 260, 440)
      particles = createParticles(count)
      draw(0)
    }

    const draw = (time: number): void => {
      context.clearRect(0, 0, width, height)
      const motionTime = time * 0.6
      const palette = document.body.hasAttribute('data-ds-dark-theme')
        ? DARK_PALETTE
        : LIGHT_PALETTE

      if (!reducedMotion && pointer.active) {
        pointer.x += (targetPointer.x - pointer.x) * 0.12
        pointer.y += (targetPointer.y - pointer.y) * 0.12
      } else {
        pointer.x = targetPointer.x
        pointer.y = targetPointer.y
      }

      const naturalX = noise(0.1, 0.4, motionTime * 0.66, 94.234) * 0.2
      const naturalY = noise(0.4, 0.1, motionTime * 0.75, 21.028) * 0.1
      const ringTargetX = pointer.active ? pointer.x * 0.175 + naturalX * 0.1 : naturalX
      const ringTargetY = pointer.active ? pointer.y * 0.175 + naturalY * 0.1 : naturalY
      const ringFollow = pointer.active ? 0.02 : 0.01
      ring.x += (ringTargetX - ring.x) * (reducedMotion ? 1 : ringFollow)
      ring.y += (ringTargetY - ring.y) * (reducedMotion ? 1 : ringFollow)

      const ringRadius = 0.175 + Math.sin(motionTime) * 0.03 + Math.cos(motionTime * 3) * 0.02
      const ringWidth = 0.15
      const ringWidth2 = 0.05
      const ringDisplacement = 0.22
      const sizeFactor = width / 2000 * 0.75

      for (const particle of particles) {
        const currentX = particle.x
        const currentY = particle.y
        const distance = Math.hypot(currentX - ring.x, currentY - ring.y)
        const ringNoise = noise(currentX * 0.2, currentY * 0.2, motionTime * 0.5, 18.4924) * 0.005
        const distanceWithNoise = Math.hypot(currentX + ringNoise - ring.x, currentY + ringNoise - ring.y)

        let ringBand = smoothstep(ringRadius - ringWidth * 2, ringRadius, distance)
          - smoothstep(ringRadius, ringRadius + ringWidth, distanceWithNoise)
        let ringBand2 = smoothstep(ringRadius - ringWidth2 * 2, ringRadius, distance)
          - smoothstep(ringRadius, ringRadius + ringWidth2, distanceWithNoise)
        const innerBand = smoothstep(ringRadius + ringWidth2, ringRadius, distance)
        ringBand = Math.pow(ringBand, 2)
        ringBand2 = Math.max(0, Math.pow(ringBand2, 3))

        const noise1 = noise(currentX * 4, currentY * 4, motionTime * 0.35, 88.494)
        const noise2 = noise(currentX * 4, currentY * 4, motionTime * 0.35, 50.904)
        const noise3 = noise(currentX * 20, currentY * 20, motionTime * 0.5, 18.4924)
        const noise4 = noise(currentX * 20, currentY * 20, motionTime * 0.5, 50.904)
        let displacementX = noise1 * 0.03 + noise3 * 0.005
        let displacementY = noise2 * 0.03 + noise4 * 0.005
        displacementX += Math.sin(currentX * 20 + motionTime * 4) * 0.02 * clamp(distance, 0, 1)
        displacementY += Math.cos(currentY * 20 + motionTime * 3) * 0.02 * clamp(distance, 0, 1)

        const baseX = currentX * 0.8
        const baseY = currentY * 0.8
        const influence = Math.pow(ringBand2, 0.75) * ringDisplacement
        const displacedX = currentX + displacementX + baseX * 0.25
          + (currentX + displacementX - ring.x) * influence
        const displacedY = currentY + displacementY + baseY * 0.25
          + (currentY + displacementY - ring.y) * influence

        const localNoise = noise(currentX * 2, currentY * 2, motionTime * 0.5, 18.4924)
        const ringScaleNoise = noise(currentX * 30 + 11.4924, currentY * 30 + 12.9744, motionTime * 0.5, 0)
        const broadNoise = noise(currentX * 2 + 18.4924, currentY * 2 + 72.9744, motionTime * 0.5, 0)
        const scaleSignal = clamp(
          ringBand
            + ringBand2 * 3
            + innerBand * 0.4
            + ringScaleNoise * innerBand * 0.5
            + Math.pow((broadNoise + 1.5) * 0.5, 2) * 0.6
            + (localNoise + 1) * 0.08
            + Math.sin(motionTime * 0.9 + particle.phase) * 0.08,
          0.08,
          1.5,
        )
        const alpha = Math.min(1, (0.54 + scaleSignal * 0.52) * (reducedMotion ? 0.82 : 1))
        const color = colorForParticle(particle, palette, motionTime)
        const angleNoise = noise(currentX * 10 + 18.4924, currentY * 10 + 72.9744, motionTime * 0.85, 0)
        const angle = Math.atan2(displacedY - ring.y, displacedX - ring.x) + angleNoise * 0.5
        const x = (0.5 + displacedX * 0.5) * width
        const y = (0.5 - displacedY * 0.5) * height
        const length = (2 + particle.size * (3.4 + scaleSignal * 5)) * sizeFactor
        const thickness = Math.max(0.9, length * 0.34)

        context.fillStyle = `rgba(${color[0]}, ${color[1]}, ${color[2]}, ${alpha})`
        drawCapsule(context, x, y, length, thickness, angle)
      }
    }

    const render = (timestamp: number): void => {
      frameId = window.requestAnimationFrame(render)
      draw(timestamp / 1000)
    }

    const start = (): void => {
      if (frameId !== null || reducedMotion || !visible) return
      frameId = window.requestAnimationFrame(render)
    }

    const stop = (): void => {
      if (frameId === null) return
      window.cancelAnimationFrame(frameId)
      frameId = null
    }

    const onPointerMove = (event: PointerEvent): void => {
      if (event.pointerType === 'touch') return
      targetPointer.x = clamp(((event.clientX - originX) / width - 0.5) * 2, -1, 1)
      targetPointer.y = clamp(-(((event.clientY - originY) / height - 0.5) * 2), -1, 1)
      targetPointer.active = true
      pointer.active = true
    }

    const clearPointer = (): void => {
      targetPointer.active = false
      pointer.active = false
    }

    const onPointerOut = (event: PointerEvent): void => {
      if (event.relatedTarget === null) clearPointer()
    }

    const onVisibilityChange = (): void => {
      visible = document.visibilityState === 'visible'
      if (visible) {
        draw(0)
        start()
      } else {
        stop()
      }
    }

    const onMotionChange = (event: MediaQueryListEvent): void => {
      reducedMotion = event.matches
      stop()
      draw(0)
      start()
    }

    const themeObserver = typeof MutationObserver === 'undefined'
      ? undefined
      : new MutationObserver(() => { draw(0) })

    resize()
    window.addEventListener('pointermove', onPointerMove, { passive: true })
    window.addEventListener('pointerout', onPointerOut)
    window.addEventListener('blur', clearPointer)
    window.addEventListener('resize', resize)
    document.addEventListener('visibilitychange', onVisibilityChange)
    motionQuery?.addEventListener('change', onMotionChange)
    themeObserver?.observe(document.body, { attributes: true, attributeFilter: ['data-ds-dark-theme'] })
    start()

    return () => {
      stop()
      window.removeEventListener('pointermove', onPointerMove)
      window.removeEventListener('pointerout', onPointerOut)
      window.removeEventListener('blur', clearPointer)
      window.removeEventListener('resize', resize)
      document.removeEventListener('visibilitychange', onVisibilityChange)
      motionQuery?.removeEventListener('change', onMotionChange)
      themeObserver?.disconnect()
    }
  }, [])

  return (
    <canvas
      ref={canvasRef}
      style={{ pointerEvents: 'none' }}
      data-dsh-particle-field
      aria-hidden="true"
    />
  )
}
