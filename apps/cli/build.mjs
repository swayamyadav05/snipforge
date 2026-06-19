import { readFileSync, writeFileSync, mkdirSync, rmSync } from 'fs'

rmSync('dist', { recursive: true, force: true })
mkdirSync('dist', { recursive: true })

const result = await Bun.build({
  entrypoints: ['src/index.ts'],
  outdir: 'dist',
  target: 'bun',
  naming: 'snipforge.js',
  minify: false,
})

if (!result.success) {
  for (const log of result.logs) console.error(log)
  process.exit(1)
}

// Strip any existing shebang from the bundle output before prepending our own.
// (The entry file has one; esbuild may preserve it, resulting in a duplicate.)
const content = readFileSync('dist/snipforge.js', 'utf8')
const body = content.startsWith('#!') ? content.slice(content.indexOf('\n') + 1) : content
writeFileSync('dist/snipforge.js', '#!/usr/bin/env bun\n' + body, { mode: 0o755 })

console.log('Built dist/snipforge.js')
