'use client'

import { useState, useRef, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/utils/supabase/client'
import { LogOut, User } from 'lucide-react'

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
    const supabase = createClient()
    await supabase.auth.signOut()
    router.replace('/login')
    router.refresh()
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
        className="flex items-center gap-2 bg-blue-600 text-white pl-2 pr-3 py-1.5 rounded-full hover:bg-blue-700 transition font-medium shadow-sm"
      >
        <span className="w-7 h-7 rounded-full bg-blue-500/80 border border-white/40 flex items-center justify-center text-sm font-bold">
          {initials || <User className="w-4 h-4" />}
        </span>
        <span className="hidden sm:inline max-w-[140px] truncate">{displayName}</span>
      </button>

      {open && (
        <div
          role="menu"
          className="absolute right-0 mt-2 w-56 bg-white rounded-xl shadow-lg border border-gray-200 py-2 z-50"
        >
          <div className="px-4 py-2 border-b border-gray-100">
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
            className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 hover:text-blue-600 transition"
          >
            My Dashboard
          </Link>

          <button
            type="button"
            onClick={handleSignOut}
            role="menuitem"
            className="w-full text-left flex items-center gap-2 px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition"
          >
            <LogOut className="w-4 h-4" />
            Sign Out
          </button>
        </div>
      )}
    </div>
  )
}
