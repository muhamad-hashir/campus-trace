import Link from 'next/link'
import { MapPin, Calendar } from 'lucide-react'

export type FeedItem = {
  id: string
  title: string
  description: string | null
  category: string
  type: string
  location: string
  date_occurred: string
  image_url: string | null
  status: string
  created_at: string
  profiles: { username: string | null } | null
}

function formatRelative(dateString: string): string {
  const date = new Date(dateString)
  const diffMs = Date.now() - date.getTime()
  const minutes = Math.floor(diffMs / 60_000)
  const hours = Math.floor(minutes / 60)
  const days = Math.floor(hours / 24)

  if (minutes < 1) return 'Just now'
  if (minutes < 60) return `${minutes}m ago`
  if (hours < 24) return `${hours}h ago`
  if (days < 7) return `${days}d ago`
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

export default function ItemCard({ item }: { item: FeedItem }) {
  const resolved = item.status === 'RESOLVED'

  const badgeClasses = resolved
    ? 'border-gray-200 bg-white text-gray-500'
    : item.type === 'LOST'
      ? 'border-red-200 bg-red-50 text-red-700'
      : 'border-emerald-200 bg-emerald-50 text-emerald-700'
  const badgeText = resolved ? 'Resolved' : item.type === 'LOST' ? 'Lost' : 'Found'

  return (
    <Link
      href={`/items/${item.id}`}
      className="group bg-white rounded-xl border border-gray-200 overflow-hidden flex flex-col hover:border-gray-300 transition-colors"
    >
      <div className="h-44 bg-gray-100 w-full overflow-hidden">
        {item.image_url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={item.image_url}
            alt={item.title}
            className="h-full w-full object-cover"
          />
        ) : (
          <div className="h-full w-full flex items-center justify-center text-sm text-gray-400">
            No photo
          </div>
        )}
      </div>

      <div className="p-5 flex-grow flex flex-col">
        <div className="flex justify-between items-center mb-3">
          <span
            className={`text-[11px] font-semibold px-2 py-0.5 rounded-full border ${badgeClasses}`}
          >
            {badgeText}
          </span>
          <time className="text-xs text-gray-500 flex items-center gap-1">
            <Calendar className="w-3.5 h-3.5" aria-hidden="true" />
            {formatRelative(item.created_at)}
          </time>
        </div>

        <h3 className="text-base font-semibold text-gray-900 mb-1 line-clamp-1 group-hover:text-gray-700 transition-colors">
          {item.title}
        </h3>
        <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-2">
          {item.category}
        </p>
        <p className="text-sm text-gray-600 mb-4 line-clamp-2 leading-relaxed">
          {item.description}
        </p>

        <div className="mt-auto space-y-1.5">
          <div className="flex items-center text-sm text-gray-600 gap-1.5 border-t border-gray-100 pt-3">
            <MapPin className="w-3.5 h-3.5 text-gray-400" aria-hidden="true" />
            <span className="font-medium line-clamp-1">{item.location}</span>
          </div>
          <p className="text-xs text-gray-500">
            Posted by{' '}
            <span className="font-medium text-gray-700">
              {item.profiles?.username ? `@${item.profiles.username}` : 'a student'}
            </span>
          </p>
        </div>
      </div>
    </Link>
  )
}
