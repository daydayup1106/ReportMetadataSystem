import { useState, useEffect, useCallback } from 'react'
import { Trans, useTranslation } from 'react-i18next'
import { Link } from 'react-router-dom'
import { QRCodeSVG } from 'qrcode.react'
import { useBillingStore } from '@/stores/billingStore'

interface PricingModalProps {
  isOpen: boolean
  onClose: () => void
  context?: string
}

type Cycle = 'monthly' | 'quarterly' | 'yearly'

export default function PricingModal({ isOpen, onClose, context }: PricingModalProps) {
  const { t } = useTranslation()
  const {
    subscription, pricing, isPro, currentOrder, orderPolling,
    fetchPricing, createOrder, pollOrderStatus, claimTrial, clearOrder,
  } = useBillingStore()

  const [cycle, setCycle] = useState<Cycle>('monthly')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [paymentResult, setPaymentResult] = useState<string | null>(null)
  const [agreementAccepted, setAgreementAccepted] = useState(false)

  useEffect(() => {
    if (isOpen && !pricing) {
      void fetchPricing()
    }
  }, [isOpen, pricing, fetchPricing])

  // Reset state when modal opens
  useEffect(() => {
    if (isOpen) {
      setError(null)
      setPaymentResult(null)
      setAgreementAccepted(false)
      clearOrder()
    }
  }, [isOpen, clearOrder])

  const handleClaimTrial = async () => {
    setLoading(true)
    setError(null)
    try {
      await claimTrial(agreementAccepted)
      onClose()
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

      // For Alipay/Stripe: redirect to payment URL
      if (order.payment_url) {
        window.open(order.payment_url, '_blank')
      }

      // Start polling
      const result = await pollOrderStatus(order.order_id)
      setPaymentResult(result.status)
      if (result.status === 'paid') {
        setTimeout(onClose, 2000)
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

  const getCycleLabel = useCallback((c: Cycle) => {
    return t(`billing.cycle_${c}`)
  }, [t])

  if (!isOpen) return null

  const showTrialCTA = subscription && !subscription.trial_claimed && !subscription.trial_claim_expired && !isPro
  const isRenewal = isPro && subscription?.status === 'active'

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />

      {/* Modal */}
      <div className="relative w-full max-w-lg rounded-2xl bg-slate-900 border border-white/[0.08] shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="p-6 pb-4 bg-gradient-to-r from-amber-500/10 to-emerald-500/10 border-b border-white/[0.06]">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-bold text-white">{t('billing.pricing_title')}</h2>
              {context && (
                <p className="text-[13px] text-slate-400 mt-1">{context}</p>
              )}
            </div>
            <button onClick={onClose} className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-white/[0.06] transition">
              <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
                <path d="M4 4l10 10M14 4L4 14" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
              </svg>
            </button>
          </div>
        </div>

        <div className="p-6 space-y-5 max-h-[70vh] overflow-y-auto">
          {/* Agreement Consent Checkbox */}
          <div>
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
                    service: <Link to="/billing/service-agreement" onClick={onClose} className="text-emerald-400/80 hover:text-emerald-300 underline underline-offset-2" />,
                    autoRenewal: <Link to="/billing/auto-renewal-agreement" onClick={onClose} className="text-emerald-400/80 hover:text-emerald-300 underline underline-offset-2" />,
                    privacy: <Link to="/billing/privacy-policy" onClick={onClose} className="text-emerald-400/80 hover:text-emerald-300 underline underline-offset-2" />,
                  }}
                />
              </span>
            </label>
          </div>

          {/* Trial CTA */}
          {showTrialCTA && (
            <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20">
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

          {subscription && !subscription.trial_claimed && subscription.trial_claim_expired && (
            <div className="p-3 rounded-xl bg-slate-800/50 border border-white/[0.06]">
              <p className="text-[13px] text-slate-500">{t('billing.trial_expired')}</p>
            </div>
          )}

          {/* Cycle Toggle */}
          <div className="flex gap-1 p-1 rounded-xl bg-white/[0.03] border border-white/[0.06]">
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

          {/* Price Display */}
          <div className="text-center py-3">
            <span className="text-3xl font-bold text-white">{getPrice()}</span>
            <span className="text-sm text-slate-400 ml-1">/ {getCycleLabel(cycle)}</span>
          </div>

          {/* Feature comparison */}
          <div className="space-y-2">
            {[
              'unlimited_chat', 'voice_input_output', 'unlimited_reports',
              'family_members', 'full_history', 'all_trends',
            ].map((feat) => (
              <div key={feat} className="flex items-center gap-2 text-[13px]">
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none" className="text-emerald-400 shrink-0">
                  <path d="M3.5 8.5l3 3 6-6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
                <span className="text-slate-300">{t(`billing.feature_${feat}`)}</span>
              </div>
            ))}
          </div>

          {/* Payment Result */}
          {paymentResult === 'paid' && (
            <div className="p-4 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-center">
              <p className="text-emerald-300 font-semibold">{t('billing.payment_success')}</p>
            </div>
          )}

          {paymentResult === 'failed' && (
            <div className="p-4 rounded-xl bg-red-500/15 border border-red-500/30 text-center">
              <p className="text-red-300 font-semibold">{t('billing.payment_declined')}</p>
            </div>
          )}

          {paymentResult === 'timeout' && (
            <div className="p-4 rounded-xl bg-amber-500/15 border border-amber-500/30 text-center">
              <p className="text-amber-300 text-sm">{t('billing.payment_timeout')}</p>
            </div>
          )}

          {error && (
            <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/20">
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

          {/* Payment Buttons */}
          {!orderPolling && !paymentResult && pricing && (
            <div className="space-y-2">
              {pricing.providers.includes('alipay') && (
                <button
                  onClick={() => handleSubscribe('alipay')}
                  disabled={loading || !agreementAccepted}
                  className="w-full py-3 rounded-xl bg-[#1677FF] text-white text-sm font-semibold hover:bg-[#1677FF]/90 disabled:opacity-50 transition flex items-center justify-center gap-2"
                >
                  {t('billing.pay_with_alipay')}
                </button>
              )}
              {pricing.providers.includes('wechat') && (
                <button
                  onClick={() => handleSubscribe('wechat')}
                  disabled={loading || !agreementAccepted}
                  className="w-full py-3 rounded-xl bg-[#07C160] text-white text-sm font-semibold hover:bg-[#07C160]/90 disabled:opacity-50 transition flex items-center justify-center gap-2"
                >
                  {t('billing.pay_with_wechat')}
                </button>
              )}
              {pricing.providers.includes('stripe') && (
                <button
                  onClick={() => handleSubscribe('stripe')}
                  disabled={loading || !agreementAccepted}
                  className="w-full py-3 rounded-xl bg-[#635BFF] text-white text-sm font-semibold hover:bg-[#635BFF]/90 disabled:opacity-50 transition flex items-center justify-center gap-2"
                >
                  {isRenewal ? t('billing.renew_with_stripe') : t('billing.pay_with_stripe')}
                </button>
              )}
              {!agreementAccepted && (
                <p className="text-[11px] text-slate-500 text-center mt-1">{t('billing.consent_required')}</p>
              )}
            </div>
          )}

          {/* Privacy policy link */}
          <p className="text-center text-[11px] text-slate-500 mt-2">
            {t('privacy.agree_text')}{' '}
            <Link
              to="/billing/privacy-policy"
              onClick={onClose}
              className="text-emerald-400/70 hover:text-emerald-300 underline underline-offset-2"
            >
              {t('privacy.policy_link')}
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}
