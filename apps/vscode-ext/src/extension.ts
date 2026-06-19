import * as vscode from "vscode";
import { randomUUID } from "crypto";
import { homedir } from "os";
import { mkdirSync } from "fs";
import { join } from "path";
import Database from "better-sqlite3";

// Inlined from @devsnap/core — vsce follows symlinks and would pull in the entire monorepo.
type Snippet = {
  id: string;
  slug: string;
  title: string;
  description: string | null;
  code: string;
  language: string;
  tags: string[];
  createdAt: string;
  updatedAt: string;
};

type Row = {
  id: string;
  slug: string;
  title: string;
  description: string | null;
  code: string;
  language: string;
  tags: string;
  created_at: string;
  updated_at: string;
};

// VS Code uses its own language ID strings (e.g. "typescriptreact", "shellscript").
// Our schema uses names that match highlight.js / file extensions (e.g. "typescript", "bash").
const VSCODE_LANG_MAP: Record<string, string> = {
  typescript: "typescript",
  javascript: "javascript",
  typescriptreact: "typescript",
  javascriptreact: "javascript",
  python: "python",
  go: "go",
  rust: "rust",
  java: "java",
  c: "c",
  cpp: "cpp",
  csharp: "csharp",
  ruby: "ruby",
  php: "php",
  swift: "swift",
  kotlin: "kotlin",
  html: "html",
  css: "css",
  scss: "scss",
  json: "json",
  yaml: "yaml",
  markdown: "markdown",
  sql: "sql",
  shellscript: "bash",
  dockerfile: "dockerfile",
  graphql: "graphql",
};

function generateSlug(title: string): string {
  const base = title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 40);
  const suffix = Math.random().toString(36).slice(2, 6);
  return base ? `${base}-${suffix}` : suffix;
}

function mapRow(row: Row): Snippet {
  return {
    id: row.id,
    slug: row.slug,
    title: row.title,
    description: row.description,
    code: row.code,
    language: row.language,
    tags: JSON.parse(row.tags) as string[],
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

// Shared SQLite DB at ~/.devsnap/snippets.db — same file the CLI uses.
const dbDir = join(homedir(), ".snipforge");
mkdirSync(dbDir, { recursive: true });
const db = new Database(join(dbDir, "snippets.db"));

db.exec(`
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
`);

function dbSave(snippet: Snippet): void {
  db.prepare(
    `INSERT INTO snippets (id, slug, title, code, language, description, tags)
     VALUES (?, ?, ?, ?, ?, ?, ?)`
  ).run(
    snippet.id,
    snippet.slug,
    snippet.title,
    snippet.code,
    snippet.language,
    snippet.description,
    JSON.stringify(snippet.tags)
  );
}

function dbList(): Snippet[] {
  return (
    db
      .prepare("SELECT * FROM snippets ORDER BY created_at DESC")
      .all() as Row[]
  ).map(mapRow);
}

function dbFindBySlug(slug: string): Snippet | null {
  const row = db
    .prepare("SELECT * FROM snippets WHERE slug = ?")
    .get(slug) as Row | null;
  return row ? mapRow(row) : null;
}

// activate() is called by VS Code when the extension first wakes up.
export function activate(context: vscode.ExtensionContext) {
  // ── Save Selection ──────────────────────────────────────────────────────────
  const saveCmd = vscode.commands.registerCommand(
    "snipforge.saveSelection",
    async () => {
      const editor = vscode.window.activeTextEditor;
      if (!editor) {
        vscode.window.showErrorMessage("SnipForge: No active editor.");
        return;
      }

      const selection = editor.selection;
      const code = selection.isEmpty
        ? editor.document.getText()
        : editor.document.getText(selection);

      if (!code.trim()) {
        vscode.window.showWarningMessage(
          "SnipForge: Nothing to save — selection is empty."
        );
        return;
      }

      const vscodeLangId = editor.document.languageId;
      const language = VSCODE_LANG_MAP[vscodeLangId] ?? vscodeLangId;

      const title = await vscode.window.showInputBox({
        prompt: "Snippet title",
        placeHolder: "e.g. Debounce hook",
        ignoreFocusOut: true,
      });
      if (title === undefined) return;

      const tagsRaw = await vscode.window.showInputBox({
        prompt: "Tags (optional, comma-separated)",
        placeHolder: "react, hooks, typescript",
        ignoreFocusOut: true,
      });
      if (tagsRaw === undefined) return;

      const tags = tagsRaw
        ? tagsRaw
            .split(",")
            .map((t) => t.trim())
            .filter(Boolean)
        : [];

      const now = new Date().toISOString();
      const snippet: Snippet = {
        id: randomUUID(),
        slug: generateSlug(title),
        title,
        code,
        language,
        description: null,
        tags,
        createdAt: now,
        updatedAt: now,
      };

      dbSave(snippet);
      vscode.window.showInformationMessage(
        `SnipForge: Saved "${title}" [${language}] — slug: ${snippet.slug}`
      );
    }
  );

  // ── List Snippets ───────────────────────────────────────────────────────────
  const listCmd = vscode.commands.registerCommand(
    "snipforge.listSnippets",
    async () => {
      const snippets = dbList();

      if (snippets.length === 0) {
        vscode.window.showInformationMessage(
          "SnipForge: No snippets yet. Use 'SnipForge: Save Selection' to save one."
        );
        return;
      }

      const items = snippets.map((s) => ({
        label: s.title,
        description: `[${s.language}]${s.tags.length ? "  " + s.tags.join(", ") : ""}`,
        detail: s.slug,
        snippet: s,
      }));

      const picked = await vscode.window.showQuickPick(items, {
        placeHolder: "Pick a snippet to insert at cursor",
        matchOnDescription: true,
        matchOnDetail: true,
      });

      if (!picked) return;
      insertAtCursor(picked.snippet.code);
    }
  );

  // ── Get Snippet by Slug ─────────────────────────────────────────────────────
  const getCmd = vscode.commands.registerCommand(
    "snipforge.getSnippet",
    async () => {
      const slug = await vscode.window.showInputBox({
        prompt: "Snippet slug",
        placeHolder: "e.g. debounce-hook-a3f2",
        ignoreFocusOut: true,
      });
      if (!slug) return;

      const snippet = dbFindBySlug(slug.trim());
      if (!snippet) {
        vscode.window.showErrorMessage(`SnipForge: No snippet found: ${slug}`);
        return;
      }

      insertAtCursor(snippet.code);
    }
  );

  context.subscriptions.push(saveCmd, listCmd, getCmd);
}

function insertAtCursor(code: string): void {
  const editor = vscode.window.activeTextEditor;
  if (editor) {
    editor.edit((eb) => eb.insert(editor.selection.active, code));
  } else {
    // No editor open — copy to clipboard as fallback
    vscode.env.clipboard.writeText(code).then(() => {
      vscode.window.showInformationMessage(
        "SnipForge: No editor open — snippet copied to clipboard."
      );
    });
  }
}

export function deactivate() {
  db.close();
}
