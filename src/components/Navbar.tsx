import Link from 'next/link'
import { PlusCircle, User } from 'lucide-react'
import { connection } from 'next/server'
import { createClient } from '@/utils/supabase/server'
import NavbarUserMenu from './NavbarUserMenu'

export default async function Navbar() {
  // The Navbar is user-aware: render per request. Supabase's session check
  // reads Date.now() internally, which Next 16 forbids in prerendered HTML.
  await connection()

  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  return (
    <nav className="border-b bg-white shadow-sm sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16 items-center">

          {/* Logo & Main Links */}
          <div className="flex items-center gap-8">
            <Link href="/" className="text-2xl font-extrabold text-blue-600 tracking-tight">
              CampusTrace
            </Link>
            <div className="hidden md:flex gap-6 text-gray-600 font-medium">
              <Link href="/" className="hover:text-blue-600 transition">All Items</Link>
              <Link href="/?type=lost" className="hover:text-blue-600 transition">Lost</Link>
              <Link href="/?type=found" className="hover:text-blue-600 transition">Found</Link>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-4">
            <Link href="/items/new" className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition font-medium shadow-sm">
              <PlusCircle className="w-5 h-5" />
              <span className="hidden sm:inline">Post Item</span>
            </Link>

            {user ? (
              <NavbarUserMenu
                email={user.email ?? ''}
                fullName={user.user_metadata?.full_name}
                username={user.user_metadata?.username}
              />
            ) : (
              <Link href="/login" aria-label="Sign in" className="p-2 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-full transition">
                <User className="w-6 h-6" />
              </Link>
            )}
          </div>

        </div>
      </div>
    </nav>
  )
}
