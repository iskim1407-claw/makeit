import { NextRequest, NextResponse } from 'next/server'
import OpenAI from 'openai'

const SYSTEM_PROMPT = `당신은 전문 Next.js 개발자입니다. 사용자의 요구사항에 맞는 완전한 웹 앱 코드를 생성합니다.

기술 스택:
- Next.js 14 (App Router)
- TypeScript
- Tailwind CSS
- React hooks

코드 생성 규칙:
1. 모든 파일은 JSON 배열로 반환
2. 각 파일은 { path, content } 형식
3. 실제 작동하는 완전한 코드만 생성
4. 컴포넌트는 'use client' 또는 서버 컴포넌트로 적절히 구분
5. 스타일은 Tailwind CSS 클래스 사용
6. 한국어 UI 텍스트 사용

반드시 다음 형식으로만 응답:
\`\`\`json
{
  "projectName": "프로젝트명",
  "files": [
    { "path": "src/app/page.tsx", "content": "..." },
    { "path": "src/app/layout.tsx", "content": "..." }
  ]
}
\`\`\`

절대 JSON 외의 텍스트를 포함하지 마세요.`

export async function POST(request: NextRequest) {
  try {
    const { prompt, conversationHistory } = await request.json()

    if (!process.env.OPENAI_API_KEY) {
      return NextResponse.json(
        { error: 'OPENAI_API_KEY not configured' },
        { status: 500 }
      )
    }

    const openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    })

    // Build context from conversation
    const context = conversationHistory
      ?.map((m: { role: string; content: string }) => `${m.role}: ${m.content}`)
      .join('\n\n')

    const userPrompt = `다음 대화를 기반으로 웹 앱을 생성해주세요:

${context || prompt}

요구사항에 맞는 완전한 Next.js 앱 코드를 JSON 형식으로 생성해주세요.`

    const response = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [
        { role: 'system', content: SYSTEM_PROMPT },
        { role: 'user', content: userPrompt },
      ],
      max_tokens: 8192,
    })

    const text = response.choices[0]?.message?.content || ''

    // Extract JSON from response
    const jsonMatch = text.match(/```json\s*([\s\S]*?)\s*```/)
    if (!jsonMatch) {
      // Try parsing raw response as JSON
      try {
        const parsed = JSON.parse(text)
        return NextResponse.json(parsed)
      } catch {
        return NextResponse.json(
          { error: 'Failed to parse generated code', raw: text },
          { status: 500 }
        )
      }
    }

    const parsed = JSON.parse(jsonMatch[1])
    return NextResponse.json(parsed)
  } catch (error) {
    console.error('Generate API error:', error)
    return NextResponse.json(
      { error: 'Failed to generate code' },
      { status: 500 }
    )
  }
}
