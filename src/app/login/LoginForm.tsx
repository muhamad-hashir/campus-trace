'use client'

import { useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/utils/supabase/client'
import { LogIn } from 'lucide-react'

export default function LoginForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const nextPath = searchParams.get('next')
  const callbackError = searchParams.get('error') === 'auth_callback_failed'

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  const handleLogin = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setError(null)
    setLoading(true)

    const supabase = createClient()
    const { error: authError } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    setLoading(false)

    if (authError) {
      setError(authError.message)
      return
    }

    // Route through the callback so Next.js picks up the refreshed session cookie.
    router.replace(nextPath && nextPath.startsWith('/') ? nextPath : '/')
    router.refresh()
  }

  return (
    <div className="max-w-md mx-auto my-10">
      <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-200">
        <div className="text-center mb-8">
          <div className="w-12 h-12 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center mx-auto mb-4">
            <LogIn className="w-6 h-6" />
          </div>
          <h1 className="text-2xl font-extrabold text-gray-900">Welcome back</h1>
          <p className="text-gray-500 mt-1">Sign in to your CampusTrace account</p>
        </div>

        <form onSubmit={handleLogin} className="space-y-5">
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1.5">
              Email
            </label>
            <input
              id="email"
              type="email"
              required
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@university.edu"
              className="w-full px-4 py-2.5 text-gray-900 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
            />
          </div>

          <div>
            <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1.5">
              Password
            </label>
            <input
              id="password"
              type="password"
              required
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full px-4 py-2.5 text-gray-900 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
            />
          </div>

          {callbackError && (
            <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg px-4 py-3">
              Your sign-in link is invalid or has expired. Please sign in again.
            </div>
          )}

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg px-4 py-3">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-600 text-white py-2.5 rounded-lg font-medium hover:bg-blue-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Signing in...' : 'Sign In'}
          </button>
        </form>

        <p className="text-sm text-gray-500 text-center mt-6">
          Don&apos;t have an account?{' '}
          <Link
            href="/signup"
            className="text-blue-600 font-medium hover:text-blue-700 hover:underline"
          >
            Sign up
          </Link>
        </p>
      </div>
    </div>
  )
}
