// Builds the one-file app: app/kpi-rechner.html works by double-click, offline, without Node or a server.
// Usage: npm run build:app
import { execSync } from 'node:child_process'
import { mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'

const OUT = '.app-build'
const TARGET = 'app/kpi-rechner.html'

execSync('npx vite build --mode app', { stdio: 'inherit' })

const read = (href) => readFileSync(join(OUT, href), 'utf8')
const dataUri = (file, type) => `data:${type};base64,${readFileSync(join(OUT, file)).toString('base64')}`
// `</script` inside inlined code would end the tag early
const safeJs = (js) => js.replaceAll('</script', '<\/script')

let html = read('index.html')
  .replace(/<script type="module" crossorigin src="\.\/([^"]+)"><\/script>/g, (_, src) => `<script type="module">${safeJs(read(src))}</script>`)
  .replace(/<link rel="stylesheet" crossorigin href="\.\/([^"]+)">/g, (_, href) => `<style>${read(href)}</style>`)
  .replace(/href="\.\/favicon\.svg"/, `href="${dataUri('favicon.svg', 'image/svg+xml')}"`)
  .replace(/<link rel="apple-touch-icon"[^>]*>\s*/, '')

const leftover = html.match(/(src|href)="\.\/[^"]+"/)
if (leftover) throw new Error(`Not inlined: ${leftover[0]}`)

mkdirSync('app', { recursive: true })
writeFileSync(TARGET, html)
rmSync(OUT, { recursive: true, force: true })
console.log(`\n✓ ${TARGET} (${Math.round(html.length / 1024)} kB)`)
