import { useTranslation } from 'react-i18next'
import { getScenarioLabel, getScenarioBadge } from '../constants'

interface Props {
  availableScenarios: string[]
  activeScenario: string | null
  onSelect: (scenario: string | null) => void
}

export default function ScenarioFilter({ availableScenarios, activeScenario, onSelect }: Props) {
  const { t, i18n } = useTranslation()

  if (availableScenarios.length === 0) return null

  return (
    <div
      className="flex gap-2 mb-4 overflow-x-auto whitespace-nowrap pb-1"
      style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
    >
      <style>{`.scenario-scroll::-webkit-scrollbar { display: none; }`}</style>
      {/* All Day button */}
      <button
        onClick={() => onSelect(null)}
        className={`flex-shrink-0 px-3 py-1.5 rounded-lg text-[11px] font-medium border transition ${
          activeScenario === null
            ? 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30'
            : 'bg-white/[0.03] text-slate-400 border-white/[0.08] hover:bg-white/[0.06]'
        }`}
      >
        {t('trends.all_day')}
      </button>

      {availableScenarios.map(s => {
        const badge = getScenarioBadge(s)
        const isActive = activeScenario === s
        return (
          <button
            key={s}
            onClick={() => onSelect(s)}
            className={`flex-shrink-0 px-3 py-1.5 rounded-lg text-[11px] font-medium border transition ${
              isActive
                ? `${badge.bg} ${badge.text} border-current/30`
                : 'bg-white/[0.03] text-slate-400 border-white/[0.08] hover:bg-white/[0.06]'
            }`}
          >
            {getScenarioLabel(s, i18n.language)}
          </button>
        )
      })}
    </div>
  )
}
