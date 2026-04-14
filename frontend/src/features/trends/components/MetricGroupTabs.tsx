import { useTranslation } from 'react-i18next'
import type { MetricGroupItem } from '@/types/api'

interface Props {
  groups: MetricGroupItem[]
  activeGroup: string
  onSelect: (key: string) => void
}

export default function MetricGroupTabs({ groups, activeGroup, onSelect }: Props) {
  const { i18n } = useTranslation()
  const isZh = i18n.language === 'zh'

  return (
    <div className="flex gap-2 mb-4 flex-wrap">
      {groups.map(g => (
        <button
          key={g.group_key}
          onClick={() => onSelect(g.group_key)}
          className={`px-4 py-2 rounded-full text-[12px] font-medium border transition ${
            activeGroup === g.group_key
              ? 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30'
              : 'bg-white/[0.03] text-slate-400 border-white/[0.08] hover:bg-white/[0.06]'
          }`}
        >
          {isZh && g.label_cn ? g.label_cn : g.label}
        </button>
      ))}
    </div>
  )
}
