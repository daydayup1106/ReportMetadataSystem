import { useEffect, useRef, useState, useCallback } from 'react'
import { useTranslation } from 'react-i18next'
import {
  TurtleIcon, MicIcon, CameraIcon, SendIcon, StopIcon,
} from '@/components/Icons'
import { useChatStore } from '@/stores/chatStore'
import { useBillingStore } from '@/stores/billingStore'
import { useVoiceRecorder } from '@/hooks/useVoiceRecorder'
import { chatApi, reportsApi, PLAN_REQUIRED_EVENT } from '@/api/client'
import ProBadge from '@/components/ProBadge'
import MarkdownContent from '@/components/MarkdownContent'
import ImagePreviewModal from '@/components/ImagePreviewModal'
import ReportListCard from '@/components/ReportListCard'

export default function ChatPage() {
  const { t } = useTranslation()
  const MAX_MSG_LENGTH = 500
  const [msg, setMsg] = useState('')
  const [inputError, setInputError] = useState<string | null>(null)
  const [voiceError, setVoiceError] = useState<string | null>(null)
  const [imageUploading, setImageUploading] = useState(false)
  const [quotaExceeded, setQuotaExceeded] = useState<{ message: string } | null>(null)
  const isPro = useBillingStore((s) => s.isPro)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const scrollContainerRef = useRef<HTMLDivElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const voice = useVoiceRecorder()

  const {
    sessions,
    activeSessionId,
    sessionsLoading,
    messages,
    messagesLoading,
    isStreaming,
    streamContent,
    streamEventCount,
    loadingContent,
    activeAgents,
    suggestions,
    wsConnected,
    wsError,
    aiReady,
    fetchSessions,
    checkAiStatus,
    createSession,
    selectSession,
    deleteSession,
    sendMessage,
  } = useChatStore()

  useEffect(() => {
    checkAiStatus()
    fetchSessions()
    return () => {
      useChatStore.getState().disconnectWebSocket()
    }
  }, [fetchSessions, checkAiStatus])

  // Auto-scroll to bottom — instant scroll during streaming to keep up with rapid updates
  useEffect(() => {
    const container = scrollContainerRef.current
    if (container) {
      container.scrollTop = container.scrollHeight
    }
  }, [streamContent])

  // Auto-scroll when new messages appear (including after streaming ends).
  // Use rAF to ensure the DOM has fully laid out the new message before scrolling.
  useEffect(() => {
    const frame = requestAnimationFrame(() => {
      const container = scrollContainerRef.current
      if (container) {
        container.scrollTop = container.scrollHeight
      }
    })
    return () => cancelAnimationFrame(frame)
  }, [messages])

  const handleSend = async () => {
    const text = msg.trim()
    if (!text) return

    if (text.length > MAX_MSG_LENGTH) {
      setInputError(t('chat.msg_too_long', { max: MAX_MSG_LENGTH }))
      return
    }
    setInputError(null)
    setMsg('')

    // Create session if none active
    if (!activeSessionId) {
      const session = await createSession()
      await selectSession(session.id)
    }
    // sendMessage after WS is connected
    useChatStore.getState().sendMessage(text)
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  // Auto-clear voice errors after 3s
  useEffect(() => {
    if (voice.error) {
      setVoiceError(t(`chat.${voice.error}`))
      voice.clearError()
      const timer = setTimeout(() => setVoiceError(null), 3000)
      return () => clearTimeout(timer)
    }
  }, [voice.error, t, voice.clearError])

  // Auto-clear WebSocket errors after 5s
  useEffect(() => {
    if (wsError) {
      const timer = setTimeout(() => useChatStore.setState({ wsError: null }), 5000)
      return () => clearTimeout(timer)
    }
  }, [wsError])

  // Listen for quota_exceeded events from chatStore
  useEffect(() => {
    const handler = (e: Event) => {
      const detail = (e as CustomEvent).detail
      setQuotaExceeded({ message: detail?.message || t('billing.chat_quota_exceeded') })
    }
    window.addEventListener('chat:quota_exceeded', handler)
    return () => window.removeEventListener('chat:quota_exceeded', handler)
  }, [t])

  // Auto-clear quota exceeded after 8s
  useEffect(() => {
    if (quotaExceeded) {
      const timer = setTimeout(() => setQuotaExceeded(null), 8000)
      return () => clearTimeout(timer)
    }
  }, [quotaExceeded])

  const handleUpgradeClick = () => {
    window.dispatchEvent(new CustomEvent(PLAN_REQUIRED_EVENT))
  }

  const handleMicClick = async () => {
    if (voice.state === 'transcribing') return

    if (voice.state === 'recording') {
      const text = await voice.stopAndTranscribe()
      if (text) {
        // Auto-send as voice message
        if (!activeSessionId) {
          const session = await createSession()
          await selectSession(session.id)
        }
        useChatStore.getState().sendMessage(text, 'voice')
      }
    } else {
      await voice.startRecording()
    }
  }

  const handleSuggestionClick = (suggestion: string) => {
    sendMessage(suggestion)
  }

  const handleCameraClick = () => {
    fileInputRef.current?.click()
  }

  const handleFileSelected = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    e.target.value = '' // Reset so same file can be re-selected

    setImageUploading(true)
    try {
      // Ensure session exists
      let sessionId = activeSessionId
      if (!sessionId) {
        const session = await createSession()
        await selectSession(session.id)
        sessionId = session.id
      }

      // Upload image
      const { data } = await chatApi.uploadImage(file)
      const promptText = msg.trim() || t('chat.save_report_prompt', 'Please save this report for me')
      setMsg('')

      // Send as image message with file_id
      useChatStore.getState().sendMessage(promptText, 'image', { file_id: data.file_id })
    } catch (err) {
      console.error('Image upload failed:', err)
    } finally {
      setImageUploading(false)
    }
  }, [activeSessionId, createSession, selectSession, msg, t])

  const handleNewChat = async () => {
    const session = await createSession()
    await selectSession(session.id)
  }

  return (
    <div className="flex-1 flex h-[calc(100vh-64px)]">
      {/* Session sidebar */}
      <div className="w-64 border-r border-white/[0.06] bg-slate-900/40 flex flex-col">
        <div className="p-4">
          <button
            onClick={handleNewChat}
            className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-medium rounded-xl transition active:scale-95"
          >
            + {t('chat.new_chat', 'New Chat')}
          </button>
        </div>
        <div className="flex-1 overflow-y-auto px-2 space-y-1">
          {sessionsLoading && (
            <div className="text-center py-4 text-slate-500 text-xs">{t('chat.loading_sessions')}</div>
          )}
          {sessions.map(s => (
            <div
              key={s.id}
              className={`group flex items-center gap-2 px-3 py-2.5 rounded-lg cursor-pointer transition ${
                s.id === activeSessionId
                  ? 'bg-emerald-500/10 text-emerald-300'
                  : 'text-slate-400 hover:bg-white/[0.04] hover:text-slate-200'
              }`}
              onClick={() => selectSession(s.id)}
            >
              <span className="flex-1 text-xs truncate">{s.title || t('chat.untitled')}</span>
              <button
                onClick={(e) => { e.stopPropagation(); deleteSession(s.id) }}
                className="opacity-0 group-hover:opacity-100 text-slate-500 hover:text-red-400 text-xs transition"
              >
                ×
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Main chat area */}
      <div className="flex-1 flex flex-col min-h-0">
        {/* Header */}
        <div className="px-8 py-4 border-b border-white/[0.06] bg-slate-900/60 backdrop-blur-sm flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-emerald-700 via-green-600 to-amber-600 flex items-center justify-center">
              <TurtleIcon size={22} />
            </div>
            <div>
              <h1 className="text-sm font-bold text-white">{t('chat.title')}</h1>
              <p className={`text-[11px] font-medium flex items-center gap-1.5 ${wsConnected ? 'text-emerald-400' : aiReady ? 'text-emerald-400/70' : 'text-slate-500'}`}>
                <span className={`w-1.5 h-1.5 rounded-full ${wsConnected ? 'bg-emerald-400 animate-pulse' : aiReady ? 'bg-emerald-400/60' : 'bg-slate-500'}`} />
                {wsConnected ? t('chat.online') : aiReady ? t('chat.ready', 'Ready') : t('chat.disconnected', 'Disconnected')} · {t('chat.multi_agent')}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 text-[11px]">
            {activeAgents.length > 0 ? (
              activeAgents.map(agent => (
                <span key={agent} className="bg-amber-500/10 text-amber-400 px-2 py-1 rounded font-mono animate-pulse">
                  {agent}
                </span>
              ))
            ) : (
              <>
                <span className="bg-blue-500/10 text-blue-400 px-2 py-1 rounded font-mono">{t('chat.report_agent')}</span>
                <span className="bg-purple-500/10 text-purple-400 px-2 py-1 rounded font-mono">{t('chat.analytics_agent')}</span>
                <span className="bg-amber-500/10 text-amber-400 px-2 py-1 rounded font-mono">{t('chat.research_agent')}</span>
              </>
            )}
          </div>
        </div>

        {/* Messages */}
        <div ref={scrollContainerRef} className="flex-1 overflow-y-auto min-h-0 px-8 py-6">
          <div className="max-w-3xl mx-auto space-y-6">
            {messagesLoading && (
              <div className="text-center py-8 text-slate-500 text-sm">{t('chat.loading_messages')}</div>
            )}

            {!messagesLoading && messages.length === 0 && !isStreaming && (
              <div className="text-center py-16">
                <div className="w-16 h-16 rounded-full bg-gradient-to-br from-emerald-700 via-green-600 to-amber-600 flex items-center justify-center mx-auto mb-4">
                  <TurtleIcon size={32} />
                </div>
                <h2 className="text-lg font-semibold text-white mb-2">{t('chat.title')}</h2>
                <p className="text-sm text-slate-400 max-w-md mx-auto">
                  {t('chat.welcome_message')}
                </p>
              </div>
            )}

            {messages.map(m => (
              <div key={m.id}>
                {m.role === 'user' ? (
                  <div className="flex justify-end">
                    <div className="bg-emerald-600 text-white rounded-2xl rounded-tr-md px-5 py-3 max-w-[65%]">
                      {m.input_type === 'image' && (
                        <div className="mb-2 flex items-center gap-1.5 text-emerald-200">
                          <CameraIcon />
                          <span className="text-[11px]">{t('chat.image_attached', 'Image attached')}</span>
                        </div>
                      )}
                      <p className="text-sm">{m.content}</p>
                    </div>
                  </div>
                ) : (
                  <div className="flex gap-3">
                    <div className="w-9 h-9 rounded-full bg-gradient-to-br from-emerald-700 via-green-600 to-amber-600 flex items-center justify-center shrink-0 mt-1">
                      <TurtleIcon size={18} />
                    </div>
                    <div className="bg-white/[0.04] border border-white/[0.08] rounded-2xl rounded-tl-md px-5 py-4 max-w-[75%]">
                      {m.agent_chain && m.agent_chain.length > 0 && (
                        <div className="flex items-center gap-2 mb-3">
                          {m.agent_chain.map((ac, i) => (
                            <span key={i} className="text-[10px] bg-blue-500/10 text-blue-400 px-2 py-0.5 rounded font-mono">
                              {(ac as { agent?: string }).agent || 'agent'}
                            </span>
                          ))}
                        </div>
                      )}
                      {/* Render chart(s) if present in metadata */}
                      {m.metadata?.chart_data_list ? (
                        <ChartTabContainer
                          chartData={m.metadata.chart_data_list as Record<string, unknown>}
                        />
                      ) : m.metadata?.chart_data ? (
                        <ChartCard data={m.metadata.chart_data as Record<string, unknown>} />
                      ) : null}
                      {/* Render report file card if download data present */}
                      {m.metadata?.download_data ? (
                        <ReportFileCard data={m.metadata.download_data as Record<string, unknown>} />
                      ) : null}
                      <MarkdownContent content={m.content} />
                      {/* Render report list below text — user reads message first, then taps a report */}
                      {m.metadata?.report_list_data ? (
                        <ReportListCard reports={m.metadata.report_list_data as Array<{
                          report_id: string; report_name: string; category: string;
                          report_date: string | null; status: string; metric_count: number;
                          file_type: 'image' | 'pdf' | null;
                          created_at?: string | null;
                          metrics?: Array<{
                            name: string; value: number | null; unit: string;
                            status: string; reference_low: number | null; reference_high: number | null;
                          }>;
                        }>} />
                      ) : null}
                    </div>
                  </div>
                )}
              </div>
            ))}

            {/* Streaming response */}
            {isStreaming && (
              <div className="flex gap-3">
                <div className="w-9 h-9 rounded-full bg-gradient-to-br from-emerald-700 via-green-600 to-amber-600 flex items-center justify-center shrink-0 mt-1">
                  <TurtleIcon size={18} />
                </div>
                <div className="bg-white/[0.04] border border-white/[0.08] rounded-2xl rounded-tl-md px-5 py-4 max-w-[75%]">
                  {activeAgents.length > 0 && (
                    <div className="flex items-center gap-2 mb-3">
                      {activeAgents.map(agent => (
                        <span key={agent} className="text-[10px] bg-amber-500/10 text-amber-400 px-2 py-0.5 rounded font-mono animate-pulse">
                          {agent}
                        </span>
                      ))}
                    </div>
                  )}
                  {streamContent ? (
                    <>
                      <MarkdownContent content={streamContent} />
                      {streamEventCount <= 1 && (
                        <div className="flex gap-1.5 mt-3">
                          <div className="w-2 h-2 rounded-full bg-emerald-400 animate-bounce" style={{ animationDelay: '0ms' }} />
                          <div className="w-2 h-2 rounded-full bg-emerald-400 animate-bounce" style={{ animationDelay: '150ms' }} />
                          <div className="w-2 h-2 rounded-full bg-emerald-400 animate-bounce" style={{ animationDelay: '300ms' }} />
                        </div>
                      )}
                    </>
                  ) : loadingContent ? (
                    <div className="flex items-center gap-2 text-sm text-slate-300">
                      <span>{loadingContent}</span>
                      <span className="inline-flex gap-0.5">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-bounce" style={{ animationDelay: '0ms' }} />
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-bounce" style={{ animationDelay: '150ms' }} />
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-bounce" style={{ animationDelay: '300ms' }} />
                      </span>
                    </div>
                  ) : (
                    <div className="flex gap-1.5">
                      <div className="w-2 h-2 rounded-full bg-emerald-400 animate-bounce" style={{ animationDelay: '0ms' }} />
                      <div className="w-2 h-2 rounded-full bg-emerald-400 animate-bounce" style={{ animationDelay: '150ms' }} />
                      <div className="w-2 h-2 rounded-full bg-emerald-400 animate-bounce" style={{ animationDelay: '300ms' }} />
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Suggestions */}
            {suggestions.length > 0 && !isStreaming && (
              <div className="flex gap-2 ml-12 flex-wrap">
                {suggestions.map(s => (
                  <button
                    key={s}
                    onClick={() => handleSuggestionClick(s)}
                    className="text-[11px] bg-white/[0.04] border border-emerald-500/20 text-emerald-300 px-3 py-1.5 rounded-full font-medium hover:bg-emerald-500/10 transition"
                  >
                    {s}
                  </button>
                ))}
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>
        </div>

        {/* Input */}
        <div className="px-8 py-4 border-t border-white/[0.06] bg-slate-900/80 backdrop-blur-sm">
          {voiceError && (
            <div className="max-w-3xl mx-auto mb-2 text-xs text-red-400">{voiceError}</div>
          )}
          {voice.state === 'recording' && (
            <div className="max-w-3xl mx-auto mb-2 text-xs text-red-400 animate-pulse">{t('chat.recording')}</div>
          )}
          {voice.state === 'transcribing' && (
            <div className="max-w-3xl mx-auto mb-2 text-xs text-emerald-400 animate-pulse">{t('chat.transcribing')}</div>
          )}
          {(inputError || wsError) && (
            <div className="max-w-3xl mx-auto mb-2 text-xs text-red-400">{inputError || wsError}</div>
          )}
          {quotaExceeded && (
            <div className="max-w-3xl mx-auto mb-2 px-3 py-2 rounded-lg bg-amber-500/10 border border-amber-500/20 flex items-center gap-2">
              <span className="text-xs text-amber-300">{quotaExceeded.message}</span>
              <button
                onClick={handleUpgradeClick}
                className="text-xs font-semibold text-amber-400 hover:text-amber-300 underline underline-offset-2 whitespace-nowrap"
              >
                {t('billing.upgrade_link')}
              </button>
            </div>
          )}
          <div className="max-w-3xl mx-auto flex items-center gap-3">
            <input
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/png,image/bmp,image/tiff,application/pdf"
              className="hidden"
              onChange={handleFileSelected}
            />
            <button
              onClick={handleCameraClick}
              disabled={imageUploading || isStreaming}
              className={`p-2.5 text-slate-400 hover:text-slate-200 transition disabled:opacity-50 ${imageUploading ? 'animate-pulse' : ''}`}
            >
              <CameraIcon />
            </button>
            <div className={`flex-1 bg-white/[0.05] border rounded-2xl px-4 py-3 flex items-center transition ${msg.length > MAX_MSG_LENGTH ? 'border-red-500/40' : 'border-white/[0.08] focus-within:border-emerald-500/30'}`}>
              <input
                value={msg}
                onChange={e => { setMsg(e.target.value); if (inputError) setInputError(null) }}
                onKeyDown={handleKeyDown}
                placeholder={t('chat.placeholder')}
                disabled={isStreaming || voice.state !== 'idle'}
                className="flex-1 bg-transparent text-sm text-white outline-none placeholder:text-slate-600 disabled:opacity-50"
              />
              {msg.length > 0 && (
                <span className={`text-[10px] ml-2 tabular-nums whitespace-nowrap ${msg.length > MAX_MSG_LENGTH ? 'text-red-400' : msg.length > MAX_MSG_LENGTH * 0.8 ? 'text-amber-400' : 'text-slate-600'}`}>
                  {msg.length}/{MAX_MSG_LENGTH}
                </span>
              )}
            </div>
            <div className="relative">
              <button
                onClick={isPro ? handleMicClick : handleUpgradeClick}
                disabled={isStreaming || voice.state === 'transcribing'}
                className={`p-3 rounded-xl text-white transition active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed ${
                  voice.state === 'recording'
                    ? 'bg-red-500 hover:bg-red-400 animate-pulse'
                    : 'bg-emerald-500 hover:bg-emerald-400'
                }`}
              >
                {voice.state === 'recording' ? <StopIcon /> : <MicIcon />}
              </button>
              {!isPro && (
                <div className="absolute -top-1 -right-1">
                  <ProBadge isPro={isPro} onUpgradeClick={handleUpgradeClick} className="!px-1 !py-0 !text-[8px]" />
                </div>
              )}
            </div>
            <button
              onClick={handleSend}
              disabled={!msg.trim() || isStreaming || voice.state !== 'idle'}
              className="p-3 bg-emerald-600 rounded-xl text-white hover:bg-emerald-500 transition active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <SendIcon />
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

/* ── Multi-chart tab container ─────────────────────────────────────── */

interface ChartTabItem {
  metric_code: string
  tab_title: string
  chart_data: Record<string, unknown> | null
  empty?: boolean
  error?: string
}

function ChartTabContainer({ chartData }: { chartData: Record<string, unknown> }) {
  const { t } = useTranslation()
  // Handle both wrapped format { tab_titles, chart_data_list, default_tab_index }
  // and legacy raw array format (old history messages stored before the fix).
  const isLegacyArray = Array.isArray(chartData)
  const tabTitles = isLegacyArray
    ? (chartData as unknown as ChartTabItem[]).map(item => item.tab_title)
    : (chartData.tab_titles as string[]) || []
  const chartDataList = isLegacyArray
    ? (chartData as unknown as ChartTabItem[])
    : (chartData.chart_data_list as ChartTabItem[]) || []
  const defaultTabIndex = isLegacyArray ? 0 : (chartData.default_tab_index as number) || 0
  const [activeTab, setActiveTab] = useState(defaultTabIndex)

  if (!chartDataList.length) return null

  const currentItem = chartDataList[activeTab] || chartDataList[0]

  return (
    <div className="mb-3">
      {/* Tab bar — only show if > 1 tab */}
      {tabTitles.length > 1 && (
        <div className="flex gap-1 border-b border-white/10 mb-2">
          {tabTitles.map((title, idx) => (
            <button
              key={idx}
              className={`px-3 py-1 text-xs transition-colors ${
                idx === activeTab
                  ? 'border-b-2 border-emerald-400 text-emerald-400 font-medium'
                  : 'text-slate-500 hover:text-slate-300'
              }`}
              onClick={() => setActiveTab(idx)}
            >
              {title}
            </button>
          ))}
        </div>
      )}

      {/* Chart content — render only active tab */}
      {currentItem.empty ? (
        <div className="text-slate-500 py-4 text-center text-sm">
          {currentItem.error ? t('chat.failed_to_load', { error: currentItem.error }) : t('chat.no_metric_data')}
        </div>
      ) : currentItem.chart_data ? (
        <ChartCard data={currentItem.chart_data} />
      ) : null}
    </div>
  )
}


/* ── Single chart card (supports line, dual_line, scenario_line) ──── */

function ChartCard({ data }: { data: Record<string, unknown> }) {
  const { t, i18n } = useTranslation()

  const chartType = (data.chart_type as string) || 'line'
  const unit = (data.unit as string) || ''
  const metricName = i18n.language === 'zh'
    ? (data.metric_name_cn as string) || (data.metric_name as string) || t('chat.chart_metric')
    : (data.metric_name as string) || t('chat.chart_metric')

  // New data_points format (from chart_node.py)
  const dataPoints = (data.data_points as Array<Record<string, unknown>>) || []

  // Legacy flat arrays (backward compat with old query_agent)
  const legacyValues = (data.values as number[]) || []
  const legacyValues2 = (data.values2 as number[]) || []
  const labels = (data.labels as string[]) || []

  // Extract values from data_points if present, else fall back to legacy arrays
  const values = dataPoints.length > 0
    ? dataPoints.map(p => (p.value as number) ?? 0)
    : legacyValues
  const values2 = dataPoints.length > 0
    ? dataPoints.filter(p => p.value2 != null).map(p => p.value2 as number)
    : legacyValues2

  const currentValue = data.current_value as string | number | null
  const seriesNames = i18n.language === 'zh'
    ? (data.series_names_cn as string[]) || (data.series_names as string[]) || []
    : (data.series_names as string[]) || []

  if (values.length === 0) return null

  const isBp = (data.is_bp as boolean) || false
  const isDualLine = (chartType === 'dual_line' || (chartType === 'scenario_line' && isBp)) && values2.length > 0
  const height = 70
  const width = 400

  // Calculate unified scale
  const allValues = isDualLine ? [...values, ...values2] : values
  const maxVal = Math.max(...allValues)
  const minVal = Math.min(...allValues)
  const range = maxVal - minVal || 1

  const toPoints = (vals: number[]) =>
    vals.map((v, i) => ({
      x: vals.length > 1 ? (i / (vals.length - 1)) * width : width / 2,
      y: height - ((v - minVal) / range) * (height - 10) - 5,
    }))

  const toPath = (pts: { x: number; y: number }[]) =>
    pts.map((p, i) => `${i === 0 ? 'M' : 'L'}${p.x},${p.y}`).join(' ')

  const points1 = toPoints(values)
  const pathD1 = toPath(points1)
  const fillD1 = `${pathD1} L${width},${height} L0,${height} Z`

  const points2 = isDualLine ? toPoints(values2) : []
  const pathD2 = isDualLine ? toPath(points2) : ''

  // Scenario labels for tooltip-style display
  const scenarioLabels = dataPoints.length > 0
    ? dataPoints.map(p => (p.scenario_label as string) || '')
    : []

  // BP legend labels
  const bpLegend = isBp && isDualLine
    ? (seriesNames.length >= 2 ? seriesNames : [t('chat.chart_systolic'), t('chat.chart_diastolic')])
    : seriesNames

  return (
    <div className="bg-emerald-500/5 border border-emerald-500/10 rounded-xl p-4 mb-3">
      <div className="flex items-baseline gap-2 mb-3">
        <span className="text-lg font-bold text-white">
          {currentValue ?? values[values.length - 1]}
        </span>
        <span className="text-[11px] text-slate-500">{unit} · {metricName}</span>
      </div>
      {isDualLine && bpLegend.length >= 2 && (
        <div className="flex items-center gap-4 mb-2">
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-0.5 bg-emerald-500 rounded" />
            <span className="text-[10px] text-slate-400">{bpLegend[0]}</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-0.5 bg-blue-400 rounded" />
            <span className="text-[10px] text-slate-400">{bpLegend[1]}</span>
          </div>
        </div>
      )}
      {/* Scenario legend for scenario_line charts */}
      {chartType === 'scenario_line' && !isBp && (data.scenarios_in_data as string[] || []).length > 1 && (
        <div className="flex flex-wrap gap-2 mb-2">
          {(data.scenarios_in_data as string[]).map((sc, i) => (
            <span key={sc} className="text-[9px] text-slate-400 bg-white/5 px-1.5 py-0.5 rounded">
              {dataPoints.find(p => p.scenario === sc)?.scenario_label || sc}
            </span>
          ))}
        </div>
      )}
      <svg width="100%" viewBox={`0 0 ${width} ${height}`}>
        <defs>
          <linearGradient id="chartGrad1" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#10B981" stopOpacity="0.15" />
            <stop offset="100%" stopColor="#10B981" stopOpacity="0" />
          </linearGradient>
          {isDualLine && (
            <linearGradient id="chartGrad2" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#60A5FA" stopOpacity="0.15" />
              <stop offset="100%" stopColor="#60A5FA" stopOpacity="0" />
            </linearGradient>
          )}
        </defs>
        {/* Line 1 (emerald — systolic or single metric) */}
        <path d={fillD1} fill="url(#chartGrad1)" />
        <path d={pathD1} stroke="#10B981" strokeWidth="2.5" fill="none" strokeLinecap="round" />
        {points1.map((p, i) => (
          <g key={`p1-${i}`}>
            <circle cx={p.x} cy={p.y} r="3" fill="#0F172A" stroke="#10B981" strokeWidth="2" />
            {scenarioLabels[i] && (
              <title>{scenarioLabels[i]}: {values[i]}{unit ? ` ${unit}` : ''}</title>
            )}
          </g>
        ))}
        {/* Line 2 (blue — diastolic) */}
        {isDualLine && (
          <>
            <path d={pathD2} stroke="#60A5FA" strokeWidth="2" fill="none" strokeLinecap="round" />
            {points2.map((p, i) => (
              <circle key={`p2-${i}`} cx={p.x} cy={p.y} r="3" fill="#0F172A" stroke="#60A5FA" strokeWidth="2" />
            ))}
          </>
        )}
      </svg>
      {labels.length >= 2 && (
        <div className="relative mt-1" style={{ height: '14px' }}>
          {(() => {
            const maxLabels = Math.min(labels.length, 5)
            const indices: number[] = []
            if (maxLabels <= 2) {
              indices.push(0, labels.length - 1)
            } else {
              for (let i = 0; i < maxLabels; i++) {
                indices.push(Math.round((i / (maxLabels - 1)) * (labels.length - 1)))
              }
            }
            return indices.map((idx) => {
              const pct = labels.length === 1 ? 50 : (idx / (labels.length - 1)) * 100
              return (
                <span
                  key={idx}
                  className="absolute text-[9px] text-slate-500 -translate-x-1/2"
                  style={{ left: `${pct}%` }}
                >
                  {labels[idx]}
                </span>
              )
            })
          })()}
        </div>
      )}
    </div>
  )
}

function ReportFileCard({ data }: { data: Record<string, unknown> }) {
  const { t } = useTranslation()
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [showModal, setShowModal] = useState(false)

  const reportId = data.report_id as string
  const reportName = (data.report_name as string) || t('chat.report', 'Report')
  const fileType = (data.file_type as string) || 'image'

  // Load preview thumbnail
  useEffect(() => {
    if (!reportId || fileType === 'pdf') return
    let cancelled = false
    setLoading(true)
    reportsApi.preview(reportId).then(({ data: blob }) => {
      if (!cancelled) {
        setPreviewUrl(URL.createObjectURL(blob))
      }
    }).catch(() => {
      // Preview not available
    }).finally(() => {
      if (!cancelled) setLoading(false)
    })
    return () => {
      cancelled = true
    }
  }, [reportId, fileType])

  // Cleanup blob URL
  useEffect(() => {
    return () => {
      if (previewUrl) URL.revokeObjectURL(previewUrl)
    }
  }, [previewUrl])

  const handleDownload = async () => {
    try {
      const { data: blob } = await reportsApi.download(reportId)
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = reportName + (fileType === 'pdf' ? '.pdf' : '.jpg')
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
    } catch {
      console.error('Download failed')
    }
  }

  return (
    <>
      <div className="bg-blue-500/5 border border-blue-500/10 rounded-xl p-4 mb-3">
        <div className="flex items-center gap-2 mb-2">
          <span className="text-[11px] font-medium text-blue-400">
            {fileType === 'pdf' ? 'PDF' : 'IMG'}
          </span>
          <span className="text-sm text-white font-medium truncate">{reportName}</span>
        </div>

        {/* Thumbnail for images */}
        {fileType !== 'pdf' && (
          <div
            className="relative rounded-lg overflow-hidden bg-black/20 cursor-pointer mb-3 max-h-48"
            onClick={() => previewUrl && setShowModal(true)}
          >
            {loading ? (
              <div className="h-32 flex items-center justify-center text-slate-500 text-xs">
                {t('chat.loading_preview', 'Loading preview...')}
              </div>
            ) : previewUrl ? (
              <img src={previewUrl} alt={reportName} className="w-full max-h-48 object-contain" />
            ) : (
              <div className="h-32 flex items-center justify-center text-slate-500 text-xs">
                {t('chat.preview_unavailable', 'Preview unavailable')}
              </div>
            )}
          </div>
        )}

        {/* PDF placeholder */}
        {fileType === 'pdf' && (
          <div className="h-24 rounded-lg bg-black/20 flex items-center justify-center mb-3">
            <svg className="w-10 h-10 text-red-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
              <path d="M7 21h10a2 2 0 002-2V9l-5-5H7a2 2 0 00-2 2v13a2 2 0 002 2z" />
              <polyline points="14 4 14 9 19 9" />
              <line x1="9" y1="13" x2="15" y2="13" />
              <line x1="9" y1="17" x2="13" y2="17" />
            </svg>
          </div>
        )}

        <button
          onClick={handleDownload}
          className="w-full py-2 text-xs font-medium text-blue-300 bg-blue-500/10 hover:bg-blue-500/20 rounded-lg transition"
        >
          {t('chat.download', 'Download')}
        </button>
      </div>

      {/* Full-size modal */}
      {showModal && previewUrl && (
        <ImagePreviewModal
          previewUrl={previewUrl}
          reportName={reportName}
          reportId={reportId}
          onClose={() => setShowModal(false)}
        />
      )}
    </>
  )
}
