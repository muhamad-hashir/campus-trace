import { Suspense } from 'react'
import { connection } from 'next/server'
import { PackageSearch } from 'lucide-react'
import { createClient } from '@/utils/supabase/server'
import FeedFilters from '@/components/FeedFilters'
import ItemCard, { type FeedItem } from '@/components/ItemCard'

type HomeSearchParams = {
  type?: string
  category?: string
  q?: string
}

type Props = {
  searchParams: Promise<HomeSearchParams>
}

async function Feed({ searchParams }: Props) {
  const filters = await searchParams
  const { type, category, q } = filters

  // Supabase's auth check reads Date.now() internally; mark request-time.
  await connection()
  const supabase = await createClient()

  let query = supabase
    .from('items')
    .select('*, profiles(username)')
    .order('created_at', { ascending: false })

  if (type === 'lost' || type === 'found') {
    query = query.eq('type', type.toUpperCase())
  }

  if (category) {
    query = query.eq('category', category)
  }

  const searchTerm = q?.trim()
  if (searchTerm) {
    // Strip PostgREST filter-syntax characters so user input cannot alter the query.
    const safeTerm = searchTerm.replace(/[%,()!]/g, ' ').trim()
    if (safeTerm) {
      query = query.or(`title.ilike.%${safeTerm}%,description.ilike.%${safeTerm}%`)
    }
  }

  const { data: items } = await query
  const feedItems = (items ?? []) as FeedItem[]
  const hasActiveFilters = Boolean(type || category || searchTerm)

  return (
    <div className="space-y-8">
      {/* Filters (live search + type + category) */}
      <Suspense
        fallback={<div className="h-11 bg-gray-50 border border-gray-200 rounded-lg animate-pulse" />}
      >
        <FeedFilters />
      </Suspense>

      {/* Feed Title */}
      <div className="flex justify-between items-baseline">
        <h2 className="text-lg font-semibold text-gray-900 tracking-tight">
          {hasActiveFilters ? 'Filtered results' : 'Recent items'}
        </h2>
        <span className="text-sm text-gray-500 tabular-nums">
          {feedItems.length} item{feedItems.length === 1 ? '' : 's'}
        </span>
      </div>

      {/* Grid Layout */}
      {feedItems.length === 0 ? (
        <div className="bg-white border border-gray-200 rounded-xl p-16 text-center">
          <PackageSearch className="w-10 h-10 mx-auto mb-4 text-gray-300" aria-hidden="true" />
          <p className="font-medium text-gray-900">
            {hasActiveFilters ? 'No items match your filters.' : 'No items posted yet.'}
          </p>
          <p className="text-sm text-gray-500 mt-1">
            {hasActiveFilters
              ? 'Try a different search term or clear the filters.'
              : 'Be the first to post something lost or found!'}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {feedItems.map((item) => (
            <ItemCard key={item.id} item={item} />
          ))}
        </div>
      )}
    </div>
  )
}

export default function Home({ searchParams }: Props) {
  return (
    <div className="space-y-8">
      {/* Hero Header */}
      <div className="py-6 sm:py-10 text-center">
        <h1 className="text-3xl sm:text-4xl font-semibold tracking-tight text-gray-900 mb-3">
          Campus Lost &amp; Found
        </h1>
        <p className="text-base sm:text-lg text-gray-600 max-w-2xl mx-auto">
          Did you lose your ID card? Found a stray flash drive? Connect with your campus
          community to reclaim your stuff.
        </p>
      </div>

      {/* Feed streams over the static shell; searchParams + cookies resolve inside. */}
      <Suspense
        fallback={
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="bg-white border border-gray-200 rounded-xl h-80 animate-pulse" />
            ))}
          </div>
        }
      >
        <Feed searchParams={searchParams} />
      </Suspense>
    </div>
  )
}
