import type { Metadata } from 'next'
import './globals.css'
import 'highlight.js/styles/github-dark.css'

export const metadata: Metadata = {
  title: 'DevSnap',
  description: 'Your personal code snippet manager',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className="antialiased">{children}</body>
    </html>
  )
}
