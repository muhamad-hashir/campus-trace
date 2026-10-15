import { redirect } from 'next/navigation'
import { createClient } from '@/utils/supabase/server'

// Callback route for Supabase email-confirmation / magic-link redirections.
// Exchanges the PKCE auth code for a session, refreshing the auth cookies.
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const code = searchParams.get('code')
  const nextParam = searchParams.get('next') ?? '/'
  const next = nextParam.startsWith('/') ? nextParam : '/'

  if (code) {
    const supabase = await createClient()
    const { error } = await supabase.auth.exchangeCodeForSession(code)
    if (!error) {
      redirect(next)
    }
  }

  redirect('/login?error=auth_callback_failed')
}
