import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { reportsApi } from '@/api/client'
import ReportThumbnail from '@/components/ReportThumbnail'
import ImagePreviewModal from '@/components/ImagePreviewModal'

interface MetricItem {
  name: string
  value: number | null
  unit: string
  status: string
  reference_low: number | null
  reference_high: number | null
}

interface ReportItem {
  report_id: string
  report_name: string
  category: string
  report_date: string | null
  status: string
  metric_count: number
  file_type: 'image' | 'pdf' | null
  created_at?: string | null
  metrics?: MetricItem[]
}

interface ReportListCardProps {
  reports: ReportItem[]
}

const STATUS_COLORS: Record<string, string> = {
  normal: 'bg-emerald-500/10 text-emerald-400',
  review: 'bg-amber-500/10 text-amber-400',
  critical: 'bg-red-500/10 text-red-400',
}

const METRIC_STATUS_COLORS: Record<string, { bg: string; text: string; statusKey: string }> = {
  normal: { bg: 'bg-emerald-500/10', text: 'text-emerald-400', statusKey: 'normal' },
  high: { bg: 'bg-amber-500/10', text: 'text-amber-400', statusKey: 'high' },
  low: { bg: 'bg-blue-500/10', text: 'text-blue-400', statusKey: 'low' },
  critical: { bg: 'bg-red-500/10', text: 'text-red-400', statusKey: 'critical' },
}

const CATEGORY_KEYS: Record<string, string> = {
  blood_test: 'category_blood_test',
  imaging: 'category_imaging',
  cardiac: 'category_cardiac',
  metabolic: 'category_metabolic',
  other: 'category_other',
}

export default function ReportListCard({ reports }: ReportListCardProps) {
  const { t, i18n } = useTranslation()
  const [selectedReport, setSelectedReport] = useState<ReportItem | null>(null)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [previewLoading, setPreviewLoading] = useState(false)
  // Auto-expand first self-reported report (has metrics but no file)
  const firstSelfReported = reports.find(r => !r.file_type && r.metrics && r.metrics.length > 0)
  const [expandedId, setExpandedId] = useState<string | null>(firstSelfReported?.report_id ?? null)

  const handleReportClick = async (report: ReportItem) => {
    // For reports with metrics but no file (self-reported), toggle expand
    if (!report.file_type && report.metrics && report.metrics.length > 0) {
      setExpandedId(prev => prev === report.report_id ? null : report.report_id)
      return
    }

    if (!report.file_type) return

    if (report.file_type === 'pdf') {
      try {
        const { data: blob } = await reportsApi.preview(report.report_id)
        const url = URL.createObjectURL(blob)
        window.open(url)
        setTimeout(() => URL.revokeObjectURL(url), 10000)
      } catch {
        console.error('Failed to load PDF')
      }
      return
    }

    // Image: show lightbox modal
    setSelectedReport(report)
    setPreviewLoading(true)
    try {
      const { data: blob } = await reportsApi.preview(report.report_id)
      setPreviewUrl(URL.createObjectURL(blob))
    } catch {
      setSelectedReport(null)
    } finally {
      setPreviewLoading(false)
    }
  }

  const closeModal = () => {
    if (previewUrl) URL.revokeObjectURL(previewUrl)
    setPreviewUrl(null)
    setSelectedReport(null)
  }

  const categoryLabel = (c: string) => {
    const key = CATEGORY_KEYS[c]
    if (!key) return c
    return t(`reports.${key}`)
  }

  const formatCreatedAt = (dateStr: string | null | undefined) => {
    if (!dateStr) return ''
    try {
      const d = new Date(dateStr)
      return d.toLocaleString(i18n.language === 'zh' ? 'zh-CN' : 'en-US', {
        month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit',
      })
    } catch { return '' }
  }

  const hasMetrics = (r: ReportItem) => r.metrics && r.metrics.length > 0

  return (
    <>
      <div className="mb-3 space-y-2">
        {reports.map((r) => {
          const isExpanded = expandedId === r.report_id
          const showMetricsInline = hasMetrics(r)

          return (
            <div key={r.report_id} className="rounded-xl overflow-hidden">
              {/* Report header row */}
              <div
                onClick={() => handleReportClick(r)}
                className={`flex items-center gap-3 p-3 rounded-xl transition
                  ${showMetricsInline && isExpanded ? 'rounded-b-none bg-white/[0.06]' : 'hover:bg-white/[0.04]'}
                  ${r.file_type || showMetricsInline ? 'cursor-pointer' : ''}`}
              >
                {r.file_type ? (
                  <ReportThumbnail
                    reportId={r.report_id}
                    fileType={r.file_type}
                    reportName={r.report_name}
                    onClick={() => handleReportClick(r)}
                  />
                ) : (
                  <div className="w-10 h-10 rounded-lg bg-emerald-500/10 flex items-center justify-center shrink-0">
                    <svg className="w-5 h-5 text-emerald-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                      <path d="M9 12h6m-3-3v6m-4 4h8a2 2 0 002-2V7l-5-5H5a2 2 0 00-2 2v14a2 2 0 002 2z" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-white truncate">{r.report_name}</p>
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    {categoryLabel(r.category)}
                    {r.report_date ? ` · ${r.report_date}` : ''}
                    {r.metric_count > 0 ? ` · ${r.metric_count} ${t('reports.metrics')}` : ''}
                  </p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full whitespace-nowrap ${STATUS_COLORS[r.status] || STATUS_COLORS.normal}`}>
                    {t(`common.${r.status}`)}
                  </span>
                  {showMetricsInline && (
                    <svg
                      className={`w-4 h-4 text-slate-500 transition-transform duration-200 ${isExpanded ? 'rotate-180' : ''}`}
                      viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
                    >
                      <path d="M6 9l6 6 6-6" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  )}
                </div>
              </div>

              {/* Expandable metric details */}
              {showMetricsInline && isExpanded && r.metrics && (
                <div className="bg-white/[0.03] border-t border-white/[0.06] px-4 py-3 rounded-b-xl">
                  {r.created_at && (
                    <p className="text-[10px] text-slate-600 mb-2.5">
                      {t('reports.recorded_at', { time: formatCreatedAt(r.created_at) })}
                    </p>
                  )}
                  <div className="space-y-2">
                    {r.metrics.map((m, idx) => {
                      const statusInfo = METRIC_STATUS_COLORS[m.status] || METRIC_STATUS_COLORS.normal
                      const hasRef = m.reference_low != null && m.reference_high != null
                      // Calculate position within reference range for the bar
                      let barPercent = 50
                      if (hasRef && m.value != null) {
                        const range = m.reference_high! - m.reference_low!
                        if (range > 0) {
                          barPercent = Math.min(100, Math.max(0, ((m.value - m.reference_low!) / range) * 100))
                        }
                      }
                      const isInRange = m.status === 'normal'

                      return (
                        <div key={idx} className="flex items-center gap-3">
                          {/* Metric name */}
                          <span className="text-xs text-slate-400 w-20 shrink-0 truncate" title={m.name}>
                            {m.name}
                          </span>

                          {/* Value + unit */}
                          <span className={`text-sm font-bold tabular-nums ${statusInfo.text}`}>
                            {m.value != null ? m.value : '—'}
                          </span>
                          <span className="text-[10px] text-slate-600">{m.unit}</span>

                          {/* Reference range bar */}
                          {hasRef && (
                            <div className="flex-1 flex items-center gap-2 min-w-0">
                              <div className="flex-1 h-1.5 bg-white/[0.06] rounded-full relative overflow-hidden">
                                <div
                                  className={`absolute top-0 h-full rounded-full transition-all ${isInRange ? 'bg-emerald-500/60' : m.status === 'high' ? 'bg-amber-500/60' : 'bg-blue-500/60'}`}
                                  style={{ left: 0, width: `${barPercent}%` }}
                                />
                              </div>
                              <span className="text-[9px] text-slate-600 whitespace-nowrap tabular-nums">
                                {m.reference_low}–{m.reference_high}
                              </span>
                            </div>
                          )}

                          {/* Status badge */}
                          <span className={`text-[9px] font-semibold px-1.5 py-0.5 rounded ${statusInfo.bg} ${statusInfo.text} whitespace-nowrap`}>
                            {t(`common.${statusInfo.statusKey}`)}
                          </span>
                        </div>
                      )
                    })}
                  </div>
                </div>
              )}
            </div>
          )
        })}
      </div>

      {/* Loading overlay */}
      {previewLoading && (
        <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center">
          <div className="w-8 h-8 border-3 border-emerald-400 border-t-transparent rounded-full animate-spin" />
        </div>
      )}

      {/* Full-size image preview modal */}
      {selectedReport && previewUrl && !previewLoading && (
        <ImagePreviewModal
          previewUrl={previewUrl}
          reportName={selectedReport.report_name}
          reportId={selectedReport.report_id}
          onClose={closeModal}
        />
      )}
    </>
  )
}
