import { insforge } from './client'
import { generateSlug } from './slug'
import { detectLanguage } from './detect'
import { SnippetSchema, CreateSnippetInputSchema, UpdateSnippetInputSchema } from './schema'
import type { Snippet, CreateSnippetInput, UpdateSnippetInput, SnippetFilters } from './schema'

// Maps DB snake_case columns to our camelCase Snippet type
function mapDbRow(row: Record<string, unknown>): Snippet {
  return SnippetSchema.parse({
    id: row.id,
    slug: row.slug,
    title: row.title,
    description: row.description ?? null,
    code: row.code,
    language: row.language,
    tags: row.tags,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  })
}

export async function createSnippet(input: CreateSnippetInput): Promise<Snippet> {
  const validated = CreateSnippetInputSchema.parse(input)

  const { data: authData } = await insforge.auth.getCurrentUser()
  if (!authData.user) throw new Error('Not authenticated')

  const language = validated.language || detectLanguage(validated.code)

  const { data, error } = await insforge.database
    .from('snippets')
    .insert({
      user_id: authData.user.id,
      slug: generateSlug(validated.title),
      title: validated.title,
      code: validated.code,
      language,
      description: validated.description ?? null,
      tags: validated.tags ?? [],
    })
    .select()

  if (error) throw error
  const row = (data as Record<string, unknown>[])?.[0]
  if (!row) throw new Error('Insert returned no data')
  return mapDbRow(row)
}

export async function getSnippet(slug: string): Promise<Snippet | null> {
  const { data, error } = await insforge.database
    .from('snippets')
    .select('*')
    .eq('slug', slug)
    .maybeSingle()

  if (error) throw error
  if (!data) return null
  return mapDbRow(data as Record<string, unknown>)
}

export async function listSnippets(filters?: SnippetFilters): Promise<Snippet[]> {
  // RLS ensures we only see the current user's snippets automatically
  let query = insforge.database
    .from('snippets')
    .select('*')
    .order('created_at', { ascending: false })

  if (filters?.language) {
    query = query.eq('language', filters.language)
  }

  if (filters?.search) {
    query = query.ilike('title', `%${filters.search}%`)
  }

  const { data, error } = await query
  if (error) throw error
  return ((data ?? []) as Record<string, unknown>[]).map(mapDbRow)
}

export async function updateSnippet(id: string, input: UpdateSnippetInput): Promise<Snippet> {
  const validated = UpdateSnippetInputSchema.parse(input)

  // Only send defined fields to avoid accidentally nulling columns
  const patch: Record<string, unknown> = {}
  if (validated.title !== undefined) patch.title = validated.title
  if (validated.code !== undefined) patch.code = validated.code
  if (validated.language !== undefined) patch.language = validated.language
  if (validated.description !== undefined) patch.description = validated.description
  if (validated.tags !== undefined) patch.tags = validated.tags

  const { data, error } = await insforge.database
    .from('snippets')
    .update(patch)
    .eq('id', id)
    .select()

  if (error) throw error
  const row = (data as Record<string, unknown>[])?.[0]
  if (!row) throw new Error('Update returned no data')
  return mapDbRow(row)
}

export async function deleteSnippet(id: string): Promise<void> {
  const { error } = await insforge.database
    .from('snippets')
    .delete()
    .eq('id', id)

  if (error) throw error
}
