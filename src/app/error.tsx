'use client'

import { useEffect } from 'react'
import Link from 'next/link'
import { AlertTriangle, RotateCcw } from 'lucide-react'

export default function ErrorPage({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    // Surfaced in browser devtools / error reporting; digest helps correlate
    // with the server-side log entry.
    console.error('Route error:', error)
  }, [error])

  return (
    <div className="max-w-md mx-auto my-16 sm:my-24 text-center">
      <div className="bg-white p-8 rounded-xl border border-gray-200">
        <div className="w-10 h-10 bg-red-50 text-red-600 rounded-full flex items-center justify-center mx-auto mb-4">
          <AlertTriangle className="w-5 h-5" aria-hidden="true" />
        </div>
        <h1 className="text-xl font-semibold tracking-tight text-gray-900 mb-2">
          Something went wrong
        </h1>
        <p className="text-sm text-gray-600 leading-relaxed">
          The page failed to load. This is usually temporary — try again, or head
          back to the feed.
        </p>
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 mt-6">
          <button
            type="button"
            onClick={reset}
            className="inline-flex items-center gap-1.5 bg-gray-900 text-white px-5 py-2.5 rounded-lg text-sm font-medium hover:bg-gray-800 transition-colors"
          >
            <RotateCcw className="w-4 h-4" aria-hidden="true" />
            Try again
          </button>
          <Link
            href="/"
            className="text-sm font-medium text-gray-600 hover:text-gray-900 underline underline-offset-2 hover:no-underline"
          >
            Back to all items
          </Link>
        </div>
      </div>
    </div>
  )
}
