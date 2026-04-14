import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'
import type { GroupedTrendResponse } from '@/types/api'
import { SCENARIO_LABELS } from '../constants'

interface PdfOptions {
  memberName: string
  metricLabel: string
  fromDate: string
  toDate: string
  locale: string
  chartElement?: HTMLElement | null
}

function formatDatetime(isoStr: string): string {
  const d = new Date(isoStr)
  const mm = String(d.getMonth() + 1).padStart(2, '0')
  const dd = String(d.getDate()).padStart(2, '0')
  const hh = String(d.getHours()).padStart(2, '0')
  const min = String(d.getMinutes()).padStart(2, '0')
  const ss = String(d.getSeconds()).padStart(2, '0')
  return `${d.getFullYear()}-${mm}-${dd} ${hh}:${min}:${ss}`
}

function getScenarioDisplay(scenario: string | null, locale: string): string {
  if (!scenario) return '—'
  const labels = SCENARIO_LABELS[scenario]
  if (!labels) return scenario
  return locale === 'zh' ? labels.cn : labels.en
}

export async function generateMetricPDF(
  data: GroupedTrendResponse,
  options: PdfOptions,
): Promise<void> {
  const { memberName, metricLabel, fromDate, toDate, locale } = options
  const isZh = locale === 'zh'
  const doc = new jsPDF()

  // Header
  doc.setFontSize(16)
  doc.text(metricLabel, 14, 20)
  doc.setFontSize(10)
  doc.setTextColor(100)
  doc.text(`${isZh ? '记录对象' : 'Member'}: ${memberName}`, 14, 28)
  doc.text(`${isZh ? '日期范围' : 'Date Range'}: ${fromDate} — ${toDate}`, 14, 34)

  let yPos = 44

  // Chart image capture
  if (options.chartElement) {
    try {
      const html2canvas = (await import('html2canvas')).default
      const canvas = await html2canvas(options.chartElement, {
        backgroundColor: '#0F172A',
        scale: 2,
      })
      const imgData = canvas.toDataURL('image/png')
      const imgWidth = 180
      const imgHeight = (canvas.height / canvas.width) * imgWidth
      doc.addImage(imgData, 'PNG', 14, yPos, imgWidth, imgHeight)
      yPos += imgHeight + 8
    } catch {
      // Skip chart image if html2canvas fails
    }
  }

  // Summary stats per series
  for (const s of data.series) {
    const name = isZh && s.metric_name_cn ? s.metric_name_cn : s.metric_name
    const current = s.current_value != null ? `${s.current_value} ${s.unit}` : '—'
    const peak = s.peak_value != null ? `${s.peak_value} ${s.unit}` : '—'
    const change = s.change_from_peak != null ? `${s.change_from_peak.toFixed(1)}%` : '—'

    doc.setFontSize(10)
    doc.setTextColor(0)
    doc.text(
      `${name}: ${isZh ? '当前' : 'Current'} ${current} | ${isZh ? '峰值' : 'Peak'} ${peak} | ${isZh ? '变化' : 'Change'} ${change}`,
      14,
      yPos,
    )
    yPos += 6
  }

  yPos += 4

  // Data table
  const isMerged = data.is_merged && data.series.length >= 2

  // Build rows
  type TableRow = [string, string, string, string]

  if (isMerged) {
    // Merge by measured_at
    const rowMap = new Map<string, Record<string, number | null>>()
    const scenarios = new Map<string, string | null>()
    for (const s of data.series) {
      for (const dp of s.data_points) {
        if (!rowMap.has(dp.measured_at)) {
          rowMap.set(dp.measured_at, {})
          scenarios.set(dp.measured_at, dp.scenario)
        }
        rowMap.get(dp.measured_at)![s.metric_code] = dp.value
      }
    }

    const tableRows: TableRow[] = Array.from(rowMap.entries())
      .sort(([a], [b]) => b.localeCompare(a))
      .map(([dt, vals]) => {
        const valueStr = data.series
          .map(s => {
            const v = vals[s.metric_code]
            return v != null ? String(v) : '—'
          })
          .join(' / ')
        return [
          formatDatetime(dt),
          getScenarioDisplay(scenarios.get(dt) || null, locale),
          valueStr,
          data.series[0]?.unit || '',
        ]
      })

    autoTable(doc, {
      startY: yPos,
      head: [[
        isZh ? '日期/时间' : 'Date/Time',
        isZh ? '场景' : 'Scenario',
        isZh ? '值' : 'Value',
        isZh ? '单位' : 'Unit',
      ]],
      body: tableRows,
      styles: { fontSize: 8 },
      headStyles: { fillColor: [15, 23, 42] },
    })
  } else {
    const s = data.series[0]
    if (s) {
      const tableRows: TableRow[] = [...s.data_points]
        .sort((a, b) => b.measured_at.localeCompare(a.measured_at))
        .map(dp => [
          formatDatetime(dp.measured_at),
          getScenarioDisplay(dp.scenario, locale),
          String(dp.value),
          s.unit,
        ])

      autoTable(doc, {
        startY: yPos,
        head: [[
          isZh ? '日期/时间' : 'Date/Time',
          isZh ? '场景' : 'Scenario',
          isZh ? '值' : 'Value',
          isZh ? '单位' : 'Unit',
        ]],
        body: tableRows,
        styles: { fontSize: 8 },
        headStyles: { fillColor: [15, 23, 42] },
      })
    }
  }

  doc.save(`${metricLabel.replace(/\s+/g, '-')}-report.pdf`)
}
