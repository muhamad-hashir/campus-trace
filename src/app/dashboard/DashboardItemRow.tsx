'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/utils/supabase/client'
import {
  CheckCircle2,
  Trash2,
  Loader2,
  RotateCcw,
  MapPin,
  Calendar,
} from 'lucide-react'

export type DashboardItem = {
  id: string
  title: string
  category: string
  type: string
  location: string
  date_occurred: string
  image_url: string | null
  status: string
  created_at: string
}

// Best-effort extraction of the Storage path back out of a public URL so the
// image object can be cleaned up on delete.
function storagePathFromUrl(url: string): string | null {
  const marker = '/object/public/item-images/'
  const index = url.indexOf(marker)
  return index === -1 ? null : url.slice(index + marker.length)
}

export default function DashboardItemRow({ item }: { item: DashboardItem }) {
  const router = useRouter()
  const [status, setStatus] = useState(item.status)
  const [pending, setPending] = useState<'none' | 'resolve' | 'reopen' | 'delete'>('none')
  const [error, setError] = useState<string | null>(null)
  const [confirmingDelete, setConfirmingDelete] = useState(false)

  const resolved = status === 'RESOLVED'

  const toggleResolved = async () => {
    setError(null)
    const nextStatus = resolved ? 'OPEN' : 'RESOLVED'
    setPending(resolved ? 'reopen' : 'resolve')

    const supabase = createClient()
    const { error: updateError } = await supabase
      .from('items')
      .update({ status: nextStatus })
      .eq('id', item.id)

    setPending('none')

    if (updateError) {
      setError(updateError.message)
      return
    }

    setStatus(nextStatus)
    router.refresh()
  }

  const handleDelete = async () => {
    setError(null)
    setPending('delete')

    const supabase = createClient()

    // RLS ensures only the creator's row can be deleted.
    const { error: deleteError } = await supabase.from('items').delete().eq('id', item.id)

    if (deleteError) {
      setPending('none')
      setError(deleteError.message)
      return
    }

    // Best-effort cleanup of the image; row deletion already succeeded.
    if (item.image_url) {
      const path = storagePathFromUrl(item.image_url)
      if (path) {
        await supabase.storage.from('item-images').remove([path])
      }
    }

    router.refresh()
  }

  const typeBadge = resolved
    ? 'bg-gray-200 text-gray-600'
    : item.type === 'LOST'
      ? 'bg-red-100 text-red-700'
      : 'bg-green-100 text-green-700'

  return (
    <div
      className={`bg-white rounded-xl border shadow-sm overflow-hidden transition ${
        resolved ? 'border-gray-200 opacity-80' : 'border-gray-200 hover:shadow-md'
      }`}
    >
      <div className="flex flex-col sm:flex-row">
        {/* Thumbnail */}
        <Link href={`/items/${item.id}`} className="shrink-0">
          <div className="sm:w-40 h-40 sm:h-auto bg-gray-100 overflow-hidden">
            {item.image_url ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={item.image_url}
                alt={item.title}
                className="h-full w-full object-cover"
              />
            ) : (
              <div className="h-full w-full flex items-center justify-center text-gray-300 text-xs">
                No photo
              </div>
            )}
          </div>
        </Link>

        {/* Body */}
        <div className="flex-grow p-4">
          <div className="flex flex-wrap items-center gap-2 mb-1.5">
            <span
              className={`text-xs font-bold px-2 py-0.5 rounded uppercase tracking-wider ${typeBadge}`}
            >
              {resolved ? 'Resolved' : item.type}
            </span>
            <span className="text-xs text-gray-400 font-medium">{item.category}</span>
          </div>

          <Link href={`/items/${item.id}`} className="hover:text-blue-600 transition">
            <h3
              className={`font-bold text-lg text-gray-900 ${
                resolved ? 'line-through text-gray-500' : ''
              }`}
            >
              {item.title}
            </h3>
          </Link>

          <div className="flex flex-wrap text-sm text-gray-500 gap-x-4 gap-y-1 mt-1">
            <span className="flex items-center gap-1">
              <MapPin className="w-3.5 h-3.5" />
              {item.location}
            </span>
            <span className="flex items-center gap-1">
              <Calendar className="w-3.5 h-3.5" />
              {item.date_occurred}
            </span>
          </div>

          {error && (
            <p className="mt-2 text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-1.5">
              {error}
            </p>
          )}
        </div>

        {/* Actions */}
        <div className="flex sm:flex-col gap-2 p-4 justify-end sm:justify-center sm:min-w-[190px]">
          <button
            type="button"
            onClick={toggleResolved}
            disabled={pending !== 'none'}
            title={resolved ? 'Mark as open again' : 'Mark as resolved'}
            className={`flex-1 sm:flex-none flex items-center justify-center gap-1.5 px-3.5 py-2 rounded-lg text-sm font-medium transition disabled:opacity-50 ${
              resolved
                ? 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                : 'bg-green-600 text-white hover:bg-green-700'
            }`}
          >
            {pending === 'resolve' || pending === 'reopen' ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : resolved ? (
              <RotateCcw className="w-4 h-4" />
            ) : (
              <CheckCircle2 className="w-4 h-4" />
            )}
            {resolved ? 'Reopen' : 'Mark Resolved'}
          </button>

          {confirmingDelete ? (
            <div className="flex-1 sm:flex-none flex items-center gap-1.5">
              <button
                type="button"
                onClick={handleDelete}
                disabled={pending !== 'none'}
                className="flex-1 bg-red-600 text-white px-3 py-2 rounded-lg text-sm font-medium hover:bg-red-700 transition disabled:opacity-50"
              >
                {pending === 'delete' ? (
                  <Loader2 className="w-4 h-4 animate-spin mx-auto" />
                ) : (
                  'Confirm'
                )}
              </button>
              <button
                type="button"
                onClick={() => setConfirmingDelete(false)}
                disabled={pending !== 'none'}
                className="px-2 py-2 text-sm text-gray-500 hover:text-gray-700 disabled:opacity-50"
              >
                ✕
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => setConfirmingDelete(true)}
              disabled={pending !== 'none'}
              title="Delete this post"
              className="flex-1 sm:flex-none flex items-center justify-center gap-1.5 px-3.5 py-2 rounded-lg text-sm font-medium text-red-600 bg-red-50 hover:bg-red-100 transition disabled:opacity-50"
            >
              <Trash2 className="w-4 h-4" />
              Delete
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
