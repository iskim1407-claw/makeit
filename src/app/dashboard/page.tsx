'use client'

import { useState, useRef, useEffect, useCallback, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase'

type Message = {
  id: string
  role: 'user' | 'assistant'
  content: string
  timestamp: Date
}

type GeneratedProject = {
  projectName: string
  files: { path: string; content: string }[]
} | null

type ConnectionStatus = {
  github: boolean
  vercel: boolean
}

// Suspense wrapper for useSearchParams
export default function DashboardPage() {
  return (
    <Suspense fallback={<DashboardLoading />}>
      <DashboardContent />
    </Suspense>
  )
}

function DashboardLoading() {
  return (
    <div className="min-h-screen bg-slate-900 flex items-center justify-center">
      <div className="animate-spin w-8 h-8 border-4 border-purple-500 border-t-transparent rounded-full"></div>
    </div>
  )
}

function DashboardContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [user, setUser] = useState<{ email: string } | null>(null)
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
  const [generatedProject, setGeneratedProject] = useState<GeneratedProject>(null)
  const [isGenerating, setIsGenerating] = useState(false)
  const [isDeploying, setIsDeploying] = useState(false)
  const [deployResult, setDeployResult] = useState<{
    github?: { url: string }
    vercel?: { url: string | null }
  } | null>(null)
  const [connectionStatus, setConnectionStatus] = useState<ConnectionStatus>({
    github: false,
    vercel: false,
  })
  const [isLoadingStatus, setIsLoadingStatus] = useState(true)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  // 토큰 연결 상태 조회
  const fetchConnectionStatus = useCallback(async () => {
    try {
      const res = await fetch('/api/tokens')
      if (res.ok) {
        const data = await res.json()
        setConnectionStatus(data.connected)
      }
    } catch (error) {
      console.error('Failed to fetch connection status:', error)
    } finally {
      setIsLoadingStatus(false)
    }
  }, [])

  useEffect(() => {
    const supabase = createClient()
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user) {
        router.push('/login')
      } else {
        setUser({ email: user.email || '' })
        fetchConnectionStatus()
      }
    })
  }, [router, fetchConnectionStatus])

  // URL 파라미터로 성공/에러 메시지 처리
  useEffect(() => {
    const success = searchParams.get('success')
    const error = searchParams.get('error')

    if (success === 'vercel_connected') {
      setMessages(prev => [...prev, {
        id: Date.now().toString(),
        role: 'assistant',
        content: '✅ Vercel 계정이 연결되었습니다! 이제 프로젝트를 배포할 수 있어요.',
        timestamp: new Date(),
      }])
      fetchConnectionStatus()
      // URL 파라미터 제거
      router.replace('/dashboard')
    }

    if (error) {
      const errorMessages: Record<string, string> = {
        vercel_auth_failed: 'Vercel 인증에 실패했습니다.',
        missing_params: '필요한 정보가 누락되었습니다.',
        state_expired: '인증 세션이 만료되었습니다. 다시 시도해주세요.',
        invalid_state: '잘못된 인증 요청입니다.',
        user_mismatch: '사용자 정보가 일치하지 않습니다.',
        vercel_not_configured: 'Vercel OAuth가 설정되지 않았습니다.',
        token_exchange_failed: '토큰 교환에 실패했습니다.',
        token_save_failed: '토큰 저장에 실패했습니다.',
        vercel_auth_error: 'Vercel 인증 중 오류가 발생했습니다.',
      }
      setMessages(prev => [...prev, {
        id: Date.now().toString(),
        role: 'assistant',
        content: `❌ ${errorMessages[error] || '오류가 발생했습니다.'}`,
        timestamp: new Date(),
      }])
      router.replace('/dashboard')
    }
  }, [searchParams, router, fetchConnectionStatus])

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

    const newMessages = [...messages, userMessage]
    setMessages(newMessages)
    setInput('')
    setIsProcessing(true)

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: newMessages
            .filter((m) => m.id !== '1')
            .map((m) => ({ role: m.role, content: m.content })),
        }),
      })

      const data = await res.json()

      const aiMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: data.message || data.error || '응답을 생성하지 못했어요.',
        timestamp: new Date(),
      }
      setMessages((prev) => [...prev, aiMessage])
    } catch {
      setMessages((prev) => [
        ...prev,
        {
          id: (Date.now() + 1).toString(),
          role: 'assistant',
          content: '죄송해요, 오류가 발생했어요. 다시 시도해주세요.',
          timestamp: new Date(),
        },
      ])
    } finally {
      setIsProcessing(false)
    }
  }

  const handleGenerate = async () => {
    setIsGenerating(true)
    try {
      const res = await fetch('/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          conversationHistory: messages
            .filter((m) => m.id !== '1')
            .map((m) => ({ role: m.role, content: m.content })),
        }),
      })

      const data = await res.json()
      if (data.files) {
        setGeneratedProject(data)
        
        const canDeploy = connectionStatus.github && connectionStatus.vercel
        let deployMessage = `✅ **${data.projectName}** 생성 완료!\n\n📁 ${data.files.length}개 파일 생성됨\n\n`
        
        if (canDeploy) {
          deployMessage += '🚀 "배포하기" 버튼을 눌러 바로 배포하세요!'
        } else {
          deployMessage += '⚠️ 배포하려면 '
          if (!connectionStatus.github) deployMessage += 'GitHub '
          if (!connectionStatus.github && !connectionStatus.vercel) deployMessage += '및 '
          if (!connectionStatus.vercel) deployMessage += 'Vercel '
          deployMessage += '연결이 필요합니다.'
        }
        
        setMessages((prev) => [
          ...prev,
          {
            id: Date.now().toString(),
            role: 'assistant',
            content: deployMessage,
            timestamp: new Date(),
          },
        ])
      } else {
        throw new Error(data.error || 'Generation failed')
      }
    } catch {
      setMessages((prev) => [
        ...prev,
        {
          id: Date.now().toString(),
          role: 'assistant',
          content: '코드 생성 중 오류가 발생했어요. 다시 시도해주세요.',
          timestamp: new Date(),
        },
      ])
    } finally {
      setIsGenerating(false)
    }
  }

  const handleDeploy = async () => {
    if (!generatedProject) return

    setIsDeploying(true)
    try {
      const res = await fetch('/api/deploy', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          projectName: generatedProject.projectName,
          files: generatedProject.files,
        }),
      })

      const data = await res.json()
      if (data.success) {
        setDeployResult(data)
        setMessages((prev) => [
          ...prev,
          {
            id: Date.now().toString(),
            role: 'assistant',
            content: `🚀 **배포 완료!**\n\n📦 GitHub: ${data.github.url}\n🌐 Vercel: ${data.vercel.url || '설정 필요'}\n\n앱이 배포되었어요! 잠시 후 URL에서 확인하세요.`,
            timestamp: new Date(),
          },
        ])
      } else {
        throw new Error(data.error)
      }
    } catch (e) {
      setMessages((prev) => [
        ...prev,
        {
          id: Date.now().toString(),
          role: 'assistant',
          content: `배포 중 오류: ${e instanceof Error ? e.message : '알 수 없는 오류'}`,
          timestamp: new Date(),
        },
      ])
    } finally {
      setIsDeploying(false)
    }
  }

  const handleVoice = () => {
    if (isRecording) {
      setIsRecording(false)
    } else {
      setIsRecording(true)
      // TODO: Implement voice recording with Web Speech API
    }
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  const handleLogout = async () => {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/')
  }

  const handleConnectVercel = () => {
    window.location.href = '/api/auth/vercel'
  }

  const handleDisconnect = async (provider: 'github' | 'vercel') => {
    try {
      const res = await fetch(`/api/tokens?provider=${provider}`, {
        method: 'DELETE',
      })
      if (res.ok) {
        fetchConnectionStatus()
        setMessages(prev => [...prev, {
          id: Date.now().toString(),
          role: 'assistant',
          content: `${provider === 'github' ? 'GitHub' : 'Vercel'} 연결이 해제되었습니다.`,
          timestamp: new Date(),
        }])
      }
    } catch (error) {
      console.error('Failed to disconnect:', error)
    }
  }

  const canDeploy = connectionStatus.github && connectionStatus.vercel

  if (!user) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-4 border-purple-500 border-t-transparent rounded-full"></div>
      </div>
    )
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
          <button
            onClick={() => {
              setMessages([
                {
                  id: '1',
                  role: 'assistant',
                  content: '안녕하세요! 👋 어떤 앱을 만들어 드릴까요?',
                  timestamp: new Date(),
                },
              ])
              setGeneratedProject(null)
              setDeployResult(null)
            }}
            className="w-full flex items-center gap-2 px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition mb-4"
          >
            <span>+</span>
            <span>새 프로젝트</span>
          </button>

          {/* 연결 상태 */}
          <div className="mb-4 p-3 bg-slate-700/50 rounded-lg space-y-2">
            <div className="text-sm text-gray-400 mb-2">연결 상태</div>
            
            {isLoadingStatus ? (
              <div className="text-xs text-gray-500">로딩 중...</div>
            ) : (
              <>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className={connectionStatus.github ? 'text-green-400' : 'text-gray-500'}>
                      {connectionStatus.github ? '✅' : '⬜'}
                    </span>
                    <span className="text-sm text-gray-300">GitHub</span>
                  </div>
                  {connectionStatus.github && (
                    <button
                      onClick={() => handleDisconnect('github')}
                      className="text-xs text-gray-500 hover:text-red-400"
                    >
                      해제
                    </button>
                  )}
                </div>
                
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className={connectionStatus.vercel ? 'text-green-400' : 'text-gray-500'}>
                      {connectionStatus.vercel ? '✅' : '⬜'}
                    </span>
                    <span className="text-sm text-gray-300">Vercel</span>
                  </div>
                  {connectionStatus.vercel ? (
                    <button
                      onClick={() => handleDisconnect('vercel')}
                      className="text-xs text-gray-500 hover:text-red-400"
                    >
                      해제
                    </button>
                  ) : (
                    <button
                      onClick={handleConnectVercel}
                      className="text-xs text-purple-400 hover:text-purple-300"
                    >
                      연결
                    </button>
                  )}
                </div>

                {!connectionStatus.github && (
                  <p className="text-xs text-amber-400 mt-2">
                    💡 GitHub 연결은 로그아웃 후 다시 로그인하세요
                  </p>
                )}
              </>
            )}
          </div>

          {generatedProject && (
            <div className="mb-4 p-3 bg-slate-700/50 rounded-lg">
              <div className="text-sm text-gray-400 mb-1">생성된 프로젝트</div>
              <div className="text-white font-medium">{generatedProject.projectName}</div>
              <div className="text-xs text-gray-500">{generatedProject.files.length}개 파일</div>
            </div>
          )}

          {deployResult && (
            <div className="mb-4 p-3 bg-green-900/30 border border-green-700 rounded-lg">
              <div className="text-sm text-green-400 mb-2">✅ 배포됨</div>
              <a
                href={deployResult.github?.url}
                target="_blank"
                className="text-xs text-blue-400 hover:underline block"
              >
                GitHub →
              </a>
              {deployResult.vercel?.url && (
                <a
                  href={deployResult.vercel.url}
                  target="_blank"
                  className="text-xs text-blue-400 hover:underline block mt-1"
                >
                  Live Site →
                </a>
              )}
            </div>
          )}
        </div>

        <div className="p-4 border-t border-slate-700 space-y-2">
          <div className="text-xs text-gray-500 truncate">{user.email}</div>
          <button
            onClick={() => setShowSettings(true)}
            className="w-full flex items-center gap-2 px-4 py-2 text-gray-300 hover:bg-slate-700 rounded-lg transition"
          >
            <span>⚙️</span>
            <span>설정</span>
          </button>
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-2 px-4 py-2 text-gray-400 hover:bg-slate-700 hover:text-red-400 rounded-lg transition"
          >
            <span>🚪</span>
            <span>로그아웃</span>
          </button>
        </div>
      </div>

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col">
        {/* Header */}
        <div className="h-14 border-b border-slate-700 flex items-center justify-between px-6">
          <h1 className="text-white font-semibold">
            {generatedProject ? generatedProject.projectName : '새 프로젝트'}
          </h1>
          <div className="flex items-center gap-3">
            {generatedProject && !deployResult && (
              <button
                onClick={handleDeploy}
                disabled={isDeploying || !canDeploy}
                title={!canDeploy ? 'GitHub과 Vercel을 모두 연결해주세요' : ''}
                className="px-4 py-1.5 bg-green-600 hover:bg-green-700 text-white text-sm rounded-lg transition disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isDeploying ? '배포 중...' : '🚀 배포하기'}
              </button>
            )}
            {messages.length > 2 && !generatedProject && (
              <button
                onClick={handleGenerate}
                disabled={isGenerating}
                className="px-4 py-1.5 bg-purple-600 hover:bg-purple-700 text-white text-sm rounded-lg transition disabled:opacity-50"
              >
                {isGenerating ? '생성 중...' : '✨ 생성하기'}
              </button>
            )}
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
                  <span
                    className="w-2 h-2 bg-gray-500 rounded-full animate-bounce"
                    style={{ animationDelay: '0.1s' }}
                  ></span>
                  <span
                    className="w-2 h-2 bg-gray-500 rounded-full animate-bounce"
                    style={{ animationDelay: '0.2s' }}
                  ></span>
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
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"
                  />
                </svg>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Settings Modal */}
      {showSettings && (
        <SettingsModal
          onClose={() => setShowSettings(false)}
          connectionStatus={connectionStatus}
          onConnectVercel={handleConnectVercel}
          onDisconnect={handleDisconnect}
        />
      )}
    </div>
  )
}

function SettingsModal({
  onClose,
  connectionStatus,
  onConnectVercel,
  onDisconnect,
}: {
  onClose: () => void
  connectionStatus: ConnectionStatus
  onConnectVercel: () => void
  onDisconnect: (provider: 'github' | 'vercel') => void
}) {
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
          {/* GitHub 연결 상태 */}
          <div className="p-4 bg-slate-900/50 rounded-lg">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-3">
                <span className="text-2xl">🐙</span>
                <div>
                  <h3 className="font-medium text-white">GitHub</h3>
                  <p className="text-xs text-gray-400">코드를 저장할 리포지토리</p>
                </div>
              </div>
              {connectionStatus.github ? (
                <span className="px-3 py-1 bg-green-600/20 text-green-400 text-sm rounded-full">
                  ✓ 연결됨
                </span>
              ) : (
                <span className="px-3 py-1 bg-gray-600/20 text-gray-400 text-sm rounded-full">
                  미연결
                </span>
              )}
            </div>
            {connectionStatus.github ? (
              <button
                onClick={() => onDisconnect('github')}
                className="text-xs text-red-400 hover:text-red-300"
              >
                연결 해제
              </button>
            ) : (
              <p className="text-xs text-amber-400">
                💡 GitHub 연결은 로그아웃 후 다시 로그인하면 자동으로 연결됩니다
              </p>
            )}
          </div>

          {/* Vercel 연결 상태 */}
          <div className="p-4 bg-slate-900/50 rounded-lg">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-3">
                <span className="text-2xl">▲</span>
                <div>
                  <h3 className="font-medium text-white">Vercel</h3>
                  <p className="text-xs text-gray-400">앱을 배포할 플랫폼</p>
                </div>
              </div>
              {connectionStatus.vercel ? (
                <span className="px-3 py-1 bg-green-600/20 text-green-400 text-sm rounded-full">
                  ✓ 연결됨
                </span>
              ) : (
                <span className="px-3 py-1 bg-gray-600/20 text-gray-400 text-sm rounded-full">
                  미연결
                </span>
              )}
            </div>
            {connectionStatus.vercel ? (
              <button
                onClick={() => onDisconnect('vercel')}
                className="text-xs text-red-400 hover:text-red-300"
              >
                연결 해제
              </button>
            ) : (
              <button
                onClick={onConnectVercel}
                className="px-4 py-2 bg-white text-black text-sm font-medium rounded-lg hover:bg-gray-100 transition"
              >
                Vercel 연결하기 →
              </button>
            )}
          </div>

          <div className="bg-slate-900/50 rounded-lg p-4">
            <h3 className="text-sm font-medium text-white mb-2">🔒 보안 안내</h3>
            <p className="text-xs text-gray-400">
              OAuth를 통해 연결된 토큰은 암호화되어 안전하게 저장됩니다. 
              언제든지 연결을 해제할 수 있으며, 해제 시 저장된 토큰이 삭제됩니다.
            </p>
          </div>

          <div className="bg-purple-900/20 border border-purple-700/50 rounded-lg p-4">
            <h3 className="text-sm font-medium text-purple-300 mb-2">🚀 배포하려면</h3>
            <p className="text-xs text-gray-300">
              GitHub과 Vercel 모두 연결되어야 프로젝트를 배포할 수 있습니다.
              {connectionStatus.github && connectionStatus.vercel ? (
                <span className="block mt-2 text-green-400">✅ 모든 연결 완료! 바로 배포할 수 있어요.</span>
              ) : (
                <span className="block mt-2 text-amber-400">
                  {!connectionStatus.github && '• GitHub 연결 필요\n'}
                  {!connectionStatus.vercel && '• Vercel 연결 필요'}
                </span>
              )}
            </p>
          </div>
        </div>

        <div className="p-6 border-t border-slate-700 flex justify-end">
          <button 
            onClick={onClose} 
            className="px-4 py-2 text-gray-300 hover:text-white transition"
          >
            닫기
          </button>
        </div>
      </div>
    </div>
  )
}
