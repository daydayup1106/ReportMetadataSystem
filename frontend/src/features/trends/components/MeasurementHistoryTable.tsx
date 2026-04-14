import { useState, useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import type { MetricSeries, GroupedTrendDataPoint } from '@/types/api'
import { getScenarioLabel, getScenarioBadge } from '../constants'

interface Props {
  series: MetricSeries[]
  isMerged: boolean
}

interface MergedRow {
  measured_at: string
  scenario: string | null
  values: Record<string, number | null>  // metric_code → value
  unit: string
}

const PAGE_SIZES = [10, 12, 20, 50]

function formatDatetime(isoStr: string): string {
  const d = new Date(isoStr)
  const mm = String(d.getMonth() + 1).padStart(2, '0')
  const dd = String(d.getDate()).padStart(2, '0')
  const hh = String(d.getHours()).padStart(2, '0')
  const min = String(d.getMinutes()).padStart(2, '0')
  const ss = String(d.getSeconds()).padStart(2, '0')
  return `${mm}-${dd} ${hh}:${min}:${ss}`
}

export default function MeasurementHistoryTable({ series, isMerged }: Props) {
  const { t, i18n } = useTranslation()
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(12)

  const rows = useMemo<MergedRow[]>(() => {
    if (series.length === 0) return []

    if (isMerged) {
      // Join series by measured_at
      const rowMap = new Map<string, MergedRow>()
      for (const s of series) {
        for (const dp of s.data_points) {
          const key = dp.measured_at
          if (!rowMap.has(key)) {
            rowMap.set(key, {
              measured_at: dp.measured_at,
              scenario: dp.scenario,
              values: {},
              unit: s.unit,
            })
          }
          rowMap.get(key)!.values[s.metric_code] = dp.value
        }
      }
      return Array.from(rowMap.values()).sort((a, b) => b.measured_at.localeCompare(a.measured_at))
    } else {
      const s = series[0]
      if (!s) return []
      return s.data_points
        .map(dp => ({
          measured_at: dp.measured_at,
          scenario: dp.scenario,
          values: { [s.metric_code]: dp.value },
          unit: s.unit,
        }))
        .sort((a, b) => b.measured_at.localeCompare(a.measured_at))
    }
  }, [series, isMerged])

  const totalPages = Math.ceil(rows.length / pageSize)
  const pagedRows = rows.slice((page - 1) * pageSize, page * pageSize)

  // Format value cell
  function formatValue(row: MergedRow): string {
    if (isMerged && series.length >= 2) {
      return series
        .map(s => {
          const v = row.values[s.metric_code]
          return v != null ? String(v) : '—'
        })
        .join(' / ')
    }
    const code = series[0]?.metric_code
    if (!code) return '—'
    const v = row.values[code]
    return v != null ? String(v) : '—'
  }

  if (rows.length === 0) {
    return (
      <div className="bg-white/[0.03] border border-white/[0.06] rounded-2xl p-6 mt-4">
        <p className="text-slate-400 text-sm text-center">{t('trends.no_data')}</p>
      </div>
    )
  }

  return (
    <div className="bg-white/[0.03] border border-white/[0.06] rounded-2xl p-4 mt-4">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-semibold text-white">{t('trends.measurement_history')}</h3>
        <div className="flex items-center gap-2">
          <span className="text-[11px] text-slate-500">{t('trends.show')}</span>
          <select
            value={pageSize}
            onChange={e => { setPageSize(Number(e.target.value)); setPage(1) }}
            className="bg-white/[0.05] border border-white/[0.08] rounded-lg px-2 py-1 text-[11px] text-slate-300 outline-none"
          >
            {PAGE_SIZES.map(s => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>
        </div>
      </div>

      <table className="w-full text-left">
        <thead>
          <tr className="border-b border-white/[0.06]">
            <th className="py-2 px-3 text-[11px] text-slate-500 font-medium">{t('trends.date_time')}</th>
            <th className="py-2 px-3 text-[11px] text-slate-500 font-medium">{t('trends.scenario')}</th>
            <th className="py-2 px-3 text-[11px] text-slate-500 font-medium">{t('trends.value')}</th>
            <th className="py-2 px-3 text-[11px] text-slate-500 font-medium">{t('trends.unit')}</th>
          </tr>
        </thead>
        <tbody>
          {pagedRows.map((row, i) => {
            const badge = row.scenario ? getScenarioBadge(row.scenario) : null
            return (
              <tr key={i} className="border-b border-white/[0.04] hover:bg-white/[0.04] transition">
                <td className="py-2 px-3 text-[12px] text-slate-300">{formatDatetime(row.measured_at)}</td>
                <td className="py-2 px-3">
                  {row.scenario && badge ? (
                    <span className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-medium ${badge.bg} ${badge.text}`}>
                      {getScenarioLabel(row.scenario, i18n.language)}
                    </span>
                  ) : (
                    <span className="text-[10px] text-slate-600">—</span>
                  )}
                </td>
                <td className="py-2 px-3 text-[12px] text-white font-medium">{formatValue(row)}</td>
                <td className="py-2 px-3 text-[12px] text-slate-500">{row.unit}</td>
              </tr>
            )
          })}
        </tbody>
      </table>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-1 mt-3">
          <button
            onClick={() => setPage(p => Math.max(1, p - 1))}
            disabled={page === 1}
            className="px-2 py-1 text-[11px] text-slate-400 disabled:opacity-30"
          >
            ‹
          </button>
          {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
            const p = page <= 3 ? i + 1 : page + i - 2
            if (p < 1 || p > totalPages) return null
            return (
              <button
                key={p}
                onClick={() => setPage(p)}
                className={`w-7 h-7 rounded-lg text-[11px] font-medium transition ${
                  page === p
                    ? 'bg-emerald-500/15 text-emerald-300'
                    : 'text-slate-400 hover:bg-white/[0.05]'
                }`}
              >
                {p}
              </button>
            )
          })}
          <button
            onClick={() => setPage(p => Math.min(totalPages, p + 1))}
            disabled={page === totalPages}
            className="px-2 py-1 text-[11px] text-slate-400 disabled:opacity-30"
          >
            ›
          </button>
        </div>
      )}
    </div>
  )
}
