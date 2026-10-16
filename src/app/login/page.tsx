import { Suspense } from 'react'
import LoginForm from './LoginForm'

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="max-w-sm mx-auto my-8 sm:my-16 h-96 bg-white rounded-xl border border-gray-200 animate-pulse" />}>
      <LoginForm />
    </Suspense>
  )
}
