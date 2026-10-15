import Link from 'next/link'
import { notFound } from 'next/navigation'
import { Suspense } from 'react'
import {
  MapPin,
  Calendar,
  Tag,
  ArrowLeft,
  Clock,
} from 'lucide-react'
import { createClient } from '@/utils/supabase/server'

// Item detail is a blocking dynamic route: the shell is served at request
// time and the item data must not be prerendered (its timestamp is unstable).
export const instant = false

type ItemPageProps = {
  params: Promise<{ id: string }>
}

type ItemWithProfile = {
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
  profiles: {
    username: string | null
    full_name: string | null
    email: string | null
    phone: string | null
  } | null
}

function formatDate(dateString: string): string {
  return new Date(dateString + 'T00:00:00').toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })
}

function StatusBar({ status, type }: { status: string; type: string }) {
  const resolved = status === 'RESOLVED'
  const cls = resolved
    ? 'bg-gray-200 text-gray-600'
    : type === 'LOST'
      ? 'bg-red-100 text-red-700'
      : 'bg-green-100 text-green-700'
  const text = resolved ? 'Resolved' : type === 'LOST' ? 'Lost' : 'Found'
  return (
    <span className={`text-xs font-bold px-3 py-1.5 rounded-full uppercase tracking-wider ${cls}`}>
      {text}
    </span>
  )
}

async function ItemContent({ params }: ItemPageProps) {
  const { id } = await params
  const supabase = await createClient()

  // UUID format check: malformed ids could otherwise throw inside PostgREST.
  const isUuid =
    /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id)
  const { data } = isUuid
    ? await supabase
        .from('items')
        .select(
          '*, profiles(username, full_name, email, phone)'
        )
        .eq('id', id)
        .maybeSingle()
    : { data: null }

  const item = (data ?? null) as ItemWithProfile | null
  if (!item) {
    notFound()
  }

  const isLost = item.type === 'LOST'
  const poster = item.profiles

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <Link
        href="/"
        className="inline-flex items-center gap-2 text-sm font-medium text-gray-500 hover:text-blue-600 transition"
      >
        <ArrowLeft className="w-4 h-4" />
        Back to all items
      </Link>

      <article className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
        {item.image_url && (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={item.image_url}
            alt={item.title}
            className="w-full max-h-[450px] object-cover"
          />
        )}

        <div className="p-6 sm:p-10 space-y-6">
          {/* Header */}
          <div>
            <div className="flex flex-wrap items-center gap-3 mb-3">
              <StatusBar status={item.status} type={item.type} />
              <span className="text-sm text-gray-500 flex items-center gap-1">
                <Clock className="w-4 h-4" />
                Posted{' '}
                {new Date(item.created_at).toLocaleDateString('en-US', {
                  month: 'short',
                  day: 'numeric',
                })}
              </span>
            </div>
            <h1 className="text-3xl font-extrabold text-gray-900 mb-2">{item.title}</h1>
            <p className="text-gray-500">
              {isLost
                ? 'This item was reported lost by its owner.'
                : 'This item was found on campus and is looking for its owner.'}
            </p>
          </div>

          {/* Facts grid */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="flex items-start gap-3 bg-gray-50 border border-gray-100 rounded-xl p-4">
              <Tag className="w-5 h-5 text-blue-500 mt-0.5" />
              <div>
                <p className="text-xs uppercase tracking-wide text-gray-400 font-semibold mb-0.5">
                  Category
                </p>
                <p className="text-sm font-medium text-gray-900">{item.category}</p>
              </div>
            </div>
            <div className="flex items-start gap-3 bg-gray-50 border border-gray-100 rounded-xl p-4">
              <MapPin className="w-5 h-5 text-blue-500 mt-0.5" />
              <div>
                <p className="text-xs uppercase tracking-wide text-gray-400 font-semibold mb-0.5">
                  Location
                </p>
                <p className="text-sm font-medium text-gray-900">{item.location}</p>
              </div>
            </div>
            <div className="flex items-start gap-3 bg-gray-50 border border-gray-100 rounded-xl p-4">
              <Calendar className="w-5 h-5 text-blue-500 mt-0.5" />
              <div>
                <p className="text-xs uppercase tracking-wide text-gray-400 font-semibold mb-0.5">
                  {isLost ? 'Date lost' : 'Date found'}
                </p>
                <p className="text-sm font-medium text-gray-900">
                  {formatDate(item.date_occurred)}
                </p>
              </div>
            </div>
          </div>

          {/* Description */}
          <div>
            <h2 className="text-sm font-semibold text-gray-900 uppercase tracking-wide mb-2">
              Description
            </h2>
            <p className="text-gray-700 whitespace-pre-wrap leading-relaxed">
              {item.description}
            </p>
          </div>

          {/* Poster contact card */}
          <div className="border-t border-gray-200 pt-6">
            <h2 className="text-sm font-semibold text-gray-900 uppercase tracking-wide mb-3">
              {isLost ? 'Contact the owner' : 'Contact the finder'}
            </h2>
            <div className="bg-blue-50 border border-blue-100 rounded-xl p-5 flex flex-col sm:flex-row sm:items-center gap-4">
              <div className="w-12 h-12 rounded-full bg-blue-600 text-white flex items-center justify-center text-lg font-bold shrink-0">
                {(poster?.full_name || poster?.username || '?')
                  .split(/\s+/)
                  .map((p) => p[0])
                  .filter(Boolean)
                  .slice(0, 2)
                  .join('')
                  .toUpperCase()}
              </div>
              <div className="flex-grow">
                <p className="font-semibold text-gray-900">
                  {poster?.full_name || poster?.username || 'A student'}
                </p>
                {poster?.username && (
                  <p className="text-sm text-blue-600">@{poster.username}</p>
                )}
                {poster?.phone && (
                  <a
                    href={`tel:${poster.phone}`}
                    className="text-sm text-gray-600 hover:text-blue-600 transition"
                  >
                    {poster.phone}
                  </a>
                )}
              </div>
              {poster?.email && (
                <a
                  href={`mailto:${poster.email}?subject=${encodeURIComponent(
                    `CampusTrace: ${item.title}`
                  )}`}
                  className="bg-blue-600 text-white px-5 py-2.5 rounded-lg font-medium text-sm hover:bg-blue-700 transition text-center"
                >
                  Send Email
                </a>
              )}
            </div>
            <p className="text-xs text-gray-400 mt-2">
              Tip: be cautious when meeting strangers — arrange exchanges in public campus
              areas.
            </p>
          </div>
        </div>
      </article>
    </div>
  )
}

export default function ItemDetailPage({ params }: ItemPageProps) {
  return (
    <Suspense fallback={<div className="max-w-3xl mx-auto h-96 bg-white rounded-2xl border border-gray-200 animate-pulse" />}>
      <ItemContent params={params} />
    </Suspense>
  )
}
