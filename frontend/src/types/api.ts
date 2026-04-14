export interface User {
  id: string
  email: string | null
  phone: string | null
  display_name: string
  avatar_url: string | null
  plan: 'free' | 'premium'
  conditions: string[] | null
  locale: string
  email_verified: boolean
  phone_verified: boolean
  created_at: string
}

export interface TokenResponse {
  access_token: string
  refresh_token: string
  token_type: string
}

export interface AuthResponse {
  user: User
  access_token: string
  refresh_token: string
  token_type: string
}

export interface Report {
  id: string
  name: string
  report_date: string | null
  hospital: string | null
  category: 'blood_test' | 'imaging' | 'cardiac' | 'metabolic' | 'other'
  status: 'normal' | 'review' | 'critical'
  metric_count: number
  tags: string[] | null
  tags_cn: string[] | null
  file_type: 'image' | 'pdf' | null
  created_at: string
  member_id: string
}

export interface HealthMetric {
  id: string
  report_id: string
  metric_name: string
  metric_name_cn: string | null
  metric_code: string | null
  metric_category: string | null
  value: number
  unit: string
  reference_low: number | null
  reference_high: number | null
  status: 'normal' | 'low' | 'high' | 'critical'
  measured_at: string
}

// Actual shape returned by GET /reports/{id}
export interface ReportDetailResponse {
  report: Report
  metrics: HealthMetric[]
}

// Convenience type for store usage (flattened report + metrics)
export interface ReportDetail extends Report {
  metrics: HealthMetric[]
}

// Response from GET /reports
export interface ReportListResponse {
  reports: Report[]
  total: number
  page: number
  limit: number
}

// Response from POST /scan/{id}/confirm
export interface ScanConfirmResponse {
  report: Report
  metrics_saved: number
}

// Metrics summary types
export interface MetricSummaryItem {
  metric_name: string
  metric_name_cn?: string
  latest_value: number
  unit: string
  change_percent: number | null
  trend: 'up' | 'down' | 'stable'
  status: string
}

export interface MetricsSummaryResponse {
  overview: MetricSummaryItem[]
  last_updated: string | null
}

// Metrics trend types
export interface TrendDataPoint {
  date: string
  value: number
}

export interface MetricTrendResponse {
  metric_name: string
  unit: string
  data_points: TrendDataPoint[]
  current_value: number | null
  peak_value: number | null
  change_from_peak: number | null
}

export interface ChatSession {
  id: string
  title: string | null
  summary: string | null
  created_at: string
  updated_at: string
}

export interface ChatMessage {
  id: string
  session_id: string
  role: 'user' | 'assistant' | 'system'
  content: string
  input_type: 'text' | 'voice' | 'image'
  agent_chain: Record<string, unknown>[] | null
  metadata: Record<string, unknown> | null
  created_at: string
}

export interface ChatSessionListResponse {
  sessions: ChatSession[]
}

export interface ChatMessageListResponse {
  messages: ChatMessage[]
  has_more: boolean
}

export interface Post {
  id: string
  user_id: string
  user_display_name: string
  user_avatar: string | null
  post_type: 'discussion' | 'research_share'
  title: string
  content: string
  source: string | null
  tags: string[] | null
  like_count: number
  comment_count: number
  is_liked: boolean
  created_at: string
}

export interface Comment {
  id: string
  user_id: string
  user_display_name: string
  user_avatar: string | null
  content: string
  parent_id: string | null
  like_count: number
  created_at: string
}

export interface PostListResponse {
  posts: Post[]
  total: number
  page: number
  limit: number
}

export interface PostDetailResponse {
  post: Post
  comments: Comment[]
}

export interface LikeResponse {
  liked: boolean
  like_count: number
}

export interface TrendingTag {
  tag: string
  count: number
}

export interface Notification {
  id: string
  type: 'metric_alert' | 'research_push' | 'community' | 'system'
  title: string
  body: string | null
  is_read: boolean
  data: Record<string, unknown> | null
  created_at: string
}

export interface NotificationListResponse {
  notifications: Notification[]
  total: number
  unread_count: number
}

export interface UserRelation {
  id: string
  relationship: number
  is_owner: boolean
  label: string
  aliases: string[] | null
  created_at: string
  updated_at: string
}

export interface MemberListResponse {
  members: UserRelation[]
}

export interface NewMemberInfo {
  relationship: number
  label: string
}

export interface ApiError {
  error: {
    code: string
    message: string
    details?: { field: string; message: string }[]
  }
}

// --- Grouped Trend types ---

export interface GroupedTrendDataPoint {
  measured_at: string
  scenario: string | null
  value: number
}

export interface MetricSeries {
  metric_name: string
  metric_name_cn: string | null
  metric_code: string
  unit: string
  reference_low: number | null
  reference_high: number | null
  data_points: GroupedTrendDataPoint[]
  current_value: number | null
  peak_value: number | null
  change_from_peak: number | null
}

export interface MetricGroupItem {
  group_key: string
  label: string
  label_cn: string | null
  is_merged: boolean
  has_scenarios: boolean
}

export interface GroupedTrendResponse {
  group_key: string
  group_label: string
  group_label_cn: string | null
  is_merged: boolean
  series: MetricSeries[]
  available_scenarios: string[]
  period: string
  scenario_filter: string | null
}

// --- Billing types ---

export interface SubscriptionStatus {
  plan: 'free' | 'pro'
  status: 'active' | 'trialing' | 'cancelled' | 'expired' | 'past_due'
  billing_cycle: 'monthly' | 'quarterly' | 'yearly' | null
  current_period_end: string | null
  auto_renew: boolean
  trial_claimed: boolean
  trial_claim_expired: boolean
}

export interface QuotaCounter {
  current: number
  limit: number | null
  resets_at: string | null
}

export interface QuotaStatus {
  chat_daily: QuotaCounter
  report_monthly: QuotaCounter
  community_post_weekly: QuotaCounter
  image_upload_weekly: QuotaCounter
}

export interface BillingStatus {
  subscription: SubscriptionStatus
  quota: QuotaStatus
}

export interface PricingInfo {
  currency: string
  monthly_price: number
  quarterly_price: number
  yearly_price: number
  quarterly_discount_pct: number
  yearly_discount_pct: number
  providers: string[]
}

export interface OrderResponse {
  order_id: string
  payment_url: string | null
  code_url: string | null
  status: string
  cb_token: string | null
}

// --- Feedback types ---

export interface FeedbackItem {
  id: string
  category: 'bug' | 'feature' | 'general'
  content: string
  contact_email: string | null
  status: 'pending' | 'reviewed' | 'resolved'
  created_at: string
}

export interface FeedbackListResponse {
  feedbacks: FeedbackItem[]
  total: number
}
