import * as vscode from "vscode";
import { randomUUID } from "crypto";

// Inlined from @devsnap/core so the extension has no workspace symlink dependencies.
// vsce follows symlinks into packages/core and pulls in the entire monorepo otherwise.
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

// VS Code uses its own language ID strings (e.g. "typescriptreact", "shellscript").
// Our core uses names that match highlight.js / file extensions (e.g. "typescript", "bash").
// This map bridges the two systems.
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

// VS Code's globalState is a key-value store backed by SQLite internally.
// It persists across VS Code restarts and is scoped to the extension.
function loadSnippets(context: vscode.ExtensionContext): Snippet[] {
  return context.globalState.get<Snippet[]>("snippets", []);
}

function persistSnippets(
  context: vscode.ExtensionContext,
  snippets: Snippet[],
): Thenable<void> {
  return context.globalState.update("snippets", snippets);
}

// activate() is called by VS Code when the extension first wakes up.
// The ExtensionContext gives you access to storage, subscriptions, and extension metadata.
export function activate(context: vscode.ExtensionContext) {
  // registerCommand ties a command ID (matching contributes.commands in package.json)
  // to a handler function. Nothing runs until the user actually invokes the command.
  const saveCmd = vscode.commands.registerCommand(
    "snipforge.saveSelection",
    async () => {
      // activeTextEditor is the file the user is currently looking at.
      // It can be undefined if the user has no file open (e.g. just the welcome tab).
      const editor = vscode.window.activeTextEditor;
      if (!editor) {
        vscode.window.showErrorMessage("SnipForge: No active editor.");
        return;
      }

      // editor.selection is the current cursor position/highlighted range.
      // If nothing is selected, selection.isEmpty is true — we fall back to the whole file.
      const selection = editor.selection;
      const code = selection.isEmpty
        ? editor.document.getText()
        : editor.document.getText(selection);

      if (!code.trim()) {
        vscode.window.showWarningMessage(
          "SnipForge: Nothing to save — selection is empty.",
        );
        return;
      }

      // VS Code already knows the language — languageId is set by the editor itself.
      // We map common VS Code IDs to our names (e.g. "shellscript" → "bash").
      // If there's no mapping entry, the languageId itself is a fine fallback.
      const vscodeLangId = editor.document.languageId;
      const language = VSCODE_LANG_MAP[vscodeLangId] ?? vscodeLangId;

      // showInputBox shows a small text input at the top of VS Code.
      // Returns the string the user typed, or undefined if they pressed Escape.
      const title = await vscode.window.showInputBox({
        prompt: "Snippet title",
        placeHolder: "e.g. Debounce hook",
        ignoreFocusOut: true, // don't close if user clicks elsewhere
      });
      if (title === undefined) return; // Escape pressed — user cancelled

      const tagsRaw = await vscode.window.showInputBox({
        prompt: "Tags (optional, comma-separated)",
        placeHolder: "react, hooks, typescript",
        ignoreFocusOut: true,
      });
      if (tagsRaw === undefined) return; // Escape pressed

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

      const snippets = loadSnippets(context);
      snippets.unshift(snippet); // newest first
      await persistSnippets(context, snippets);

      // showInformationMessage shows the green notification at the bottom-right of VS Code.
      vscode.window.showInformationMessage(
        `SnipForge: Saved "${title}" [${language}]`,
      );
    },
  );

  // context.subscriptions is VS Code's cleanup list.
  // When the extension is deactivated, VS Code calls dispose() on everything in this array.
  // If you forget to push here, you leak command registrations.
  context.subscriptions.push(saveCmd);
}

// deactivate() is called when VS Code is shutting down or the extension is disabled.
// For simple extensions like ours, there's nothing to clean up manually.
export function deactivate() {}
