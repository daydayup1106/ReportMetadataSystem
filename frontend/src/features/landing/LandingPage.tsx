import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import {
  TurtleIcon, DownIcon, StarIcon,
} from '@/components/Icons'

export default function LandingPage() {
  const { t } = useTranslation()

  return (
    <div className="min-h-screen relative">
      {/* Hero */}
      <section className="relative pt-32 pb-20 px-8">
        <div className="max-w-[1200px] mx-auto grid grid-cols-2 gap-16 items-center">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 mb-6">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span className="text-[12px] text-emerald-300 font-medium">{t('landing.tagline')}</span>
            </div>
            <h1 className="text-[52px] leading-[1.1] font-extrabold text-white mb-6 font-[family-name:var(--font-outfit)]">
              {t('landing.hero_title_1')}{' '}
              <span className="bg-gradient-to-r from-emerald-300 via-teal-200 to-amber-200 bg-clip-text text-transparent">
                {t('landing.hero_title_2')}
              </span>
            </h1>
            <p className="text-lg text-slate-400 leading-relaxed mb-8 max-w-lg">{t('landing.hero_desc')}</p>
            <div className="flex items-center gap-4">
              <Link to="/login" className="px-8 py-3.5 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-600 text-white font-semibold shadow-xl shadow-emerald-500/25 hover:shadow-emerald-500/40 transition-all active:scale-[0.97] text-sm">
                {t('landing.get_started')}
              </Link>
              <Link to="/dashboard" className="px-8 py-3.5 rounded-2xl border border-white/10 text-slate-300 font-medium hover:bg-white/[0.04] transition text-sm">
                {t('landing.view_demo')} →
              </Link>
            </div>
            <div className="flex items-center gap-6 mt-8">
              <div className="flex -space-x-2">
                {['W', 'S', 'J', 'M'].map((l, i) => (
                  <div key={i} className="w-8 h-8 rounded-full bg-gradient-to-br from-emerald-700 via-green-600 to-amber-600 flex items-center justify-center text-white text-[10px] font-bold border-2 border-slate-900">
                    {l}
                  </div>
                ))}
              </div>
              <div>
                <div className="flex gap-0.5">{[1,2,3,4,5].map(i => <StarIcon key={i} filled />)}</div>
                <p className="text-[11px] text-slate-500 mt-0.5">{t('landing.user_stats')}</p>
              </div>
            </div>
          </div>

          {/* Preview card */}
          <div className="relative">
            <div className="rounded-2xl bg-slate-800/60 border border-white/10 shadow-2xl overflow-hidden">
              <div className="h-8 bg-slate-800 flex items-center px-4 gap-2">
                <div className="flex gap-1.5">
                  <div className="w-3 h-3 rounded-full bg-red-400/80" />
                  <div className="w-3 h-3 rounded-full bg-yellow-400/80" />
                  <div className="w-3 h-3 rounded-full bg-green-400/80" />
                </div>
                <div className="flex-1 mx-4 bg-slate-700 rounded-md h-5 flex items-center px-3">
                  <span className="text-[10px] text-slate-400">app.littleturtle.health</span>
                </div>
              </div>
              <div className="bg-gradient-to-br from-emerald-50 via-white to-slate-50 p-6 h-[380px] overflow-hidden">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <p className="text-[10px] text-emerald-600 font-medium">{t('landing.demo_greeting')}</p>
                    <p className="text-sm font-bold text-slate-900">{t('landing.demo_user')}</p>
                  </div>
                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-emerald-700 via-green-600 to-amber-600 flex items-center justify-center">
                    <span className="text-white text-[10px] font-bold">W</span>
                  </div>
                </div>
                <div className="bg-gradient-to-br from-green-600 via-emerald-600 to-teal-700 rounded-xl p-4 mb-4 shadow-lg">
                  <p className="text-emerald-100 text-[10px] font-medium mb-2">{t('landing.demo_health_overview')}</p>
                  <div className="grid grid-cols-3 gap-2">
                    {[{l:t('landing.demo_total_chol'),v:'185',u:'mg/dL'},{l:t('landing.demo_fasting_glu'),v:'98',u:'mg/dL'},{l:t('landing.demo_blood_pres'),v:'120/78',u:'mmHg'}].map((m,i) => (
                      <div key={i} className="bg-white/10 rounded-lg p-2">
                        <p className="text-emerald-100 text-[8px]">{m.l}</p>
                        <p className="text-white text-sm font-bold">{m.v}</p>
                        <p className="text-emerald-200 text-[7px]">{m.u}</p>
                      </div>
                    ))}
                  </div>
                </div>
                <div className="bg-white rounded-xl p-3 border border-slate-100">
                  <p className="text-[10px] font-bold text-slate-700 mb-2">{t('landing.demo_cholesterol_trend')}</p>
                  <svg width="100%" viewBox="0 0 280 50">
                    <defs>
                      <linearGradient id="hg" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#10B981" stopOpacity="0.3" />
                        <stop offset="100%" stopColor="#10B981" stopOpacity="0" />
                      </linearGradient>
                    </defs>
                    <path d="M0,30 L40,15 L80,22 L120,20 L160,28 L200,34 L240,26 L280,28" stroke="#10B981" strokeWidth="2" fill="none" strokeLinecap="round" />
                    <path d="M0,30 L40,15 L80,22 L120,20 L160,28 L200,34 L240,26 L280,28 L280,50 L0,50Z" fill="url(#hg)" />
                  </svg>
                </div>
              </div>
            </div>
            <div className="absolute -top-4 -right-4 bg-white rounded-xl p-3 shadow-xl border flex items-center gap-2 animate-[float_4s_ease-in-out_infinite]">
              <div className="w-8 h-8 rounded-lg bg-emerald-50 flex items-center justify-center text-emerald-600"><DownIcon /></div>
              <div><p className="text-[10px] font-bold text-slate-800">{t('landing.demo_chol_stat')}</p><p className="text-[9px] text-slate-400">{t('landing.demo_trending')}</p></div>
            </div>
            <div className="absolute -bottom-2 -left-6 bg-white rounded-xl p-3 shadow-xl border animate-[float_5s_ease-in-out_infinite_1s]">
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded-full bg-gradient-to-br from-emerald-700 via-green-600 to-amber-600 flex items-center justify-center"><TurtleIcon size={14} /></div>
                <p className="text-[10px] text-slate-600">{t('landing.demo_voice_cmd')}</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-20 px-8">
        <div className="max-w-[1200px] mx-auto">
          <div className="text-center mb-14">
            <h2 className="text-3xl font-bold text-white mb-3 font-[family-name:var(--font-outfit)]">{t('landing.features_title')}</h2>
            <p className="text-slate-400 max-w-lg mx-auto">{t('landing.features_desc')}</p>
          </div>
          <div className="grid grid-cols-3 gap-6">
            {[
              {i:'📱',title:t('landing.feature_scan'),desc:t('landing.feature_scan_desc')},
              {i:'📊',title:t('landing.feature_trends'),desc:t('landing.feature_trends_desc')},
              {i:'🤖',title:t('landing.feature_ai'),desc:t('landing.feature_ai_desc')},
              {i:'👥',title:t('landing.feature_community'),desc:t('landing.feature_community_desc')},
              {i:'🔔',title:t('landing.feature_alerts'),desc:t('landing.feature_alerts_desc')},
              {i:'🔒',title:t('landing.feature_hipaa'),desc:t('landing.feature_hipaa_desc')},
            ].map((f, i) => (
              <div key={i} className="group p-6 rounded-2xl bg-white/[0.03] border border-white/[0.06] hover:bg-white/[0.06] hover:border-emerald-500/20 transition-all duration-300">
                <div className="text-3xl mb-4">{f.i}</div>
                <h3 className="text-base font-bold text-white mb-2">{f.title}</h3>
                <p className="text-sm text-slate-400 leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 px-8">
        <div className="max-w-[800px] mx-auto text-center">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-emerald-700 via-green-600 to-amber-600 flex items-center justify-center mx-auto mb-6 shadow-xl shadow-emerald-500/20">
            <TurtleIcon size={36} />
          </div>
          <h2 className="text-3xl font-bold text-white mb-4 font-[family-name:var(--font-outfit)]">{t('landing.cta_title')}</h2>
          <p className="text-slate-400 mb-8 max-w-md mx-auto">{t('landing.cta_desc')}</p>
          <div className="flex gap-4 justify-center">
            <Link to="/login" className="px-8 py-3.5 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-600 text-white font-semibold shadow-xl shadow-emerald-500/25 transition-all text-sm">
              {t('landing.create_account')}
            </Link>
            <Link to="/dashboard" className="px-8 py-3.5 rounded-2xl border border-white/10 text-slate-300 font-medium hover:bg-white/[0.04] transition text-sm">
              {t('landing.view_demo')}
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-white/[0.06] py-10 px-8">
        <div className="max-w-[1200px] mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-emerald-700 via-green-600 to-amber-600 flex items-center justify-center"><TurtleIcon size={16} /></div>
            <span className="text-sm font-semibold text-slate-400">{t('landing.company_name')}</span>
          </div>
          <div className="flex gap-6 text-[12px] text-slate-500">
            {[
              { key: 'privacy', label: t('landing.privacy') },
              { key: 'terms', label: t('landing.terms') },
              { key: 'hipaa', label: t('landing.hipaa_link') },
              { key: 'contact', label: t('landing.contact') },
            ].map(link => (
              <span key={link.key} className="hover:text-slate-300 cursor-pointer transition">{link.label}</span>
            ))}
          </div>
          <p className="text-[11px] text-slate-600">{t('landing.copyright')}</p>
        </div>
      </footer>
    </div>
  )
}
