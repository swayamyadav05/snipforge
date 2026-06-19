import { z } from 'zod'

export const SnippetSchema = z.object({
  id: z.string(),
  slug: z.string(),
  title: z.string(),
  description: z.string().nullable(),
  code: z.string(),
  language: z.string(),
  tags: z.array(z.string()),
  createdAt: z.string(),
  updatedAt: z.string(),
})

export const CreateSnippetInputSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  code: z.string().min(1, 'Code is required'),
  language: z.string().min(1, 'Language is required'),
  description: z.string().optional(),
  tags: z.array(z.string()).default([]),
})

export const UpdateSnippetInputSchema = z.object({
  title: z.string().min(1).optional(),
  code: z.string().min(1).optional(),
  language: z.string().min(1).optional(),
  description: z.string().nullable().optional(),
  tags: z.array(z.string()).optional(),
})

export const SnippetFiltersSchema = z.object({
  search: z.string().optional(),
  tags: z.array(z.string()).optional(),
  language: z.string().optional(),
})

export type Snippet = z.infer<typeof SnippetSchema>
export type CreateSnippetInput = z.infer<typeof CreateSnippetInputSchema>
export type UpdateSnippetInput = z.infer<typeof UpdateSnippetInputSchema>
export type SnippetFilters = z.infer<typeof SnippetFiltersSchema>
