import { useEffect, useState } from 'react'
import type { CSSProperties, ReactElement } from 'react'
import { ParticleField } from './ParticleField.tsx'
import illuminatedArt from './assets/solar-system-illuminated-hero.webp'
import parchmentArt from './assets/solar-system-parchment-light.webp'

type WindowControlsOverlayApi = {
  readonly visible: boolean
  getTitlebarAreaRect(): DOMRect
  addEventListener(type: 'geometrychange', listener: () => void): void
  removeEventListener(type: 'geometrychange', listener: () => void): void
}

type TitleBarGeometry = Readonly<{
  x: number
  y: number
  width: number
  height: number
}>

const ZERO_TITLE_BAR_GEOMETRY: TitleBarGeometry = { x: 0, y: 0, width: 0, height: 0 }

function getWindowControlsOverlay(): WindowControlsOverlayApi | undefined {
  return (navigator as Navigator & { readonly windowControlsOverlay?: WindowControlsOverlayApi }).windowControlsOverlay
}

function readTitleBarGeometry(overlay: WindowControlsOverlayApi | undefined): TitleBarGeometry {
  if (overlay?.visible !== true) return ZERO_TITLE_BAR_GEOMETRY
  const rect = overlay.getTitlebarAreaRect()
  return { x: rect.x, y: rect.y, width: rect.width, height: rect.height }
}

function cssImage(dataUrl: string): string {
  return `url("${dataUrl}")`
}

function heroIsVisible(): boolean {
  return document.querySelector('[data-phase="hero"]') !== null
}

function transcriptIsOpen(): boolean {
  return document.querySelector('[data-phase="active"]') !== null
}

type StageStyle = CSSProperties & {
  '--dsh-celestial-light-image': string
  '--dsh-celestial-dark-image': string
}

type ChromeStyle = CSSProperties & {
  '--dsh-window-titlebar-x': string
  '--dsh-window-titlebar-y': string
  '--dsh-window-titlebar-width': string
  '--dsh-window-titlebar-height': string
}

function usePhaseFlags(): { readonly hero: boolean, readonly transcript: boolean } {
  const [flags, setFlags] = useState(() => ({ hero: heroIsVisible(), transcript: transcriptIsOpen() }))
  useEffect(() => {
    const root = document.getElementById('root')
    if (root === null || typeof MutationObserver === 'undefined') return
    const observer = new MutationObserver(() => {
      setFlags({ hero: heroIsVisible(), transcript: transcriptIsOpen() })
    })
    observer.observe(root, { subtree: true, childList: true, attributes: true, attributeFilter: ['data-phase'] })
    setFlags({ hero: heroIsVisible(), transcript: transcriptIsOpen() })
    return () => { observer.disconnect() }
  }, [])
  return flags
}

function useTitleBarGeometry(): TitleBarGeometry {
  const [titleBarGeometry, setTitleBarGeometry] = useState(() => readTitleBarGeometry(getWindowControlsOverlay()))
  useEffect(() => {
    const overlay = getWindowControlsOverlay()
    if (overlay === undefined) return
    const update = (): void => { setTitleBarGeometry(readTitleBarGeometry(overlay)) }
    update()
    overlay.addEventListener('geometrychange', update)
    return () => { overlay.removeEventListener('geometrychange', update) }
  }, [])
  return titleBarGeometry
}

/** Artwork and particle field behind the official shell. */
export function CelestialBackdrop(): ReactElement {
  const { hero, transcript } = usePhaseFlags()
  const style: StageStyle = {
    pointerEvents: 'none',
    '--dsh-celestial-light-image': cssImage(parchmentArt),
    '--dsh-celestial-dark-image': cssImage(illuminatedArt),
  }
  return (
    <div
      data-dsh-celestial-stage
      data-hero={hero || undefined}
      data-transcript={transcript || undefined}
      style={style}
      aria-hidden="true"
    >
      <div data-dsh-celestial-art="light" />
      <div data-dsh-celestial-art="dark" />
      <div data-dsh-celestial-vignette />
      <ParticleField />
    </div>
  )
}

/** Desktop caption paint and drag strip above the official shell. */
export function DesktopChrome(): ReactElement | null {
  const titleBarGeometry = useTitleBarGeometry()
  if (titleBarGeometry.height <= 0) return null
  const style: ChromeStyle = {
    '--dsh-window-titlebar-x': `${titleBarGeometry.x}px`,
    '--dsh-window-titlebar-y': `${titleBarGeometry.y}px`,
    '--dsh-window-titlebar-width': `${titleBarGeometry.width}px`,
    '--dsh-window-titlebar-height': `${titleBarGeometry.height}px`,
  }
  return (
    <div data-dsh-window-chrome style={style} aria-hidden="true">
      <div data-dsh-window-titlebar />
      <div data-dsh-window-drag-region />
    </div>
  )
}
