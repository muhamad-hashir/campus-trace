'use client'

import { useEffect, useRef, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Search } from 'lucide-react'

const CATEGORIES = [
  'Electronics',
  'Keys',
  'Wallet/Cards',
  'ID Card',
  'Clothing',
  'Books',
  'Accessories',
  'Other',
] as const

type TypeFilter = '' | 'lost' | 'found'

export default function FeedFilters() {
  const router = useRouter()
  const searchParams = useSearchParams()

  const currentType = (searchParams.get('type') as TypeFilter) ?? ''
  const currentCategory = searchParams.get('category') ?? ''

  const [queryValue, setQueryValue] = useState(searchParams.get('q') ?? '')
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  // Debounced, live search: update the `q` URL param 350ms after typing stops.
  const handleQueryChange = (value: string) => {
    setQueryValue(value)

    if (debounceRef.current) clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => {
      const params = new URLSearchParams(searchParams.toString())
      if (value.trim()) {
        params.set('q', value.trim())
      } else {
        params.delete('q')
      }
      router.replace(params.toString() ? `/?${params}` : '/', { scroll: false })
    }, 350)
  }

  useEffect(() => {
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current)
    }
  }, [])

  const setType = (type: TypeFilter) => {
    const params = new URLSearchParams(searchParams.toString())
    if (type) {
      params.set('type', type)
    } else {
      params.delete('type')
    }
    router.replace(params.toString() ? `/?${params}` : '/', { scroll: false })
  }

  const setCategory = (category: string) => {
    const params = new URLSearchParams(searchParams.toString())
    if (category) {
      params.set('category', category)
    } else {
      params.delete('category')
    }
    router.replace(params.toString() ? `/?${params}` : '/', { scroll: false })
  }

  const typeOptions: { value: TypeFilter; label: string }[] = [
    { value: '', label: 'All' },
    { value: 'lost', label: 'Lost' },
    { value: 'found', label: 'Found' },
  ]

  return (
    <div className="flex flex-col sm:flex-row gap-3">
      {/* Search */}
      <div className="flex items-center bg-white border border-gray-200 rounded-lg overflow-hidden focus-within:border-gray-900 transition-colors flex-grow">
        <label htmlFor="feed-search" className="sr-only">
          Search items
        </label>
        <div className="pl-3 text-gray-400">
          <Search className="w-4 h-4" aria-hidden="true" />
        </div>
        <input
          id="feed-search"
          type="text"
          value={queryValue}
          onChange={(e) => handleQueryChange(e.target.value)}
          placeholder="Search keys, student IDs, laptops..."
          className="w-full bg-transparent px-3 py-2.5 text-sm text-gray-900 placeholder:text-gray-400 outline-none"
        />
      </div>

      {/* Type Filter */}
      <div
        role="group"
        aria-label="Filter by type"
        className="flex bg-gray-100 rounded-lg p-1 gap-1 self-start sm:self-auto"
      >
        {typeOptions.map((option) => (
          <button
            key={option.label}
            type="button"
            onClick={() => setType(option.value)}
            aria-pressed={currentType === option.value}
            className={`px-4 py-1.5 rounded-md text-sm font-medium transition-colors ${
              currentType === option.value
                ? 'bg-white text-gray-900 shadow-sm'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            {option.label}
          </button>
        ))}
      </div>

      {/* Category Filter */}
      <select
        aria-label="Filter by category"
        value={currentCategory}
        onChange={(e) => setCategory(e.target.value)}
        className="bg-white border border-gray-200 rounded-lg px-3 py-2.5 text-sm text-gray-900 hover:border-gray-300 focus:outline-none focus:border-gray-900 transition-colors"
      >
        <option value="">All Categories</option>
        {CATEGORIES.map((cat) => (
          <option key={cat} value={cat}>
            {cat}
          </option>
        ))}
      </select>
    </div>
  )
}
