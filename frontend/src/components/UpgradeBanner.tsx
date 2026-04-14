import { useTranslation } from 'react-i18next'
import { useBillingStore } from '@/stores/billingStore'

interface UpgradeBannerProps {
  onUpgradeClick?: () => void
}

export default function UpgradeBanner({ onUpgradeClick }: UpgradeBannerProps) {
  const { t } = useTranslation()
  const isPro = useBillingStore((s) => s.isPro)

  if (isPro) return null

  return (
    <div className="mx-4 mb-4 p-3 rounded-xl bg-gradient-to-r from-amber-500/10 to-emerald-500/10 border border-amber-500/20">
      <p className="text-[12px] font-semibold text-amber-300 mb-1">
        {t('billing.upgrade_banner_title')}
      </p>
      <p className="text-[11px] text-slate-400 mb-2">
        {t('billing.upgrade_banner_desc')}
      </p>
      <button
        onClick={onUpgradeClick}
        className="w-full px-3 py-1.5 rounded-lg bg-gradient-to-r from-amber-500 to-emerald-500 text-white text-[11px] font-semibold hover:opacity-90 transition"
      >
        {t('billing.upgrade_now')}
      </button>
    </div>
  )
}
