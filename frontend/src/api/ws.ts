/**
 * WebSocket client for AI chat with auto-reconnect.
 */

export interface WSMessage {
  type: string
  content?: string
  agent?: string
  data?: Record<string, unknown>
  items?: string[]
  message_id?: string
  message?: string
  code?: string
  token?: string
}

type WSHandler = (msg: WSMessage) => void

export class ChatWebSocket {
  private ws: WebSocket | null = null
  private url: string
  private token: string
  private handlers: Map<string, WSHandler[]> = new Map()
  private reconnectAttempts = 0
  private maxReconnectAttempts = 5
  private reconnectTimeout: ReturnType<typeof setTimeout> | null = null
  private _connected = false

  constructor(sessionId: string, token: string) {
    this.token = token
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:'
    const host = window.location.host
    this.url = `${protocol}//${host}/api/v1/chat/ws/${sessionId}`
  }

  get connected() {
    return this._connected
  }

  connect(): Promise<void> {
    return new Promise((resolve, reject) => {
      this.ws = new WebSocket(this.url)

      this.ws.onopen = () => {
        // Send auth message
        this.ws!.send(JSON.stringify({ type: 'auth', token: this.token }))
      }

      this.ws.onmessage = (event) => {
        const msg: WSMessage = JSON.parse(event.data)

        // Handle auth response
        if (msg.type === 'auth_ok') {
          this._connected = true
          this.reconnectAttempts = 0
          resolve()
          this._emit('auth_ok', msg)
          return
        }

        if (msg.type === 'error' && msg.code === 'AUTH_FAILED') {
          this._connected = false
          reject(new Error(msg.message || 'Authentication failed'))
          return
        }

        this._emit(msg.type, msg)
      }

      this.ws.onclose = (event) => {
        this._connected = false
        this._emit('close', { type: 'close', code: String(event.code) })

        // Auto-reconnect on unexpected close
        if (event.code !== 1000 && event.code < 4000) {
          this._scheduleReconnect()
        }
      }

      this.ws.onerror = () => {
        this._emit('error', { type: 'error', message: 'WebSocket error' })
      }
    })
  }

  send(content: string, type: string = 'text', extra?: Record<string, unknown>): void {
    if (!this.ws || this.ws.readyState !== WebSocket.OPEN) {
      throw new Error('WebSocket not connected')
    }
    this.ws.send(JSON.stringify({ type, content, ...extra }))
  }

  on(type: string, handler: WSHandler): void {
    if (!this.handlers.has(type)) {
      this.handlers.set(type, [])
    }
    this.handlers.get(type)!.push(handler)
  }

  off(type: string, handler?: WSHandler): void {
    if (!handler) {
      this.handlers.delete(type)
    } else {
      const handlers = this.handlers.get(type)
      if (handlers) {
        this.handlers.set(type, handlers.filter(h => h !== handler))
      }
    }
  }

  disconnect(): void {
    if (this.reconnectTimeout) {
      clearTimeout(this.reconnectTimeout)
      this.reconnectTimeout = null
    }
    this.reconnectAttempts = this.maxReconnectAttempts // Prevent reconnect
    if (this.ws) {
      this.ws.close(1000)
      this.ws = null
    }
    this._connected = false
  }

  private _emit(type: string, msg: WSMessage): void {
    const handlers = this.handlers.get(type) || []
    handlers.forEach(h => h(msg))

    // Also emit to wildcard handlers
    const wildcardHandlers = this.handlers.get('*') || []
    wildcardHandlers.forEach(h => h(msg))
  }

  private _scheduleReconnect(): void {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      this._emit('reconnect_failed', { type: 'reconnect_failed' })
      return
    }

    const delay = Math.min(1000 * Math.pow(2, this.reconnectAttempts), 30000)
    this.reconnectAttempts++

    this._emit('reconnecting', {
      type: 'reconnecting',
      message: `Reconnecting in ${delay / 1000}s (attempt ${this.reconnectAttempts})`,
    })

    this.reconnectTimeout = setTimeout(() => {
      this.connect().catch(() => {
        // Will trigger onclose which schedules another reconnect
      })
    }, delay)
  }
}
