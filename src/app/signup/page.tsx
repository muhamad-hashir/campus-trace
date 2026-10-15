'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/utils/supabase/client'
import { UserPlus } from 'lucide-react'

export default function SignupPage() {
  const router = useRouter()

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [username, setUsername] = useState('')
  const [fullName, setFullName] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [checkEmail, setCheckEmail] = useState(false)

  const handleSignup = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setError(null)
    setLoading(true)

    const supabase = createClient()
    const { data, error: authError } = await supabase.auth.signUp({
      email,
      password,
      // These metadata fields are copied to `profiles` by the database trigger.
      options: {
        data: {
          username,
          full_name: fullName,
        },
        emailRedirectTo: `${window.location.origin}/auth/confirm`,
      },
    })

    if (authError) {
      setLoading(false)
      setError(authError.message)
      return
    }

    // If email confirmation is enabled, the user is provisionally signed in
    // only after confirming via the emailed link.
    if (data.session) {
      router.replace('/')
      router.refresh()
      return
    }

    setLoading(false)
    setCheckEmail(true)
  }

  if (checkEmail) {
    return (
      <div className="max-w-md mx-auto my-10">
        <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-200 text-center">
          <div className="w-12 h-12 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center mx-auto mb-4">
            <UserPlus className="w-6 h-6" />
          </div>
          <h1 className="text-2xl font-extrabold text-gray-900 mb-2">Confirm your email</h1>
          <p className="text-gray-500">
            We&apos;ve sent a confirmation link to <strong>{email}</strong>. Click it to activate
            your account, then sign in.
          </p>
          <Link
            href="/login"
            className="inline-block mt-6 bg-blue-600 text-white px-6 py-2.5 rounded-lg font-medium hover:bg-blue-700 transition"
          >
            Back to Sign In
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-md mx-auto my-10">
      <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-200">
        <div className="text-center mb-8">
          <div className="w-12 h-12 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center mx-auto mb-4">
            <UserPlus className="w-6 h-6" />
          </div>
          <h1 className="text-2xl font-extrabold text-gray-900">Create your account</h1>
          <p className="text-gray-500 mt-1">Join your campus lost &amp; found community</p>
        </div>

        <form onSubmit={handleSignup} className="space-y-5">
          <div>
            <label htmlFor="full-name" className="block text-sm font-medium text-gray-700 mb-1.5">
              Full Name
            </label>
            <input
              id="full-name"
              type="text"
              required
              autoComplete="name"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              placeholder="Jane Doe"
              className="w-full px-4 py-2.5 text-gray-900 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
            />
          </div>

          <div>
            <label htmlFor="username" className="block text-sm font-medium text-gray-700 mb-1.5">
              Username
            </label>
            <input
              id="username"
              type="text"
              required
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="janedoe"
              className="w-full px-4 py-2.5 text-gray-900 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
            />
          </div>

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
              minLength={8}
              autoComplete="new-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="At least 8 characters"
              className="w-full px-4 py-2.5 text-gray-900 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
            />
          </div>

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
            {loading ? 'Creating account...' : 'Sign Up'}
          </button>
        </form>

        <p className="text-sm text-gray-500 text-center mt-6">
          Already have an account?{' '}
          <Link
            href="/login"
            className="text-blue-600 font-medium hover:text-blue-700 hover:underline"
          >
            Sign in
          </Link>
        </p>
      </div>
    </div>
  )
}
