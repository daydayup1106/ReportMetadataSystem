import { useState, useEffect, useCallback } from 'react'
import { Trans, useTranslation } from 'react-i18next'
import { Link, useNavigate } from 'react-router-dom'
import { QRCodeSVG } from 'qrcode.react'
import { useBillingStore } from '@/stores/billingStore'

type Cycle = 'monthly' | 'quarterly' | 'yearly'

export default function PricingPage() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const {
    subscription, pricing, isPro, currentOrder, orderPolling, quota,
    fetchPricing, fetchStatus, createOrder, pollOrderStatus, claimTrial, clearOrder,
    // TODO: uncomment when Alipay agreement signing is implemented
    // toggleAutoRenew,
    cancelSubscription,
  } = useBillingStore()

  const [cycle, setCycle] = useState<Cycle>('monthly')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [paymentResult, setPaymentResult] = useState<string | null>(null)
  const [showCancelConfirm, setShowCancelConfirm] = useState(false)
  // TODO: uncomment when Alipay agreement signing is implemented
  // const [autoRenewLoading, setAutoRenewLoading] = useState(false)
  // const [autoRenewError, setAutoRenewError] = useState<string | null>(null)
  const [agreementAccepted, setAgreementAccepted] = useState(false)

  useEffect(() => {
    if (!pricing) void fetchPricing()
  }, [pricing, fetchPricing])

  useEffect(() => {
    clearOrder()
  }, [clearOrder])

  const handleClaimTrial = async () => {
    setLoading(true)
    setError(null)
    try {
      await claimTrial(agreementAccepted)
      await fetchStatus()
      navigate('/membership')
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { error?: { message?: string } } } })
        ?.response?.data?.error?.message || t('billing.trial_claim_failed')
      setError(msg)
    } finally {
      setLoading(false)
    }
  }

  const handleSubscribe = async (provider: string) => {
    setLoading(true)
    setError(null)
    setPaymentResult(null)
    try {
      const order = await createOrder(provider, cycle, undefined, agreementAccepted)
      if (order.payment_url) {
        window.open(order.payment_url, '_blank')
      }
      const result = await pollOrderStatus(order.order_id)
      setPaymentResult(result.status)
      if (result.status === 'paid') {
        await fetchStatus()
        setTimeout(() => navigate('/membership'), 2000)
      }
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { error?: { message?: string } } } })
        ?.response?.data?.error?.message || t('billing.payment_failed')
      setError(msg)
    } finally {
      setLoading(false)
    }
  }

  const formatPrice = useCallback((cents: number, currency: string) => {
    if (currency === 'CNY') return `¥${(cents / 100).toFixed(0)}`
    return `$${(cents / 100).toFixed(2)}`
  }, [])

  const getPrice = useCallback(() => {
    if (!pricing) return ''
    const map = { monthly: pricing.monthly_price, quarterly: pricing.quarterly_price, yearly: pricing.yearly_price }
    return formatPrice(map[cycle], pricing.currency)
  }, [pricing, cycle, formatPrice])

  const getCycleLabel = useCallback((c: Cycle) => t(`billing.cycle_${c}`), [t])

  const showTrialCTA = subscription && !subscription.trial_claimed && !subscription.trial_claim_expired && !isPro

  const freeFeatures = [
    { key: 'chat_daily', free: t('billing.free_chat_limit'), pro: t('billing.feature_unlimited_chat') },
    { key: 'voice', free: t('billing.free_voice_limit'), pro: t('billing.feature_voice_input_output') },
    { key: 'reports', free: t('billing.free_report_limit'), pro: t('billing.feature_unlimited_reports') },
    { key: 'family', free: t('billing.free_member_limit'), pro: t('billing.feature_family_members') },
    { key: 'history', free: t('billing.free_history_limit'), pro: t('billing.feature_full_history') },
    { key: 'trends', free: t('billing.free_trend_limit'), pro: t('billing.feature_all_trends') },
  ]

  return (
    <main className="flex-1 p-4 md:p-8 max-w-5xl mx-auto w-full">
      {/* Header */}
      <div className="text-center mb-8">
        <h1 className="text-2xl md:text-3xl font-bold text-white mb-2">
          {isPro ? t('nav.membership') : t('billing.pricing_title')}
        </h1>
        <p className="text-slate-400 text-sm">
          {isPro ? t('billing.manage_membership_desc') : t('billing.pricing_subtitle')}
        </p>
      </div>

      {/* Membership Status Card — Pro users only */}
      {isPro && subscription && (
        <div className="rounded-2xl bg-gradient-to-br from-emerald-500/10 to-amber-500/5 border border-emerald-500/20 p-6 mb-8">
          <div className="flex items-center justify-between mb-5">
            <div>
              <h2 className="text-lg font-bold text-white">{t('billing.your_plan')}</h2>
              <p className="text-[13px] text-slate-400 mt-0.5">
                {t('billing.current_cycle', { cycle: getCycleLabel(subscription.billing_cycle as Cycle || 'monthly') })}
              </p>
            </div>
            <div className="px-3 py-1 rounded-full text-[12px] font-bold bg-amber-500/15 text-amber-400 uppercase">
              Pro
            </div>
          </div>

          {/* Period info */}
          {subscription.current_period_end && (
            <div className="p-3 rounded-xl bg-white/[0.03] border border-white/[0.06] mb-4">
              <p className="text-[13px] text-slate-400">
                {/* TODO: restore auto_renew check when Alipay agreement signing is implemented */}
                {t('billing.valid_until')}:{' '}
                <span className="text-white font-medium">
                  {new Date(subscription.current_period_end).toLocaleDateString()}
                </span>
              </p>
            </div>
          )}

          {/* Quota usage */}
          {quota && (quota.chat_daily || quota.report_monthly) && (
            <div className="pt-3 border-t border-white/[0.06] space-y-3">
              {[
                { key: 'chat_quota', q: quota.chat_daily },
                { key: 'report_quota', q: quota.report_monthly },
              ].map(({ key, q }) => q && (
                <div key={key}>
                  <div className="flex justify-between text-[12px] mb-1">
                    <span className="text-slate-500">{t(`billing.${key}`)}</span>
                    <span className="text-slate-400">{q.current} / {q.limit === null ? '∞' : q.limit}</span>
                  </div>
                  {q.limit !== null && (
                    <div className="h-1.5 rounded-full bg-white/[0.06]">
                      <div className="h-full rounded-full bg-emerald-500 transition-all" style={{ width: `${Math.min(100, (q.current / q.limit) * 100)}%` }} />
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}

          {/* TODO: uncomment cancel subscription when ready */}
          {false && (
          <div className="pt-3 mt-3 space-y-3">
            {subscription.status === 'active' && !showCancelConfirm && (
              <button
                onClick={() => setShowCancelConfirm(true)}
                className="text-[12px] text-slate-500 hover:text-red-400 transition"
              >
                {t('billing.cancel_subscription')}
              </button>
            )}
            {showCancelConfirm && (
              <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/20">
                <p className="text-[13px] text-red-300 mb-3">{t('billing.cancel_confirm')}</p>
                <div className="flex gap-2">
                  <button
                    onClick={async () => { await cancelSubscription(); setShowCancelConfirm(false) }}
                    className="px-4 py-1.5 rounded-lg bg-red-500/20 text-red-300 text-[12px] font-medium hover:bg-red-500/30 transition"
                  >
                    {t('billing.confirm_cancel')}
                  </button>
                  <button
                    onClick={() => setShowCancelConfirm(false)}
                    className="px-4 py-1.5 rounded-lg bg-white/[0.06] text-slate-400 text-[12px] font-medium hover:bg-white/[0.1] transition"
                  >
                    {t('billing.keep_subscription')}
                  </button>
                </div>
              </div>
            )}
          </div>
          )}
        </div>
      )}

      {/* Plan heading for cycle change */}
      {isPro && (
        <div className="text-center mb-4">
          <p className="text-sm text-slate-400">{t('billing.change_cycle_hint')}</p>
        </div>
      )}

      <div className="grid md:grid-cols-2 gap-6 mb-8">
        {/* Free Plan Card */}
        <div className="rounded-2xl bg-slate-900/60 border border-white/[0.06] p-6">
          <h2 className="text-lg font-bold text-white mb-1">Free</h2>
          <p className="text-slate-400 text-sm mb-4">{t('billing.free_plan_desc')}</p>
          <div className="text-3xl font-bold text-white mb-6">
            {pricing?.currency === 'CNY' ? '¥0' : '$0'}
            <span className="text-sm text-slate-400 font-normal ml-1">/ {t('billing.forever')}</span>
          </div>
          <ul className="space-y-3">
            {freeFeatures.map((f) => (
              <li key={f.key} className="flex items-center gap-2 text-[13px] text-slate-400">
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none" className="text-slate-500 shrink-0">
                  <path d="M3.5 8.5l3 3 6-6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
                {f.free}
              </li>
            ))}
          </ul>
        </div>

        {/* Pro Plan Card */}
        <div className="rounded-2xl bg-gradient-to-br from-emerald-500/10 to-amber-500/5 border border-emerald-500/20 p-6 relative overflow-hidden">
          <div className="absolute top-3 right-3 bg-emerald-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full uppercase">Pro</div>
          <h2 className="text-lg font-bold text-white mb-1">Pro</h2>
          <p className="text-slate-400 text-sm mb-4">{t('billing.pro_plan_desc')}</p>

          {/* Cycle Toggle */}
          <div className="flex gap-1 p-1 rounded-xl bg-white/[0.03] border border-white/[0.06] mb-4">
            {(['monthly', 'quarterly', 'yearly'] as Cycle[]).map((c) => (
              <button
                key={c}
                onClick={() => setCycle(c)}
                className={`flex-1 py-2 rounded-lg text-[13px] font-medium transition ${
                  cycle === c
                    ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                    : 'text-slate-400 hover:text-slate-300'
                }`}
              >
                {getCycleLabel(c)}
                {c === 'quarterly' && pricing && (
                  <span className="ml-1 text-[10px] text-amber-400">-{pricing.quarterly_discount_pct}%</span>
                )}
                {c === 'yearly' && pricing && (
                  <span className="ml-1 text-[10px] text-amber-400">-{pricing.yearly_discount_pct}%</span>
                )}
              </button>
            ))}
          </div>

          <div className="text-3xl font-bold text-white mb-6">
            {getPrice()}
            <span className="text-sm text-slate-400 font-normal ml-1">/ {getCycleLabel(cycle)}</span>
          </div>

          <ul className="space-y-3 mb-6">
            {freeFeatures.map((f) => (
              <li key={f.key} className="flex items-center gap-2 text-[13px] text-emerald-300">
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none" className="text-emerald-400 shrink-0">
                  <path d="M3.5 8.5l3 3 6-6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
                {f.pro}
              </li>
            ))}
          </ul>

          {/* Agreement Consent Checkbox */}
          {!isPro && (
            <div className="mb-4">
              <label className="flex items-start gap-2.5 cursor-pointer group">
                <input
                  type="checkbox"
                  checked={agreementAccepted}
                  onChange={(e) => setAgreementAccepted(e.target.checked)}
                  className="mt-0.5 w-4 h-4 rounded border-slate-500 bg-transparent text-emerald-500 focus:ring-emerald-500/30 shrink-0"
                />
                <span className="text-[12px] text-slate-400 leading-relaxed group-hover:text-slate-300 transition">
                  <Trans
                    i18nKey="billing.consent_label"
                    components={{
                      service: <Link to="/billing/service-agreement" className="text-emerald-400/80 hover:text-emerald-300 underline underline-offset-2" />,
                      autoRenewal: <Link to="/billing/auto-renewal-agreement" className="text-emerald-400/80 hover:text-emerald-300 underline underline-offset-2" />,
                      privacy: <Link to="/billing/privacy-policy" className="text-emerald-400/80 hover:text-emerald-300 underline underline-offset-2" />,
                    }}
                  />
                </span>
              </label>
            </div>
          )}

          {/* Trial CTA */}
          {showTrialCTA && (
            <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20 mb-4">
              <p className="text-sm font-semibold text-emerald-300 mb-1">{t('billing.trial_title')}</p>
              <p className="text-[13px] text-slate-400 mb-3">{t('billing.trial_desc')}</p>
              <button
                onClick={handleClaimTrial}
                disabled={loading || !agreementAccepted}
                className="w-full py-2.5 rounded-xl bg-emerald-500 text-white text-sm font-semibold hover:bg-emerald-600 disabled:opacity-50 transition"
              >
                {loading ? t('common.loading') : t('billing.claim_trial')}
              </button>
              {!agreementAccepted && (
                <p className="text-[11px] text-slate-500 mt-2 text-center">{t('billing.consent_required')}</p>
              )}
            </div>
          )}

          {/* Expired trial hint */}
          {subscription && subscription.trial_claimed && !isPro && (
            <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 mb-4">
              <p className="text-[13px] text-amber-300">{t('billing.expired_hint')}</p>
            </div>
          )}

          {/* Payment Result */}
          {paymentResult === 'paid' && (
            <div className="p-4 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-center mb-4">
              <p className="text-emerald-300 font-semibold">{t('billing.payment_success')}</p>
            </div>
          )}
          {paymentResult === 'failed' && (
            <div className="p-4 rounded-xl bg-red-500/15 border border-red-500/30 text-center mb-4">
              <p className="text-red-300 font-semibold">{t('billing.payment_declined')}</p>
            </div>
          )}
          {paymentResult === 'timeout' && (
            <div className="p-4 rounded-xl bg-amber-500/15 border border-amber-500/30 text-center mb-4">
              <p className="text-amber-300 text-sm">{t('billing.payment_timeout')}</p>
            </div>
          )}

          {error && (
            <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/20 mb-4">
              <p className="text-red-400 text-[13px]">{error}</p>
            </div>
          )}

          {/* WeChat QR Code */}
          {currentOrder?.code_url && orderPolling && (
            <div className="flex flex-col items-center gap-3 py-4">
              <div data-testid="qrcode" className="p-4 bg-white rounded-xl">
                <QRCodeSVG value={currentOrder.code_url} size={200} />
              </div>
              <p className="text-[13px] text-slate-400">{t('billing.scan_qr')}</p>
              <div className="flex items-center gap-2 text-emerald-400">
                <svg className="animate-spin" width="16" height="16" viewBox="0 0 16 16" fill="none">
                  <circle cx="8" cy="8" r="6" stroke="currentColor" strokeWidth="2" strokeDasharray="28 10" />
                </svg>
                <span className="text-[13px]">{t('billing.waiting_payment')}</span>
              </div>
            </div>
          )}

          {/* Polling spinner (non-QR) */}
          {orderPolling && !currentOrder?.code_url && (
            <div className="flex items-center justify-center gap-2 py-4 text-emerald-400">
              <svg className="animate-spin" width="16" height="16" viewBox="0 0 16 16" fill="none">
                <circle cx="8" cy="8" r="6" stroke="currentColor" strokeWidth="2" strokeDasharray="28 10" />
              </svg>
              <span className="text-[13px]">{t('billing.waiting_payment')}</span>
            </div>
          )}

          {/* Agreement Consent Checkbox — Pro users (for renewal/cycle change) */}
          {isPro && (
            <div className="mb-4">
              <label className="flex items-start gap-2.5 cursor-pointer group">
                <input
                  type="checkbox"
                  checked={agreementAccepted}
                  onChange={(e) => setAgreementAccepted(e.target.checked)}
                  className="mt-0.5 w-4 h-4 rounded border-slate-500 bg-transparent text-emerald-500 focus:ring-emerald-500/30 shrink-0"
                />
                <span className="text-[12px] text-slate-400 leading-relaxed group-hover:text-slate-300 transition">
                  <Trans
                    i18nKey="billing.consent_label"
                    components={{
                      service: <Link to="/billing/service-agreement" className="text-emerald-400/80 hover:text-emerald-300 underline underline-offset-2" />,
                      autoRenewal: <Link to="/billing/auto-renewal-agreement" className="text-emerald-400/80 hover:text-emerald-300 underline underline-offset-2" />,
                      privacy: <Link to="/billing/privacy-policy" className="text-emerald-400/80 hover:text-emerald-300 underline underline-offset-2" />,
                    }}
                  />
                </span>
              </label>
            </div>
          )}

          {/* Payment Buttons — show for non-Pro, or Pro users (renewal or cycle change) */}
          {!orderPolling && !paymentResult && pricing && (
            <div className="space-y-2">
              {isPro && (
                <div className="p-3 rounded-xl bg-white/[0.03] border border-white/[0.06] mb-2">
                  <p className="text-[13px] text-slate-400">
                    {t('billing.current_cycle', { cycle: getCycleLabel(subscription?.billing_cycle as Cycle || 'monthly') })}
                  </p>
                  <p className="text-[12px] text-slate-500 mt-1">
                    {cycle === subscription?.billing_cycle ? t('billing.renew_hint') : t('billing.change_cycle_hint')}
                  </p>
                </div>
              )}
              {pricing.providers.includes('alipay') && (
                <button
                  onClick={() => handleSubscribe('alipay')}
                  disabled={loading || !agreementAccepted}
                  className="w-full py-3 rounded-xl bg-[#1677FF] text-white text-sm font-semibold hover:bg-[#1677FF]/90 disabled:opacity-50 transition"
                >
                  {isPro
                    ? (cycle === subscription?.billing_cycle
                        ? t('billing.renew_btn', { cycle: getCycleLabel(cycle) })
                        : t('billing.change_cycle_btn', { cycle: getCycleLabel(cycle) }))
                    : t('billing.pay_with_alipay')}
                </button>
              )}
              {pricing.providers.includes('wechat') && (
                <button
                  onClick={() => handleSubscribe('wechat')}
                  disabled={loading || !agreementAccepted}
                  className="w-full py-3 rounded-xl bg-[#07C160] text-white text-sm font-semibold hover:bg-[#07C160]/90 disabled:opacity-50 transition"
                >
                  {isPro
                    ? (cycle === subscription?.billing_cycle
                        ? t('billing.renew_btn', { cycle: getCycleLabel(cycle) })
                        : t('billing.change_cycle_btn', { cycle: getCycleLabel(cycle) }))
                    : t('billing.pay_with_wechat')}
                </button>
              )}
              {pricing.providers.includes('stripe') && (
                <button
                  onClick={() => handleSubscribe('stripe')}
                  disabled={loading || !agreementAccepted}
                  className="w-full py-3 rounded-xl bg-[#635BFF] text-white text-sm font-semibold hover:bg-[#635BFF]/90 disabled:opacity-50 transition"
                >
                  {isPro
                    ? (cycle === subscription?.billing_cycle
                        ? t('billing.renew_btn', { cycle: getCycleLabel(cycle) })
                        : t('billing.change_cycle_btn', { cycle: getCycleLabel(cycle) }))
                    : t('billing.pay_with_stripe')}
                </button>
              )}
              {!agreementAccepted && (
                <p className="text-[11px] text-slate-500 text-center mt-1">{t('billing.consent_required')}</p>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Privacy policy link */}
      <p className="text-center text-[11px] text-slate-500">
        {t('privacy.agree_text')}{' '}
        <Link
          to="/billing/privacy-policy"
          className="text-emerald-400/70 hover:text-emerald-300 underline underline-offset-2"
        >
          {t('privacy.policy_link')}
        </Link>
      </p>
    </main>
  )
}
