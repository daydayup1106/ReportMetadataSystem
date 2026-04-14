import { create } from 'zustand'
import type { ChatSession, ChatMessage } from '@/types/api'
import { chatApi } from '@/api/client'
import { ChatWebSocket, type WSMessage } from '@/api/ws'

interface ChatState {
  // Session list
  sessions: ChatSession[]
  activeSessionId: string | null
  sessionsLoading: boolean

  // Messages
  messages: ChatMessage[]
  messagesLoading: boolean
  hasMore: boolean

  // Streaming state
  isStreaming: boolean
  streamContent: string
  streamEventCount: number
  loadingContent: string
  activeAgents: string[]
  suggestions: string[]
  chartData: Record<string, unknown> | null
  downloadData: Record<string, unknown> | null
  reportListData: Record<string, unknown>[] | null

  // WebSocket
  ws: ChatWebSocket | null
  wsConnected: boolean

  // Errors
  wsError: string | null

  // AI readiness
  aiReady: boolean

  // Actions
  checkAiStatus: () => Promise<void>
  fetchSessions: () => Promise<void>
  createSession: (title?: string) => Promise<ChatSession>
  selectSession: (sessionId: string) => Promise<void>
  deleteSession: (sessionId: string) => Promise<void>
  connectWebSocket: (sessionId: string) => Promise<void>
  disconnectWebSocket: () => void
  sendMessage: (content: string, inputType?: string, extra?: Record<string, unknown>) => Promise<void>
  clearChat: () => void
}

export const useChatStore = create<ChatState>((set, get) => ({
  sessions: [],
  activeSessionId: null,
  sessionsLoading: false,
  messages: [],
  messagesLoading: false,
  hasMore: false,
  isStreaming: false,
  streamContent: '',
  streamEventCount: 0,
  loadingContent: '',
  activeAgents: [],
  suggestions: [],
  chartData: null,
  downloadData: null,
  reportListData: null,
  ws: null,
  wsConnected: false,
  wsError: null,
  aiReady: false,

  checkAiStatus: async () => {
    try {
      const { data } = await chatApi.status()
      set({ aiReady: data.llm_ready })
    } catch {
      set({ aiReady: false })
    }
  },

  fetchSessions: async () => {
    set({ sessionsLoading: true })
    try {
      const { data } = await chatApi.listSessions()
      set({ sessions: data.sessions })
    } catch {
      // Silently fail
    } finally {
      set({ sessionsLoading: false })
    }
  },

  createSession: async (title?: string) => {
    const { data } = await chatApi.createSession(title)
    set(state => ({ sessions: [data, ...state.sessions] }))
    return data
  },

  selectSession: async (sessionId: string) => {
    const { ws } = get()
    if (ws) ws.disconnect()

    set({
      activeSessionId: sessionId,
      messagesLoading: true,
      messages: [],
      streamContent: '',
      streamEventCount: 0,
      loadingContent: '',
      suggestions: [],
      chartData: null,
      downloadData: null,
      reportListData: null,
      activeAgents: [],
    })

    try {
      const { data } = await chatApi.getMessages(sessionId)
      set({ messages: data.messages, hasMore: data.has_more })
    } catch {
      // Silently fail
    } finally {
      set({ messagesLoading: false })
    }

    // Connect WebSocket
    await get().connectWebSocket(sessionId)
  },

  deleteSession: async (sessionId: string) => {
    await chatApi.deleteSession(sessionId)
    set(state => {
      const sessions = state.sessions.filter(s => s.id !== sessionId)
      const isActive = state.activeSessionId === sessionId
      return {
        sessions,
        activeSessionId: isActive ? null : state.activeSessionId,
        messages: isActive ? [] : state.messages,
      }
    })
    const { activeSessionId, ws } = get()
    if (!activeSessionId && ws) {
      ws.disconnect()
      set({ ws: null, wsConnected: false })
    }
  },

  connectWebSocket: async (sessionId: string) => {
    const { ws: existingWs } = get()
    if (existingWs) existingWs.disconnect()

    const token = localStorage.getItem('access_token')
    if (!token) return

    const ws = new ChatWebSocket(sessionId, token)

    // Wire up handlers
    ws.on('agent_start', (msg: WSMessage) => {
      set(state => ({
        activeAgents: [...state.activeAgents, msg.agent || 'unknown'],
        isStreaming: true,
      }))
    })

    ws.on('agent_end', (msg: WSMessage) => {
      set(state => ({
        activeAgents: state.activeAgents.filter(a => a !== msg.agent),
      }))
    })

    ws.on('stream', (msg: WSMessage) => {
      set(state => ({
        streamContent: msg.content || '',
        streamEventCount: state.streamEventCount + 1,
        // Clear loading text once real stream content arrives
        loadingContent: msg.content ? '' : state.loadingContent,
      }))
    })

    ws.on('loading', (msg: WSMessage) => {
      set({ loadingContent: msg.content || '' })
    })

    ws.on('chart', (msg: WSMessage) => {
      // New multi-chart format: {tab_titles, chart_data_list, default_tab_index}
      set({ chartData: msg.data || null })
    })

    ws.on('download', (msg: WSMessage) => {
      set({ downloadData: msg.data || null })
    })

    ws.on('report_list', (msg: WSMessage) => {
      set({ reportListData: (msg.data as Record<string, unknown>[] | undefined) || null })
    })

    ws.on('suggestions', (msg: WSMessage) => {
      set({ suggestions: msg.items || [] })
    })

    ws.on('done', (msg: WSMessage) => {
      const { streamContent, chartData, downloadData, reportListData, activeAgents } = get()

      // Build metadata with chart, download, and/or report list data
      let metadata: Record<string, unknown> | null = null
      if (chartData || downloadData || reportListData) {
        metadata = {}
        if (chartData) metadata.chart_data_list = chartData
        if (downloadData) metadata.download_data = downloadData
        if (reportListData) metadata.report_list_data = reportListData
      }

      const assistantMessage: ChatMessage = {
        id: msg.message_id || crypto.randomUUID(),
        session_id: sessionId,
        role: 'assistant',
        content: streamContent,
        input_type: 'text',
        agent_chain: activeAgents.map(a => ({ agent: a })),
        metadata,
        created_at: new Date().toISOString(),
      }

      set(state => ({
        messages: [...state.messages, assistantMessage],
        isStreaming: false,
        streamContent: '',
        streamEventCount: 0,
        loadingContent: '',
        activeAgents: [],
        downloadData: null,
        reportListData: null,
      }))

      // Refresh session list to update titles/timestamps
      get().fetchSessions()
    })

    ws.on('quota_exceeded', (msg: WSMessage) => {
      set({ isStreaming: false, streamContent: '', streamEventCount: 0, loadingContent: '', activeAgents: [] })
      // Emit custom event for ChatPage to display inline upgrade nudge
      window.dispatchEvent(new CustomEvent('chat:quota_exceeded', { detail: msg }))
    })

    ws.on('error', (msg: WSMessage) => {
      console.error('Chat WS error:', msg.message)
      set({ isStreaming: false, streamContent: '', streamEventCount: 0, loadingContent: '', activeAgents: [], wsError: msg.message || 'An error occurred' })
    })

    ws.on('close', () => {
      set({ wsConnected: false, isStreaming: false, streamContent: '', streamEventCount: 0, loadingContent: '', activeAgents: [] })
    })

    try {
      await ws.connect()
      set({ ws, wsConnected: true })
    } catch (err) {
      console.error('WS connect failed:', err)
      set({ ws: null, wsConnected: false })
    }
  },

  disconnectWebSocket: () => {
    const { ws } = get()
    if (ws) ws.disconnect()
    set({ ws: null, wsConnected: false })
  },

  sendMessage: async (content: string, inputType: string = 'text', extra?: Record<string, unknown>) => {
    let { ws, activeSessionId } = get()
    if (!activeSessionId) return

    // If WebSocket is missing or disconnected, try to reconnect
    if (!ws || !ws.connected) {
      console.warn('WebSocket not connected, reconnecting…')
      try {
        await get().connectWebSocket(activeSessionId)
        ws = get().ws
      } catch {
        // reconnect failed
      }
    }
    if (!ws) return

    // Add user message to state immediately
    const userMessage: ChatMessage = {
      id: crypto.randomUUID(),
      session_id: activeSessionId,
      role: 'user',
      content,
      input_type: inputType as 'text' | 'voice' | 'image',
      agent_chain: null,
      metadata: extra?.file_id ? { image_file_id: extra.file_id } : null,
      created_at: new Date().toISOString(),
    }

    set(state => ({
      messages: [...state.messages, userMessage],
      isStreaming: true,
      streamContent: '',
      streamEventCount: 0,
      loadingContent: '',
      wsError: null,
      suggestions: [],
      chartData: null,
      downloadData: null,
      reportListData: null,
      activeAgents: [],
    }))

    try {
      ws.send(content, inputType, extra)
    } catch (err) {
      console.error('Failed to send message:', err)
      // Remove the failed user message so user can retry
      set(state => ({
        messages: state.messages.filter(m => m.id !== userMessage.id),
        isStreaming: false,
      }))
    }
  },

  clearChat: () => {
    const { ws } = get()
    if (ws) ws.disconnect()
    set({
      activeSessionId: null,
      messages: [],
      ws: null,
      wsConnected: false,
      isStreaming: false,
      streamContent: '',
      streamEventCount: 0,
      loadingContent: '',
      suggestions: [],
      chartData: null,
      downloadData: null,
      reportListData: null,
      activeAgents: [],
    })
  },
}))
