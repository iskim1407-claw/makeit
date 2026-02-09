import { createServerSupabaseClient } from '@/lib/supabase-server'
import { saveToken } from '@/lib/tokens'
import { NextResponse } from 'next/server'

/**
 * Vercel OAuth 콜백
 * GET /api/auth/vercel/callback
 */
export async function GET(request: Request) {
  const url = new URL(request.url)
  const code = url.searchParams.get('code')
  const state = url.searchParams.get('state')
  const error = url.searchParams.get('error')

  // 에러 처리
  if (error) {
    console.error('[Vercel OAuth] Error:', error)
    return NextResponse.redirect(
      new URL('/dashboard?error=vercel_auth_failed', request.url)
    )
  }

  if (!code || !state) {
    return NextResponse.redirect(
      new URL('/dashboard?error=missing_params', request.url)
    )
  }

  // State 검증 및 파싱
  let stateData: { userId: string; timestamp: number }
  try {
    stateData = JSON.parse(Buffer.from(state, 'base64url').toString())
    
    // 10분 이상 지났으면 만료
    if (Date.now() - stateData.timestamp > 10 * 60 * 1000) {
      return NextResponse.redirect(
        new URL('/dashboard?error=state_expired', request.url)
      )
    }
  } catch {
    return NextResponse.redirect(
      new URL('/dashboard?error=invalid_state', request.url)
    )
  }

  // 현재 로그인 사용자 확인
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user || user.id !== stateData.userId) {
    return NextResponse.redirect(
      new URL('/dashboard?error=user_mismatch', request.url)
    )
  }

  // Access token 교환
  const clientId = process.env.VERCEL_CLIENT_ID
  const clientSecret = process.env.VERCEL_CLIENT_SECRET
  
  if (!clientId || !clientSecret) {
    return NextResponse.redirect(
      new URL('/dashboard?error=vercel_not_configured', request.url)
    )
  }

  const redirectUri = new URL('/api/auth/vercel/callback', request.url).toString()

  try {
    const tokenRes = await fetch('https://api.vercel.com/v2/oauth/access_token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        client_id: clientId,
        client_secret: clientSecret,
        code,
        redirect_uri: redirectUri,
      }),
    })

    if (!tokenRes.ok) {
      const errorData = await tokenRes.text()
      console.error('[Vercel OAuth] Token exchange failed:', errorData)
      return NextResponse.redirect(
        new URL('/dashboard?error=token_exchange_failed', request.url)
      )
    }

    const tokenData = await tokenRes.json()
    
    // 토큰 저장
    const saved = await saveToken(
      supabase,
      user.id,
      'vercel',
      tokenData.access_token,
      {
        // Vercel 토큰은 team_id 등 추가 정보가 있을 수 있음
        scope: tokenData.scope || 'user',
      }
    )

    if (!saved) {
      console.error('[Vercel OAuth] Failed to save token')
      return NextResponse.redirect(
        new URL('/dashboard?error=token_save_failed', request.url)
      )
    }

    console.log('[Vercel OAuth] Token saved for user:', user.id)
    
    return NextResponse.redirect(
      new URL('/dashboard?success=vercel_connected', request.url)
    )
  } catch (err) {
    console.error('[Vercel OAuth] Error:', err)
    return NextResponse.redirect(
      new URL('/dashboard?error=vercel_auth_error', request.url)
    )
  }
}
