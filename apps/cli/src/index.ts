import { Command } from 'commander'
import { readFileSync } from 'fs'
import * as readline from 'readline'
import { saveSnippet, listAllSnippets, findSnippetBySlug } from './snippets'

// Single readline instance so sequential asks work without stdin closing between calls
let rl: readline.Interface | null = null

function ask(question: string): Promise<string> {
  if (!rl) {
    rl = readline.createInterface({ input: process.stdin, output: process.stdout })
  }
  return new Promise((resolve) => {
    rl!.question(question, (ans) => resolve(ans.trim()))
  })
}

function closeAsk() {
  rl?.close()
  rl = null
}

const program = new Command()
  .name('snipforge')
  .description('Save and retrieve code snippets from the terminal')
  .version('0.1.0')

// ─── devsnap add [file] ───────────────────────────────────────────────────────
program
  .command('add [file]')
  .description('Save a snippet from a file or stdin')
  .option('-t, --title <title>', 'Snippet title')
  .option('--tags <tags>', 'Comma-separated tags')
  .option('-d, --description <desc>', 'Optional description')
  .action(async (file: string | undefined, opts: { title?: string; tags?: string; description?: string }) => {
    let code: string
    let filename: string | undefined
    let title = opts.title
    let tags: string[] = opts.tags
      ? opts.tags.split(',').map((s) => s.trim()).filter(Boolean)
      : []

    if (file) {
      // ── File path given: read code, then ask metadata interactively ──
      code = readFileSync(file, 'utf8')
      filename = file
      if (!title) title = await ask('Title: ')
      if (!title) { console.error('Title is required.'); closeAsk(); process.exit(1) }
      if (!opts.tags) {
        const t = await ask('Tags (optional, comma-separated): ')
        if (t) tags = t.split(',').map((s) => s.trim()).filter(Boolean)
      }
      closeAsk()
    } else if (!process.stdin.isTTY) {
      // ── Stdin pipe: code comes from the pipe, --title required ──
      code = await new Promise<string>((resolve) => {
        const chunks: Buffer[] = []
        process.stdin.on('data', (c: Buffer) => chunks.push(c))
        process.stdin.on('end', () => resolve(Buffer.concat(chunks).toString('utf8')))
      })
      if (!title) {
        console.error('--title is required when piping code.\n  Example: cat hook.ts | devsnap add --title "My hook"')
        process.exit(1)
      }
    } else {
      // ── Interactive paste: ask metadata first, then read pasted code ──
      if (!title) title = await ask('Title: ')
      if (!title) { console.error('Title is required.'); closeAsk(); process.exit(1) }
      if (!opts.tags) {
        const t = await ask('Tags (optional, comma-separated): ')
        if (t) tags = t.split(',').map((s) => s.trim()).filter(Boolean)
      }
      closeAsk() // must close readline before consuming stdin for code
      process.stdout.write('Paste your code, then press Ctrl+D:\n')
      const codeRl = readline.createInterface({ input: process.stdin })
      const lines: string[] = []
      for await (const line of codeRl) lines.push(line)
      code = lines.join('\n')
      if (code && !code.endsWith('\n')) code += '\n'
    }

    if (!code.trim()) {
      console.error('No code found.')
      process.exit(1)
    }

    const snippet = saveSnippet({ title, code, filename, description: opts.description, tags })
    console.log(`\n✓  Saved: ${snippet.slug}`)
    console.log(`   Language: ${snippet.language}`)
    if (snippet.tags.length > 0) console.log(`   Tags:     ${snippet.tags.join(', ')}`)
    console.log()
  })

// ─── devsnap get <slug> ───────────────────────────────────────────────────────
program
  .command('get <slug>')
  .description('Print a snippet\'s code to stdout')
  .action((slug: string) => {
    const snippet = findSnippetBySlug(slug)
    if (!snippet) {
      console.error(`No snippet found: ${slug}`)
      process.exit(1)
    }
    process.stdout.write(snippet.code)
    // Ensure trailing newline for shell friendliness
    if (!snippet.code.endsWith('\n')) process.stdout.write('\n')
  })

// ─── devsnap list ─────────────────────────────────────────────────────────────
program
  .command('list')
  .description('List all saved snippets')
  .action(() => {
    const snippets = listAllSnippets()

    if (snippets.length === 0) {
      console.log('\nNo snippets yet. Run `snipforge add <file>` to save one.\n')
      return
    }

    const maxTitle = Math.min(40, Math.max(5, ...snippets.map((s) => s.title.length)))
    const maxSlug  = Math.max(4, ...snippets.map((s) => s.slug.length))
    const maxLang  = Math.max(4, ...snippets.map((s) => s.language.length))

    const header =
      'TITLE'.padEnd(maxTitle) + '  ' +
      'SLUG'.padEnd(maxSlug)  + '  ' +
      'LANG'.padEnd(maxLang)  + '  ' +
      'TAGS'

    console.log('\n  ' + header)
    console.log('  ' + '─'.repeat(header.length))

    for (const s of snippets) {
      const row =
        s.title.slice(0, maxTitle).padEnd(maxTitle) + '  ' +
        s.slug.padEnd(maxSlug) + '  ' +
        s.language.padEnd(maxLang) + '  ' +
        s.tags.join(', ')
      console.log('  ' + row)
    }
    console.log()
  })

program.parse()
