/**
 * Browser half of the celestial workbench skin: retints official tokens and
 * mounts decorative artwork behind the official shell.
 *
 * The skin is always on. Settings registration moved to Cordis profile entries,
 * and the old `settings.plugin.item` slot is gone, so there is no settings card.
 */
import { createElement } from 'react'
import { createRoot } from 'react-dom/client'
import type { ClientContext } from '@deepseek-ai/dsh-client-runtime/client'
import type {} from '@deepseek-ai/dsh-client-ui-theme/client'
import { CelestialBackdrop, DesktopChrome } from './CelestialStage.tsx'
import { CELESTIAL_TOKENS } from './tokens.ts'
import './celestial.css'

const PACKAGE_ID = 'dsh-client-ui-celestial'

/** Theme is required before palette overrides can stack. */
export const inject = ['theme']

function mount(tag: string, render: () => ReturnType<typeof createElement>, place: 'prepend' | 'append'): () => void {
  const host = document.createElement('div')
  host.dataset[tag] = ''
  if (place === 'prepend') document.body.prepend(host)
  else document.body.append(host)
  const root = createRoot(host)
  root.render(render())
  return () => {
    root.unmount()
    host.remove()
  }
}

/**
 * Client plugin body: stack palette overrides and mount the artwork.
 * @param ctx - client root context.
 */
export function apply(ctx: ClientContext): void {
  ctx.effect(() => {
    const tokens = ctx.theme.overrideTokens(PACKAGE_ID, CELESTIAL_TOKENS)
    const backdrop = mount('dshCelestialHost', () => createElement(CelestialBackdrop), 'prepend')
    const chrome = mount('dshCelestialChrome', () => createElement(DesktopChrome), 'append')
    return () => {
      tokens()
      backdrop()
      chrome()
    }
  }, 'celestial: skin')
}
