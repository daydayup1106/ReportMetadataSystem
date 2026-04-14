import { useTranslation } from 'react-i18next'

interface ProBadgeProps {
  isPro: boolean
  onUpgradeClick?: () => void
  className?: string
}

export default function ProBadge({ isPro, onUpgradeClick, className = '' }: ProBadgeProps) {
  const { t } = useTranslation()

  if (isPro) return null

  return (
    <button
      data-testid="lock-icon"
      onClick={onUpgradeClick}
      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-500/15 text-amber-400 text-[11px] font-medium hover:bg-amber-500/25 transition cursor-pointer ${className}`}
      title={t('billing.upgrade_to_pro')}
    >
      <svg width="12" height="12" viewBox="0 0 16 16" fill="none">
        <rect x="3" y="7" width="10" height="7" rx="1.5" stroke="currentColor" strokeWidth="1.5" />
        <path d="M5 7V5a3 3 0 016 0v2" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      </svg>
      Pro
    </button>
  )
}
