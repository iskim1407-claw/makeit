-- Tokens 테이블: OAuth provider 토큰 저장
-- Supabase Dashboard > SQL Editor에서 실행하세요

CREATE TABLE IF NOT EXISTS public.tokens (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  provider TEXT NOT NULL CHECK (provider IN ('github', 'vercel')),
  access_token TEXT NOT NULL,
  refresh_token TEXT,
  expires_at TIMESTAMPTZ,
  scope TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- 사용자당 provider 하나만
  UNIQUE(user_id, provider)
);

-- RLS 활성화
ALTER TABLE public.tokens ENABLE ROW LEVEL SECURITY;

-- 사용자는 자신의 토큰만 접근 가능
CREATE POLICY "Users can view own tokens" ON public.tokens
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own tokens" ON public.tokens
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own tokens" ON public.tokens
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own tokens" ON public.tokens
  FOR DELETE USING (auth.uid() = user_id);

-- updated_at 자동 업데이트 트리거
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_tokens_updated_at
  BEFORE UPDATE ON public.tokens
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- 인덱스
CREATE INDEX idx_tokens_user_id ON public.tokens(user_id);
CREATE INDEX idx_tokens_provider ON public.tokens(provider);
