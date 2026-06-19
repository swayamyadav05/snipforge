import { Database } from 'bun:sqlite'
import { homedir } from 'os'
import { mkdirSync } from 'fs'
import { join } from 'path'

const dir = join(homedir(), '.devsnap')
mkdirSync(dir, { recursive: true })

export const db = new Database(join(dir, 'snippets.db'))

db.run(`
  CREATE TABLE IF NOT EXISTS snippets (
    id          TEXT PRIMARY KEY,
    slug        TEXT UNIQUE NOT NULL,
    title       TEXT NOT NULL,
    description TEXT,
    code        TEXT NOT NULL,
    language    TEXT NOT NULL,
    tags        TEXT NOT NULL DEFAULT '[]',
    created_at  TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%SZ', 'now')),
    updated_at  TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%SZ', 'now'))
  )
`)
