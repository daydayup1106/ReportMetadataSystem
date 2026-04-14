import { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { metricsApi } from '@/api/client'
import { useMemberStore } from '@/stores/memberStore'
import type { MetricGroupItem } from '@/types/api'
import { generateMetricPDF } from '../utils/pdfGenerator'
import { RELATIONSHIP_KEYS } from '@/constants/relationships'

interface Props {
  open: boolean
  onClose: () => void
  defaultMemberId?: string | null
  defaultGroupKey?: string
  chartElement?: HTMLElement | null
}

export default function DownloadPDFDialog({ open, onClose, defaultMemberId, defaultGroupKey, chartElement }: Props) {
  const { t, i18n } = useTranslation()
  const isZh = i18n.language === 'zh'
  const { members } = useMemberStore()

  const [memberId, setMemberId] = useState(defaultMemberId || '')
  const [groupKey, setGroupKey] = useState(defaultGroupKey || '')
  const [groups, setGroups] = useState<MetricGroupItem[]>([])
  const [fromDate, setFromDate] = useState('')
  const [toDate, setToDate] = useState('')
  const [isGenerating, setIsGenerating] = useState(false)

  // Set default date range (last 3 months)
  useEffect(() => {
    if (!open) return
    const now = new Date()
    const threeMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 3, now.getDate())
    setToDate(now.toISOString().split('T')[0])
    setFromDate(threeMonthsAgo.toISOString().split('T')[0])
    setMemberId(defaultMemberId || '')
    setGroupKey(defaultGroupKey || '')
  }, [open, defaultMemberId, defaultGroupKey])

  // Fetch groups when member changes
  useEffect(() => {
    if (!open) return
    metricsApi.groups(memberId || undefined)
      .then(({ data }) => {
        setGroups(data)
        if (defaultGroupKey && data.some(g => g.group_key === defaultGroupKey)) {
          setGroupKey(defaultGroupKey)
        } else if (data.length > 0) {
          setGroupKey(data[0].group_key)
        }
      })
      .catch(() => setGroups([]))
  }, [open, memberId, defaultGroupKey])

  async function handleDownload() {
    if (!groupKey || !fromDate || !toDate) return
    setIsGenerating(true)

    try {
      const { data } = await metricsApi.groupedTrends(
        groupKey, 'all', undefined, memberId || undefined, fromDate, toDate,
      )

      const member = members.find(m => m.id === memberId)
      const memberName = member
        ? (member.is_owner ? (isZh ? '本人' : 'Self') : t(`members.${RELATIONSHIP_KEYS[member.relationship] || 'other'}`))
        : (isZh ? '本人' : 'Self')

      const group = groups.find(g => g.group_key === groupKey)
      const metricLabel = group
        ? (isZh && group.label_cn ? group.label_cn : group.label)
        : groupKey

      await generateMetricPDF(data, {
        memberName,
        metricLabel,
        fromDate,
        toDate,
        locale: i18n.language,
        chartElement: groupKey === defaultGroupKey ? chartElement : null,
      })

      onClose()
    } catch {
      // Error handling — could show a toast
    } finally {
      setIsGenerating(false)
    }
  }

  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />

      {/* Dialog */}
      <div className="relative bg-slate-800 rounded-2xl shadow-2xl w-full max-w-md mx-4 p-6">
        <h2 className="text-lg font-bold text-white mb-4">{t('trends.download_report')}</h2>

        {/* Member */}
        <label className="block mb-3">
          <span className="text-[12px] text-slate-400 mb-1 block">{t('trends.member')}</span>
          <select
            value={memberId}
            onChange={e => setMemberId(e.target.value)}
            className="w-full bg-white/[0.05] border border-white/[0.08] rounded-xl px-3 py-2 text-sm text-white outline-none focus:border-emerald-500/40"
          >
            {members.map(m => (
              <option key={m.id} value={m.id}>
                {m.is_owner
                  ? (isZh ? '本人' : 'Self')
                  : t(`members.${RELATIONSHIP_KEYS[m.relationship] || 'other'}`)}
              </option>
            ))}
          </select>
        </label>

        {/* Metric */}
        <label className="block mb-3">
          <span className="text-[12px] text-slate-400 mb-1 block">{t('trends.metric')}</span>
          <select
            value={groupKey}
            onChange={e => setGroupKey(e.target.value)}
            className="w-full bg-white/[0.05] border border-white/[0.08] rounded-xl px-3 py-2 text-sm text-white outline-none focus:border-emerald-500/40"
          >
            {groups.map(g => (
              <option key={g.group_key} value={g.group_key}>
                {isZh && g.label_cn ? g.label_cn : g.label}
              </option>
            ))}
          </select>
        </label>

        {/* Date range */}
        <div className="flex gap-3 mb-4">
          <label className="flex-1">
            <span className="text-[12px] text-slate-400 mb-1 block">{t('trends.from_date')}</span>
            <input
              type="date"
              value={fromDate}
              onChange={e => setFromDate(e.target.value)}
              className="w-full bg-white/[0.05] border border-white/[0.08] rounded-xl px-3 py-2 text-sm text-white outline-none focus:border-emerald-500/40"
            />
          </label>
          <label className="flex-1">
            <span className="text-[12px] text-slate-400 mb-1 block">{t('trends.to_date')}</span>
            <input
              type="date"
              value={toDate}
              onChange={e => setToDate(e.target.value)}
              className="w-full bg-white/[0.05] border border-white/[0.08] rounded-xl px-3 py-2 text-sm text-white outline-none focus:border-emerald-500/40"
            />
          </label>
        </div>

        {/* Actions */}
        <div className="flex gap-3 justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-sm text-slate-400 hover:bg-white/[0.05] transition"
          >
            {t('common.cancel')}
          </button>
          <button
            onClick={handleDownload}
            disabled={isGenerating || !groupKey}
            className="px-4 py-2 rounded-xl text-sm font-medium bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 hover:bg-emerald-500/25 transition disabled:opacity-50"
          >
            {isGenerating ? t('trends.generating') : t('trends.download')}
          </button>
        </div>
      </div>
    </div>
  )
}
