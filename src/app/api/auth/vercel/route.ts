import { createServerSupabaseClient } from '@/lib/supabase-server'
import { NextResponse } from 'next/server'

/**
 * Vercel OAuth 시작
 * GET /api/auth/vercel
 * 
 * Vercel OAuth App 설정 필요:
 * 1. https://vercel.com/account/tokens → OAuth Apps
 * 2. "Create OAuth App" 클릭
 * 3. Redirect URI: {YOUR_DOMAIN}/api/auth/vercel/callback
 * 4. Client ID와 Client Secret을 환경변수에 추가
 */
export async function GET(request: Request) {
  // 로그인 확인
  const supabase = await createServerSupabaseClient()
  const { data: { user }, error } = await supabase.auth.getUser()
  
  if (error || !user) {
    return NextResponse.redirect(new URL('/login', request.url))
  }

  const clientId = process.env.VERCEL_CLIENT_ID
  if (!clientId) {
    return NextResponse.json(
      { error: 'Vercel OAuth not configured' },
      { status: 500 }
    )
  }

  // State에 user_id 포함 (CSRF 방지 + 사용자 식별)
  const state = Buffer.from(JSON.stringify({
    userId: user.id,
    timestamp: Date.now(),
  })).toString('base64url')

  const redirectUri = new URL('/api/auth/vercel/callback', request.url).toString()
  
  const authUrl = new URL('https://vercel.com/oauth/authorize')
  authUrl.searchParams.set('client_id', clientId)
  authUrl.searchParams.set('redirect_uri', redirectUri)
  authUrl.searchParams.set('scope', 'user') // 기본 scope
  authUrl.searchParams.set('response_type', 'code')
  authUrl.searchParams.set('state', state)

  return NextResponse.redirect(authUrl.toString())
}
