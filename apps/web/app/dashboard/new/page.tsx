'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createSnippet, detectLanguage } from '@devsnap/core'

export default function NewSnippetPage() {
  const router = useRouter()
  const [title, setTitle] = useState('')
  const [code, setCode] = useState('')
  const [language, setLanguage] = useState('')
  const [languageAutoDetected, setLanguageAutoDetected] = useState(false)
  const [description, setDescription] = useState('')
  const [tags, setTags] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Auto-detect language from code (debounced)
  useEffect(() => {
    if (!code.trim()) return
    const timer = setTimeout(() => {
      const detected = detectLanguage(code)
      setLanguage(detected)
      setLanguageAutoDetected(true)
    }, 500)
    return () => clearTimeout(timer)
  }, [code])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError(null)
    try {
      await createSnippet({
        title,
        code,
        language: language || 'plaintext',
        description: description || undefined,
        tags: tags
          ? tags
              .split(',')
              .map((t) => t.trim())
              .filter(Boolean)
          : [],
      })
      router.push('/dashboard')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save snippet')
      setLoading(false)
    }
  }

  return (
    <div className="max-w-3xl">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-semibold">New Snippet</h2>
        <Link
          href="/dashboard"
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
            placeholder="Paste your snippet here…"
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
              placeholder="e.g. Debounce hook"
              required
              className="bg-gray-900 border border-gray-700 rounded-lg px-4 py-2.5 text-sm text-white placeholder-gray-500 focus:outline-none focus:ring-1 focus:ring-gray-500"
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-gray-300">
              Language
              {languageAutoDetected && (
                <span className="ml-2 text-xs text-gray-500">auto-detected</span>
              )}
            </label>
            <input
              type="text"
              value={language}
              onChange={(e) => {
                setLanguage(e.target.value)
                setLanguageAutoDetected(false)
              }}
              placeholder="e.g. typescript"
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
            placeholder="Optional note about this snippet…"
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
            {loading ? 'Saving…' : 'Save Snippet'}
          </button>
        </div>
      </form>
    </div>
  )
}
