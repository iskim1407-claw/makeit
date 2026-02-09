import { NextRequest, NextResponse } from 'next/server'

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

async function chatWithOllama(messages: { role: string; content: string }[]) {
  const ollamaUrl = process.env.OLLAMA_BASE_URL || 'http://localhost:11434'
  const model = process.env.OLLAMA_MODEL || 'llama3.2'
  
  const response = await fetch(`${ollamaUrl}/api/chat`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model,
      messages: [
        { role: 'system', content: SYSTEM_PROMPT },
        ...messages.map(m => ({ role: m.role, content: m.content }))
      ],
      stream: false,
    }),
  })

  if (!response.ok) {
    throw new Error(`Ollama error: ${response.status}`)
  }

  const data = await response.json()
  return data.message?.content || ''
}

async function chatWithAnthropic(messages: { role: string; content: string }[]) {
  const Anthropic = (await import('@anthropic-ai/sdk')).default
  const anthropic = new Anthropic({
    apiKey: process.env.ANTHROPIC_API_KEY,
  })

  const response = await anthropic.messages.create({
    model: 'claude-3-5-sonnet-20241022',
    max_tokens: 1024,
    system: SYSTEM_PROMPT,
    messages: messages.map(m => ({
      role: m.role as 'user' | 'assistant',
      content: m.content,
    })),
  })

  const content = response.content[0]
  return content.type === 'text' ? content.text : ''
}

export async function POST(request: NextRequest) {
  try {
    const { messages } = await request.json()

    let text: string

    // Try Ollama first if configured, otherwise use Anthropic
    if (process.env.OLLAMA_BASE_URL || !process.env.ANTHROPIC_API_KEY) {
      try {
        text = await chatWithOllama(messages)
      } catch (ollamaError) {
        // Fallback to Anthropic if Ollama fails and key exists
        if (process.env.ANTHROPIC_API_KEY) {
          text = await chatWithAnthropic(messages)
        } else {
          throw ollamaError
        }
      }
    } else {
      text = await chatWithAnthropic(messages)
    }

    return NextResponse.json({ message: text })
  } catch (error) {
    console.error('Chat API error:', error)
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    return NextResponse.json(
      { error: `Failed to generate response: ${errorMessage}` },
      { status: 500 }
    )
  }
}
