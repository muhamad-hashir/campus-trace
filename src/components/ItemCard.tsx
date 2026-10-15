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
    ? 'bg-gray-200 text-gray-600'
    : item.type === 'LOST'
      ? 'bg-red-100 text-red-700'
      : 'bg-green-100 text-green-700'
  const badgeText = resolved ? 'Resolved' : item.type === 'LOST' ? 'Lost' : 'Found'

  return (
    <Link
      href={`/items/${item.id}`}
      className="group bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden flex flex-col hover:shadow-md transition"
    >
      <div className="h-48 bg-gray-100 w-full overflow-hidden">
        {item.image_url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={item.image_url}
            alt={item.title}
            className="h-full w-full object-cover group-hover:scale-105 transition duration-300"
          />
        ) : (
          <div className="h-full w-full flex items-center justify-center text-gray-300 text-sm bg-gray-50">
            No photo
          </div>
        )}
      </div>

      <div className="p-5 flex-grow flex flex-col">
        <div className="flex justify-between items-start mb-3">
          <span
            className={`text-xs font-bold px-2 py-1 rounded uppercase tracking-wider ${badgeClasses}`}
          >
            {badgeText}
          </span>
          <span className="text-sm text-gray-500 flex items-center gap-1">
            <Calendar className="w-4 h-4" />
            {formatRelative(item.created_at)}
          </span>
        </div>

        <h3 className="text-lg font-bold text-gray-900 mb-1 line-clamp-1">{item.title}</h3>
        <p className="text-sm text-gray-400 mb-2 font-medium">{item.category}</p>
        <p className="text-gray-600 text-sm mb-4 line-clamp-2">{item.description}</p>

        <div className="mt-auto space-y-1.5">
          <div className="flex items-center text-sm text-gray-500 gap-1 bg-gray-50 p-2 rounded-md">
            <MapPin className="w-4 h-4 text-blue-500" />
            <span className="font-medium line-clamp-1">{item.location}</span>
          </div>
          <p className="text-xs text-gray-400 px-1">
            Posted by{' '}
            <span className="font-medium text-gray-600">
              {item.profiles?.username ? `@${item.profiles.username}` : 'a student'}
            </span>
          </p>
        </div>
      </div>
    </Link>
  )
}
