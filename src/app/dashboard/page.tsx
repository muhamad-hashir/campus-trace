import Link from 'next/link'
import { PlusCircle, ClipboardList } from 'lucide-react'
import { connection } from 'next/server'
import { createClient } from '@/utils/supabase/server'
import DashboardItemRow, { type DashboardItem } from './DashboardItemRow'

export const metadata = {
  title: 'My Posts | CampusTrace',
}

// Per-user private page: rendered at request time (cookies + auth), never prerendered.
export const instant = false

export default async function DashboardPage() {
  const supabase = await createClient()

  // Auth is enforced by middleware; getUser() both confirms it and lets RLS
  // scope this query to the signed-in user's rows.
  await connection() // Supabase reads Date.now() internally; mark request-time.
  const {
    data: { user },
  } = await supabase.auth.getUser()

  const { data: items } = await supabase
    .from('items')
    .select(
      'id, title, category, type, location, date_occurred, image_url, status, created_at'
    )
    .eq('user_id', user?.id ?? '') // RLS also enforces this; explicit for safety
    .order('created_at', { ascending: false })

  const feedItems = (items ?? []) as DashboardItem[]

  const openCount = feedItems.filter((i) => i.status === 'OPEN').length
  const resolvedCount = feedItems.filter((i) => i.status === 'RESOLVED').length

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-gray-900">My Posts</h1>
          <p className="text-gray-500 mt-1">
            Manage the items you have reported lost or found on campus.
          </p>
        </div>
        <Link
          href="/items/new"
          className="inline-flex items-center gap-2 bg-blue-600 text-white px-4 py-2.5 rounded-lg font-medium hover:bg-blue-700 transition shadow-sm"
        >
          <PlusCircle className="w-5 h-5" />
          Post New Item
        </Link>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-white border border-gray-200 rounded-xl p-4 text-center">
          <p className="text-2xl font-extrabold text-gray-900">{feedItems.length}</p>
          <p className="text-xs uppercase tracking-wide text-gray-400 font-semibold">
            Total Posts
          </p>
        </div>
        <div className="bg-white border border-gray-200 rounded-xl p-4 text-center">
          <p className="text-2xl font-extrabold text-blue-600">{openCount}</p>
          <p className="text-xs uppercase tracking-wide text-gray-400 font-semibold">
            Open
          </p>
        </div>
        <div className="bg-white border border-gray-200 rounded-xl p-4 text-center">
          <p className="text-2xl font-extrabold text-green-600">{resolvedCount}</p>
          <p className="text-xs uppercase tracking-wide text-gray-400 font-semibold">
            Resolved
          </p>
        </div>
      </div>

      {/* Items list */}
      {feedItems.length === 0 ? (
        <div className="bg-white border border-gray-200 rounded-2xl p-16 text-center text-gray-400">
          <ClipboardList className="w-12 h-12 mx-auto mb-4 text-gray-300" />
          <p className="font-medium text-gray-600">You haven&apos;t posted anything yet.</p>
          <p className="text-sm mt-1">
            Lost your keys? Found a laptop? Post it and help the campus community.
          </p>
          <Link
            href="/items/new"
            className="inline-block mt-6 bg-blue-600 text-white px-6 py-2.5 rounded-lg font-medium hover:bg-blue-700 transition"
          >
            Post Your First Item
          </Link>
        </div>
      ) : (
        <div className="space-y-4">
          {feedItems.map((item) => (
            <DashboardItemRow key={item.id} item={item} />
          ))}
        </div>
      )}
    </div>
  )
}
