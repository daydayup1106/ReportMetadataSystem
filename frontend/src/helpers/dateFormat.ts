/**
 * Shared date formatting utilities.
 * Uses native Intl / Date APIs — no external library needed.
 */

type Locale = 'zh' | 'en'

function getIntlLocale(locale: Locale): string {
  return locale === 'zh' ? 'zh-CN' : 'en-US'
}

/**
 * Smart chat timestamp formatting (with seconds):
 * - Today:     "HH:mm:ss"
 * - Yesterday: "Yesterday HH:mm:ss" / "昨天 HH:mm:ss"
 * - This year: "MM-DD HH:mm:ss" (locale-aware)
 * - Older:     "YYYY-MM-DD HH:mm:ss" (locale-aware)
 */
export function formatChatTimestamp(
  isoString: string,
  locale: Locale | string,
  yesterdayLabel: string,
): string {
  const date = new Date(isoString)
  if (isNaN(date.getTime())) return ''

  const now = new Date()
  const loc = (locale === 'zh' ? 'zh' : 'en') as Locale
  const intlLocale = getIntlLocale(loc)

  const timeStr = date.toLocaleTimeString(intlLocale, {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
  })

  // Compare calendar dates
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  const yesterdayStart = new Date(todayStart.getTime() - 86_400_000)
  const dateStart = new Date(date.getFullYear(), date.getMonth(), date.getDate())

  if (dateStart.getTime() === todayStart.getTime()) {
    return timeStr
  }

  if (dateStart.getTime() === yesterdayStart.getTime()) {
    return `${yesterdayLabel} ${timeStr}`
  }

  if (date.getFullYear() === now.getFullYear()) {
    const dateStr = date.toLocaleDateString(intlLocale, {
      month: '2-digit',
      day: '2-digit',
    })
    return `${dateStr} ${timeStr}`
  }

  const dateStr = date.toLocaleDateString(intlLocale, {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  })
  return `${dateStr} ${timeStr}`
}

/**
 * Determine whether to show a timestamp separator between two messages.
 * Returns true if the gap exceeds `gapMinutes` (default 5).
 */
/**
 * Relative time formatting for upload timestamps.
 * e.g. "just now", "3 mins ago", "2 hours ago", "5 days ago", "2 months ago"
 */
export function formatRelativeTime(isoString: string, locale: Locale | string): string {
  const date = new Date(isoString)
  if (isNaN(date.getTime())) return ''

  const now = Date.now()
  const diffMs = now - date.getTime()
  if (diffMs < 0) return ''

  const isZh = locale === 'zh'
  const seconds = Math.floor(diffMs / 1000)
  const minutes = Math.floor(seconds / 60)
  const hours = Math.floor(minutes / 60)
  const days = Math.floor(hours / 24)
  const months = Math.floor(days / 30)

  if (minutes < 1) return isZh ? '刚刚' : 'just now'
  if (minutes < 60) return isZh ? `${minutes} 分钟前` : `${minutes} min${minutes > 1 ? 's' : ''} ago`
  if (hours < 24) return isZh ? `${hours} 小时前` : `${hours} hour${hours > 1 ? 's' : ''} ago`
  if (days < 30) return isZh ? `${days} 天前` : `${days} day${days > 1 ? 's' : ''} ago`
  return isZh ? `${months} 个月前` : `${months} month${months > 1 ? 's' : ''} ago`
}

export function shouldShowTimestamp(
  prevIso: string | null,
  currentIso: string,
  gapMinutes: number = 5,
): boolean {
  if (!prevIso) return true
  const prevMs = new Date(prevIso).getTime()
  const currMs = new Date(currentIso).getTime()
  return currMs - prevMs >= gapMinutes * 60 * 1000
}
