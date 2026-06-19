import hljs from 'highlight.js'

const EXT_MAP: Record<string, string> = {
  ts: 'typescript',
  tsx: 'typescript',
  js: 'javascript',
  jsx: 'javascript',
  mjs: 'javascript',
  cjs: 'javascript',
  py: 'python',
  rs: 'rust',
  go: 'go',
  java: 'java',
  kt: 'kotlin',
  swift: 'swift',
  rb: 'ruby',
  php: 'php',
  cs: 'csharp',
  cpp: 'cpp',
  c: 'c',
  h: 'c',
  hpp: 'cpp',
  sh: 'bash',
  bash: 'bash',
  zsh: 'bash',
  sql: 'sql',
  html: 'html',
  css: 'css',
  scss: 'scss',
  json: 'json',
  yaml: 'yaml',
  yml: 'yaml',
  toml: 'toml',
  md: 'markdown',
  mdx: 'markdown',
  xml: 'xml',
  graphql: 'graphql',
  gql: 'graphql',
  dart: 'dart',
  ex: 'elixir',
  exs: 'elixir',
  hs: 'haskell',
  lua: 'lua',
  r: 'r',
  scala: 'scala',
}

// Restrict candidates to known languages so hljs doesn't pick obscure ones
const CANDIDATE_LANGUAGES = [...new Set(Object.values(EXT_MAP))]

export function detectLanguage(code: string): string {
  const result = hljs.highlightAuto(code, CANDIDATE_LANGUAGES)
  return result.language ?? 'plaintext'
}

export function languageFromExtension(filename: string): string | null {
  const ext = filename.split('.').pop()?.toLowerCase()
  return ext !== undefined ? (EXT_MAP[ext] ?? null) : null
}
