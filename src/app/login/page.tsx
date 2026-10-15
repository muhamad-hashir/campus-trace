import { Suspense } from 'react'
import LoginForm from './LoginForm'

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="max-w-md mx-auto my-10 h-96 bg-white rounded-2xl shadow-sm border border-gray-200 animate-pulse" />}>
      <LoginForm />
    </Suspense>
  )
}
