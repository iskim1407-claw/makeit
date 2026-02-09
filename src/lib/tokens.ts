import { SupabaseClient } from '@supabase/supabase-js'

export type TokenProvider = 'github' | 'vercel'

export interface Token {
  id: string
  user_id: string
  provider: TokenProvider
  access_token: string
  refresh_token?: string
  expires_at?: string
  scope?: string
  created_at: string
  updated_at: string
}

/**
 * 사용자의 특정 provider 토큰 조회
 */
export async function getToken(
  supabase: SupabaseClient,
  userId: string,
  provider: TokenProvider
): Promise<Token | null> {
  const { data, error } = await supabase
    .from('tokens')
    .select('*')
    .eq('user_id', userId)
    .eq('provider', provider)
    .single()

  if (error || !data) return null
  return data as Token
}

/**
 * 사용자의 모든 토큰 조회
 */
export async function getAllTokens(
  supabase: SupabaseClient,
  userId: string
): Promise<{ github: Token | null; vercel: Token | null }> {
  const { data, error } = await supabase
    .from('tokens')
    .select('*')
    .eq('user_id', userId)

  if (error || !data) {
    return { github: null, vercel: null }
  }

  const tokens = data as Token[]
  return {
    github: tokens.find(t => t.provider === 'github') || null,
    vercel: tokens.find(t => t.provider === 'vercel') || null,
  }
}

/**
 * 토큰 저장 또는 업데이트 (upsert)
 */
export async function saveToken(
  supabase: SupabaseClient,
  userId: string,
  provider: TokenProvider,
  accessToken: string,
  options?: {
    refreshToken?: string
    expiresAt?: Date
    scope?: string
  }
): Promise<boolean> {
  const { error } = await supabase
    .from('tokens')
    .upsert({
      user_id: userId,
      provider,
      access_token: accessToken,
      refresh_token: options?.refreshToken,
      expires_at: options?.expiresAt?.toISOString(),
      scope: options?.scope,
      updated_at: new Date().toISOString(),
    }, {
      onConflict: 'user_id,provider'
    })

  return !error
}

/**
 * 토큰 삭제
 */
export async function deleteToken(
  supabase: SupabaseClient,
  userId: string,
  provider: TokenProvider
): Promise<boolean> {
  const { error } = await supabase
    .from('tokens')
    .delete()
    .eq('user_id', userId)
    .eq('provider', provider)

  return !error
}

/**
 * 토큰 연결 상태 확인
 */
export async function getConnectionStatus(
  supabase: SupabaseClient,
  userId: string
): Promise<{ github: boolean; vercel: boolean }> {
  const tokens = await getAllTokens(supabase, userId)
  return {
    github: !!tokens.github,
    vercel: !!tokens.vercel,
  }
}
