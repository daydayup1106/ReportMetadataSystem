import { useTranslation } from 'react-i18next'
import { Link } from 'react-router-dom'

const SECTIONS = [
  'service_s1', 'service_s2', 'service_s3', 'service_s4', 'service_s5',
  'service_s6', 'service_s7', 'service_s8', 'service_s9', 'service_s10',
  'service_s11', 'service_s12',
] as const

export default function ServiceAgreement() {
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
        {t('agreement.service_title')}
      </h1>
      <p className="text-sm text-slate-400 mb-8">
        {t('agreement.service_effective_date')}
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
