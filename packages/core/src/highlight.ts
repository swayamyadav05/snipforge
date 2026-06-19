import hljs from 'highlight.js'

export function highlightCode(code: string, language: string): string {
  try {
    return hljs.highlight(code, { language, ignoreIllegals: true }).value
  } catch {
    return hljs.highlightAuto(code).value
  }
}
