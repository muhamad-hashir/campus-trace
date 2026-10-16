import Link from 'next/link'
import { Plus, UserRound } from 'lucide-react'
import { connection } from 'next/server'
import { createClient } from '@/utils/supabase/server'
import NavbarUserMenu from './NavbarUserMenu'

const navLinks = [
  { href: '/', label: 'All Items' },
  { href: '/?type=lost', label: 'Lost' },
  { href: '/?type=found', label: 'Found' },
]

export default async function Navbar() {
  // The Navbar is user-aware: render per request. Supabase's session check
  // reads Date.now() internally, which Next 16 forbids in prerendered HTML.
  await connection()

  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  return (
    <nav className="border-b border-gray-200 bg-white sticky top-0 z-50">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16 items-center gap-4">

          {/* Logo & Main Links */}
          <div className="flex items-center gap-6 sm:gap-8 min-w-0">
            <Link
              href="/"
              className="text-lg font-semibold text-gray-900 tracking-tight whitespace-nowrap"
            >
              CampusTrace
            </Link>
            <nav aria-label="Primary" className="hidden md:flex items-center gap-1">
              {navLinks.map((link) => (
                <Link
                  key={link.label}
                  href={link.href}
                  className="px-3 py-2 rounded-lg text-sm font-medium text-gray-600 hover:text-gray-900 hover:bg-gray-100 transition-colors"
                >
                  {link.label}
                </Link>
              ))}
            </nav>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-2 sm:gap-3 shrink-0">
            <Link
              href="/items/new"
              className="flex items-center gap-1.5 bg-gray-900 text-white px-3.5 py-2 rounded-lg hover:bg-gray-800 transition-colors font-medium text-sm"
            >
              <Plus className="w-4 h-4" aria-hidden="true" />
              <span className="hidden sm:inline">Post Item</span>
            </Link>

            {user ? (
              <NavbarUserMenu
                email={user.email ?? ''}
                fullName={user.user_metadata?.full_name}
                username={user.user_metadata?.username}
              />
            ) : (
              <Link
                href="/login"
                aria-label="Sign in"
                className="p-2 rounded-lg text-gray-500 hover:text-gray-900 hover:bg-gray-100 transition-colors"
              >
                <UserRound className="w-5 h-5" aria-hidden="true" />
              </Link>
            )}
          </div>

        </div>
      </div>
    </nav>
  )
}
