/**
 * Host half of the celestial workbench skin.
 *
 * Loaded by file URL. Packaged desktop Host resolves bare npm names from the
 * installed app, not from this file's directory, so this module must not import
 * `@deepseek-ai/*` at runtime. Type-only imports are erased at build.
 */
import { createHash } from 'node:crypto'
import { readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import type { IncomingMessage, ServerResponse } from 'node:http'
import type { Context } from '@deepseek-ai/cordis'
import type {} from '@deepseek-ai/dsh-host-webserver'

const PLUGIN_ID = 'dsh-client-ui-celestial'
const CLIENT_ROUTE = '/celestial-plugin/client.js'
const CLIENT_PATH = join(dirname(fileURLToPath(import.meta.url)), 'client.js')
const SETTINGS_NS = 'ui-celestial'

/** Web server required before the client bundle can be published. */
export const inject = ['webServer']

function shortHash(input: Buffer): string {
  return createHash('sha1').update(input).digest('hex').slice(0, 12)
}

function serveClient(body: Buffer) {
  return (_req: IncomingMessage, res: ServerResponse): void => {
    res.writeHead(200, {
      'content-type': 'text/javascript; charset=utf-8',
      'cache-control': 'no-cache',
    })
    res.end(body)
  }
}

function injectBootRow(html: string, rev: string): string {
  const row = {
    id: PLUGIN_ID,
    url: `${CLIENT_ROUTE}?rev=${rev}`,
    rev,
    inject: ['@deepseek-ai/dsh-client-ui-theme'],
    immediately: true,
  }
  const script = `<script>(function(){var g=window.__DSH_BOOT__;if(!g||!Array.isArray(g.entries))return;if(g.entries.some(function(e){return e.id===${JSON.stringify(PLUGIN_ID)}}))return;g.entries.push(${JSON.stringify(row)});})();</script>`
  const headEnd = html.indexOf('</head>')
  if (headEnd === -1) return `${html}${script}`
  return `${html.slice(0, headEnd)}${script}${html.slice(headEnd)}`
}

function celestialSchema(value: { enabled?: boolean } | undefined): { enabled: boolean } {
  return { enabled: value?.enabled !== false }
}

celestialSchema.toJSON = (): object => ({
  type: 'object',
  properties: { enabled: { type: 'boolean', default: true } },
})

/**
 * Publish the client bundle, register it in the browser boot graph, and expose settings.
 * @param ctx - Host context carrying webServer.
 */
export function apply(ctx: Context): void {
  ctx.inject(['settings'], (settingsCtx) => {
    settingsCtx.settings.register(SETTINGS_NS, celestialSchema, { base: { enabled: true } })
  })

  const body = readFileSync(CLIENT_PATH)
  const rev = shortHash(body)
  ctx.effect(
    () => ctx.webServer.register({ kind: 'exact', path: CLIENT_ROUTE, handler: serveClient(body) }),
    'celestial: client route',
  )
  ctx.effect(
    () => ctx.webServer.tapIndex(html => injectBootRow(html, rev)),
    'celestial: boot row',
  )
}
