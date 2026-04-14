import { Link, useLocation } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useAuthStore } from '@/stores/authStore'
import { useBillingStore } from '@/stores/billingStore'
import {
  HomeIcon, FileIcon, ChartIcon, UsersIcon, BotIcon,
  CameraIcon, CrownIcon, SettingsIcon, LogoutIcon, ChevronLeftIcon, ChevronRightIcon, HelpIcon,
} from './Icons'
import type { ReactNode } from 'react'

interface SideItem {
  path: string
  icon: ReactNode
  key: string
}

const items: SideItem[] = [
  { path: '/dashboard', icon: <HomeIcon />, key: 'dashboard' },
  { path: '/reports', icon: <FileIcon />, key: 'reports' },
  { path: '/trends', icon: <ChartIcon />, key: 'trends' },
  { path: '/community', icon: <UsersIcon />, key: 'community' },
  { path: '/chat', icon: <BotIcon />, key: 'ai_assistant' },
  { path: '/scan', icon: <CameraIcon />, key: 'scan' },
  { path: '/membership', icon: <CrownIcon />, key: 'membership' },
]

interface SidebarProps {
  collapsed: boolean
  onToggle: () => void
}

export default function Sidebar({ collapsed, onToggle }: SidebarProps) {
  const location = useLocation()
  const { t } = useTranslation()
  const { user, logout } = useAuthStore()
  const { isPro } = useBillingStore()

  return (
    <div className={`${collapsed ? 'w-[68px]' : 'w-[240px]'} shrink-0 h-[calc(100vh-64px)] sticky top-16 border-r border-white/[0.06] bg-slate-900/50 backdrop-blur-sm flex flex-col transition-all duration-300`}>
      {/* Collapse toggle */}
      <div className={`flex ${collapsed ? 'justify-center' : 'justify-end'} p-2`}>
        <button
          onClick={onToggle}
          className="p-1.5 rounded-lg text-slate-500 hover:text-slate-300 hover:bg-white/[0.06] transition"
          title={collapsed ? t('sidebar.expand') : t('sidebar.collapse')}
        >
          {collapsed ? <ChevronRightIcon /> : <ChevronLeftIcon />}
        </button>
      </div>

      <div className={`${collapsed ? 'px-2' : 'p-4 pt-0'} space-y-1 flex-1`}>
        {/* User profile card */}
        {!collapsed ? (
          <div className="flex items-center gap-3 p-3 mb-4 rounded-2xl bg-white/[0.03] border border-white/[0.06]">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-emerald-700 via-green-600 to-amber-600 flex items-center justify-center shrink-0">
              <span className="text-white text-sm font-bold">
                {user?.display_name?.charAt(0).toUpperCase() ?? 'U'}
              </span>
            </div>
            <div className="min-w-0">
              <p className="text-sm font-semibold text-white truncate">{user?.display_name ?? t('common.user')}</p>
              {isPro ? (
                <Link to="/membership" className="text-[11px] text-emerald-400/70 hover:text-emerald-300 transition">
                  Pro
                </Link>
              ) : (
                <Link to="/membership" className="text-[11px] text-emerald-400/70 hover:text-emerald-300 transition">
                  {t('settings.plan_free')} · {t('billing.upgrade_link')}
                </Link>
              )}
            </div>
          </div>
        ) : (
          <div className="flex justify-center mb-4">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-emerald-700 via-green-600 to-amber-600 flex items-center justify-center">
              <span className="text-white text-sm font-bold">
                {user?.display_name?.charAt(0).toUpperCase() ?? 'U'}
              </span>
            </div>
          </div>
        )}

        {/* Nav items */}
        {items.map((item) => (
          <Link
            key={item.path}
            to={item.path}
            title={collapsed ? t(`nav.${item.key}`) : undefined}
            className={`w-full flex items-center ${collapsed ? 'justify-center' : ''} gap-3 px-3 py-2.5 rounded-xl text-[13px] font-medium transition-all ${
              location.pathname === item.path || (item.path === '/community' && location.pathname.startsWith('/community')) || (item.path === '/membership' && location.pathname === '/pricing')
                ? 'bg-emerald-500/15 text-emerald-300'
                : 'text-slate-400 hover:text-slate-200 hover:bg-white/[0.04]'
            }`}
          >
            <span className={`shrink-0 ${
              location.pathname === item.path || (item.path === '/community' && location.pathname.startsWith('/community')) || (item.path === '/membership' && location.pathname === '/pricing')
                ? 'text-emerald-400'
                : 'text-slate-500'
            }`}>
              {item.icon}
            </span>
            {!collapsed && t(`nav.${item.key}`)}
          </Link>
        ))}
      </div>

      {/* Bottom section */}
      <div className={`${collapsed ? 'px-2' : 'p-4'} border-t border-white/[0.06]`}>
        <Link
          to="/settings"
          title={collapsed ? t('nav.settings') : undefined}
          className={`w-full flex items-center ${collapsed ? 'justify-center' : ''} gap-3 px-3 py-2.5 rounded-xl text-[13px] font-medium transition ${
            location.pathname === '/settings'
              ? 'bg-emerald-500/15 text-emerald-300'
              : 'text-slate-500 hover:text-slate-300 hover:bg-white/[0.04]'
          }`}
        >
          <span className={`shrink-0 ${location.pathname === '/settings' ? 'text-emerald-400' : ''}`}>
            <SettingsIcon />
          </span>
          {!collapsed && t('nav.settings')}
        </Link>
        <Link
          to="/help"
          title={collapsed ? t('feedback.title') : undefined}
          className={`w-full flex items-center ${collapsed ? 'justify-center' : ''} gap-3 px-3 py-2.5 rounded-xl text-[13px] font-medium transition ${
            location.pathname === '/help'
              ? 'bg-emerald-500/15 text-emerald-300'
              : 'text-slate-500 hover:text-slate-300 hover:bg-white/[0.04]'
          }`}
        >
          <span className={`shrink-0 ${location.pathname === '/help' ? 'text-emerald-400' : ''}`}>
            <HelpIcon />
          </span>
          {!collapsed && t('feedback.title')}
        </Link>
        <button
          onClick={() => void logout()}
          title={collapsed ? t('nav.sign_out') : undefined}
          className={`w-full flex items-center ${collapsed ? 'justify-center' : ''} gap-3 px-3 py-2.5 rounded-xl text-[13px] font-medium text-slate-500 hover:text-red-400 hover:bg-red-500/5 transition`}
        >
          <span className="shrink-0"><LogoutIcon /></span>
          {!collapsed && t('nav.sign_out')}
        </button>
      </div>
    </div>
  )
}
