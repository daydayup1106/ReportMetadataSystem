import { useState, useEffect } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { TurtleIcon, BellIcon } from './Icons'
import NotificationDropdown from './NotificationDropdown'
import { useNotificationStore } from '@/stores/notificationStore'
import { useAuthStore } from '@/stores/authStore'

interface NavProps {
  scrolled: boolean
}

const navItems = [
  { path: '/dashboard', key: 'dashboard' },
  { path: '/reports', key: 'reports' },
  { path: '/trends', key: 'trends' },
  { path: '/community', key: 'community' },
  { path: '/chat', key: 'ai_assistant' },
] as const

export default function Nav({ scrolled }: NavProps) {
  const location = useLocation()
  const { t } = useTranslation()
  const [isNotifOpen, setIsNotifOpen] = useState(false)
  const { unreadCount, startPolling, stopPolling } = useNotificationStore()
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated)
  const user = useAuthStore((s) => s.user)

  useEffect(() => {
    if (isAuthenticated && user) {
      startPolling()
      return () => stopPolling()
    }
  }, [isAuthenticated, user, startPolling, stopPolling])

  return (
    <nav className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ${scrolled ? 'bg-slate-900/90 backdrop-blur-xl border-b border-white/[0.06] shadow-2xl' : 'bg-transparent'}`}>
      <div className="max-w-[1400px] mx-auto px-8 h-16 flex items-center justify-between">
        <Link to="/" className="flex items-center gap-2.5 group">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-emerald-700 via-green-600 to-amber-600 flex items-center justify-center shadow-lg shadow-emerald-500/20 group-hover:shadow-emerald-500/40 transition">
            <TurtleIcon size={22} />
          </div>
          <span className="text-lg font-bold bg-gradient-to-r from-emerald-300 to-teal-200 bg-clip-text text-transparent font-[family-name:var(--font-outfit)]">
            {t('app_name')}
          </span>
        </Link>

        <div className="flex items-center gap-1">
          {navItems.map((item) => (
            <Link
              key={item.path}
              to={item.path}
              className={`px-4 py-2 rounded-xl text-[13px] font-medium transition-all ${
                location.pathname === item.path
                  ? 'bg-emerald-500/15 text-emerald-300'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-white/[0.04]'
              }`}
            >
              {t(`nav.${item.key}`)}
            </Link>
          ))}
        </div>

        <div className="flex items-center gap-3">
          <div className="relative">
            <button
              onClick={() => setIsNotifOpen(!isNotifOpen)}
              className="relative p-2 text-slate-400 hover:text-slate-200 transition"
            >
              <BellIcon />
              {unreadCount > 0 && (
                <div className="absolute top-1 right-1 min-w-[16px] h-4 bg-red-500 rounded-full ring-2 ring-slate-900 flex items-center justify-center">
                  <span className="text-[9px] font-bold text-white px-1">{unreadCount > 99 ? '99+' : unreadCount}</span>
                </div>
              )}
            </button>
            <NotificationDropdown isOpen={isNotifOpen} onClose={() => setIsNotifOpen(false)} />
          </div>
          <div className="w-px h-6 bg-white/10" />
          {isAuthenticated && user ? (
            <Link
              to="/dashboard"
              className="flex items-center gap-2.5 px-3 py-1.5 rounded-xl hover:bg-white/[0.04] transition"
            >
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-emerald-700 via-green-600 to-amber-600 flex items-center justify-center">
                <span className="text-white text-xs font-bold">
                  {user.display_name?.charAt(0).toUpperCase() ?? 'U'}
                </span>
              </div>
              <span className="text-[13px] font-medium text-slate-200">
                {user.display_name}
              </span>
            </Link>
          ) : (
            <Link
              to="/login"
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 text-white text-[13px] font-semibold hover:shadow-lg hover:shadow-emerald-500/20 transition-all"
            >
              {t('nav.sign_in')}
            </Link>
          )}
        </div>
      </div>
    </nav>
  )
}
