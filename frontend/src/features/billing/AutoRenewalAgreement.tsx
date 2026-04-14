import { useTranslation } from 'react-i18next'
import { Link } from 'react-router-dom'

const SECTIONS = [
  'auto_renewal_s1', 'auto_renewal_s2', 'auto_renewal_s3', 'auto_renewal_s4',
  'auto_renewal_s5', 'auto_renewal_s6', 'auto_renewal_s7', 'auto_renewal_s8',
  'auto_renewal_s9', 'auto_renewal_s10',
] as const

export default function AutoRenewalAgreement() {
  const { t } = useTranslation()

  return (
    <div className="max-w-3xl mx-auto px-6 py-12">
      <Link
        to="/membership"
        className="inline-flex items-center gap-1.5 text-sm text-slate-400 hover:text-slate-200 transition mb-8"
      >
        &larr; {t('agreement.back_to_membership')}
      </Link>

      <h1 className="text-2xl font-bold text-white mb-2">
        {t('agreement.auto_renewal_title')}
      </h1>
      <p className="text-sm text-slate-400 mb-8">
        {t('agreement.auto_renewal_effective_date')}
      </p>

      <div className="space-y-8">
        {SECTIONS.map((key) => (
          <section key={key}>
            <h2 className="text-lg font-semibold text-emerald-300 mb-3">
              {t(`agreement.${key}_title`)}
            </h2>
            <div className="text-sm text-slate-300 leading-relaxed whitespace-pre-line">
              {t(`agreement.${key}_body`)}
            </div>
          </section>
        ))}
      </div>
    </div>
  )
}
