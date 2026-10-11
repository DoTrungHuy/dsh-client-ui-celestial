/**
 * Host half of the celestial workbench skin.
 *
 * The client module system owns bundle publishing and boot-graph composition.
 * This package is a profile bundle: `cordis.patch.yml` inserts the Loader row,
 * and `package.json` declares `dsh.client` plus `exports["./client"]`. The host
 * scans that declaration, serves `lib/client.js` at `/plugins/<id>/client.js`,
 * and emits the boot graph itself.
 *
 * A hand-pushed `window.__DSH_BOOT__.entries` row is rejected: every entries[]
 * row must also belong to a batches[] entry, and a row that is in no batch
 * fails the whole client plugin system. So this host face stays a real module
 * with an `apply` export and does not touch the index HTML.
 */
import type { Context } from '@deepseek-ai/cordis'

/**
 * Mount the host half of the skin.
 *
 * @param _ctx - Host context. Unused: the client half arrives through the official module system.
 */
export function apply(_ctx: Context): void {
  // Intentionally empty. See the file header.
}
