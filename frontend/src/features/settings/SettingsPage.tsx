import { useState, useEffect, useMemo } from 'react'
import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useAuthStore } from '@/stores/authStore'
import { useBillingStore } from '@/stores/billingStore'
import { usersApi } from '@/api/client'
import { SettingsIcon, GlobeIcon, UserIcon, ShieldIcon, CrownIcon } from '@/components/Icons'

const CONDITION_KEYS = [
  { value: 'Diabetes', key: 'diabetes' },
  { value: 'Hypertension', key: 'hypertension' },
  { value: 'High Cholesterol', key: 'high_cholesterol' },
  { value: 'Heart Disease', key: 'heart_disease' },
  { value: 'Asthma', key: 'asthma' },
  { value: 'Thyroid', key: 'thyroid' },
  { value: 'Anemia', key: 'anemia' },
  { value: 'Kidney Disease', key: 'kidney_disease' },
]

export default function SettingsPage() {
  const { t, i18n } = useTranslation()
  const { user, setUser } = useAuthStore()
  const { subscription, isPro } = useBillingStore()

  const [name, setName] = useState(user?.display_name ?? '')
  const [locale, setLocale] = useState(user?.locale ?? 'en')
  const [conditions, setConditions] = useState<string[]>(user?.conditions ?? [])
  const [conditionInput, setConditionInput] = useState('')
  const [saving, setSaving] = useState(false)
  const [saveMessage, setSaveMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  // Sync form when user data loads/changes
  useEffect(() => {
    if (user) {
      setName(user.display_name)
      setLocale(user.locale)
      setConditions(user.conditions ?? [])
    }
  }, [user])

  const addCondition = (condition: string) => {
    const trimmed = condition.trim()
    if (trimmed && !conditions.includes(trimmed)) {
      setConditions([...conditions, trimmed])
    }
    setConditionInput('')
  }

  const removeCondition = (condition: string) => {
    setConditions(conditions.filter((c) => c !== condition))
  }

  const handleConditionKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      addCondition(conditionInput)
    }
  }

  const handleSave = async () => {
    setSaving(true)
    setSaveMessage(null)
    try {
      const { data } = await usersApi.updateMe({
        display_name: name,
        locale,
        conditions,
      })
      setUser(data)
      // Switch UI language immediately and persist
      if (locale !== i18n.language) {
        await i18n.changeLanguage(locale)
        localStorage.setItem('locale', locale)
      }
      setSaveMessage({ type: 'success', text: t('settings.saved') })
      setTimeout(() => setSaveMessage(null), 3000)
    } catch {
      setSaveMessage({ type: 'error', text: t('settings.save_failed') })
    } finally {
      setSaving(false)
    }
  }

  // Build a map from English condition value to i18n key for display
  const conditionDisplayMap = useMemo(() => {
    const map: Record<string, string> = {}
    for (const c of CONDITION_KEYS) {
      map[c.value] = `settings.condition_${c.key}`
    }
    return map
  }, [])

  const displayCondition = (c: string) => {
    const key = conditionDisplayMap[c]
    return key ? t(key) : c
  }

  if (!user) {
    return (
      <div className="flex-1 p-8 flex items-center justify-center">
        <p className="text-slate-400">{t('common.loading')}</p>
      </div>
    )
  }

  return (
    <div className="flex-1 p-8 overflow-y-auto">
      {/* Header */}
      <div className="flex items-center gap-3 mb-8">
        <div className="w-10 h-10 rounded-xl bg-emerald-500/15 flex items-center justify-center text-emerald-400">
          <SettingsIcon />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-white">{t('settings.title')}</h1>
        </div>
      </div>

      <div className="max-w-2xl space-y-6">
        {/* Profile Section */}
        <section className="rounded-2xl bg-white/[0.03] border border-white/[0.06] p-6">
          <div className="flex items-center gap-2 mb-5">
            <span className="text-slate-400"><UserIcon /></span>
            <h2 className="text-base font-semibold text-white">{t('settings.profile')}</h2>
          </div>

          {/* Avatar + Name */}
          <div className="flex items-start gap-5 mb-5">
            <div className="w-16 h-16 rounded-full bg-gradient-to-br from-emerald-700 via-green-600 to-amber-600 flex items-center justify-center shrink-0">
              <span className="text-white text-xl font-bold">
                {name?.charAt(0).toUpperCase() ?? 'U'}
              </span>
            </div>
            <div className="flex-1 space-y-4">
              <div>
                <label className="block text-[13px] font-medium text-slate-400 mb-1.5">
                  {t('settings.name')}
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl bg-white/[0.04] border border-white/[0.08] text-white text-sm placeholder-slate-500 focus:outline-none focus:border-emerald-500/50 focus:ring-1 focus:ring-emerald-500/30 transition"
                  maxLength={100}
                />
              </div>
              <div>
                <label className="block text-[13px] font-medium text-slate-400 mb-1.5">
                  {t('settings.email')}
                </label>
                <div className="flex items-center gap-2">
                  <span className="text-sm text-slate-300">{user.email ?? '—'}</span>
                  {user.email_verified ? (
                    <span className="text-[11px] px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-400 font-medium">
                      {t('settings.email_verified')}
                    </span>
                  ) : (
                    <span className="text-[11px] px-2 py-0.5 rounded-full bg-amber-500/15 text-amber-400 font-medium">
                      {t('settings.email_not_verified')}
                    </span>
                  )}
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Language Section */}
        <section className="rounded-2xl bg-white/[0.03] border border-white/[0.06] p-6">
          <div className="flex items-center gap-2 mb-5">
            <span className="text-slate-400"><GlobeIcon /></span>
            <h2 className="text-base font-semibold text-white">{t('settings.language')}</h2>
          </div>

          <div className="flex gap-3">
            <button
              onClick={() => setLocale('en')}
              className={`flex-1 px-4 py-3 rounded-xl text-sm font-medium border transition ${
                locale === 'en'
                  ? 'bg-emerald-500/15 border-emerald-500/30 text-emerald-300'
                  : 'bg-white/[0.02] border-white/[0.06] text-slate-400 hover:bg-white/[0.04]'
              }`}
            >
              {t('settings.language_en')}
            </button>
            <button
              onClick={() => setLocale('zh')}
              className={`flex-1 px-4 py-3 rounded-xl text-sm font-medium border transition ${
                locale === 'zh'
                  ? 'bg-emerald-500/15 border-emerald-500/30 text-emerald-300'
                  : 'bg-white/[0.02] border-white/[0.06] text-slate-400 hover:bg-white/[0.04]'
              }`}
            >
              {t('settings.language_zh')}
            </button>
          </div>
        </section>

        {/* Health Conditions Section */}
        <section className="rounded-2xl bg-white/[0.03] border border-white/[0.06] p-6">
          <div className="flex items-center gap-2 mb-5">
            <span className="text-slate-400"><ShieldIcon /></span>
            <h2 className="text-base font-semibold text-white">{t('settings.conditions')}</h2>
          </div>

          {/* Current conditions */}
          {conditions.length > 0 && (
            <div className="flex flex-wrap gap-2 mb-4">
              {conditions.map((c) => (
                <span
                  key={c}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-500/10 text-emerald-300 text-[13px] font-medium"
                >
                  {displayCondition(c)}
                  <button
                    onClick={() => removeCondition(c)}
                    className="text-emerald-400/60 hover:text-red-400 transition ml-0.5"
                  >
                    &times;
                  </button>
                </span>
              ))}
            </div>
          )}

          {/* Add condition input */}
          <div className="flex gap-2 mb-4">
            <input
              type="text"
              value={conditionInput}
              onChange={(e) => setConditionInput(e.target.value)}
              onKeyDown={handleConditionKeyDown}
              placeholder={t('settings.conditions_placeholder')}
              className="flex-1 px-4 py-2.5 rounded-xl bg-white/[0.04] border border-white/[0.08] text-white text-sm placeholder-slate-500 focus:outline-none focus:border-emerald-500/50 focus:ring-1 focus:ring-emerald-500/30 transition"
            />
            <button
              onClick={() => addCondition(conditionInput)}
              disabled={!conditionInput.trim()}
              className="px-4 py-2.5 rounded-xl bg-emerald-500/15 text-emerald-300 text-sm font-medium hover:bg-emerald-500/25 disabled:opacity-40 disabled:cursor-not-allowed transition"
            >
              +
            </button>
          </div>

          {/* Suggestions */}
          <div className="flex flex-wrap gap-2">
            {CONDITION_KEYS.filter((c) => !conditions.includes(c.value)).map((c) => (
              <button
                key={c.value}
                onClick={() => addCondition(c.value)}
                className="px-3 py-1.5 rounded-lg bg-white/[0.03] border border-white/[0.06] text-slate-500 text-[12px] hover:text-slate-300 hover:border-white/[0.12] transition"
              >
                + {t(`settings.condition_${c.key}`)}
              </button>
            ))}
          </div>
        </section>

        {/* Membership Section — simplified, links to /membership for full management */}
        <section className="rounded-2xl bg-white/[0.03] border border-white/[0.06] p-6">
          <div className="flex items-center gap-2 mb-5">
            <span className="text-slate-400"><CrownIcon /></span>
            <h2 className="text-base font-semibold text-white">{t('billing.membership')}</h2>
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className={`px-3 py-1 rounded-full text-[12px] font-medium ${
                isPro ? 'bg-amber-500/15 text-amber-400' : 'bg-slate-500/15 text-slate-400'
              }`}>
                {isPro ? 'Pro' : t('settings.free_badge')}
              </div>
              <div>
                <p className="text-sm font-medium text-white">
                  {isPro ? 'Pro' : t('settings.plan_free')}
                </p>
                {subscription?.status === 'trialing' && (
                  <span className="text-[11px] text-emerald-400">{t('billing.trial_active')}</span>
                )}
                {isPro && subscription?.current_period_end && (
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    {subscription.auto_renew ? t('billing.renews_on') : t('billing.cancels_on')}: {new Date(subscription.current_period_end).toLocaleDateString()}
                  </p>
                )}
              </div>
            </div>

            <Link
              to="/membership"
              className="px-4 py-2 rounded-xl bg-emerald-500/10 text-emerald-300 text-[13px] font-medium hover:bg-emerald-500/20 transition flex items-center gap-1.5"
            >
              {t('billing.manage_membership')}
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M9 18l6-6-6-6" />
              </svg>
            </Link>
          </div>

          {!isPro && (
            <p className="text-[12px] text-slate-500 mt-3">{t('billing.manage_membership_desc')}</p>
          )}
        </section>

        {/* Save Button */}
        <div className="flex items-center gap-4 pt-2 pb-8">
          <button
            onClick={handleSave}
            disabled={saving}
            className="px-8 py-3 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 text-white text-sm font-semibold hover:shadow-lg hover:shadow-emerald-500/20 disabled:opacity-60 disabled:cursor-not-allowed transition-all"
          >
            {saving ? t('settings.saving') : t('settings.save')}
          </button>
          {saveMessage && (
            <p className={`text-sm font-medium ${
              saveMessage.type === 'success' ? 'text-emerald-400' : 'text-red-400'
            }`}>
              {saveMessage.text}
            </p>
          )}
        </div>
      </div>
    </div>
  )
}
