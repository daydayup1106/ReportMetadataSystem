import axios from 'axios'
import type {
  AuthResponse,
  BillingStatus,
  ChatMessageListResponse,
  ChatSession,
  ChatSessionListResponse,
  Comment,
  GroupedTrendResponse,
  HealthMetric,
  LikeResponse,
  MemberListResponse,
  MetricGroupItem,
  MetricsSummaryResponse,
  MetricTrendResponse,
  NewMemberInfo,
  NotificationListResponse,
  OrderResponse,
  Post,
  PostDetailResponse,
  PostListResponse,
  PricingInfo,
  ReportDetailResponse,
  ReportListResponse,
  ScanConfirmResponse,
  SubscriptionStatus,
  TokenResponse,
  TrendingTag,
  User,
  UserRelation,
  FeedbackItem,
  FeedbackListResponse,
} from '@/types/api'

export const PLAN_REQUIRED_EVENT = 'app:plan_required'

const api = axios.create({
  baseURL: '/api/v1',
  headers: { 'Content-Type': 'application/json' },
})

let isRefreshing = false
let failedQueue: { resolve: (token: string) => void; reject: (err: unknown) => void }[] = []

function processQueue(error: unknown, token: string | null) {
  failedQueue.forEach(({ resolve, reject }) => {
    if (error) reject(error)
    else resolve(token!)
  })
  failedQueue = []
}

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('access_token')
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  // Let browser set Content-Type with correct boundary for FormData
  if (config.data instanceof FormData) {
    delete config.headers['Content-Type']
  }
  return config
})

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const original = error.config
    // PLAN_REQUIRED — auto-trigger PricingModal via global event
    if (error.response?.status === 403 && error.response?.data?.error?.code === 'PLAN_REQUIRED') {
      window.dispatchEvent(new CustomEvent(PLAN_REQUIRED_EVENT, { detail: error.response.data }))
      return Promise.reject(error)
    }

    if (error.response?.status === 401 && !original._retry) {
      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({
            resolve: (token: string) => {
              original.headers.Authorization = `Bearer ${token}`
              resolve(api(original))
            },
            reject,
          })
        })
      }
      original._retry = true
      isRefreshing = true
      try {
        const refreshToken = localStorage.getItem('refresh_token')
        if (!refreshToken) {
          throw new Error('No refresh token available')
        }
        const { data } = await axios.post<TokenResponse>('/api/v1/auth/refresh', {
          refresh_token: refreshToken,
        })
        localStorage.setItem('access_token', data.access_token)
        localStorage.setItem('refresh_token', data.refresh_token)
        processQueue(null, data.access_token)
        original.headers.Authorization = `Bearer ${data.access_token}`
        return api(original)
      } catch (refreshError) {
        processQueue(refreshError, null)
        localStorage.removeItem('access_token')
        localStorage.removeItem('refresh_token')
        window.location.href = '/login'
        return Promise.reject(refreshError)
      } finally {
        isRefreshing = false
      }
    }
    return Promise.reject(error)
  },
)

export default api

// --- Auth API ---
export const authApi = {
  register(data: { email: string; password: string; display_name: string }) {
    return api.post<AuthResponse>('/auth/register', data)
  },
  login(data: { email: string; password: string }) {
    return api.post<AuthResponse>('/auth/login', data)
  },
  logout() {
    return api.post('/auth/logout')
  },
  refresh() {
    const refreshToken = localStorage.getItem('refresh_token')
    return api.post<TokenResponse>('/auth/refresh', { refresh_token: refreshToken })
  },
  sendEmailCode(email: string, locale?: string) {
    return api.post('/auth/email/send', { email, locale })
  },
  verifyEmailCode(data: { email: string; code: string }) {
    return api.post<AuthResponse>('/auth/email/verify', data)
  },
}

// --- Users API ---
export const usersApi = {
  getMe() {
    return api.get<User>('/users/me')
  },
  updateMe(data: { display_name?: string; avatar_url?: string; conditions?: string[]; locale?: string }) {
    return api.put<User>('/users/me', data)
  },
}

// --- Members API ---
export const membersApi = {
  list(withData?: boolean) {
    return api.get<MemberListResponse>('/members', {
      params: withData ? { with_data: true } : undefined,
    })
  },
  create(data: { relationship: number; label: string; aliases?: string[] }) {
    return api.post<UserRelation>('/members', data)
  },
  update(memberId: string, data: { label?: string; aliases?: string[] }) {
    return api.patch<UserRelation>(`/members/${memberId}`, data)
  },
  delete(memberId: string) {
    return api.delete(`/members/${memberId}`)
  },
}

// --- Reports API ---
export const reportsApi = {
  list(params?: { category?: string; search?: string; page?: number; limit?: number; member_id?: string; sort_by?: string; sort_order?: string; date_from?: string; date_to?: string }) {
    return api.get<ReportListResponse>('/reports', { params })
  },
  get(reportId: string) {
    return api.get<ReportDetailResponse>(`/reports/${reportId}`)
  },
  upload(file: File, data?: { report_date?: string; hospital?: string }) {
    const form = new FormData()
    form.append('file', file)
    if (data?.report_date) form.append('report_date', data.report_date)
    if (data?.hospital) form.append('hospital', data.hospital)
    return api.post('/reports/upload', form)
  },
  delete(reportId: string) {
    return api.delete(`/reports/${reportId}`)
  },
  preview(reportId: string) {
    return api.get<Blob>(`/reports/${reportId}/preview`, { responseType: 'blob' })
  },
  download(reportId: string) {
    return api.get<Blob>(`/reports/${reportId}/download`, { responseType: 'blob' })
  },
}

// --- Metrics API ---
export const metricsApi = {
  list(params?: { metric_name?: string; from?: string; to?: string; member_id?: string }) {
    return api.get<HealthMetric[]>('/metrics', { params })
  },
  summary(memberId?: string) {
    return api.get<MetricsSummaryResponse>('/metrics/summary', { params: memberId ? { member_id: memberId } : undefined })
  },
  trends(metricName: string, period: string = 'all', memberId?: string) {
    return api.get<MetricTrendResponse>('/metrics/trends', { params: { metric_name: metricName, period, ...(memberId ? { member_id: memberId } : {}) } })
  },
  groups(memberId?: string) {
    return api.get<MetricGroupItem[]>('/metrics/groups', { params: memberId ? { member_id: memberId } : undefined })
  },
  groupedTrends(group: string, period: string = 'all', scenario?: string, memberId?: string, fromDate?: string, toDate?: string) {
    return api.get<GroupedTrendResponse>('/metrics/grouped-trends', {
      params: { group, period, scenario: scenario || undefined, member_id: memberId || undefined, from_date: fromDate || undefined, to_date: toDate || undefined },
    })
  },
}

// --- Chat API ---
export const chatApi = {
  status() {
    return api.get<{ llm_ready: boolean; provider: string }>('/chat/status')
  },
  listSessions() {
    return api.get<ChatSessionListResponse>('/chat/sessions')
  },
  createSession(title?: string) {
    return api.post<ChatSession>('/chat/sessions', { title: title || null })
  },
  getMessages(sessionId: string, params?: { limit?: number; before?: string }) {
    return api.get<ChatMessageListResponse>(`/chat/sessions/${sessionId}/messages`, { params })
  },
  deleteSession(sessionId: string) {
    return api.delete(`/chat/sessions/${sessionId}`)
  },
  uploadImage(file: File) {
    const form = new FormData()
    form.append('file', file)
    return api.post<{ file_id: string; file_path: string }>('/chat/upload-image', form)
  },
}

// --- Scan API ---
export const scanApi = {
  upload(file: File) {
    const form = new FormData()
    form.append('file', file)
    return api.post('/scan/upload', form)
  },
  status(jobId: string) {
    return api.get(`/scan/${jobId}/status`)
  },
  confirm(jobId: string, data: {
    name?: string; report_date?: string; hospital?: string;
    category?: string; corrections?: Record<string, unknown>[];
    member_id?: string; new_member?: NewMemberInfo;
  }) {
    return api.post<ScanConfirmResponse>(`/scan/${jobId}/confirm`, data)
  },
}

// --- Community API ---
export const communityApi = {
  listPosts(params?: { type?: string; tag?: string; sort?: string; page?: number; limit?: number }) {
    return api.get<PostListResponse>('/community/posts', { params })
  },
  createPost(data: { post_type: string; title: string; content: string; source?: string; tags?: string[] }) {
    return api.post<Post>('/community/posts', data)
  },
  getPost(postId: string) {
    return api.get<PostDetailResponse>(`/community/posts/${postId}`)
  },
  deletePost(postId: string) {
    return api.delete(`/community/posts/${postId}`)
  },
  toggleLike(postId: string) {
    return api.post<LikeResponse>(`/community/posts/${postId}/like`)
  },
  addComment(postId: string, data: { content: string; parent_id?: string }) {
    return api.post<Comment>(`/community/posts/${postId}/comments`, data)
  },
  getTrending(limit?: number) {
    return api.get<TrendingTag[]>('/community/trending', { params: { limit } })
  },
  listResearch(params?: { page?: number; limit?: number }) {
    return api.get<PostListResponse>('/community/research', { params })
  },
}

// --- Notification API ---
export const notificationApi = {
  list(params?: { page?: number; limit?: number; unread_only?: boolean }) {
    return api.get<NotificationListResponse>('/notifications', { params })
  },
  unreadCount() {
    return api.get<{ count: number }>('/notifications/unread-count')
  },
  markRead(notificationIds: string[]) {
    return api.put<{ updated: number }>('/notifications/read', { notification_ids: notificationIds })
  },
  markAllRead() {
    return api.put<{ updated: number }>('/notifications/read-all')
  },
}

// --- Speech API ---
export const speechApi = {
  transcribe(audioBlob: Blob) {
    const form = new FormData()
    form.append('file', audioBlob, 'recording.webm')
    return api.post<{ text: string; language_detected: string | null; confidence: number | null }>(
      '/speech/transcribe', form,
    )
  },
}

// --- Billing API ---
export const billingApi = {
  getStatus() {
    return api.get<BillingStatus>('/billing/status')
  },
  getPricing() {
    return api.get<PricingInfo>('/billing/pricing')
  },
  subscribe(data: { provider: string; billing_cycle: string; platform?: string; agreement_accepted: boolean }) {
    return api.post<OrderResponse>('/billing/subscribe', data)
  },
  verifyOrder(orderId: string, queryProvider?: boolean) {
    return api.get<{ status: string }>(`/billing/verify/${orderId}`, {
      params: queryProvider ? { query_provider: true } : undefined,
    })
  },
  verifyOrderPublic(orderId: string, cbToken: string, queryProvider?: boolean) {
    return api.get<{ status: string; plan?: string; billing_cycle?: string }>(`/billing/verify-public/${orderId}`, {
      params: { cb_token: cbToken, ...(queryProvider ? { query_provider: true } : {}) },
    })
  },
  lookupOrderByProvider(outTradeNo: string) {
    return api.get<{ order_id: string; status: string }>('/billing/lookup-order', {
      params: { out_trade_no: outTradeNo },
    })
  },
  cancel() {
    return api.post<SubscriptionStatus>('/billing/cancel')
  },
  claimTrial(data: { agreement_accepted: boolean }) {
    return api.post<SubscriptionStatus>('/billing/claim-trial', data)
  },
  // TODO: uncomment when Alipay agreement signing is implemented
  // toggleAutoRenew(enabled: boolean) {
  //   return api.post<SubscriptionStatus>('/billing/toggle-auto-renew', { enabled })
  // },
}

// --- Feedback API ---
export const feedbackApi = {
  submit(data: { category: string; content: string; contact_email?: string }) {
    return api.post<FeedbackItem>('/feedback', data)
  },
  list(params?: { skip?: number; limit?: number }) {
    return api.get<FeedbackListResponse>('/feedback', { params })
  },
}
