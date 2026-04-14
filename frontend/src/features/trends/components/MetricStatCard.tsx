import { useTranslation } from 'react-i18next'
import { DownIcon, UpIcon } from '@/components/Icons'
import type { MetricSeries } from '@/types/api'
import { getSeriesColor } from '../constants'

interface Props {
  series: MetricSeries[]
}

export default function MetricStatCard({ series }: Props) {
  const { t, i18n } = useTranslation()
  const isZh = i18n.language === 'zh'

  if (series.length === 0) return null

  return (
    <div className="flex gap-4 mb-4 flex-wrap">
      {series.map(s => {
        const color = getSeriesColor(s.metric_code)
        const label = isZh && s.metric_name_cn ? s.metric_name_cn : s.metric_name
        return (
          <div
            key={s.metric_code}
            className="flex-1 min-w-[140px] p-4 rounded-xl bg-white/[0.03] border border-white/[0.06]"
          >
            <div className="flex items-center gap-2 mb-1">
              <span className="w-2 h-2 rounded-full" style={{ backgroundColor: color }} />
              <span className="text-xs text-slate-400 font-medium">{label}</span>
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-bold text-white">
                {s.current_value != null ? s.current_value : '--'}
              </span>
              <span className="text-xs text-slate-500">{s.unit}</span>
            </div>
            {s.change_from_peak != null && (
              <div className="flex items-center gap-1 mt-1">
                {s.change_from_peak <= 0 ? <DownIcon /> : <UpIcon />}
                <span className="text-[11px] text-emerald-400 font-semibold">
                  {s.change_from_peak.toFixed(1)}% {t('trends.from_peak')}
                </span>
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}
