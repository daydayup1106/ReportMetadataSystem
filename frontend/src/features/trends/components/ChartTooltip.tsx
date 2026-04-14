import { useTranslation } from 'react-i18next'
import type { MetricSeries } from '@/types/api'
import { getScenarioLabel, getScenarioBadge, getSeriesColor } from '../constants'

interface Props {
  active?: boolean
  payload?: Array<{
    dataKey: string
    value: number
    name: string
    payload: {
      xLabel: string
      scenario?: string
      [key: string]: unknown
    }
  }>
  label?: string
  series?: MetricSeries[]
}

export default function ChartTooltip({ active, payload, series }: Props) {
  const { i18n } = useTranslation()
  const isZh = i18n.language === 'zh'

  if (!active || !payload || payload.length === 0) return null

  const row = payload[0].payload
  const scenario = row.scenario as string | undefined

  const getDisplayName = (code: string) => {
    const s = series?.find(s => s.metric_code === code)
    if (s) return isZh && s.metric_name_cn ? s.metric_name_cn : s.metric_name
    return code
  }

  return (
    <div className="bg-slate-800 border border-white/10 rounded-lg px-3 py-2 shadow-xl">
      <p className="text-[11px] text-slate-400 mb-1">{row.xLabel}</p>
      {scenario && (
        <p className={`text-[10px] mb-1 ${getScenarioBadge(scenario).text}`}>
          {getScenarioLabel(scenario, i18n.language)}
        </p>
      )}
      {payload.map(entry => (
        <div key={entry.dataKey} className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full" style={{ backgroundColor: getSeriesColor(entry.dataKey) }} />
          <span className="text-[11px] text-white font-medium">{getDisplayName(entry.dataKey)}: {entry.value}</span>
        </div>
      ))}
    </div>
  )
}
