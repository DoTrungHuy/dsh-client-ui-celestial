import { createRequire } from 'node:module'
import { mkdir, readFile, writeFile } from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const ROOT = path.dirname(fileURLToPath(import.meta.url))
const OUT = path.join(ROOT, 'lib')
const PACKAGE_ID = 'dsh-client-ui-celestial'
const require = createRequire(import.meta.url)
const esbuild = require('esbuild')

const PLATFORM = new Set([
  'react',
  'react/jsx-runtime',
  'react-dom',
  'react-dom/client',
  '@deepseek-ai/cordis',
  '@deepseek-ai/dsh-client-ui-slots',
  '@deepseek-ai/dsh-client-web-react',
  '@deepseek-ai/dsh-client-ui-primitives',
  '@deepseek-ai/dsh-client-ui-attachment',
  '@deepseek-ai/dsh-client-schema-form',
  '@deepseek-ai/dsh-client-runtime/client',
])

await mkdir(OUT, { recursive: true })

await esbuild.build({
  absWorkingDir: ROOT,
  entryPoints: [path.join(ROOT, 'src/index.ts')],
  outfile: path.join(OUT, 'index.js'),
  bundle: true,
  format: 'esm',
  platform: 'node',
  target: 'es2022',
  logLevel: 'info',
})

const cssVirtual = {
  name: 'celestial-css',
  setup(build) {
    build.onResolve({ filter: /\.css$/ }, (args) => ({
      path: path.resolve(path.dirname(args.importer), args.path),
      namespace: 'celestial-css',
    }))
    build.onLoad({ filter: /.*/, namespace: 'celestial-css' }, async (args) => {
      const css = await readFile(args.path, 'utf8')
      const tagId = `${PACKAGE_ID}/${path.basename(args.path)}`
      const js = [
        `const css = ${JSON.stringify(css)};`,
        `const tagId = ${JSON.stringify(tagId)};`,
        'if (typeof document !== "undefined" && document.querySelector("style[data-plugin-css=" + JSON.stringify(tagId) + "]") === null) {',
        '  const tag = document.createElement("style");',
        `  tag.dataset.plugin = ${JSON.stringify(PACKAGE_ID)};`,
        '  tag.dataset.pluginCss = tagId;',
        '  tag.textContent = css;',
        '  document.head.appendChild(tag);',
        '}',
        'export default {};',
        '',
      ].join('\n')
      return { contents: js, loader: 'js' }
    })
  },
}

const webpLoader = {
  name: 'celestial-webp',
  setup(build) {
    build.onLoad({ filter: /\.webp$/ }, async (args) => {
      const bytes = await readFile(args.path)
      const dataUrl = `data:image/webp;base64,${bytes.toString('base64')}`
      return { contents: `export default ${JSON.stringify(dataUrl)}`, loader: 'js' }
    })
  },
}

const result = await esbuild.build({
  absWorkingDir: ROOT,
  entryPoints: [path.join(ROOT, 'src/client/index.ts')],
  bundle: true,
  format: 'cjs',
  platform: 'browser',
  target: 'es2022',
  write: false,
  jsx: 'automatic',
  sourcemap: 'inline',
  logLevel: 'info',
  plugins: [cssVirtual, webpLoader],
  external: [...PLATFORM],
  define: {
    'process.env.NODE_ENV': JSON.stringify('production'),
  },
})

const output = result.outputFiles[0]
if (output === undefined) throw new Error('esbuild produced no client bundle')
const banner = `window.__ModuleLoader__.load({ id: ${JSON.stringify(PACKAGE_ID)}, factory: (require) => {`
const intro = 'var module = { exports: {} }; var exports = module.exports;'
const footer = 'return module.exports; } });'
const body = Buffer.from(output.contents).toString('utf8').replace(/^"use strict";\r?\n/, '')
await writeFile(path.join(OUT, 'client.js'), `${banner}\n${intro}\n${body}\n${footer}\n`, 'utf8')
console.log(`built ${PACKAGE_ID} -> lib/index.js + lib/client.js`)
