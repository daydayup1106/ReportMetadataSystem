import { useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from 'recharts'
import type { GroupedTrendResponse } from '@/types/api'
import { getSeriesColor } from '../constants'
import ChartTooltip from './ChartTooltip'

interface ChartRow {
  xKey: string
  xLabel: string
  scenario?: string
  [metricCode: string]: string | number | undefined
}

interface Props {
  data: GroupedTrendResponse
}

function formatDatetime(isoStr: string, hasScenario: boolean): string {
  const d = new Date(isoStr)
  const mm = String(d.getMonth() + 1).padStart(2, '0')
  const dd = String(d.getDate()).padStart(2, '0')
  if (hasScenario) return `${mm}-${dd}`
  const hh = String(d.getHours()).padStart(2, '0')
  const min = String(d.getMinutes()).padStart(2, '0')
  const ss = String(d.getSeconds()).padStart(2, '0')
  return `${mm}-${dd} ${hh}:${min}:${ss}`
}

export default function TrendChart({ data }: Props) {
  const { t, i18n } = useTranslation()
  const isZh = i18n.language === 'zh'
  const hasScenarioFilter = data.scenario_filter != null

  const chartRows = useMemo<ChartRow[]>(() => {
    if (data.series.length === 0) return []

    if (data.is_merged) {
      // Merge multiple series by measured_at timestamp
      const rowMap = new Map<string, ChartRow>()
      for (const s of data.series) {
        for (const dp of s.data_points) {
          const key = dp.measured_at
          if (!rowMap.has(key)) {
            rowMap.set(key, {
              xKey: key,
              xLabel: formatDatetime(key, hasScenarioFilter),
              scenario: dp.scenario || undefined,
            })
          }
          rowMap.get(key)![s.metric_code] = dp.value
        }
      }
      return Array.from(rowMap.values()).sort((a, b) => a.xKey.localeCompare(b.xKey))
    } else {
      // Single series
      const s = data.series[0]
      if (!s) return []
      return s.data_points.map(dp => ({
        xKey: dp.measured_at,
        xLabel: formatDatetime(dp.measured_at, hasScenarioFilter),
        scenario: dp.scenario || undefined,
        [s.metric_code]: dp.value,
      }))
    }
  }, [data, hasScenarioFilter])

  if (chartRows.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16">
        <p className="text-slate-400 text-sm">{t('trends.no_trend_data')}</p>
        <p className="text-slate-500 text-[12px] mt-1">{t('trends.no_trend_hint')}</p>
      </div>
    )
  }

  return (
    <ResponsiveContainer width="100%" height={280}>
      <LineChart data={chartRows} margin={{ top: 10, right: 10, left: 0, bottom: 5 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
        <XAxis
          dataKey="xLabel"
          tick={{ fontSize: 10, fill: '#64748B' }}
          tickLine={false}
          axisLine={{ stroke: 'rgba(255,255,255,0.08)' }}
          interval="preserveStartEnd"
        />
        <YAxis
          tick={{ fontSize: 10, fill: '#64748B' }}
          tickLine={false}
          axisLine={false}
          width={45}
        />
        <Tooltip content={<ChartTooltip series={data.series} />} />
        {data.series.length > 1 && (
          <Legend
            wrapperStyle={{ fontSize: 11, color: '#94A3B8' }}
            formatter={(value: string) => {
              const s = data.series.find(s => s.metric_code === value)
              if (s) return isZh && s.metric_name_cn ? s.metric_name_cn : s.metric_name
              return value
            }}
          />
        )}
        {data.series.map(s => (
          <Line
            key={s.metric_code}
            type="monotone"
            dataKey={s.metric_code}
            name={s.metric_code}
            stroke={getSeriesColor(s.metric_code)}
            strokeWidth={2.5}
            dot={{ r: 4, fill: '#0F172A', stroke: getSeriesColor(s.metric_code), strokeWidth: 2 }}
            activeDot={{ r: 6 }}
            connectNulls
          />
        ))}
      </LineChart>
    </ResponsiveContainer>
  )
}
