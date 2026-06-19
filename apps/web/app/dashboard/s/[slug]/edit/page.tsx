'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { getSnippet, updateSnippet } from '@devsnap/core'
import type { Snippet } from '@devsnap/core'

export default function EditSnippetPage() {
  const { slug } = useParams<{ slug: string }>()
  const router = useRouter()
  const [snippet, setSnippet] = useState<Snippet | null | undefined>(undefined)

  // Form fields — undefined until snippet loads
  const [title, setTitle] = useState('')
  const [code, setCode] = useState('')
  const [language, setLanguage] = useState('')
  const [description, setDescription] = useState('')
  const [tags, setTags] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    getSnippet(slug).then((s) => {
      setSnippet(s)
      if (s) {
        setTitle(s.title)
        setCode(s.code)
        setLanguage(s.language)
        setDescription(s.description ?? '')
        setTags(s.tags.join(', '))
      }
    }).catch(() => setSnippet(null))
  }, [slug])

  if (snippet === undefined) {
    return (
      <div className="flex items-center justify-center h-48">
        <div className="w-5 h-5 border-2 border-gray-600 border-t-white rounded-full animate-spin" />
      </div>
    )
  }

  if (snippet === null) {
    return (
      <div className="text-center py-16">
        <p className="text-gray-400 mb-4">Snippet not found.</p>
        <Link href="/dashboard" className="text-sm text-white underline underline-offset-4">
          Back to snippets
        </Link>
      </div>
    )
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError(null)
    try {
      await updateSnippet(snippet!.id, {
        title,
        code,
        language: language || 'plaintext',
        description: description || null,
        tags: tags
          ? tags.split(',').map((t) => t.trim()).filter(Boolean)
          : [],
      })
      router.push(`/dashboard/s/${slug}`)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update snippet')
      setLoading(false)
    }
  }

  return (
    <div className="max-w-3xl">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-semibold">Edit Snippet</h2>
        <Link
          href={`/dashboard/s/${slug}`}
          className="text-sm text-gray-400 hover:text-white transition-colors"
        >
          Cancel
        </Link>
      </div>

      <form onSubmit={handleSubmit} className="flex flex-col gap-5">
        {error && (
          <p className="text-sm text-red-400 bg-red-950/50 border border-red-900 rounded-lg px-4 py-3">
            {error}
          </p>
        )}

        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-medium text-gray-300">Code *</label>
          <textarea
            value={code}
            onChange={(e) => setCode(e.target.value)}
            rows={12}
            required
            className="bg-gray-900 border border-gray-700 rounded-lg px-4 py-3 text-sm font-mono text-white placeholder-gray-500 focus:outline-none focus:ring-1 focus:ring-gray-500 resize-y"
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-gray-300">Title *</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
              className="bg-gray-900 border border-gray-700 rounded-lg px-4 py-2.5 text-sm text-white placeholder-gray-500 focus:outline-none focus:ring-1 focus:ring-gray-500"
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-gray-300">Language</label>
            <input
              type="text"
              value={language}
              onChange={(e) => setLanguage(e.target.value)}
              className="bg-gray-900 border border-gray-700 rounded-lg px-4 py-2.5 text-sm text-white placeholder-gray-500 focus:outline-none focus:ring-1 focus:ring-gray-500"
            />
          </div>
        </div>

        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-medium text-gray-300">Tags</label>
          <input
            type="text"
            value={tags}
            onChange={(e) => setTags(e.target.value)}
            placeholder="react, hooks, typescript  (comma-separated)"
            className="bg-gray-900 border border-gray-700 rounded-lg px-4 py-2.5 text-sm text-white placeholder-gray-500 focus:outline-none focus:ring-1 focus:ring-gray-500"
          />
        </div>

        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-medium text-gray-300">Description</label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={3}
            className="bg-gray-900 border border-gray-700 rounded-lg px-4 py-3 text-sm text-white placeholder-gray-500 focus:outline-none focus:ring-1 focus:ring-gray-500 resize-y"
          />
        </div>

        <div className="flex justify-end">
          <button
            type="submit"
            disabled={loading}
            className="px-5 py-2.5 bg-white text-gray-900 rounded-lg text-sm font-medium hover:bg-gray-100 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Saving…' : 'Save Changes'}
          </button>
        </div>
      </form>
    </div>
  )
}
