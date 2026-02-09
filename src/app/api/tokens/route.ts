import { createServerSupabaseClient } from '@/lib/supabase-server'
import { getConnectionStatus, deleteToken, TokenProvider } from '@/lib/tokens'
import { NextRequest, NextResponse } from 'next/server'

/**
 * 토큰 연결 상태 조회
 * GET /api/tokens
 */
export async function GET() {
  const supabase = await createServerSupabaseClient()
  const { data: { user }, error } = await supabase.auth.getUser()

  if (error || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const status = await getConnectionStatus(supabase, user.id)
  
  return NextResponse.json({
    connected: status,
    canDeploy: status.github && status.vercel,
  })
}

/**
 * 토큰 연결 해제
 * DELETE /api/tokens?provider=github|vercel
 */
export async function DELETE(request: NextRequest) {
  const supabase = await createServerSupabaseClient()
  const { data: { user }, error } = await supabase.auth.getUser()

  if (error || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const provider = request.nextUrl.searchParams.get('provider') as TokenProvider
  
  if (!provider || !['github', 'vercel'].includes(provider)) {
    return NextResponse.json({ error: 'Invalid provider' }, { status: 400 })
  }

  const deleted = await deleteToken(supabase, user.id, provider)
  
  if (!deleted) {
    return NextResponse.json({ error: 'Failed to delete token' }, { status: 500 })
  }

  return NextResponse.json({ success: true })
}
