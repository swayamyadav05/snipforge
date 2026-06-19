export {
  SnippetSchema,
  CreateSnippetInputSchema,
  UpdateSnippetInputSchema,
  SnippetFiltersSchema,
} from './schema'

export type {
  Snippet,
  CreateSnippetInput,
  UpdateSnippetInput,
  SnippetFilters,
} from './schema'

export { insforge } from './client'
export { detectLanguage, languageFromExtension } from './detect'
export { signInWithGitHub, signOut, getSession } from './auth'
export type { User } from './auth'
export { createSnippet, listSnippets, getSnippet, updateSnippet, deleteSnippet } from './snippets'
export { highlightCode } from './highlight'
