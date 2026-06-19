'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { listSnippets } from '@devsnap/core'
import type { Snippet } from '@devsnap/core'

export default function DashboardPage() {
  const [snippets, setSnippets] = useState<Snippet[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [language, setLanguage] = useState('')
  const [activeTags, setActiveTags] = useState<string[]>([])

  useEffect(() => {
    listSnippets()
      .then(setSnippets)
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [])

  const languages = [...new Set(snippets.map((s) => s.language))].sort()

  const filtered = snippets.filter((s) => {
    const q = search.toLowerCase()
    const matchesSearch =
      !search ||
      s.title.toLowerCase().includes(q) ||
      (s.description?.toLowerCase().includes(q) ?? false)
    const matchesLanguage = !language || s.language === language
    const matchesTags =
      activeTags.length === 0 || activeTags.every((t) => s.tags.includes(t))
    return matchesSearch && matchesLanguage && matchesTags
  })

  function toggleTag(tag: string) {
    setActiveTags((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]
    )
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-48">
        <div className="w-5 h-5 border-2 border-gray-600 border-t-white rounded-full animate-spin" />
      </div>
    )
  }

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-semibold">My Snippets</h2>
        <Link
          href="/dashboard/new"
          className="px-4 py-2 bg-white text-gray-900 rounded-lg text-sm font-medium hover:bg-gray-100 transition-colors"
        >
          + New Snippet
        </Link>
      </div>

      {/* Filters */}
      {snippets.length > 0 && (
        <div className="flex flex-col gap-3 mb-6">
          <div className="flex gap-3">
            <input
              type="search"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search snippets…"
              className="flex-1 bg-gray-900 border border-gray-700 rounded-lg px-4 py-2 text-sm text-white placeholder-gray-500 focus:outline-none focus:ring-1 focus:ring-gray-500"
            />
            {languages.length > 1 && (
              <select
                value={language}
                onChange={(e) => setLanguage(e.target.value)}
                className="bg-gray-900 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:ring-1 focus:ring-gray-500"
              >
                <option value="">All languages</option>
                {languages.map((lang) => (
                  <option key={lang} value={lang}>
                    {lang}
                  </option>
                ))}
              </select>
            )}
          </div>

          {/* Active tag chips */}
          {activeTags.length > 0 && (
            <div className="flex flex-wrap gap-1.5 items-center">
              <span className="text-xs text-gray-500">Tags:</span>
              {activeTags.map((tag) => (
                <button
                  key={tag}
                  onClick={() => toggleTag(tag)}
                  className="text-xs px-2 py-0.5 rounded-full bg-gray-700 text-white flex items-center gap-1 hover:bg-gray-600 transition-colors"
                >
                  {tag}
                  <span className="opacity-60">×</span>
                </button>
              ))}
              <button
                onClick={() => setActiveTags([])}
                className="text-xs text-gray-500 hover:text-gray-300 transition-colors"
              >
                Clear all
              </button>
            </div>
          )}
        </div>
      )}

      {/* List */}
      {snippets.length === 0 ? (
        <div className="flex flex-col items-center justify-center h-64 border border-dashed border-gray-700 rounded-xl gap-3">
          <p className="text-gray-400">No snippets yet</p>
          <Link
            href="/dashboard/new"
            className="text-sm text-white underline underline-offset-4"
          >
            Save your first snippet
          </Link>
        </div>
      ) : filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center h-48 border border-dashed border-gray-800 rounded-xl gap-2">
          <p className="text-gray-400 text-sm">No snippets match your filters</p>
          <button
            onClick={() => {
              setSearch('')
              setLanguage('')
              setActiveTags([])
            }}
            className="text-xs text-gray-500 hover:text-gray-300 transition-colors underline underline-offset-4"
          >
            Clear filters
          </button>
        </div>
      ) : (
        <div className="grid gap-3">
          {filtered.map((snippet) => (
            <SnippetCard
              key={snippet.id}
              snippet={snippet}
              activeTags={activeTags}
              onTagClick={toggleTag}
            />
          ))}
        </div>
      )}
    </div>
  )
}

function SnippetCard({
  snippet,
  activeTags,
  onTagClick,
}: {
  snippet: Snippet
  activeTags: string[]
  onTagClick: (tag: string) => void
}) {
  return (
    <div className="border border-gray-800 rounded-xl p-4 bg-gray-900 hover:border-gray-700 transition-colors">
      <Link href={`/dashboard/s/${snippet.slug}`} className="block mb-3">
        <div className="flex items-start justify-between gap-4">
          <h3 className="font-medium text-white">{snippet.title}</h3>
          <span className="shrink-0 text-xs px-2 py-1 rounded-md bg-gray-800 text-gray-300 font-mono">
            {snippet.language}
          </span>
        </div>
        {snippet.description && (
          <p className="text-sm text-gray-400 mt-1">{snippet.description}</p>
        )}
        <pre className="text-xs text-gray-400 font-mono bg-gray-950 rounded-lg p-3 overflow-x-auto max-h-24 overflow-y-hidden mt-3">
          {snippet.code}
        </pre>
      </Link>
      {snippet.tags.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {snippet.tags.map((tag) => (
            <button
              key={tag}
              onClick={() => onTagClick(tag)}
              className={`text-xs px-2 py-0.5 rounded-full transition-colors ${
                activeTags.includes(tag)
                  ? 'bg-gray-600 text-white'
                  : 'bg-gray-800 text-gray-400 hover:bg-gray-700 hover:text-gray-300'
              }`}
            >
              {tag}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
