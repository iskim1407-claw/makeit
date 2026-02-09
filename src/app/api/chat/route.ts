import { NextRequest, NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
})

const SYSTEM_PROMPT = `당신은 Makeit의 AI 어시스턴트입니다. 사용자가 원하는 웹 앱을 설명하면, 요구사항을 명확히 파악하고 구현 계획을 세웁니다.

역할:
1. 사용자의 앱 아이디어를 이해하고 구체화
2. 필요한 기능, 페이지, 데이터 구조 정리
3. 기술 스택 제안 (Next.js 14 + Tailwind CSS + TypeScript 기본)
4. 구현 가능한 MVP 범위 확정

응답 스타일:
- 친근하고 간결하게
- 이모지 적절히 사용
- 한국어로 응답
- 기술적 세부사항은 필요할 때만

사용자가 앱 아이디어를 충분히 설명하면, 마지막에 다음 형식으로 요약:

---
📋 **프로젝트 요약**
- 앱 이름: [제안]
- 주요 기능: [리스트]
- 페이지 구성: [리스트]
- 예상 파일: [갯수]

준비되면 "생성하기" 버튼을 눌러주세요!
---`

export async function POST(request: NextRequest) {
  try {
    const { messages } = await request.json()

    if (!process.env.ANTHROPIC_API_KEY) {
      return NextResponse.json(
        { error: 'ANTHROPIC_API_KEY not configured' },
        { status: 500 }
      )
    }

    const response = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 1024,
      system: SYSTEM_PROMPT,
      messages: messages.map((m: { role: string; content: string }) => ({
        role: m.role as 'user' | 'assistant',
        content: m.content,
      })),
    })

    const content = response.content[0]
    const text = content.type === 'text' ? content.text : ''

    return NextResponse.json({ message: text })
  } catch (error) {
    console.error('Chat API error:', error)
    return NextResponse.json(
      { error: 'Failed to generate response' },
      { status: 500 }
    )
  }
}
