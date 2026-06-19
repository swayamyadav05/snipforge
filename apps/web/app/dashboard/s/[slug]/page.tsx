'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useParams, useRouter } from 'next/navigation'
import { getSnippet, highlightCode, deleteSnippet } from '@devsnap/core'
import type { Snippet } from '@devsnap/core'

export default function SnippetDetailPage() {
  const { slug } = useParams<{ slug: string }>()
  const router = useRouter()
  const [snippet, setSnippet] = useState<Snippet | null | undefined>(undefined)
  const [copied, setCopied] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState(false)
  const [deleting, setDeleting] = useState(false)

  useEffect(() => {
    getSnippet(slug).then(setSnippet).catch(() => setSnippet(null))
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

  const highlighted = highlightCode(snippet.code, snippet.language)

  function handleCopy() {
    navigator.clipboard.writeText(snippet!.code)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  async function handleDelete() {
    setDeleting(true)
    try {
      await deleteSnippet(snippet!.id)
      router.push('/dashboard')
    } catch {
      setDeleting(false)
      setConfirmDelete(false)
    }
  }

  return (
    <div className="max-w-3xl">
      {/* Nav */}
      <div className="flex items-center justify-between mb-6">
        <Link
          href="/dashboard"
          className="text-sm text-gray-400 hover:text-white transition-colors"
        >
          ← Back
        </Link>
        <div className="flex items-center gap-4">
          <Link
            href={`/dashboard/s/${slug}/edit`}
            className="text-sm text-gray-400 hover:text-white transition-colors"
          >
            Edit
          </Link>
          {!confirmDelete ? (
            <button
              onClick={() => setConfirmDelete(true)}
              className="text-sm text-red-400 hover:text-red-300 transition-colors"
            >
              Delete
            </button>
          ) : (
            <div className="flex items-center gap-3">
              <span className="text-sm text-gray-400">Delete this snippet?</span>
              <button
                onClick={handleDelete}
                disabled={deleting}
                className="text-sm text-red-400 hover:text-red-300 transition-colors disabled:opacity-50"
              >
                {deleting ? 'Deleting…' : 'Yes, delete'}
              </button>
              <button
                onClick={() => setConfirmDelete(false)}
                className="text-sm text-gray-500 hover:text-gray-300 transition-colors"
              >
                Cancel
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Title + language */}
      <div className="flex items-start justify-between gap-4 mb-3">
        <h2 className="text-2xl font-semibold leading-tight">{snippet.title}</h2>
        <span className="shrink-0 text-xs px-2 py-1 rounded-md bg-gray-800 text-gray-300 font-mono mt-1">
          {snippet.language}
        </span>
      </div>

      {snippet.description && (
        <p className="text-gray-400 mb-4">{snippet.description}</p>
      )}

      {snippet.tags.length > 0 && (
        <div className="flex flex-wrap gap-1.5 mb-5">
          {snippet.tags.map((tag) => (
            <span
              key={tag}
              className="text-xs px-2 py-0.5 rounded-full bg-gray-800 text-gray-400"
            >
              {tag}
            </span>
          ))}
        </div>
      )}

      {/* Code block */}
      <div className="relative">
        <button
          onClick={handleCopy}
          className="absolute top-3 right-3 z-10 px-3 py-1.5 text-xs rounded-md bg-gray-700 text-gray-300 hover:bg-gray-600 transition-colors"
        >
          {copied ? 'Copied!' : 'Copy'}
        </button>
        <pre className="hljs rounded-xl overflow-x-auto p-5 text-sm leading-relaxed">
          <code dangerouslySetInnerHTML={{ __html: highlighted }} />
        </pre>
      </div>

      <p className="text-xs text-gray-500 mt-4">
        Saved{' '}
        {new Date(snippet.createdAt).toLocaleDateString('en-US', {
          month: 'long',
          day: 'numeric',
          year: 'numeric',
        })}
      </p>
    </div>
  )
}
