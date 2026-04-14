import { useEffect, useRef } from 'react'
import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router-dom'
import { useNotificationStore } from '@/stores/notificationStore'

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 60) return `${mins}m`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24) return `${hrs}h`
  const days = Math.floor(hrs / 24)
  return `${days}d`
}

function typeIcon(type: string): string {
  switch (type) {
    case 'community': return '💬'
    case 'metric_alert': return '📊'
    case 'research_push': return '🔬'
    case 'system': return '🔔'
    default: return '🔔'
  }
}

interface Props {
  isOpen: boolean
  onClose: () => void
}

export default function NotificationDropdown({ isOpen, onClose }: Props) {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const ref = useRef<HTMLDivElement>(null)
  const { notifications, isLoading, fetchNotifications, markRead, markAllRead } = useNotificationStore()

  useEffect(() => {
    if (isOpen) {
      fetchNotifications()
    }
  }, [isOpen, fetchNotifications])

  // Close on outside click
  useEffect(() => {
    if (!isOpen) return
    const handleClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        onClose()
      }
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [isOpen, onClose])

  if (!isOpen) return null

  const handleNotificationClick = (notification: (typeof notifications)[0]) => {
    if (!notification.is_read) {
      markRead([notification.id])
    }
    // Navigate based on notification data
    if (notification.data?.post_id) {
      navigate(`/community/${notification.data.post_id}`)
      onClose()
    }
  }

  return (
    <div
      ref={ref}
      className="absolute top-full right-0 mt-2 w-80 rounded-xl bg-slate-900 border border-white/[0.08] shadow-2xl overflow-hidden z-50"
    >
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-white/[0.06]">
        <h3 className="text-sm font-bold text-white">{t('notifications.title')}</h3>
        <button
          onClick={() => markAllRead()}
          className="text-[11px] text-emerald-400 hover:text-emerald-300 transition font-medium"
        >
          {t('notifications.mark_all_read')}
        </button>
      </div>

      {/* List */}
      <div className="max-h-80 overflow-y-auto">
        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <span className="text-slate-500 text-sm">{t('common.loading')}</span>
          </div>
        ) : notifications.length === 0 ? (
          <div className="flex items-center justify-center py-8">
            <span className="text-slate-500 text-sm">{t('notifications.no_notifications')}</span>
          </div>
        ) : (
          notifications.map((n) => (
            <div
              key={n.id}
              onClick={() => handleNotificationClick(n)}
              className={`px-4 py-3 flex items-start gap-3 hover:bg-white/[0.04] transition cursor-pointer border-b border-white/[0.04] last:border-0 ${
                !n.is_read ? 'bg-emerald-500/[0.03]' : ''
              }`}
            >
              <span className="text-base flex-shrink-0 mt-0.5">{typeIcon(n.type)}</span>
              <div className="flex-1 min-w-0">
                <p className={`text-[12px] leading-snug ${!n.is_read ? 'text-white font-medium' : 'text-slate-400'}`}>
                  {n.title}
                </p>
                {n.body && (
                  <p className="text-[11px] text-slate-500 mt-0.5 truncate">{n.body}</p>
                )}
                <p className="text-[10px] text-slate-600 mt-1">{timeAgo(n.created_at)}</p>
              </div>
              {!n.is_read && (
                <div className="w-2 h-2 bg-emerald-400 rounded-full flex-shrink-0 mt-1.5" />
              )}
            </div>
          ))
        )}
      </div>
    </div>
  )
}
