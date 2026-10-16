'use client'

import { useState, useRef, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/utils/supabase/client'
import { LogOut, UserRound } from 'lucide-react'

type UserMenuProps = {
  email: string
  fullName?: string
  username?: string
}

export default function NavbarUserMenu({ email, fullName, username }: UserMenuProps) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const displayName = fullName || (username ? `@${username}` : email)

  const handleSignOut = async () => {
    setOpen(false)
    try {
      const supabase = createClient()
      await supabase.auth.signOut()
    } catch (err) {
      // Signing out must never strand the user: even if the network call
      // fails, still route to sign-in so the flow continues. (Best-effort
      // local cleanup — httpOnly session cookies remain until the server
      // clears them on the next sign-in.)
      console.error('Sign out failed:', err)
    } finally {
      router.replace('/login')
      router.refresh()
    }
  }

  const initials = (fullName || username || email)
    .split(/\s+/)
    .map((part) => part[0])
    .filter(Boolean)
    .slice(0, 2)
    .join('')
    .toUpperCase()

  return (
    <div className="relative" ref={menuRef}>
      <button
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        aria-expanded={open}
        aria-haspopup="menu"
        className="flex items-center gap-2 pl-1.5 pr-2.5 py-1.5 rounded-full border border-gray-200 bg-white text-gray-700 hover:border-gray-300 hover:bg-gray-50 transition-colors font-medium text-sm shadow-sm"
      >
        <span className="w-7 h-7 rounded-full bg-gray-900 text-white flex items-center justify-center text-[11px] font-semibold">
          {initials || <UserRound className="w-4 h-4" />}
        </span>
        <span className="hidden sm:inline max-w-[140px] truncate text-gray-900">{displayName}</span>
      </button>

      {open && (
        <div
          role="menu"
          className="absolute right-0 mt-2 w-56 bg-white rounded-xl shadow-lg border border-gray-200 py-2 z-50"
        >
          <div className="px-4 py-2.5 border-b border-gray-100">
            <p className="text-sm font-semibold text-gray-900 truncate">
              {fullName || username || email}
            </p>
            {username && <p className="text-xs text-gray-500 truncate">@{username}</p>}
            <p className="text-xs text-gray-400 truncate">{email}</p>
          </div>

          <Link
            href="/dashboard"
            onClick={() => setOpen(false)}
            role="menuitem"
            className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 hover:text-gray-900 transition-colors"
          >
            My Dashboard
          </Link>

          <button
            type="button"
            onClick={handleSignOut}
            role="menuitem"
            className="w-full text-left flex items-center gap-2 px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors"
          >
            <LogOut className="w-4 h-4" />
            Sign Out
          </button>
        </div>
      )}
    </div>
  )
}
