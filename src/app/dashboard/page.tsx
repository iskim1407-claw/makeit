'use client'

import { useState, useRef, useEffect } from 'react'
import Link from 'next/link'

type Message = {
  id: string
  role: 'user' | 'assistant'
  content: string
  timestamp: Date
}

export default function DashboardPage() {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      role: 'assistant',
      content: '안녕하세요! 👋 어떤 앱을 만들어 드릴까요? 음성 또는 텍스트로 말씀해주세요.',
      timestamp: new Date(),
    },
  ])
  const [input, setInput] = useState('')
  const [isRecording, setIsRecording] = useState(false)
  const [isProcessing, setIsProcessing] = useState(false)
  const [showSettings, setShowSettings] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  const handleSend = async () => {
    if (!input.trim() || isProcessing) return

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: input.trim(),
      timestamp: new Date(),
    }

    setMessages((prev) => [...prev, userMessage])
    setInput('')
    setIsProcessing(true)

    // Simulate AI response
    setTimeout(() => {
      const aiMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: `좋아요! "${userMessage.content}"를 만들어 드릴게요.\n\n먼저 GitHub와 Vercel 연결이 필요해요. 설정에서 토큰을 입력해주세요! ⚙️`,
        timestamp: new Date(),
      }
      setMessages((prev) => [...prev, aiMessage])
      setIsProcessing(false)
    }, 1500)
  }

  const handleVoice = () => {
    if (isRecording) {
      setIsRecording(false)
      // TODO: Stop recording and process
    } else {
      setIsRecording(true)
      // TODO: Start recording
    }
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  return (
    <div className="min-h-screen bg-slate-900 flex">
      {/* Sidebar */}
      <div className="w-64 bg-slate-800 border-r border-slate-700 flex flex-col">
        <div className="p-4 border-b border-slate-700">
          <Link href="/" className="text-xl font-bold text-white">
            🚀 Makeit
          </Link>
        </div>

        <div className="flex-1 p-4">
          <button className="w-full flex items-center gap-2 px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition mb-4">
            <span>+</span>
            <span>새 프로젝트</span>
          </button>

          <div className="text-sm text-gray-400 mb-2">최근 프로젝트</div>
          <div className="space-y-1">
            <div className="px-4 py-2 text-gray-300 hover:bg-slate-700 rounded-lg cursor-pointer">
              📝 투두 앱
            </div>
            <div className="px-4 py-2 text-gray-300 hover:bg-slate-700 rounded-lg cursor-pointer">
              🛒 쇼핑몰
            </div>
          </div>
        </div>

        <div className="p-4 border-t border-slate-700">
          <button
            onClick={() => setShowSettings(true)}
            className="w-full flex items-center gap-2 px-4 py-2 text-gray-300 hover:bg-slate-700 rounded-lg transition"
          >
            <span>⚙️</span>
            <span>설정</span>
          </button>
        </div>
      </div>

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col">
        {/* Header */}
        <div className="h-14 border-b border-slate-700 flex items-center justify-between px-6">
          <h1 className="text-white font-semibold">새 프로젝트</h1>
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-green-500"></span>
            <span className="text-sm text-gray-400">연결됨</span>
          </div>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          {messages.map((message) => (
            <div
              key={message.id}
              className={`flex gap-4 ${message.role === 'user' ? 'justify-end' : ''}`}
            >
              {message.role === 'assistant' && (
                <div className="w-10 h-10 rounded-full bg-gradient-to-r from-purple-600 to-pink-600 flex items-center justify-center text-white shrink-0">
                  🤖
                </div>
              )}
              <div
                className={`max-w-2xl px-4 py-3 rounded-2xl ${
                  message.role === 'user'
                    ? 'bg-purple-600 text-white rounded-br-none'
                    : 'bg-slate-800 text-gray-100 rounded-bl-none'
                }`}
              >
                <p className="whitespace-pre-wrap">{message.content}</p>
              </div>
              {message.role === 'user' && (
                <div className="w-10 h-10 rounded-full bg-slate-700 flex items-center justify-center text-white shrink-0">
                  👤
                </div>
              )}
            </div>
          ))}
          {isProcessing && (
            <div className="flex gap-4">
              <div className="w-10 h-10 rounded-full bg-gradient-to-r from-purple-600 to-pink-600 flex items-center justify-center text-white shrink-0">
                🤖
              </div>
              <div className="bg-slate-800 text-gray-100 px-4 py-3 rounded-2xl rounded-bl-none">
                <div className="flex gap-1">
                  <span className="w-2 h-2 bg-gray-500 rounded-full animate-bounce"></span>
                  <span className="w-2 h-2 bg-gray-500 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></span>
                  <span className="w-2 h-2 bg-gray-500 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></span>
                </div>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input Area */}
        <div className="border-t border-slate-700 p-4">
          <div className="max-w-4xl mx-auto flex gap-3">
            <button
              onClick={handleVoice}
              className={`shrink-0 w-12 h-12 rounded-full flex items-center justify-center transition ${
                isRecording
                  ? 'bg-red-600 hover:bg-red-700 animate-pulse'
                  : 'bg-slate-700 hover:bg-slate-600'
              }`}
            >
              <span className="text-white text-xl">{isRecording ? '⏹️' : '🎤'}</span>
            </button>
            <div className="flex-1 flex gap-2 bg-slate-800 rounded-xl px-4 py-2 border border-slate-700 focus-within:border-purple-600">
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="어떤 앱을 만들어 드릴까요?"
                className="flex-1 bg-transparent text-white placeholder-gray-500 focus:outline-none"
                disabled={isProcessing}
              />
              <button
                onClick={handleSend}
                disabled={!input.trim() || isProcessing}
                className="text-purple-400 hover:text-purple-300 disabled:text-gray-600 transition"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                </svg>
              </button>
            </div>
          </div>
          <p className="text-center text-gray-500 text-xs mt-2">
            음성 또는 텍스트로 원하는 앱을 설명해주세요
          </p>
        </div>
      </div>

      {/* Settings Modal */}
      {showSettings && (
        <SettingsModal onClose={() => setShowSettings(false)} />
      )}
    </div>
  )
}

function SettingsModal({ onClose }: { onClose: () => void }) {
  const [githubToken, setGithubToken] = useState('')
  const [vercelToken, setVercelToken] = useState('')
  const [saving, setSaving] = useState(false)

  const handleSave = () => {
    setSaving(true)
    // TODO: Save tokens to database
    setTimeout(() => {
      setSaving(false)
      onClose()
    }, 1000)
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      <div className="bg-slate-800 rounded-2xl border border-slate-700 w-full max-w-lg">
        <div className="flex items-center justify-between p-6 border-b border-slate-700">
          <h2 className="text-xl font-bold text-white">설정</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-white">
            ✕
          </button>
        </div>

        <div className="p-6 space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              GitHub Personal Access Token
            </label>
            <input
              type="password"
              value={githubToken}
              onChange={(e) => setGithubToken(e.target.value)}
              className="w-full px-4 py-3 bg-slate-900 border border-slate-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-600"
              placeholder="ghp_xxxxxxxxxxxx"
            />
            <p className="text-xs text-gray-500 mt-1">
              <a href="https://github.com/settings/tokens" target="_blank" className="text-purple-400 hover:underline">
                GitHub에서 토큰 생성하기 →
              </a>
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Vercel Access Token
            </label>
            <input
              type="password"
              value={vercelToken}
              onChange={(e) => setVercelToken(e.target.value)}
              className="w-full px-4 py-3 bg-slate-900 border border-slate-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-600"
              placeholder="xxxxxxxxxxxxxxxx"
            />
            <p className="text-xs text-gray-500 mt-1">
              <a href="https://vercel.com/account/tokens" target="_blank" className="text-purple-400 hover:underline">
                Vercel에서 토큰 생성하기 →
              </a>
            </p>
          </div>

          <div className="bg-slate-900/50 rounded-lg p-4">
            <h3 className="text-sm font-medium text-white mb-2">🔒 보안 안내</h3>
            <p className="text-xs text-gray-400">
              토큰은 암호화되어 안전하게 저장됩니다. 
              우리는 앱 생성과 배포에만 사용하며, 절대 다른 용도로 사용하지 않습니다.
            </p>
          </div>
        </div>

        <div className="p-6 border-t border-slate-700 flex justify-end gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2 text-gray-300 hover:text-white transition"
          >
            취소
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            className="px-6 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition disabled:opacity-50"
          >
            {saving ? '저장 중...' : '저장'}
          </button>
        </div>
      </div>
    </div>
  )
}
