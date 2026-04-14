import { useTranslation } from 'react-i18next'

const PERIOD_KEYS = [
  { key: 'period_6m', value: '6m' },
  { key: 'period_1y', value: '1y' },
  { key: 'period_all', value: 'all', proOnly: true },
]

interface Props {
  period: string
  onSelect: (period: string) => void
  isPro?: boolean
  onUpgradeClick?: () => void
}

export default function PeriodSelector({ period, onSelect, isPro = true, onUpgradeClick }: Props) {
  const { t } = useTranslation()

  return (
    <div className="flex gap-2 mb-6">
      {PERIOD_KEYS.map(p => {
        const locked = p.proOnly && !isPro
        return (
          <button
            key={p.value}
            onClick={() => locked ? onUpgradeClick?.() : onSelect(p.value)}
            className={`px-3 py-1.5 rounded-lg text-[11px] font-medium border transition flex items-center gap-1 ${
              period === p.value
                ? 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30'
                : 'bg-white/[0.03] text-slate-400 border-white/[0.08] hover:bg-white/[0.06]'
            } ${locked ? 'opacity-60' : ''}`}
          >
            {t(`trends.${p.key}`)}
            {locked && (
              <svg width="10" height="10" viewBox="0 0 16 16" fill="none" className="text-amber-400">
                <rect x="3" y="7" width="10" height="7" rx="1.5" stroke="currentColor" strokeWidth="1.5" />
                <path d="M5 7V5a3 3 0 016 0v2" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
              </svg>
            )}
          </button>
        )
      })}
    </div>
  )
}
