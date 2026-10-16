import Link from 'next/link'
import { SearchX } from 'lucide-react'

export default function NotFound() {
  return (
    <div className="max-w-md mx-auto my-16 sm:my-24 text-center">
      <div className="bg-white p-8 rounded-xl border border-gray-200">
        <div className="w-10 h-10 bg-gray-100 text-gray-500 rounded-full flex items-center justify-center mx-auto mb-4">
          <SearchX className="w-5 h-5" aria-hidden="true" />
        </div>
        <h1 className="text-xl font-semibold tracking-tight text-gray-900 mb-2">
          Page not found
        </h1>
        <p className="text-sm text-gray-600 leading-relaxed">
          This page or item doesn&apos;t exist — it may have been removed after
          being resolved.
        </p>
        <Link
          href="/"
          className="inline-block mt-6 bg-gray-900 text-white px-5 py-2.5 rounded-lg text-sm font-medium hover:bg-gray-800 transition-colors"
        >
          Browse the feed
        </Link>
      </div>
    </div>
  )
}
