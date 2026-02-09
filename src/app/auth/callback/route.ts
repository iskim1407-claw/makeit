import { createServerSupabaseClient } from '@/lib/supabase-server'
import { saveToken } from '@/lib/tokens'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  const requestUrl = new URL(request.url)
  const code = requestUrl.searchParams.get('code')

  if (code) {
    const supabase = await createServerSupabaseClient()
    
    // exchangeCodeForSession은 provider_token도 반환
    const { data, error } = await supabase.auth.exchangeCodeForSession(code)
    
    if (!error && data.session) {
      const { user, session } = data
      
      // GitHub provider_token이 있으면 저장
      if (session.provider_token) {
        // Provider 확인 (현재는 GitHub만 지원)
        const provider = user.app_metadata?.provider as string
        
        if (provider === 'github') {
          await saveToken(
            supabase,
            user.id,
            'github',
            session.provider_token,
            {
              refreshToken: session.provider_refresh_token || undefined,
              // GitHub OAuth 토큰은 기본적으로 만료 없음
              scope: 'repo', // Supabase GitHub OAuth scope 설정에 따라 달라짐
            }
          )
          console.log('[Auth] GitHub token saved for user:', user.id)
        }
      }
    }
  }

  return NextResponse.redirect(new URL('/dashboard', requestUrl.origin))
}
