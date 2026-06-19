import esbuild from 'esbuild'
import { readFileSync, writeFileSync, mkdirSync, rmSync } from 'fs'

rmSync('dist', { recursive: true, force: true })
mkdirSync('dist', { recursive: true })

const result = await esbuild.build({
  entryPoints: ['src/index.ts'],
  bundle: true,
  outfile: 'dist/snipforge.js',
  platform: 'node',
  format: 'cjs',
  target: 'node18',
  external: ['better-sqlite3'],
  minify: false,
})

if (result.errors.length) {
  for (const e of result.errors) console.error(e)
  process.exit(1)
}

const content = readFileSync('dist/snipforge.js', 'utf8')
const body = content.startsWith('#!') ? content.slice(content.indexOf('\n') + 1) : content
writeFileSync('dist/snipforge.js', '#!/usr/bin/env node\n' + body, { mode: 0o755 })

console.log('Built dist/snipforge.js')
