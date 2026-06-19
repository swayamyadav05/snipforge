import { db } from './db'
import { detectLanguage, languageFromExtension } from '@devsnap/core'
import type { Snippet } from '@devsnap/core'

function generateSlug(title: string): string {
  const base = title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 40)
  const suffix = Math.random().toString(36).slice(2, 6)
  return base ? `${base}-${suffix}` : suffix
}

type Row = {
  id: string
  slug: string
  title: string
  description: string | null
  code: string
  language: string
  tags: string
  created_at: string
  updated_at: string
}

function mapRow(row: Row): Snippet {
  return {
    id: row.id,
    slug: row.slug,
    title: row.title,
    description: row.description ?? null,
    code: row.code,
    language: row.language,
    tags: JSON.parse(row.tags) as string[],
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }
}

export function saveSnippet(input: {
  title: string
  code: string
  filename?: string
  description?: string
  tags?: string[]
}): Snippet {
  const language =
    (input.filename ? languageFromExtension(input.filename) : null) ??
    detectLanguage(input.code)

  const id = crypto.randomUUID()
  const slug = generateSlug(input.title)

  db.run(
    `INSERT INTO snippets (id, slug, title, code, language, description, tags)
     VALUES (?, ?, ?, ?, ?, ?, ?)`,
    [id, slug, input.title, input.code, language, input.description ?? null, JSON.stringify(input.tags ?? [])]
  )

  return mapRow(db.query('SELECT * FROM snippets WHERE id = ?').get(id) as Row)
}

export function listAllSnippets(): Snippet[] {
  const rows = db.query('SELECT * FROM snippets ORDER BY created_at DESC').all() as Row[]
  return rows.map(mapRow)
}

export function findSnippetBySlug(slug: string): Snippet | null {
  const row = db.query('SELECT * FROM snippets WHERE slug = ?').get(slug) as Row | null
  return row ? mapRow(row) : null
}
