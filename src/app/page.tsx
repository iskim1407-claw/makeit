'use client'

import Link from 'next/link'
import { useState } from 'react'

export default function LandingPage() {
  const [email, setEmail] = useState('')

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      {/* Navigation */}
      <nav className="container mx-auto px-6 py-4 flex justify-between items-center">
        <div className="text-2xl font-bold text-white">
          🚀 Makeit
        </div>
        <div className="flex gap-4">
          <Link href="/login" className="text-gray-300 hover:text-white transition">
            로그인
          </Link>
          <Link href="/signup" className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg transition">
            시작하기
          </Link>
        </div>
      </nav>

      {/* Hero */}
      <main className="container mx-auto px-6 py-20">
        <div className="text-center max-w-4xl mx-auto">
          <h1 className="text-5xl md:text-7xl font-bold text-white mb-6">
            말만 하면
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-400">
              {' '}앱이 완성
            </span>
          </h1>
          <p className="text-xl text-gray-300 mb-8 max-w-2xl mx-auto">
            코딩 몰라도 OK. 원하는 걸 말하면 AI가 코드 작성부터 배포까지.
            <br />
            5분 만에 나만의 웹앱을 런칭하세요.
          </p>

          {/* CTA */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-12">
            <Link 
              href="/signup"
              className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white text-lg px-8 py-4 rounded-xl font-semibold transition transform hover:scale-105"
            >
              무료로 시작하기 →
            </Link>
            <Link 
              href="#demo"
              className="text-gray-300 hover:text-white transition flex items-center gap-2"
            >
              <span className="w-10 h-10 bg-white/10 rounded-full flex items-center justify-center">▶</span>
              데모 보기
            </Link>
          </div>

          {/* Trust badges */}
          <p className="text-gray-500 text-sm">
            GitHub & Vercel 연동 • 무료 시작 • 신용카드 불필요
          </p>
        </div>

        {/* Demo Preview */}
        <div className="mt-20 max-w-5xl mx-auto">
          <div className="bg-slate-800/50 rounded-2xl border border-slate-700 p-4 backdrop-blur">
            <div className="flex gap-2 mb-4">
              <div className="w-3 h-3 rounded-full bg-red-500" />
              <div className="w-3 h-3 rounded-full bg-yellow-500" />
              <div className="w-3 h-3 rounded-full bg-green-500" />
            </div>
            <div className="bg-slate-900 rounded-xl p-6 min-h-[300px]">
              <div className="flex gap-4 items-start">
                <div className="w-10 h-10 rounded-full bg-purple-600 flex items-center justify-center text-white">
                  👤
                </div>
                <div className="flex-1">
                  <div className="bg-slate-800 rounded-2xl rounded-tl-none p-4 mb-4 max-w-lg">
                    <p className="text-white">
                      "투두리스트 앱 만들어줘. 할 일 추가하고 완료 체크할 수 있게"
                    </p>
                  </div>
                </div>
              </div>
              <div className="flex gap-4 items-start justify-end">
                <div className="flex-1 flex justify-end">
                  <div className="bg-purple-600/20 border border-purple-500/30 rounded-2xl rounded-tr-none p-4 max-w-lg">
                    <p className="text-purple-100">
                      네! 투두리스트 앱 만들고 있어요 🛠️
                      <br /><br />
                      ✅ 컴포넌트 생성 중...
                      <br />
                      ✅ API 라우트 설정...
                      <br />
                      ✅ GitHub 푸시 완료!
                      <br />
                      ✅ Vercel 배포 중...
                      <br /><br />
                      🎉 완성! → <span className="text-purple-400 underline">todo-app.vercel.app</span>
                    </p>
                  </div>
                </div>
                <div className="w-10 h-10 rounded-full bg-gradient-to-r from-purple-600 to-pink-600 flex items-center justify-center text-white">
                  🤖
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Features */}
        <div className="mt-32 grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
          <div className="bg-slate-800/30 rounded-2xl p-8 border border-slate-700/50">
            <div className="text-4xl mb-4">🎤</div>
            <h3 className="text-xl font-bold text-white mb-2">음성으로 설명</h3>
            <p className="text-gray-400">
              타이핑 필요 없어요. 마이크 버튼 누르고 원하는 걸 말하세요.
            </p>
          </div>
          <div className="bg-slate-800/30 rounded-2xl p-8 border border-slate-700/50">
            <div className="text-4xl mb-4">⚡</div>
            <h3 className="text-xl font-bold text-white mb-2">5분 안에 배포</h3>
            <p className="text-gray-400">
              AI가 코드 작성하고 GitHub에 푸시, Vercel로 자동 배포.
            </p>
          </div>
          <div className="bg-slate-800/30 rounded-2xl p-8 border border-slate-700/50">
            <div className="text-4xl mb-4">🔧</div>
            <h3 className="text-xl font-bold text-white mb-2">계속 수정 가능</h3>
            <p className="text-gray-400">
              "버튼 색 바꿔줘" 한마디면 즉시 반영. 원하는 만큼 다듬으세요.
            </p>
          </div>
        </div>

        {/* How it works */}
        <div className="mt-32 max-w-4xl mx-auto">
          <h2 className="text-3xl font-bold text-white text-center mb-12">
            이렇게 동작해요
          </h2>
          <div className="space-y-8">
            <div className="flex gap-6 items-center">
              <div className="w-12 h-12 rounded-full bg-purple-600 flex items-center justify-center text-white font-bold shrink-0">
                1
              </div>
              <div>
                <h3 className="text-lg font-semibold text-white">GitHub & Vercel 연결</h3>
                <p className="text-gray-400">한 번만 연결하면 끝. 토큰 입력 또는 OAuth 로그인.</p>
              </div>
            </div>
            <div className="flex gap-6 items-center">
              <div className="w-12 h-12 rounded-full bg-purple-600 flex items-center justify-center text-white font-bold shrink-0">
                2
              </div>
              <div>
                <h3 className="text-lg font-semibold text-white">원하는 앱 설명</h3>
                <p className="text-gray-400">음성 또는 텍스트로 만들고 싶은 앱을 설명하세요.</p>
              </div>
            </div>
            <div className="flex gap-6 items-center">
              <div className="w-12 h-12 rounded-full bg-purple-600 flex items-center justify-center text-white font-bold shrink-0">
                3
              </div>
              <div>
                <h3 className="text-lg font-semibold text-white">AI가 만들고 배포</h3>
                <p className="text-gray-400">코드 생성 → GitHub 푸시 → Vercel 배포. 라이브 URL 받기!</p>
              </div>
            </div>
          </div>
        </div>

        {/* CTA Bottom */}
        <div className="mt-32 text-center">
          <h2 className="text-3xl font-bold text-white mb-6">
            지금 바로 시작하세요
          </h2>
          <Link 
            href="/signup"
            className="inline-block bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white text-lg px-8 py-4 rounded-xl font-semibold transition transform hover:scale-105"
          >
            무료로 시작하기 →
          </Link>
        </div>
      </main>

      {/* Footer */}
      <footer className="container mx-auto px-6 py-8 mt-20 border-t border-slate-800">
        <div className="flex justify-between items-center text-gray-500 text-sm">
          <div>© 2025 Makeit. All rights reserved.</div>
          <div className="flex gap-4">
            <a href="#" className="hover:text-gray-300">이용약관</a>
            <a href="#" className="hover:text-gray-300">개인정보처리방침</a>
          </div>
        </div>
      </footer>
    </div>
  )
}
