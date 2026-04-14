import { useTranslation } from 'react-i18next'
import { Link } from 'react-router-dom'

const SECTIONS = [
  'section1', 'section2', 'section3', 'section4', 'section5',
  'section6', 'section7', 'section8', 'section9', 'section10',
  'section11',
] as const

export default function PaymentPrivacyPolicy() {
  const { t } = useTranslation()

  return (
    <div className="max-w-3xl mx-auto px-6 py-12">
      <Link
        to="/settings"
        className="inline-flex items-center gap-1.5 text-sm text-slate-400 hover:text-slate-200 transition mb-8"
      >
        &larr; {t('nav.settings')}
      </Link>

      <h1 className="text-2xl font-bold text-white mb-2">
        {t('privacy.title')}
      </h1>
      <p className="text-sm text-slate-400 mb-8">
        {t('privacy.effective_date')}
      </p>

      <p className="text-sm text-slate-300 leading-relaxed mb-8">
        {t('privacy.intro')}
      </p>

      <div className="space-y-8">
        {SECTIONS.map((key) => (
          <section key={key}>
            <h2 className="text-lg font-semibold text-emerald-300 mb-3">
              {t(`privacy.${key}_title`)}
            </h2>
            <div className="text-sm text-slate-300 leading-relaxed whitespace-pre-line">
              {t(`privacy.${key}_body`)}
            </div>
          </section>
        ))}
      </div>
    </div>
  )
}
