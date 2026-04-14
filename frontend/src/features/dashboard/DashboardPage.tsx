import { useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router-dom'
import {
  SearchIcon, CameraIcon, MicIcon, ChartIcon, BotIcon,
  FileIcon, RightIcon, UpIcon, DownIcon,
} from '@/components/Icons'
import { useAuthStore } from '@/stores/authStore'
import { useReportStore } from '@/stores/reportStore'

function formatDate(dateStr: string, locale: string) {
  const d = new Date(dateStr)
  return d.toLocaleDateString(locale === 'zh' ? 'zh-CN' : 'en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

export default function DashboardPage() {
  const { t, i18n } = useTranslation()
  const navigate = useNavigate()
  const { user } = useAuthStore()
  const { reports, metricsSummary, isLoading, fetchReports, fetchMetricsSummary } = useReportStore()

  const quickActions = [
    { icon: <CameraIcon />, l: t('dashboard.scan_report'), d: t('dashboard.upload_or_photo'), path: '/scan' },
    { icon: <MicIcon />, l: t('dashboard.voice_query'), d: t('dashboard.ask_health'), path: '/chat' },
    { icon: <ChartIcon />, l: t('dashboard.view_trends'), d: t('dashboard.track_metrics'), path: '/trends' },
    { icon: <BotIcon />, l: t('dashboard.ai_chat'), d: t('dashboard.get_insights'), path: '/chat' },
  ]

  useEffect(() => {
    fetchReports({ limit: 4 })
    fetchMetricsSummary()
  }, [fetchReports, fetchMetricsSummary])

  const lastUpdated = reports.length > 0 ? formatDate(reports[0].created_at, i18n.language) : null

  return (
    <div className="flex-1 p-8 overflow-y-auto">
      <div className="flex items-center justify-between mb-8">
        <div>
          <p className="text-emerald-400/70 text-sm font-medium">{t('dashboard.good_morning')} 🌿</p>
          <h1 className="text-2xl font-bold text-white mt-1 font-[family-name:var(--font-outfit)]">
            Hi, {user?.display_name || 'there'}
          </h1>
        </div>
        <div className="flex items-center gap-2 bg-white/[0.05] border border-white/[0.08] rounded-xl px-4 py-2.5">
          <SearchIcon />
          <input placeholder={t('dashboard.search_placeholder')} className="bg-transparent text-sm text-slate-300 outline-none placeholder:text-slate-600 w-52" />
        </div>
      </div>

      {/* Health Overview */}
      <div className="bg-gradient-to-br from-green-600 via-emerald-600 to-teal-700 rounded-2xl p-6 mb-8 shadow-xl shadow-emerald-900/30">
        <div className="flex items-center justify-between mb-5">
          <span className="text-emerald-100 text-sm font-medium">{t('dashboard.health_overview')}</span>
          {lastUpdated && (
            <span className="text-emerald-200/60 text-[12px]">{t('dashboard.last_updated')}: {lastUpdated}</span>
          )}
        </div>
        {metricsSummary.length > 0 ? (
          <div className="grid grid-cols-4 gap-4">
            {metricsSummary.slice(0, 4).map((m, i) => {
              const changeStr = m.change_percent != null
                ? `${m.change_percent > 0 ? '+' : ''}${m.change_percent.toFixed(1)}%`
                : '--'
              return (
                <div key={i} className="bg-white/10 backdrop-blur-sm rounded-xl p-4">
                  <p className="text-emerald-100/80 text-[12px] font-medium">{i18n.language === 'zh' ? (m.metric_name_cn || m.metric_name) : m.metric_name}</p>
                  <div className="flex items-baseline gap-2 mt-2">
                    <span className="text-white text-2xl font-bold">{m.latest_value}</span>
                    <span className="text-emerald-200/60 text-[11px]">{m.unit}</span>
                  </div>
                  <div className="flex items-center gap-1.5 mt-2">
                    {m.trend === 'down' ? <DownIcon /> : m.trend === 'up' ? <UpIcon /> : null}
                    <span className={`text-[11px] font-semibold ${m.trend === 'down' ? 'text-emerald-200' : m.trend === 'up' ? 'text-amber-200' : 'text-slate-300'}`}>
                      {changeStr} {t('dashboard.vs_last')}
                    </span>
                  </div>
                </div>
              )
            })}
          </div>
        ) : (
          <div className="text-center py-6">
            <p className="text-emerald-100/70 text-sm">
              {isLoading ? t('dashboard.loading_metrics') : t('dashboard.no_metrics_yet')}
            </p>
          </div>
        )}
      </div>

      <div className="grid grid-cols-3 gap-6">
        {/* Quick Actions */}
        <div className="col-span-1">
          <h3 className="text-sm font-bold text-white mb-4">{t('dashboard.quick_actions')}</h3>
          <div className="space-y-3">
            {quickActions.map((a, i) => (
              <button key={i} onClick={() => navigate(a.path)} className="w-full flex items-center gap-3 p-3 rounded-xl bg-white/[0.03] border border-white/[0.06] hover:bg-white/[0.06] hover:border-emerald-500/20 transition-all group">
                <div className="w-10 h-10 rounded-xl bg-emerald-500/10 flex items-center justify-center text-emerald-400 group-hover:scale-110 transition">{a.icon}</div>
                <div className="text-left flex-1">
                  <p className="text-sm font-semibold text-white">{a.l}</p>
                  <p className="text-[11px] text-slate-500">{a.d}</p>
                </div>
                <RightIcon />
              </button>
            ))}
          </div>
        </div>

        {/* Recent Reports + Research */}
        <div className="col-span-2">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-bold text-white">{t('dashboard.recent_reports')}</h3>
            <button onClick={() => navigate('/reports')} className="text-[12px] text-emerald-400 font-semibold">{t('dashboard.view_all')} →</button>
          </div>
          {reports.length > 0 ? (
            <div className="space-y-3">
              {reports.slice(0, 4).map((r) => (
                <div key={r.id} className="flex items-center gap-4 p-4 rounded-xl bg-white/[0.03] border border-white/[0.06] hover:bg-white/[0.05] transition cursor-pointer group">
                  <div className="w-11 h-11 rounded-xl bg-white/[0.06] flex items-center justify-center text-slate-400 group-hover:text-emerald-400 transition"><FileIcon /></div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-white truncate">{r.name}</p>
                    <p className="text-[11px] text-slate-500">{r.hospital || t('dashboard.unknown_hospital')} · {formatDate(r.created_at, i18n.language)}</p>
                    {r.tags && r.tags.length > 0 && (
                      <div className="flex gap-1.5 mt-1.5">
                        {(i18n.language === 'zh' && r.tags_cn?.length ? r.tags_cn : r.tags).map(tag => <span key={tag} className="text-[10px] text-slate-400 bg-white/[0.05] px-2 py-0.5 rounded border border-white/[0.06]">{tag}</span>)}
                      </div>
                    )}
                  </div>
                  <div className="text-right shrink-0">
                    <span className={`text-[11px] font-semibold px-2.5 py-1 rounded-full ${r.status === 'normal' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-amber-500/10 text-amber-400'}`}>
                      {t(`common.${r.status}`)}
                    </span>
                    <p className="text-[10px] text-slate-500 mt-1.5">{r.metric_count} {t('reports.metrics')}</p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="p-8 rounded-xl bg-white/[0.03] border border-white/[0.06] text-center">
              <p className="text-slate-400 text-sm">
                {isLoading ? t('dashboard.loading_reports') : t('dashboard.no_reports_yet')}
              </p>
            </div>
          )}

          <div className="mt-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-bold text-white">{t('dashboard.for_you')} 🔥</h3>
            </div>
            <div className="bg-gradient-to-r from-blue-500/10 to-indigo-500/10 border border-blue-500/10 rounded-xl p-5">
              <span className="text-[10px] font-semibold text-blue-400 bg-blue-500/15 px-2.5 py-1 rounded-full">{t('dashboard.new_research')}</span>
              <p className="text-sm font-bold text-white mt-3">{t('dashboard.research_title')}</p>
              <p className="text-[12px] text-slate-400 mt-2">{t('dashboard.research_meta')}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
