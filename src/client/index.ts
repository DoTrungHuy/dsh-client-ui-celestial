/**
 * Browser half of the celestial workbench skin: retints official tokens and
 * mounts decorative artwork behind the official shell.
 */
import { createElement } from 'react'
import { createRoot } from 'react-dom/client'
import type { ClientContext } from '@deepseek-ai/dsh-client-runtime/client'
import type {} from '@deepseek-ai/dsh-client-ui-theme/client'
import type {} from '@deepseek-ai/dsh-client-ui-settings-plugins/client'
import { CelestialBackdrop, DesktopChrome } from './CelestialStage.tsx'
import { CelestialCard } from './CelestialCard.tsx'
import { CELESTIAL_TOKENS } from './tokens.ts'
import './celestial.css'

const PACKAGE_ID = 'dsh-client-ui-celestial'

/** Theme, slots, and settings required to apply the skin and show its card. */
export const inject = ['theme', 'slots', 'settingsScope']

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
 * Client plugin body: stack palette overrides, mount artwork, and register the settings card.
 * @param ctx - client root context.
 */
export function apply(ctx: ClientContext): void {
  const scope = ctx.settingsScope.bind<{ enabled: boolean }>({ namespace: 'ui-celestial' })
  void scope.load()

  ctx.effect(() => {
    let skin: (() => void) | undefined
    const sync = (): void => {
      const enabled = scope.getSnapshot().value?.enabled !== false
      if (enabled && skin === undefined) {
        const tokens = ctx.theme.overrideTokens(PACKAGE_ID, CELESTIAL_TOKENS)
        const backdrop = mount('dshCelestialHost', () => createElement(CelestialBackdrop), 'prepend')
        const chrome = mount('dshCelestialChrome', () => createElement(DesktopChrome), 'append')
        skin = () => {
          tokens()
          backdrop()
          chrome()
        }
      } else if (!enabled && skin !== undefined) {
        skin()
        skin = undefined
      }
    }
    const stop = scope.subscribe(sync)
    sync()
    return () => {
      stop()
      skin?.()
    }
  }, 'celestial: skin')

  ctx.slots.inject(
    'settings.plugin.item',
    () => ctx.slots.register({
      name: 'settings.plugin.item',
      key: 'ui-celestial',
    }, () => createElement(CelestialCard, { scope })),
  )
}
