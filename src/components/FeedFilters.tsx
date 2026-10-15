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
      <div className="flex items-center bg-white border border-gray-300 rounded-lg overflow-hidden focus-within:ring-2 focus-within:ring-blue-500 transition flex-grow">
        <div className="pl-3 text-gray-400">
          <Search className="w-5 h-5" />
        </div>
        <input
          type="text"
          value={queryValue}
          onChange={(e) => handleQueryChange(e.target.value)}
          placeholder="Search for keys, student IDs, laptops..."
          className="w-full bg-transparent px-3 py-2.5 text-gray-900 placeholder:text-gray-400 outline-none"
        />
      </div>

      {/* Type Filter */}
      <div className="flex bg-white border border-gray-300 rounded-lg p-1 gap-1">
        {typeOptions.map((option) => (
          <button
            key={option.label}
            type="button"
            onClick={() => setType(option.value)}
            className={`px-4 py-1.5 rounded-md text-sm font-medium transition ${
              currentType === option.value
                ? option.value === 'lost'
                  ? 'bg-red-100 text-red-700'
                  : option.value === 'found'
                    ? 'bg-green-100 text-green-700'
                    : 'bg-gray-900 text-white'
                : 'text-gray-600 hover:bg-gray-100'
            }`}
          >
            {option.label}
          </button>
        ))}
      </div>

      {/* Category Filter */}
      <select
        value={currentCategory}
        onChange={(e) => setCategory(e.target.value)}
        className="bg-white border border-gray-300 rounded-lg px-3 py-2.5 text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
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
