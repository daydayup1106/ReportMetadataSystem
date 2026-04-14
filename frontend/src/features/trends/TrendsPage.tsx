import { useState, useEffect, useRef } from 'react'
import { useTranslation } from 'react-i18next'
import { DownloadIcon, ShareIcon } from '@/components/Icons'
import { useMemberStore } from '@/stores/memberStore'
import { useBillingStore } from '@/stores/billingStore'
import { PLAN_REQUIRED_EVENT } from '@/api/client'
import ProBadge from '@/components/ProBadge'
import { useTrendData } from './hooks/useTrendData'
import MetricGroupTabs from './components/MetricGroupTabs'
import ScenarioFilter from './components/ScenarioFilter'
import PeriodSelector from './components/PeriodSelector'
import TrendChart from './components/TrendChart'
import MetricStatCard from './components/MetricStatCard'
import MeasurementHistoryTable from './components/MeasurementHistoryTable'
import DownloadPDFDialog from './components/DownloadPDFDialog'
import { RELATIONSHIP_KEYS } from '@/constants/relationships'

export default function TrendsPage() {
  const { t } = useTranslation()
  const { members, hasMultipleMembers, fetchMembers } = useMemberStore()
  const isPro = useBillingStore((s) => s.isPro)
  const [activeMemberId, setActiveMemberId] = useState<string | null>(null)
  const [showDownload, setShowDownload] = useState(false)
  const chartRef = useRef<HTMLDivElement>(null)

  const handleUpgradeClick = () => {
    window.dispatchEvent(new CustomEvent(PLAN_REQUIRED_EVENT))
  }

  useEffect(() => {
    fetchMembers(true)
  }, [fetchMembers])

  const {
    groups,
    activeGroup,
    activeGroupItem,
    scenario,
    period,
    trendData,
    isLoadingGroups,
    isLoadingTrends,
    setActiveGroup,
    setScenario,
    setPeriod,
  } = useTrendData(activeMemberId)

  return (
    <div className="flex-1 p-8 overflow-y-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-white font-[family-name:var(--font-outfit)]">
          {t('trends.health_trends')}
        </h1>
        <div className="flex items-center gap-2">
          <div className="relative">
            <button
              onClick={() => isPro ? setShowDownload(true) : handleUpgradeClick()}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl bg-white/[0.05] border border-white/[0.08] text-slate-400 text-[12px] font-medium hover:bg-white/[0.08] transition ${!isPro ? 'opacity-60' : ''}`}
            >
              <DownloadIcon /> {t('trends.download')}
            </button>
            {!isPro && (
              <div className="absolute -top-2 -right-2">
                <ProBadge isPro={isPro} onUpgradeClick={handleUpgradeClick} className="!px-1 !py-0 !text-[8px]" />
              </div>
            )}
          </div>
          <button className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white/[0.05] border border-white/[0.08] text-slate-400 text-[12px] font-medium hover:bg-white/[0.08] transition">
            <ShareIcon /> {t('trends.share_doctor')}
          </button>
        </div>
      </div>

      {/* Member tabs */}
      {hasMultipleMembers && (
        <div className="flex gap-2 mb-4 flex-wrap">
          {members.map((m) => {
            const label = m.is_owner
              ? t('trends.my_trends')
              : t(`members.${RELATIONSHIP_KEYS[m.relationship] || 'other'}`)
            return (
              <button
                key={m.id}
                onClick={() => setActiveMemberId(m.id)}
                className={`px-4 py-2 rounded-full text-[12px] font-medium border transition ${
                  activeMemberId === m.id || (activeMemberId === null && m.is_owner)
                    ? 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30'
                    : 'bg-white/[0.03] text-slate-400 border-white/[0.08] hover:bg-white/[0.06]'
                }`}
              >
                {label}
              </button>
            )
          })}
        </div>
      )}

      {/* Metric Group Tabs */}
      {isLoadingGroups ? (
        <div className="flex gap-2 mb-4">
          <span className="text-slate-500 text-sm">{t('trends.loading_groups')}</span>
        </div>
      ) : groups.length > 0 ? (
        <MetricGroupTabs groups={groups} activeGroup={activeGroup} onSelect={setActiveGroup} />
      ) : (
        <div className="flex gap-2 mb-4">
          <span className="text-slate-500 text-sm">{t('trends.no_metrics')}</span>
        </div>
      )}

      {/* Scenario Filter (only for groups with scenarios) */}
      {activeGroupItem?.has_scenarios && trendData && (
        <ScenarioFilter
          availableScenarios={trendData.available_scenarios}
          activeScenario={scenario}
          onSelect={setScenario}
        />
      )}

      {/* Period Selector */}
      <PeriodSelector period={period} onSelect={setPeriod} isPro={isPro} onUpgradeClick={handleUpgradeClick} />

      {/* Stat Cards */}
      {trendData && <MetricStatCard series={trendData.series} />}

      {/* Chart */}
      <div ref={chartRef} className="bg-white/[0.03] border border-white/[0.06] rounded-2xl p-6 mb-4">
        {isLoadingTrends ? (
          <div className="flex items-center justify-center py-16">
            <div className="w-8 h-8 border-3 border-emerald-400 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : trendData ? (
          <TrendChart data={trendData} />
        ) : (
          <div className="flex flex-col items-center justify-center py-16">
            <p className="text-slate-400 text-sm">{t('trends.no_trend_data')}</p>
            <p className="text-slate-500 text-[12px] mt-1">{t('trends.no_trend_hint')}</p>
          </div>
        )}
      </div>

      {/* Measurement History Table */}
      {trendData && (
        <MeasurementHistoryTable
          series={trendData.series}
          isMerged={trendData.is_merged}
        />
      )}

      {/* Download PDF Dialog */}
      <DownloadPDFDialog
        open={showDownload}
        onClose={() => setShowDownload(false)}
        defaultMemberId={activeMemberId}
        defaultGroupKey={activeGroup}
        chartElement={chartRef.current}
      />
    </div>
  )
}
