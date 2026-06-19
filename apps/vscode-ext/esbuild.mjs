import esbuild from 'esbuild'

const watch = process.argv.includes('--watch')

const ctx = await esbuild.context({
  entryPoints: ['src/extension.ts'],
  bundle: true,
  outfile: 'dist/extension.js',
  platform: 'node',
  format: 'cjs',
  target: 'node18',
  external: ['vscode'],
  sourcemap: true,
  minify: false,
})

if (watch) {
  await ctx.watch()
  console.log('Watching for changes…')
} else {
  await ctx.rebuild()
  await ctx.dispose()
  console.log('Built dist/extension.js')
}
